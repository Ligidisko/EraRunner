// 1995 — THE DIAL-UP YEARS. A 16-bit side-scrolling platformer level:
// run left AND right with momentum, jump / double jump, spin (v) at speed,
// climb one-way platforms up a two-screen-tall world, bump bonus blocks,
// stomp patrolling ghosts (or eat them with a power orb), avoid pits.
// Getting hit scatters your milk caps; with 0 caps it costs a life.
// Reach the SAVE sign to fight THE Y2K BUG in the arena.
import Phaser from 'phaser';
import {
  GAME_W, GAME_H, JUMP_VELOCITY, JUMP_CUT, INVULN_TIME, textStyle,
  COYOTE_TIME, JUMP_BUFFER, HITSTOP, POWER_TIME, POWER_WARN,
} from '../config.js';
import { ERAS } from '../eras/index.js';
import { state, addScore, takeResumeAtBoss } from '../state.js';
import { playEraMusic, setEraMusicRate, stopMusic, sfx } from '../audio/audio.js';
import { makeFx } from '../systems/fx.js';
import { makeCanvasTexture } from '../gfx/pixelArt.js';
import Hud from '../systems/hud.js';
import Boss from '../systems/Boss.js';
import { loseLife, revealMemory, slang } from '../systems/reveal.js';
import { buildLevel, TILE, ROWS, GROUND_ROW } from '../levels/level90s.js';

const WORLD_H = ROWS * TILE;
const GROUND_Y = GROUND_ROW * TILE; // top of the ground, in world pixels
const MAX_SPEED = 140;
const ACCEL = 520; // px/s² on the ground
const AIR_ACCEL = 320;
const FRICTION = 620; // slow-down with no input, on the ground
const SPRING_VELOCITY = -560;
const STOMP_BOUNCE = -260;
const GHOST_SPEED = 32;

export default class PlatformerScene extends Phaser.Scene {
  constructor() { super('Platformer'); }

