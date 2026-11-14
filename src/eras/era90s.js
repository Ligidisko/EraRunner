// 1995 — the dial-up years. Floppies, CRT static, loud geometric patterns.
export default {
  id: '90s',
  year: '1995',
  age: 'Age 18',
  title: 'THE DIAL-UP YEARS',
  memory: 'Virtual Pet',
  coinName: 'milk caps',
  duration: 90,
  startSpeed: 130,
  endSpeed: 210,
  doubleJump: true, // new mechanic this era
  scanlines: 0.12,

  // Soundtrack: "Litany to the Datastream Goddess" v1.11 by FoxSynergy, CC-BY 3.0 — see CREDITS.md.
  track: 'music-90s',
  trackFile: 'music/datastream_goddess_v1_11.mp3',

  // GAMEPLAY: a 16-bit side-scrolling platformer you control (see PlatformerScene).
  scene: 'Platformer',
  hud: '90s',
  length: 9000, // px to run before the boss
  ghosts: true, // power orbs make ghosts edible
  springs: true,
  controls: {
    device: 'pad', // drawn as a D-pad controller
    keys: [{ code: 'LEFT', label: '<' }, { code: 'RIGHT', label: '> RUN' }, { code: 'SPACE', label: 'JUMP' }, { code: 'DOWN', label: 'v SPIN' }],
    tutorial: 'HOLD > TO RUN  SPACE JUMP  v SPIN',
    required: ['RIGHT', 'SPACE', 'DOWN'],
  },
  slang: {
    hit: ['NOT!', 'AS IF!', 'TALK TO THE HAND!', 'WHATEVER!'],
    clear: ['DA BOMB!', 'BOOYAH!', 'PHAT!', 'ALL THAT!'],
    good: ['SWEET!', 'BOOYAH!', 'NICE!'],
  },

  palette: { bg: '#1b998b', text: '#fffd82', accent: '#ff9b71', ground: '#2d3047', line: '#e84855' },
  player: { h: '#2b1a0e', s: '#f1b98a', o: '#1a1a1a', c: '#7b2cbf', p: '#3a5a98' },

  obstacles: {
    low: {
      name: 'floppy disk',
      colors: { o: '#111111', b: '#2d3a8c', w: '#dddddd', k: '#555555' },
      rows: [
        'oooooooooooo',
        'obbwwwwwwbbo',
        'obbwwwwkkbbo',
        'obbwwwwkkbbo',
        'obbbbbbbbbbo',
        'obbbbbbbbbbo',
        'obwwwwwwwwbo',
        'obwkkkkkkwbo',
        'obwwwwwwwwbo',
        'obwkkkkkkwbo',
        'obwwwwwwwwbo',
        'oooooooooooo',
      ],
    },
    high: {
      name: 'CRT static',
      colors: { o: '#222222', a: '#aaaaaa', w: '#ffffff', k: '#555555' },
      rows: [
        'oooooooooooooooo',
        'oawkawkwakwaawko',
        'okawwkaakwkawako',
        'owkakwawkaawkwao',
        'oakwakwkawkakwko',
        'okwawkaawkwakawo',
        'oooooooooooooooo',
        '......oooo......',
      ],
    },
  },
  coin: {
    colors: { y: '#ff9b71', w: '#ffffff', d: '#e84855' },
    rows: ['..yyy..', '.ydddy.', 'ydwwwdy', 'ydwdwdy', 'ydwwwdy', '.ydddy.', '..yyy..'],
  },

  memoryLine: 'You kept it alive. Mostly.',
  memorySprite: {
    colors: { o: '#222222', p: '#ff7eb6', k: '#333333', g: '#9bbc0f', w: '#ffffff' },
    rows: [
      '......oooo......',
      '....oppppppo....',
      '...oppppppppo...',
      '..oppkkkkkkppo..',
      '..opkggggggkpo..',
      '..opkgoggogkpo..',
      '..opkggggggkpo..',
      '..opkgoooogkpo..',
      '..opkggggggkpo..',
      '..oppkkkkkkppo..',
      '..oppppppppppo..',
      '..oppwppwppwpo..',
      '...oppppppppo...',
      '....oppppppo....',
      '.....oooooo.....',
    ],
  },

  boss: {
    name: 'THE Y2K BUG',
    tagline: '11:59:59 PM  12/31/1999',
    duration: 25,
    fireEvery: [1.3, 0.65],
    shotSpeed: 180,
    w: 42,
    h: 30,
    shots: [
      { colors: { g: '#39ff14', k: '#000000' }, rows: ['kkkkkkk', 'kkgggkk', 'kgkkkgk', 'kgkkggk', 'kgkgkgk', 'kggkkgk', 'kgkkkgk', 'kkgggkk', 'kkkkkkk'] },
      { colors: { g: '#39ff14', k: '#000000' }, rows: ['kkkkkkk', 'kkkgkkk', 'kkggkkk', 'kkkgkkk', 'kkkgkkk', 'kkkgkkk', 'kkkgkkk', 'kkgggkk', 'kkkkkkk'] },
    ],
    // A beetle whose head is a beige CRT stuck on "00".
    draw(ctx) {
      const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
      ctx.fillStyle = '#000000';
      ctx.beginPath(); ctx.ellipse(30, 16, 11, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2e7d32';
      ctx.beginPath(); ctx.ellipse(30, 16, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      R('#66bb6a', 25, 10, 2, 12); R('#66bb6a', 31, 9, 2, 14); R('#66bb6a', 36, 11, 2, 10);
      for (let i = 0; i < 3; i++) { R('#000000', 23 + i * 6, 23, 1, 6); R('#000000', 22 + i * 6, 28, 3, 1); }
      R('#000000', 4, 0, 1, 5); R('#000000', 15, 0, 1, 5);
      R('#e84855', 3, 0, 3, 2); R('#e84855', 14, 0, 3, 2);
      R('#000000', 0, 4, 20, 18); R('#d8d0b0', 1, 5, 18, 16); R('#111111', 3, 7, 14, 10);
      const g = '#39ff14';
      for (const x of [5, 11]) { R(g, x, 9, 4, 1); R(g, x, 14, 4, 1); R(g, x, 9, 1, 6); R(g, x + 3, 9, 1, 6); }
      R('#a89f80', 7, 21, 6, 2);
    },
  },

  drawSky(ctx, w, h) {
    ctx.fillStyle = '#1b998b';
    ctx.fillRect(0, 0, w, h);
    // loud 90s shapes: squiggles, triangles, dots
    const shapes = [
      [30, 30, '#fffd82'], [110, 55, '#ff9b71'], [200, 25, '#e84855'],
      [270, 70, '#fffd82'], [70, 95, '#e84855'], [240, 110, '#ff9b71'],
    ];
    shapes.forEach(([x, y, c], i) => {
      ctx.fillStyle = c;
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y); ctx.lineTo(x + 14, y + 4); ctx.lineTo(x + 4, y + 14);
        ctx.fill();
      } else if (i % 3 === 1) {
        for (let k = 0; k < 4; k++) ctx.fillRect(x + k * 6, y + (k % 2) * 4, 6, 3);
      } else {
        ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
      }
    });
  },
  drawGroundTile(ctx, w, h) {
    for (let y = 0; y < h; y += 8)
      for (let x = 0; x < w; x += 8) {
        ctx.fillStyle = ((x + y) / 8) % 2 ? '#2d3047' : '#3e4360';
        ctx.fillRect(x, y, 8, 8);
      }
    ctx.fillStyle = '#e84855';
    ctx.fillRect(0, 0, w, 2);
  },

  // Bouncy C major pop.
  music: {
    bpm: 132,
    lead: { wave: 'square', vol: 0.06, notes: 'C5 - E5 G5 - E5 C5 - D5 - F5 A5 - F5 D5 - E5 - G5 B5 - G5 E5 - F5 E5 D5 C5 - - - -'.split(' ') },
    bass: { wave: 'triangle', vol: 0.12, notes: 'C3 C3 - C3 G2 - C3 - D3 D3 - D3 A2 - D3 - E3 E3 - E3 B2 - E3 - F3 - G3 - C3 - - -'.split(' ') },
  },
};
