#!/usr/bin/env node
// Local preview: builds the site (with sample + draft posts), serves dist/ on http://localhost:4173,
// and rebuilds whenever a source file changes. Reload the browser to see edits.

import http from 'node:http';
import path from 'node:path';
import { createReadStream, watch, promises as fs } from 'node:fs';

// `--live` previews what production will show (no sample or draft posts) on a second port,
// building into its own folder so both previews can run at the same time.
const LIVE = process.argv.includes('--live');
if (LIVE) process.env.RPC_OUT = 'dist-live';
const { build, DIST, ROOT } = await import('./build.mjs');
const PORT = Number(process.env.PORT) || (LIVE ? 4174 : 4173);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};

// Send the same security headers Vercel will (from vercel.json), so a Content-Security-Policy problem shows up here first.
let securityHeaders = {};
const loadHeaders = async () => {
  const config = JSON.parse(await fs.readFile(path.join(ROOT, 'vercel.json'), 'utf8'));
  securityHeaders = Object.fromEntries((config.headers || [])
    .filter((rule) => rule.source === '/(.*)')
    .flatMap((rule) => rule.headers)
    .map(({ key, value }) => [key.toLowerCase(), value]));
};

let building = Promise.resolve();
const rebuild = () => {
  building = Promise.all([loadHeaders(), build({ samples: !LIVE, drafts: !LIVE })])
    .then(([, { posts }]) => console.log(`[${new Date().toLocaleTimeString()}] rebuilt (${posts} posts)`))
    .catch((err) => console.error(`[${new Date().toLocaleTimeString()}] build failed: ${err.message}`));
  return building;
};

await rebuild();

const server = http.createServer(async (req, res) => {
  try {
    await building;
    const { pathname } = new URL(req.url, 'http://localhost');
    if (pathname === '/_vercel/insights/script.js') { // only exists on Vercel; stub it so the local console stays clean
      res.writeHead(200, { ...securityHeaders, 'content-type': MIME['.js'] }).end('/* Vercel Analytics is served by Vercel only */');
      return;
    }
    let file = path.join(DIST, path.normalize(decodeURIComponent(pathname)));
    if (file !== DIST && !file.startsWith(DIST + path.sep)) { res.writeHead(403).end('Forbidden'); return; }
    let stat = await fs.stat(file).catch(() => null);
    if (stat?.isDirectory()) {
      file = path.join(file, 'index.html');
      stat = await fs.stat(file).catch(() => null);
    }
    if (!stat) { // like Vercel: the built 404.html with a 404 status
      const page = await fs.readFile(path.join(DIST, '404.html')).catch(() => null);
      res.writeHead(404, { ...securityHeaders, 'content-type': page ? MIME['.html'] : 'text/plain', 'cache-control': 'no-store' }).end(page || 'Not found');
      return;
    }
    res.writeHead(200, {
      ...securityHeaders,
      'content-type': MIME[path.extname(file)] || 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(file).pipe(res);
  } catch (err) {
    res.writeHead(500, { 'content-type': 'text/plain' }).end(String(err));
  }
});

server.on('error', (err) => {
  console.error(err.code === 'EADDRINUSE' ? `Port ${PORT} is busy. Try: PORT=4174 npm run dev` : err.message);
  process.exit(1);
});
server.listen(PORT, '127.0.0.1', () => console.log(`Preview running at http://localhost:${PORT}`));

let timer;
watch(ROOT, { recursive: true }, (_event, name) => {
  if (!name || /^(dist[^/]*|\.git|node_modules|\.claude)(\/|$)/.test(name) || name.endsWith('.DS_Store')) return;
  clearTimeout(timer);
  timer = setTimeout(rebuild, 150);
});
