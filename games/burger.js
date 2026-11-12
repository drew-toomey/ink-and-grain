// Burger Joint — board 10. Every build() returns a fresh Object3D. Front of things faces +Z.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng } = K;

// --- local palette
const C = {
  ketchup: '#d8402c', ketchupDk: '#a9311f', mustard: '#f1b42f', lettuce: '#6cb24a', lettuceLt: '#93cc5e', lettuceDk: '#4f9439',
  bun: '#e3a65c', bunDk: '#c98a45', crumb: '#f7ddab', seed: '#fbf1d6',
  patty: '#7a4326', pattyDk: '#55291a', pattyLt: '#a0603a', raw: '#d4847a', rawDk: '#b8625b', rawLt: '#e8a79d',
  cheese: '#f6b62b', tomato: '#e4432f', tomatoLt: '#f28a6c', pickle: '#93a83c', pickleLt: '#c2cf73', onion: '#f3e7f0', onionDk: '#c9a3c8',
  teal: '#2f8a7a', tealDk: '#22685c', tealLt: '#5aa898', sand: '#ecd3a0', sandDk: '#d2b07a', wet: '#d8bb86',
  sea: '#4aa3b5', seaDk: '#2f7d93', foam: '#f6f7f2',
  cream: '#f6ecd6', paper: '#fbf6ea', kraft: '#e6cf9f', steel: '#aeb7bf', steelLt: '#c9d0d6', steelDk: '#6e7880', grill: '#3a3f45',
  chalk: '#2f3b36', fry: '#f5c84c', fryDk: '#e0a93a', wood: '#c2824a', woodLt: '#ddab72', woodDk: '#8c5732', navy: '#2f3f63', wetsuit: '#26384f',
};

// --- helpers
const DS = THREE.DoubleSide;
const mesh = (geo, m) => { const o = new THREE.Mesh(geo, m && (m.isMaterial || Array.isArray(m)) ? m : K.mat(m)); o.castShadow = o.receiveShadow = true; return o; };
const memo = (f) => { let v; return () => (v ??= f()); };
/** Radial wobble so round food looks hand-formed (periodic in angle, so no seam). */
function wobble(geo, amp, seed = 1, f = [5, 9, 3]) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x);
    const k = 1 + amp * (0.55 * Math.sin(a * f[0] + seed) + 0.3 * Math.sin(a * f[1] + seed * 2.1) + 0.35 * Math.sin(a * f[2] + seed * 0.7));
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  geo.computeVertexNormals();
  return geo;
}
const pattyTex = memo(() => tex.speckle({ base: C.patty, dots: [C.pattyDk, C.pattyLt, C.pattyDk], n: 420, size: 3.2, seed: 9, rep: [3, 1] }));
const rawTex = memo(() => tex.speckle({ base: C.raw, dots: [C.rawDk, C.rawLt, P.white], n: 420, size: 3, seed: 4, rep: [3, 1] }));
const checkTex = memo(() => tex.checker({ a: P.white, b: C.ketchup, n: 8 }));
const sandTex = (rep) => tex.speckle({ base: C.sand, dots: ['#e0c38c', '#f4e1b8', '#d9b880'], n: 260, size: 2.6, seed: 12, rep });
/** Diorama slab like K.ground, but the soil block stops just under the top so the two never z-fight. */
function slab(w, d, o = {}) {
  const h = o.h ?? 0.35;
  return grp(box(w - 0.004, h - 0.03, d - 0.004, o.side ?? P.soil).at(0, -h, 0), box(w, 0.06, d, o.map ? texMat(o.map) : (o.top ?? P.leaf)).at(0, -0.06, 0)).weld();
}
const planks = (base, line, n, rep = [1, 1]) => texMat(tex.planks({ base, line, n: Math.max(2, Math.round(n)), vertical: true, rep }));

// ---------------------------------------------------------------- the food (R = 0.5 → a burger 1.0 across)
const bunBottom = (R = 0.5) => grp(
  lathe([[0.001, 0], [R * 0.86, 0], [R * 0.96, 0.02], [R, 0.065], [R * 0.99, 0.1], [0.001, 0.1]], C.bun, { seg: 44 }),
  cyl(R * 0.975, R * 0.985, 0.04, C.crumb, { seg: 44 }).at(0, 0.095, 0),
);
function patty(R = 0.5, seed = 1, raw = false) {
  const m = lathe([[0.001, 0], [R * 0.93, 0], [R * 1.01, 0.03], [R * 1.03, 0.075], [R * 1.0, 0.12], [R * 0.9, 0.145], [0.001, 0.15]], texMat(raw ? rawTex() : pattyTex(), { side: DS }), { seg: 48 });
  wobble(m.geometry, 0.045, seed);
  return m;
}
/** Square cheese slice: flat on the patty, corners melt down over the edge. */
function cheese(R = 0.5, rotY = 0, drips = 2) {
  const s = R * 1.96, t = 0.028;
  const geo = new THREE.BoxGeometry(s, t, s, 18, 1, 18).translate(0, t / 2, 0).rotateY(Math.PI / 4 + rotY);
  const p = geo.attributes.position, r0 = R * 1.06;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
    if (d > r0) { const k = d - r0, nd = r0 + k * 0.42 + 0.02, drop = Math.min(0.13, k * 1.5); p.setX(i, (x / d) * nd); p.setZ(i, (z / d) * nd); p.setY(i, p.getY(i) - drop); }
  }
  geo.computeVertexNormals();
  const g = grp(mesh(geo, C.cheese));
  for (let i = 0; i < drips; i++) {
    const a = -(Math.PI / 4 + rotY) + Math.PI / 4 + i * Math.PI, rr = R * 1.06 + 0.02 + R * 0.326 * 0.42 - 0.005;
    g.add(cap(0.024, 0.04 + i * 0.03, C.cheese, { seg: 10 }).at(Math.cos(a) * rr, -0.2 - i * 0.03, Math.sin(a) * rr));
  }
  return g;
}
function lettuce(R = 0.5, seed = 1, c = C.lettuce) {
  const geo = new THREE.CylinderGeometry(R * 1.17, R * 1.08, 0.03, 120, 1).translate(0, 0.015, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), d = Math.hypot(x, z);
    if (d < 1e-4) continue;
    const a = Math.atan2(z, x), t = Math.min(1, d / (R * 1.1));
    const k = 1 + 0.07 * Math.sin(a * 7 + seed) + 0.05 * Math.sin(a * 13 + seed * 1.7);
    const w = (0.05 * Math.sin(a * 14 + seed * 1.3) + 0.025 * Math.sin(a * 5 + seed)) * t * t * t;
    p.setX(i, x * k); p.setZ(i, z * k); p.setY(i, p.getY(i) + w);
  }
  geo.computeVertexNormals();
  return mesh(geo, c);
}
function tomatoes(R = 0.5, seed = 2) {
  const g = grp();
  for (let i = 0; i < 3; i++) {
    const a = i * 2.09 + seed, rr = R * 0.6;
    g.add(grp(cyl(R * 0.52, R * 0.52, 0.055, C.tomato, { seg: 28 }), cyl(R * 0.38, R * 0.38, 0.006, C.tomatoLt, { seg: 24 }).at(0, 0.052, 0).noInk()).at(Math.cos(a) * rr, (i % 2) * 0.006, Math.sin(a) * rr));
  }
  return g;
}
function pickles(R = 0.5, seed = 3) {
  const g = grp();
  [0.4, 2.0, 3.5, 5.0].forEach((a, i) => g.add(grp(cyl(R * 0.2, R * 0.2, 0.026, C.pickle, { seg: 16 }), cyl(R * 0.13, R * 0.13, 0.004, C.pickleLt, { seg: 14 }).at(0, 0.026, 0).noInk()).rot(0.12 * (i % 2 ? 1 : -1), 0, 0.1).at(Math.cos(a + seed) * R * 0.84, 0.004, Math.sin(a + seed) * R * 0.84)));
  return g;
}
function onions(R = 0.5, seed = 4) {
  const g = grp();
  [1.1, 3.9].forEach((a) => g.add(torus(R * 0.2, R * 0.045, C.onion, { ts: 20, rs: 8 }).rot(deg(90), 0, 0).at(Math.cos(a + seed) * R * 0.8, R * 0.045, Math.sin(a + seed) * R * 0.8)));
  return g;
}
function sauce(R = 0.5, c = C.ketchup, seed = 4, drips = [0.5, 2.6, 4.4]) {
  const geo = wobble(new THREE.CylinderGeometry(R * 1.0, R * 1.02, 0.022, 48, 1).translate(0, 0.011, 0), 0.05, seed, [4, 7, 3]);
  const g = grp(mesh(geo, c));
  drips.forEach((a, i) => {
    const len = 0.05 + (i % 2) * 0.07, rr = R * 1.1, x = Math.cos(a + seed) * rr, z = Math.sin(a + seed) * rr;
    g.add(cap(0.026, len + 0.02, c, { seg: 10 }).at(x * 0.985, 0.02 - len - 0.072, z * 0.985), sph(0.033, c, { seg: 12 }).sc(1, 1.2, 1).at(x, -len - 0.02, z));
  });
  return g;
}
function bunTop(R = 0.5, seed = 5, seeds = 34) {
  const H = R * 0.7, g = grp(cyl(R * 0.99, R * 0.96, 0.035, C.crumb, { seg: 44 }), sph(R, C.bun, { part: 'top', seg: 44 }).sc(1, 0.7, 1).at(0, 0.03, 0));
  const r = rng(seed), up = new THREE.Vector3(0, 1, 0), n = new THREE.Vector3(), ga = Math.PI * (3 - Math.sqrt(5)), c68 = 1 - Math.cos(deg(66));
  for (let i = 0; i < seeds; i++) {
    const f = (i + 0.5) / seeds, phi = Math.acos(1 - f * c68), th = i * ga + r() * 0.5;
    const x = R * Math.sin(phi) * Math.cos(th), y = H * Math.cos(phi), z = R * Math.sin(phi) * Math.sin(th);
    n.set(x / (R * R), y / (H * H), z / (R * R)).normalize();
    const s = sph(R * 0.046, C.seed, { seg: 8 }).sc(1, 0.42, 0.6).noInk();
    s.position.set(x + n.x * 0.004, 0.03 + y + n.y * 0.004, z + n.z * 0.004);
    s.quaternion.setFromUnitVectors(up, n); s.rotateOnAxis(up, r() * Math.PI); s.castShadow = false;
    g.add(s);
  }
  return g;
}
const flagPick = (h = 0.55) => grp(
  cyl(0.012, 0.012, h, C.woodLt, { seg: 6 }), sph(0.02, C.woodLt, { seg: 8 }).at(0, h, 0),
  box(0.22, 0.14, 0.012, texMat(checkTex())).at(0.118, h - 0.17, 0),
  sph(0.05, C.pickle, { seg: 12 }).sc(0.85, 1.5, 0.85).at(0, h * 0.6, 0),
);
const CLASSIC = ['bunB', 'lettuce', 'patty', 'cheese', 'tomato', 'sauce', 'bunT'];
const DELUXE = ['bunB', 'lettuce', 'tomato', 'patty', 'cheese', 'patty', 'cheese2', 'pickles', 'onion', 'sauce', 'bunT', 'pick'];
/** Stack a burger from a list of layers, bottom first. Returns the group; userData.top = height of the stack. */
function burger(o = {}) {
  const R = 0.5, g = grp(), r = rng(o.seed ?? 3);
  let y = 0;
  for (const L of o.layers ?? CLASSIC) {
    const dx = (r() - 0.5) * 0.035, dz = (r() - 0.5) * 0.035, s = r() * 10;
    const put = (obj, h) => { g.add(obj.at(dx, y, dz)); y += h; };
    if (L === 'bunB') put(bunBottom(R), 0.135);
    else if (L === 'lettuce') put(lettuce(R, s), 0.034);
    else if (L === 'tomato') put(tomatoes(R, s), 0.058);
    else if (L === 'patty') put(patty(R, s), 0.148);
    else if (L === 'raw') put(patty(R, s, true), 0.148);
    else if (L === 'cheese') put(cheese(R, 0, o.drips ?? 2), 0.024);
    else if (L === 'cheese2') put(cheese(R, Math.PI / 4, 1), 0.024);
    else if (L === 'pickles') put(pickles(R, s), 0.024);
    else if (L === 'onion') put(onions(R, s), 0.03);
    else if (L === 'sauce') put(sauce(R, C.ketchup, s), 0.02);
    else if (L === 'mustard') put(sauce(R, C.mustard, s, [1.2, 3.8]), 0.02);
    else if (L === 'bunT') put(bunTop(R, s, o.seeds ?? 34), 0.375);
    else if (L === 'pick') g.add(flagPick(0.6).rot(0.06, 0, -0.1).at(dx - 0.04, y - 0.22, dz + 0.05));
  }
  g.userData.top = y;
  return o.scale ? g.sc(o.scale) : g;
}

