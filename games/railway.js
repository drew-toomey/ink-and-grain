// Tabletop Line — board 4. A model railway layout on a hobby-shop workbench.
// Every build() returns a fresh Object3D. Front of things faces +Z; locos and carriages point their nose along +X.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng } = K;

// --- local palette
const C = {
  baize: '#4f8a4c', baizeLt: '#6fa45e', baizeDk: '#3f7440', track: '#7b7d82', ballast: '#a59e92', ballastDk: '#7d776d', sleeper: '#5e4535',
  rail: '#c9cdd2', railDk: '#8b9198', loco: '#c8402e', locoDk: '#8f2c22', plaster: '#f3eee2', bench: '#c98d55', benchDk: '#93603a',
  sky: '#9fd0e6', brass: '#e3b44c', ply: '#e2c08e', green: '#2f6e4f', cream: '#f2e5c8', navy: '#2f3f63', roof: '#6f7a86', hill: '#6f9e52',
  hillDk: '#58864a', lake: '#5aa9c6', card: '#cfa76e', road: '#8a8d92', lamp: '#ffd98a', paper: '#efe8d8',
};
const G = 0.38, BED = 0.36, RW = 0.05, BH = 0.035, RH = 0.05, SP = 0.2, RAIL = BH + RH; // gauge, bed half-width, rail width, bed + rail heights, sleeper pitch

// --- low-level helpers
const mesh = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; return o; };
const dbl = (c) => K.mat(c, { side: THREE.DoubleSide });
const drawTrack = (x, w, h) => {
  x.fillStyle = C.ballast; x.fillRect(0, 0, w, h);
  const r = rng(9);
  for (let i = 0; i < 90; i++) { x.fillStyle = ['#8d867a', '#bdb6aa', '#77706a'][i % 3]; x.beginPath(); x.arc(r() * w, r() * h, 2 + r() * 2.5, 0, 7); x.fill(); }
  x.fillStyle = C.sleeper; x.fillRect(w * 0.27, h * 0.1, w * 0.46, h * 0.8);
  x.strokeStyle = P.ink; x.lineWidth = 6; x.strokeRect(w * 0.27, h * 0.1, w * 0.46, h * 0.8);
};

