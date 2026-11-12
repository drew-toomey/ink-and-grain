// Pall — board 6. Greyscale + one accent: lamplight amber means light, and only light.
// Every build() returns a fresh Object3D. Front of things faces +Z. Amber is only ever a glow (K.glow) or a lamp's PointLight.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, tex, texMat, deg, rng } = K;

// --- palette: greys + one amber
const AMBER = '#f2a22c';
const G = { night: P.g0, slate: P.g1, dark: P.g2, stone: P.g3, mid: P.g4, pall: P.g5, fog: P.g6, chalk: P.g7 };
const LIT = K.glow(AMBER);
const DARKGLASS = K.mat(G.dark);
const NIGHT = { bg: [[0, '#2e2d2b'], [0.5, '#53504d'], [1, '#8d8984']], light: 'night' };
const DUSKCARD = { bg: [[0, '#4a4844'], [1, '#9a958f']], light: 'night' }; // cards: a lighter sky so dark iron still has a silhouette

// Kit helpers carry default colours (mustard badges, brick chimneys, wood seats, pink blush).
// Some sit close to the amber hue and would survive the mono pass, so every toon material is
// turned into its own grey before render. Glows (MeshBasic) are left alone: those are the light.
const _grey = new Map();
function greyify(o) {
  const swap = (m) => {
    if (!m || !m.isMeshToonMaterial || m.map || m.userData.keep) return m;
    const c = m.color;
    if (Math.max(c.r, c.g, c.b) - Math.min(c.r, c.g, c.b) < 0.003) return m;
    if (!_grey.has(m)) { const n = m.clone(); const l = c.r * 0.2126 + c.g * 0.7152 + c.b * 0.0722; n.color.setRGB(l, l, l); _grey.set(m, n); }
    return _grey.get(m);
  };
  o.traverse((x) => { if (x.isMesh) x.material = Array.isArray(x.material) ? x.material.map(swap) : swap(x.material); });
  return o;
}
const safe = (fn) => () => greyify(fn());

// --- textures (all grey)
const cobbles = (rep = [3, 3], seed = 4) => tex.custom(256, 256, (x, w, h) => {
  const r = rng(seed); x.fillStyle = G.dark; x.fillRect(0, 0, w, h);
  const n = 8, s = w / n;
  for (let j = 0; j < n; j++) for (let i = -1; i <= n; i++) {
    x.fillStyle = r() < 0.6 ? G.stone : G.mid; x.beginPath(); x.roundRect(i * s + (j % 2) * s / 2 + 3, j * s + 3, s - 6, s - 6, 10); x.fill();
  }
}, rep);
const flags = (rep = [2, 2]) => tex.tiles({ base: G.mid, line: G.dark, n: 4, rep });
const sea = (rep = [3, 2]) => tex.waves({ base: G.dark, line: G.stone, rep });
const planks = (n = 4, vertical = true, base = G.mid) => texMat(tex.planks({ base, line: G.dark, n, vertical }));
const shutterMat = texMat(tex.planks({ base: G.stone, line: G.dark, n: 6 }));

// --- light
const lampLight = (I = 12, d = 4.2) => new THREE.PointLight(AMBER, I, d, 2);
// 'night' light alone sinks the darker greys under the ink. A soft neutral fill keeps values apart.
const lift = (g, I = 0.55) => { g.add(new THREE.AmbientLight('#ffffff', I)); return g; };
const soft = (stops) => tex.custom(256, 256, (x, w) => { stops.forEach(([r, a]) => { x.fillStyle = `rgba(255,255,255,${a})`; x.beginPath(); x.arc(w / 2, w / 2, w * r, 0, 7); x.fill(); }); });
const POOL = soft([[0.49, 0.28], [0.33, 0.3], [0.18, 0.25]]);
const MIST = soft([[0.49, 0.18], [0.4, 0.2], [0.28, 0.25]]);
const REFL = tex.custom(128, 256, (x, w, h) => { x.fillStyle = 'rgba(255,255,255,0.85)'; [[0.9, 0.04], [0.7, 0.22], [0.55, 0.42], [0.35, 0.62], [0.2, 0.8]].forEach(([f, y]) => { x.beginPath(); x.roundRect(w * (1 - f) / 2, h * y, w * f, h * 0.07, 8); x.fill(); }); });
const decal = (w, d, color, map, y = 0.012) => { const m = K.plane(w, d, K.glow(color, { opacity: 0.99, depthWrite: false, map }), { cast: false, receive: false }).at(0, y, 0).noInk(); m.userData.noFit = true; m.renderOrder = 2; return m; };
const pool = (r = 1.3) => decal(r * 2, r * 2, AMBER, POOL);
const reflection = (w = 0.5, d = 1.3) => decal(w, d, AMBER, REFL, 0.01);
const mist = (w, d, y = 0.03) => decal(w, d, G.chalk, MIST, y);
// K.ground's side box and top box share the y=0 plane and z-fight when their colours differ; this slab doesn't overlap.
function slab(w, d, o = {}) {
  const h = o.h ?? 0.35;
  return grp(box(w, h - 0.06, d, o.side ?? G.stone).at(0, -h, 0), box(w, 0.06, d, o.map ? texMat(o.map) : (o.top ?? G.mid)).at(0, -0.06, 0)).weld();
}