// ---------------------------------------------------------------- small props
function fries(s = 1, c = C.ketchup, seed = 11) {
  const g = grp(cyl(0.2, 0.15, 0.32, c, { seg: 4, open: true, side: DS }).rot(0, deg(45), 0), box(0.2, 0.02, 0.2, C.fryDk).at(0, 0.27, 0));
  g.add(cyl(0.05, 0.05, 0.005, P.white, { seg: 14 }).rot(deg(90), 0, 0).at(0, 0.16, 0.122).noInk());
  const r = rng(seed);
  for (let i = 0; i < 12; i++) {
    const x = (r() - 0.5) * 0.18, z = (r() - 0.5) * 0.15;
    g.add(box(0.045, 0.28 + r() * 0.14, 0.045, i % 4 ? C.fry : C.fryDk).rot((r() - 0.5) * 0.45, r(), (r() - 0.5) * 0.45).at(x, 0.12, z));
  }
  return g.sc(s);
}
/** A carton knocked over on its side, chips spilling out towards +Z. */
const spilled = (s = 1) => grp(fries(0.75, C.ketchup, 13).rot(deg(-75), 0, 0).at(0, 0.11, -0.12), ...[[0.05, 0.3, 0.3], [-0.14, 0.36, 1.4], [0.2, 0.42, 2.3]].map(([x, z, a]) => box(0.085, 0.07, 0.3, C.fry).rot(0, a, 0).at(x, 0, z))).sc(s);
const chip = (x, z, a = 0, s = 1) => box(0.045 * s, 0.045 * s, 0.3 * s, C.fry).rot(0, a, 0).at(x, 0, z);
const cup = (c = C.ketchup, s = 1) => grp(
  cyl(0.12, 0.09, 0.34, P.white, { seg: 18 }), cyl(0.111, 0.101, 0.1, c, { seg: 18 }).at(0, 0.12, 0),
  cyl(0.13, 0.13, 0.03, P.white, { seg: 18 }).at(0, 0.34, 0), cyl(0.015, 0.015, 0.3, c, { seg: 6 }).rot(0, 0, -0.18).at(0.03, 0.33, 0),
).sc(s);
const bottle = (c = C.ketchup, h = 0.42) => grp(
  cyl(0.085, 0.085, h * 0.72, c, { seg: 18 }), cyl(0.087, 0.087, h * 0.2, C.cream, { seg: 18 }).at(0, h * 0.22, 0),
  cyl(0.04, 0.085, h * 0.1, c, { seg: 18 }).at(0, h * 0.72, 0), cyl(0.045, 0.045, h * 0.06, P.white, { seg: 14 }).at(0, h * 0.8, 0),
  cone(0.035, h * 0.18, c, { seg: 12 }).at(0, h * 0.85, 0),
);
const bell = () => grp(cyl(0.11, 0.12, 0.03, C.woodDk, { seg: 18 }), sph(0.09, C.mustard, { part: 'top', seg: 18 }).at(0, 0.03, 0), cyl(0.012, 0.012, 0.05, C.steelDk, { seg: 6 }).at(0, 0.11, 0), sph(0.025, C.steelDk, { seg: 8 }).at(0, 0.16, 0));
const spatula = () => grp(cyl(0.025, 0.025, 0.32, C.woodDk, { seg: 8 }).at(0, -0.32, 0), cyl(0.012, 0.012, 0.16, C.steelDk, { seg: 6 }).at(0, -0.46, 0), box(0.2, 0.26, 0.02, C.steel).at(0, -0.72, 0));
const steam = (s = 1) => grp(sph(0.09, C.foam, { seg: 14 }), sph(0.07, C.foam, { seg: 14 }).at(0.07, 0.1, 0.02), sph(0.06, C.foam, { seg: 14 }).at(-0.03, 0.2, 0), sph(0.045, C.foam, { seg: 12 }).at(0.04, 0.29, 0)).noShadow().noInk().sc(s);
function tipsJar() {
  const g = grp(cyl(0.17, 0.16, 0.34, K.mat(P.glass, { opacity: 0.4, side: DS }), { seg: 22, open: true }), torus(0.17, 0.015, P.glassDk).rot(deg(90), 0, 0).at(0, 0.34, 0));
  g.add(cyl(0.15, 0.145, 0.2, C.mustard, { seg: 18 }).at(0, 0.01, 0), sph(0.15, C.mustard, { part: 'top', seg: 18 }).sc(1, 0.5, 1).at(0, 0.2, 0));
  [[0.05, 0.25, 0.04, 0.4], [-0.06, 0.24, -0.03, -0.3], [0.0, 0.28, 0.0, 0.1], [0.22, 0.0, 0.1, 0]].forEach(([x, y, z, r]) => g.add(cyl(0.045, 0.045, 0.014, C.mustard, { seg: 12 }).rot(r, 0, r).at(x, y, z)));
  g.add(K.sign('TIPS', { w: 0.3, h: 0.13, bg: C.cream, fg: C.ketchup, frame: C.ketchup }).rot(deg(-8), 0, 0).at(0, 0.08, 0.19));
  return g;
}
const napkins = () => grp(rbox(0.26, 0.2, 0.14, C.steel, { r: 0.03 }), box(0.18, 0.06, 0.08, P.white).at(0, 0.18, 0));
function wrapped(s = 1, seed = 8) {
  const g = grp(burger({ layers: ['bunB', 'lettuce', 'patty', 'cheese', 'sauce', 'bunT'], seed, drips: 0, seeds: 26 }));
  g.add(cyl(0.58, 0.55, 0.44, texMat(tex.checker({ a: P.white, b: C.ketchup, n: 8, rep: [3, 1] }), { side: DS }), { seg: 36, open: true }));
  g.add(cyl(0.09, 0.09, 0.01, C.mustard, { seg: 16 }).rot(deg(90), 0, 0).at(0, 0.2, 0.575).noInk());
  return g.sc(s);
}
/** Paper ticket with a picture of the order (stack icons, ticks for done layers). */
function ticketTex(no = 12, layers = ['bunT', 'sauce', 'cheese', 'patty', 'lettuce', 'bunB'], done = 2) {
  return tex.custom(160, 240, (x, w, h) => {
    x.fillStyle = '#fbf7ee'; x.fillRect(0, 0, w, h);
    x.fillStyle = C.ketchup; x.fillRect(0, 0, w, 36);
    x.fillStyle = '#fbf7ee'; x.font = '800 26px "Bricolage Grotesque", system-ui, sans-serif'; x.textBaseline = 'middle'; x.fillText('#' + no, 12, 19);
    const col = { bunT: C.bun, bunB: C.bun, patty: C.patty, cheese: C.cheese, lettuce: C.lettuce, tomato: C.tomato, sauce: C.ketchup, pickles: C.pickle, onion: C.onionDk };
    let y = 50;
    layers.forEach((L, i) => {
      const hh = L === 'bunT' ? 30 : L === 'patty' ? 20 : 11;
      x.fillStyle = col[L]; x.strokeStyle = '#2a1c14'; x.lineWidth = 3;
      x.beginPath(); if (L === 'bunT') { x.moveTo(22, y + hh); x.quadraticCurveTo(22, y, 66, y); x.quadraticCurveTo(110, y, 110, y + hh); x.closePath(); } else x.roundRect(22, y, 88, hh, 5);
      x.fill(); x.stroke();
      if (i >= layers.length - done) { x.strokeStyle = C.teal; x.lineWidth = 5; x.beginPath(); x.moveTo(120, y + hh / 2); x.lineTo(128, y + hh / 2 + 7); x.lineTo(144, y + hh / 2 - 9); x.stroke(); }
      y += hh + 7;
    });
    x.strokeStyle = '#c9b89a'; x.setLineDash([6, 6]); x.lineWidth = 2; x.beginPath(); x.moveTo(0, h - 12); x.lineTo(w, h - 12); x.stroke();
  });
}
function ticket(no, layers, done, s = 1) {
  return grp(box(0.2, 0.3, 0.008, texMat(ticketTex(no, layers, done))).at(0, -0.3, 0), box(0.06, 0.05, 0.03, C.steelDk).at(0, -0.04, 0)).sc(s);
}
/** Ticket rail: a steel bar with tickets clipped on. Centred, hangs below y=0. */
function ticketRail(len = 1.6, n = 4, s = 1) {
  const g = grp(cyl(0.022, 0.022, len, C.steel, { seg: 10 }).rot(0, 0, deg(90)).at(len / 2, 0, 0));
  const orders = [[['bunT', 'sauce', 'cheese', 'patty', 'lettuce', 'bunB'], 3], [['bunT', 'pickles', 'cheese', 'patty', 'cheese', 'patty', 'bunB'], 0], [['bunT', 'tomato', 'lettuce', 'patty', 'bunB'], 0], [['bunT', 'onion', 'patty', 'bunB'], 0], [['bunT', 'cheese', 'patty', 'bunB'], 0]];
  for (let i = 0; i < n; i++) g.add(ticket(12 + i, ...orders[i % orders.length], s).rot(0, 0, (i % 2 ? 1 : -1) * 0.05).at(-len / 2 + 0.16 + i * ((len - 0.32) / Math.max(1, n - 1)), 0.02, 0.02));
  return g;
}
function chalkboard(w, h) {
  const t = tex.custom(512, Math.round((512 * h) / w), (x, W, H) => {
    x.fillStyle = C.chalk; x.fillRect(0, 0, W, H);
    x.fillStyle = '#f4efe2'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.font = '800 70px "Bricolage Grotesque", system-ui, sans-serif'; x.fillText('MENU', W / 2, H * 0.14);
    const items = [['Classic', '6', C.cheese], ['Deluxe', '9', C.ketchup], ['Chips', '3', C.fry], ['Shake', '4', '#ec8fab']];
    items.forEach(([n, p, c], i) => {
      const y = H * (0.34 + i * 0.18);
      x.fillStyle = c; x.beginPath(); x.arc(64, y, 20, 0, 7); x.fill();
      x.fillStyle = '#f4efe2'; x.textAlign = 'left'; x.font = '700 50px "Bricolage Grotesque", system-ui, sans-serif'; x.fillText(n, 104, y + 2);
      x.textAlign = 'right'; x.fillText(p, W - 40, y + 2);
    });
  });
  const side = K.mat(C.woodDk), face = texMat(t);
  return grp(mesh(new THREE.BoxGeometry(w, h, 0.05).translate(0, h / 2, 0), [side, side, side, side, face, side]), box(w + 0.1, 0.06, 0.08, C.woodDk).at(0, h, 0), box(w + 0.1, 0.06, 0.08, C.woodDk).at(0, -0.06, 0));
}
function aFrame() {
  const g = grp();
  const b = chalkboard(0.7, 0.85);
  g.add(grp(b, box(0.05, 1.0, 0.05, C.woodDk).at(-0.38, -0.06, 0), box(0.05, 1.0, 0.05, C.woodDk).at(0.38, -0.06, 0)).at(0, 0.06, 0.01).rot(deg(-12), 0, 0).at(0, 0.06, 0.1));
  g.add(box(0.82, 1.0, 0.04, C.woodDk).rot(deg(12), 0, 0).at(0, 0, -0.12));
  return g;
}
const bunCrate = (s = 0.5) => { const g = grp(K.crate(s, C.woodLt)); for (let i = 0; i < 4; i++) g.add(sph(s * 0.2, C.bun, { part: 'top', seg: 16 }).sc(1, 0.7, 1).at(((i % 2) - 0.5) * s * 0.45, s, (Math.floor(i / 2) - 0.5) * s * 0.45)); return g; };
const bin = () => grp(cyl(0.26, 0.22, 0.7, C.teal, { seg: 20 }), cyl(0.27, 0.27, 0.06, C.tealDk, { seg: 20 }).at(0, 0.7, 0), torus(0.24, 0.025, C.tealDk).rot(deg(90), 0, 0).at(0, 0.35, 0));
const gasBottle = () => grp(cyl(0.18, 0.18, 0.55, C.ketchup, { seg: 18 }), sph(0.18, C.ketchup, { part: 'top', seg: 18 }).at(0, 0.55, 0), cyl(0.04, 0.04, 0.12, C.steel, { seg: 8 }).at(0, 0.68, 0), cyl(0.181, 0.181, 0.06, P.white, { seg: 18 }).at(0, 0.3, 0));
const cooler = () => grp(rbox(0.7, 0.42, 0.45, P.white, { r: 0.05 }), rbox(0.72, 0.1, 0.47, C.teal, { r: 0.04 }).at(0, 0.4, 0), box(0.3, 0.04, 0.05, C.tealDk).at(0, 0.52, 0));
function surfboard(c = C.mustard, stripe = C.ketchup, L = 1.9) {
  const pts = [];
  for (let i = 0; i < 28; i++) { const t = (i / 28) * Math.PI * 2, y = (L / 2) * (1 - Math.cos(t)), wv = 0.25 * (1 - 0.45 * Math.pow(y / L, 3)); pts.push([Math.sin(t) * wv, y]); }
  return grp(extrude(pts, 0.05, c, { bevel: 0.02 }), box(0.06, L * 0.86, 0.01, stripe).at(0, L * 0.07, 0.048), extrude([[0, 0], [0.16, 0], [0, 0.18]], 0.02, c).rot(0, deg(90), 0).at(0, 0.1, -0.05));
}
/** Striped awning hinged at the origin, sloping down towards +Z, scalloped front edge. */
function awning(w, d, ang = 18, cols = [C.ketchup, C.cream], n = 10) {
  const a = grp(box(w, 0.04, d, texMat(tex.stripes({ colors: cols, n }))).at(0, 0, d / 2));
  for (let i = 0; i < n; i++) { const ww = w / n; a.add(cyl(ww / 2, ww / 2, 0.03, cols[i % cols.length], { seg: 12, t0: -Math.PI / 2, tl: Math.PI }).rot(deg(90), 0, 0).at(-w / 2 + (i + 0.5) * ww, 0.02, d)); }
  return grp(a.rot(deg(ang), 0, 0));
}
function umbrellaTable(o = {}) {
  const g = grp(cyl(0.22, 0.26, 0.04, C.woodDk, { seg: 18 }), cyl(0.05, 0.06, 0.72, C.woodDk, { seg: 10 }), cyl(0.46, 0.46, 0.06, texMat(tex.planks({ base: C.woodLt, line: C.wood, n: 5 })), { seg: 28 }).at(0, 0.72, 0));
  g.add(K.umbrella(o.colors ?? [C.ketchup, C.cream], 1.1, 2.25));
  (o.stools ?? [[-0.75, 0.25], [0.7, 0.35]]).forEach(([x, z]) => g.add(cyl(0.2, 0.2, 0.07, C.teal, { seg: 18 }).at(x, 0.42, z), cyl(0.04, 0.06, 0.42, C.woodDk, { seg: 8 }).at(x, 0, z)));
  if (o.food !== false) g.add(burger({ seed: o.seed ?? 4, drips: 1 }).sc(0.26).at(-0.15, 0.78, 0.12), fries(0.55, C.ketchup, o.seed ?? 4).at(0.2, 0.78, -0.08), cup(C.teal, 0.6).at(0.12, 0.78, 0.25));
  return g;
}
function lifeguardTower() {
  const g = grp();
  [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]].forEach(([x, z]) => g.add(box(0.1, 1.7, 0.1, P.white).at(x, 0, z)));
  g.add(box(1.0, 0.06, 0.06, C.ketchup).rot(0, 0, 0.9).at(0, 0.45, 0.5), box(1.0, 0.06, 0.06, C.ketchup).rot(0, 0, -0.9).at(0, 0.45, 0.5));
  g.add(box(1.4, 0.1, 1.4, C.woodLt).at(0, 1.7, 0));
  g.add(K.house({ w: 1.1, d: 0.9, h: 0.85, wall: P.white, roof: C.ketchup, roofType: 'hip', roofH: 0.5, door: C.ketchup, windows: 0, base: P.white, trim: C.ketchup }).at(0, 1.8, -0.15));
  [-1, 1].forEach((s) => g.add(box(0.06, 1.95, 0.06, C.woodDk).rot(deg(-28), 0, 0).at(s * 0.22, 0, 1.25)));
  for (let i = 0; i < 5; i++) g.add(box(0.5, 0.04, 0.06, C.woodDk).at(0, 0.25 + i * 0.33, 1.25 - (0.25 + i * 0.33) * Math.tan(deg(28))));
  g.add(cyl(0.025, 0.025, 1.1, P.white, { seg: 8 }).at(0.6, 1.75, -0.6), box(0.5, 0.17, 0.02, C.ketchup).at(0.86, 2.62, -0.6), box(0.5, 0.17, 0.02, C.mustard).at(0.86, 2.45, -0.6));
  g.add(torus(0.17, 0.05, C.ketchup, { ts: 20 }).at(-0.3, 2.15, 0.31), torus(0.17, 0.051, P.white, { ts: 4, arc: 0.6 }).at(-0.3, 2.15, 0.31));
  return g;
}

