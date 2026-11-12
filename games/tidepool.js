// Tidepool Hall — seaside aquarium builder. Key art and tanks from worlds.js.
import * as K from '../kit.js';
import { tidepool, tank, jelly } from '../worlds.js';
const { P, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, tex, texMat, deg, rng } = K;

const tileFloor = (w, d) => K.ground(w, d, { map: tex.tiles({ base: P.cream, line: P.stone, n: 6, rep: [w / 2, d / 2] }), side: P.stoneDk, h: 0.22 });
const starfish = (c = P.orange) => extrude([[0, 0.12], [0.04, 0.04], [0.12, 0.04], [0.06, -0.02], [0.08, -0.1], [0, -0.05], [-0.08, -0.1], [-0.06, -0.02], [-0.12, 0.04], [-0.04, 0.04]], 0.03, c).rot(deg(-90), 0, 0);
function seal(c = '#8e8a86') {
  const g = grp(sph(0.32, c, { seg: 18 }).sc(1, 0.8, 1.7).at(0, 0.26, -0.15), sph(0.24, c, { seg: 16 }).at(0, 0.62, 0.32), sph(0.12, '#b5b0aa', { seg: 12 }).sc(1.1, 0.8, 0.9).at(0, 0.56, 0.5));
  [-1, 1].forEach((s) => { g.add(sph(0.035, P.ink, { seg: 8 }).at(s * 0.09, 0.7, 0.52).noInk(), sph(0.1, c, { seg: 10 }).sc(0.5, 0.25, 1).rot(0, s * 0.4, s * 0.6).at(s * 0.26, 0.15, 0.15)); });
  g.add(sph(0.03, P.ink, { seg: 8 }).at(0, 0.6, 0.6).noInk(), extrude([[0, 0], [0.16, 0.1], [-0.16, 0.1]], 0.04, c).rot(deg(-90), 0, 0).at(0, 0.04, -0.62));
  return g;
}
function jellyColumn() {
  const jt = grp(cyl(0.65, 0.7, 0.5, P.woodDk), cyl(0.55, 0.55, 1.6, K.glow('#ffffff', { map: tex.gradient([[0, '#6a6fb0'], [1, '#2a3166']]) }), { seg: 24 }).at(0, 0.5, 0), cyl(0.62, 0.62, 0.12, P.iron).at(0, 2.1, 0));
  jt.add(jelly(P.pink).at(-0.15, 1.6, 0.42).noInk(), jelly(P.lilac).sc(0.8).at(0.2, 1.1, 0.45).noInk(), jelly(P.coral).sc(0.6).at(-0.05, 0.85, 0.5).noInk());
  return jt;
}
function touchPool() {
  const pool = grp(cyl(0.95, 1.0, 0.5, P.stone, { seg: 28 }), cyl(0.82, 0.82, 0.02, texMat(tex.waves({ base: '#6fbac8', line: '#bfe9ef' })), { seg: 28 }).at(0, 0.5, 0));
  pool.add(K.rock(0.18, P.stoneDk, 3).at(0.3, 0.46, -0.2), K.rock(0.14, P.stone, 6).at(-0.35, 0.46, -0.3), starfish().at(-0.2, 0.54, 0.2), starfish(P.coral).sc(0.8).at(0.25, 0.54, 0.35));
  pool.add(K.sign('TWO FINGERS', { w: 1.0, h: 0.24, bg: P.cream, fg: P.seaDk, frame: P.woodDk }).at(0, 0.5, 0.98).rot(deg(-20), 0, 0));
  return pool;
}
function rescueVan() {
  const v = K.vehicle({ kind: 'van', body: P.seaDk, trim: P.white });
  v.add(K.sign('SEA RESCUE', { w: 1.1, h: 0.22, bg: P.white, fg: P.seaDk, frame: P.white }).at(-0.2, 0.62, 0.51));
  v.add(box(0.3, 0.1, 0.2, P.red).at(-0.1, 1.06, 0), sph(0.08, K.glow('#ff8a7a'), { seg: 8 }).at(-0.1, 1.18, 0));
  return v;
}
function building() {
  const g = grp(box(3.6, 0.3, 2.4, P.wood).at(0, -0.3, 0));
  const t = tank(2.2, 1.1, 0.9, { weed: 2, fish: [] }); g.add(t.at(-0.4, 0, -0.3));
  g.add(grp(cyl(0.2, 0.17, 0.32, P.steel, { seg: 14 }), cyl(0.18, 0.18, 0.02, P.sand, { seg: 14 }).at(0, 0.3, 0), torus(0.12, 0.012, P.iron, { arc: Math.PI, ts: 12 }).at(0, 0.32, 0)).at(1.2, 0, 0.6));
  [0, 1, 2].forEach((i) => g.add(K.rock(0.14 + i * 0.03, [P.stone, P.stoneDk, P.clay][i], i + 4).at(0.9 + i * 0.3, 0, -0.5)));
  [P.leaf, P.teal, P.coral].forEach((c, i) => g.add(cone(0.06, 0.4, c, { seg: 6 }).rot(0, 0, deg(80)).at(-1.4 + i * 0.12, 0.04, 0.75)));
  const bag = (c, s) => grp(rbox(0.3, 0.36, 0.06, K.mat('#d6eef2', { opacity: 0.7 }), { r: 0.05 }), K.fish({ color: c, fin: P.mustard }).sc(s).at(0, 0.16, 0)).noInk();
  g.add(bag(P.coral, 0.4).at(0.6, 0, 0.75), bag(P.blue, 0.35).at(0.95, 0, 0.85));
  g.add(K.sign('2 CLOWNFISH', { w: 1.2, h: 0.28, bg: P.cream, fg: P.seaDk, frame: P.woodLt }).rot(deg(-80), 0, 0).at(-1.0, 0.03, 0.85));
  return g;
}
function beach() {
  const g = grp();
  g.add(K.ground(9.5, 5.6, { top: P.sand, side: P.sandDk, h: 0.35 }));
  g.add(box(9.5, 0.03, 2.0, texMat(tex.waves({ base: P.sea, line: '#bfe9ef', rep: [3, 1] }))).at(0, 0, -1.8), box(9.5, 0.035, 0.25, P.white).at(0, 0, -0.7).noInk());
  g.add(rescueVan().rot(0, deg(-160), 0).at(-2.8, 0, 1.4));
  g.add(seal().sc(1.1).rot(0, deg(30), 0).at(0.6, 0, 0.3));
  g.add(K.person({ hairStyle: 'ponytail', hair: P.hairBrown, skin: P.skin2, top: P.seaDk, bottom: P.navy, pose: 'point' }).sc(0.85).at(-0.6, 0, 0.6).rot(0, deg(60), 0));
  g.add(K.person({ body: 'elder', hairStyle: 'short', hair: P.hairGrey, top: P.white, bottom: P.navy, acc: ['glasses'], pose: 'hold', held: rbox(0.5, 0.06, 0.3, P.red, { r: 0.02 }) }).sc(0.85).at(1.8, 0, 1.0).rot(0, deg(-40), 0));
  [[3.2, 1.6], [-4.0, -0.2], [3.9, -0.2]].forEach(([x, z], i) => g.add(K.rock(0.4 + i * 0.1, P.stoneDk, i + 3).at(x, 0, z)));
  g.add(starfish().at(2.6, 0.02, 2.0), K.bird({}).at(-1.6, 0, -0.2), K.umbrella([P.seaDk, P.white], 0.8, 1.6).at(3.4, 0, 0.5));
  return g;
}

