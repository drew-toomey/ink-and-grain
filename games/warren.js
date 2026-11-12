// Warren — board 8. Side-on cutaway bunker under a family house. Every build() returns a fresh Object3D. Front faces +Z.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, tex, texMat, deg, rng, glow } = K;

// --- local palette
const C = {
  top: '#8b5e3c', mid: '#7b5236', clay: '#6b4630', deep: '#583a2a',
  lamp: '#f1b42f', conc: '#b9b3a8', concDk: '#948d82', tin: '#c8402e', moss: '#77a14e',
  lawn: '#86ad5a', lawnDk: '#5f8a45', root: '#d6b088', stone: '#a99d8b', stoneDk: '#857a6b',
  plank: '#bf8b5a', plankDk: '#87593a', jacket: '#7f7c46', car: '#6f93a8', carDk: '#4e6f80',
  sand: '#bfae80', house: '#e8d8b8', roof: '#7d5646', gravel: '#b7ab96',
};
const SKY = [[0, '#7c82b0'], [0.42, '#e0a487'], [0.72, '#f1d2ae'], [1, '#efe3cb']];

// --- tiny helpers
const mix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();
const shine = (r, c = '#ffe6a0', op = 0.28) => sph(r, glow(c, { opacity: op, depthWrite: false }), { seg: 18 }).noInk().noShadow();
const plight = (x, y, z, i = 2.4, d = 2.4, c = '#ffc46a') => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(x, y, z); return l; };
const star = (s = 0.08, c = '#fff4c8') => extrude([[0, s], [s * 0.22, s * 0.22], [s, 0], [s * 0.22, -s * 0.22], [0, -s], [-s * 0.22, -s * 0.22], [-s, 0], [-s * 0.22, s * 0.22]], 0.01, glow(c)).noInk().noShadow();

// --- soil: flat toon strata, cut by rectangular cavities. Planar XY uvs so every face shows the right band.
function strata(W, H, seed = 4) {
  const pw = 2048, ph = Math.max(64, Math.round((pw * H) / W));
  return tex.custom(pw, ph, (x, w, h) => {
    const r = rng(seed);
    [[0, C.top], [0.2, C.mid], [0.47, C.clay], [0.76, C.deep]].forEach(([f, col], i) => {
      x.fillStyle = col;
      if (!i) { x.fillRect(0, 0, w, h); return; }
      const y0 = f * h, p1 = r() * 6, p2 = r() * 6, amp = h * 0.028, fr = 1.5 + r() * 2;
      x.beginPath(); x.moveTo(0, h);
      for (let px = 0; px <= w; px += 6) { const t = px / w, env = Math.min(1, Math.sin(Math.PI * t) * 4); x.lineTo(px, y0 + env * amp * (Math.sin(t * Math.PI * 2 * fr + p1) + 0.3 * Math.sin(t * 46 + p2))); }
      x.lineTo(w, h); x.closePath(); x.fill();
    });
    for (let i = 0; i < 140; i++) {
      const px = r() * w, py = h * (0.06 + r() * 0.92), s = 2.5 + r() * 6;
      x.fillStyle = r() < 0.55 ? 'rgba(255,226,190,0.16)' : 'rgba(40,20,10,0.2)';
      x.beginPath(); x.ellipse(px, py, s * 1.5, s, r() * 3, 0, 7); x.fill();
    }
  });
}
function soil(W, H, D, cav, o = {}) {
  const dr = o.dr ?? 1.5, zf = D / 2, zb = zf - dr, m = texMat(strata(W, H, o.seed ?? 4));
  const pbox = (x0, x1, y0, y1, z0, z1) => {
    const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0).translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
    const p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + W / 2) / W, (p.getY(i) + H) / H);
    const mesh = new THREE.Mesh(g, m); mesh.castShadow = mesh.receiveShadow = true; return mesh;
  };
  const cl = (v, a, b) => Math.max(a, Math.min(b, v));
  const xs = [...new Set([-W / 2, W / 2, ...cav.flatMap((c) => [cl(c[0], -W / 2, W / 2), cl(c[1], -W / 2, W / 2)])])].sort((a, b) => a - b);
  const ys = [...new Set([-H, 0, ...cav.flatMap((c) => [cl(c[2], -H, 0), cl(c[3], -H, 0)])])].sort((a, b) => a - b);
  const g = grp();
  for (let j = 0; j < ys.length - 1; j++) {
    const cy = (ys[j] + ys[j + 1]) / 2; let run = null;
    for (let i = 0; i < xs.length - 1; i++) {
      const cx = (xs[i] + xs[i + 1]) / 2, hole = cav.some((c) => cx > c[0] && cx < c[1] && cy > c[2] && cy < c[3]);
      if (!hole && run == null) run = xs[i];
      if ((hole || i === xs.length - 2) && run != null) { g.add(pbox(run, hole ? xs[i] : xs[i + 1], ys[j], ys[j + 1], zb, zf)); run = null; }
    }
  }
  g.add(pbox(-W / 2, W / 2, -H, 0, -D / 2, zb));
  return g.weld();
}
/** Lawn layer on y=0..0.08, with front openings [[a,b],..] of depth zd. */
function lawn(W, D, holes = [], zd = 0.8) {
  const zf = D / 2, g = grp(), th = 0.08;
  g.add(box(W, th, D - zd, C.lawn).at(0, 0, -D / 2 + (D - zd) / 2));
  let x = -W / 2;
  [...holes, [W / 2, W / 2]].forEach(([a, b]) => { if (a - x > 0.01) g.add(box(a - x, th, zd, C.lawn).at((x + a) / 2, 0, zf - zd / 2)); x = b; });
  g.weld();
  // grass lip along the cut
  x = -W / 2;
  const lip = grp();
  [...holes, [W / 2, W / 2]].forEach(([a, b]) => { if (a - x > 0.01) lip.add(box(a - x, 0.05, 0.05, C.lawnDk).at((x + a) / 2, 0.04, zf + 0.01)); x = b; });
  const r = rng(11);
  for (let i = 0; i < W * 2.2; i++) { const tx = -W / 2 + 0.2 + r() * (W - 0.4); if (!holes.some(([a, b]) => tx > a - 0.1 && tx < b + 0.1)) lip.add(K.grassTuft(i % 3 ? C.moss : C.lawnDk, 0.16 + r() * 0.08).at(tx, 0.07, zf - 0.05 - r() * 0.5)); }
  return grp(g, lip);
}

