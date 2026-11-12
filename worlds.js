// worlds.js — six "bigger world" pitches (Nov 2026). Lighter than a full board: one key-art diorama each,
// plus an honest note on how well the house style fits and how big the game would be to make.
// Drew's references are genre pointers only. Every name, place and look here is original.
import * as K from './kit.js';
const { P, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, tex, texMat, deg, rng } = K;

// ------------------------------------------------------------ shared bits
const log = (l = 0.9, c = P.bark) => grp(cyl(0.09, 0.09, l, c, { seg: 10 }), cyl(0.07, 0.07, 0.01, P.woodLt, { seg: 10 }).at(0, l, 0), cyl(0.07, 0.07, 0.01, P.woodLt, { seg: 10 }).at(0, -0.005, 0)).rot(0, 0, deg(90));
const sack = (c = P.linen) => grp(sph(0.17, c, { seg: 12 }).sc(1, 1.15, 0.9).at(0, 0.17, 0), cone(0.07, 0.1, c, { seg: 8 }).at(0, 0.33, 0)).weld();
const suitcase = (c = P.red) => grp(rbox(0.32, 0.24, 0.12, c, { r: 0.03 }), torus(0.05, 0.012, P.ink2, { arc: Math.PI, ts: 10 }).at(0, 0.24, 0));
const stripedPole = (h, a = P.red, b = P.white) => cyl(0.05, 0.05, h, texMat(tex.stripes({ colors: [a, b], n: 6, vertical: false, rep: [1, h * 1.5] })), { seg: 10 });

// ============================================================ 1. Hearthmarch (fantasy RTS)
const thorn = '#5b3a5e', thornDk = '#3c2840', blight = '#7b6a86';
function bramble(seed = 1, s = 1) {
  const r = rng(seed), g = grp();
  for (let i = 0; i < 4; i++) {
    const a = r() * 6.28, pts = [[0, 0, 0]];
    for (let j = 1; j <= 4; j++) pts.push([Math.cos(a + j * 0.6) * j * 0.18, j * 0.22 + r() * 0.1, Math.sin(a + j * 0.6) * j * 0.18]);
    g.add(tube(pts, 0.05, i % 2 ? thorn : thornDk, { segs: 20 }));
    pts.slice(1).forEach(([x, y, z]) => g.add(cone(0.035, 0.14, P.cream, { seg: 5 }).rot(r() * 2, 0, r() * 2).at(x, y, z)));
  }
  return g.sc(s);
}
function thornling() {
  const g = grp(
    sph(0.36, thornDk, { seg: 14 }).sc(1, 0.85, 0.9).at(0, 0.48, 0),
    sph(0.22, thorn, { seg: 12 }).at(0, 0.86, 0.12),
    ...[-1, 1].map((s) => cone(0.05, 0.32, P.cream, { seg: 6 }).rot(0, 0, s * -0.5).at(s * 0.14, 1.0, 0.08)),
    ...[-1, 1].map((s) => sph(0.045, K.glow('#c9a6ff'), { seg: 8 }).at(s * 0.08, 0.9, 0.31).noInk()),
    ...[[-0.2, 0.15], [0.2, 0.15], [-0.15, -0.15], [0.15, -0.15]].map(([x, z]) => cyl(0.05, 0.07, 0.3, thornDk, { seg: 6 }).at(x, 0, z)),
  );
  [0, 1, 2, 3, 4].forEach((i) => g.add(cone(0.04, 0.2, P.cream, { seg: 5 }).rot(deg(-30), 0, deg(-60 + i * 30)).at(-0.2 + i * 0.1, 0.78, -0.12)));
  return g;
}
function watchtower() {
  const g = grp(cyl(0.42, 0.5, 1.5, texMat(tex.bricks({ base: P.stone, mortar: P.stoneDk, rows: 10, cols: 6, rep: [2, 1] }))), cyl(0.56, 0.56, 0.12, P.woodDk).at(0, 1.5, 0));
  for (let i = 0; i < 8; i++) g.add(box(0.12, 0.2, 0.1, P.woodDk).at(Math.cos(i * 0.785) * 0.5, 1.62, Math.sin(i * 0.785) * 0.5).rot(0, -i * 0.785, 0));
  g.add(cone(0.62, 0.7, P.terracotta, { seg: 8 }).at(0, 2.1, 0), cyl(0.03, 0.03, 0.5, P.woodDk).at(0, 2.75, 0), K.flag(P.mustard, 0.5).at(0, 2.75, 0));
  [-1, 1].forEach((s) => g.add(cyl(0.025, 0.025, 0.5, P.woodDk, { seg: 6 }).at(s * 0.25, 1.62, 0.25)));
  g.add(box(0.36, 0.5, 0.06, P.woodDk).at(0, 0.0, 0.47));
  return g;
}
function hearthmarch() {
  const g = grp();
  g.add(K.ground(10.5, 6, { map: tex.speckle({ base: P.leaf, dots: [P.leafLt, P.moss], n: 160, size: 4, rep: [3, 2] }), side: P.soil, h: 0.45 }));
  // blighted ground on the right
  g.add(box(3.6, 0.02, 6, texMat(tex.speckle({ base: blight, dots: [thorn, '#9a8aa3'], n: 120, size: 4, rep: [1, 2] }))).at(3.45, 0, 0));
  // the town
  const hall = K.house({ w: 2.2, d: 1.5, h: 1.2, wall: P.wall, roof: P.terracotta, door: P.woodDk, windows: 2, chimney: true, shutters: P.teal, base: P.stoneDk });
  hall.add(cyl(0.03, 0.03, 1.0, P.woodDk).at(0.7, 1.9, 0), K.flag(P.mustard, 0.6).at(0.7, 2.3, 0));
  g.add(hall.at(-3.0, 0, -1.6));
  g.add(K.house({ w: 1.3, d: 1.1, h: 0.9, wall: P.linen, roof: '#d9b25a', door: P.teal, windows: 1, base: P.stoneDk }).at(-4.3, 0, 0.4));
  g.add(watchtower().sc(0.85).at(0.8, 0, -2.0));
  // woodpile and fields
  const pile = grp(); for (let i = 0; i < 3; i++) for (let j = 0; j < 3 - i; j++) pile.add(log(1.0).at(-0.5, 0.09 + i * 0.16, (j - (2 - i) / 2) * 0.19));
  g.add(pile.at(-1.0, 0, 0.0));
  for (let i = 0; i < 4; i++) g.add(box(1.6, 0.12, 0.2, i % 2 ? P.mustard : P.butter).at(-3.2, 0, 1.6 + i * 0.3));
  // lantern line: the border of the safe land
  [[-0.1, 2.6], [0.9, 1.4], [1.3, 0.1], [1.5, -1.0], [1.5, -2.6]].forEach(([x, z]) => g.add(K.lamppost(1.2).at(x + 0.2, 0, z)));
  // people
  g.add(K.person({ hairStyle: 'short', hair: P.hairBrown, top: P.mustard, bottom: P.soil, pose: 'carry', held: log(0.7) }).sc(0.62).at(-1.6, 0, 0.9).rot(0, deg(30), 0));
  g.add(K.person({ hairStyle: 'bun', hair: P.hairAuburn, skin: P.skin2, top: P.teal, bottom: P.navy, pose: 'hold', held: box(0.06, 0.6, 0.06, P.woodDk) }).sc(0.62).at(-2.2, 0, 1.6).rot(0, deg(15), 0));
  const sword = grp(box(0.06, 0.55, 0.02, P.steel).at(0, 0.1, 0), box(0.2, 0.04, 0.05, P.mustard).at(0, 0.1, 0));
  const knight = grp(K.person({ hat: 'helmet', hatColor: P.steel, top: P.blue, bottom: P.iron, skin: P.skin3, hairStyle: 'short', pose: 'hold', held: sword }), rbox(0.42, 0.5, 0.06, P.red, { r: 0.08 }).at(-0.34, 0.65, 0.2).rot(0, deg(-10), 0));
  g.add(knight.sc(0.66).at(1.0, 0, 0.9).rot(0, deg(20), 0));
  g.add(grp(K.person({ hat: 'helmet', hatColor: P.steel, top: P.blue, bottom: P.iron, hairStyle: 'short', pose: 'stand' }), rbox(0.42, 0.5, 0.06, P.red, { r: 0.08 }).at(-0.34, 0.65, 0.2)).sc(0.66).at(0.3, 0, 1.7));
  // the thornwild
  [[3.0, -1.8, 1.3, 2], [4.4, -0.6, 1.5, 3], [2.7, 1.9, 1.1, 4], [4.6, 2.0, 1.4, 5], [3.9, 0.9, 0.9, 6]].forEach(([x, z, s, sd]) => g.add(bramble(sd, s).at(x, 0, z)));
  g.add(K.tree({ kind: 'dead', h: 2.2, trunk: thornDk }).at(4.5, 0, -2.3));
  g.add(thornling().sc(0.9).at(2.6, 0, 0.3).rot(0, deg(-70), 0), thornling().sc(0.7).at(3.6, 0, -0.4).rot(0, deg(-50), 0));
  return g;
}