// ---------------------------------------------------------------- people
const you = (o = {}) => K.person({ skin: P.skin2, hair: P.hairBrown, hairStyle: 'short', top: C.teal, bottom: C.navy, apron: C.cream, hat: 'cap', hatColor: C.ketchup, ...o });
const surfer = (o = {}) => K.person({ skin: P.skin3, hair: P.hairBlonde, hairStyle: 'long', top: C.wetsuit, sleeves: C.teal, bottom: C.wetsuit, shoes: P.skin3, ...o });
function lifeguard(o = {}) {
  const g = K.person({ skin: P.skin1, hair: P.hairAuburn, hairStyle: 'bob', top: C.mustard, bottom: C.ketchup, shoes: C.ketchup, hat: 'straw', hatColor: P.butter, acc: ['glasses'], pose: 'hips', ...o });
  g.add(tube([[-0.16, 1.02, 0.08], [-0.08, 0.92, 0.24], [0, 0.84, 0.28]], 0.012, C.ketchup, { segs: 12 }).noInk(), tube([[0.16, 1.02, 0.08], [0.08, 0.92, 0.24], [0, 0.84, 0.28]], 0.012, C.ketchup, { segs: 12 }).noInk());
  g.add(grp(box(0.1, 0.05, 0.06, C.steel), cyl(0.04, 0.04, 0.07, C.steel, { seg: 12 }).rot(deg(90), 0, 0).at(0.04, -0.012, -0.035)).at(0, 0.8, 0.29));
  [-1, 1].forEach((sd) => g.add(cyl(0.056, 0.056, 0.01, C.navy, { seg: 16 }).rot(deg(90), 0, 0).at(sd * 0.122, 1.39, 0.33).noInk()));
  return g;
}
const pickleDog = (o = {}) => grp(K.dog({ color: '#e7c08a', ear: '#a8733f', collar: C.ketchup, ...o }));

