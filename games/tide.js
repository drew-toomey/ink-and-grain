// Tide & Tackle — exemplar game module. Every build() returns a fresh Object3D. Front of things faces +Z.
import * as K from '../kit.js';
const { P, THREE, grp, box, rbox, cyl, cone, sph, cap, torus, tube, extrude, lathe, tex, texMat, deg, rng } = K;

// --- local palette
const C = { pier: '#c08550', pierDk: '#8a5a34', buoy: '#ec7a2e', teal: '#2f8a7a', glass: '#a9d6e6', net: '#f2e6cc', red: '#e2482f', sea: '#4aa3b5', seaDk: '#2f7d93', hull: '#3a7bd5' };

// --- small props
const lure = (body = C.red, belly = P.white, s = 1) => grp(
  sph(0.12, body, { seg: 16 }).sc(1.7, 0.85, 0.7),
  sph(0.09, belly, { seg: 12 }).sc(1.6, 0.6, 0.6).at(0.02, -0.04, 0).noInk(),
  extrude([[0, 0], [0.14, 0.1], [0.14, -0.1]], 0.02, body).at(-0.3, 0, 0),
  sph(0.03, P.ink, { seg: 8 }).at(0.15, 0.03, 0.07).noInk(),
  torus(0.06, 0.012, P.steel, { arc: Math.PI * 1.4, ts: 12 }).at(0.02, -0.14, 0),
).sc(s);
const spool = (c = C.red) => grp(cyl(0.09, 0.09, 0.03, P.woodLt, { seg: 16 }), cyl(0.06, 0.06, 0.12, c, { seg: 16 }).at(0, 0.03, 0), cyl(0.09, 0.09, 0.03, P.woodLt, { seg: 16 }).at(0, 0.15, 0));
const buoy = (c = C.buoy) => grp(sph(0.18, c, { seg: 16 }).sc(1, 1.2, 1), cyl(0.18, 0.18, 0.06, P.white, { seg: 16 }).at(0, 0.0, 0));
const rod = (h = 1.8, c = P.woodDk) => grp(cyl(0.015, 0.03, h, c, { seg: 8 }), cyl(0.05, 0.05, 0.06, P.steel, { seg: 12 }).rot(0, 0, deg(90)).at(0.04, h * 0.18, 0));
const postsUnder = (w, d, y0, n = 3) => { const g = grp(); for (let i = 0; i < n; i++) for (const z of [-d / 2 + 0.15, d / 2 - 0.15]) g.add(cyl(0.11, 0.12, -y0 + 0.02, C.pierDk, { seg: 10 }).at(-w / 2 + 0.25 + (i / (n - 1)) * (w - 0.5), y0, z)); return g; };
const deck = (w, d) => box(w, 0.14, d, texMat(tex.planks({ base: C.pier, line: C.pierDk, n: Math.round(w * 3), vertical: true, rep: [1, 1] })));

