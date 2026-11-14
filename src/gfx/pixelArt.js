// Turns text-art sprites into Phaser textures.
//
// A sprite is an array of strings. Each character is one pixel and is looked
// up in a colour map ('.' = transparent). Because colours come from a map,
// the SAME sprite drawn with a different era's palette is how the art
// "evolves" from era to era without redrawing anything.

export function makePixelTexture(scene, key, rows, colors) {
  if (scene.textures.exists(key)) return;
  const h = rows.length;
  const w = Math.max(...rows.map((r) => r.length));
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = colors[row[x]];
      if (!c) continue; // '.' or unknown char = transparent
      ctx.fillStyle = c;
      ctx.fillRect(x, y, 1, 1);
    }
  });
  tex.refresh();
}

// Draws onto a fresh canvas texture with a callback (used for backgrounds).
export function makeCanvasTexture(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, w, h);
  draw(tex.getContext(), w, h);
  tex.refresh();
}

// ---- Shared sprites (all 16x16 so the player never changes size) ----

export const PLAYER_RUN_1 = [
  '................',
  '.....hhhhh......',
  '....hhhhhhh.....',
  '....hhsssss.....',
  '....hsosos......',
  '....ssssss......',
  '.....ssss.......',
  '....cccccc......',
  '...cccccccc.....',
  '...sccccccs.....',
  '...s.cccc.s.....',
  '.....pppp.......',
  '....pp..pp......',
  '....pp...pp.....',
  '...pp.....pp....',
  '...oo.....oo....',
];

export const PLAYER_RUN_2 = [
  '................',
  '.....hhhhh......',
  '....hhhhhhh.....',
  '....hhsssss.....',
  '....hsosos......',
  '....ssssss......',
  '.....ssss.......',
  '....cccccc......',
  '...cccccccc.....',
  '...sccccccs.....',
  '....scccc.s.....',
  '.....pppp.......',
  '.....pppp.......',
  '......pp........',
  '.....pp.p.......',
  '.....oo.oo......',
];

export const PLAYER_JUMP = [
  '................',
  '.....hhhhh......',
  '....hhhhhhh.....',
  '....hhsssss.....',
  '....hsosos......',
  '..s.ssssss.s....',
  '..s..ssss..s....',
  '..cccccccccc....',
  '....cccccc......',
  '....cccccc......',
  '.....cccc.......',
  '....pppppp......',
  '...pp....pp.....',
  '...oo....oo.....',
  '................',
  '................',
];

export const PLAYER_SLIDE = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '..........hhhh..',
  '.........hhssss.',
  '..ccccccchhsoso.',
  '.cccccccccsssss.',
  'ppcccccccc......',
  'pppp............',
  'oo..............',
  '................',
];

export const HEART = [
  '.rr.rr.',
  'rrrrrrr',
  'rrrrrrr',
  '.rrrrr.',
  '..rrr..',
  '...r...',
];