// --- fog: bulky pale toon puffs, welded so the bank reads as one shape. No shadows.
function fogBank(w, d, h = 1, seed = 1, c = G.fog) {
  const r = rng(seed), g = grp();
  const nx = Math.max(2, Math.round(w / 0.75)), nz = Math.max(1, Math.round(d / 0.8));
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) { // low, wide base layer
    const rr = 0.4 + r() * 0.2, hy = h * (0.5 + r() * 0.25);
    g.add(sph(rr, c, { seg: 18 }).sc(1.3, (hy * 0.62) / rr, 1.15).at(-w / 2 + (i + 0.5) * (w / nx) + (r() - 0.5) * 0.3, hy * 0.33, -d / 2 + (j + 0.5) * (d / nz) + (r() - 0.5) * 0.3));
  }
  const nt = Math.max(1, Math.round(nx * nz * 0.5));
  for (let k = 0; k < nt; k++) { // rounder puffs piled on top, mostly towards the back
    const rr = 0.26 + r() * 0.2;
    g.add(sph(rr, c, { seg: 16 }).sc(1.25, 1, 1.1).at((r() - 0.5) * (w - 0.6), h * (0.55 + r() * 0.3), (r() - 0.65) * (d - 0.4)));
  }
  return g.weld().noShadow();
}

// --- small props
const crate = (s = 0.42, c = G.mid) => rbox(s, s, s, texMat(tex.planks({ base: c, line: G.dark, n: 4 })), { r: 0.02 });
function oilCan(c = G.mid) {
  return grp(
    cyl(0.12, 0.12, 0.28, c, { seg: 14 }),
    cone(0.12, 0.07, c, { seg: 14 }).at(0, 0.28, 0),
    cyl(0.025, 0.025, 0.08, G.slate, { seg: 8 }).at(0, 0.32, 0),
    tube([[0.09, 0.12, 0], [0.18, 0.24, 0], [0.25, 0.36, 0]], 0.016, G.slate, { segs: 12 }),
    torus(0.07, 0.014, G.slate, { arc: Math.PI, ts: 12 }).rot(0, deg(90), 0).at(-0.02, 0.32, 0),
  );
}
function ladder(h = 2.2, w = 0.4, c = G.mid) {
  const g = grp(box(0.05, h, 0.05, c).at(-w / 2, 0, 0), box(0.05, h, 0.05, c).at(w / 2, 0, 0));
  for (let y = 0.25; y < h - 0.05; y += 0.3) g.add(box(w, 0.04, 0.04, c).at(0, y, 0));
  return g;
}
const bollard = () => grp(cyl(0.1, 0.12, 0.28, G.slate, { seg: 12 }), cyl(0.15, 0.15, 0.06, G.slate, { seg: 12 }).at(0, 0.28, 0));
function spokeWheel(r = 0.45, c = G.slate) {
  const g = grp(torus(r, 0.04, c, { ts: 28 }), cyl(0.07, 0.07, 0.14, c, { seg: 12 }).rot(deg(90), 0, 0).at(0, 0, -0.07));
  for (let i = 0; i < 4; i++) g.add(grp(box(0.03, r * 2, 0.03, c).at(0, -r, 0)).rot(0, 0, i * deg(45)));
  return g;
}
function handLantern(lit = true) {
  const g = grp(
    cyl(0.1, 0.12, 0.04, G.slate, { seg: 12 }),
    cyl(0.08, 0.08, 0.18, lit ? LIT : DARKGLASS, { seg: 12 }).at(0, 0.04, 0),
    cone(0.12, 0.1, G.slate, { seg: 12 }).at(0, 0.22, 0),
    torus(0.045, 0.012, G.slate).at(0, 0.36, 0),
  );
  for (let i = 0; i < 4; i++) g.add(box(0.02, 0.18, 0.02, G.slate).at(Math.cos(i * Math.PI / 2 + 0.78) * 0.085, 0.04, Math.sin(i * Math.PI / 2 + 0.78) * 0.085));
  return g;
}
const loaf = () => grp(cap(0.07, 0.14, G.mid, { seg: 12 }).rot(0, 0, deg(90)).at(0.14, 0, 0), ...[-0.06, 0, 0.06].map((x) => box(0.025, 0.02, 0.1, G.fog).rot(0, deg(30), 0).at(x, 0.13, 0).noInk()));

// --- street lamp: one function for lit and unlit
function lampHead(lit, I = 12) {
  const f = G.dark, g = grp(
    cyl(0.07, 0.11, 0.08, f, { seg: 10 }),
    box(0.32, 0.04, 0.32, f).at(0, 0.08, 0),
    box(0.24, 0.34, 0.24, lit ? LIT : DARKGLASS).at(0, 0.12, 0),
    box(0.36, 0.035, 0.36, f).at(0, 0.45, 0),
    cone(0.27, 0.18, f, { seg: 4 }).rot(0, deg(45), 0).at(0, 0.48, 0),
    cyl(0.025, 0.04, 0.1, f, { seg: 8 }).at(0, 0.64, 0),
    sph(0.045, f, { seg: 10 }).at(0, 0.77, 0),
  );
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => g.add(box(0.035, 0.36, 0.035, f).at(sx * 0.125, 0.1, sz * 0.125)));
  if (lit) g.add(lampLight(I).at(0, 0.3, 0));
  else g.add(box(0.16, 0.025, 0.01, G.stone).rot(0, 0, 0.5).at(0.02, 0.27, 0.125).noInk(), box(0.1, 0.02, 0.01, G.stone).rot(0, 0, -0.7).at(-0.05, 0.22, 0.125).noInk()); // cracked, sooty
  return g;
}
function streetLamp(lit, o = {}) {
  const h = o.h ?? 2.1, c = G.dark;
  const g = grp(
    cyl(0.17, 0.21, 0.26, c, { seg: 8 }),
    torus(0.13, 0.035, c, { ts: 16 }).rot(deg(90), 0, 0).at(0, 0.28, 0),
    cyl(0.06, 0.08, h, c, { seg: 10 }).at(0, 0.26, 0),
    torus(0.08, 0.028, c, { ts: 14 }).rot(deg(90), 0, 0).at(0, 0.26 + h * 0.55, 0),
    box(0.58, 0.05, 0.05, c).at(0, 0.26 + h - 0.32, 0),
    lampHead(lit, o.I).sc(o.head ?? 1.1).at(0, 0.26 + h, 0),
  );
  if (lit && o.pool !== false) g.add(pool(o.poolR ?? 1.25));
  return g;
}

