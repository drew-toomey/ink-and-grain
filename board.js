// board.js — lays out one game's project board and renders every asset card with the toon kit.
import * as K from './kit.js';
const { P, grp } = K;

const CSS = String.raw`
:root{
  --bg:#f2e8d3; --paper:#fbf5e8; --ink:#2a1c14; --muted:#6f5a49; --line:#2a1c14; --chip:#ecdfc3; --shadow:#2a1c14;
  --accent:#3e8d70; --accent-ink:#fbf5e8; --accent-text:var(--accent);
  --f-display:"Bricolage Grotesque", "Arial Rounded MT Bold", system-ui, sans-serif;
  --f-body:"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-mono:"DM Mono", ui-monospace, Menlo, Consolas, monospace;
  --r:14px;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#1c1511; --paper:#2a2019; --ink:#f4ead6; --muted:#c3ae95; --line:#e6d6bb; --chip:#3a2e25; --shadow:#0e0a08; --accent-text:color-mix(in srgb, var(--accent) 60%, #fbf5e8); color-scheme:dark } }
:root[data-theme="dark"]{ --bg:#1c1511; --paper:#2a2019; --ink:#f4ead6; --muted:#c3ae95; --line:#e6d6bb; --chip:#3a2e25; --shadow:#0e0a08; --accent-text:color-mix(in srgb, var(--accent) 60%, #fbf5e8); color-scheme:dark }
:root[data-mono]{ --bg:#e7e6e3; --paper:#f7f6f4; --ink:#1d1c1b; --muted:#5e5c59; --line:#1d1c1b; --chip:#dcdad6; --shadow:#1d1c1b }
@media (prefers-color-scheme: dark){ :root[data-mono]:not([data-theme="light"]){ --bg:#151515; --paper:#222221; --ink:#efeeec; --muted:#b3b1ad; --line:#dedcd8; --chip:#333331; --shadow:#000 } }
:root[data-mono][data-theme="dark"]{ --bg:#151515; --paper:#222221; --ink:#efeeec; --muted:#b3b1ad; --line:#dedcd8; --chip:#333331; --shadow:#000 }
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{background-color:var(--bg); color:var(--ink); font:15px/1.5 var(--f-body); margin:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.wrap{max-width:1240px; margin:0 auto; padding-block:20px 56px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); display:grid; gap:34px}
.top{display:flex; justify-content:space-between; align-items:center; gap:12px; flex-wrap:wrap; font:600 12px/1 var(--f-body); letter-spacing:.08em; text-transform:uppercase; color:var(--muted)}
.crumb{color:inherit; text-decoration:none; border-bottom:2px solid transparent; padding-bottom:2px}
.crumb:hover,.crumb:focus-visible{border-bottom-color:var(--accent); outline:none}
.mode{display:inline-flex; align-items:center; gap:8px; border:2px solid var(--line); border-radius:999px; padding:6px 12px 6px 8px; background:var(--paper); color:var(--ink); letter-spacing:.04em}
.mode i{width:14px; height:14px; border-radius:50%; border:2px solid var(--line); background:var(--accent)}
.hero{display:grid; grid-template-columns:minmax(0,1fr); gap:18px}
.frame{position:relative; border:2.5px solid var(--line); border-radius:var(--r); overflow:hidden; box-shadow:5px 5px 0 var(--shadow); background:var(--paper)}
.frame canvas{display:block; width:100%; height:auto; touch-action:pan-y}
.key .frame canvas{aspect-ratio:21/9}
.pill{position:absolute; left:50%; top:12px; transform:translateX(-50%); background:#fbf5e8; color:#2a1c14; border:2px solid #2a1c14; border-radius:999px; padding:5px 14px; font:600 12.5px/1.2 var(--f-body); white-space:nowrap; pointer-events:none; max-width:calc(100% - 24px); overflow:hidden; text-overflow:ellipsis}
.intro{display:grid; grid-template-columns:minmax(0,1.3fr) minmax(0,1fr); gap:10px 32px; align-items:end}
h1{font:800 clamp(40px, 7vw, 84px)/.92 var(--f-display); letter-spacing:-.02em; margin:0; text-wrap:balance}
h1 span{color:var(--accent-text)}
.log{font:500 clamp(17px, 2vw, 21px)/1.4 var(--f-body); margin:0; max-width:46ch; text-wrap:pretty}
.chips{display:flex; flex-wrap:wrap; gap:8px; padding:0; margin:0; list-style:none; grid-column:1/-1}
.chips li{border:2px solid var(--line); border-radius:999px; padding:4px 12px; background:var(--chip); font:600 13px/1.3 var(--f-body)}
.brief{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:18px}
.panel{background:var(--paper); border:2px solid var(--line); border-radius:var(--r); padding:18px 20px; display:grid; gap:10px; align-content:start; min-width:0}
.panel h3{font:800 13px/1 var(--f-display); letter-spacing:.09em; text-transform:uppercase; margin:6px 0 0; color:var(--muted)}
.panel h3:first-child{margin-top:0}
.panel p{margin:0}
.loop{margin:0; padding:0; list-style:none; display:grid; gap:7px; counter-reset:s}
.loop li{display:grid; grid-template-columns:28px 1fr; gap:10px; align-items:start; counter-increment:s}
.loop li::before{content:counter(s); width:26px; height:26px; border-radius:50%; border:2px solid var(--line); background:var(--accent); color:var(--accent-ink); display:grid; place-items:center; font:800 13px/1 var(--f-display)}
.why{margin:0; padding-left:18px; display:grid; gap:6px}
.sim{margin:0; padding:0; list-style:none; display:grid; gap:7px}
.sim a{color:var(--ink); font-weight:700; text-decoration-color:var(--accent); text-decoration-thickness:2px; text-underline-offset:3px}
.sim span{color:var(--muted)}
.sw{display:grid; grid-template-columns:repeat(auto-fill, minmax(84px,1fr)); gap:8px}
.sw button{all:unset; cursor:pointer; display:grid; gap:4px; font:500 11.5px/1.2 var(--f-body); color:var(--muted)}
.sw button i{display:block; height:38px; border-radius:9px; border:2px solid var(--line)}
.sw button b{color:var(--ink); font-weight:700}
.sw button code{font:12px/1 var(--f-mono)}
.sw button:focus-visible{outline:3px solid var(--accent); outline-offset:3px; border-radius:10px}
.row{display:grid; gap:14px}
.row header{display:flex; align-items:baseline; justify-content:space-between; gap:12px; flex-wrap:wrap}
h2{font:800 clamp(24px, 3.2vw, 34px)/1 var(--f-display); margin:0; letter-spacing:-.01em}
.row header p{margin:0; color:var(--muted); font-size:13.5px}
.grid{display:grid; gap:18px}
.g4{grid-template-columns:repeat(4, minmax(0,1fr))}
.g3{grid-template-columns:repeat(3, minmax(0,1fr))}
.g2{grid-template-columns:repeat(2, minmax(0,1fr))}
.card{margin:0; display:grid; gap:10px; min-width:0; align-content:start}
.card .frame canvas{aspect-ratio:var(--ar, 4/3)}
.card .tag{position:absolute; left:10px; top:10px; background:#fbf5e8; color:#2a1c14; border:2px solid #2a1c14; border-radius:999px; padding:2px 10px; font:700 11px/1.5 var(--f-body); letter-spacing:.06em; text-transform:uppercase; pointer-events:none}
.card figcaption{display:grid; gap:2px; padding:0 4px}
.card figcaption b{font:800 18px/1.15 var(--f-display)}
.card figcaption span{color:var(--muted); font-size:13.5px; line-height:1.4}
details.prompt{margin-top:4px}
details.prompt summary{cursor:pointer; font:600 12.5px/1.4 var(--f-body); color:var(--muted); list-style:none; display:inline-flex; gap:6px; align-items:center; border:1.5px solid color-mix(in srgb, var(--line) 45%, transparent); border-radius:999px; padding:2px 10px}
details.prompt summary::-webkit-details-marker{display:none}
details.prompt summary:focus-visible{outline:3px solid var(--accent); outline-offset:2px}
details.prompt p{font:12px/1.5 var(--f-mono); background:var(--chip); border-radius:10px; padding:10px 12px; margin:8px 0 6px; white-space:pre-wrap; overflow-wrap:anywhere}
details.prompt button{font:700 12px/1 var(--f-body); border:2px solid var(--line); background:var(--paper); color:var(--ink); border-radius:999px; padding:6px 12px; cursor:pointer}
details.prompt button:focus-visible{outline:3px solid var(--accent); outline-offset:2px}
.foot{color:var(--muted); font-size:13px; border-top:2px dashed color-mix(in srgb, var(--line) 35%, transparent); padding-top:16px; display:flex; flex-wrap:wrap; gap:6px 18px; justify-content:space-between}
@media (max-width: 1020px){ .brief{grid-template-columns:minmax(0,1fr) minmax(0,1fr)} .brief .panel:last-child{grid-column:1/-1} .g4{grid-template-columns:repeat(2, minmax(0,1fr))} .intro{grid-template-columns:minmax(0,1fr)} }
@media (max-width: 640px){ .brief{grid-template-columns:minmax(0,1fr)} .g3,.g2{grid-template-columns:minmax(0,1fr)} .key .frame canvas{aspect-ratio:4/3} .wrap{gap:28px} }
@media (max-width: 420px){ .g4{grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:12px} .card figcaption b{font-size:16px} }
@media (prefers-reduced-motion: reduce){ *{scroll-behavior:auto} }
`;

