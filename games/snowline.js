// Snowline — board 5. A mountain village kept warm through one long winter; every hearth melts a circle you can build in.
// Every build() returns a fresh Object3D. Front of things faces +Z; the horse and sled point their nose along +X.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng } = K;

// --- local palette
const C = {
  snow: '#f2f4f2', snowDk: '#dde5ea', pine: '#3f6b52', pineDk: '#30584a', cabin: '#b8402e', cabinDk: '#8a2f22', amber: '#e8892c', ice: '#a8cfe0', iceDk: '#7fb0c8',
  slate: '#5d6b78', earth: '#7b5a3f', earthDk: '#5a4130', grass: '#86ad5c', grassDk: '#6c9a4b', stone: '#bdb7ab', stoneDk: '#8f897f', log: '#8a5a36', logEnd: '#e2b47c',
  flame: '#ffa23a', flameHot: '#ffe08a', window: '#ffcf6e', path: '#dde5ea', bread: '#d99a55', mustard: '#e9b23a', wool: '#ece6d8', horse: '#8a5636', water: '#2f5f78',
};

// --- low-level helpers
const mesh = (geo, m) => { const o = new THREE.Mesh(geo, m); o.castShadow = o.receiveShadow = true; return o; };
/** Flat strip that follows a smooth curve through [x, z] points (paths, frozen streams). */
function ribbon(pts, w, m, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))), n = o.n ?? 90, y = o.y ?? 0.012, rep = o.rep ?? 6;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, p = curve.getPointAt(t), tg = curve.getTangentAt(t), nx = -tg.z, nz = tg.x, ww = typeof w === 'function' ? w(t) : w;
    pos.push(p.x + (nx * ww) / 2, y, p.z + (nz * ww) / 2, p.x - (nx * ww) / 2, y, p.z - (nz * ww) / 2);
    uv.push(t * rep, 0, t * rep, 1);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx); geo.computeVertexNormals();
  const me = mesh(geo, m); me.castShadow = false; return me;
}
const pathMat = () => texMat(tex.custom(128, 64, (x, w, h) => { x.fillStyle = C.path; x.fillRect(0, 0, w, h); x.fillStyle = '#c2cfd8'; x.fillRect(0, h * 0.3, w, 4); x.fillRect(0, h * 0.66, w, 4); }), { side: THREE.DoubleSide });
const iceMat = () => texMat(tex.custom(256, 64, (x, w, h) => { x.fillStyle = C.ice; x.fillRect(0, 0, w, h); x.strokeStyle = '#d7ecf4'; x.lineWidth = 3; const r = rng(4); for (let i = 0; i < 9; i++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 3; k++) { px += 10 + r() * 22; py += (r() - 0.5) * 22; x.lineTo(px, py); } x.stroke(); } }), { side: THREE.DoubleSide });
const snowTop = (rep = [3, 2], seed = 2) => texMat(tex.speckle({ base: C.snow, dots: ['#e4ebef', '#ffffff'], n: 150, size: 2.4, seed, rep }));

/** Snow slab: white top layer (visible as a band on the sides) over frozen earth. Top at y = 0. */
function snowSlab(w, d, o = {}) {
  const h = o.h ?? 0.5, sn = o.sn ?? 0.16, s = K.mat(C.snow);
  return grp(box(w, h - sn, d, C.earthDk).at(0, -h, 0), box(w, sn, d, [s, s, snowTop(o.rep ?? [Math.max(1, w / 4), Math.max(1, d / 4)], o.seed), s, s, s]).at(0, -sn, 0));
}
/** Round snow plate for single builds. */
const snowPlate = (r = 1.6, h = 0.32) => grp(cyl(r, r * 1.02, h - 0.12, C.earthDk, { seg: 40 }).at(0, -h, 0), cyl(r, r, 0.12, [K.mat(C.snow), snowTop([1.5, 1.5]), K.mat(C.snow)], { seg: 40 }).at(0, -0.12, 0));
/** Faceted mountain with a jagged snow cap (the cap reuses the top rows of the same jittered cone). */
function peak(r, h, seed = 1) {
  const rs = 7, hs = 5, rr = rng(seed), geo = new THREE.ConeGeometry(r, h, rs, hs).translate(0, h / 2, 0), p = geo.attributes.position, nT = (hs + 1) * (rs + 1);
  const jit = []; for (let iy = 0; iy <= hs; iy++) { jit[iy] = []; for (let ix = 0; ix < rs; ix++) jit[iy][ix] = [1 + (rr() - 0.5) * 0.4, (rr() - 0.5) * 0.12]; }
  for (let iy = 1; iy <= hs; iy++) for (let ix = 0; ix <= rs; ix++) { const i = iy * (rs + 1) + ix, [k, dy] = jit[iy][ix % rs]; p.setXYZ(i, p.getX(i) * k, p.getY(i) + (iy < hs ? dy * h / hs : 0), p.getZ(i) * k); }
  const snow = geo.clone(), q = snow.attributes.position;
  for (let i = 0; i < q.count; i++) {
    if (i >= nT) { q.setXYZ(i, 0, h, 0); continue; }
    const iy = Math.floor(i / (rs + 1)), ix = i % (rs + 1), row = 2 + ((ix % rs) % 2);
    if (iy > row) { const j = row * (rs + 1) + ix; q.setXYZ(i, p.getX(j), p.getY(j), p.getZ(j)); }
    q.setXYZ(i, q.getX(i) * 1.04, q.getY(i) + 0.02, q.getZ(i) * 1.04);
  }
  return grp(mesh(geo, K.mat(C.slate)), mesh(snow, K.mat(C.snow))).flat();
}
const drift = (r = 0.5, h = 0.3) => sph(1, C.snow, { part: 'top', seg: 16 }).sc(r * 1.3, h * 0.8, r * 0.7);

