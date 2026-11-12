// Night Watch — board 7. Greyscale + one accent: signal red means "something changed", and nothing else.
// Every build() returns a fresh Object3D. Front of things faces +Z (vehicles: +X). Light here is pale grey, never coloured.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, tex, texMat, deg, rng } = K;

// --- palette: greys + one red
const RED = '#e2302a';
const G = { night: P.g0, slate: P.g1, dark: P.g2, stone: P.g3, mid: P.g4, pall: P.g5, fog: P.g6, chalk: P.g7 };
const CHANGED = K.mat(RED); CHANGED.userData.keep = true; // toon red: the thing that moved
const CHANGED_GLOW = K.glow(RED);                            // unlit red: a window, a pair of eyes
const PALE = K.glow(G.fog);                                  // ordinary light: lamps, lit windows
const DARKGLASS = K.mat(G.slate);
const NIGHT = { bg: [[0, '#262524'], [0.5, '#4a4845'], [1, '#86827c']], light: 'night' };
const CARD = { bg: [[0, '#4a4844'], [1, '#9a958f']], light: 'night' };
const OFFICE = { bg: [[0, '#2c2b29'], [1, '#5d5a56']], light: 'night' };

// Kit helpers carry default colours (brick chimneys, mustard badges, pink blush, wood). Brick and terracotta
// sit right next to signal red and would survive the mono pass, so every toon material becomes its own grey,
// except the ones marked keep. Glows are left alone.
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
const lift = (g, I = 0.6) => { g.add(new THREE.AmbientLight('#ffffff', I)); return g; };
const safe = (fn, I) => () => greyify(lift(fn(), I));
const glowLight = (I = 1.5, d = 2) => new THREE.PointLight('#ffffff', I, d, 2);
// K.ground's top and side boxes share y=0 and z-fight when their colours differ; this slab doesn't overlap.
function slab(w, d, o = {}) {
  const h = o.h ?? 0.35;
  return grp(box(w, h - 0.06, d, o.side ?? G.stone).at(0, -h, 0), box(w, 0.06, d, o.map ? texMat(o.map) : (o.top ?? G.mid)).at(0, -0.06, 0)).weld();
}

// --- textures
const stone = (rep = [2, 2]) => tex.bricks({ base: G.mid, mortar: G.stone, rows: 6, cols: 3, rep });
const tiles = (rep = [3, 3], a = G.pall, b = G.mid) => tex.checker({ a, b, n: 8, rep });
const sea = (rep = [4, 3]) => tex.waves({ base: G.dark, line: G.stone, rep });
const turf = (rep = [3, 2]) => tex.speckle({ base: G.stone, dots: [G.dark, G.mid], n: 90, size: 6, rep });
const flags = (rep = [1, 4]) => tex.tiles({ base: G.mid, line: G.dark, n: 4, rep });
const cliff = (rep = [3, 1]) => tex.custom(256, 128, (x, w, h) => { const r = rng(9); x.fillStyle = G.dark; x.fillRect(0, 0, w, h); for (let j = 0; j < 4; j++) { let cx = -r() * 20; while (cx < w) { const bw = 18 + r() * 30; x.fillStyle = [G.stone, G.mid, G.stone, G.pall][Math.floor(r() * 4)]; x.beginPath(); x.roundRect(cx + 2, j * h / 4 + 2, bw - 4, h / 4 - 4, 6); x.fill(); cx += bw; } } }, rep);
const half = { seg: 16, t0: -Math.PI / 2, tl: Math.PI };

// A CCTV frame drawn in greys. `alert` paints the changed thing red and boxes it.
function feed(kind, alert = false, cam = 1, time = '03:12') {
  const t = tex.custom(256, 192, (x, w, h) => {
    const poly = (pts, c) => { x.fillStyle = c; x.beginPath(); pts.forEach(([a, b], i) => (i ? x.lineTo(a, b) : x.moveTo(a, b))); x.closePath(); x.fill(); };
    const b0 = [w * 0.3, h * 0.24], b1 = [w * 0.7, h * 0.64];
    poly([[0, 0], [w, 0], [b1[0], b0[1]], [b0[0], b0[1]]], '#3a3836');
    poly([[0, 0], [b0[0], b0[1]], [b0[0], b1[1]], [0, h]], '#86827d');
    poly([[w, 0], [b1[0], b0[1]], [b1[0], b1[1]], [w, h]], '#76726d');
    poly([[0, h], [w, h], [b1[0], b1[1]], [b0[0], b1[1]]], '#5d5a57');
    x.fillStyle = '#aca7a1'; x.fillRect(b0[0], b0[1], b1[0] - b0[0], b1[1] - b0[1]);
    x.strokeStyle = '#2a2826'; x.lineWidth = 2; [[0, 0, ...b0], [w, 0, b1[0], b0[1]], [0, h, b0[0], b1[1]], [w, h, ...b1]].forEach(([a, b, c, d]) => { x.beginPath(); x.moveTo(a, b); x.lineTo(c, d); x.stroke(); });
    x.strokeRect(b0[0], b0[1], b1[0] - b0[0], b1[1] - b0[1]);
    const R = alert ? RED : null;
    let hit = null;
    if (kind === 'bed') { poly([[w * 0.5, h * 0.66], [w * 0.86, h * 0.66], [w * 0.98, h * 0.86], [w * 0.56, h * 0.86]], R ?? '#e9e5de'); poly([[w * 0.56, h * 0.86], [w * 0.98, h * 0.86], [w * 0.98, h * 0.92], [w * 0.56, h * 0.92]], '#3a3836'); x.fillStyle = '#f7f4ef'; x.fillRect(w * 0.53, h * 0.67, w * 0.1, h * 0.06); hit = [w * 0.48, h * 0.62, w * 0.52, h * 0.34]; }
    if (kind === 'window') { x.fillStyle = '#cfcac3'; x.fillRect(w * 0.4, h * 0.3, w * 0.2, h * 0.26); x.fillStyle = '#3a3836'; [0.45, 0.5, 0.55].forEach((f) => x.fillRect(w * f, h * 0.3, 2, h * 0.26)); if (R) poly([[w * 0.6, h * 0.3], [w * 0.68, h * 0.25], [w * 0.68, h * 0.6], [w * 0.6, h * 0.56]], R); hit = [w * 0.36, h * 0.2, w * 0.36, h * 0.42]; poly([[w * 0.1, h * 0.75], [w * 0.4, h * 0.75], [w * 0.45, h * 0.9], [w * 0.05, h * 0.9]], '#e9e5de'); }
    if (kind === 'chair') { const c = R ?? '#3a3836'; x.fillStyle = c; x.fillRect(w * 0.6, h * 0.6, w * 0.12, h * 0.05); x.fillRect(w * 0.6, h * 0.45, w * 0.025, h * 0.3); x.fillRect(w * 0.7, h * 0.63, w * 0.02, h * 0.12); hit = [w * 0.56, h * 0.4, w * 0.2, h * 0.4]; poly([[w * 0.15, h * 0.72], [w * 0.42, h * 0.72], [w * 0.45, h * 0.86], [w * 0.1, h * 0.86]], '#e9e5de'); }
    if (kind === 'corridor') { x.fillStyle = '#3a3836'; [[0.04, 0.2], [0.16, 0.3], [0.23, 0.38]].forEach(([a, s]) => x.fillRect(w * a, h * (0.5 - s * 0.6), w * 0.05, h * s * 1.4)); [[0.91, 0.2], [0.79, 0.3], [0.72, 0.38]].forEach(([a, s]) => x.fillRect(w * a, h * (0.5 - s * 0.6), w * 0.05, h * s * 1.4)); x.fillStyle = '#e9e5de'; x.fillRect(w * 0.46, h * 0.08, w * 0.08, h * 0.03); }
    if (kind === 'stairs') { for (let i = 0; i < 6; i++) { x.fillStyle = i % 2 ? '#86827d' : '#aca7a1'; x.fillRect(w * (0.32 + i * 0.03), h * (0.88 - i * 0.07), w * (0.36 - i * 0.06), h * 0.07); } }
    if (alert && hit) { x.strokeStyle = RED; x.lineWidth = 6; x.setLineDash([10, 6]); x.strokeRect(...hit); x.setLineDash([]); }
    x.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < h; y += 4) x.fillRect(0, y, w, 1.6);
    x.fillStyle = '#f7f4ef'; x.font = '500 17px "DM Mono", ui-monospace, monospace'; x.fillText(`CAM ${cam}`, 10, 22); x.fillText(time, w - 62, h - 10);
    x.beginPath(); x.arc(w - 18, 16, 5, 0, 7); x.fill();
  });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return K.glow('#ffffff', { map: t });
}