// --- houses: K.house gives walls, roof, door, chimney; windows and shutters are ours
function win(lit, shutters) {
  const g = grp(
    grp(box(0.4, 0.46, 0.05, G.fog), box(0.3, 0.34, 0.06, lit ? LIT : DARKGLASS).at(0, 0.06, 0)).weld(),
    box(0.025, 0.34, 0.07, G.fog).at(0, 0.06, 0).noInk(), box(0.3, 0.025, 0.07, G.fog).at(0, 0.21, 0).noInk(),
    box(0.5, 0.05, 0.12, G.stone).at(0, -0.04, 0.03),
  );
  if (shutters && lit) [-1, 1].forEach((s) => g.add(box(0.17, 0.46, 0.04, shutterMat).rot(0, s * deg(-35), 0).at(s * 0.3, 0, 0.06)));
  if (shutters && !lit) [-1, 1].forEach((s) => g.add(box(0.2, 0.46, 0.04, shutterMat).at(s * 0.1, 0, 0.05)));
  return g;
}
function townHouse(o = {}) {
  const c = Object.assign({ w: 1.7, d: 1.3, fh: 1.0, floors: 2, wall: G.pall, roof: G.slate, door: G.dark, trim: G.fog, awake: false, chimney: true, roofH: 0.75, base: G.stone, lit: null, doorLit: false }, o);
  const H = c.fh * c.floors;
  const g = K.house({ w: c.w, d: c.d, h: H, floors: 1, wall: c.wall, roof: c.roof, roofH: c.roofH, door: c.door, trim: c.trim, windows: 0, chimney: c.chimney, base: c.base });
  const fz = c.d / 2 + 0.005, isLit = (f, i) => (c.lit ? c.lit(f, i) : c.awake);
  const gx = c.w >= 1.5 ? [-(c.w / 2 - 0.3), c.w / 2 - 0.3] : [c.w / 2 - 0.28];
  gx.forEach((x, i) => g.add(win(isLit(0, i), false).at(x, 0.14 + c.fh * 0.3, fz)));
  for (let f = 1; f < c.floors; f++) {
    const n = c.w >= 2.1 ? 3 : 2;
    for (let i = 0; i < n; i++) g.add(win(isLit(f, i), true).at((i - (n - 1) / 2) * (c.w / n) * 1.02, 0.14 + f * c.fh + c.fh * 0.26, fz));
  }
  if (c.doorLit) {
    g.add(box(0.4, 0.83, 0.02, LIT).at(0, 0.15, c.d / 2 + 0.045));
    g.add(grp(box(0.4, 0.83, 0.05, c.door).at(0.2, 0, 0)).rot(0, deg(-70), 0).at(-0.21, 0.15, c.d / 2 + 0.07));
    g.add(lampLight(1.2, 1.8).at(0, 0.5, c.d / 2 + 0.35), pool(0.55).at(0, 0.012, c.d / 2 + 0.4));
  }
  if (c.sign) g.add(K.sign(c.sign, { w: Math.min(c.w * 0.7, 1.1), h: 0.24, bg: G.chalk, fg: G.night, frame: G.slate }).at(0, 1.03, c.d / 2 + 0.04));
  return g;
}
function smoke(seed = 2) { const r = rng(seed); return grp(...[0, 1, 2].map((i) => sph(0.12 + i * 0.06, G.pall, { seg: 12 }).at((r() - 0.3) * 0.15 + i * 0.1, i * 0.22, 0))).weld().noShadow(); }

