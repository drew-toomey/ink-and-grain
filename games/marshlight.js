// Marshlight — board 9. Canoe mystery in misty marsh channels. Every build() returns a fresh Object3D. Front faces +Z.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng, glow } = K;

// --- local palette
const C = {
  marsh: '#5f7f55', marshDk: '#48633f', marshLt: '#86a06a', mist: '#c9c3d6', mistLt: '#eeeaf2', lantern: '#f2c14e', canoe: '#c8402e',
  water: '#2f5f5a', waterLt: '#5e918a', waterDk: '#234a47', reed: '#d8c08a', reedDk: '#b39a62', cattail: '#7a5236',
  wood: '#8f6c4c', woodDk: '#5e4634', woodLt: '#c09a6e', tin: '#8a979b', coat: '#3f6a8a', mud: '#6f5c46', lily: '#6e9a52',
};
const DAWN = [[0, '#bdb5d0'], [0.45, '#e9d6d2'], [0.7, '#f3e3d2'], [1, '#e6e0e8']];

// --- helpers
const nofit = (o) => { o.traverse((m) => { if (m.isMesh) m.userData.noFit = true; }); return o; };
const shine = (r, c = '#ffe08a', op = 0.3) => sph(r, glow(c, { opacity: op, depthWrite: false }), { seg: 18 }).noInk().noShadow();
const plight = (x, y, z, i = 3, d = 3, c = '#ffcf70') => { const l = new THREE.PointLight(c, i, d, 2); l.position.set(x, y, z); return l; };
const pool = (r, op = 0.32, c = C.lantern) => cyl(r, r, 0.01, glow(c, { opacity: op, depthWrite: false }), { seg: 32 }).noInk().noShadow();
const waterSlab = (w, d, o = {}) => K.ground(w, d, { map: tex.waves({ base: o.base ?? C.water, line: o.line ?? '#4d8a82', rep: [Math.max(1, w / 3), Math.max(1, d / 3)], seed: o.seed ?? 5 }), side: o.side ?? C.waterDk, h: o.h ?? 0.5 });

/** Flat toon mist: a lumpy-topped translucent card. Never inked, never framed. */
function mistTex(seed = 1) {
  return tex.custom(1024, 256, (x, w, h) => {
    const r = rng(seed), ph = [r() * 6, r() * 6, r() * 6], fr = [1 + r() * 1.2, 2.5 + r() * 2, 6 + r() * 3];
    x.clearRect(0, 0, w, h);
    [[1, 'rgba(255,255,255,0.62)'], [0.45, 'rgba(255,255,255,0.55)']].forEach(([k, c], li) => {
      x.fillStyle = c; x.beginPath(); x.moveTo(0, h);
      for (let px = 0; px <= w; px += 4) {
        const t = px / w, env = Math.pow(Math.sin(Math.PI * t), 0.7), q = li * 1.7;
        const a = 0.42 + 0.26 * Math.sin(t * 6.283 * fr[0] + ph[0] + q) + 0.14 * Math.sin(t * 6.283 * fr[1] + ph[1] + q) + 0.05 * Math.sin(t * 6.283 * fr[2] + ph[2]);
        x.lineTo(px, h - h * k * env * Math.max(0.04, a));
      }
      x.lineTo(w, h); x.closePath(); x.fill();
    });
  });
}
function mistCard(w, h, o = {}) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(o.c ?? C.mistLt), map: mistTex(o.seed ?? 1), transparent: true, opacity: o.op ?? 0.9, depthWrite: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h).translate(0, h / 2, 0), m);
  mesh.castShadow = mesh.receiveShadow = false; mesh.userData.noInk = true; mesh.userData.noFit = true;
  return mesh;
}
/** Far silhouettes: unlit, uninked flat shapes that read as shapes in the mist. */
const flat = (pts, c, d = 0.04) => extrude(pts, d, glow(c)).noInk().noShadow();
function treeline(w, h, c, seed = 3) {
  const r = rng(seed), pts = [[-w / 2, 0]];
  for (let x = -w / 2; x <= w / 2 + 0.01; x += 0.35) { const y = h * (0.45 + 0.55 * r()) * (0.6 + 0.4 * Math.sin((x / w) * 6 + seed)); pts.push([x, y]); }
  pts.push([w / 2, 0]);
  return flat(pts, c);
}
const farLighthouse = (c, lit = true) => grp(flat([[-0.32, 0], [0.32, 0], [0.22, 2.0], [0.3, 2.0], [0.3, 2.08], [0.2, 2.08], [0.2, 2.4], [0.24, 2.4], [0, 2.62], [-0.24, 2.4], [-0.2, 2.4], [-0.2, 2.08], [-0.3, 2.08], [-0.3, 2.0], [-0.22, 2.0]], c), lit ? sph(0.09, glow('#ffe7a8'), { seg: 10 }).at(0, 2.24, 0.05).noInk() : null, lit ? shine(0.32, '#fff0c0', 0.35).at(0, 2.24, 0.05) : null);
const farMast = (c) => flat([[-0.25, 0], [0.25, 0], [0.03, 2.6], [-0.03, 2.6]], c);
const farStilts = (c) => flat([[-0.7, 0], [-0.62, 0], [-0.62, 0.5], [0.62, 0.5], [0.62, 0], [0.7, 0], [0.7, 0.55], [0.6, 0.55], [0.6, 1.1], [0.75, 1.1], [0, 1.6], [-0.75, 1.1], [-0.6, 1.1], [-0.6, 0.55], [-0.7, 0.55]], c);