// ---------------------------------------------------------------- builds
function shack(o = {}) {
  const W = 3.1, D = 2.2, H = 2.4, F = 0.24, hx = 1.0, hy0 = 0.95, hy1 = 1.98, fz = D / 2 - 0.05;
  const g = grp();
  // deck on stilts
  g.add(box(W + 0.34, 0.1, D + 0.34, planks(C.woodLt, C.woodDk, 12)).at(0, F - 0.1, 0));
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => g.add(cyl(0.07, 0.08, F - 0.1, C.woodDk, { seg: 8 }).at(sx * (W / 2 + 0.05), 0, sz * (D / 2 + 0.05)))));
  // walls (front has the hatch)
  g.add(box(W, H, 0.1, planks(C.teal, C.tealDk, W * 4)).at(0, F, -D / 2 + 0.05));
  [-1, 1].forEach((s) => g.add(box(0.1, H, D, planks(C.teal, C.tealDk, D * 4)).at(s * (W / 2 - 0.05), F, 0)));
  g.add(box(W, hy0, 0.1, planks(C.teal, C.tealDk, W * 4)).at(0, F, fz));
  const sw = W / 2 - hx;
  [-1, 1].forEach((s) => g.add(box(sw, hy1 - hy0, 0.1, planks(C.teal, C.tealDk, sw * 4)).at(s * (hx + sw / 2), F + hy0, fz)));
  g.add(box(W, H - hy1, 0.1, planks(C.teal, C.tealDk, W * 4)).at(0, F + hy1, fz));
  // cream trim: corner posts and hatch frame
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => g.add(box(0.14, H, 0.14, C.cream).at(sx * W / 2, F, sz * D / 2))));
  g.add(box(2 * hx + 0.16, 0.08, 0.16, C.cream).at(0, F + hy1 - 0.04, fz), ...[-1, 1].map((s) => box(0.08, hy1 - hy0, 0.16, C.cream).at(s * hx, F + hy0, fz)));
  // serving counter (through the hatch) + brackets
  g.add(box(2 * hx + 0.3, 0.07, 0.62, planks(C.woodLt, C.woodDk, 8)).at(0, F + hy0, fz + 0.14));
  [-1, 1].forEach((s) => g.add(extrude([[0, 0], [0.38, 0], [0, -0.3]], 0.06, C.woodDk).rot(0, deg(-90), 0).at(s * 0.75, F + hy0, fz + 0.05)));
  // short striped awning mounted high, so the hatch stays open to view
  g.add(awning(2 * hx + 0.5, 0.5, 14).at(0, F + H - 0.04, fz + 0.06));
  // roof + red fascia
  g.add(box(W + 0.62, 0.08, D + 0.62, C.ketchup).at(0, F + H, 0), box(W + 0.5, 0.12, D + 0.5, C.cream).at(0, F + H + 0.08, 0));
  g.add(K.sign('BURGERS', { w: 2.2, h: 0.46, bg: C.cream, fg: C.ketchup, frame: C.ketchup }).at(0, F + H + 0.2, D / 2 + 0.16));
  [-1, 1].forEach((s) => g.add(box(0.06, 0.24, 0.06, C.ketchup).at(s * 0.9, F + H + 0.15, D / 2 + 0.12)));
  // giant burger on the roof
  g.add(cyl(0.05, 0.05, 0.3, C.steelDk, { seg: 8 }).at(0, F + H + 0.2, -0.25), burger({ seed: 21, seeds: 28, drips: 2 }).sc(1.2).at(0, F + H + 0.45, -0.25));
  // inside: back counter with grill, shelf with buns
  g.add(box(W - 0.3, 0.9, 0.55, C.steel).at(0, F, -D / 2 + 0.38), box(1.2, 0.05, 0.5, C.grill).at(-0.55, F + 0.9, -D / 2 + 0.38));
  [-0.85, -0.45].forEach((x, i) => g.add(patty(0.5, i + 2).sc(0.32).at(x, F + 0.95, -D / 2 + 0.4)));
  g.add(box(W - 0.3, 0.05, 0.3, C.woodLt).at(0, F + 1.45, -D / 2 + 0.25));
  for (let i = 0; i < 5; i++) g.add(sph(0.12, C.bun, { part: 'top', seg: 14 }).sc(1, 0.7, 1).at(0.2 + i * 0.25, F + 1.5, -D / 2 + 0.25));
  // ticket rail inside the hatch, chef waving
  g.add(ticketRail(0.95, 3, 0.9).at(-0.45, F + hy1 - 0.1, fz - 0.1));
  g.add(you({ pose: o.chefPose ?? 'wave' }).sc(0.92).at(0.38, F, fz - 0.42));
  // on the counter
  const ct = F + hy0 + 0.07;
  g.add(wrapped(0.25, 3).at(0.62, ct, fz + 0.28), fries(0.62).at(0.25, ct, fz + 0.3), bell().at(-0.72, ct, fz + 0.3), bottle(C.ketchup, 0.36).at(-0.42, ct, fz + 0.24), bottle(C.mustard, 0.36).at(-0.28, ct, fz + 0.34), napkins().at(0.95, ct, fz + 0.1));
  // left side: menu board, bun crates, bin
  g.add(chalkboard(1.25, 0.95).rot(0, deg(-90), 0).at(-W / 2 - 0.045, F + 0.75, -0.05));
  g.add(bunCrate(0.5).rot(0, 0.2, 0).at(-W / 2 - 0.55, 0, 0.55), K.crate(0.45, C.woodLt).rot(0, -0.3, 0).at(-W / 2 - 0.5, 0, -0.35), bunCrate(0.42).rot(0, 0.5, 0).at(-W / 2 - 0.5, 0.45, -0.35));
  g.add(bin().at(-W / 2 + 0.05, 0, D / 2 + 0.55));
  // right side: gas, cooler, boards
  g.add(gasBottle().at(W / 2 + 0.38, 0, -0.55), cooler().rot(0, -0.3, 0).at(W / 2 + 0.5, 0, 0.75));
  g.add(surfboard(C.mustard, C.ketchup, 1.8).rot(deg(-8), deg(90), 0).at(W / 2 + 0.26, 0, 0.0), surfboard(P.white, C.teal, 1.7).rot(deg(-6), deg(90), 0).at(W / 2 + 0.34, 0, 0.32));
  return g;
}