// ============================================================ 2. Riverfold (survival city builder)
const straw = '#d9b25a', strawDk = '#b48a3c', autumn = ['#d9772f', '#c9562f', '#e3a03a'];
function cottage(wall = P.linen, door = P.teal) {
  const h = K.house({ w: 1.25, d: 1.0, h: 0.85, wall, roof: straw, roofH: 0.75, door, windows: 1, chimney: true, base: P.stoneDk });
  return h;
}
function granary() {
  const g = grp();
  [[-0.4, -0.3], [0.4, -0.3], [-0.4, 0.3], [0.4, 0.3]].forEach(([x, z]) => g.add(cyl(0.07, 0.09, 0.32, P.stone, { seg: 8 }).at(x, 0, z), cyl(0.15, 0.15, 0.05, P.stone, { seg: 10 }).at(x, 0.32, z)));
  g.add(box(1.1, 0.8, 0.9, texMat(tex.planks({ base: P.wood, line: P.woodDk, n: 6, vertical: true }))).at(0, 0.37, 0));
  g.add(K.prism(1.3, 0.6, 1.1, strawDk).at(0, 1.17, 0), box(0.36, 0.5, 0.04, P.woodDk).at(0, 0.45, 0.46));
  g.add(sack().at(0.25, 0, 0.75), sack(P.cream).at(-0.05, 0, 0.8).sc(0.85));
  return g;
}
function wheat(w = 1.6, d = 1.0, ripe = true) {
  const g = grp(box(w, 0.04, d, P.soil));
  for (let i = 0; i < 5; i++) g.add(box(w - 0.1, 0.22, 0.14, ripe ? P.mustard : P.leafLt).at(0, 0.04, -d / 2 + 0.12 + i * (d - 0.24) / 4));
  return g.weld();
}
function riverfold() {
  const g = grp();
  g.add(K.ground(10.5, 6, { map: tex.speckle({ base: P.olive, dots: [P.moss, '#a39a52'], n: 140, size: 4, rep: [3, 2] }), side: P.soil, h: 0.45 }));
  // river: a sunk channel on the right
  g.add(box(1.5, 0.07, 6.02, P.soilDk).at(2.4, -0.06, 0).rot(0, deg(12), 0));
  g.add(grp(K.water(1.3, 6.0, { color: P.sea, rep: [1, 2] })).at(2.4, 0.025, 0).rot(0, deg(12), 0));
  // a little bridge
  g.add(grp(box(0.7, 0.08, 1.9, texMat(tex.planks({ base: P.woodLt, line: P.woodDk, n: 6 }))).at(0, 0.2, 0), ...[-1, 1].map((s) => box(0.05, 0.3, 1.9, P.woodDk).at(s * 0.32, 0.25, 0))).rot(0, deg(102), 0).at(2.3, 0, 1.6));
  // village
  g.add(cottage().at(-3.3, 0, -1.8), cottage(P.wall, P.red).at(-1.6, 0, -2.0), cottage('#f0d9b0', P.blue).rot(0, deg(20), 0).at(-4.2, 0, 0.3));
  g.add(granary().at(0.0, 0, -1.6));
  g.add(wheat(1.8, 1.1).at(-1.4, 0, 1.7), wheat(1.4, 1.1, false).at(0.5, 0, 1.9), wheat(1.3, 0.9).at(4.0, 0, -1.6));
  // well, woodpile, cart
  g.add(grp(cyl(0.32, 0.34, 0.35, P.stone), box(0.05, 0.75, 0.05, P.woodDk).at(-0.28, 0.3, 0), box(0.05, 0.75, 0.05, P.woodDk).at(0.28, 0.3, 0), K.prism(0.7, 0.25, 0.5, straw).at(0, 1.03, 0)).at(-1.9, 0, -0.1));
  const pile = grp(); for (let i = 0; i < 2; i++) for (let j = 0; j < 3 - i; j++) pile.add(log(0.8).at(-0.4, 0.09 + i * 0.16, (j - (2 - i) / 2) * 0.19));
  g.add(pile.at(-3.3, 0, -0.4));
  const cart = K.vehicle({ kind: 'cart', body: P.woodLt }); cart.add(sack().at(0, 0.7, 0.1), sack(P.cream).at(-0.3, 0.7, -0.15), K.sph(0.13, P.orange, { seg: 12 }).at(0.32, 0.8, 0.1));
  g.add(cart.sc(0.8).rot(0, deg(-25), 0).at(0.9, 0, 0.1));
  g.add(K.fence(2.0, P.woodLt, { h: 0.35 }).at(-1.4, 0, 1.0));
  // autumn trees
  [[-4.6, -2.3, 0], [4.4, 1.2, 1], [3.7, 2.5, 2], [-4.7, 2.3, 1], [4.7, -0.3, 0]].forEach(([x, z, c], i) => g.add(K.tree({ h: 1.6 + (i % 2) * 0.4, leaf: autumn[c], seed: i + 3 }).at(x, 0, z)));
  // people
  g.add(K.person({ hairStyle: 'ponytail', hair: P.hairAuburn, top: P.terracotta, bottom: P.soil, apron: P.cream, pose: 'carry', held: sack() }).sc(0.6).at(-0.5, 0, -0.3).rot(0, deg(25), 0));
  g.add(K.person({ hairStyle: 'short', hair: P.hairBlack, skin: P.skin3, top: P.teal, bottom: P.navy, hat: 'straw', pose: 'hold', held: box(0.05, 0.7, 0.05, P.woodDk) }).sc(0.6).at(-0.5, 0, 1.3));
  g.add(K.person({ body: 'kid', hairStyle: 'curly', hair: P.hairBrown, skin: P.skin2, top: P.mustard, bottom: P.blue, pose: 'wave' }).sc(0.6).at(-2.5, 0, 0.6));
  return g;
}

