// Lost Property — board 3. Every build() returns a fresh Object3D. Front of things faces +Z.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng } = K;

// --- local palette
const C = {
  green: '#2e5e4e', greenLt: '#4c8a70', greenDk: '#22463a', buff: '#efd9a8', red: '#c8402e', brass: '#d4a237', grey: '#a8a49b', greyDk: '#7c786f',
  tag: '#e2c084', cream: '#f4ead4', sea: '#5aa6b8', seaLn: '#a3d6df', sand: '#ecd3a0', stone: '#c9bfae', ballast: '#8f8578', sleeper: '#6e5440', blue: '#3f6fb3', duck: '#f1c232',
};

// --- helpers
const mt = (c) => (c && c.isMaterial ? c : K.mat(c));
/** Box whose top sits at y=0, with per-face colours (px, nx, top, pz, nz, side). */
const slab = (w, h, d, f) => grp(box(w, h, d, [mt(f.px ?? f.side), mt(f.nx ?? f.side), mt(f.top), mt(f.side), mt(f.pz ?? f.side), mt(f.nz ?? f.side)]).at(0, -h, 0));
/** Board with a hand-drawn face on +Z. */
function plate(w, h, draw, o = {}) {
  const side = mt(o.frame ?? P.woodDk), face = texMat(tex.custom(512, Math.round(512 * h / w), draw));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, o.d ?? 0.04).translate(0, h / 2, 0), [side, side, side, side, face, side]);
  m.castShadow = m.receiveShadow = true; return m;
}
/** Write text centred, shrinking it to fit the width. */
function say(x, t, cx, cy, px, maxW, wt = 800, fam = '"Bricolage Grotesque", sans-serif') { x.font = `${wt} ${px}px ${fam}`; const m = x.measureText(t).width; if (m > maxW) x.font = `${wt} ${px * maxW / m}px ${fam}`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(t, cx, cy); }
const enamel = (txt, w, h, bg = C.red, fg = C.cream) => plate(w, h, (x, W, H) => { x.fillStyle = P.ink; x.fillRect(0, 0, W, H); x.fillStyle = bg; x.beginPath(); x.roundRect(6, 6, W - 12, H - 12, H * 0.16); x.fill(); x.strokeStyle = fg; x.lineWidth = Math.max(4, H * 0.04); x.beginPath(); x.roundRect(H * 0.1, H * 0.1, W - H * 0.2, H - H * 0.2, H * 0.1); x.stroke(); x.fillStyle = fg; say(x, txt, W / 2, H / 2 + 3, H * 0.5, W * 0.86); }, { frame: P.ink });
const platformMat = (w, d) => texMat(tex.tiles({ base: C.grey, line: C.greyDk, n: 6, rep: [Math.max(1, w / 1.6), Math.max(1, d / 1.6)] }));
const brickMat = (w, h) => texMat(tex.bricks({ base: '#b65a3e', mortar: '#e4cfae', rows: 5, cols: 6, rep: [Math.max(1, w / 1.5), Math.max(1, h / 0.7)] }));

// --- lost things (base on y=0, about knee-high at scale 1)
const tagS = (c = C.tag) => grp(box(0.1, 0.055, 0.008, c), cyl(0.009, 0.009, 0.01, P.ink2, { seg: 6 }).rot(deg(90), 0, 0).at(-0.035, 0.028, 0).noInk());
function bigTag(txt = 'No. 112', w = 0.34, h = 0.18) {
  return plate(w, h, (x, W, H) => { x.fillStyle = C.tag; x.fillRect(0, 0, W, H); x.fillStyle = '#c9a466'; x.beginPath(); x.arc(H * 0.32, H / 2, H * 0.16, 0, 7); x.fill(); x.fillStyle = P.white; x.beginPath(); x.arc(H * 0.32, H / 2, H * 0.08, 0, 7); x.fill(); x.fillStyle = P.ink; say(x, txt, W * 0.58, H / 2 + 2, H * 0.42, W * 0.66, 700, '"DM Mono", monospace'); }, { frame: C.tag, d: 0.01 });
}
function teddy(c = '#b07a48', s = 1) {
  const g = grp(sph(0.13, c, { seg: 16 }).sc(1, 1.1, 0.9).at(0, 0.15, 0), sph(0.11, c, { seg: 16 }).at(0, 0.36, 0), sph(0.05, P.cream, { seg: 10 }).sc(1, 0.8, 0.7).at(0, 0.34, 0.09));
  [-1, 1].forEach((k) => g.add(sph(0.045, c, { seg: 10 }).at(k * 0.085, 0.45, -0.01), sph(0.05, c, { seg: 10 }).sc(1, 1.5, 1).at(k * 0.14, 0.18, 0.03), sph(0.06, c, { seg: 10 }).sc(1, 0.8, 1.3).at(k * 0.07, 0.04, 0.07), sph(0.014, P.ink, { seg: 6 }).at(k * 0.04, 0.39, 0.095).noInk()));
  g.add(sph(0.016, P.ink, { seg: 6 }).at(0, 0.355, 0.135).noInk(), grp(cone(0.035, 0.06, C.red, { seg: 4 }).rot(0, 0, deg(90)).at(0.03, 0, 0), cone(0.035, 0.06, C.red, { seg: 4 }).rot(0, 0, deg(-90)).at(-0.03, 0, 0)).at(0, 0.27, 0.1));
  return g.sc(s);
}
function brolly(c = C.blue, s = 1, handle = 'duck') {
  const g = grp(cyl(0.01, 0.012, 0.08, P.steel, { seg: 6 }), cone(0.07, 0.56, c, { seg: 8 }).rot(deg(180), 0, 0).at(0, 0.62, 0), cone(0.075, 0.05, c, { seg: 8 }).at(0, 0.6, 0), cyl(0.012, 0.012, 0.12, P.ink2, { seg: 6 }).at(0, 0.64, 0));
  if (handle === 'duck') g.add(sph(0.05, C.duck, { seg: 12 }).at(0, 0.8, 0), cone(0.025, 0.06, P.orange, { seg: 6 }).rot(0, 0, deg(-90)).at(0.04, 0.8, 0), sph(0.01, P.ink, { seg: 6 }).at(0.025, 0.82, 0.04).noInk());
  else g.add(torus(0.05, 0.014, P.woodDk, { arc: Math.PI, ts: 14 }).at(0.05, 0.76, 0));
  return g.sc(s);
}
function suitcase(c = '#b5683a', w = 0.5, h = 0.34, d = 0.16) {
  return grp(rbox(w, h, d, c, { r: 0.04 }), torus(0.05, 0.014, P.ink2, { arc: Math.PI, ts: 12 }).at(0, h, 0), box(0.03, h + 0.01, d + 0.01, '#6b3a22').at(-w * 0.28, 0, 0), box(0.03, h + 0.01, d + 0.01, '#6b3a22').at(w * 0.28, 0, 0), tagS().rot(0, 0, 0.3).at(0.08, h - 0.07, d / 2 + 0.01));
}
function trunk(c = C.green) {
  return grp(rbox(0.7, 0.4, 0.4, c, { r: 0.03 }), box(0.72, 0.04, 0.42, P.woodDk).at(0, 0.12, 0), box(0.72, 0.04, 0.42, P.woodDk).at(0, 0.3, 0), ...[-1, 1].map((k) => box(0.05, 0.08, 0.05, C.brass).at(k * 0.33, 0.33, 0.19)), box(0.08, 0.08, 0.02, C.brass).at(0, 0.28, 0.205));
}
function hatbox(s = 1) { return grp(cyl(0.17, 0.17, 0.2, texMat(tex.stripes({ colors: [P.pink, P.white], n: 12 })), { seg: 20 }), cyl(0.18, 0.18, 0.05, P.pink, { seg: 20 }).at(0, 0.2, 0), torus(0.06, 0.015, C.red, { ts: 12 }).rot(deg(90), 0, 0).at(0, 0.25, 0)).sc(s); }
function bowler(c = P.ink2) { return grp(cyl(0.16, 0.16, 0.02, c, { seg: 20 }).sc(1, 1, 0.85), sph(0.1, c, { part: 'top', seg: 16 }).sc(1, 1.1, 0.9).at(0, 0.02, 0), cyl(0.102, 0.102, 0.025, C.red, { seg: 16 }).sc(1, 1, 0.9).at(0, 0.02, 0)); }
function boater() { return grp(cyl(0.18, 0.18, 0.02, P.butter, { seg: 20 }), cyl(0.1, 0.105, 0.08, P.butter, { seg: 18 }).at(0, 0.02, 0), cyl(0.106, 0.106, 0.03, P.navy, { seg: 18 }).at(0, 0.03, 0)); }
function boot(c = P.red) { return grp(cyl(0.065, 0.07, 0.24, c, { seg: 12 }).at(0, 0.04, 0), rbox(0.18, 0.08, 0.12, c, { r: 0.035 }).at(0.04, 0, 0), cyl(0.07, 0.07, 0.02, P.ink2, { seg: 12 }).at(0, 0.27, 0)); }
function creel() {
  const wick = texMat(tex.custom(128, 128, (x, w) => { x.fillStyle = P.cork; x.fillRect(0, 0, w, w); x.strokeStyle = P.woodDk; x.lineWidth = 4; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, i * 16 + 8); x.lineTo(w, i * 16 + 8); x.stroke(); } }));
  return grp(rbox(0.34, 0.22, 0.22, wick, { r: 0.04 }), rbox(0.36, 0.04, 0.24, P.woodDk, { r: 0.02 }).at(0, 0.22, 0), K.fish({ color: C.sea, fin: P.coral }).sc(0.35).rot(0, 0, 0.6).at(0.2, 0.2, 0.05), torus(0.16, 0.012, P.woodDk, { arc: Math.PI, ts: 16 }).at(0, 0.25, 0));
}
function birdcage() {
  const g = grp(cyl(0.15, 0.16, 0.04, C.brass, { seg: 18 }), sph(0.15, C.brass, { part: 'top', seg: 16 }).sc(1, 0.6, 1).at(0, 0.36, 0), torus(0.035, 0.01, C.brass, { ts: 10 }).at(0, 0.48, 0), K.bird({ color: P.butter, wing: P.mustard, beak: P.orange }).sc(0.5).at(0, 0.12, 0));
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; g.add(cyl(0.006, 0.006, 0.33, C.brass, { seg: 4 }).at(Math.cos(a) * 0.145, 0.04, Math.sin(a) * 0.145).noInk()); }
  return g;
}
function scarf(c1 = C.red, c2 = P.cream) { return grp(torus(0.1, 0.035, texMat(tex.stripes({ colors: [c1, c2], n: 10 })), { ts: 20 }).rot(deg(90), 0, 0).sc(1.2, 1, 0.8).at(0, 0.035, 0), box(0.08, 0.02, 0.26, c1).rot(0, 0.4, 0).at(0.1, 0.0, 0.14)); }
function glove(c = C.red) { return grp(rbox(0.11, 0.03, 0.12, c, { r: 0.012 }), ...[0, 1, 2, 3].map((i) => cap(0.016, 0.05, c, { seg: 6 }).rot(deg(90), 0, 0).at(-0.04 + i * 0.027, 0.016, 0.06)), cap(0.016, 0.04, c, { seg: 6 }).rot(deg(90), deg(-50), 0).at(0.06, 0.016, 0.0)); }
function books() { return grp(box(0.26, 0.05, 0.18, P.navy), box(0.24, 0.045, 0.17, C.red).rot(0, 0.15, 0).at(0, 0.05, 0), box(0.25, 0.05, 0.17, C.green).rot(0, -0.1, 0).at(0, 0.095, 0)); }

