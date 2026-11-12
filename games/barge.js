// Fix-It Barge — board 2. Every build() returns a fresh Object3D. Front of things faces +Z.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng } = K;

// --- local palette
const C = {
  green: '#2f6b4f', greenDk: '#24523d', maroon: '#8e2f2f', brass: '#d4a237', cream: '#f3e6c6',
  stone: '#cdbfa3', stoneDk: '#9d8f77', water: '#5b8f8a', waterDk: '#3e6c68', waterLn: '#a6cbc2',
  leaf: '#d9822b', gold: '#e8b13c', rust: '#b4482c', hull: '#2f2b2a', grass: '#a7a557', grassDk: '#7f8543',
  towpath: '#d8c294', brick: '#b65a3e', slate: '#5f6872', bark: '#6e4630', rope: '#c9a46a', denim: '#4a6d91', roof: '#c8b791',
};

// --- helpers
const mt = (c) => (c && c.isMaterial ? c : K.mat(c));
/** Box whose top sits at y=0, with per-face colours (px, nx, top, pz, nz, side). */
const slab = (w, h, d, f) => grp(box(w, h, d, [mt(f.px ?? f.side), mt(f.nx ?? f.side), mt(f.top), mt(f.side), mt(f.pz ?? f.side), mt(f.nz ?? f.side)]).at(0, -h, 0));
/** Extrude a plan outline [[x, z]...] upwards by h (base on y=0). */
const plan = (pts, h, c) => { const m = extrude(pts, h, c).rot(deg(-90), 0, 0); m.position.y = h / 2; return grp(m); };
/** Board with a hand-drawn face on +Z. */
function plate(w, h, draw, o = {}) {
  const side = mt(o.frame ?? P.woodDk), face = texMat(tex.custom(512, Math.round(512 * h / w), draw));
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, o.d ?? 0.04).translate(0, h / 2, 0), [side, side, side, side, face, side]);
  m.castShadow = m.receiveShadow = true; return m;
}
const grassMat = (w, d) => texMat(tex.speckle({ base: C.grass, dots: [C.grassDk, C.leaf, C.gold, C.rust], n: 90, size: 4, seed: 4, rep: [Math.max(1, w / 2.2), Math.max(1, d / 2.2)] }));
const waterMat = (w, d) => texMat(tex.waves({ base: C.water, line: C.waterLn, rep: [Math.max(1, w / 3), Math.max(1, d / 3)] }));
const wallMat = (w, h) => texMat(tex.bricks({ base: C.stone, mortar: C.stoneDk, rows: 4, cols: 6, rep: [Math.max(1, w / 1.6), Math.max(1, h)] }));