// --- people
function lamplighter(o = {}) {
  const p = K.person({ skin: G.pall, hair: G.slate, top: G.stone, bottom: G.slate, shoes: G.night, hat: 'cap', hatColor: G.slate, acc: ['scarf'], accColor: G.chalk, pose: 'stand', held: handLantern(true).at(0, -0.36, 0.02) });
  p.add(cyl(0.3, 0.37, 0.52, G.stone, { seg: 20 }).sc(1, 1, 0.86).at(0, 0.16, 0));
  [0.6, 0.73].forEach((y) => p.add(sph(0.026, G.chalk, { seg: 8 }).at(-0.05, y, 0.255)));
  const ph = o.poleH ?? 2.3, pole = grp(
    cyl(0.022, 0.022, ph, G.mid, { seg: 8 }),
    cyl(0.032, 0.026, 0.12, G.slate, { seg: 8 }).at(0, ph - 0.04, 0),
    torus(0.07, 0.014, G.slate, { arc: Math.PI * 1.2, ts: 12 }).rot(0, 0, deg(-20)).at(0.07, ph + 0.08, 0),
    sph(0.055, LIT, { seg: 10 }).sc(1, 1.5, 1).at(0, ph + 0.12, 0),
  ).at(-0.42, 0.04, 0.07);
  if (o.pole !== false) p.add(pole);
  return p;
}
function baker() {
  const tray = grp(box(0.66, 0.035, 0.38, G.stone), loaf().at(-0.2, 0.035, -0.05), loaf().at(0.0, 0.035, 0.08), loaf().at(-0.05, 0.035, -0.1).rot(0, deg(20), 0));
  return K.person({ body: 'round', skin: G.fog, hair: G.mid, hairStyle: 'short', acc: ['moustache'], beardColor: G.mid, top: G.stone, apron: G.chalk, hat: 'chef', hatColor: G.chalk, bottom: G.dark, shoes: G.night, pose: 'carry', held: tray });
}
function harbourmaster() {
  const book = grp(box(0.34, 0.05, 0.26, G.slate), box(0.32, 0.03, 0.24, G.chalk).at(0, 0.05, 0), box(0.01, 0.031, 0.24, G.stone).at(0, 0.051, 0).noInk()).rot(deg(-25), 0, 0);
  const p = K.person({ body: 'tall', skin: G.mid, hair: G.chalk, hairStyle: 'short', acc: ['beard'], beardColor: G.chalk, hat: 'captain', hatColor: G.slate, top: G.slate, bottom: G.dark, shoes: G.night, pose: 'hold', held: book });
  [-1, 1].forEach((s) => [0.62, 0.76, 0.9].forEach((y) => p.add(sph(0.024, G.fog, { seg: 8 }).at(s * 0.09, y, 0.245))));
  p.add(cyl(0.3, 0.36, 0.42, G.slate, { seg: 20 }).sc(1, 1, 0.86).at(0, 0.24, 0));
  const head = p.children.find((x) => x.isGroup && x.position.y > 1.2); head?.children.at(-1).noShadow();
  return p;
}
function strayCat() {
  const c = grp(K.cat({ color: G.stone, belly: G.chalk }).sc(1.45)).rot(0, deg(-28), 0);
  const lan = handLantern(true).sc(1.1).at(0.42, 0, 0.3);
  return grp(c.at(-0.05, 0, -0.12), lan.at(0.45, 0, 0.22), lampLight(1.6, 1.6).at(0.45, 0.25, 0.22));
}

