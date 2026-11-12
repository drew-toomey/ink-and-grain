// atlas.js — the overview page: house style, the games (live key-art thumbnails), and the evidence.
import * as K from './kit.js';
import tide from './games/tide.js';
import barge from './games/barge.js';
import lost from './games/lost.js';
import railway from './games/railway.js';
import snowline from './games/snowline.js';
import pall from './games/pall.js';
import nightwatch from './games/nightwatch.js';
import warren from './games/warren.js';
import marshlight from './games/marshlight.js';
import burger from './games/burger.js';
import fathom from './games/fathom.js';
import { WORLDS } from './worlds.js';
const { P, grp, box, cyl, cone, extrude, tube, torus, tex, texMat, deg } = K;

const GAMES = [tide, barge, lost, railway, snowline, pall, nightwatch, warren, marshlight, burger, fathom];
const URLS = window.BOARD_URLS || {};

const CSS = String.raw`
:root{
  --bg:#f2e8d3; --paper:#fbf5e8; --ink:#2a1c14; --muted:#6f5a49; --line:#2a1c14; --chip:#ecdfc3; --shadow:#2a1c14; --accent:#cf5b3d;
  --f-display:"Bricolage Grotesque", "Arial Rounded MT Bold", system-ui, sans-serif;
  --f-body:"Figtree", system-ui, -apple-system, "Segoe UI", sans-serif;
  --f-mono:"DM Mono", ui-monospace, Menlo, Consolas, monospace; --r:14px;
}
@media (prefers-color-scheme: dark){ :root:not([data-theme="light"]){ --bg:#1c1511; --paper:#2a2019; --ink:#f4ead6; --muted:#c3ae95; --line:#e6d6bb; --chip:#3a2e25; --shadow:#0e0a08; --accent:#ef8a6a; color-scheme:dark } }
:root[data-theme="dark"]{ --bg:#1c1511; --paper:#2a2019; --ink:#f4ead6; --muted:#c3ae95; --line:#e6d6bb; --chip:#3a2e25; --shadow:#0e0a08; --accent:#ef8a6a; color-scheme:dark }
*{box-sizing:border-box}
body{background:var(--bg); color:var(--ink); font:15px/1.55 var(--f-body); margin:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5 0 0 0 0 0.4 0 0 0 0 0.3 0 0 0 .09 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");}
.wrap{max-width:1240px; margin:0 auto; padding-block:22px 60px; padding-left:max(16px, env(safe-area-inset-left, 0px)); padding-right:max(16px, env(safe-area-inset-right, 0px)); display:grid; gap:44px}
.eyebrow{font:700 12px/1 var(--f-body); letter-spacing:.1em; text-transform:uppercase; color:var(--muted)}
.hero{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1.25fr); gap:28px; align-items:center}
h1{font:800 clamp(46px, 7.4vw, 96px)/.9 var(--f-display); letter-spacing:-.025em; margin:10px 0 16px}
h1 span{color:var(--accent)}
.lede{font:500 clamp(17px,1.9vw,20px)/1.45 var(--f-body); margin:0 0 16px; max-width:40ch}
.refs{display:flex; flex-wrap:wrap; gap:8px; padding:0; margin:0; list-style:none}
.refs li{border:2px solid var(--line); border-radius:999px; padding:4px 12px; background:var(--chip); font:600 13px/1.3 var(--f-body)}
.frame{position:relative; border:2.5px solid var(--line); border-radius:var(--r); overflow:hidden; box-shadow:5px 5px 0 var(--shadow); background:var(--paper)}
.frame canvas{display:block; width:100%; height:auto; touch-action:pan-y}
.pill{position:absolute; left:50%; top:12px; transform:translateX(-50%); background:#fbf5e8; color:#2a1c14; border:2px solid #2a1c14; border-radius:999px; padding:5px 14px; font:600 12.5px/1.2 var(--f-body); white-space:nowrap; pointer-events:none; max-width:calc(100% - 24px); overflow:hidden; text-overflow:ellipsis}
h2{font:800 clamp(28px, 3.6vw, 40px)/1 var(--f-display); margin:0; letter-spacing:-.015em}
.sec{display:grid; gap:18px}
.sec > header{display:flex; justify-content:space-between; align-items:baseline; gap:12px; flex-wrap:wrap}
.sec > header p{margin:0; color:var(--muted); font-size:14px; max-width:60ch}
.rules{display:grid; grid-template-columns:repeat(5, minmax(0,1fr)); gap:14px; padding:0; margin:0; list-style:none; counter-reset:r}
.rules li{background:var(--paper); border:2px solid var(--line); border-radius:var(--r); padding:14px 16px 16px; display:grid; gap:6px; align-content:start; counter-increment:r; min-width:0}
.rules li::before{content:counter(r); width:28px; height:28px; border-radius:50%; border:2px solid var(--line); background:var(--accent); color:#fbf5e8; display:grid; place-items:center; font:800 14px/1 var(--f-display)}
.rules b{font:800 16px/1.2 var(--f-display)}
.rules span{color:var(--muted); font-size:13.5px; line-height:1.45}
.sw{display:flex; gap:6px; flex-wrap:wrap; margin-top:4px}
.sw i{width:22px; height:22px; border-radius:6px; border:2px solid var(--line)}
.games{display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:26px 22px}
.game{display:grid; gap:12px; color:inherit; text-decoration:none; min-width:0; align-content:start}
.game .frame canvas{aspect-ratio:16/9}
.game .num{position:absolute; left:10px; top:10px; width:34px; height:34px; border-radius:50%; background:#fbf5e8; color:#2a1c14; border:2px solid #2a1c14; display:grid; place-items:center; font:800 15px/1 var(--f-display); pointer-events:none}
.game .mode{position:absolute; right:10px; top:10px; display:inline-flex; gap:6px; align-items:center; background:#fbf5e8; color:#2a1c14; border:2px solid #2a1c14; border-radius:999px; padding:3px 10px 3px 6px; font:700 11px/1.4 var(--f-body); letter-spacing:.05em; text-transform:uppercase; pointer-events:none}
.game .mode i{width:12px; height:12px; border-radius:50%; border:2px solid #2a1c14}
.game .meta{display:grid; gap:6px; padding:0 4px}
.game h3{font:800 24px/1.05 var(--f-display); margin:0; display:flex; justify-content:space-between; gap:12px; align-items:baseline; flex-wrap:wrap}
.game h3 a{color:inherit; text-decoration:none}
.game h3 a:hover, .game h3 a:focus-visible{text-decoration:underline; text-decoration-color:var(--accent); text-decoration-thickness:3px; text-underline-offset:4px; outline:none}
.game .open{font:700 13px/1 var(--f-body); color:var(--ink); border:2px solid var(--line); border-radius:999px; padding:7px 12px; text-decoration:none; background:var(--paper); white-space:nowrap}
.game .open:hover, .game .open:focus-visible{background:var(--accent); color:#fbf5e8; outline:none}
.game .open[aria-disabled="true"]{opacity:.55; pointer-events:none}
.game p{margin:0; color:var(--muted); font-size:14.5px; text-wrap:pretty}
.chips{display:flex; flex-wrap:wrap; gap:6px; padding:0; margin:0; list-style:none}
.chips li{border:1.5px solid var(--line); border-radius:999px; padding:2px 10px; background:var(--chip); font:600 12px/1.4 var(--f-body)}
.two{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr); gap:18px}
.panel{background:var(--paper); border:2px solid var(--line); border-radius:var(--r); padding:20px 22px; display:grid; gap:12px; align-content:start; min-width:0}
.panel h3{font:800 13px/1 var(--f-display); letter-spacing:.09em; text-transform:uppercase; margin:0; color:var(--muted)}
.facts{list-style:none; margin:0; padding:0; display:grid; gap:12px}
.facts li{display:grid; grid-template-columns:7.6em minmax(0,1fr); gap:2px 14px; align-items:baseline}
.facts b{font:800 19px/1.15 var(--f-display); font-variant-numeric:tabular-nums; color:var(--accent)}
.facts span{font-size:14.5px}
.facts small{grid-column:2; color:var(--muted); font-size:12.5px}
.tblwrap{overflow-x:auto; border:2px solid var(--line); border-radius:var(--r); background:var(--paper)}
table{border-collapse:collapse; width:100%; min-width:640px; font-size:14px}
th, td{text-align:left; padding:10px 14px; border-bottom:1.5px solid color-mix(in srgb, var(--line) 18%, transparent); vertical-align:top}
th{font:800 12px/1.2 var(--f-display); letter-spacing:.08em; text-transform:uppercase; color:var(--muted)}
tr:last-child td{border-bottom:0}
td:first-child{font-weight:700; white-space:nowrap}
.mono{display:grid; grid-template-columns:minmax(0,1fr) minmax(0,1fr) minmax(0,1fr); gap:14px}
.mono .panel p{margin:0}
.dot{display:inline-block; width:12px; height:12px; border-radius:50%; border:2px solid var(--line); vertical-align:-1px; margin-right:6px}
.next{display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px; list-style:none; padding:0; margin:0}
.next li{background:var(--paper); border:2px solid var(--line); border-radius:var(--r); padding:16px 18px; display:grid; gap:6px; align-content:start}
.next b{font:800 17px/1.2 var(--f-display)}
.next span{color:var(--muted); font-size:14px}
.foot{color:var(--muted); font-size:12.5px; border-top:2px dashed color-mix(in srgb, var(--line) 35%, transparent); padding-top:16px; display:grid; gap:6px}
.foot a{color:var(--muted)}
.worlds .game .num{background:var(--accent); color:#fbf5e8}
.worlds .ref{font:700 12px/1.3 var(--f-body); letter-spacing:.06em; text-transform:uppercase; color:var(--muted)}
.verdict{display:grid; gap:8px; margin:4px 0 0; padding:0; list-style:none}
.verdict li{display:grid; grid-template-columns:5.6em minmax(0,1fr); gap:10px; align-items:baseline; font-size:14px}
.verdict b{font:800 13px/1.2 var(--f-display); letter-spacing:.04em; text-transform:uppercase}
.verdict .tag{display:inline-block; border:1.5px solid var(--line); border-radius:999px; padding:1px 9px; margin-right:6px; font:700 12px/1.4 var(--f-body); background:var(--chip)}
.verdict .tag.strong{background:#3f8a6b; color:#fbf5e8}
.verdict .dots{letter-spacing:2px; margin-right:6px; font-weight:800; color:var(--accent)}
.worlds details{font-size:14px; color:var(--muted)}
.worlds summary{cursor:pointer; font-weight:700; color:var(--ink)}
.worlds details p{margin:6px 0 0}
@media (max-width: 1020px){ .rules{grid-template-columns:repeat(2, minmax(0,1fr))} .rules li:last-child{grid-column:1/-1} .hero{grid-template-columns:minmax(0,1fr)} .mono{grid-template-columns:minmax(0,1fr)} .next{grid-template-columns:minmax(0,1fr)} }
@media (max-width: 720px){ .games{grid-template-columns:minmax(0,1fr)} .two{grid-template-columns:minmax(0,1fr)} .rules{grid-template-columns:minmax(0,1fr)} }
@media (max-width: 440px){ .facts li{grid-template-columns:minmax(0,1fr)} .facts small{grid-column:1} }
`;