// --- nature
function reeds(n = 9, seed = 1, h = 1.1, o = {}) {
  const r = rng(seed), g = grp();
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = r() * 0.22, hh = h * (0.6 + r() * 0.5);
    g.add(cone(0.035, hh, i % 3 ? C.reed : C.reedDk, { seg: 5 }).rot((r() - 0.5) * 0.3, 0, (r() - 0.5) * 0.35).at(Math.cos(a) * d, 0, Math.sin(a) * d));
  }
  const tails = o.tails ?? 2;
  for (let i = 0; i < tails; i++) { const x = (r() - 0.5) * 0.3, z = (r() - 0.5) * 0.2, hh = h * (0.9 + r() * 0.35), tl = (r() - 0.5) * 0.2; g.add(grp(cyl(0.014, 0.014, hh, C.marshDk, { seg: 5 }), cap(0.04, 0.16, C.cattail, { seg: 8 }).at(0, hh - 0.06, 0)).rot(tl, 0, tl).at(x, 0, z)); }
  return g.weld();
}
const lilyPad = (r = 0.22, flower = false) => grp(cyl(r, r, 0.02, C.lily, { seg: 18, t0: 0.3, tl: Math.PI * 2 - 0.5 }), flower ? grp(cone(0.05, 0.09, P.pink, { seg: 5 }), sph(0.03, P.butter, { seg: 8 }).at(0, 0.06, 0)).at(0.05, 0.02, 0.02) : null);
function willow(h = 3, seed = 2) {
  const r = rng(seed), leaf = '#7e9b5a', leafDk = '#67844a';
  const g = grp(cyl(0.12, 0.2, h * 0.62, C.woodDk, { seg: 10 }).rot(0, 0, 0.06));
  const crown = grp(sph(h * 0.36, leaf, { seg: 20 }).sc(1.15, 0.5, 1.05).at(0, h * 0.72, 0));
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2 + r() * 0.15, rr = h * (0.27 + r() * 0.1), len = h * (0.4 + r() * 0.24); crown.add(cone(h * 0.075, len, i % 2 ? leaf : leafDk, { seg: 6 }).rot(Math.PI, 0, 0).at(Math.cos(a) * rr, h * 0.74, Math.sin(a) * rr * 0.95)); }
  return g.put(crown.weld());
}
const mudbank = (w, d, c = C.mud) => grp(sph(0.5, c, { part: 'top', seg: 24 }).sc(w, 0.35, d), sph(0.5, C.marsh, { part: 'top', seg: 24 }).sc(w * 0.8, 0.38, d * 0.7).at(0, 0.02, -d * 0.05)).weld();
function heron(s = 1) {
  const grey = '#a7afb8', dk = '#69717b', pale = '#eeede8', bk = '#e2b443';
  const g = grp();
  [-1, 1].forEach((k) => g.add(cyl(0.022, 0.022, 0.52, bk, { seg: 8 }).at(k * 0.06, 0, -0.04), box(0.05, 0.016, 0.2, bk).at(k * 0.06, 0, 0.02)));
  g.add(sph(0.2, grey, { seg: 22 }).sc(0.85, 0.8, 1.9).rot(deg(-26), 0, 0).at(0, 0.72, -0.06));
  [-1, 1].forEach((k) => g.add(sph(0.19, dk, { seg: 16 }).sc(0.3, 0.7, 1.75).rot(deg(-26), 0, 0).at(k * 0.14, 0.74, -0.12)));
  g.add(cone(0.1, 0.22, dk, { seg: 8 }).rot(deg(-112), 0, 0).at(0, 0.6, -0.38), cone(0.07, 0.2, pale, { seg: 6 }).rot(Math.PI, 0, 0).at(0, 0.86, 0.24));
  g.add(tube([[0, 0.84, 0.2], [0, 0.98, 0.3], [0, 1.1, 0.22], [0, 1.2, 0.26], [0, 1.28, 0.36]], 0.068, pale, { segs: 28 }));
  g.add(sph(0.09, pale, { seg: 14 }).sc(1, 0.9, 1.3).at(0, 1.32, 0.4), box(0.19, 0.03, 0.14, P.ink2).at(0, 1.35, 0.37).noInk(), cap(0.014, 0.22, P.ink2, { seg: 6 }).rot(deg(-112), 0, 0).at(0, 1.37, 0.32));
  g.add(cone(0.034, 0.36, bk, { seg: 8 }).rot(deg(86), 0, 0).at(0, 1.31, 0.5));
  [-1, 1].forEach((k) => g.add(sph(0.019, P.ink, { seg: 8 }).at(k * 0.075, 1.34, 0.45).noInk()));
  return g.sc(s);
}
function gator(s = 1) {
  const c = '#6f9157', b = '#a9bf86';
  const g = grp(cap(0.17, 0.7, c, { seg: 14 }).rot(0, 0, deg(90)).sc(1, 0.7, 1).at(0.35, 0.12, 0), rbox(0.5, 0.14, 0.24, c, { r: 0.06 }).at(0.68, 0.02, 0), cone(0.13, 0.75, c, { seg: 10 }).rot(0, 0, deg(90)).sc(1, 0.6, 1).at(-0.33, 0.1, 0));
  [-1, 1].forEach((k) => { g.add(sph(0.055, c, { seg: 10 }).at(0.5, 0.2, k * 0.08), box(0.06, 0.02, 0.07, P.ink2).at(0.53, 0.215, k * 0.08).noInk(), cyl(0.04, 0.05, 0.1, c, { seg: 8 }).at(0.3, -0.04, k * 0.15), cyl(0.04, 0.05, 0.1, c, { seg: 8 }).at(-0.05, -0.04, k * 0.15)); });
  for (let i = 0; i < 5; i++) g.add(cone(0.03, 0.06, b, { seg: 4 }).at(0.4 - i * 0.16, 0.22 - i * 0.012, 0));
  return grp(g.rot(0, deg(-90), 0)).sc(s);
}

