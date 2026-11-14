// Era-styled HUD. The HUD itself "evolves" too:
//  80s: arcade cabinet header (1UP / HI-SCORE, zero-padded, CREDIT counter)
//  90s: 16-bit console panel (yellow labels, chunky outlined numbers)
//  00s: glossy aqua toolbar (gradient bar, rounded "pills")
// Everything is pinned to the camera (scrollFactor 0), so it stays put in
// scrolling levels. Texts are only redrawn when their value changes.
import { GAME_W, GAME_H, textStyle } from '../config.js';
import { state, pad } from '../state.js';
import { getHighScore } from '../save.js';

const DEPTH = 90;

export default class Hud {
  // extraLabel: optional counter shown by the era ("CAPS ", "COMBO ")
  constructor(scene, style, { extraLabel = null } = {}) {
    this.scene = scene;
    this.style = style;
    this.extraLabel = extraLabel;
    this.last = {};
    this.tableBest = getHighScore(); // read storage once, not every frame
    const pin = (o) => o.setScrollFactor(0).setDepth(o.depth || DEPTH);
    this.pin = pin;
    const add = (x, y, txt, size, color, outline = false) =>
      pin(scene.add.text(x, y, txt, textStyle(size, color, outline)));

    if (style === '80s') {
      add(8, 2, '1UP', 8, '#ff3355');
      this.score = add(8, 11, '', 8, '#ffffff');
      add(GAME_W / 2, 2, 'HI-SCORE', 8, '#ff3355').setOrigin(0.5, 0);
      this.hi = add(GAME_W / 2, 11, '', 8, '#ffffff').setOrigin(0.5, 0);
      this.credit = add(GAME_W - 6, GAME_H - 10, '', 8, '#ffffff').setOrigin(1, 0);
      this.extra = add(GAME_W - 6, 2, '', 8, '#05d9e8').setOrigin(1, 0);
      this.livesY = GAME_H - 10;
    } else if (style === '90s') {
      const panel = pin(scene.add.graphics().setDepth(DEPTH - 1));
      panel.fillStyle(0x000000, 0.45).fillRoundedRect(3, 3, 96, 26, 4);
      add(8, 6, 'SCORE', 8, '#ffe000', true);
      this.score = add(8, 17, '', 8, '#ffffff', true);
      this.extra = add(GAME_W - 6, 5, '', 8, '#ffe000', true).setOrigin(1, 0);
      this.livesY = GAME_H - 12;
    } else {
      const bar = pin(scene.add.graphics().setDepth(DEPTH - 1));
      bar.fillGradientStyle(0x6fd3ff, 0x6fd3ff, 0x1976d2, 0x1976d2, 1).fillRect(0, 0, GAME_W, 15);
      bar.fillStyle(0xffffff, 0.35).fillRect(0, 0, GAME_W, 5); // gloss highlight
      bar.fillStyle(0xffffff, 0.9).fillRoundedRect(4, 2, 104, 11, 5);
      bar.fillStyle(0xffffff, 0.9).fillRoundedRect(GAME_W - 104, 2, 100, 11, 5);
      this.score = add(9, 4, '', 8, '#0b3d91');
      this.extra = add(GAME_W - 9, 4, '', 8, '#0b3d91').setOrigin(1, 0);
      this.livesY = GAME_H - 10;
    }

    this.lifeIcons = [];
    state.memories.forEach((m, i) => pin(
      scene.add.image(style === '00s' ? 114 + i * 11 : 8 + i * 11, style === '90s' ? 32 : style === '00s' ? 3 : 22, `memory-${m}`)
        .setOrigin(0).setScale(0.6)));
    this.update();
  }

  // Sets a text only if it changed (setText re-renders the text texture).
  set(obj, key, value) {
    if (!obj || this.last[key] === value) return;
    this.last[key] = value;
    obj.setText(value);
  }

  update(extraValue) {
    const s = pad(state.score);
    this.set(this.score, 'score', this.style === '00s' ? `SCORE ${s}` : s);
    if (this.hi) this.set(this.hi, 'hi', pad(Math.max(this.tableBest, state.score)));
    if (this.credit) this.set(this.credit, 'credit', `CREDIT ${state.credits}`);
    if (this.extraLabel !== null) this.set(this.extra, 'extra', extraValue === undefined ? '' : `${this.extraLabel}${extraValue}`);
    if (state.cheats.god && !this.godTag) {
      this.godTag = this.pin(this.scene.add.text(GAME_W / 2, GAME_H - 10, 'GOD MODE  [N] SKIP', textStyle(8, '#ff3355', true)).setOrigin(0.5, 0));
    }
    if (state.lives !== this.last.lives) {
      this.last.lives = state.lives;
      this.lifeIcons.forEach((i) => i.destroy());
      const key = this.style === '80s' ? 'ship' : 'life';
      this.lifeIcons = [];
      for (let i = 0; i < Math.min(state.lives - 1, 6); i++) { // lives in reserve, like arcades show
        this.lifeIcons.push(this.pin(this.scene.add.image(8 + i * 12, this.livesY, key).setOrigin(0)));
      }
    }
  }
}
