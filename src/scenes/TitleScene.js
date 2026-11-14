import Phaser from 'phaser';
import { GAME_W, GAME_H, textStyle } from '../config.js';
import { initAudio, sfx } from '../audio/audio.js';
import { getHighScore } from '../save.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    this.cameras.main.setBackgroundColor('#000000');
    const cx = GAME_W / 2;

    this.add.text(cx, 40, 'ERA RUNNER', textStyle(24, '#ff71ce')).setOrigin(0.5);
    this.add.text(cx, 66, 'run through the decades', textStyle(8, '#05d9e8')).setOrigin(0.5);

    const prompt = this.add.text(cx, 104, 'PRESS SPACE', textStyle(8, '#ffffff')).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0, duration: 500, yoyo: true, repeat: -1 });

    this.add.text(cx, 132, 'SPACE/UP jump   DOWN slide', textStyle(8, '#aaaaaa')).setOrigin(0.5);
    const best = getHighScore();
    if (best > 0) this.add.text(cx, 150, `BEST ${best}`, textStyle(8, '#ffd93b')).setOrigin(0.5);
    this.add.text(cx, 170, 'COMING SOON: THE 70s & 10s', textStyle(8, '#555555')).setOrigin(0.5);

    const go = () => {
      initAudio(); // first user gesture unlocks audio
      sfx.select();
      this.scene.start('EraCard', { eraIndex: 0, score: 0, memories: [] });
    };
    this.input.keyboard.once('keydown-SPACE', go);
    this.input.keyboard.once('keydown-ENTER', go);
  }
}
