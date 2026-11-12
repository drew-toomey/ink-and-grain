# Toon style boards — shared brief

A solo dev (doesn't code, ADHD, judges everything by eye, wants visuals over text) has a signature art style from their
kite-shop game: chunky low-poly 3D, 3-tone toon shading, thick dark-brown ink outlines, warm muted palette (cream, terracotta,
teal-green, honey wood, sky blue, mustard), paper grain, tabletop-diorama camera. Inspired by **Paralives, Tiny Bookshop and
Chef Knight**. We are making one **project board per game concept** to see how far the style travels.

Strong taste notes: hands-on visible steps (not idle "walls of BUY buttons"), UI that lives in the world (tickets, clipboards),
low stakes, "a safe place that pushes back the dark", builders small enough to finish, no menus/reading overload,
strongly against "AI slop" (all final assets will be hand-built in Blender). Never mention or pitch mining/ore/smelting games.

## Files
- `kit.js` — the toon renderer + primitive/builder library. **Read its header comments and builder signatures first. Do not edit it** (other people use it in parallel). If you hit a kit bug, work around it inside your module and mention it in your report.
- `board.js` — the page template. Do not edit.
- `games/tide.js` — the finished exemplar module (board 1). **Copy its structure and quality bar.**
- `dev.html?g=<slug>&n=<n>` — dev page that renders `games/<slug>.js`.
- `shot.mjs` — screenshot tool: `node shot.mjs "dev.html?g=<slug>&n=<n>" /tmp/…/out.png 1320 900 --full` (prints console errors). Crop tall screenshots with Python PIL before viewing them (e.g. two halves), and view them with the Read tool.

## Module format (see tide.js)
```
export default {
  slug, title, logline, genre:[3 chips], theme:{ accent, cardBg, plinth?, plinthRim?, modeLabel? },
  mode?: { mono:true, accent:'#hex', accentName:'Lamplight amber', rule:'…what the colour means…', tol?:0.33 },
  pitch (≤60 words), loop:[4–5 steps, ≤9 words each], why:[3 bullets, ≤18 words each], fromYou (1–2 sentences),
  similar:[{name,url?,note}] (3–4; only Steam URLs you are sure of — otherwise omit url),
  palette:[[name,hex]×6],
  key:{ build, bg, light?, cam, caption },          // hero diorama, wide 21:9
  characters:[{name, role, build}] ×4,               // auto-placed on a round plinth, portrait 3:4
  builds:[{name, tag:'Building'|'Vehicle'|'Structure'|'Prop', note, build, cam?, stage?}] ×4,
  environments:[{name, note, build, cam?, stage?}] ×2,
}
```
- cam: `{ yaw (deg, negative = seen from front-left), pitch, fov, zoom, pad, target:[x,y,z] }` — framing is automatic and tight.
- stage: `{ bg: '#hex' | [[0,'#top'],[1,'#bottom']], light: 'day'|'dusk'|'night'|'overcast'|'cave'|'mono', sun:[x,y,z] }`.
- Every `build` returns a NEW Object3D. Front of everything faces +Z. Base on y=0. Units: an adult is ~1.7 tall.
- Night/glow: use `K.glow('#hex')` as a material (unlit) for lamps/windows/screens/fire; `light:'night'` or `'dusk'`.
- Mono boards: build EVERYTHING from greys (`P.g0`…`P.g7`, skin greys too) and use the accent colour ONLY on what the rule says.
  Set `theme.cardBg`, `theme.plinth`, `theme.plinthRim` to greys and key/environment `bg` to grey gradients.
  The renderer also desaturates anything not close to the accent hue as a safety net.

## Quality bar
- Each asset should read instantly as the thing it is, from a thumbnail: strong silhouette, 1–2 story props (the trawler has buoys and a name board; the shack has a rod rack).
- 15–80 meshes per build; environments and key art are dense little dioramas (ground slab with soil/water sides, 8–20 props, 1–3 people).
- Check every render: nothing floating or sunk, nothing clipping through walls, people face camera-ish, signs readable, no giant empty frames.
- Copy: plain British English, short sentences, no em-dash asides, no hype words. Write like a friend explaining the game.
- 2–4 render/fix iterations per board is plenty. Also check one render at 420px wide for layout sanity.

## The ten boards
1. **Tide & Tackle** (`tide`, done) — pier tackle shop, tie lures at the bench.
2. **Fix-It Barge** (`barge`) — repair workshop on a canal narrowboat, autumn canal towns.
3. **Lost Property** (`lost`) — lost property office at a seaside railway station; tag, shelve, match owners by clues.
4. **Tabletop Line** (`railway`) — build a model railway layout on a hobby-shop workbench; the tiny town uses it.
5. **Snowline** (`snowline`) — cosy winter village builder; every hearth melts a warm circle you can build in.
6. **Pall** (`pall`) — MONO + lamplight amber: relight a fog-bound harbour town's lamps; colour returns with light.
7. **Night Watch** (`nightwatch`) — MONO + signal red: CCTV night shift at a cliff-top asylum; red marks what changed.
8. **Warren** (`warren`) — side-on cutaway bunker builder under a family house; cosy-apocalypse.
9. **Marshlight** (`marshlight`) — canoe mystery in misty marsh channels, lantern light, Firewatch-style chapters.
10. **Burger Joint** (`burger`) — beach burger shack; stack every order by hand, layer by layer.
11. **Fathom Nook** (`fathom`, added later) — cosy underwater exploration; a sea-floor cabin, reef lamps that bring the colour back, a sketchbook. Underwater recipe: warm colours on owned things, cool gradient background, far layers as flat unlit silhouettes behind see-through haze cards, pale sun shafts, lamp pools on the sand.
