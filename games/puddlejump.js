// Puddle Jump Air — island-hopping airline. Key art and planes from worlds.js.
import * as K from '../kit.js';
import { puddlejump, propPlane, suitcase, stripedPole } from '../worlds.js';
const { P, grp, box, rbox, cyl, cone, sph, torus, tube, extrude, tex, texMat, deg, rng } = K;

const grass = (w, d) => grp(K.ground(w, d, { top: P.sand, side: P.sandDk, h: 0.25 }), box(w - 0.3, 0.03, d - 0.3, texMat(tex.speckle({ base: P.leafLt, dots: [P.leaf], n: 60, size: 4 }))));
const sea = (w, d) => K.ground(w, d, { map: tex.waves({ base: P.sea, line: '#9ad6de', rep: [Math.max(1, w / 3), Math.max(1, d / 3)] }), side: P.seaDk, h: 0.4 });
function windsock() { return grp(stripedPole(1.5, P.white, P.ink2), cone(0.14, 0.7, texMat(tex.stripes({ colors: [P.orange, P.white], n: 5 })), { seg: 10 }).rot(0, 0, deg(-100)).at(0.05, 1.4, 0)); }
function terminal() {
  const g = K.house({ w: 1.9, d: 1.2, h: 1.0, wall: P.white, roof: P.teal, roofType: 'hip', roofH: 0.45, door: P.mustard, windows: 1, sign: 'ARRIVALS', awning: [P.teal, P.white], base: P.stoneDk });
  g.add(windsock().at(1.3, 0, 0.1), K.bench(0.9, P.wood).at(-0.6, 0, 1.0), suitcase(P.red).at(-0.6, 0.46, 1.0));
  g.add(K.sign('GULL ROCK 9:40', { w: 0.8, h: 0.5, bg: '#2f3f63', fg: P.butter, frame: P.woodDk, font: '800 46px "Bricolage Grotesque", sans-serif' }).at(1.25, 0.9, 0.62));
  return grp(grass(3.4, 2.4), g.at(-0.2, 0, -0.4), K.tree({ kind: 'palm', h: 1.5 }).at(-1.4, 0, 0.6));
}
function bowser() {
  const t = K.vehicle({ kind: 'truck', body: P.red, trim: P.white });
  t.add(cyl(0.36, 0.36, 1.35, P.white, { seg: 18 }).rot(0, 0, deg(90)).at(0.28, 1.1, 0), K.sign('FUEL', { w: 0.6, h: 0.22, bg: P.red, fg: P.white, frame: P.red }).at(-0.4, 1.0, 0.37));
  t.add(tube([[-1.1, 0.7, 0.2], [-1.3, 0.4, 0.4], [-1.0, 0.1, 0.6]], 0.03, P.ink2));
  return grp(K.ground(3.0, 1.8, { top: '#a9c97a', side: P.sandDk, h: 0.25 }), t.rot(0, deg(-20), 0));
}
function jetty() {
  const g = grp();
  g.add(K.ground(9.5, 5.6, { map: tex.waves({ base: '#4f8ea0', line: '#f6c49a', rep: [3, 2] }), side: '#2f6274', h: 0.6 }).at(0, -0.55, 0));
  g.add(grp(K.ground(4.0, 2.2, { top: P.sand, side: P.sandDk, h: 0.6 }), box(3.6, 0.03, 1.4, P.leafLt).at(0, 0, -0.3)).at(-3.0, 0.05, -1.6));
  g.add(box(0.9, 0.1, 3.8, texMat(tex.planks({ base: P.woodLt, line: P.woodDk, n: 10 }))).at(-0.8, 0.05, 0.2));
  for (let i = 0; i < 5; i++) for (const x of [-1.2, -0.4]) g.add(cyl(0.06, 0.07, 0.6, P.woodDk, { seg: 8 }).at(x, -0.5, -1.4 + i * 0.85));
  g.add(propPlane(P.white, P.red, { floats: true }).sc(0.85).rot(0, deg(-70), 0).at(0.9, -0.08, 0.6));
  [-0.55, -1.05].forEach((x, i) => g.add(K.lamppost(1.2, P.iron, P.butter).at(x, 0.1, 1.8 - i * 2.6)));
  g.add(K.person({ hat: 'captain', hatColor: P.navy, top: P.white, bottom: P.navy, hairStyle: 'bob', hair: P.hairBrown, skin: P.skin3, pose: 'wave' }).sc(0.6).at(-0.6, 0.1, 1.1).rot(0, deg(40), 0));
  g.add(K.person({ hairStyle: 'long', hair: P.hairBlonde, top: P.pink, bottom: P.sand, hat: 'straw', pose: 'hold', held: suitcase(P.blue) }).sc(0.6).at(-0.95, 0.1, -0.3));
  [[-4.3, -2.2], [-2.0, -2.4]].forEach(([x, z], i) => g.add(K.tree({ kind: 'palm', h: 1.6 + i * 0.3, seed: i + 4 }).at(x, 0.05, z)));
  g.add(K.house({ w: 1.3, d: 1.0, h: 0.8, wall: P.white, roof: P.teal, roofType: 'hip', roofH: 0.35, windows: 1, glass: P.butter, door: P.mustard }).at(-3.4, 0.05, -1.4));
  return g;
}
function hold() {
  const g = grp(K.ground(5.4, 3.4, { top: '#a9c97a', side: P.sandDk, h: 0.3 }));
  const pl = propPlane(P.mustard, P.teal); pl.add(box(0.6, 0.4, 0.04, P.ink2).at(-0.5, 0.42, 0.29));
  pl.add(grp(box(0.6, 0.4, 0.04, P.mustard)).rot(deg(-100), 0, 0).at(-0.5, 0.42, 0.31));
  g.add(pl.sc(1.2).rot(0, deg(-8), 0).at(0.2, 0, -0.6));
  const cart = grp(box(1.0, 0.08, 0.6, P.iron).at(0, 0.2, 0), ...[[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.25], [0.4, 0.25]].map(([x, z]) => K.wheel(0.09, 0.05).at(x, 0.09, z)));
  [[P.red, -0.25, 0, 0], [P.teal, 0.2, 0, 0.1], [P.coral, 0, 0.24, 0], [P.blue, 0.3, 0.24, -0.1]].forEach(([c, x, y, z]) => cart.add(suitcase(c).at(x, 0.28 + y, z)));
  g.add(cart.at(-1.2, 0, 0.7));
  g.add(K.person({ hairStyle: 'short', hair: P.hairAuburn, top: P.orange, bottom: P.navy, acc: ['headphones'], accColor: P.mustard, pose: 'carry', held: suitcase(P.mustard) }).sc(0.75).at(-0.3, 0, 0.6).rot(0, deg(-30), 0));
  g.add(K.dog({ color: P.woodLt, collar: P.red }).sc(0.9).at(1.3, 0, 0.9), K.sign('MAX 12 BAGS', { w: 0.8, h: 0.24, bg: P.cream, fg: P.ink, frame: P.woodDk }).at(-2.0, 0, 0.0));
  return g;
}