// --- small props
function thermos(s = 1) { return grp(cyl(0.07, 0.07, 0.3, G.stone, { seg: 14 }), cyl(0.072, 0.072, 0.06, G.dark, { seg: 14 }).at(0, 0.3, 0), cyl(0.06, 0.05, 0.08, G.chalk, { seg: 14 }).at(0, 0.36, 0), box(0.02, 0.18, 0.04, G.dark).at(0.075, 0.06, 0)).sc(s); }
function mug() { return grp(cyl(0.06, 0.055, 0.12, G.chalk, { seg: 14 }), torus(0.035, 0.012, G.chalk, { ts: 12 }).at(0.065, 0.06, 0)); }
function clipboard(tag = true) {
  const g = grp(box(0.34, 0.02, 0.46, G.stone), box(0.3, 0.012, 0.4, G.chalk).at(0, 0.02, 0.01), box(0.14, 0.03, 0.05, G.dark).at(0, 0.02, -0.2));
  [-0.1, -0.04, 0.02, 0.08].forEach((z) => g.add(box(0.2, 0.006, 0.012, G.mid).at(-0.02, 0.033, z).noInk()));
  if (tag) g.add(box(0.07, 0.014, 0.12, CHANGED).rot(0, deg(10), 0).at(0.15, 0.03, -0.16));
  return g;
}
function crt(kind, alert = false, cam = 1, s = 1) {
  const g = grp(rbox(0.72, 0.56, 0.5, G.stone, { r: 0.05 }), rbox(0.5, 0.4, 0.3, G.stone, { r: 0.08 }).at(0, 0.08, -0.32));
  g.add(box(0.62, 0.46, 0.02, G.slate).at(0, 0.05, 0.25), K.plane(0.56, 0.4, feed(kind, alert, cam), { cast: false }).rot(deg(90), 0, 0).at(0, 0.48 / 2 + 0.03, 0.262).noInk());
  g.add(cyl(0.02, 0.02, 0.02, G.fog, { seg: 8 }).rot(deg(90), 0, 0).at(0.28, 0.03, 0.26));
  return g.sc(s);
}
function officeChair() {
  const g = grp(rbox(0.5, 0.09, 0.48, G.dark, { r: 0.04 }).at(0, 0.46, 0), rbox(0.46, 0.55, 0.08, G.dark, { r: 0.04 }).rot(deg(-8), 0, 0).at(0, 0.56, -0.24), cyl(0.03, 0.03, 0.4, G.stone, { seg: 8 }).at(0, 0.06, 0));
  for (let i = 0; i < 5; i++) g.add(grp(box(0.04, 0.03, 0.3, G.stone).at(0, 0.05, 0.15), sph(0.035, G.slate, { seg: 8 }).at(0, 0.035, 0.29)).rot(0, i * deg(72), 0));
  return g;
}
const bat = (s = 1) => extrude([[0, 0.02], [0.08, 0.07], [0.18, 0.03], [0.3, 0.12], [0.36, -0.01], [0.26, -0.03], [0.2, -0.08], [0.12, -0.03], [0, -0.07], [-0.12, -0.03], [-0.2, -0.08], [-0.26, -0.03], [-0.36, -0.01], [-0.3, 0.12], [-0.18, 0.03], [-0.08, 0.07]], 0.03, G.night).sc(s).noShadow();
function gwin(kind = 'dark', s = 1) { // arched asylum window: dark | lit | red
  const glass = kind === 'red' ? CHANGED_GLOW : kind === 'lit' ? PALE : DARKGLASS;
  const g = grp(
    grp(box(0.32, 0.42, 0.05, G.fog), cyl(0.16, 0.16, 0.05, G.fog, half).rot(deg(-90), 0, 0).at(0, 0.42, 0.025)).weld(),
    box(0.22, 0.38, 0.06, glass).at(0, 0.03, 0), cyl(0.11, 0.11, 0.06, glass, half).rot(deg(-90), 0, 0).at(0, 0.41, 0.03),
    box(0.02, 0.48, 0.07, G.fog).at(0, 0.03, 0).noInk(),
    box(0.38, 0.05, 0.1, G.stone).at(0, -0.03, 0.02),
  );
  return g.sc(s);
}
const bench = (w = 1) => K.bench(w, G.mid);
const deadTree = (h = 1.6, seed = 3) => K.tree({ kind: 'dead', h, trunk: G.slate, seed });