// --- room shell: concrete lining, plank floor, lamp-lit back wall (a stepped pool of light painted in flat tones)
function poolTex(w, h, lx, base) {
  const W = 256, H = Math.max(32, Math.round((256 * h) / w));
  return tex.custom(W, H, (x) => {
    x.fillStyle = mix(base, '#4a3020', 0.22); x.fillRect(0, 0, W, H);
    [[1.3, base], [0.85, mix(base, '#fff1c4', 0.42)], [0.45, mix(base, '#fffbea', 0.78)]].forEach(([s, c]) => { x.fillStyle = c; x.beginPath(); x.ellipse(lx * W, H * 0.06, W * 0.46 * s, H * 0.92 * s, 0, 0, 7); x.fill(); });
  });
}
const hangLamp = (len = 0.16, shade = C.tin) => grp(
  cyl(0.008, 0.008, len, P.ink2, { seg: 5 }).at(0, -len, 0).noInk(),
  cone(0.1, 0.08, shade, { seg: 16 }).at(0, -len - 0.07, 0),
  sph(0.045, glow('#fff3c4'), { seg: 12 }).at(0, -len - 0.08, 0),
  shine(0.2).at(0, -len - 0.1, 0),
);
function room(r, zf, dr) {
  const t = 0.1, g = grp(), w = r.x1 - r.x0, h = r.y1 - r.y0, cx = (r.x0 + r.x1) / 2, zbk = zf - dr, zc = zf - dr / 2;
  const fl = texMat(tex.planks({ base: r.floor ?? C.plank, line: C.plankDk, n: Math.max(3, Math.round(w * 3)), vertical: true }));
  const slab = (y, gap, m) => {
    const a = r.x0 - t, b = r.x1 + t;
    if (!gap) return [box(b - a, t, dr + 0.04, m).at(cx, y, zc + 0.02)];
    const zd = gap.zd ?? 0.8, out = [box(b - a, t, dr - zd, m).at(cx, y, zbk + (dr - zd) / 2)];
    [[a, gap.x[0]], [gap.x[1], b]].forEach(([p, q]) => q - p > 0.01 && out.push(box(q - p, t, zd + 0.04, m).at((p + q) / 2, y, zf - zd / 2 + 0.02)));
    return out;
  };
  g.put(slab(r.y0 - t, r.gapF, fl), slab(r.y1, r.gapC, C.conc));
  if (!r.openL) g.add(box(t, h, dr + 0.04, C.concDk).at(r.x0 - t / 2, r.y0, zc + 0.02));
  if (!r.openR) g.add(box(t, h, dr + 0.04, C.concDk).at(r.x1 + t / 2, r.y0, zc + 0.02));
  g.add(box(w, h, 0.04, glow('#ffffff', { map: poolTex(w, h, r.lx ?? 0.5, r.wall ?? '#e7c48a') })).at(cx, r.y0, zbk + 0.02));
  const lx = r.x0 + w * (r.lx ?? 0.5);
  if (r.lamp !== false) g.add(hangLamp(0.14, r.shade).at(lx, r.y1, zc - 0.15), plight(lx, r.y1 - 0.32, zf - 0.32, r.li ?? 2.6, 2.3));
  return g;
}
function shaftLining(a, b, ya, yb, zf, zd = 0.8) {
  const t = 0.1, h = yb - ya;
  return grp(box(b - a + 2 * t, h, t, C.concDk).at((a + b) / 2, ya, zf - zd - t / 2), box(t, h, zd + 0.04, C.conc).at(a - t / 2, ya, zf - zd / 2 + 0.02), box(t, h, zd + 0.04, C.conc).at(b + t / 2, ya, zf - zd / 2 + 0.02));
}

// --- props
const ladder = (h, w = 0.3, c = C.plankDk) => { const g = grp(...[-1, 1].map((s) => box(0.045, h, 0.045, c).at((s * w) / 2, 0, 0))); for (let y = 0.14; y < h - 0.04; y += 0.19) g.add(box(w, 0.03, 0.035, c).at(0, y, 0)); return g.weld(); };
const tin = (c = C.tin) => grp(cyl(0.048, 0.048, 0.11, P.steel, { seg: 12 }), cyl(0.05, 0.05, 0.06, c, { seg: 12 }).at(0, 0.025, 0)).weld();
const jar = (c = P.mustard) => grp(cyl(0.045, 0.045, 0.12, glow(mix(c, '#ffffff', 0.15)), { seg: 12 }), cyl(0.05, 0.05, 0.03, P.steel, { seg: 12 }).at(0, 0.12, 0)).weld();
function shelf(w = 0.9, h = 0.95, rows = 3, fill = 'tins', d = 0.24) {
  const g = grp(...[-1, 1].map((s) => box(0.05, h, d, C.plankDk).at(s * (w / 2 - 0.025), 0, 0)));
  const cols = [C.tin, P.mustard, P.steel, C.moss, P.cream, C.tin, P.terracotta];
  for (let i = 0; i < rows; i++) {
    const y = 0.04 + (i * (h - 0.06)) / rows;
    g.add(box(w, 0.035, d, C.plank).at(0, y, 0));
    const n = Math.floor((w - 0.1) / 0.115);
    for (let k = 0; k < n; k++) { if ((i + k) % 5 === 4) continue; const it = fill === 'jars' ? jar(cols[(i * 2 + k) % cols.length]) : tin(cols[(i * 3 + k) % cols.length]); g.add(it.at(-w / 2 + 0.1 + k * 0.115, y + 0.035, 0.02)); }
  }
  g.add(box(w, 0.035, d, C.plank).at(0, h - 0.035, 0));
  return g;
}
function bunk(len = 1.0) {
  const g = grp(), wd = 0.42;
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([sx, sz]) => g.add(box(0.05, 0.86, 0.05, C.plankDk).at((sx * len) / 2, 0, (sz * wd) / 2)));
  [[0.12, C.tin], [0.52, P.mustard]].forEach(([y, blanket]) => {
    g.add(box(len + 0.04, 0.05, wd, C.plank).at(0, y, 0));
    g.add(rbox(len - 0.04, 0.07, wd - 0.06, P.cream, { r: 0.03 }).at(0, y + 0.05, 0));
    g.add(rbox(len * 0.62, 0.08, wd - 0.03, blanket, { r: 0.035 }).at(len * 0.17, y + 0.07, 0));
    g.add(rbox(0.2, 0.07, 0.26, P.white, { r: 0.03 }).at(-len / 2 + 0.15, y + 0.11, 0));
  });
  g.add(box(len * 0.55, 0.04, 0.03, C.plankDk).at(len * 0.18, 0.72, wd / 2));
  g.add(ladder(0.62, 0.18).rot(deg(-8), 0, 0).at(len / 2 - 0.16, 0.14, wd / 2 + 0.08));
  return g;
}
function stove(flue = 0.6) {
  const g = grp(rbox(0.36, 0.32, 0.3, P.iron, { r: 0.03 }).at(0, 0.07, 0), box(0.4, 0.03, 0.34, P.ink2).at(0, 0.39, 0));
  [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => g.add(box(0.04, 0.08, 0.04, P.ink2).at(a * 0.14, 0, b * 0.11)));
  g.add(box(0.18, 0.12, 0.02, glow('#ffa646')).at(0, 0.14, 0.151), box(0.22, 0.02, 0.03, P.ink2).at(0, 0.27, 0.15).noInk());
  g.add(cyl(0.04, 0.04, flue, P.iron, { seg: 12 }).at(0.1, 0.42, -0.06));
  g.add(grp(sph(0.07, P.steel, { seg: 14 }).sc(1, 0.8, 1).at(0, 0.05, 0), cyl(0.012, 0.02, 0.09, P.steel, { seg: 6 }).rot(0, 0, deg(-55)).at(0.06, 0.04, 0), torus(0.04, 0.008, P.ink2, { arc: Math.PI }).at(0, 0.1, 0)).at(-0.08, 0.42, 0.03));
  g.add(sph(0.05, glow('#ffffff', { opacity: 0.6, depthWrite: false }), { seg: 10 }).at(-0.0, 0.62, 0.04).noInk().noShadow(), sph(0.035, glow('#ffffff', { opacity: 0.45, depthWrite: false }), { seg: 10 }).at(0.04, 0.72, 0.03).noInk().noShadow());
  return g;
}
function table(w = 0.6, cloth = true) {
  const g = grp(box(w, 0.04, 0.38, C.plank).at(0, 0.36, 0), ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => box(0.04, 0.36, 0.04, C.plankDk).at(a * (w / 2 - 0.05), 0, b * 0.14)));
  if (cloth) g.add(box(w * 0.7, 0.012, 0.4, texMat(tex.checker({ a: P.white, b: C.tin, n: 6 }))).at(0, 0.4, 0).noInk());
  return g;
}
const stool = (c = C.plank) => grp(cyl(0.1, 0.1, 0.04, c, { seg: 14 }).at(0, 0.24, 0), ...[0, 1, 2].map((i) => cyl(0.015, 0.015, 0.24, C.plankDk, { seg: 6 }).at(Math.cos(i * 2.1) * 0.07, 0, Math.sin(i * 2.1) * 0.07)));
function radioSet() {
  return grp(
    rbox(0.42, 0.22, 0.2, '#6c6a52', { r: 0.03 }),
    box(0.16, 0.08, 0.02, glow('#ffd36b')).at(-0.09, 0.11, 0.1),
    ...[0, 1, 2].map((i) => cyl(0.025, 0.025, 0.03, P.ink2, { seg: 10 }).rot(deg(90), 0, 0).at(0.06 + i * 0.06, 0.07, 0.1)),
    cyl(0.05, 0.05, 0.02, P.ink2, { seg: 14 }).rot(deg(90), 0, 0).at(0.12, 0.15, 0.1),
    cyl(0.01, 0.01, 0.4, P.steel, { seg: 6 }).rot(0, 0, deg(-12)).at(0.16, 0.22, -0.05),
  );
}
function crankRadio() {
  return grp(
    rbox(0.34, 0.22, 0.13, C.tin, { r: 0.04 }),
    cyl(0.065, 0.065, 0.02, P.ink2, { seg: 16 }).rot(deg(90), 0, 0).at(-0.07, 0.11, 0.065),
    box(0.1, 0.05, 0.02, glow('#ffd36b')).at(0.08, 0.14, 0.066),
    cyl(0.01, 0.01, 0.34, P.steel, { seg: 6 }).rot(0, 0, deg(-18)).at(0.12, 0.2, -0.03),
    grp(box(0.025, 0.11, 0.025, P.iron).at(0, -0.11, 0), cyl(0.022, 0.022, 0.07, P.ink2, { seg: 8 }).rot(0, 0, deg(90)).at(0.04, -0.1, 0)).rot(0, 0, 0.5).at(0.18, 0.11, 0),
  );
}
function knitting() {
  return grp(
    box(0.28, 0.2, 0.03, texMat(tex.stripes({ colors: [C.tin, P.cream], n: 6, vertical: false }))).at(0, -0.12, 0),
    cyl(0.009, 0.009, 0.42, P.woodLt, { seg: 6 }).rot(0, 0, deg(62)).at(0.12, -0.02, 0.03),
    cyl(0.009, 0.009, 0.42, P.woodLt, { seg: 6 }).rot(0, 0, deg(-62)).at(-0.12, -0.02, 0.03),
    sph(0.075, P.mustard, { seg: 14 }).at(0.22, -0.22, 0.04),
  );
}
function armchair(c = C.moss) {
  return grp(rbox(0.6, 0.2, 0.5, c, { r: 0.06 }).at(0, 0.08, 0), rbox(0.6, 0.48, 0.14, c, { r: 0.06 }).at(0, 0.08, -0.2), rbox(0.12, 0.3, 0.5, c, { r: 0.05 }).at(-0.3, 0.08, 0), rbox(0.12, 0.3, 0.5, c, { r: 0.05 }).at(0.3, 0.08, 0), rbox(0.4, 0.07, 0.36, P.cream, { r: 0.03 }).at(0, 0.27, 0.04), ...[-1, 1].map((s) => box(0.05, 0.08, 0.05, C.plankDk).at(s * 0.28, 0, 0.2)));
}
const rug = (w = 1.0, d = 0.6, cols = [C.tin, P.mustard, P.cream]) => box(w, 0.015, d, texMat(tex.stripes({ colors: cols, n: 9 }))).noInk();
// spade held at the middle of its shaft: origin = the hand
const spade = () => grp(cyl(0.02, 0.02, 0.72, C.plank, { seg: 8 }).at(0, -0.26, 0), torus(0.055, 0.014, C.plankDk, { ts: 16 }).at(0, 0.52, 0), extrude([[-0.1, 0], [0.1, 0], [0.09, -0.2], [0, -0.26], [-0.09, -0.2]], 0.025, P.steel).at(0, -0.24, 0));
const bucket = (c = P.steel, fill = C.top) => grp(cyl(0.12, 0.09, 0.2, c, { seg: 16 }), sph(0.11, fill, { part: 'top', seg: 14 }).sc(1, 0.6, 1).at(0, 0.18, 0), torus(0.11, 0.008, P.ink2, { arc: Math.PI }).at(0, 0.2, 0).rot(0, 0, 0.3));
const jerry = (c = C.tin) => grp(rbox(0.2, 0.28, 0.1, c, { r: 0.025 }), box(0.06, 0.06, 0.04, P.ink2).at(0.06, 0.28, 0));
const sandbag = () => rbox(0.32, 0.12, 0.2, C.sand, { r: 0.055 });
const bottle = (c = '#6f9d73') => grp(cyl(0.04, 0.045, 0.14, c, { seg: 10 }), cyl(0.015, 0.03, 0.08, c, { seg: 8 }).at(0, 0.14, 0)).weld();
const bone = () => grp(cap(0.022, 0.18, P.cream, { seg: 8 }).rot(0, 0, deg(90)).at(0.11, 0, 0), ...[-1, 1].flatMap((s) => [sph(0.035, P.cream, { seg: 8 }).at(s * 0.11, 0.025, 0), sph(0.035, P.cream, { seg: 8 }).at(s * 0.11, -0.025, 0)])).weld();
const teacup = () => grp(lathe2([[0.001, 0], [0.04, 0], [0.065, 0.07], [0.001, 0.07]], P.white), torus(0.025, 0.008, P.white).at(0.07, 0.035, 0));
function lathe2(pts, c) { return K.lathe(pts, c, { seg: 14 }); }
function gnome() {
  return grp(cone(0.1, 0.18, P.blue, { seg: 12 }), sph(0.065, P.skin1, { seg: 12 }).at(0, 0.21, 0), sph(0.06, P.white, { part: 'bottom', seg: 12 }).at(0, 0.2, 0.03), cone(0.07, 0.17, C.tin, { seg: 12 }).at(0, 0.24, 0), sph(0.018, P.pink, { seg: 8 }).at(0, 0.21, 0.065));
}
function headTorch(p, beam = false) {
  const hr = 0.34, hy = 1.06 + hr * 0.92;
  p.add(torus(hr * 1.04, 0.028, P.ink2, { ts: 30 }).rot(deg(90), 0, 0).sc(1, 0.95, 1).at(0, hy + hr * 0.36, -0.01));
  p.add(grp(cyl(0.075, 0.075, 0.09, P.iron, { seg: 14 }), cyl(0.06, 0.06, 0.015, glow('#fff3c0'), { seg: 14 }).at(0, 0.09, 0)).rot(deg(90), 0, 0).at(0, hy + hr * 0.42, hr * 0.86));
  if (beam) { const L = 1.5; p.add(cone(0.4, L, glow('#fff1b8', { opacity: 0.13, depthWrite: false }), { seg: 20, open: true }).rot(deg(-74), 0, 0).at(0, hy + hr * 0.42 - L * 0.27, hr * 0.9 + L * 0.96).noInk().noShadow()); }
  return p;
}