// --- station pieces
function railing(len, c = C.green) {
  const g = grp(box(len, 0.05, 0.05, c).at(0, 0.85, 0), box(len, 0.04, 0.04, c).at(0, 0.45, 0));
  const n = Math.round(len / 0.22); for (let i = 0; i <= n; i++) g.add(cyl(0.016, 0.016, 0.85, c, { seg: 6 }).at(-len / 2 + (i / n) * len, 0, 0));
  return g;
}
function track(len) {
  const g = grp();
  for (let x = -len / 2 + 0.15; x < len / 2; x += 0.42) g.add(box(0.2, 0.06, 1.2, C.sleeper).at(x, 0, 0));
  [-0.4, 0.4].forEach((z) => g.add(box(len, 0.08, 0.07, P.steel).at(0, 0.06, z)));
  return g;
}
function puff(s = 1) { return grp(sph(0.2, '#f6f2ea', { seg: 14 }), sph(0.15, '#f6f2ea', { seg: 12 }).at(0.16, 0.06, 0), sph(0.13, '#f6f2ea', { seg: 12 }).at(-0.13, 0.08, 0.04)).weld().sc(s); }
function steamTrail(n = 4, dir = 1) { const g = grp(); for (let i = 0; i < n; i++) g.add(puff(0.8 + i * 0.25).at(dir * i * 0.45, i * 0.32, (i % 2 ? 0.1 : -0.08))); return g; }
/** Tank engine, front faces +X. Rail top at y=0, gauge 0.8. */
function loco(o = {}) {
  const G = C.green, g = grp();
  g.add(box(2.3, 0.16, 0.84, P.ink2).at(0, 0.24, 0));
  [-1, 1].forEach((s) => {
    g.add(box(0.1, 0.24, 1.0, C.red).at(s * 1.18, 0.2, 0));
    [-0.3, 0.3].forEach((z) => g.add(cyl(0.045, 0.045, 0.14, P.ink2, { seg: 10 }).rot(0, 0, s * deg(-90)).at(s * 1.23, 0.32, z), cyl(0.08, 0.08, 0.03, P.steel, { seg: 14 }).rot(0, 0, s * deg(-90)).at(s * 1.36, 0.32, z)));
  });
  [-0.62, 0, 0.62].forEach((x) => [-1, 1].forEach((s) => g.add(grp(K.wheel(0.22, 0.07, C.red, P.ink2), torus(0.215, 0.03, P.ink2, { ts: 24 }).at(0, 0, s * 0.0), sph(0.03, P.steel, { seg: 8 }).at(0.1, 0.06, s * 0.05)).at(x, 0.22, s * 0.46))));
  [-1, 1].forEach((s) => g.add(box(1.36, 0.04, 0.03, P.steel).at(0.05, 0.27, s * 0.52)));
  // boiler, smokebox, chimney, dome
  g.add(cyl(0.34, 0.34, 1.05, G, { seg: 24 }).rot(0, 0, deg(-90)).at(-0.2, 0.74, 0));
  [0.1, 0.5].forEach((x) => g.add(torus(0.345, 0.02, C.brass, { ts: 28 }).rot(0, deg(90), 0).at(x, 0.74, 0)));
  g.add(cyl(0.36, 0.36, 0.32, P.ink2, { seg: 24 }).rot(0, 0, deg(-90)).at(0.85, 0.74, 0), cyl(0.3, 0.3, 0.04, P.ink2, { seg: 24 }).rot(0, 0, deg(-90)).at(1.17, 0.74, 0), sph(0.03, C.brass, { seg: 8 }).at(1.22, 0.74, 0));
  g.add(cyl(0.1, 0.13, 0.32, P.ink2, { seg: 14 }).at(1.0, 1.04, 0), cyl(0.15, 0.11, 0.07, '#c2703d', { seg: 14 }).at(1.0, 1.35, 0));
  g.add(cyl(0.13, 0.15, 0.08, G, { seg: 14 }).at(0.32, 1.04, 0), sph(0.13, C.brass, { part: 'top', seg: 16 }).sc(1, 1.2, 1).at(0.32, 1.11, 0));
  // side tanks with lining and a brass nameplate
  [-1, 1].forEach((s) => g.add(grp(rbox(0.95, 0.5, 0.25, G, { r: 0.04 }), box(0.82, 0.37, 0.01, C.cream).at(0, 0.065, s * 0.126), box(0.78, 0.33, 0.01, G).at(0, 0.085, s * 0.131)).weld().at(0.3, 0.4, s * 0.36)));
  g.add(plate(0.5, 0.11, (x, w, h) => { x.fillStyle = C.brass; x.fillRect(0, 0, w, h); x.fillStyle = P.ink2; say(x, 'BRAMBLE', w / 2, h / 2 + 2, h * 0.7, w * 0.9); }, { frame: C.brass, d: 0.015 }).at(0.3, 0.58, 0.495));
  // cab and bunker
  g.add(grp(box(0.72, 0.92, 0.94, G).at(-0.58, 0.32, 0), box(0.72, 0.05, 0.95, C.cream).at(-0.58, 0.62, 0)).weld());
  [-1, 1].forEach((s) => g.add(box(0.3, 0.3, 0.01, P.ink2).at(-0.62, 0.86, s * 0.475).noInk()));
  g.add(rbox(0.9, 0.08, 1.06, P.ink2, { r: 0.03 }).at(-0.58, 1.24, 0));
  [-1, 1].forEach((s) => g.add(cyl(0.09, 0.09, 0.02, P.glass, { seg: 14 }).rot(0, 0, deg(-90)).at(-0.21, 1.05, s * 0.24), torus(0.09, 0.018, C.brass, { ts: 16 }).rot(0, deg(90), 0).at(-0.2, 1.05, s * 0.24)));
  g.add(plate(0.2, 0.2, (x, w, h) => { x.fillStyle = G; x.fillRect(0, 0, w, h); x.fillStyle = C.brass; say(x, '4', w / 2, h / 2 + 4, h * 0.8, w); }, { frame: G, d: 0.01 }).at(-0.4, 0.4, 0.475));
  g.add(box(0.32, 0.56, 0.9, G).at(-1.08, 0.32, 0));
  const r = rng(3); for (let i = 0; i < 6; i++) g.add(K.rock(0.09, P.ink2, i + 2).at(-1.08 + (r() - 0.5) * 0.18, 0.86, (r() - 0.5) * 0.6));
  g.add(cyl(0.025, 0.03, 0.12, C.brass, { seg: 8 }).at(-0.3, 1.0, 0.15), grp(box(0.12, 0.14, 0.1, P.white), cyl(0.04, 0.04, 0.02, K.glow(P.butter), { seg: 10 }).rot(0, 0, deg(-90)).at(0.06, 0.07, 0)).at(1.2, 0.32, 0));
  if (o.steam) g.add(steamTrail(4, -1).at(1.0, 1.65, 0));
  return g;
}
/** Branch-line carriage, green and cream, faces +X. Rail top at y=0. */
function carriage(o = {}) {
  const L = o.len ?? 2.4, G = C.green, g = grp();
  g.add(box(L - 0.2, 0.14, 0.8, P.ink2).at(0, 0.24, 0));
  [-1, 1].forEach((e) => {
    [-0.22, 0.22].forEach((dx) => [-1, 1].forEach((s) => g.add(K.wheel(0.16, 0.06, P.ink2, P.steel).at(e * (L / 2 - 0.45) + dx, 0.16, s * 0.44))));
    [-0.3, 0.3].forEach((z) => g.add(cyl(0.045, 0.045, 0.12, P.ink2, { seg: 10 }).rot(0, 0, e * deg(-90)).at(e * (L / 2 - 0.02), 0.36, z), cyl(0.075, 0.075, 0.03, P.steel, { seg: 14 }).rot(0, 0, e * deg(-90)).at(e * (L / 2 + 0.1), 0.36, z)));
  });
  g.add(box(L, 0.42, 1.0, G).at(0, 0.38, 0), box(L, 0.52, 1.0, C.cream).at(0, 0.8, 0));
  g.add(rbox(L + 0.06, 0.16, 1.06, '#8e9296', { r: 0.07 }).at(0, 1.3, 0));
  const n = Math.max(3, Math.round(L / 0.48));
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * (L / n);
    [-1, 1].forEach((s) => g.add(rbox(L / n - 0.16, 0.26, 0.02, P.glass, { r: 0.04 }).at(x, 0.86, s * 0.5)));
    if (i % 2 === 0) [-1, 1].forEach((s) => g.add(box(0.012, 0.86, 0.012, P.ink2).at(x - L / n / 2 + 0.02, 0.4, s * 0.506).noInk()));
  }
  if (o.faces) { const fr = rng(7); [[-0.5, P.skin2, P.hairBrown], [0.45, P.skin1, P.hairBlonde]].forEach(([x, sk, hr]) => g.add(sph(0.1, sk, { seg: 12 }).at(x, 0.98, 0.44), sph(0.105, hr, { part: 'top', seg: 12 }).at(x, 1.01, 0.43))); fr(); }
  g.add(plate(0.9, 0.12, (x, w, h) => { x.fillStyle = P.white; x.fillRect(0, 0, w, h); x.fillStyle = P.ink; say(x, 'SALTHAVEN', w / 2, h / 2 + 2, h * 0.7, w * 0.9); }, { frame: P.ink2, d: 0.01 }).at(0, 1.15, 0.51));
  return g;
}
function trainSet(o = {}) {
  const g = grp(loco({ steam: o.steam }).at(0, 0.14, 0), carriage({ len: o.len ?? 2.4, faces: true }).at(-1.32 - (o.len ?? 2.4) / 2 - 0.1, 0.14, 0));
  if (o.track) g.add(track(o.track).at(o.trackX ?? -1.5, 0, 0));
  return g;
}
function nameBoard(txt = 'SALTHAVEN', w = 1.6) { return grp(enamel(txt, w, 0.34, C.green, P.white).at(0, 1.0, 0), box(0.06, 1.38, 0.06, C.green).at(-w / 2 + 0.1, 0, -0.04), box(0.06, 1.38, 0.06, C.green).at(w / 2 - 0.1, 0, -0.04)); }
function clockFace(r = 0.2) {
  const t = tex.custom(256, 256, (x, w) => {
    x.fillStyle = P.ink; x.fillRect(0, 0, w, w); x.translate(w / 2, w / 2); x.rotate(-Math.PI / 2);
    x.fillStyle = P.white; x.beginPath(); x.arc(0, 0, w * 0.46, 0, 7); x.fill();
    x.strokeStyle = P.ink; x.lineCap = 'round';
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; x.lineWidth = i % 3 ? 6 : 12; x.beginPath(); x.moveTo(Math.sin(a) * w * 0.34, -Math.cos(a) * w * 0.34); x.lineTo(Math.sin(a) * w * 0.42, -Math.cos(a) * w * 0.42); x.stroke(); }
    const hand = (a, l, lw) => { x.lineWidth = lw; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.sin(a) * l, -Math.cos(a) * l); x.stroke(); };
    hand(((12 + 4 / 60) / 12) * Math.PI * 2, w * 0.22, 14); hand((4 / 60) * Math.PI * 2, w * 0.34, 9);
    x.fillStyle = C.red; x.beginPath(); x.arc(0, 0, 10, 0, 7); x.fill();
  });
  const side = mt(C.green), face = texMat(t);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.1, 28).rotateX(Math.PI / 2), [side, face, face]);
  m.castShadow = m.receiveShadow = true; return m;
}
function hangingClock() { return grp(clockFace(0.22).at(0, 0, 0), torus(0.225, 0.025, C.brass, { ts: 28 }).at(0, 0, 0.05), torus(0.225, 0.025, C.brass, { ts: 28 }).at(0, 0, -0.05), cyl(0.02, 0.02, 0.3, C.green, { seg: 6 }).at(0, 0.2, 0)); }
function clockPost() { return grp(cyl(0.08, 0.1, 0.2, C.green, { seg: 12 }), cyl(0.045, 0.05, 1.8, C.green, { seg: 10 }), box(0.5, 0.05, 0.05, C.green).at(0.18, 1.75, 0), grp(hangingClock()).at(0.36, 1.3, 0)); }
function lampPost(h = 2.0) { return grp(cyl(0.08, 0.1, 0.18, C.green, { seg: 12 }), cyl(0.04, 0.05, h, C.green, { seg: 10 }), grp(K.lantern(C.green, P.butter)).sc(1.3).at(0, h, 0), enamel('1', 0.24, 0.24, C.green, P.white).at(0, h * 0.62, 0.05)); }
function bench(w = 1.3) {
  const slats = grp(...[0, 1, 2].map((i) => box(w, 0.04, 0.1, P.wood).at(0, 0.42, -0.12 + i * 0.12)), ...[0, 1].map((i) => box(w, 0.1, 0.03, P.wood).at(0, 0.58 + i * 0.13, -0.2).rot(-0.15, 0, 0)));
  [-1, 1].forEach((s) => slats.add(extrude([[0, 0], [0.06, 0], [0.04, 0.42], [-0.16, 0.42], [-0.18, 0.44], [-0.2, 0.86], [-0.24, 0.86], [-0.2, 0.42], [0.0, 0.42]], 0.05, C.green).rot(0, deg(-90), 0).at(s * (w / 2 - 0.08), 0, 0.02)));
  return slats;
}
function trolley(o = {}) {
  const g = grp(box(1.5, 0.08, 0.7, texMat(tex.planks({ base: P.woodLt, line: P.wood, n: 5, vertical: true }))).at(0, 0.34, 0), box(1.5, 0.12, 0.05, P.woodDk).at(0, 0.32, 0.35), box(1.5, 0.12, 0.05, P.woodDk).at(0, 0.32, -0.35));
  [-1, 1].forEach((s) => g.add(K.wheel(0.26, 0.06, P.iron, C.red).at(0.15, 0.26, s * 0.42), cyl(0.025, 0.025, 0.34, P.iron, { seg: 6 }).at(-0.62, 0, s * 0.28)));
  g.add(cyl(0.03, 0.03, 0.9, P.woodDk, { seg: 8 }).rot(0, 0, deg(-62)).at(0.75, 0.38, 0.18), cyl(0.03, 0.03, 0.9, P.woodDk, { seg: 8 }).rot(0, 0, deg(-62)).at(0.75, 0.38, -0.18), cyl(0.03, 0.03, 0.5, P.woodDk, { seg: 8 }).rot(deg(90), 0, 0).at(1.55, 0.8, -0.25));
  if (o.load !== false) {
    g.add(trunk(C.green).at(-0.25, 0.42, 0), suitcase('#b5683a').at(0.42, 0.42, 0.12), suitcase(C.red, 0.42, 0.3, 0.15).rot(0, 0.15, 0).at(0.4, 0.42, -0.15));
    g.add(suitcase(C.buff, 0.46, 0.3, 0.15).rot(0, 0, 0).at(-0.3, 0.82, 0.05), hatbox(0.8).at(0.38, 0.76, 0.05), birdcage().sc(0.75).at(-0.3, 1.12, 0.02));
    g.add(brolly(P.ink2, 0.9, 'crook').rot(deg(-12), 0, deg(-14)).at(0.7, 0.42, 0.26), bigTag('No. 87', 0.22, 0.12).rot(0, 0, 0.2).at(-0.48, 0.55, 0.22));
  }
  return g;
}
function pigeonholes(cols, rows, cw, ch, dep, fill, seed = 3) {
  const g = grp(), W = cols * cw, H = rows * ch, wood = P.woodDk, inner = '#c99b62';
  g.add(box(W + 0.06, H + 0.06, 0.03, inner).at(0, 0, -dep / 2 + 0.015));
  for (let i = 0; i <= cols; i++) g.add(box(0.03, H + 0.06, dep, wood).at(-W / 2 + i * cw, 0, 0));
  for (let j = 0; j <= rows; j++) g.add(box(W + 0.06, 0.03, dep, wood).at(0, j * ch, 0));
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const it = fill(i, j); if (it) g.add(it.at(-W / 2 + (i + 0.5) * cw, j * ch + 0.03, 0.0));
    g.add(box(0.1, 0.045, 0.01, C.brass).at(-W / 2 + (i + 0.5) * cw, j * ch - 0.012, dep / 2 + 0.005).noInk());
  }
  return g;
}
const SHELF_ITEMS = [() => teddy('#b07a48', 0.55), () => brolly(C.blue, 0.42).rot(0, 0, deg(80)).at(0, 0.05, 0), () => bowler(), () => hatbox(0.6), () => boot(), () => suitcase(C.red, 0.32, 0.22, 0.12), () => books(), () => creel().sc(0.7), () => boater(), () => glove(P.mustard).sc(1.4), () => scarf(P.blue, P.white), () => birdcage().sc(0.6), () => teddy(P.cream, 0.5), () => brolly(C.red, 0.42, 'crook').rot(0, 0, deg(80)).at(0, 0.05, 0), () => suitcase(C.green, 0.3, 0.2, 0.12), () => K.lantern(C.brass).sc(0.9)];