// ============================================================ 3. Tidepool Hall (aquarium)
function tank(w, h, d, o = {}) {
  const g = grp();
  g.add(box(w + 0.16, 0.5, d + 0.16, o.base ?? P.woodDk));
  g.add(box(w, h, 0.04, K.glow('#ffffff', { map: tex.gradient([[0, o.top ?? '#a8e0e6'], [1, o.bot ?? '#3f9fb0']]) })).at(0, 0.5, -d / 2 + 0.02).noInk());
  [-1, 1].forEach((s) => g.add(box(0.03, h, d - 0.04, K.glow(o.bot ?? '#3f9fb0')).at(s * (w / 2 - 0.02), 0.5, 0).noInk()));
  g.add(box(w, 0.1, d - 0.06, P.sand).at(0, 0.5, 0));
  const r = rng(o.seed ?? 4);
  for (let i = 0; i < (o.weed ?? 4); i++) g.add(cone(0.06, 0.4 + r() * 0.4, i % 2 ? P.leaf : P.teal, { seg: 6 }).at(-w / 2 + 0.2 + r() * (w - 0.4), 0.6, -d / 2 + 0.15 + r() * d * 0.4));
  for (let i = 0; i < 2; i++) g.add(K.rock(0.16, P.stone, i + 2).at(-w / 2 + 0.3 + r() * (w - 0.6), 0.6, -d * 0.1));
  (o.fish ?? []).forEach(([x, y, c, f, s]) => g.add(K.fish({ color: c, fin: f }).sc((s ?? 0.6) * 1.3).at(x, 0.5 + y, 0.1)));
  g.add(box(w, h, 0.02, K.mat(P.glass, { opacity: 0.18 })).at(0, 0.5, d / 2).noInk());
  [-1, 1].forEach((s) => g.add(box(0.08, h + 0.08, 0.08, P.iron).at(s * w / 2, 0.5, d / 2)));
  [-1, 1].forEach((s) => g.add(box(w + 0.16, 0.12, 0.1, P.iron).at(0, 0.5 + h, s * (d / 2 + 0.03)).noShadow(), box(0.1, 0.12, d + 0.16, P.iron).at(s * (w / 2 + 0.03), 0.5 + h, 0).noShadow()));
  return g;
}
function jelly(c = P.pink) {
  return grp(sph(0.16, c, { part: 'top', seg: 14 }), ...[0, 1, 2, 3].map((i) => tube([[Math.cos(i * 1.57) * 0.08, 0, Math.sin(i * 1.57) * 0.08], [Math.cos(i * 1.57) * 0.1, -0.15, Math.sin(i * 1.57) * 0.1], [Math.cos(i * 1.57) * 0.06, -0.3, Math.sin(i * 1.57) * 0.06]], 0.012, c).noInk()));
}
function tidepool() {
  const g = grp();
  g.add(K.ground(10, 5.6, { map: tex.tiles({ base: P.cream, line: P.stone, n: 8, rep: [4, 2] }), side: P.stoneDk, h: 0.35 }));
  g.add(box(10, 3.0, 0.2, '#e3d5b6').at(0, 0, -2.7));
  g.add(K.sign('TIDEPOOL HALL', { w: 3.0, h: 0.5, bg: P.seaDk, fg: P.cream, frame: P.woodDk }).at(0, 2.35, -2.55));
  g.add(tank(3.6, 1.5, 1.0, { fish: [[-1.0, 0.8, P.coral, P.mustard], [0.3, 1.1, P.mustard, P.coral, 0.5], [1.1, 0.6, P.sea, P.white, 0.7], [-0.2, 0.45, P.blue, P.mustard, 0.45]] }).at(-2.4, 0, -1.9));
  g.add(tank(2.4, 1.5, 1.0, { top: '#9ad6e0', bot: '#3f8ea6', seed: 8, fish: [[-0.5, 0.9, P.white, P.red, 0.5], [0.5, 0.6, P.red, P.white, 0.55]] }).at(1.0, 0, -1.9));
  // round jelly tank
  const jt = grp(cyl(0.65, 0.7, 0.5, P.woodDk), cyl(0.55, 0.55, 1.6, K.glow('#ffffff', { map: tex.gradient([[0, '#6a6fb0'], [1, '#2a3166']]) }), { seg: 24 }).at(0, 0.5, 0), cyl(0.62, 0.62, 0.12, P.iron).at(0, 2.1, 0));
  jt.add(jelly(P.pink).at(-0.15, 1.6, 0.42).noInk(), jelly(P.lilac).sc(0.8).at(0.2, 1.1, 0.45).noInk(), jelly(P.coral).sc(0.6).at(-0.05, 0.85, 0.5).noInk());
  g.add(jt.at(3.6, 0, -1.6));
  // touch pool in front
  const pool = grp(cyl(0.95, 1.0, 0.5, P.stone, { seg: 28 }), cyl(0.82, 0.82, 0.02, texMat(tex.waves({ base: '#6fbac8', line: '#bfe9ef' })), { seg: 28 }).at(0, 0.44, 0));
  pool.add(K.rock(0.18, P.stoneDk, 3).at(0.3, 0.38, -0.2), extrude([[0, 0.12], [0.04, 0.04], [0.12, 0.04], [0.06, -0.02], [0.08, -0.1], [0, -0.05], [-0.08, -0.1], [-0.06, -0.02], [-0.12, 0.04], [-0.04, 0.04]], 0.03, P.orange).rot(deg(-90), 0, 0).at(-0.2, 0.47, 0.2));
  g.add(pool.at(-0.6, 0, 1.0));
  // people
  g.add(K.person({ body: 'kid', hairStyle: 'pigtails', hair: P.hairBlack, skin: P.skin3, top: P.mustard, bottom: P.blue, pose: 'point' }).sc(0.8).at(-1.7, 0, -0.9).rot(0, deg(180), 0));
  g.add(K.person({ hairStyle: 'bob', hair: P.hairBlonde, top: P.coral, bottom: P.navy, acc: ['satchel'], pose: 'stand' }).sc(0.8).at(-2.6, 0, -0.6).rot(0, deg(160), 0));
  g.add(K.person({ hairStyle: 'short', hair: P.hairGrey, skin: P.skin2, top: P.teal, bottom: P.navy, apron: P.seaDk, hat: 'beanie', hatColor: P.mustard, pose: 'wave' }).sc(0.8).at(0.6, 0, 1.4));
  g.add(K.person({ body: 'kid', hairStyle: 'curly', hair: P.hairBrown, skin: P.skin2, top: P.red, bottom: P.navy, pose: 'point' }).sc(0.7).at(-1.4, 0, 1.7).rot(0, deg(150), 0));
  g.add(K.bench(1.2, P.wood).at(2.6, 0, 0.6).rot(0, deg(-20), 0));
  g.add(cyl(0.14, 0.12, 0.3, P.steel).at(1.3, 0, 0.9), K.pottedPlant(P.terracotta, P.leaf, 1.4).at(4.4, 0, 1.6));
  return g;
}

