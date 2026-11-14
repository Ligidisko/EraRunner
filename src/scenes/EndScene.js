// Ending: the memory items on a desk, the final line, score, and "coming soon".
import Phaser from 'phaser';
import { GAME_W, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { stopMusic, sfx } from '../audio/audio.js';
import { saveHighScore, getHighScore } from '../save.js';

export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create(data) {
    stopMusic();
    sfx.eraClear();
    const cx = GAME_W / 2;
    this.cameras.main.setBackgroundColor('#1a1410');

    // desk
    this.add.rectangle(cx, 120, GAME_W, 60, 0x5a3a22);
    this.add.rectangle(cx, 91, GAME_W, 3, 0x7a5232);

    // One memory per completed era, shown with that era's obstacle sprite as a stand-in icon.
    // TODO(art): swap in proper memory-item sprites (cassette player, virtual pet, flip phone).
    const items = data.memories || [];
    items.forEach((eraId, i) => {
      const era = ERAS.find((e) => e.id === eraId);
      const x = cx + (i - (items.length - 1) / 2) * 90;
      this.add.image(x, 80, `low-${eraId}`).setScale(2).setOrigin(0.5, 1);
      // One word per line so three labels fit side by side.
      this.add.text(x, 98, era.memory.toUpperCase().replace(' ', '\n'), { ...textStyle(8, '#ffe8c2'), align: 'center', lineSpacing: 2 }).setOrigin(0.5, 0);
    });

    const line = this.add.text(cx, 22, 'Some things you never forget.', textStyle(8, '#ffffff')).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: line, alpha: 1, duration: 1500 });

    const isBest = saveHighScore(data.score);
    this.add.text(cx, 134, `SCORE ${data.score}${isBest ? '  NEW BEST!' : `  BEST ${getHighScore()}`}`, textStyle(8, '#ffd93b')).setOrigin(0.5);
    this.add.text(cx, 150, 'COMING SOON: THE 70s & 10s', textStyle(8, '#888888')).setOrigin(0.5);
    this.add.text(cx, 168, 'SPACE to play again', textStyle(8, '#aaaaaa')).setOrigin(0.5);

    this.time.delayedCall(1200, () => this.input.keyboard.once('keydown-SPACE', () => this.scene.start('Title')));
  }
}