function grillStation() {
  const g = grp(), W = 1.9, D = 0.85, H = 0.9;
  g.add(slab(3.4, 2.0, { map: tex.checker({ a: C.cream, b: C.teal, n: 4, rep: [3, 2] }), side: C.tealDk, h: 0.18 }));
  // cart on casters
  [-1, 1].forEach((sx) => [-1, 1].forEach((sz) => g.add(cyl(0.06, 0.06, 0.1, P.ink2, { seg: 10 }).rot(deg(90), 0, 0).at(sx * (W / 2 - 0.15), 0.06, sz * (D / 2 - 0.12)))));
  g.add(rbox(W, H - 0.12, D, C.steel, { r: 0.04 }).at(0, 0.12, 0));
  [-1, 1].forEach((s) => g.add(box(W / 2 - 0.1, H - 0.42, 0.02, C.steelLt).at(s * (W / 4), 0.18, D / 2), box(0.03, 0.2, 0.04, C.steelDk).at(s * 0.12, 0.42, D / 2 + 0.02)));
  g.add(box(W, 0.14, 0.03, C.steelDk).at(0, H - 0.2, D / 2 + 0.005));
  [-0.7, -0.35, 0, 0.35, 0.7].forEach((x) => g.add(cyl(0.04, 0.04, 0.05, C.ketchup, { seg: 12 }).rot(deg(90), 0, 0).at(x, H - 0.13, D / 2 + 0.03)));
  // griddle plate, splash guard, grease lip
  g.add(box(W + 0.04, 0.05, D + 0.04, C.grill).at(0, H, 0), box(W + 0.04, 0.32, 0.05, C.steel).at(0, H, -D / 2), box(0.05, 0.16, D, C.steel).at(-W / 2, H, 0), box(0.05, 0.16, D, C.steel).at(W / 2, H, 0), box(W, 0.04, 0.08, C.steelDk).at(0, H, D / 2 + 0.02));
  const top = H + 0.05;
  // patties: raw → flipped → cheesed, plus toasting buns
  g.add(patty(0.5, 1, true).sc(0.34).at(-0.6, top, 0.15), patty(0.5, 2, true).sc(0.34).at(-0.6, top, -0.2));
  g.add(patty(0.5, 3).sc(0.34).at(-0.15, top, 0.15), patty(0.5, 4).sc(0.34).at(-0.15, top, -0.2));
  g.add(grp(patty(0.5, 5), cheese(0.5, 0.3, 1).at(0, 0.148, 0)).sc(0.34).at(0.3, top, 0.12));
  g.add(grp(sph(0.2, C.steel, { part: 'top', seg: 20 }), cyl(0.03, 0.04, 0.05, C.ketchup, { seg: 8 }).at(0, 0.19, 0), sph(0.035, C.ketchup, { seg: 8 }).at(0, 0.25, 0)).at(0.3, top, -0.2));
  g.add(bunTop(0.5, 3, 24).sc(0.32).at(0.72, top, 0.15), bunTop(0.5, 6, 24).sc(0.32).at(0.72, top, -0.2));
  // spatula resting on the edge
  g.add(grp(box(0.22, 0.015, 0.26, C.steel), box(0.03, 0.02, 0.2, C.steelDk).at(0, 0.02, 0.22), cyl(0.028, 0.028, 0.34, C.woodDk, { seg: 8 }).rot(deg(90), 0, 0).at(0, 0.03, 0.32)).rot(0, deg(-25), 0).at(0.05, top + 0.08, 0.36).rot(deg(-12), deg(-25), 0));
  // steam
  [[-0.15, 0.15], [0.3, 0.12]].forEach(([x, z], i) => g.add(steam(1 + i * 0.2).at(x, top + 0.3, z)));
  // side shelf with bottles
  g.add(box(0.55, 0.05, D, C.woodLt).at(W / 2 + 0.3, H - 0.05, 0), extrude([[0, 0], [0.4, 0], [0, -0.3]], 0.04, C.steelDk).rot(0, 0, 0).at(W / 2, H - 0.05, 0));
  g.add(bottle(C.ketchup).at(W / 2 + 0.2, H, -0.2), bottle(C.mustard).at(W / 2 + 0.4, H, -0.05), bottle(P.white, 0.38).at(W / 2 + 0.22, H, 0.12), cyl(0.05, 0.05, 0.14, P.white, { seg: 10 }).at(W / 2 + 0.42, H, 0.25));
  // gas bottle
  g.add(gasBottle().at(-W / 2 - 0.35, 0, -0.1), tube([[-W / 2 - 0.35, 0.7, -0.1], [-W / 2 - 0.2, 0.75, 0.0], [-W / 2, 0.5, 0]], 0.02, P.ink2, { segs: 12 }));
  return g;
}

