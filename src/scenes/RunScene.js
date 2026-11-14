// The core game: one era of auto-running, then its boss, then the memory reveal.
// Phases: 'run' -> 'boss' -> 'reveal'. Everything era-specific comes from the
// era data file; this scene only knows "jump, slide, dodge, collect".
import Phaser from 'phaser';
import {
  GAME_W, GAME_H, GROUND_Y, JUMP_VELOCITY, JUMP_CUT, MAX_HEARTS, INVULN_TIME, textStyle,
  COYOTE_TIME, JUMP_BUFFER, HITSTOP, HIGH_BOTTOM, GHOST_HIGH_BOTTOM, ORB_Y,
  POWER_TIME, MAX_MULT, COINS_PER_MULT,
} from '../config.js';
import { ERAS } from '../eras/index.js';
import { playMusic, stopMusic, sfx } from '../audio/audio.js';
import { pickPattern } from '../systems/patterns.js';
import { makeFx } from '../systems/fx.js';
import Boss from '../systems/Boss.js';

const PLAYER_X = 70;

export default class RunScene extends Phaser.Scene {
  constructor() { super('Run'); }

  // data: { eraIndex, score, memories, startAtBoss? }
  create(data) {
    this.startData = data;
    this.era = ERAS[data.eraIndex];
    const id = this.era.id;

    this.phase = 'run';
    this.score = data.score;
    this.hearts = MAX_HEARTS;
    this.elapsed = data.startAtBoss ? this.era.duration : 0; // boss checkpoint skips the run
    this.speed = this.era.startSpeed;
    this.distToNext = 140;
    this.invuln = 0;
    this.hitstop = 0;
    this.finishing = false;
    this.animTimer = 0;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.airJumps = 0;
    this.wasOnGround = true;
    this.chain = 0; // coins collected in a row without getting hit
    this.mult = 1;
    this.power = 0; // seconds of ghost-eating left
    this.ghostsEaten = 0;
    this.callouts = new Set();
    this.boss = null;

    // --- World ---
    this.cameras.main.setBackgroundColor(this.era.palette.bg);
    this.sky = this.add.tileSprite(0, 0, GAME_W, GROUND_Y, `sky-${id}`).setOrigin(0);
    this.ground = this.add.tileSprite(0, GROUND_Y, GAME_W, GAME_H - GROUND_Y, `ground-${id}`).setOrigin(0);
    const floor = this.add.zone(GAME_W / 2, GROUND_Y + 20, GAME_W * 2, 40);
    this.physics.add.existing(floor, true);

    // --- Player ---
    this.player = this.physics.add.sprite(PLAYER_X, GROUND_Y, `player-${id}-run1`).setOrigin(0.5, 1).setDepth(30);
    this.setStandingBody();
    this.physics.add.collider(this.player, floor);

    // --- Things that scroll at you ---
    const group = () => this.physics.add.group({ allowGravity: false, immovable: true });
    this.obstacles = group();
    this.coins = group();
    this.ghosts = group();
    this.orbs = group();
    this.playerShots = group();
    this.physics.add.overlap(this.player, this.obstacles, () => this.onHit());
    this.physics.add.overlap(this.player, this.coins, (_p, c) => this.onCoin(c));
    this.physics.add.overlap(this.player, this.ghosts, (_p, g) => this.onGhost(g));
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.onOrb(o));

    this.fx = makeFx(this, this.era.palette.line);