// --- vehicles / structures
function handcart() {
  const g = grp();
  g.add(box(1.4, 0.07, 0.8, planks(5, true, G.pall)).at(0, 0.6, 0));
  [-1, 1].forEach((s) => g.add(box(1.4, 0.26, 0.05, planks(3, false, G.mid)).at(0, 0.67, s * 0.4)));
  g.add(box(0.05, 0.26, 0.8, G.mid).at(-0.7, 0.67, 0), box(0.05, 0.16, 0.8, G.mid).at(0.7, 0.67, 0));
  [-1, 1].forEach((s) => {
    g.add(spokeWheel(0.46, G.dark).at(-0.05, 0.47, s * 0.5));
    g.add(cyl(0.026, 0.026, 1.0, G.dark, { seg: 8 }).rot(0, 0, deg(-80)).at(0.68, 0.66, s * 0.3));
    g.add(cyl(0.03, 0.03, 0.62, G.dark, { seg: 8 }).at(0.55, 0, s * 0.32));
  });
  g.add(cyl(0.035, 0.035, 1.12, G.dark, { seg: 8 }).rot(deg(90), 0, 0).at(-0.05, 0.47, -0.56));
  // load
  [[-0.42, -0.18], [-0.42, 0.14], [-0.12, -0.2]].forEach(([x, z], i) => g.add(oilCan(i === 1 ? G.fog : G.mid).at(x, 0.67, z)));
  const panes = grp(crate(0.38, G.stone)); [-0.1, 0, 0.1].forEach((x) => panes.add(box(0.02, 0.26, 0.3, G.chalk).at(x, 0.3, 0)));
  g.add(panes.at(0.22, 0.67, 0.1));
  g.add(torus(0.1, 0.035, G.chalk, { ts: 16 }).rot(deg(90), 0, 0).at(0.2, 0.69, -0.24), torus(0.07, 0.03, G.chalk, { ts: 14 }).rot(deg(90), 0, 0).at(0.2, 0.75, -0.24));
  g.add(ladder(1.9, 0.34).rot(deg(90), 0, deg(-90)).at(-0.85, 1.08, 0.1));
  // lantern post at the front
  g.add(cyl(0.025, 0.025, 1.0, G.slate, { seg: 8 }).at(0.66, 0.6, 0.34), box(0.28, 0.025, 0.025, G.slate).at(0.78, 1.58, 0.34));
  g.add(handLantern(true).sc(0.95).at(0.88, 1.24, 0.34), lampLight(3, 2.6).at(0.88, 1.35, 0.34));
  g.add(K.sign('ROUND 1', { w: 0.42, h: 0.16, bg: G.slate, fg: G.chalk, frame: G.slate }).at(-0.47, 0.72, 0.43));
  return g;
}
function lighthouse(o = {}) {
  const g = grp(), r = rng(o.seed ?? 11);
  g.add(cyl(0.95, 1.15, 0.5, G.stone, { seg: 9 }).flat());
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2 + r(); g.add(K.rock(0.42 + r() * 0.25, i % 2 ? G.stone : G.mid, 20 + i).flat().at(Math.cos(a) * 1.2, -0.18, Math.sin(a) * 1.2)); }
  const pts = []; for (let i = 0; i <= 8; i++) pts.push([0.7 - (i / 8) * 0.2, (i / 8) * 3.0]);
  g.add(K.lathe(pts, texMat(tex.stripes({ colors: [G.chalk, G.dark], n: 6, vertical: false })), { seg: 28 }).at(0, 0.5, 0));
  g.add(box(0.36, 0.62, 0.1, G.slate).at(0, 0.5, 0.68), cyl(0.18, 0.18, 0.1, G.slate, { seg: 16, t0: -Math.PI / 2, tl: Math.PI }).rot(deg(-90), 0, 0).at(0, 1.12, 0.73));
  [1.6, 2.5].forEach((y) => g.add(box(0.16, 0.26, 0.08, G.slate).at(0, y, 0.68 - ((y - 0.5) / 3) * 0.2)));
  // gallery + lamp room
  const top = 3.5;
  g.add(cyl(0.78, 0.66, 0.12, G.slate, { seg: 28 }).at(0, top, 0));
  g.add(torus(0.76, 0.018, G.slate, { ts: 40 }).rot(deg(90), 0, 0).at(0, top + 0.42, 0));
  for (let i = 0; i < 14; i++) { const a = (i / 14) * Math.PI * 2; g.add(cyl(0.015, 0.015, 0.42, G.slate, { seg: 6 }).at(Math.cos(a) * 0.76, top + 0.02, Math.sin(a) * 0.76)); }
  g.add(cyl(0.44, 0.44, 0.1, G.slate, { seg: 20 }).at(0, top + 0.12, 0));
  g.add(cyl(0.38, 0.38, 0.6, LIT, { seg: 20 }).at(0, top + 0.2, 0));
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; g.add(box(0.04, 0.6, 0.04, G.slate).at(Math.cos(a) * 0.39, top + 0.2, Math.sin(a) * 0.39)); }
  g.add(cyl(0.48, 0.48, 0.06, G.slate, { seg: 24 }).at(0, top + 0.8, 0), sph(0.44, G.slate, { part: 'top', seg: 24 }).at(0, top + 0.84, 0), cyl(0.04, 0.06, 0.25, G.slate, { seg: 8 }).at(0, top + 1.2, 0), sph(0.08, G.slate, { seg: 10 }).at(0, top + 1.5, 0));
  g.add(lampLight(o.I ?? 14, 4).at(0, top + 0.5, 0));
  if (o.beam !== false) {
    const fade = tex.custom(8, 128, (x, w, h) => { const gr = x.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.8)'); gr.addColorStop(0.5, 'rgba(255,255,255,0.5)'); gr.addColorStop(0.97, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, w, h); });
    fade.wrapS = fade.wrapT = THREE.ClampToEdgeWrapping;
    const beam = cyl(0.12, o.beamR ?? 1.0, o.beamL ?? 5.5, K.glow(AMBER, { opacity: 0.99, depthWrite: false, map: fade }), { seg: 24, open: true, cast: false, receive: false }).rot(0, 0, deg(90)).at(o.beamL ?? 5.5, 0, 0).noInk();
    beam.userData.noFit = true;
    g.add(grp(beam).rot(0, o.beamYaw ?? deg(-35), deg(-4)).at(0, top + 0.5, 0));
  }
  return g;
}
function lighthouseBuild() {
  const g = grp(slab(4.6, 3.6, { map: sea([2, 1.5]), side: G.night, h: 0.35 }).at(0, -0.15, 0));
  g.add(lighthouse({ beamYaw: deg(150), beamL: 4.2 }).at(-0.4, -0.15, -0.2));
  const cot = townHouse({ w: 1.1, d: 0.9, fh: 0.85, floors: 1, wall: G.fog, roof: G.slate, roofH: 0.5, chimney: true, awake: true }).sc(0.85).rot(0, deg(-25), 0).at(1.25, 0.2, 0.55);
  g.add(cyl(0.9, 1.0, 0.36, G.stone, { seg: 9 }).flat().at(1.25, -0.15, 0.55), cot);
  return g;
}

// --- builds
function lampPair() {
  const g = grp(slab(4.6, 2.2, { map: cobbles([3, 1.4], 6), side: G.stone, h: 0.3 }));
  // a stretch of quay wall behind, so the light has something to land on
  g.add(box(4.6, 0.9, 0.35, texMat(tex.bricks({ base: G.mid, mortar: G.stone, rows: 5, cols: 14 }))).at(0, 0, -0.92), box(4.7, 0.08, 0.42, G.pall).at(0, 0.9, -0.92));
  g.add(streetLamp(false).at(-1.2, 0, -0.35), streetLamp(true, { poolR: 0.9 }).at(1.2, 0, -0.35));
  g.add(fogBank(1.7, 1.1, 0.62, 3).at(-1.5, 0, 0.4), fogBank(0.8, 0.6, 0.38, 4).at(-0.55, 0, 0.75), mist(2.2, 1.9).at(-1.2, 0.03, 0.05));
  g.add(ladder(2.2).rot(deg(-13), 0, 0).at(1.2, 0, 0.15));
  g.add(oilCan().at(0.6, 0, 0.6), oilCan(G.fog).at(0.4, 0, 0.82), K.bench(0.9, G.mid).at(1.6, 0, 0.55).rot(0, deg(-10), 0));
  return g;
}
function wokenHouseBuild() {
  const g = grp(slab(4.4, 2.8, { map: cobbles([3, 2], 9), side: G.stone, h: 0.3 }));
  g.add(townHouse({ w: 1.9, d: 1.4, fh: 1.05, wall: G.fog, awake: true, doorLit: true, sign: 'BAKERY' }).at(0.55, 0, -0.45));
  g.add(smoke(3).at(0.55 + 1.9 * 0.28, 3.5, -0.62));
  g.add(townHouse({ w: 1.3, d: 1.4, fh: 1.05, wall: G.stone, roof: G.dark, chimney: false }).at(-1.4, 0, -0.45));
  g.add(fogBank(1.8, 2.2, 1.2, 7).at(-1.55, 0, 0.1));
  g.add(oilCan().at(0.05, 0, 0.75), oilCan(G.fog).at(0.32, 0, 0.88), crate(0.36).rot(0, deg(15), 0).at(1.45, 0, 0.62));
  g.add(grp(box(0.5, 0.3, 0.32, G.stone), loaf().at(-0.1, 0.3, 0), loaf().at(0.05, 0.3, 0.05)).at(1.15, 0, 0.45));
  return g;
}