// --- people
function parent(o = {}) {
  const p = K.person({ hairStyle: 'short', hair: P.hairBrown, skin: P.skin2, top: C.jacket, bottom: '#4b5468', shoes: '#4a3424', acc: o.lantern === false ? [] : ['lantern'], pose: o.pose ?? 'stand', held: o.held === undefined ? spade().rot(0, 0, 0.12) : o.held });
  const dk = mix(C.jacket, '#2a1c14', 0.25);
  p.add(box(0.14, 0.09, 0.02, dk).at(-0.13, 0.66, 0.255).noInk(), box(0.14, 0.09, 0.02, dk).at(0.13, 0.66, 0.255).noInk(), box(0.03, 0.42, 0.02, dk).at(0, 0.6, 0.262).noInk(), torus(0.19, 0.045, mix(C.jacket, '#2a1c14', 0.15), { ts: 20 }).rot(deg(90), 0, 0).at(0, 1.03, 0));
  return headTorch(p, o.beam);
}
const teen = (o = {}) => K.person({ hairStyle: 'spiky', hair: P.hairBlack, skin: P.skin3, top: C.moss, bottom: '#3d4660', shoes: P.white, acc: ['headphones'], accColor: P.mustard, pose: o.pose ?? 'hold', held: o.held === undefined ? crankRadio() : o.held }).sc(0.92);
const gran = (o = {}) => K.person({ body: 'elder', hairStyle: 'curly', hair: P.hairGrey, skin: P.skin1, top: '#9a7fae', bottom: '#6b5a6e', skirt: true, shoes: C.tin, acc: ['glasses'], pose: 'hold', held: knitting() });
const pup = (s = 1) => grp(K.dog({ color: '#d9a066', ear: '#8c5732', collar: C.tin })).sc(s);