// --- the office booth (front +Z). Hatch counter on the left, door on the right.
function office(o = {}) {
  const w = 2.0, d = 1.3, h = 1.9, y0 = 0.16, g = grp();
  const hx0 = -0.78, hx1 = 0.22, hy0 = 0.62, hy1 = 1.22, zf = d / 2 - 0.03, hX = (hx0 + hx1) / 2;
  const boards = (W, H) => texMat(tex.planks({ base: C.green, line: C.greenDk, n: Math.max(2, Math.round(W * 7)), vertical: true }));
  g.add(box(w + 0.1, y0, d + 0.1, texMat(tex.bricks({ base: '#b65a3e', mortar: '#e4cfae', rows: 2, cols: 8 }))));
  g.add(grp(
    box(w, h, 0.06, boards(w)).at(0, y0, -zf), box(0.06, h, d, boards(d)).at(-w / 2 + 0.03, y0, 0), box(0.06, h, d, boards(d)).at(w / 2 - 0.03, y0, 0),
    box(hx0 + w / 2, h, 0.06, boards(0.2)).at((-w / 2 + hx0) / 2, y0, zf), box(w / 2 - hx1, h, 0.06, boards(0.8)).at((hx1 + w / 2) / 2, y0, zf),
    box(hx1 - hx0, hy0, 0.06, boards(1)).at(hX, y0, zf), box(hx1 - hx0, h - hy1, 0.06, boards(1)).at(hX, y0 + hy1, zf),
  ).weld());
  // cream trim: corners, hatch frame, skirting
  [-1, 1].forEach((s) => [-1, 1].forEach((t) => g.add(box(0.08, h, 0.08, C.cream).at(s * (w / 2 - 0.02), y0, t * (d / 2 - 0.02)))));
  g.add(box(hx1 - hx0 + 0.12, 0.06, 0.08, C.cream).at(hX, y0 + hy1, zf + 0.01), box(0.06, hy1 - hy0, 0.08, C.cream).at(hx0 - 0.03, y0 + hy0, zf + 0.01), box(0.06, hy1 - hy0, 0.08, C.cream).at(hx1 + 0.03, y0 + hy0, zf + 0.01));
  // inside: cream lining, floor, pigeonholes on the back wall
  g.add(box(w - 0.14, h - 0.05, 0.02, C.cream).at(0, y0, -zf + 0.05), box(w - 0.12, 0.02, d - 0.12, P.woodDk).at(0, y0, 0));
  const r = rng(5);
  g.add(pigeonholes(4, 3, 0.36, 0.3, 0.32, () => SHELF_ITEMS[Math.floor(r() * SHELF_ITEMS.length)]().sc(0.75)).at(hX + 0.05, y0 + 0.62, -zf + 0.22));
  // counter, roller blind, sign
  g.add(box(hx1 - hx0 + 0.24, 0.05, 0.36, P.woodLt).at(hX, y0 + hy0, zf + 0.12), ...[-1, 1].map((s) => box(0.04, 0.16, 0.2, P.woodDk).rot(deg(-35), 0, 0).at(hX + s * 0.4, y0 + hy0 - 0.17, zf + 0.06)));
  g.add(cyl(0.05, 0.05, hx1 - hx0, C.buff, { seg: 12 }).rot(0, 0, deg(90)).at(hx1, y0 + hy1 - 0.05, zf + 0.06));
  g.add(enamel('LOST PROPERTY', w - 0.12, 0.34).at(0, y0 + hy1 + 0.13, d / 2 + 0.03));
  // things on the counter: bell, ledger, tags
  const cy = y0 + hy0 + 0.05, cz = zf + 0.16;
  g.add(grp(cyl(0.05, 0.06, 0.02, P.ink2, { seg: 14 }), sph(0.05, C.brass, { part: 'top', seg: 14 }).at(0, 0.02, 0), sph(0.014, C.brass, { seg: 6 }).at(0, 0.075, 0)).at(hX + 0.36, cy, cz + 0.02));
  g.add(grp(box(0.36, 0.03, 0.26, C.red), box(0.16, 0.012, 0.24, P.white).at(-0.085, 0.03, 0).rot(0, 0, 0.05), box(0.16, 0.012, 0.24, P.white).at(0.085, 0.03, 0).rot(0, 0, -0.05)).rot(0, 0.15, 0).at(hX - 0.12, cy, cz));
  g.add(bigTag('No. 112', 0.2, 0.1).rot(deg(-90), 0, 0.3).at(hX + 0.16, cy + 0.006, cz + 0.06));
  // door with window and plate
  g.add(box(0.5, 1.25, 0.05, C.greenDk).at(0.6, y0, zf + 0.03), box(0.32, 0.36, 0.06, P.glass).at(0.6, y0 + 0.78, zf + 0.03), sph(0.03, C.brass, { seg: 8 }).at(0.42, y0 + 0.6, zf + 0.07));
  g.add(box(0.58, 0.06, 0.08, C.cream).at(0.6, y0 + 1.25, zf + 0.02));
  // roof: shallow slope with a dagger-board valance, stove pipe
  g.add(box(w + 0.3, 0.1, d + 0.36, '#6f7780').rot(deg(-6), 0, 0).at(0, y0 + h + 0.02, 0.0));
  for (let i = 0; i < 12; i++) g.add(extrude([[-0.07, 0], [0.07, 0], [0.07, -0.08], [0, -0.16], [-0.07, -0.08]], 0.02, i % 2 ? C.cream : C.green).at(-w / 2 - 0.08 + (i + 0.5) * ((w + 0.16) / 12), y0 + h + 0.04, d / 2 + 0.17));
  g.add(cyl(0.06, 0.06, 0.5, P.ink2, { seg: 10 }).at(-0.6, y0 + h, -0.35), cyl(0.1, 0.07, 0.06, P.ink2, { seg: 10 }).at(-0.6, y0 + h + 0.5, -0.35));
  // umbrella stand of unclaimed brollies by the door
  g.add(grp(cyl(0.13, 0.12, 0.34, C.brass, { seg: 16 }), brolly(C.red, 0.85, 'crook').rot(0.1, 0, 0.1).at(-0.04, 0.0, 0), brolly(C.blue, 0.9).rot(-0.08, 0, -0.12).at(0.04, 0, 0.02), brolly(P.ink2, 0.8, 'crook').rot(0.05, 0, -0.02).at(0.0, 0, -0.04)).at(w / 2 + 0.25, 0, d / 2 - 0.05));
  if (o.clerk) { o.clerk.traverse((m) => { m.receiveShadow = false; }); g.add(o.clerk.at(hX, 0.0, -0.12)); }
  return g;
}

