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
