// 1995 — THE DIAL-UP YEARS. A 16-bit side-scrolling platformer you control:
// hold -> to build momentum, jump / double jump, v to spin under things.
// Collect milk caps; getting hit scatters them (grab them back!) instead of
// costing a life — you only lose a life if you get hit with 0 caps.
// Springs, power orbs that make ghosts edible, then THE Y2K BUG boss.
import Phaser from 'phaser';
import {
  GAME_W, GAME_H, GROUND_Y, JUMP_VELOCITY, JUMP_CUT, INVULN_TIME, textStyle,
  COYOTE_TIME, JUMP_BUFFER, HITSTOP, HIGH_BOTTOM, ORB_Y, POWER_TIME, POWER_WARN,
} from '../config.js';
import { ERAS } from '../eras/index.js';
import { state, addScore } from '../state.js';
import { playEraMusic, setEraMusicRate, stopMusic, sfx } from '../audio/audio.js';
import { pickPattern } from '../systems/patterns.js';
import { makeFx } from '../systems/fx.js';
import Hud from '../systems/hud.js';
import Boss from '../systems/Boss.js';
import { loseLife, revealMemory, slang } from '../systems/reveal.js';

const PLAYER_X = 70;
const ACCEL = 150; // px/s² while holding ->
const BRAKE = 320; // px/s² while holding <-
const COAST = 45; // px/s² slow-down with no input
const SPRING_VELOCITY = -520;

export default class PlatformerScene extends Phaser.Scene {
  constructor() { super('Platformer'); }

  create(data = {}) {
    this.era = ERAS.find((e) => e.scene === 'Platformer');
    const id = this.era.id;

    this.phase = data.startAtBoss ? 'boss' : 'run';
    this.dist = 0;
    this.speed = 0;
    this.distToNext = 160;
    this.invuln = 0;
    this.hitstop = 0;
    this.animTimer = 0;
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.airJumps = 0;
    this.wasOnGround = true;
    this.caps = 0;
    this.power = 0;
    this.ghostsEaten = 0;
    this.callouts = new Set();
    this.boss = null;
    this.dead = false;

    // --- World ---
    this.cameras.main.setBackgroundColor(this.era.palette.bg);
    this.sky = this.add.tileSprite(0, 0, GAME_W, GROUND_Y, `sky-${id}`).setOrigin(0);
    this.ground = this.add.tileSprite(0, GROUND_Y, GAME_W, GAME_H - GROUND_Y, `ground-${id}`).setOrigin(0);
    this.floor = this.add.zone(GAME_W / 2, GROUND_Y + 20, GAME_W * 2, 40);
    this.physics.add.existing(this.floor, true);

    // --- Player ---
    this.player = this.physics.add.sprite(PLAYER_X, GROUND_Y, `player-${id}-run1`).setOrigin(0.5, 1).setDepth(30);
    this.setStandingBody();
    this.physics.add.collider(this.player, this.floor);
    if (state.cheats.bighead) this.head = this.add.image(0, 0, 'bighead').setOrigin(0.5, 1).setDepth(31);

    // --- Things that scroll at you ---
    const group = () => this.physics.add.group({ allowGravity: false, immovable: true });
    this.obstacles = group();
    this.coins = group();
    this.ghosts = group();
    this.orbs = group();
    this.springs = group();
    this.playerShots = group();
    this.loose = this.physics.add.group({ bounceY: 0.6 }); // scattered caps
    this.physics.add.collider(this.loose, this.floor);
    this.physics.add.overlap(this.player, this.obstacles, () => this.onHit());
    this.physics.add.overlap(this.player, this.coins, (_p, c) => this.onCap(c));
    this.physics.add.overlap(this.player, this.loose, (_p, c) => { if (c.grabbable) this.onCap(c); });
    this.physics.add.overlap(this.player, this.ghosts, (_p, g) => this.onGhost(g));
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.onOrb(o));
    this.physics.add.overlap(this.player, this.springs, (_p, s) => this.onSpring(s));

