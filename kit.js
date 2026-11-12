// kit.js — "Ink & Grain" toon kit.
// A tiny three.js toolkit that renders chunky low-poly scenes in the kite-shop house style:
// 3-tone cel shading, warm fill light, ink outlines (silhouette + crease + object edges, slight hand wobble),
// and paper grain. One shared WebGL renderer draws every card into its own 2D canvas.
//
// CONVENTIONS (read me before building assets)
//  - Units: a grown-up person is ~1.7 tall. +Y up, +Z is the FRONT of a thing (faces the camera by default).
//  - box/rbox/cyl/cone/cap/prism/lathe/disc all sit with their BASE ON y=0. sph() is centred.
//  - Every primitive returns a THREE.Mesh with toon material, shadows on. Chain .at(x,y,z) .rot(x,y,z) .sc(x,y,z).
//  - grp(...children) makes a Group. Object3D also gets .put(...kids) (alias of add) and helpers below.
//  - .weld()  : no ink lines BETWEEN meshes inside this object (still outlined as a whole, still creases).
//  - .noInk() : this object never draws ink and never blocks ink (eyes, blush, strings, glows, decals).
//  - .flat()  : faceted low-poly shading (flatShading) — good for rocks, crystals, gems.
//  - Colours: pass any CSS hex. Use P.* (house palette) for consistency.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
export { THREE };

// ---------------------------------------------------------------- palette
export const P = {
  ink: '#2a1c14', ink2: '#3b2a20',
  paper: '#fbf5e8', cream: '#f4ead6', wall: '#eadfc8', linen: '#efe2c6',
  wood: '#c2824a', woodDk: '#8c5732', woodLt: '#ddab72', cork: '#cf9f66', bark: '#7a4a2c',
  red: '#e2482f', terracotta: '#cf5b3d', brick: '#b8573e', coral: '#ef7a5a', pink: '#ec8fab',
  mustard: '#f1b42f', butter: '#f6d77a', orange: '#ec8a2e',
  blue: '#3a7bd5', sky: '#a9d6e6', skyLt: '#d6ecf0', sea: '#4aa3b5', seaDk: '#2f7d93', navy: '#2f3f63',
  teal: '#3e8d70', mat: '#3f8a6b', green: '#3fa564', leaf: '#5d9e4c', leafLt: '#8fbe5a', moss: '#77a14e', pine: '#3f7650', olive: '#8a8f4a',
  sand: '#ecd3a0', sandDk: '#d8b57c', soil: '#8b5e3c', soilDk: '#6b4630', clay: '#c98a5e',
  stone: '#b9ad9a', stoneDk: '#8e8475', slate: '#6f7a86', steel: '#97a2ad', iron: '#4d5560', glass: '#bfe3ec', glassDk: '#5f8fa3',
  white: '#fbf7ee', snow: '#f4f6f4', lilac: '#a99bd0', plum: '#7a4f7c',
  skin1: '#f6d0b0', skin2: '#e3ab84', skin3: '#b97a55', skin4: '#7d4e34',
  hairBlack: '#2f2622', hairBrown: '#6b4128', hairAuburn: '#a24e2a', hairBlonde: '#e7c071', hairGrey: '#c9c3bb', hairWhite: '#f1ece2',
  // greyscale ramp for mono boards
  g0: '#1e1c1b', g1: '#3a3836', g2: '#5d5a57', g3: '#86827d', g4: '#aca7a1', g5: '#cfcac3', g6: '#e9e5de', g7: '#f7f4ef',
};

// ---------------------------------------------------------------- materials
const RAMP = (() => {
  const d = new Uint8Array([112, 112, 112, 255, 186, 186, 186, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  return t;
})();
const _mats = new Map();
export function mat(color = P.white, o = {}) {
  if (color && color.isMaterial) return color;
  const key = !o.map && !o.emissive && o.opacity == null && !o.side ? String(color) : null;
  if (key && _mats.has(key)) return _mats.get(key);
  const m = new THREE.MeshToonMaterial({
    color: new THREE.Color(color), gradientMap: RAMP, map: o.map || null,
    emissive: o.emissive ? new THREE.Color(o.emissive) : new THREE.Color(0), emissiveIntensity: o.emissiveIntensity ?? 1,
    transparent: o.opacity != null && o.opacity < 1, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide,
  });
  if (key) _mats.set(key, m);
  return m;
}
/** Glowing (unlit) material — lamps, screens, fire, light beams. */
export function glow(color, o = {}) {
  return new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: o.opacity != null, opacity: o.opacity ?? 1, side: o.side ?? THREE.FrontSide, map: o.map || null, depthWrite: o.depthWrite ?? true });
}

function M(geo, color, o = {}) {
  const m = new THREE.Mesh(geo, Array.isArray(color) || (color && color.isMaterial) ? color : mat(color, o));
  m.castShadow = o.cast ?? true; m.receiveShadow = o.receive ?? true;
  return m;
}

// ---------------------------------------------------------------- chain helpers
const O3 = THREE.Object3D.prototype;
O3.at = function (x = 0, y = 0, z = 0) { this.position.set(x, y, z); return this; };
O3.rot = function (x = 0, y = 0, z = 0) { this.rotation.set(x, y, z); return this; };
O3.sc = function (x = 1, y = x, z = x) { this.scale.set(x, y, z); return this; };
O3.put = function (...kids) { kids.flat().forEach((k) => k && this.add(k)); return this; };
let _weldKey = 1000;
O3.weld = function () { const k = ++_weldKey; this.traverse((o) => { if (o.isMesh) o.userData.inkKey = k; }); return this; };
O3.noInk = function () { this.traverse((o) => { if (o.isMesh) o.userData.noInk = true; }); return this; };
O3.noShadow = function () { this.traverse((o) => { if (o.isMesh) { o.castShadow = false; } }); return this; };
O3.flat = function () { this.traverse((o) => { if (o.isMesh) { const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.deleteAttribute('normal'); g.computeVertexNormals(); o.geometry = g; } }); return this; };
export const grp = (...kids) => new THREE.Group().put(...kids);
export const deg = (d) => (d * Math.PI) / 180;

// seeded random so boards render the same every time
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

// ---------------------------------------------------------------- primitives (base on y=0 unless noted)
export const box = (w, h, d, c, o) => M(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), c, o);
export const rbox = (w, h, d, c, o = {}) => M(new RoundedBoxGeometry(w, h, d, o.seg ?? 3, Math.min(o.r ?? 0.08, w / 2.01, h / 2.01, d / 2.01)).translate(0, h / 2, 0), c, o);
export const cyl = (rt, rb, h, c, o = {}) => M(new THREE.CylinderGeometry(rt, rb, h, o.seg ?? 24, 1, !!o.open, o.t0 ?? 0, o.tl ?? Math.PI * 2).translate(0, h / 2, 0), c, o);
export const cone = (r, h, c, o = {}) => M(new THREE.ConeGeometry(r, h, o.seg ?? 24).translate(0, h / 2, 0), c, o);
/** centred sphere. o.part: 'top' (dome, base at y=0) | 'bottom' (bowl, rim at y=0) */
export function sph(r, c, o = {}) {
  const s = o.seg ?? 24;
  let g;
  if (o.part === 'top') g = new THREE.SphereGeometry(r, s, Math.ceil(s / 2), 0, Math.PI * 2, 0, Math.PI / 2);
  else if (o.part === 'bottom') g = new THREE.SphereGeometry(r, s, Math.ceil(s / 2), 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  else g = new THREE.SphereGeometry(r, s, Math.ceil(s * 0.75));
  return M(g, c, o);
}
export const cap = (r, len, c, o = {}) => M(new THREE.CapsuleGeometry(r, len, 6, o.seg ?? 16).translate(0, len / 2 + r, 0), c, o);
export const torus = (R, r, c, o = {}) => M(new THREE.TorusGeometry(R, r, o.rs ?? 10, o.ts ?? 32, o.arc ?? Math.PI * 2), c, o);
export const disc = (r, h, c, o = {}) => cyl(r, r, h, c, o);
/** Triangular prism: triangle base `w` (along X), height `h`, length `d` (along Z). Base on y=0. */
export function prism(w, h, d, c, o = {}) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo((o.peak ?? 0) * w / 2, h); s.closePath();
  return M(new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false }).translate(0, 0, -d / 2), c, o);
}
/** Extrude a 2D outline [[x,y],...] (in XY plane) by depth along Z, centred on z. */
export function extrude(pts, depth, c, o = {}) {
  const s = new THREE.Shape(); pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y))); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: !!o.bevel, bevelSize: o.bevel || 0, bevelThickness: o.bevel || 0, bevelSegments: 2, curveSegments: 12 });
  return M(g.translate(0, 0, -depth / 2), c, o);
}
/** Lathe a profile [[radius, y], ...] around Y. */
export const lathe = (pts, c, o = {}) => M(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), o.seg ?? 24), c, { side: THREE.DoubleSide, ...o });
/** Horizontal plane at y=0. */
export const plane = (w, d, c, o = {}) => M(new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2), c, o);
/** Rope / string / pipe through 3D points. */
export function tube(points, r, c, o = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', o.tension ?? 0.5);
  return M(new THREE.TubeGeometry(curve, o.segs ?? 48, r, o.rs ?? 8, false), c, o);
}
/** Faceted rock (centred, sits roughly on y=0). */
export function rock(s = 0.5, c = P.stone, seed = 3) {
  const r = rng(seed), g = new THREE.DodecahedronGeometry(s, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.8 + r() * 0.4), p.getY(i) * (0.55 + r() * 0.3), p.getZ(i) * (0.8 + r() * 0.4));
  const ni = g.index ? g.toNonIndexed() : g; ni.computeVertexNormals();
  return M(ni.translate(0, s * 0.35, 0), c);
}

