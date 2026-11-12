// Saltway — coastal freight. Key art and pieces from worlds.js.
import * as K from '../kit.js';
import { saltway, coaster, crane, cargo, cargoCols } from '../worlds.js';
const { P, grp, box, rbox, cyl, cone, sph, torus, tube, extrude, tex, texMat, deg, rng } = K;

const sea = (w, d, o = {}) => K.ground(w, d, { map: tex.waves({ base: o.base ?? P.sea, line: o.line ?? '#9ad6de', rep: [Math.max(1, w / 3), Math.max(1, d / 3)] }), side: o.side ?? P.seaDk, h: 0.4 });

function lighthouse(beam = false) {
  const g = grp(K.rock(0.9, P.stoneDk, 5).sc(1.6, 0.7, 1.4), sph(0.75, P.moss, { part: 'top', seg: 16 }).sc(1.6, 0.35, 1.4).at(0, 0.38, 0));
  g.add(cyl(0.32, 0.4, 1.8, texMat(tex.stripes({ colors: [P.red, P.white], n: 4, vertical: false })), { seg: 16 }).at(0, 0.45, 0));
  g.add(cyl(0.42, 0.42, 0.06, P.iron, { seg: 16 }).at(0, 2.25, 0), cyl(0.26, 0.26, 0.3, K.glow(P.butter), { seg: 12 }).at(0, 2.31, 0), cone(0.36, 0.32, P.red, { seg: 12 }).at(0, 2.61, 0));
  g.add(K.house({ w: 0.8, d: 0.6, h: 0.5, wall: P.white, roof: P.red, roofH: 0.3, windows: 0, door: P.navy }).at(0.75, 0.3, 0.2));
  if (beam) g.add(cone(0.6, 4.5, K.glow('#ffe58a', { opacity: 0.55, depthWrite: false }), { seg: 16, open: true }).rot(0, 0, deg(90)).at(-0.1, 2.46, 0).noInk());
  return g;
}
function office() {
  const g = K.house({ w: 2.0, d: 1.4, h: 1.1, wall: P.terracotta, roof: P.slate, roofH: 0.5, door: P.mustard, windows: 2, sign: 'SALTWAY', shutters: P.navy, base: P.stoneDk });
  g.add(grp(box(0.06, 0.9, 0.06, P.woodDk).at(-0.3, 0, 0), box(0.06, 0.9, 0.06, P.woodDk).at(0.3, 0, 0), K.sign('JOBS', { w: 0.75, h: 0.42, bg: P.cream, fg: P.navy, frame: P.woodDk }).at(0, 0.5, 0.04)).at(-1.25, 0, 0.8).rot(0, deg(20), 0));
  g.add(K.barrel(0.5, P.teal).at(1.25, 0, 0.75), cargo(P.red).at(0.95, 0, 0.95));
  return grp(K.ground(3.0, 2.4, { map: tex.tiles({ base: P.stone, line: P.stoneDk, n: 6 }), side: P.stoneDk, h: 0.25 }), g.at(0, 0, -0.3));
}
function tug() {
  const g = grp();
  g.add(extrude([[-0.9, 0.1], [-0.95, 0.55], [0.8, 0.55], [1.05, 0.65], [0.8, 0.0], [-0.8, 0.0]], 0.8, P.red));
  g.add(box(1.9, 0.08, 0.82, P.ink2).at(0.05, 0.02, 0), box(1.8, 0.04, 0.7, P.woodLt).at(0, 0.53, 0));
  g.add(K.house({ w: 0.6, d: 0.7, h: 0.5, wall: P.white, roof: P.navy, roofType: 'flat', windows: 0, door: P.white, base: P.white }).rot(0, deg(90), 0).at(-0.1, 0.55, 0));
  g.add(cyl(0.11, 0.12, 0.4, P.mustard, { seg: 12 }).at(-0.55, 0.65, 0), cyl(0.115, 0.115, 0.08, P.ink2, { seg: 12 }).at(-0.55, 1.0, 0));
  for (let i = 0; i < 5; i++) g.add(torus(0.12, 0.05, P.ink2, { ts: 14 }).at(-0.6 + i * 0.35, 0.3, 0.43));
  return g;
}
function chartTable() {
  const g = grp(box(4.2, 0.25, 2.8, P.woodDk).at(0, -0.25, 0));
  const chart = tex.custom(512, 340, (x, w, h) => {
    x.fillStyle = '#bfdfe2'; x.fillRect(0, 0, w, h);
    x.strokeStyle = '#9cc7cc'; x.lineWidth = 1; for (let i = 0; i < 12; i++) { x.beginPath(); x.moveTo(i * 44, 0); x.lineTo(i * 44, h); x.stroke(); }
    x.fillStyle = '#ecd8a8'; x.strokeStyle = '#8c5732'; x.lineWidth = 3;
    [[80, 80, 60, 40], [300, 70, 70, 50], [420, 230, 55, 45], [150, 250, 80, 45]].forEach(([cx, cy, rx, ry]) => { x.beginPath(); x.ellipse(cx, cy, rx, ry, 0.3, 0, 7); x.fill(); x.stroke(); });
    x.setLineDash([10, 8]); x.strokeStyle = '#e2482f'; x.lineWidth = 4; x.beginPath(); x.moveTo(120, 100); x.quadraticCurveTo(220, 160, 300, 110); x.quadraticCurveTo(380, 180, 410, 220); x.stroke();
    x.setLineDash([]); x.fillStyle = '#2f3f63'; x.font = '700 22px sans-serif'; x.fillText('Gull Rock', 260, 140); x.fillText('Saltway', 50, 150); x.fillText('Mallow', 380, 290);
  });
  g.add(box(3.6, 0.02, 2.4, texMat(chart)).at(0, 0, 0));
  const token = (c) => grp(extrude([[-0.12, 0], [0.12, 0], [0.18, 0.07], [-0.12, 0.07]], 0.08, c), box(0.06, 0.06, 0.05, P.white).at(-0.04, 0.07, 0));
  g.add(token(P.navy).at(-0.35, 0.02, -0.3), token(P.red).rot(0, deg(30), 0).at(0.9, 0.02, 0.15));
  g.add(grp(cyl(0.22, 0.22, 0.05, P.mustard, { seg: 20 }), cyl(0.18, 0.18, 0.06, P.cream, { seg: 20 }), box(0.02, 0.07, 0.3, P.red).at(0, 0, 0)).at(-1.4, 0.02, 0.7));
  g.add(grp(cyl(0.12, 0.1, 0.22, P.white, { seg: 14 }), torus(0.06, 0.015, P.white, { ts: 10 }).rot(0, 0, 0).at(0.13, 0.11, 0)).at(1.5, 0.02, -0.75));
  g.add(grp(box(0.9, 0.02, 0.05, P.woodLt), box(0.05, 0.02, 0.9, P.woodLt).at(0.43, 0, 0.43)).rot(0, deg(20), 0).at(0.8, 0.02, 0.75));
  g.add(cyl(0.015, 0.015, 0.5, P.red, { seg: 6 }).rot(0, 0, deg(90)).at(-0.6, 0.03, 0.85));
  g.add(K.lantern().at(-1.6, 0.0, -0.9));
  return g;
}
function storm() {
  const g = grp();
  g.add(K.ground(10, 5.6, { map: tex.waves({ base: '#2f6f86', line: '#7fb6c6', rep: [3, 2] }), side: '#22546a', h: 0.6 }).at(0, -0.55, 0));
  const r = rng(3); for (let i = 0; i < 16; i++) g.add(sph(0.3 + r() * 0.25, '#cfe7ec', { part: 'top', seg: 10 }).sc(1.6, 0.35, 0.8).at(-4.5 + r() * 9, 0.0, -2.5 + r() * 5));
  const ship = coaster(); ship.add(sph(0.08, K.glow(P.butter), { seg: 8 }).at(-1.0, 1.32, 0.3).noInk(), sph(0.07, K.glow('#7fe08a'), { seg: 8 }).at(0.2, 0.85, 0.57).noInk());
  g.add(ship.rot(deg(4), deg(-15), deg(-4)).at(-0.6, -0.25, 0.6));
  g.add(lighthouse(true).at(3.6, -0.3, -1.6));
  g.add(grp(cone(0.2, 0.5, P.red, { seg: 10 }), cyl(0.22, 0.22, 0.12, P.white, { seg: 10 })).rot(0, 0, 0.2).at(2.0, -0.1, 1.6));
  return g;
}

