# How Era Runner works (for the judges' Q&A)

**One-liner:** Era Runner is *the evolution of games* in one arcade credit. You play three
different games in a row: an 80s arcade shooter, a 90s console platformer, then a 2000s rhythm
game. The controls you unlock grow each era, from a joystick and one button, to a D-pad and two
buttons, to four arrow keys. The game is built in Phaser 3, and every decade's look, sound, slang
and boss comes from a small data file.

## Scene flow

```
Boot -> Title (attract mode: title / high scores / memories / self-playing DEMO)
          | C = insert coin, SPACE = start   (first time: "blow on the cartridge" -> B)
          v
     EraCard (TV channel-change static -> "1985 · AGE 8" -> NEW CONTROLS UNLOCKED)
          v
     Shooter (1985) -> memory reveal -> EraCard -> Platformer (1995) -> ... -> Rhythm (2005) -> End
          | out of lives
          v
     Continue ("CONTINUE? 9..8..", "BE KIND, REWIND") -> Initials (top 10) -> Title (high scores)
```

| File | What it does |
| --- | --- |
| `src/state.js` | One arcade "run": score, lives (extra life every 10,000), credits, memories, cheats |
| `src/save.js` | Top-10 high-score table with 3-letter initials (localStorage, safe if blocked) |
| `src/eras/*.js` | One file per decade: palette, sprites, music, boss, slang, controls to unlock, which game it plays |
| `src/scenes/ShooterScene.js` | 1985 arcade: marching alien formation, crumbling shields, flying-boombox bonus, The Cabinet boss |
| `src/scenes/PlatformerScene.js` | 1995 console: a scrolling level you explore left/right and up/down, momentum, stomps, spin attack, one-way platforms, bonus blocks, pits, springs, power orbs, Y2K Bug boss arena |
| `src/levels/level90s.js` | The 1995 level as hand-made ASCII chunks (easy to edit: `#` block, `-` platform, `B` bonus block, `g` ghost...) |
| `src/scenes/RhythmScene.js` | 2005 PC/mall: 4-lane rhythm game synced to the audio clock, phone signal-bar health, Pop-Up King song |
| `src/scenes/EraCardScene.js` | TV channel change + controller art (arcade stick, then pad, then keyboard); press each new button to start |
| `src/scenes/TitleScene.js` | Attract mode, coins/credits, cheat words, cartridge-blowing gag |
| `src/scenes/ContinueScene.js`, `InitialsScene.js`, `EndScene.js` | Continue countdown, initials entry, memory-desk ending |
| `src/systems/hud.js` | The HUD evolves too: arcade 1UP/HI-SCORE, a 16-bit panel, then a glossy aqua toolbar |
| `src/systems/reveal.js` | Shared moments: decade-slang popups, losing a life, memory-item reveal, next era |
| `src/systems/Boss.js`, `autochart.js`, `fx.js`, `keys.js` | Y2K Bug boss, rhythm chart from audio, particles/popups, one-shot key presses |
| `src/audio/audio.js` | Web Audio synth: all music and SFX generated in code (no licensing risk) |

## Key ideas to explain

1. **Gameplay evolves, not just graphics.** Each era is a different genre from its decade, and the
   "NEW CONTROLS UNLOCKED" card makes you press each new button before the game starts. That
   teaches the controls and dramatizes the evolution at the same time.
2. **Arcade conventions on purpose.** Attract mode with a self-playing demo, INSERT COIN, credits,
   1UP and HI-SCORE, extra lives, a CONTINUE countdown and initials entry. Older players recognize
   every one of these.
3. **Nostalgia moments.** Blowing on the cartridge, the TV channel changing between eras, "BE KIND,
   REWIND", decade slang ("TUBULAR!", "AS IF!", "PWNED!"), and each era's memory item landing on
   the desk at the end.
4. **Fair design.** Coyote time and jump buffering in the platformer, knockback on hits, and a
   continue drops you back at the boss you died on. Hits scatter your caps instead
   of killing you. Ghosts flee when power runs out. Pressing a rhythm key on no note is never
   punished.
5. **The rhythm game is in sync.** Notes are positioned from the Web Audio clock, not frame time,
   so they line up with the music even if the frame rate drops.
6. **Safe IP.** All aliens, bosses and objects are original or generic (cassette, VHS, flip phone),
   with no brands, logos or real songs. The font is OFL and Phaser is MIT.
7. **Adding an era = a data file + (optionally) a new game scene.** The 70s and 10s are next.

## Demo cheats (title screen)

Type `NOSTALGIA` for god mode, then press **N** in-game to skip to the next era. Type `BIGHEAD` for
big-head mode.

## Build and ship

```
npm install
npm run dev     # local dev server with hot reload
npm run zip     # production build -> era-runner.zip (index.html at the zip root, ready for itch.io)
```