/** The warmth radius: a disc of thawed earth and grass set into the snow, with a pushed-back snow lip. */
function warmth(r, o = {}) {
  const g = grp(), rr = rng(o.seed ?? 5);
  g.add(cyl(r, r, 0.02, C.earth, { seg: 56 }).at(0, -0.004, 0));
  g.add(cyl(r * 0.86, r * 0.86, 0.03, texMat(tex.speckle({ base: C.grass, dots: [C.grassDk, '#9fc46c'], n: 140, size: 3, seed: o.seed ?? 5 })), { seg: 56 }).at(0, -0.004, 0));
  g.add(torus(r + 0.05, 0.12, C.snow, { ts: 72, rs: 8 }).rot(deg(90), 0, 0).sc(1, 1, 0.5));
  for (let i = 0; i < (o.tufts ?? 10); i++) {
    const a = rr() * Math.PI * 2, d = r * (0.35 + rr() * 0.45);
    g.add(i % 3 ? K.grassTuft(C.grassDk, 0.16).at(Math.cos(a) * d, 0.02, Math.sin(a) * d) : K.flower([P.butter, P.white, P.pink][i % 3], 0.14).at(Math.cos(a) * d, 0.02, Math.sin(a) * d));
  }
  return g;
}

// --- nature
function pine(h = 1.6, seed = 1, o = {}) {
  const r = rng(seed), g = grp(cyl(0.05 * h, 0.07 * h, h * 0.25, P.bark, { seg: 7 }));
  for (let i = 0; i < 3; i++) {
    const R = h * (0.36 - i * 0.08), H = h * 0.42, y = h * (0.18 + i * 0.2), rot = r() * 3;
    g.add(cone(R, H, o.leaf ?? C.pine, { seg: 9 }).rot(0, rot, 0).at(0, y, 0));
    g.add(cone(R * 0.7, H * 0.66, C.snow, { seg: 9 }).rot(0, rot, 0).at(0, y + H * 0.36, 0));
  }
  if (o.lean) g.rotation.z = o.lean;
  return g;
}
const logH = (len = 0.6, r = 0.07, c = C.log) => grp(cyl(r, r, len, [K.mat(c), K.mat(C.logEnd), K.mat(C.logEnd)], { seg: 9 }).at(0, -len / 2, 0)).rot(0, 0, deg(90));
function woodpile(n = 3, len = 0.7) {
  const g = grp();
  for (let row = 0; row < n; row++) for (let i = 0; i < n - row; i++) g.add(logH(len, 0.08).rot(0, deg(90), deg(90)).at(0, 0.08 + row * 0.14, (i - (n - row - 1) / 2) * 0.17));
  return g;
}
function goat(c = P.white) {
  const g = grp(cap(0.17, 0.32, c, { seg: 14 }).rot(0, 0, deg(90)).at(0.33, 0.45, 0), sph(0.14, c, { seg: 14 }).sc(1.2, 1, 0.9).at(0.42, 0.72, 0), sph(0.08, P.stone, { seg: 10 }).sc(1.2, 0.8, 0.9).at(0.56, 0.68, 0));
  [[0.2, 0.1], [0.2, -0.1], [-0.2, 0.1], [-0.2, -0.1]].forEach(([x, z]) => g.add(cyl(0.035, 0.03, 0.32, c, { seg: 8 }).at(x, 0, z), cyl(0.038, 0.038, 0.05, P.ink2, { seg: 8 }).at(x, 0, z)));
  [-1, 1].forEach((s) => { g.add(cone(0.035, 0.18, P.stoneDk, { seg: 6 }).rot(0, 0, deg(55)).at(0.36, 0.8, s * 0.06)); g.add(sph(0.06, c, { seg: 8 }).sc(1.4, 0.5, 0.7).at(0.38, 0.72, s * 0.13)); g.add(sph(0.02, P.ink, { seg: 6 }).at(0.5, 0.76, s * 0.08).noInk()); });
  g.add(cone(0.035, 0.12, P.stone, { seg: 6 }).rot(Math.PI, 0, 0).at(0.54, 0.62, 0), cap(0.03, 0.08, c, { seg: 6 }).rot(0, 0, deg(-50)).at(-0.18, 0.55, 0));
  return g.rot(0, deg(-90), 0);
}
function snowman() {
  return grp(sph(0.3, C.snow, { seg: 18 }).at(0, 0.26, 0), sph(0.22, C.snow, { seg: 16 }).at(0, 0.66, 0), sph(0.16, C.snow, { seg: 16 }).at(0, 0.96, 0),
    cone(0.035, 0.18, C.amber, { seg: 8 }).rot(deg(90), 0, 0).at(0, 0.96, 0.15), sph(0.022, P.ink, { seg: 6 }).at(-0.06, 1.02, 0.14).noInk(), sph(0.022, P.ink, { seg: 6 }).at(0.06, 1.02, 0.14).noInk(),
    torus(0.15, 0.05, C.cabin, { ts: 20 }).rot(deg(90), 0, 0).at(0, 0.83, 0), cyl(0.12, 0.12, 0.18, P.ink2, { seg: 14 }).at(0, 1.08, 0), cyl(0.19, 0.19, 0.03, P.ink2, { seg: 16 }).at(0, 1.08, 0));
}

// --- the great hearth: a stone ring tower with a fire bowl on top
function hearth(o = {}) {
  const g = grp();
  for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; g.add(K.rock(0.2, i % 2 ? C.stone : C.stoneDk, i + 3).flat().at(Math.cos(a) * 0.64, -0.06, Math.sin(a) * 0.64)); }
  g.add(cyl(0.42, 0.54, 1.05, texMat(tex.bricks({ base: C.stone, mortar: C.stoneDk, rows: 7, cols: 6, rep: [2, 1] })), { seg: 18 }));
  g.add(cyl(0.58, 0.5, 0.13, C.slate, { seg: 18 }).at(0, 1.03, 0));
  g.add(lathe([[0.001, 0], [0.32, 0], [0.52, 0.16], [0.58, 0.28], [0.5, 0.28], [0.001, 0.12]], P.iron, { seg: 22 }).at(0, 1.14, 0));
  [0, 1.05, 2.1].forEach((a) => g.add(logH(0.66, 0.065).rot(0, a, deg(90)).at(0, 1.34, 0)));
  const flame = (s, c) => lathe([[0.001, 0], [0.22, 0.12], [0.26, 0.3], [0.17, 0.56], [0.001, 0.9]], K.glow(c, { side: THREE.DoubleSide }), { seg: 12 }).sc(s);
  if (o.out) { g.add(sph(0.5, C.snow, { part: 'top', seg: 16 }).sc(1, 0.55, 1).at(0, 1.38, 0)); return g; }
  g.add(flame(1, C.flame).at(0, 1.3, 0), flame(0.62, C.flameHot).at(0.02, 1.3, 0.14), flame(0.55, C.flame).rot(0, 0, -0.35).at(0.24, 1.3, 0.02), flame(0.5, C.flame).rot(0, 0, 0.4).at(-0.22, 1.3, -0.04));
  [[0.12, 2.35, 0.05], [-0.18, 2.5, 0], [0.26, 2.66, -0.05], [-0.04, 2.8, 0.04]].forEach(([x, y, z]) => g.add(sph(0.035, K.glow(C.flameHot), { seg: 6 }).at(x, y, z).noInk()));
  if (o.wood !== false) g.add(woodpile(3, 0.6).rot(0, deg(30), 0).at(0.85, 0, 0.45));
  if (o.light !== false) { const L = new THREE.PointLight('#ffa448', o.li ?? 5, o.ld ?? 6, 1.4); L.position.set(0, 1.9, 0); g.add(L); }
  return g;
}

