// Local preview server for the DT Plumbing CRM.
// Usage: node crm/serve.mjs   (then open http://localhost:4180/)
// Wraps dt-plumbing-crm.html in the same page skeleton claude.ai adds, plus local/shim.js,
// which stands in for claude.ai's saving and downloads. The file is re-read on every request,
// so edits show on reload.
import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {join, dirname, extname} from 'node:path';
import {fileURLToPath} from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4180;
const TYPES = {'.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.html': 'text/html; charset=utf-8'};
const HEAD = '<!doctype html><html lang="en-ZA"><head><meta charset="utf-8">' +
  '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
  'body{margin:0;font:14px system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>' +
  '<script src="/local/shim.js"></script></head><body>';
const STATIC = new Set(['/local/shim.js', '/local/seed.json']);

http.createServer(async (req, res) => {
  const {pathname} = new URL(req.url, 'http://localhost');
  try {
    if (pathname === '/' || pathname === '/index.html') {
      const page = await readFile(join(here, 'dt-plumbing-crm.html'), 'utf8');
      res.writeHead(200, {'content-type': TYPES['.html'], 'cache-control': 'no-store'});
      return res.end(HEAD + page + '</body></html>');
    }
    if (STATIC.has(pathname)) {
      const body = await readFile(join(here, pathname));
      res.writeHead(200, {'content-type': TYPES[extname(pathname)], 'cache-control': 'no-store'});
      return res.end(body);
    }
    if (pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
    res.writeHead(404, {'content-type': 'text/plain; charset=utf-8'});
    res.end('Not found');
  } catch (e) {
    res.writeHead(500, {'content-type': 'text/plain; charset=utf-8'});
    res.end(String(e));
  }
}).listen(PORT, '127.0.0.1', () => console.log(`DT Plumbing CRM (local preview): http://localhost:${PORT}/`));
