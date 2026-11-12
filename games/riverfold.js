// Riverfold — survival city builder. Reuses the pieces from worlds.js (key art) and adds the board assets.
import * as K from '../kit.js';
import { riverfold, cottage, granary, wheat, log, sack, straw, strawDk, autumn } from '../worlds.js';
const { P, grp, box, cyl, cone, sph, torus, tex, texMat, deg } = K;

const C = { straw, strawDk, rust: '#d9772f', ember: '#c9562f', olive: P.olive, river: P.sea, linen: P.linen };

function waterMill() {
  const g = K.house({ w: 1.6, d: 1.3, h: 1.1, wall: P.stone, roof: straw, roofH: 0.8, door: P.woodDk, windows: 1, base: P.stoneDk, wallMap: tex.bricks({ base: P.stone, mortar: P.stoneDk, rows: 8, cols: 4, rep: [2, 2] }) });
  const wheel = grp(torus(0.75, 0.06, P.woodDk, { ts: 32 }), torus(0.3, 0.05, P.woodDk, { ts: 20 }));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; wheel.add(box(0.06, 0.3, 0.32, P.wood).at(Math.cos(a) * 0.82, Math.sin(a) * 0.82 - 0.15, 0).rot(0, 0, a)); }
  for (let i = 0; i < 4; i++) wheel.add(box(0.05, 1.4, 0.05, P.woodDk).rot(0, 0, i * deg(45)).at(0, 0, 0));
  g.add(grp(wheel.rot(0, deg(90), 0)).at(1.05, 0.85, 0.1));
  g.add(cyl(0.06, 0.06, 0.3, P.iron).rot(0, 0, deg(90)).at(0.8, 0.85, 0.1));
  g.add(sack().at(-0.45, 0, 0.95), sack(P.cream).sc(0.85).at(-0.15, 0, 1.05));
  return g;
}
function mill() {
  const g = grp(K.ground(3.6, 2.2, { top: P.olive, side: P.soil, h: 0.3 }));
  g.add(box(1.0, 0.07, 2.21, P.soilDk).at(1.3, -0.02, 0), K.water(0.9, 2.2, { color: C.river }).at(1.3, 0.06, 0));
  g.add(waterMill().sc(0.85).at(-0.3, 0, -0.1));
  return g;
}
function hayCart() {
  const g = K.vehicle({ kind: 'cart', body: P.woodLt });
  g.add(K.rbox(1.1, 0.5, 0.75, straw, { r: 0.15 }).at(0, 0.68, 0), K.rbox(0.8, 0.3, 0.6, strawDk, { r: 0.12 }).at(-0.05, 1.12, 0));
  g.add(K.tube([[-0.5, 1.2, 0.3], [0, 1.25, 0.32], [0.5, 1.15, 0.3]], 0.015, P.woodDk).noInk());
  return grp(K.ground(2.6, 1.7, { top: P.olive, side: P.soil, h: 0.25 }), g.rot(0, deg(-20), 0));
}
function granaryCard() { return grp(K.ground(2.6, 2.0, { top: P.olive, side: P.soil, h: 0.25 }), granary()); }
function cottageCard() {
  const g = grp(K.ground(2.8, 2.2, { top: P.olive, side: P.soil, h: 0.25 }), cottage().at(0, 0, -0.3));
  const pile = grp(); for (let i = 0; i < 2; i++) for (let j = 0; j < 3 - i; j++) pile.add(log(0.6).at(-0.3, 0.09 + i * 0.16, (j - (2 - i) / 2) * 0.19));
  g.add(pile.at(1.0, 0, 0.5), K.pottedPlant(P.terracotta, P.leaf, 0.8).at(-0.6, 0, 0.55), K.fence(2.4, P.woodLt, { h: 0.3 }).at(0, 0, 0.95));
  return g;
}
function winter() {
  const g = grp();
  g.add(K.ground(9, 5.4, { map: tex.speckle({ base: P.snow, dots: ['#e3e8ea'], n: 90, size: 5, rep: [3, 2] }), side: P.soil, h: 0.45 }));
  g.add(box(1.3, 0.05, 5.42, '#cfe2e6').at(2.6, -0.01, 0).rot(0, deg(12), 0));
  const snowRoof = (h) => { h.traverse((o) => { if (o.isMesh && o.material?.color?.getHexString?.() === straw.slice(1)) o.material = K.mat(P.snow); }); return h; };
  g.add(snowRoof(cottage()).at(-2.8, 0, -1.6), snowRoof(cottage(P.wall, P.red)).at(-1.0, 0, -1.8), snowRoof(granary()).at(0.9, 0, -1.4));
  [[-2.8, -1.6], [-1.0, -1.8]].forEach(([x, z]) => g.add(sph(0.12, K.glow(P.butter), { seg: 8 }).sc(1, 0.6, 0.3).at(x - 0.38, 0.42, z + 0.52).noInk()));
  const pile = grp(); for (let i = 0; i < 2; i++) for (let j = 0; j < 2 - i; j++) pile.add(log(0.7).at(-0.35, 0.09 + i * 0.16, (j - (1 - i) / 2) * 0.19));
  g.add(pile.at(-0.6, 0, 0.3));
  [[-4.0, -2.0], [4.0, 1.2], [3.6, -2.0], [-3.9, 1.9]].forEach(([x, z], i) => g.add(K.tree({ kind: 'pine', h: 1.6 + (i % 2) * 0.4, leaf: P.pine }).at(x, 0, z)));
  g.add(cyl(0.18, 0.2, 0.08, P.stoneDk).at(-1.9, 0, 0.9), cone(0.16, 0.35, K.glow(P.orange), { seg: 8 }).at(-1.9, 0.08, 0.9).noInk());
  g.add(K.person({ hairStyle: 'bob', hair: P.hairAuburn, top: C.ember, bottom: P.soil, acc: ['scarf'], accColor: P.mustard, pose: 'carry', held: log(0.6) }).sc(0.6).at(-1.4, 0, 0.6).rot(0, deg(20), 0));
  g.add(K.person({ body: 'elder', hairStyle: 'bald', skin: P.skin2, top: P.teal, bottom: P.navy, hat: 'beanie', hatColor: P.red, acc: ['beard'], pose: 'stand' }).sc(0.6).at(-2.3, 0, 1.2));
  g.add(K.person({ body: 'kid', hairStyle: 'curly', hair: P.hairBrown, skin: P.skin2, top: P.mustard, bottom: P.blue, hat: 'beanie', hatColor: P.teal, pose: 'wave' }).sc(0.6).at(0.4, 0, 1.0));
  return g;
}

