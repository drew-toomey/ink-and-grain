// Fathom Nook — board 11. Cosy underwater exploration: a sea-floor cabin, reef lamps that bring the colour back, a sketchbook.
// Every build() returns a fresh Object3D. Front faces +Z.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng, glow } = K;

// --- local palette: warm things you own, cool water around them
const C = {
  sand: '#ecd9ae', sandDk: '#cdb27c', sandNight: '#6f86a0', sandNightDk: '#4b6079',
  lamp: '#f2b844', lampLt: '#ffe6a0', suit: '#e2703a', suitDk: '#3a5068', brass: '#c9973f', copper: '#5fa08a', copperDk: '#3f7d6c',
  cream: '#f1e6cc', wood: '#b07a4a', woodDk: '#6e4a30', red: '#c8402e', sub: '#f0b235',
  kelp: '#5f8f4e', kelpDk: '#47703f', kelpLt: '#8fb262', pale: '#d2cabb', paleDk: '#b4ac9e',
  coral: '#ef7a5a', pink: '#ec8fab', lilac: '#a99bd0', teal: '#3e8d70', seal: '#9aa3a8', sealDk: '#6f787e', octo: '#e48a7a',
  far1: '#8fcbc8', far2: '#6fb5b6', far3: '#58a3a8',
};
const SHALLOWS = [[0, '#c9ece2'], [0.4, '#8fd0c8'], [0.75, '#55a9ad'], [1, '#2f7f8d']];
const DEEP = [[0, '#27496b'], [0.55, '#1c3554'], [1, '#14263f']];

