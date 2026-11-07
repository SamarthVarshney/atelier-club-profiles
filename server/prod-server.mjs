import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClubApiMiddleware } from './api.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT || 4173);

const STATIC_MIMES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
};

const apiMiddleware = createClubApiMiddleware();

const server = http.createServer((req, res) => {
  apiMiddleware(req, res, () => {
    const parsed = new URL(req.url || '/', `http://localhost:${PORT}`);
    let relPath = decodeURIComponent(parsed.pathname);
    if (relPath === '/') relPath = '/index.html';

    const candidate = path.join(DIST_DIR, relPath);
    if (
      candidate.startsWith(DIST_DIR) &&
      fs.existsSync(candidate) &&
      fs.statSync(candidate).isFile()
    ) {
      const ext = path.extname(candidate).toLowerCase();
      res.statusCode = 200;
      res.setHeader('Content-Type', STATIC_MIMES[ext] || 'application/octet-stream');
      fs.createReadStream(candidate).pipe(res);
      return;
    }

    // SPA fallback for /@handle, /customize, /templates, /analytics
    const indexHtml = path.join(DIST_DIR, 'index.html');
    if (fs.existsSync(indexHtml)) {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(indexHtml).pipe(res);
    } else {
      res.statusCode = 404;
      res.end('Run npm run build before npm start');
    }
  });
});

server.listen(PORT, () => {
  console.log(`Atelier Club Dossier Server listening on http://localhost:${PORT}`);
});