// ---------------------------------------------------------------- canvas textures
function canvasTex(w, h, draw, rep = [1, 1]) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...rep);
  t.anisotropy = 4; return t;
}
export const tex = {
  grid: ({ bg = P.mat, line = '#cfe6d6', cells = 8, lw = 3, rep = [1, 1] } = {}) => canvasTex(512, 512, (x, w) => { x.fillStyle = bg; x.fillRect(0, 0, w, w); x.strokeStyle = line; x.lineWidth = lw; for (let i = 0; i <= cells; i++) { const p = (i / cells) * w; x.beginPath(); x.moveTo(p, 0); x.lineTo(p, w); x.moveTo(0, p); x.lineTo(w, p); x.stroke(); } }, rep),
  stripes: ({ colors = [P.red, P.white], n = 8, vertical = true, rep = [1, 1] } = {}) => canvasTex(256, 256, (x, w) => { const s = w / n; for (let i = 0; i < n; i++) { x.fillStyle = colors[i % colors.length]; vertical ? x.fillRect(i * s, 0, s + 1, w) : x.fillRect(0, i * s, w, s + 1); } }, rep),
  planks: ({ base = P.wood, line = P.woodDk, n = 6, vertical = false, rep = [1, 1] } = {}) => canvasTex(256, 256, (x, w) => { x.fillStyle = base; x.fillRect(0, 0, w, w); x.strokeStyle = line; x.lineWidth = 3; const s = w / n; for (let i = 1; i < n; i++) { x.beginPath(); vertical ? (x.moveTo(i * s, 0), x.lineTo(i * s, w)) : (x.moveTo(0, i * s), x.lineTo(w, i * s)); x.stroke(); } }, rep),
  bricks: ({ base = P.brick, mortar = P.linen, rows = 8, cols = 4, rep = [1, 1] } = {}) => canvasTex(256, 256, (x, w) => { x.fillStyle = mortar; x.fillRect(0, 0, w, w); const rh = w / rows, cw = w / cols; x.fillStyle = base; for (let r = 0; r < rows; r++) for (let c = -1; c < cols; c++) x.fillRect(c * cw + (r % 2) * cw / 2 + 2, r * rh + 2, cw - 4, rh - 4); }, rep),
  speckle: ({ base = P.leaf, dots = [P.leafLt], n = 120, size = 5, seed = 2, rep = [1, 1] } = {}) => canvasTex(256, 256, (x, w) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, w); for (let i = 0; i < n; i++) { x.fillStyle = dots[i % dots.length]; x.beginPath(); x.ellipse(r() * w, r() * w, size * (0.5 + r()), size * (0.4 + r() * 0.5), r() * 3, 0, 7); x.fill(); } }, rep),
  waves: ({ base = P.sea, line = '#8fd0da', rows = 7, rep = [1, 1], seed = 5 } = {}) => canvasTex(256, 256, (x, w) => { const r = rng(seed); x.fillStyle = base; x.fillRect(0, 0, w, w); x.strokeStyle = line; x.lineWidth = 4; x.lineCap = 'round'; for (let i = 0; i < rows * 3; i++) { const cx = r() * w, cy = r() * w, l = 14 + r() * 26; x.beginPath(); x.moveTo(cx - l, cy); x.quadraticCurveTo(cx - l / 2, cy - 6, cx, cy); x.quadraticCurveTo(cx + l / 2, cy + 6, cx + l, cy); x.stroke(); } }, rep),
  checker: ({ a = P.white, b = P.red, n = 8, rep = [1, 1] } = {}) => canvasTex(256, 256, (x, w) => { const s = w / n; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { x.fillStyle = (i + j) % 2 ? a : b; x.fillRect(i * s, j * s, s, s); } }, rep),
  tiles: ({ base = P.white, line = P.stone, n = 6, rep = [1, 1] } = {}) => canvasTex(256, 256, (x, w) => { x.fillStyle = base; x.fillRect(0, 0, w, w); x.strokeStyle = line; x.lineWidth = 3; const s = w / n; for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, w); x.moveTo(0, i * s); x.lineTo(w, i * s); x.stroke(); } }, rep),
  /** Text label (signs, tickets, screens). */
  text: (str, { bg = P.cream, fg = P.ink, font = '700 120px "Bricolage Grotesque", system-ui, sans-serif', w = 512, h = 192, border = 0, align = 'center' } = {}) => canvasTex(w, h, (x) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); if (border) { x.strokeStyle = fg; x.lineWidth = border; x.strokeRect(border / 2, border / 2, w - border, h - border); } x.fillStyle = fg; x.font = font; x.textAlign = align; x.textBaseline = 'middle'; const lines = String(str).split('\n'); const lh = h / (lines.length + 0.4); lines.forEach((l, i) => x.fillText(l, align === 'center' ? w / 2 : 24, h / 2 + (i - (lines.length - 1) / 2) * lh)); }),
  /** Vertical gradient for sky backgrounds: [[stop, color], ...] top→bottom. */
  gradient: (stops) => { const t = canvasTex(4, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([s, c]) => g.addColorStop(s, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; },
  /** Draw anything: tex.custom(w,h,(ctx,w,h)=>{...}) */
  custom: (w, h, draw, rep) => canvasTex(w, h, draw, rep),
};
/** Mesh with a texture: texMat(texture) → white toon material carrying the map. */
export const texMat = (t, o = {}) => mat('#ffffff', { map: t, ...o });

// ---------------------------------------------------------------- staging pieces
/** Diorama ground slab: top surface at y=0, soil sides below. */
export function ground(w, d, o = {}) {
  const h = o.h ?? 0.35, top = o.top ?? P.leaf, side = o.side ?? P.soil;
  const g = grp(box(w, h - 0.06, d, side).at(0, -h, 0));
  const t = box(w, 0.06, d, o.map ? texMat(o.map) : top).at(0, -0.06, 0);
  g.add(t);
  return g.weld();
}
/** Round plinth for figures: top at y=0. */
export function plinth(r = 0.6, o = {}) {
  const h = o.h ?? 0.14;
  return grp(cyl(r, r * 1.04, h, o.color ?? P.woodLt, { seg: 40 }).at(0, -h, 0), cyl(r * 1.04, r * 1.08, 0.04, o.rim ?? P.wood, { seg: 40 }).at(0, -h - 0.04, 0));
}
export function water(w, d, o = {}) {
  return plane(w, d, texMat(tex.waves({ base: o.color ?? P.sea, line: o.line ?? '#9ad6de', rep: o.rep ?? [Math.max(1, w / 3), Math.max(1, d / 3)] })), { cast: false });
}

// ---------------------------------------------------------------- nature
export function tree(o = {}) {
  const kind = o.kind ?? 'round', h = o.h ?? 2, leaf = o.leaf ?? P.leaf, trunk = o.trunk ?? P.bark, r = rng(o.seed ?? 7);
  const g = grp();
  if (kind === 'pine') {
    g.add(cyl(0.09 * h / 2, 0.12 * h / 2, h * 0.3, trunk));
    for (let i = 0; i < 3; i++) g.add(cone(h * (0.36 - i * 0.08), h * 0.42, leaf, { seg: 10 }).at(0, h * (0.22 + i * 0.2), 0));
  } else if (kind === 'palm') {
    const pts = []; for (let i = 0; i <= 6; i++) pts.push([Math.sin(i / 6 * 1.2) * h * 0.18, (i / 6) * h, 0]);
    g.add(tube(pts, 0.07 * h / 2, trunk, { segs: 24 }));
    const top = pts[6];
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2, leafM = extrude([[0, 0], [0.25, 0.08], [0.6, 0.02], [0.95, -0.18], [0.55, -0.06], [0.2, -0.05]].map(([x, y]) => [x * h * 0.55, y * h * 0.55]), 0.03, leaf);
      g.add(grp(leafM.rot(deg(90), 0, 0)).at(top[0], top[1], top[2]).rot(0, a, deg(-12)));
    }
    g.add(sph(0.07 * h, P.woodDk).at(top[0], top[1] - 0.05, top[2]));
  } else if (kind === 'bush') {
    for (let i = 0; i < 4; i++) g.add(sph(h * (0.28 + r() * 0.12), leaf, { seg: 14 }).at((r() - 0.5) * h * 0.6, h * 0.25, (r() - 0.5) * h * 0.4));
    g.weld();
  } else if (kind === 'dead') {
    g.add(cyl(0.06 * h / 2, 0.1 * h / 2, h * 0.75, trunk, { seg: 7 }));
    for (let i = 0; i < 3; i++) g.add(cyl(0.015 * h, 0.03 * h, h * 0.35, trunk, { seg: 6 }).at(0, h * (0.35 + i * 0.12), 0).rot(0, i * 2.1, deg(40 + i * 8) * (i % 2 ? 1 : -1)));
  } else if (kind === 'willow') {
    g.add(cyl(0.1 * h / 2, 0.14 * h / 2, h * 0.55, trunk));
    const crown = grp(); for (let i = 0; i < 5; i++) crown.add(sph(h * 0.3, leaf, { seg: 14 }).sc(1, 1.3, 1).at(Math.cos(i * 1.3) * h * 0.22, h * 0.6 - i * 0.02, Math.sin(i * 1.3) * h * 0.22));
    g.add(crown.weld());
  } else { // round
    g.add(cyl(0.08 * h / 2, 0.12 * h / 2, h * 0.5, trunk));
    const crown = grp(sph(h * 0.32, leaf, { seg: 16 }).at(0, h * 0.68, 0), sph(h * 0.22, leaf, { seg: 14 }).at(h * 0.2, h * 0.58, h * 0.05), sph(h * 0.2, leaf, { seg: 14 }).at(-h * 0.18, h * 0.6, -h * 0.05));
    g.add(crown.weld());
  }
  return g;
}
export function flower(c = P.pink, h = 0.25) { return grp(cyl(0.012, 0.012, h, P.leaf, { seg: 6 }), sph(0.045, c, { seg: 10 }).at(0, h, 0)); }
export function grassTuft(c = P.moss, s = 0.2) { return grp(cone(s * 0.18, s, c, { seg: 5 }).rot(0, 0, 0.3), cone(s * 0.18, s * 1.2, c, { seg: 5 }).at(0.04, 0, 0), cone(s * 0.18, s * 0.9, c, { seg: 5 }).at(-0.04, 0, 0.02).rot(0, 0, -0.3)).weld(); }

