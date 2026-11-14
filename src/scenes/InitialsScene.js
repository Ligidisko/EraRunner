// NEW HIGH SCORE! Enter 3 initials, arcade style: ^ v to change a letter,
// < > to move, or just type them. SPACE/ENTER confirms.
import Phaser from 'phaser';
import { GAME_W, textStyle } from '../config.js';
import { pad } from '../state.js';
import { addScore } from '../save.js';
import { sfx } from '../audio/audio.js';
import { onKeyPress } from '../systems/keys.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ.!?';

export default class InitialsScene extends Phaser.Scene {
  constructor() { super('Initials'); }

  create(data) {
    // Phaser reuses scene objects: reset per-run flags every time the scene starts.
    this.done = false;
    const cx = GAME_W / 2;
    this.score = data.score;
    this.letters = [0, 0, 0];
    this.pos = 0;
    this.cameras.main.setBackgroundColor('#000000');
    this.add.image(0, 0, 'scanlines').setOrigin(0).setAlpha(0.25).setDepth(50);

    const t = this.add.text(cx, 22, 'NEW HIGH SCORE!', textStyle(16, '#ffd93b', true)).setOrigin(0.5);
    this.tweens.add({ targets: t, scale: 1.08, duration: 300, yoyo: true, repeat: -1 });
    this.add.text(cx, 46, pad(this.score), textStyle(16, '#ffffff', true)).setOrigin(0.5);
    this.add.text(cx, 70, 'ENTER YOUR INITIALS', textStyle(8, '#05d9e8')).setOrigin(0.5);

    this.slots = [0, 1, 2].map((i) => this.add.text(cx - 30 + i * 30, 100, 'A', textStyle(24, '#ffffff', true)).setOrigin(0.5));
    this.cursor = this.add.rectangle(0, 116, 18, 3, 0xff71ce);
    this.tweens.add({ targets: this.cursor, alpha: 0.2, duration: 300, yoyo: true, repeat: -1 });
    this.add.text(cx, 140, '^ v CHANGE  < > MOVE  SPACE OK', textStyle(8, '#888888')).setOrigin(0.5);
    this.refresh();

    onKeyPress(this, (e) => {
      const K = Phaser.Input.Keyboard.KeyCodes;
      if (e.keyCode === K.UP) this.change(1);
      else if (e.keyCode === K.DOWN) this.change(-1);
      else if (e.keyCode === K.LEFT) this.move(-1);
      else if (e.keyCode === K.RIGHT) this.move(1);
      else if (e.keyCode === K.SPACE || e.keyCode === K.ENTER) {
        if (this.pos < 2) this.move(1); else this.confirm();
      } else if (e.key && /^[a-z]$/i.test(e.key)) {
        this.letters[this.pos] = ALPHABET.indexOf(e.key.toUpperCase());
        sfx.select();
        if (this.pos < 2) this.move(1); else this.refresh();
      }
    });
  }

  change(d) {
    this.letters[this.pos] = (this.letters[this.pos] + d + ALPHABET.length) % ALPHABET.length;
    sfx.click();
    this.refresh();
  }

  move(d) {
    this.pos = Phaser.Math.Clamp(this.pos + d, 0, 2);
    sfx.click();
    this.refresh();
  }

  refresh() {
    this.slots.forEach((s, i) => s.setText(ALPHABET[this.letters[i]]).setColor(i === this.pos ? '#ff71ce' : '#ffffff'));
    this.cursor.x = this.slots[this.pos].x;
  }

  confirm() {
    if (this.done) return;
    this.done = true;
    const name = this.letters.map((i) => ALPHABET[i]).join('');
    const rank = addScore(name, this.score);
    sfx.oneUp();
    this.time.delayedCall(600, () => this.scene.start('Title', { showScores: true, highlight: rank }));
  }
}
