const http = require('node:http');

let port = 3200;
let host = '0.0.0.0';
const args = process.argv.slice(2);
for (let index = 0; index < args.length; index += 2) {
  const value = args[index + 1];
  if (!value || !['--port', '--host'].includes(args[index])) {
    console.error('Uso: node scripts/qa/lines-empty.cjs [--port 3200] [--host 0.0.0.0]');
    process.exit(1);
  }
  if (args[index] === '--port') port = Number(value);
  else host = value;
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('El puerto debe ser un entero entre 1 y 65535.');
  process.exit(1);
}

const categories = [
  { id: 'qa-sin-productos', name: 'Prueba sin productos', count: 0 },
  { id: 'qa-con-productos', name: 'Prueba con un producto', count: 1 },
];
const product = {
  _id: 'qa-producto-unico', name: 'Producto de prueba',
  description: 'Solo para comprobar el regreso al catálogo. No representa inventario real.',
  currency: 'MXN', price: 0, aromas: [], inStock: false,
  image: null, category: 'qa-con-productos',
};

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
  if (url.pathname === '/__qa/info') {
    return json(response, 200, { mode: 'qa-lines-empty', noDB: true, synthetic: true });
  }
  if (url.pathname !== '/api/products' && url.pathname !== '/api/products/categories') {
    return json(response, 503, { message: 'Este servidor temporal solo simula líneas y productos de prueba.' });
  }
  const allowedKeys = url.pathname === '/api/products' ? ['page', 'limit', 'category'] : [];
  const keys = [...url.searchParams.keys()];
  if (new Set(keys).size !== keys.length || keys.some((key) => !allowedKeys.includes(key))) {
    return json(response, 400, { message: 'Usa únicamente los parámetros permitidos, sin repetirlos.' });
  }
  if (url.pathname === '/api/products/categories') return json(response, 200, categories);

  const page = Number(url.searchParams.get('page') ?? 1);
  const limit = Number(url.searchParams.get('limit') ?? 20);
  if (!Number.isSafeInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
    return json(response, 400, { message: 'Usa page entero mayor o igual a 1 y limit entero entre 1 y 100.' });
  }
  const rawCategory = url.searchParams.get('category');
  const category = rawCategory ? rawCategory.trim().toLowerCase() : undefined;
  const total = category === undefined || category === product.category ? 1 : 0;
  const timer = setTimeout(() => {
    timers.delete(timer);
    if (!response.destroyed) json(response, 200, {
      items: total === 1 && page === 1 ? [product] : [], total, page, limit, totalPages: 1,
    });
  }, 500);
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
  console.log('TEMPORAL: LÍNEAS Y PRODUCTOS SINTÉTICOS. No consulta ni modifica datos reales ni usa una base de datos.');
  console.log(`Escuchando en ${host}:${port}. Productos esperan 500 ms; las líneas responden sin demora añadida.`);
  console.log('Mantén Expo abierto. 1. Selecciona «Prueba sin productos».');
  console.log('2. Pulsa «Ver productos»: debe aparecer «Esta línea aún no tiene productos».');
  console.log('3. Pulsa «Ver todos»: debe aparecer «Producto de prueba».');
  console.log('4. Al terminar, pulsa Ctrl+C en esta terminal y vuelve a iniciar npm run dev:server.');
});

let closing = false;
function close() {
  if (closing) return;
  closing = true;
  for (const timer of timers) clearTimeout(timer);
  timers.clear();
  server.close();
  server.closeAllConnections();
}
process.once('SIGINT', close);
process.once('SIGTERM', close);
