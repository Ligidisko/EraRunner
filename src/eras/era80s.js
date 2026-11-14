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
