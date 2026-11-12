// Tuppenny Pier — run a seaside penny arcade. No real-money gambling: the player runs the place.
import * as K from '../kit.js';
import { tuppenny, fruitMachine, coinPusher, clawMachine, reel } from '../worlds.js';
const { P, grp, box, rbox, cyl, cone, sph, torus, tube, extrude, tex, texMat, deg, rng } = K;

const C = { plum: '#4a3550', carpet: '#7a2e3a', carpetDk: '#5a2230', bulb: '#ffe7a0', neon: '#ff9f8a' };
const floor = (w, d) => K.ground(w, d, { map: tex.checker({ a: C.carpet, b: C.carpetDk, n: 8, rep: [w / 2, d / 2] }), side: P.woodDk, h: 0.2 });

function booth() {
  return grp(box(1.1, 1.0, 0.8, P.woodLt), box(1.1, 0.06, 0.82, P.mustard).at(0, 1.0, 0), box(0.06, 0.8, 0.06, P.mustard).at(-0.52, 1.0, 0.38), box(0.06, 0.8, 0.06, P.mustard).at(0.52, 1.0, 0.38), box(1.2, 0.3, 0.9, P.red).at(0, 1.8, 0),
    K.sign('CHANGE', { w: 0.9, h: 0.22, bg: P.cream, fg: P.red, frame: P.red }).at(0, 1.84, 0.46),
    ...[0, 1, 2, 3].map((i) => cyl(0.06, 0.06, 0.1 + i * 0.03, P.mustard, { seg: 10 }).at(-0.35 + i * 0.12, 1.06, 0.2)));
}
function bench() {
  const g = grp(box(4.0, 0.3, 2.4, P.wood).at(0, -0.3, 0));
  // an open fruit machine lying on its back
  const open = grp(rbox(0.9, 0.5, 1.6, P.red, { r: 0.05 }), box(0.8, 0.04, 1.5, P.ink2).at(0, 0.48, 0));
  [-0.25, 0, 0.25].forEach((x, i) => open.add(cyl(0.16, 0.16, 0.18, texMat(tex.custom(128, 256, (c, w, h) => { const cols = ['#e2482f', '#f1b42f', '#3fa564', '#3a7bd5']; for (let k = 0; k < 4; k++) { c.fillStyle = '#fbf7ee'; c.fillRect(0, k * 64, w, 64); c.fillStyle = cols[(k + i) % 4]; c.beginPath(); c.arc(64, k * 64 + 32, 22, 0, 7); c.fill(); } })), { seg: 16 }).rot(0, 0, deg(90)).at(x + 0.09, 0.62, -0.25)));
  open.add(cyl(0.02, 0.02, 0.7, P.steel, { seg: 6 }).rot(0, 0, deg(90)).at(0.35, 0.62, -0.25));
  open.add(box(0.5, 0.06, 0.4, '#3a8a5a').at(0, 0.5, 0.35), ...[0, 1, 2].map((i) => box(0.06, 0.04, 0.08, P.mustard).at(-0.15 + i * 0.15, 0.56, 0.35)));
  g.add(open.rot(0, deg(10), 0).at(-0.4, 0, 0));
  // tools and parts
  g.add(grp(box(0.06, 0.04, 0.45, P.red).at(0, 0, -0.1), box(0.03, 0.03, 0.3, P.steel).at(0, 0.01, 0.25)).rot(0, deg(40), 0).at(0.8, 0, 0.7));
  g.add(grp(cyl(0.18, 0.2, 0.25, P.white, { seg: 16 }), ...Array.from({ length: 8 }, (_, i) => cyl(0.06, 0.06, 0.02, P.mustard, { seg: 10 }).at(-0.08 + (i % 3) * 0.08, 0.25 + Math.floor(i / 3) * 0.02, -0.05 + (i % 2) * 0.08))).at(1.3, 0, -0.5));
  for (let i = 0; i < 4; i++) g.add(sph(0.05, i % 2 ? P.butter : C.neon, { seg: 8 }).at(0.9 + i * 0.13, 0.05, 0.2));
  g.add(K.sign('1 IN 12', { w: 0.9, h: 0.3, bg: P.cream, fg: P.ink, frame: P.woodLt }).rot(deg(-80), 0, 0).at(1.25, 0.03, 0.35));
  g.add(K.lantern(P.iron, P.butter).sc(1.3).at(-1.6, 0, -0.8));
  return g;
}
function pierNight() {
  const g = grp();
  g.add(K.ground(10, 5.8, { map: tex.waves({ base: '#2f5f78', line: '#7fb0c4', rep: [3, 2] }), side: '#22465a', h: 0.6 }).at(0, -0.55, 0));
  g.add(box(8.6, 0.14, 2.6, texMat(tex.planks({ base: '#b07a4a', line: P.woodDk, n: 12, vertical: true }))).at(-0.4, 0, -0.9));
  for (let i = 0; i < 6; i++) for (const z of [-2.0, 0.2]) g.add(cyl(0.1, 0.11, 0.6, P.woodDk, { seg: 8 }).at(-4.3 + i * 1.7, -0.58, z));
  const hall = K.house({ w: 4.0, d: 1.7, h: 1.5, wall: P.cream, roof: P.red, roofType: 'dome', door: P.mustard, windows: 2, glass: C.bulb, sign: 'TUPPENNY PIER', signBg: C.bulb, signFg: P.red, awning: [P.red, P.cream], base: P.woodDk });
  for (let i = 0; i < 12; i++) hall.add(sph(0.05, K.glow(i % 2 ? C.bulb : C.neon), { seg: 8 }).at(-1.9 + i * 0.345, 1.75, 0.87).noInk());
  g.add(hall.sc(0.95).at(-1.1, 0.14, -1.25));
  g.add(K.bunting([[1.2, 1.9, -1.6], [2.4, 1.5, -1.2], [3.6, 1.9, -0.8]], [P.red, P.mustard, P.cream]));
  [1.2, 3.6].forEach((x, i) => g.add(K.lamppost(1.8, P.iron, C.bulb).at(x, 0.14, -1.6 + i * 0.8)));
  g.add(K.bench(1.1, P.wood).at(2.4, 0.14, -1.9));
  g.add(K.person({ hairStyle: 'long', hair: P.hairBlonde, top: P.teal, bottom: P.navy, pose: 'hold', held: cone(0.08, 0.22, P.butter, { seg: 8 }).rot(deg(180), 0, 0) }).sc(0.7).at(2.0, 0.14, -0.6));
  g.add(K.person({ body: 'kid', hairStyle: 'spiky', hair: P.hairAuburn, top: P.mustard, bottom: P.blue, pose: 'wave' }).sc(0.7).at(2.7, 0.14, -0.4));
  g.add(K.bird({}).at(3.9, 0.14, -2.0));
  return g;
}

