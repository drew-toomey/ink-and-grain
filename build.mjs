// node build.mjs <slug> [n]  → dist/<slug>.html  (one self-contained page: fonts link + importmap + inline bundled module)
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
const root = path.dirname(new URL(import.meta.url).pathname);
const [slug, n = '1', of = '10'] = process.argv.slice(2);
const entry = path.join(root, `.entry-${slug}.js`);
fs.writeFileSync(entry, `import { renderBoard } from './board.js';\nimport G from './games/${slug}.js';\nrenderBoard(G, { n: ${+n}, of: ${+of}, atlas: ${JSON.stringify((JSON.parse(fs.readFileSync(path.join(root, 'urls.json'), 'utf8')).atlas) || null)} });\n`);
const res = await build({ entryPoints: [entry], bundle: true, format: 'esm', write: false, minify: true, external: ['three', 'three/addons/*'], target: 'es2022' });
fs.unlinkSync(entry);
const js = res.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
const src = fs.readFileSync(path.join(root, 'games', `${slug}.js`), 'utf8');
const G = { title: (src.match(/\btitle:\s*(['"`])(.+?)\1/) || [0, 0, slug])[2] };
const html = `<title>${G.title.replace(/&/g, '&amp;')}</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Figtree:wght@400;500;600;700&family=DM+Mono&display=swap">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
<script type="module">${js}</script>
`;
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
fs.writeFileSync(path.join(root, 'dist', `${slug}.html`), html);
console.log(`dist/${slug}.html ${(html.length / 1024).toFixed(1)} KB`);