// --- buildings
/** Red plank cabin with a snowy roof and icicles along the front eave. */
function cabin(o = {}) {
  const w = o.w ?? 1.8, d = o.d ?? 1.4, h = o.h ?? 1.1, roofH = o.roofH ?? 0.9, ov = 0.14;
  const wall = tex.planks({ base: o.wall ?? C.cabin, line: o.wallLine ?? C.cabinDk, n: 8, vertical: true });
  const g = K.house({ w, d, h, wallMap: wall, roof: texMat(tex.planks({ base: C.slate, line: '#46525e', n: 7 })), roofH, door: o.door ?? C.pine, trim: P.white, windows: o.windows ?? 2, chimney: o.chimney ?? true, base: C.stoneDk, glass: o.night ? K.glow(C.window) : '#cfe3ea', shutters: o.shutters, sign: o.sign, signBg: o.signBg, awning: o.awning });
  const ang = Math.atan2(roofH, d / 2), ey = h + 0.14 - ov * Math.tan(ang) + 0.01, ez = d / 2 + ov - 0.03, r = rng(o.seed ?? 3);
  const topY = h + 0.14, half = d / 2 + ov, slope = Math.hypot(half, roofH * (half / (d / 2)));
  [-1, 1].forEach((s) => { const a = s * ang, y = topY + roofH / 2 - 0.02 - (ov * Math.tan(ang)) / 2, z = s * (d / 4 + ov / 2), L = slope * 0.64, dd = (slope - L) / 2; g.add(rbox(w + ov * 2 - 0.12, 0.09, L, C.snow, { r: 0.04 }).rot(a, 0, 0).at(0, y + Math.cos(a) * 0.07 + s * dd * Math.sin(a) + 0.01, z + Math.sin(a) * 0.07 - s * dd * Math.cos(a))); });
  g.add(cyl(0.1, 0.1, w + ov * 2 - 0.1, C.snow, { seg: 12 }).rot(0, 0, deg(90)).at((w + ov * 2 - 0.1) / 2, topY + roofH + 0.02, 0));
  for (let x = -w / 2 - 0.06; x <= w / 2 + 0.07; x += 0.15) g.add(cone(0.03, 0.08 + r() * 0.15, C.ice, { seg: 6 }).rot(Math.PI, 0, 0).at(x, ey, ez));
  if (o.chimney !== false && o.smoke !== false) [[0, 0.18, 0.11], [0.12, 0.45, 0.14], [0.3, 0.76, 0.17]].forEach(([dx, dy, s]) => g.add(sph(s, '#e3e7ea', { seg: 12 }).at(w * 0.28 + dx, h + roofH + 0.55 + dy, -d * 0.12)));
  g.add(grp(box(0.04, 0.04, 0.16, P.iron).at(0, 0.3, -0.06), K.lantern(P.iron, C.window).sc(0.7).at(0, 0, 0.03)).at(0.42, 0.62, d / 2 + 0.03));
  if (o.wood !== false) g.add(woodpile(3, 0.55).rot(0, 0, 0).at(w / 2 + 0.22, 0, 0.1));
  g.add(drift(0.45, 0.28).at(-w / 2 - 0.05, 0, d / 2 - 0.05), drift(0.35, 0.22).at(w / 2 - 0.1, 0, -d / 2 + 0.1));
  return g;
}
function bakery(o = {}) {
  const g = cabin({ ...o, w: 2.0, d: 1.5, wall: '#e8cf9e', wallLine: '#b99a68', door: C.cabin, sign: 'BAKERY', signBg: P.white, awning: [C.cabin, P.white], wood: false, seed: 6 });
  // pretzel sign on a bracket and a bread cart
  g.add(grp(box(0.4, 0.04, 0.04, P.iron).at(0.2, 0.25, 0), torus(0.09, 0.03, C.bread, { ts: 16 }).at(0.32, 0.1, 0), torus(0.06, 0.03, C.bread, { ts: 16 }).at(0.24, 0.12, 0), torus(0.06, 0.03, C.bread, { ts: 16 }).at(0.4, 0.12, 0)).rot(0, deg(-90), 0).at(-1.05, 1.0, 0.55));
  const cart = grp(box(0.7, 0.06, 0.4, P.woodDk).at(0, 0.42, 0), ...[-0.3, 0.3].map((x) => box(0.05, 0.42, 0.05, P.woodDk).at(x, 0, 0.16)), ...[-0.3, 0.3].map((x) => box(0.05, 0.42, 0.05, P.woodDk).at(x, 0, -0.16)));
  [[-0.2, 0], [0.02, 0.05], [0.22, -0.04]].forEach(([x, z]) => cart.add(sph(0.11, C.bread, { seg: 12 }).sc(1.4, 0.7, 0.9).at(x, 0.52, z)));
  g.add(cart.at(1.35, 0, 1.0));
  return g;
}
function sauna(o = {}) {
  const g = grp();
  const logs = tex.planks({ base: C.log, line: C.earthDk, n: 7 });
  g.add(cabin({ night: o.night, w: 1.5, d: 1.2, h: 0.95, roofH: 0.7, wall: C.log, wallLine: C.earthDk, door: P.woodLt, windows: 1, chimney: false, wood: false, seed: 9 }));
  g.add(woodpile(3, 0.5).rot(0, deg(90), 0).at(-1.0, 0, 0.0));
  g.add(cyl(0.06, 0.06, 1.0, P.iron, { seg: 10 }).at(0.4, 1.3, -0.25), cone(0.12, 0.1, P.iron, { seg: 10 }).at(0.4, 2.3, -0.25));
  [[0.42, 2.5, 0.12], [0.58, 2.72, 0.16], [0.8, 3.0, 0.2]].forEach(([x, y, s]) => g.add(sph(s, '#eef1f2', { seg: 12 }).at(x, y, -0.25)));
  // deck, bucket and ladle, towel rail
  g.add(box(1.7, 0.08, 0.7, texMat(tex.planks({ base: P.woodLt, line: P.woodDk, n: 5, vertical: true }))).at(0, 0, 0.95));
  g.add(grp(cyl(0.13, 0.11, 0.2, P.woodLt, { seg: 14 }), torus(0.12, 0.012, P.iron, { ts: 16 }).rot(deg(90), 0, 0).at(0, 0.15, 0), cyl(0.012, 0.012, 0.35, P.woodDk, { seg: 6 }).rot(0, 0, deg(-35)).at(0.05, 0.12, 0)).at(-0.5, 0.08, 1.05));
  g.add(grp(box(0.04, 0.5, 0.04, P.woodDk).at(-0.3, 0, 0), box(0.04, 0.5, 0.04, P.woodDk).at(0.3, 0, 0), box(0.64, 0.04, 0.04, P.woodDk).at(0, 0.48, 0), box(0.24, 0.32, 0.02, texMat(tex.stripes({ colors: [C.cabin, P.white], n: 6, vertical: false }))).at(-0.12, 0.16, 0.03), box(0.2, 0.28, 0.02, C.ice).at(0.15, 0.2, 0.03)).at(0.45, 0.08, 1.15));
  // frozen pond with an ice hole and a ladder
  if (o.pond === false) return g;
  g.add(cyl(1.1, 1.1, 0.03, iceMat(), { seg: 40 }).sc(1.2, 1, 0.8).at(0.3, 0, 2.1), cyl(0.3, 0.3, 0.035, C.water, { seg: 20 }).sc(1.2, 1, 1).at(0.6, 0, 2.15), torus(0.31, 0.04, C.snow, { ts: 24 }).rot(deg(90), 0, 0).sc(1.2, 1, 0.6).at(0.6, 0.02, 2.15));
  g.add(grp(box(0.03, 0.4, 0.03, P.iron).at(-0.1, 0, 0), box(0.03, 0.4, 0.03, P.iron).at(0.1, 0, 0), box(0.22, 0.025, 0.03, P.iron).at(0, 0.18, 0), box(0.22, 0.025, 0.03, P.iron).at(0, 0.32, 0)).rot(deg(-20), 0, 0).at(0.6, -0.05, 1.92));
  return g;
}