// --- key art: harbour street, three lamps lit, the pall eating the rest
function harbourStreet() {
  const g = grp();
  g.add(slab(12.4, 3.6, { map: cobbles([8, 2.3], 3), side: G.stone, h: 0.8 }).at(0, 0, -1.0));
  g.add(slab(12.4, 2.4, { map: sea([6, 1.2]), side: G.night, h: 0.35 }).at(0, -0.45, 2.0));
  g.add(box(12.4, 0.08, 0.28, G.mid).at(0, 0, 0.66));
  // houses
  const row = [
    { x: -5.3, w: 1.5, wall: G.mid, awake: true },
    { x: -3.55, w: 1.9, wall: G.fog, awake: true, doorLit: true, sign: 'BAKERY' },
    { x: -1.75, w: 1.6, wall: G.pall, awake: true, floors: 3 },
    { x: 0.05, w: 1.7, wall: G.mid, lit: (f, i) => f === 1 && i === 0 },
    { x: 1.95, w: 1.6, wall: G.pall, floors: 3 },
    { x: 3.8, w: 1.9, wall: G.mid },
    { x: 5.4, w: 1.3, wall: G.pall },
  ];
  row.forEach((h) => g.add(townHouse({ fh: 1.0, d: 1.3, ...h }).at(h.x, 0, -2.15)));
  g.add(smoke(5).at(-3.55 + 1.9 * 0.28, 3.4, -2.3));
  // lamps along the quay
  [-4.7, -2.3, 0.1].forEach((x) => g.add(streetLamp(true, { poolR: 0.78 }).at(x, 0, 0.0)));
  [2.6, 5.0].forEach((x) => g.add(streetLamp(false).at(x, 0, 0.0)));
  g.add(ladder(2.2).rot(deg(-12), 0, 0).at(0.1, 0, 0.42));
  // quay life
  [-3.4, -0.9, 1.6, 4.0].forEach((x) => g.add(bollard().at(x, 0, 0.62)));
  g.add(K.vehicle({ kind: 'boat', body: G.mid, trim: G.chalk, len: 1.6 }).rot(0, deg(8), 0).at(-3.2, -0.55, 1.85));
  g.add(K.vehicle({ kind: 'boat', body: G.fog, trim: G.dark, cabin: G.chalk, roof: G.slate, len: 2.2 }).rot(0, deg(-6), 0).at(-0.75, -0.55, 2.2));
  [-4.7, -2.3, 0.1].forEach((x) => g.add(reflection(0.55, 1.5).at(x + 0.05, -0.44, 1.65)));
  g.add(tube([[-3.4, 0.25, 0.62], [-3.3, -0.05, 1.1], [-3.0, -0.2, 1.5]], 0.018, G.chalk).noInk());
  g.add(crate().at(-5.7, 0, 0.1), crate(0.36, G.stone).rot(0, 0.3, 0).at(-5.7, 0.42, 0.1), K.barrel(0.55, G.stone).at(-5.2, 0, 0.35));
  g.add(K.bench(1.0, G.mid).at(-1.5, 0, -0.95));
  g.add(handcart().sc(0.9).rot(0, deg(-15), 0).at(-0.95, 0, -0.35));
  g.add(baker().sc(0.9).rot(0, deg(10), 0).at(-3.55, 0, -1.05));
  g.add(lamplighter().sc(0.95).rot(0, deg(12), 0).at(0.95, 0, -0.35));
  g.add(grp(K.cat({ color: G.mid, belly: G.chalk }).sc(0.8)).rot(0, deg(-40), 0).at(-4.35, 0, 0.35));
  // the pall
  g.add(mist(4.4, 3.4).at(4.0, 0.03, -1.0), mist(4.4, 2.2).at(4.0, -0.42, 2.0));
  g.add(fogBank(4.8, 3.6, 1.45, 21).at(4.0, 0, -1.6));
  g.add(fogBank(4.6, 2.4, 0.9, 22).at(4.1, -0.45, 2.0));
  g.add(fogBank(1.5, 2.6, 0.75, 23).at(2.0, 0, -0.2));
  g.add(fogBank(1.0, 1.8, 0.45, 24).at(1.6, -0.45, 1.9));
  return g;
}