function shack() {
  const g = K.house({ w: 2.4, d: 1.7, h: 1.35, wall: '#e9e1cf', roof: C.teal, door: C.red, trim: P.white, windows: 2, awning: [C.buoy, P.white], sign: 'TACKLE', shutters: C.teal, base: C.pierDk });
  // rods rack and hanging buoys
  const rack = grp(box(0.08, 1.2, 0.08, P.woodDk).at(-0.3, 0, 0), box(0.08, 1.2, 0.08, P.woodDk).at(0.3, 0, 0), box(0.7, 0.08, 0.1, P.woodDk).at(0, 1.0, 0));
  [-0.2, -0.05, 0.1, 0.25].forEach((x, i) => rack.add(rod(1.5, [P.woodDk, C.red, C.hull, C.teal][i]).at(x, 0.05, 0.08).rot(deg(-8), 0, deg(-4 + i * 3))));
  g.add(rack.at(1.55, 0, 0.6));
  g.add(buoy().at(-1.32, 0.9, 0.55), buoy(P.white).sc(0.8).at(-1.32, 0.45, 0.6));
  g.add(K.crate(0.42).at(-0.95, 0, 1.15), K.barrel(0.55, C.teal).at(1.0, 0, 1.15));
  return g;
}
function trawler() {
  const b = K.vehicle({ kind: 'boat', body: C.hull, trim: P.white, cabin: '#f1ead8', roof: C.red, len: 2.6 });
  b.add(cyl(0.035, 0.04, 1.3, P.white, { seg: 8 }).at(0.4, 0.4, 0), K.flag(C.buoy, 0.5).at(0.4, 1.65, 0), buoy().sc(0.6).at(1.1, 0.5, 0.42), buoy(P.white).sc(0.6).at(0.75, 0.5, 0.45));
  b.add(K.sign('KITTIWAKE', { w: 0.9, h: 0.16, bg: P.white, fg: C.hull, frame: P.white }).rot(0, 0, 0).at(0.2, 0.18, 0.52));
  return b.rot(0, deg(-12), 0);
}
function baitCart() {
  const g = K.vehicle({ kind: 'cart', body: P.woodLt });
  g.add(rbox(0.9, 0.38, 0.6, P.white, { r: 0.06 }).at(0, 0.7, 0), rbox(0.92, 0.1, 0.62, C.teal, { r: 0.04 }).at(0, 1.06, 0));
  g.add(K.sign('BAIT', { w: 0.5, h: 0.2, bg: C.buoy, fg: P.white, frame: C.buoy }).at(0, 0.75, 0.31));
  g.add(K.umbrella([C.teal, P.white], 0.85, 1.9).at(-0.35, 0.7, 0));
  return g;
}
function bench() {
  const g = grp();
  g.add(box(3.4, 0.3, 2.0, P.wood).at(0, -0.3, 0));
  g.add(box(2.1, 0.03, 1.4, texMat(tex.grid({ bg: P.mat, line: '#a9d2bb', cells: 8, lw: 2 }))).at(-0.2, 0, 0.1));
  // vise
  const vise = grp(box(0.3, 0.12, 0.3, P.iron), cyl(0.04, 0.04, 0.5, P.steel, { seg: 10 }).at(0, 0.12, 0), box(0.12, 0.12, 0.08, P.iron).at(0, 0.62, 0), lure(C.red, P.white, 1.1).at(0.18, 0.66, 0));
  g.add(vise.at(-0.4, 0.03, 0.05));
  [C.red, C.teal, C.buoy, P.white].forEach((c, i) => g.add(spool(c).at(1.15, 0.0, -0.6 + i * 0.3)));
  g.add(lure(C.teal, P.butter, 0.9).rot(0, deg(20), 0).at(0.5, 0.07, 0.4), lure(P.mustard, P.white, 0.8).rot(0, deg(-30), 0).at(0.15, 0.07, 0.65));
  // feathers
  [P.pink, C.buoy, C.teal].forEach((c, i) => g.add(extrude([[0, 0], [0.05, 0.12], [0.03, 0.42], [0, 0.48], [-0.03, 0.42], [-0.05, 0.12]], 0.01, c).rot(deg(-90), 0, deg(30 + i * 22)).at(-1.05 + i * 0.12, 0.03, 0.55)));
  g.add(grp(torus(0.1, 0.03, C.red).rot(deg(90), 0, 0).at(0, 0.03, 0), torus(0.1, 0.03, C.red).rot(deg(90), 0, 0).at(0.2, 0.03, 0.03), box(0.6, 0.03, 0.05, P.steel).at(0.5, 0.02, 0.02)).rot(0, deg(-20), 0).at(-1.3, 0, -0.45));
  g.add(cyl(0.16, 0.18, 0.06, C.red).at(-1.35, 0, -0.75), cyl(0.03, 0.03, 0.9, P.steel).at(-1.35, 0.05, -0.75).rot(0, 0, deg(10)), cone(0.25, 0.3, C.red).rot(deg(150), 0, deg(-20)).at(-1.15, 1.0, -0.75));
  g.add(K.lantern().at(1.4, 0, 0.6));
  return g;
}
function pierScene(o = {}) {
  const g = grp();
  g.add(K.ground(9, 6, { map: tex.waves({ base: C.sea, line: '#9ad6de', rep: [3, 2] }), side: C.seaDk, h: 0.6 }).at(0, -0.55, 0));
  g.add(deck(6.2, 2.6).at(-0.9, 0, -0.8), postsUnder(6.2, 2.6, -0.6, 4).at(-0.9, 0, -0.8));
  g.add(deck(1.4, 2.6).at(-3.3, 0, 1.4), postsUnder(1.4, 2.6, -0.6, 2).at(-3.3, 0, 1.4));
  g.add(shack().sc(0.95).at(-1.3, 0.14, -1.25));
  g.add(trawler().at(2.8, -0.42, 1.2));
  g.add(K.person({ body: 'kid', hairStyle: 'pigtails', hair: P.hairBlonde, top: P.pink, bottom: C.hull, hat: 'sou', held: rod(1.4, C.red).rot(deg(50), 0, 0) }).sc(0.8).at(-3.4, 0.14, 1.9));
  g.add(K.bird({}).at(1.4, 0.14, -0.4), K.bird({}).rot(0, deg(40), 0).at(0.95, 0.14, 0.15));
  g.add(K.bench(1.0, C.pier).at(0.9, 0.14, -1.8));
  g.add(buoy().at(3.8, -0.5, -1.8), buoy(P.white).at(-0.2, -0.5, 1.9));
  g.add(K.lamppost(1.7).at(1.9, 0.14, -0.15));
  if (o.people !== false) g.add(K.person({ hairStyle: 'short', hair: P.hairAuburn, top: C.teal, bottom: P.navy, apron: P.mustard, hat: 'beanie', hatColor: C.buoy, pose: 'wave' }).sc(0.85).at(0.0, 0.14, -0.15));
  return g;
}
function harbourDusk() {
  const g = grp();
  g.add(K.ground(9, 5, { map: tex.waves({ base: '#3f8ea6', line: '#8cc7d4', rep: [3, 2] }), side: C.seaDk, h: 0.6 }).at(0, -0.55, 0));
  g.add(K.ground(9, 1.6, { top: P.stone, side: P.stoneDk, h: 0.8 }).at(0, 0.25, -1.7));
  g.add(K.house({ w: 1.6, d: 1.2, h: 1.0, floors: 2, wall: P.butter, roof: P.terracotta, glass: P.butter }).at(-3, 0.25, -1.9), K.house({ w: 1.4, d: 1.2, wall: '#e9e1cf', roof: C.teal, glass: P.butter }).at(-1.4, 0.25, -1.9), K.house({ w: 1.8, d: 1.2, h: 1.1, wall: C.hull, roof: P.white, roofType: 'hip', glass: P.butter }).at(0.5, 0.25, -1.9));
  [-2.2, -0.4, 1.6, 3.4].forEach((x) => g.add(K.lamppost(1.4).at(x, 0.25, -1.1)));
  g.add(trawler().rot(0, deg(20), 0).at(-1.4, -0.42, 0.9), K.vehicle({ kind: 'boat', body: C.red, trim: P.white, mast: true, sail: P.cream }).rot(0, deg(-30), 0).at(2.2, -0.42, 0.7));
  g.add(buoy().at(3.6, -0.5, 1.8), buoy(P.white).at(0.4, -0.5, 1.9));
  return g;
}