// ============================================================ 4. Saltway (coastal freight)
const cargoCols = [P.red, P.mustard, P.teal, P.blue, P.coral];
const cargo = (c) => rbox(0.5, 0.36, 0.36, texMat(tex.planks({ base: c, line: P.ink2, n: 4, vertical: true })), { r: 0.02 });
function coaster() {
  const g = grp();
  const hull = extrude([[-2.0, 0.1], [-2.1, 0.75], [1.9, 0.75], [2.4, 0.85], [1.9, 0.0], [-1.8, 0.0]], 1.1, P.navy);
  g.add(hull, box(4.2, 0.12, 1.12, P.red).at(0.1, 0.06, 0));
  g.add(box(4.1, 0.05, 1.0, P.woodLt).at(0.1, 0.72, 0));
  // bridge at the stern
  g.add(K.house({ w: 0.9, d: 0.95, h: 0.6, wall: P.white, roof: P.white, roofType: 'flat', windows: 0, door: P.white, base: P.white }).rot(0, deg(90), 0).at(-1.45, 0.77, 0));
  g.add(box(0.05, 0.22, 0.75, P.glassDk).at(-1.0, 1.25, 0));
  g.add(cyl(0.16, 0.18, 0.55, P.mustard, { seg: 14 }).at(-1.6, 1.5, 0), cyl(0.165, 0.165, 0.12, P.ink2, { seg: 14 }).at(-1.6, 1.85, 0));
  // cargo
  const r = rng(7);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) for (let k = 0; k < (i + j) % 2 + 1; k++) g.add(cargo(cargoCols[Math.floor(r() * 5)]).at(-0.55 + i * 0.55, 0.77 + k * 0.37, -0.2 + j * 0.4));
  g.add(cyl(0.03, 0.03, 1.1, P.white, { seg: 8 }).at(1.9, 0.75, 0), K.flag(P.red, 0.4).at(1.9, 1.45, 0));
  g.add(K.sign('MARIGOLD', { w: 0.9, h: 0.18, bg: P.navy, fg: P.white, frame: P.navy }).at(1.0, 0.4, 0.56));
  return g;
}
function crane() {
  const g = grp(box(0.7, 0.2, 0.7, P.mustard), box(0.3, 2.4, 0.3, P.mustard).at(0, 0.2, 0));
  for (let i = 0; i < 6; i++) g.add(box(0.32, 0.04, 0.32, P.ink2).at(0, 0.5 + i * 0.35, 0).noInk());
  g.add(box(0.6, 0.45, 0.5, P.mustard).at(0, 2.6, 0), box(0.04, 0.25, 0.3, P.glassDk).at(0.31, 2.72, 0));
  g.add(box(2.8, 0.14, 0.18, P.mustard).at(1.4, 2.95, 0), box(0.6, 0.3, 0.3, P.iron).at(-0.4, 2.85, 0));
  g.add(cyl(0.012, 0.012, 1.3, P.ink2, { seg: 6 }).at(2.5, 1.65, 0).noInk(), cargo(P.teal).at(2.5, 1.28, 0));
  return g;
}
function saltway() {
  const g = grp();
  g.add(K.ground(10.5, 6, { map: tex.waves({ base: P.sea, line: '#9ad6de', rep: [3, 2] }), side: P.seaDk, h: 0.6 }).at(0, -0.55, 0));
  // quay
  g.add(K.ground(4.4, 6, { map: tex.tiles({ base: P.stone, line: P.stoneDk, n: 6, rep: [2, 3] }), side: P.stoneDk, h: 0.9 }).at(-3.05, 0.25, 0));
  const shed = K.house({ w: 2.2, d: 1.4, h: 1.2, wall: P.terracotta, roof: P.slate, roofType: 'gable', roofH: 0.5, door: P.mustard, windows: 1, sign: 'SALTWAY', base: P.stoneDk });
  g.add(shed.at(-3.3, 0.25, -2.0));
  g.add(crane().at(-1.75, 0.25, -0.6).rot(0, deg(-20), 0));
  const r = rng(3);
  for (let i = 0; i < 3; i++) for (let k = 0; k < 3 - i % 2; k++) g.add(cargo(cargoCols[Math.floor(r() * 5)]).at(-4.3 + i * 0.55, 0.25 + k * 0.37, 0.4));
  for (let i = 0; i < 4; i++) g.add(cyl(0.08, 0.1, 0.22, P.iron, { seg: 8 }).at(-1.05, 0.25, -2.4 + i * 1.5));
  g.add(K.barrel(0.5, P.red).at(-3.7, 0.25, 1.6), K.barrel(0.5, P.teal).at(-3.25, 0.25, 1.9), K.lamppost(1.4).at(-1.3, 0.25, 2.3));
  // ship
  g.add(coaster().at(1.15, -0.3, 0.3).rot(0, deg(2), 0));
  // lighthouse island, buoys
  const isle = grp(K.rock(0.9, P.stoneDk, 5).sc(1.4, 0.6, 1.2), cyl(0.3, 0.38, 1.6, texMat(tex.stripes({ colors: [P.red, P.white], n: 4, vertical: false })), { seg: 16 }).at(0, 0.45, 0), cyl(0.24, 0.24, 0.28, K.glow(P.butter), { seg: 12 }).at(0, 2.05, 0), cone(0.34, 0.3, P.red, { seg: 12 }).at(0, 2.33, 0));
  isle.add(sph(0.75, P.moss, { part: 'top', seg: 16 }).sc(1.5, 0.35, 1.3).at(0, 0.35, 0));
  g.add(isle.at(4.4, -0.2, -2.5));
  [[3.6, 1.6, P.red], [-0.6, 2.4, P.mustard]].forEach(([x, z, c]) => g.add(grp(cone(0.2, 0.5, c, { seg: 10 }), cyl(0.22, 0.22, 0.12, P.white, { seg: 10 })).at(x, -0.1, z)));
  // people
  g.add(K.person({ hat: 'hardhat', top: P.orange, bottom: P.navy, hairStyle: 'short', skin: P.skin3, pose: 'point' }).sc(0.65).at(-2.4, 0.25, 0.9).rot(0, deg(30), 0));
  g.add(K.person({ hat: 'captain', top: P.navy, bottom: P.navy, hairStyle: 'short', hair: P.hairGrey, acc: ['beard'], pose: 'wave' }).sc(0.65).at(-1.2, 0.25, 1.4));
  g.add(K.bird({}).sc(0.8).at(-0.3, 0.75, -0.5), K.bird({}).sc(0.8).rot(0, deg(60), 0).at(-4.6, 0.25, -0.6));
  return g;
}