function foodTruck() {
  const g = grp();
  g.add(slab(5.6, 3.0, { map: tex.speckle({ base: '#8fbe5a', dots: ['#7aa94a', '#a5cf6c'], n: 140, size: 4, rep: [2, 1] }), side: P.soil, h: 0.25 }).at(0.3, 0, 0.15));
  const L = 3.0, D = 1.6, yb = 0.42, yc = 1.12, yr = 2.3;
  // chassis + wheels
  g.add(box(4.0, 0.16, 1.3, P.ink2).at(0.45, 0.26, 0));
  [-0.9, 1.95].forEach((x) => [-1, 1].forEach((s) => g.add(K.wheel(0.3, 0.22).at(x, 0.3, s * 0.74))));
  // box body: lower solid, upper walls round the hatch
  g.add(rbox(L, yc - yb, D, C.mustard, { r: 0.08 }).at(0, yb, 0), box(L + 0.02, 0.1, D + 0.02, C.ketchup).at(0, yb + 0.12, 0));
  g.add(box(L, yr - yc, 0.1, C.mustard).at(0, yc, -D / 2 + 0.05), box(L - 0.2, yr - yc, 0.02, C.cream).at(0, yc, -D / 2 + 0.11));
  [-1, 1].forEach((s) => g.add(box(0.12, yr - yc, D, C.mustard).at(s * (L / 2 - 0.06), yc, 0), box(0.32, yr - yc, 0.1, C.mustard).at(s * (L / 2 - 0.16), yc, D / 2 - 0.05)));
  g.add(rbox(L + 0.12, 0.14, D + 0.12, C.cream, { r: 0.05 }).at(0, yr, 0));
  // cab
  g.add(rbox(0.95, 1.4, D, C.mustard, { r: 0.14 }).at(L / 2 + 0.47, yb, 0), rbox(0.97, 0.1, D + 0.02, C.cream, { r: 0.04 }).at(L / 2 + 0.47, yb + 1.35, 0));
  g.add(box(0.05, 0.46, D - 0.3, P.glassDk).at(L / 2 + 0.95, yb + 0.8, 0), box(0.5, 0.4, 0.04, P.glassDk).at(L / 2 + 0.47, yb + 0.82, D / 2), box(0.08, 0.16, 0.04, C.ketchup).at(L / 2 + 0.95, yb + 0.12, 0));
  [-1, 1].forEach((s) => g.add(sph(0.08, P.butter, { seg: 12 }).at(L / 2 + 0.95, yb + 0.35, s * 0.55)));
  g.add(box(0.1, 0.12, D + 0.06, C.steel).at(L / 2 + 0.96, yb - 0.04, 0));
  // serving hatch: counter, awning, inside bits
  g.add(box(L - 0.6, 0.06, 0.4, planks(C.woodLt, C.woodDk, 8)).at(0, yc, D / 2 + 0.1));
  g.add(awning(L - 0.3, 0.45, 14).at(0, yr - 0.03, D / 2));
  g.add(you({ pose: 'wave' }).sc(0.86).at(-0.4, 0.3, 0.38));
  g.add(ticketRail(0.9, 3, 0.85).at(0.6, yr - 0.1, D / 2 - 0.12));
  g.add(box(L - 0.3, 0.05, 0.3, C.woodLt).at(0, yc + 0.62, -D / 2 + 0.25));
  for (let i = 0; i < 4; i++) g.add(sph(0.12, C.bun, { part: 'top', seg: 14 }).sc(1, 0.7, 1).at(0.3 + i * 0.26, yc + 0.67, -D / 2 + 0.25));
  const ct = yc + 0.06;
  g.add(wrapped(0.24, 6).at(0.3, ct, D / 2 + 0.12), fries(0.6).at(0.65, ct, D / 2 + 0.14), bottle(C.ketchup, 0.34).at(-0.85, ct, D / 2 + 0.1), bottle(C.mustard, 0.34).at(-1.0, ct, D / 2 + 0.16), bell().at(1.05, ct, D / 2 + 0.12));
  // livery: side sign + roof burger
  g.add(K.sign('BURGER JOINT', { w: 1.9, h: 0.3, bg: C.ketchup, fg: C.cream, frame: C.ketchup }).at(0, yb + 0.28, D / 2 + 0.01));
  g.add(K.sign('BURGERS', { w: 1.4, h: 0.36, bg: C.cream, fg: C.ketchup, frame: C.ketchup }).at(-0.55, yr + 0.14, 0.2), burger({ seed: 31, seeds: 24, drips: 1 }).sc(0.62).at(0.75, yr + 0.14, 0));
  // festival: bunting to a pole, A-frame, bin
  g.add(cyl(0.04, 0.05, 2.5, P.white, { seg: 8 }).at(-2.2, 0, 0.9), K.bunting([[-L / 2, yr + 0.1, D / 2], [-1.85, yr - 0.15, 0.75], [-2.2, 2.45, 0.9]], [C.ketchup, C.mustard, C.teal, P.white], 7));
  g.add(aFrame().rot(0, 0.35, 0).at(-1.95, 0, 1.25), bin().sc(0.85).at(2.75, 0, 1.0));
  return g.rot(0, deg(-8), 0);
}

function deluxeHero() {
  const g = grp();
  g.add(cyl(0.98, 1.0, 0.09, texMat(tex.planks({ base: C.woodLt, line: C.wood, n: 6 })), { seg: 48 }), cyl(0.06, 0.06, 0.03, C.woodDk, { seg: 10 }).rot(deg(90), 0, 0).at(0, 0.045, -1.0));
  g.add(box(1.32, 0.008, 1.32, texMat(checkTex())).rot(0, deg(16), 0).at(-0.08, 0.09, 0.02));
  const b = burger({ layers: DELUXE, seed: 7, seeds: 38 }).at(-0.1, 0.098, 0.02);
  g.add(b);
  // hot off the grill: three steam squiggles
  [[-0.5, 0.05, 0, 0.12], [-0.32, -0.1, 1.6, 0.22], [0.36, -0.05, 2.6, 0.14]].forEach(([x, z, ph, y0]) => {
    const pts = []; for (let i = 0; i <= 4; i++) pts.push([x + Math.sin(i * 1.5 + ph) * 0.035, b.userData.top + y0 + i * 0.055, z]);
    g.add(tube(pts, 0.011, P.white, { segs: 24 }));
  });
  g.add(fries(1.0, C.ketchup, 3).rot(0, 0.3, 0).at(0.72, 0.09, -0.42));
  g.add(grp(cyl(0.13, 0.11, 0.09, P.white, { seg: 18 }), cyl(0.115, 0.115, 0.01, C.ketchup, { seg: 18 }).at(0, 0.085, 0)).at(0.66, 0.09, 0.42));
  g.add(sph(0.06, C.pickle, { seg: 12 }).sc(1, 0.8, 3).rot(0, 0.6, 0).at(-0.6, 0.15, 0.62), chip(0.3, 0.72, 0.9).at(0.3, 0.09, 0.72), chip(0.45, 0.65, 0.3).at(0.45, 0.09, 0.62));
  return g;
}