// --- props
const paddle = () => grp(cyl(0.02, 0.02, 1.15, C.woodLt, { seg: 8 }).at(0, -0.45, 0), box(0.14, 0.035, 0.035, C.woodDk).at(0, 0.7, 0), sph(0.08, C.woodLt, { seg: 12 }).sc(1, 2.4, 0.3).at(0, -0.55, 0));
const camera = () => grp(rbox(0.18, 0.12, 0.08, P.ink2, { r: 0.02 }), cyl(0.04, 0.045, 0.06, P.iron, { seg: 12 }).rot(deg(90), 0, 0).at(0, 0.06, 0.04), sph(0.03, glow('#d6eef4'), { seg: 8 }).sc(1, 1, 0.3).at(0, 0.06, 0.1), box(0.04, 0.025, 0.03, C.canoe).at(-0.05, 0.12, 0));
const handset = () => grp(rbox(0.12, 0.26, 0.07, '#3d4045', { r: 0.025 }), box(0.07, 0.05, 0.01, glow('#bfe8a0')).at(0, 0.16, 0.036), cyl(0.012, 0.012, 0.2, P.ink2, { seg: 6 }).at(0.035, 0.26, 0), sph(0.018, C.canoe, { seg: 8 }).at(0.035, 0.46, 0), ...[0, 1, 2].map((i) => box(0.06, 0.012, 0.01, P.slate).at(0, 0.05 + i * 0.03, 0.036).noInk()));
function headLamp(p, R = 0.36, beamLen = 0) {
  const hr = 0.34, hy = 1.06 + hr * 0.92;
  p.add(torus(R, 0.028, P.ink2, { ts: 30 }).rot(deg(90), 0, 0).at(0, hy + hr * 0.36, -0.01));
  p.add(grp(cyl(0.07, 0.07, 0.08, P.iron, { seg: 14 }), cyl(0.056, 0.056, 0.015, glow('#fff3c0'), { seg: 14 }).at(0, 0.08, 0)).rot(deg(90), 0, 0).at(0, hy + hr * 0.42, R - 0.03));
  if (beamLen) p.add(cone(0.42, beamLen, glow('#fff1b8', { opacity: 0.13, depthWrite: false }), { seg: 20, open: true }).rot(deg(-76), 0, 0).at(0, hy + hr * 0.42 - beamLen * 0.24, R + beamLen * 0.97).noInk().noShadow());
  return p;
}
function canoeHull(L = 3.0, B = 0.74, D = 0.3, col = C.canoe) {
  const prof = []; for (let i = 0; i <= 18; i++) { const t = i / 18; prof.push(new THREE.Vector2(Math.max(0.002, (B / 2) * Math.pow(Math.sin(Math.PI * t), 0.6)), -L / 2 + t * L)); }
  const up = (x) => 0.17 * Math.pow(Math.abs(x / (L / 2)), 5);
  const shell = (k, c) => {
    const g = new THREE.LatheGeometry(prof, 22, Math.PI / 2, Math.PI).rotateZ(-Math.PI / 2).rotateX(-Math.PI / 2);
    g.scale(1, (D / (B / 2)) * k, k);
    const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + up(p.getX(i)));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, K.mat(c, { side: THREE.DoubleSide })); m.castShadow = m.receiveShadow = true; return m;
  };
  const g = grp(shell(1, col), shell(0.88, C.woodLt));
  const rim = (s) => { const pts = []; for (let i = 1; i < 18; i++) { const t = i / 18, x = -L / 2 + t * L; pts.push([x, up(x) + 0.005, s * (B / 2) * Math.pow(Math.sin(Math.PI * t), 0.6)]); } return tube(pts, 0.026, C.woodDk, { segs: 40 }); };
  g.add(grp(rim(1), rim(-1)).weld());
  [-0.75, 0.0, 0.8].forEach((x) => g.add(box(0.09, 0.035, B * 0.84, C.woodDk).at(x, -0.07, 0)));
  return g;
}
function canoe(o = {}) {
  const L = 3.0, g = grp(canoeHull(L));
  // bow lantern on a bent pole (bow = +X)
  g.add(tube([[1.05, -0.05, 0], [1.1, 0.5, 0], [1.25, 0.8, 0], [1.45, 0.82, 0]], 0.022, C.woodDk, { segs: 20 }));
  g.add(grp(K.lantern(P.iron, '#ffe6a0').sc(0.9).at(0, -0.36, 0), cyl(0.006, 0.006, 0.07, P.ink2, { seg: 4 }).at(0, -0.06, 0).noInk(), shine(0.32, '#ffe08a', 0.3).at(0, -0.24, 0)).at(1.45, 0.82, 0));
  if (o.light !== false) g.add(plight(1.45, 0.5, 0.2, o.li ?? 2.5, 3.2));
  if (o.pool !== false) g.add(pool(0.75, o.poolOp ?? 0.3).sc(1.3, 1, 1).at(1.45, -0.16, 0));
  if (o.gear !== false) {
    g.add(grp(cap(0.09, 0.22, P.mustard, { seg: 12 }).rot(0, 0, deg(80)), torus(0.05, 0.012, P.ink2).rot(0, deg(90), 0).at(0.2, 0.06, 0)).at(-1.0, -0.05, 0.05));
    g.add(camera().rot(0, deg(20), 0).at(0.4, -0.06, 0.12), cyl(0.05, 0.05, 0.6, '#8f8a6a', { seg: 10 }).rot(0, 0, deg(88)).at(-0.2, -0.07, -0.18));
  }
  if (o.paddle) g.add(paddle().rot(deg(90), 0, deg(-80)).at(-0.3, 0.02, 0.05));
  return g;
}
function person_you(o = {}) {
  const p = K.person({ hairStyle: 'bob', hair: P.hairAuburn, skin: P.skin1, top: C.coat, bottom: '#465063', shoes: '#4d5d3c', acc: o.lantern ? ['lantern'] : [], pose: o.pose ?? 'stand', held: o.held === undefined ? paddle().rot(0, 0, 0.1).at(0, 0.28, 0) : o.held });
  p.add(camera().sc(0.9).at(0.02, 0.72, 0.26), tube([[-0.14, 0.78, 0.22], [-0.2, 1.0, 0.12], [0, 1.08, 0.05], [0.2, 1.0, 0.12], [0.14, 0.78, 0.22]], 0.012, P.ink2).noInk());
  p.add(...[0.95, 0.8, 0.65].map((y) => sph(0.022, P.butter, { seg: 8 }).at(0, y, 0.25)).map((m) => m.noInk()));
  const hr = 0.34, hy = 1.06 + hr * 0.92, hoodM = K.mat(C.coat, { side: THREE.DoubleSide });
  const hm = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.22, 24, 14, Math.PI * 0.82, Math.PI * 1.36, Math.PI * 0.2, Math.PI * 0.46), hoodM), ht = new THREE.Mesh(new THREE.SphereGeometry(hr * 1.22, 24, 6, 0, Math.PI * 2, 0, Math.PI * 0.24), hoodM);
  [hm, ht].forEach((m) => (m.castShadow = m.receiveShadow = true));
  p.add(grp(hm, ht).weld().rot(-0.3, 0, 0).at(0, hy + hr * 0.04, -hr * 0.06), torus(0.24, 0.06, C.coat, { ts: 22 }).rot(deg(90), 0, 0).at(0, 1.06, -0.02));
  return headLamp(p, 0.43, o.beam ?? 0);
}
const ranger = () => K.person({ hairStyle: 'ponytail', hair: P.hairBlack, skin: P.skin4, top: '#8d8b5c', bottom: '#5c5a45', shoes: P.ink2, hat: 'straw', hatColor: '#8c7350', acc: ['badge'], pose: 'hold', held: handset() });
const hermit = (o = {}) => K.person({ body: 'tall', hairStyle: 'long', hair: P.hairGrey, skin: P.skin2, top: '#6b5a45', bottom: '#57493a', skirt: true, shoes: P.ink2, hat: 'straw', hatColor: '#4f4436', acc: ['beard', 'lantern'], beardColor: P.hairGrey, pose: 'stand', held: grp(cyl(0.025, 0.03, 1.5, C.woodDk, { seg: 8 }).at(0, -0.62, 0), sph(0.05, C.woodDk, { seg: 8 }).at(0, 0.88, 0)).rot(0, 0, 0.12) });