export default {
  slug: 'tuppenny',
  title: 'Tuppenny Pier',
  logline: 'Run the old penny arcade at the end of the pier and fill it with machines you build.',
  genre: ['Arcade management', 'Tactile building', 'Seaside'],
  theme: { accent: '#e2482f', cardBg: '#f2e1d2' },
  pitch: 'Your gran\'s old arcade is yours now, and half the machines are broken. Open them up on the bench, fix the reels, tune the payouts and roll them back onto the floor. Regulars have favourite machines and opinions. Everything plays for 2p coins and prizes, never real money.',
  loop: ['Open a broken machine on the bench', 'Fix it, theme it, set its payout', 'Place it on the arcade floor', 'Watch the regulars and the till', 'Unlock new machine types'],
  why: ['Glowing cabinets, bulbs and coins at dusk look brilliant in toon.', 'One room is a tiny scope: few assets, all close to camera.', 'The repair bench is the kite workbench again, but with reels.'],
  fromYou: 'Same seaside town as the kite shop, and the same hands-on bench. You asked for casino and slots; this keeps the machines and leaves out real gambling.',
  similar: [
    { name: 'Coin pusher and claw games', note: 'the machines themselves, done as toys' },
    { name: 'Two Point Hospital', note: 'run a place full of odd machines' },
    { name: 'PowerWash Simulator', note: 'fixing things up, very satisfying' },
    { name: 'Tiny Bookshop', note: 'cosy seaside shop with regulars' },
  ],
  palette: [['Seaside red', P.red], ['Brass', P.mustard], ['Bulb glow', C.bulb], ['Carpet', C.carpet], ['Night plum', C.plum], ['Claw pink', P.pink]],
  key: { build: () => tuppenny(), bg: [[0, '#f6b98a'], [1, '#e9cdb3']], light: 'dusk', cam: { yaw: -20, pitch: 28, fov: 24 }, caption: 'Last tuppence of the evening' },
  characters: [
    { name: 'Mo Bright', role: 'You. Took over the arcade from your gran.', build: () => K.person({ hairStyle: 'curly', hair: P.hairBlack, skin: P.skin4, top: P.red, bottom: P.navy, apron: P.mustard, pose: 'hold', held: grp(cyl(0.1, 0.08, 0.16, P.white, { seg: 12 }), cyl(0.07, 0.07, 0.03, P.mustard, { seg: 10 }).at(0, 0.15, 0)) }) },
    { name: 'Nana Pip', role: 'Regular since 1971. Only plays the red machine.', build: () => K.person({ body: 'elder', hairStyle: 'curly', hair: P.hairGrey, top: P.lilac, bottom: P.navy, acc: ['glasses', 'scarf'], accColor: P.red, pose: 'hips' }) },
    { name: 'Kit', role: 'Claw machine champion. Banned from two arcades.', build: () => K.person({ body: 'kid', hairStyle: 'spiky', hair: P.hairAuburn, top: P.mustard, bottom: P.blue, hat: 'cap', hatColor: P.teal, pose: 'hold', held: sph(0.16, P.sky, { seg: 12 }) }) },
    { name: 'Sarge', role: 'Pier gull. Takes chips, not coins.', build: () => grp(K.bird({ wing: P.slate })).sc(2.4) },
  ],
  builds: [
    { name: 'Fruit machine', tag: 'Prop', note: 'Three reels, one lever. You set the odds.', build: () => grp(floor(1.6, 1.4), fruitMachine().at(0, 0, -0.1)), stage: { light: 'dusk' } },
    { name: 'Coin pusher', tag: 'Prop', note: 'The arcade\'s heartbeat. Always nearly falling.', build: () => grp(floor(2.2, 1.6), coinPusher().at(0, 0, -0.1)), stage: { light: 'dusk' } },
    { name: 'Claw grabber', tag: 'Prop', note: 'Plush prizes you stock yourself.', build: () => grp(floor(1.6, 1.4), clawMachine().at(0, 0, -0.1)), stage: { light: 'dusk' } },
    { name: 'Change booth', tag: 'Building', note: 'Where you sit when nothing is broken.', build: () => grp(floor(2.0, 1.6), booth().at(0, 0, -0.2)), stage: { light: 'dusk' } },
  ],
  environments: [
    { name: 'The pier at night', note: 'Bulbs on, sea dark, last customers heading in.', build: pierNight, stage: { bg: [[0, '#3f3b5e'], [1, '#8a6f86']], light: 'dusk' }, cam: { yaw: -26, pitch: 26 } },
    { name: 'The repair bench', note: 'Open a machine, swap a reel, set the payout.', build: bench, stage: { bg: P.cream }, cam: { yaw: -6, pitch: 52, fov: 28 } },
  ],
};
