import { createGmailRegistrationCodeSender } from '../modules/auth/email-verification/gmail-registration-code-sender';

async function main() {
  const [email, ...extra] = process.argv.slice(2);
  if (!email || extra.length > 0) {
    throw new Error(
      'Indica un solo correo destinatario con npm run gmail:send-test -- <correo>.',
    );
  }

  const sender = createGmailRegistrationCodeSender((key) => process.env[key]);
  if (!sender)
    throw new Error(
      'Autoriza Gmail y revisa la configuración local del remitente.',
    );

  await sender.sendTest(email);
  console.log(
    'Gmail aceptó el correo de prueba. Revisa la bandeja de entrada o spam.',
  );
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : 'No se pudo completar la prueba.',
  );
  process.exitCode = 1;
});
