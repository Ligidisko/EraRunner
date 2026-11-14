// 1985 — the arcade years. Neon, synthwave sunsets, cassettes, colour cubes.
export default {
  id: '80s',
  year: '1985',
  age: 'Age 8',
  title: 'THE ARCADE YEARS',
  memory: 'Cassette Player',
  coinName: 'quarters',
  duration: 90, // seconds of running before the era ends (boss goes here later)
  startSpeed: 110,
  endSpeed: 190,
  doubleJump: false,
  scanlines: 0.25, // CRT scanline strength (art gets "cleaner" each era)
  skyScroll: 0, // the synthwave sun stays put

  palette: { bg: '#14002b', text: '#ff71ce', accent: '#05d9e8', ground: '#2a0a4a', line: '#ff2a6d' },
  player: { h: '#3b1f0f', s: '#f5c08a', o: '#1a1a1a', c: '#ff2a6d', p: '#05d9e8' },

  // Obstacles: 'low' sits on the ground (jump it), 'high' floats (slide under it).
  obstacles: {
    low: {
      name: 'colour cube',
      colors: { o: '#111111', r: '#ff3b3b', y: '#ffd93b', b: '#3b7bff', g: '#3bff6e', w: '#ffffff' },
      rows: [
        'ooooooooooooo',
        'orrroyyyobbbo',
        'orrroyyyobbbo',
        'orrroyyyobbbo',
        'ooooooooooooo',
        'ogggowwwoyyyo',
        'ogggowwwoyyyo',
        'ogggowwwoyyyo',
        'ooooooooooooo',
        'obbborrrogggo',
        'obbborrrogggo',
        'obbborrrogggo',
        'ooooooooooooo',
      ],
    },
    high: {
      name: 'cassette tape',
      colors: { o: '#111111', p: '#ff71ce', w: '#eeeeee', k: '#333333', t: '#6b3a1e' },
      rows: [
        'oooooooooooooooo',
        'oppppppppppppppo',
        'opwwwwwwwwwwwwpo',
        'opwkkwwwwwwkkwpo',
        'opwkkwwwwwwkkwpo',
        'opwwwwwwwwwwwwpo',
        'oppppkkkkkkppppo',
        'oooooooooooooooo',
      ],
    },
  },
  coin: {
    colors: { y: '#c0c0c0', w: '#ffffff', d: '#808080' },
    rows: ['..yyy..', '.yyyyy.', 'yywyyyy', 'yyyyyyd', 'yyyyyyd', '.yyyyd.', '..ddd..'],
  },

  // Era mechanic: ghosts fly at you; grab a power orb and they turn blue — stomp them for points.
  ghosts: true,

  memoryLine: 'Side A. Rewound with a pencil.',
  memorySprite: {
    colors: { h: '#222222', o: '#111111', b: '#c0392b', w: '#f0e6d2', k: '#333333', s: '#d0d0d0' },
    rows: [
      '...hhhhhhhhhh...',
      '..h..........h..',
      '..h..........h..',
      '.hhh........hhh.',
      '.hhh........hhh.',
      '......h.........',
      '.oooooooooooooo.',
      '.obbbbbbbbbbbbo.',
      '.obwwwwwwwwwwbo.',
      '.obwkkwwwwkkwbo.',
      '.obwkkwwwwkkwbo.',
      '.obwwwwwwwwwwbo.',
      '.obbbbbbbbbbbbo.',
      '.obsbsbsbbbbbbo.',
      '.obbbbbbbbbbbbo.',
      '.oooooooooooooo.',
    ],
  },

  boss: {
    name: 'THE CABINET',
    tagline: 'INSERT COIN',
    duration: 25, // seconds to survive (grabbing orbs shortens it)
    fireEvery: [1.5, 0.75], // seconds between attacks, start -> end of fight
    shotSpeed: 165,
    w: 32,
    h: 48,
    shots: [
      { colors: { m: '#ff2a6d', w: '#ffd1e3' }, rows: ['mmmmmm', 'mwwwwm', 'mwwwwm', 'mwwwwm', 'mwwwwm', 'mmmmmm'] },
      { colors: { m: '#05d9e8', w: '#d6fbff' }, rows: ['mmmmmm', 'mwwwwm', 'mwwwwm', 'mwwwwm', 'mwwwwm', 'mmmmmm'] },
    ],
    // An angry arcade cabinet: marquee, glaring screen, joystick, coin door.
    draw(ctx) {
      const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
      R('#000000', 1, 0, 30, 48);
      R('#3d1466', 2, 1, 28, 46);
      R('#ffd93b', 2, 1, 28, 7);
      for (let x = 4; x < 28; x += 6) R('#ff2a6d', x, 3, 3, 3);
      R('#111111', 4, 10, 24, 16);
      R('#001a33', 6, 12, 20, 12);
      R('#ff2a6d', 8, 13, 2, 1); R('#ff2a6d', 10, 14, 3, 1); // angry brows
      R('#ff2a6d', 22, 13, 2, 1); R('#ff2a6d', 19, 14, 3, 1);
      R('#ff2a6d', 9, 16, 4, 3); R('#ff2a6d', 19, 16, 4, 3); // eyes
      R('#ffffff', 11, 21, 10, 2); // teeth
      R('#5a2a8a', 0, 27, 32, 6);
      R('#000000', 0, 27, 32, 1);
      R('#cccccc', 8, 25, 1, 4); R('#ff3b3b', 7, 23, 3, 3); // joystick
      R('#ffd93b', 16, 29, 3, 2); R('#05d9e8', 21, 29, 3, 2); R('#3bff6e', 26, 29, 3, 2);
      R('#2a0a4a', 4, 33, 24, 14);
      R('#888888', 12, 37, 8, 7); R('#111111', 15, 39, 2, 3); // coin door
    },
  },

  // Background: purple sky, striped synthwave sun, neon grid floor.
  drawSky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#14002b');
    g.addColorStop(0.6, '#6a0d5b');
    g.addColorStop(1, '#ff6c6c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // sun
    ctx.fillStyle = '#ffd93b';
    ctx.beginPath();
    ctx.arc(w / 2, 120, 40, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#6a0d5b';
    for (let y = 92; y < 120; y += 6) ctx.fillRect(w / 2 - 40, y, 80, 2);
  },
  drawGroundTile(ctx, w, h) {
    ctx.fillStyle = '#2a0a4a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff2a6d';
    ctx.fillRect(0, 0, w, 1);
    for (let y = 6; y < h; y += 8) ctx.fillRect(0, y, w, 1);
    ctx.fillRect(0, 0, 1, h);
  },

  // 16 steps per bar, 2 bars. '-' = rest. Synthwave arpeggio in A minor.
  music: {
    bpm: 118,
    lead: { wave: 'square', vol: 0.06, notes: 'A4 C5 E5 A5 E5 C5 A4 C5 F4 A4 C5 F5 C5 A4 F4 A4 G4 B4 D5 G5 D5 B4 G4 B4 E4 G4 B4 E5 B4 G4 E4 G4'.split(' ') },
    bass: { wave: 'triangle', vol: 0.12, notes: 'A2 - A2 - A2 - A2 - F2 - F2 - F2 - F2 - G2 - G2 - G2 - G2 - E2 - E2 - E2 - E2 -'.split(' ') },
  },
};
