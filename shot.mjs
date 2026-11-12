// usage: node shot.mjs <page.html> <out.png> [width] [height] [--full] [--dark]
// Serves this folder on localhost, maps the three.js CDN to ./vendor, screenshots once data-done is set.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = path.dirname(new URL(import.meta.url).pathname);
const [page = 'calib.html', out = 'out.png', w = '1320', h = '760'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const full = process.argv.includes('--full'), dark = process.argv.includes('--dark');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json' };
const srv = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(req.url.split('?')[0]));
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': types[path.extname(p)] || 'application/octet-stream' }); res.end(d); });
}).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'], proxy: process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined });
const ctx = await browser.newContext({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, ignoreHTTPSErrors: true, colorScheme: dark ? 'dark' : 'light' });
const pg = await ctx.newPage();
const logs = [];
pg.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
pg.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
// Optional offline copy: put three@0.160.0 under ./vendor/three (build/three.module.js, examples/jsm/...) to skip the CDN.
if (fs.existsSync(path.join(root, 'vendor/three/build/three.module.js'))) await pg.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**', (route) => {
  const rel = route.request().url().split('three@0.160.0/')[1];
  route.fulfill({ path: path.join(root, 'vendor/three', rel), contentType: 'text/javascript' });
});
const t0 = Date.now();
await pg.goto(`http://localhost:${port}/${page}`);
try { await pg.waitForFunction(() => document.body.dataset.done === '1', null, { timeout: 180000 }); } catch (e) { logs.push('TIMEOUT waiting for data-done'); }
await pg.waitForTimeout(300);
await pg.screenshot({ path: out, fullPage: full });
console.log(`rendered in ${Date.now() - t0}ms`);
console.log(logs.filter((l) => !l.includes('GPU stall')).slice(0, 30).join('\n'));
await browser.close(); srv.close();