// --- people
function nightGuard() {
  const p = K.person({ skin: G.pall, hair: G.dark, hairStyle: 'short', top: G.stone, bottom: G.slate, shoes: G.night, hat: 'cap', hatColor: G.slate, acc: ['badge'], pose: 'hold', held: grp(thermos(1.1), mug().at(0.16, 0, 0.04)).at(0, -0.12, 0) });
  p.add(box(0.6, 0.06, 0.42, G.night).at(0, 0.5, 0)); // belt
  p.add(grp(box(0.08, 0.16, 0.05, G.night), cyl(0.008, 0.008, 0.1, G.night, { seg: 6 }).at(0.02, 0.16, 0)).at(0.26, 0.4, 0.14)); // radio
  p.add(cyl(0.035, 0.035, 0.22, G.dark, { seg: 10 }).rot(0, 0, deg(8)).at(-0.3, 0.32, 0.08)); // torch
  return p;
}
function orderly() {
  const keys = grp(torus(0.05, 0.01, G.dark, { ts: 14 }), ...[0, 1, 2].map((i) => box(0.012, 0.07, 0.02, G.dark).rot(0, 0, deg(-20 + i * 20)).at(-0.02 + i * 0.02, -0.08, 0)));
  const p = K.person({ body: 'tall', skin: G.mid, hair: G.slate, hairStyle: 'curly', top: G.chalk, bottom: G.chalk, shoes: G.fog, pose: 'hips' });
  p.add(keys.at(0.3, 0.46, 0.12), box(0.14, 0.1, 0.02, G.stone).at(-0.12, 0.84, 0.24)); // keyring, name badge
  return p;
}
function theCount() {
  const p = K.person({ body: 'tall', skin: G.chalk, hair: G.night, hairStyle: 'short', top: G.slate, bottom: G.slate, shoes: G.dark, pose: 'stand' });
  // red eyes: swap the kit's ink eye spheres for red glow (the only red on him)
  p.traverse((m) => { if (m.isMesh && m.userData.noInk && m.material === K.mat(P.ink) && m.geometry.type === 'SphereGeometry' && m.position.y > 0 && m.position.z > 0.2) { m.material = CHANGED_GLOW; m.scale.multiplyScalar(1.15); } });
  const head = p.children.find((x) => x.isGroup && x.position.y > 1.2);
  head.add(cone(0.09, 0.16, G.night, { seg: 4 }).rot(deg(180), deg(45), 0).at(0, 0.36, 0.25)); // widow's peak
  p.add(cyl(0.33, 0.42, 0.62, G.slate, { seg: 22 }).sc(1, 1, 0.85).at(0, 0.06, 0)); // long gown
  p.add(box(0.62, 0.06, 0.46, G.stone).at(0, 0.62, 0), box(0.06, 0.22, 0.03, G.stone).at(0.08, 0.42, 0.23)); // belt + tie end
  p.add(extrude([[-0.42, 0], [0.42, 0], [0.5, 0.5], [0.2, 0.32], [0, 0.36], [-0.2, 0.32], [-0.5, 0.5]], 0.05, G.dark).at(0, 1.0, -0.12).rot(deg(-12), 0, 0)); // high collar
  [-1, 1].forEach((s) => p.add(box(0.2, 0.36, 0.03, G.dark).rot(0, 0, s * 0.35).at(s * 0.11, 0.66, 0.235))); // lapels
  return p;
}
function asylumCat() {
  const g = grp(crt('corridor', false, 4, 1.15));
  g.add(grp(K.cat({ color: G.dark, belly: G.chalk }).sc(1.05)).rot(0, deg(-35), 0).at(0, 0.62, -0.1));
  g.add(glowLight(0.8, 1.2).at(0, 0.3, 0.5));
  return g;
}

