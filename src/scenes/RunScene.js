// The core game: one era of auto-running. Everything era-specific comes from
// the era data file; this scene only knows "jump, slide, dodge, collect".
import Phaser from 'phaser';
import {
  GAME_W, GAME_H, GROUND_Y, JUMP_VELOCITY, JUMP_CUT, MAX_HEARTS, INVULN_TIME, textStyle,
} from '../config.js';
import { ERAS } from '../eras/index.js';
import { playMusic, stopMusic, sfx } from '../audio/audio.js';

const PLAYER_X = 70;
const HIGH_OBSTACLE_BOTTOM = GROUND_Y - 8; // sliding clears it, standing does not

export default class RunScene extends Phaser.Scene {
  constructor() { super('Run'); }

  // data: { eraIndex, score, memories }
  create(data) {
    this.startData = data; // used to restart from this era's checkpoint
    this.era = ERAS[data.eraIndex];
    const id = this.era.id;

    this.score = data.score;
    this.hearts = MAX_HEARTS;
    this.elapsed = 0;
    this.speed = this.era.startSpeed;
    this.distToNext = 120; // px until the first obstacle
    this.invuln = 0;
    this.finishing = false;
    this.animTimer = 0;
    this.jumpsLeft = 0;

    // --- World ---
    this.cameras.main.setBackgroundColor(this.era.palette.bg);
    this.sky = this.add.tileSprite(0, 0, GAME_W, GROUND_Y, `sky-${id}`).setOrigin(0);
    this.ground = this.add.tileSprite(0, GROUND_Y, GAME_W, GAME_H - GROUND_Y, `ground-${id}`).setOrigin(0);

    const floor = this.add.zone(GAME_W / 2, GROUND_Y + 20, GAME_W * 2, 40);
    this.physics.add.existing(floor, true);

    // --- Player ---
    this.player = this.physics.add.sprite(PLAYER_X, GROUND_Y, `player-${id}-run1`).setOrigin(0.5, 1);
    this.setStandingBody();
    this.physics.add.collider(this.player, floor);

    // --- Obstacles and coins (move left at the current speed, no gravity) ---
    this.obstacles = this.physics.add.group({ allowGravity: false, immovable: true });
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.physics.add.overlap(this.player, this.obstacles, () => this.onHit());
    this.physics.add.overlap(this.player, this.coins, (_p, coin) => this.onCoin(coin));

    // --- Overlays + HUD ---
    if (this.era.scanlines > 0) this.add.image(0, 0, 'scanlines').setOrigin(0).setAlpha(this.era.scanlines).setDepth(50);
    this.heartIcons = [];
    for (let i = 0; i < MAX_HEARTS; i++) this.heartIcons.push(this.add.image(8 + i * 10, 8, 'heart').setOrigin(0).setDepth(60));
    this.scoreText = this.add.text(GAME_W - 6, 6, '', textStyle(8, this.era.palette.text)).setOrigin(1, 0).setDepth(60);
    this.progressBg = this.add.rectangle(GAME_W / 2 - 50, 10, 100, 4, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(60);
    this.progressBar = this.add.rectangle(GAME_W / 2 - 50, 10, 0, 4, Phaser.Display.Color.HexStringToColor(this.era.palette.accent).color).setOrigin(0, 0.5).setDepth(60);

    // --- Input ---
    this.keys = this.input.keyboard.addKeys({
      jump: Phaser.Input.Keyboard.KeyCodes.SPACE,
      up: Phaser.Input.Keyboard.KeyCodes.UP,
      w: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.DOWN,
      s: Phaser.Input.Keyboard.KeyCodes.S,
    });

    playMusic(this.era.music);
    this.events.once('shutdown', stopMusic);
  }

  // Hitboxes are a little smaller than the art so near-misses feel fair.
  setStandingBody() { this.player.body.setSize(8, 14, false).setOffset(4, 2); this.sliding = false; }
  setSlidingBody() { this.player.body.setSize(12, 6, false).setOffset(2, 10); this.sliding = true; }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 20); // clamp so a lag spike can't teleport things
    this.elapsed += dt;
    const t = Math.min(this.elapsed / this.era.duration, 1);
    this.speed = Phaser.Math.Linear(this.era.startSpeed, this.era.endSpeed, t);

    this.scrollWorld(dt);
    this.handleInput(dt);
    this.spawn(dt);
    this.cleanup();

    if (this.invuln > 0) {
      this.invuln -= dt;
      this.player.setAlpha(Math.floor(this.invuln * 12) % 2 ? 0.3 : 1);
      if (this.invuln <= 0) this.player.setAlpha(1);
    }

    this.score += this.speed * dt * 0.05;
    this.scoreText.setText(String(Math.floor(this.score)));
    this.progressBar.width = 100 * t;