// --- helpers
const nofit = (o) => { o.traverse((m) => { if (m.isMesh) m.userData.noFit = true; }); return o; };
const soft = (m) => { m.castShadow = m.receiveShadow = false; m.userData.noInk = true; m.userData.noFit = true; return m; };
const shine = (r, c = C.lampLt, op = 0.3) => sph(r, glow(c, { opacity: op, depthWrite: false }), { seg: 18 }).noInk().noShadow();
const plight = (x, y, z, i = 3, d = 3, c = '#ffcf70') => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(x, y, z); return l; };
const pool = (r, op = 0.3, c = C.lamp) => cyl(r, r, 0.012, glow(c, { opacity: op, depthWrite: false }), { seg: 36 }).noInk().noShadow();
const flat = (pts, c, d = 0.04) => extrude(pts, d, glow(c)).noInk().noShadow();
/** Sea-floor slab: speckled sand on top, darker sand sides. */
const seabed = (w, d, o = {}) => K.ground(w, d, { map: tex.speckle({ base: o.base ?? C.sand, dots: [o.dot ?? C.sandDk, o.dot2 ?? '#f6e8c6'], n: 90, size: 4, seed: o.seed ?? 3, rep: [Math.max(1, w / 3), Math.max(1, d / 3)] }), side: o.side ?? C.sandDk, h: o.h ?? 0.45 });
/** Water haze: a flat see-through card that pushes whatever is behind it back into the blue. */
const haze = (w, h, c = '#6fb9b8', op = 0.3) => soft(new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color(c), transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide })));
/** Sun shafts from the surface: pale tilted strips, never inked. */
function shafts(xs, h = 7, z = -1.6, op = 0.11) {
  const g = grp();
  xs.forEach((x, i) => g.add(soft(new THREE.Mesh(new THREE.PlaneGeometry(0.5 + (i % 3) * 0.3, h).translate(0, h / 2, 0), new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff8dc'), transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide }))).rot(0, 0, deg(-16)).at(x, -0.2, z - (i % 2) * 0.5)));
  return g;
}
function bubbles(n = 6, seed = 1, h = 1.6, r0 = 0.035) {
  const r = rng(seed), g = grp();
  for (let i = 0; i < n; i++) g.add(sph(r0 * (0.6 + r() * 1.2), glow('#f4fffb', { opacity: 0.7 }), { seg: 10 }).at((r() - 0.5) * 0.22, (i / n) * h + r() * 0.1, (r() - 0.5) * 0.22));
  return g.noInk().noShadow();
}

// --- far layers (flat, unlit, no ink: the further away, the closer to the water colour)
function farReef(w, h, c, seed = 3) {
  const r = rng(seed), pts = [[-w / 2, 0]];
  for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.45) pts.push([x, h * (0.3 + 0.7 * r()) * (0.65 + 0.35 * Math.sin((x / w) * 7 + seed))]);
  pts.push([w / 2, 0]);
  return flat(pts, c);
}
const farKelp = (h, c) => flat([[-0.1, 0], [0.1, 0], [0.22, h * 0.3], [0.02, h * 0.55], [0.2, h * 0.8], [0, h], [-0.16, h * 0.78], [0.0, h * 0.55], [-0.2, h * 0.3]], c);
const farArch = (c) => flat([[-1.3, 0], [-1.1, 1.3], [-0.5, 1.9], [0.5, 2.0], [1.2, 1.4], [1.4, 0], [0.8, 0], [0.7, 0.9], [0.2, 1.3], [-0.4, 1.2], [-0.7, 0.7], [-0.75, 0]], c);
const farWhale = (c) => flat([[-2.2, 0.1], [-1.5, 0.55], [-0.3, 0.75], [0.9, 0.6], [1.7, 0.3], [2.3, 0.75], [2.5, 0.7], [2.25, 0.2], [2.5, -0.2], [2.3, -0.25], [1.7, 0.1], [0.6, -0.2], [-0.2, -0.3], [-0.5, -0.7], [-0.8, -0.3], [-1.6, -0.25]], c);

// --- sea life
function kelp(h = 2.4, seed = 1, o = {}) {
  const r = rng(seed), g = grp(), n = o.n ?? 3;
  for (let k = 0; k < n; k++) {
    const hh = h * (0.7 + r() * 0.4), bx = (r() - 0.5) * 0.35, bz = (r() - 0.5) * 0.3, sway = (r() - 0.5) * 0.5, pts = [];
    for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([bx + Math.sin(t * 4 + seed + k) * 0.09 + sway * t * t, t * hh, bz]); }
    g.add(tube(pts, 0.04, C.kelpDk, { segs: 20, rs: 6 }));
    for (let i = 1; i <= 6; i++) { const t = i / 6.4, p = pts[Math.min(6, Math.round(t * 6))], s = i % 2 ? 1 : -1; g.add(sph(0.16, i % 3 ? C.kelp : C.kelpLt, { seg: 10 }).sc(1.5, 0.55, 0.3).rot(0, 0, s * 0.55).at(p[0] + s * 0.14, t * hh, p[2])); }
  }
  return g.weld();
}
/** Coral. live=false gives the pale, sleeping version that sits outside the lamplight. */
function coral(kind = 'branch', col = C.coral, s = 1, live = true, seed = 2) {
  const c = live ? col : C.pale, c2 = live ? '#f6d77a' : C.paleDk, r = rng(seed), g = grp();
  if (kind === 'branch') {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + r(), l = 0.28 + r() * 0.22, t = 0.35 + r() * 0.3; g.add(grp(cap(0.045, l, c, { seg: 8 }), sph(0.06, c, { seg: 8 }).at(0, l + 0.08, 0)).rot(Math.cos(a) * t, 0, Math.sin(a) * t)); }
    g.add(cap(0.06, 0.4, c, { seg: 8 }));
  } else if (kind === 'brain') {
    g.add(sph(0.26, c, { seg: 16, part: 'top' }).sc(1.15, 0.8, 1), ...[0, 1, 2].map((i) => torus(0.1 + i * 0.06, 0.016, c2, { ts: 20 }).rot(deg(90), 0, 0).at(0, 0.2 - i * 0.065, 0).noInk()));
  } else if (kind === 'fan') {
    const pts = []; for (let i = 0; i <= 12; i++) { const a = deg(-70 + (i / 12) * 140); pts.push([Math.sin(a) * 0.4, 0.08 + Math.cos(a) * 0.42]); }
    g.add(extrude([[-0.03, 0], [0.03, 0], ...pts.reverse()], 0.03, c), cyl(0.03, 0.04, 0.12, c2, { seg: 6 }));
  } else { // tubes
    [[0, 0, 0.3], [0.13, 0.04, 0.22], [-0.12, 0.05, 0.19], [0.03, -0.12, 0.15]].forEach(([x, z, h]) => g.add(cyl(0.07, 0.05, h, c, { seg: 10 }).at(x, 0, z), cyl(0.045, 0.045, 0.012, c2, { seg: 10 }).at(x, h, z).noInk()));
  }
  return g.weld().sc(s);
}
const shell = (c = '#f4d9c4') => grp(sph(0.07, c, { seg: 10, part: 'top' }).sc(1.2, 0.7, 1), cone(0.03, 0.05, c, { seg: 5 }).rot(0, 0, deg(90)).at(-0.07, 0.01, 0)).weld();
const starfish = (c = C.coral) => { const g = grp(sph(0.05, c, { seg: 8 }).sc(1, 0.5, 1)); for (let i = 0; i < 5; i++) g.add(cone(0.035, 0.13, c, { seg: 5 }).rot(deg(90), 0, 0).rot(deg(90), (i / 5) * Math.PI * 2, 0, 'YXZ').at(0, 0.02, 0)); return g.weld(); };
const fishy = (c, f, s = 0.6) => grp(K.fish({ color: c, fin: f })).sc(s);
function school(n, seed, c, f, s = 0.42) { const r = rng(seed), g = grp(); for (let i = 0; i < n; i++) g.add(fishy(c, f, s * (0.8 + r() * 0.4)).at(i * 0.34 + r() * 0.1, (r() - 0.5) * 0.45, (r() - 0.5) * 0.5)); return g; }
function seal(s = 1) {
  const g = grp(cap(0.21, 0.5, C.seal, { seg: 14 }).rot(0, 0, deg(90)).at(0.42, 0.24, 0), cone(0.17, 0.5, C.seal, { seg: 12 }).rot(0, 0, deg(90)).sc(1, 0.8, 1).at(-0.42, 0.22, 0));
  g.add(sph(0.2, C.seal, { seg: 18 }).at(0.5, 0.4, 0), sph(0.1, '#c9cfd1', { seg: 12 }).sc(1.15, 0.8, 1.1).at(0.67, 0.35, 0), sph(0.035, P.ink, { seg: 8 }).at(0.77, 0.38, 0).noInk());
  [-1, 1].forEach((k) => {
    g.add(sph(0.03, P.ink, { seg: 8 }).at(0.64, 0.47, k * 0.1).noInk(), sph(0.13, C.sealDk, { seg: 10 }).sc(1.3, 0.25, 0.75).rot(0, k * 0.5, 0).at(0.22, 0.08, k * 0.24), sph(0.11, C.sealDk, { seg: 10 }).sc(1.5, 0.25, 0.6).rot(0, k * -0.5, 0).at(-0.92, 0.2, k * 0.09));
    g.add(tube([[0.7, 0.34, k * 0.06], [0.76, 0.33, k * 0.2]], 0.006, P.white, { segs: 2, rs: 4 }).noInk());
  });
  [[0.1, 0.42, 0.08], [-0.1, 0.4, -0.06], [0.28, 0.44, -0.05]].forEach(([x, y, z]) => g.add(sph(0.04, C.sealDk, { seg: 8 }).sc(1, 0.4, 1).at(x, y, z).noInk()));
  return grp(g.rot(0, deg(-90), 0)).sc(s);
}
/** Octopus who lives in a clay pot. */
function potOctopus() {
  const g = grp(lathe([[0.001, 0], [0.3, 0], [0.43, 0.26], [0.36, 0.5], [0.4, 0.54]], P.terracotta, { seg: 22 }));
  g.add(sph(0.3, C.octo, { seg: 20 }).sc(1, 1.15, 1).at(0, 0.72, 0));
  [-1, 1].forEach((k) => g.add(sph(0.075, P.white, { seg: 10 }).at(k * 0.12, 0.72, 0.25).noInk(), sph(0.035, P.ink, { seg: 8 }).at(k * 0.12, 0.72, 0.31).noInk()));
  g.add(torus(0.05, 0.012, P.ink, { arc: Math.PI, ts: 10 }).rot(0, 0, Math.PI).at(0, 0.6, 0.29).noInk());
  for (let i = 0; i < 6; i++) { const a = deg(-75 + i * 30 + (i > 2 ? 30 : 0)) + Math.PI / 2 * 0, ca = Math.sin(a), sa = Math.cos(a); g.add(tube([[ca * 0.2, 0.52, sa * 0.2], [ca * 0.42, 0.56, sa * 0.42], [ca * 0.52, 0.34, sa * 0.52], [ca * 0.5, 0.14, sa * 0.5], [ca * 0.6, 0.06, sa * 0.6]], 0.05, C.octo, { segs: 14, rs: 7 })); }
  g.add(shell('#f6d77a').at(0.62, 0, 0.42), shell().rot(0, 1, 0).at(-0.6, 0, 0.45), starfish().at(0.25, 0, 0.72));
  return g;
}
function jelly(s = 1, c = '#c9b8f0') {
  const g = grp(sph(0.2, glow(c, { opacity: 0.85 }), { seg: 14, part: 'top' }).sc(1, 0.8, 1));
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2; g.add(tube([[Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1], [Math.cos(a) * 0.13, -0.18, Math.sin(a) * 0.13], [Math.cos(a) * 0.08, -0.4, Math.sin(a) * 0.08]], 0.012, glow(c, { opacity: 0.7 }), { segs: 6, rs: 4 })); }
  g.add(shine(0.34, c, 0.22).at(0, 0.02, 0));
  return g.noInk().noShadow().sc(s);
}

