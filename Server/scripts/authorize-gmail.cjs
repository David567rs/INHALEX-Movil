const { createHash, randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { lstat, readFile, writeFile } = require('node:fs/promises');
const { createServer } = require('node:http');
const { resolve } = require('node:path');

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send';
const OUTPUT_PATH = resolve(__dirname, '..', '.env.gmail.local');
const WAIT_MS = 5 * 60_000;

class SetupError extends Error {}

function safeCredential(value) {
  return (
    typeof value === 'string' && /^[A-Za-z0-9._~+/=-]{1,8192}$/.test(value)
  );
}

async function loadDesktopClient(credentialsPath) {
  let installed;
  try {
    const contents = await readFile(credentialsPath, 'utf8');
    installed = JSON.parse(contents.replace(/^\uFEFF/, '')).installed;
  } catch {
    throw new SetupError(
      'No se pudo leer el JSON del cliente OAuth. Revisa la ruta y el archivo.',
    );
  }

  if (
    !installed ||
    !safeCredential(installed.client_id) ||
    !installed.client_id.endsWith('.apps.googleusercontent.com') ||
    !safeCredential(installed.client_secret)
  ) {
    throw new SetupError(
      'Descarga el JSON de un cliente OAuth de tipo Aplicación de escritorio.',
    );
  }
  return { id: installed.client_id, secret: installed.client_secret };
}

async function assertOutputAvailable() {
  try {
    await lstat(OUTPUT_PATH);
  } catch (error) {
    if (error.code === 'ENOENT') return;
    throw new SetupError(
      'No se pudo comprobar el archivo local de configuración.',
    );
  }
  throw new SetupError(
    'Ya existe Server/.env.gmail.local. Guárdalo en un lugar privado antes de repetir la autorización.',
  );
}

function respond(response, status, message, done) {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'text/plain; charset=utf-8',
    'Referrer-Policy': 'no-referrer',
    Connection: 'close',
  });
  response.end(message, done);
}

async function authorize(clientId, sender, verifier) {
  const state = randomBytes(32).toString('base64url');
  const server = createServer({ headersTimeout: 5_000, requestTimeout: 5_000 });
  let timer;
  try {
    const listening = once(server, 'listening');
    server.listen(0, '127.0.0.1');
    await listening;

    const redirect = new URL(`http://127.0.0.1:${server.address().port}`);
    const authorizationUrl = new URL(AUTH_ENDPOINT);
    authorizationUrl.search = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect.origin,
      response_type: 'code',
      scope: SEND_SCOPE,
      access_type: 'offline',
      prompt: 'consent',
      login_hint: sender,
      state,
      code_challenge: createHash('sha256').update(verifier).digest('base64url'),
      code_challenge_method: 'S256',
    }).toString();

    const code = await new Promise((accept, reject) => {
      let handled = false;
      timer = setTimeout(() => {
        reject(
          new SetupError(
            'Pasaron cinco minutos sin respuesta. Vuelve a ejecutar el comando.',
          ),
        );
      }, WAIT_MS);

      server.on('request', (request, response) => {
        let callback;
        try {
          callback = new URL(request.url, redirect.origin);
        } catch {
          return respond(response, 400, 'Solicitud inválida.');
        }
        if (
          request.method !== 'GET' ||
          request.headers.host !== redirect.host ||
          callback.origin !== redirect.origin ||
          callback.pathname !== redirect.pathname
        ) {
          return respond(response, 404, 'Ruta no disponible.');
        }
        if (handled || callback.searchParams.get('state') !== state) {
          return respond(
            response,
            400,
            'Esta respuesta no corresponde a la autorización abierta.',
          );
        }

        handled = true;
        const authorizationCode = callback.searchParams.get('code');
        if (callback.searchParams.has('error') || !authorizationCode) {
          return respond(
            response,
            400,
            'La autorización no se completó. Revisa la terminal.',
            () => {
              reject(
                new SetupError(
                  'Google no concedió el permiso. Verifica la cuenta de prueba y el consentimiento.',
                ),
              );
            },
          );
        }
        respond(
          response,
          200,
          'Google devolvió la autorización. Revisa la terminal para ver el resultado.',
          () => {
            accept(authorizationCode);
          },
        );
      });

      console.log(
        'Abre esta URL en un navegador de esta computadora y autoriza el Gmail de contacto:',
      );
      console.log(authorizationUrl.href);
    });

    return { code, redirectUri: redirect.origin };
  } finally {
    clearTimeout(timer);
    if (server.listening) server.close();
    server.closeAllConnections();
  }
}

async function exchangeCode(client, authorization, verifier) {
  let response;
  try {
    response = await fetch(TOKEN_ENDPOINT, {
      method: 'POST',
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: client.id,
        client_secret: client.secret,
        code: authorization.code,
        code_verifier: verifier,
        redirect_uri: authorization.redirectUri,
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    throw new SetupError(
      'No se pudo conectar con Google para completar la autorización.',
    );
  }

  if (!response.ok) {
    throw new SetupError(
      `Google rechazó el intercambio de autorización (HTTP ${response.status}).`,
    );
  }
  const result = await response.json().catch(() => null);
  if (
    !safeCredential(result?.refresh_token) ||
    typeof result.scope !== 'string' ||
    result.scope.trim() !== SEND_SCOPE
  ) {
    throw new SetupError(
      'Google no devolvió un permiso de envío renovable. Repite la autorización y concede el permiso de envío.',
    );
  }
  return result.refresh_token;
}

async function main() {
  const [credentialsPath, sender, ...extra] = process.argv.slice(2);
  if (!credentialsPath || !sender || extra.length) {
    throw new SetupError(
      'Uso: node scripts/authorize-gmail.cjs <ruta-al-json> <correo-remitente>',
    );
  }
  if (
    sender.length > 254 ||
    !/^[A-Za-z0-9._+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(sender)
  ) {
    throw new SetupError(
      'Escribe una dirección de correo válida para el remitente.',
    );
  }

  await assertOutputAvailable();
  const client = await loadDesktopClient(credentialsPath);
  const verifier = randomBytes(48).toString('base64url');
  const authorization = await authorize(client.id, sender, verifier);
  const refreshToken = await exchangeCode(client, authorization, verifier);
  const config = [
    'REGISTRATION_EMAIL_PROVIDER=gmail',
    `GMAIL_OAUTH_CLIENT_ID="${client.id}"`,
    `GMAIL_OAUTH_CLIENT_SECRET="${client.secret}"`,
    `GMAIL_OAUTH_REFRESH_TOKEN="${refreshToken}"`,
    `GMAIL_FROM_EMAIL="${sender}"`,
    `EMAIL_VERIFICATION_SECRET=${randomBytes(32).toString('hex')}`,
    '',
  ].join('\n');

  try {
    await writeFile(OUTPUT_PATH, config, { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw new SetupError(
        'Ya existe Server/.env.gmail.local. Conservé ese archivo.',
      );
    }
    throw new SetupError(
      'No se pudo guardar la configuración de Gmail en Server/.env.gmail.local.',
    );
  }
  console.log(`Autorización guardada en ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(
    error instanceof SetupError
      ? error.message
      : 'No se pudo completar la autorización local de Gmail.',
  );
  process.exitCode = 1;
});