// Rounded-rectangle track path: at(s) → [x, z, tx, tz]. Runs along the front straight (+Z side) towards +X first.
function ovalPath(w, d, r) {
  const a = w - 2 * r, b = d - 2 * r, q = (Math.PI * r) / 2, segs = [a, q, b, q, a, q, b, q], L = 2 * a + 2 * b + 4 * q;
  const at = (s) => {
    s = ((s % L) + L) % L; let i = 0;
    while (i < 7 && s > segs[i]) { s -= segs[i]; i++; }
    const f = s / r;
    switch (i) {
      case 0: return [-a / 2 + s, d / 2, 1, 0];
      case 1: return [a / 2 + r * Math.sin(f), b / 2 + r * Math.cos(f), Math.cos(f), -Math.sin(f)];
      case 2: return [w / 2, b / 2 - s, 0, -1];
      case 3: return [a / 2 + r * Math.cos(f), -b / 2 - r * Math.sin(f), -Math.sin(f), -Math.cos(f)];
      case 4: return [a / 2 - s, -d / 2, -1, 0];
      case 5: return [-a / 2 - r * Math.sin(f), -b / 2 - r * Math.cos(f), -Math.cos(f), Math.sin(f)];
      case 6: return [-w / 2, -b / 2 + s, 0, 1];
      default: return [-a / 2 - r * Math.cos(f), b / 2 + r * Math.sin(f), Math.sin(f), Math.cos(f)];
    }
  };
  return { L, at };
}
// A closed band with a rectangular section that follows a path (track bed, rails). Offsets are along the inward normal.
function band(path, o0, o1, y0, y1, topMat, sideMat, uScale = 1, n = 420) {
  const pos = [], uv = [], idx = [], pts = [];
  for (let i = 0; i <= n; i++) { const s = (i / n) * path.L, [x, z, tx, tz] = path.at(s); pts.push({ x, z, nx: tz, nz: -tx, u: s / uScale }); }
  const face = (fa, fb) => {
    const start = idx.length, base = pos.length / 3;
    pts.forEach((p) => { const A = fa(p), B = fb(p); pos.push(A[0], A[1], A[2], B[0], B[1], B[2]); uv.push(p.u, A[3], p.u, B[3]); });
    for (let i = 0; i < n; i++) { const a = base + i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
    return [start, idx.length - start];
  };
  const pt = (p, o, y, v) => [p.x + p.nx * o, y, p.z + p.nz * o, v];
  const top = face((p) => pt(p, o0, y1, 0), (p) => pt(p, o1, y1, 1));
  const s1 = face((p) => pt(p, o0, y0, 0), (p) => pt(p, o0, y1, 1));
  const s2 = face((p) => pt(p, o1, y0, 0), (p) => pt(p, o1, y1, 1));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  geo.addGroup(top[0], top[1], 0); geo.addGroup(s1[0], s1[1] + s2[1], 1);
  return mesh(geo, [topMat, sideMat]);
}
function ovalTrack(path) {
  const top = texMat(tex.custom(128, 128, drawTrack), { side: THREE.DoubleSide });
  const g = grp(band(path, -BED, BED, 0, BH, top, dbl(C.ballastDk), SP));
  [-1, 1].forEach((s) => g.add(band(path, s * G / 2 - RW / 2, s * G / 2 + RW / 2, BH, RAIL, dbl(C.rail), dbl(C.railDk))));
  return g;
}
/** Straight track piece along X, centred. */
function straightTrack(len) {
  const side = K.mat(C.ballastDk), top = texMat(tex.custom(128, 128, drawTrack, [Math.round(len / SP), 1]));
  const g = grp(box(len, BH, BED * 2, [side, side, top, side, side, side]));
  [-1, 1].forEach((s) => g.add(box(len, RH, RW, C.rail).at(0, BH, s * G / 2)));
  return g;
}
/** Board slab: top at y=0, side colour below. (Own version: kit ground() has two coplanar tops that z-fight.) */
function slab(w, d, o = {}) {
  const h = o.h ?? 0.3, top = o.map ? texMat(o.map) : K.mat(o.top ?? C.baize);
  return grp(box(w, h - 0.05, d, o.side ?? C.ply).at(0, -h, 0), box(w, 0.05, d, top).at(0, -0.05, 0)).weld();
}
const baizeMap = (rep = [5, 3], seed = 3) => tex.speckle({ base: C.baize, dots: ['#5f9c59', '#457c42'], n: 260, size: 2.2, seed, rep });
const onPath = (obj, path, s, y = RAIL) => { const [x, z, tx, tz] = path.at(s); obj.position.set(x, y, z); obj.rotation.y = Math.atan2(-tz, tx); return obj; };

// --- rolling stock
function loco(o = {}) {
  const body = o.body ?? C.loco, dk = C.locoDk, blk = P.ink2, br = C.brass, g = grp();
  g.add(box(1.2, 0.1, 0.36, blk).at(-0.02, 0.1, 0), box(1.26, 0.05, 0.54, blk).at(-0.03, 0.22, 0));
  [-0.34, -0.02, 0.3].forEach((x) => [-1, 1].forEach((s) => g.add(K.wheel(0.12, 0.05, body, P.cream).at(x, 0.12, s * 0.215))));
  [-1, 1].forEach((s) => g.add(box(0.72, 0.03, 0.02, P.steel).at(-0.02, 0.1, s * 0.25)));
  // boiler, smokebox, bands
  g.add(cyl(0.18, 0.18, 0.6, body, { seg: 24 }).rot(0, 0, deg(-90)).at(-0.12, 0.45, 0));
  g.add(cyl(0.19, 0.19, 0.1, blk, { seg: 24 }).rot(0, 0, deg(-90)).at(0.48, 0.45, 0), sph(0.03, br, { seg: 8 }).at(0.59, 0.45, 0));
  [0.06, 0.32].forEach((x) => g.add(torus(0.184, 0.014, br, { ts: 28 }).rot(0, deg(90), 0).at(x, 0.45, 0)));
  // chimney, dome, safety valve
  g.add(cyl(0.055, 0.065, 0.16, blk, { seg: 14 }).at(0.5, 0.6, 0), cyl(0.085, 0.06, 0.06, blk, { seg: 14 }).at(0.5, 0.75, 0));
  g.add(sph(0.085, br, { part: 'top', seg: 16 }).sc(1, 1.2, 1).at(0.2, 0.61, 0), cyl(0.03, 0.035, 0.08, br, { seg: 10 }).at(-0.02, 0.61, 0));
  // side tanks, cab, bunker
  [-1, 1].forEach((s) => g.add(rbox(0.5, 0.3, 0.14, body, { r: 0.04 }).at(0.13, 0.27, s * 0.2)));
  g.add(rbox(0.42, 0.55, 0.52, body, { r: 0.04 }).at(-0.37, 0.27, 0), rbox(0.52, 0.06, 0.6, blk, { r: 0.03 }).at(-0.37, 0.82, 0));
  [-1, 1].forEach((s) => g.add(box(0.2, 0.18, 0.02, o.lit ? K.glow(C.lamp) : P.glassDk).at(-0.36, 0.58, s * 0.26)));
  [-1, 1].forEach((s) => g.add(K.sign('7', { w: 0.14, h: 0.12, bg: br, fg: P.ink, frame: br }).rot(0, s > 0 ? 0 : Math.PI, 0).at(-0.37, 0.34, s * 0.27)));
  g.add(rbox(0.14, 0.4, 0.5, body, { r: 0.03 }).at(-0.62, 0.27, 0), box(0.1, 0.06, 0.4, P.ink).at(-0.62, 0.66, 0));
  // buffer beams, buffers, lamp
  [[0.6, 1], [-0.7, -1]].forEach(([x, s]) => {
    g.add(box(0.05, 0.12, 0.54, dk).at(x, 0.12, 0));
    [-1, 1].forEach((z) => g.add(cyl(0.03, 0.03, 0.08, P.iron, { seg: 10 }).rot(0, 0, deg(-90 * s)).at(x + s * 0.02, 0.18, z * 0.17), cyl(0.045, 0.045, 0.02, P.iron, { seg: 12 }).rot(0, 0, deg(-90)).at(x + s * 0.1 - (s < 0 ? 0.02 : 0), 0.18, z * 0.17)));
  });
  g.add(sph(0.045, o.lit ? K.glow('#fff1b8') : P.cream, { seg: 12 }).at(0.62, 0.32, 0));
  if (o.steam !== false) [[0.5, 0.9, 0.08], [0.38, 1.02, 0.1], [0.18, 1.1, 0.12], [-0.06, 1.14, 0.1]].forEach(([x, y, r]) => g.add(sph(r, P.white, { seg: 14 }).at(x, y, 0)));
  return g;
}
function carriage(o = {}) {
  const g = grp(), win = o.lit ? K.glow(C.lamp) : P.glassDk;
  g.add(box(1.3, 0.08, 0.34, P.ink2).at(0, 0.12, 0));
  [-0.42, 0.42].forEach((bx) => { g.add(box(0.4, 0.07, 0.34, P.ink2).at(bx, 0.07, 0)); [-0.12, 0.12].forEach((dx) => [-1, 1].forEach((s) => g.add(K.wheel(0.08, 0.04, P.ink2, P.steel).at(bx + dx, 0.08, s * 0.2)))); });
  g.add(rbox(1.42, 0.22, 0.52, o.lower ?? C.loco, { r: 0.04 }).at(0, 0.2, 0), rbox(1.42, 0.3, 0.52, o.upper ?? C.cream, { r: 0.04 }).at(0, 0.4, 0));
  g.add(rbox(1.5, 0.09, 0.58, o.roof ?? C.locoDk, { r: 0.04 }).at(0, 0.69, 0));
  for (let i = 0; i < 5; i++) [-1, 1].forEach((s) => g.add(box(0.17, 0.16, 0.02, win).at(-0.5 + i * 0.25, 0.47, s * 0.26)));
  if (o.faces !== false) [[-0.25, P.skin2, P.hairBrown], [0.25, P.skin1, P.hairBlonde], [0.5, P.skin3, P.hairBlack]].forEach(([x, sk, hr]) => g.add(sph(0.06, sk, { seg: 12 }).at(x, 0.52, 0.22), sph(0.062, hr, { part: 'top', seg: 12 }).at(x, 0.54, 0.215)));
  [-0.76, 0.76].forEach((x) => [-1, 1].forEach((z) => g.add(cyl(0.035, 0.035, 0.06, P.iron, { seg: 10 }).rot(0, 0, deg(x > 0 ? -90 : 90)).at(x - Math.sign(x) * 0.05, 0.2, z * 0.17))));
  return g;
}
function train(path, s0, o = {}) {
  const g = grp(onPath(loco(o), path, s0));
  for (let i = 0; i < (o.cars ?? 2); i++) g.add(onPath(carriage({ ...o, faces: i === 0 }), path, s0 - 1.48 - i * 1.6));
  return g;
}

// --- scenery
const tr = (x, z, h = 1, kind = 'round', seed = 1) => K.tree({ kind, h, seed, leaf: kind === 'pine' ? P.pine : [P.leaf, P.moss, '#6aa84f'][seed % 3] }).at(x, 0, z);
const fig = (o, s = 0.3) => K.person(o).sc(s);
const kite = () => {
  const k = grp(extrude([[0, 0.3], [0.2, 0], [0, -0.42], [0, 0]], 0.02, C.loco), extrude([[0, 0.3], [0, 0], [0, -0.42], [-0.2, 0]], 0.02, P.mustard), box(0.02, 0.72, 0.03, P.woodDk).at(0, -0.42, 0.01));
  k.add(tube([[0, -0.42, 0], [0.08, -0.6, 0], [-0.04, -0.78, 0], [0.06, -0.95, 0]], 0.008, P.ink2, { segs: 20 }).noInk());
  [-0.6, -0.78].forEach((y, i) => k.add(box(0.08, 0.04, 0.02, [C.sky, C.loco][i]).at(i ? -0.04 : 0.08, y, 0).rot(0, 0, 0.5)));
  return k;
};
function portal() { // faces +Z, base y=0, opening ~0.56 wide
  const W = 0.98, H = 0.8, ow = 0.56, oh = 0.62, pts = [[-W / 2, 0], [-ow / 2, 0], [-ow / 2, oh - ow / 2]];
  for (let i = 1; i < 12; i++) { const a = Math.PI - (i / 12) * Math.PI; pts.push([Math.cos(a) * ow / 2, oh - ow / 2 + Math.sin(a) * ow / 2]); }
  pts.push([ow / 2, oh - ow / 2], [ow / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]);
  const stone = texMat(tex.bricks({ base: '#c3b7a2', mortar: '#8e8475', rows: 6, cols: 3, rep: [2, 2] }));
  return grp(extrude(pts, 0.24, stone), box(ow + 0.04, oh, 0.5, '#1f1610').at(0, 0, -0.32), box(W + 0.1, 0.08, 0.32, P.stoneDk).at(0, H, 0), box(0.12, 0.14, 0.27, P.stone).at(0, oh - 0.04, 0));
}
function hill(o = {}) { // grassy papier-mache hill centred on origin, ~2 x 1.3 x 1.7
  const g = grp(grp(
    sph(1, o.color ?? C.hill, { part: 'top', seg: 18 }).sc(2.0, 1.3, 1.7),
    sph(1, o.color ?? C.hill, { part: 'top', seg: 16 }).sc(1.2, 1.6, 1.0).at(0.5, 0, -0.5),
    sph(1, C.hillDk, { part: 'top', seg: 14 }).sc(1.0, 0.9, 0.9).at(-1.0, 0, -0.7),
  ).flat().weld());
  const surf = (x, z) => 1.3 * Math.sqrt(Math.max(0, 1 - (x / 2) ** 2 - (z / 1.7) ** 2));
  [[-0.7, 0.6, 4], [1.0, 0.4, 6]].forEach(([x, z, s]) => g.add(K.rock(0.2, P.stone, s).flat().at(x, surf(x, z) - 0.1, z)));
  [[0.3, -0.2, 0.9], [-0.4, 0.1, 0.75], [0.9, -0.7, 0.8], [-1.1, -0.3, 0.7]].forEach(([x, z, h], i) => g.add(K.tree({ kind: 'pine', h, leaf: P.pine, seed: i }).at(x, surf(x, z) - 0.06, z)));
  return g;
}
function station(o = {}) { // platform front edge at z = +0.65, track side
  const g = grp(), L = 3.2, D = 1.3, PH = 0.16;
  g.add(box(L, PH, D, texMat(tex.tiles({ base: '#ddd1ba', line: '#bfb198', n: 4, rep: [L * 1.5, D * 1.5] }))), box(L, 0.012, 0.07, P.white).at(0, PH, D / 2 - 0.07));
  const lit = o.lit ? K.glow(C.lamp) : null;
  g.add(K.house({ w: 2.6, d: 1.1, h: 1.05, wall: C.plaster, roof: C.loco, roofH: 0.6, door: C.green, trim: P.white, windows: 2, chimney: true, base: P.stoneDk, glass: lit ?? P.glass }).sc(0.5).at(-0.2, PH, -0.32));
  // canopy with a white valance
  const cz = 0.06, cy = PH + 0.56;
  g.add(box(2.0, 0.045, 0.58, C.green).at(-0.2, cy, cz + 0.1).rot(deg(6), 0, 0));
  [-1.05, -0.2, 0.65].forEach((x) => g.add(cyl(0.022, 0.026, cy - PH, C.green, { seg: 8 }).at(x, PH, cz + 0.34)));
  const val = grp(); for (let i = 0; i < 20; i++) val.add(extrude([[-0.05, 0], [0.05, 0], [0, -0.08]], 0.015, P.white).at(-1.2 + 0.05 + i * 0.1, 0, 0));
  g.add(val.weld().at(-0.2 + 0.2, cy + 0.02, cz + 0.39));
  // clock under canopy
  const face = tex.custom(128, 128, (x, w) => { x.fillStyle = P.white; x.fillRect(0, 0, w, w); x.strokeStyle = P.ink; x.lineWidth = 9; x.lineCap = 'round'; x.beginPath(); x.moveTo(64, 64); x.lineTo(64, 28); x.moveTo(64, 64); x.lineTo(90, 72); x.stroke(); });
  g.add(cyl(0.09, 0.09, 0.03, [K.mat(P.ink2), texMat(face), K.mat(P.ink2)], { seg: 20 }).rot(deg(90), 0, 0).at(0.25, cy - 0.12, cz + 0.33));
  // name board, bench, lamps, churns, trolley
  g.add(grp(K.sign('MAPLEWICK', { w: 0.95, h: 0.2, bg: C.navy, fg: P.white, frame: C.navy }).at(0, 0.22, 0), ...[-0.4, 0.4].map((x) => box(0.04, 0.44, 0.04, P.ink2).at(x, 0, -0.04))).at(1.05, PH, 0.42));
  g.add(K.bench(1.0, C.green).sc(0.45).at(-0.85, PH, 0.05));
  [-1.45, 1.5].forEach((x) => g.add(K.lamppost(1.1, C.green, o.lit ? '#ffe7a8' : P.butter).sc(0.55).at(x, PH, 0.3)));
  [0, 0.12].forEach((dx) => g.add(lathe([[0.001, 0], [0.05, 0], [0.055, 0.1], [0.04, 0.14], [0.03, 0.18], [0.04, 0.2], [0.001, 0.2]], P.steel, { seg: 14 }).at(1.15 + dx, PH, -0.25 + dx * 0.6)));
  g.add(grp(box(0.36, 0.03, 0.2, P.woodDk).at(0, 0.08, 0), K.wheel(0.05, 0.02, P.ink2, P.steel).at(-0.12, 0.05, 0.1), K.wheel(0.05, 0.02, P.ink2, P.steel).at(-0.12, 0.05, -0.1), rbox(0.16, 0.1, 0.14, P.mustard, { r: 0.02 }).at(-0.06, 0.11, 0), rbox(0.12, 0.08, 0.12, P.teal, { r: 0.02 }).at(0.09, 0.11, 0)).at(-1.35, PH, -0.25));
  // posters on the station wall
  [[-0.75, P.mustard, 'SEA'], [0.35, P.sky, 'HILLS']].forEach(([x, c, t]) => g.add(K.sign(t, { w: 0.2, h: 0.26, bg: c, fg: P.ink, frame: P.white }).at(x - 0.2, PH + 0.12, -0.03)));
  return g;
}
function crossing(o = {}) { // level-crossing furniture for a road along Z crossing a track along X at the origin
  const g = grp();
  g.add(box(0.7, RAIL - BH, 0.9, texMat(tex.planks({ base: '#9b8a76', line: '#6f6152', n: 4, vertical: true }))).at(0, BH - 0.005, 0));
  const arm = texMat(tex.stripes({ colors: [C.loco, P.white], n: 8, vertical: true }));
  const gate = (side) => {
    const piv = grp(box(0.9, 0.04, 0.03, arm).at(0.45, -0.02, 0)).at(0, 0.32, 0).rot(0, 0, o.down ? 0 : deg(78));
    return grp(cyl(0.035, 0.04, 0.34, P.white, { seg: 10 }), box(0.1, 0.1, 0.08, P.ink2).at(0, 0.27, 0), piv).rot(0, side > 0 ? 0 : Math.PI, 0);
  };
  g.add(gate(1).at(-0.5, 0, 0.62), gate(-1).at(0.5, 0, -0.62));
  const red = (on) => (on ? K.glow('#ff5a3c') : K.mat('#7a2a20'));
  const lights = (rotY) => grp(cyl(0.025, 0.03, 0.5, P.white, { seg: 8 }), box(0.3, 0.12, 0.02, P.ink2).at(0, 0.36, 0.02),
    sph(0.055, red(o.lit), { seg: 12 }).at(-0.09, 0.42, 0.05), sph(0.055, red(o.lit), { seg: 12 }).at(0.09, 0.42, 0.05),
    box(0.34, 0.05, 0.015, P.white).rot(0, 0, deg(30)).at(0, 0.56, 0.03), box(0.34, 0.05, 0.015, P.white).rot(0, 0, deg(-30)).at(0, 0.56, 0.03)).rot(0, rotY, 0);
  g.add(lights(0).at(0.48, 0, 0.66), lights(Math.PI).at(-0.48, 0, -0.66));
  return g;
}

// --- workbench clutter (life-size, so it towers over the model)
function mug() {
  const g = grp(lathe([[0.001, 0], [0.5, 0], [0.53, 0.06], [0.53, 1.1], [0.47, 1.1], [0.47, 0.14], [0.001, 0.14]], C.cream, { seg: 32 }));
  g.add(cyl(0.535, 0.535, 0.16, C.loco, { seg: 32, open: true }).at(0, 0.62, 0), cyl(0.47, 0.47, 0.02, '#5a3424', { seg: 28 }).at(0, 0.9, 0));
  g.add(torus(0.26, 0.07, C.cream, { ts: 20 }).at(0.56, 0.58, 0));
  return g;
}
const tin = (c, open = false) => grp(cyl(0.2, 0.2, 0.2, P.steel, { seg: 20 }), open ? cyl(0.18, 0.18, 0.01, c, { seg: 20 }).at(0, 0.2, 0) : cyl(0.21, 0.21, 0.05, c, { seg: 20 }).at(0, 0.2, 0));
const brush = (c = C.loco, tip = C.green, len = 1.5) => grp(cyl(0.07, 0.055, len, c, { seg: 10 }), cyl(0.07, 0.07, 0.2, P.steel, { seg: 10 }).at(0, len, 0), cone(0.07, 0.28, tip, { seg: 10 }).at(0, len + 0.2, 0));
const ruler = (len = 4) => box(len, 0.04, 0.42, [K.mat(P.steel), K.mat(P.steel), texMat(tex.custom(512, 64, (x, w, h) => { x.fillStyle = '#e8e2d2'; x.fillRect(0, 0, w, h); x.strokeStyle = P.ink; x.lineWidth = 2; for (let i = 0; i <= 60; i++) { const px = 8 + i * (w - 16) / 60; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, i % 10 ? (i % 5 ? 12 : 20) : 30); x.stroke(); } })), K.mat(P.steel), K.mat(P.steel), K.mat(P.steel)]);
const knife = () => grp(cyl(0.05, 0.05, 0.9, P.blue, { seg: 10 }).rot(0, 0, deg(-90)), extrude([[0, 0], [0.22, 0.02], [0.1, 0.09], [0, 0.07]], 0.02, P.steel).rot(deg(90), 0, 0).at(0.9, 0.05, -0.04)).at(0, 0.05, 0);

