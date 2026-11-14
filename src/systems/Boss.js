// A generic end-of-era boss, configured by the era's `boss` data.
// It parks on the right, fires shots along two lanes (low = jump, high = slide),
// and loses HP over time. Grabbing an orb fires your own shot for a big chunk.
import Phaser from 'phaser';
import { GAME_W, GROUND_Y, HIGH_BOTTOM, ORB_Y, textStyle } from '../config.js';
import { sfx } from '../audio/audio.js';

const LANES = { low: GROUND_Y, high: HIGH_BOTTOM };
const ENTER_TIME = 1.4;

export default class Boss {
  constructor(scene, era, onDefeated) {
    this.scene = scene;
    this.cfg = era.boss;
    this.id = era.id;
    this.onDefeated = onDefeated;
    this.hp = 1;
    this.elapsed = 0;
    this.fireTimer = 0.8;
    this.orbTimer = 3.5;
    this.dead = false;

    this.homeX = GAME_W - 8 - this.cfg.w / 2;
    this.sprite = scene.add.image(GAME_W + this.cfg.w, GROUND_Y, `boss-${this.id}`).setOrigin(0.5, 1).setDepth(10);
    scene.tweens.add({ targets: this.sprite, x: this.homeX, duration: ENTER_TIME * 1000, ease: 'Back.Out' });

    this.shots = scene.physics.add.group({ allowGravity: false, immovable: true });
    scene.physics.add.overlap(scene.player, this.shots, (_p, s) => { s.destroy(); scene.onHit(); });

    this.nameText = scene.add.text(GAME_W / 2, 3, this.cfg.name, textStyle(8, '#ffffff', true)).setOrigin(0.5, 0).setDepth(60);
    this.barBg = scene.add.rectangle(GAME_W / 2 - 50, 16, 100, 4, 0x000000, 0.6).setOrigin(0, 0.5).setDepth(60);
    this.bar = scene.add.rectangle(GAME_W / 2 - 50, 16, 100, 4, 0xff3355).setOrigin(0, 0.5).setDepth(61);
  }

  update(dt) {
    if (this.dead) return;
    this.elapsed += dt;
    if (this.elapsed < ENTER_TIME) return;

    this.hp -= dt / this.cfg.duration; // you win by surviving...
    this.sprite.y = GROUND_Y - (1 + Math.sin(this.elapsed * 3)) * 2;

    const progress = 1 - this.hp;
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fire(progress);
      this.fireTimer = Phaser.Math.Linear(this.cfg.fireEvery[0], this.cfg.fireEvery[1], progress);
    }

    // ...or faster by grabbing orbs, which shoot back.
    this.orbTimer -= dt;
    if (this.orbTimer <= 0) {
      this.scene.addOrb(GAME_W + 10, ORB_Y);
      this.orbTimer = 5;
    }

    this.shots.getChildren().slice().forEach((s) => { if (s.x < -20) s.destroy(); });
    this.bar.width = 100 * Math.max(this.hp, 0);
    if (this.hp <= 0) this.die();
  }

  fire(progress) {
    const moves = progress < 0.35 ? ['low', 'high'] : ['low', 'high', 'burst', 'double', 'burst'];
    const move = Phaser.Utils.Array.GetRandom(moves);
    if (move === 'low' || move === 'high') this.shoot(move);
    else if (move === 'burst') { this.shoot('low'); this.scene.time.delayedCall(480, () => this.shoot('high')); }
    else { this.shoot('low'); this.scene.time.delayedCall(230, () => this.shoot('low')); }
  }

  shoot(lane) {
    if (this.dead) return;
    const key = `shot-${this.id}-${Phaser.Math.Between(0, this.cfg.shots.length - 1)}`;
    const s = this.shots.create(this.sprite.x - this.cfg.w / 2, LANES[lane], key).setOrigin(0.5, 1);
    s.kind = lane;
    s.body.setSize(Math.max(s.width - 2, 2), Math.max(s.height - 2, 2));
    s.setVelocityX(-this.cfg.shotSpeed);
    this.scene.tweens.add({ targets: this.sprite, x: this.homeX + 4, duration: 60, yoyo: true });
    sfx.shoot();
  }

  // x position a player shot has to reach to hit the boss.
  get hitX() { return this.sprite.x - this.cfg.w / 2 + 4; }

  damage(amount) {
    if (this.dead) return;
    this.hp -= amount;
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.sprite.clearTint());
    this.scene.cameras.main.shake(120, 0.012);
    this.scene.fx.sparkle(this.hitX, this.sprite.y - this.cfg.h / 2, 14);
    this.scene.fx.popup(this.hitX, this.sprite.y - this.cfg.h - 4, 'CRITICAL!', '#ffd93b');
    sfx.bossHit();
  }

  die() {
    this.dead = true;
    this.shots.clear(true, true);
    sfx.bossDown();
    this.scene.cameras.main.flash(250, 255, 255, 255);
    // A few staggered explosions, then the boss sinks away.
    for (let i = 0; i < 6; i++) {
      this.scene.time.delayedCall(i * 140, () => this.scene.fx.sparkle(
        this.sprite.x + Phaser.Math.Between(-this.cfg.w / 2, this.cfg.w / 2),
        this.sprite.y - Phaser.Math.Between(0, this.cfg.h), 12));
    }
    this.scene.tweens.add({ targets: this.sprite, y: GROUND_Y + this.cfg.h, alpha: 0, angle: 12, duration: 1100, ease: 'Quad.In' });
    this.scene.tweens.add({ targets: [this.nameText, this.bar, this.barBg], alpha: 0, duration: 400 });
    this.scene.time.delayedCall(1300, () => this.onDefeated());
  }
}