// --- horse and sled
function horse(o = {}) { // nose +X, chunky toy proportions
  const c = o.color ?? C.horse, m = C.wool, g = grp();
  g.add(cap(0.3, 0.56, c, { seg: 16 }).rot(0, 0, deg(90)).at(0.58, 0.86, 0));
  [[0.34, 0.16], [0.34, -0.16], [-0.36, 0.16], [-0.36, -0.16]].forEach(([x, z]) => g.add(cyl(0.095, 0.085, 0.64, c, { seg: 10 }).at(x, 0.1, z), cyl(0.125, 0.135, 0.15, m, { seg: 10 }).at(x, 0, z)));
  g.add(grp(cap(0.18, 0.34, c, { seg: 14 })).rot(0, 0, deg(-34)).at(0.38, 0.9, 0));
  const head = grp(rbox(0.5, 0.27, 0.27, c, { r: 0.11 }).at(0, -0.135, 0), sph(0.13, P.ink2, { seg: 12 }).sc(0.8, 0.9, 1.0).at(0.22, -0.02, 0), sph(0.1, m, { seg: 10 }).at(-0.17, 0.14, 0));
  [-1, 1].forEach((s) => { head.add(cone(0.055, 0.15, c, { seg: 6 }).rot(s * 0.25, 0, 0.2).at(-0.2, 0.08, s * 0.08)); head.add(sph(0.028, P.ink, { seg: 8 }).at(-0.04, 0.04, s * 0.137).noInk()); });
  g.add(head.rot(0, 0, deg(-28)).at(0.92, 1.42, 0));
  for (let i = 0; i < 5; i++) g.add(sph(0.085, m, { seg: 10 }).sc(1, 1.3, 0.55).at(0.36 + i * 0.085, 1.12 + i * 0.11, 0));
  g.add(grp(cap(0.085, 0.36, m, { seg: 10 })).rot(0, 0, deg(165)).at(-0.6, 1.0, 0));
  g.add(rbox(0.62, 0.34, 0.66, o.blanket ?? C.cabin, { r: 0.08 }).at(-0.08, 0.84, 0), box(0.64, 0.05, 0.68, C.mustard).at(-0.08, 0.84, 0));
  g.add(grp(grp(torus(0.2, 0.065, P.woodDk, { ts: 20 }).rot(deg(90), 0, 0)).rot(0, 0, deg(-34))).at(0.5, 1.06, 0), sph(0.05, C.mustard, { seg: 8 }).at(0.58, 1.27, 0.1), sph(0.05, C.mustard, { seg: 8 }).at(0.58, 1.27, -0.1));
  return g;
}
function sled(o = {}) { // front +X
  const g = grp();
  [-1, 1].forEach((s) => {
    g.add(tube([[-0.85, 0.04, s * 0.34], [0.6, 0.04, s * 0.34], [0.86, 0.12, s * 0.34], [0.92, 0.32, s * 0.34], [0.8, 0.42, s * 0.34]], 0.035, P.iron, { segs: 30 }));
    [-0.6, 0, 0.5].forEach((x) => g.add(box(0.05, 0.24, 0.05, P.woodDk).at(x, 0.04, s * 0.34)));
  });
  g.add(box(1.55, 0.06, 0.78, texMat(tex.planks({ base: P.woodLt, line: P.woodDk, n: 5, vertical: true }))).at(-0.1, 0.28, 0));
  if (o.load !== false) { for (let row = 0; row < 2; row++) for (let i = 0; i < 4 - row; i++) g.add(logH(1.2, 0.09).at(-0.15, 0.43 + row * 0.16, (i - (3 - row) / 2) * 0.18)); g.add(torus(0.3, 0.02, P.woodDk, { ts: 20 }).sc(1, 0.9, 1.25).rot(0, deg(90), 0).at(-0.15, 0.48, 0)); }
  g.add(grp(cyl(0.02, 0.02, 0.8, P.woodDk, { seg: 6 }), K.lantern(P.iron, C.window).sc(0.6).at(0.06, 0.6, 0)).at(0.6, 0.3, -0.3));
  if (o.shafts !== false) [-1, 1].forEach((s) => g.add(tube([[0.8, 0.35, s * 0.32], [1.5, 0.6, s * 0.36], [2.45, 0.86, s * 0.36]], 0.025, P.woodDk, { segs: 12 })));
  return g;
}
const horseSled = (o = {}) => grp(sled(o), horse(o).at(2.45, 0, 0));
function kidSled() {
  const g = grp();
  [-1, 1].forEach((s) => g.add(tube([[-0.35, 0.03, s * 0.16], [0.25, 0.03, s * 0.16], [0.4, 0.12, s * 0.16], [0.36, 0.22, s * 0.16]], 0.022, C.cabin, { segs: 16 })));
  g.add(box(0.62, 0.04, 0.38, texMat(tex.planks({ base: P.woodLt, line: P.woodDk, n: 4, vertical: true }))).at(0, 0.16, 0));
  [-0.2, 0.15].forEach((x) => g.add(box(0.04, 0.13, 0.04, P.woodDk).at(x, 0.03, 0.16), box(0.04, 0.13, 0.04, P.woodDk).at(x, 0.03, -0.16)));
  return g;
}