// ---------------------------------------------------------------- people
const HAT_DEFAULTS = { cap: P.red, beanie: P.mustard, straw: P.butter, chef: P.white, helmet: P.steel, hardhat: P.mustard, wizard: P.plum, beret: P.red, bucket: P.sand, captain: P.navy, crown: P.mustard, bandana: P.red, hood: P.teal, top: P.ink2, flatcap: P.woodDk, sou: P.mustard };
/**
 * person({ skin, hair, hairStyle, top, bottom, shoes, hat, hatColor, apron, acc:[...], held, pose, body, skirt })
 *  hairStyle: short | bob | long | bun | ponytail | curly | spiky | bald | pigtails
 *  hat: cap | beanie | straw | chef | helmet | hardhat | wizard | beret | bucket | captain | crown | bandana | hood | top | flatcap | sou
 *  acc: glasses | scarf | backpack | satchel | beard | moustache | tie | bowtie | headphones | goggles | earrings | badge | lantern
 *  pose: stand | wave | hold | carry | point | hips
 *  body: adult | kid | tall | round | tiny | elder
 *  held: any Object3D placed in the right hand (pose 'hold'/'carry' puts it in front)
 */
export function person(o = {}) {
  const c = Object.assign({ skin: P.skin1, hair: P.hairBrown, hairStyle: 'short', top: P.blue, bottom: '#4b5468', shoes: P.ink2, hat: null, hatColor: null, apron: null, acc: [], held: null, pose: 'stand', body: 'adult', skirt: false, sleeves: null }, o);
  const B = { adult: { s: 1, w: 1, hd: 1 }, kid: { s: 0.68, w: 0.95, hd: 1.18 }, tall: { s: 1.1, w: 0.9, hd: 0.95 }, round: { s: 1, w: 1.28, hd: 1 }, tiny: { s: 0.5, w: 1.05, hd: 1.3 }, elder: { s: 0.95, w: 1.08, hd: 1 } }[c.body] || { s: 1, w: 1, hd: 1 };
  const g = grp(), w = B.w;
  const acc = new Set(c.acc);
  // feet + legs
  [-1, 1].forEach((s) => {
    g.add(sph(0.12, c.shoes, { seg: 16 }).sc(1, 0.6, 1.35).at(s * 0.12 * w, 0.065, 0.04));
    g.add(cyl(0.095, 0.1, 0.36, c.skirt ? c.skin : c.bottom, { seg: 14 }).at(s * 0.12 * w, 0.08, 0));
  });
  // hips / skirt
  if (c.skirt) g.add(cyl(0.27 * w, 0.4 * w, 0.32, c.bottom, { seg: 24 }).at(0, 0.34, 0));
  else g.add(rbox(0.56 * w, 0.24, 0.4 * w, c.bottom, { r: 0.1 }).at(0, 0.38, 0));
  // torso (lathe bean)
  const tp = [[0.001, 0], [0.27, 0.0], [0.31, 0.12], [0.31, 0.3], [0.27, 0.42], [0.14, 0.5], [0.001, 0.51]];
  const torso = lathe(tp, c.top, { seg: 24 }).sc(w, 1, w * 0.8).at(0, 0.52, 0);
  g.add(torso);
  if (c.apron) g.add(box(0.46 * w, 0.62, 0.03, c.apron).at(0, 0.3, 0.26 * w + 0.01), box(0.05, 0.22, 0.02, c.apron).at(-0.13 * w, 0.85, 0.2 * w).rot(-0.3, 0, 0), box(0.05, 0.22, 0.02, c.apron).at(0.13 * w, 0.85, 0.2 * w).rot(-0.3, 0, 0));
  if (acc.has('tie')) g.add(box(0.06, 0.3, 0.02, P.red).at(0, 0.66, 0.25 * w));
  if (acc.has('bowtie')) g.add(grp(cone(0.05, 0.08, P.red, { seg: 4 }).rot(0, 0, deg(90)).at(0.05, 0, 0), cone(0.05, 0.08, P.red, { seg: 4 }).rot(0, 0, deg(-90)).at(-0.05, 0, 0)).at(0, 0.98, 0.18 * w));
  if (acc.has('badge')) g.add(cyl(0.045, 0.045, 0.02, P.mustard, { seg: 12 }).rot(deg(90), 0, 0).at(0.13 * w, 0.82, 0.25 * w));
  // arms
  const arm = (side) => {
    const piv = grp().at(side * 0.33 * w, 0.98, 0);
    const len = 0.34, r = 0.085;
    const a = cap(r, len, c.sleeves ?? c.top, { seg: 12 }).rot(0, 0, Math.PI);
    const hand = sph(0.085, c.skin, { seg: 12 }).at(0, -(len + r * 2), 0);
    piv.put(a, hand);
    piv.userData.hand = hand;
    let rz = side * 0.14, rx = 0;
    if (c.pose === 'wave' && side > 0) rz = 2.6;
    if (c.pose === 'point' && side > 0) { rz = 0.3; rx = -1.45; }
    if (c.pose === 'hips') rz = side * 0.75;
    if (c.pose === 'hold' || c.pose === 'carry') { rx = c.pose === 'carry' ? -1.35 : -0.9; rz = side * -0.12; }
    piv.rotation.set(rx, 0, rz);
    return piv;
  };
  const R = arm(1), L = arm(-1);
  g.put(R, L);
  // head
  const hr = 0.34 * B.hd, hy = 1.06 + hr * 0.92;
  const head = grp().at(0, hy, 0);
  head.add(sph(hr, c.skin, { seg: 28 }).sc(1, 0.95, 0.93));
  const fz = hr * 0.9;
  [-1, 1].forEach((s) => {
    head.add(sph(hr * 0.105, P.ink, { seg: 10 }).sc(1, 1.3, 0.6).at(s * hr * 0.36, hr * 0.04, fz).noInk());
    head.add(sph(hr * 0.16, P.pink, { seg: 10 }).sc(1, 0.55, 0.3).at(s * hr * 0.58, -hr * 0.2, fz * 0.88).noInk());
  });
  head.add(sph(hr * 0.13, c.skin, { seg: 12 }).at(0, -hr * 0.08, fz + hr * 0.06));
  head.add(torus(hr * 0.12, hr * 0.025, P.ink, { arc: Math.PI, ts: 12 }).rot(0, 0, Math.PI).at(0, -hr * 0.3, fz * 0.97).noInk());
  [-1, 1].forEach((s) => head.add(sph(hr * 0.16, c.skin, { seg: 10 }).sc(0.6, 1, 0.8).at(s * hr * 0.95, 0, 0)));
  // hair
  const H = c.hair, hs = c.hairStyle;
  if (hs !== 'bald') {
    const capR = hr * 1.06;
    const capM = M(new THREE.SphereGeometry(capR, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.56), H);
    head.add(grp(capM).rot(-0.42, 0, 0).at(0, hr * 0.06, -hr * 0.05));
    if (hs === 'bob' || hs === 'long' || hs === 'pigtails') {
      const hl = hs === 'long' ? hr * 2.1 : hr * 1.05;
      head.add(M(new THREE.CylinderGeometry(capR * 1.0, capR * (hs === 'long' ? 1.05 : 1.08), hl, 28, 1, true, Math.PI * 0.32, Math.PI * 1.36).translate(0, -hl / 2 + hr * 0.15, 0), H, { side: THREE.DoubleSide }).at(0, 0, -hr * 0.03));
    }
    if (hs === 'bun') head.add(sph(hr * 0.42, H, { seg: 16 }).at(0, hr * 0.95, -hr * 0.35));
    if (hs === 'ponytail') head.add(cap(hr * 0.2, hr * 0.8, H, { seg: 10 }).rot(Math.PI - 0.35, 0, 0).at(0, hr * 0.55, -hr * 0.85));
    if (hs === 'pigtails') [-1, 1].forEach((s) => head.add(cap(hr * 0.18, hr * 0.5, H, { seg: 10 }).rot(0, 0, Math.PI + s * 0.5).at(s * hr * 0.95, -hr * 0.1, -hr * 0.2)));
    if (hs === 'curly') for (let i = 0; i < 9; i++) { const a = (i / 9) * Math.PI * 2; head.add(sph(hr * 0.3, H, { seg: 12 }).at(Math.cos(a) * hr * 0.75, hr * 0.45 + Math.sin(i * 1.7) * hr * 0.12, Math.sin(a) * hr * 0.65 - hr * 0.12)); }
    if (hs === 'spiky') for (let i = 0; i < 7; i++) { const a = (i / 7) * Math.PI * 2; head.add(cone(hr * 0.2, hr * 0.5, H, { seg: 6 }).rot(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7).at(Math.cos(a) * hr * 0.45, hr * 0.8, Math.sin(a) * hr * 0.4 - hr * 0.1)); }
  }
  if (acc.has('beard')) head.add(sph(hr * 0.62, c.beardColor ?? H, { seg: 16, part: 'bottom' }).sc(1.05, 0.95, 0.8).at(0, -hr * 0.18, hr * 0.32));
  if (acc.has('moustache')) [-1, 1].forEach((s) => head.add(cap(hr * 0.07, hr * 0.18, c.beardColor ?? H, { seg: 8 }).rot(0, 0, s * 1.9).at(s * hr * 0.02, -hr * 0.2, fz + hr * 0.1)));
  if (acc.has('glasses')) { [-1, 1].forEach((s) => head.add(torus(hr * 0.17, hr * 0.03, P.ink2, { ts: 20 }).at(s * hr * 0.36, hr * 0.05, fz + hr * 0.06).noInk())); head.add(box(hr * 0.22, hr * 0.04, hr * 0.03, P.ink2).at(0, hr * 0.06, fz + hr * 0.08).noInk()); }
  if (acc.has('goggles')) { head.add(torus(hr * 1.0, hr * 0.06, P.ink2, { ts: 32 }).rot(deg(90), 0, 0).at(0, hr * 0.3, 0)); [-1, 1].forEach((s) => head.add(cyl(hr * 0.2, hr * 0.2, hr * 0.15, P.glass, { seg: 16 }).rot(deg(90), 0, 0).at(s * hr * 0.33, hr * 0.38, fz * 0.95))); }
  if (acc.has('headphones')) { head.add(torus(hr * 1.05, hr * 0.06, P.ink2, { arc: Math.PI }).at(0, 0, 0)); [-1, 1].forEach((s) => head.add(cyl(hr * 0.24, hr * 0.24, hr * 0.18, c.accColor ?? P.red).rot(0, 0, deg(90)).at(s * hr * 1.0, 0, 0))); }
  if (acc.has('earrings')) [-1, 1].forEach((s) => head.add(sph(hr * 0.07, P.mustard, { seg: 8 }).at(s * hr * 0.96, -hr * 0.22, 0)));
  // hats
  const hc = c.hatColor ?? HAT_DEFAULTS[c.hat] ?? P.red, top = hr * 0.9;
  const hats = {
    cap: () => grp(sph(hr * 1.07, hc, { part: 'top' }).sc(1, 0.75, 1), cyl(hr * 0.55, hr * 0.55, 0.03, hc, { seg: 20, t0: -1, tl: 2 }).sc(1, 1, 1.4).at(0, 0, hr * 0.62)).at(0, hr * 0.32, 0).rot(-0.12, 0, 0),
    flatcap: () => grp(sph(hr * 1.08, hc, { part: 'top' }).sc(1, 0.5, 1.08)).at(0, hr * 0.38, 0.02).rot(-0.15, 0, 0),
    beanie: () => grp(sph(hr * 1.07, hc, { part: 'top' }).sc(1, 1.05, 1), torus(hr * 1.02, hr * 0.12, hc, { ts: 28 }).rot(deg(90), 0, 0), sph(hr * 0.2, P.white, { seg: 12 }).at(0, hr * 1.12, 0)).at(0, hr * 0.25, 0).rot(-0.15, 0, 0),
    straw: () => grp(cyl(hr * 1.75, hr * 1.75, 0.035, hc, { seg: 32 }), cyl(hr * 0.78, hr * 0.92, hr * 0.62, hc, { seg: 24 }), cyl(hr * 0.93, hr * 0.93, hr * 0.14, P.red, { seg: 24 }).at(0, 0.02, 0)).at(0, hr * 0.5, 0).rot(-0.12, 0, 0.05),
    sou: () => grp(cyl(hr * 1.1, hr * 1.45, hr * 0.18, hc, { seg: 28 }), sph(hr * 1.02, hc, { part: 'top' }).sc(1, 0.8, 1).at(0, hr * 0.1, 0)).at(0, hr * 0.32, -0.02).rot(-0.12, 0, 0),
    bucket: () => grp(cyl(hr * 0.86, hr * 1.35, hr * 0.32, hc, { seg: 28 }), cyl(hr * 0.86, hr * 0.94, hr * 0.42, hc, { seg: 24 }).at(0, hr * 0.28, 0)).at(0, hr * 0.42, 0),
    chef: () => grp(cyl(hr * 0.9, hr * 0.9, hr * 0.5, hc, { seg: 24 }), sph(hr * 0.75, hc, { seg: 16 }).at(-hr * 0.35, hr * 0.85, 0), sph(hr * 0.75, hc, { seg: 16 }).at(hr * 0.35, hr * 0.85, 0), sph(hr * 0.8, hc, { seg: 16 }).at(0, hr * 1.0, 0)).weld().at(0, hr * 0.55, 0),
    helmet: () => grp(sph(hr * 1.12, hc, { part: 'top' }), cyl(hr * 1.2, hr * 1.2, 0.04, hc, { seg: 28 })).at(0, hr * 0.2, 0),
    hardhat: () => grp(sph(hr * 1.1, hc, { part: 'top' }).sc(1, 0.85, 1), cyl(hr * 1.3, hr * 1.3, 0.04, hc, { seg: 28 }).sc(1, 1, 1.1), box(hr * 0.2, hr * 0.2, hr * 1.9, hc).at(0, hr * 0.75, 0)).at(0, hr * 0.32, 0),
    wizard: () => grp(cyl(hr * 1.6, hr * 1.6, 0.04, hc, { seg: 28 }), cone(hr * 0.95, hr * 2.4, hc, { seg: 20 }).rot(-0.2, 0, 0.1)).at(0, hr * 0.55, 0),
    beret: () => grp(sph(hr * 1.1, hc, { seg: 20 }).sc(1, 0.32, 1)).at(hr * 0.12, hr * 0.78, 0).rot(0, 0, -0.25),
    captain: () => grp(cyl(hr * 1.05, hr * 0.92, hr * 0.42, hc, { seg: 24 }), cyl(hr * 1.07, hr * 1.07, hr * 0.12, P.white, { seg: 24 }).at(0, hr * 0.32, 0), cyl(hr * 0.6, hr * 0.6, 0.03, P.ink2, { seg: 20, t0: -1, tl: 2 }).sc(1, 1, 1.4).at(0, 0, hr * 0.62), sph(hr * 0.12, P.mustard, { seg: 10 }).at(0, hr * 0.22, hr * 0.98)).at(0, hr * 0.55, 0),
    crown: () => { const k = grp(cyl(hr * 0.75, hr * 0.75, hr * 0.32, hc, { seg: 20, open: true, side: THREE.DoubleSide })); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; k.add(cone(hr * 0.16, hr * 0.32, hc, { seg: 5 }).at(Math.cos(a) * hr * 0.68, hr * 0.32, Math.sin(a) * hr * 0.68)); } return k.at(0, hr * 0.78, 0); },
    bandana: () => grp(sph(hr * 1.07, hc, { part: 'top' }).sc(1, 0.8, 1), cone(hr * 0.25, hr * 0.5, hc, { seg: 4 }).rot(deg(-100), 0, 0).at(0, hr * 0.05, -hr * 1.0)).at(0, hr * 0.22, 0).rot(-0.2, 0, 0),
    hood: () => grp(M(new THREE.SphereGeometry(hr * 1.22, 24, 16, Math.PI * 0.3, Math.PI * 1.4), hc, { side: THREE.DoubleSide }).rot(0, 0, 0)).at(0, hr * 0.08, -hr * 0.08),
    top: () => grp(cyl(hr * 1.35, hr * 1.35, 0.04, hc, { seg: 28 }), cyl(hr * 0.75, hr * 0.75, hr * 1.2, hc, { seg: 24 }), cyl(hr * 0.76, hr * 0.76, hr * 0.18, P.red, { seg: 24 }).at(0, 0.03, 0)).at(0, hr * 0.62, 0),
  };
  if (c.hat && hats[c.hat]) head.add(hats[c.hat]());
  g.add(head);
  if (acc.has('scarf')) g.add(torus(0.2 * w, 0.075, c.accColor ?? P.red, { ts: 24 }).rot(deg(90), 0, 0).at(0, 1.04, 0), box(0.12, 0.34, 0.05, c.accColor ?? P.red).at(0.1, 0.72, 0.22 * w).rot(0, 0, 0.1));
  if (acc.has('backpack')) g.add(rbox(0.46 * w, 0.5, 0.24, c.accColor ?? P.mustard, { r: 0.08 }).at(0, 0.5, -0.32 * w));
  if (acc.has('satchel')) g.add(rbox(0.3, 0.24, 0.1, c.accColor ?? P.woodDk, { r: 0.04 }).at(-0.34 * w, 0.42, 0.06), torus(0.42, 0.018, c.accColor ?? P.woodDk, { ts: 24 }).rot(0, deg(90), deg(-40)).sc(1, 1.2, 0.8).at(-0.05, 0.78, 0.02));
  if (acc.has('lantern')) { const lan = lantern(); L.userData.hand.add(lan.sc(0.6).at(0, -0.12, 0)); }
  // held item
  if (c.held) {
    if (c.pose === 'hold' || c.pose === 'carry') { c.held.position.add(new THREE.Vector3(0, 0.78, 0.48)); g.add(c.held); }
    else { R.userData.hand.add(c.held); }
  }
  return g.sc(B.s);
}