// --- vehicles & buildings
function estate(o = {}) {
  const g = grp(), body = o.body ?? C.car, L = 2.1, Wd = 0.92;
  g.add(rbox(L, 0.4, Wd, body, { r: 0.12 }).at(0, 0.16, 0));
  g.add(rbox(1.46, 0.36, Wd * 0.9, body, { r: 0.1 }).at(-0.25, 0.52, 0));
  g.add(box(L * 0.92, 0.05, Wd + 0.01, P.cream).at(0, 0.42, 0).noInk());
  const gl = P.glassDk;
  [-1, 1].forEach((s) => { g.add(box(0.6, 0.22, 0.02, gl).at(0.1, 0.6, s * Wd * 0.45), box(0.6, 0.22, 0.02, gl).at(-0.6, 0.6, s * Wd * 0.45)); });
  g.add(box(0.02, 0.24, Wd * 0.76, gl).at(0.485, 0.6, 0), box(0.02, 0.22, Wd * 0.7, gl).at(-0.985, 0.6, 0));
  [[0.66, 1], [0.66, -1], [-0.66, 1], [-0.66, -1]].forEach(([x, s]) => g.add(K.wheel(0.19, 0.12).at(x, 0.19, s * 0.44)));
  [-1, 1].forEach((s) => { g.add(sph(0.06, glow('#fff1c0'), { seg: 10 }).at(L / 2, 0.38, s * 0.3), box(0.03, 0.08, 0.14, C.tin).at(-L / 2, 0.42, s * 0.33)); });
  g.add(box(0.06, 0.08, Wd + 0.04, P.steel).at(L / 2 + 0.01, 0.16, 0), box(0.06, 0.08, Wd + 0.04, P.steel).at(-L / 2 - 0.01, 0.16, 0), box(0.02, 0.07, 0.3, P.cream).at(-L / 2 - 0.04, 0.24, 0));
  // roof rack with jerrycans and a tarp roll
  [-1, 1].forEach((s) => g.add(box(1.3, 0.03, 0.03, P.ink2).at(-0.25, 0.9, s * 0.36)));
  [-0.75, 0.2].forEach((x) => g.add(box(0.03, 0.03, 0.78, P.ink2).at(x, 0.9, 0)));
  g.add(jerry(C.tin).rot(0, 0, deg(90)).at(-0.5, 0.93, -0.12), jerry(C.moss).rot(0, 0, deg(90)).at(-0.5, 0.93, 0.14), cap(0.11, 0.55, C.lawnDk, { seg: 12 }).rot(deg(90), 0, 0).at(0.05, 1.04, -0.38));
  if (o.beams) [-1, 1].forEach((s) => g.add(cone(0.5, 2.4, glow('#fff1b8', { opacity: 0.13, depthWrite: false }), { seg: 20, open: true }).rot(0, 0, deg(83)).at(L / 2 + 2.4 * 0.993, 0.38 - 2.4 * 0.12, s * 0.3).noInk().noShadow()));
  if (o.bootOpen) {
    g.add(grp(box(0.04, 0.36, Wd * 0.86, body).at(-0.02, -0.36, 0), box(0.02, 0.2, Wd * 0.66, gl).at(-0.045, -0.26, 0)).rot(0, 0, deg(-78)).at(-0.98, 0.88, 0));
    g.add(K.crate(0.3).at(-0.8, 0.56, -0.18), K.crate(0.26).rot(0, 0.4, 0).at(-0.82, 0.56, 0.18), jerry(C.tin).at(-0.7, 0.56, 0.0));
  }
  return g;
}
function hatch(o = {}) {
  // surface fittings for a shaft opening x∈[a,b], front zone z∈[zf-zd, zf]; lawn top at y=0.08
  const { a, b, zf, zd = 0.8 } = o, t = 0.1, g = grp(), y = 0.08, cx = (a + b) / 2, zback = zf - zd - t;
  g.add(box(b - a + 2 * t + 0.16, 0.1, 0.12, C.conc).at(cx, y - 0.02, zback - 0.02));
  [a - t - 0.04, b + t + 0.04].forEach((x) => g.add(box(0.1, 0.1, zd + t + 0.06, C.conc).at(x, y - 0.02, zf - (zd + t) / 2 + 0.03)));
  const lw = b - a + 0.18, ld = zd + 0.02;
  g.add(grp(box(lw, 0.05, ld, '#6f7a5a').at(0, 0, ld / 2), torus(0.11, 0.018, C.tin, { ts: 20 }).rot(deg(90), 0, 0).at(0, 0.07, ld / 2), box(0.04, 0.06, 0.04, C.tin).at(0, 0.03, ld / 2)).rot(deg(-104), 0, 0).at(cx, y + 0.06, zback - 0.06));
  [[-1, 0], [-1, 0.32], [1, 0], [1, 0.32]].forEach(([s, dz], i) => g.add(sandbag().rot(0, i * 0.2, 0).at(cx + s * (b - a + 0.62) / 2, y, zf - 0.35 - dz)));
  g.add(sandbag().rot(0, 0.1, 0).at(cx + (b - a + 0.62) / 2, y + 0.12, zf - 0.5));
  return g;
}
function familyHouse(o = {}) {
  const lit = glow('#ffd47e');
  const g = K.house({ w: 2.8, d: 1.7, h: 0.95, floors: 2, wall: C.house, roof: C.roof, door: C.tin, trim: P.white, windows: 2, chimney: true, base: C.stoneDk, glass: o.dark ? P.glassDk : lit, roofH: 0.75 });
  const fz = 1.7 / 2;
  // boarded ground-floor window
  g.add(box(0.3, 0.32, 0.02, P.ink2).at(-0.59, 0.5, fz + 0.04));
  [[0.36], [-0.36], [0]].forEach(([r], i) => g.add(box(0.5, 0.07, 0.03, i === 2 ? C.plankDk : C.plank).rot(0, 0, r).at(-0.59, 0.63 + (i === 2 ? 0.1 : 0), fz + 0.07)));
  // aerial on the chimney, satellite dish
  const ax = 2.8 * 0.28, ay = 0.14 + 1.9 + 0.75 + 0.43, az = -1.7 * 0.12;
  if (o.aerial !== false) g.add(cyl(0.02, 0.02, 0.6, P.steel, { seg: 6 }).at(ax, ay, az), ...[0.3, 0.45].map((y, i) => box(0.42 - i * 0.12, 0.02, 0.02, P.steel).at(ax, ay + y, az)));
  g.add(grp(sph(0.14, P.white, { part: 'bottom', seg: 16 }).rot(deg(-70), 0, 0), cyl(0.012, 0.012, 0.16, P.steel, { seg: 6 }).rot(deg(70), 0, 0).at(0, 0, 0.02)).at(-1.25, 1.55, fz + 0.06));
  return g;
}