  create() {
    // Phaser reuses scene objects: reset per-run flags every time the scene starts.
    this.head = null;
    this.exit = null;
    this.exitX = 0;
    this.springing = false;
    this.dropping = false;
    this.era = ERAS.find((e) => e.scene === 'Platformer');
    const id = this.era.id;
    this.makeTileTextures();

    this.phase = 'run';
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
    this.stompChain = 0;
    this.boss = null;
    this.dead = false;

    // --- Backdrop (pinned to the camera, scrolls slowly for parallax) ---
    this.cameras.main.setBackgroundColor(this.era.palette.bg);
    this.sky = this.add.tileSprite(0, 0, GAME_W, 150, `sky-${id}`).setOrigin(0).setScrollFactor(0).setDepth(-10);

    // --- Level ---
    const { grid, width, arenaCol } = buildLevel();
    this.grid = grid;
    this.levelW = width * TILE;
    this.arenaX = arenaCol * TILE;
    this.solids = this.physics.add.staticGroup();
    this.oneways = this.physics.add.staticGroup();
    this.coins = this.physics.add.group({ allowGravity: false, immovable: true });
    this.hazards = this.physics.add.staticGroup();
    this.springs = this.physics.add.staticGroup();
    this.orbs = this.physics.add.group({ allowGravity: false, immovable: true });
    this.ghosts = this.physics.add.group();
    this.playerShots = this.physics.add.group({ allowGravity: false });
    this.loose = this.physics.add.group({ bounceY: 0.5 }); // scattered caps
    grid.forEach((row, r) => row.forEach((ch, c) => {
      const x = c * TILE + TILE / 2;
      const y = r * TILE + TILE / 2;
      const bottom = (r + 1) * TILE;
      if (ch === '#') this.solids.create(x, y, grid[r - 1]?.[c] === '#' ? 'tile-fill' : 'tile-top');
      else if (ch === 'B') { const b = this.solids.create(x, y, 'tile-bonus'); b.bonus = true; }
      else if (ch === '-') this.oneways.create(x, r * TILE + 3, 'tile-plat');
      else if (ch === 'c') this.coins.create(x, y, `coin-${id}`);
      else if (ch === 'g') this.addGhost(x, bottom);
      else if (ch === 's') this.springs.create(x, bottom - 4, 'spring');
      else if (ch === 'o') this.addOrb(x, y);
      else if (ch === 'x') this.hazards.create(x, bottom - 6, `low-${id}`);
      else if (ch === 'E') {
        this.exitX = x;
        this.exit = this.physics.add.staticImage(x, bottom - 16, 'exit-sign');
      }
    }));

    // --- Player ---
    this.player = this.physics.add.sprite(40, GROUND_Y, `player-${id}-run1`).setOrigin(0.5, 1).setDepth(30);
    this.setStandingBody();
    this.player.setCollideWorldBounds(true);
    this.checkpoint = { x: 40 };
    if (state.cheats.bighead) this.head = this.add.image(0, 0, 'bighead').setOrigin(0.5, 1).setDepth(31);

    this.physics.world.setBounds(0, -300, this.levelW, WORLD_H + 600);
    // One-way platforms only catch things falling onto them from above.
    const oneWay = (isPlayer) => (obj, plat) =>
      obj.body.velocity.y >= 0 && obj.body.bottom <= plat.body.top + 6 && !(isPlayer && this.dropping);
    this.physics.add.collider(this.player, this.solids, (_p, tile) => this.onBump(tile));
    this.physics.add.collider(this.player, this.oneways, null, oneWay(true));
    this.physics.add.collider(this.ghosts, this.solids);
    this.physics.add.collider(this.ghosts, this.oneways, null, oneWay(false));
    this.physics.add.collider(this.loose, this.solids);
    this.physics.add.overlap(this.player, this.coins, (_p, c) => this.onCap(c));
    this.physics.add.overlap(this.player, this.loose, (_p, c) => { if (c.grabbable) this.onCap(c); });
    this.physics.add.overlap(this.player, this.ghosts, (_p, g) => this.onGhost(g));
    this.physics.add.overlap(this.player, this.orbs, (_p, o) => this.onOrb(o));
    this.physics.add.overlap(this.player, this.springs, (_p, s) => this.onSpring(s));
    this.physics.add.overlap(this.player, this.hazards, () => this.onHit());
    if (this.exit) this.physics.add.overlap(this.player, this.exit, () => this.startBoss());

    // --- Camera follows you through the level, up and down too ---
    const cam = this.cameras.main;
    cam.setBounds(0, 0, this.levelW, WORLD_H);
    cam.startFollow(this.player, true, 0.12, 0.12);
    cam.setDeadzone(50, 40);

    this.fx = makeFx(this, this.era.palette.line);

    // --- Overlays + HUD (pinned to the camera) ---
    if (this.era.scanlines > 0) this.add.image(0, 0, 'scanlines').setOrigin(0).setAlpha(this.era.scanlines).setDepth(50).setScrollFactor(0);
    this.powerTint = this.add.rectangle(0, 0, GAME_W, GAME_H, 0x2b4cff, 0).setOrigin(0).setDepth(49).setScrollFactor(0);
    this.hud = new Hud(this, '90s', { extraLabel: 'CAPS ' });
    this.progressBg = this.add.rectangle(GAME_W / 2 - 50, 8, 100, 4, 0x000000, 0.5).setOrigin(0, 0.5).setDepth(60).setScrollFactor(0);
    this.progressBar = this.add.rectangle(GAME_W / 2 - 50, 8, 0, 4, 0xffe000).setOrigin(0, 0.5).setDepth(60).setScrollFactor(0);
    this.powerBar = this.add.rectangle(GAME_W / 2 - 50, 15, 0, 3, 0x6f8bff).setOrigin(0, 0.5).setDepth(60).setScrollFactor(0);

    this.keys = this.input.keyboard.addKeys('SPACE,UP,W,DOWN,S,LEFT,A,RIGHT,D,N');
    playEraMusic(this.era);
    this.events.once('shutdown', stopMusic);
    if (takeResumeAtBoss()) this.startBoss(); // continue straight into the boss arena
  }

