// Out of lives: CONTINUE? 9... 8... 7... — press C to put in another coin
// (score resets, you keep your era). "BE KIND, REWIND" with a tape rewinding.
import Phaser from 'phaser';
import { GAME_W, textStyle } from '../config.js';
import { state, continueRun } from '../state.js';
import { stopMusic, sfx } from '../audio/audio.js';
import { onKeyPress } from '../systems/keys.js';
import { qualifies } from '../save.js';

export default class ContinueScene extends Phaser.Scene {
  constructor() { super('Continue'); }

  create() {
    stopMusic();
    const cx = GAME_W / 2;
    this.cameras.main.setBackgroundColor('#000010');
    this.finalScore = state.score;

    this.add.text(cx, 24, 'CONTINUE?', textStyle(16, '#ffffff', true)).setOrigin(0.5);
    this.count = 9;
    this.countText = this.add.text(cx, 60, '9', textStyle(32, '#ff3355', true)).setOrigin(0.5);

    // A spinning tape: two reels in a cassette shell.
    this.add.image(cx, 104, 'high-80s').setScale(3);
    this.reels = [this.add.circle(cx - 12, 102, 4, 0xffffff), this.add.circle(cx + 12, 102, 4, 0xffffff)];
    this.reelSpokes = this.reels.map((r) => this.add.rectangle(r.x, r.y, 8, 1, 0x333333));
    this.add.text(cx, 130, 'BE KIND, REWIND', textStyle(8, '#ffd93b', true)).setOrigin(0.5);
    sfx.rewind();

    const ic = this.add.text(cx, 150, state.credits > 0 ? 'PRESS SPACE  (C = MORE COINS)' : 'INSERT COIN  [C]', textStyle(8, '#05d9e8')).setOrigin(0.5);
    this.tweens.add({ targets: ic, alpha: 0.2, duration: 400, yoyo: true, repeat: -1 });

    this.tick = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      this.count--;
      if (this.count < 0) { this.gameOver(); return; }
      this.countText.setText(String(this.count));
      sfx.click();
    } });

    onKeyPress(this, (e) => {
      const K = Phaser.Input.Keyboard.KeyCodes;
      if (e.keyCode === K.C) { state.credits++; sfx.coinInsert(); this.useCredit(); }
      else if ((e.keyCode === K.SPACE || e.keyCode === K.ENTER) && state.credits > 0) this.useCredit();
    });
  }

  update(_t, dms) {
    for (const s of this.reelSpokes) s.rotation -= dms * 0.02;
  }

  useCredit() {
    if (this.done) return;
    this.done = true;
    state.credits--;
    continueRun();
    this.scene.start('EraCard', { retry: true });
  }

  gameOver() {
    if (this.done) return;
    this.done = true;
    this.tick.remove();
    this.countText.setText('GAME OVER').setFontSize(16);
    sfx.bossDown();
    this.time.delayedCall(2000, () => {
      if (qualifies(this.finalScore)) this.scene.start('Initials', { score: this.finalScore });
      else this.scene.start('Title', { showScores: true });
    });
  }
}