// --- builds
function securityDesk(o = {}) {
  const g = grp();
  g.add(slab(3.4, 2.4, { map: tiles([3, 2]), side: G.stone, h: 0.2 }));
  // monitor rack
  const rack = grp(box(2.5, 0.06, 0.62, G.dark).at(0, 0.82, 0), box(2.5, 0.06, 0.62, G.dark).at(0, 1.48, 0), box(0.06, 2.1, 0.62, G.dark).at(-1.25, 0, 0), box(0.06, 2.1, 0.62, G.dark).at(1.25, 0, 0), box(2.56, 0.06, 0.66, G.dark).at(0, 2.1, 0));
  const feeds = [['corridor', 1], ['bed', 2], ['stairs', 3], ['window', 5, true], ['chair', 6], ['corridor', 7]];
  feeds.forEach(([k, c, a], i) => rack.add(crt(k, !!a, c, 0.95).at(-0.8 + (i % 3) * 0.8, i < 3 ? 1.54 : 0.88, 0.02)));
  g.add(rack.at(0, 0, -0.85));
  // desk
  g.add(box(2.6, 0.07, 0.85, G.mid).at(0, 0.74, 0.15), box(0.5, 0.74, 0.8, G.stone).at(-1.0, 0, 0.15), box(0.5, 0.74, 0.8, G.stone).at(1.0, 0, 0.15));
  [0.2, 0.45].forEach((y) => [-1, 1].forEach((s) => g.add(box(0.36, 0.02, 0.01, G.dark).at(s * 1.0, y, 0.555).noInk())));
  const top = 0.81;
  g.add(box(0.7, 0.03, 0.22, G.fog).at(-0.1, top, 0.3), grp(cyl(0.08, 0.1, 0.04, G.dark, { seg: 12 }), cyl(0.02, 0.02, 0.16, G.dark, { seg: 8 }).at(0, 0.04, 0), sph(0.04, G.stone, { seg: 10 }).at(0, 0.21, 0)).at(0.45, top, 0.3));
  g.add(clipboard(o.tag !== false).rot(0, deg(-12), 0).at(-0.8, top, 0.3), thermos().at(0.9, top, 0.0), mug().at(0.75, top, 0.32));
  g.add(grp(rbox(0.26, 0.08, 0.18, G.dark, { r: 0.03 }), cap(0.035, 0.18, G.dark, { seg: 8 }).rot(0, 0, deg(90)).at(0.12, 0.08, 0)).at(1.05, top, 0.35)); // phone
  g.add(grp(cyl(0.08, 0.1, 0.03, G.dark, { seg: 12 }), cyl(0.012, 0.012, 0.4, G.dark, { seg: 6 }).rot(0, 0, deg(15)), cone(0.12, 0.14, G.dark, { seg: 14 }).rot(deg(180), 0, deg(-40)).at(0.22, 0.48, 0), sph(0.05, PALE, { seg: 10 }).at(0.18, 0.37, 0)).at(-1.1, top, -0.1));
  g.add(glowLight(1.2, 1.6).at(-0.85, top + 0.3, 0.05));
  g.add(officeChair().rot(0, deg(20), 0).at(0.1, 0, 0.95));
  g.add(K.sign('03:12', { w: 0.42, h: 0.16, bg: G.night, fg: G.chalk, frame: G.dark }).at(0, 2.2, -0.86));
  return g;
}
function buggy() {
  const g = grp();
  g.add(rbox(1.55, 0.22, 0.82, G.fog, { r: 0.08 }).at(0, 0.2, 0), rbox(0.5, 0.36, 0.8, G.fog, { r: 0.12 }).at(0.55, 0.38, 0));
  g.add(rbox(0.5, 0.12, 0.72, G.dark, { r: 0.05 }).at(-0.05, 0.46, 0), rbox(0.1, 0.42, 0.72, G.dark, { r: 0.04 }).rot(0, 0, deg(6)).at(-0.32, 0.52, 0));
  [[0.42, 0.36], [0.42, -0.36], [-0.52, 0.36], [-0.52, -0.36]].forEach(([x, z]) => g.add(cyl(0.025, 0.025, 1.15, G.stone, { seg: 8 }).at(x, 0.42, z)));
  g.add(rbox(1.3, 0.06, 0.94, G.chalk, { r: 0.03 }).at(-0.04, 1.56, 0));
  g.add(cyl(0.018, 0.018, 0.42, G.dark, { seg: 6 }).rot(0, 0, deg(35)).at(0.48, 0.5, 0.14), torus(0.1, 0.016, G.night, { ts: 18 }).rot(0, deg(90), deg(55)).at(0.35, 0.86, 0.14));
  [[0.55, 1], [0.55, -1], [-0.5, 1], [-0.5, -1]].forEach(([x, s]) => g.add(K.wheel(0.19, 0.12, G.night, G.pall).at(x, 0.19, s * 0.44)));
  // load: bucket, mop, folded blankets
  g.add(box(0.5, 0.06, 0.78, G.stone).at(-0.62, 0.42, 0), cyl(0.12, 0.1, 0.22, G.mid, { seg: 14 }).at(-0.7, 0.48, 0.18), cyl(0.015, 0.015, 1.1, G.stone, { seg: 6 }).rot(deg(-10), 0, deg(-18)).at(-0.7, 0.5, 0.18), rbox(0.22, 0.08, 0.3, G.chalk, { r: 0.03 }).at(-0.68, 0.48, -0.2), rbox(0.22, 0.08, 0.3, G.pall, { r: 0.03 }).at(-0.68, 0.56, -0.2));
  // lights are plain white: only an anomaly is red
  g.add(sph(0.06, PALE, { seg: 10 }).at(0.8, 0.44, 0.26), sph(0.06, PALE, { seg: 10 }).at(0.8, 0.44, -0.26));
  g.add(grp(cyl(0.07, 0.07, 0.04, G.dark, { seg: 12 }), sph(0.065, PALE, { seg: 12, part: 'top' }).at(0, 0.04, 0)).at(-0.1, 1.59, 0));
  g.add(K.sign('STAFF', { w: 0.42, h: 0.14, bg: G.chalk, fg: G.night, frame: G.dark }).rot(0, deg(90), 0).at(0.81, 0.28, 0));
  return g;
}
function patientRoom(o = {}) {
  const g = grp();
  g.add(slab(2.8, 2.4, { map: tiles([3, 3], G.pall, G.fog), side: G.stone, h: 0.18 }));
  // walls: tiled dado, pale plaster above
  g.add(box(2.8, 0.85, 0.12, texMat(tex.tiles({ base: G.pall, line: G.stone, n: 5, rep: [4, 1] }))).at(0, 0, -1.14), box(2.8, 1.25, 0.12, G.fog).at(0, 0.85, -1.14));
  g.add(box(0.12, 0.85, 2.4, texMat(tex.tiles({ base: G.pall, line: G.stone, n: 5, rep: [3, 1] }))).at(-1.34, 0, 0), box(0.12, 1.25, 2.4, G.fog).at(-1.34, 0.85, 0));
  g.add(box(2.86, 0.06, 0.16, G.stone).at(0, 0.85, -1.12), box(0.16, 0.06, 2.4, G.stone).at(-1.32, 0.85, 0));
  // barred window
  const win = grp(box(0.8, 0.7, 0.04, G.stone), box(0.66, 0.56, 0.05, o.window === 'red' ? CHANGED_GLOW : PALE).at(0, 0.07, 0));
  [-0.2, 0, 0.2].forEach((x) => win.add(cyl(0.015, 0.015, 0.56, G.slate, { seg: 6 }).at(x, 0.07, 0.04)));
  g.add(win.at(0.35, 1.0, -1.07), grp(box(0.9, 0.05, 0.12, G.stone)).at(0.35, 0.97, -1.02));
  // bed: iron frame, empty and rumpled
  const bed = grp(box(0.85, 0.08, 1.7, G.dark).at(0, 0.32, 0), box(0.78, 0.14, 1.6, G.chalk).at(0, 0.4, 0), rbox(0.5, 0.1, 0.28, G.chalk, { r: 0.05 }).at(0, 0.54, -0.6));
  bed.add(rbox(0.82, 0.08, 0.9, o.bed === 'red' ? CHANGED : G.pall, { r: 0.04 }).rot(deg(4), deg(6), deg(-3)).at(0.02, 0.54, 0.3));
  [[-0.4, -0.82], [0.4, -0.82], [-0.4, 0.82], [0.4, 0.82]].forEach(([x, z]) => bed.add(cyl(0.025, 0.025, 0.36, G.dark, { seg: 6 }).at(x, 0, z)));
  bed.add(box(0.85, 0.5, 0.04, G.dark).at(0, 0.32, -0.85), box(0.85, 0.3, 0.04, G.dark).at(0, 0.32, 0.85));
  g.add(bed.at(-0.75, 0, -0.1));
  // bedside table, cup, book
  g.add(box(0.36, 0.5, 0.34, G.mid).at(-0.1, 0, -0.85), mug().sc(0.8).at(-0.18, 0.5, -0.82), box(0.18, 0.04, 0.24, G.dark).at(0.0, 0.5, -0.85).rot(0, 0.3, 0));
  // the chair: moved from its taped spot by the wall
  const chair = grp(box(0.4, 0.05, 0.4, o.chair === 'red' ? CHANGED : G.stone).at(0, 0.42, 0), box(0.4, 0.45, 0.05, o.chair === 'red' ? CHANGED : G.stone).at(0, 0.47, -0.18));
  [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([x, z]) => chair.add(box(0.04, 0.42, 0.04, o.chair === 'red' ? CHANGED : G.stone).at(x, 0, z)));
  g.add(chair.rot(0, deg(-145), 0).at(0.5, 0, 0.55));
  [[0.72, -0.7, 1, 1], [1.18, -0.7, -1, 1], [0.72, -0.24, 1, -1], [1.18, -0.24, -1, -1]].forEach(([x, z, sx, sz]) => g.add(box(0.14, 0.012, 0.035, G.dark).at(x + sx * 0.05, 0, z), box(0.035, 0.012, 0.14, G.dark).at(x, 0, z + sz * 0.05)));
  // the camera watching it, in the corner
  g.add(grp(box(0.1, 0.1, 0.06, G.stone).at(0, 0, -0.03), rbox(0.14, 0.12, 0.26, G.dark, { r: 0.03 }).rot(deg(25), deg(40), 0).at(0.06, -0.08, 0.12), cyl(0.04, 0.04, 0.03, G.night, { seg: 10 }).rot(deg(115), deg(40), 0).at(0.13, -0.16, 0.24)).at(-1.22, 1.9, -1.02));
  g.add(grp(box(0.06, 0.16, 0.1, G.dark), sph(0.06, PALE, { seg: 10 }).at(0.05, 0.08, 0)).at(-1.25, 1.35, 0.5), glowLight(0.6, 1.4).at(-1.0, 1.4, 0.5));
  g.add(box(0.05, 1.5, 0.6, G.stone).at(-1.27, 0, 0.75), box(0.03, 0.3, 0.16, G.slate).at(-1.24, 1.05, 0.75)); // door with spy slot
  return g;
}