// --- people
/** The kit beard sits mostly inside the head; this adds a visible full beard in front of the jaw. */
const bearded = (o) => { const p = K.person(o), B = { adult: [1, 1], tall: [1.1, 0.95], round: [1, 1], elder: [0.95, 1] }[o.body ?? 'adult'], hr = 0.34 * B[1], hy = 1.06 + hr * 0.92; p.add(sph(hr * 0.62, o.beardColor ?? o.hair, { seg: 16 }).sc(1.1, 0.95, 0.62).at(0, hy - hr * 0.52, hr * 0.62), torus(hr * 0.16, hr * 0.06, o.beardColor ?? o.hair, { arc: Math.PI, ts: 10 }).at(0, hy - hr * 0.25, hr * 0.93)); return p; };
const fig = (o, s = 0.45) => (o.acc && o.acc.includes('beard') ? bearded(o) : K.person(o)).sc(s);
const footprints = (pts, n = 14) => { const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0, z))), g = grp(), m = K.mat('#cfd9e1'); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, p = curve.getPointAt(t), tg = curve.getTangentAt(t), s = i % 2 ? 1 : -1; g.add(sph(0.05, m, { seg: 8 }).sc(1, 0.12, 1.6).rot(0, Math.atan2(tg.x, tg.z), 0).at(p.x - tg.z * 0.07 * s, 0.004, p.z + tg.x * 0.07 * s)); } return g.noInk(); };
const stump = () => grp(cyl(0.13, 0.16, 0.2, C.log, { seg: 10 }), cyl(0.14, 0.14, 0.05, C.snow, { seg: 12 }).at(0, 0.2, 0));
const snowRock = (s, seed) => grp(K.rock(s, C.slate, seed).flat(), K.rock(s * 0.75, C.snow, seed + 1).flat().sc(1.05, 0.5, 1.05).at(0, s * 0.42, 0));
const bundle = () => grp(...[[-0.08, 0], [0.08, 0], [0, 0.13]].map(([z, y]) => logH(0.55, 0.075).at(0, y, z)), torus(0.16, 0.015, C.cabin, { ts: 16 }).rot(0, deg(90), 0).sc(1, 1.1, 1).at(0.12, 0.06, 0));
const breadTray = () => grp(box(0.55, 0.04, 0.32, P.woodDk), ...[[-0.15, 0], [0.04, 0.04], [0.18, -0.05]].map(([x, z]) => sph(0.1, C.bread, { seg: 12 }).sc(1.4, 0.7, 0.9).at(x, 0.08, z)));
const axe = () => grp(cyl(0.025, 0.03, 0.95, P.woodLt, { seg: 8 }), extrude([[0, 0], [0.22, -0.06], [0.24, 0.14], [0, 0.1]], 0.03, P.steel).at(0.01, 0.78, 0)).at(0, -0.2, 0.14);
const plaid = () => texMat(tex.custom(128, 128, (x, w) => { x.fillStyle = C.cabin; x.fillRect(0, 0, w, w); x.fillStyle = 'rgba(42,28,20,.55)'; x.fillRect(0, 40, w, 30); x.fillRect(40, 0, 30, w); x.fillStyle = 'rgba(42,28,20,.35)'; x.fillRect(0, 100, w, 8); x.fillRect(100, 0, 8, w); }, [3, 2]));