// --- environment 1: the night round, a crossroads half lit, half in the pall
function nightRound() {
  const g = grp(slab(8, 8, { map: cobbles([5, 5], 7), side: G.stone, h: 0.5 }));
  [[-2.6, -2.6], [2.6, -2.6], [2.6, 2.6], [-2.6, 2.6]].forEach(([x, z]) => g.add(box(2.8, 0.1, 2.8, texMat(flags([2, 2]))).at(x, 0, z)));
  // back-left: woken
  g.add(townHouse({ w: 1.5, wall: G.fog, awake: true }).at(-3.15, 0.1, -3.2), townHouse({ w: 1.2, wall: G.mid, awake: true, floors: 3, chimney: false }).at(-1.8, 0.1, -3.2));
  g.add(townHouse({ w: 1.2, wall: G.pall, awake: true, doorLit: true }).rot(0, deg(90), 0).at(-3.4, 0.1, -1.85));
  // back-right + front-right: still asleep in the pall
  g.add(townHouse({ w: 1.6, wall: G.mid }).at(2.0, 0.1, -3.2), townHouse({ w: 1.2, wall: G.pall, floors: 3 }).at(3.4, 0.1, -3.2));
  g.add(townHouse({ w: 1.6, wall: G.mid }).rot(0, deg(-90), 0).at(3.3, 0.1, 2.2));
  // lamps at the crossing
  g.add(streetLamp(true, { poolR: 1.0 }).at(-1.6, 0.1, -1.6), streetLamp(true, { poolR: 1.0 }).at(-1.6, 0.1, 1.6));
  g.add(streetLamp(false).at(1.6, 0.1, -1.6), streetLamp(false).at(1.6, 0.1, 1.6));
  // the well
  g.add(grp(cyl(0.5, 0.55, 0.5, G.mid, { seg: 12 }).flat(), torus(0.47, 0.06, G.stone, { ts: 24 }).rot(deg(90), 0, 0).at(0, 0.5, 0), box(0.06, 1.1, 0.06, G.dark).at(-0.4, 0.5, 0), box(0.06, 1.1, 0.06, G.dark).at(0.4, 0.5, 0), K.prism(1.1, 0.35, 0.7, G.slate).at(0, 1.55, 0), cyl(0.05, 0.05, 0.8, G.stone).rot(0, 0, deg(90)).at(0.4, 1.3, 0)).at(-0.2, 0, -0.1));
  // front-left: a little square
  g.add(K.bench(1.0, G.mid).rot(0, deg(90), 0).at(-3.4, 0.1, 2.2), handcart().sc(0.85).rot(0, deg(20), 0).at(-2.6, 0.1, 2.9));
  g.add(K.pottedPlant(G.stone, G.dark, 1.3).at(-1.7, 0.1, 1.9), K.pottedPlant(G.stone, G.dark, 1.1).at(-3.6, 0.1, 3.5));
  g.add(K.cat({ color: G.stone, belly: G.chalk }).sc(0.7).rot(0, deg(150), 0).at(-1.1, 0.0, 0.6));
  g.add(lamplighter().rot(0, deg(-25), 0).at(0.35, 0, 1.05));
  // the pall
  g.add(mist(4.2, 7.6).at(1.9, 0.13, 0));
  g.add(fogBank(3.6, 4.2, 1.5, 31).at(2.4, 0.1, -2.0));
  g.add(fogBank(2.6, 3.4, 1.2, 32).at(2.7, 0.1, 2.2));
  g.add(fogBank(1.4, 5.0, 0.6, 33).at(1.05, 0, 0.2));
  return g;
}

// --- environment 2: the harbour seen from the lighthouse
function harbourView(o = {}) {
  const g = grp();
  g.add(slab(9, 7, { map: sea([4, 3]), side: G.night, h: 0.4 }).at(0, -0.4, 0.4));
  g.add(slab(9, 1.9, { map: cobbles([6, 1.2], 12), side: G.stone, h: 0.8 }).at(0, 0, -3.95));
  g.add(slab(1.6, 5.1, { map: cobbles([1, 3.4], 13), side: G.stone, h: 0.8 }).at(-3.7, 0, -0.45));
  // houses on the back quay
  const xs = [-3.7, -2.15, -0.6, 1.0, 2.6, 3.9];
  xs.forEach((x, i) => g.add(townHouse({ w: i === 5 ? 1.1 : 1.45, d: 1.1, fh: 0.9, floors: i % 2 ? 3 : 2, wall: [G.fog, G.mid, G.pall][i % 3], awake: i < 3, lit: i === 2 ? (f, j) => f > 0 && j === 0 : null, chimney: i % 2 === 0 }).at(x, 0, -4.25)));
  // lamps
  if (o.lamps !== false) [[-2.9, -3.55], [-1.0, -3.55], [-3.7, -1.3], [-3.7, 0.9]].forEach(([x, z]) => g.add(streetLamp(true, { h: 1.7, I: 11, poolR: 0.55 }).at(x, 0, z)));
  [[1.0, -3.55], [3.0, -3.55]].forEach(([x, z]) => g.add(streetLamp(false, { h: 1.7 }).at(x, 0, z)));
  // boats
  g.add(K.vehicle({ kind: 'boat', body: G.mid, trim: G.chalk, len: 1.6 }).rot(0, deg(90), 0).at(-2.3, -0.55, 0.0));
  g.add(K.vehicle({ kind: 'boat', body: G.fog, trim: G.dark, cabin: G.chalk, roof: G.slate, len: 2.2 }).rot(0, deg(20), 0).at(-0.9, -0.55, -1.6));
  g.add(K.vehicle({ kind: 'boat', body: G.stone, trim: G.chalk, mast: true, sail: G.fog }).rot(0, deg(-30), 0).at(1.6, -0.55, -1.4));
  // breakwater + lighthouse
  const r = rng(41);
  for (let i = 0; i < 12; i++) { const t = i / 11, x = 4.2 - t * 1.6, z = -2.6 + t * 5.0; g.add(K.rock(0.45 + r() * 0.2, i % 2 ? G.stone : G.mid, 50 + i).flat().at(x, -0.55, z)); }
  if (o.lh !== false) g.add(lighthouse({ beam: o.beam, beamYaw: deg(192), beamL: 6, beamR: 1.3, I: 10 }).sc(0.85).at(2.4, -0.45, 2.9));
  // the pall
  g.add(mist(3.6, 4.4).at(2.6, -0.37, -1.0));
  g.add(fogBank(4.2, 2.6, 1.5, 61).at(2.6, 0, -3.9));
  g.add(fogBank(2.8, 4.0, 0.8, 62).at(2.6, -0.4, -0.6));
  g.add(fogBank(1.4, 2.0, 0.5, 63).at(0.8, -0.4, -2.4));
  return g;
}