// --- the cutaway (key art + environment)
function bunny() {
  const c = '#cdbba4';
  return grp(sph(0.13, c, { seg: 14 }).sc(1.25, 0.85, 1), sph(0.085, c, { seg: 12 }).at(0.15, 0.06, 0), ...[-1, 1].map((s) => cap(0.025, 0.12, c, { seg: 8 }).rot(0, 0, deg(-70)).at(0.12, 0.1, s * 0.035)), sph(0.04, P.white, { seg: 8 }).at(-0.16, 0.02, 0), sph(0.012, P.ink, { seg: 6 }).at(0.215, 0.08, 0.05).noInk());
}
function shed() {
  const g = K.house({ w: 1.1, d: 1.0, h: 0.85, roofType: 'shed', wallMap: tex.planks({ base: '#9c7a56', line: C.plankDk, n: 6, vertical: true }), roof: P.slate, door: '#6f7a5a', windows: 0, base: C.stoneDk, ov: 0.08 });
  g.add(K.pottedPlant(C.tin, C.moss, 0.6).at(0.45, 0, 0.6));
  return g;
}
function cutaway(o = {}) {
  const W = 16, H = 3.9, D = 2.6, dr = 1.5, zf = D / 2, t = 0.1, zd = 0.8, day = o.time === 'day';
  const L1 = [-1.55, -0.4], L2 = [-3.25, -2.1];
  const shaft = [-2.72, -2.24], drop = [-2.08, -1.68], li = day ? 1.3 : 2.4;
  const R = {
    wash: { x0: -7.7, x1: -6.65, y0: L1[0], y1: L1[1], wall: '#cfdcd2', lx: 0.5, shade: P.mustard },
    bunk: { x0: -6.45, x1: -4.05, y0: L1[0], y1: L1[1], wall: '#e9c182', lx: 0.55 },
    hall: { x0: -3.45, x1: -1.5, y0: L1[0], y1: L1[1], wall: '#dcc89a', lx: 0.62, gapC: { x: shaft, zd }, gapF: { x: drop, zd }, shade: P.mustard },
    kitchen: { x0: -1.3, x1: 1.3, y0: L1[0], y1: L1[1], wall: '#d3d8a6', lx: 0.42 },
    radio: { x0: 1.5, x1: 3.4, y0: L1[0], y1: L1[1], wall: '#e7bc86', lx: 0.35, shade: P.mustard },
    pantry: { x0: -7.7, x1: -4.45, y0: L2[0], y1: L2[1], wall: '#e1c595', lx: 0.5, shade: P.mustard },
    snug: { x0: -4.25, x1: -1.1, y0: L2[0], y1: L2[1], wall: '#eab69c', lx: 0.35, gapC: { x: drop, zd } },
    power: { x0: -0.9, x1: 0.95, y0: L2[0], y1: L2[1], wall: '#c9d3c2', lx: 0.45, openR: true, shade: P.mustard },
  };
  Object.values(R).forEach((r) => (r.li = li));
  const dig = [[1.05, 2.45, L2[0], L2[1]], [2.45, 2.9, L2[0], -2.6]];
  const cav = Object.values(R).map((r) => [r.x0 - t, r.x1 + t, r.y0 - t, r.y1 + t]);
  cav.push([shaft[0] - t, shaft[1] + t, L1[1], 0.1], [drop[0] - t, drop[1] + t, L2[1], L1[0]], ...dig);
  const g = grp(soil(W, H, D, cav, { dr }));
  Object.values(R).forEach((r) => g.add(room(r, zf, dr)));
  g.add(shaftLining(shaft[0], shaft[1], L1[1] + t, 0, zf, zd), shaftLining(drop[0], drop[1], L2[1] + t, L1[0] - t, zf, zd));
  g.add(lawn(W, D, [[shaft[0] - t, shaft[1] + t]], zd + t));
  const zin = zf - 0.55, zback = zf - dr + 0.04, ps = 0.58;
  g.add(ladder(1.55 + 0.55, 0.3).at((shaft[0] + shaft[1]) / 2, L1[0], zf - zd + 0.1), ladder(L1[0] - L2[0] + 0.3, 0.3).at((drop[0] + drop[1]) / 2, L2[0], zf - zd + 0.1));
  // surface
  g.add(familyHouse({ dark: day, aerial: false }).at(-4.6, 0.08, -0.25), shed().at(-7.2, 0.08, -0.5));
  g.add(hatch({ a: shaft[0], b: shaft[1], zf, zd }));
  g.add(gnome().sc(1.3).at(-1.55, 0.08, 1.0), K.fence(10.4, '#d9c7a4', { h: 0.5 }).at(2.6, 0.08, -1.15));
  g.add(box(3.2, 0.03, 2.5, C.gravel).at(2.4, 0.08, 0.05).noInk(), estate().rot(0, deg(-8), 0).at(2.4, 0.11, 0.2));
  g.add(K.tree({ h: 2.5, leaf: C.moss, seed: 4 }).at(5.0, 0.08, -0.25), K.tree({ kind: 'bush', h: 0.7, leaf: C.lawnDk }).at(6.0, 0.08, 0.3), K.tree({ kind: 'bush', h: 0.6, leaf: C.moss }).at(-0.6, 0.08, -0.7));
  g.add(K.lamppost(1.7, P.iron, day ? '#e9e1cf' : '#ffe0a0').at(7.4, 0.08, -0.6), cyl(0.13, 0.13, 0.01, P.ink2, { seg: 16 }).sc(1.2, 1, 0.7).at(7.32, 0.08, 1.0).noInk());
  g.add(grp(cyl(0.22, 0.2, 0.62, C.lawnDk, { seg: 16 }), cyl(0.24, 0.24, 0.04, P.ink2, { seg: 16 }).at(0, 0.62, 0)).at(-6.3, 0.08, 0.6));
  const r0 = rng(21);
  for (let i = 0; i < 16; i++) { const x = -W / 2 + 0.4 + r0() * (W - 0.8); if (Math.abs(x - (shaft[0] + shaft[1]) / 2) > 0.5) g.add(K.grassTuft(i % 2 ? C.moss : C.lawnDk, 0.3).at(x, 0.08, zf - 0.12 - r0() * 0.3)); }
  // roots, stones, a worm, a buried bone, a sleeping rabbit
  const zr = zf + 0.01;
  [[[5.0, 0.02], [4.9, -0.45], [4.6, -0.95], [4.4, -1.5], [4.5, -1.95]], [[5.05, -0.2], [5.45, -0.55], [5.6, -1.2], [5.45, -1.6]], [[4.7, -0.85], [4.25, -1.05], [3.95, -1.0]], [[5.55, -1.15], [5.9, -1.5], [6.4, -1.6], [6.8, -2.0], [6.6, -2.6]], [[-0.6, 0.0], [-0.4, -0.16], [-0.1, -0.2]]].forEach((pts, i) => g.add(tube(pts.map(([x, y]) => [x, y, zr]), i < 2 ? 0.07 : 0.05, C.root, { segs: 40 })));
  [[4.1, -2.75, 0.2, 5], [5.3, -3.35, 0.24, 8], [-2.9, -3.62, 0.17, 2], [-6.4, -3.66, 0.2, 9], [3.85, -0.28, 0.14, 4], [7.3, -2.5, 0.22, 3], [-7.6, -1.95, 0.14, 7], [0.4, -3.62, 0.16, 12], [6.2, -3.1, 0.15, 1], [-5.3, -1.85, 0.12, 6]].forEach(([x, y, s, seed]) => g.add(sph(s, seed % 2 ? '#c9bda8' : '#ad9f8a', { seg: 9 }).sc(1.35, 0.8, 0.5).rot(0, 0, (seed % 3 - 1) * 0.3).at(x, y, zf - s * 0.15).flat()));
  g.add(tube([[-4.8, -3.6, zr], [-4.7, -3.55, zr], [-4.6, -3.62, zr], [-4.5, -3.56, zr]], 0.022, P.pink, { segs: 16 }));
  g.add(bone().rot(0, 0, 0.3).at(-0.95, -0.2, zf - 0.02));
  const den = '#3b281c';
  g.add(grp(cyl(0.55, 0.55, 0.03, den, { seg: 28 }).rot(deg(90), 0, 0).sc(1, 1, 0.45).at(6.35, -0.8, zf), tube([[6.75, -0.78, 0], [7.05, -0.6, 0], [7.22, -0.3, 0], [7.28, -0.02, 0]], 0.09, den, { segs: 24 }).sc(1, 1, 0.15).at(0, 0, zf + 0.005)).weld());
  g.add(sph(0.2, C.sand, { part: 'top', seg: 16 }).sc(1.6, 0.4, 0.5).at(6.35, -1.0, zf + 0.04), bunny().sc(1.5).at(6.3, -0.92, zf + 0.06), cyl(0.13, 0.13, 0.01, den, { seg: 16 }).sc(1.3, 1, 0.8).at(7.28, 0.085, zf - 0.2).noInk());

  // --- rooms
  { // washroom: tin bath, bucket shower
    const r = R.wash;
    g.add(grp(K.lathe([[0.001, 0], [0.18, 0], [0.24, 0.24], [0.22, 0.25], [0.16, 0.04], [0.001, 0.04]], P.steel, { seg: 20 }).sc(1.6, 1, 1)).at(r.x0 + 0.42, r.y0, zback + 0.42));
    g.add(bucket(C.tin, '#8fb3c9').at(r.x0 + 0.42, r.y1 - 0.28, zback + 0.42), cyl(0.008, 0.008, 0.08, P.ink2, { seg: 5 }).at(r.x0 + 0.42, r.y1 - 0.08, zback + 0.42).noInk());
    g.add(rbox(0.16, 0.34, 0.05, P.white, { r: 0.03 }).at(r.x1 - 0.2, r.y0 + 0.46, zback + 0.04), rbox(0.22, 0.28, 0.02, '#a9d6e6', { r: 0.02 }).at(r.x1 - 0.28, r.y0 + 0.85, zback + 0.02));
  }
  { // bunk room
    const r = R.bunk; g.add(bunk(1.0).at(r.x0 + 0.62, r.y0, zback + 0.24), rug(0.8, 0.5).at(r.x0 + 1.6, r.y0, zin + 0.05));
    g.add(grp(box(0.42, 0.42, 0.26, C.plank), ...[0.1, 0.24].map((y) => box(0.36, 0.02, 0.01, C.plankDk).at(0, y, 0.13).noInk()), box(0.12, 0.14, 0.02, P.cream).rot(deg(-10), 0, 0).at(-0.08, 0.42, 0)).at(r.x1 - 0.42, r.y0, zback + 0.15));
    g.add(K.sign('HOME', { w: 0.36, h: 0.16, bg: P.cream, fg: C.tin, frame: C.plankDk }).at(r.x0 + 1.5, r.y0 + 0.62, zback + 0.03));
    g.add(sph(0.12, P.mustard, { seg: 12 }).sc(1, 0.5, 1).at(r.x0 + 1.75, r.y0 + 0.02, zin - 0.1));
  }
  { // hall: coats, boots, first aid
    const r = R.hall;
    [0, 1, 2].forEach((i) => g.add(rbox(0.16, 0.36, 0.08, [C.tin, C.jacket, P.mustard][i], { r: 0.04 }).at(r.x0 + 0.24 + i * 0.2, r.y0 + 0.42, zback + 0.06)));
    g.add(box(0.7, 0.03, 0.04, C.plankDk).at(r.x0 + 0.44, r.y0 + 0.8, zback + 0.03));
    g.add(grp(rbox(0.22, 0.18, 0.06, P.white, { r: 0.02 }), box(0.04, 0.12, 0.01, C.tin).at(0, 0.03, 0.03).noInk(), box(0.12, 0.04, 0.01, C.tin).at(0, 0.07, 0.03).noInk()).at(r.x0 + 0.55, r.y0 + 0.88, zback + 0.03));
    [0, 1].forEach((i) => g.add(rbox(0.1, 0.12, 0.18, i ? P.mustard : P.ink2, { r: 0.03 }).at(r.x0 + 0.25 + i * 0.13, r.y0, zin + 0.1)));
  }
  { // kitchen
    const r = R.kitchen;
    g.add(stove(r.y1 - r.y0 - 0.42).at(r.x0 + 0.38, r.y0, zback + 0.3), shelf(0.85, 0.92, 3).at(r.x0 + 1.3, r.y0, zback + 0.13));
    g.add(table(0.62).at(r.x1 - 0.55, r.y0, zin - 0.1), stool().at(r.x1 - 0.95, r.y0, zin - 0.05), stool(C.tin).at(r.x1 - 0.2, r.y0, zin - 0.05));
    g.add(tin(P.mustard).at(r.x1 - 0.65, r.y0 + 0.41, zin - 0.12), grp(cyl(0.06, 0.05, 0.08, P.white, { seg: 12 }), torus(0.025, 0.008, P.white).at(0.065, 0.04, 0)).at(r.x1 - 0.45, r.y0 + 0.41, zin - 0.05));
    [0, 1, 2].forEach((i) => g.add(cyl(0.06 + i * 0.01, 0.06 + i * 0.01, 0.02, P.iron, { seg: 14 }).rot(deg(90), 0, 0).at(r.x0 + 0.95 + i * 0.16, r.y1 - 0.25 - i * 0.02, zback + 0.03)));
  }
  { // radio room
    const r = R.radio;
    g.add(table(0.95, false).at(r.x0 + 0.6, r.y0, zback + 0.26), radioSet().at(r.x0 + 0.5, r.y0 + 0.4, zback + 0.2), stool(P.mustard).at(r.x0 + 0.95, r.y0, zin - 0.2));
    g.add(box(0.6, 0.38, 0.02, texMat(tex.custom(256, 160, (x, w, h) => { x.fillStyle = '#efe2c6'; x.fillRect(0, 0, w, h); x.strokeStyle = '#86a86a'; x.lineWidth = 10; x.beginPath(); x.moveTo(0, 120); x.bezierCurveTo(80, 60, 160, 150, 256, 70); x.stroke(); x.strokeStyle = '#8fb3c9'; x.lineWidth = 7; x.beginPath(); x.moveTo(40, 0); x.bezierCurveTo(70, 70, 120, 90, 140, 160); x.stroke(); [[60, 50, '#c8402e'], [170, 95, '#c8402e'], [120, 40, '#f1b42f'], [210, 130, '#c8402e']].forEach(([px, py, c]) => { x.fillStyle = c; x.beginPath(); x.arc(px, py, 9, 0, 7); x.fill(); }); }))).at(r.x1 - 0.5, r.y0 + 0.5, zback + 0.03));
    g.add(tube([[r.x0 + 0.66, r.y0 + 0.6, zback + 0.15], [r.x0 + 0.75, r.y1 - 0.1, zback + 0.08], [r.x0 + 0.75, r.y1, zback + 0.06]], 0.012, P.ink2).noInk());
    g.add(teen().sc(ps).rot(0, deg(-12), 0).at(r.x1 - 0.5, r.y0, zin));
  }
  { // pantry
    const r = R.pantry;
    g.add(shelf(0.9, 0.95, 3, 'jars').at(r.x0 + 0.55, r.y0, zback + 0.13), shelf(0.9, 0.95, 3).at(r.x0 + 1.5, r.y0, zback + 0.13));
    g.add(K.barrel(0.42, C.plank).at(r.x1 - 0.5, r.y0, zback + 0.3), K.barrel(0.38, C.tin).at(r.x1 - 0.35, r.y0, zin - 0.05), K.barrel(0.36, C.moss).at(r.x1 - 0.85, r.y0, zin + 0.05));
    g.add(K.crate(0.3).at(r.x0 + 2.25, r.y0, zin), K.crate(0.24).rot(0, 0.5, 0).at(r.x0 + 2.25, r.y0 + 0.3, zin), sph(0.16, C.sand, { seg: 12 }).sc(1, 1.3, 0.9).at(r.x0 + 0.35, r.y0 + 0.16, zin + 0.1), sph(0.14, C.sand, { seg: 12 }).sc(1, 1.2, 0.9).at(r.x0 + 0.65, r.y0 + 0.14, zin + 0.15));
  }
  { // snug
    const r = R.snug;
    g.add(rug(1.3, 0.7, [P.mustard, C.tin, P.cream]).at(r.x0 + 1.25, r.y0, zin - 0.05), armchair().at(r.x0 + 0.5, r.y0, zback + 0.4));
    g.add(shelf(0.6, 0.62, 2, 'jars', 0.2).at(r.x0 + 1.35, r.y0, zback + 0.11), K.pottedPlant(C.tin, C.moss, 0.55).at(r.x0 + 1.67, r.y0 + 0.62, zback + 0.12));
    g.add(box(0.34, 0.26, 0.02, texMat(tex.custom(128, 96, (x, w, h) => { x.fillStyle = '#a9d6e6'; x.fillRect(0, 0, w, h); x.fillStyle = '#86ad5a'; x.beginPath(); x.ellipse(64, 110, 90, 50, 0, 0, 7); x.fill(); x.fillStyle = '#f6d77a'; x.beginPath(); x.arc(96, 30, 12, 0, 7); x.fill(); x.strokeStyle = '#87593a'; x.lineWidth = 10; x.strokeRect(0, 0, w, h); }))).at(r.x0 + 0.5, r.y0 + 0.7, zback + 0.03));
    g.add(gran().sc(ps).rot(0, deg(10), 0).at(r.x0 + 1.15, r.y0, zin), pup(0.62).rot(0, deg(-35), 0).at(r.x0 + 1.8, r.y0, zin + 0.05));
  }
  { // power & water
    const r = R.power;
    g.add(grp(cyl(0.3, 0.3, 0.8, '#7f9fae', { seg: 20 }), torus(0.3, 0.02, P.iron).rot(deg(90), 0, 0).at(0, 0.25, 0), torus(0.3, 0.02, P.iron).rot(deg(90), 0, 0).at(0, 0.6, 0), cyl(0.03, 0.03, 0.12, P.steel, { seg: 8 }).rot(deg(90), 0, 0).at(0.1, 0.12, 0.32)).at(r.x0 + 0.42, r.y0, zback + 0.38));
    const bike = grp(torus(0.18, 0.025, P.ink2, { ts: 24 }).at(-0.25, 0.2, 0), box(0.5, 0.04, 0.04, C.tin).rot(0, 0, 0.3).at(0, 0.3, 0), box(0.04, 0.3, 0.04, C.tin).at(0.12, 0.12, 0), box(0.16, 0.04, 0.1, P.ink2).at(0.12, 0.44, 0), box(0.04, 0.32, 0.04, P.ink2).at(-0.2, 0.2, 0), box(0.24, 0.12, 0.1, P.steel).at(0.25, 0.0, 0), cyl(0.04, 0.04, 0.1, P.ink2, { seg: 10 }).rot(deg(90), 0, 0).at(0.0, 0.18, 0.04));
    g.add(bike.at(r.x0 + 1.1, r.y0, zin - 0.1), box(0.36, 0.2, 0.18, P.ink2).at(r.x1 - 0.25, r.y0, zback + 0.15), box(0.08, 0.04, 0.04, C.tin).at(r.x1 - 0.32, r.y0 + 0.2, zback + 0.15), jerry(C.moss).at(r.x1 - 0.2, r.y0, zin + 0.1));
  }
  { // the dig: a staked-out room, half dug, finds popping out of the soil
    const y0 = L2[0], y1 = L2[1];
    g.add(parent({ lantern: false }).sc(ps).rot(0, deg(-20), 0).at(1.55, y0, zin), bucket().at(2.1, y0, zin + 0.1), sph(0.26, C.mid, { part: 'top', seg: 16 }).sc(1.3, 0.8, 1).at(2.55, y0, zf - 0.95).flat());
    g.add(K.lantern().sc(0.7).at(1.2, y0, zin + 0.2), plight(1.3, y0 + 0.5, zf - 0.3, 1.6, 2.0));
    const s = [[2.45, y1], [3.75, y1], [3.75, y0], [2.9, y0]];
    s.forEach(([x, y], i) => i % 3 === 0 || g.add(grp(cyl(0.025, 0.016, 0.22, C.plank, { seg: 6 }).rot(deg(90), 0, 0), extrude([[0, 0], [0.12, -0.035], [0, -0.07]], 0.01, C.tin).at(0, 0.02, 0.2)).at(x, y, zf - 0.03)));
    g.add(tube(s.map(([x, y]) => [x, y, zf + 0.04]), 0.013, C.lamp, { tension: 0, segs: 60 }).noInk());
    g.add(tube([[1.05, y1, zf + 0.04], [2.45, y1, zf + 0.04]], 0.013, C.lamp).noInk());
    // finds
    g.add(bottle().rot(deg(80), 0, deg(-20)).at(2.88, -2.85, zf - 0.6), star(0.07).at(2.95, -2.68, zf - 0.3));
    g.add(teacup().rot(0, 0, 0.5).at(1.9, y1 - 0.08, zf - dr + 0.2), star(0.06).at(2.05, y1 - 0.15, zf - dr + 0.35));
    g.add(grp(rbox(0.22, 0.13, 0.14, P.mustard, { r: 0.02 }), box(0.23, 0.03, 0.15, C.tin).at(0, 0.06, 0)).rot(0, 0.3, 0.12).at(2.3, y0, zf - 1.1), star(0.08).at(2.42, y0 + 0.28, zf - 0.95));
    g.add(grp(rbox(0.16, 0.2, 0.1, P.steel, { r: 0.03 }), sph(0.03, glow('#ff8a5a'), { seg: 8 }).at(-0.04, 0.14, 0.05), sph(0.03, glow('#ff8a5a'), { seg: 8 }).at(0.04, 0.14, 0.05), cyl(0.008, 0.008, 0.08, P.ink2, { seg: 5 }).at(0, 0.2, 0)).rot(0, 0, -0.5).at(3.3, -2.9, zf - 0.06), star(0.07).at(3.45, -2.62, zf + 0.05));
  }
  return g;
}