// --- the valley village (key art) and its blue-hour twin
function village(o = {}) {
  const g = grp(), n = !!o.night;
  g.add(snowSlab(16, 10.5, { h: 0.55, seed: 3 }).at(0, 0, 0));
  // back hills and peaks
  [[-5.2, -4.4, 3.2, 1.3], [-0.6, -4.7, 3.8, 1.6], [4.6, -4.4, 3.4, 1.2]].forEach(([x, z, r, h]) => g.add(sph(1, C.snow, { part: 'top', seg: 22 }).sc(r, h, 1.4).at(x, 0, z)));
  [[-3.8, -5.1, 2.2, 3.4, 3], [1.4, -5.2, 2.6, 4.2, 5], [6.0, -5.0, 1.9, 2.9, 8]].forEach(([x, z, r, h, sd]) => g.add(peak(r, h, sd).at(x, 0, z)));
  // frozen stream
  g.add(ribbon([[2.0, -4.6], [1.2, -2.6], [1.8, -0.6], [0.6, 1.0], [-0.6, 2.6], [-0.2, 5.25]], (t) => 0.7 + Math.sin(t * 9) * 0.12, iceMat(), { rep: 5 }));
  // three warm circles
  const H = [[-3.5, 0.5, 2.1], [3.7, -0.3, 1.9], [2.3, 3.2, 1.45]];
  H.forEach(([x, z, r], i) => { g.add(warmth(r, { seed: i + 4 }).at(x, 0, z)); g.add(hearth({ li: n ? 7 : 3, ld: r * 2.8, wood: i !== 1 }).sc(0.62).at(x, 0, z)); });
  // sled paths between the circles
  const pm = pathMat();
  g.add(ribbon([[-1.4, 0.5], [0.2, 0.4], [1.5, -0.1], [1.85, -0.25]], 0.42, pm, { rep: 6 }), ribbon([[-2.0, 2.2], [-0.8, 3.4], [0.9, 3.7]], 0.42, pm, { rep: 5 }), ribbon([[3.3, 1.6], [3.0, 2.0]], 0.42, pm, { rep: 1 }), ribbon([[-5.6, 4.0], [-4.6, 2.6]], 0.42, pm, { rep: 2 }));
  g.add(grp(box(0.9, 0.06, 0.55, P.woodLt), box(0.9, 0.12, 0.05, P.woodDk).at(0, 0.06, 0.27), box(0.9, 0.12, 0.05, P.woodDk).at(0, 0.06, -0.27)).rot(0, deg(-8), 0).at(0.95, 0.03, 0.3));
  // buildings in the warmth
  g.add(cabin({ night: n, seed: 2 }).sc(0.6).at(-4.3, 0, -0.55));
  g.add(bakery({ night: n }).sc(0.56).at(-2.6, 0, -0.75));
  g.add(cabin({ night: n, w: 1.6, d: 1.3, seed: 5, door: C.mustard, shutters: P.white }).sc(0.58).rot(0, deg(-15), 0).at(3.2, 0, -1.25));
  g.add(cabin({ night: n, w: 1.4, d: 1.2, h: 1.0, seed: 8, wood: false, chimney: false }).sc(0.55).rot(0, deg(-35), 0).at(4.75, 0, 0.2));
  g.add(sauna({ night: n, pond: false }).sc(0.55).rot(0, deg(-30), 0).at(3.1, 0, 2.55));
  // pines outside the circles
  // skating pond, front right
  g.add(cyl(0.95, 0.95, 0.025, iceMat(), { seg: 40 }).sc(1.25, 1, 0.8).at(5.3, 0, 3.3), torus(0.97, 0.06, C.snow, { ts: 48 }).rot(deg(90), 0, 0).sc(1.25, 0.8, 0.5).at(5.3, 0.01, 3.3));
  g.add(fig({ body: 'kid', hairStyle: 'bob', hair: P.hairBrown, top: C.cabin, bottom: P.navy, hat: 'beanie', hatColor: P.white, pose: 'wave' }).rot(0, deg(-30), 0).at(5.0, 0.02, 3.4), fig({ hairStyle: 'short', hair: P.hairBlack, skin: P.skin3, top: C.mustard, bottom: P.navy, acc: ['scarf'], accColor: C.pine }).rot(0, deg(25), 0).at(5.7, 0.02, 3.15));
  const PT = [[-5.9, 4.6, 1.0], [-4.9, 4.4, 0.8], [-6.5, 3.4, 0.9], [3.9, -3.9, 0.9], [5.5, -3.6, 1.1], [7.0, -3.2, 0.9], [7.3, 4.6, 1.0], [-3.4, -4.1, 0.9],[-7.2, -2.4, 1.3], [-6.8, -1.2, 1.0], [-7.3, 0.6, 1.4], [-6.9, 2.4, 1.1], [-7.2, 4.4, 1.2], [-6.2, 3.6, 0.9], [-5.8, -2.9, 1.2], [-4.7, -3.3, 1.0], [-2.3, -3.1, 1.3], [-1.3, -2.6, 0.9], [0.0, -3.2, 1.1],
    [3.1, -3.4, 1.2], [4.6, -2.9, 1.0], [6.0, -2.6, 1.3], [7.2, -1.2, 1.2], [6.9, 1.4, 1.0], [7.3, 3.0, 1.3], [6.4, 4.4, 1.1], [4.8, 4.6, 0.9], [-3.4, 4.6, 1.1], [-2.6, 4.2, 0.8], [-0.4, -1.5, 0.9], [0.4, -1.9, 0.75]];
  PT.forEach(([x, z, h], i) => g.add(pine(h, i + 1).at(x, 0, z)));
  // fences, lamp posts, snowman, goats, sleds and people
  g.add(K.fence(1.6, P.woodLt, { h: 0.32, gap: 0.24 }).rot(0, deg(20), 0).at(4.6, 0, 1.55), K.fence(1.8, P.woodLt, { h: 0.32, gap: 0.24 }).at(-3.4, 0, 2.75));
  [[-1.1, 0.95], [0.6, 0.1], [-1.0, 3.25], [3.55, 1.85]].forEach(([x, z]) => g.add(K.lamppost(1.3, P.iron, C.window).sc(0.55).at(x, 0, z)));
  g.add(snowman().sc(0.6).at(-1.3, 0, 1.75), goat(P.white).sc(0.8).rot(0, deg(30), 0).at(4.1, 0, 0.95), goat('#6b4a36').sc(0.65).rot(0, deg(-40), 0).at(4.75, 0, 1.15));
  g.add(horseSled().sc(0.42).rot(0, deg(12), 0).at(-0.3, 0, 0.55));
  g.add(fig({ hairStyle: 'short', hair: P.hairAuburn, skin: P.skin2, top: '#4f6a8a', bottom: P.navy, hat: 'beanie', hatColor: C.amber, acc: ['scarf'], accColor: C.cabin, pose: 'carry', held: bundle() }).rot(0, deg(-20), 0).at(-2.3, 0, 1.1));
  g.add(fig({ body: 'round', hairStyle: 'bun', hair: P.hairBlonde, top: C.mustard, bottom: P.navy, apron: P.white, hat: 'chef', pose: 'wave' }).at(-1.95, 0, -0.1));
  g.add(fig({ body: 'tall', hairStyle: 'short', hair: P.hairBrown, top: plaid(), bottom: '#4b5468', hat: 'beanie', hatColor: C.pine, acc: ['beard'], held: axe() }).rot(0, deg(20), 0).at(-5.3, 0, -2.1));
  g.add(grp(fig({ body: 'kid', hairStyle: 'pigtails', hair: P.hairBlonde, top: C.iceDk, bottom: P.navy, hat: 'beanie', hatColor: C.cabin, acc: ['scarf'], accColor: C.amber }), kidSled().sc(0.45).at(0.32, 0, -0.3)).rot(0, deg(-30), 0).at(-5.4, 0, 2.3));
  [[-7.3, 1.5, 0.5], [7.2, -1.9, 0.5]].forEach(([x, z, r]) => g.add(drift(r, r * 0.4).rot(0, x * 0.4, 0).at(x, 0, z)));
  [[-6.0, 3.0, 0.3, 2], [5.4, 2.4, 0.35, 5], [-0.9, -1.9, 0.28, 8], [6.8, 0.8, 0.25, 11]].forEach(([x, z, sz, sd]) => g.add(snowRock(sz, sd).at(x, -0.05, z)));
  [[-5.9, -1.9], [-6.3, -2.6], [-5.0, -2.8]].forEach(([x, z]) => g.add(stump().at(x, 0, z)));
  g.add(footprints([[-4.6, -1.4], [-5.0, -1.8], [-5.25, -2.0]], 6), footprints([[-1.4, -1.0], [-1.5, -1.5], [-1.6, -1.9]], 6), footprints([[0.8, 2.0], [1.1, 1.0], [1.6, 0.2], [2.0, -0.2]], 14));
  g.add(K.bird({ color: C.cabin, wing: P.woodDk, beak: P.ink2 }).sc(0.5).rot(0, deg(20), 0).at(-3.2, 0.32, 2.75));
  if (!n) g.add(new THREE.HemisphereLight('#ffb070', '#ffb070', -0.4));
  if (n) [[-0.6, 1.4], [3.0, 1.2]].forEach(([x, z]) => { const L = new THREE.PointLight('#ffcf7a', 1.5, 1.6, 1.5); L.position.set(x, 0.8, z); g.add(L); });
  return g;
}