// cutting mat with a half-built house kit, glue and a row of unpainted figures
function workMat() {
  const g = grp(box(3.4, 0.02, 1.25, texMat(tex.grid({ bg: '#3e5967', line: '#86a6b2', cells: 8, lw: 2, rep: [2.7, 1] }))));
  const wall = C.paper, y = 0.02;
  const kit = grp(box(1.0, 0.5, 0.04, wall).at(0, 0, 0.35), box(1.0, 0.5, 0.04, wall).at(0, 0, -0.35), box(0.04, 0.5, 0.7, wall).at(-0.48, 0, 0), box(0.04, 0.5, 0.7, wall).at(0.48, 0, 0));
  [-0.25, 0.25].forEach((x) => kit.add(box(0.2, 0.22, 0.05, '#3a3330').at(x, 0.18, 0.35)));
  g.add(kit.sc(0.8).rot(0, deg(12), 0).at(-0.7, y, 0));
  g.add(box(0.9, 0.03, 0.5, C.loco).rot(0, deg(-20), 0).at(0.35, y, 0.25), box(0.9, 0.03, 0.5, C.loco).rot(0, deg(-8), 0).at(0.45, y + 0.03, -0.1));
  g.add(grp(cap(0.09, 0.4, P.white, { seg: 12 }), cone(0.04, 0.14, C.loco, { seg: 8 }).at(0, 0.56, 0)).rot(0, 0, deg(90)).at(1.35, y + 0.09, -0.2));
  for (let i = 0; i < 4; i++) g.add(K.person({ hairStyle: ['short', 'bob', 'short', 'curly'][i], skin: P.g5, hair: P.g4, top: P.g5, bottom: P.g4, shoes: P.g4, body: i === 3 ? 'kid' : 'adult' }).sc(0.3).at(1.0 + i * 0.22, y, 0.38));
  return g;
}
function bench(w = 15.8, d = 9.0) {
  const side = K.mat(C.benchDk), top = texMat(tex.planks({ base: C.bench, line: C.benchDk, n: 8 }));
  const g = grp(box(w, 0.6, d, [side, side, top, side, side, side]).at(0, -0.6, 0));
  const r = rng(11);
  [P.sky, C.loco, P.mustard, C.green].forEach((c, i) => g.add(cyl(0.12 + r() * 0.1, 0.12 + r() * 0.1, 0.005, c, { seg: 14 }).sc(1, 1, 0.7).at(-w / 2 + 1 + r() * 2, 0, d / 2 - 0.5 - r() * 1.2).noInk()));
  return g;
}

