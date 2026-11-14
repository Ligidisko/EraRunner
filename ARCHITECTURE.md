# How Era Runner works (for the judges' Q&A)

**One-liner:** a Phaser 3 auto-runner in which each decade is a *data file*. The engine code
only knows "run, jump, slide, dodge, collect". Everything that makes the 80s feel like the 80s
(palette, sprites, hazards, music, speed) lives in `src/eras/era80s.js`.

## Scene flow

```
Boot ──> Title ──> EraCard ("1985 · Age 8") ──> Run (one era) ──┬─> EraCard (next era) ──> Run ...
                                 ▲                              │
                                 └──── out of hearts (retry) ───┘
                                                     last era cleared ──> End (memory desk)
```

| File | What it does |
| --- | --- |
| `src/main.js` | Creates the Phaser game: 320×180 internal resolution, pixel-art scaling, arcade physics |
| `src/config.js` | Tuning knobs: jump strength, hearts, ground height |
| `src/eras/*.js` | One file per decade: palette, sprites, obstacles, music notes, speed, mechanics |
| `src/gfx/pixelArt.js` | Turns text-art (`'..rrr..'`) into textures; shared player sprite |
| `src/scenes/BootScene.js` | Builds every texture for every era at startup |
| `src/scenes/RunScene.js` | The game itself: input, physics, spawning, hits, scoring, era end |
| `src/audio/audio.js` | Web Audio synth: sound effects + a step sequencer for each era's chiptune loop |
| `src/save.js` | High score in localStorage |

## Key ideas to explain

1. **Art that "grows up".** Sprites are strings of characters mapped to colours. The same player
   sprite gets a new palette each era, the CRT scanline overlay fades from strong (80s) to none (00s),
   and backgrounds go from flat neon to glossy gradients. That is the nostalgia hook: the graphics
   age with you.
2. **Distance-based spawning.** Obstacles are spaced in pixels, not seconds, so as the speed ramps up
   the gaps stay fair but come faster.
3. **Fair hitboxes.** Hitboxes are smaller than the art, you get 1.2 s of invulnerability after a hit,
   and you have 3 hearts per era with a checkpoint at the start of each era.
4. **No asset licensing risk.** All art and audio is generated in code; the only third-party pieces
   are Phaser (MIT) and the Press Start 2P font (OFL).
5. **Adding an era = adding a data file.** The 70s and 10s are a copy of an era file plus one line in
   `src/eras/index.js`.

## Build and ship

```
npm install
npm run dev     # local dev server with hot reload
npm run build   # production build into dist/
npm run zip     # dist/ -> era-runner.zip (index.html at the zip root, ready for itch.io)
```