// ============================================================ 5. Puddle Jump Air (island airline)
function propPlane(body = P.mustard, trim = P.teal, o = {}) {
  const g = grp();
  g.add(cap(0.28, 2.0, body, { seg: 16 }).rot(0, 0, deg(-90)).at(-1.25, 0.6, 0));
  g.add(box(0.3, 0.04, 2.0, trim).at(0.45, 0.62, 0));
  g.add(box(0.75, 0.06, 3.4, body).at(0.2, 0.86, 0), box(0.78, 0.07, 0.2, trim).at(0.2, 0.86, 1.55), box(0.78, 0.07, 0.2, trim).at(0.2, 0.86, -1.55));
  g.add(extrude([[0, 0], [0.55, 0], [0.15, 0.7], [-0.05, 0.7]], 0.05, trim).at(-1.25, 0.8, 0));
  g.add(box(0.4, 0.04, 1.1, body).at(-1.2, 0.72, 0));
  g.add(box(0.4, 0.16, 0.5, P.glassDk).at(0.55, 0.78, 0).rot(0, 0, deg(-25)));
  [-1, 1].forEach((s) => { for (let i = 0; i < 3; i++) g.add(cyl(0.07, 0.07, 0.02, P.glassDk, { seg: 12 }).rot(deg(90), 0, 0).at(-0.05 - i * 0.35, 0.68, s * 0.285)); });
  g.add(sph(0.12, P.red, { seg: 12 }).sc(1.3, 1, 1).at(1.02, 0.6, 0), box(0.03, 0.85, 0.08, P.ink2).at(1.12, 0.6, 0).rot(deg(25), 0, 0).at(1.12, 0.22, 0));
  if (o.floats) { [-1, 1].forEach((s) => g.add(cap(0.13, 1.5, P.white, { seg: 12 }).rot(0, 0, deg(-90)).at(-0.6, 0.0, s * 0.6), cyl(0.025, 0.025, 0.5, P.iron).at(0, 0.12, s * 0.6), cyl(0.025, 0.025, 0.5, P.iron).at(-0.6, 0.12, s * 0.6))); }
  else { [-1, 1].forEach((s) => g.add(cyl(0.03, 0.03, 0.4, P.iron).at(0.35, 0.12, s * 0.4), K.wheel(0.13, 0.08).at(0.35, 0.13, s * 0.4))); g.add(K.wheel(0.07, 0.05).at(-1.5, 0.07, 0)); }
  return g;
}
function puddlejump() {
  const g = grp();
  g.add(K.ground(10.5, 6.2, { map: tex.waves({ base: P.sea, line: '#9ad6de', rep: [3, 2] }), side: P.seaDk, h: 0.6 }).at(0, -0.55, 0));
  const isle = grp(K.ground(7.6, 4.4, { top: P.sand, side: P.sandDk, h: 0.25 }), box(7.0, 0.04, 3.8, texMat(tex.speckle({ base: P.leafLt, dots: [P.leaf], n: 80, size: 4, rep: [3, 2] }))).at(0, 0, 0));
  g.add(isle.at(-0.9, 0.05, -0.2));
  // airstrip
  g.add(box(6.2, 0.05, 1.0, '#a9c97a').at(-0.9, 0.06, 0.55));
  for (let i = 0; i < 6; i++) g.add(box(0.4, 0.06, 0.08, P.white).at(-3.6 + i * 1.0, 0.06, 0.55).noInk());
  // terminal hut + windsock
  g.add(K.house({ w: 1.7, d: 1.1, h: 0.95, wall: P.white, roof: P.teal, roofType: 'hip', roofH: 0.4, door: P.mustard, windows: 1, sign: 'ARRIVALS', awning: [P.teal, P.white], base: P.stoneDk }).at(-2.6, 0.06, -1.5));
  const sock = grp(stripedPole(1.5, P.white, P.ink2), cone(0.14, 0.7, texMat(tex.stripes({ colors: [P.orange, P.white], n: 5 })), { seg: 10 }).rot(0, 0, deg(-100)).at(0.05, 1.4, 0));
  g.add(sock.at(-0.6, 0.06, -1.9));
  g.add(propPlane().sc(0.85).rot(0, deg(-12), 0).at(0.3, 0.06, 0.5));
  g.add(propPlane(P.white, P.red, { floats: true }).sc(0.7).rot(0, deg(30), 0).at(3.9, -0.1, 1.6));
  // luggage cart and fuel
  const lc = grp(box(0.9, 0.08, 0.6, P.iron).at(0, 0.2, 0), ...[[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]].map(([x, z]) => K.wheel(0.09, 0.05).at(x, 0.09, z)), suitcase(P.red).at(-0.2, 0.28, -0.1), suitcase(P.teal).at(0.2, 0.28, 0.1), suitcase(P.mustard).sc(0.8).at(0.0, 0.52, 0));
  g.add(lc.at(-1.3, 0.06, -0.6));
  g.add(K.barrel(0.5, P.red).at(-4.2, 0.06, -1.3), K.barrel(0.5, P.red).at(-4.0, 0.06, -0.85));
  [[-4.3, -1.9], [1.8, -1.7], [2.4, -1.0]].forEach(([x, z], i) => g.add(K.tree({ kind: 'palm', h: 1.6 + i * 0.2, seed: i + 2 }).at(x, 0.06, z)));
  // people
  g.add(K.person({ hat: 'captain', hatColor: P.navy, top: P.white, bottom: P.navy, hairStyle: 'short', skin: P.skin3, pose: 'wave' }).sc(0.6).at(-1.6, 0.06, 0.05));
  g.add(K.person({ hairStyle: 'long', hair: P.hairBlonde, top: P.pink, bottom: P.sand, hat: 'straw', pose: 'hold', held: suitcase(P.blue) }).sc(0.6).at(-3.2, 0.06, -0.7));
  g.add(K.person({ body: 'elder', hairStyle: 'bald', skin: P.skin2, top: P.coral, bottom: P.navy, acc: ['glasses'], pose: 'stand' }).sc(0.6).at(-3.7, 0.06, -0.4));
  return g;
}