    this.fx = makeFx(this, this.era.palette.line);

    // --- Overlays + HUD ---
    if (this.era.scanlines > 0) this.add.image(0, 0, 'scanlines').setOrigin(0).setAlpha(this.era.scanlines).setDepth(50);
    this.powerTint = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x2b4cff, 0).setOrigin(0).setDepth(49);
    this.hud = new Hud(this, '90s', { extraLabel: 'CAPS ' });
    this.progressBg = this.add.rectangle(GAME_W / 2 - 50, 8, 100, 4, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(60);
    this.progressBar = this.add.rectangle(GAME_W / 2 - 50, 8, 0, 4, 0xffe000).setOrigin(0, 0.5).setDepth(60);
    this.powerBar = this.add.rectangle(GAME_W / 2 - 50, 15, 0, 3, 0x6f8bff).setOrigin(0, 0.5).setDepth(60);
    this.speedText = this.add.text(GAME_W / 2, 20, '', textStyle(8, '#ffffff', true)).setOrigin(0.5, 0).setDepth(60);

    this.keys = this.input.keyboard.addKeys('SPACE,UP,W,DOWN,S,LEFT,A,RIGHT,D,N');
    playEraMusic(this.era);
    this.events.once('shutdown', stopMusic);
    if (this.phase === 'boss') { this.phase = 'run'; this.dist = this.era.length; } // straight to boss
  }

  setStandingBody() { this.player.body.setSize(8, 14, false).setOffset(4, 2); this.sliding = false; }
  setSlidingBody() { this.player.body.setSize(12, 6, false).setOffset(2, 10); this.sliding = true; }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    if (state.cheats.god && Phaser.Input.Keyboard.JustDown(this.keys.N) && this.phase !== 'reveal') { this.finish(); return; }

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      if (this.hitstop <= 0) this.physics.world.resume();
      return;
    }

    let t = 1;
    if (this.phase === 'run') {
      t = Math.min(this.dist / this.era.length, 1);
      this.updateSpeed(dt, t);
      this.dist += this.speed * dt;
      this.progressBar.width = 100 * t;
      this.speedCallouts(t);
    } else if (this.phase === 'boss') {
      this.speed = 120;
      const dir = (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0) - (this.keys.LEFT.isDown || this.keys.A.isDown ? 1 : 0);
      this.player.x = Phaser.Math.Clamp(this.player.x + dir * 110 * dt, 24, 200);
    } else {
      this.speed = Math.max(0, this.speed - 200 * dt);
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
    if (this.head) {
      this.head.setPosition(this.player.x, this.player.y - (this.sliding ? 5 : 10)).setAlpha(this.player.alpha);
    }
    this.hud.update(this.caps);
    this.speedText.setText(this.phase === 'run' && this.speed > 200 ? 'TURBO!' : '');

    if (this.phase === 'run' && t >= 1 && this.obstacles.countActive() === 0 && this.ghosts.countActive() === 0) this.startBoss();
  }

  // Momentum: hold -> to speed up (top speed grows through the level).
  updateSpeed(dt, t) {
    const max = Phaser.Math.Linear(120, 235, t);
    const right = this.keys.RIGHT.isDown || this.keys.D.isDown;
    const left = this.keys.LEFT.isDown || this.keys.A.isDown;
    if (right) this.speed = Math.min(max, this.speed + ACCEL * dt);
    else if (left) this.speed = Math.max(0, this.speed - BRAKE * dt);
    else this.speed = Math.max(0, this.speed - COAST * dt);
  }

  speedCallouts(t) {
    for (const mark of [0.33, 0.66]) {
      if (t >= mark && !this.callouts.has(mark)) {
        this.callouts.add(mark);
        this.fx.banner(mark < 0.5 ? 'ZONE 2' : 'ZONE 3', '#ffe000');
        sfx.mult();
      }
    }
  }

  scrollWorld(dt) {
    this.ground.tilePositionX += this.speed * dt;
    this.sky.tilePositionX += this.speed * dt * 0.05;
    for (const g of [this.obstacles, this.coins, this.orbs, this.springs]) g.setVelocityX(-this.speed);
  }

  handleInput(dt) {
    const body = this.player.body;
    const onGround = body.blocked.down || body.touching.down;
    const JD = Phaser.Input.Keyboard.JustDown;
    const jumpPressed = JD(this.keys.SPACE) || JD(this.keys.UP) || JD(this.keys.W);
    const jumpHeld = this.keys.SPACE.isDown || this.keys.UP.isDown || this.keys.W.isDown;
    const downHeld = this.keys.DOWN.isDown || this.keys.S.isDown;

    if (onGround && !this.wasOnGround) this.fx.dust(this.player.x, GROUND_Y, 6);
    this.wasOnGround = onGround;

    if (onGround) { this.coyote = COYOTE_TIME; this.airJumps = 1; } else this.coyote -= dt;
    this.jumpBuffer = jumpPressed ? JUMP_BUFFER : this.jumpBuffer - dt;

    if (this.jumpBuffer > 0 && !(onGround && downHeld)) {
      if (this.coyote > 0) this.jump(JUMP_VELOCITY);
      else if (jumpPressed && this.airJumps > 0) {
        this.airJumps--;
        this.jump(JUMP_VELOCITY * 0.85);
        this.fx.sparkle(this.player.x, this.player.y, 5);
      }
    }
    if (!jumpHeld && body.velocity.y < 0 && !this.springing) body.setVelocityY(body.velocity.y * JUMP_CUT ** (dt * 20));
    if (body.velocity.y >= 0) this.springing = false;

    if (downHeld && !onGround) body.setVelocityY(Math.max(body.velocity.y, 350));
    if (downHeld && onGround && !this.sliding) { this.setSlidingBody(); this.fx.dust(this.player.x - 4, GROUND_Y, 4); }
    if (!downHeld && this.sliding) this.setStandingBody();

    const id = this.era.id;
    if (this.sliding) {
      this.player.setTexture(`player-${id}-slide`);
      if (Math.random() < 0.3) this.fx.dust(this.player.x - 6, GROUND_Y, 1);
    } else if (!onGround) this.player.setTexture(`player-${id}-jump`);
    else if (this.speed < 4) this.player.setTexture(`player-${id}-run1`);
    else {
      this.animTimer += dt * (this.speed / 110);
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
    const hostileGhost = this.ghosts.getChildren().some((g) => !g.fleeing);
    const pattern = pickPattern(tier, this.era, { powerActive: this.power > 0, ghostOnScreen: hostileGhost });
    const x0 = GAME_W + 20;
    for (const it of pattern.items) {
      const x = x0 + it.dx;
      if (it.k === 'low' || it.k === 'high') this.addObstacle(it.k, x);
      else if (it.k === 'coin') this.addCoin(x, GROUND_Y - it.h);
      else if (it.k === 'ghost') this.addGhost(x);
      else if (it.k === 'orb') this.addOrb(x, ORB_Y);
      else if (it.k === 'spring') this.springs.create(x, GROUND_Y, 'spring').setOrigin(0.5, 1);
    }
    this.distToNext = pattern.width + Phaser.Math.Between(110, 190) - tier * 15;
  }

  addObstacle(kind, x) {
    const y = kind === 'low' ? GROUND_Y : HIGH_BOTTOM;
    const o = this.obstacles.create(x, y, `${kind}-${this.era.id}`).setOrigin(0.5, 1);
    o.kind = kind;
    o.body.setSize(o.width - 3, o.height - 3);
    return o;
  }

  addCoin(x, y) { return this.coins.create(x, y, `coin-${this.era.id}`); }

  // Ghosts always come along the ground lane, so a jump always clears them.
  addGhost(x) {
    const g = this.ghosts.create(x, GROUND_Y, this.power > 0 ? 'ghost-scared' : 'ghost').setOrigin(0.5, 1);
    g.kind = 'low';
    g.bob = Math.random() * 6;
    g.body.setSize(8, 9);
    return g;
  }

  addOrb(x, y) {
    const o = this.orbs.create(x, y, 'orb');
    this.tweens.add({ targets: o, alpha: 0.5, duration: 200, yoyo: true, repeat: -1 });
    return o;
  }

  // ---------- Ghosts + power ----------

  updateGhosts(dt) {
    const scared = this.power > 0;
    const flashing = scared && this.power < POWER_WARN && Math.floor(this.power * 8) % 2;
    for (const g of this.ghosts.getChildren().slice()) {
      if (g.fleeing) { if (g.y < -20) g.destroy(); continue; }
      g.bob += dt;
      g.y = GROUND_Y - Math.abs(Math.sin(g.bob * 5)) * 3; // a little hop
      // Hostile ghosts creep at you a bit faster than the scenery; edible ones
      // drift toward you so you can always catch them by just running.
      g.setVelocityX(scared ? -(this.speed + 30) : -(this.speed + 18));
      g.setTexture(!scared ? 'ghost' : flashing ? 'ghost-flash' : 'ghost-scared');
    }
  }

  updatePower(dt) {
    if (this.power <= 0) return;
    this.power -= dt;
    this.powerBar.width = 100 * Math.max(this.power, 0) / POWER_TIME;
    if (this.power <= 0) this.endPower();
  }

  startPower() {
    this.power = POWER_TIME;
    this.ghostsEaten = 0;
    this.cameras.main.flash(120, 80, 100, 255);
    this.tweens.add({ targets: this.powerTint, fillAlpha: 0.16, duration: 200 });
    this.fx.banner('POWER UP!', '#6f8bff', 'GHOSTS ARE EDIBLE!');
    setEraMusicRate(this.era, 1.15);
    sfx.power();
  }

  // Power ran out: ghosts on screen run away instead of turning on you.
  endPower() {
    this.power = 0;
    this.powerBar.width = 0;
    this.tweens.add({ targets: this.powerTint, fillAlpha: 0, duration: 300 });
    for (const g of this.ghosts.getChildren()) {
      g.fleeing = true;
      g.setTexture('ghost');
      g.setVelocity(-this.speed * 0.5, -140);
    }
    setEraMusicRate(this.era, 1);
  }

  onGhost(g) {
    if (g.fleeing) return;
    if (this.power > 0) {
      // Each ghost in a chain is worth double: 200, 400, 800, 1600.
      const pts = 200 * 2 ** Math.min(this.ghostsEaten, 3);
      sfx.eat(this.ghostsEaten);
      this.ghostsEaten++;
      addScore(pts);
      this.fx.sparkle(g.x, g.y - 6, 16);
      const t = this.add.text(g.x, g.y - 18, String(pts), textStyle(16, '#ffffff', true)).setOrigin(0.5).setDepth(75);
      this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 900, onComplete: () => t.destroy() });
      g.destroy();
      this.hitstop = 0.06; // tiny freeze-frame sells the chomp
      this.physics.world.pause();
    } else {
      this.onHit();
    }
  }

  onOrb(orb) {
    this.fx.sparkle(orb.x, orb.y, 14);
    orb.destroy();
    if (this.phase === 'boss') {
      const s = this.playerShots.create(this.player.x + 8, this.player.y - 8, 'pshot');
      s.setVelocityX(340);
      sfx.zap();
    } else {
      this.startPower();
    }
  }

  onSpring(spring) {
    if (this.player.body.velocity.y < 0) return;
    this.player.body.setVelocityY(SPRING_VELOCITY);
    this.springing = true;
    if (this.sliding) this.setStandingBody();
    this.tweens.add({ targets: spring, scaleY: 0.5, duration: 80, yoyo: true });
    sfx.boing();
  }

  updatePlayerShots() {
    for (const s of this.playerShots.getChildren().slice()) {
      if (this.boss && !this.boss.dead && s.x >= this.boss.hitX) { this.boss.damage(0.2); s.destroy(); }
      else if (s.x > GAME_W + 20) s.destroy();
    }
  }

  // Dodging by a hair pays out — rewards late jumps and spins.
  checkNearMisses() {
    if (this.phase === 'reveal') return;
    const groups = [this.obstacles];
    if (this.boss) groups.push(this.boss.shots);
    const pb = this.player.body;
    for (const grp of groups) {
      for (const o of grp.getChildren()) {
        if (o.passed || o.x + o.width / 2 >= pb.left) continue;
        o.passed = true;
        if (this.invuln > 0) continue;
        const close = o.kind === 'high' ? this.sliding : pb.bottom > o.body.top - 10;
        if (close) {
          addScore(25);
          this.fx.popup(this.player.x, this.player.y - 22, 'CLOSE! +25', '#ffe000');
          sfx.near();
        }
      }
    }
  }

  cleanup() {
    for (const g of [this.obstacles, this.coins, this.ghosts, this.orbs, this.springs, this.loose]) {
      g.getChildren().slice().forEach((o) => { if (o.x < -30) o.destroy(); });
    }
  }

  onCap(cap) {
    this.fx.sparkle(cap.x, cap.y, 4);
    cap.destroy();
    this.caps++;
    addScore(10);
    sfx.coin();
  }

  // The 90s rule: a hit scatters your caps. With no caps, it costs a life.
  onHit() {
    if (this.invuln > 0 || this.dead || this.phase === 'reveal') return;
    if (state.cheats.god) { this.invuln = 0.5; return; }
    sfx.hit();
    this.cameras.main.shake(150, 0.012);
    this.hitstop = HITSTOP;
    this.physics.world.pause();

    if (this.caps > 0) {
      this.scatterCaps();
      this.invuln = INVULN_TIME;
      slang(this, this.era, 'hit', '#ff3355');
      return;
    }
    this.dead = true;
    this.cameras.main.flash(120, 255, 60, 60);
    loseLife(this, this.era, () => {
      this.dead = false;
      this.invuln = 2;
    });
  }

  scatterCaps() {
    const n = Math.min(this.caps, 12);
    this.caps = 0;
    for (let i = 0; i < n; i++) {
      const c = this.loose.create(this.player.x, this.player.y - 10, `coin-${this.era.id}`);
      const angle = Phaser.Math.DegToRad(-160 + (140 * i) / Math.max(n - 1, 1));
      c.setVelocity(Math.cos(angle) * 110, Math.sin(angle) * 220);
      c.grabbable = false;
      this.time.delayedCall(450, () => { if (c.active) c.grabbable = true; });
      this.time.delayedCall(2200, () => { if (c.active) this.tweens.add({ targets: c, alpha: 0, duration: 120, yoyo: true, repeat: 4 }); });
      this.time.delayedCall(3200, () => c.destroy());
    }
  }

  // ---------- Phases ----------

  startBoss() {
    this.phase = 'boss';
    this.progressBar.setVisible(false);
    this.progressBg.setVisible(false);
    if (this.power > 0) this.endPower();
    this.fx.banner(this.era.boss.name, '#ff3355', this.era.boss.tagline);
    playEraMusic(this.era, 1.1);
    this.boss = new Boss(this, this.era, () => { addScore(1000); this.reveal(); });
  }

  reveal() {
    this.phase = 'reveal';
    for (const g of [this.obstacles, this.ghosts, this.orbs, this.springs]) g.clear(true, true);
    revealMemory(this, this.era);
  }

  finish() {
    this.boss?.shots.clear(true, true);
    if (this.boss) this.boss.dead = true;
    this.reveal();
  }
}