  // Level tiles, drawn in code in the 90s palette.
  makeTileTextures() {
    const R = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
    makeCanvasTexture(this, 'tile-fill', 16, 16, (ctx) => {
      R(ctx, '#2d3047', 0, 0, 16, 16); R(ctx, '#3e4360', 0, 0, 8, 8); R(ctx, '#3e4360', 8, 8, 8, 8);
    });
    makeCanvasTexture(this, 'tile-top', 16, 16, (ctx) => {
      R(ctx, '#2d3047', 0, 0, 16, 16); R(ctx, '#3e4360', 0, 0, 8, 8); R(ctx, '#3e4360', 8, 8, 8, 8);
      R(ctx, '#e84855', 0, 0, 16, 3); R(ctx, '#ff9b71', 0, 0, 16, 1);
    });
    makeCanvasTexture(this, 'tile-bonus', 16, 16, (ctx) => {
      R(ctx, '#000000', 0, 0, 16, 16); R(ctx, '#ffe000', 1, 1, 14, 14); R(ctx, '#fff6a0', 1, 1, 14, 2);
      R(ctx, '#c79a00', 1, 13, 14, 2); // bevel
      R(ctx, '#ff9b71', 5, 5, 6, 6); R(ctx, '#e84855', 6, 6, 4, 4); R(ctx, '#ffffff', 7, 7, 2, 2); // a milk cap
    });
    makeCanvasTexture(this, 'tile-used', 16, 16, (ctx) => {
      R(ctx, '#000000', 0, 0, 16, 16); R(ctx, '#8a6a3a', 1, 1, 14, 14); R(ctx, '#6a4a2a', 1, 13, 14, 2);
    });
    makeCanvasTexture(this, 'tile-plat', 16, 6, (ctx) => {
      R(ctx, '#ff9b71', 0, 0, 16, 6); R(ctx, '#fffd82', 0, 0, 16, 2); R(ctx, '#e84855', 0, 5, 16, 1);
      R(ctx, '#e84855', 7, 2, 2, 3);
    });
    makeCanvasTexture(this, 'exit-sign', 16, 32, (ctx) => {
      // A giant floppy disk on a post: SAVE your game!
      R(ctx, '#777777', 7, 16, 2, 16);
      R(ctx, '#000000', 0, 0, 16, 16); R(ctx, '#2d3a8c', 1, 1, 14, 14);
      R(ctx, '#dddddd', 4, 1, 8, 5); R(ctx, '#555555', 9, 2, 2, 3);
      R(ctx, '#ffffff', 3, 8, 10, 7);
      R(ctx, '#e84855', 4, 10, 8, 1); R(ctx, '#e84855', 4, 12, 6, 1); // label lines
    });
  }

  setStandingBody() { this.player.body.setSize(8, 14, false).setOffset(4, 2); this.sliding = false; }
  setSlidingBody() { this.player.body.setSize(12, 6, false).setOffset(2, 10); this.sliding = true; }

  // Is there something solid to stand on at this world point? (ghost edge checks)
  solidAt(x, y) {
    const ch = this.grid[Math.floor(y / TILE)]?.[Math.floor(x / TILE)];
    return ch === '#' || ch === 'B' || ch === '-';
  }

  update(_time, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    if (state.cheats.god && Phaser.Input.Keyboard.JustDown(this.keys.N) && this.phase !== 'reveal') { this.finish(); return; }

    if (this.hitstop > 0) {
      this.hitstop -= dt;
      if (this.hitstop <= 0) this.physics.world.resume();
      return;
    }

    this.sky.tilePositionX = this.cameras.main.scrollX * 0.2;
    this.handleInput(dt);
    this.updateGhosts();
    this.updatePower(dt);
    this.updatePlayerShots();
    this.boss?.update(dt);

    // Fell into a pit.
    if (this.player.y > WORLD_H + 16 && !this.dead && this.phase !== 'reveal') this.fellInPit();

    if (this.invuln > 0) {
      this.invuln -= dt;
      this.player.setAlpha(Math.floor(this.invuln * 12) % 2 ? 0.3 : 1);
      if (this.invuln <= 0) this.player.setAlpha(1);
    }
    if (this.head) this.head.setPosition(this.player.x, this.player.y - (this.sliding ? 5 : 10)).setAlpha(this.player.alpha).setFlipX(this.player.flipX);
    if (this.phase === 'run' && this.exitX) this.progressBar.width = 100 * Phaser.Math.Clamp(this.player.x / this.exitX, 0, 1);
    this.hud.update(this.caps);
  }

