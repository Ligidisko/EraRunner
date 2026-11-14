// Attract mode, like an arcade cabinet sitting in a pizza parlour:
// the title cycles through panels (title, high scores, the three decades)
// and then a self-playing DEMO. Press C to insert a coin, SPACE to start.
// Type a cheat word at any time: NOSTALGIA (god mode + N skips eras), BIGHEAD.
// First start of the session: the cartridge "won't load" — blow on it (B).
import Phaser from 'phaser';
import { GAME_W, GAME_H, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { initAudio, stopMusic, sfx } from '../audio/audio.js';
import { onKeyPress } from '../systems/keys.js';
import { state, newRun, pad } from '../state.js';
import { getScores } from '../save.js';

const CHEATS = {
  NOSTALGIA: () => { state.cheats.god = true; return 'GOD MODE ON  [N] SKIPS ERAS'; },
  BIGHEAD: () => { state.cheats.bighead = !state.cheats.bighead; return state.cheats.bighead ? 'BIG HEAD MODE!' : 'BIG HEAD OFF'; },
};
const PANEL_TIME = 5000;

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  // data.showScores: open on the high-score panel; data.highlight: rank to flash
  create(data = {}) {
    stopMusic();
    this.cameras.main.setBackgroundColor('#000000');
    this.typed = '';
    this.blowing = false;
    this.panelIndex = data.showScores ? 1 : 0;
    this.highlight = data.highlight ?? -1;
    this.panel = this.add.container(0, 0);
    this.add.image(0, 0, 'scanlines').setOrigin(0).setAlpha(0.25).setDepth(50);

    this.coinText = this.add.text(GAME_W / 2, 156, '', textStyle(8, '#ffd93b')).setOrigin(0.5);
    this.tweens.add({ targets: this.coinText, alpha: 0.2, duration: 450, yoyo: true, repeat: -1 });
    this.creditText = this.add.text(GAME_W - 6, GAME_H - 10, '', textStyle(8, '#ffffff')).setOrigin(1, 0);
    this.add.text(6, GAME_H - 10, '(C) 1985-2005', textStyle(8, '#555555'));

    this.showPanel();
    this.panelTimer = this.time.addEvent({ delay: PANEL_TIME, loop: true, callback: () => this.nextPanel() });

    onKeyPress(this, (e) => this.onKey(e));
    this.refreshCoinText();
  }

  // ---------- Attract panels ----------

  nextPanel() {
    if (this.blowing) return;
    this.panelIndex++;
    if (this.panelIndex > 2) { this.scene.start('Shooter', { demo: true }); return; }
    this.showPanel();
  }

  showPanel() {
    this.panel.removeAll(true);
    const cx = GAME_W / 2;
    const T = (x, y, s, size, color) => this.panel.add(this.add.text(x, y, s, textStyle(size, color, true)).setOrigin(0.5));
    if (this.panelIndex === 0) {
      const title = T(cx, 40, 'ERA RUNNER', 24, '#ff71ce');
      this.tweens.addCounter({ from: 0, to: 360, duration: 3000, repeat: -1, onUpdate: (tw) => {
        if (!title.active) return;
        const c = Phaser.Display.Color.HSVToRGB(tw.getValue() / 360, 0.6, 1);
        title.setColor(Phaser.Display.Color.RGBToString(c.r, c.g, c.b));
      } });
      T(cx, 64, 'THE EVOLUTION OF GAMES', 8, '#05d9e8');
      T(cx, 88, '1985  ARCADE', 8, '#ffffff');
      T(cx, 100, '1995  CONSOLE', 8, '#ffffff');
      T(cx, 112, '2005  PC + MALL', 8, '#ffffff');
      T(cx, 134, 'COMING SOON: THE 70s & 10s', 8, '#666666');
    } else if (this.panelIndex === 1) {
      T(cx, 14, 'HIGH SCORES', 16, '#ffd93b');
      getScores().forEach((e, i) => {
        const color = i === this.highlight ? '#ff71ce' : ['#ffffff', '#05d9e8', '#3bff6e'][i % 3];
        const line = T(cx, 36 + i * 11, `${String(i + 1).padStart(2, ' ')}.  ${e.name}  ${pad(e.score)}`, 8, color);
        if (i === this.highlight) this.tweens.add({ targets: line, alpha: 0.3, duration: 250, yoyo: true, repeat: -1 });
      });
    } else {
      T(cx, 16, 'COLLECT YOUR MEMORIES', 8, '#ffd93b');
      ERAS.forEach((era, i) => {
        const x = 70 + i * 90;
        this.panel.add(this.add.image(x, 80, `memory-${era.id}`).setScale(3));
        T(x, 112, era.year, 8, era.palette.text === '#0b3d91' ? '#4fc3f7' : era.palette.text);
        T(x, 124, era.memory.toUpperCase().split(' ')[0], 8, '#ffffff');
      });
    }
  }

  refreshCoinText() {
    this.creditText.setText(`CREDIT ${state.credits}`);
    this.coinText.setText(state.credits > 0 ? 'PRESS SPACE TO START' : 'INSERT COIN  [C]');
  }

  // ---------- Input ----------

  onKey(e) {
    initAudio(); // any key unlocks browser audio
    const K = Phaser.Input.Keyboard.KeyCodes;
    if (this.blowing) {
      if (e.keyCode === K.B) this.blowCartridge();
      return;
    }

    // Cheat words: type them anywhere on the title screen.
    if (e.key && /^[a-z]$/i.test(e.key)) {
      this.typed = (this.typed + e.key.toUpperCase()).slice(-12);
      for (const [word, apply] of Object.entries(CHEATS)) {
        if (this.typed.endsWith(word)) { this.typed = ''; this.flash(apply()); sfx.cheat(); return; }
      }
    }

    if (e.keyCode === K.C) {
      state.credits++;
      sfx.coinInsert();
      this.refreshCoinText();
    } else if (e.keyCode === K.SPACE || e.keyCode === K.ENTER) {
      if (state.credits > 0) this.start();
      else { this.flash('INSERT COIN FIRST!  PRESS C'); sfx.miss(); }
    }
  }

  flash(msg) {
    const t = this.add.text(GAME_W / 2, 144, msg, textStyle(8, '#ff3355', true)).setOrigin(0.5).setDepth(60);
    this.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 400, onComplete: () => t.destroy() });
  }

  start() {
    state.credits--;
    this.refreshCoinText();
    newRun();
    sfx.select();
    if (!state.cartridgeBlown) this.cartridgeGlitch();
    else this.scene.start('EraCard', { fresh: true });
  }

  // The game "won't load": garbled tiles and a familiar instruction.
  cartridgeGlitch() {
    this.blowing = true;
    this.panelTimer.remove();
    this.panel.removeAll(true);
    this.glitch = this.add.graphics().setDepth(40);
    this.glitchEvent = this.time.addEvent({ delay: 90, loop: true, callback: () => {
      this.glitch.clear();
      for (let i = 0; i < 60; i++) {
        this.glitch.fillStyle(Phaser.Math.Between(0, 0xffffff), 1);
        this.glitch.fillRect(Phaser.Math.Between(0, GAME_W / 8) * 8, Phaser.Math.Between(0, 17) * 8, 8 * Phaser.Math.Between(1, 4), 8);
      }
    } });
    sfx.static();
    this.glitchText = this.add.text(GAME_W / 2, 80, "THE GAME WON'T LOAD...\n\nBLOW ON THE CARTRIDGE!\n\n(PRESS B)", { ...textStyle(8, '#ffffff', true), align: 'center', backgroundColor: '#000000', padding: { x: 6, y: 6 } })
      .setOrigin(0.5).setDepth(45);
  }

  blowCartridge() {
    sfx.blow();
    this.cameras.main.shake(400, 0.01);
    this.glitchText.setText('*  F F F F O O O O  *');
    this.time.delayedCall(700, () => {
      this.glitchEvent.remove();
      this.glitch.clear();
      this.glitchText.setText('IT WORKS!');
      state.cartridgeBlown = true;
      sfx.eraClear();
      this.time.delayedCall(900, () => this.scene.start('EraCard', { fresh: true }));
    });
  }
}