function backscene(w = 13, h = 1.7) {
  const art = tex.custom(1024, 160, (x, W, H) => {
    const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#8ec7e0'); gr.addColorStop(1, '#d9eef3'); x.fillStyle = gr; x.fillRect(0, 0, W, H);
    x.fillStyle = 'rgba(255,255,255,.9)'; [[120, 40], [380, 28], [640, 50], [890, 34]].forEach(([cx, cy]) => { [0, 26, -24, 50].forEach((dx, i) => { x.beginPath(); x.ellipse(cx + dx, cy + (i % 2) * 6, 34, 14, 0, 0, 7); x.fill(); }); });
    x.fillStyle = '#a9c8a0'; x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= 16; i++) x.lineTo(i * W / 16, H - 40 - Math.sin(i * 1.3) * 16 - (i % 3) * 6); x.lineTo(W, H); x.fill();
    x.fillStyle = '#8db585'; x.beginPath(); x.moveTo(0, H); for (let i = 0; i <= 12; i++) x.lineTo(i * W / 12, H - 18 - Math.cos(i * 1.7) * 9); x.lineTo(W, H); x.fill();
  });
  const s = K.mat(P.white);
  return box(w, h, 0.08, [s, s, s, s, texMat(art), s]);
}

// --- the whole layout, on its board, on the bench
function layout(o = {}) {
  const g = grp(), path = ovalPath(10, 4.8, 1.6);
  g.add(bench().at(0, -0.35, 0.3));
  g.add(slab(13, 7.4, { map: baizeMap(), h: 0.35 }).at(0, 0, -0.2));
  if (o.backscene !== false) g.add(backscene().at(0, 0, -3.86));
  g.add(ovalTrack(path));
  // town road and level crossing
  g.add(box(0.6, 0.012, 0.76, C.road).at(2.3, 0, 3.13), box(0.6, 0.012, 1.7, C.road).at(2.3, 0, 1.15), box(3.4, 0.012, 0.55, C.road).at(2.6, 0, 0.05));
  g.add(crossing({ down: !!o.lit, lit: o.lit }).at(2.3, 0, 2.4));
  g.add(station({ lit: o.lit }).at(-0.6, 0, 1.39));
  // town
  g.add(K.house({ w: 1.8, d: 1.3, wall: P.butter, roof: P.terracotta, door: C.green, chimney: true, glass: o.lit ? K.glow(C.lamp) : P.glass }).sc(0.5).at(1.4, 0, -0.75));
  g.add(K.house({ w: 1.5, d: 1.3, h: 1.0, floors: 2, wall: P.white, roof: P.slate, door: C.loco, shutters: C.green, glass: o.lit ? K.glow(C.lamp) : P.glass }).sc(0.5).at(2.75, 0, -0.85));
  g.add(K.house({ w: 1.7, d: 1.2, h: 1.15, wall: P.sky, roof: C.loco, roofType: 'flat', awning: [C.loco, P.white], sign: 'TOYS', door: P.mustard, glass: o.lit ? K.glow(C.lamp) : P.glass }).sc(0.45).at(3.75, 0, 0.75));
  const church = grp(K.house({ w: 1.4, d: 2.0, h: 1.2, wall: '#d8cfbf', roof: P.slate, roofH: 0.9, door: C.loco, windows: 0 }), box(0.7, 2.0, 0.7, '#d8cfbf').at(0, 0.14, 1.25), cone(0.5, 1.1, P.slate, { seg: 4 }).rot(0, deg(45), 0).at(0, 2.14, 1.25), K.sign('', { w: 0.32, h: 0.32, bg: P.white, frame: P.ink2 }).at(0, 1.5, 1.6));
  g.add(church.sc(0.45).at(-0.2, 0, -1.25));
  // lake with a rowing boat, ducks and reeds
  g.add(cyl(1.02, 1.02, 0.015, P.sand, { seg: 36 }).sc(1.2, 1, 0.78).at(-2.95, 0, -0.45), cyl(1, 1, 0.03, texMat(tex.waves({ base: C.lake, line: '#a4d9e8', rep: [1.5, 1] })), { seg: 36 }).sc(1.1, 1, 0.7).at(-2.95, 0, -0.45));
  g.add(K.vehicle({ kind: 'boat', body: P.white, trim: C.loco, len: 1.2 }).sc(0.32).rot(0, deg(30), 0).at(-3.3, -0.05, -0.55));
  [[-2.4, -0.2], [-2.2, -0.35]].forEach(([x, z], i) => g.add(K.bird({ color: P.white, wing: P.white, beak: P.orange }).sc(0.45).rot(0, deg(150 + i * 30), 0).at(x, 0, z)));
  for (let i = 0; i < 7; i++) { const a = 2.2 + i * 0.16; g.add(grp(cyl(0.012, 0.012, 0.32 + (i % 3) * 0.06, P.moss, { seg: 5 }), cap(0.025, 0.06, P.woodDk, { seg: 6 }).at(0, 0.3 + (i % 3) * 0.06, 0)).at(-2.95 + Math.cos(a) * 1.15, 0, -0.45 + Math.sin(a) * 0.75)); }
  g.add(fig({ hairStyle: 'short', hair: P.hairGrey, top: P.mustard, bottom: P.navy, hat: 'flatcap', held: cyl(0.01, 0.015, 1.4, P.woodDk, { seg: 6 }).rot(deg(-40), 0, 0) }, 0.28).rot(0, deg(120), 0).at(-1.75, 0, -0.1));
  // hill and tunnel over the back-right corner
  g.add(hill().at(4.35, 0, -1.85));
  g.add(grp(portal(), box(1.0, 0.8, 0.6, C.hill).at(0, 0, -0.42)).rot(0, deg(-90), 0).at(2.42, 0, -2.4));
  g.add(grp(portal(), box(1.0, 0.8, 0.6, C.hill).at(0, 0, -0.42)).at(5, 0, -0.3));
  // trees
  [[-6.0, -3.2, 1.0, 'pine'], [-5.9, -1.4, 0.9, 'round'], [-6.05, 0.6, 1.1, 'pine'], [-5.8, 2.6, 0.8, 'round'], [-4.6, -3.3, 0.9, 'round'], [-1.9, -3.3, 1.0, 'pine'],
   [0.3, -3.35, 0.85, 'round'], [1.6, -3.3, 1.1, 'pine'], [-1.55, -1.15, 0.8, 'round'], [0.45, 0.25, 0.7, 'round'], [3.9, -0.25, 0.75, 'pine'], [6.0, 1.3, 0.9, 'round'], [6.05, 2.8, 1.0, 'pine'], [-4.2, 1.6, 0.7, 'round'], [-3.9, 0.95, 0.6, 'round']]
    .forEach(([x, z, h, k], i) => g.add(tr(x, z, h, k, i)));
  // farm at the back
  g.add(K.house({ w: 1.6, d: 1.2, wall: P.white, roof: P.brick, door: C.green, chimney: true }).sc(0.42).at(-3.3, 0, -3.25));
  g.add(K.fence(2.0, P.woodLt, { h: 0.3, gap: 0.25 }).at(-0.9, 0, -2.95));
  // residents
  g.add(fig({ hairStyle: 'short', hair: P.hairBlack, skin: P.skin3, top: C.navy, bottom: C.navy, acc: ['tie'] }).at(-0.2, 0.16, 1.55));
  g.add(fig({ body: 'round', hairStyle: 'short', hair: P.hairWhite, top: C.navy, bottom: C.navy, hat: 'captain', hatColor: C.navy, acc: ['moustache'], pose: 'wave' }).at(-1.6, 0.16, 1.7));
  g.add(fig({ body: 'kid', hairStyle: 'curly', hair: P.hairAuburn, top: P.mustard, bottom: C.navy, pose: 'wave', held: grp(kite().sc(0.6).at(0.5, 1.1, 0), tube([[0, 0, 0], [0.25, 0.5, 0.02], [0.5, 1.1, 0]], 0.012, P.ink2, { segs: 16 }).noInk()).rot(0, 0, -2.6) }).at(3.05, 0, 3.05));
  g.add(fig({ hairStyle: 'bob', hair: P.hairBrown, top: P.coral, bottom: P.navy, skirt: true }).at(1.6, 0, 0.3), fig({ hairStyle: 'short', hair: P.hairBlonde, top: P.teal, bottom: P.navy }).rot(0, deg(-30), 0).at(3.2, 0, -0.15));
  g.add(K.vehicle({ kind: 'van', body: P.mustard, trim: P.white }).sc(0.3).rot(0, deg(90), 0).at(2.45, 0, 3.25));
  // the train, mid-loop
  g.add(train(path, 1.3, { lit: o.lit }));
  // the bench clutter: mug, tins, brushes, ruler, knife, spare track
  g.add(mug().at(-6.55, -0.35, 4.05));
  g.add(tin(C.green, true).at(5.4, -0.35, 4.3), tin(C.loco).at(5.95, -0.35, 4.05), tin(P.sky).at(6.5, -0.35, 4.4), tin(P.mustard).at(6.0, -0.35, 4.75));
  g.add(cyl(0.21, 0.21, 0.05, C.green, { seg: 20 }).at(4.85, -0.35, 4.85));
  g.add(brush(C.loco, C.green).rot(0, deg(20), deg(90)).at(4.5, -0.28, 4.25), brush(P.woodLt, P.mustard, 1.2).rot(0, deg(-10), deg(90)).at(1.9, -0.28, 4.75));
  g.add(ruler(4.4).rot(0, deg(-90), 0).at(7.1, -0.35, 0.8), knife().rot(0, deg(15), 0).at(-0.9, -0.35, 4.3));
  g.add(workMat().at(-3.0, -0.35, 4.15));
  g.add(straightTrack(1.6).rot(0, deg(-8), 0).at(3.0, -0.35, 4.3));
  return g;
}