// --- props
/** Reef lamp: the thing you plant. Warm pool on the sand, colour comes back inside it. */
function reefLamp(o = {}) {
  const h = o.h ?? 1.5, g = grp(cyl(0.2, 0.26, 0.14, P.stone, { seg: 10 }), cyl(0.045, 0.055, h, C.woodDk, { seg: 8 }).at(0, 0.1, 0), torus(0.07, 0.02, C.brass, { ts: 14 }).rot(deg(90), 0, 0).at(0, h * 0.5, 0));
  g.add(grp(K.lantern(C.brass, C.lampLt).sc(1.25)).at(0, h + 0.08, 0), shine(0.42, C.lampLt, o.shine ?? 0.28).at(0, h + 0.26, 0));
  if (o.light !== false) g.add(plight(0, h * 0.7, 0.5, o.li ?? 2.2, o.reach ?? 3.2));
  if (o.pool !== false) g.add(pool(o.r ?? 1.25, o.poolOp ?? 0.26).at(0, 0.004, 0));
  return g;
}
function sketchbook(open = false) {
  if (!open) return grp(rbox(0.3, 0.38, 0.05, C.red, { r: 0.015 }), box(0.27, 0.35, 0.03, P.paper).at(0.012, 0.015, 0.02), box(0.02, 0.38, 0.055, C.woodDk).at(-0.145, 0, 0));
  const page = (side) => texMat(tex.custom(256, 320, (x, w, h) => {
    x.fillStyle = '#fbf5e8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#3b2a20'; x.lineWidth = 6; x.lineCap = 'round';
    if (side < 0) { // sketched fish + notes
      x.beginPath(); x.ellipse(118, 110, 70, 38, 0, 0, 7); x.stroke(); x.beginPath(); x.moveTo(186, 110); x.lineTo(232, 76); x.lineTo(232, 144); x.closePath(); x.stroke();
      x.fillStyle = '#3b2a20'; x.beginPath(); x.arc(76, 100, 7, 0, 7); x.fill(); x.fillStyle = '#ef7a5a'; x.globalAlpha = 0.55; x.beginPath(); x.ellipse(118, 110, 60, 28, 0, 0, 7); x.fill(); x.globalAlpha = 1;
      x.lineWidth = 5; [200, 232, 264].forEach((y, i) => { x.beginPath(); x.moveTo(30, y); x.lineTo(210 - i * 40, y); x.stroke(); });
    } else { // tick list of things seen
      [50, 110, 170, 230].forEach((y, i) => { x.strokeRect(30, y, 34, 34); if (i < 3) { x.strokeStyle = '#c8402e'; x.beginPath(); x.moveTo(36, y + 18); x.lineTo(46, y + 28); x.lineTo(62, y + 4); x.stroke(); x.strokeStyle = '#3b2a20'; } x.beginPath(); x.moveTo(84, y + 18); x.lineTo(220 - i * 22, y + 18); x.stroke(); });
    }
  }));
  const g = grp(box(0.74, 0.02, 0.5, C.red));
  [-1, 1].forEach((k) => { const m = box(0.34, 0.03, 0.44, [K.mat(P.paper), K.mat(P.paper), page(k), K.mat(P.paper), K.mat(P.paper), K.mat(P.paper)]); m.material.forEach((t) => t.map && (t.map.wrapS = t.map.wrapT = THREE.ClampToEdgeWrapping)); g.add(m.rot(0, 0, k * -0.06).at(k * 0.18, 0.02, 0)); });
  return g;
}
const flask = () => grp(cyl(0.08, 0.08, 0.3, C.red, { seg: 14 }), cyl(0.085, 0.085, 0.05, C.cream, { seg: 14 }).at(0, 0.14, 0), cyl(0.06, 0.07, 0.09, P.steel, { seg: 12 }).at(0, 0.3, 0));
const mug = (c = C.copper) => grp(cyl(0.07, 0.06, 0.12, c, { seg: 14 }), torus(0.04, 0.014, c, { ts: 12 }).at(0.085, 0.065, 0), cyl(0.058, 0.058, 0.01, '#8a5a3a', { seg: 12 }).at(0, 0.115, 0).noInk());
const basket = () => grp(lathe([[0.001, 0], [0.16, 0], [0.22, 0.2], [0.23, 0.22]], texMat(tex.grid({ bg: '#d9b77c', line: C.woodDk, cells: 6, lw: 8 })), { seg: 14 }), torus(0.2, 0.018, C.woodDk, { arc: Math.PI, ts: 16 }).at(0, 0.2, 0), shell().at(0.03, 0.1, 0.02), shell('#f6d77a').rot(0, 2, 0).at(-0.06, 0.12, -0.03));
/** The logbook corner: your quest log, as things on a table. */
function logbookBench() {
  const g = grp(seabed(2.6, 2.0, { h: 0.3 }));
  g.add(box(1.5, 0.08, 0.9, texMat(tex.planks({ base: C.wood, line: C.woodDk, n: 5 }))).at(0, 0.5, 0), ...[[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].map(([x, z]) => cyl(0.05, 0.06, 0.5, C.woodDk, { seg: 8 }).at(x, 0, z)));
  g.add(sketchbook(true).rot(0, deg(-8), 0).at(-0.12, 0.58, 0.08));
  g.add(cyl(0.014, 0.014, 0.3, C.lamp, { seg: 6 }).rot(deg(90), deg(30), 0, 'YXZ').at(0.34, 0.6, 0.3), flask().at(0.56, 0.58, -0.22), mug().at(0.38, 0.58, -0.05));
  g.add(grp(cyl(0.09, 0.09, 0.2, glow('#d8f2ee', { opacity: 0.45 }), { seg: 14 }), cyl(0.095, 0.095, 0.03, C.wood, { seg: 14 }).at(0, 0.2, 0), shell('#f6d77a').sc(0.9).at(0, 0.02, 0)).at(-0.6, 0.58, -0.25));
  g.add(grp(K.lantern(C.brass, C.lampLt)).at(0.05, 0.58, -0.3), shine(0.3, C.lampLt, 0.25).at(0.05, 0.75, -0.3), plight(0.05, 1.0, 0.1, 1.6, 2.2));
  g.add(starfish().at(-0.5, 0.58, 0.3), box(0.55, 0.36, 0.45, texMat(tex.planks({ base: C.wood, line: C.woodDk, n: 3 }))).at(1.0, 0, 0.5), coral('tubes', C.pink, 0.9).at(-1.05, 0, 0.55), shell().at(0.6, 0, 0.8));
  return g;
}

// --- people
function helmet(p, lit = true) {
  const hr = 0.34, hy = 1.06 + hr * 0.92;
  p.add(sph(0.47, K.mat('#e4f6f3', { opacity: 0.2 }), { seg: 24 }).at(0, hy + 0.02, 0.02), torus(0.3, 0.065, C.brass, { ts: 26 }).rot(deg(90), 0, 0).at(0, 1.05, 0));
  p.add(cyl(0.07, 0.07, 0.07, C.brass, { seg: 12 }).at(0, hy + 0.45, 0), cyl(0.05, 0.05, 0.03, glow(lit ? C.lampLt : '#e9e2cf'), { seg: 12 }).at(0, hy + 0.52, 0));
  return p;
}
function diver(o = {}) {
  const p = K.person({ hairStyle: 'bob', hair: P.hairAuburn, skin: P.skin2, top: C.suit, bottom: C.suitDk, shoes: C.sub, pose: o.pose ?? 'hold', held: o.held === undefined ? sketchbook().rot(deg(-20), 0, 0).at(0, -0.14, -0.06) : o.held });
  [-1, 1].forEach((k) => p.add(rbox(0.2, 0.045, 0.46, C.sub, { r: 0.02 }).at(k * 0.13, 0, 0.26)));
  p.add(cap(0.12, 0.34, C.cream, { seg: 12 }).at(0, 0.5, -0.36), box(0.26, 0.06, 0.05, C.woodDk).at(0, 0.7, -0.3), cyl(0.04, 0.04, 0.05, C.brass, { seg: 8 }).at(0, 1.07, -0.36));
  p.add(box(0.5, 0.07, 0.42, C.woodDk).at(0, 0.5, 0).noInk(), cyl(0.045, 0.045, 0.03, C.brass, { seg: 10 }).rot(deg(90), 0, 0).at(0, 0.52, 0.2));
  return helmet(p);
}
/** Swimming pose: tip the whole figure forward, one arm reaching ahead. */
const swimmer = () => { const p = diver({ pose: 'point', held: null }); p.add(bubbles(5, 4, 0.9, 0.03).at(0, 1.95, -0.1)); return grp(grp(p.at(0, -0.9, 0)).rot(deg(72), 0, 0)); };
const postie = () => K.person({ body: 'round', hairStyle: 'short', hair: P.hairGrey, skin: P.skin3, top: '#e9b93a', bottom: '#44536b', shoes: P.ink2, hat: 'captain', hatColor: P.navy, acc: ['moustache', 'satchel'], beardColor: P.hairGrey, pose: 'carry', held: grp(rbox(0.36, 0.26, 0.28, '#cfa56c', { r: 0.02 }), box(0.37, 0.05, 0.05, C.red).at(0, 0.1, 0.12), box(0.05, 0.27, 0.29, C.red).at(0, 0, 0)) });

// --- builds
/** The Nook: round timber-and-copper cabin on the sea floor. */
function nook(o = {}) {
  const g = grp(), R = 1.1, by = 0.4, H = 1.3;
  for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI * 2 + 0.3; g.add(cyl(0.09, 0.11, by + 0.05, C.woodDk, { seg: 8 }).at(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85)); }
  g.add(cyl(R + 0.08, R + 0.08, 0.1, C.woodDk, { seg: 32 }).at(0, by - 0.05, 0));
  g.add(cyl(R, R, H, texMat(tex.planks({ base: C.cream, line: '#cdb893', n: 22, vertical: true })), { seg: 32 }).at(0, by, 0));
  g.add(torus(R + 0.02, 0.05, C.brass, { ts: 40 }).rot(deg(90), 0, 0).at(0, by + H, 0), torus(R + 0.02, 0.04, C.brass, { ts: 40 }).rot(deg(90), 0, 0).at(0, by + 0.12, 0));
  g.add(sph(R + 0.1, C.copper, { seg: 32, part: 'top' }).sc(1, 0.62, 1).at(0, by + H, 0));
  for (let i = 0; i < 8; i++) g.add(torus(R + 0.11, 0.022, C.copperDk, { arc: Math.PI / 2, ts: 14 }).sc(1, 0.62, 1).rot(0, (i / 8) * Math.PI * 2, 0).at(0, by + H, 0).noInk());
  // roof lamp
  const ry = by + H + (R + 0.1) * 0.62;
  g.add(cyl(0.14, 0.18, 0.1, C.brass, { seg: 14 }).at(0, ry - 0.03, 0), grp(K.lantern(C.brass, C.lampLt).sc(1.3)).at(0, ry + 0.06, 0), shine(0.5, C.lampLt, 0.26).at(0, ry + 0.26, 0));
  // portholes
  const port = (a, y, r = 0.25) => grp(cyl(r, r, 0.09, C.brass, { seg: 20 }).rot(deg(90), 0, 0), cyl(r * 0.76, r * 0.76, 0.1, glow('#ffd47e'), { seg: 20 }).rot(deg(90), 0, 0), box(r * 1.5, 0.025, 0.11, C.brass).at(0, -0.012, 0.05), box(0.025, r * 1.5, 0.11, C.brass).at(0, -r * 0.75, 0.05)).at(Math.sin(a) * (R - 0.03), y, Math.cos(a) * (R - 0.03)).rot(0, a, 0);
  g.add(port(deg(28), by + 0.85), port(deg(75), by + 0.85, 0.2), port(deg(-80), by + 0.85, 0.2));
  // airlock door with a wheel, and a name board
  const da = deg(-22);
  g.add(grp(cyl(0.42, 0.42, 0.08, C.brass, { seg: 24 }).rot(deg(90), 0, 0), cyl(0.36, 0.36, 0.1, P.teal, { seg: 24 }).rot(deg(90), 0, 0), torus(0.15, 0.025, C.brass, { ts: 18 }).at(0, 0, 0.13), box(0.3, 0.025, 0.025, C.brass).at(0, -0.012, 0.12), box(0.025, 0.3, 0.025, C.brass).at(0, -0.15, 0.12), K.sign('THE NOOK', { w: 0.8, h: 0.22, bg: C.cream, fg: C.woodDk, frame: C.woodDk }).at(0, 0.46, 0.04)).at(Math.sin(da) * (R - 0.02), by + 0.5, Math.cos(da) * (R - 0.02)).rot(0, da, 0));
  g.add(grp(box(0.6, 0.06, 0.4, C.wood).at(0, by - 0.08, 0.22), box(0.6, 0.06, 0.4, C.wood).at(0, by - 0.26, 0.5)).at(Math.sin(da) * R, 0, Math.cos(da) * R).rot(0, da, 0));
  // stove pipe with bubbles
  g.add(tube([[0.55, by + H + 0.45, -0.45], [0.55, by + H + 1.0, -0.45], [0.7, by + H + 1.15, -0.45]], 0.07, C.copperDk, { segs: 14 }), torus(0.08, 0.025, C.brass, { ts: 12 }).rot(0, deg(90), deg(40)).at(0.72, by + H + 1.17, -0.45));
  if (o.bubbles !== false) g.add(nofit(bubbles(7, 3, 1.5, 0.045).at(0.8, by + H + 1.25, -0.45)));
  // bunting, kelp planter, parcel bucket on its rope
  g.add(K.bunting([[0, ry + 0.3, 0], [-0.9, by + H + 0.55, 0.75], [-1.75, 1.25, 1.25]], [C.red, C.sub, P.white, C.copper], 9), cyl(0.035, 0.04, 1.3, C.woodDk, { seg: 8 }).at(-1.75, 0, 1.25));
  g.add(grp(box(0.8, 0.22, 0.34, texMat(tex.planks({ base: C.wood, line: C.woodDk, n: 3 }))), box(0.72, 0.03, 0.26, '#6b4a34').at(0, 0.2, 0), kelp(0.8, 5, { n: 2 }).at(-0.2, 0.2, 0), kelp(0.6, 8, { n: 2 }).at(0.2, 0.2, 0)).rot(0, deg(55), 0).at(1.45, 0, 0.75));
  g.add(grp(lathe([[0.001, 0], [0.13, 0], [0.17, 0.24], [0.175, 0.26]], P.steel, { seg: 14 }), rbox(0.16, 0.12, 0.14, '#cfa56c', { r: 0.02 }).at(0, 0.18, 0)).at(1.5, 0, -0.75), nofit(tube([[1.5, 0.26, -0.75], [1.52, 2.6, -0.75], [1.56, 5.2, -0.75]], 0.012, C.woodDk, { segs: 6, rs: 5 }).noInk()));
  if (o.light !== false) g.add(plight(0.5, by + 0.9, 1.9, o.li ?? 2.0, 3.2), plight(0, ry + 0.6, 0.6, 1.6, 3.0));
  if (o.pool !== false) g.add(pool(2.3, o.poolOp ?? 0.2).at(0, 0.003, 0.25));
  return g;
}
/** The Puddle: a one-seat sub. Built nose toward +X. */
function sub(o = {}) {
  const g = grp(), y = 0.78;
  g.add(sph(0.6, C.sub, { seg: 26 }).sc(1.35, 1, 1).at(0, y, 0));
  g.add(torus(0.6, 0.035, C.red, { ts: 32 }).rot(0, deg(90), 0).sc(1, 1, 1).at(-0.22, y, 0).sc(0.94, 0.94, 0.94));
  // bubble nose
  g.add(sph(0.36, K.mat('#d6f1ee', { opacity: 0.4 }), { seg: 20 }).at(0.56, y + 0.05, 0), torus(0.36, 0.045, C.brass, { ts: 28 }).rot(0, deg(90), 0).at(0.5, y + 0.05, 0));
  // side portholes
  [-1, 1].forEach((k) => g.add(grp(cyl(0.16, 0.16, 0.06, C.brass, { seg: 16 }).rot(deg(90), 0, 0), cyl(0.115, 0.115, 0.07, glow('#ffd47e'), { seg: 16 }).rot(deg(90), 0, 0)).rot(0, k > 0 ? 0 : Math.PI, 0).at(-0.18, y + 0.12, k * 0.55)));
  g.add(K.sign('PUDDLE', { w: 0.46, h: 0.13, bg: C.cream, fg: C.red, frame: C.cream }).at(-0.3, y - 0.32, 0.52).rot(deg(-14), 0, 0));
  // hatch + periscope
  g.add(cyl(0.2, 0.24, 0.12, C.red, { seg: 18 }).at(-0.05, y + 0.56, 0), torus(0.1, 0.02, C.brass, { ts: 14 }).rot(deg(90), 0, 0).at(-0.05, y + 0.71, 0), tube([[-0.35, y + 0.5, 0], [-0.35, y + 0.95, 0], [-0.22, y + 0.98, 0]], 0.035, C.brass, { segs: 10 }));
  // tail: fins, prop, guard
  g.add(extrude([[0, 0], [-0.42, 0.34], [-0.42, 0.05]], 0.04, C.red).at(-0.55, y + 0.3, 0), extrude([[0, 0], [-0.42, -0.34], [-0.42, -0.05]], 0.04, C.red).at(-0.55, y - 0.3, 0));
  g.add(cyl(0.07, 0.1, 0.2, C.brass, { seg: 10 }).rot(0, 0, deg(90)).at(-0.76, y, 0), torus(0.24, 0.025, C.brass, { ts: 20 }).rot(0, deg(90), 0).at(-0.98, y, 0), ...[0, 1, 2].map((i) => grp(box(0.03, 0.2, 0.09, C.cream).at(0, 0.02, 0)).rot((i / 3) * Math.PI * 2 + 0.4, 0, 0).at(-0.98, y, 0)));
  // skids, lamp, basket
  [-1, 1].forEach((k) => g.add(tube([[-0.6, 0.1, k * 0.36], [0.55, 0.1, k * 0.36], [0.7, 0.2, k * 0.36]], 0.035, C.woodDk, { segs: 10 }), cyl(0.025, 0.025, 0.28, C.woodDk, { seg: 6 }).at(-0.35, 0.1, k * 0.36), cyl(0.025, 0.025, 0.28, C.woodDk, { seg: 6 }).at(0.3, 0.1, k * 0.36)));
  g.add(grp(cyl(0.1, 0.08, 0.12, C.brass, { seg: 12 }), cyl(0.085, 0.085, 0.02, glow(C.lampLt), { seg: 12 }).at(0, 0.12, 0)).rot(0, 0, deg(-90)).at(0.62, y - 0.42, 0), shine(0.26, C.lampLt, 0.3).at(0.8, y - 0.42, 0));
  if (o.beam) g.add(nofit(cone(0.7, 2.6, glow('#ffe9a8', { opacity: 0.1, depthWrite: false }), { seg: 20, open: true }).rot(0, 0, deg(96)).at(3.35, y - 0.7, 0).noInk().noShadow()), plight(1.9, 0.6, 0.3, 2, 3.5));
  g.add(basket().sc(0.9).at(0.2, y - 0.52, 0.5));
  return g;
}
function wreck() {
  const hull = '#b4c3c6', g = grp(sph(0.6, hull, { part: 'bottom', seg: 20 }).sc(1.9, 0.75, 0.85).at(0, 0.42, 0), torus(0.6, 0.045, C.cream, { ts: 30 }).rot(deg(90), 0, 0).sc(1.9, 0.85, 1).at(0, 0.42, 0));
  [-0.5, 0.25].forEach((x) => g.add(box(0.14, 0.04, 0.95, C.woodDk).at(x, 0.3, 0)));
  g.add(cyl(0.035, 0.045, 1.3, C.woodDk, { seg: 8 }).rot(0, 0, deg(-24)).at(0.55, 0.2, 0));
  return g.rot(0, 0, deg(-12));
}
const gardenBed = (seed = 1, cols = [C.kelpLt, C.pink, C.sub]) => { const g = grp(box(1.3, 0.2, 0.7, texMat(tex.planks({ base: C.wood, line: C.woodDk, n: 3 }))), box(1.2, 0.03, 0.6, '#6b4a34').at(0, 0.19, 0)); for (let i = 0; i < 4; i++) g.add(grp(cyl(0.012, 0.012, 0.16, C.kelpDk, { seg: 5 }), sph(0.07, cols[(i + seed) % cols.length], { seg: 8 }).sc(1, 0.6, 1).at(0, 0.17, 0)).at(-0.42 + i * 0.28, 0.2, (i % 2 ? 0.1 : -0.1))); return g; };