// ============================================================ 6. Tuppenny Pier (seaside arcade)
const reel = (c) => grp(box(0.1, 0.12, 0.02, P.white).noInk(), sph(0.03, c, { seg: 8 }).at(0, 0.06, 0.02).noInk());
function fruitMachine(body = P.red, trim = P.mustard) {
  const g = grp(rbox(0.7, 1.5, 0.55, body, { r: 0.05 }), box(0.72, 0.08, 0.57, trim).at(0, 0.7, 0));
  g.add(box(0.5, 0.26, 0.02, K.glow('#fff2c7')).at(0, 0.95, 0.28));
  [P.red, P.mustard, P.green].forEach((c, i) => g.add(reel(c).at(-0.15 + i * 0.15, 1.01, 0.3)));
  g.add(rbox(0.6, 0.3, 0.12, trim, { r: 0.04 }).at(0, 1.5, 0.15), box(0.5, 0.18, 0.02, K.glow(P.butter)).at(0, 1.56, 0.22));
  g.add(cyl(0.02, 0.02, 0.4, P.steel, { seg: 6 }).at(0.38, 0.8, 0.1), sph(0.06, P.red, { seg: 10 }).at(0.38, 1.22, 0.1));
  g.add(box(0.3, 0.1, 0.12, P.ink2).at(0, 0.45, 0.28));
  for (let i = 0; i < 5; i++) g.add(sph(0.035, K.glow(i % 2 ? P.butter : '#ffd2a8'), { seg: 8 }).at(-0.28 + i * 0.14, 1.85, 0.2).noInk());
  return g;
}
function coinPusher() {
  const g = grp(rbox(1.5, 1.0, 1.0, P.blue, { r: 0.06 }), box(1.52, 0.1, 1.02, P.mustard).at(0, 1.0, 0));
  g.add(box(1.3, 0.04, 0.8, P.navy).at(0, 1.1, 0));
  const r = rng(9);
  for (let i = 0; i < 26; i++) g.add(cyl(0.07, 0.07, 0.02, P.mustard, { seg: 12 }).at(-0.55 + r() * 1.1, 1.14 + (i % 3) * 0.02, -0.25 + r() * 0.6));
  g.add(box(1.3, 0.7, 0.03, K.mat(P.glass, { opacity: 0.18 })).at(0, 1.1, 0.42).noInk());
  g.add(box(1.4, 0.12, 0.9, P.mustard).at(0, 1.8, 0), box(1.2, 0.26, 0.04, K.glow('#ffe7a0')).at(0, 1.92, 0.4));
  g.add(K.sign('2p', { w: 0.4, h: 0.25, bg: P.red, fg: P.white, frame: P.mustard }).at(0, 0.55, 0.51));
  return g;
}
function clawMachine() {
  const g = grp(rbox(0.9, 0.9, 0.9, P.pink, { r: 0.05 }));
  const r = rng(4);
  for (let i = 0; i < 7; i++) g.add(sph(0.12, [P.mustard, P.sky, P.leafLt, P.white, P.coral][i % 5], { seg: 12 }).at(-0.25 + r() * 0.5, 0.98, -0.25 + r() * 0.5));
  g.add(box(0.86, 0.9, 0.86, K.mat(P.glass, { opacity: 0.15 })).at(0, 0.9, 0).noInk());
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => g.add(box(0.06, 0.9, 0.06, P.pink).at(x * 0.43, 0.9, z * 0.43)));
  g.add(rbox(0.94, 0.3, 0.94, P.pink, { r: 0.05 }).at(0, 1.8, 0), box(0.7, 0.16, 0.02, K.glow('#ffd2e2')).at(0, 1.88, 0.47));
  g.add(cyl(0.01, 0.01, 0.4, P.ink2, { seg: 6 }).at(0.1, 1.4, 0).noInk(), cone(0.08, 0.12, P.steel, { seg: 6 }).rot(deg(180), 0, 0).at(0.1, 1.4, 0));
  return g;
}
function tuppenny() {
  const g = grp();
  g.add(K.ground(10, 5.6, { map: tex.checker({ a: '#7a2e3a', b: '#5a2230', n: 8, rep: [5, 3] }), side: P.woodDk, h: 0.35 }));
  g.add(box(10, 3.0, 0.2, '#4a3550').at(0, 0, -2.7));
  // glowing sign + bulbs on the back wall
  g.add(K.sign('TUPPENNY PIER', { w: 3.4, h: 0.55, bg: '#ffe9b0', fg: P.red, frame: P.mustard }).at(0, 2.2, -2.55));
  for (let i = 0; i < 16; i++) g.add(sph(0.06, K.glow(i % 2 ? P.butter : '#ff9f8a'), { seg: 8 }).at(-4.5 + i * 0.6, 2.85, -2.55).noInk());
  [[-4.0, P.red, P.mustard], [-3.1, P.teal, P.mustard], [-2.2, P.red, P.mustard]].forEach(([x, b, t]) => g.add(fruitMachine(b, t).at(x, 0, -2.1)));
  g.add(coinPusher().at(-0.2, 0, -1.9));
  g.add(clawMachine().at(1.7, 0, -1.9), clawMachine().at(2.75, 0, -1.9));
  // change booth
  const booth = grp(box(1.1, 1.0, 0.8, P.woodLt), box(1.1, 0.06, 0.82, P.mustard).at(0, 1.0, 0), box(0.06, 0.8, 0.06, P.mustard).at(-0.52, 1.0, 0.38), box(0.06, 0.8, 0.06, P.mustard).at(0.52, 1.0, 0.38), box(1.2, 0.3, 0.9, P.red).at(0, 1.8, 0), K.sign('CHANGE', { w: 0.9, h: 0.22, bg: P.cream, fg: P.red, frame: P.red }).at(0, 1.84, 0.46));
  booth.add(K.person({ body: 'elder', hairStyle: 'bun', hair: P.hairWhite, top: P.teal, pose: 'stand' }).sc(0.8).at(0, 0.0, -0.1));
  g.add(booth.rot(0, deg(-30), 0).at(4.1, 0, -0.3));
  // people
  g.add(K.person({ body: 'elder', hairStyle: 'curly', hair: P.hairGrey, top: P.lilac, bottom: P.navy, acc: ['glasses'], pose: 'hold', held: cyl(0.1, 0.08, 0.16, P.white, { seg: 12 }) }).sc(0.85).at(-0.6, 0, -0.6).rot(0, deg(15), 0));
  g.add(K.person({ body: 'kid', hairStyle: 'spiky', hair: P.hairAuburn, top: P.mustard, bottom: P.blue, pose: 'point' }).sc(0.8).at(2.2, 0, -0.9).rot(0, deg(170), 0));
  g.add(K.person({ hairStyle: 'ponytail', hair: P.hairBlack, skin: P.skin3, top: P.coral, bottom: P.navy, pose: 'wave' }).sc(0.85).at(1.0, 0, 0.9));
  g.add(cyl(0.18, 0.2, 0.7, P.red, { seg: 14 }).at(-2.6, 0, 0.4), sph(0.2, K.glow(P.butter), { seg: 12 }).at(-2.6, 0.82, 0.4).noInk());
  return g;
}