// ---------------------------------------------------------------- environments
/** Sand slab with the sea behind it. Sand runs z0..z0+Ds, sea behind that. */
function beachBase(W, z0, Ds, Dsea) {
  const g = grp();
  g.add(slab(W, Ds, { map: sandTex([W / 3, Ds / 3]), side: C.sandDk, h: 0.5 }).at(0, 0, z0 + Ds / 2));
  g.add(slab(W, Dsea, { map: tex.waves({ base: C.sea, line: '#9ad6de', rep: [W / 3, Dsea / 3] }), side: C.seaDk, h: 0.62 }).at(0, -0.12, z0 - Dsea / 2));
  g.add(box(W, 0.02, 0.4, C.wet).at(0, -0.015, z0 + 0.2));
  const foam = []; for (let i = 0; i <= 16; i++) foam.push([-W / 2 + (i / 16) * W, -0.1, z0 - 0.12 + Math.sin(i * 1.3) * 0.08]);
  g.add(tube(foam, 0.07, C.foam, { segs: 90 }));
  return g;
}
const buoy = () => grp(sph(0.18, C.ketchup, { seg: 14 }).sc(1, 1.2, 1), cyl(0.18, 0.18, 0.06, P.white, { seg: 14 }));
const queuers = () => [
  grp(surfer(), surfboard(C.ketchup, P.white, 1.75).rot(deg(-4), deg(-20), deg(-5)).at(0.46, 0, -0.16)),
  lifeguard({ pose: 'stand' }),
  K.person({ body: 'kid', hairStyle: 'pigtails', hair: P.hairBlack, skin: P.skin4, top: C.mustard, bottom: C.teal, hat: 'bucket', hatColor: P.white, pose: 'wave' }),
  K.person({ body: 'elder', hairStyle: 'short', hair: P.hairGrey, skin: P.skin1, top: '#ec8fab', bottom: P.white, hat: 'straw', acc: ['glasses'] }),
];
const towel = (a, b) => box(0.8, 0.02, 1.5, texMat(tex.stripes({ colors: [a, b], n: 6, vertical: false })));
function sandcastle() {
  const g = grp(cyl(0.34, 0.4, 0.26, C.sandDk, { seg: 4 }).rot(0, deg(45), 0), cyl(0.2, 0.24, 0.24, C.sandDk, { seg: 14 }).at(0, 0.26, 0));
  [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].forEach(([x, z]) => g.add(cone(0.09, 0.22, C.sandDk, { seg: 10 }).at(x * 0.85, 0.26, z * 0.85)));
  g.add(K.flag(C.ketchup, 0.5).sc(0.7).at(0, 0.5, 0), grp(cyl(0.13, 0.1, 0.22, C.teal, { seg: 14 }), torus(0.12, 0.012, C.tealDk).at(0, 0.22, 0)).rot(0, 0, deg(100)).at(0.6, 0.12, 0.25));
  return g;
}
const beachBall = () => sph(0.22, texMat(tex.stripes({ colors: [C.ketchup, P.white, C.mustard, P.white, C.teal, P.white], n: 6 })), { seg: 20 }).at(0, 0.22, 0);

// key art: the whole shack, queue, tables, tower and sea
function keyBeach() {
  const g = beachBase(12.5, -2.0, 5.2, 3.2);
  const sx = -2.5;
  g.add(shack().rot(0, deg(6), 0).at(sx, 0, -0.55));
  const q = queuers(), qp = [[sx + 0.15, 1.3, 196], [sx + 1.25, 1.6, -60], [sx + 2.15, 1.85, -64], [sx + 3.05, 1.8, -70]];
  q.forEach((p, i) => g.add(p.rot(0, deg(qp[i][2]), 0).at(qp[i][0], 0, qp[i][1])));
  g.add(pickleDog().sc(1.2).rot(0, deg(-30), 0).at(sx - 0.5, 0, 2.15), spilled(1.1).rot(0, 0.6, 0).at(sx + 0.15, 0, 2.55));
  g.add(aFrame().rot(0, deg(24), 0).at(sx - 1.85, 0, 1.3));
  [[1.7, 0.2, 1, 0], [3.3, 1.75, 2, 1], [4.4, -0.7, 3, 2]].forEach(([x, z, s, c]) => g.add(umbrellaTable({ colors: [[C.ketchup, C.cream], [C.teal, C.cream], [C.mustard, C.cream]][c], seed: s }).rot(0, c * 0.7, 0).at(x, 0, z)));
  g.add(lifeguardTower().rot(0, deg(-24), 0).at(5.4, 0, -1.25));
  g.add(K.tree({ kind: 'palm', h: 3.4, leaf: C.lettuceDk, trunk: C.woodDk }).rot(0, deg(160), 0).at(-5.1, 0, -1.5), sandcastle().rot(0, 0.3, 0).at(-5.0, 0, 2.2));
  g.add(towel(C.teal, P.white).rot(0, 0.5, 0).at(5.0, 0, 1.9), towel(C.ketchup, P.white).rot(0, 1.3, 0).at(1.9, 0, 2.55), beachBall().at(0.7, 0, 2.75), sandcastle().rot(0, -0.4, 0).at(3.9, 0, 2.7));
  g.add(grp(K.bird({})).rot(0, 0.8, 0).at(-0.6, 0, 2.7), grp(K.bird({})).rot(0, -0.6, 0).at(0.0, 0, 2.95));
  g.add(K.vehicle({ kind: 'boat', body: C.teal, trim: P.white, len: 1.6 }).sc(0.7).rot(0, deg(-15), 0).at(1.6, -0.3, -3.6), buoy().at(-0.4, -0.12, -3.0), buoy().at(3.6, -0.12, -4.0));
  return g;
}
// lunch rush: a closer diorama seen from the front-right, queue snaking left
function rushBeach() {
  const g = beachBase(8.4, -2.0, 4.9, 1.9);
  const sx = 1.5;
  g.add(shack().rot(0, deg(-6), 0).at(sx, 0, -0.6));
  const q = queuers(), qp = [[sx - 0.15, 1.4, 170], [sx - 1.2, 1.6, 58], [sx - 2.05, 1.85, 62], [sx - 2.95, 1.75, 66]];
  q.forEach((p, i) => g.add(p.rot(0, deg(qp[i][2]), 0).at(qp[i][0], 0, qp[i][1])));
  g.add(pickleDog().sc(1.15).rot(0, deg(30), 0).at(sx + 0.85, 0, 1.75), spilled(1.0).rot(0, -0.5, 0).at(sx + 0.3, 0, 2.35));
  g.add(aFrame().rot(0, deg(-30), 0).at(sx + 2.25, 0, 1.25));
  g.add(umbrellaTable({ colors: [C.mustard, C.cream], seed: 5 }).at(-3.0, 0, -1.2), umbrellaTable({ colors: [C.teal, C.cream], seed: 6, stools: [[-0.7, 0.2], [0.6, 0.45]] }).rot(0, 1.2, 0).at(-2.0, 0, 0.45));
  g.add(K.tree({ kind: 'palm', h: 3.0, leaf: C.lettuceDk, trunk: C.woodDk }).rot(0, 3.0, 0).at(3.7, 0, -1.4));
  g.add(towel(C.ketchup, P.white).rot(0, -1.2, 0).at(-3.0, 0, 2.15), beachBall().at(-1.9, 0, 2.5), grp(K.bird({})).rot(0, 0.5, 0).at(-0.7, 0, 2.55));
  g.add(buoy().at(-2.0, -0.12, -2.9));
  return g;
}

