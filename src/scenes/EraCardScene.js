// Between eras, like flipping the TV over to the console channel:
//  1. TV static + "CH 3" on-screen display
//  2. the era card: "1995 · AGE 18 · THE DIAL-UP YEARS"
//  3. (new eras only) NEW CONTROLS UNLOCKED — the controller evolves
//     (arcade stick -> D-pad pad -> keyboard) and you press each new
//     button once, lighting it up, before the game starts.
import Phaser from 'phaser';
import { GAME_W, GAME_H, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { state } from '../state.js';
import { stopMusic, sfx } from '../audio/audio.js';
import { onKeyPress } from '../systems/keys.js';

export default class EraCardScene extends Phaser.Scene {
  constructor() { super('EraCard'); }

  // data: { fresh?: new era (show unlock card), retry?: after a continue }
  create(data = {}) {
    stopMusic();
    this.era = ERAS[state.eraIndex];
    this.data_ = data;
    this.cameras.main.setBackgroundColor('#000000');
    this.channelChange(() => this.eraCard());
  }

  channelChange(next) {
    const g = this.add.graphics();
    const draw = () => {
      g.clear();
      for (let i = 0; i < 700; i++) {
        const v = Phaser.Math.Between(40, 255);
        g.fillStyle(Phaser.Display.Color.GetColor(v, v, v), 1);
        g.fillRect(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(0, GAME_H), 2, 1);
      }
    };
    draw();
    const ev = this.time.addEvent({ delay: 40, loop: true, callback: draw });
    const osd = this.add.text(GAME_W - 10, 8, `CH ${String(state.eraIndex + 3).padStart(2, '0')}`, textStyle(16, '#3bff6e', true)).setOrigin(1, 0).setDepth(10);
    sfx.click();
    sfx.static();
    this.time.delayedCall(650, () => { ev.remove(); g.destroy(); osd.destroy(); sfx.click(); next(); });
  }

  eraCard() {
    const cx = GAME_W / 2;
    const era = this.era;
    this.cameras.main.setBackgroundColor(era.palette.bg);
    const items = [];
    if (this.data_.retry) items.push(this.add.text(cx, 30, 'CONTINUE!', textStyle(8, '#ffffff', true)).setOrigin(0.5));
    items.push(this.add.text(cx, 62, era.year, textStyle(32, era.palette.text, true)).setOrigin(0.5));
    items.push(this.add.text(cx, 96, era.age, textStyle(8, '#ffffff', true)).setOrigin(0.5));
    items.push(this.add.text(cx, 114, era.title, textStyle(8, era.palette.accent, true)).setOrigin(0.5));
    const go = () => {
      if (this.data_.fresh) { items.forEach((i) => i.destroy()); this.unlockCard(); }
      else this.startEra();
    };
    this.time.delayedCall(1800, go);
  }

  // ---------- NEW CONTROLS UNLOCKED ----------

  unlockCard() {
    const c = this.era.controls;
    const cx = GAME_W / 2;
    this.cameras.main.setBackgroundColor('#101018');
    const head = this.add.text(cx, 14, state.eraIndex === 0 ? 'CONTROLS' : 'NEW CONTROLS UNLOCKED!', textStyle(8, '#ffd93b', true)).setOrigin(0.5);
    this.tweens.add({ targets: head, scale: 1.1, duration: 300, yoyo: true, repeat: -1 });
    sfx.power();

    this.buttons = {}; // key code -> { shape, label }
    if (c.device === 'arcade') this.drawArcade();
    else if (c.device === 'pad') this.drawPad();
    else this.drawKeyboard();

    this.add.text(cx, 138, c.tutorial, textStyle(8, '#ffffff', true)).setOrigin(0.5);
    const hint = this.add.text(cx, 154, 'PRESS EACH BUTTON TO START', textStyle(8, '#888888')).setOrigin(0.5);
    this.tweens.add({ targets: hint, alpha: 0.3, duration: 500, yoyo: true, repeat: -1 });
    this.add.text(GAME_W - 4, GAME_H - 9, 'ENTER: SKIP', textStyle(8, '#444444')).setOrigin(1, 0);

    this.pending = new Set(c.required);
    onKeyPress(this, (e) => {
      const K = Phaser.Input.Keyboard.KeyCodes;
      if (e.keyCode === K.ENTER) { this.startEra(); return; }
      const code = Object.keys(this.buttons).find((k) => K[k] === e.keyCode);
      if (!code) return;
      const b = this.buttons[code];
      b.shape.setFillStyle(0xffd93b);
      this.tweens.add({ targets: b.shape, scale: 1.2, duration: 80, yoyo: true });
      sfx.select();
      this.pending.delete(code);
      if (this.pending.size === 0 && !this.going) {
        this.going = true;
        const ready = this.add.text(cx, 74, 'GET READY!', textStyle(16, '#3bff6e', true)).setOrigin(0.5).setDepth(10);
        this.tweens.add({ targets: ready, scale: { from: 0.3, to: 1 }, duration: 250, ease: 'Back.Out' });
        sfx.eraClear();
        this.time.delayedCall(900, () => this.startEra());
      }
    });
  }

  // Helper: a pressable button shape + its label underneath.
  button(code, shape, label, labelY, labelX) {
    shape.setStrokeStyle(1, 0xffffff);
    const lbl = this.add.text(labelX ?? shape.x, labelY ?? shape.y + 14, label, textStyle(8, '#ffffff', true)).setOrigin(0.5, 0);
    this.buttons[code] = { shape, label: lbl };
  }

  drawArcade() {
    // Wood-grain control panel with a ball-top stick and a big red button.
    this.add.rectangle(160, 82, 220, 70, 0x2a1a10).setStrokeStyle(2, 0x5a3a22);
    this.add.rectangle(160, 52, 220, 8, 0xff2a6d);
    this.add.rectangle(100, 90, 4, 22, 0xcccccc);
    this.add.circle(100, 78, 9, 0xff3b3b).setStrokeStyle(1, 0x000000);
    this.button('LEFT', this.add.triangle(76, 90, 0, 6, 10, 0, 10, 12, 0x444444), '<', 100);
    this.button('RIGHT', this.add.triangle(124, 90, 0, 0, 10, 6, 0, 12, 0x444444), '>', 100);
    this.button('SPACE', this.add.circle(214, 84, 14, 0x881111), 'FIRE', 102);
    this.add.circle(246, 84, 9, 0x333366).setStrokeStyle(1, 0x666666);
  }

  drawPad() {
    // A generic 16-bit pad: grey body, D-pad left, two face buttons right.
    const body = this.add.graphics();
    body.fillStyle(0xb0b0b8, 1).fillRoundedRect(70, 46, 180, 70, 30);
    body.fillStyle(0x8a8a94, 1).fillRoundedRect(140, 70, 40, 10, 4);
    this.add.rectangle(110, 82, 30, 10, 0x222222);
    this.add.rectangle(110, 82, 10, 30, 0x222222);
    // Labels sit under the pad so they never cover the buttons.
    this.button('RIGHT', this.add.rectangle(122, 82, 9, 9, 0x444444), '>RUN', 120, 132);
    this.button('DOWN', this.add.rectangle(110, 94, 9, 9, 0x444444), 'vSPIN', 120, 84);
    this.button('SPACE', this.add.circle(214, 76, 9, 0x7b2cbf), 'JUMP', 120, 214);
    this.add.circle(196, 92, 7, 0x6a6a74);
  }

  drawKeyboard() {
    // A chunky beige PC keyboard with the arrow cluster.
    this.add.rectangle(160, 82, 250, 74, 0xd8d0b0).setStrokeStyle(2, 0x8a8268);
    for (let r = 0; r < 4; r++) {
      for (let k = 0; k < 13; k++) this.add.rectangle(52 + k * 13, 56 + r * 12, 11, 10, 0xefe8d0).setStrokeStyle(1, 0x8a8268);
    }
    this.add.rectangle(120, 104, 90, 10, 0xefe8d0).setStrokeStyle(1, 0x8a8268); // space bar
    this.button('UP', this.add.rectangle(246, 92, 12, 10, 0x666666), '^', 70);
    this.button('LEFT', this.add.rectangle(232, 104, 12, 10, 0x666666), '<', 112);
    this.button('DOWN', this.add.rectangle(246, 104, 12, 10, 0x666666), 'v', 112);
    this.button('RIGHT', this.add.rectangle(260, 104, 12, 10, 0x666666), '>', 112);
  }

  startEra() {
    if (this.started) return;
    this.started = true;
    this.scene.start(this.era.scene, {});
  }
}