// --- scenes
function reefPatch(live = true, seed = 1) {
  const g = grp();
  [['brain', C.pink, 0, 0, 1.2], ['branch', C.coral, 0.45, -0.2, 1], ['fan', C.lilac, -0.42, -0.25, 1.1], ['tubes', C.sub, 0.28, 0.3, 0.9]].forEach(([k, c, x, z, s], i) => g.add(coral(k, c, s, live, seed + i).at(x, 0, z)));
  return g;
}
function keyScene() {
  const g = grp(seabed(12.5, 6.2, { seed: 4 }));
  const back = -2.95;
  g.add(nofit(grp(farReef(13, 2.3, C.far1, 4).at(0, 0, back), farArch(C.far1).sc(1.3).at(-3.6, 0, back + 0.05), ...[-5.6, -1.2, 2.9, 5.2].map((x, i) => farKelp(3.2 + (i % 2) * 0.9, C.far2).at(x, 0, back + 0.3)), farReef(12.5, 1.2, C.far3, 9).at(0.4, 0, back + 0.55), farWhale(C.far1).sc(0.8).at(3.4, 4.3, back))));
  g.add(haze(13.5, 7.5, '#7cc4c0', 0.22).at(0, -0.2, back + 0.42), haze(13.5, 2.2, '#58a3a8', 0.25).at(0, -0.2, back + 0.8), shafts([-5.2, -2.6, -0.4, 2.4, 4.6], 8, -2.0, 0.13));
  // home
  g.add(nook({ li: 2.4 }).at(1.5, 0, -0.9));
  // the lamp line leading out to the left: lit reef near home, pale reef past the last lamp
  g.add(reefLamp().at(-1.5, 0, 0.9), reefPatch(true, 2).at(-2.1, 0, 0.25), coral('branch', C.sub, 0.9, true, 8).at(-0.9, 0, 1.55), coral('fan', C.coral, 0.9, true, 3).at(-1.05, 0, 0.2));
  g.add(reefLamp({ h: 1.3 }).at(-3.9, 0, 1.6), reefPatch(true, 6).rot(0, 1.2, 0).at(-3.4, 0, 0.75), coral('tubes', C.lilac, 1, true, 4).at(-4.5, 0, 2.2));
  g.add(reefPatch(false, 9).at(-5.5, 0, 0.6), coral('branch', C.coral, 1, false, 5).at(-5.6, 0, 2.2), K.rock(0.5, P.stone, 4).at(-5.2, 0, -0.9));
  // kelp stands
  [[-4.7, -1.9, 3.4, 2], [-4.0, -2.3, 2.8, 5], [-5.6, -1.4, 2.6, 7], [4.9, -2.2, 3.6, 3], [5.6, -1.5, 2.9, 9], [-0.9, -2.4, 2.4, 11]].forEach(([x, z, h, s]) => g.add(kelp(h, s).at(x, 0, z)));
  // the Puddle parked on the right, the octopus pot, odds and ends
  g.add(sub().rot(0, deg(205), 0).at(4.5, 0, 0.7), reefLamp({ h: 1.2, r: 1.0 }).at(5.5, 0, 1.9), coral('brain', C.coral, 1, true, 7).at(5.0, 0, 2.5), coral('fan', C.pink, 1, true, 2).at(3.4, 0, 2.2));
  g.add(grp(potOctopus().sc(0.8)).rot(0, deg(-20), 0).at(0.5, 0, 2.2), K.rock(0.4, P.stone, 2).at(2.9, 0, 1.6), starfish().at(-2.7, 0, 2.3), shell().at(1.6, 0, 2.6), starfish(C.sub).at(3.9, 0, 2.7));
  // you, swimming home with the seal
  g.add(swimmer().sc(0.9).rot(0, deg(72), 0).at(-2.6, 2.25, 1.0), grp(seal(0.85)).rot(deg(-8), deg(78), 0).at(-4.1, 2.75, 0.6));
  g.add(school(5, 3, C.coral, C.sub).at(-0.9, 3.0, -0.4), school(4, 7, '#f6d77a', C.red, 0.36).rot(0, Math.PI, 0).at(4.6, 2.6, -0.2), fishy(P.blue, C.sub, 0.5).at(2.9, 1.0, 1.9));
  return g;
}
function kelpGarden() {
  const g = grp(seabed(7.6, 6, { seed: 7 }));
  const back = -2.85;
  g.add(nofit(grp(farReef(8, 1.8, C.far1, 2).at(0, 0, back), ...[-3.2, -1.4, 0.5, 2.6].map((x, i) => farKelp(3.4 + (i % 2), C.far2).at(x, 0, back + 0.3)))));
  g.add(haze(8.5, 7, '#7cc4c0', 0.22).at(0, -0.2, back + 0.45), shafts([-2.6, -0.3, 2.2], 7.5, -1.9, 0.14));
  [[-3.1, -2.0, 3.6, 1], [-2.2, -2.3, 3.0, 4], [-3.3, -0.6, 3.1, 6], [3.1, -2.1, 3.8, 3], [2.3, -2.4, 3.0, 8], [3.3, -0.5, 3.2, 10], [0.2, -2.5, 2.7, 12], [-3.2, 1.1, 2.4, 14], [3.3, 1.3, 2.5, 15]].forEach(([x, z, h, s]) => g.add(kelp(h, s).at(x, 0, z)));
  g.add(gardenBed(0).at(-1.2, 0, -0.6), gardenBed(1).at(0.6, 0, -0.9), gardenBed(2).rot(0, deg(12), 0).at(-0.9, 0, 0.9));
  g.add(reefLamp({ h: 1.4, r: 1.5 }).at(1.9, 0, 0.3), K.sign('KELP PLOT', { w: 0.6, h: 0.17, bg: C.cream, fg: C.kelpDk, frame: C.woodDk }).rot(0, deg(-12), 0).at(2.0, 0.55, 1.5), cyl(0.025, 0.03, 0.6, C.woodDk, { seg: 6 }).at(2.0, 0, 1.47));
  g.add(diver({ pose: 'carry', held: basket() }).rot(0, deg(20), 0).at(0.5, 0, 1.0), grp(seal(0.8)).rot(0, deg(-50), 0).at(-2.0, 0, 2.0));
  g.add(coral('brain', C.pink, 1, true, 3).at(2.7, 0, 2.3), coral('tubes', C.sub, 1, true, 5).at(-2.9, 0, 2.4), starfish().at(1.2, 0, 2.4), basket().at(-0.1, 0, 1.9));
  g.add(school(4, 5, C.coral, C.sub, 0.36).at(-1.6, 2.4, 0.2), fishy('#f6d77a', C.red, 0.45).rot(0, Math.PI, 0).at(1.8, 3.0, -0.6), nofit(bubbles(5, 6, 1.1).at(0.5, 2.0, 1.0)));
  return g;
}
function lampEdge() {
  const g = grp(seabed(9, 6.2, { base: C.sandNight, dot: C.sandNightDk, dot2: '#8a9db3', side: C.sandNightDk, seed: 2 }));
  const back = -3.0;
  g.add(nofit(grp(farReef(9.5, 2.0, '#2b4f73', 5).at(0, 0, back), farArch('#2b4f73').sc(1.2).at(2.6, 0, back + 0.05), farWhale('#35608a').sc(0.95).at(-1.6, 3.9, back + 0.1), farKelp(3.6, '#24456a').at(-3.6, 0, back + 0.3), farKelp(3.0, '#24456a').at(0.4, 0, back + 0.3))));
  g.add(haze(10, 7, '#24466b', 0.3).at(0, -0.2, back + 0.45));
  // two lamps make a path; the wreck sits just past the last one, waiting for its lamp
  g.add(reefLamp({ r: 1.5, poolOp: 0.34, li: 2.4, reach: 4 }).at(2.6, 0, 1.2), reefPatch(true, 3).at(3.2, 0, 0.5), coral('fan', C.coral, 1, true, 4).at(2.0, 0, 1.9), coral('tubes', C.sub, 0.9, true, 6).at(3.3, 0, 2.0));
  g.add(reefLamp({ r: 1.4, poolOp: 0.34, li: 2.4, reach: 4, h: 1.3 }).at(0.2, 0, 0.3), reefPatch(true, 8).rot(0, 2, 0).at(0.8, 0, -0.4), coral('branch', C.pink, 0.9, true, 2).at(-0.3, 0, 1.0));
  g.add(grp(wreck()).rot(0, deg(18), 0).at(-2.5, 0, 0.9), reefPatch(false, 5).at(-3.3, 0, -0.9), coral('branch', C.coral, 1, false, 9).at(-1.6, 0, -1.7), K.rock(0.55, '#5d7089', 3).at(-3.7, 0, -1.6), K.rock(0.4, '#5d7089', 6).at(-1.2, 0, 2.3));
  g.add(kelp(2.8, 3).at(3.9, 0, -1.9), kelp(2.3, 6).at(-4.0, 0, -0.4), kelp(2.5, 9).at(1.4, 0, -2.4));
  // the Puddle noses toward the wreck; you carry the next lamp
  g.add(sub({ beam: true }).rot(0, deg(170), 0).at(1.3, 0.7, -1.7));
  g.add(diver({ pose: 'carry', held: grp(K.lantern(C.brass, C.lampLt).sc(1.2), shine(0.2, C.lampLt, 0.22).at(0, 0.15, 0)).at(0, -0.2, 0.05) }).rot(0, deg(-50), 0).at(1.6, 0, 2.0), new THREE.HemisphereLight('#a9bdf0', '#2c3a58', 0.85));
  [[-2.9, 2.4, -0.2, 1], [-1.6, 3.2, -1.2, 0.8], [-3.8, 3.4, 0.6, 0.7], [3.5, 3.0, -1.0, 0.8], [1.2, 3.6, -1.5, 0.6]].forEach(([x, y, z, s], i) => g.add(jelly(s, i % 2 ? '#f3b8d8' : '#c9b8f0').at(x, y, z)));
  g.add(plight(-2.6, 1.8, 0.8, 5, 5, '#b9c8ff'), plight(-3.4, 1.2, 1.6, 3, 4, '#b9c8ff'), plight(3.6, 2.0, -0.6, 2.5, 4, '#b9c8ff'));
  return g;
}