// --- characters
const clerk = (o = {}) => K.person({ hairStyle: 'curly', hair: P.hairBrown, skin: P.skin2, top: C.green, sleeves: P.white, bottom: P.ink2, acc: ['glasses', 'bowtie'], pose: 'hold', held: bigTag('No. 112', 0.3, 0.15).rot(deg(-10), 0, 0.15).at(0, -0.04, 0), ...o });
const stationMaster = (o = {}) => K.person({ body: 'round', hairStyle: 'short', hair: P.hairGrey, skin: P.skin1, top: P.navy, bottom: P.navy, hat: 'captain', hatColor: P.navy, acc: ['moustache', 'badge'], beardColor: P.hairWhite, pose: 'wave', held: grp(K.flag(C.greenLt, 0.6).at(0, -0.12, 0)).rot(0, 0, -2.6), ...o });
const professor = (o = {}) => K.person({ body: 'tall', hairStyle: 'bob', hair: P.hairWhite, skin: P.skin1, top: P.plum, bottom: P.ink2, skirt: true, hat: 'beret', hatColor: P.mustard, acc: ['scarf', 'glasses', 'satchel'], accColor: C.red, pose: 'point', ...o });
function drawing() {
  return plate(0.34, 0.26, (x, w, h) => {
    x.fillStyle = P.white; x.fillRect(0, 0, w, h); x.lineWidth = 9; x.lineCap = 'round'; x.strokeStyle = '#8a5a34'; x.fillStyle = '#c98f5a';
    const c = (cx, cy, r) => { x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill(); x.stroke(); };
    c(w * 0.5, h * 0.66, h * 0.24); c(w * 0.36, h * 0.24, h * 0.08); c(w * 0.64, h * 0.24, h * 0.08); c(w * 0.5, h * 0.36, h * 0.17);
    x.fillStyle = P.ink; x.beginPath(); x.arc(w * 0.45, h * 0.34, 6, 0, 7); x.arc(w * 0.55, h * 0.34, 6, 0, 7); x.fill();
    x.strokeStyle = C.red; x.lineWidth = 12; x.beginPath(); x.moveTo(w * 0.42, h * 0.52); x.lineTo(w * 0.58, h * 0.56); x.stroke();
    x.strokeStyle = P.blue; x.lineWidth = 8; x.beginPath(); x.moveTo(w * 0.08, h * 0.95); x.lineTo(w * 0.92, h * 0.95); x.stroke();
  }, { frame: P.white, d: 0.01 });
}
const kid = (o = {}) => K.person({ body: 'kid', hairStyle: 'short', hair: P.hairBlack, skin: P.skin3, top: P.coral, bottom: P.sky, shoes: P.blue, hat: 'bucket', hatColor: P.butter, acc: ['backpack'], accColor: P.blue, pose: 'hold', held: drawing().rot(deg(-12), 0, 0).at(0, 0.02, 0.02), ...o });

