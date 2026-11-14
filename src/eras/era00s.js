// 2005 — the glossy years. Flip phones, pop-up ads, aqua buttons, bubbles.
export default {
  id: '00s',
  year: '2005',
  age: 'Age 28',
  title: 'THE GLOSSY YEARS',
  memory: 'Flip Phone',
  coinName: 'ringtones',
  duration: 90,
  startSpeed: 150,
  endSpeed: 230,
  doubleJump: true,
  scanlines: 0, // no CRT any more — flat panels!

  palette: { bg: '#9fd8ff', text: '#0b3d91', accent: '#39b54a', ground: '#4caf50', line: '#e8fff0' },
  player: { h: '#5a3a1a', s: '#f3c49b', o: '#222222', c: '#222222', p: '#4a6fa5' },

  obstacles: {
    low: {
      name: 'flip phone',
      colors: { o: '#222222', s: '#b0b8c0', b: '#4fc3f7', k: '#555b62', w: '#e0e0e0' },
      rows: [
        '..oooooo..',
        '..osssso..',
        '..osbbso..',
        '..osbbso..',
        '..osssso..',
        '..oooooo..',
        '..okkkko..',
        '..okwkwo..',
        '..okkkko..',
        '..okwkwo..',
        '..okkkko..',
        '..oooooo..',
      ],
    },
    high: {
      name: 'pop-up ad',
      colors: { b: '#1565c0', r: '#e53935', w: '#ffffff', k: '#444444', y: '#ffeb3b', o: '#888888' },
      rows: [
        'bbbbbbbbbbbbbrwr',
        'bbbbbbbbbbbbbrrr',
        'wwwwwwwwwwwwwwww',
        'wkkkkkkkwwwwwwww',
        'wwwwwwwwwwwwwwww',
        'wkkkkwwwwyyyyyyw',
        'wwwwwwwwwyyyyyyw',
        'oooooooooooooooo',
      ],
    },
  },
  coin: {
    colors: { n: '#0b3d91', l: '#4fc3f7' },
    rows: ['...nnn', '...nln', '...n..', '...n..', '.nnn..', 'nlln..', '.nn...'],
  },

  drawSky(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#3a8dde');
    g.addColorStop(1, '#d6f0ff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    // glossy bubbles
    [[50, 40, 14], [150, 70, 9], [230, 35, 18], [290, 90, 8], [100, 110, 6]].forEach(([x, y, r]) => {
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.beginPath(); ctx.arc(x - r / 3, y - r / 3, r / 4, 0, Math.PI * 2); ctx.fill();
    });
  },
  drawGroundTile(ctx, w, h) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#7ed957');
    g.addColorStop(1, '#2e7d32');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(0, 0, w, 2);
  },

  // Pop-punk-ish power riff in D.
  music: {
    bpm: 150,
    lead: { wave: 'sawtooth', vol: 0.04, notes: 'D5 D5 - D5 F#5 - A5 - G5 G5 - G5 F#5 - E5 - D5 D5 - D5 F#5 - A5 - B5 - A5 - F#5 - E5 -'.split(' ') },
    bass: { wave: 'square', vol: 0.07, notes: 'D3 D3 D3 D3 D3 D3 D3 D3 G2 G2 G2 G2 G2 G2 G2 G2 B2 B2 B2 B2 B2 B2 B2 B2 A2 A2 A2 A2 A2 A2 A2 A2'.split(' ') },
  },
};