export default {
  slug: 'tidepool',
  title: 'Tidepool Hall',
  logline: 'Turn a run-down seaside aquarium into the best day out on the coast.',
  genre: ['Aquarium builder', 'Animal care', 'Seaside'],
  theme: { accent: '#2f7d93', cardBg: '#e6eeec' },
  pitch: 'The town aquarium is down to three tanks and one tired seal. Build tanks piece by piece: sand, rock, weed, then the right fish. Keep the water clean and visitors press their noses to the glass. Rescued animals arrive from the beach, get well, and some go home.',
  loop: ['Build a tank layer by layer', 'Add the fish that suit it', 'Keep the water right, feed on time', 'Visitors bring money and wishes', 'Answer rescue calls from the beach'],
  why: ['Tanks read as glowing boxes of colour against warm walls.', 'Glass stays clear and only the frames get ink, so fish stay readable.', 'Same seaside town as the kite shop, so places and people can cross over.'],
  fromYou: 'Builds on your aquarium idea and on Fathom Nook\'s underwater look, but the player stays dry. The tank build is your step-by-step workbench again.',
  similar: [
    { name: 'Megaquarium', note: 'the aquarium management game' },
    { name: 'Planet Zoo', note: 'animal care, much bigger' },
    { name: 'Two Point Campus', note: 'build-a-place with jokes' },
    { name: 'Tiny Bookshop', note: 'seaside cosy tone' },
  ],
  palette: [['Tank glow', '#a8e0e6'], ['Deep teal', P.seaDk], ['Coral', P.coral], ['Kelp', P.leaf], ['Hall cream', P.cream], ['Jelly pink', P.pink]],
  key: { build: () => tidepool(), bg: [[0, '#d9eef0'], [1, '#f3ead6']], cam: { yaw: -22, pitch: 30, fov: 24 }, caption: 'Saturday morning, doors open' },
  characters: [
    { name: 'Ivy Dunmore', role: 'You. New head keeper, always in waders.', build: () => K.person({ hairStyle: 'bob', hair: P.hairBlonde, skin: P.skin1, top: P.seaDk, bottom: P.iron, hat: 'beanie', hatColor: P.mustard, pose: 'hold', held: grp(cyl(0.16, 0.13, 0.26, P.steel, { seg: 14 }), K.fish({ color: P.stone, fin: P.stoneDk }).sc(0.35).rot(0, 0, deg(70)).at(0, 0.3, 0)) }) },
    { name: 'Dr Sol', role: 'The vet. Talks to the seal like an old friend.', build: () => K.person({ body: 'elder', hairStyle: 'short', hair: P.hairGrey, skin: P.skin4, top: P.white, bottom: P.navy, acc: ['glasses', 'moustache'], pose: 'hips' }) },
    { name: 'Ruby', role: 'Seven. Visits every Saturday, knows every fish\'s name.', build: () => K.person({ body: 'kid', hairStyle: 'pigtails', hair: P.hairBlack, skin: P.skin3, top: P.mustard, bottom: P.blue, acc: ['backpack'], accColor: P.coral, pose: 'point' }) },
    { name: 'Bob', role: 'Rescued seal. Refuses to leave.', build: () => seal().sc(1.4) },
  ],
  builds: [
    { name: 'Reef tank', tag: 'Structure', note: 'Sand, rock, weed, fish. Built layer by layer.', build: () => grp(tileFloor(4.2, 1.8), tank(3.4, 1.4, 1.0, { fish: [[-1.0, 0.8, P.coral, P.mustard], [0.3, 1.0, P.mustard, P.coral, 0.5], [1.0, 0.55, P.sea, P.white, 0.7]] }).at(0, 0, -0.2)), cam: { yaw: -20, pitch: 16 } },
    { name: 'Jelly column', tag: 'Structure', note: 'Dark, slow and the most photographed thing in town.', build: () => grp(tileFloor(2.0, 2.0), jellyColumn()), cam: { yaw: -20, pitch: 14 } },
    { name: 'Touch pool', tag: 'Structure', note: 'Starfish and crabs, gentle hands only.', build: () => grp(tileFloor(2.6, 2.6), touchPool()), cam: { yaw: -20, pitch: 34 } },
    { name: 'Rescue van', tag: 'Vehicle', note: 'Goes out when the beach calls.', build: () => grp(K.ground(3.0, 1.8, { top: P.sand, side: P.sandDk, h: 0.25 }), rescueVan().rot(0, deg(-15), 0)) },
  ],
  environments: [
    { name: 'Building a tank', note: 'The hands-on bit: pour the sand, set the rocks, bag in the fish.', build: building, stage: { bg: P.cream }, cam: { yaw: -8, pitch: 40, fov: 28 } },
    { name: 'Rescue on the beach', note: 'A seal pup in trouble. Load it gently, drive it back.', build: beach, stage: { bg: [[0, '#bfe4ec'], [1, '#f3ead6']] }, cam: { yaw: -28, pitch: 30 } },
  ],
};