// --- desk and shelves
function deskTop() {
  const g = grp();
  g.add(box(3.4, 0.3, 2.0, texMat(tex.planks({ base: P.wood, line: P.woodDk, n: 7 }))).at(0, -0.3, 0));
  g.add(box(2.1, 0.02, 1.2, C.green).at(-0.2, 0, 0.15), box(2.16, 0.012, 1.26, C.brass).at(-0.2, 0, 0.15));
  // banker's lamp
  const lamp = grp(cyl(0.16, 0.18, 0.05, C.brass, { seg: 18 }), cyl(0.02, 0.02, 0.5, C.brass, { seg: 8 }), box(0.04, 0.04, 0.16, C.brass).at(0, 0.48, 0.06), cyl(0.13, 0.13, 0.5, C.greenLt, { seg: 18, t0: -Math.PI / 2, tl: Math.PI, open: true, side: THREE.DoubleSide }).rot(deg(-90), 0, deg(90)).at(0.25, 0.5, 0.12), cyl(0.04, 0.04, 0.4, K.glow(P.butter), { seg: 10 }).rot(0, 0, deg(90)).at(0.2, 0.46, 0.12));
  g.add(lamp.at(-1.35, 0, -0.65));
  // ledger, open, with lines
  const lines = texMat(tex.custom(256, 256, (x, w) => { x.fillStyle = P.white; x.fillRect(0, 0, w, w); x.strokeStyle = '#9bb4d0'; x.lineWidth = 3; for (let i = 1; i < 12; i++) { x.beginPath(); x.moveTo(10, i * 21); x.lineTo(w - 10, i * 21); x.stroke(); } x.strokeStyle = C.red; x.beginPath(); x.moveTo(52, 0); x.lineTo(52, w); x.stroke(); x.fillStyle = P.ink; for (let i = 1; i < 8; i++) x.fillRect(64, i * 21 - 10, 40 + ((i * 37) % 90), 6); }));
  g.add(grp(box(0.96, 0.03, 0.66, C.red), box(0.45, 0.025, 0.62, lines).rot(0, 0, 0.04).at(-0.23, 0.03, 0), box(0.45, 0.025, 0.62, lines).rot(0, 0, -0.04).at(0.23, 0.03, 0)).rot(0, deg(-8), 0).at(-0.3, 0.02, 0.35));
  // stamp and ink pad
  g.add(grp(box(0.28, 0.03, 0.2, P.ink2), box(0.24, 0.012, 0.16, '#5a2a6e').at(0, 0.03, 0).noInk()).at(0.5, 0.02, 0.55));
  g.add(grp(box(0.14, 0.05, 0.1, P.ink2), lathe([[0.001, 0.05], [0.03, 0.05], [0.025, 0.14], [0.05, 0.18], [0.04, 0.22], [0.001, 0.23]], P.woodLt, { seg: 14 })).at(0.82, 0.02, 0.5));
  g.add(plate(0.3, 0.12, (x, w, h) => { x.fillStyle = P.white; x.fillRect(0, 0, w, h); x.strokeStyle = C.red; x.lineWidth = 7; x.strokeRect(8, 8, w - 16, h - 16); x.fillStyle = C.red; say(x, 'RETURNED', w / 2, h / 2 + 2, h * 0.5, w * 0.8); }, { frame: P.white, d: 0.004 }).rot(deg(-90), 0, 0.2).at(0.45, 0.02, 0.85));
  // the found things being tagged
  g.add(teddy('#b07a48', 1.0).rot(0, deg(10), 0).at(0.45, 0.02, -0.15), bigTag('No. 113', 0.24, 0.12).rot(deg(-80), 0, 0.5).at(0.62, 0.03, 0.08));
  g.add(brolly(C.blue, 1.0).rot(0, deg(30), deg(90)).at(-0.6, 0.08, -0.35), bigTag('No. 114', 0.24, 0.12).rot(deg(-85), 0, -0.2).at(-0.05, 0.03, -0.2));
  g.add(bowler().at(1.1, 0.02, -0.3), glove(C.red).rot(0, 0.6, 0).at(1.15, 0.02, 0.15), creel().rot(0, deg(-20), 0).at(1.2, 0.0, -0.75));
  // tag bundle and string
  for (let i = 0; i < 5; i++) g.add(box(0.2, 0.008, 0.11, C.tag).rot(0, i * 0.15 - 0.3, 0).at(-1.25, 0.02 + i * 0.01, 0.6));
  g.add(grp(cyl(0.07, 0.07, 0.1, P.cream, { seg: 14 }), cyl(0.03, 0.03, 0.11, P.woodLt, { seg: 10 })).at(-1.4, 0.0, 0.25), tube([[-1.35, 0.06, 0.29], [-1.2, 0.02, 0.4], [-1.18, 0.02, 0.56]], 0.006, P.cream).noInk());
  // claim ticket with the clues
  g.add(plate(0.5, 0.3, (x, w, h) => { x.fillStyle = C.buff; x.fillRect(0, 0, w, h); x.strokeStyle = C.red; x.lineWidth = 8; x.setLineDash([14, 10]); x.strokeRect(10, 10, w - 20, h - 20); x.setLineDash([]); x.fillStyle = C.red; say(x, 'CLAIM', w / 2, h * 0.22, h * 0.17, w * 0.8); x.fillStyle = P.ink; say(x, 'BLUE', w / 2, h * 0.44, h * 0.15, w * 0.8, 700); say(x, 'SMELLS OF FISH', w / 2, h * 0.62, h * 0.13, w * 0.8, 700); say(x, 'HAS A DUCK ON IT', w / 2, h * 0.8, h * 0.13, w * 0.8, 700); }, { frame: C.buff, d: 0.006 }).rot(deg(-90), 0, -0.1).at(-1.0, 0.02, 0.85));
  // counter bell
  g.add(grp(cyl(0.07, 0.08, 0.025, P.ink2, { seg: 14 }), sph(0.07, C.brass, { part: 'top', seg: 14 }).at(0, 0.025, 0), sph(0.018, C.brass, { seg: 6 }).at(0, 0.1, 0)).at(1.4, 0.0, 0.7));
  return g;
}
function shelfWall() {
  const g = grp();
  g.add(slab(6.0, 0.25, 2.6, { top: texMat(tex.planks({ base: P.woodLt, line: P.wood, n: 10, vertical: true, rep: [1, 1] })), side: P.woodDk }));
  g.add(box(6.0, 3.0, 0.1, C.cream).at(0, 0, -1.25), box(6.0, 0.2, 0.12, C.green).at(0, 0, -1.2));
  const order = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 2, 0, 5, 1];
  const r = rng(9);
  const ph = pigeonholes(6, 4, 0.72, 0.58, 0.55, (i, j) => { const k = order[(j * 6 + i) % order.length]; const it = SHELF_ITEMS[(k + j) % SHELF_ITEMS.length](); const t = tagS().sc(1.4).rot(0, 0, (r() - 0.5) * 0.6).at(0.24, 0.1, 0.24); return grp(it.sc(1.55), t); });
  g.add(ph.at(-0.4, 0.2, -0.9));
  g.add(enamel('LOST PROPERTY', 2.4, 0.4).at(-0.4, 2.62, -1.18));
  // rolling ladder, desk corner, crate of new arrivals, clerk on the ladder
  const ladder = grp(...[-1, 1].map((s) => box(0.05, 2.5, 0.05, P.woodDk).at(s * 0.22, 0, 0)), ...[0, 1, 2, 3, 4, 5, 6].map((i) => box(0.46, 0.04, 0.05, P.wood).at(0, 0.3 + i * 0.32, 0)));
  g.add(ladder.rot(deg(-14), 0, 0).at(1.6, 0, -0.05));
  g.add(clerk({ pose: 'carry', held: teddy('#b07a48', 0.8).at(0, -0.3, -0.05) }).sc(0.85).rot(0, deg(-20), 0).at(1.6, 0.94, 0.08));
  g.add(grp(box(1.4, 0.06, 0.8, P.wood).at(0, 0.76, 0), box(0.06, 0.76, 0.7, P.woodDk).at(-0.64, 0, 0), box(0.06, 0.76, 0.7, P.woodDk).at(0.64, 0, 0)).at(-1.9, 0, 0.55));
  g.add(grp(box(0.36, 0.03, 0.26, C.red), box(0.16, 0.012, 0.24, P.white).at(-0.085, 0.03, 0).rot(0, 0, 0.05), box(0.16, 0.012, 0.24, P.white).at(0.085, 0.03, 0).rot(0, 0, -0.05)).at(-2.1, 0.82, 0.55), K.lantern(C.brass).at(-1.4, 0.82, 0.4), suitcase(C.buff).rot(0, 0.3, 0).at(-1.75, 0.82, 0.6));
  g.add(K.crate(0.5).at(0.5, 0, 0.6), brolly(C.blue, 1.1).rot(deg(-20), 0, deg(-25)).at(0.55, 0.5, 0.6), teddy(P.cream, 0.7).at(0.4, 0.5, 0.75), hatbox().at(0.0, 0, 0.85), suitcase(C.red).rot(0, -0.3, 0).at(2.5, 0, 0.5));
  g.add(cyl(0.7, 0.7, 0.01, texMat(tex.stripes({ colors: [C.red, C.buff, C.green], n: 9 })), { seg: 28 }).sc(1.4, 1, 0.7).at(0.6, 0, 0.3));
  return g;
}