const h = (tag, attrs = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) { if (v == null) continue; if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else e.setAttribute(k, v); }
  kids.flat().forEach((c) => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
};

// The kite workbench, rebuilt in the kit (calibration scene against the user's screenshot).
function kiteBench() {
  const g = grp();
  g.add(box(9, 0.5, 5.4, P.wood).at(0, -0.5, 0.1));
  g.add(box(9, 3.4, 0.2, P.wall).at(0, -0.5, -2.7));
  g.add(box(6.6, 2.3, 0.08, texMat(tex.speckle({ base: P.cork, dots: [P.woodDk], n: 70, size: 3 }))).at(0.4, 0.45, -2.55));
  g.add(box(5.6, 0.05, 3.7, texMat(tex.grid({ bg: P.mat, line: '#a9d2bb', cells: 10, lw: 2, rep: [1.5, 1] }))).at(-0.2, 0, 0.35));
  const pts = { t: [0, 1.0], r: [0.78, 0], b: [0, -1.65], l: [-0.78, 0], c: [0, 0] };
  const tri = (a, b, col) => extrude([pts[a], pts[b], pts.c], 0.03, col);
  const kite = grp(tri('l', 't', P.red), tri('t', 'r', P.blue), tri('r', 'b', P.red), tri('b', 'l', P.blue),
    box(0.07, 2.75, 0.06, P.woodLt).at(0, -1.7, 0.05), box(1.66, 0.07, 0.06, P.woodLt).at(0, -0.03, 0.05),
    K.sph(0.06, P.red, { seg: 10 }).at(0, 0.45, 0.07), K.sph(0.06, P.red, { seg: 10 }).at(0, -0.9, 0.07));
  g.add(grp(kite.rot(deg(-90), 0, 0)).rot(0, deg(-58), 0).at(-0.3, 0.06, 0.45));
  g.add(tube([[-0.6, 0.12, 0.05], [-0.2, 0.7, 0.55], [0.35, 0.12, 0.75]], 0.012, P.white).noInk());
  const pots = [P.pink, P.white, P.blue, P.green, P.red, P.mustard];
  g.add(box(1.5, 0.16, 2.1, P.woodDk).at(3.45, 0, -0.55));
  pots.forEach((c, i) => { const x = 3.12 + (i % 2) * 0.66, z = -1.2 + Math.floor(i / 2) * 0.66; g.add(cyl(0.27, 0.27, 0.42, P.white).at(x, 0.16, z), cyl(0.21, 0.21, 0.43, c).at(x, 0.16, z)); });
  g.add(cyl(0.46, 0.46, 0.42, P.woodDk).at(3.75, 0, 1.45), cyl(0.37, 0.37, 0.43, P.white).at(3.75, 0, 1.45));
  g.add(cyl(0.42, 0.5, 0.2, P.red).at(-3.7, 0, -1.75), cyl(0.06, 0.06, 2.3, P.steel).rot(deg(-10), 0, deg(-8)).at(-3.7, 0.1, -1.75), cone(0.65, 0.75, P.red).rot(deg(150), 0, deg(-25)).at(-3.25, 2.55, -1.45));
  g.add(grp(torus(0.16, 0.05, P.red).rot(deg(90), 0, 0).at(0, 0.05, 0), torus(0.16, 0.05, P.red).rot(deg(90), 0, 0).at(0.32, 0.05, 0.08), box(1.0, 0.04, 0.08, P.steel).at(0.85, 0.02, 0.04)).rot(0, deg(-14), 0).at(-4.15, 0, 0.7));
  g.add(cyl(0.5, 0.5, 0.25, P.white).rot(deg(90), 0, 0).at(1.7, 1.75, -2.45), cyl(0.36, 0.36, 0.26, P.cork).rot(deg(90), 0, 0).at(1.7, 1.75, -2.45));
  return g;
}

