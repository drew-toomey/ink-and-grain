# Ink & Grain

The house art style for the kite-shop family of games, as a small code kit.

The look: chunky low-poly shapes, three-tone toon shading with warm shadows, thick dark-brown ink outlines with a slight hand wobble, a warm muted palette, paper grain, and a tabletop diorama camera. It is inspired by Paralives, Tiny Bookshop and Chef Knight, and calibrated against the kite-shop workbench screenshots.

Everything renders live in the browser with three.js, built from simple shapes. Nothing here is AI-generated.

## The boards (private claude.ai pages)

- **Overview:** [Ink & Grain Atlas](https://claude.ai/artifact/FkG2p9QFoZgDwh4qKEyL8K)

| # | Board | Idea | Module |
|---|---|---|---|
| 1 | [Tide & Tackle](https://claude.ai/artifact/CWG81R1T7xDd2DxYeQK1RC) | Pier tackle shop, tie lures at the bench | `games/tide.js` |
| 2 | [Fix-It Barge](https://claude.ai/artifact/CPFMQA9jxFSmSs9ik6qrYj) | Repair workshop on a canal boat | `games/barge.js` |
| 3 | [Lost Property](https://claude.ai/artifact/EdUwoGKaq3ENBmXHVGKFy9) | Station lost-property desk, match items to owners | `games/lost.js` |
| 4 | [Tabletop Line](https://claude.ai/artifact/CVTrUY2fDAWiVkVBWj72f6) | Model railway built on a workbench | `games/railway.js` |
| 5 | [Snowline](https://claude.ai/artifact/Aubp3daLEZEm4MrGw5qsNK) | Winter village, every hearth melts a warm circle | `games/snowline.js` |
| 6 | [Pall](https://claude.ai/artifact/VF1Nn13fRAXcHxain7WN84) | Greyscale + amber: relight the lamps | `games/pall.js` |
| 7 | [Night Watch](https://claude.ai/artifact/CGf3Tfv9CKj4HRMsYx7Fse) | Greyscale + red: CCTV night shift | `games/nightwatch.js` |
| 8 | [Warren](https://claude.ai/artifact/K8tvJRRJCX1J5nCMayj9ke) | Side-on bunker builder, smaller scope | `games/warren.js` |
| 9 | [Marshlight](https://claude.ai/artifact/H333shLL2kYX3ZquNK9xNf) | Canoe mystery in misty marsh channels | `games/marshlight.js` |
| 10 | [Burger Joint](https://claude.ai/artifact/TFYubUezp4hQtPQCeH13Fn) | Beach burger shack, stack every order | `games/burger.js` |
| 11 | [Fathom Nook](https://claude.ai/artifact/CJSLYXeUxKuV3EsoujBgaT) | Cosy underwater exploration, reef lamps bring the colour back | `games/fathom.js` |

### Six bigger worlds (in the Atlas)

Lighter pitches for full-world games, one key-art picture each, kept in `worlds.js` and shown in the Atlas under "Six bigger worlds": Hearthmarch (fantasy RTS), Riverfold (survival city builder), Tidepool Hall (aquarium), Saltway (coastal freight), Puddle Jump Air (island airline) and Tuppenny Pier (seaside arcade, no real gambling). Each says how well the style fits and how big the game is. Preview them with `worldsdev.html` (or `worldsdev.html?w=2` for one). Any of them can be grown into a full board in `games/`.

## What's in here

| Path | What it is |
|---|---|
| `kit.js` | The renderer and the shape library: primitives, `person()`, `house()`, `vehicle()`, `tree()`, critters, props, canvas textures, and the `Studio` that draws toon + ink + grain. Read its header comment first. |
| `board.js` | The project-board page template (hero, brief, palette, character/build/environment cards, prompts). |
| `atlas.js` | The overview page. Imports every game module for live thumbnails. |
| `games/*.js` | One module per game: the copy (pitch, loop, similar games, palette) plus a `build()` for every asset. |
| `BRIEF.md` | Style rules, the module format, the quality bar and the ten concepts. Give this to Claude when making a new board. |
| `build.mjs`, `build-atlas.mjs` | Bundle a board (or the overview) into one self-contained HTML file in `dist/`, ready to publish as a claude.ai artifact. |
| `shot.mjs` | Headless screenshot tool for checking renders. |
| `dev.html`, `atlasdev.html` | Dev pages that render straight from the source files. |
| `calib.html` | Calibration scene: the kite bench, a row of characters, buildings and vehicles. |
| `dist/` | The built pages exactly as published. |
| `urls.json` | The published artifact link for each board and the overview. |

## Using it

You need Node 18+ and an internet connection (three.js and the fonts load from CDNs).

```bash
npm install
```

```bash
npm run serve
```

Then open `http://localhost:5173/dev.html?g=tide&n=1` (swap `tide` for any file in `games/`).

Build one board into `dist/`:

```bash
node build.mjs tide 1
```

Screenshot a page to check it (needs Playwright with Chromium):

```bash
node shot.mjs "dev.html?g=tide&n=1" check.png 1320 900 --full
```

## Making a new board

1. Copy `games/tide.js` to `games/<name>.js` and change the copy and the builds.
2. Preview it with `dev.html?g=<name>`.
3. Build it with `node build.mjs <name> <number>` and publish `dist/<name>.html`.

The short version of the rules: every `build()` returns a new object, the front of things faces +Z, bases sit on y=0, and an adult is about 1.7 units tall. For a greyscale board, set `mode: { mono: true, accent, accentName, rule }` and build everything from the grey ramp `P.g0`–`P.g7`.

## Known kit quirks

These came up while building the ten boards. The boards work around them, so the kit is left exactly as published.

- `acc: ['beard']` sits inside the head and barely shows. Snowline builds its own beard.
- `.rot()` on `K.dog()`, `K.bird()` or `K.cat()` replaces their built-in turn to face front. Wrap them in `grp()` first.
- The `hood` hat covers the face, and `flatcap` sits under the hair with no peak. Barge and Marshlight build their own.
- `.at()` sets a position. It does not add to the current one.
- `K.ground({ map })` takes a plain texture from `tex.*`, not a `texMat()` material.
- Canvas textures repeat by default. Clamp one-off decals with `t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping`.
- A texture on the round end of a cylinder comes out turned 90°.
- `light: 'night'` can push dark greys below the ink colour. Add a soft fill light inside the build.
- In greyscale mode, kit colours close to the accent hue (wood and mustard next to amber, brick next to red) keep their colour. Build greyscale boards from greys only.
- Big walls seen side-on can pick up stray ink scribbles. A steeper camera pitch fixes it.
- Below 640px wide, the key art switches to 4:3.
- `shot.mjs` needs three.js offline if the CDN is blocked: `npm pack three@0.160.0`, unpack it to `vendor/three`.