// --- small props
function radio(o = {}) {
  const body = o.body ?? C.maroon;
  return grp(
    rbox(0.44, 0.3, 0.18, body, { r: 0.06 }),
    rbox(0.24, 0.2, 0.03, C.cream, { r: 0.02 }).at(-0.07, 0.05, 0.08),
    ...[0, 1, 2].map((i) => box(0.18, 0.014, 0.01, P.woodDk).at(-0.07, 0.09 + i * 0.045, 0.1).noInk()),
    cyl(0.055, 0.055, 0.02, P.butter, { seg: 16 }).rot(deg(90), 0, 0).at(0.13, 0.17, 0.085),
    box(0.006, 0.05, 0.01, C.maroon).at(0.13, 0.15, 0.106).rot(0, 0, 0.5).noInk(),
    cyl(0.028, 0.028, 0.03, P.ink2, { seg: 12 }).rot(deg(90), 0, 0).at(0.09, 0.06, 0.085),
    cyl(0.028, 0.028, 0.03, P.ink2, { seg: 12 }).rot(deg(90), 0, 0).at(0.17, 0.06, 0.085),
    torus(0.13, 0.018, P.ink2, { arc: Math.PI, ts: 16 }).at(0, 0.29, 0),
  );
}
function toaster() {
  return grp(rbox(0.3, 0.2, 0.17, P.steel, { r: 0.05 }), box(0.2, 0.01, 0.03, P.ink2).at(0, 0.2, -0.035).noInk(), box(0.2, 0.01, 0.03, P.ink2).at(0, 0.2, 0.035).noInk(),
    box(0.17, 0.12, 0.02, P.woodLt).at(0.0, 0.16, 0.035).rot(0, 0, 0.12), box(0.04, 0.03, 0.04, P.ink2).at(0.16, 0.12, 0), box(0.24, 0.02, 0.15, P.ink2).at(0, -0.01, 0));
}
function musicBox() {
  const g = grp(rbox(0.3, 0.16, 0.22, P.pink, { r: 0.03 }), box(0.31, 0.03, 0.23, P.mustard).at(0, 0.06, 0));
  g.add(grp(rbox(0.3, 0.03, 0.22, P.pink, { r: 0.012 }).at(0, 0, -0.11)).rot(deg(-70), 0, 0).at(0, 0.16, -0.11));
  g.add(cyl(0.05, 0.05, 0.02, P.butter, { seg: 14 }).at(0, 0.16, 0), cone(0.04, 0.07, P.white, { seg: 10 }).at(0, 0.18, 0), sph(0.022, P.skin1, { seg: 8 }).at(0, 0.27, 0));
  g.add(tube([[0.15, 0.08, 0.02], [0.2, 0.1, 0.05], [0.22, 0.16, 0.0], [0.2, 0.2, 0.06], [0.24, 0.24, 0.02]], 0.008, P.steel, { segs: 20 }));
  g.add(cyl(0.012, 0.012, 0.08, P.mustard, { seg: 6 }).rot(0, 0, deg(-90)).at(-0.15, 0.07, 0.04));
  return g;
}
function windlass() {
  return grp(cyl(0.03, 0.03, 0.2, P.woodLt, { seg: 8 }).at(0, -0.1, 0), box(0.05, 0.05, 0.42, P.iron).at(0, -0.14, 0.2), box(0.08, 0.1, 0.08, P.iron).at(0, -0.17, 0.42));
}
function ticket(txt = 'No. 7', w = 0.18, h = 0.11) {
  return plate(w, h, (x, W, H) => { x.fillStyle = C.cream; x.fillRect(0, 0, W, H); x.strokeStyle = C.maroon; x.lineWidth = 10; x.setLineDash([16, 10]); x.strokeRect(14, 14, W - 28, H - 28); x.fillStyle = P.ink; x.font = `800 ${H * 0.42}px "Bricolage Grotesque", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(txt, W / 2, H / 2 + 4); }, { frame: C.cream, d: 0.008 });
}
function buckbyCan() {
  return grp(lathe([[0.001, 0], [0.11, 0], [0.12, 0.08], [0.11, 0.26], [0.07, 0.3], [0.001, 0.3]], C.green, { seg: 18 }), cyl(0.121, 0.121, 0.05, C.maroon, { seg: 18 }).at(0, 0.12, 0),
    cyl(0.06, 0.06, 0.05, C.brass, { seg: 12 }).at(0, 0.29, 0), torus(0.07, 0.014, P.ink2, { arc: Math.PI, ts: 12 }).at(0, 0.34, 0), cyl(0.02, 0.03, 0.14, C.green, { seg: 8 }).rot(0, 0, deg(-55)).at(0.1, 0.18, 0));
}
const pot = (leaf = C.leaf, s = 0.6) => K.pottedPlant(P.terracotta, leaf, s);
const puff = (s = 1) => grp(sph(0.13, '#efe9de', { seg: 14 }), sph(0.1, '#efe9de', { seg: 12 }).at(0.1, 0.05, 0), sph(0.08, '#efe9de', { seg: 12 }).at(-0.08, 0.06, 0.03)).weld().sc(s);
function bollard() { return grp(cyl(0.07, 0.08, 0.22, P.ink2, { seg: 14 }), cyl(0.1, 0.1, 0.05, P.ink2, { seg: 14 }).at(0, 0.2, 0)); }
function reeds(seed = 2) {
  const r = rng(seed), g = grp();
  for (let i = 0; i < 3; i++) g.add(K.grassTuft(i % 2 ? C.grassDk : '#97994c', 0.34 + r() * 0.16).at((r() - 0.5) * 0.4, 0, (r() - 0.5) * 0.24));
  for (let i = 0; i < 2; i++) { const x = (r() - 0.5) * 0.3, z = (r() - 0.5) * 0.2, h = 0.5 + r() * 0.16; g.add(cyl(0.013, 0.013, h, C.grassDk, { seg: 5 }).at(x, 0, z), cap(0.034, 0.1, '#6b4128', { seg: 8 }).at(x, h - 0.06, z)); }
  return g;
}
function autumnTree(h = 2.6, seed = 3, cols = [C.leaf, C.gold, C.rust]) {
  const r = rng(seed), g = grp(cyl(0.05 * h / 2, 0.1 * h / 2, h * 0.6, C.bark, { seg: 10 }));
  g.add(cyl(0.02 * h, 0.03 * h, h * 0.25, C.bark, { seg: 7 }).rot(0, 0, deg(-40)).at(0.02, h * 0.35, 0), cyl(0.015 * h, 0.025 * h, h * 0.22, C.bark, { seg: 7 }).rot(deg(10), 0, deg(38)).at(-0.02, h * 0.42, 0));
  const crown = grp();
  for (let i = 0; i < 6; i++) { const a = i * 2.2 + r(), rr = h * (0.17 + r() * 0.08); crown.add(sph(rr, cols[i % cols.length], { seg: 14 }).at(Math.cos(a) * h * 0.17, h * (0.66 + r() * 0.16), Math.sin(a) * h * 0.13)); }
  g.add(crown.weld());
  return g;
}
function leafPile(seed = 1, n = 7) {
  const r = rng(seed), g = grp();
  for (let i = 0; i < n; i++) g.add(sph(0.06 + r() * 0.05, [C.leaf, C.gold, C.rust][i % 3], { seg: 8 }).sc(1.3, 0.35, 1).at((r() - 0.5) * 0.6, 0.01, (r() - 0.5) * 0.4));
  return g.noInk();
}
function floatingLeaves(w, d, seed = 5, n = 14) {
  const r = rng(seed), g = grp();
  for (let i = 0; i < n; i++) g.add(cyl(0.05, 0.05, 0.01, [C.leaf, C.gold, C.rust][i % 3], { seg: 6 }).sc(1.4, 1, 0.8).rot(0, r() * 3, 0).at((r() - 0.5) * w, 0, (r() - 0.5) * d));
  return g.noInk();
}

// --- the narrowboat (length along X, front deck at +X, decorated side faces +Z). Keel at y=0, waterline at y≈0.3.
function hullPlan(L, W) {
  const hw = W / 2, bow = 1.1, st = 0.34, xs = -L / 2 + st, xb = L / 2 - bow, pts = [];
  for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([xb + bow * t, -hw * (1 - Math.pow(t, 2.2))]); }
  for (let i = 9; i >= 0; i--) { const t = i / 10; pts.push([xb + bow * t, hw * (1 - Math.pow(t, 2.2))]); }
  for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + (i / 10) * Math.PI; pts.push([xs + Math.cos(a) * st, Math.sin(a) * hw]); }
  return pts;
}
function narrowboat(o = {}) {
  const L = o.len ?? 5.6, W = 1.12, hh = 0.5, cb = 0.57, ch = 0.74, cw = W - 0.16;
  const x0 = -L / 2 + 0.85, x1 = L / 2 - 1.3, mid = (x0 + x1) / 2, len = x1 - x0;
  const hx0 = x0 + len * 0.52, hx1 = hx0 + 0.84, hy0 = 0.08, hy1 = 0.6, hX = (hx0 + hx1) / 2, zf = cw / 2 - 0.025, rY = cb + ch + 0.07;
  const g = grp();
  g.add(plan(hullPlan(L, W), hh, C.hull), plan(hullPlan(L + 0.06, W + 0.06), 0.07, C.maroon).at(0, hh, 0), plan(hullPlan(L - 0.14, W - 0.14), 0.012, '#6a5442').at(0, cb, 0));
  // cabin shell with the side hatch cut out
  g.add(grp(
    box(len, ch, 0.05, C.maroon).at(mid, cb, -zf), box(0.05, ch, cw, C.maroon).at(x0 + 0.025, cb, 0), box(0.05, ch, cw, C.maroon).at(x1 - 0.025, cb, 0),
    box(hx0 - x0, ch, 0.05, C.maroon).at((x0 + hx0) / 2, cb, zf), box(x1 - hx1, ch, 0.05, C.maroon).at((hx1 + x1) / 2, cb, zf),
    box(hx1 - hx0, hy0, 0.05, C.maroon).at(hX, cb, zf), box(hx1 - hx0, ch - hy1, 0.05, C.maroon).at(hX, cb + hy1, zf),
  ).weld());
  g.add(rbox(len + 0.12, 0.07, cw + 0.12, C.roof, { r: 0.03 }).at(mid, cb + ch, 0));
  [-1, 1].forEach((s) => g.add(box(len - 0.3, 0.035, 0.035, C.brass).at(mid, rY, s * (cw / 2 - 0.02))));
  // painted panels with a cream coach line
  const panel = (xa, xb, z, s) => grp(box(xb - xa + 0.035, ch - 0.12, 0.01, C.cream).at((xa + xb) / 2, cb + 0.06, z), box(xb - xa, ch - 0.155, 0.01, C.green).at((xa + xb) / 2, cb + 0.0775, z + s * 0.008)).weld();
  g.add(panel(x0 + 0.09, hx0 - 0.09, cw / 2 + 0.006, 1), panel(hx1 + 0.09, x1 - 0.09, cw / 2 + 0.006, 1), panel(x0 + 0.09, x1 - 0.09, -cw / 2 - 0.006, -1));
  const port = (x, z, s) => grp(cyl(0.066, 0.066, 0.02, P.glass, { seg: 18 }).rot(s * deg(90), 0, 0).at(x, cb + 0.46, z), torus(0.07, 0.024, C.brass, { ts: 20 }).at(x, cb + 0.46, z + s * 0.02));
  g.add(port(x0 + 0.26, cw / 2 + 0.014, 1), port(hx0 - 0.24, cw / 2 + 0.014, 1), port((hx1 + x1) / 2, cw / 2 + 0.014, 1));
  [x0 + 0.4, mid - 0.4, mid + 0.4, x1 - 0.4].forEach((x) => g.add(port(x, -cw / 2 - 0.014, -1)));
  // name board
  const nb = plate(Math.min(1.0, (hx0 - x0) - 0.75), 0.34, (x, w, h) => {
    x.fillStyle = C.greenDk; x.fillRect(0, 0, w, h); x.strokeStyle = C.cream; x.lineWidth = 7; x.strokeRect(12, 12, w - 24, h - 24);
    x.textAlign = 'center'; x.textBaseline = 'middle';
    const fit = (t, px, wt, fam, y, c) => { x.font = `${wt} ${px}px ${fam}`; const m = x.measureText(t).width; if (m > w * 0.84) x.font = `${wt} ${px * w * 0.84 / m}px ${fam}`; x.fillStyle = c; x.fillText(t, w / 2, y); };
    fit('MAGPIE', h * 0.46, 800, '"Bricolage Grotesque", sans-serif', h * 0.43, C.cream); fit('REPAIRS  ·  ALL THINGS MENDED', h * 0.16, 700, '"Figtree", sans-serif', h * 0.77, C.gold);
  }, { frame: C.brass });
  g.add(nb.at((x0 + hx0) / 2 + 0.01, cb + 0.29, cw / 2 + 0.03));
  // inside, seen through the hatch: honey lining and a shelf of jobs
  g.add(box(len - 0.12, ch - 0.02, 0.02, P.woodLt).at(mid, cb, -cw / 2 + 0.06), box(len - 0.12, 0.03, cw - 0.1, P.woodDk).at(mid, cb - 0.01, 0));
  g.add(box(hx1 - hx0 + 0.4, 0.03, 0.16, P.woodDk).at(hX, cb + 0.44, -cw / 2 + 0.15));
  [[-0.3, P.red], [-0.15, C.gold], [0.15, P.sea], [0.3, P.cream]].forEach(([dx, c], i) => g.add(cyl(0.045, 0.045, 0.1 + (i % 2) * 0.04, c, { seg: 10 }).at(hX + dx, cb + 0.47, -cw / 2 + 0.15)));
  g.add(cyl(0.07, 0.07, 0.02, P.cream, { seg: 16 }).rot(deg(90), 0, 0).at(hX, cb + 0.6, -cw / 2 + 0.08));
  // hatch: top flap props up as an awning, bottom flap drops into a counter
  g.add(grp(box(hx1 - hx0, 0.3, 0.04, C.maroon).at(0, -0.3, 0), box(hx1 - hx0 - 0.1, 0.2, 0.01, C.green).at(0, -0.25, 0.025)).rot(deg(-104), 0, 0).at(hX, cb + hy1, cw / 2));
  g.add(grp(box(hx1 - hx0 + 0.06, 0.28, 0.04, P.woodLt).at(0, 0, 0)).rot(deg(90), 0, 0).at(hX, cb + hy0, cw / 2));
  [-1, 1].forEach((s) => g.add(tube([[hX + s * (hx1 - hx0) / 2, cb + hy0 + 0.28, cw / 2 + 0.01], [hX + s * (hx1 - hx0) / 2, cb + hy0 + 0.04, cw / 2 + 0.27]], 0.007, P.iron, { segs: 4 }).noInk()));
  const cy = cb + hy0 + 0.02, cz = cw / 2 + 0.15;
  g.add(radio({ body: P.woodLt }).sc(0.55).rot(0, deg(-15), 0).at(hX - 0.22, cy, cz));
  g.add(grp(cyl(0.04, 0.05, 0.015, P.ink2, { seg: 12 }), sph(0.04, C.brass, { part: 'top', seg: 12 }).at(0, 0.015, 0), sph(0.012, C.brass, { seg: 6 }).at(0, 0.06, 0)).at(hX + 0.3, cy, cz + 0.02));
  g.add(grp(cyl(0.035, 0.035, 0.015, P.ink2, { seg: 10 }), cyl(0.005, 0.005, 0.16, P.steel, { seg: 4 }), ...[0, 1, 2].map((i) => box(0.09, 0.005, 0.06, C.cream).rot(0, i * 0.6, 0).at(0, 0.03 + i * 0.025, 0))).at(hX + 0.12, cy, cz + 0.04));
  // roof sign
  g.add(grp(K.sign('REPAIRS', { w: 0.82, h: 0.22, bg: C.cream, fg: C.maroon, frame: C.green }).at(0, 0.06, 0), box(0.04, 0.08, 0.04, C.green).at(-0.32, 0, 0), box(0.04, 0.08, 0.04, C.green).at(0.32, 0, 0)).rot(deg(-8), 0, 0).at(hX - 0.05, rY, 0.16));
  // roof clutter: chimney, plants, water can, plank and pole
  const chim = grp(cyl(0.06, 0.06, 0.44, P.ink2, { seg: 14 }), torus(0.062, 0.016, C.brass, { ts: 18 }).rot(deg(90), 0, 0).at(0, 0.14, 0), torus(0.062, 0.016, C.brass, { ts: 18 }).rot(deg(90), 0, 0).at(0, 0.32, 0), cyl(0.11, 0.07, 0.05, P.ink2, { seg: 14 }).at(0, 0.46, 0));
  g.add(chim.at(x1 - 0.35, rY, -0.18));
  if (o.smoke !== false) g.add(puff(1).at(x1 - 0.32, rY + 0.72, -0.18), puff(0.8).at(x1 - 0.12, rY + 0.98, -0.22), puff(0.6).at(x1 + 0.12, rY + 1.18, -0.25));
  g.add(pot(C.leaf).at(x0 + 0.95, rY - 0.01, -0.2), pot(P.red, 0.52).at(x0 + 1.25, rY - 0.01, -0.25), pot(C.gold, 0.5).at(x0 + 1.5, rY - 0.01, -0.18));
  g.add(buckbyCan().at(x0 + 0.3, rY - 0.01, 0.12));
  g.add(box(len * 0.55, 0.03, 0.16, P.woodLt).at(mid - 0.3, rY, -cw / 2 + 0.14), cyl(0.022, 0.022, len * 0.7, P.white, { seg: 8 }).rot(0, 0, deg(90)).at(mid + len * 0.33, rY + 0.05, -cw / 2 + 0.2));
  // stern: doors, tiller, rudder, fender
  g.add(grp(box(0.03, 0.62, 0.62, C.green).at(x0 - 0.01, cb + 0.02, 0), box(0.04, 0.03, 0.62, C.cream).at(x0 - 0.02, cb + 0.32, 0)).weld(), box(0.03, 0.62, 0.012, P.ink2).at(x0 - 0.03, cb + 0.02, 0).noInk());
  [-1, 1].forEach((s) => g.add(sph(0.022, C.brass, { seg: 8 }).at(x0 - 0.04, cb + 0.32, s * 0.06)));
  g.add(tube([[-L / 2 + 0.06, cb - 0.05, 0], [-L / 2 + 0.02, cb + 0.3, 0], [-L / 2 + 0.1, cb + 0.46, 0], [-L / 2 + 0.3, cb + 0.5, 0]], 0.026, C.brass, { segs: 20 }));
  g.add(tube([[-L / 2 + 0.3, cb + 0.5, 0], [-L / 2 + 0.8, cb + 0.53, 0]], 0.03, P.woodLt, { segs: 4 }), sph(0.035, C.brass, { seg: 10 }).at(-L / 2 + 0.08, cb + 0.44, 0));
  g.add(box(0.34, 0.4, 0.04, C.hull).at(-L / 2 - 0.12, 0.06, 0), sph(0.1, C.rope, { seg: 12 }).sc(1, 0.9, 1.3).at(-L / 2 - 0.02, 0.38, 0));
  // bow: cratch board, ridge, fender, lamp, crate of broken things
  const xc = L / 2 - 0.9;
  g.add(grp(extrude([[-cw / 2, 0], [cw / 2, 0], [0, ch - 0.02]], 0.05, C.green), extrude([[-cw / 2 + 0.12, 0.08], [cw / 2 - 0.12, 0.08], [0, ch - 0.18]], 0.012, C.maroon).at(0, 0, 0.03)).weld().rot(0, deg(90), 0).at(xc, cb, 0));
  g.add(box(xc - x1, 0.04, 0.07, P.woodLt).at((x1 + xc) / 2, cb + ch - 0.06, 0));
  g.add(sph(0.11, C.rope, { seg: 12 }).sc(1.2, 0.9, 1).at(L / 2 + 0.02, 0.4, 0));
  g.add(grp(cyl(0.06, 0.06, 0.1, C.brass, { seg: 12 }).rot(0, 0, deg(-90)).at(0, 0.06, 0), cyl(0.05, 0.05, 0.02, K.glow(P.butter), { seg: 12 }).rot(0, 0, deg(-90)).at(0.1, 0.06, 0)).at(L / 2 - 0.45, cb, 0));
  g.add(K.crate(0.3).at(x1 + 0.22, cb - 0.06, 0.18), toaster().sc(0.8).rot(0, deg(20), 0).at(x1 + 0.22, cb + 0.24, 0.18), K.crate(0.26).rot(0, 0.3, 0).at(x1 + 0.25, cb - 0.06, -0.2));
  if (o.keeper) { o.keeper.traverse((m) => { m.receiveShadow = false; }); g.add(o.keeper.at(hX, -0.16, -0.08)); }
  if (o.cat) g.add(K.cat({ color: P.ink2, belly: P.white }).sc(0.55).rot(0, deg(-50), 0).at(x0 + 0.6, rY, 0.1));
  return g;
}

// --- canal pieces. Canal runs along X, centred on z=0. Banks at y=0.
function canal({ w = 10, near = 0.8, width = 2.6, far = 3, waterY = -0.4, base = -1.0, towpath = 1.0 } = {}) {
  const g = grp(), hw = width / 2, hb = -base;
  g.add(slab(w, waterY - base, width, { top: waterMat(w, width), side: C.waterDk }).at(0, waterY, 0));
  g.add(slab(w, hb, far, { top: grassMat(w, far), side: P.soil, pz: wallMat(w, hb) }).at(0, 0, -hw - far / 2));
  if (near > 0) g.add(slab(w, hb, near, { top: grassMat(w, near), side: P.soil, nz: wallMat(w, hb) }).at(0, 0, hw + near / 2));
  g.add(box(w, 0.02, towpath, C.towpath).at(0, 0, -hw - 0.12 - towpath / 2));
  g.add(box(w, 0.06, 0.2, C.stone).at(0, 0, -hw - 0.1));
  if (near > 0) g.add(box(w, 0.06, 0.2, C.stone).at(0, 0, hw + 0.1));
  return g;
}
function humpBridge(o = {}) {
  const S = o.span ?? 2.1, H = o.hump ?? 1.0, R = o.r ?? 1.25, wy = o.waterY ?? -0.4, base = o.base ?? -1.0, D = o.depth ?? 1.0, N = 28;
  const deckY = (s) => H * 0.5 * (1 + Math.cos(Math.PI * s / S));
  const arch = (r, k = 0.85) => Array.from({ length: N + 1 }, (_, i) => { const a = (i / N) * Math.PI; return [r * Math.cos(a), wy + r * Math.sin(a) * k]; });
  const pts = [[-S, base]];
  for (let i = 0; i <= N; i++) { const s = -S + (2 * S * i) / N; pts.push([s, deckY(s)]); }
  pts.push([S, base], [R, base], ...arch(R), [-R, base]);
  const band = (t0, t1) => { const a = [], b = []; for (let i = 0; i <= N; i++) { const s = -S + (2 * S * i) / N; a.push([s, deckY(s) + t1]); b.unshift([s, deckY(s) + t0]); } return [...a, ...b]; };
  const brickTex = texMat(tex.bricks({ base: C.brick, mortar: '#e4cfae', rows: 6, cols: 3 }));
  const g = grp(extrude(pts, D, [brickTex, mt(C.brick)]));
  g.add(extrude([...arch(R + 0.16, 0.86), ...arch(R, 0.85).reverse()], D + 0.04, C.stone));
  g.add(extrude(band(0, 0.04), D - 0.26, C.towpath));
  [-1, 1].forEach((s) => { g.add(extrude(band(0, 0.3), 0.13, C.brick).at(0, 0, s * (D / 2 - 0.065)), extrude(band(0.3, 0.37), 0.19, C.stone).at(0, 0, s * (D / 2 - 0.08))); });
  return grp(g.rot(0, deg(90), 0));
}

// --- characters
/** The kit flatcap sits under the hair and has no peak, so build one here (head maths from kit person()). */
const flatcapBrim = (p, c = '#5e4a36') => { const hr = 0.34, hy = 1.06 + hr * 0.92; p.add(grp(sph(hr * 1.1, c, { part: 'top', seg: 24 }).sc(1.03, 0.74, 1.12), cyl(hr * 0.62, hr * 0.62, 0.04, c, { seg: 20, t0: -1.1, tl: 2.2 }).sc(1.05, 1, 1.3).at(0, 0.0, hr * 0.66)).rot(-0.14, 0, 0).at(0, hy + hr * 0.3, 0)); return p; };
const you = (o = {}) => K.person({ hairStyle: 'bun', hair: P.hairAuburn, skin: P.skin2, top: C.leaf, bottom: C.green, apron: C.green, shoes: P.ink2, acc: ['goggles'], pose: 'hold', held: radio().sc(0.9), ...o });
const alf = (o = {}) => flatcapBrim(K.person({ body: 'elder', hairStyle: 'short', hair: P.hairGrey, skin: P.skin1, top: '#6b5238', sleeves: C.cream, bottom: '#545b6b', acc: ['moustache'], beardColor: P.hairWhite, held: windlass(), ...o }));
const poppy = (o = {}) => K.person({ body: 'kid', hairStyle: 'bob', hair: P.hairBlack, skin: P.skin3, top: P.mustard, bottom: P.navy, shoes: P.red, hat: 'beanie', hatColor: P.red, pose: 'hold', held: musicBox().sc(1.1), ...o });
function heron() {
  const body = '#a3acb3', wing = '#6f7a86', leg = '#c7a85e', g = grp();
  [-1, 1].forEach((s) => g.add(cyl(0.022, 0.024, 0.64, leg, { seg: 6 }).at(0, 0, s * 0.07), box(0.16, 0.02, 0.04, leg).at(0.05, 0, s * 0.07)));
  g.add(sph(0.22, body, { seg: 18 }).sc(1.45, 0.95, 0.9).rot(0, 0, deg(22)).at(0, 0.84, 0));
  [-1, 1].forEach((s) => g.add(sph(0.2, wing, { seg: 14 }).sc(1.45, 0.72, 0.36).rot(0, 0, deg(20)).at(-0.06, 0.86, s * 0.15)));
  g.add(cone(0.1, 0.2, wing, { seg: 6 }).rot(0, 0, deg(110)).at(-0.26, 0.8, 0));
  g.add(tube([[0.18, 0.92, 0], [0.26, 1.08, 0], [0.16, 1.24, 0], [0.22, 1.4, 0]], 0.056, P.white, { segs: 24 }));
  g.add(sph(0.085, P.white, { seg: 14 }).sc(1.3, 1, 0.9).at(0.25, 1.45, 0));
  g.add(cap(0.017, 0.2, P.ink2, { seg: 6 }).rot(0, 0, deg(112)).at(0.2, 1.5, 0));
  g.add(cone(0.034, 0.32, P.mustard, { seg: 8 }).rot(0, 0, deg(-90)).at(0.33, 1.44, 0));
  [-1, 1].forEach((s) => g.add(box(0.1, 0.022, 0.01, P.ink2).at(0.27, 1.47, s * 0.07).noInk(), sph(0.017, P.ink, { seg: 8 }).at(0.31, 1.46, s * 0.07).noInk()));
  return g;
}

// --- builds
function boatOnWater() {
  return grp(K.ground(7.2, 2.2, { map: waterMat(7.2, 2.2).map, side: C.waterDk, h: 0.4 }), floatingLeaves(6.5, 2, 3, 10).at(0, 0.005, 0), narrowboat({ cat: true, smoke: false }).at(0, -0.3, -0.1));
}
function lock(o = {}) {
  const Lc = o.chamber ?? 3.2, Wc = 1.5, hw = Wc / 2, w = o.w ?? 6.6, near = o.near ?? 1.0, far = o.far ?? 2.4, lo = -0.72, hi = -0.32, base = -1.2;
  const g = grp(), gx0 = -Lc / 2, gx1 = Lc / 2;
  // water: lower pound, chamber (empty or full), upper pound behind the top gates
  const cy = o.full ? hi : lo;
  g.add(slab(w / 2 + gx0, lo - base, Wc, { top: waterMat(w / 2 + gx0, Wc), side: C.waterDk }).at((-w / 2 + gx0) / 2, lo, 0));
  g.add(slab(Lc, cy - base, Wc, { top: waterMat(Lc, Wc), side: C.waterDk, nx: wallMat(1.5, 0.5) }).at(0, cy, 0));
  g.add(slab(w / 2 - gx1, hi - base, Wc, { top: waterMat(w / 2 - gx1, Wc), side: C.waterDk, nx: wallMat(1.5, 0.5) }).at((gx1 + w / 2) / 2, hi, 0));
  g.add(slab(w, -base, far, { top: grassMat(w, far), side: P.soil, pz: wallMat(w, -base) }).at(0, 0, -hw - far / 2));
  g.add(slab(w, -base, near, { top: grassMat(w, near), side: P.soil, nz: wallMat(w, -base) }).at(0, 0, hw + near / 2));
  // lockside coping with white-painted edges, and the towpath
  [-1, 1].forEach((s) => g.add(box(w, 0.06, 0.24, C.stone).at(0, 0, s * (hw + 0.12)), box(Lc + 0.2, 0.065, 0.06, P.white).at(0, 0, s * (hw + 0.03))));
  const tp = Math.min(0.6, near - 0.3); g.add(box(w, 0.02, tp, C.towpath).at(0, 0, hw + 0.25 + tp / 2));
  // gates: mitred pairs pointing upstream (+X), black and white balance beams
  const gateMat = texMat(tex.planks({ base: '#7d5c3e', line: '#4a3424', n: 5 }));
  const leaf = (x, s, bottom, beamLen) => {
    const dz = hw, dx = 0.2, l = Math.hypot(dx, dz), a = s * Math.atan2(dz, dx);
    const lf = grp(box(l, 0.06 - bottom, 0.1, gateMat).at(0, bottom, 0), box(0.06, 0.08, 0.12, P.ink2).at(l / 2 - 0.03, 0.06, 0));
    lf.add(box(l + beamLen, 0.12, 0.13, P.ink2).at(-beamLen / 2, 0.12, 0), box(0.24, 0.125, 0.135, P.white).at(-l / 2 - beamLen + 0.12, 0.12, 0));
    lf.add(grp(box(0.08, 0.16, 0.08, P.iron), cyl(0.02, 0.02, 0.12, P.iron, { seg: 6 }).rot(0, 0, deg(90)).at(0.06, 0.1, 0)).at(l / 2 - 0.25, 0.24, 0.1));
    return lf.rot(0, a, 0).at(x + dx / 2, 0, s * dz / 2);
  };
  [-1, 1].forEach((s) => g.add(leaf(gx0, s, lo - 0.3, 1.0), leaf(gx1, s, hi - 0.3, 0.8)));
  // ground paddles and bollards
  [[gx0 - 0.3, 1], [gx1 + 0.35, -1]].forEach(([x, s]) => g.add(grp(box(0.16, 0.34, 0.14, P.iron), cyl(0.07, 0.07, 0.04, P.iron, { seg: 14 }).rot(0, 0, deg(90)).at(0.1, 0.26, 0), box(0.04, 0.46, 0.04, P.iron).at(0, 0.3, 0)).at(x, 0, s * (hw + 0.4))));
  [gx0 + 0.6, gx1 - 0.6].forEach((x) => g.add(bollard().at(x, 0, hw + 0.35), bollard().at(x, 0, -hw - 0.35)));
  return { g, gx0, gx1, hw, lo, hi, w, near, far };
}
const lockSign = () => grp(K.sign('LOCK 14', { w: 0.62, h: 0.22, bg: P.white, fg: P.ink, frame: P.ink2 }).at(0, 0.46, 0.03), box(0.05, 0.72, 0.05, P.ink2).at(-0.26, 0, 0), box(0.05, 0.72, 0.05, P.ink2).at(0.26, 0, 0));
function cottage() {
  const g = K.house({ w: 1.8, d: 1.3, h: 1.05, wall: '#efe6d2', roof: C.slate, door: C.green, trim: P.white, windows: 2, chimney: true, base: C.stoneDk, shutters: C.green });
  g.add(K.barrel(0.32, P.woodDk).at(0.6, 0, 0.9), K.flower(P.red, 0.36).at(0.56, 0.2, 0.92), K.flower(C.gold, 0.32).at(0.66, 0.2, 0.86), K.flower(P.red, 0.3).at(0.62, 0.2, 0.98));
  g.add(grp(cyl(0.035, 0.035, 0.9, P.white, { seg: 8 }), torus(0.16, 0.05, texMat(tex.stripes({ colors: [P.red, P.white], n: 8 })), { ts: 24 }).at(0.0, 0.62, 0.04)).at(-1.15, 0, 0.75));
  return g;
}
function lockBuild() {
  const L = lock({ near: 0.75 });
  const g = L.g;
  g.add(cottage().sc(0.95).at(0.4, 0, -1.6));
  g.add(lockSign().rot(0, deg(10), 0).at(-2.25, 0, -1.2), K.bench(0.9, P.wood).at(-1.15, 0, -1.3), autumnTree(2.2, 7).at(-2.6, 0, -1.95), autumnTree(1.8, 11, [C.gold, C.leaf]).at(2.7, 0, -1.8));
  g.add(leafPile(3).at(-2.2, 0, -1.35), leafPile(5).at(2.2, 0, 1.25), reeds(3).at(-3.0, 0, 0.92));
  g.add(floatingLeaves(2.4, 1.2, 9, 6).at(-2.0, L.lo + 0.005, 0), floatingLeaves(1.2, 1.2, 4, 4).at(2.6, L.hi + 0.005, 0));
  return g;
}
function bike() {
  const fr = C.green, g = grp();
  const wheel = (x) => { const w = grp(torus(0.3, 0.038, P.ink2, { ts: 32, rs: 10 }), torus(0.255, 0.014, P.steel, { ts: 28 }), cyl(0.04, 0.04, 0.1, P.steel, { seg: 10 }).rot(deg(90), 0, 0).at(0, 0, -0.05)); for (let i = 0; i < 6; i++) w.add(grp(box(0.008, 0.5, 0.008, P.iron).at(0, -0.25, 0)).rot(0, 0, i * deg(30)).noInk()); return w.at(x, 0.34, 0); };
  g.add(wheel(-0.55), wheel(0.55));
  const T = (pts, r = 0.028, c = fr) => tube(pts, r, c, { tension: 0, segs: 8 });
  const rh = [-0.55, 0.34, 0], bb = [-0.04, 0.3, 0], st = [-0.14, 0.82, 0], ht = [0.4, 0.86, 0], hb = [0.46, 0.66, 0];
  g.add(T([rh, bb]), T([bb, st]), T([st, ht]), T([bb, hb]), T([hb, ht], 0.032), T([rh, [-0.16, 0.76, 0]]), tube([[0.46, 0.66, 0], [0.52, 0.48, 0], [0.55, 0.34, 0]], 0.022, fr, { segs: 12 }));
  // mudguards
  [-0.55, 0.55].forEach((x) => g.add(cyl(0.355, 0.355, 0.08, fr, { open: true, t0: Math.PI - 0.95, tl: 1.9, side: THREE.DoubleSide, seg: 20 }).rot(deg(90), 0, 0).at(x, 0.34, -0.04)));
  // sign plate in the frame
  g.add(plate(0.4, 0.17, (x, w, h) => { x.fillStyle = C.cream; x.fillRect(0, 0, w, h); x.fillStyle = C.maroon; x.font = `800 ${h * 0.44}px "Bricolage Grotesque", sans-serif`; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('MAGPIE', w / 2, h * 0.38); x.fillStyle = C.green; x.font = `700 ${h * 0.22}px "Figtree", sans-serif`; x.fillText('REPAIRS', w / 2, h * 0.75); }, { frame: C.maroon, d: 0.03 }).at(0.13, 0.45, 0));
  // saddle, bars, bell, crank
  g.add(cyl(0.02, 0.02, 0.14, P.steel, { seg: 6 }).at(-0.15, 0.8, 0), rbox(0.24, 0.07, 0.14, P.woodDk, { r: 0.03 }).at(-0.16, 0.92, 0));
  g.add(cyl(0.022, 0.022, 0.14, P.steel, { seg: 6 }).at(0.4, 0.86, 0), tube([[0.3, 1.0, -0.26], [0.42, 1.0, -0.18], [0.42, 1.0, 0.18], [0.3, 1.0, 0.26]], 0.018, P.steel, { segs: 16 }));
  [-1, 1].forEach((s) => g.add(cyl(0.028, 0.028, 0.1, C.cream, { seg: 8 }).rot(deg(90), 0, 0).at(0.29, 1.0, s * 0.3 - (s > 0 ? 0.1 : 0))));
  g.add(sph(0.035, C.brass, { part: 'top', seg: 10 }).at(0.42, 1.02, 0.12));
  g.add(cyl(0.11, 0.11, 0.02, P.iron, { seg: 18 }).rot(deg(90), 0, 0).at(-0.04, 0.3, 0.06), box(0.03, 0.2, 0.02, P.iron).at(-0.04, 0.2, 0.08).rot(0, 0, 0.6), box(0.1, 0.02, 0.06, P.ink2).at(0.06, 0.15, 0.1));
  // front basket with jobs, rear rack with toolbox
  const wick = texMat(tex.custom(128, 128, (x, w) => { x.fillStyle = P.cork; x.fillRect(0, 0, w, w); x.strokeStyle = P.woodDk; x.lineWidth = 4; for (let i = 0; i < 8; i++) { x.beginPath(); x.moveTo(0, i * 16 + 8); x.lineTo(w, i * 16 + 8); x.stroke(); } x.lineWidth = 3; for (let i = 0; i < 6; i++) { x.beginPath(); x.moveTo(i * 22 + 6, 0); x.lineTo(i * 22 + 6, w); x.stroke(); } }));
  g.add(box(0.06, 0.04, 0.3, P.steel).at(0.66, 0.74, 0), rbox(0.46, 0.28, 0.4, wick, { r: 0.03 }).at(0.68, 0.76, 0));
  g.add(radio().sc(0.6).rot(0, deg(-10), 0).at(0.62, 1.0, -0.05), grp(rbox(0.2, 0.12, 0.16, '#c9a272', { r: 0.02 }), box(0.21, 0.125, 0.012, P.cream).noInk(), box(0.012, 0.125, 0.17, P.cream).noInk()).rot(0, 0.4, 0).at(0.76, 1.0, 0.1));
  g.add(cyl(0.05, 0.05, 0.06, C.brass, { seg: 12 }).rot(0, 0, deg(-90)).at(0.92, 0.82, 0), cyl(0.04, 0.04, 0.01, K.glow(P.butter), { seg: 12 }).rot(0, 0, deg(-90)).at(0.98, 0.82, 0));
  g.add(box(0.36, 0.03, 0.22, P.steel).at(-0.62, 0.7, 0), tube([[-0.55, 0.34, 0.08], [-0.66, 0.7, 0.08]], 0.012, P.steel, { segs: 3 }), tube([[-0.55, 0.34, -0.08], [-0.66, 0.7, -0.08]], 0.012, P.steel, { segs: 3 }));
  g.add(rbox(0.32, 0.16, 0.2, P.red, { r: 0.03 }).at(-0.62, 0.73, 0), box(0.12, 0.03, 0.03, P.ink2).at(-0.62, 0.9, 0));
  g.add(tube([[-0.3, 0.32, 0.06], [-0.24, 0.0, 0.18]], 0.014, P.iron, { segs: 3 }));
  return g;
}
function bikeBuild() {
  const g = grp(K.ground(2.8, 1.8, { map: tex.speckle({ base: C.towpath, dots: ['#bfa679', C.leaf, C.gold], n: 70, size: 4 }), side: P.soil, h: 0.25 }));
  g.add(bike().rot(0, deg(-8), deg(-4)).at(0.05, 0, -0.05), bollard().at(-1.05, 0, -0.55), leafPile(2).at(0.85, 0, 0.55), leafPile(8, 5).at(-0.9, 0, 0.5));
  return g;
}
function benchTop(o = {}) {
  const g = grp();
  g.add(box(3.4, 0.3, 2.0, texMat(tex.planks({ base: P.wood, line: P.woodDk, n: 7 }))).at(0, -0.3, 0));
  g.add(box(2.3, 0.03, 1.36, texMat(tex.grid({ bg: C.green, line: '#79a98f', cells: 10, lw: 2 }))).at(-0.2, 0, 0.18));
  // the radio, opened: case at the back, chassis pulled out, parts laid out in rows
  g.add(grp(rbox(0.66, 0.46, 0.28, C.maroon, { r: 0.08 }), rbox(0.36, 0.3, 0.03, C.cream, { r: 0.03 }).at(-0.1, 0.08, 0.13), ...[0, 1, 2, 3].map((i) => box(0.28, 0.016, 0.01, P.woodDk).at(-0.1, 0.12 + i * 0.06, 0.15).noInk()), cyl(0.08, 0.08, 0.02, P.butter, { seg: 18 }).rot(deg(90), 0, 0).at(0.2, 0.26, 0.13)).rot(0, deg(12), 0).at(-0.95, 0.03, -0.42));
  const valve = (h = 0.2) => grp(cyl(0.045, 0.045, 0.04, P.ink2, { seg: 12 }), cyl(0.04, 0.04, h, P.glass, { seg: 12 }).at(0, 0.04, 0), sph(0.04, P.glass, { part: 'top', seg: 12 }).at(0, 0.04 + h, 0), cyl(0.018, 0.018, h * 0.5, P.slate, { seg: 8 }).at(0, 0.07, 0).noInk());
  const chassis = grp(box(0.7, 0.05, 0.4, P.steel), valve(0.18).at(-0.2, 0.05, -0.08), valve(0.14).at(-0.05, 0.05, -0.1), valve(0.2).at(0.12, 0.05, -0.06), cyl(0.07, 0.07, 0.12, P.slate, { seg: 14 }).at(0.24, 0.05, 0.08), box(0.18, 0.08, 0.1, P.woodDk).at(-0.18, 0.05, 0.12));
  g.add(chassis.rot(0, deg(-8), 0).at(-0.25, 0.03, -0.28));
  const cap1 = (c, h = 0.1) => grp(cyl(0.035, 0.035, h, c, { seg: 12 }), cyl(0.036, 0.036, 0.012, P.steel, { seg: 12 }).at(0, h, 0)).rot(0, 0, deg(90));
  const res = (c) => grp(cap(0.018, 0.07, P.butter, { seg: 8 }).rot(0, 0, deg(90)), box(0.012, 0.042, 0.042, c).at(-0.03, -0.003, 0).noInk(), box(0.012, 0.042, 0.042, P.ink2).at(-0.06, -0.003, 0).noInk()).at(0, 0.02, 0);
  const row1 = [cap1(P.blue).at(-0.65, 0.04, 0.22), cap1(P.blue).at(-0.5, 0.04, 0.22), cap1(P.mustard, 0.08).at(-0.35, 0.04, 0.22)];
  // the faulty one: bulged and tagged red
  const bad = grp(cyl(0.04, 0.04, 0.11, P.blue, { seg: 12 }), sph(0.042, P.blue, { part: 'top', seg: 12 }).sc(1, 0.8, 1).at(0, 0.11, 0)).rot(0, 0, deg(90)).at(-0.12, 0.045, 0.22);
  g.add(...row1, bad, ticket('FAULT', 0.2, 0.09).rot(deg(-90), 0, deg(8)).at(-0.18, 0.012, 0.36));
  [P.red, P.green, P.orange, P.ink2].forEach((c, i) => g.add(res(c).at(0.12 + i * 0.13, 0.0, 0.22)));
  [-0.6, -0.42, -0.24].forEach((x, i) => g.add(cyl(0.035, 0.035, 0.035, P.ink2, { seg: 12 }).at(x, 0.03, 0.5), cyl(0.02, 0.02, 0.02, C.brass, { seg: 8 }).at(x, 0.065, 0.5)));
  g.add(grp(cone(0.16, 0.08, P.stoneDk, { seg: 18 }).rot(deg(180), 0, 0).at(0, 0.1, 0), torus(0.16, 0.02, P.ink2, { ts: 20 }).rot(deg(90), 0, 0).at(0, 0.1, 0), cyl(0.05, 0.05, 0.03, P.iron, { seg: 12 })).at(0.05, 0.03, 0.55));
  g.add(box(0.5, 0.02, 0.32, P.woodLt).rot(0, deg(-6), 0).at(0.55, 0.03, 0.58));
  [0.42, 0.52, 0.62].forEach((x) => [0.5, 0.62].forEach((z) => g.add(cyl(0.022, 0.022, 0.012, P.ink2, { seg: 10 }).at(x, 0.05, z).noInk())));
  // screws in a dish, new part in its box
  g.add(lathe([[0.001, 0], [0.13, 0], [0.16, 0.05], [0.15, 0.05], [0.12, 0.012], [0.001, 0.012]], C.cream, { seg: 20 }).at(0.6, 0.03, 0.22));
  const r = rng(4); for (let i = 0; i < 7; i++) g.add(grp(cyl(0.016, 0.016, 0.008, C.brass, { seg: 8 }), cyl(0.006, 0.006, 0.04, P.steel, { seg: 5 }).rot(0, 0, deg(90)).at(0.02, 0, 0)).rot(0, r() * 6, 0).at(0.6 + (r() - 0.5) * 0.14, 0.045, 0.22 + (r() - 0.5) * 0.12).noInk());
  g.add(grp(box(0.24, 0.08, 0.14, P.white), box(0.25, 0.02, 0.15, C.green).at(0, 0.03, 0)).weld().rot(0, 0.3, 0).at(0.32, 0.03, -0.18), cap1(P.blue).rot(0, 0.3, 0).at(0.36, 0.13, -0.18));
  // tools and ticket
  const screwdriver = (c) => grp(cap(0.03, 0.12, c, { seg: 10 }).rot(0, 0, deg(90)).at(0.0, 0.03, 0), cyl(0.008, 0.008, 0.22, P.steel, { seg: 6 }).rot(0, 0, deg(-90)).at(0.0, 0.03, 0));
  g.add(screwdriver(P.red).rot(0, deg(15), 0).at(1.05, 0.0, 0.25), screwdriver(P.mustard).rot(0, deg(25), 0).at(1.05, 0.0, 0.45));
  g.add(grp(tube([[0, 0, 0], [0.04, 0.0, 0.12], [0.12, 0, 0.2]], 0.014, P.iron), tube([[0.04, 0, 0], [0.02, 0, 0.12], [0.12, 0, 0.2]], 0.014, P.iron), cap(0.02, 0.1, P.red, { seg: 8 }).rot(deg(-90), 0, 0).at(0, 0, -0.12), cap(0.02, 0.1, P.red, { seg: 8 }).rot(deg(-90), 0, 0).at(0.05, 0, -0.12)).rot(0, 0.5, 0).at(1.05, 0.04, -0.15));
  const iron = grp(cyl(0.14, 0.15, 0.03, P.ink2, { seg: 16 }), ...[0, 1, 2, 3].map((i) => torus(0.05, 0.01, P.steel, { ts: 12 }).rot(deg(90), 0, deg(30)).at(0.05 * i, 0.08 + i * 0.05, 0).rot(0, 0, deg(-30))), grp(cap(0.03, 0.14, P.woodLt, { seg: 10 }), cyl(0.01, 0.006, 0.2, P.steel, { seg: 6 }).at(0, 0.2, 0)).rot(0, 0, deg(-62)).at(-0.05, 0.1, 0));
  g.add(iron.rot(0, deg(-20), 0).at(1.25, 0, -0.6));
  g.add(tube([[1.1, 0.05, -0.58], [1.3, 0.02, -0.3], [1.55, 0.02, -0.5]], 0.012, P.ink2).noInk());
  const lamp = grp(cyl(0.12, 0.14, 0.05, C.green, { seg: 16 }), tube([[0, 0.05, 0], [-0.05, 0.5, 0.05], [0.25, 0.75, 0.15]], 0.02, C.green, { segs: 16, tension: 0 }), grp(cone(0.12, 0.16, C.green, { seg: 16 }).rot(deg(160), 0, 0), cyl(0.07, 0.07, 0.02, K.glow(P.butter), { seg: 12 }).at(0, -0.15, 0)).at(0.28, 0.82, 0.18));
  g.add(lamp.at(0.15, 0.0, -0.75));
  g.add(grp(box(0.06, 0.03, 0.12, P.steel), ticket('No. 7  RADIO', 0.4, 0.22).rot(deg(-90), 0, 0).at(0, 0.02, 0.12)).rot(0, deg(-8), 0).at(-1.25, 0, 0.55));
  g.add(grp(cyl(0.08, 0.075, 0.16, P.cream, { seg: 16 }), torus(0.05, 0.016, P.cream, { ts: 12 }).rot(0, 0, 0).at(0.09, 0.08, 0), cyl(0.07, 0.07, 0.01, P.woodDk, { seg: 14 }).at(0, 0.15, 0).noInk()).at(-1.4, 0, -0.1));
  if (o.cat !== false) g.add(grp(sph(0.2, P.ink2, { seg: 16 }).sc(1.3, 0.55, 1.0), sph(0.12, P.ink2, { seg: 14 }).at(0.2, 0.06, 0.1), cone(0.05, 0.08, P.ink2, { seg: 4 }).at(0.17, 0.14, 0.05), cone(0.05, 0.08, P.ink2, { seg: 4 }).at(0.26, 0.14, 0.12), sph(0.07, P.white, { seg: 10 }).sc(1, 0.6, 0.6).at(0.26, 0.03, 0.16).noInk(), tube([[-0.22, 0.04, 0], [-0.25, 0.04, 0.18], [-0.08, 0.04, 0.24], [0.08, 0.04, 0.26]], 0.035, P.ink2)).at(1.35, 0.06, 0.65));
  return g;
}

// --- scenes
function keyArt() {
  const g = grp(), W = 11;
  g.add(canal({ w: W, near: 0.8, width: 2.6, far: 3.2 }));
  g.add(humpBridge({ span: 2.04 }).at(3.9, 0, 0));
  g.add(floatingLeaves(6, 1.4, 5, 14).at(-1.2, -0.395, 0.45), floatingLeaves(1.5, 2, 8, 5).at(4.8, -0.395, 0));
  // the boat, moored against the far towpath, you at the hatch
  const keeper = you({ pose: 'wave', held: null }).sc(0.78);
  const boat = narrowboat({ keeper, cat: true }).at(-1.0, -0.7, -0.71);
  g.add(boat);
  [[-3.85, -1.55, [-3.55, 0.0, -0.95]], [1.35, -1.55, [1.2, 0.0, -0.95]]].forEach(([x, z, end]) => g.add(bollard().at(x, 0, z), tube([[x, 0.2, z], [(x + end[0]) / 2, 0.04, (z + end[2]) / 2], end], 0.018, C.rope, { segs: 12 })));
  // far bank: towpath, trees, cottage, lamppost, A-board, a customer waiting
  g.add(K.house({ w: 1.7, d: 1.2, h: 1.0, floors: 2, wall: '#efe6d2', roof: C.slate, door: C.maroon, trim: P.white, windows: 2, chimney: true, base: C.stoneDk }).rot(0, deg(8), 0).at(-3.6, 0, -3.75));
  g.add(K.house({ w: 1.5, d: 1.2, h: 1.0, wallMap: tex.bricks({ base: C.brick, mortar: '#e4cfae', rows: 7, cols: 3 }), roof: C.slate, door: C.green, trim: P.cream, windows: 2, chimney: true, base: C.stoneDk }).at(0.9, 0, -3.95));
  [[-5.0, -2.9, 2.6, 2], [-2.3, -3.2, 3.0, 5], [-0.3, -3.0, 2.4, 9, [C.gold, C.leaf]], [2.2, -3.1, 2.8, 13], [4.9, -3.0, 2.2, 17, [C.rust, C.leaf]]].forEach(([x, z, h, s, cols]) => g.add(autumnTree(h, s, cols).at(x, 0, z)));
  g.add(K.lamppost(1.5, P.ink2).at(-1.6, 0, -2.25), K.bench(0.9, P.wood).at(-0.9, 0, -2.45));
  g.add(grp(K.sign('FIX-IT', { w: 0.56, h: 0.26, bg: C.cream, fg: C.maroon, frame: C.green }).rot(deg(-12), 0, 0).at(0, 0.32, 0.05), box(0.05, 0.6, 0.04, C.green).rot(deg(-12), 0, 0).at(-0.22, 0, 0.0), box(0.05, 0.6, 0.04, C.green).rot(deg(-12), 0, 0).at(0.22, 0, 0.0)).rot(0, deg(-20), 0).at(1.75, 0, -1.6));
  g.add(poppy().sc(0.8).rot(0, deg(-12), 0).at(2.65, 0, -2.0));
  g.add(leafPile(1).at(-2.6, 0, -2.6), leafPile(6).at(1.9, 0, -2.6), leafPile(4).at(4.6, 0, -2.3));
  // near bank: reeds, the heron, leaves
  g.add(reeds(2).at(-3.5, 0, 1.75), reeds(6).at(-0.4, 0, 1.6), reeds(9).at(1.8, 0, 1.75), heron().sc(0.9).rot(0, deg(-12), 0).at(-4.85, 0, 1.72), leafPile(3, 5).at(0.9, 0, 1.85));
  // lock-keeper on the bridge
  g.add(alf({ pose: 'wave', held: null }).sc(0.8).rot(0, deg(-20), 0).at(3.9, 1.02, 0.1));
  return g;
}
function lockTown() {
  const L = lock({ chamber: 4.8, w: 10, near: 0.85, far: 3.0, full: true });
  const g = L.g;
  g.add(narrowboat({ len: 4.4, smoke: true, cat: true, keeper: you({ pose: 'wave', held: null }).sc(0.78) }).at(0.0, L.hi - 0.3, 0.0));
  g.add(cottage().sc(0.95).at(-2.6, 0, -1.75));
  g.add(K.house({ w: 1.4, d: 1.2, h: 0.95, floors: 2, wallMap: tex.bricks({ base: C.brick, mortar: '#e4cfae', rows: 8, cols: 3 }), roof: C.slate, door: P.navy, trim: P.cream, windows: 2, chimney: true, base: C.stoneDk }).at(1.0, 0, -2.55));
  g.add(K.house({ w: 1.6, d: 1.2, h: 1.0, wall: C.gold, roof: C.slate, door: C.maroon, trim: P.white, windows: 2, base: C.stoneDk, awning: [C.green, C.cream], sign: 'TEA ROOM', signBg: C.cream, signFg: C.green }).at(2.8, 0, -2.4));
  [[-4.4, -2.6, 2.8, 3], [-0.6, -3.0, 2.4, 8, [C.gold, C.leaf]], [4.4, -2.5, 2.6, 12, [C.rust, C.leaf]]].forEach(([x, z, h, s, cols]) => g.add(autumnTree(h, s, cols).at(x, 0, z)));
  g.add(alf({ pose: 'hips', held: null }).sc(0.8).rot(0, deg(-10), 0).at(-3.55, 0, 1.25), poppy().sc(0.8).rot(0, deg(10), 0).at(3.5, 0, 1.2));
  g.add(heron().sc(0.7).rot(0, deg(-130), 0).at(4.4, 0, -1.2));
  g.add(K.lamppost(1.5, P.ink2).at(-0.8, 0, -1.3), K.lamppost(1.5, P.ink2).at(2.2, 0, -1.3), lockSign().at(-1.55, 0, -1.2));
  g.add(leafPile(2).at(-1.8, 0, -1.6), leafPile(7).at(0.6, 0, 1.4), leafPile(9).at(4.2, 0, 1.4), reeds(4).at(-4.5, 0, 1.25));
  g.add(floatingLeaves(2.2, 1.2, 9, 6).at(-3.8, L.lo + 0.005, 0), floatingLeaves(1.8, 1.2, 2, 5).at(4.0, L.hi + 0.005, 0));
  return g;
}
function cabinCutaway() {
  const g = grp(), Lc = 5.0, Wc = 2.0, fy = 0.0;
  // water slab and the hull, cut open along the front
  g.add(K.ground(6.2, 2.7, { map: waterMat(6.2, 2.7).map, side: C.waterDk, h: 0.35 }).at(0, -0.25, 0));
  g.add(box(Lc + 0.2, 0.55, Wc + 0.12, C.hull).at(0, -0.6, 0), box(Lc + 0.26, 0.07, Wc + 0.18, C.maroon).at(0, -0.1, 0));
  g.add(box(Lc - 0.1, 0.04, Wc - 0.1, texMat(tex.planks({ base: P.woodLt, line: P.wood, n: 8, vertical: true }))).at(0, fy - 0.03, 0));
  const lining = '#e8c48e';
  g.add(grp(box(Lc, 1.5, 0.08, C.maroon).at(0, fy, -Wc / 2 + 0.04), box(Lc - 0.1, 1.45, 0.02, lining).at(0, fy, -Wc / 2 + 0.09)).weld());
  [-1, 1].forEach((s) => g.add(grp(box(0.08, 1.5, Wc, C.maroon).at(s * (Lc / 2 - 0.04), fy, 0), box(0.02, 1.45, Wc - 0.1, lining).at(s * (Lc / 2 - 0.09), fy, 0)).weld()));
  g.add(grp(box(Lc, 0.3, 0.08, C.maroon), box(Lc - 0.16, 0.18, 0.01, C.green).at(0, 0.06, 0.045)).weld().at(0, fy, Wc / 2 - 0.04));
  g.add(box(Lc + 0.04, 0.05, 0.12, P.cream).at(0, fy + 0.3, Wc / 2 - 0.04), box(Lc + 0.1, 0.07, 0.5, C.roof).at(0, fy + 1.5, -Wc / 2 + 0.2));
  // portholes on the back wall, letting light in
  [-1.6, 0.6, 1.8].forEach((x) => g.add(cyl(0.12, 0.12, 0.02, K.glow('#dff1ee'), { seg: 18 }).rot(deg(90), 0, 0).at(x, fy + 1.05, -Wc / 2 + 0.09), torus(0.13, 0.03, C.brass, { ts: 20 }).at(x, fy + 1.05, -Wc / 2 + 0.11)));
  // bench along the back wall with a radio half-open
  g.add(box(2.3, 0.08, 0.6, P.wood).at(-0.6, fy + 0.72, -Wc / 2 + 0.4), box(0.08, 0.72, 0.5, P.woodDk).at(-1.65, fy, -Wc / 2 + 0.38), box(0.08, 0.72, 0.5, P.woodDk).at(0.45, fy, -Wc / 2 + 0.38));
  g.add(radio().rot(0, deg(10), 0).at(-0.9, fy + 0.8, -Wc / 2 + 0.4), grp(box(0.3, 0.02, 0.18, P.steel), cyl(0.03, 0.03, 0.1, P.glass, { seg: 8 }).at(0.06, 0.02, 0), cyl(0.03, 0.03, 0.08, P.glass, { seg: 8 }).at(-0.06, 0.02, 0)).at(-0.4, fy + 0.8, -Wc / 2 + 0.45));
  g.add(grp(box(0.16, 0.1, 0.14, P.iron), box(0.04, 0.16, 0.12, P.iron).at(-0.06, 0.1, 0), box(0.04, 0.16, 0.12, P.iron).at(0.06, 0.1, 0)).at(0.15, fy + 0.8, -Wc / 2 + 0.4));
  // pegboard of tools
  const peg = texMat(tex.custom(256, 128, (x, w, h) => { x.fillStyle = '#d9b07a'; x.fillRect(0, 0, w, h); x.fillStyle = '#9c7445'; for (let i = 0; i < 16; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(i * 16 + 8, j * 16 + 8, 2.5, 0, 7); x.fill(); } }));
  g.add(box(2.0, 0.6, 0.02, peg).at(-0.6, fy + 0.98, -Wc / 2 + 0.11));
  [[-1.35, P.red], [-1.15, P.mustard], [-0.95, C.green]].forEach(([x, c]) => g.add(grp(cap(0.03, 0.12, c, { seg: 8 }), cyl(0.008, 0.008, 0.2, P.steel, { seg: 5 }).rot(deg(180), 0, 0).at(0, 0, 0)).at(x, fy + 1.15, -Wc / 2 + 0.15)));
  g.add(grp(box(0.05, 0.3, 0.03, P.iron), box(0.14, 0.06, 0.03, P.iron).at(0, 0.28, 0)).at(-0.6, fy + 0.95, -Wc / 2 + 0.15), torus(0.1, 0.02, P.ink2, { ts: 16 }).at(-0.25, fy + 1.15, -Wc / 2 + 0.14), grp(box(0.3, 0.04, 0.03, P.wood), box(0.04, 0.12, 0.03, P.steel).at(0.15, 0, 0)).rot(0, 0, 0.3).at(0.05, fy + 1.1, -Wc / 2 + 0.14));
  // shelves of jobs, every one with a paper ticket
  const shelfX = 1.5;
  [0.5, 0.95, 1.38].forEach((y) => g.add(box(1.6, 0.04, 0.4, P.woodDk).at(shelfX, fy + y, -Wc / 2 + 0.3)));
  const tk = (n, x, y) => ticket(n, 0.16, 0.1).rot(deg(-10), 0, deg(6)).at(x, y, -Wc / 2 + 0.52);
  g.add(toaster().at(shelfX - 0.45, fy + 0.54, -Wc / 2 + 0.3), tk('12', shelfX - 0.45, fy + 0.48), musicBox().at(shelfX + 0.05, fy + 0.54, -Wc / 2 + 0.3), tk('9', shelfX + 0.05, fy + 0.48), radio({ body: P.sea }).sc(0.7).at(shelfX + 0.5, fy + 0.54, -Wc / 2 + 0.3), tk('14', shelfX + 0.5, fy + 0.48));
  g.add(grp(cyl(0.12, 0.12, 0.04, P.mustard, { seg: 16 }).rot(deg(90), 0, 0).at(0, 0.12, 0), cyl(0.1, 0.1, 0.01, P.cream, { seg: 16 }).rot(deg(90), 0, 0).at(0, 0.12, 0.04), box(0.2, 0.03, 0.06, P.mustard)).at(shelfX - 0.4, fy + 0.99, -Wc / 2 + 0.3), tk('3', shelfX - 0.4, fy + 0.93));
  g.add(grp(cone(0.14, 0.16, P.red, { seg: 14 }).at(0, 0.24, 0), cyl(0.02, 0.02, 0.24, C.brass, { seg: 6 }), cyl(0.07, 0.08, 0.03, C.brass, { seg: 12 })).at(shelfX + 0.15, fy + 0.99, -Wc / 2 + 0.3), tk('5', shelfX + 0.15, fy + 0.93));
  g.add(grp(lathe([[0.001, 0], [0.09, 0], [0.11, 0.08], [0.08, 0.15], [0.001, 0.16]], P.white, { seg: 14 }), cone(0.03, 0.1, P.white, { seg: 8 }).rot(0, 0, deg(-60)).at(0.1, 0.06, 0), sph(0.025, P.white, { seg: 8 }).at(0, 0.17, 0)).at(shelfX + 0.6, fy + 0.99, -Wc / 2 + 0.3), tk('8', shelfX + 0.6, fy + 0.93));
  g.add(K.crate(0.3).at(shelfX - 0.4, fy + 1.42, -Wc / 2 + 0.3), K.crate(0.26).at(shelfX + 0.1, fy + 1.42, -Wc / 2 + 0.3));
  // the stove at the bow end, a kettle, the cat on the rug
  const stoveX = -Lc / 2 + 0.45;
  g.add(grp(box(0.7, 0.04, 0.7, P.brick), lathe([[0.001, 0.04], [0.2, 0.04], [0.24, 0.3], [0.2, 0.55], [0.001, 0.56]], P.ink2, { seg: 18 }), cyl(0.12, 0.12, 0.02, K.glow(P.orange), { seg: 14 }).rot(deg(90), 0, 0).at(0, 0.24, 0.2), cyl(0.06, 0.06, 1.0, P.ink2, { seg: 12 }).at(0, 0.56, 0), torus(0.062, 0.015, C.brass, { ts: 16 }).rot(deg(90), 0, 0).at(0, 0.9, 0)).at(stoveX, fy, -0.2));
  g.add(grp(lathe([[0.001, 0], [0.1, 0], [0.11, 0.08], [0.06, 0.15], [0.001, 0.16]], C.brass, { seg: 14 }), cone(0.02, 0.08, C.brass, { seg: 6 }).rot(0, 0, deg(-55)).at(0.09, 0.06, 0)).at(stoveX - 0.06, fy + 0.56, -0.24));
  g.add(cyl(0.45, 0.45, 0.01, texMat(tex.stripes({ colors: [C.maroon, C.cream, C.gold], n: 9 })), { seg: 24 }).sc(1.3, 1, 0.8).at(stoveX + 0.75, fy, 0.35), K.cat({ color: P.ink2, belly: P.white }).sc(0.7).rot(0, deg(-40), 0).at(stoveX + 0.7, fy + 0.01, 0.35));
  // you at work, and a stool
  g.add(you({ pose: 'hold', held: grp(cyl(0.025, 0.025, 0.14, P.mustard, { seg: 8 }).rot(deg(80), 0, 0), cyl(0.006, 0.006, 0.12, P.steel, { seg: 5 }).rot(deg(80), 0, 0).at(0, 0.02, 0.14)).at(0, 0, -0.1) }).sc(0.85).rot(0, deg(-20), 0).at(-0.55, fy, 0.25));
  g.add(grp(cyl(0.16, 0.16, 0.05, P.woodLt, { seg: 16 }).at(0, 0.5, 0), ...[0, 1, 2].map((i) => cyl(0.02, 0.025, 0.5, P.woodDk, { seg: 6 }).at(Math.cos(i * 2.1) * 0.1, 0, Math.sin(i * 2.1) * 0.1))).at(0.25, fy, 0.45));
  g.add(K.lantern(C.brass).at(-1.4, fy + 0.8, -Wc / 2 + 0.35));
  return g;
}

export default {
  slug: 'fix-it-barge',
  title: 'Fix-It Barge',
  logline: 'A repair workshop on a canal narrowboat. Moor up, fix the town\'s broken things, sail on to the next lock.',
  genre: ['Cosy job sim', 'Repair', 'Travelling shop'],
  theme: { accent: '#2f6b4f', cardBg: '#f1e4cc', modeLabel: 'Full colour · autumn' },
  pitch: 'You inherit a narrowboat fitted out as a workshop. Each stop is a canal town, and people bring you broken radios, toasters, bikes and music boxes. Open them up on the bench, find the fault, swap the part, close it up and hand it back. Fixed things then turn up around town.',
  loop: ['Moor up at a lock town', 'Take in broken things on paper tickets', 'Open up, find the fault, swap the part', 'Deliver it, get paid in coin and spares', 'Upgrade tools, sail to the next lock'],
  why: ['Opened-up objects with their parts laid out in rows look great with thick outlines.', 'Long boat, lock and hump-back bridge make an instant postcard for the Steam capsule.', 'The repair bench is the kite workbench camera again, so the style is already proven.'],
  fromYou: 'You played ReStory more than Leafy Corner and Tiny Bookshop put together. This mixes its repairs with Tiny Bookshop\'s travelling shop and your exploded-view channel idea.',
  similar: [
    { name: 'ReStory: Chill Electronics Repairs', url: 'https://store.steampowered.com/app/3812600', note: 'the repair loop this grows from' },
    { name: 'Tiny Bookshop', url: 'https://store.steampowered.com/app/2133760', note: 'shop on wheels, new town every few days' },
    { name: 'Assemble with Care', url: 'https://store.steampowered.com/app/1202900', note: 'gentle fixing of other people\'s things' },
    { name: 'PowerWash Simulator', url: 'https://store.steampowered.com/app/1290000', note: 'proof that doing a job well is the fun' },
  ],
  palette: [['Narrowboat green', C.green], ['Boat maroon', C.maroon], ['Brass', C.brass], ['Towpath stone', C.stone], ['Canal water', C.water], ['Autumn leaf', C.leaf]],
  key: { build: () => keyArt(), bg: [[0, '#f4cf9e'], [0.55, '#f6e2c2'], [1, '#efe2c9']], cam: { yaw: -26, pitch: 22, fov: 24 }, caption: 'Moored at Bridge 42, late October' },
  characters: [
    { name: 'Wren', role: 'You. Inherited the boat and an uncle\'s toolbox. Goggles always up.', build: () => you() },
    { name: 'Alf', role: 'Lock-keeper. Knows every boat by its engine and every fault by its rattle.', build: () => alf() },
    { name: 'Poppy', role: 'Her music box stopped halfway through a song. First customer in town.', build: () => poppy() },
    { name: 'The Major', role: 'A heron. Stands on the lock gate every morning and judges your work.', build: () => heron().rot(0, deg(-25), 0) },
  ],
  builds: [
    { name: 'Magpie', tag: 'Vehicle', note: 'The workshop boat: hatch counter, roof sign, chimney and plants.', build: () => boatOnWater(), cam: { yaw: -24, pitch: 20 } },
    { name: 'Lock 14', tag: 'Structure', note: 'Gates with balance beams and the lock-keeper\'s cottage.', build: () => lockBuild(), cam: { yaw: -30, pitch: 38 } },
    { name: 'The repair bench', tag: 'Prop', note: 'An opened radio, parts laid out in rows. The bad part has a red tag.', build: () => benchTop(), cam: { yaw: -8, pitch: 50 } },
    { name: 'Delivery bike', tag: 'Vehicle', note: 'Takes fixed things back to their owners. Bell works.', build: () => bikeBuild(), cam: { yaw: -22, pitch: 22 } },
  ],
  environments: [
    { name: 'Lock 14, late afternoon', note: 'Wait in the lock and people bring their broken things to the edge.', build: () => lockTown(), stage: { bg: [[0, '#f2b98a'], [0.6, '#f4d9b8'], [1, '#ecd6ba']], light: 'day', sun: [-0.9, 0.55, 0.45] }, cam: { yaw: -24, pitch: 34 } },
    { name: 'Inside the workshop', note: 'Cutaway of the cabin: bench, pegboard, shelf of tickets, the stove and the cat.', build: () => cabinCutaway(), cam: { yaw: -14, pitch: 30, fov: 26 } },
  ],
};
