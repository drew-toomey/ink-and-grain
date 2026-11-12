// Hearthmarch — single-player fantasy RTS. Original world: villagers vs a creeping thorn forest. Pieces from worlds.js.
import * as K from '../kit.js';
import { hearthmarch, watchtower, bramble, thornling, log, thorn, thornDk, blight } from '../worlds.js';
const { P, grp, box, rbox, cyl, cone, sph, torus, tube, extrude, tex, texMat, deg, rng } = K;

const meadow = (w, d, h = 0.25) => K.ground(w, d, { map: tex.speckle({ base: P.leaf, dots: [P.leafLt, P.moss], n: 90, size: 4 }), side: P.soil, h });
const sword = () => grp(box(0.06, 0.55, 0.02, P.steel).at(0, 0.1, 0), box(0.2, 0.04, 0.05, P.mustard).at(0, 0.1, 0));
const shield = (c = P.red) => grp(rbox(0.42, 0.5, 0.06, c, { r: 0.08 }), box(0.06, 0.4, 0.07, P.mustard).at(0, 0.05, 0), box(0.3, 0.06, 0.07, P.mustard).at(0, 0.26, 0));
function knight(o = {}) {
  return grp(K.person({ hat: 'helmet', hatColor: P.steel, top: o.top ?? P.blue, bottom: P.iron, skin: o.skin ?? P.skin3, hairStyle: 'short', pose: o.pose ?? 'hold', held: o.pose === 'stand' ? null : sword() }), shield(o.shield).at(-0.34, 0.45, 0.2).rot(0, deg(-10), 0));
}
function hearthLantern(h = 1.6) {
  const g = grp(cyl(0.22, 0.28, 0.2, P.stone, { seg: 8 }), cyl(0.07, 0.08, h, P.woodDk, { seg: 8 }).at(0, 0.2, 0));
  g.add(box(0.5, 0.06, 0.06, P.woodDk).at(0.15, h + 0.1, 0), grp(K.lantern(P.iron, P.butter)).sc(1.6).at(0.35, h - 0.45, 0));
  g.add(cyl(1.1, 1.1, 0.01, K.glow('#ffe6a0', { opacity: 0.35, depthWrite: false }), { seg: 32 }).at(0, 0.21, 0).noInk().noShadow());
  return g;
}
function hall() {
  const g = K.house({ w: 2.4, d: 1.6, h: 1.25, wall: P.wall, roof: P.terracotta, door: P.woodDk, windows: 2, chimney: true, shutters: P.teal, base: P.stoneDk });
  g.add(cyl(0.03, 0.03, 1.0, P.woodDk).at(0.75, 1.95, 0), K.flag(P.mustard, 0.6).at(0.75, 2.35, 0));
  g.add(K.barrel(0.5, P.wood).at(1.45, 0, 0.6), K.crate(0.4).at(-1.45, 0, 0.7));
  return grp(meadow(3.4, 2.6), g.at(0, 0, -0.3));
}
function wagon() {
  const g = K.vehicle({ kind: 'cart', body: P.woodLt });
  for (let i = 0; i < 3; i++) g.add(log(0.9).at(0.45, 0.62 + (i === 2 ? 0.16 : 0), (i === 2 ? 0 : i - 0.5) * 0.2));
  g.add(K.lantern().sc(0.8).at(0.55, 0.7, 0.3));
  return grp(meadow(2.8, 1.8), g.rot(0, deg(-20), 0));
}
function nightRaid() {
  const g = grp();
  g.add(K.ground(9.5, 5.6, { map: tex.speckle({ base: '#4f7a48', dots: ['#5f8a52'], n: 120, size: 4, rep: [3, 2] }), side: P.soilDk, h: 0.45 }));
  g.add(box(4.0, 0.02, 5.6, texMat(tex.speckle({ base: '#4d4258', dots: [thorn], n: 100, size: 4, rep: [1, 2] }))).at(2.75, 0, 0));
  [[-0.2, 2.0], [0.4, 0.4], [0.5, -1.4]].forEach(([x, z]) => g.add(hearthLantern(1.3).at(x, 0, z)));
  g.add(watchtower().sc(0.8).at(-2.8, 0, -1.6), K.house({ w: 1.4, d: 1.1, h: 0.9, wall: P.linen, roof: '#d9b25a', windows: 1, glass: P.butter, base: P.stoneDk }).at(-3.6, 0, 0.7));
  g.add(knight({ pose: 'hold' }).sc(0.7).at(-0.6, 0, 0.9).rot(0, deg(70), 0), knight({ top: P.teal, shield: P.mustard }).sc(0.7).at(-0.7, 0, -0.6).rot(0, deg(80), 0));
  g.add(K.person({ hairStyle: 'bun', hair: P.hairAuburn, top: P.mustard, bottom: P.soil, acc: ['lantern'], pose: 'stand' }).sc(0.7).at(-1.6, 0, 0.1).rot(0, deg(60), 0));
  [[2.3, 0.9, 0.9], [2.9, -0.8, 0.75], [3.6, 0.2, 0.6]].forEach(([x, z, s], i) => g.add(thornling().sc(s).at(x, 0, z).rot(0, deg(-90 + i * 10), 0)));
  [[3.8, -2.2, 1.4, 2], [4.1, 1.9, 1.3, 3], [2.4, 2.3, 1.0, 4], [2.3, -2.3, 1.0, 5]].forEach(([x, z, s, sd]) => g.add(bramble(sd, s).at(x, 0, z)));
  return g;
}
function reclaimed() {
  const g = grp();
  g.add(K.ground(9.5, 5.6, { map: tex.speckle({ base: P.leaf, dots: [P.leafLt, P.moss], n: 160, size: 4, rep: [3, 2] }), side: P.soil, h: 0.45 }));
  g.add(box(2.6, 0.02, 5.6, texMat(tex.speckle({ base: blight, dots: [thorn], n: 70, size: 4, rep: [1, 2] }))).at(3.45, 0, 0));
  g.add(bramble(7, 1.2).at(3.8, 0, -1.2), bramble(8, 1.0).at(4.0, 0, 1.4));
  const r = rng(11); for (let i = 0; i < 26; i++) g.add(K.flower([P.pink, P.butter, P.white, P.coral][i % 4], 0.22).at(-3.5 + r() * 5.5, 0, -2.4 + r() * 4.8));
  [[1.9, -1.9], [1.9, 0.2], [1.9, 2.2]].forEach(([x, z]) => g.add(hearthLantern(1.2).at(x, 0, z)));
  for (let i = 0; i < 3; i++) g.add(box(1.6, 0.04, 0.2, P.soilDk).at(-1.2, 0, -1.6 + i * 0.35));
  g.add(wagon().children[1].sc(0.8).at(-2.6, 0, 1.2));
  g.add(K.person({ hairStyle: 'short', hair: P.hairBrown, top: P.mustard, bottom: P.soil, pose: 'carry', held: log(0.6) }).sc(0.65).at(0.6, 0, 0.6).rot(0, deg(-40), 0));
  g.add(K.person({ body: 'kid', hairStyle: 'pigtails', hair: P.hairBlonde, top: P.pink, bottom: P.blue, pose: 'wave' }).sc(0.65).at(-0.6, 0, 1.5));
  g.add(K.person({ hairStyle: 'ponytail', hair: P.hairBlack, skin: P.skin3, top: P.teal, bottom: P.navy, pose: 'hold', held: box(0.05, 0.7, 0.05, P.woodDk) }).sc(0.65).at(-1.2, 0, -0.7));
  g.add(K.tree({ h: 1.8, seed: 3 }).at(-4.0, 0, -2.0), K.tree({ h: 1.5, leaf: P.leafLt, seed: 5 }).at(-3.9, 0, 2.1));
  return g;
}