const paddler = () => person_you({ pose: 'hold', held: paddle().rot(0, 0, deg(55)).at(0, -0.05, -0.1) }).sc(0.72).rot(0, deg(90), 0);

// --- builds
function stiltHouse(o = {}) {
  const g = grp(), deckY = 0.95, pl = tex.planks({ base: C.wood, line: C.woodDk, n: 8, vertical: true });
  [[-1.25, -0.9], [-1.25, 0.95], [1.25, -0.9], [1.25, 0.95], [0, -0.9], [0, 0.95], [-0.6, 1.6], [0.2, 1.6]].forEach(([x, z]) => g.add(cyl(0.065, 0.075, deckY + 0.6, C.woodDk, { seg: 10 }).at(x, -0.6, z)));
  g.add(box(2.7, 0.1, 2.1, texMat(pl)).at(0, deckY - 0.1, 0), box(1.2, 0.08, 0.7, texMat(tex.planks({ base: C.wood, line: C.woodDk, n: 5 }))).at(-0.2, 0.12, 1.4));
  const hut = K.house({ w: 1.9, d: 1.4, h: 1.15, wallMap: tex.planks({ base: '#a98a63', line: C.woodDk, n: 9, vertical: true }), roof: C.tin, roofH: 0.65, door: C.marsh, trim: '#e9e2cf', windows: 2, glass: o.lit ? glow('#ffd47e') : '#9fb7bd', base: C.woodDk, shutters: C.canoe });
  g.add(hut.at(0.05, deckY, -0.25));
  g.add(cyl(0.05, 0.05, 0.6, P.iron, { seg: 8 }).at(0.6, deckY + 1.6, -0.5), cyl(0.07, 0.05, 0.06, P.iron, { seg: 8 }).at(0.6, deckY + 2.2, -0.5));
  g.add(K.fence(2.6, C.woodLt, { h: 0.42, gap: 0.3 }).at(0, deckY, 1.0), K.fence(1.9, C.woodLt, { h: 0.42, gap: 0.3 }).rot(0, deg(90), 0).at(-1.3, deckY, 0.05));
  g.add(grp(box(0.05, 1.2, 0.05, C.woodDk).at(-0.15, 0, 0), box(0.05, 1.2, 0.05, C.woodDk).at(0.15, 0, 0), ...[0.2, 0.45, 0.7, 0.95].map((y) => box(0.3, 0.035, 0.04, C.woodDk).at(0, y, 0))).weld().rot(deg(14), 0, 0).at(-0.35, -0.2, 1.22));
  // lantern by the door, crab pots, rain barrel, nets
  g.add(grp(box(0.04, 0.04, 0.3, C.woodDk).at(0, 0, 0.15), grp(K.lantern(P.iron, '#ffe6a0').sc(0.75)).at(0, -0.3, 0.3), shine(0.28).at(0, -0.18, 0.3)).at(-0.55, deckY + 1.05, 0.48));
  if (o.lit !== false) g.add(plight(-0.55, deckY + 0.7, 1.0, 2.2, 2.6));
  g.add(K.barrel(0.5, C.marshDk).at(1.0, deckY, 0.65), grp(box(0.36, 0.26, 0.3, texMat(tex.grid({ bg: '#d9cdb2', line: C.woodDk, cells: 5, lw: 7 }))), box(0.38, 0.03, 0.32, C.woodDk).at(0, 0.26, 0)).at(0.55, deckY, 0.75), grp(box(0.3, 0.22, 0.26, texMat(tex.grid({ bg: '#d9cdb2', line: C.woodDk, cells: 5, lw: 7 }))), box(0.32, 0.03, 0.28, C.woodDk).at(0, 0.22, 0)).rot(0, 0.4, 0).at(0.6, deckY + 0.29, 0.72));
  g.add(torus(0.17, 0.055, texMat(tex.stripes({ colors: [C.canoe, P.white], n: 8 })), { ts: 24, rs: 10 }).at(-1.02, deckY + 0.75, 0.5));
  // clue board on the porch: map with pinned photos
  const board = texMat(tex.custom(256, 192, (x, w, h) => { x.fillStyle = '#cf9f66'; x.fillRect(0, 0, w, h); x.fillStyle = '#efe2c6'; x.fillRect(18, 18, 140, 150); x.strokeStyle = '#6e9a52'; x.lineWidth = 6; x.beginPath(); x.moveTo(20, 120); x.bezierCurveTo(70, 60, 110, 140, 156, 40); x.stroke(); [[178, 26], [196, 100]].forEach(([px, py]) => { x.fillStyle = '#fbf7ee'; x.fillRect(px, py, 56, 62); x.fillStyle = '#5f7f8a'; x.fillRect(px + 6, py + 6, 44, 36); }); x.strokeStyle = '#c8402e'; x.lineWidth = 3; x.beginPath(); x.moveTo(90, 90); x.lineTo(200, 50); x.moveTo(60, 70); x.lineTo(214, 128); x.stroke(); [[90, 90], [60, 70], [200, 50], [214, 128]].forEach(([px, py]) => { x.fillStyle = '#c8402e'; x.beginPath(); x.arc(px, py, 7, 0, 7); x.fill(); }); }));
  g.add(box(0.62, 0.46, 0.03, board).at(1.15, deckY + 0.45, 0.47));
  g.add(cyl(0.07, 0.08, 0.8, C.woodDk, { seg: 8 }).at(0.5, -0.4, 1.7));
  return g;
}
function radioShack(o = {}) {
  const g = grp();
  g.add(mudbank(3.6, 2.8, C.mud).at(0, -0.15, 0));
  const hut = K.house({ w: 1.5, d: 1.2, h: 1.05, wall: '#d6d2c4', roof: C.tin, roofType: 'shed', door: C.marshDk, trim: '#f0ebe0', windows: 1, glass: o.lit ? glow('#ffd47e') : '#9fb7bd', base: P.stoneDk, sign: 'STATION 4', signBg: '#efe7d6', signFg: C.canoe });
  g.add(hut.at(-0.35, 0.12, -0.2));
  g.add(box(0.7, 0.04, 0.5, '#3f5a78').rot(deg(-25), 0, 0).at(-0.3, 1.45, -0.35), box(0.72, 0.03, 0.52, P.white).rot(deg(-25), 0, 0).at(-0.3, 1.43, -0.35));
  // lattice mast
  const mast = grp(), H = 3.6, legs = 3, rA = 0.3, rB = 0.06, rad = (y) => rA + (rB - rA) * (y / H), pos = (i, y) => { const a = (i / legs) * Math.PI * 2 + 0.5; return [Math.cos(a) * rad(y), y, Math.sin(a) * rad(y)]; };
  for (let i = 0; i < legs; i++) mast.add(tube([pos(i, 0), pos(i, H)], 0.03, C.canoe, { segs: 4, rs: 6 }));
  for (let k = 0; k < 7; k++) { const y0 = (k * H) / 7, y1 = ((k + 1) * H) / 7; for (let i = 0; i < legs; i++) mast.add(tube([pos(i, y0), pos((i + 1) % legs, y1)], 0.016, k % 2 ? P.white : C.canoe, { segs: 2, rs: 5 })); }
  mast.weld();
  mast.add(sph(0.07, glow('#ff6a4a'), { seg: 10 }).at(0, H + 0.05, 0), shine(0.22, '#ff8a6a', 0.3).at(0, H + 0.05, 0), cyl(0.012, 0.012, 0.6, P.steel, { seg: 6 }).at(0, H, 0));
  g.add(mast.at(1.05, 0.12, -0.45));
  [[2.0, 0.15, 0.6], [0.2, 0.15, -1.2], [1.6, 0.15, -1.4]].forEach(([x, y, z]) => g.add(tube([[1.05, 0.12 + H * 0.8, -0.45], [x, y, z]], 0.008, P.ink2, { segs: 2 }).noInk(), box(0.08, 0.12, 0.08, P.stoneDk).at(x, y - 0.04, z)));
  g.add(tube([[1.05, 0.12 + H * 0.55, -0.45], [0.3, 1.25, -0.2], [0.05, 1.05, -0.2]], 0.01, P.ink2).noInk());
  g.add(K.fence(1.2, C.woodLt, { h: 0.35 }).at(-0.4, 0.12, 0.75), reeds(8, 4, 0.9).at(1.6, 0.0, 0.8), reeds(6, 7, 0.8).at(-1.5, 0.0, 0.6));
  g.add(box(0.9, 0.06, 0.5, texMat(tex.planks({ base: C.wood, line: C.woodDk, n: 4, vertical: true }))).at(-0.35, 0.12, 1.25), ...[-0.7, 0.0].map((x) => cyl(0.04, 0.05, 0.5, C.woodDk, { seg: 8 }).at(x, -0.3, 1.45)));
  g.add(K.sign('NO WAKE', { w: 0.5, h: 0.18, bg: P.white, fg: C.canoe, frame: C.woodDk }).at(1.7, 0.6, 1.1), cyl(0.025, 0.025, 0.62, C.woodDk, { seg: 6 }).at(1.7, 0.0, 1.07));
  return g;
}
function lighthouse(o = {}) {
  const g = grp(), H = 2.7, night = !!o.night;
  // rocky islet
  const r = rng(6);
  for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; g.add(K.rock(0.35 + r() * 0.25, i % 2 ? P.stone : '#9d9585', i + 2).at(Math.cos(a) * 1.15, -0.2, Math.sin(a) * 0.95)); }
  g.add(cyl(1.2, 1.35, 0.3, '#9d9585', { seg: 14 }).at(0, -0.18, 0).flat(), cyl(1.1, 1.15, 0.05, C.marsh, { seg: 14 }).at(0, 0.1, 0));
  const stripes = texMat(tex.stripes({ colors: ['#efe9dc', '#efe9dc', C.canoe], n: 6, vertical: false }));
  g.add(lathe([[0.001, 0], [0.55, 0], [0.42, H], [0.001, H]], stripes, { seg: 28 }).at(-0.15, 0.12, -0.1));
  const top = grp().at(-0.15, 0.12 + H, -0.1);
  top.add(cyl(0.62, 0.62, 0.08, P.iron, { seg: 28 }), torus(0.6, 0.018, P.iron, { ts: 36 }).rot(deg(90), 0, 0).at(0, 0.28, 0));
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2; top.add(cyl(0.012, 0.012, 0.28, P.iron, { seg: 4 }).at(Math.cos(a) * 0.6, 0.08, Math.sin(a) * 0.6)); }
  top.add(cyl(0.33, 0.33, 0.48, glow(night ? '#ffe39a' : '#f6e3a8'), { seg: 20 }).at(0, 0.08, 0));
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; top.add(box(0.03, 0.48, 0.03, P.ink2).at(Math.cos(a) * 0.33, 0.08, Math.sin(a) * 0.33)); }
  top.add(cone(0.42, 0.38, C.canoe, { seg: 20 }).at(0, 0.56, 0), sph(0.06, P.iron, { seg: 10 }).at(0, 0.98, 0), cyl(0.01, 0.01, 0.25, P.iron, { seg: 4 }).at(0, 1.02, 0));
  if (night) {
    top.add(shine(0.55, '#ffe9a8', 0.3).at(0, 0.32, 0));
    [deg(-8), deg(172)].forEach((yaw) => top.add(nofit(grp(cone(0.75, 3.4, glow('#ffe08a', { opacity: 0.24, depthWrite: false }), { seg: 24, open: true }).rot(0, 0, deg(90)).at(3.4, 0, 0)).rot(0, yaw, deg(-3)).at(0, 0.32, 0).noInk().noShadow())));
    g.add(plight(-0.15, H + 0.6, 0.6, 5, 6, '#ffe2a0'), plight(0.9, 0.9, 1.0, 2.5, 3, '#ffd48a'));
  }
  g.add(top);
  // door, small windows, keeper's cottage
  g.add(box(0.3, 0.55, 0.06, C.marshDk).at(-0.15, 0.14, 0.42), ...[1.1, 1.8].map((y) => box(0.14, 0.2, 0.04, night ? glow('#ffd47e') : P.glassDk).at(-0.15, y, 0.43 - y * 0.045)));
  g.add(K.house({ w: 1.1, d: 0.9, h: 0.75, wall: '#e9e2d0', roof: C.canoe, roofH: 0.45, door: C.marshDk, windows: 1, glass: night ? glow('#ffd47e') : P.glassDk, base: P.stoneDk, chimney: true }).rot(0, deg(-30), 0).at(0.85, 0.12, 0.25));
  // jetty + note on the door
  g.add(box(0.5, 0.06, 1.6, texMat(tex.planks({ base: C.wood, line: C.woodDk, n: 3 }))).at(-0.9, 0.0, 1.45), ...[1.0, 1.9].flatMap((z) => [-1.1, -0.7].map((x) => cyl(0.04, 0.05, 0.5, C.woodDk, { seg: 8 }).at(x, -0.45, z))));
  g.add(box(0.12, 0.15, 0.01, P.white).rot(0, 0, 0.1).at(-0.1, 0.4, 0.46));
  return g;
}