// --- build cards
function stockCard() {
  const g = grp(slab(3.7, 1.25, { map: baizeMap([2, 1]), h: 0.22 }), straightTrack(3.6));
  g.add(loco().at(0.85, RAIL, 0), carriage().at(-0.68, RAIL, 0));
  return g;
}
function stationCard() {
  const g = grp(slab(3.8, 2.6, { map: baizeMap([2, 1.4]), h: 0.22 }), straightTrack(3.8).at(0, 0, 0.82));
  g.add(station().at(0, 0, -0.29));
  g.add(fig({ body: 'round', hairStyle: 'short', hair: P.hairWhite, top: C.navy, bottom: C.navy, hat: 'captain', hatColor: C.navy, acc: ['moustache'], pose: 'wave', held: grp(K.flag(C.green, 0.6)).rot(0, 0, -2.6) }).at(-0.4, 0.16, 0.12));
  g.add(fig({ hairStyle: 'short', hair: P.hairBlack, skin: P.skin3, top: C.navy, bottom: C.navy, acc: ['tie'] }).rot(0, deg(-20), 0).at(0.55, 0.16, 0.18));
  return g;
}
function newsprint() {
  return tex.custom(256, 256, (x, w) => {
    x.fillStyle = C.paper; x.fillRect(0, 0, w, w); const r = rng(5);
    for (let i = 0; i < 14; i++) { const px = r() * w, py = r() * w, a = r() * 3; x.save(); x.translate(px, py); x.rotate(a); x.fillStyle = i % 3 ? '#e4dccb' : '#f7f2e6'; x.fillRect(-50, -18, 100, 36); x.fillStyle = '#a69f92'; for (let l = 0; l < 4; l++) x.fillRect(-44, -12 + l * 7, 60 + r() * 26, 3); x.restore(); }
  }, [2, 2]);
}
function hillCard() {
  const g = grp(slab(4.2, 3.2, { map: baizeMap([2, 1.6]), h: 0.22 }), straightTrack(3.0).rot(0, deg(90), 0).at(0, 0, 0.1));
  // front half: newspaper and plaster strips; back half: the card lattice still showing
  const paper = mesh(new THREE.SphereGeometry(1, 22, 10, 0, Math.PI, 0, Math.PI / 2), texMat(newsprint(), { side: THREE.DoubleSide }));
  g.add(grp(paper).sc(1.6, 1.1, 1.3).at(0, 0, -0.3));
  const strip = (s, x, z) => torus(1, 0.018, C.card, { arc: Math.PI, ts: 26, rs: 4 }).sc(s * 1.6, s * 1.1, 1);
  [-0.55, -0.9, -1.2].forEach((z) => { const s = Math.sqrt(1 - (z / 1.3) ** 2); g.add(strip(s).at(0, 0, z - 0.3)); });
  [-0.8, -0.25, 0.3, 0.85].forEach((x) => { const s = Math.sqrt(1 - (x / 1.6) ** 2); g.add(torus(1, 0.018, C.card, { arc: Math.PI / 2, ts: 14, rs: 4 }).sc(s * 1.3, s * 1.1, 1).rot(0, deg(90), 0).at(x, 0, -0.3)); });
  // a painted green corner and rocks
  g.add(grp(sph(1, C.hill, { part: 'top', seg: 14 }).sc(0.9, 0.75, 0.75), sph(1, C.hillDk, { part: 'top', seg: 12 }).sc(0.5, 0.5, 0.5).at(-0.4, 0, 0.3)).flat().weld().at(-1.15, 0, 0.35));
  g.add(K.rock(0.22, P.stone, 3).flat().at(-1.3, 0.55, 0.4), K.tree({ kind: 'pine', h: 0.75, leaf: P.pine }).at(-1.3, 0.55, 0.1));
  g.add(grp(portal(), box(1.0, 0.8, 0.42, C.paper).at(0, 0, -0.32)).at(0, 0, 0.98));
  // pot of paint and brush on the board
  g.add(tin(C.hill, true).sc(0.8).at(1.45, 0, 0.9), brush(P.woodLt, C.hill, 1.0).rot(deg(-12), 0, deg(32)).at(1.62, 0.02, 0.92), cyl(0.17, 0.17, 0.04, C.hill, { seg: 20 }).at(1.55, 0, 1.3));
  return g;
}
function kitBox() {
  const g = grp(), W = 2.2, D = 1.5, H = 0.32, card = C.cream, red = C.loco;
  g.add(box(W, 0.04, D, card));
  g.add(box(W, H, 0.05, red).at(0, 0, D / 2 - 0.025), box(W, H, 0.05, red).at(0, 0, -D / 2 + 0.025), box(0.05, H, D, red).at(W / 2 - 0.025, 0, 0), box(0.05, H, D, red).at(-W / 2 + 0.025, 0, 0));
  g.add(box(0.03, H * 0.75, D - 0.1, card).at(-0.25, 0, 0), box(0.03, H * 0.75, D - 0.1, card).at(0.45, 0, 0), box(0.7, H * 0.75, 0.03, card).at(0.8, 0, 0));
  // tray 1: curved track pieces
  const arc = { L: 1.0, at: (s) => { const a = -0.5 + s / 1.4; return [Math.sin(a) * 1.4, Math.cos(a) * 1.4 - 1.4, Math.cos(a), -Math.sin(a)]; } };
  const top = texMat(tex.custom(128, 128, drawTrack), { side: THREE.DoubleSide });
  for (let i = 0; i < 3; i++) {
    const t = grp(band(arc, -BED, BED, 0, BH, top, dbl(C.ballastDk), SP, 30));
    [-1, 1].forEach((s) => t.add(band(arc, s * G / 2 - RW / 2, s * G / 2 + RW / 2, BH, RAIL, dbl(C.rail), dbl(C.railDk), 1, 30)));
    g.add(t.sc(0.75).rot(0, deg(90), 0).at(-0.6 + i * 0.03, 0.04 + i * RAIL * 0.75, 0.1 - i * 0.04));
  }
  // tray 2: a sprue of loco parts
  const spr = grp(box(0.62, 0.03, 0.03, P.slate).at(0, 0, -0.42), box(0.62, 0.03, 0.03, P.slate).at(0, 0, 0.42), box(0.03, 0.03, 0.87, P.slate).at(-0.3, 0, 0), box(0.03, 0.03, 0.87, P.slate).at(0.3, 0, 0), box(0.6, 0.02, 0.02, P.slate).at(0, 0, 0));
  [[-0.15, -0.22], [0.15, -0.22], [-0.15, 0.2], [0.15, 0.2]].forEach(([x, z]) => spr.add(cyl(0.09, 0.09, 0.04, red, { seg: 16 }).at(x, 0, z), cyl(0.04, 0.04, 0.05, P.cream, { seg: 10 }).at(x, 0, z)));
  spr.add(cyl(0.04, 0.05, 0.14, P.ink2, { seg: 10 }).rot(0, 0, deg(90)).at(0.09, 0.03, 0.0));
  g.add(spr.at(0.1, 0.06, 0));
  // tray 3: girders for the bridge, plus paint
  for (let i = 0; i < 2; i++) { const tr2 = grp(box(0.62, 0.035, 0.035, red).at(0, 0.2, 0), box(0.62, 0.035, 0.035, red)); for (let k = 0; k < 5; k++) tr2.add(box(0.035, 0.24, 0.03, red).rot(0, 0, (k % 2 ? 1 : -1) * 0.5).at(-0.25 + k * 0.125, 0, 0)); g.add(tr2.rot(deg(-90), 0, 0).at(0.8, 0.06 + i * 0.04, 0.38 + i * 0.05)); }
  [C.loco, C.green, P.sky].forEach((c, i) => g.add(tin(c).sc(0.45).at(0.6 + i * 0.2, 0.04, -0.45)));
  // instruction sheet and lid leaning at the back
  const sheet = tex.custom(256, 180, (x, w, h) => { x.fillStyle = P.white; x.fillRect(0, 0, w, h); x.fillStyle = P.ink; x.font = '800 30px "Bricolage Grotesque", sans-serif'; ['1', '2', '3'].forEach((n, i) => { x.fillText(n, 16 + i * 84, 40); x.strokeStyle = '#8b8178'; x.lineWidth = 4; x.strokeRect(12 + i * 84, 56, 70, 100); x.beginPath(); x.moveTo(20 + i * 84, 140); x.lineTo(70 + i * 84, 80); x.stroke(); }); });
  g.add(box(0.8, 0.02, 0.56, [K.mat(P.white), K.mat(P.white), texMat(sheet), K.mat(P.white), K.mat(P.white), K.mat(P.white)]).rot(0, deg(-14), 0).at(1.55, 0, 0.7));
  const art = tex.custom(512, 352, (x, w, h) => {
    x.fillStyle = red; x.fillRect(0, 0, w, h); x.fillStyle = C.cream; x.fillRect(20, 20, w - 40, h - 40);
    x.fillStyle = C.sky; x.fillRect(20, 20, w - 40, 200); x.fillStyle = C.lake; x.fillRect(20, 220, w - 40, 60);
    x.strokeStyle = red; x.lineWidth = 10; x.beginPath(); x.moveTo(60, 200); x.lineTo(452, 200); x.moveTo(60, 130); x.lineTo(452, 130); for (let i = 0; i <= 6; i++) { x.moveTo(60 + i * 65, 130); x.lineTo(60 + (i + (i % 2 ? -1 : 1) * 0) * 65 + 32, 200); } x.stroke();
    x.fillStyle = P.ink; x.fillRect(240, 92, 110, 38); x.fillStyle = red; x.fillRect(250, 84, 70, 36);
    x.fillStyle = red; x.font = '800 46px "Bricolage Grotesque", sans-serif'; x.textAlign = 'center'; x.fillText('TABLETOP LINE', w / 2, 66);
    x.fillStyle = P.ink; x.font = '700 30px "Bricolage Grotesque", sans-serif'; x.fillText('KIT 3  ·  IRON BRIDGE', w / 2, 316);
  });
  const lid = grp(box(W + 0.08, 0.04, D + 0.08, [K.mat(red), K.mat(red), texMat(art), K.mat(red), K.mat(red), K.mat(red)]),
    box(W + 0.08, 0.2, 0.04, red).at(0, -0.2, D / 2 + 0.02), box(W + 0.08, 0.2, 0.04, red).at(0, -0.2, -D / 2 - 0.02), box(0.04, 0.2, D + 0.08, red).at(W / 2 + 0.02, -0.2, 0), box(0.04, 0.2, D + 0.08, red).at(-W / 2 - 0.02, -0.2, 0));
  g.add(lid.rot(deg(72), 0, 0).at(0, 0.82, -D / 2 - 0.3));
  return g;
}
function crossingScene() {
  const g = grp();
  g.add(slab(7, 4.4, { map: baizeMap([3, 2], 6), h: 0.3 }));
  g.add(straightTrack(7).at(0, 0, 0.2));
  g.add(box(0.6, 0.012, 4.4, C.road).at(0.6, 0, 0));
  g.add(crossing({ down: true, lit: true }).at(0.6, 0, 0.2));
  g.add(loco({ lit: true }).at(-1.25, RAIL, 0.2), carriage({ lit: true, faces: false }).at(-2.78, RAIL, 0.2));
  [-2.7, -2.15, -1.6, -1.05].forEach((x, i) => g.add(K.tree({ kind: 'bush', h: 0.32, leaf: [P.leaf, P.moss, '#6aa84f'][i % 3], seed: i + 4 }).at(x, 0, 1.95)));
  [-2.4, -1.85, -1.3, -0.75].forEach((x, i) => g.add(K.flower([P.pink, P.butter, P.white, P.coral][i], 0.16).at(x, 0, 1.65)));
  const poles = [-3.0, -1.2, 0.6 + 1.0, 3.0].map((x) => [x, -0.45]);
  poles.forEach(([x, z]) => g.add(grp(cyl(0.025, 0.03, 1.1, P.woodDk, { seg: 8 }), box(0.3, 0.03, 0.03, P.woodDk).at(0, 1.0, 0)).at(x, 0, z)));
  [-0.12, 0.12].forEach((dx) => poles.slice(1).forEach(([x, z], i) => { const x0 = poles[i][0]; g.add(tube([[x0 + dx, 1.03, z], [(x0 + x) / 2 + dx, 0.93, z], [x + dx, 1.03, z]], 0.006, P.ink, { segs: 16 }).noInk()); }));
  [[-1.9, -0.75], [-1.6, -0.72], [-1.2, -0.75], [-1.0, -0.72]].forEach(([x, z], i) => g.add(K.flower([P.pink, P.butter, P.white, P.coral][i], 0.2).at(x, 0, z)));
  const van = K.vehicle({ kind: 'van', body: C.loco, trim: P.white }); [-1, 1].forEach((s) => van.add(sph(0.09, K.glow('#fff4c8'), { seg: 10 }).at(1.03, 0.45, s * 0.3)));
  g.add(van.sc(0.32).rot(0, deg(90), 0).at(0.75, 0, 1.75));
  g.add(grp(cyl(0.07, 0.07, 0.26, C.loco, { seg: 14 }), sph(0.07, C.loco, { part: 'top', seg: 14 }).at(0, 0.26, 0), box(0.06, 0.015, 0.02, P.ink).at(0, 0.2, 0.07)).at(-0.75, 0, -0.65), K.bench(1.0, C.green).sc(0.4).at(2.0, 0, -0.62));
  g.add(K.house({ w: 1.6, d: 1.2, wall: P.white, roof: P.slate, door: C.green, chimney: true, glass: K.glow(C.lamp), }).sc(0.5).at(-1.5, 0, -1.3));
  g.add(K.house({ w: 1.8, d: 1.3, h: 1.0, floors: 2, wall: P.butter, roof: P.terracotta, door: C.loco, glass: K.glow(C.lamp) }).sc(0.5).at(2.2, 0, -1.25));
  [[-0.2, -0.75], [1.4, -0.75], [1.4, 1.2]].forEach(([x, z]) => g.add(K.lamppost(1.1, P.ink2, '#ffe7a8').sc(0.55).at(x, 0, z)));
  [[-3.0, -1.4, 'pine'], [-2.6, -1.85, 'round'], [3.2, -1.6, 'pine'], [3.15, 1.6, 'round'], [2.6, 1.85, 'pine'], [-3.2, -0.6, 'round']].forEach(([x, z, k], i) => g.add(tr(x, z, 0.95, k, i + 2)));
  g.add(K.fence(1.8, P.white, { h: 0.28, gap: 0.22 }).at(-1.6, 0, -0.55), K.fence(1.4, P.white, { h: 0.28, gap: 0.22 }).at(2.3, 0, -0.55));
  g.add(fig({ hairStyle: 'short', hair: P.hairBlack, skin: P.skin3, top: C.navy, bottom: C.navy, acc: ['tie'], held: grp(rbox(0.32, 0.24, 0.09, P.woodDk, { r: 0.03 }).at(0, -0.3, 0)) }).rot(0, deg(-20), 0).at(1.45, 0, 1.6));
  g.add(fig({ body: 'kid', hairStyle: 'curly', hair: P.hairAuburn, top: P.mustard, bottom: C.navy, pose: 'wave' }).at(-0.15, 0, 1.3));
  const warm = new THREE.PointLight('#ffb867', 3, 3.2, 1.5); warm.position.set(-1.5, 1.0, -0.4);
  const red = new THREE.PointLight('#ff5a3a', 1.2, 1.4, 2); red.position.set(0.6, 0.55, 0.9);
  g.add(warm, red);
  return g;
}