  handleInput(dt) {
    const body = this.player.body;
    if (this.dead || this.phase === 'reveal') { body.setVelocityX(body.velocity.x * 0.9); return; }
    const onGround = body.blocked.down || body.touching.down;
    const JD = Phaser.Input.Keyboard.JustDown;
    const jumpPressed = JD(this.keys.SPACE) || JD(this.keys.UP) || JD(this.keys.W);
    const jumpHeld = this.keys.SPACE.isDown || this.keys.UP.isDown || this.keys.W.isDown;
    const downHeld = this.keys.DOWN.isDown || this.keys.S.isDown;
    const dir = (this.keys.RIGHT.isDown || this.keys.D.isDown ? 1 : 0) - (this.keys.LEFT.isDown || this.keys.A.isDown ? 1 : 0);

    // Momentum: accelerate toward the held direction, skid to a stop otherwise.
    let vx = body.velocity.x;
    if (dir !== 0 && !(this.sliding && onGround)) {
      const turning = Math.sign(vx) === -dir;
      vx += dir * (onGround ? ACCEL : AIR_ACCEL) * (turning ? 1.6 : 1) * dt;
      vx = Phaser.Math.Clamp(vx, -MAX_SPEED, MAX_SPEED);
      if (onGround && turning && Math.abs(vx) > 60 && Math.random() < 0.5) this.fx.dust(this.player.x, this.player.y, 2); // skid
    } else {
      const f = (onGround ? (this.sliding ? FRICTION * 0.35 : FRICTION) : 120) * dt;
      vx = Math.abs(vx) <= f ? 0 : vx - Math.sign(vx) * f;
    }
    body.setVelocityX(vx);
    if (vx !== 0) this.player.setFlipX(vx < 0);

    if (onGround && !this.wasOnGround) { this.fx.dust(this.player.x, this.player.y, 6); this.stompChain = 0; }
    this.wasOnGround = onGround;
    // Remember the last safe spot on the main ground (respawn point after a pit).
    if (onGround && this.player.y >= GROUND_Y - 1 && this.solidAt(this.player.x, GROUND_Y + 2)) this.checkpoint.x = this.player.x;

    if (onGround) { this.coyote = COYOTE_TIME; this.airJumps = 1; } else this.coyote -= dt;
    this.jumpBuffer = jumpPressed ? JUMP_BUFFER : this.jumpBuffer - dt;
    // v + jump while standing on a one-way platform drops through it.
    this.dropping = downHeld && jumpPressed && onGround && !this.solidAt(this.player.x, this.player.y + 2);
    if (this.dropping) { this.player.y += 4; this.jumpBuffer = 0; }

    if (this.jumpBuffer > 0 && !this.dropping) {
      if (this.coyote > 0) this.jump(JUMP_VELOCITY - Math.abs(vx) * 0.25); // a running start jumps higher
      else if (jumpPressed && this.airJumps > 0) {
        this.airJumps--;
        this.jump(JUMP_VELOCITY * 0.85);
        this.fx.sparkle(this.player.x, this.player.y - 8, 5);
      }
    }
    if (!jumpHeld && body.velocity.y < 0 && !this.springing) body.setVelocityY(body.velocity.y * JUMP_CUT ** (dt * 20));
    if (body.velocity.y >= 0) this.springing = false;

    // Spin: hold v on the ground (lower hitbox; at speed it knocks out ghosts).
    if (downHeld && onGround && !this.sliding && !jumpPressed) { this.setSlidingBody(); this.fx.dust(this.player.x - 4, this.player.y, 4); }
    if ((!downHeld || !onGround) && this.sliding) this.setStandingBody();

    const id = this.era.id;
    if (this.sliding) {
      this.player.setTexture(`player-${id}-slide`);
      if (Math.abs(vx) > 40 && Math.random() < 0.3) this.fx.dust(this.player.x, this.player.y, 1);
    } else if (!onGround) this.player.setTexture(`player-${id}-jump`);
    else if (Math.abs(vx) < 4) this.player.setTexture(`player-${id}-run1`);
    else {
      this.animTimer += dt * (Math.abs(vx) / 90);
      this.player.setTexture(`player-${id}-${Math.floor(this.animTimer * 8) % 2 ? 'run2' : 'run1'}`);
    }
  }

