const http = require('node:http');

let port = 3200;
let host = '0.0.0.0';
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 2) {
  const value = args[index + 1];
  if (!value || (args[index] !== '--port' && args[index] !== '--host')) {
    console.error('Uso: npm run qa:catalog:empty -- [--port 3200] [--host 0.0.0.0]');
    process.exit(1);
  }
  if (args[index] === '--port') port = Number(value);
  else host = value;
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('El puerto debe ser un entero entre 1 y 65535.');
  process.exit(1);
}

function json(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    ...(status === 405 ? { Allow: 'GET' } : {}),
  });
  response.end(JSON.stringify(body));
}

const timers = new Set();
const server = http.createServer((request, response) => {
  if (request.method !== 'GET') return json(response, 405, { message: 'Solo se permite GET.' });
  let url;
  try { url = new URL(request.url, 'http://localhost'); }
  catch { return json(response, 400, { message: 'La solicitud no es válida.' }); }
  if (url.pathname !== '/api/products') {
    return json(response, 503, { message: 'Este servidor temporal solo simula el catálogo vacío.' });
  }

  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100
    || url.searchParams.getAll('page').length > 1 || url.searchParams.getAll('limit').length > 1) {
    return json(response, 400, { message: 'Usa page entero mayor o igual a 1 y limit entero entre 1 y 100.' });
  }

  const timer = setTimeout(() => {
    timers.delete(timer);
    json(response, 200, { items: [], total: 0, page, limit, totalPages: 1 });
  }, 1500);
  timers.add(timer);
  response.once('close', () => { clearTimeout(timer); timers.delete(timer); });
});

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE'
    ? `El puerto ${port} está ocupado. Detén el backend con Ctrl+C en su terminal y vuelve a ejecutar este comando. No se detuvo ningún proceso.`
    : 'No se pudo abrir el servidor temporal. Revisa el host y el puerto.');
  process.exitCode = 1;
});
server.listen(port, host, () => {
  console.log('TEMPORAL: CATÁLOGO VACÍO. No consulta ni modifica datos reales.');
  console.log(`Escuchando en ${host}:${port}. Única ruta: GET /api/products; espera 1500 ms antes de responder.`);
  console.log('Mantén Expo abierto y pulsa Actualizar catálogo para ver Actualizando y después el estado vacío.');
  console.log('Al terminar, pulsa Ctrl+C en esta terminal y vuelve a iniciar npm run dev:server.');
});

process.once('SIGINT', () => {
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
  server.close();
  server.closeAllConnections();
});