// ------------------------------------------------------------ the six pitches
export const WORLDS = [
  {
    slug: 'hearthmarch', title: 'Hearthmarch', ref: 'Classic fantasy RTS',
    logline: 'Grow a village, train its guard and push a creeping thorn forest back, one lantern at a time.',
    pitch: 'A real-time strategy game for one player. Workers chop, carry and build. Every lantern you light pushes the safe border outwards, and the Thornwild pushes back at night. No orcs or elves: just villagers, a few knights and a forest that wants its land back.',
    fit: 'Good', fitNote: 'Chunky units read well from above and ink makes them easy to pick out in a crowd. Battles with 50+ units will get busy, so keep armies small.',
    size: 5, sizeNote: 'The biggest of the six. Unit AI, pathfinding and enemy AI are each a project on their own.',
    accent: P.terracotta, key: { build: hearthmarch, bg: [[0, '#f2b48c'], [0.6, '#f3d7b5'], [1, '#e9cdb3']], light: 'dusk', cam: { yaw: -28, pitch: 38, fov: 24 }, caption: 'The lantern line at dusk' },
  },
  {
    slug: 'riverfold', title: 'Riverfold', ref: 'Survival city builder',
    logline: 'A few families, one river valley, and a store that has to last until spring.',
    pitch: 'You never place a person, only jobs and buildings. Villagers are named, they age, marry and remember the hard winter. Harvest, store and burn wood to get through. No combat. Your Egyptian town already uses this look and this camera, so it could share the code.',
    fit: 'Strong', fitNote: 'This is the style’s home turf: thatch, fields and little people on a slab. It already works in your Egyptian town.',
    size: 3, sizeNote: 'Medium. The seasons and food maths are the hard part, the art is mostly reusable.',
    accent: '#d9772f', key: { build: riverfold, bg: [[0, '#f4d9a8'], [1, '#f3ead6']], cam: { yaw: -30, pitch: 38, fov: 24 }, caption: 'Week 30: the store needs to last till spring' },
  },
  {
    slug: 'tidepool', title: 'Tidepool Hall', ref: 'Aquarium builder',
    logline: 'Turn a run-down seaside aquarium into the best day out on the coast.',
    pitch: 'Build tanks piece by piece: sand, rocks, weed, then the right fish. Keep the water right and visitors press their noses to the glass. Rescued animals arrive from the beach. It can live in the same seaside town as the kite shop.',
    fit: 'Good', fitNote: 'Tanks look great as glowing boxes of colour. Glass and water are tricky with ink lines, so glass stays clear and only the frames get outlines.',
    size: 3, sizeNote: 'Medium. Lots of fish and decor to build, but the rules are simple.',
    accent: P.seaDk, key: { build: tidepool, bg: [[0, '#d9eef0'], [1, '#f3ead6']], cam: { yaw: -22, pitch: 30, fov: 24 }, caption: 'Saturday morning, doors open' },
  },
  {
    slug: 'saltway', title: 'Saltway', ref: 'Ship and freight sim',
    logline: 'Run a little coastal freight line, one ship, one crane and a lot of crates.',
    pitch: 'Start with one tired coaster and a quay. Plot routes between island harbours on a paper chart, load every crate with the crane yourself, and race the weather home. Earn a second ship, then a third. Your 900 hours in transport games say this one might stick.',
    fit: 'Strong', fitNote: 'Boats, cranes and coloured crates are exactly what this style draws best. Open sea needs islands and lighthouses to stay interesting.',
    size: 3, sizeNote: 'Medium. Routes and an economy, but a small map and few ship types keep it in check.',
    accent: P.navy, key: { build: saltway, bg: [[0, '#bfe4ec'], [1, '#f3ead6']], cam: { yaw: -26, pitch: 32, fov: 24 }, caption: 'Loading the Marigold, 6am' },
  },
  {
    slug: 'puddlejump', title: 'Puddle Jump Air', ref: 'Airline management',
    logline: 'One seaplane, one grass strip, and a chain of islands waiting for flights.',
    pitch: 'Start an island-hopping airline. Buy small prop planes, open grass strips, set timetables and keep passengers happy. You load the luggage and wave planes off yourself, so it never becomes a spreadsheet. Big jets and world maps stay out.',
    fit: 'Good', fitNote: 'Small planes and island strips look lovely. Big jets and airports would lose the charm, so the game stays regional.',
    size: 3, sizeNote: 'Medium. Management games drift into menus, which you dislike, so the hands-on parts matter.',
    accent: P.teal, key: { build: puddlejump, bg: [[0, '#bfe4ec'], [1, '#f3ead6']], cam: { yaw: -24, pitch: 34, fov: 24 }, caption: 'The 9:40 to Gull Rock' },
  },
  {
    slug: 'tuppenny', title: 'Tuppenny Pier', ref: 'Casino and slots',
    logline: 'Run the old penny arcade at the end of the pier and fill it with machines you build.',
    pitch: 'Instead of gambling, you run the arcade. Build fruit machines, coin pushers and claw grabbers on a bench, tune their payouts, and keep the regulars coming back. Everything plays for 2p coins and prizes, never real money.',
    fit: 'Strong', fitNote: 'Glowing cabinets, bulbs and coins at dusk look brilliant in toon. Keep it about running the place, not playing slots.',
    size: 2, sizeNote: 'Small to medium. One room, a few machine types. Simulated gambling can push age ratings up, which is another reason to keep it about running the arcade.',
    accent: P.red, key: { build: tuppenny, bg: [[0, '#f6b98a'], [1, '#e9cdb3']], light: 'dusk', cam: { yaw: -20, pitch: 28, fov: 24 }, caption: 'Last tuppence of the evening' },
  },
];