  jump(velocity) {
    this.player.body.setVelocityY(velocity);
    this.coyote = 0;
    this.jumpBuffer = 0;
    if (this.sliding) this.setStandingBody();
    this.fx.dust(this.player.x, this.player.y, 4);
    sfx.jump();
  }

  // ---------- Level objects ----------

  addGhost(x, bottom) {
    const g = this.ghosts.create(x, bottom, this.power > 0 ? 'ghost-scared' : 'ghost').setOrigin(0.5, 1);
    g.body.setSize(8, 9).setOffset(2, 3);
    g.dir = -1;
    return g;
  }

  addOrb(x, y) {
    const o = this.orbs.create(x, y, 'orb');
    this.tweens.add({ targets: o, alpha: 0.5, duration: 200, yoyo: true, repeat: -1 });
    return o;
  }

  // Bumping a bonus block from below pops out a cap.
  onBump(tile) {
    if (!tile.bonus || tile.used) return;
    if (this.player.body.top < tile.body.bottom - 2 || Math.abs(this.player.x - tile.x) > 11) return;
    tile.used = true;
    tile.setTexture('tile-used');
    this.tweens.add({ targets: tile, y: tile.y - 4, duration: 60, yoyo: true });
    const cap = this.add.image(tile.x, tile.y - 12, `coin-${this.era.id}`).setDepth(20);
    this.tweens.add({ targets: cap, y: tile.y - 30, alpha: 0, duration: 450, onComplete: () => cap.destroy() });
    this.caps++;
    addScore(50);
    sfx.coin();
  }