    // --- Overlays + HUD ---
    if (this.era.scanlines > 0) this.add.image(0, 0, 'scanlines').setOrigin(0).setAlpha(this.era.scanlines).setDepth(50);
    this.heartIcons = [];
    for (let i = 0; i < MAX_HEARTS; i++) this.heartIcons.push(this.add.image(6 + i * 10, 6, 'heart').setOrigin(0).setDepth(60));
    // Memories collected so far sit under the hearts.
    data.memories.forEach((m, i) => this.add.image(6 + i * 11, 15, `memory-${m}`).setOrigin(0).setScale(0.6).setDepth(60));
    this.scoreText = this.add.text(GAME_W - 5, 5, '', textStyle(8, this.era.palette.text, true)).setOrigin(1, 0).setDepth(60);
    this.multText = this.add.text(GAME_W - 5, 16, '', textStyle(8, '#ffd93b', true)).setOrigin(1, 0).setDepth(60);
    this.progressBg = this.add.rectangle(GAME_W / 2 - 50, 8, 100, 4, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(60);
    this.progressBar = this.add.rectangle(GAME_W / 2 - 50, 8, 0, 4, Phaser.Display.Color.HexStringToColor(this.era.palette.accent).color).setOrigin(0, 0.5).setDepth(60);
    this.powerBar = this.add.rectangle(PLAYER_X, GROUND_Y + 6, 0, 2, 0x2b4cff).setOrigin(0.5).setDepth(60);

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

    // Freeze-frame after a hit: sells the impact.
    if (this.hitstop > 0) {
      this.hitstop -= dt;
      if (this.hitstop <= 0) this.physics.world.resume();
      return;
    }

    let t = 1;
    if (this.phase === 'run') {
      this.elapsed += dt;
      t = Math.min(this.elapsed / this.era.duration, 1);
      this.speed = Phaser.Math.Linear(this.era.startSpeed, this.era.endSpeed, t);
      this.progressBar.width = 100 * t;
      this.speedCallouts(t);
    } else {
      this.speed = this.era.endSpeed * 0.7;
    }

    this.scrollWorld(dt);
    this.handleInput(dt);
    if (this.phase === 'run') this.spawn(t, dt);
    this.updateGhosts(dt);
    this.updatePower(dt);
    this.updatePlayerShots();
    this.checkNearMisses();
    this.cleanup();
    this.boss?.update(dt);

    if (this.invuln > 0) {
      this.invuln -= dt;
      this.player.setAlpha(Math.floor(this.invuln * 12) % 2 ? 0.3 : 1);
      if (this.invuln <= 0) this.player.setAlpha(1);
    }

    if (this.phase !== 'reveal') this.score += this.speed * dt * 0.05;
    this.scoreText.setText(String(Math.floor(this.score)));
    this.multText.setText(this.mult > 1 ? `x${this.mult}` : '');

    // Run section over and the screen is clear: bring in the boss.
    if (this.phase === 'run' && t >= 1 && this.obstacles.countActive() === 0 && this.ghosts.countActive() === 0) this.startBoss();
  }

  speedCallouts(t) {
    for (const mark of [0.33, 0.66]) {
      if (t >= mark && !this.callouts.has(mark)) {
        this.callouts.add(mark);
        this.fx.banner('SPEED UP!', this.era.palette.accent);
        sfx.mult();
      }
    }
  }

  scrollWorld(dt) {
    this.ground.tilePositionX += this.speed * dt;
    this.sky.tilePositionX += this.speed * dt * (this.era.skyScroll ?? 0.05);
    for (const g of [this.obstacles, this.coins, this.orbs]) g.setVelocityX(-this.speed);
  }