// ---------------------------------------------------------------- critters
export function cat(o = {}) {
  const c = o.color ?? P.orange, b = o.belly ?? P.white;
  const g = grp(
    cap(0.16, 0.3, c, { seg: 14 }).rot(0, 0, deg(90)).at(0.24, 0.2, 0),
    sph(0.17, c, { seg: 18 }).at(0.32, 0.42, 0),
    cone(0.07, 0.12, c, { seg: 4 }).at(0.24, 0.53, -0.07), cone(0.07, 0.12, c, { seg: 4 }).at(0.24, 0.53, 0.07),
    tube([[-0.16, 0.22, 0], [-0.3, 0.3, 0], [-0.32, 0.5, 0.05], [-0.25, 0.6, 0.1]], 0.04, c),
  );
  [[0.12, 0.08], [0.12, -0.08], [-0.08, 0.08], [-0.08, -0.08]].forEach(([x, z]) => g.add(cyl(0.04, 0.045, 0.12, c, { seg: 8 }).at(x + 0.03, 0, z)));
  g.add(sph(0.11, b, { seg: 12 }).sc(1, 0.7, 0.8).at(0.4, 0.38, 0).noInk());
  [-1, 1].forEach((s) => g.add(sph(0.022, P.ink, { seg: 8 }).at(0.47, 0.46, s * 0.06).noInk()));
  return g.rot(0, deg(-90), 0);
}
export function dog(o = {}) {
  const c = o.color ?? P.woodLt, e = o.ear ?? P.woodDk;
  const g = grp(cap(0.18, 0.36, c, { seg: 14 }).rot(0, 0, deg(90)).at(0.27, 0.24, 0), sph(0.19, c, { seg: 18 }).at(0.36, 0.5, 0), sph(0.1, c, { seg: 12 }).sc(1.2, 0.8, 0.9).at(0.52, 0.46, 0), sph(0.04, P.ink, { seg: 8 }).at(0.63, 0.48, 0));
  [-1, 1].forEach((s) => { g.add(sph(0.08, e, { seg: 10 }).sc(0.5, 1.3, 0.9).at(0.3, 0.45, s * 0.17)); g.add(sph(0.022, P.ink, { seg: 8 }).at(0.5, 0.56, s * 0.08).noInk()); });
  [[0.15, 0.1], [0.15, -0.1], [-0.15, 0.1], [-0.15, -0.1]].forEach(([x, z]) => g.add(cyl(0.05, 0.055, 0.14, c, { seg: 8 }).at(x + 0.05, 0, z)));
  g.add(cap(0.035, 0.18, c, { seg: 8 }).rot(0, 0, 0.9).at(-0.18, 0.3, 0));
  if (o.collar) g.add(torus(0.13, 0.025, o.collar, { ts: 16 }).rot(0, deg(90), 0).at(0.36, 0.36, 0));
  return g.rot(0, deg(-90), 0);
}
export function bird(o = {}) {
  const c = o.color ?? P.white, w = o.wing ?? P.slate, bk = o.beak ?? P.mustard;
  const g = grp(sph(0.14, c, { seg: 14 }).sc(1.4, 1, 1).at(0, 0.2, 0), sph(0.09, c, { seg: 12 }).at(0.17, 0.32, 0), cone(0.03, 0.1, bk, { seg: 6 }).rot(0, 0, deg(-90)).at(0.29, 0.31, 0));
  [-1, 1].forEach((s) => { g.add(sph(0.1, w, { seg: 10 }).sc(1.3, 0.4, 0.6).at(-0.03, 0.24, s * 0.12)); g.add(sph(0.016, P.ink, { seg: 6 }).at(0.22, 0.35, s * 0.06).noInk()); g.add(cyl(0.012, 0.012, 0.08, bk, { seg: 5 }).at(0, 0, s * 0.05)); });
  g.add(cone(0.06, 0.12, w, { seg: 4 }).rot(0, 0, deg(90)).at(-0.22, 0.24, 0));
  return g.rot(0, deg(-90), 0);
}
export function fish(o = {}) {
  const c = o.color ?? P.sea, f = o.fin ?? P.coral;
  const g = grp(sph(0.2, c, { seg: 16 }).sc(1.6, 1, 0.55), extrude([[0, 0], [0.18, 0.13], [0.18, -0.13]], 0.03, f).at(-0.3, 0, 0), extrude([[-0.1, 0], [0.08, 0], [0, 0.12]], 0.02, f).at(0, 0.17, 0));
  [-1, 1].forEach((s) => g.add(sph(0.03, P.ink, { seg: 8 }).at(0.22, 0.05, s * 0.09).noInk()));
  return g;
}