export default {
  slug: 'puddlejump',
  title: 'Puddle Jump Air',
  logline: 'One seaplane, one grass strip, and a chain of islands waiting for flights.',
  genre: ['Airline management', 'Island hopping', 'Hands-on ground crew'],
  theme: { accent: '#3e8d70', cardBg: '#e4efe8' },
  pitch: 'You start an airline with one second-hand seaplane. Open grass strips and jetties across a chain of islands, set timetables, and fly the post, the doctor and the odd goat. You load the luggage and wave planes off yourself, so it never turns into a spreadsheet.',
  loop: ['Pick routes islanders are asking for', 'Set the timetable on the board', 'Load bags and fuel by hand', 'Fly, land, keep passengers happy', 'Buy a plane, open a strip'],
  why: ['Small planes and grass strips are chunky, colourful and readable.', 'Islands give every route a landmark and a postcard view.', 'Ground crew jobs keep your hands busy instead of menus.'],
  fromYou: 'From your airline idea and your transport hours. Kept small and regional on purpose, because big jets and world maps lose the charm.',
  similar: [
    { name: 'Airline Tycoon', note: 'the classic, all offices and menus' },
    { name: 'Mini Motorways', note: 'calm, tidy route planning' },
    { name: 'Overcooked', note: 'busy hands-on loading, for the ground crew bit' },
    { name: 'A Short Hike', note: 'island charm and flying' },
  ],
  palette: [['Wing mustard', P.mustard], ['Tail teal', P.teal], ['Strip green', '#a9c97a'], ['Sand', P.sand], ['Sea', P.sea], ['Windsock orange', P.orange]],
  key: { build: () => puddlejump(), bg: [[0, '#bfe4ec'], [1, '#f3ead6']], cam: { yaw: -24, pitch: 34, fov: 24 }, caption: 'The 9:40 to Gull Rock' },
  characters: [
    { name: 'Bea Lowe', role: 'You. Pilot, owner and the only one who can fix the radio.', build: () => K.person({ hairStyle: 'bob', hair: P.hairBrown, skin: P.skin3, top: P.white, bottom: P.navy, hat: 'captain', acc: ['scarf'], accColor: P.teal, pose: 'hips' }) },
    { name: 'Hamish', role: 'Ground crew. Waves the planes in with two paddles.', build: () => K.person({ hairStyle: 'short', hair: P.hairAuburn, top: P.orange, bottom: P.navy, acc: ['headphones'], accColor: P.mustard, pose: 'wave' }) },
    { name: 'Mrs Akintola', role: 'Flies twice a week to see her sister. Brings cake.', build: () => K.person({ body: 'elder', hairStyle: 'bun', hair: P.hairWhite, skin: P.skin4, top: P.coral, bottom: P.teal, hat: 'straw', pose: 'hold', held: suitcase(P.mustard) }) },
    { name: 'Biscuit', role: 'Dog. Has his own seat and boarding pass.', build: () => grp(K.dog({ color: P.woodLt, collar: P.red })).sc(1.6) },
  ],
  builds: [
    { name: 'Dragonfly', tag: 'Vehicle', note: 'Six seats, one engine, wheels for grass strips.', build: () => grp(K.ground(4.4, 3.8, { top: '#a9c97a', side: P.sandDk, h: 0.25 }), propPlane().at(0, 0, 0)), cam: { yaw: -55, pitch: 16 } },
    { name: 'Heron', tag: 'Vehicle', note: 'The seaplane. Lands where there is no strip.', build: () => grp(sea(4.4, 4.0), propPlane(P.white, P.red, { floats: true }).at(0, 0.0, 0)), cam: { yaw: -55, pitch: 16 } },
    { name: 'Island terminal', tag: 'Building', note: 'A hut, a bench, a windsock and a departures board.', build: terminal },
    { name: 'Fuel bowser', tag: 'Vehicle', note: 'Fill each plane yourself before take-off.', build: bowser },
  ],
  environments: [
    { name: 'Sunset jetty', note: 'Last flight in, lamps coming on along the jetty.', build: jetty, stage: { bg: [[0, '#f6a57a'], [0.6, '#f6cfa8'], [1, '#e9cdb3']], light: 'dusk' }, cam: { yaw: -28, pitch: 30 } },
    { name: 'Loading the hold', note: 'Bags in by hand. Weight matters on a small plane.', build: hold, cam: { yaw: -20, pitch: 34 } },
  ],
};