// --- scenes
function keyScene() {
  const g = grp(waterSlab(12, 6, { seed: 3 }));
  // far layers in the mist: treeline, lighthouse, mast, another stilt house
  const back = -2.85;
  g.add(nofit(grp(treeline(12, 1.4, '#d2cbdd', 5).at(0, 0, back), farLighthouse('#c3bcd2').at(-2.3, 0, back + 0.05), farMast('#c3bcd2').at(3.9, 0, back + 0.05), treeline(11, 1.0, '#b7afc8', 8).at(0.4, 0, back + 0.45), farStilts('#aea6bf').sc(0.9).at(-1.6, 0, back + 0.5))));
  g.add(mistCard(13, 1.7, { seed: 3 }).at(0, -0.02, back + 0.25), mistCard(12, 1.3, { seed: 9 }).at(0.5, -0.02, back + 0.95), mistCard(8, 0.9, { seed: 14, op: 0.8 }).at(-2.5, -0.02, -1.9));
  // stilt house, mudbank and willow
  g.add(stiltHouse({ lit: true }).rot(0, deg(-14), 0).at(2.2, 0, -0.9));
  g.add(mistCard(10, 0.8, { seed: 4, op: 0.7 }).at(1.2, -0.02, 0.3));
  g.add(mudbank(2.4, 1.6).at(-4.3, -0.05, -1.3), willow(3.0, 3).at(-4.5, 0.05, -1.4), reeds(10, 2, 1.2).at(-3.4, 0, -0.8), reeds(8, 5, 1.0).at(-5.1, 0, -0.5));
  // foreground: canoe heading left toward the far light, reeds, pads, heron
  const you = paddler();
  g.add(grp(canoe({ li: 3 }), you.at(-0.25, -0.3, 0)).rot(0, deg(180 + 18), 0).at(-0.9, 0.18, 1.3));
  g.add(mudbank(1.6, 1.1).at(4.7, -0.05, 1.3), heron(1.1).rot(0, deg(-62), 0).at(4.6, 0.08, 1.3), reeds(9, 7, 1.0).at(5.3, 0, 0.9), reeds(7, 9, 0.9).at(3.9, 0, 1.9));
  g.add(reeds(9, 11, 1.1).at(-5.4, 0, 2.3), reeds(6, 12, 0.8).at(-4.7, 0, 2.6));
  [[1.0, 2.2, 0.24, true], [1.6, 2.6, 0.2], [0.4, 2.7, 0.18], [-2.7, 2.2, 0.22, true], [-3.3, 1.7, 0.18], [3.0, 2.6, 0.2]].forEach(([x, z, r, f]) => g.add(lilyPad(r, f).rot(0, x, 0).at(x, 0.0, z)));
  return g;
}
function dawnChannel() {
  const g = grp(waterSlab(7.5, 6, { seed: 8 }));
  const back = -2.85;
  g.add(nofit(grp(treeline(7.5, 1.3, '#d2cbdd', 2).at(0, 0, back), farLighthouse('#c5bed3').sc(0.8).at(1.4, 0, back + 0.05), treeline(7, 0.9, '#b7afc8', 6).at(-0.3, 0, back + 0.5))));
  g.add(mistCard(8, 1.5, { seed: 5, op: 0.55 }).at(0, -0.02, back + 0.3), mistCard(8, 1.1, { seed: 12, op: 0.5 }).at(0, -0.02, back + 1.1), mistCard(7, 0.7, { seed: 2, op: 0.42 }).at(0.3, -0.02, -0.3));
  // reed banks either side of the channel
  g.add(mudbank(2.4, 5.6).at(-3.1, -0.05, 0), mudbank(2.0, 5.2).at(3.2, -0.05, 0.2));
  [[-2.6, -1.8], [-2.4, -0.4], [-2.7, 0.9], [-2.3, 2.2], [2.6, -1.6], [2.4, -0.2], [2.7, 1.3], [2.3, 2.5]].forEach(([x, z], i) => g.add(reeds(9, i + 3, 1.0 + (i % 3) * 0.15).at(x, 0.05, z)));
  g.add(willow(2.8, 5).at(-3.1, 0.05, -1.1));
  // the sunken boat: bow and mast out of the water
  const wreck = grp(sph(0.5, '#6f8a8f', { part: 'bottom', seg: 20 }).sc(1.6, 0.7, 0.9).rot(0, 0, deg(-28)), torus(0.5, 0.04, '#e9e2cf', { ts: 28 }).rot(deg(90), 0, 0).sc(1.6, 1, 0.9).rot(0, 0, deg(-28)), cyl(0.035, 0.04, 1.6, C.woodDk, { seg: 8 }).rot(0, 0, deg(-20)).at(-0.2, -0.2, 0));
  g.add(wreck.rot(0, deg(30), 0).at(0.9, 0.12, -1.3), K.sign('ELSIE', { w: 0.5, h: 0.15, bg: '#e9e2cf', fg: C.waterDk, frame: '#e9e2cf' }).rot(0, deg(30), deg(-12)).at(1.25, 0.12, -1.0));
  g.add(sph(0.18, '#e9a33a', { seg: 14 }).at(1.7, 0.05, -0.8), cyl(0.03, 0.03, 0.12, P.white, { seg: 8 }).at(1.7, 0.2, -0.8));
  // the canoe, coming up the channel
  const you = paddler();
  g.add(grp(canoe({ li: 3 }), you.at(-0.25, -0.3, 0)).rot(0, deg(-70), 0).at(-0.3, 0.18, 1.2));
  [[0.6, 2.4, 0.22, true], [-1.2, 2.5, 0.18], [1.3, 1.6, 0.2], [-0.9, 0.0, 0.2, true]].forEach(([x, z, r, f]) => g.add(lilyPad(r, f).rot(0, x * 2, 0).at(x, 0.0, z)));
  g.add(heron(0.75).rot(0, deg(-50), 0).at(2.4, 0.15, 0.6));
  return g;
}
function lighthouseNight() {
  const g = grp(waterSlab(9, 6.5, { base: '#24494d', line: '#467c7a', side: '#183336', seed: 2 }));
  g.add(nofit(grp(treeline(9, 1.0, '#45536f', 4).at(0, 0, -3.1))));
  g.add(mistCard(9, 0.9, { seed: 7, op: 0.32, c: '#9aa0c4' }).at(0, -0.02, -2.6));
  g.add(lighthouse({ night: true }).at(0.9, 0.1, -1.3));
  g.add(box(0.5, 0.012, 2.6, glow('#ffe08a', { opacity: 0.22, depthWrite: false })).at(0.75, 0.005, 0.3).noInk().noShadow(), box(0.25, 0.014, 2.0, glow('#ffe9a8', { opacity: 0.25, depthWrite: false })).at(0.75, 0.006, 0.2).noInk().noShadow());
  g.add(mudbank(1.8, 1.2, '#4d4236').at(-2.7, -0.05, -0.9), gator(1.0).rot(0, deg(25), 0).at(-2.6, 0.14, -0.75), plight(-2.4, 1.0, 0.2, 1.5, 2.5, '#b9c8ff'), reeds(10, 3, 1.1).at(-3.5, 0, -1.6), reeds(8, 6, 1.0).at(3.6, 0, 0.2), reeds(8, 8, 0.9).at(3.2, 0, 1.8), reeds(7, 10, 0.9).at(-3.8, 0, 1.9));
  const you = paddler();
  g.add(grp(canoe({ li: 4, poolOp: 0.4 }), you.at(-0.25, -0.3, 0)).rot(0, deg(15), 0).at(-1.6, 0.18, 1.3));
  g.add(mistCard(9, 0.55, { seed: 11, op: 0.28, c: '#9aa0c4' }).at(0, -0.02, 0.5));
  [[-0.2, 2.6, 0.2], [2.0, 2.6, 0.22, true], [2.6, 1.0, 0.18]].forEach(([x, z, r, f]) => g.add(lilyPad(r, f).at(x, 0.0, z)));
  return g;
}

