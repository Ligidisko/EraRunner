// 2005 — THE GLOSSY YEARS. A 4-lane rhythm game: arrows fall to the beat of
// the era's song; hit <- v ^ -> as they reach the targets. PERFECT / GREAT /
// GOOD / MISS, a combo multiplier, and a phone "signal bar" health meter.
// The second song is the POP-UP KING boss: every miss lets a pop-up hit you.
// Notes are timed against the audio clock, so they stay in sync with the music.
import Phaser from 'phaser';
import { GAME_W, GAME_H, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { state, addScore } from '../state.js';
import { playMusic, stopMusic, audioNow, sfx } from '../audio/audio.js';
import { onKeyPress } from '../systems/keys.js';
import { makeFx } from '../systems/fx.js';
import Hud from '../systems/hud.js';
import { loseLife, revealMemory, slang } from '../systems/reveal.js';

const LANE_X = [118, 146, 174, 202];
const LANE_ANGLE = [-90, 180, 0, 90]; // <- v ^ ->
const LANE_COLOR = [0xff71ce, 0x4fc3f7, 0x7ed957, 0xffeb3b];
const TARGET_Y = 150;
const LEAD = 1.4; // seconds a note is visible before it should be hit
const SPAWN_Y = -10;
const WINDOWS = [
  { name: 'PERFECT', t: 0.05, pts: 100, color: '#ffeb3b' },
  { name: 'GREAT', t: 0.1, pts: 70, color: '#7ed957' },
  { name: 'GOOD', t: 0.16, pts: 40, color: '#4fc3f7' },
];
const MAX_SIGNAL = 5;

export default class RhythmScene extends Phaser.Scene {
  constructor() { super('Rhythm'); }

  create() {
    this.era = ERAS.find((e) => e.scene === 'Rhythm');
    this.fx = makeFx(this, '#ffffff');
    this.combo = 0;
    this.perfectRun = 0;
    this.signal = MAX_SIGNAL;
    this.phase = 'intro';
    this.notes = [];

    // --- Stage ---
    this.cameras.main.setBackgroundColor(this.era.palette.bg);
    this.add.image(0, 0, `sky-${this.era.id}`).setOrigin(0);
    this.add.rectangle(0, 150, GAME_W, 30, 0x2e7d32).setOrigin(0);
    this.add.rectangle(0, 150, GAME_W, 2, 0xffffff, 0.6).setOrigin(0);
    // Equalizer bars pulse behind the lanes.
    this.eq = [];
    for (let i = 0; i < 16; i++) this.eq.push(this.add.rectangle(8 + i * 20, 150, 14, 10, 0xffffff, 0.18).setOrigin(0, 1));
    this.add.rectangle(LANE_X[0] - 14, 0, LANE_X[3] - LANE_X[0] + 28, GAME_H, 0x0b1e3a, 0.55).setOrigin(0);

    this.targets = LANE_X.map((x, i) => this.add.image(x, TARGET_Y, 'arrow-slot').setAngle(LANE_ANGLE[i]).setDepth(5));

    // The dancer: your kid, now 28, busting moves on the left.
    this.dancer = this.add.image(54, 150, `player-${this.era.id}-run1`).setOrigin(0.5, 1).setScale(2).setDepth(6);
    if (state.cheats.bighead) this.head = this.add.image(54, 134, 'bighead').setOrigin(0.5, 1).setScale(2).setDepth(7);

    this.ratingText = this.add.text(GAME_W / 2, 92, '', textStyle(8, '#ffffff', true)).setOrigin(0.5).setDepth(20);
    this.comboText = this.add.text(GAME_W / 2, 104, '', textStyle(8, '#ffffff', true)).setOrigin(0.5).setDepth(20);

    // Phone signal bars = your health.
    this.add.text(GAME_W - 46, 20, 'SIGNAL', textStyle(8, '#0b3d91')).setDepth(20).setOrigin(0.5, 0);
    this.bars = [];
    for (let i = 0; i < MAX_SIGNAL; i++) this.bars.push(this.add.rectangle(GAME_W - 62 + i * 7, 46, 5, 4 + i * 3, 0x0b3d91).setOrigin(0, 1).setDepth(20));

    this.hud = new Hud(this, '00s', { extraLabel: 'COMBO ' });

    // Input: arrows (or D F J K, like PC rhythm games).
    const lanesFor = { LEFT: 0, DOWN: 1, UP: 2, RIGHT: 3, D: 0, F: 1, J: 2, K: 3 };
    onKeyPress(this, (e) => {
      const name = Object.keys(lanesFor).find((k) => Phaser.Input.Keyboard.KeyCodes[k] === e.keyCode);
      if (name !== undefined) this.press(lanesFor[name]);
      if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.N && state.cheats.god && this.phase !== 'reveal') this.finish();
    });
    this.events.once('shutdown', stopMusic);

    this.startSong('main');
  }

  // ---------- Songs + charts ----------

  startSong(kind) {
    const boss = kind === 'boss';
    const song = boss ? { ...this.era.music, bpm: this.era.music.bpm * 1.12 } : this.era.music;
    const loops = boss ? this.era.bossLoops : this.era.songLoops;
    const info = playMusic(song, 2.0); // 2s lead-in so the first notes can fall
    this.songStart = info.start;
    this.chart = this.makeChart(song, info, loops, boss);
    this.chartIndex = 0;
    this.songEnd = this.chart.length ? this.chart[this.chart.length - 1].time + 1.2 : info.start + 5;
    this.phase = kind;
    this.beat = info.stepDur * 4;
    this.lastBeat = -1;
    this.countIn();
  }

  // Notes follow the lead melody; density ramps up loop by loop.
  makeChart(song, info, loops, boss) {
    const notes = [];
    const lead = song.lead.notes;
    for (let loop = 0; loop < loops; loop++) {
      const every = boss ? (loop < 2 ? 2 : 1) : loop < 2 ? 4 : loop < 6 ? 2 : 2;
      for (let s = 0; s < info.length; s++) {
        const n = lead[s % lead.length];
        if (n === '-' || s % every !== 0) continue;
        if (every === 1 && s % 2 === 1 && Math.random() < 0.5) continue;
        const time = info.start + (loop * info.length + s) * info.stepDur;
        const lane = ([...n].reduce((a, c) => a + c.charCodeAt(0), 0) + Math.floor(s / 4)) % 4;
        notes.push({ time, lane });
        // Occasional two-arrow "jumps" late in the song.
        if (loop >= 6 && s % 8 === 0 && Math.random() < 0.35) notes.push({ time, lane: (lane + 2) % 4 });
      }
    }
    return notes;
  }

  countIn() {
    ['3', '2', '1', 'GO!'].forEach((txt, i) => {
      this.time.delayedCall(i * 450, () => {
        const t = this.add.text(GAME_W / 2, 70, txt, textStyle(16, '#ffffff', true)).setOrigin(0.5).setDepth(30);
        this.tweens.add({ targets: t, scale: 1.6, alpha: 0, duration: 420, onComplete: () => t.destroy() });
        sfx.click();
      });
    });
  }

  // ---------- Loop ----------

  update() {
    if (this.phase === 'reveal' || this.phase === 'between') { this.hud.update(); return; }
    const now = audioNow();

    // Spawn notes that are about to become visible.
    while (this.chartIndex < this.chart.length && this.chart[this.chartIndex].time - now <= LEAD) {
      const n = this.chart[this.chartIndex++];
      n.img = this.add.image(LANE_X[n.lane], SPAWN_Y, 'arrow').setAngle(LANE_ANGLE[n.lane]).setTint(LANE_COLOR[n.lane]).setDepth(10);
      this.notes.push(n);
    }

    // Move notes by the audio clock; anything too late is a MISS.
    for (const n of [...this.notes]) {
      const p = 1 - (n.time - now) / LEAD;
      n.img.y = SPAWN_Y + (TARGET_Y - SPAWN_Y) * p;
      if (now - n.time > WINDOWS[2].t) this.miss(n);
    }

    // Equalizer + dancer bounce on each beat.
    const beatNum = Math.floor((now - this.songStart) / this.beat);
    if (beatNum !== this.lastBeat && now >= this.songStart) {
      this.lastBeat = beatNum;
      for (const b of this.eq) b.height = Phaser.Math.Between(6, 46);
      this.tweens.add({ targets: this.dancer, scaleY: 1.8, duration: 80, yoyo: true });
    }

    if (now > this.songEnd && this.notes.length === 0) this.songFinished();
    this.hud.update(this.combo);
  }

  press(lane) {
    if (this.phase !== 'main' && this.phase !== 'boss') return;
    const now = audioNow();
    this.targets[lane].setTint(LANE_COLOR[lane]);
    this.time.delayedCall(90, () => this.targets[lane].clearTint());

    const candidates = this.notes.filter((n) => n.lane === lane && Math.abs(n.time - now) <= WINDOWS[2].t);
    if (!candidates.length) return; // pressing on nothing is free — no penalty
    const note = candidates.sort((a, b) => a.time - b.time)[0];
    const err = Math.abs(note.time - now);
    const win = WINDOWS.find((w) => err <= w.t);

    this.removeNote(note);
    this.combo++;
    const mult = Math.min(4, 1 + Math.floor(this.combo / 10));
    addScore(win.pts * mult);
    this.rate(win.name, win.color);
    this.fx.sparkle(LANE_X[lane], TARGET_Y, win.name === 'PERFECT' ? 10 : 5);
    this.dance();

    if (win.name === 'PERFECT' && ++this.perfectRun % 4 === 0) this.setSignal(this.signal + 1);
    if (win.name !== 'PERFECT') this.perfectRun = 0;
    if (this.combo % 25 === 0) slang(this, this.era, 'good', '#ffeb3b');
    if (this.phase === 'boss') this.hurtBoss();
  }

  miss(note) {
    this.removeNote(note);
    if (this.combo >= 10) slang(this, this.era, 'hit', '#ff3355');
    this.combo = 0;
    this.perfectRun = 0;
    this.rate('MISS', '#ff3355');
    sfx.miss();
    if (this.phase === 'boss') this.popupAttack();
    if (!state.cheats.god) this.setSignal(this.signal - 1);
  }

  removeNote(note) {
    note.img.destroy();
    this.notes.splice(this.notes.indexOf(note), 1);
  }

  rate(name, color) {
    this.ratingText.setText(name).setColor(color).setScale(1.4);
    this.tweens.add({ targets: this.ratingText, scale: 1, duration: 120 });
    this.comboText.setText(this.combo >= 2 ? `${this.combo} COMBO` : '');
  }

  dance() {
    const frames = ['run1', 'run2', 'jump', 'slide'];
    this.dancer.setTexture(`player-${this.era.id}-${Phaser.Utils.Array.GetRandom(frames)}`);
    this.dancer.setFlipX(Math.random() < 0.5);
  }

  setSignal(v) {
    this.signal = Phaser.Math.Clamp(v, 0, MAX_SIGNAL);
    this.bars.forEach((b, i) => b.setFillStyle(i < this.signal ? 0x0b3d91 : 0x9fb8d6));
    if (this.signal === 0) {
      // Dropped call! Lose a life, signal comes back.
      this.cameras.main.shake(200, 0.015);
      sfx.hit();
      loseLife(this, this.era, () => this.setSignal(MAX_SIGNAL));
      if (state.lives <= 0) { this.phase = 'between'; for (const n of [...this.notes]) this.removeNote(n); }
    }
  }

  // ---------- Boss: POP-UP KING ----------

  songFinished() {
    if (this.phase === 'main') {
      this.phase = 'between';
      stopMusic();
      slang(this, this.era, 'clear', '#ffeb3b');
      this.time.delayedCall(1200, () => {
        this.boss = this.add.image(GAME_W - 46, 108, `boss-${this.era.id}`).setScale(1.3).setDepth(8).setAlpha(0);
        this.tweens.add({ targets: this.boss, alpha: 1, y: 100, duration: 600, ease: 'Back.Out' });
        this.fx.banner(this.era.boss.name, '#e53935', this.era.boss.tagline);
        this.bossHits = 0;
        this.time.delayedCall(1600, () => {
          this.startSong('boss');
          this.bossTotal = this.chart.length;
          this.bossBarBg = this.add.rectangle(GAME_W - 70, 70, 48, 3, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(20);
          this.bossBar = this.add.rectangle(GAME_W - 70, 70, 48, 3, 0xe53935).setOrigin(0, 0.5).setDepth(21);
        });
      });
    } else if (this.phase === 'boss') {
      this.phase = 'reveal';
      stopMusic();
      sfx.bossDown();
      this.cameras.main.flash(250, 255, 255, 255);
      this.tweens.add({ targets: this.boss, alpha: 0, angle: 20, y: 160, duration: 1000 });
      addScore(1000);
      this.time.delayedCall(1100, () => revealMemory(this, this.era));
    }
  }

  hurtBoss() {
    this.bossHits++;
    if (this.bossBar) this.bossBar.width = 48 * Math.max(0, 1 - this.bossHits / this.bossTotal);
    this.boss.setTintFill(0xffffff);
    this.time.delayedCall(50, () => this.boss.clearTint());
  }

  // A mini pop-up window flies from the boss at the dancer.
  popupAttack() {
    const p = this.add.image(this.boss.x, this.boss.y, `shot-${this.era.id}-0`).setDepth(15).setScale(1.5);
    this.tweens.add({
      targets: p, x: this.dancer.x, y: this.dancer.y - 20, duration: 350, ease: 'Quad.In',
      onComplete: () => { this.fx.sparkle(p.x, p.y, 8); p.destroy(); },
    });
  }

  finish() {
    for (const n of [...this.notes]) this.removeNote(n);
    this.chartIndex = this.chart.length;
    this.phase = 'reveal';
    stopMusic();
    revealMemory(this, this.era);
  }
}