  handleInput(dt) {
    const body = this.player.body;
    const onGround = body.blocked.down || body.touching.down;
    const JD = Phaser.Input.Keyboard.JustDown;
    const jumpPressed = JD(this.keys.jump) || JD(this.keys.up) || JD(this.keys.w);
    const jumpHeld = this.keys.jump.isDown || this.keys.up.isDown || this.keys.w.isDown;
    const downHeld = this.keys.down.isDown || this.keys.s.isDown;

    // Landing: dust puff.
    if (onGround && !this.wasOnGround) this.fx.dust(this.player.x, GROUND_Y, 6);
    this.wasOnGround = onGround;

    // Coyote time + jump buffering = jumps that "should" work, do.
    if (onGround) { this.coyote = COYOTE_TIME; this.airJumps = this.era.doubleJump ? 1 : 0; } else this.coyote -= dt;
    this.jumpBuffer = jumpPressed ? JUMP_BUFFER : this.jumpBuffer - dt;

    if (this.jumpBuffer > 0 && !(onGround && downHeld)) {
      if (this.coyote > 0) {
        this.jump(JUMP_VELOCITY);
      } else if (jumpPressed && this.airJumps > 0) {
        this.airJumps--;
        this.jump(JUMP_VELOCITY * 0.85);
        this.fx.sparkle(this.player.x, this.player.y, 5);
      }
    }
    // Variable jump height: let go early for a short hop.
    if (!jumpHeld && body.velocity.y < 0) body.setVelocityY(body.velocity.y * JUMP_CUT ** (dt * 20));

    // Down in the air = fast fall; down on the ground = slide.
    if (downHeld && !onGround) body.setVelocityY(Math.max(body.velocity.y, 350));
    if (downHeld && onGround && !this.sliding) { this.setSlidingBody(); this.fx.dust(this.player.x - 4, GROUND_Y, 4); }
    if (!downHeld && this.sliding) this.setStandingBody();

    // Sprite frame.
    const id = this.era.id;
    if (this.sliding) {
      this.player.setTexture(`player-${id}-slide`);
      if (Math.random() < 0.3) this.fx.dust(this.player.x - 6, GROUND_Y, 1);
    } else if (!onGround) this.player.setTexture(`player-${id}-jump`);
    else {
      this.animTimer += dt * (this.speed / 120);
      this.player.setTexture(`player-${id}-${Math.floor(this.animTimer * 8) % 2 ? 'run2' : 'run1'}`);
    }
  }

  jump(velocity) {
    this.player.body.setVelocityY(velocity);
    this.coyote = 0;
    this.jumpBuffer = 0;
    if (this.sliding) this.setStandingBody();
    this.fx.dust(this.player.x, GROUND_Y, 4);
    sfx.jump();
  }

  // ---------- Spawning ----------

  spawn(t, dt) {
    if (t >= 1) return;
    this.distToNext -= this.speed * dt;
    if (this.distToNext > 0) return;

    const tier = t < 0.3 ? 0 : t < 0.65 ? 1 : 2;
    const pattern = pickPattern(tier, this.era, this.power > 0);
    const x0 = GAME_W + 20;
    for (const it of pattern.items) {
      const x = x0 + it.dx;
      if (it.k === 'low' || it.k === 'high') this.addObstacle(it.k, x);
      else if (it.k === 'coin') this.addCoin(x, GROUND_Y - it.h);
      else if (it.k === 'ghostLow') this.addGhost('low', x);
      else if (it.k === 'ghostHigh') this.addGhost('high', x);
      else if (it.k === 'orb') this.addOrb(x, ORB_Y);
    }
    this.distToNext = pattern.width + Phaser.Math.Between(120, 200) - tier * 15;
  }

  addObstacle(kind, x) {
    const y = kind === 'low' ? GROUND_Y : HIGH_BOTTOM;
    const o = this.obstacles.create(x, y, `${kind}-${this.era.id}`).setOrigin(0.5, 1);
    o.kind = kind;
    o.body.setSize(o.width - 3, o.height - 3);
    return o;
  }

  addCoin(x, y) {
    return this.coins.create(x, y, `coin-${this.era.id}`);
  }

  addGhost(lane, x) {
    const baseY = lane === 'low' ? GROUND_Y : GHOST_HIGH_BOTTOM;
    const g = this.ghosts.create(x, baseY, this.power > 0 ? 'ghost-scared' : 'ghost').setOrigin(0.5, 1);
    g.kind = lane;
    g.baseY = baseY;
    g.bob = Math.random() * 6;
    g.body.setSize(8, 9);
    return g;
  }

  addOrb(x, y) {
    const o = this.orbs.create(x, y, 'orb');
    this.tweens.add({ targets: o, alpha: 0.5, duration: 200, yoyo: true, repeat: -1 });
    return o;
  }

  // ---------- Mechanics ----------