export default {
  slug: 'hearthmarch',
  title: 'Hearthmarch',
  logline: 'Grow a village, train its guard and push a creeping thorn forest back, one lantern at a time.',
  genre: ['Real-time strategy', 'Single player', 'Push back the dark'],
  theme: { accent: '#cf5b3d', cardBg: '#efe4d0' },
  pitch: 'A real-time strategy game for one player. Workers chop, carry and build. Every hearth-lantern you light pushes the safe border outwards and turns blight back into meadow. At night the Thornwild pushes back. No elves or orcs: villagers, a few knights, and a forest that wants its land.',
  loop: ['Gather wood, stone and grain', 'Build homes, a hall and a tower', 'Light a lantern to claim new land', 'Hold the line when night falls', 'Clear the blight, grow the village'],
  why: ['Chunky units read well from above, and ink keeps them apart in a crowd.', 'The lantern line is a clear visual goal: warm meadow versus purple thorn.', 'Bright team colours on shields and flags sit well in the warm palette.'],
  fromYou: 'Your "safe place that pushes back the dark" idea again, at RTS scale. Keep armies small: battles with fifty units would get busy and the scope would explode.',
  similar: [
    { name: 'Warcraft II', note: 'the classic RTS you named' },
    { name: 'Northgard', note: 'small-army RTS with seasons' },
    { name: 'Thronefall', note: 'tiny RTS, build by day, defend by night' },
    { name: 'They Are Billions', note: 'hold the walls against a horde' },
  ],
  palette: [['Meadow', P.leaf], ['Roof terracotta', P.terracotta], ['Banner mustard', P.mustard], ['Shield blue', P.blue], ['Thorn plum', thorn], ['Blight', blight]],
  key: { build: () => hearthmarch(), bg: [[0, '#f2b48c'], [0.6, '#f3d7b5'], [1, '#e9cdb3']], light: 'dusk', cam: { yaw: -28, pitch: 38, fov: 24 }, caption: 'The lantern line at dusk' },
  characters: [
    { name: 'Warden Rowan', role: 'You. Keeps the lanterns and gives the orders.', build: () => K.person({ hairStyle: 'ponytail', hair: P.hairAuburn, skin: P.skin2, top: P.terracotta, bottom: P.soil, acc: ['scarf', 'lantern'], accColor: P.mustard, pose: 'point' }) },
    { name: 'Mags', role: 'Woodcutter. Your fastest worker and loudest critic.', build: () => K.person({ body: 'round', hairStyle: 'bun', hair: P.hairGrey, top: P.mustard, bottom: P.navy, apron: P.woodLt, pose: 'carry', held: log(0.7) }) },
    { name: 'Sir Pellam', role: 'Knight. Brave, slow, always polishing the shield.', build: () => knight({ skin: P.skin1 }) },
    { name: 'Thornling', role: 'The Thornwild\'s footsoldier. Hates light.', build: () => thornling().sc(1.3) },
  ],
  builds: [
    { name: 'Village hall', tag: 'Building', note: 'Where workers are trained and grain is stored.', build: hall },
    { name: 'Watchtower', tag: 'Structure', note: 'Archers see the thorn coming at night.', build: () => grp(meadow(2.0, 2.0), watchtower()), cam: { yaw: -24, pitch: 16 } },
    { name: 'Hearth-lantern', tag: 'Structure', note: 'Light one and the land around it is yours.', build: () => grp(meadow(2.6, 2.6), hearthLantern(1.6)), stage: { light: 'dusk' } },
    { name: 'Supply wagon', tag: 'Vehicle', note: 'Takes wood to the edge to build the next lantern.', build: wagon },
  ],
  environments: [
    { name: 'Night raid', note: 'Thornlings test the lantern line. Knights hold it.', build: nightRaid, stage: { bg: [[0, '#3c3a5a'], [1, '#7a6a86']], light: 'night', extraLights: [] }, cam: { yaw: -28, pitch: 34 } },
    { name: 'Reclaimed meadow', note: 'The morning after: blight turning back into fields.', build: reclaimed, cam: { yaw: -30, pitch: 36 } },
  ],
};