export async function renderAtlas() {
  const style = document.createElement('style'); style.textContent = CSS; document.head.append(style);
  const jobs = [];
  const wrap = h('main', { class: 'wrap' });

  // hero
  const benchCv = h('canvas', { role: 'img', 'aria-label': 'The kite workbench rebuilt in the shared toon kit. Drag to turn.', style: 'aspect-ratio:16/10' });
  jobs.push({ cv: benchCv, build: kiteBench, stage: { bg: P.cream }, cam: { yaw: 0, pitch: 54, fov: 30, zoom: 1.32 } });
  wrap.append(h('section', { class: 'hero' },
    h('div', {},
      h('div', { class: 'eyebrow' }, 'House style · working name'),
      h('h1', {}, 'Ink & ', h('span', {}, 'Grain')),
      h('p', { class: 'lede' }, 'Eleven game ideas that would suit the kite-shop art style, each with its own project board, plus six bigger worlds pitched in the same style. Everything is rendered live.'),
      h('ul', { class: 'refs' }, ['Paralives', 'Tiny Bookshop', 'Chef Knight'].map((r) => h('li', {}, r)))),
    h('div', { class: 'frame' }, benchCv, h('span', { class: 'pill' }, 'Your kite bench, rebuilt in the shared kit'))));

  // rules
  const rule = (b, s, sw) => h('li', {}, h('b', {}, b), h('span', {}, s), sw ? h('div', { class: 'sw' }, sw.map((c) => h('i', { style: `background:${c}` }))) : null);
  wrap.append(h('section', { class: 'sec' },
    h('header', {}, h('h2', {}, 'The style in five rules'), h('p', {}, 'These are the settings every board uses, so all the games look like one studio made them.')),
    h('ol', { class: 'rules' },
      rule('Chunky shapes', 'Low-poly, rounded, toy-like proportions. Big heads, short legs, fat props.'),
      rule('Three-tone toon', 'Lit, mid and shadow bands only. Shadows stay warm rather than grey.'),
      rule('Ink lines', 'Thick dark-brown outlines on silhouettes, creases and where objects meet, with a slight hand wobble.'),
      rule('Warm, muted colour', 'Cream, terracotta, teal, honey wood, sky blue, mustard. Each game shifts the mix.', [P.cream, P.terracotta, P.teal, P.wood, P.blue, P.mustard]),
      rule('Paper and diorama', 'Grain over everything. Scenes sit on little slabs, seen from above like a model on a desk.'))));

  // games
  const grid = h('div', { class: 'games' });
  GAMES.forEach((G, i) => {
    const cv = h('canvas', { role: 'img', 'aria-label': `${G.title} key art. Drag to turn.` });
    const url = URLS[G.slug];
    const modeTxt = G.mode?.mono ? `Greyscale + ${G.mode.accentName.split(' ').slice(-1)[0].toLowerCase()}` : 'Full colour';
    grid.append(h('article', { class: 'game' },
      h('div', { class: 'frame' }, cv, h('span', { class: 'num' }, String(i + 1)), h('span', { class: 'mode' }, h('i', { style: `background:${G.mode?.mono ? G.mode.accent : G.theme?.accent ?? P.teal}` }), modeTxt)),
      h('div', { class: 'meta' },
        h('h3', {}, url ? h('a', { href: url, target: '_blank', rel: 'noopener' }, G.title) : G.title, h('a', { class: 'open', href: url ?? '#', target: '_blank', rel: 'noopener', 'aria-disabled': url ? null : 'true' }, 'Open board')),
        h('p', {}, G.logline),
        h('ul', { class: 'chips' }, [...G.genre, ...(G.similar?.[0] ? [`Like ${G.similar[0].name}`] : [])].map((c) => h('li', {}, c))))));
    const mono = G.mode?.mono ? { mono: true, accent: G.mode.accent, accentTol: G.mode.tol ?? 0.33, ink: G.mode.ink ?? '#1d1c1b' } : {};
    jobs.push({ cv, build: G.key.build, stage: { ...mono, bg: G.key.bg ?? G.theme?.cardBg ?? P.cream, light: G.key.light, sun: G.key.sun }, cam: Object.assign({ yaw: -34, pitch: 30, fov: 26 }, G.key.cam) });
  });
  wrap.append(h('section', { class: 'sec' }, h('header', {}, h('h2', {}, 'The eleven games'), h('p', {}, 'Drag any picture to turn it. Each board opens in its own page.')), grid));


  // six bigger worlds (Nov 2026): lighter pitches, one picture each
  const wgrid = h('div', { class: 'games' });
  WORLDS.forEach((W, i) => {
    const cv = h('canvas', { role: 'img', 'aria-label': `${W.title} key art. Drag to turn.` });
    wgrid.append(h('article', { class: 'game' },
      h('div', { class: 'frame' }, cv, h('span', { class: 'num' }, 'ABCDEF'[i]), h('span', { class: 'pill', style: 'top:auto; bottom:12px' }, W.key.caption)),
      h('div', { class: 'meta' },
        h('span', { class: 'ref' }, `Your idea: ${W.ref}`),
        h('h3', {}, W.title),
        h('p', {}, W.logline),
        h('ul', { class: 'verdict' },
          h('li', {}, h('b', {}, 'Style fit'), h('span', {}, h('span', { class: `tag ${W.fit === 'Strong' ? 'strong' : ''}` }, W.fit), W.fitNote)),
          h('li', {}, h('b', {}, 'Size'), h('span', {}, h('span', { class: 'dots', 'aria-label': `${W.size} out of 5` }, '●'.repeat(W.size) + '○'.repeat(5 - W.size)), W.sizeNote))),
        h('details', {}, h('summary', {}, 'Read the pitch'), h('p', {}, W.pitch)))));
    jobs.push({ cv, build: W.key.build, stage: { bg: W.key.bg, light: W.key.light }, cam: Object.assign({ yaw: -30, pitch: 32, fov: 24 }, W.key.cam) });
  });
  wrap.append(h('section', { class: 'sec worlds' }, h('header', {}, h('h2', {}, 'Six bigger worlds'), h('p', {}, 'Your full-world ideas, each turned into an original pitch with one picture. Bigger games than the eleven above, so each one says how well the style fits and how big it would be to make.')), wgrid));

  // evidence
  const fact = (b, s, small) => h('li', {}, h('b', {}, b), h('span', {}, s), small ? h('small', {}, small) : null);
  wrap.append(h('section', { class: 'sec' },
    h('header', {}, h('h2', {}, 'Why these'), h('p', {}, 'Picked from what you keep building and playing, then checked against what is working on Steam.')),
    h('div', { class: 'two' },
      h('div', { class: 'panel' }, h('h3', {}, 'From your sessions'),
        h('ul', { class: 'facts' },
          fact('Hands-on', 'You like visible, physical steps: burger layers, LEGO steps, the kite build.', 'Every board has a loop you do with your hands, not a buy button.'),
          fact('Push back', 'A safe place that pushes back the dark keeps coming back.', 'Snowline, Pall, Warren and Marshlight are built on it.'),
          fact('2,550 h', 'in builders, 900 h in transport, 450 h in small incrementals.', 'Hence Tabletop Line, Snowline and a smaller Warren.'),
          fact('In-world UI', 'Tickets, receipts and a monitor wall instead of menus.', 'Lost Property, Burger Joint and Night Watch lean on it.'),
          fact('3 revisits', 'Warren, Marshlight and Burger Joint are your own prototypes in the new style.', 'Your Egyptian city builder already has its own toon session, so it is not boarded here.'))),
      h('div', { class: 'panel' }, h('h3', {}, 'From Steam'),
        h('ul', { class: 'facts' },
          fact('~10 games', 'have a clear ink-outline toon look, e.g. Mars First Logistics, Lil Gator Game, Railbound.', 'Most cosy dioramas (Tiny Glade, Townscaper, Dorfromantik) have no ink lines, so the look stands out.'),
          fact('11%', 'of cosy games reach 1,000 reviews, against 4.2% across Steam.', 'Cosy releases: 382 in 2024, 632 in 2025, 1,041 so far in 2026.'),
          fact('13.2%', 'hit rate for shopkeeping, the fastest-growing niche.', '477 releases so far in 2026 against 134 in all of 2025, so it is filling up.'),
          fact('1M+', 'Quarantine Zone in 3 months; Librarian 1.2M at $5.99.', 'Desk and tidying games are hot right now.'),
          fact('17.3%', 'of cosy games priced $10–15 reach 1,000 reviews, against 2.7% under $5.', 'Short premium games work.'))))));

  // genre table
  const rows = [
    ['Shopkeeping + crafting', 'Tide & Tackle, Fix-It Barge', 'Tiny Bookshop, Assemble with Care', 'Growing fast, 13.2% hit rate, crowding'],
    ['Desk / tidying', 'Lost Property, Night Watch', 'Papers, Please, Librarian, Quarantine Zone', 'Hot in 2025–26'],
    ['Cosy toy builder', 'Tabletop Line, Snowline', 'Tiny Glade, Townscaper, ISLANDERS', 'City builder hit rate 10.5%'],
    ['Restoration / colour returns', 'Pall', 'PowerWash Simulator, GRIS', 'Steam added Cleaning and Organizing tags in May 2026'],
    ['Cutaway colony', 'Warren', 'Fallout Shelter', 'Proven format, few cosy takes'],
    ['Narrative mystery', 'Marshlight', 'Firewatch, Duck Detective', 'Steady; short games do well'],
    ['Cosy exploration', 'Fathom Nook', 'Subnautica, ABZÛ, DAVE THE DIVER', 'Added 12 Nov 2026 at your request; market not checked yet'],
    ['Cooking', 'Burger Joint', 'PlateUp!, Chef Knight', 'Middling: 7.9% hit rate, needs a hook'],
  ];
  wrap.append(h('section', { class: 'sec' }, h('header', {}, h('h2', {}, 'Genre fit at a glance')),
    h('div', { class: 'tblwrap' }, h('table', {}, h('thead', {}, h('tr', {}, ['Genre', 'Boards', 'Comparable games', 'Market'].map((t) => h('th', {}, t)))),
      h('tbody', {}, rows.map((r) => h('tr', {}, r.map((c) => h('td', {}, c)))))))));

  // mono
  wrap.append(h('section', { class: 'sec' },
    h('header', {}, h('h2', {}, 'Greyscale + one colour'), h('p', {}, 'Two boards test your black-and-white idea. What the research says makes it work:')),
    h('div', { class: 'mono' },
      h('div', { class: 'panel' }, h('h3', {}, 'Make the colour a rule'), h('p', {}, 'It works when the colour always means one thing: SUPERHOT’s red enemies, Mirror’s Edge’s red route. Used as decoration, critics call it a gimmick.')),
      h('div', { class: 'panel' }, h('h3', {}, 'Keep the values apart'), h('p', {}, 'In pure monochrome, shapes can merge (a review of MOUSE: P.I. For Hire said so). Ink outlines plus strong light and dark contrast fix that.')),
      h('div', { class: 'panel' }, h('h3', {}, 'The two tests'), h('p', {}, h('span', { class: 'dot', style: `background:${pall.mode?.accent ?? '#f2a22c'}` }), 'Pall: amber means light and what you have saved. ', h('br'), h('span', { class: 'dot', style: `background:${nightwatch.mode?.accent ?? '#e2302a'}` }), 'Night Watch: red means something changed.')))));

  // next
  wrap.append(h('section', { class: 'sec' }, h('header', {}, h('h2', {}, 'Next steps')),
    h('ul', { class: 'next' },
      h('li', {}, h('b', {}, 'Shortlist two or three'), h('span', {}, 'Open the boards and pick the ones you’d still want to play in three months.')),
      h('li', {}, h('b', {}, 'Test the prompts'), h('span', {}, 'Every card has a generation prompt for quick prototype images. Use them as placeholders only.')),
      h('li', {}, h('b', {}, 'Go deeper on one'), h('span', {}, 'I can add more assets to a board, block out its hero asset for Blender, or make a playable greybox of its loop.')))));

  wrap.append(h('footer', { class: 'foot' },
    h('span', {}, 'Every picture is rendered live from primitives in the shared toon kit. Nothing here is AI-generated.'),
    h('span', {}, 'Steam figures: ', h('a', { href: 'https://www.steampageanalyzer.com/blog/cozy-games-steam-2026-niche-report', target: '_blank', rel: 'noopener' }, 'Steam Page Analyzer'), ' (niche data to 27 Sep 2026), ', h('a', { href: 'https://newsletter.gamediscover.co/p/how-tiny-glade-built-its-way-to-600k', target: '_blank', rel: 'noopener' }, 'GameDiscoverCo'), ', ', h('a', { href: 'https://app2top.com/news/over-a-million-copies-of-quarantine-zone-the-last-check-have-been-sold-in-three-months-289337.html', target: '_blank', rel: 'noopener' }, 'App2Top'), '. Review counts from the Steam store on 12 Nov 2026. Sales figures are third-party estimates.')));
  document.body.append(wrap);

  try { await document.fonts.ready; } catch {}
  const studio = new K.Studio(); const live = [];
  for (const j of jobs) {
    try { live.push(studio.attach(j.cv, j.build(), j.stage, j.cam)); } catch (e) { console.error('render failed', e); }
    await new Promise((r) => requestAnimationFrame(() => r()));
  }
  let lastW = innerWidth, t = 0;
  addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(innerWidth - lastW) < 40) return; lastW = innerWidth; live.forEach((l) => { l.stage.cam = null; l.redraw(); }); }, 250); });
  document.body.dataset.done = '1';
}