    // End of era: stop spawning, let the screen clear, then move on.
    // TODO(boss): start the era's boss fight here instead of ending straight away.
    if (t >= 1 && !this.finishing && this.obstacles.countActive() === 0) this.finishEra();
  }

  scrollWorld(dt) {
    this.ground.tilePositionX += this.speed * dt;
    this.sky.tilePositionX += this.speed * dt * (this.era.skyScroll ?? 0.05);
    for (const g of [this.obstacles, this.coins]) g.setVelocityX(-this.speed);
  }

  handleInput(dt) {
    const body = this.player.body;
    const onGround = body.blocked.down || body.touching.down;
    const jumpPressed = Phaser.Input.Keyboard.JustDown(this.keys.jump) || Phaser.Input.Keyboard.JustDown(this.keys.up) || Phaser.Input.Keyboard.JustDown(this.keys.w);
    const jumpHeld = this.keys.jump.isDown || this.keys.up.isDown || this.keys.w.isDown;
    const downHeld = this.keys.down.isDown || this.keys.s.isDown;

    if (onGround) this.jumpsLeft = this.era.doubleJump ? 2 : 1;

    if (jumpPressed && this.jumpsLeft > 0 && !(onGround && downHeld)) {
      body.setVelocityY(JUMP_VELOCITY * (this.jumpsLeft === 2 || !this.era.doubleJump ? 1 : 0.85));
      this.jumpsLeft--;
      if (this.sliding) this.setStandingBody();
      sfx.jump();
    }
    // Variable jump height: let go early for a short hop.
    if (!jumpHeld && body.velocity.y < 0) body.setVelocityY(body.velocity.y * JUMP_CUT ** (dt * 20));

    // Down in the air = fast fall; down on the ground = slide.
    if (downHeld && !onGround) body.setVelocityY(Math.max(body.velocity.y, 350));
    if (downHeld && onGround && !this.sliding) this.setSlidingBody();
    if (!downHeld && this.sliding) this.setStandingBody();

    // Pick the sprite frame.
    const id = this.era.id;
    if (this.sliding) this.player.setTexture(`player-${id}-slide`);
    else if (!onGround) this.player.setTexture(`player-${id}-jump`);
    else {
      this.animTimer += dt * (this.speed / 120);
      this.player.setTexture(`player-${id}-${Math.floor(this.animTimer * 8) % 2 ? 'run2' : 'run1'}`);
    }
  }

  // Spawns obstacle "patterns" spaced by distance, so gaps scale with speed.
  spawn(dt) {
    if (this.elapsed >= this.era.duration) return;
    this.distToNext -= this.speed * dt;
    if (this.distToNext > 0) return;

    const x = GAME_W + 20;
    const roll = Math.random();
    if (roll < 0.35) {
      this.addObstacle('low', x);
    } else if (roll < 0.6) {
      this.addObstacle('high', x);
    } else if (roll < 0.8) {
      // jump over a low obstacle through an arc of coins
      this.addObstacle('low', x);
      for (let i = -2; i <= 2; i++) this.addCoin(x + i * 12, GROUND_Y - 40 + Math.abs(i) * 8);
    } else if (roll < 0.9 && this.era.doubleJump) {
      // two lows close together: needs a double jump or perfect timing
      this.addObstacle('low', x);
      this.addObstacle('low', x + 34);
    } else {
      for (let i = 0; i < 5; i++) this.addCoin(x + i * 12, GROUND_Y - 8);
    }
    this.distToNext = Phaser.Math.Between(150, 250);
  }

  addObstacle(kind, x) {
    const key = `${kind}-${this.era.id}`;
    const y = kind === 'low' ? GROUND_Y : HIGH_OBSTACLE_BOTTOM;
    const o = this.obstacles.create(x, y, key).setOrigin(0.5, 1);
    o.body.setSize(o.width - 3, o.height - 3);
    return o;
  }

  addCoin(x, y) {
    return this.coins.create(x, y, `coin-${this.era.id}`);
  }

  cleanup() {
    for (const g of [this.obstacles, this.coins]) {
      g.getChildren().slice().forEach((o) => { if (o.x < -30) o.destroy(); });
    }
  }

  onCoin(coin) {
    coin.destroy();
    this.score += 10;
    sfx.coin();
  }

  onHit() {
    if (this.invuln > 0 || this.finishing) return;
    this.hearts--;
    this.invuln = INVULN_TIME;
    sfx.hit();
    this.cameras.main.shake(150, 0.01);
    this.heartIcons.forEach((h, i) => h.setVisible(i < this.hearts));
    if (this.hearts <= 0) {
      // Checkpoint: restart this era with the score you had when it began.
      this.finishing = true;
      this.time.delayedCall(400, () => this.scene.start('EraCard', { ...this.startData, retry: true }));
    }
  }

  finishEra() {
    this.finishing = true;
    sfx.eraClear();
    const memories = [...this.startData.memories, this.era.id];
    const nextIndex = this.startData.eraIndex + 1;
    const score = Math.floor(this.score) + this.hearts * 100; // bonus for hearts left
    const banner = this.add.text(GAME_W / 2, 70, `${this.era.memory.toUpperCase()} GET!`, textStyle(8, '#ffffff')).setOrigin(0.5).setDepth(70);
    this.tweens.add({ targets: banner, y: 60, duration: 800 });
    this.time.delayedCall(1500, () => {
      if (nextIndex < ERAS.length) this.scene.start('EraCard', { eraIndex: nextIndex, score, memories });
      else this.scene.start('End', { score, memories });
    });
  }
}