// --- the asylum
function asylum(o = {}) {
  const g = grp(), red = o.red ?? 'front';
  const wm = (w, h) => stone([Math.max(1, w / 1.1), Math.max(1, h / 1.1)]);
  // main block
  g.add(K.house({ w: 3.2, d: 1.7, h: 2.3, floors: 1, wall: G.mid, wallMap: wm(3.2, 2.3), roof: G.slate, roofH: 1.05, windows: 0, door: G.slate, trim: G.stone, base: G.dark, ov: 0.12 }));
  // wings, set back
  [-1, 1].forEach((s) => g.add(K.house({ w: 2.4, d: 1.4, h: 1.8, floors: 1, wall: G.mid, wallMap: wm(2.4, 1.8), roof: G.slate, roofH: 1.0, windows: 0, door: G.dark, trim: G.stone, base: G.dark, ov: 0.1 }).at(s * 2.8, 0, -0.15)));
  [[-2.4, 2.4, -0.3], [2.9, 2.4, -0.3], [1.0, 2.75, -0.4]].forEach(([x, y, z]) => g.add(box(0.24, 0.7, 0.24, G.dark).at(x, y, z), box(0.3, 0.06, 0.3, G.slate).at(x, y + 0.7, z)));
  // windows: front + back. Most dark, a few lit pale, exactly one red.
  const slots = [], rowMain = [-1.25, -0.8, 0.8, 1.25], rowWing = [-0.85, -0.4, 0.4, 0.85];
  [0.4, 1.45].forEach((y) => rowMain.forEach((x) => slots.push([x, y, 0.855, false], [x, y, -0.855, true])));
  [-1, 1].forEach((sd) => [0.3, 1.1].forEach((y, row) => rowWing.forEach((x) => { if (row === 0 && Math.abs(x) < 0.5) return; slots.push([sd * 2.8 + x, y, 0.555, false], [sd * 2.8 + x, y, -0.855, true]); })));
  const key = (x, y, back) => `${x.toFixed(2)},${y},${back ? 'b' : 'f'}`;
  const lit = new Set([key(-0.8, 0.4, false), key(-3.2, 1.1, false), key(-2.4, 1.1, false), key(1.25, 1.45, false), key(2.0, 0.3, false), key(3.6, 1.1, false), key(-2.4, 1.1, true), key(-1.25, 0.4, true), key(3.65, 0.3, true), key(1.25, 1.45, true), key(-3.2, 0.3, true)]);
  const redKey = red === 'back' ? key(-0.8, 1.45, true) : '';
  slots.forEach(([x, y, z, back]) => { const k = key(x, y, back); g.add(gwin(k === redKey ? 'red' : lit.has(k) ? 'lit' : 'dark', k === redKey ? 1.25 : 1).rot(0, back ? Math.PI : 0, 0).at(x, y - (k === redKey ? 0.05 : 0), z)); });
  // the tower over the main door
  const tz = 1.05;
  const TH = 4.3;
  g.add(box(1.0, TH, 1.0, texMat(stone([1, 3.8]))).at(0, 0, tz), box(1.12, 0.1, 1.12, G.stone).at(0, TH, tz));
  g.add(cone(0.8, 1.4, G.slate, { seg: 4 }).rot(0, deg(45), 0).at(0, TH + 0.1, tz), cyl(0.02, 0.02, 0.45, G.slate, { seg: 6 }).at(0, TH + 1.4, tz), sph(0.06, G.slate, { seg: 8 }).at(0, TH + 1.88, tz));
  g.add(box(0.5, 0.8, 0.06, G.slate).at(0, 0.0, tz + 0.5), cyl(0.25, 0.25, 0.06, G.slate, half).rot(deg(-90), 0, 0).at(0, 0.8, tz + 0.53));
  g.add(box(1.2, 0.08, 0.5, G.stone).at(0, 0, tz + 0.72), box(1.0, 0.08, 0.3, G.stone).at(0, 0.08, tz + 0.66));
  g.add(gwin('lit', 1.25).at(0, 1.4, tz + 0.505), gwin(red === 'front' ? 'red' : 'dark', 1.25).at(0, 2.4, tz + 0.505));
  // clock at 3:12
  const clock = grp(cyl(0.28, 0.28, 0.04, G.chalk, { seg: 24 }).rot(deg(90), 0, 0), torus(0.28, 0.025, G.slate, { ts: 28 }).at(0, 0, 0.02),
    box(0.035, 0.16, 0.02, G.night).rot(0, 0, deg(-96)).at(0, 0, 0.045), box(0.025, 0.24, 0.02, G.night).rot(0, 0, deg(-72)).at(0, 0, 0.05)).at(0, 3.65, tz + 0.5);
  g.add(clock);
  return g;
}
function gatehouse() {
  const w = 1.7, d = 1.2;
  const g = K.house({ w, d, h: 1.2, floors: 1, wall: G.mid, wallMap: stone([1.5, 1.1]), roof: G.slate, roofType: 'hip', roofH: 0.75, windows: 0, door: G.slate, trim: G.stone, base: G.dark, ov: 0.1 });
  const office = tex.custom(256, 160, (x, W, H) => {
    x.fillStyle = '#e9e5de'; x.fillRect(0, 0, W, H);
    x.fillStyle = '#86827d'; x.fillRect(W * 0.08, H * 0.1, W * 0.3, H * 0.34); x.fillRect(W * 0.42, H * 0.1, W * 0.3, H * 0.34);
    x.fillStyle = '#3a3836'; x.beginPath(); x.ellipse(W * 0.62, H * 0.62, W * 0.13, H * 0.2, 0, 0, 7); x.fill();
    x.beginPath(); x.ellipse(W * 0.62, H * 0.47, W * 0.15, H * 0.07, 0, Math.PI, 0); x.fill(); x.fillRect(W * 0.62, H * 0.45, W * 0.17, H * 0.04);
    x.beginPath(); x.ellipse(W * 0.62, H * 1.05, W * 0.3, H * 0.28, 0, 0, 7); x.fill();
  });
  g.add(box(0.56, 0.5, 0.05, G.fog).at(0.56, 0.42, d / 2 + 0.005), K.plane(0.48, 0.4, K.glow('#ffffff', { map: office }), { cast: false }).rot(deg(90), 0, 0).at(0.56, 0.67, d / 2 + 0.035).noInk());
  g.add(box(0.64, 0.05, 0.12, G.stone).at(0.56, 0.39, d / 2 + 0.04));
  g.add(K.sign('SECURITY', { w: 0.64, h: 0.15, bg: G.night, fg: G.chalk, frame: G.dark }).at(-0.1, 1.08, d / 2 + 0.03));
  g.add(glowLight(1.4, 1.8).at(0.56, 0.6, d / 2 + 0.5));
  return g;
}
function gatePillar(lamp = true) {
  const g = grp(box(0.36, 1.25, 0.36, texMat(stone([0.5, 1.2]))), box(0.44, 0.08, 0.44, G.stone).at(0, 1.25, 0));
  if (lamp) g.add(grp(cyl(0.05, 0.06, 0.08, G.dark, { seg: 8 }), box(0.16, 0.2, 0.16, PALE).at(0, 0.08, 0), cone(0.15, 0.12, G.dark, { seg: 4 }).rot(0, deg(45), 0).at(0, 0.28, 0)).at(0, 1.33, 0));
  return g;
}
function graveyard() {
  const g = grp(box(2.6, 0.3, 0.12, G.stone).at(0, 0, 0.9), box(2.6, 0.3, 0.12, G.stone).at(0, 0, -0.9), box(0.12, 0.3, 1.9, G.stone).at(1.24, 0, 0), box(0.12, 0.3, 1.9, G.stone).at(-1.24, 0, 0));
  [[-0.75, -0.4], [0, -0.45], [0.75, -0.35], [-0.4, 0.3], [0.45, 0.35]].forEach(([x, z], i) => {
    const t = i % 2 ? grp(box(0.07, 0.5, 0.07, G.pall), box(0.28, 0.07, 0.07, G.pall).at(0, 0.32, 0)) : grp(rbox(0.3, 0.46, 0.09, G.pall, { r: 0.12 }), box(0.34, 0.06, 0.14, G.mid));
    g.add(t.rot(deg((i % 3 - 1) * 6), 0, deg((i % 2 ? 1 : -1) * 5)).at(x, 0, z), box(0.3, 0.04, 0.5, G.dark).at(x, 0, z + 0.32));
  });
  return g;
}
function headland(o = {}) {
  const g = grp(), r = rng(o.seed ?? 5);
  const W = 14, D = 5.8, H = o.H ?? 1.25;
  g.add(slab(o.seaW ?? 16, o.seaD ?? 8.2, { map: sea([6, 3]), side: G.night, h: 0.35 }).at(0, -H, -0.2));
  g.add(slab(W, D, { map: turf([5, 2]), side: texMat(cliff([4, Math.max(1, H / 1.25)])), h: H }));
  for (let i = 0; i < 30; i++) { // rocks along the cliff foot
    const t = i / 30, edge = t < 0.35 ? [-W / 2 + t / 0.35 * W, D / 2] : t < 0.6 ? [W / 2, D / 2 - (t - 0.35) / 0.25 * D] : [W / 2 - (t - 0.6) / 0.4 * W, -D / 2];
    const rs = 0.4 + r() * 0.35, rc = r() < 0.5 ? G.stone : G.mid;
    if (o.jetty && t > 0.6 && edge[0] > -3.0 && edge[0] < 0.6) continue;
    g.add(K.rock(rs, rc, 70 + i).flat().at(edge[0] + (r() - 0.5) * 0.3, -H - 0.15, edge[1] + (edge[1] > 0 ? 0.25 : -0.25) * (Math.abs(edge[0]) < W / 2 - 0.1 ? 1 : 0)));
  }
  [[W / 2 + 0.4, 0.5], [W / 2 + 0.3, -1.8], [-1, D / 2 + 0.4], [3.5, D / 2 + 0.45], [-5.2, D / 2 + 0.4]].forEach(([x, z], i) => g.add(grp(sph(0.3, G.chalk, { seg: 12 }).sc(1.6, 0.4, 1), sph(0.22, G.chalk, { seg: 12 }).sc(1.4, 0.45, 1).at(0.35, 0, 0.1)).weld().noShadow().at(x, -H - 0.05, z)));
  // the asylum, back on the cliff
  g.add(asylum({ red: o.red }).at(0.9, 0, -1.55));
  // drive: from the gate to the tower door
  g.add(box(1.1, 0.03, 3.0, texMat(flags([1, 3]))).at(0.9, 0, 1.25), box(2.4, 0.03, 1.0, texMat(flags([2, 1]))).at(-0.75, 0, 2.3));
  g.add(gatehouse().rot(0, deg(12), 0).at(-3.6, 0, 1.6));
  g.add(gatePillar().at(-2.35, 0, 2.55), gatePillar().at(-0.95, 0, 2.55));
  g.add(box(1.25, 0.08, 0.08, texMat(tex.stripes({ colors: [G.chalk, G.night], n: 8, vertical: true }))).at(-1.6, 0.85, 2.55));
  g.add(K.fence(4.3, G.slate, { h: 0.6, gap: 0.2 }).at(-4.85, 0, 2.62), K.fence(7.75, G.slate, { h: 0.6, gap: 0.2 }).at(3.0, 0, 2.62));
  // grounds
  g.add(deadTree(1.9, 3).at(-5.6, 0, -1.6), deadTree(1.6, 5).at(6.3, 0, -1.9), deadTree(1.3, 8).at(-2.2, 0, 0.7));
  g.add(graveyard().at(5.5, 0, 0.6));
  g.add(K.vehicle({ kind: 'bike', body: G.mid }).rot(0, deg(-10), deg(8)).at(-5.0, 0, 2.05)); // the guard's bike
  g.add(grp(cyl(0.04, 0.04, 1.3, G.dark, { seg: 8 }), K.sign('ASYLUM', { w: 0.9, h: 0.22, bg: G.chalk, fg: G.night, frame: G.dark }).at(0, 1.0, 0.05)).rot(0, deg(15), 0).at(-6.3, 0, 2.2));
  g.add(K.lamppost(1.4, G.dark, G.fog).at(-2.9, 0, 0.9));
  g.add(buggy().sc(0.7).rot(0, deg(70), 0).at(0.25, 0, 1.9));
  g.add(orderly().sc(0.72).rot(0, deg(-20), 0).at(1.7, 0, 1.6));
  g.add(bench(0.9).at(3.3, 0, 1.0), K.lamppost(1.4, G.dark, G.fog).at(1.65, 0, 0.55), K.lamppost(1.4, G.dark, G.fog).at(1.65, 0, 2.2));
  // night sky bits
  const moon = sph(0.62, K.glow(G.chalk), { seg: 28 }).at(...(o.moon ?? [-3.4, 4.7, -3.2])); g.add(moon);
  [[-0.9, 4.3, 0.2, 0.6], [1.2, 4.9, 0.1, 0.8], [-1.7, 5.0, -0.6, 0.5]].forEach(([x, y, z, s], i) => g.add(bat(s).rot(deg(-20), deg(i * 25), deg((i - 1) * 12)).at(x + 0.9, y, z - 1.0)));
  if (o.jetty) { // steps down the back of the cliff to a jetty
    const n = Math.round(H / 0.18);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), x = 2.6 - t * 3.2; g.add(box(0.36, 0.1, 0.42, G.pall).at(x, -i * 0.18 - 0.1, -D / 2 - 0.2), box(0.06, 0.4, 0.06, G.dark).at(x, -i * 0.18, -D / 2 - 0.4)); }
    g.add(box(1.0, H + 0.1, 0.4, G.stone).at(1.0, -H, -D / 2 - 0.2));
    g.add(box(2.4, 0.08, 0.6, texMat(tex.planks({ base: G.mid, line: G.dark, n: 6, vertical: true }))).at(-1.2, -H + 0.05, -D / 2 - 0.6), ...[-2.2, -0.4].map((x) => cyl(0.06, 0.06, 0.5, G.dark, { seg: 8 }).at(x, -H - 0.3, -D / 2 - 0.85)));
    g.add(K.vehicle({ kind: 'boat', body: G.mid, trim: G.chalk, len: 1.3 }).rot(0, deg(8), 0).at(-1.4, -H - 0.18, -D / 2 - 1.45));
    g.add(grp(K.lantern(G.dark, G.fog)).at(-0.4, -H + 0.13, -D / 2 - 0.85));
  }
  return g;
}