export default {
  slug: 'tide-and-tackle',
  title: 'Tide & Tackle',
  logline: 'Tie lures at the bench, sell them at the end of the pier, and hear the fish stories come back.',
  genre: ['Cosy shopkeeping', 'Tactile crafting', 'Fishing'],
  theme: { accent: '#2f8a7a', cardBg: '#f1e6cf' },
  pitch: 'A sister shop to the kite shop, in the same seaside town. Customers bring a problem ("the mackerel are ignoring me"). You tie the right lure step by step on the bench and hang it on the pegboard. Next morning they come back with a catch, a photo and a bigger order.',
  loop: ['Read the order ticket', 'Pick body, hook and feathers', 'Tie, paint and varnish at the bench', 'Customer returns with a catch → new orders unlock'],
  why: ['The bench close-up is the kite workbench again. The style is already proven for this camera.', 'Small, chunky props (spools, buoys, lures) read well with thick outlines.', 'Pier, sea and shack make a postcard key art for a Steam capsule.'],
  fromYou: 'Builds on Far Shores (cast, strike, sell) and on the step-by-step workbench of the kite shop. Fishing has repeat hits on Steam.',
  similar: [
    { name: 'Tiny Bookshop', url: 'https://store.steampowered.com/app/2133760', note: 'seaside shop run from a caravan, 500K+ sold' },
    { name: 'Assemble with Care', url: 'https://store.steampowered.com/app/1202900', note: 'same top-down workbench camera' },
    { name: 'DREDGE', url: 'https://store.steampowered.com/app/1562430', note: 'fishing, 1M+ copies from a small team' },
    { name: 'Cast n Chill', url: 'https://store.steampowered.com/app/3483740', note: 'cosy fishing, 8.7K reviews' },
  ],
  palette: [['Pier timber', C.pier], ['Buoy orange', C.buoy], ['Harbour teal', C.teal], ['Sea', C.sea], ['Net cream', C.net], ['Lure red', C.red]],
  key: { build: () => pierScene(), bg: [[0, '#bfe4ec'], [1, '#f3ead6']], cam: { yaw: -30, pitch: 26, fov: 24 }, caption: 'End of the pier, 7am' },
  characters: [
    { name: 'Marlo', role: 'You. Runs the tackle shack, sleeves always rolled.', build: () => K.person({ hairStyle: 'short', hair: P.hairAuburn, skin: P.skin2, top: C.teal, bottom: P.navy, apron: P.mustard, hat: 'beanie', hatColor: C.buoy, pose: 'hold', held: lure(C.red, P.white, 1.2) }) },
    { name: 'Nan Pell', role: 'Retired trawler skipper. Tells you what the fish want.', build: () => K.person({ body: 'elder', hairStyle: 'bun', hair: P.hairWhite, skin: P.skin1, top: P.mustard, bottom: P.navy, hat: 'sou', hatColor: P.mustard, acc: ['scarf', 'glasses'], accColor: C.red, pose: 'hips' }) },
    { name: 'Tilly', role: 'Eight years old, one rod, enormous ambitions.', build: () => K.person({ body: 'kid', hairStyle: 'pigtails', hair: P.hairBlonde, top: P.pink, bottom: C.hull, hat: 'bucket', hatColor: P.butter, acc: ['backpack'], accColor: C.red, pose: 'wave' }) },
    { name: 'Gus', role: 'Herring gull. Steals one lure per day.', build: () => K.bird({ wing: P.slate }).sc(2.4) },
  ],
  builds: [
    { name: 'The Tackle Shack', tag: 'Building', note: 'Pier-end shop with a rod rack and hanging buoys.', build: () => shack(), stage: {}, cam: { yaw: -26, pitch: 18 } },
    { name: 'Kittiwake', tag: 'Vehicle', note: 'Nan Pell\'s old trawler, now a delivery boat.', build: () => grp(K.ground(3.6, 1.8, { map: tex.waves({ base: C.sea, line: '#9ad6de' }), side: C.seaDk, h: 0.4 }).at(0, -0.1, 0), trawler().at(0, -0.24, 0)) },
    { name: 'Bait cart', tag: 'Vehicle', note: 'Rolls to the beach when the tide is out.', build: () => grp(K.ground(2.6, 1.8, { top: P.sand, side: P.sandDk, h: 0.25 }), baitCart().rot(0, deg(-20), 0)) },
    { name: 'Lure bench', tag: 'Structure', note: 'The workbench: vise, spools, feathers, lamp.', build: () => bench(), cam: { yaw: -8, pitch: 48 } },
  ],
  environments: [
    { name: 'Harbour at dusk', note: 'Boats home, lamps on: the end-of-day sell-off.', build: () => harbourDusk(), stage: { bg: [[0, '#f6b98a'], [0.6, '#f3d7b5'], [1, '#e9cdb3']], light: 'dusk' }, cam: { yaw: -24, pitch: 24 } },
    { name: 'The bench, close up', note: 'Tying a spinner: the step-by-step crafting view.', build: () => bench(), cam: { yaw: 0, pitch: 62, fov: 28 } },
  ],
};