const STYLE = 'Stylised low-poly 3D game asset, chunky rounded shapes, toon shading with 2–3 flat tones, thick dark-brown ink outlines, light paper grain, cosy hand-made postcard feel (Tiny Bookshop × Paralives × Chef Knight), 3/4 view from slightly above, isolated on a plain cream background.';

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
  kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
};

function promptFor(G, item, kind) {
  const pal = G.palette.map(([n, c]) => `${n} ${c}`).join(', ');
  const mono = G.mode?.mono ? `\nColour rule: greyscale only, except ${G.mode.accentName} (${G.mode.accent}) on ${G.mode.rule}.` : '';
  return item.prompt ?? `${STYLE}${mono}\nSubject (${kind}): ${item.name}${item.role ? ' — ' + item.role : ''}.${item.note ? ' ' + item.note : ''}\nGame: ${G.title} — ${G.logline}\nPalette: ${pal}.`;
}

function card(G, item, kind, ar) {
  const cv = h('canvas', { 'aria-label': `${item.name}, ${kind}. Drag to turn.`, role: 'img' });
  const txt = promptFor(G, item, kind);
  const pre = h('p', {}, txt);
  const btn = h('button', { type: 'button', onclick: async (e) => { const b = e.currentTarget; try { await navigator.clipboard.writeText(txt); b.textContent = 'Copied'; } catch { const r = document.createRange(); r.selectNodeContents(pre); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = 'Selected — press Ctrl+C'; } setTimeout(() => (b.textContent = 'Copy prompt'), 2200); } }, 'Copy prompt');
  const fig = h('figure', { class: 'card', style: `--ar:${ar}` },
    h('div', { class: 'frame' }, cv, h('span', { class: 'tag' }, item.tag ?? kind)),
    h('figcaption', {}, h('b', {}, item.name), item.role || item.note ? h('span', {}, item.role ?? item.note) : null,
      h('details', { class: 'prompt' }, h('summary', {}, 'Generation prompt'), pre, btn)));
  return { fig, cv };
}