  updateGhosts(dt) {
    const scared = this.power > 0;
    const flashing = scared && this.power < 1.5 && Math.floor(this.power * 8) % 2;
    for (const g of this.ghosts.getChildren()) {
      g.bob += dt;
      if (g.kind === 'high') g.y = g.baseY + Math.sin(g.bob * 6) * 2;
      // Normal ghosts rush you; scared ones try (and fail) to flee.
      g.setVelocityX(scared ? -this.speed * 0.6 : -(this.speed + 25));
      g.setTexture(!scared ? 'ghost' : flashing ? 'ghost-flash' : 'ghost-scared');
    }
  }

  updatePower(dt) {
    if (this.power <= 0) { this.powerBar.width = 0; return; }
    this.power -= dt;
    this.powerBar.width = 24 * Math.max(this.power, 0) / POWER_TIME;
    this.powerBar.y = GROUND_Y + 6;
  }

  updatePlayerShots() {
    for (const s of this.playerShots.getChildren().slice()) {
      if (this.boss && !this.boss.dead && s.x >= this.boss.hitX) { this.boss.damage(0.2); s.destroy(); }
      else if (s.x > GAME_W + 20) s.destroy();
    }
  }

  // Dodging something by a hair pays out — it rewards late jumps and slides.
  checkNearMisses() {
    if (this.phase === 'reveal') return;
    const groups = [this.obstacles, this.ghosts];
    if (this.boss) groups.push(this.boss.shots);
    const pb = this.player.body;
    for (const grp of groups) {
      for (const o of grp.getChildren()) {
        if (o.passed || o.x + o.width / 2 >= pb.left) continue;
        o.passed = true;
        if (this.invuln > 0 || (grp === this.ghosts && this.power > 0)) continue;
        const close = o.kind === 'high' ? this.sliding : pb.bottom > o.body.top - 10;
        if (close) {
          const pts = 20 * this.mult;
          this.score += pts;
          this.fx.popup(this.player.x, this.player.y - 22, `CLOSE! +${pts}`, '#05d9e8');
          sfx.near();
        }
      }
    }
  }

  cleanup() {
    for (const g of [this.obstacles, this.coins, this.ghosts, this.orbs]) {
      g.getChildren().slice().forEach((o) => { if (o.x < -30) o.destroy(); });
    }
  }

  onCoin(coin) {
    this.fx.sparkle(coin.x, coin.y, 4);
    coin.destroy();
    this.chain++;
    const mult = Math.min(MAX_MULT, 1 + Math.floor(this.chain / COINS_PER_MULT));
    if (mult > this.mult) {
      this.mult = mult;
      this.fx.popup(this.player.x, this.player.y - 26, `COMBO x${mult}!`, '#ffd93b');
      sfx.mult();
    } else sfx.coin();
    this.score += 10 * this.mult;
  }

  onGhost(g) {
    if (this.power > 0) {
      // Eating ghosts in a row doubles the payout each time: 100, 200, 400, 800.
      this.ghostsEaten++;
      const pts = 50 * 2 ** Math.min(this.ghostsEaten, 4) * this.mult;
      this.score += pts;
      this.fx.sparkle(g.x, g.y - 6, 12);
      this.fx.popup(g.x, g.y - 16, `+${pts}`, '#ffffff');
      sfx.eat();
      g.destroy();
    } else {
      this.onHit();
    }
  }

  onOrb(orb) {
    this.fx.sparkle(orb.x, orb.y, 14);
    orb.destroy();
    if (this.phase === 'boss') {
      // During a boss, orbs fire back.
      const s = this.playerShots.create(this.player.x + 8, this.player.y - 8, 'pshot');
      s.setVelocityX(340);
      sfx.zap();
    } else if (this.era.ghosts) {
      this.power = POWER_TIME;
      this.ghostsEaten = 0;
      this.cameras.main.flash(120, 80, 100, 255);
      this.fx.banner('POWER UP!', '#2b4cff');
      sfx.power();
    } else {
      this.score += 100 * this.mult;
      this.fx.popup(this.player.x, this.player.y - 22, `+${100 * this.mult}`, '#ffd93b');
      sfx.power();
    }
  }