// --- storm night on the ridge
function storm() {
  const g = grp(), r = rng(21);
  g.add(snowSlab(9, 5.6, { h: 0.5, seed: 8 }));
  g.add(sph(1, C.snow, { part: 'top', seg: 22 }).sc(3.4, 1.5, 1.6).at(1.8, 0, -2.4), sph(1, C.snow, { part: 'top', seg: 18 }).sc(2.2, 0.9, 1.3).at(-2.8, 0, -2.3));
  [[0.6, 1.25, -2.5, 0.45], [3.0, 0.9, -2.1, 0.38], [-2.2, 0.55, -2.0, 0.3], [3.9, 0.2, 1.8, 0.35]].forEach(([x, y, z, s], i) => g.add(K.rock(s, C.slate, i + 2).flat().at(x, y, z)));
  // the one hearth holding out, its circle shrunk and drifts creeping over the edge
  g.add(warmth(1.15, { seed: 9, tufts: 5 }).at(-0.4, 0, 0.6), hearth({ li: 9, ld: 4.5 }).sc(0.7).at(-0.4, 0, 0.6));
  [[0.5, 1.35, 0.4], [-1.45, 1.0, 0.45], [-0.7, -0.4, 0.38], [0.6, 0.0, 0.32]].forEach(([x, z, s]) => g.add(drift(s, s * 0.55).at(x, 0, z)));
  // a hearth that went out in the night, already snowed over
  g.add(hearth({ out: true, wood: false }).sc(0.6).at(-3.0, 0, 0.9), drift(0.5, 0.35).at(-2.6, 0, 1.25));
  g.add(K.fence(1.6, P.woodLt, { h: 0.34, gap: 0.24 }).rot(0, deg(10), 0).at(-1.0, 0, 2.2), drift(0.7, 0.3).at(-0.8, 0, 2.3));
  // half-buried cabin with one lit window
  g.add(cabin({ night: true, w: 1.6, d: 1.3, seed: 4, wood: false, smoke: false }).sc(0.62).rot(0, deg(-20), 0).at(2.6, 0, 0.2));
  [[1.9, 0.85, 0.8, 0.5], [3.1, 0.75, 0.7, 0.45], [2.4, -0.3, 0.9, 0.55]].forEach(([x, z, s, h]) => g.add(drift(s, h).at(x, 0, z)));
  // bent pines on the ridge
  [[-3.6, -1.3, 1.5], [-2.3, -0.9, 1.1], [-4.0, 0.4, 1.3], [3.9, -1.1, 1.4], [1.0, -1.6, 1.2], [-1.6, -1.8, 1.3], [4.0, 2.2, 1.0]].forEach(([x, z, h], i) => g.add(pine(h, i + 30, { lean: -0.16, leaf: C.pineDk }).at(x, 0, z)));
  // the keeper bringing firewood, lantern lit; a sled stuck in the snow
  g.add(fig({ hairStyle: 'short', hair: P.hairAuburn, skin: P.skin2, top: '#4f6a8a', bottom: P.navy, hat: 'beanie', hatColor: C.amber, acc: ['scarf', 'lantern'], accColor: C.cabin, pose: 'carry', held: bundle() }, 0.5).rot(0, deg(-35), 0).at(1.0, 0, 1.6));
  g.add(sled({ shafts: false }).sc(0.45).rot(0, deg(30), deg(-6)).at(2.9, 0.02, 1.8), drift(0.5, 0.25).at(3.0, 0, 2.05));
  // the storm itself: flakes blowing sideways
  const flake = K.glow('#eef4fb');
  for (let i = 0; i < 320; i++) g.add(sph(0.018 + r() * 0.018, flake, { seg: 6 }).sc(1, 1, 1.7).rot(deg(70), 0, deg(-25)).at(-4.4 + r() * 8.8, 0.25 + r() * 3.0, -2.6 + r() * 5.2).noInk());
  return g;
}