export default {
  slug: 'saltway',
  title: 'Saltway',
  logline: 'Run a little coastal freight line, one ship, one crane and a lot of crates.',
  genre: ['Transport sim', 'Logistics', 'Hands-on loading'],
  theme: { accent: '#2f3f63', cardBg: '#e9eef0' },
  pitch: 'You inherit one tired coaster and a quay. Plot routes between island harbours on a paper chart, load every crate with the crane yourself, and race the weather home. Islands ask for odd things: lamp oil, a piano, forty sheep. Earn a second ship, then a third.',
  loop: ['Pick jobs off the harbour board', 'Plot the route on the chart', 'Load the crates with the crane', 'Sail, dodge the weather, deliver', 'Spend the money on the fleet'],
  why: ['Boats, cranes and coloured crates are what this style draws best.', 'A small island map keeps the open sea readable and full of landmarks.', 'The chart table is a hands-on screen instead of a menu.'],
  fromYou: 'You have about 900 hours in transport games. This keeps that loop but puts your hands on the crane, like the kite workbench.',
  similar: [
    { name: 'TransOcean', note: 'the shipping company sim you named' },
    { name: 'Mini Motorways', note: 'calm route planning, tiny map' },
    { name: 'Mars First Logistics', note: 'inked toon look, hands-on cargo' },
    { name: 'Transport Fever', note: 'deep transport, the big-map version' },
  ],
  palette: [['Hull navy', P.navy], ['Crane yellow', P.mustard], ['Signal red', P.red], ['Harbour teal', P.teal], ['Sea', P.sea], ['Quay stone', P.stone]],
  key: { build: () => saltway(), bg: [[0, '#bfe4ec'], [1, '#f3ead6']], cam: { yaw: -26, pitch: 32, fov: 24 }, caption: 'Loading the Marigold, 6am' },
  characters: [
    { name: 'Jory Pike', role: 'You. Skipper of the Marigold and owner of exactly one ship.', build: () => K.person({ hairStyle: 'ponytail', hair: P.hairBlack, skin: P.skin3, top: P.navy, bottom: P.iron, hat: 'captain', acc: ['scarf'], accColor: P.red, pose: 'hips' }) },
    { name: 'Ada Kell', role: 'Crane driver. Can drop a crate on a coin.', build: () => K.person({ hairStyle: 'bob', hair: P.hairAuburn, top: P.orange, bottom: P.navy, hat: 'hardhat', acc: ['headphones'], accColor: P.mustard, pose: 'point' }) },
    { name: 'Mr Fenn', role: 'Harbourmaster. Pins the jobs to the board.', build: () => K.person({ body: 'elder', hairStyle: 'short', hair: P.hairWhite, top: P.teal, bottom: P.navy, acc: ['glasses', 'moustache'], pose: 'hold', held: K.rbox(0.3, 0.4, 0.04, P.woodLt, { r: 0.02 }).put(box(0.24, 0.3, 0.01, P.white).at(0, 0.04, 0.025)) }) },
    { name: 'Pickle', role: 'Ship\'s cat. Sleeps on the warmest crate.', build: () => grp(grp(K.cat({ color: P.hairGrey, belly: P.white })).rot(0, deg(-55), 0)).sc(2) },
  ],
  builds: [
    { name: 'The Marigold', tag: 'Vehicle', note: 'Small coaster, eight crates, one funnel.', build: () => grp(sea(5.4, 2.2), coaster().at(0, -0.3, 0)), cam: { yaw: -30, pitch: 22 } },
    { name: 'Quay crane', tag: 'Structure', note: 'You drive it. Every crate is loaded by hand.', build: () => grp(K.ground(3.6, 1.8, { map: tex.tiles({ base: P.stone, line: P.stoneDk, n: 6 }), side: P.stoneDk, h: 0.25 }), crane().at(-1.2, 0, 0), cargo(P.red).at(0.6, 0, 0.4), cargo(P.mustard).at(1.15, 0, 0.4), cargo(P.blue).at(0.85, 0.37, 0.4)), cam: { yaw: -24, pitch: 18 } },
    { name: 'Harbour office', tag: 'Building', note: 'The jobs board and the kettle.', build: office },
    { name: 'Tug Bramble', tag: 'Vehicle', note: 'Your second ship. Tows the ones that break down.', build: () => grp(sea(3.0, 1.8), tug().rot(0, deg(-15), 0).at(0, -0.25, 0)) },
  ],
  environments: [
    { name: 'Storm run', note: 'Late, low on fuel, following the lighthouse home.', build: storm, stage: { bg: [[0, '#5d6b80'], [1, '#a9b3bd']], light: 'dusk' }, cam: { yaw: -26, pitch: 26 } },
    { name: 'The chart table', note: 'Plot routes with a pencil, not a menu.', build: chartTable, stage: { bg: P.cream }, cam: { yaw: 0, pitch: 58, fov: 28 } },
  ],
};