export default {
  slug: 'fathom',
  title: 'Fathom Nook',
  logline: 'Keep a snug cabin on the sea floor, plant reef lamps that bring the colour back, and sketch whatever swims up to say hello.',
  genre: ['Cosy exploration', 'Light base building', 'No combat'],
  theme: { accent: C.lamp, accentInk: '#2a1c14', cardBg: '#d9ebe6', plinth: C.sand, plinthRim: C.sandDk },
  pitch: 'The pull of a deep-sea survival game with the fear taken out. Nothing hunts you and you cannot drown. Low air just means it is time to swim home for tea. Each lamp you plant wakes a patch of reef, so the map grows as a trail of warm light.',
  loop: ['Swim out from the Nook', 'Plant a lamp, the reef wakes up', 'Sketch what turns up in your logbook', 'Carry a find home for the shelf', 'Tea, then a little further tomorrow'],
  why: ['Warm inked shapes pop against cool water. Distance is flat blue layers, so nothing turns to murk.', 'Lamp pools show where you have been. The map is the sea floor itself.', 'One cabin, one sub, one bay. Small enough to finish, with room to add reefs.'],
  fromYou: 'You asked for Subnautica, but chilled. This keeps the home base and the urge to see past the next ridge, and swaps the danger for your own idea: a safe place that pushes back the dark.',
  similar: [
    { name: 'Subnautica', url: 'https://store.steampowered.com/app/264710', note: 'a home base and the pull of deeper water, here without the threat' },
    { name: 'ABZÛ', url: 'https://store.steampowered.com/app/384190', note: 'calm swimming among shoals, no fail state' },
    { name: 'DAVE THE DIVER', url: 'https://store.steampowered.com/app/1868140', note: 'dive by day, potter about at home after' },
    { name: 'Loddlenaut', note: 'gentle ocean clean-up with small friendly creatures' },
  ],
  palette: [['Lamp yellow', C.lamp], ['Wetsuit orange', C.suit], ['Copper green', C.copper], ['Shallow teal', '#6fb9b8'], ['Sea-floor sand', C.sand], ['Coral pink', C.pink]],
  key: { build: () => keyScene(), bg: SHALLOWS, light: 'day', sun: [-0.5, 0.8, 0.45], cam: { yaw: -12, pitch: 10, fov: 24 }, caption: 'Swimming home along the lamp line' },
  characters: [
    { name: 'Wren', role: 'You. Bubble helmet, flippers, and a sketchbook for every new face.', build: () => diver() },
    { name: 'Biscuit', role: 'A seal pup. Follows you out, races you home.', build: () => seal(1.25).rot(0, deg(40), 0) },
    { name: 'Mr Tibbs', role: 'Octopus in a pot. Swaps shells for shiny things.', build: () => potOctopus().sc(1.15) },
    { name: 'Marlow', role: 'The boat postie. Lowers your parcels down in a bucket.', build: () => postie() },
  ],
  builds: [
    { name: 'The Nook', tag: 'Building', note: 'Home. Copper roof, lit portholes, a stove pipe that blows bubbles.', build: () => grp(seabed(4.2, 3.8, { h: 0.35 }), nook().at(0, 0, -0.3), coral('brain', C.pink, 1, true, 2).at(-1.7, 0, 1.6), starfish().at(0.9, 0, 1.8)), cam: { yaw: -24, pitch: 16 } },
    { name: 'The Puddle', tag: 'Vehicle', note: 'One-seat sub with a bubble nose and a basket for finds.', build: () => grp(seabed(3.6, 2.6, { h: 0.3 }), sub().rot(0, deg(-32), 0).at(0, 0, 0), shell().at(1.2, 0, 0.9)), cam: { yaw: -22, pitch: 18 } },
    { name: 'Reef lamp', tag: 'Structure', note: 'Plant one and the pale coral inside its light turns bright again.', build: () => grp(seabed(4.4, 3.2, { h: 0.3 }), reefLamp({ r: 1.3, poolOp: 0.32 }).at(-0.6, 0, 0), reefPatch(true, 2).at(-1.1, 0, 0.5), coral('fan', C.coral, 1, true, 5).at(-0.1, 0, 0.7), reefPatch(false, 4).at(1.45, 0, 0.3), coral('branch', C.coral, 1, false, 7).at(1.2, 0, -0.8), fishy(C.coral, C.sub, 0.5).at(-0.9, 1.0, 0.6)), cam: { yaw: -20, pitch: 20 } },
    { name: 'Logbook table', tag: 'Prop', note: 'Your quest log: sketches, a tick list, a flask of tea.', build: () => logbookBench(), cam: { yaw: -24, pitch: 34 } },
  ],
  environments: [
    { name: 'The kelp plot', note: 'Garden beds under tall kelp, a few strokes from the front door.', build: () => kelpGarden(), stage: { bg: SHALLOWS, light: 'day', sun: [-0.5, 0.8, 0.45] }, cam: { yaw: -14, pitch: 14, fov: 26 } },
    { name: 'The edge of the lamplight', note: 'Deeper water, glowing jellies, and an old rowing boat waiting for its lamp.', build: () => lampEdge(), stage: { bg: DEEP, light: 'night' }, cam: { yaw: -18, pitch: 15, fov: 26 } },
  ],
};
