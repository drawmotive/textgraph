import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '../..');
createServer(async (request, response) => {
  response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; connect-src 'self'; worker-src 'self'; img-src 'self' data: blob:");
  const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  if (pathname === '/') { response.setHeader('Content-Type', 'text/html'); response.end('<!doctype html><title>TextGraph contract</title>'); return; }
  const file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(root + path.sep)) { response.writeHead(403).end(); return; }
  try {
    const type = file.endsWith('.wasm') ? 'application/wasm' : file.endsWith('.json') ? 'application/json' : file.endsWith('.ttf') ? 'font/ttf' : file.endsWith('.css') ? 'text/css' : 'text/javascript';
    response.setHeader('Content-Type', type);
    response.end(await readFile(file));
  } catch { response.writeHead(404).end(); }
}).listen(4178, '127.0.0.1');