export default {
  slug: 'pall',
  title: 'Pall',
  logline: 'A grey fog has settled on the harbour town. Relight the lamps and the colour comes back with them.',
  genre: ['Casual incremental', 'Restoration', 'Hands-on'],
  theme: { accent: AMBER, accentInk: P.g0, cardBg: '#d5d2cd', plinth: P.g4, plinthRim: P.g2 },
  mode: { mono: true, accent: AMBER, accentName: 'Lamplight amber', rule: 'light: lamps, lit windows and anything you have saved' },
  pitch: 'You are the town\'s last lamplighter. Each night you walk your round, clean, mend and relight the lamps. Every lit lamp pushes the pall back. Houses inside the light wake up, open their shutters and give you oil and parts. You light every lamp yourself, but the round keeps growing.',
  loop: ['Trim the wick, fill the oil, strike the match', 'The light pushes the pall back', 'Woken houses give oil and parts', 'Upgrade the lantern, lengthen the round'],
  why: ['One warm colour in a grey world shows your progress in a single still frame.', 'Ink outlines keep grey shapes apart, even deep in the fog.', 'Night scenes stay readable: dark stone, pale fog and amber light never blur together.'],
  fromYou: 'Your own Pall idea ("physically see the black… slowly receding"), kept casual with no minigames. Mixed with Frostpunk\'s heat radius and the safe place that pushes back the dark.',
  similar: [
    { name: 'GRIS', url: 'https://store.steampowered.com/app/683320', note: 'colour comes back as you progress' },
    { name: 'TOEM', url: 'https://store.steampowered.com/app/1307580', note: 'black and white, hand-made, gentle pace' },
    { name: 'Bleak Sword DX', url: 'https://store.steampowered.com/app/2193050', note: 'monochrome dioramas with one accent colour' },
    { name: 'Frostpunk', url: 'https://store.steampowered.com/app/323190', note: 'a warm circle you keep pushing outwards' },
  ],
  palette: [['Night', P.g0], ['Slate roof', P.g1], ['Harbour stone', P.g3], ['Pall', P.g5], ['Fog', P.g7], ['Lamplight amber', AMBER]],
  key: { build: safe(() => lift(harbourStreet())), bg: NIGHT.bg, light: 'night', cam: { yaw: -18, pitch: 22, fov: 24 }, caption: 'Quay Street, three lamps lit' },
  characters: [
    { name: 'The lamplighter', role: 'You. Pole, ladder, one lantern and a very long round.', build: safe(() => lamplighter({ poleH: 1.95 })) },
    { name: 'Bryn the baker', role: 'Up before anyone. First house to wake.', build: safe(baker) },
    { name: 'The harbourmaster', role: 'Keeps the ledger of every lamp still dark.', build: safe(harbourmaster) },
    { name: 'Wick', role: 'Stray cat. Sleeps in whichever pool of light you made last.', build: safe(strayCat) },
  ],
  builds: [
    { name: 'Street lamp', tag: 'Structure', note: 'Before and after: cracked and cold, then trimmed, filled and lit.', build: safe(() => lift(lampPair())), stage: DUSKCARD, cam: { yaw: -16, pitch: 14 } },
    { name: 'The lighthouse', tag: 'Building', note: 'The last lamp on the round. Its beam pushes the pall off the sea.', build: safe(() => lift(lighthouseBuild())), stage: DUSKCARD, cam: { yaw: -30, pitch: 14 } },
    { name: 'A woken house', tag: 'Building', note: 'Shutters open, windows glowing. The bakery wakes first.', build: safe(() => lift(wokenHouseBuild())), stage: DUSKCARD, cam: { yaw: -22, pitch: 16 } },
    { name: 'Lamplighter\'s handcart', tag: 'Vehicle', note: 'Oil cans, wicks, spare glass and the ladder.', build: safe(() => lift(grp(slab(3.0, 1.9, { map: cobbles([2, 1.3], 8), side: G.stone, h: 0.25 }), handcart().rot(0, deg(-15), 0).at(-0.45, 0, -0.05), oilCan().at(-1.2, 0, 0.6), crate(0.36).rot(0, 0.4, 0).at(1.1, 0, -0.55)))), stage: DUSKCARD, cam: { yaw: -30, pitch: 26 } },
  ],
  environments: [
    { name: 'The night round', note: 'Half the crossing lit, half still in the pall. Next lamp: the dark one.', build: safe(() => lift(nightRound())), stage: NIGHT, cam: { yaw: -40, pitch: 34 } },
    { name: 'The harbour from the lighthouse', note: 'The final lamp. Its beam sweeps the basin and the fog gives way.', build: safe(() => lift(harbourView())), stage: NIGHT, cam: { yaw: 28, pitch: 34 } },
  ],
};