// --- characters
const onBase = (p) => grp(cyl(0.36, 0.38, 0.07, C.baize, { seg: 28 }), cyl(0.385, 0.385, 0.012, C.ply, { seg: 28 }), p.at(0, 0.07, 0));
const newspaper = () => box(0.06, 0.36, 0.26, [K.mat(C.paper), K.mat(C.paper), K.mat(C.paper), K.mat(C.paper), texMat(tex.text('NEWS\n= = =', { bg: C.paper, fg: P.ink, w: 128, h: 176, font: '800 34px "Bricolage Grotesque", sans-serif' })), K.mat(C.paper)]).rot(0, deg(-90), 0);
const briefcase = () => grp(rbox(0.34, 0.25, 0.1, P.woodDk, { r: 0.03 }).at(0, -0.34, 0), torus(0.05, 0.015, P.ink2, { arc: Math.PI, ts: 10 }).at(0, -0.09, 0), box(0.04, 0.03, 0.11, P.mustard).at(0.08, -0.15, 0));

export default {
  slug: 'railway',
  title: 'Tabletop Line',
  logline: 'Build a model railway on a workbench, then watch the tiny town use it.',
  genre: ['Cosy toy builder', 'Transport', 'Puzzle-lite'],
  theme: { accent: C.loco, cardBg: '#f1e6cf' },
  pitch: 'In the back room of a hobby shop you build a layout on a board. Lay track, add a station and a few houses, and the little residents start to commute. Busy routes bring visitors, and visitors unlock new kit boxes: a bridge, a tunnel, a harbour. There is no failing. The layout just gets livelier.',
  loop: ['Open a kit box and sort the parts', 'Lay track on the board', 'Place a station and a few houses', 'Run the trains while the residents ride', 'Visitors unlock the next kit box'],
  why: ['It is literally a diorama, so ink outlines make it look like a painted model.', 'A builder small enough to finish: one board and a handful of kit boxes.', 'Every piece is a chunky toy prop: the loco, the station, the tunnel hill, the kit box.'],
  fromYou: 'About 900 hours in Cities in Motion, Transport Fever and TransOcean, shrunk to one board. The model railway was one of the five shop pitches, and the kit boxes borrow Brickyard\'s step-by-step builds.',
  similar: [
    { name: 'Railbound', url: 'https://store.steampowered.com/app/1967510', note: 'closest palette match, cosy track-laying puzzles' },
    { name: 'Station to Station', url: 'https://store.steampowered.com/app/2272400', note: 'link little towns with rail, watch them grow' },
    { name: 'Mini Motorways', url: 'https://store.steampowered.com/app/1127500', note: 'a small town that lives on your routes' },
    { name: 'Tiny Glade', url: 'https://store.steampowered.com/app/2198150', note: 'build for the joy of it, no way to fail' },
  ],
  palette: [['Baize green', C.baize], ['Track grey', C.track], ['Loco red', C.loco], ['Plaster white', C.plaster], ['Bench wood', C.bench], ['Sky blue', C.sky]],
  key: { build: () => layout(), bg: [[0, '#efe0c4'], [1, '#e6d2b0']], cam: { yaw: -16, pitch: 45, fov: 24, target: [-0.2, 0, 1.3], zoom: 1.45 }, caption: 'The back room after closing: the 5:40 into Maplewick' },
  characters: [
    { name: 'June', role: 'You. Runs the hobby shop and builds the layout after closing.', build: () => K.person({ hairStyle: 'bun', hair: '#8c7b6e', skin: P.skin2, top: '#e9e1cf', sleeves: '#e9e1cf', bottom: P.navy, apron: C.green, acc: ['glasses'], pose: 'hold', held: loco({ steam: false }).sc(0.34) }) },
    { name: 'Mr Okoro', role: 'Catches the 8:12 every morning. Has never once missed it.', build: () => onBase(grp(K.person({ hairStyle: 'short', hair: P.hairBlack, skin: P.skin3, top: C.navy, bottom: C.navy, acc: ['tie', 'glasses'], held: briefcase() }), newspaper().rot(0, 0, deg(-8)).at(-0.38, 0.62, 0.06))) },
    { name: 'Mr Fairley', role: 'Station master. Green flag, brass whistle, never late.', build: () => onBase(K.person({ body: 'round', hairStyle: 'short', hair: P.hairWhite, skin: P.skin1, top: C.navy, bottom: C.navy, hat: 'captain', hatColor: C.navy, acc: ['moustache', 'badge'], pose: 'wave', held: grp(K.flag(C.green, 0.6)).rot(0, 0, -2.6) })) },
    { name: 'Pip', role: 'Waits at the level crossing to wave at every train.', build: () => onBase(K.person({ body: 'kid', hairStyle: 'curly', hair: P.hairAuburn, skin: P.skin1, top: P.mustard, bottom: C.navy, acc: ['scarf'], accColor: C.loco, pose: 'wave', held: grp(kite().at(0.55, 1.3, 0.05), tube([[0, 0, 0], [0.3, 0.6, 0.03], [0.55, 1.3, 0.05]], 0.012, P.ink2, { segs: 16 }).noInk()).rot(0, 0, -2.6) })) },
  ],
  builds: [
    { name: 'No. 7 and carriage', tag: 'Vehicle', note: 'Small tank engine. Cotton-wool steam, brass dome.', build: () => stockCard(), cam: { yaw: -24, pitch: 18 } },
    { name: 'Maplewick station', tag: 'Building', note: 'Platform, canopy, clock and a name board.', build: () => stationCard(), cam: { yaw: -26, pitch: 24 } },
    { name: 'Tunnel hill', tag: 'Structure', note: 'Half done: card lattice, newspaper, first coat of green.', build: () => hillCard(), cam: { yaw: -30, pitch: 26 } },
    { name: 'Kit box No. 3', tag: 'Prop', note: 'Lid off, parts in trays. This one builds the bridge.', build: () => kitBox(), cam: { yaw: -22, pitch: 40 } },
  ],
  environments: [
    { name: 'Maplewick, at figure height', note: 'Same layout, down where the residents live: the 5:40 pulls in.', build: () => layout(), cam: { yaw: -22, pitch: 28, target: [-1.3, 0.4, 1.4], zoom: 3.0 } },
    { name: 'Level crossing at dusk', note: 'Gates down, lights on, the last train home.', build: () => crossingScene(), stage: { bg: [[0, '#eaa27a'], [0.55, '#c9a3b8'], [1, '#8f86b0']], light: 'night', sun: [-1, 0.5, 0.4] }, cam: { yaw: -28, pitch: 27, target: [-0.3, 0.3, 0.15], zoom: 1.1 } },
  ],
};
