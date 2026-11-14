// Ending: the memory items drop onto a desk, one per era you played.
// Then initials entry (if the score made the table) and back to attract mode.
import Phaser from 'phaser';
import { GAME_W, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { stopMusic, sfx } from '../audio/audio.js';
import { state, pad } from '../state.js';
import { qualifies } from '../save.js';

export default class EndScene extends Phaser.Scene {
  constructor() { super('End'); }

  create() {
    stopMusic();
    sfx.eraClear();
    const cx = GAME_W / 2;
    this.cameras.main.setBackgroundColor('#1a1410');

    // desk
    this.add.rectangle(cx, 120, GAME_W, 60, 0x5a3a22);
    this.add.rectangle(cx, 91, GAME_W, 3, 0x7a5232);

    const items = state.memories;
    items.forEach((eraId, i) => {
      const era = ERAS.find((e) => e.id === eraId);
      const x = cx + (i - (items.length - 1) / 2) * 90;
      const img = this.add.image(x, -20, `memory-${eraId}`).setScale(3).setOrigin(0.5, 1);
      this.tweens.add({ targets: img, y: 91, duration: 700, delay: 600 + i * 450, ease: 'Bounce.Out', onStart: () => sfx.coin() });
      this.add.text(x, 98, era.memory.toUpperCase().replace(' ', '\n'), { ...textStyle(8, '#ffe8c2'), align: 'center', lineSpacing: 2 }).setOrigin(0.5, 0);
    });

    const line = this.add.text(cx, 22, 'Some things you never forget.', textStyle(8, '#ffffff')).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: line, alpha: 1, duration: 1500 });

    this.add.text(cx, 134, `SCORE ${pad(state.score)}`, textStyle(8, '#ffd93b')).setOrigin(0.5);
    this.add.text(cx, 150, 'COMING SOON: THE 70s & 10s', textStyle(8, '#888888')).setOrigin(0.5);
    this.add.text(cx, 168, 'SPACE to continue', textStyle(8, '#aaaaaa')).setOrigin(0.5);

    this.time.delayedCall(2000, () => this.input.keyboard.once('keydown-SPACE', () => {
      if (qualifies(state.score)) this.scene.start('Initials', { score: state.score });
      else this.scene.start('Title', { showScores: true });
    }));
  }
}