// --- standalone pieces for the builds row
function bunkRoom() {
  const W = 3.3, H = 1.75, D = 2.0, dr = 1.3, zf = D / 2, r = { x0: -1.35, x1: 1.35, y0: -1.55, y1: -0.35, wall: '#e9c182', lx: 0.5 };
  const g = grp(soil(W, H, D, [[r.x0 - 0.1, r.x1 + 0.1, r.y0 - 0.1, r.y1 + 0.1]], { dr, seed: 7 }), room(r, zf, dr), lawn(W, D, []));
  const zback = zf - dr + 0.04, zin = zf - 0.45;
  g.add(bunk(1.0).at(r.x0 + 0.6, r.y0, zback + 0.24), stove(0.82).at(r.x1 - 0.3, r.y0, zback + 0.3), shelf(0.62, 0.95, 3).at(r.x0 + 1.55, r.y0, zback + 0.13));
  g.add(rug(0.9, 0.45).at(-0.05, r.y0, zin), pup(0.6).rot(0, deg(30), 0).at(0.05, r.y0, zin), bucket(C.tin, P.ink2).at(r.x1 - 0.2, r.y0, zin + 0.1));
  g.add(K.rock(0.13, C.stone, 4).at(-1.5, -1.1, zf - 0.02), tube([[-0.9, 0.0, zf], [-1.0, -0.15, zf], [-1.25, -0.22, zf]], 0.03, C.root));
  return g;
}
function hatchBuild() {
  const W = 2.6, H = 2.3, D = 2.2, dr = 1.4, zf = D / 2, zd = 0.8, t = 0.1, a = -0.26, b = 0.26;
  const r = { x0: -1.0, x1: 1.0, y0: -2.05, y1: -1.05, wall: '#dcc89a', lx: 0.7, gapC: { x: [a, b], zd } };
  const g = grp(soil(W, H, D, [[r.x0 - t, r.x1 + t, r.y0 - t, r.y1 + t], [a - t, b + t, r.y1, 0.1]], { dr, seed: 9 }), room(r, zf, dr), shaftLining(a, b, r.y1 + t, 0, zf, zd), lawn(W, D, [[a - t, b + t]], zd + t), hatch({ a, b, zf, zd }));
  g.add(ladder(2.05 + 0.5, 0.3).at(0, r.y0, zf - zd + 0.1));
  g.add(gnome().at(0.9, 0.08, 0.7), K.tree({ kind: 'bush', h: 0.5, leaf: C.moss }).at(-0.95, 0.08, -0.4));
  g.add(rbox(0.5, 0.02, 0.3, P.mustard, { r: 0.01 }).at(0.45, r.y0, zf - 0.4).noInk(), ...[0, 1].map((i) => rbox(0.1, 0.12, 0.18, i ? C.tin : P.ink2, { r: 0.03 }).at(0.4 + i * 0.13, r.y0 + 0.02, zf - 0.4)));
  g.add(K.rock(0.13, C.stone, 5).at(0.9, -0.5, zf - 0.02), K.rock(0.1, C.stoneDk, 2).at(-0.85, -0.65, zf - 0.02));
  return g;
}
function houseBuild() {
  const g = grp(K.ground(4.6, 3.0, { top: C.lawn, side: C.top, h: 0.3 }));
  g.add(familyHouse().at(-0.4, 0, -0.4));
  g.add(grp(cyl(0.22, 0.2, 0.62, C.lawnDk, { seg: 16 }), cyl(0.24, 0.24, 0.04, P.ink2, { seg: 16 }).at(0, 0.62, 0)).at(-2.0, 0, 0.6));
  g.add(K.fence(4.4, '#d9c7a4', { h: 0.45 }).at(0, 0, -1.4), gnome().at(1.0, 0, 1.1));
  g.add(grp(box(0.7, 0.08, 0.7, C.conc), box(0.5, 0.05, 0.5, '#6f7a5a').at(0, 0.08, 0), torus(0.1, 0.018, C.tin).rot(deg(90), 0, 0).at(0, 0.15, 0)).at(1.55, 0, 0.55), sandbag().at(1.55, 0, 1.05), sandbag().rot(0, 0.3, 0).at(2.0, 0, 0.5));
  g.add(box(0.5, 0.02, 1.2, C.gravel).at(-0.4, 0, 1.0).noInk(), K.tree({ kind: 'bush', h: 0.55, leaf: C.moss }).at(1.9, 0, -0.9));
  return g;
}
function nightStreet() {
  const g = grp(), road = '#4c4f58', pave = '#8f8b84';
  g.add(K.ground(10, 6.4, { top: road, side: C.clay, h: 0.4 }));
  g.add(box(10, 0.1, 1.5, pave).at(0, 0, -2.05), box(10, 0.1, 0.9, pave).at(0, 0, 2.75));
  for (let x = -4.4; x < 5; x += 1.4) g.add(box(0.6, 0.012, 0.08, P.cream).at(x, 0.0, 0.3).noInk());
  const dark = P.glassDk;
  g.add(K.house({ w: 2.2, d: 1.4, h: 0.95, floors: 2, wall: '#cdbb9d', roof: C.roof, door: '#5b6b7a', glass: dark, base: C.stoneDk }).at(-3.4, 0.1, -3.2));
  g.add(K.house({ w: 2.4, d: 1.4, h: 1.0, wall: '#b8a58c', roof: P.slate, door: C.tin, glass: dark, base: C.stoneDk, sign: 'CORNER SHOP', signBg: P.cream, signFg: C.tin }).at(-0.6, 0.1, -3.2));
  g.add(box(1.7, 0.42, 0.04, texMat(tex.planks({ base: P.steel, line: P.slate, n: 7 }))).at(-0.6, 0.24, -2.46));
  g.add(K.house({ w: 2.0, d: 1.4, h: 0.9, floors: 2, wall: '#d8c7a6', roof: C.roof, door: C.moss, glass: glow('#ffd47e'), base: C.stoneDk, chimney: true }).at(2.4, 0.1, -3.2));
  g.add(K.lamppost(1.8, P.iron, '#ffe0a0').at(-1.9, 0.1, -1.6), K.lamppost(1.8, P.iron, '#5d5a57').at(3.9, 0.1, -1.6));
  g.add(cyl(1.1, 1.1, 0.01, glow('#ffd987', { opacity: 0.28, depthWrite: false }), { seg: 32 }).at(-1.9, 0.11, -1.2).noInk().noShadow(), plight(-1.9, 1.6, -1.4, 4, 4, '#ffd590'));
  // the car with the boot open, headlights on
  g.add(estate({ bootOpen: true, beams: true }).rot(0, deg(205), 0).at(0.6, 0.0, 0.9));
  g.add(plight(-1.0, 0.6, 1.5, 3, 3, '#fff0c0'));
  // the run: you carry a box of tins back to the car, the dog keeps watch
  const box1 = grp(K.crate(0.42), ...[0, 1, 2].map((i) => tin([C.tin, P.mustard, P.steel][i]).at(-0.12 + i * 0.12, 0.42, 0)));
  g.add(parent({ pose: 'carry', held: box1, lantern: false, beam: true }).rot(0, deg(-38), 0).at(2.5, 0.1, 1.7), plight(2.2, 1.9, 2.6, 3.5, 3.5, '#ffe2a8'));
  g.add(pup(1.1).rot(0, deg(-40), 0).at(3.4, 0.1, 2.3));
  // trolley
  const trol = grp(box(0.7, 0.42, 0.45, texMat(tex.grid({ bg: '#a9b3bd', line: P.slate, cells: 6, lw: 6 })), { cast: true }).at(0, 0.3, 0), ...[[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([a, b]) => sph(0.05, P.ink2, { seg: 8 }).at(a * 0.3, 0.05, b * 0.18)), box(0.04, 0.4, 0.45, P.steel).at(-0.36, 0.5, 0), jerry(C.moss).at(0.1, 0.72, 0), K.crate(0.25).at(-0.15, 0.72, 0));
  g.add(trol.rot(0, deg(30), 0).at(3.5, 0.1, -1.6));
  g.add(K.barrel(0.5, C.lawnDk).at(-4.3, 0.1, -1.7), K.tree({ kind: 'dead', h: 1.6, trunk: '#5a4636' }).at(4.4, 0.1, -2.6));
  return g;
}

export default {
  slug: 'warren',
  title: 'Warren',
  logline: 'Dig a bunker under your house, room by room, and keep your family safe and cosy while the world above goes wrong.',
  genre: ['Side-on colony builder', 'Survival-lite', 'Cosy apocalypse'],
  theme: { accent: C.lamp, accentInk: '#2a1c14', cardBg: '#efe2cb', plinth: '#c99a6a', plinthRim: C.clay },
  pitch: 'A side-on cutaway, like an ant farm. Stake out a room, dig it out and see what turns up in the soil. Fit it out with bunks, a stove or a radio. At night you take the car out on short runs for supplies. One family, a dozen rooms, three acts. Small enough to finish.',
  loop: ['Stake out a new room', 'Dig it out, finds pop from the soil', 'Furnish it: bunks, stove, radio', 'The family settles, needs are met', 'Night run above, new room types'],
  why: ['The side-on cutaway is a ready-made diorama shot, like a doll\'s house.', 'Flat toon bands fix the soil. No noisy texture, just clean layers of clay.', 'Lamp-lit rooms in dark soil: the safe place pushing back the dark.'],
  fromYou: 'Your Warren prototype had promise but grew overwhelming, so this version is deliberately small. It keeps the Mr. Prepper soil look you wanted and the Fallout Shelter cutaway.',
  similar: [
    { name: 'Fallout Shelter', url: 'https://store.steampowered.com/app/588430', note: 'the side-on vault cutaway, made cosier' },
    { name: 'Mr. Prepper', url: 'https://store.steampowered.com/app/761830', note: 'a shelter dug under your own house' },
    { name: 'Sheltered', url: 'https://store.steampowered.com/app/356040', note: 'one family underground, short trips outside' },
    { name: 'Frostpunk', url: 'https://store.steampowered.com/app/323190', note: 'keeping warm against a hostile world' },
  ],
  palette: [['Topsoil', C.top], ['Deep clay', C.clay], ['Lamp yellow', C.lamp], ['Concrete', C.conc], ['Tin red', C.tin], ['Moss', C.moss]],
  key: { build: () => cutaway(), bg: SKY, light: 'dusk', cam: { yaw: -12, pitch: 11, fov: 24 }, caption: 'Under number 12, just after dusk' },
  characters: [
    { name: 'Jo', role: 'You. Work jacket, head torch, always holding a spade.', build: () => parent() },
    { name: 'Ash', role: 'Fifteen. Runs the radio room on a hand-crank set.', build: () => teen() },
    { name: 'Gran Mags', role: 'Knits for everyone. Has seen worse winters.', build: () => gran() },
    { name: 'Biscuit', role: 'Family dog. Digs his own little rooms.', build: () => pup(2.0).rot(0, deg(-30), 0) },
  ],
  builds: [
    { name: 'The house', tag: 'Building', note: 'Ordinary semi with one window boarded up.', build: () => houseBuild(), cam: { yaw: -26, pitch: 20 } },
    { name: 'The hatch', tag: 'Structure', note: 'Steel lid in the lawn, ladder down to the hall.', build: () => hatchBuild(), cam: { yaw: -32, pitch: 26 } },
    { name: 'The old estate', tag: 'Vehicle', note: 'Roof rack, jerrycans, one working headlight beam.', build: () => grp(box(3.0, 0.08, 1.8, C.gravel).at(0, -0.08, 0), estate().rot(0, deg(-12), 0)), cam: { yaw: -30, pitch: 20 } },
    { name: 'Bunk room', tag: 'Structure', note: 'Bunks, stove, a shelf of tins, one warm lamp.', build: () => bunkRoom(), cam: { yaw: -16, pitch: 12 } },
  ],
  environments: [
    { name: 'The warren by day', note: 'Two levels, ladders between, the next room staked out in string.', build: () => cutaway({ time: 'day' }), stage: { bg: [[0, '#bfe0ea'], [1, '#efe3cb']], light: 'day' }, cam: { yaw: -36, pitch: 22 } },
    { name: 'Night run', note: 'Quiet street, boot open, back before the lamp goes out.', build: () => nightStreet(), stage: { bg: [[0, '#26304f'], [0.7, '#46507a'], [1, '#5a5f80']], light: 'night' }, cam: { yaw: -34, pitch: 30 } },
  ],
};
