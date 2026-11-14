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

// Generic bedsheet ghost (80s enemy). Recoloured blue when you have a power orb.
export const GHOST = [
  '....oooo....',
  '..oowwwwoo..',
  '.owwwwwwwwo.',
  '.owwkwwkwwo.',
  'owwwkwwkwwwo',
  'owwwwwwwwwwo',
  'owwwwwwwwwwo',
  'owwkwkwkwwwo',
  'owwwwwwwwwwo',
  'owwwwwwwwwwo',
  'owowwowwowwo',
  'o.oo.oo.oo.o',
];
export const GHOST_COLORS = { o: '#2a0a4a', w: '#ff71ce', k: '#ffffff' };
export const GHOST_SCARED_COLORS = { o: '#000033', w: '#2b4cff', k: '#ffffff' };

export const ORB = [
  '...yyy...',
  '.yywwwyy.',
  '.ywwwwwy.',
  'ywwwwwwwy',
  'ywwwwwwwy',
  'ywwwwwwwy',
  '.ywwwwwy.',
  '.yywwwyy.',
  '...yyy...',
];
export const ORB_COLORS = { y: '#ffd93b', w: '#fffbe0' };

// The shot you fire at a boss after grabbing an orb.
export const PLAYER_SHOT = ['..yyyy..', 'yywwwwyy', 'yywwwwyy', '..yyyy..'];

// ---- 80s shooter ----
export const SHIP = [
  '......o......',
  '.....ooo.....',
  '.....ooo.....',
  '.ooooooooooo.',
  'ooooooooooooo',
  'oooowwwwwoooo',
  'ooooooooooooo',
  'oo.........oo',
];
// Original alien designs (not copies of any game's sprites), two frames each.
export const ALIENS = {
  squid: [
    ['...ooooo...', '.ooooooooo.', 'oo.ooooo.oo', 'ooooooooooo', '..oo...oo..', '.oo.ooo.oo.', 'oo.......oo', '...........'],
    ['...ooooo...', '.ooooooooo.', 'oo.ooooo.oo', 'ooooooooooo', '..oo...oo..', '..oo.o.oo..', '.oo.....oo.', '...........'],
  ],
  tape: [ // a cassette with legs
    ['ooooooooooo', 'oo.ooooo.oo', 'o.o.ooo.o.o', 'oo.ooooo.oo', 'ooooooooooo', '.o.......o.', 'o.o.....o.o', '...........'],
    ['ooooooooooo', 'oo.ooooo.oo', 'o.o.ooo.o.o', 'oo.ooooo.oo', 'ooooooooooo', '..o.....o..', '.o.o...o.o.', '...........'],
  ],
  vhs: [ // a video tape with legs
    ['ooooooooooo', 'o.ooo.ooo.o', 'ooooooooooo', 'oo.o.o.o.oo', 'ooooooooooo', '..o.....o..', '.o.......o.', '...........'],
    ['ooooooooooo', 'o.ooo.ooo.o', 'ooooooooooo', 'oo.o.o.o.oo', 'ooooooooooo', '...o...o...', '..o.....o..', '...........'],
  ],
};
// A flying boombox: the bonus "mystery ship".
export const BOOMBOX = [
  '....kkkkkkkk....',
  '...k........k...',
  'kkkkkkkkkkkkkkkk',
  'kwwwkooooookwwwk',
  'kwkwkoyyyyokwkwk',
  'kwwwkooooookwwwk',
  'kkkkkkkkkkkkkkkk',
];
export const BOOMBOX_COLORS = { k: '#222222', w: '#ff71ce', o: '#c0c0c0', y: '#05d9e8' };

// ---- 90s platformer ----
export const SPRING = [
  'oooooooooooo',
  'orrrrrrrrrro',
  'oooooooooooo',
  '..o......o..',
  '...o....o...',
  '..o......o..',
  '...o....o...',
  'oooooooooooo',
];
export const SPRING_COLORS = { o: '#777777', r: '#e84855' };

// ---- 00s rhythm: one arrow pointing up, rotated per lane and tinted ----
export const ARROW = [
  '.....oo.....',
  '....owwo....',
  '...owwwwo...',
  '..owwwwwwo..',
  '.owwwwwwwwo.',
  'oooowwwwoooo',
  '...owwwwo...',
  '...owwwwo...',
  '...owwwwo...',
  '...owwwwo...',
  '...oooooo...',
];

// Small icon for lives in reserve (90s / 00s HUDs).
export const LIFE = ['.hhh.', 'hssh.', 'sosos', 'sssss', '.sss.'];

// Big-head cheat: an oversized head drawn over the player.
export const BIG_HEAD = [
  '....hhhhhh....',
  '..hhhhhhhhhh..',
  '.hhhhhhhhhhhh.',
  '.hhssssssssh..',
  'hhsssssssssss.',
  'hssoossssoosss',
  'hssoossssoosss',
  'hsssssssssssss',
  '.sssssooossss.',
  '.ssssssssssss.',
  '..ssssssssss..',
  '....ssssss....',
];

export const HEART = [
  '.rr.rr.',
  'rrrrrrr',
  'rrrrrrr',
  '.rrrrr.',
  '..rrr..',
  '...r...',
];
