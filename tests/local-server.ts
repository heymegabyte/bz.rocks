import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFileSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

// Minimal static server for LOCAL preview E2E runs: serves `dist/` and
// deep-links every unknown path to index.html (mirrors the Workers SPA
// fallback). Lets a pre-deploy review commit be driven in a real browser
// with `PROD_URL=http://127.0.0.1:<port> playwright test --config=playwright.chrome.config.ts`.

const DIST = resolve(process.cwd(), 'dist');
const PORT = Number(process.env.PORT ?? 4173);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8'
};

function send(res: ServerResponse, status: number, body: string | Buffer, type = 'text/html; charset=utf-8') {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(body);
}

function handle(req: IncomingMessage, res: ServerResponse) {
  const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
  if (path.startsWith('/api/')) {
    send(res, 204, '');
    return;
  }
  const file = join(DIST, path);
  if (file.startsWith(DIST)) {
    try {
      const ext = extname(file);
      if (ext) return send(res, 200, readFileSync(file), TYPES[ext] ?? 'application/octet-stream');
    } catch {
      /* fall through to SPA shell */
    }
  }
  try {
    send(res, 200, readFileSync(join(DIST, 'index.html')));
  } catch {
    send(res, 500, 'dist/index.html missing — run npm run build first');
  }
}

createServer(handle).listen(PORT, '127.0.0.1', () => {
  // eslint-disable-next-line no-console
  console.log(`local preview server on http://127.0.0.1:${PORT} (dist=${DIST})`);
});
