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

  // GAMEPLAY: a 4-lane rhythm game (see RhythmScene).
  scene: 'Rhythm',
  hud: '00s',
  songLoops: 12, // loops of the era song before the boss song
  bossLoops: 10,
  controls: {
    device: 'keyboard', // drawn as a keyboard's arrow cluster
    keys: [{ code: 'LEFT', label: '<' }, { code: 'DOWN', label: 'v' }, { code: 'UP', label: '^' }, { code: 'RIGHT', label: '>' }],
    tutorial: 'HIT THE ARROWS ON THE BEAT!',
    required: ['LEFT', 'DOWN', 'UP', 'RIGHT'],
  },
  slang: {
    hit: ['EPIC FAIL!', 'PWNED!', 'OMG!', 'FAIL!'],
    clear: ['LOL!', 'W00T!', 'BLING!', 'OWNED IT!'],
    good: ['LOL!', 'ROFL!', 'BRB... JK!', 'W00T!'],
  },

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

  memoryLine: '3 new texts. 160 characters each.',
  memorySprite: {
    colors: { o: '#222222', s: '#b0b8c0', b: '#4fc3f7', w: '#ffffff', k: '#555b62', a: '#888888' },
    rows: [
      '.........a..',
      '.........a..',
      '..oooooooo..',
      '..osssssso..',
      '..osbbbbso..',
      '..osbwwbso..',
      '..osbbbbso..',
      '..osssssso..',
      '..oooooooo..',
      '...osssso...',
      '..oooooooo..',
      '..okkkkkko..',
      '..okwkwkwo..',
      '..okkkkkko..',
      '..okwkwkwo..',
      '..okkkkkko..',
      '..oooooooo..',
    ],
  },

  boss: {
    name: 'POP-UP KING',
    tagline: 'CONGRATULATIONS! YOU WON!!!',
    duration: 25,
    fireEvery: [1.2, 0.6],
    shotSpeed: 195,
    w: 44,
    h: 40,
    shots: [
      { colors: { b: '#1565c0', r: '#e53935', w: '#ffffff', k: '#444444', y: '#ffeb3b', o: '#888888' }, rows: ['bbbbbbbrwr', 'bbbbbbbrrr', 'wwwwwwwwww', 'wkkkkwwwww', 'wwwwwwwwww', 'wkkwwwyyyw', 'wwwwwwyyyw', 'oooooooooo'] },
      { colors: { r: '#e53935', w: '#ffffff' }, rows: ['.rrrrr.', 'rwrrrwr', 'rrwrwrr', 'rrrwrrr', 'rrwrwrr', 'rwrrrwr', '.rrrrr.'] },
    ],
    // A giant spam window with angry eyes and a "WIN!" banner.
    draw(ctx) {
      const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
      R('#000000', 0, 0, 44, 40);
      R('#1565c0', 1, 1, 42, 7); R('#42a5f5', 1, 1, 42, 2);
      R('#e53935', 35, 2, 6, 5);
      for (let k = 0; k < 3; k++) { R('#ffffff', 36 + k, 3 + k, 1, 1); R('#ffffff', 38 - k, 3 + k, 1, 1); }
      R('#ffffff', 1, 8, 42, 31);
      R('#000000', 9, 12, 6, 2); R('#000000', 29, 12, 6, 2);
      R('#e53935', 11, 14, 3, 3); R('#e53935', 31, 14, 3, 3);
      R('#ffeb3b', 6, 20, 32, 10);
      ctx.fillStyle = '#e53935';
      ctx.font = '8px "Press Start 2P"';
      ctx.fillText('WIN!', 7, 29);
      R('#bdbdbd', 7, 33, 12, 4); R('#bdbdbd', 25, 33, 12, 4);
    },
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