export default {
  slug: 'riverfold',
  title: 'Riverfold',
  logline: 'A few families, one river valley, and a store that has to last until spring.',
  genre: ['Survival city builder', 'Seasons', 'No combat'],
  theme: { accent: '#c9562f', cardBg: '#f4e4c4' },
  pitch: 'You guide a handful of families who settle a river valley. You never move a person, only give out jobs and place buildings. Villagers have names, age, marry and remember the hard winter. Plant, harvest, store and burn wood to get through to spring.',
  loop: ['Place a field, a cottage or a store', 'Give out jobs as the season turns', 'Harvest and fill the granary', 'Get through winter, welcome new families'],
  why: ['Thatch, fields and little people on a slab are the style at its best.', 'Seasons change the whole palette, so one valley gives four looks.', 'Your Egyptian town already uses this camera and toon look.'],
  fromYou: 'Your Egyptian city builder is already a town in this exact look. Riverfold could reuse its camera, shaders and building code.',
  similar: [
    { name: 'Banished', url: 'https://store.steampowered.com/app/242920', note: 'the classic survival city builder you named' },
    { name: 'Farthest Frontier', note: 'bigger, harder, with raiders' },
    { name: 'Timberborn', note: 'seasons and water, with beavers' },
    { name: 'Settlement Survival', note: 'cosier look, same loop' },
  ],
  palette: [['Thatch', straw], ['Autumn rust', C.rust], ['Ember', C.ember], ['Meadow olive', P.olive], ['River', C.river], ['Linen', C.linen]],
  key: { build: () => riverfold(), bg: [[0, '#f4d9a8'], [1, '#f3ead6']], cam: { yaw: -30, pitch: 36, fov: 24 }, caption: 'Week 30: the store needs to last till spring' },
  characters: [
    { name: 'Edda Marr', role: 'You, more or less. The reeve who hands out the jobs.', build: () => K.person({ hairStyle: 'bun', hair: P.hairAuburn, skin: P.skin1, top: C.ember, bottom: P.soil, apron: P.cream, acc: ['satchel'], pose: 'hold', held: K.rbox(0.3, 0.38, 0.04, P.cream, { r: 0.02 }) }) },
    { name: 'Old Tam', role: 'Runs the mill. Knows when the frost will come.', build: () => K.person({ body: 'elder', hairStyle: 'bald', skin: P.skin2, top: P.teal, bottom: P.navy, hat: 'flatcap', acc: ['beard'], pose: 'hips' }) },
    { name: 'Wren', role: 'Nine. Gathers berries and every rumour in the valley.', build: () => K.person({ body: 'kid', hairStyle: 'curly', hair: P.hairBrown, skin: P.skin3, top: P.mustard, bottom: P.blue, acc: ['backpack'], accColor: C.rust, pose: 'wave' }) },
    { name: 'Nettle', role: 'The valley goat. Eats the fences.', build: () => grp(K.dog({ color: P.white, ear: P.stone }), cone(0.035, 0.18, P.stoneDk, { seg: 6 }).rot(deg(-25), 0, deg(-15)).at(0.07, 0.64, 0.3), cone(0.035, 0.18, P.stoneDk, { seg: 6 }).rot(deg(-25), 0, deg(15)).at(-0.07, 0.64, 0.3), cone(0.04, 0.12, P.white, { seg: 6 }).rot(deg(180), 0, 0).at(0, 0.38, 0.6)).sc(1.6) },
  ],
  builds: [
    { name: 'Thatched cottage', tag: 'Building', note: 'Home for one family. Needs firewood every week.', build: cottageCard },
    { name: 'Granary', tag: 'Building', note: 'On stone feet to keep the rats out.', build: granaryCard },
    { name: 'Water mill', tag: 'Structure', note: 'Turns grain into flour. Stops when the river freezes.', build: mill, cam: { yaw: 38, pitch: 22 } },
    { name: 'Hay cart', tag: 'Vehicle', note: 'Brings the harvest in before the rain.', build: hayCart },
  ],
  environments: [
    { name: 'Deep winter', note: 'Fields gone, river iced. Only the woodpile matters.', build: winter, stage: { bg: [[0, '#dfe8ec'], [1, '#f1ede6']], light: 'overcast' }, cam: { yaw: -30, pitch: 34 } },
    { name: 'Harvest week', note: 'Everyone in the fields, the cart going back and forth.', build: () => riverfold(), cam: { yaw: 20, pitch: 40 } },
  ],
};