// --- environment: the monitor wall, close up. Every screen is a tiny boxed room.
function miniRoom(kind, alert = false) {
  const g = grp(), W = 1.1, H = 0.78, D = 0.5;
  g.add(box(W, 0.04, D, G.mid).at(0, 0, 0), box(W, H, 0.04, G.pall).at(0, 0, -D / 2 + 0.02), box(0.04, H, D, G.stone).at(-W / 2 + 0.02, 0, 0));
  const R = (c) => (alert ? CHANGED : c);
  if (kind === 'ward') [-0.32, 0.05, 0.42].forEach((x) => g.add(box(0.24, 0.1, 0.36, G.chalk).at(x, 0.04, -0.04), box(0.24, 0.16, 0.03, G.dark).at(x, 0.04, -0.22)));
  if (kind === 'corridor') { [-0.3, 0.1].forEach((x) => g.add(box(0.16, 0.4, 0.02, G.dark).at(x, 0.04, -D / 2 + 0.05))); g.add(box(0.02, 0.4, 0.14, G.dark).at(-W / 2 + 0.05, 0.04, 0)); g.add(box(0.12, 0.08, 0.06, G.stone).at(0.35, 0.04, 0.05)); }
  if (kind === 'kitchen') { g.add(box(0.5, 0.04, 0.26, G.chalk).at(-0.05, 0.22, 0), ...[-0.25, 0.15].map((x) => box(0.04, 0.18, 0.04, G.stone).at(x, 0.04, 0)), box(0.22, 0.5, 0.2, G.chalk).at(0.38, 0.04, -0.12), cyl(0.05, 0.05, 0.06, G.dark, { seg: 10 }).at(-0.1, 0.26, 0)); }
  if (kind === 'dayroom') { [-0.3, 0.05].forEach((x) => g.add(rbox(0.22, 0.14, 0.2, G.stone, { r: 0.04 }).at(x, 0.04, 0.02), rbox(0.22, 0.2, 0.05, G.stone, { r: 0.02 }).at(x, 0.04, -0.08))); g.add(box(0.2, 0.16, 0.12, G.dark).at(0.36, 0.2, -0.12), box(0.14, 0.16, 0.1, G.mid).at(0.36, 0.04, -0.12)); }
  if (kind === 'count') { // the Count's room: bed empty, window open
    g.add(box(0.3, 0.08, 0.42, G.chalk).at(-0.28, 0.04, -0.02), box(0.3, 0.2, 0.03, G.dark).at(-0.28, 0.04, -0.22));
    g.add(box(0.3, 0.3, 0.02, PALE).at(0.22, 0.32, -D / 2 + 0.05), grp(box(0.15, 0.3, 0.02, R(G.stone)).at(0.075, 0, 0)).rot(0, deg(-70), 0).at(0.37, 0.32, -D / 2 + 0.07));
    g.add(box(0.36, 0.36, 0.015, G.stone).at(0.22, 0.29, -D / 2 + 0.042));
  }
  if (kind === 'stairs') for (let i = 0; i < 6; i++) g.add(box(0.5, 0.07, 0.08, i % 2 ? G.mid : G.pall).at(0.1, 0.04 + i * 0.07, 0.12 - i * 0.065));
  if (kind === 'chapel') { [0.0, 0.14].forEach((z) => [-0.3, 0.15].forEach((x) => g.add(box(0.3, 0.1, 0.07, G.stone).at(x, 0.04, z)))); g.add(box(0.3, 0.16, 0.12, G.chalk).at(-0.07, 0.04, -0.17), ...[-0.15, 0.01].map((x) => cyl(0.012, 0.012, 0.08, G.chalk, { seg: 6 }).at(x, 0.2, -0.17))); }
  if (kind === 'library') [-0.3, 0.05, 0.38].forEach((x) => { g.add(box(0.26, 0.6, 0.1, G.stone).at(x, 0.04, -0.17)); [0.16, 0.32, 0.48].forEach((y) => g.add(box(0.22, 0.1, 0.06, G.dark).at(x, 0.04 + y - 0.1, -0.13))); });
  if (kind === 'yard') { g.add(cyl(0.18, 0.2, 0.08, G.mid, { seg: 14 }).at(0, 0.04, 0), cyl(0.04, 0.04, 0.16, G.mid, { seg: 8 }).at(0, 0.12, 0), sph(0.1, G.stone, { seg: 10 }).sc(1.5, 0.8, 1).at(-0.38, 0.12, -0.12), sph(0.1, G.stone, { seg: 10 }).sc(1.5, 0.8, 1).at(0.38, 0.12, -0.12)); }
  return g;
}
const screenOverlay = (cam, time = '03:12') => {
  const t = tex.custom(256, 184, (x, w, h) => { x.fillStyle = 'rgba(0,0,0,0.16)'; for (let y = 0; y < h; y += 5) x.fillRect(0, y, w, 1.6); x.fillStyle = '#f7f4ef'; x.font = '600 20px "DM Mono", ui-monospace, monospace'; x.fillText(`CAM ${cam}`, 10, 24); x.fillText(time, w - 64, h - 10); x.beginPath(); x.arc(w - 18, 18, 5, 0, 7); x.fill(); });
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  const m = K.plane(1.1, 0.78, K.glow('#ffffff', { map: t, opacity: 0.99, depthWrite: false }), { cast: false, receive: false }).rot(deg(90), 0, 0).noInk(); m.renderOrder = 2; return m;
};
function monitorWall() {
  const g = grp();
  g.add(slab(4.6, 2.1, { map: tex.planks({ base: G.mid, line: G.stone, n: 6, rep: [1, 1] }), side: G.stone, h: 0.3 }).at(0, 0, 0.3));
  g.add(box(4.4, 3.2, 0.2, G.dark).at(0, 0, -0.62));
  const rooms = [['corridor', 1], ['ward', 2], ['kitchen', 3], ['dayroom', 4], ['count', 5, true], ['stairs', 6], ['chapel', 7], ['library', 8], ['yard', 9]];
  rooms.forEach(([k, c, a], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = (col - 1) * 1.36, y = 2.2 - row * 0.98;
    const cell = grp(box(1.24, 0.06, 0.56, G.slate).at(0, -0.06, 0), box(1.24, 0.06, 0.56, G.slate).at(0, 0.78, 0), box(0.06, 0.9, 0.56, G.slate).at(-0.59, -0.06, 0), box(0.06, 0.9, 0.56, G.slate).at(0.59, -0.06, 0));
    cell.add(miniRoom(k, !!a), screenOverlay(c).at(0, 0.39, 0.29), glowLight(0.28, 0.9).at(0.1, 0.6, 0.1));
    if (a) cell.add(K.plane(0.4, 0.34, K.glow(RED, { opacity: 0.99, depthWrite: false, map: tex.custom(128, 108, (x, w, h) => { x.strokeStyle = '#fff'; x.lineWidth = 6; x.setLineDash([16, 10]); x.strokeRect(4, 4, w - 8, h - 8); }) }), { cast: false, receive: false }).rot(deg(90), 0, 0).at(0.27, 0.47, 0.28).noInk());
    g.add(cell.at(x, y, -0.25));
    g.add(K.sign(`CAM ${c}`, { w: 0.34, h: 0.1, bg: G.night, fg: G.chalk, frame: G.night }).at(x - 0.4, y - 0.18, 0.04));
  });
  // on the desk
  g.add(box(0.9, 0.03, 0.26, G.fog).at(-0.3, 0, 0.85), grp(cyl(0.08, 0.1, 0.04, G.dark, { seg: 12 }), cyl(0.02, 0.02, 0.16, G.dark, { seg: 8 }).at(0, 0.04, 0), sph(0.045, G.stone, { seg: 10 }).at(0, 0.21, 0)).at(0.45, 0, 0.85));
  g.add(clipboard(true).rot(0, deg(14), 0).at(-1.3, 0, 0.8), thermos().at(1.3, 0, 0.6), mug().at(1.55, 0, 0.95));
  // the guard's cap left on the desk
  g.add(grp(sph(0.17, G.slate, { part: 'top', seg: 16 }).sc(1, 0.7, 1), cyl(0.1, 0.1, 0.02, G.slate, { seg: 16, t0: -1, tl: 2 }).sc(1, 1, 1.4).at(0, 0, 0.16)).rot(0, deg(-30), 0).at(0.95, 0, 1.0));
  g.add(bat(0.5).rot(deg(-60), 0, 0).at(-1.95, 3.1, -0.2)); // a bat hanging off the top of the wall, because of course
  return g;
}