function counterScene() {
  const g = grp(), TW = 4.6, TD = 2.4;
  g.add(box(TW, 0.9, TD, planks(C.teal, C.tealDk, 14)).at(0, -1.02, 0), box(TW + 0.14, 0.12, TD + 0.14, texMat(tex.planks({ base: C.woodLt, line: C.wood, n: 9, vertical: true, rep: [1, 1] }))).at(0, -0.12, 0));
  // back wall (cut away) with ticket rail
  g.add(box(TW + 0.14, 1.25, 0.1, planks(C.teal, C.tealDk, 16)).at(0, -0.12, -TD / 2 - 0.12), box(TW + 0.16, 0.06, 0.14, C.cream).at(0, 1.1, -TD / 2 - 0.12));
  g.add(ticketRail(3.5, 4, 1.75).at(0.1, 1.02, -TD / 2 + 0.0));
  // grill at left: raw, flipped, cheesed
  g.add(box(1.25, 0.05, 1.25, C.steel).at(-1.55, 0, 0.05), box(1.12, 0.03, 1.12, C.grill).at(-1.55, 0.05, 0.05));
  g.add(patty(0.5, 2, true).sc(0.42).at(-1.82, 0.08, -0.2), patty(0.5, 5).sc(0.42).at(-1.3, 0.08, -0.22), grp(patty(0.5, 6), cheese(0.5, 0.4, 1).at(0, 0.148, 0)).sc(0.42).at(-1.62, 0.08, 0.32));
  g.add(steam(1.1).at(-1.3, 0.4, -0.22));
  g.add(grp(box(0.28, 0.015, 0.32, C.steel), box(0.04, 0.02, 0.16, C.steelDk).at(0, 0.02, 0.22), cyl(0.04, 0.04, 0.36, C.ketchup, { seg: 10 }).rot(deg(90), 0, 0).at(0, 0.04, 0.3)).rot(0, deg(-30), 0).at(-0.75, 0.0, 0.75));
  // assembly: the half-built burger on wrap paper, top bun waiting
  g.add(box(1.25, 0.008, 1.25, texMat(checkTex())).rot(0, deg(12), 0).at(0.05, 0, 0.3));
  g.add(burger({ layers: ['bunB', 'lettuce', 'patty', 'cheese'], seed: 12, drips: 1 }).sc(0.62).at(0.0, 0.008, 0.3));
  g.add(bunTop(0.5, 4, 30).sc(0.62).at(0.62, 0.008, 0.72));
  // topping pans along the back
  const pan = (x, fill) => grp(rbox(0.5, 0.12, 0.42, C.steel, { r: 0.03 }), box(0.42, 0.02, 0.34, '#8e989f').at(0, 0.1, 0), fill.sc(1.15).at(0, 0.11, 0)).at(x, 0, -0.62);
  const fillOf = (kind) => {
    const f = grp(), r = rng(kind.length * 7);
    for (let i = 0; i < 5; i++) {
      const x = (r() - 0.5) * 0.24, z = (r() - 0.5) * 0.18;
      if (kind === 'tomato') f.add(cyl(0.09, 0.09, 0.03, C.tomato, { seg: 16 }).rot(0.2 * (r() - 0.5), 0, 0.3 * (r() - 0.5)).at(x, 0.01 * i, z));
      if (kind === 'pickle') f.add(cyl(0.06, 0.06, 0.02, C.pickle, { seg: 12 }).rot(0.3 * (r() - 0.5), 0, 0.3 * (r() - 0.5)).at(x, 0.01 * i, z), cyl(0.06, 0.06, 0.02, C.pickle, { seg: 12 }).at(-x, 0.012, -z));
      if (kind === 'onion') f.add(torus(0.07, 0.016, C.onion, { ts: 16, rs: 6 }).rot(deg(90) + 0.2 * (r() - 0.5), 0, 0).at(x, 0.02 + 0.006 * i, z));
      if (kind === 'lettuce' && i < 3) f.add(lettuce(0.17, i * 3, i % 2 ? C.lettuce : C.lettuceLt).at(x * 0.6, 0.015 * i, z * 0.6));
      if (kind === 'cheese' && i < 4) f.add(box(0.22, 0.012, 0.22, C.cheese).rot(0, 0.3 * i, 0).at(0, 0.014 * i, 0));
    }
    return f;
  };
  ['lettuce', 'tomato', 'pickle', 'onion', 'cheese'].forEach((k, i) => g.add(pan(-0.95 + i * 0.56, fillOf(k))));
  // right: sauce bottles, wrap sheets, a wrapped order by the bell
  g.add(bottle(C.ketchup).at(1.05, 0, 0.0), bottle(C.mustard).at(1.25, 0, -0.12), bottle(P.white, 0.38).at(1.3, 0, 0.12));
  for (let i = 0; i < 5; i++) g.add(box(0.6, 0.008, 0.6, texMat(checkTex())).rot(0, 0.05 * i, 0).at(1.75, i * 0.012, -0.35));
  g.add(wrapped(0.42, 9).at(1.85, 0, 0.55), bell().at(1.4, 0, 0.8), fries(0.8, C.ketchup, 9).at(1.75, 0, 0.0), tipsJar().at(0.95, 0, 0.88));
  return g;
}

export default {
  slug: 'burger',
  title: 'Burger Joint',
  logline: 'Run a beach burger shack. Stack every order by hand, layer by layer, and keep the queue happy.',
  genre: ['Cooking', 'Restaurant management', 'Hands-on'],
  theme: { accent: '#d8402c', cardBg: '#f5e6cb', plinth: '#e9cc95', plinthRim: '#c99a5c' },
  pitch: 'A tiny shack on the sand, seen from above with the roof off. Orders arrive as paper tickets clipped to a rail. You build each burger by hand on the counter: bun, patty, cheese, lettuce, sauce, wrap. Then you slide it out of the hatch. Tips buy new tools for the counter, never menu upgrades.',
  loop: ['A ticket clips onto the rail', 'Grill the patty and flip it', 'Stack bun, patty, toppings and sauce', 'Wrap it and slide it out of the hatch', 'Tips buy a new topping or tool'],
  why: ['Your prototype note asked for bun, meat, toppings, sauce and wrap. The stack makes every step visible.', 'Chunky food looks iconic with thick outlines. A burger reads at thumbnail size.', 'A tiny shack on the sand is a perfect diorama, and a ready-made Steam capsule.'],
  fromYou: 'Grows straight out of your Burger Joint prototype ("feels right") and the hands-on prep of Potato Please. It brings the warm Chef Knight look you picked for the kite shop into 3D.',
  similar: [
    { name: 'PlateUp!', url: 'https://store.steampowered.com/app/1599600', note: 'top-down kitchen, every plate built by hand' },
    { name: 'Chef Knight', url: 'https://store.steampowered.com/app/4304930', note: 'the warm look you picked for the kite shop' },
    { name: 'Kebab Chefs!', url: 'https://store.steampowered.com/app/1001270', note: 'orders stacked layer by layer, queue outside' },
    { name: 'Venba', url: 'https://store.steampowered.com/app/1491670', note: 'cooking as small, physical steps' },
  ],
  palette: [['Ketchup red', C.ketchup], ['Mustard', C.mustard], ['Lettuce green', C.lettuce], ['Bun tan', C.bun], ['Shack teal', C.teal], ['Sand', C.sand]],
  key: { build: () => keyBeach(), bg: [[0, '#bfe4ec'], [1, '#f6ead2']], cam: { yaw: -28, pitch: 26, fov: 24 }, caption: 'Noon at the shack, queue building' },
  characters: [
    { name: 'Rosa', role: 'You. Cap on, burger up, knows every regular\'s order.', build: () => you({ pose: 'hold', held: burger({ seed: 2, drips: 1 }).sc(0.36) }) },
    { name: 'Kai', role: 'The surfer regular. Double patty, no onion, every day at noon.', build: () => grp(surfer({ pose: 'wave' }), surfboard(C.ketchup, P.white, 1.95).rot(deg(-4), deg(-25), deg(-5)).at(0.46, 0, -0.18)) },
    { name: 'Dot', role: 'Lifeguard. Blows the whistle on queue jumpers.', build: () => grp(lifeguard(), cyl(0.025, 0.03, 2.0, P.white, { seg: 8 }).at(-0.48, 0, -0.22), box(0.42, 0.14, 0.02, C.ketchup).at(-0.26, 1.82, -0.22), box(0.42, 0.14, 0.02, C.mustard).at(-0.26, 1.68, -0.22)) },
    { name: 'Pickle', role: 'Waits under the hatch for dropped chips. Usually gets some.', build: () => grp(pickleDog().sc(1.45).rot(0, deg(-25), 0).at(0.1, 0, -0.15), spilled(0.9).rot(0, 0.5, 0).at(-0.3, 0, 0.12)) },
  ],
  builds: [
    { name: 'The shack', tag: 'Building', note: 'Hatch, awning, ticket rail and a giant burger on the roof.', build: () => shack(), cam: { yaw: -28, pitch: 28 } },
    { name: 'Festival truck', tag: 'Vehicle', note: 'The shack on wheels, for festival weekends.', build: () => foodTruck(), cam: { yaw: -22, pitch: 28 } },
    { name: 'Grill station', tag: 'Structure', note: 'Flat-top, melting dome and squeeze bottles. Raw to cheesed.', build: () => grillStation(), cam: { yaw: -18, pitch: 34 } },
    { name: 'The Deluxe', tag: 'Prop', note: 'Two patties, melted cheese, lettuce frill, pickles and a flag pick.', build: () => deluxeHero(), cam: { yaw: -24, pitch: 16, fov: 22 } },
  ],
  environments: [
    { name: 'Lunch rush', note: 'Queue at the hatch, tables full, the dog on chip patrol.', build: () => rushBeach(), stage: { bg: [[0, '#bfe4ec'], [1, '#f6ead2']] }, cam: { yaw: 30, pitch: 30 } },
    { name: 'The counter, mid-order', note: 'Ticket on the rail, burger half-stacked, wrap paper ready.', build: () => counterScene(), cam: { yaw: -10, pitch: 50, fov: 26 } },
  ],
};