// ---------------------------------------------------------------- props
export function crate(s = 0.5, c = P.woodLt) { return rbox(s, s, s, texMat(tex.planks({ base: c, line: P.woodDk, n: 4 })), { r: 0.02 }); }
export function barrel(h = 0.7, c = P.wood) { return grp(lathe([[0.001, 0], [h * 0.36, 0], [h * 0.42, h * 0.5], [h * 0.36, h], [0.001, h]], c, { seg: 20 }), torus(h * 0.4, 0.02, P.iron).rot(deg(90), 0, 0).at(0, h * 0.25, 0), torus(h * 0.4, 0.02, P.iron).rot(deg(90), 0, 0).at(0, h * 0.75, 0)); }
export function lantern(c = P.iron, light = P.butter) { return grp(cyl(0.11, 0.13, 0.03, c), cyl(0.09, 0.09, 0.2, glow(light), { seg: 12 }).at(0, 0.03, 0), cone(0.14, 0.1, c, { seg: 12 }).at(0, 0.23, 0), torus(0.04, 0.012, c).at(0, 0.36, 0)); }
export function lamppost(h = 2.2, c = P.iron, light = P.butter) { return grp(cyl(0.12, 0.14, 0.12, c), cyl(0.05, 0.06, h, c, { seg: 10 }), grp(lantern(c, light)).at(0, h, 0)); }
export function bench(w = 1.2, c = P.wood) { return grp(box(w, 0.06, 0.36, c).at(0, 0.4, 0), box(w, 0.25, 0.05, c).at(0, 0.5, -0.17).rot(-0.15, 0, 0), ...[-1, 1].map((s) => box(0.06, 0.4, 0.32, P.iron).at(s * (w / 2 - 0.1), 0, 0))); }
export function fence(len = 3, c = P.white, o = {}) { const g = grp(), n = Math.max(2, Math.round(len / (o.gap ?? 0.35))); for (let i = 0; i < n; i++) g.add(box(0.08, o.h ?? 0.55, 0.05, c).at(-len / 2 + (i / (n - 1)) * len, 0, 0)); g.add(box(len + 0.1, 0.06, 0.04, c).at(0, (o.h ?? 0.55) * 0.35, 0.04), box(len + 0.1, 0.06, 0.04, c).at(0, (o.h ?? 0.55) * 0.75, 0.04)); return g.weld(); }
export function pottedPlant(c = P.terracotta, leaf = P.leaf, s = 1) { return grp(lathe([[0.001, 0], [0.12, 0], [0.16, 0.22], [0.17, 0.24], [0.001, 0.24]], c), sph(0.2, leaf, { seg: 14 }).at(0, 0.36, 0), sph(0.13, leaf, { seg: 12 }).at(0.1, 0.48, 0.03)).sc(s); }
export function umbrella(colors = [P.red, P.white], r = 0.9, h = 1.8) { return grp(cyl(0.025, 0.025, h, P.white, { seg: 8 }), cone(r, r * 0.35, texMat(tex.stripes({ colors, n: 8 })), { seg: 16 }).at(0, h - 0.1, 0)); }
export function bunting(points, colors = [P.red, P.mustard, P.blue, P.white], n = 10) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const g = grp(tube(points, 0.012, P.ink2, { segs: 32 }).noInk());
  for (let i = 1; i < n; i++) { const p = curve.getPoint(i / n); g.add(extrude([[-0.09, 0], [0.09, 0], [0, -0.2]], 0.01, colors[i % colors.length]).at(p.x, p.y, p.z).rot(0, Math.atan2(points[points.length - 1][2] - points[0][2], points[points.length - 1][0] - points[0][0]) * -1, 0)); }
  return g;
}
export function sign(text, o = {}) {
  const w = o.w ?? 1.2, h = o.h ?? 0.4, t = tex.text(text, { bg: o.bg ?? P.cream, fg: o.fg ?? P.ink, w: 512, h: Math.round(512 * h / w), font: o.font ?? `800 ${Math.round(512 * h / w * 0.55)}px "Bricolage Grotesque", system-ui, sans-serif` });
  const side = mat(o.frame ?? P.woodDk), face = texMat(t);
  return M(new THREE.BoxGeometry(w, h, 0.06).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}
export function flag(c = P.red, h = 1.6) { return grp(cyl(0.025, 0.025, h, P.white, { seg: 8 }), extrude([[0, 0], [0.45, -0.12], [0, -0.26]], 0.015, c).at(0.02, h - 0.02, 0)); }
export function wheel(r = 0.22, w = 0.14, c = P.ink2, hub = P.white) { return grp(cyl(r, r, w, c, { seg: 20 }).at(0, -w / 2, 0), cyl(r * 0.45, r * 0.45, w + 0.02, hub, { seg: 14 }).at(0, -w / 2 - 0.01, 0)).rot(deg(90), 0, 0); }

// ---------------------------------------------------------------- buildings
/**
 * house({ w, d, h, wall, roof, roofType: gable|flat|hip|shed|dome, roofH, door, trim, windows, chimney, awning:[c1,c2], sign:'TEXT', base, floors })
 * Front faces +Z. Base on y=0.
 */
export function house(o = {}) {
  const c = Object.assign({ w: 2, d: 1.6, h: 1.3, wall: P.wall, roof: P.terracotta, roofType: 'gable', roofH: 0.8, door: P.teal, trim: P.white, windows: 2, chimney: false, awning: null, sign: null, base: P.stoneDk, floors: 1, wallMap: null, ov: 0.14, shutters: null }, o);
  const g = grp(); const H = c.h * c.floors;
  g.add(box(c.w + 0.06, 0.14, c.d + 0.06, c.base));
  g.add(box(c.w, H, c.d, c.wallMap ? texMat(c.wallMap) : c.wall).at(0, 0.14, 0));
  const topY = H + 0.14;
  if (c.roofType === 'gable' || c.roofType === 'shed') {
    if (c.roofType === 'gable') {
      g.add(prism(c.w, c.roofH, c.d, c.wallMap ? texMat(c.wallMap) : c.wall).rot(0, deg(90), 0).sc(c.d / c.w, 1, c.w / c.d).at(0, topY, 0));
      const half = c.d / 2 + c.ov, slope = Math.hypot(half, c.roofH * (half / (c.d / 2))), ang = Math.atan2(c.roofH, c.d / 2);
      [-1, 1].forEach((s) => g.add(box(c.w + c.ov * 2, 0.09, slope, c.roof).rot(s * ang, 0, 0).at(0, topY + c.roofH / 2 - 0.02 - (c.ov * Math.tan(ang)) / 2, s * (c.d / 4 + c.ov / 2) * 1.0).sc(1, 1, 1)));
      g.add(box(c.w + c.ov * 2 + 0.04, 0.08, 0.12, c.roof).at(0, topY + c.roofH - 0.04, 0));
    } else {
      g.add(box(c.w + c.ov * 2, 0.1, c.d + c.ov * 2, c.roof).rot(deg(-12), 0, 0).at(0, topY + 0.12, 0));
    }
  } else if (c.roofType === 'hip') {
    g.add(cone(Math.hypot(c.w, c.d) / 2 + c.ov, c.roofH, c.roof, { seg: 4 }).rot(0, deg(45), 0).sc(c.w / Math.hypot(c.w, c.d) * 1.42, 1, c.d / Math.hypot(c.w, c.d) * 1.42).at(0, topY, 0));
  } else if (c.roofType === 'dome') {
    g.add(sph(Math.min(c.w, c.d) * 0.5, c.roof, { part: 'top' }).at(0, topY, 0));
  } else { // flat
    g.add(box(c.w + 0.1, 0.12, c.d + 0.1, c.roof).at(0, topY, 0));
  }
  if (c.chimney) g.add(box(0.26, c.roofH + 0.3, 0.26, P.brick).at(c.w * 0.28, topY + 0.05, -c.d * 0.12), box(0.32, 0.08, 0.32, P.stoneDk).at(c.w * 0.28, topY + c.roofH + 0.35, -c.d * 0.12));
  // front: door + windows (per floor)
  const fz = c.d / 2;
  const dw = 0.42, dh = Math.min(0.85, c.h * 0.7);
  g.add(box(dw + 0.1, dh + 0.06, 0.05, c.trim).at(0, 0.14, fz + 0.005), box(dw, dh, 0.06, c.door).at(0, 0.14, fz + 0.01), sph(0.03, P.mustard, { seg: 8 }).at(dw * 0.3, 0.14 + dh * 0.5, fz + 0.06));
  const win = (x, y) => grp(grp(box(0.42, 0.44, 0.05, c.trim), box(0.3, 0.32, 0.06, c.glass ?? P.glass).at(0, 0.06, 0)).weld(), box(0.03, 0.32, 0.07, c.trim).at(0, 0.06, 0).noInk(), ...(c.shutters ? [box(0.14, 0.44, 0.04, c.shutters).at(-0.3, 0, 0), box(0.14, 0.44, 0.04, c.shutters).at(0.3, 0, 0)] : [])).at(x, y, fz + 0.005);
  for (let f = 0; f < c.floors; f++) {
    const y = 0.14 + f * c.h + c.h * 0.32;
    const n = f === 0 ? c.windows : Math.max(1, Math.min(c.windows + 1, Math.floor(c.w / 0.6)));
    for (let i = 0; i < n; i++) {
      let x = f === 0 ? ((i % 2 ? 1 : -1) * (dw / 2 + 0.38 + Math.floor(i / 2) * 0.6)) : (-c.w / 2 + (i + 1) * (c.w / (n + 1)));
      if (Math.abs(x) < c.w / 2 - 0.2) g.add(win(x, f === 0 ? y : 0.14 + f * c.h + c.h * 0.3));
    }
  }
  if (c.awning) {
    const aw = grp(box(c.w * 0.92, 0.04, 0.55, texMat(tex.stripes({ colors: c.awning, n: 10 }))).rot(deg(22), 0, 0));
    for (let i = 0; i < 10; i++) aw.add(cyl(c.w * 0.92 / 20, c.w * 0.92 / 20, 0.03, c.awning[i % c.awning.length], { seg: 12, t0: Math.PI / 2, tl: Math.PI }).rot(deg(90), 0, 0).at(-c.w * 0.46 + (i + 0.5) * c.w * 0.092, -0.08, 0.27));
    g.add(aw.at(0, 0.14 + c.h * 0.98, fz + 0.26));
  }
  if (c.sign) g.add(sign(c.sign, { w: Math.min(c.w * 0.8, 1.6), h: 0.32, bg: c.signBg ?? P.cream, fg: c.signFg ?? P.ink }).at(0, 0.14 + c.h * 1.02 + (c.awning ? 0.18 : 0), fz + 0.04));
  return g;
}

// ---------------------------------------------------------------- vehicles
/** vehicle({ kind: van|truck|cart|boat|bike|tram, body, trim, roof }) — front faces +X. Base on y=0. */
export function vehicle(o = {}) {
  const k = o.kind ?? 'van', body = o.body ?? P.mustard, trim = o.trim ?? P.white, g = grp();
  if (k === 'van') {
    g.add(rbox(2.0, 0.55, 1.0, body, { r: 0.18 }).at(0, 0.28, 0), rbox(1.9, 0.6, 0.96, trim, { r: 0.22 }).at(-0.03, 0.75, 0));
    g.add(box(0.06, 0.38, 0.8, P.glassDk).at(0.96, 0.85, 0), ...[-1, 1].map((s) => box(1.2, 0.32, 0.04, P.glassDk).at(-0.2, 0.9, s * 0.49)));
    [[0.62, 1], [0.62, -1], [-0.62, 1], [-0.62, -1]].forEach(([x, s]) => g.add(wheel(0.22, 0.14).at(x, 0.22, s * 0.48)));
    g.add(sph(0.08, P.butter, { seg: 10 }).at(1.0, 0.45, 0.3), sph(0.08, P.butter, { seg: 10 }).at(1.0, 0.45, -0.3), box(0.08, 0.1, 1.04, P.steel).at(1.02, 0.12, 0));
  } else if (k === 'truck') {
    g.add(rbox(0.9, 1.0, 1.0, body, { r: 0.12 }).at(0.75, 0.25, 0), box(0.05, 0.38, 0.8, P.glassDk).at(1.2, 0.8, 0), box(1.7, 0.18, 1.04, P.ink2).at(-0.35, 0.25, 0), box(1.6, 0.3, 1.0, trim).at(-0.4, 0.43, 0));
    [[0.75, 1], [0.75, -1], [-0.7, 1], [-0.7, -1]].forEach(([x, s]) => g.add(wheel(0.24, 0.16).at(x, 0.24, s * 0.5)));
  } else if (k === 'cart') {
    g.add(box(1.2, 0.35, 0.8, texMat(tex.planks({ base: body, line: P.woodDk, n: 3, vertical: true }))).at(0, 0.35, 0));
    [-1, 1].forEach((s) => { g.add(grp(torus(0.3, 0.04, P.woodDk, { ts: 24 }), ...[0, 1, 2].map((i) => box(0.04, 0.58, 0.03, P.woodDk).rot(0, 0, i * deg(60)))).at(0, 0.32, s * 0.45)); g.add(cyl(0.025, 0.025, 1.0, P.woodDk, { seg: 8 }).rot(0, 0, deg(80)).at(1.05, 0.4, s * 0.32)); });
    g.add(cyl(0.03, 0.03, 0.4, P.woodDk).rot(0, 0, deg(-15)).at(-0.5, 0, 0));
  } else if (k === 'boat') {
    const L = o.len ?? 2.2;
    g.add(sph(0.5, body, { part: 'bottom', seg: 28 }).sc(L / 1.0, 0.75, 1.0).at(0, 0.42, 0));
    g.add(torus(0.5, 0.045, trim, { ts: 36 }).rot(deg(90), 0, 0).sc(L / 1.0, 1, 1).at(0, 0.42, 0));
    g.add(box(0.12, 0.05, 0.86, P.wood).at(0.2, 0.3, 0), box(0.12, 0.05, 0.86, P.wood).at(-0.45, 0.3, 0));
    if (o.cabin) g.add(house({ w: 0.8, d: 0.7, h: 0.55, wall: o.cabin, roof: o.roof ?? P.red, roofType: 'flat', windows: 1, base: o.cabin, door: o.cabin }).sc(0.9).rot(0, deg(-90), 0).at(-0.35, 0.3, 0));
    if (o.mast) g.add(cyl(0.035, 0.04, 1.8, P.woodDk, { seg: 8 }).at(0.25, 0.35, 0), extrude([[0, 0], [0, 1.3], [-0.9, 0.05]], 0.02, o.sail ?? P.cream).at(0.22, 0.6, 0));
  } else if (k === 'bike') {
    [-1, 1].forEach((s) => g.add(torus(0.3, 0.035, P.ink2, { ts: 28 }).at(s * 0.5, 0.33, 0)));
    g.add(tube([[-0.5, 0.33, 0], [-0.05, 0.75, 0], [0.42, 0.75, 0], [0.5, 0.33, 0]], 0.03, body, { tension: 0 }), tube([[-0.5, 0.33, 0], [0.05, 0.33, 0], [0.42, 0.75, 0]], 0.03, body, { tension: 0 }), box(0.22, 0.05, 0.1, P.ink2).at(-0.1, 0.82, 0), box(0.04, 0.04, 0.5, P.ink2).at(0.45, 0.95, 0));
    if (o.basket) g.add(box(0.3, 0.2, 0.3, o.basket).at(0.62, 0.72, 0));
  } else if (k === 'tram') {
    g.add(rbox(2.6, 1.3, 1.1, body, { r: 0.12 }).at(0, 0.2, 0), box(2.7, 0.12, 1.2, trim).at(0, 1.5, 0), ...[-1, 1].map((s) => box(2.2, 0.45, 0.04, P.glassDk).at(0, 0.9, s * 0.56)), box(2.4, 0.2, 1.0, P.ink2).at(0, 0, 0));
  }
  return g;
}

// ---------------------------------------------------------------- studio (renderer)
const VS_GEO = `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;
const FS_GEO = `uniform float uId; varying vec3 vN; void main(){ vec3 n = normalize(vN); if(!gl_FrontFacing) n = -n; gl_FragColor = vec4(n*0.5+0.5, uId); }`;
const VS_Q = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FS_COMP = `
precision highp float;
uniform sampler2D tColor; uniform sampler2D tGeo; uniform sampler2D tDepth;
uniform vec2 uRes; uniform float uLine; uniform vec3 uInk; uniform float uNear; uniform float uFar;
uniform float uGrain; uniform float uSeed; uniform float uWobble; uniform float uCrease; uniform float uMono; uniform vec3 uAccent; uniform float uAccentTol;
varying vec2 vUv;
float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); float a=hash(i), b=hash(i+vec2(1.,0.)), c=hash(i+vec2(0.,1.)), d=hash(i+vec2(1.,1.)); return mix(mix(a,b,f.x),mix(c,d,f.x),f.y); }
float lin(float d){ float z = d*2.0-1.0; return 2.0*uNear*uFar/(uFar+uNear - z*(uFar-uNear)); }
void main(){
  vec2 wob = (vec2(vnoise(vUv*uRes/22.0), vnoise(vUv*uRes/22.0 + 17.0)) - 0.5) * uWobble / uRes;
  vec2 uv = vUv + wob;
  vec4 g0 = texture2D(tGeo, uv);
  float d0 = lin(texture2D(tDepth, uv).x);
  float e = 0.0;
  if (g0.a > 0.001) {
    float graze = 1.0 / max(abs(g0.b * 2.0 - 1.0), 0.12);
    for (int i = 0; i < 8; i++) {
      float a = float(i) * 0.7853982;
      vec2 o = vec2(cos(a), sin(a)) * uLine / uRes;
      vec4 g = texture2D(tGeo, uv + o);
      float d = lin(texture2D(tDepth, uv + o).x);
      float far = d - d0;
      if (g.a < 0.001 || far > (0.012 * d0 + 0.015) * graze) { e = 1.0; break; }
      if (abs(g.a - g0.a) > 0.002 && far > -0.004 * d0) { e = 1.0; break; }
      if (dot(g.rgb*2.0-1.0, g0.rgb*2.0-1.0) < uCrease) { e = 1.0; break; }
    }
  }
  vec3 col = texture2D(tColor, vUv).rgb;
  if (uMono > 0.5) {
    float l = dot(col, vec3(0.299, 0.587, 0.114));
    float keep = (1.0 - smoothstep(uAccentTol * 0.4, uAccentTol, distance(normalize(col + 1e-4), normalize(uAccent + 1e-4)))) * step(0.02, length(col));
    col = mix(vec3(l), col, keep);
  }
  col = mix(col, uInk, e);
  float n = (hash(floor(vUv*uRes/1.5) + uSeed) - 0.5) * uGrain + (vnoise(vUv*uRes/5.0 + uSeed) - 0.5) * uGrain * 0.9;
  col = col * (1.0 + n);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;

export class Studio {
  constructor() {
    const r = (this.r = new THREE.WebGLRenderer({ antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' }));
    r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.NoToneMapping;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.geoMats = new Map(); this.hidden = new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false });
    this.quadScene = new THREE.Scene(); this.quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.comp = new THREE.ShaderMaterial({
      vertexShader: VS_Q, fragmentShader: FS_COMP, depthTest: false, depthWrite: false,
      uniforms: { tColor: { value: null }, tGeo: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2() }, uLine: { value: 3 }, uInk: { value: new THREE.Color(P.ink) }, uNear: { value: 0.1 }, uFar: { value: 100 }, uGrain: { value: 0.06 }, uSeed: { value: 0 }, uWobble: { value: 2.0 }, uCrease: { value: 0.72 }, uMono: { value: 0 }, uAccent: { value: new THREE.Color(P.red) }, uAccentTol: { value: 0.35 } },
    });
    this.quadScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.comp));
    this.size = [0, 0];
  }
  _targets(W, H) {
    if (this.size[0] === W && this.size[1] === H) return;
    this.rtC?.dispose(); this.rtG?.dispose();
    this.rtC = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
    this.rtG = new THREE.WebGLRenderTarget(W, H, { type: THREE.UnsignedByteType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(W, H) });
    this.size = [W, H];
  }
  _geoMat(id) {
    if (!this.geoMats.has(id)) this.geoMats.set(id, new THREE.ShaderMaterial({ vertexShader: VS_GEO, fragmentShader: FS_GEO, uniforms: { uId: { value: ((id % 250) + 1) / 255 } }, side: THREE.DoubleSide }));
    return this.geoMats.get(id);
  }
  /** Build a lit scene around `subject`. opts: bg (hex | [[stop,hex]..]), mono, light ('day'|'dusk'|'night'|'overcast'|'cave'), sun (dir array) */
  stage(subject, opts = {}) {
    const s = new THREE.Scene();
    const bg = opts.bg ?? P.cream;
    s.background = Array.isArray(bg) ? tex.gradient(bg) : new THREE.Color(bg);
    const L = {
      day: { key: '#fff3e2', ki: 2.4, sky: '#fff6ea', gnd: '#9a7a62', hi: 1.35 },
      dusk: { key: '#ffc58a', ki: 2.1, sky: '#d9c4e6', gnd: '#7a5a52', hi: 1.15 },
      night: { key: '#a9bce8', ki: 1.1, sky: '#6f7fae', gnd: '#2c2a38', hi: 1.0 },
      overcast: { key: '#f2efe8', ki: 1.4, sky: '#eef0ef', gnd: '#8c8a84', hi: 1.6 },
      cave: { key: '#ffd6a0', ki: 1.6, sky: '#8a7a6e', gnd: '#3a2a22', hi: 1.0 },
      mono: { key: '#ffffff', ki: 2.3, sky: '#f4f4f4', gnd: '#7a7a7a', hi: 1.35 },
    }[opts.light ?? (opts.mono ? 'mono' : 'day')];
    const hemi = new THREE.HemisphereLight(L.sky, L.gnd, L.hi); s.add(hemi);
    const sun = new THREE.DirectionalLight(L.key, L.ki); sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.045;
    s.add(sun, sun.target);
    const root = new THREE.Group(); root.add(subject); s.add(root);
    (opts.extraLights || []).forEach((l) => s.add(l));
    return { scene: s, root, sun, opts };
  }
  _fit(st, camOpts, aspect) {
    const { root, sun } = st;
    root.updateMatrixWorld(true);
    // gather world-space vertices (subsampled) for a tight, centred fit
    const pts = [], v = new THREE.Vector3();
    let total = 0; root.traverse((o) => { if (o.isMesh && !o.userData.noFit) total += o.geometry.attributes.position.count; });
    const stride = Math.max(1, Math.floor(total / 30000));
    root.traverse((o) => {
      if (!o.isMesh || o.userData.noFit) return;
      const a = o.geometry.attributes.position;
      for (let i = 0; i < a.count; i += stride) { v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); pts.push(v.x, v.y, v.z); }
    });
    const box3 = new THREE.Box3().setFromObject(root, true);
    const center = camOpts.target ? new THREE.Vector3(...camOpts.target) : box3.getCenter(new THREE.Vector3());
    const size = box3.getSize(new THREE.Vector3()), radius = size.length() / 2 || 1;
    const fov = camOpts.fov ?? 26, yaw = deg(camOpts.yaw ?? -32), pitch = deg(camOpts.pitch ?? 26);
    const cam = new THREE.PerspectiveCamera(fov, aspect, 0.05, 500);
    const dir = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).normalize();
    const fwd = dir.clone().negate();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize(), up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const tanV = Math.tan(deg(fov) / 2), tanH = tanV * aspect, pad = camOpts.pad ?? 1.06;
    let D = radius * 3;
    for (let it = 0; it < 4; it++) {
      let need = 0, mnU = 1e9, mxU = -1e9, mnV = 1e9, mxV = -1e9;
      for (let i = 0; i < pts.length; i += 3) {
        const dx = pts[i] - center.x, dy = pts[i + 1] - center.y, dz = pts[i + 2] - center.z;
        const x = dx * right.x + dy * right.y + dz * right.z, y = dx * up.x + dy * up.y + dz * up.z, z = dx * dir.x + dy * dir.y + dz * dir.z;
        need = Math.max(need, z + Math.abs(x) * pad / tanH, z + Math.abs(y) * pad / tanV);
        const dd = Math.max(0.01, D - z), u = x / dd, w = y / dd;
        if (u < mnU) mnU = u; if (u > mxU) mxU = u; if (w < mnV) mnV = w; if (w > mxV) mxV = w;
      }
      if (camOpts.target) { D = need; break; }
      // recentre on the projected extents, then refit
      center.addScaledVector(right, ((mnU + mxU) / 2) * D * 0.9).addScaledVector(up, ((mnV + mxV) / 2) * D * 0.9);
      D = need;
    }
    D /= camOpts.zoom ?? 1;
    cam.position.copy(center).addScaledVector(dir, D);
    if (camOpts.lift) { center.y += camOpts.lift * size.y; cam.position.y += camOpts.lift * size.y; }
    cam.lookAt(center);
    cam.near = Math.max(0.05, D - radius * 3); cam.far = D + radius * 3; cam.updateProjectionMatrix();
    const sd = new THREE.Vector3(...(st.opts.sun ?? [-0.55, 1, 0.65])).normalize();
    const bc = box3.getCenter(new THREE.Vector3());
    sun.position.copy(bc).addScaledVector(sd, radius * 3); sun.target.position.copy(bc);
    const sc = sun.shadow.camera; sc.left = sc.bottom = -radius * 1.1; sc.right = sc.top = radius * 1.1; sc.near = 0.1; sc.far = radius * 6; sc.updateProjectionMatrix();
    return cam;
  }
  /** Render a staged scene into a 2D canvas. */
  draw(st, canvas, camOpts = {}, quality = 1) {
    const r = this.r, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(64, Math.round(canvas.clientWidth * dpr)), ch = Math.max(64, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== cw || canvas.height !== ch) { canvas.width = cw; canvas.height = ch; }
    const ss = quality >= 1 ? 2 : 1, maxW = 2600;
    let W = cw * ss, H = ch * ss; if (W > maxW) { H = Math.round(H * maxW / W); W = maxW; }
    this._targets(W, H); r.setPixelRatio(1); r.setSize(W, H, false);
    let cam = st.cam;
    if (!cam || Math.abs(st.aspect - W / H) > 1e-3) { const ry = st.root.rotation.y; st.root.rotation.y = 0; cam = st.cam = this._fit(st, camOpts, W / H); st.aspect = W / H; st.root.rotation.y = ry; }
    const { scene } = st;
    // 1) colour
    r.setRenderTarget(this.rtC); r.render(scene, cam);
    // 2) geometry (normals + id + depth)
    const swapped = [], bg = scene.background; scene.background = null;
    let auto = 1;
    scene.traverse((o) => { if (o.isMesh) { swapped.push([o, o.material]); o.material = o.userData.noInk || (o.material.isMeshBasicMaterial && o.userData.glowNoInk) ? this.hidden : this._geoMat(o.userData.inkKey ?? auto++); } });
    const shadowWas = r.shadowMap.enabled; r.shadowMap.enabled = false; r.shadowMap.autoUpdate = false;
    r.setClearColor(0x000000, 0); r.setRenderTarget(this.rtG); r.clear(); r.render(scene, cam);
    swapped.forEach(([o, m]) => (o.material = m)); scene.background = bg; r.shadowMap.enabled = shadowWas; r.shadowMap.autoUpdate = true;
    // 3) composite
    const u = this.comp.uniforms, lo = st.opts;
    u.tColor.value = this.rtC.texture; u.tGeo.value = this.rtG.texture; u.tDepth.value = this.rtG.depthTexture;
    u.uRes.value.set(W, H); u.uLine.value = (lo.line ?? 1.7) * dpr * ss * (W / (cw * ss)); u.uInk.value.set(lo.ink ?? P.ink);
    u.uNear.value = cam.near; u.uFar.value = cam.far; u.uGrain.value = lo.grain ?? 0.07; u.uSeed.value = (lo.seed ?? 3) * 1.37;
    u.uWobble.value = (lo.wobble ?? 2.2) * dpr * ss; u.uCrease.value = lo.crease ?? 0.72;
    u.uMono.value = lo.mono ? 1 : 0; u.uAccent.value.set(lo.accent ?? P.red); u.uAccentTol.value = lo.accentTol ?? 0.33;
    r.setRenderTarget(null); r.setClearColor(0x000000, 1); r.render(this.quadScene, this.quadCam);
    const ctx = canvas.getContext('2d'); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(r.domElement, 0, 0, W, H, 0, 0, cw, ch);
  }
  /** Stage + draw + drag-to-turn. Returns { redraw }. */
  attach(canvas, subject, opts = {}, camOpts = {}) {
    const st = this.stage(subject, opts);
    const draw = (q = 1) => { this.draw(st, canvas, camOpts, q); };
    draw(1);
    if (opts.turn !== false) {
      let drag = null, raf = 0;
      canvas.style.touchAction = 'pan-y'; canvas.style.cursor = 'grab';
      canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, r: st.root.rotation.y }; canvas.setPointerCapture(e.pointerId); canvas.style.cursor = 'grabbing'; });
      canvas.addEventListener('pointermove', (e) => { if (!drag) return; st.root.rotation.y = drag.r + (e.clientX - drag.x) * 0.012; if (!raf) raf = requestAnimationFrame(() => { raf = 0; draw(0); }); });
      const end = () => { if (!drag) return; drag = null; canvas.style.cursor = 'grab'; draw(1); };
      canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
      canvas.addEventListener('dblclick', () => { st.root.rotation.y = 0; draw(1); });
    }
    return { redraw: () => draw(1), stage: st };
  }
}
