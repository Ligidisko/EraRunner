// The 1995 level, built from hand-made chunks so it's easy to edit.
// The world is 22 tiles tall (2 screens); row 0 is the top, row 21 the bottom.
// Ground (rows 20-21) is generated from each chunk's width, minus its pits.
//
// Legend:  B bonus block (bump from below)   - one-way platform (jump up through)
//          # solid block   c milk cap   g ghost (patrols)   s spring
//          o power orb     x floppy hazard   E SAVE sign (level exit)
export const TILE = 16;
export const ROWS = 22;
export const GROUND_ROW = 20;

const CHUNKS = [
  { // Start: learn to run, jump, bump blocks
    w: 26,
    rows: {
      15: '          c  c  c',
      16: '         B  BBB  B',
      19: '    c c c         g',
    },
  },
  { // Two small pits with cap arcs showing the jump
    w: 24,
    rows: {
      15: '            ccc',
      16: '           -----',
      18: '       ccc      ccc',
      19: '              g     x',
    },
    pits: [[7, 9], [16, 18]],
  },
  { // The tower: climb one-way platforms to the top of the world
    w: 24,
    rows: {
      2: '        cccccc',
      3: '       --------',
      5: '   c                c',
      6: '  ----            ----',
      8: '        ccc',
      9: '       -----',
      11: '  c               c',
      12: ' ----            ----',
      14: '        ccc',
      15: '       -----     g',
      17: '  ----        ----',
      19: '   s',
    },
  },
  { // Stairs, bonus blocks, a ghost on top
    w: 24,
    rows: {
      12: '                 cccc',
      15: '          ccc',
      16: '    BBB      #',
      17: '            ##',
      18: '           ###      g',
      19: '    g     ####  x',
    },
  },
  { // Power orb, then a parade of ghosts to eat
    w: 26,
    rows: {
      16: '       o',
      17: '      ---',
      19: '  c c c c  g   g   g   g',
    },
  },
  { // The big pit: climb across on platforms (or take the spring)
    w: 24,
    rows: {
      8: '             cccc',
      9: '            ------',
      11: '           --',
      13: '        ---',
      16: '    ---',
      18: '   --',
      19: '  s',
    },
    pits: [[6, 17]],
  },
  { // The exit
    w: 22,
    rows: {
      19: '   c c c        E',
    },
  },
];

// One flat screen after the exit for the boss fight.
export const ARENA_COLS = 20;

// Builds the full grid: an array of ROWS strings, each the level's width.
export function buildLevel() {
  const width = CHUNKS.reduce((s, c) => s + c.w, 0) + ARENA_COLS;
  const grid = Array.from({ length: ROWS }, () => Array(width).fill(' '));
  let x0 = 0;
  for (const chunk of CHUNKS) {
    for (const [row, line] of Object.entries(chunk.rows)) {
      [...line].forEach((ch, i) => { if (ch !== ' ' && i < chunk.w) grid[row][x0 + i] = ch; });
    }
    for (let i = 0; i < chunk.w; i++) {
      const inPit = (chunk.pits || []).some(([a, b]) => i >= a && i <= b);
      if (!inPit) { grid[GROUND_ROW][x0 + i] = '#'; grid[GROUND_ROW + 1][x0 + i] = '#'; }
    }
    x0 += chunk.w;
  }
  const arenaCol = x0;
  for (let i = 0; i < ARENA_COLS; i++) { grid[GROUND_ROW][x0 + i] = '#'; grid[GROUND_ROW + 1][x0 + i] = '#'; }
  return { grid, width, arenaCol };
}
