// node build-atlas.mjs → dist/atlas.html (reads urls.json for board links)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const root = path.dirname(new URL(import.meta.url).pathname);
const urls = JSON.parse(fs.readFileSync(path.join(root, 'urls.json'), 'utf8'));
const entry = path.join(root, '.entry-atlas.js');
fs.writeFileSync(entry, `import { renderAtlas } from './atlas.js';\nrenderAtlas();\n`);
const res = await build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, minify: true, external: ['three', 'three/addons/*'], target: 'es2022' });
fs.unlinkSync(entry);
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const html = `<title>Ink &amp; Grain Atlas</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&family=DM+Mono&display=swap">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<script>window.BOARD_URLS = ${JSON.stringify(urls)};</script>
<script type="module">${js}</script>
`;
fs.writeFileSync(path.join(root, 'dist', 'atlas.html'), html);
console.log(`dist/atlas.html ${(html.length / 1024).toFixed(1)} KB`);
