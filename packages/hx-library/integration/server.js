/**
 * Integration test static server.
 * Serves the integration test HTML pages and the built dist files.
 * Used by Playwright integration tests.
 */
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, extname, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// Serve from monorepo root so /packages/hx-tokens/dist/... paths resolve correctly
const ROOT = resolve(__dirname, '../../..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
};

const PORT = process.env.PORT || 4321;

const server = createServer((req, res) => {
  let urlPath = req.url.split('?')[0];

  // Resolve file path relative to package root
  let filePath = resolve(ROOT, '.' + urlPath);

  // Directory → index.html
  if (existsSync(filePath) && !extname(filePath)) {
    filePath = resolve(filePath, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`Not found: ${urlPath}`);
    return;
  }

  const ext = extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  try {
    const content = readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`Integration test server running on http://localhost:${PORT}`);
});