// --- scenes
function platformBlock(w, d, o = {}) {
  // platform top at y=0, edge facing +Z (the track side) in brick with a white coping line
  const h = o.h ?? 0.6, g = grp(slab(w, h, d, { top: platformMat(w, d), side: P.soil, pz: brickMat(w, h), nz: o.backFace ?? brickMat(w, h), nx: o.nx }));
  g.add(box(w, 0.05, 0.22, C.stone).at(0, 0, d / 2 - 0.09), box(w, 0.052, 0.06, P.white).at(0, 0, d / 2 - 0.2));
  return g;
}
const ballastMat = (w) => texMat(tex.speckle({ base: C.ballast, dots: ['#a69c8e', '#6f665b'], n: 160, size: 3, rep: [Math.max(1, w / 2.4), 1] }));
const seaMat = (w, d) => texMat(tex.waves({ base: C.sea, line: C.seaLn, rep: [Math.max(1, w / 3), Math.max(1, d / 3)] }));
function bufferStop() {
  const g = grp(box(0.34, 0.36, 1.3, C.sleeper), box(0.14, 0.24, 1.36, C.red).at(0.14, 0.36, 0));
  [-0.36, 0.36].forEach((z) => g.add(cyl(0.05, 0.05, 0.14, P.ink2, { seg: 10 }).rot(0, 0, deg(-90)).at(0.2, 0.48, z), cyl(0.09, 0.09, 0.03, P.steel, { seg: 14 }).rot(0, 0, deg(-90)).at(0.34, 0.48, z), box(0.07, 0.62, 0.07, P.ink2).rot(0, 0, deg(-40)).at(-0.3, 0.0, z)));
  g.add(grp(box(0.1, 0.1, 0.06, P.white), box(0.08, 0.08, 0.02, C.red).at(0, 0.01, 0.03)).at(0.1, 0.62, 0));
  return g;
}
function keyArt() {
  const g = grp(), W = 12.6, tx = 2.4;
  // track in front, platform in the middle, sea wall and sea behind the railings
  g.add(slab(W, 0.6, 1.7, { top: ballastMat(W), side: P.soil }).at(0, -0.6, 2.15));
  g.add(platformBlock(W, 2.9, { h: 1.2, backFace: mt(C.stone) }).at(0, 0, -0.15));
  g.add(slab(W, 1.08, 2.0, { top: seaMat(W, 2.0), side: P.seaDk }).at(0, -0.12, -2.6));
  g.add(railing(W - 0.2).at(0, 0, -1.55));
  // the office, hatch open, and the queue
  g.add(office({ clerk: clerk({ pose: 'wave', held: null }).sc(0.8) }).at(-3.6, 0, -0.8));
  g.add(professor().sc(0.8).rot(0, deg(-62), 0).at(-2.3, 0, 0.35), kid().sc(0.8).rot(0, deg(-40), 0).at(-1.55, 0, 0.55));
  g.add(K.person({ hairStyle: 'bun', hair: P.hairAuburn, skin: P.skin2, top: C.blue, bottom: P.navy, skirt: true, acc: ['earrings'], pose: 'hold', held: creel().sc(0.8).at(0, -0.1, 0) }).sc(0.8).rot(0, deg(-28), 0).at(-0.85, 0, 0.45));
  g.add(stationMaster().sc(0.8).rot(0, deg(12), 0).at(-0.1, 0, 1.0));
  g.add(grp(trunk(C.red).rot(0, 0.3, 0), suitcase(C.buff).rot(0, -0.2, 0).at(0.05, 0.4, 0.02), hatbox(0.8).at(-0.05, 0.74, 0), suitcase(C.green, 0.44, 0.3, 0.15).rot(0, 0.5, 0).at(0.1, 0, 0.5)).at(-5.4, 0, 0.0), nameBoard('SALTHAVEN', 1.6).at(-0.55, 0, -1.25), clockPost().at(1.05, 0, -1.05), lampPost(1.9).at(-2.05, 0, -1.3));
  g.add(bench(1.2).at(3.6, 0, -1.15), lampPost(1.9).at(5.4, 0, -1.3));
  g.add(K.bird({}).at(0.25, 0.88, -1.55), K.bird({}).rot(0, deg(150), 0).at(3.9, 0.88, -1.55));
  // the train steaming in
  g.add(grp(track(W / 1.25).at(tx / 1.25, 0, 0), loco({ steam: true }).at(0, 0.14, 0), carriage({ len: 1.8, faces: true }).at(-2.32, 0.14, 0)).rot(0, deg(180), 0).sc(1.25).at(tx, -0.6, 2.15));
  g.add(K.vehicle({ kind: 'boat', body: C.red, trim: P.white, mast: true, sail: P.cream, len: 1.6 }).sc(0.6).rot(0, deg(-20), 0).at(-1.6, -0.27, -2.75), K.bird({}).sc(0.7).at(2.2, -0.12, -2.8), sph(0.12, C.red, { seg: 12 }).at(4.4, -0.12, -2.5), sph(0.12, P.white, { seg: 12 }).at(-4.6, -0.12, -2.4));
  return g;
}
function platformNoon() {
  const g = grp(), tx = -0.93;
  // a seaside terminus: the line ends at the buffers, then the sea wall and the sea
  g.add(slab(1.4, 0.65, 4.6, { top: seaMat(1.4, 4.6), side: P.seaDk }).at(-4.3, -0.55, 0.3));
  g.add(slab(8.6, 0.6, 1.6, { top: ballastMat(8.6), side: P.soil, nx: mt(C.stone) }).at(0.7, -0.6, 1.8));
  g.add(platformBlock(8.6, 3.0, { h: 1.2, backFace: mt(C.stone), nx: mt(C.stone) }).at(0.7, 0, -0.5));
  g.add(railing(8.4).at(0.7, 0, -1.95), railing(2.9).rot(0, deg(90), 0).at(-3.52, 0, -0.5));
  g.add(bufferStop().sc(1.2).at(-3.3, -0.6, 1.8));
  // canopy on iron columns with a dagger-board valance
  const cx0 = -3.0, cx1 = 1.95, cl = cx1 - cx0, cm = (cx0 + cx1) / 2;
  for (let i = 0; i <= 3; i++) [-1.5, 0.45].forEach((z) => { const x = cx0 + (i * cl) / 3; g.add(cyl(0.06, 0.07, 2.2, C.green, { seg: 10 }).at(x, 0, z), cyl(0.1, 0.1, 0.12, C.green, { seg: 10 }).at(x, 0, z), box(0.05, 0.05, 0.5, C.green).rot(deg(30), 0, 0).at(x, 1.96, z + 0.12)); });
  g.add(box(cl + 0.6, 0.1, 2.6, '#6f7780').at(cm, 2.2, -0.55), box(cl + 0.6, 0.08, 2.6, C.cream).at(cm, 2.12, -0.55));
  const nb = Math.round((cl + 0.6) / 0.16);
  for (let i = 0; i < nb; i++) g.add(extrude([[-0.07, 0], [0.07, 0], [0.07, -0.1], [0, -0.2], [-0.07, -0.1]], 0.02, i % 2 ? C.cream : C.green).at(cx0 - 0.3 + (i + 0.5) * ((cl + 0.6) / nb), 2.22, 0.76));
  g.add(grp(hangingClock()).at(-0.55, 1.6, 0.45));
  // under the canopy: benches, a chocolate machine, people who found their things
  g.add(bench(1.1).at(-2.3, 0, -1.55), bench(1.1).at(0.4, 0, -1.55));
  g.add(grp(box(0.5, 1.1, 0.4, C.red), box(0.38, 0.5, 0.02, P.glass).at(0, 0.42, 0.2), plate(0.4, 0.14, (x, w, h) => { x.fillStyle = C.cream; x.fillRect(0, 0, w, h); x.fillStyle = C.red; say(x, 'CHOCOLATE', w / 2, h / 2 + 2, h * 0.6, w * 0.9); }, { frame: C.red, d: 0.01 }).at(0, 0.95, 0.205)).at(-1.0, 0, -1.6));
  g.add(professor({ pose: 'stand', held: brolly(C.blue, 1.0).at(0, -0.8, 0.04) }).sc(0.8).rot(0, deg(-35), 0).at(-2.45, 0, -0.7));
  g.add(kid({ pose: 'carry', held: teddy('#b07a48', 0.9).at(0, -0.25, -0.05) }).sc(0.8).rot(0, deg(-30), 0).at(-1.75, 0, -0.35));
  g.add(stationMaster().sc(0.8).rot(0, deg(-40), 0).at(0.9, 0, 0.55));
  g.add(trolley().sc(0.8).rot(0, deg(70), 0).at(3.2, 0, -0.5), nameBoard('SALTHAVEN', 1.5).at(3.4, 0, -1.65), lampPost(1.9).at(4.6, 0, -1.6));
  g.add(K.bird({}).at(-3.52, 0.88, 0.4), K.bird({}).rot(0, deg(40), 0).at(-4.5, -0.55, -1.0), sph(0.12, C.red, { seg: 12 }).at(-4.2, -0.55, 1.6));
  // the train standing at the platform, nose to the buffers
  g.add(grp(track(8.5 / 1.2).at((tx - 0.75) / 1.2, 0, 0), loco({ steam: false }).at(0, 0.14, 0), carriage({ len: 2.4, faces: true }).at(-2.82, 0.14, 0), puff(0.8).at(1.0, 1.7, 0.1)).rot(0, deg(180), 0).sc(1.2).at(tx, -0.6, 1.8));
  return g;
}