  onHit() {
    if (this.invuln > 0 || this.finishing || this.phase === 'reveal') return;
    this.hearts--;
    this.invuln = INVULN_TIME;
    if (this.mult > 1) this.fx.popup(this.player.x, this.player.y - 26, 'COMBO LOST', '#ff3355');
    this.chain = 0;
    this.mult = 1;
    sfx.hit();
    this.cameras.main.shake(150, 0.012);
    this.cameras.main.flash(80, 255, 60, 60);
    this.hitstop = HITSTOP;
    this.physics.world.pause();
    this.heartIcons.forEach((h, i) => h.setVisible(i < this.hearts));

    if (this.hearts <= 0) {
      // Checkpoint: back to the start of this era — or straight to the boss if you died there.
      this.finishing = true;
      const atBoss = this.phase === 'boss';
      const score = atBoss && !this.startData.startAtBoss ? this.bossStartScore : this.startData.score;
      this.time.delayedCall(450, () => this.scene.start('EraCard', { ...this.startData, score, startAtBoss: atBoss, retry: true }));
    }
  }

  // ---------- Phases ----------

  startBoss() {
    this.phase = 'boss';
    this.bossStartScore = Math.floor(this.score);
    this.progressBar.setVisible(false);
    this.progressBg.setVisible(false);
    this.power = 0;
    this.fx.banner(this.era.boss.name, '#ff3355', this.era.boss.tagline);
    playMusic({ ...this.era.music, bpm: this.era.music.bpm * 1.2 });
    this.boss = new Boss(this, this.era, () => this.revealMemory());
  }

  // The payoff: the era's memory item drops in, front and centre.
  revealMemory() {
    this.phase = 'reveal';
    this.finishing = true;
    for (const g of [this.obstacles, this.ghosts, this.orbs]) g.clear(true, true);
    stopMusic();
    sfx.memory();

    const cx = GAME_W / 2;
    const dim = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0).setOrigin(0).setDepth(85);
    this.tweens.add({ targets: dim, fillAlpha: 0.6, duration: 400 });

    const glow = this.add.circle(cx, 72, 30, 0xffffff, 0.15).setDepth(86);
    this.tweens.add({ targets: glow, scale: 1.3, alpha: 0.05, duration: 600, yoyo: true, repeat: -1 });

    const item = this.add.image(cx, -30, `memory-${this.era.id}`).setScale(4).setDepth(87);
    this.tweens.add({ targets: item, y: 72, duration: 900, ease: 'Bounce.Out' });
    this.tweens.add({ targets: item, angle: { from: -4, to: 4 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
    this.time.addEvent({ delay: 250, repeat: 10, callback: () => this.fx.sparkle(cx + Phaser.Math.Between(-30, 30), 72 + Phaser.Math.Between(-30, 30), 6) });

    const name = this.add.text(cx, 116, `${this.era.memory.toUpperCase()} GET!`, textStyle(8, '#ffd93b', true)).setOrigin(0.5).setDepth(88).setAlpha(0);
    const line = this.add.text(cx, 132, this.era.memoryLine, textStyle(8, '#ffffff', true)).setOrigin(0.5).setDepth(88).setAlpha(0);
    this.tweens.add({ targets: name, alpha: 1, duration: 300, delay: 900 });
    this.tweens.add({ targets: line, alpha: 1, duration: 500, delay: 1400 });

    const bonus = this.hearts * 100;
    if (bonus) this.time.delayedCall(1900, () => this.fx.popup(cx, 150, `HEARTS BONUS +${bonus}`, '#ff71ce'));

    const memories = [...this.startData.memories, this.era.id];
    const nextIndex = this.startData.eraIndex + 1;
    const score = Math.floor(this.score) + bonus;
    this.time.delayedCall(4200, () => {
      if (nextIndex < ERAS.length) this.scene.start('EraCard', { eraIndex: nextIndex, score, memories });
      else this.scene.start('End', { score, memories });
    });
  }
}