export default {
  slug: 'marshlight',
  title: 'Marshlight',
  logline: 'Paddle a canoe through misty marsh channels, follow the clues, and find out what happened to the marsh lighthouse keeper.',
  genre: ['Narrative mystery', 'Exploration', 'First-person-ish chapters'],
  theme: { accent: C.lantern, accentInk: '#2a1c14', cardBg: '#ece6ea', plinth: '#b9a98a', plinthRim: C.woodDk },
  pitch: 'Short chapters, a bit like Firewatch on the water. You paddle between stilt houses, a sunken boat, a radio shack and an old marsh lighthouse. Photograph clues, pin them to the map board and talk them over on the radio. Flat toon mist and lantern light make every channel look like a postcard.',
  loop: ['Paddle to a landmark', 'Search it by lantern light', 'Photograph clues, pin them on the map', 'Talk it through on the radio', 'A new channel opens'],
  why: ['Outlined shapes against layered mist read clearly, even as thumbnails.', 'The lantern\'s warm pool is a natural focus. It shows you where to look.', 'Small chapters suit a solo dev. Finish one, ship it, start the next.'],
  fromYou: 'Your Marshlight prototype already has four playable chapters, and you enjoyed playing them. This board gives that game a look to match.',
  similar: [
    { name: 'Firewatch', url: 'https://store.steampowered.com/app/383870', note: 'a voice on the radio and a mystery in the wild' },
    { name: 'Duck Detective', url: 'https://store.steampowered.com/app/2637990', note: 'small, warm deduction with a clue board' },
    { name: 'Lil Gator Game', url: 'https://store.steampowered.com/app/1586800', note: 'the ink-outline toon look, outdoors' },
    { name: 'DREDGE', url: 'https://store.steampowered.com/app/1562430', note: 'the mood: fog, small boat, quiet unease' },
  ],
  palette: [['Marsh green', C.marsh], ['Mist lilac', C.mist], ['Lantern yellow', C.lantern], ['Canoe red', C.canoe], ['Dark water', C.water], ['Reed straw', C.reed]],
  key: { build: () => keyScene(), bg: DAWN, light: 'dusk', sun: [-0.8, 0.55, 0.45], cam: { yaw: -14, pitch: 11, fov: 24 }, caption: 'Channel 3, just after dawn' },
  characters: [
    { name: 'Sage', role: 'You. Rain jacket, head lamp, a camera for every clue.', build: () => person_you() },
    { name: 'Ranger Dee', role: 'The voice on the radio. Knows every channel.', build: () => ranger() },
    { name: 'Hollis', role: 'Marsh hermit. Saw the light go out, says nothing.', build: () => hermit() },
    { name: 'Mr Grey', role: 'A heron. Always one channel ahead of you.', build: () => heron(1.15).rot(0, deg(58), 0) },
  ],
  builds: [
    { name: 'The canoe', tag: 'Vehicle', note: 'Bow lantern, paddle, camera and a dry bag.', build: () => grp(waterSlab(4, 2, { h: 0.35 }), canoe({ paddle: true }).rot(0, deg(-10), 0).at(0, 0.18, 0)), cam: { yaw: -30, pitch: 26 } },
    { name: 'Stilt house', tag: 'Building', note: 'Clue board on the porch, crab pots, one lit lantern.', build: () => grp(waterSlab(4.2, 4.2, { h: 0.35 }), stiltHouse({ lit: true }).at(0, 0, -0.3)), cam: { yaw: -28, pitch: 18 } },
    { name: 'Radio shack', tag: 'Building', note: 'Station 4 on its own hummock. Ranger Dee\'s end of the line.', build: () => grp(waterSlab(4.2, 3.6, { h: 0.35 }), radioShack()), cam: { yaw: -30, pitch: 16 } },
    { name: 'Marsh lighthouse', tag: 'Structure', note: 'Short, stout, and dark since the keeper went.', build: () => grp(waterSlab(3.8, 3.8, { h: 0.35 }), lighthouse()), cam: { yaw: -28, pitch: 16 } },
  ],
  environments: [
    { name: 'Channel at dawn', note: 'Reed banks, the willow, a sunken boat. Mist in three layers.', build: () => dawnChannel(), stage: { bg: DAWN, light: 'dusk', sun: [-0.7, 0.6, 0.4] }, cam: { yaw: -12, pitch: 18, fov: 26 } },
    { name: 'The lighthouse at night', note: 'The light is back on. Someone is home.', build: () => lighthouseNight(), stage: { bg: [[0, '#1f2b45'], [0.65, '#34405f'], [1, '#3d4866']], light: 'night' }, cam: { yaw: -30, pitch: 20 } },
  ],
};