export default {
  slug: 'snowline',
  title: 'Snowline',
  logline: 'Keep a mountain village warm through one long winter. Every hearth you light pushes the snow back a little.',
  genre: ['Cosy builder', 'Survival-lite', 'Small city builder'],
  theme: { accent: C.amber, cardBg: '#eef0ec', plinth: '#dfe6ea', plinthRim: '#b9c6cf' },
  pitch: 'A small builder you can finish in a weekend. Light a hearth and it melts a warm circle in the snow. Inside the circle you build cabins, a bakery, a sauna and sled paths. Storm nights shrink the circles, so keep the fires fed. Make it to spring and the whole valley thaws into colour.',
  loop: ['Gather firewood and stone', 'Light a hearth, watch the snow melt back', 'Build inside the warm circle', 'Storm night: keep every fire fed', 'Reach spring and the valley thaws'],
  why: ['Snow takes ink outlines and cool shadows beautifully, and lit windows glow against it.', 'The warmth circle reads in a single screenshot: green inside, white outside.', 'Chunky cabins, pines and stone hearths are simple shapes that suit low-poly.'],
  fromYou: 'Frostpunk\'s heat radius is a favourite, and Banished showed how calm a small village can be. This is the "safe place pushing back the dark", in a builder small enough to finish.',
  similar: [
    { name: 'Frostpunk', url: 'https://store.steampowered.com/app/323190', note: 'the heat radius, without the grim choices' },
    { name: 'Banished', url: 'https://store.steampowered.com/app/242920', note: 'small village, seasons, firewood' },
    { name: 'ISLANDERS', url: 'https://store.steampowered.com/app/1046030', note: 'a tiny builder you can finish in an evening' },
    { name: 'Tiny Glade', url: 'https://store.steampowered.com/app/2198150', note: 'cosy building, no way to fail' },
  ],
  palette: [['Snow', C.snow], ['Pine', C.pine], ['Cabin red', C.cabin], ['Hearth amber', C.amber], ['Ice blue', C.ice], ['Slate', C.slate]],
  key: { build: () => village(), bg: [[0, '#cfe3ee'], [1, '#f1efe9']], sun: [-1, 0.75, 0.2], cam: { yaw: -22, pitch: 34, fov: 24, target: [0.3, 0.4, 0.5], zoom: 1.42 }, caption: 'Three hearths lit, first week of winter' },
  characters: [
    { name: 'Edda', role: 'You. The village keeper. Knows how much wood every fire needs.', build: () => K.person({ hairStyle: 'short', hair: P.hairAuburn, skin: P.skin2, top: '#4f6a8a', bottom: P.navy, hat: 'beanie', hatColor: C.amber, acc: ['scarf'], accColor: C.cabin, pose: 'carry', held: bundle() }) },
    { name: 'Rolf', role: 'The baker. First chimney lit every morning, warm buns by six.', build: () => K.person({ body: 'round', hairStyle: 'short', hair: P.hairBlonde, skin: P.skin1, top: C.mustard, bottom: P.navy, apron: P.white, hat: 'chef', acc: ['moustache'], pose: 'hold', held: breadTray() }) },
    { name: 'Arvid', role: 'Woodcutter. Brings in the logs, talks mostly to the goats.', build: () => bearded({ body: 'tall', hairStyle: 'short', hair: P.hairBrown, skin: P.skin3, acc: ['beard'], beardColor: '#5a3a24', top: plaid(), bottom: '#4b5468', hat: 'beanie', hatColor: C.pine, pose: 'stand', held: axe() }) },
    { name: 'Nils', role: 'Seven. Has found the best sledging slope in the valley.', build: () => grp(K.person({ body: 'kid', hairStyle: 'short', hair: P.hairBlonde, skin: P.skin1, top: C.iceDk, bottom: P.navy, hat: 'beanie', hatColor: C.cabin, acc: ['scarf'], accColor: C.amber, pose: 'stand' }), kidSled().rot(0, deg(-60), 0).at(0.36, 0, -0.12), tube([[0.27, 0.32, 0.02], [0.33, 0.12, 0.05], [0.42, 0.11, 0.12]], 0.008, P.ink2, { segs: 12 }).noInk()) },
  ],
  builds: [
    { name: 'The great hearth', tag: 'Structure', note: 'Stone tower, iron fire bowl. Its glow is the build zone.', build: () => grp(snowPlate(2.0), warmth(1.5, { seed: 3 }), hearth({ li: 4, ld: 4 })), cam: { yaw: -26, pitch: 30 } },
    { name: 'Red cabin', tag: 'Building', note: 'Snow on the roof, icicles, a woodpile by the door.', build: () => grp(snowPlate(1.75), warmth(1.5, { seed: 6, tufts: 6 }), cabin({ seed: 2 }).sc(0.85).at(-0.1, 0, -0.2)), cam: { yaw: -26, pitch: 22 } },
    { name: 'Sauna by the ice hole', tag: 'Building', note: 'Steam out of the pipe, ladder down into the pond.', build: () => grp(snowPlate(2.1), sauna().at(-0.3, 0, -0.9)), cam: { yaw: -30, pitch: 28 } },
    { name: 'Horse sled', tag: 'Vehicle', note: 'Brings firewood in from the pines. Lantern for the dark runs.', build: () => grp(snowPlate(2.3).sc(1.05, 1, 0.7), ribbon([[-2.3, 0], [2.3, 0]], 0.9, pathMat(), { rep: 4, n: 4 }), horseSled().rot(0, deg(-10), 0).at(-1.05, 0, 0)), cam: { yaw: -22, pitch: 20 } },
  ],
  environments: [
    { name: 'The village at blue hour', note: 'Windows lit, fires glowing, warm circles set into the snow.', build: () => village({ night: true }), stage: { bg: [[0, '#2f3f63'], [0.6, '#56628a'], [1, '#9c8fae']], light: 'night' }, cam: { yaw: -30, pitch: 30, target: [-1.0, 0.4, 0.6], zoom: 1.7 } },
    { name: 'Storm night on the ridge', note: 'Snow piling in, one hearth holding out. Keep it fed till morning.', build: () => storm(), stage: { bg: [[0, '#1f2a3d'], [1, '#4a5873']], light: 'night', sun: [0.6, 1, 0.5] }, cam: { yaw: -24, pitch: 22, target: [0.4, 0.8, 0.4], zoom: 1.35 } },
  ],
};
