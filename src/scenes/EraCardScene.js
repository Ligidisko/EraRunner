// The title card between eras: "1985 — Age 8 — THE ARCADE YEARS".
import Phaser from 'phaser';
import { GAME_W, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { stopMusic } from '../audio/audio.js';

export default class EraCardScene extends Phaser.Scene {
  constructor() { super('EraCard'); }

  // data: { eraIndex, score, memories, retry? }
  create(data) {
    stopMusic();
    const era = ERAS[data.eraIndex];
    const cx = GAME_W / 2;
    this.cameras.main.setBackgroundColor(era.palette.bg);

    if (data.retry) this.add.text(cx, 30, data.startAtBoss ? 'TRY AGAIN - BOSS' : 'TRY AGAIN', textStyle(8, '#ffffff')).setOrigin(0.5);
    this.add.text(cx, 62, era.year, textStyle(32, era.palette.text)).setOrigin(0.5);
    this.add.text(cx, 96, era.age, textStyle(8, '#ffffff')).setOrigin(0.5);
    this.add.text(cx, 114, era.title, textStyle(8, era.palette.accent)).setOrigin(0.5);

    // Auto-advance after 2.2s, or skip with Space.
    const next = () => { if (!this.done) { this.done = true; this.scene.start('Run', data); } };
    this.done = false;
    this.time.delayedCall(2200, next);
    this.input.keyboard.once('keydown-SPACE', next);
  }
}