  // Ghosts patrol: walk, turn at walls and ledges. Scared ghosts dither slowly.
  updateGhosts() {
    const scared = this.power > 0;
    const flashing = scared && this.power < POWER_WARN && Math.floor(this.power * 8) % 2;
    for (const g of this.ghosts.getChildren()) {
      const b = g.body;
      const onGround = b.blocked.down || b.touching.down;
      if (b.blocked.left || b.touching.left) g.dir = 1;
      if (b.blocked.right || b.touching.right) g.dir = -1;
      if (onGround && !this.solidAt(g.x + g.dir * 7, b.bottom + 2)) g.dir *= -1;
      g.setVelocityX(g.dir * GHOST_SPEED * (scared ? 0.5 : 1));
      g.setFlipX(g.dir > 0);
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

  // Power ran out: a moment of safety so a ghost you were chasing can't punish you.
  endPower() {
    this.power = 0;
    this.powerBar.width = 0;
    this.invuln = Math.max(this.invuln, 1);
    this.tweens.add({ targets: this.powerTint, fillAlpha: 0, duration: 300 });
    setEraMusicRate(this.era, 1);
  }

  onGhost(g) {
    if (this.dead || this.phase === 'reveal' || !g.active) return;
    const pb = this.player.body;
    if (this.power > 0) {
      // Eating ghosts in a chain: 200, 400, 800, 1600.
      const pts = 200 * 2 ** Math.min(this.ghostsEaten, 3);
      sfx.eat(this.ghostsEaten);
      this.ghostsEaten++;
      this.defeatGhost(g, pts, 16);
      this.hitstop = 0.06;
      this.physics.world.pause();
    } else if (pb.velocity.y > 0 && pb.bottom - g.body.top < 8) {
      // Stomp! Chain stomps without landing for more points.
      this.stompChain++;
      this.defeatGhost(g, 100 * this.stompChain, 10);
      pb.setVelocityY(STOMP_BOUNCE);
      this.airJumps = 1;
      sfx.boing();
    } else if (this.sliding && Math.abs(pb.velocity.x) > 60) {
      this.defeatGhost(g, 150, 10); // spin attack
      sfx.explode();
    } else {
      this.onHit();
    }
  }

  defeatGhost(g, pts, sparkles) {
    addScore(pts);
    this.fx.sparkle(g.x, g.y - 6, sparkles);
    const t = this.add.text(g.x, g.y - 18, String(pts), textStyle(pts >= 400 ? 16 : 8, '#ffffff', true)).setOrigin(0.5).setDepth(75);
    this.tweens.add({ targets: t, y: t.y - 20, alpha: 0, duration: 900, onComplete: () => t.destroy() });
    g.destroy();
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
    this.airJumps = 1;
    if (this.sliding) this.setStandingBody();
    this.tweens.add({ targets: spring, scaleY: 0.5, duration: 80, yoyo: true });
    sfx.boing();
  }

  updatePlayerShots() {
    for (const s of this.playerShots.getChildren().slice()) {
      if (this.boss && !this.boss.dead && s.x >= this.boss.hitX) { this.boss.damage(0.2); s.destroy(); }
      else if (s.x > this.levelW + 20) s.destroy();
    }
    // Boss orbs that drift out of the arena unclaimed.
    if (this.phase === 'boss') for (const o of this.orbs.getChildren().slice()) if (o.x < this.arenaX - 10) o.destroy();
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
    // Knockback: pop up and away so you aren't left standing inside the enemy.
    const away = this.player.flipX ? 1 : -1;
    this.player.body.setVelocity(away * 120, -200);

    if (this.caps > 0) {
      this.scatterCaps();
      this.invuln = INVULN_TIME;
      slang(this, this.era, 'hit', '#ff3355');
      return;
    }
    this.dead = true;
    this.cameras.main.flash(120, 255, 60, 60);
    loseLife(this, this.era, () => {
      this.time.delayedCall(600, () => { this.dead = false; this.invuln = 2; });
    });
  }

  // Pits cost a life (no caps can save you), then you respawn at the last safe ground.
  fellInPit() {
    this.dead = true;
    sfx.miss();
    const respawn = () => {
      this.player.setPosition(Math.max(24, this.checkpoint.x - 24), GROUND_Y - 4).setVelocity(0, 0);
      this.dead = false;
      this.invuln = 2;
    };
    if (state.cheats.god) { respawn(); return; }
    this.caps = 0;
    loseLife(this, this.era, () => this.time.delayedCall(500, respawn));
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

  // Touching the SAVE sign: fade into the one-screen boss arena.
  startBoss() {
    if (this.phase !== 'run') return;
    this.phase = 'boss';
    if (this.power > 0) this.endPower();
    sfx.eraClear();
    this.progressBar.setVisible(false);
    this.progressBg.setVisible(false);
    const cam = this.cameras.main;
    cam.fadeOut(250, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      cam.stopFollow();
      cam.setScroll(this.arenaX, WORLD_H - GAME_H);
      this.physics.world.setBounds(this.arenaX, -300, GAME_W, WORLD_H + 600);
      this.player.setPosition(this.arenaX + 40, GROUND_Y - 2).setVelocity(0, 0);
      this.checkpoint.x = this.arenaX + 40;
      cam.fadeIn(250);
      this.fx.banner(this.era.boss.name, '#ff3355', this.era.boss.tagline);
      playEraMusic(this.era, 1.1);
      this.boss = new Boss(this, this.era, () => { addScore(1000); this.reveal(); }, { x0: this.arenaX, groundY: GROUND_Y });
    });
  }

  reveal() {
    this.phase = 'reveal';
    for (const g of [this.ghosts, this.orbs]) g.clear(true, true);
    revealMemory(this, this.era);
  }

  // God-mode skip (N).
  finish() {
    this.boss?.shots.clear(true, true);
    if (this.boss) this.boss.dead = true;
    this.reveal();
  }
}