export default {
  slug: 'nightwatch',
  title: 'Night Watch',
  logline: 'Night shift in the security office of a cliff-top asylum. One of the patients is a vampire. Spot what changed.',
  genre: ['Observation', 'Desk sim', 'Cosy-creepy'],
  theme: { accent: RED, accentInk: P.g7, cardBg: '#d5d2cd', plinth: P.g4, plinthRim: P.g2 },
  mode: { mono: true, accent: RED, accentName: 'Signal red', rule: 'something changed: an anomaly to log' },
  pitch: 'You watch a wall of CCTV monitors from a cramped office. Every room is a tiny greyscale diorama. When something changes (a chair moved, a window open, an empty bed) it turns red once you spot it. Log it, send the orderly and keep the night calm until 6am. Clues about the vampire build up over the nights.',
  loop: ['Scan the monitor wall', 'Spot the change', 'Clip a red tag on the clipboard', 'Send the orderly', 'Reach 6am and the story moves on'],
  why: ['Each monitor is a tiny diorama room, which is what this style does best.', 'Greyscale plus red makes the rule readable in one screenshot.', 'Toon softness keeps it cosy-creepy, never gory.'],
  fromYou: 'From your security-camera ideas session, and the vampire asylum twist was yours. Desk sims are hot on Steam right now: Quarantine Zone sold 1M+ in three months.',
  similar: [
    { name: 'Papers, Please', url: 'https://store.steampowered.com/app/239030', note: 'one desk, one rulebook, rising tension' },
    { name: 'No, I\'m not a Human', url: 'https://store.steampowered.com/app/3180070', note: 'spot who is wrong, night after night' },
    { name: 'Quarantine Zone', url: 'https://store.steampowered.com/app/3419520', note: 'checkpoint desk sim, 1M+ in three months' },
    { name: 'SUPERHOT', url: 'https://store.steampowered.com/app/322500', note: 'one strict colour rule, readable at a glance' },
  ],
  palette: [['Night', P.g0], ['Slate', P.g1], ['Asylum stone', P.g3], ['Ward grey', P.g5], ['Moonlight', P.g7], ['Signal red', RED]],
  key: { build: safe(() => headland()), bg: NIGHT.bg, light: 'night', cam: { yaw: -20, pitch: 19, fov: 24 }, caption: 'Gatehouse lit, one red window, 3:12am' },
  characters: [
    { name: 'The night guard', role: 'You. Cap, thermos, nine screens and a clipboard.', build: safe(nightGuard, 0.35) },
    { name: 'Dee the orderly', role: 'Goes where you send her. Never runs.', build: safe(orderly, 0.35) },
    { name: 'The Count', role: 'Room 12. Pale, polite, never seen at breakfast.', build: safe(theCount, 0.35) },
    { name: 'Mortimer', role: 'Asylum cat. Sleeps on whichever monitor is warmest.', build: safe(asylumCat, 0.35) },
  ],
  builds: [
    { name: 'The security desk', tag: 'Structure', note: 'Six feeds, one clipboard. CAM 5 has a red tag.', build: safe(securityDesk), stage: OFFICE, cam: { yaw: -20, pitch: 18 } },
    { name: 'The asylum', tag: 'Building', note: 'Gothic, one tower, a clock stuck near three.', build: safe(() => grp(slab(9.0, 3.6, { map: turf([3, 1.2]), side: G.stone, h: 0.5 }).at(0, 0, 0.2), asylum({ red: 'front' }))), stage: CARD, cam: { yaw: -22, pitch: 14 } },
    { name: 'Orderly\'s buggy', tag: 'Vehicle', note: 'Mop, bucket, spare blankets. White lights only.', build: safe(() => grp(slab(2.6, 1.7, { map: flags([2, 1.4]), side: G.stone, h: 0.2 }), buggy().rot(0, deg(-25), 0))), stage: CARD, cam: { yaw: -28, pitch: 20 } },
    { name: 'Patient room', tag: 'Structure', note: 'Bed, barred window, chair. The chair has moved.', build: safe(() => patientRoom({ chair: 'red' })), stage: OFFICE, cam: { yaw: 32, pitch: 30 } },
  ],
  environments: [
    { name: 'The monitor wall', note: 'Nine rooms, nine tiny dioramas. CAM 5: the window is open.', build: safe(monitorWall), stage: OFFICE, cam: { yaw: -6, pitch: 12 } },
    { name: 'The cliff side', note: 'From the sea: the steps down to the jetty, and one red window at the back.', build: safe(() => headland({ red: 'back', jetty: true, H: 2.2, moon: [-2.2, 5.2, 3.0], seaW: 15, seaD: 7.8 })), stage: NIGHT, cam: { yaw: 160, pitch: 15, fov: 24 } },
  ],
};