export default {
  slug: 'lost-property',
  title: 'Lost Property',
  logline: 'Run the lost property office at a seaside railway station. Every umbrella has an owner, and every owner has a story.',
  genre: ['Desk sim', 'Tidying', 'Light deduction'],
  theme: { accent: '#2e5e4e', cardBg: '#f1e6d0' },
  pitch: 'Trains bring in forgotten things all day. Tag each one and shelve it by type. When people reach the counter, use their clues ("blue, smells of fish, has a duck on it") to find the right thing. Full shelves earn you a bigger office, and now and then a mystery parcel nobody claims.',
  loop: ['Train pulls in, found things land on the desk', 'Tag them and shelve them by type', 'An owner describes it at the hatch', 'Find it, stamp the ledger, hand it over', 'Full shelves unlock a bigger office'],
  why: ['The desk view is the kite workbench camera, so the style is already proven there.', 'Dozens of small, chunky, different objects. Thick outlines make each one read at a glance.', 'Full, tidy shelves are satisfying to look at. No numbers needed.'],
  fromYou: 'You played Librarian and Sort Them Ducks, and Burger Joint already has the ticket UI. Desk sims sell: Quarantine Zone passed 1M in three months, Librarian 1.2M at $5.99.',
  similar: [
    { name: 'Papers, Please', url: 'https://store.steampowered.com/app/239030', note: 'the counter, the queue, the clues' },
    { name: 'A Little to the Left', url: 'https://store.steampowered.com/app/1629520', note: 'tidying and sorting for its own sake' },
    { name: 'Librarian', url: 'https://store.steampowered.com/app/4197610', note: 'shelve things in the right place, 1.2M sold' },
    { name: 'Duck Detective', url: 'https://store.steampowered.com/app/2637990', note: 'cosy deduction from small details' },
  ],
  palette: [['Station green', C.green], ['Ticket buff', C.buff], ['Enamel red', C.red], ['Brass', C.brass], ['Platform grey', C.grey], ['Manila tag', C.tag]],
  key: { build: () => keyArt(), bg: [[0, '#bfe0ea'], [0.6, '#eef0e4'], [1, '#f3ead6']], cam: { yaw: -24, pitch: 24, fov: 24 }, caption: 'Salthaven, the 12:04 pulling in' },
  characters: [
    { name: 'Nell', role: 'You. The clerk. Bow tie, sharp eyes, a tag for everything.', build: () => clerk() },
    { name: 'Mr Pennock', role: 'Station master. Has never once lost anything. Very proud of it.', build: () => stationMaster() },
    { name: 'Professor Brack', role: 'Loses an umbrella a week. Describes each one in great detail.', build: () => professor() },
    { name: 'Sami', role: 'Lost his bear on the 10:15. Brought a drawing, just in case.', build: () => kid() },
  ],
  builds: [
    { name: 'The office', tag: 'Building', note: 'Counter hatch, pigeonholes, bell and a stand of unclaimed umbrellas.', build: () => grp(platformBlock(3.4, 2.4, { h: 0.3 }), office()), cam: { yaw: -26, pitch: 18 } },
    { name: 'Bramble', tag: 'Vehicle', note: 'Branch-line tank engine and one carriage. Brings the lost things in.', build: () => grp(slab(6.4, 0.3, 1.8, { top: texMat(tex.speckle({ base: C.ballast, dots: ['#a69c8e', '#6f665b'], n: 160, size: 3, rep: [3, 1] })), side: P.soil }), trainSet({ steam: true, track: 6.4, trackX: -1.15 }).at(1.15, 0, 0)), cam: { yaw: -38, pitch: 22 } },
    { name: 'Luggage trolley', tag: 'Prop', note: 'Trunk, cases, a hatbox and a birdcage, every one tagged.', build: () => grp(platformBlock(2.6, 1.7, { h: 0.25 }), trolley().rot(0, deg(-10), 0)), cam: { yaw: -28, pitch: 20 } },
    { name: 'The sorting desk', tag: 'Prop', note: 'Ledger, stamp, tags and a claim ticket full of clues.', build: () => deskTop(), cam: { yaw: -6, pitch: 52 } },
  ],
  environments: [
    { name: 'Platform 1 at noon', note: 'Canopy, clock and benches. The line ends at the buffers, then the sea.', build: () => platformNoon(), stage: { bg: [[0, '#bfe0ea'], [0.7, '#eef0e4'], [1, '#f3ead6']] }, cam: { yaw: -36, pitch: 24 } },
    { name: 'The shelves, close up', note: 'Every hole numbered, every thing tagged. Full shelves look full.', build: () => shelfWall(), cam: { yaw: -10, pitch: 14, fov: 26 } },
  ],
};