export async function renderBoard(G, meta = {}) {
  const style = document.createElement('style'); style.textContent = CSS; document.head.append(style);
  const root = document.documentElement;
  if (G.mode?.mono) root.dataset.mono = '1';
  root.style.setProperty('--accent', G.mode?.mono ? G.mode.accent : (G.theme?.accent ?? P.teal));
  root.style.setProperty('--accent-ink', G.theme?.accentInk ?? '#fbf5e8');
  const cardBg = G.theme?.cardBg ?? P.cream;
  const mono = G.mode?.mono ? { mono: true, accent: G.mode.accent, accentTol: G.mode.tol ?? 0.33, ink: G.mode.ink ?? '#1d1c1b' } : {};
  const jobs = [];
  const add = (cv, buildFn, stageOpts, camOpts) => jobs.push({ cv, buildFn, stageOpts: { ...mono, ...stageOpts }, camOpts });

  const titleWords = G.title.split(' ');
  const wrap = h('main', { class: 'wrap' });
  // top bar
  const crumb = `${meta.series ?? 'Ink & Grain'}${meta.n ? ` · Board ${meta.n} of ${meta.of ?? 10}` : ''}`;
  wrap.append(h('div', { class: 'top' }, meta.atlas ? h('a', { class: 'crumb', href: meta.atlas, target: '_blank', rel: 'noopener' }, '\u2190 ', crumb) : h('span', {}, crumb),
    h('span', { class: 'mode' }, h('i'), G.mode?.mono ? `Greyscale + ${G.mode.accentName}` : (G.theme?.modeLabel ?? 'Full colour'))));
  // hero
  const keyCv = h('canvas', { role: 'img', 'aria-label': `${G.title} key art. Drag to turn.` });
  wrap.append(h('section', { class: 'hero' },
    h('div', { class: 'key' }, h('div', { class: 'frame' }, keyCv, h('span', { class: 'pill' }, G.key.caption ?? 'Drag any picture to turn it'))),
    h('div', { class: 'intro' },
      h('h1', {}, titleWords.length > 1 ? [titleWords.slice(0, -1).join(' ') + ' ', h('span', {}, titleWords.at(-1))] : G.title),
      h('p', { class: 'log' }, G.logline),
      h('ul', { class: 'chips' }, G.genre.map((g) => h('li', {}, g))))));
  add(keyCv, G.key.build, { bg: G.key.bg ?? cardBg, light: G.key.light, sun: G.key.sun }, Object.assign({ yaw: -34, pitch: 30, fov: 26 }, G.key.cam));
  // brief
  wrap.append(h('section', { class: 'brief' },
    h('div', { class: 'panel' }, h('h3', {}, 'The game'), h('p', {}, G.pitch), h('h3', {}, 'The loop'), h('ol', { class: 'loop' }, G.loop.map((s) => h('li', {}, s)))),
    h('div', { class: 'panel' }, h('h3', {}, 'Why the style fits'), h('ul', { class: 'why' }, G.why.map((s) => h('li', {}, s))),
      G.mode?.mono ? [h('h3', {}, 'The colour rule'), h('p', {}, `Everything is greyscale. ${G.mode.accentName} only ever means ${G.mode.rule}.`)] : null,
      h('h3', {}, 'From your projects'), h('p', {}, G.fromYou)),
    h('div', { class: 'panel' }, h('h3', {}, 'Feels like'), h('ul', { class: 'sim' }, G.similar.map((s) => h('li', {}, s.url ? h('a', { href: s.url, target: '_blank', rel: 'noopener' }, s.name) : h('b', {}, s.name), h('span', {}, ` — ${s.note}`)))),
      h('h3', {}, 'Palette'), h('div', { class: 'sw' }, G.palette.map(([n, c]) => h('button', { type: 'button', title: `Copy ${c}`, onclick: async (e) => { try { await navigator.clipboard.writeText(c); const b = e.currentTarget.querySelector('code'); b.textContent = 'copied'; setTimeout(() => (b.textContent = c), 1500); } catch {} } }, h('i', { style: `background:${c}` }), h('b', {}, n), h('code', {}, c)))))));
  // rows
  const row = (title, sub, items, kind, cls, ar, defaults) => {
    const grid = h('div', { class: `grid ${cls}` });
    items.forEach((it) => {
      const { fig, cv } = card(G, it, it.tag ?? kind, ar);
      grid.append(fig);
      add(cv, it.build, Object.assign({ bg: cardBg }, defaults.stage, it.stage), Object.assign({}, defaults.cam, it.cam));
    });
    wrap.append(h('section', { class: 'row' }, h('header', {}, h('h2', {}, title), sub ? h('p', {}, sub) : null), grid));
  };
  const charStage = (fn) => () => { const c = fn(); return grp(K.plinth(0.62, { color: G.theme?.plinth ?? P.woodLt, rim: G.theme?.plinthRim ?? P.wood }), c); };
  row('Characters', 'Drag to turn · double-click to reset', G.characters.map((c) => ({ ...c, build: c.plinth === false ? c.build : charStage(c.build) })), 'Character', 'g4', '3/4', { cam: { yaw: -18, pitch: 11, fov: 22, pad: 1.16 } });
  row(G.buildsTitle ?? 'Buildings & vehicles', null, G.builds, 'Building', G.builds.length === 3 ? 'g3' : 'g4', '4/3', { cam: { yaw: -34, pitch: 24, fov: 24 } });
  row('Environments', null, G.environments, 'Environment', G.environments.length === 2 ? 'g2' : 'g3', '16/10', { cam: { yaw: -36, pitch: 32, fov: 26 } });
  wrap.append(h('footer', { class: 'foot' }, h('span', {}, 'Every picture is rendered live from primitives in the shared toon kit. Nothing on this board is AI-generated.'), h('span', {}, 'Prompts are for quick prototype tests only.')));
  document.body.append(wrap);

  try { await document.fonts.ready; } catch {}
  const studio = new K.Studio();
  const live = [];
  for (const j of jobs) {
    try { const subj = j.buildFn(); live.push({ ...studio.attach(j.cv, subj, j.stageOpts, j.camOpts), cv: j.cv }); }
    catch (err) { console.error('render failed', err); }
    await new Promise((r) => requestAnimationFrame(() => r()));
  }
  let lastW = innerWidth, t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(innerWidth - lastW) < 40) return; lastW = innerWidth; live.forEach((l) => { l.stage.cam = null; l.redraw(); }); }, 250); });
  document.body.dataset.done = '1';
}
