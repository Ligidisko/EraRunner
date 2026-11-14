// 1985 — THE ARCADE YEARS. A fixed-screen space shooter: a marching formation
// of aliens (original designs: squid, cassette, video tape), crumbling shields,
// a flying-boombox bonus ship, then THE CABINET boss. Controls: <- -> and SPACE.
// Also used as the attract-mode demo (data.demo = true: the game plays itself).
import Phaser from 'phaser';
import { GAME_W, GAME_H, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { state, addScore, takeResumeAtBoss } from '../state.js';
import { playEraMusic, setEraMusicRate, stopMusic, sfx } from '../audio/audio.js';
import { makeFx } from '../systems/fx.js';
import Hud from '../systems/hud.js';
import { loseLife, revealMemory, slang } from '../systems/reveal.js';

const SHIP_Y = 160;
const FLOOR_Y = 170;
const ROWS = [
  { type: 'squid', points: 30 },
  { type: 'tape', points: 20 },
  { type: 'tape', points: 20 },
  { type: 'vhs', points: 10 },
  { type: 'vhs', points: 10 },
];
const COLS = 9;
const BOSS_HP = 24;

// Axis-aligned overlap test between two game objects (centre origin).
const overlaps = (a, b, pad = 0) =>
  Math.abs(a.x - b.x) * 2 < a.displayWidth + b.displayWidth - pad &&
  Math.abs(a.y - b.y) * 2 < a.displayHeight + b.displayHeight - pad;

export default class ShooterScene extends Phaser.Scene {
  constructor() { super('Shooter'); }

  create(data = {}) {
    // Phaser reuses scene objects: reset per-run flags every time the scene starts.
    this.boss = null;
    this.hud = null;
    this.demo = !!data.demo;
    this.era = ERAS.find((e) => e.scene === 'Shooter');
    this.cameras.main.setBackgroundColor('#05000f');
    this.fx = makeFx(this, '#05d9e8');

    // Backdrop: faint synthwave sun + twinkling stars.
    this.add.image(0, 20, `sky-${this.era.id}`).setOrigin(0).setAlpha(0.35);
    for (let i = 0; i < 40; i++) {
      const s = this.add.rectangle(Phaser.Math.Between(0, GAME_W), Phaser.Math.Between(20, 150), 1, 1, 0xffffff);
      this.tweens.add({ targets: s, alpha: 0.1, duration: Phaser.Math.Between(300, 1200), yoyo: true, repeat: -1 });
    }
    this.add.rectangle(0, FLOOR_Y, GAME_W, 1, 0x3bff6e).setOrigin(0);
    this.add.image(0, 0, 'scanlines').setOrigin(0).setAlpha(this.era.scanlines).setDepth(80);

    this.ship = this.add.image(GAME_W / 2, SHIP_Y, 'ship').setDepth(10);
    if (state.cheats.bighead) this.ship.setScale(1.6);
    this.bullets = [];
    this.alienShots = [];
    this.bossShots = [];
    this.invuln = 2;
    this.dead = false;
    this.fireCooldown = 0;
    this.wave = 0;
    this.phase = 'wave';
    this.saucer = null;
    this.saucerTimer = Phaser.Math.Between(12, 18);
    this.buildShields();
    this.startWave();
    if (!this.demo && takeResumeAtBoss()) { for (const a of this.aliens) a.img.destroy(); this.aliens = []; this.startBoss(); }

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,A,D,SPACE,N');
    if (this.demo) {
      this.add.text(GAME_W / 2, 4, 'DEMO PLAY', textStyle(8, '#ff3355', true)).setOrigin(0.5, 0).setDepth(90);
      const ic = this.add.text(GAME_W / 2, 84, 'INSERT COIN', textStyle(16, '#ffd93b', true)).setOrigin(0.5).setDepth(90);
      this.tweens.add({ targets: ic, alpha: 0, duration: 500, yoyo: true, repeat: -1 });
      this.aiTarget = GAME_W / 2;
      this.time.addEvent({ delay: 700, loop: true, callback: () => { this.aiTarget = Phaser.Math.Between(30, GAME_W - 30); } });
      // Any key leaves the demo; C also counts as a coin, like a real cabinet.
      this.input.keyboard.once('keydown', (e) => {
        if (e.keyCode === Phaser.Input.Keyboard.KeyCodes.C) { state.credits++; sfx.coinInsert(); }
        this.scene.start('Title');
      });
      this.time.delayedCall(22000, () => this.scene.start('Title'));
    } else {
      this.hud = new Hud(this, '80s');
      playEraMusic(this.era); // the soundtrack plays under the classic alien march
    }
    this.events.once('shutdown', stopMusic);
  }

  // ---------- Setup ----------

  // Three bunkers made of 2x2 blocks that crumble when shot.
  buildShields() {
    const shape = ['...oooooooo...', '..oooooooooo..', '.oooooooooooo.', 'oooooooooooooo', 'oooooooooooooo', 'oooo......oooo', 'ooo........ooo'];
    this.blocks = [];
    for (const cx of [70, 160, 250]) {
      shape.forEach((row, y) => [...row].forEach((ch, x) => {
        if (ch === 'o') this.blocks.push(this.add.rectangle(cx - 14 + x * 2, 136 + y * 2, 2, 2, 0x3bff6e));
      }));
    }
  }

  startWave() {
    this.aliens = [];
    this.formX = 0;
    this.formY = this.wave * 10; // later waves start lower
    this.dir = 1;
    this.stepTimer = 0.5;
    this.stepIndex = 0;
    this.frame = 0;
    this.fireTimer = 1.5;
    ROWS.forEach((r, row) => {
      for (let col = 0; col < COLS; col++) {
        const img = this.add.image(0, 0, `alien-${r.type}-0`).setDepth(5);
        this.aliens.push({ img, row, col, type: r.type, points: r.points, alive: true });
      }
    });
    this.placeAliens();
    if (this.wave > 0) this.fx.banner(`WAVE ${this.wave + 1}`, '#ffd93b');
  }

  placeAliens() {
    for (const a of this.aliens) {
      if (!a.alive) continue;
      a.img.x = 40 + a.col * 20 + this.formX;
      a.img.y = 34 + a.row * 13 + this.formY;
    }
  }

  // ---------- Loop ----------

  update(_t, deltaMs) {
    const dt = Math.min(deltaMs / 1000, 1 / 20);
    if (!this.demo && state.cheats.god && Phaser.Input.Keyboard.JustDown(this.keys.N) && this.phase !== 'reveal') {
      this.finish();
      return;
    }
    this.updateShip(dt);
    if (this.phase === 'wave') { this.updateFormation(dt); this.updateSaucer(dt); }
    if (this.phase === 'boss') this.updateBoss(dt);
    this.updateBullets(dt);
    this.hud?.update();
  }

  updateShip(dt) {
    if (this.dead) return;
    let move = 0;
    let fire = false;
    if (this.demo) {
      move = Math.sign(this.aiTarget - this.ship.x) * (Math.abs(this.aiTarget - this.ship.x) > 3 ? 1 : 0);
      fire = true;
    } else {
      if (this.keys.LEFT.isDown || this.keys.A.isDown) move = -1;
      if (this.keys.RIGHT.isDown || this.keys.D.isDown) move = 1;
      fire = this.keys.SPACE.isDown;
    }
    this.ship.x = Phaser.Math.Clamp(this.ship.x + move * 125 * dt, 10, GAME_W - 10);

    this.fireCooldown -= dt;
    if (fire && this.fireCooldown <= 0 && this.bullets.length < 2 && this.phase !== 'reveal') {
      this.bullets.push(this.add.image(this.ship.x, SHIP_Y - 6, 'bullet').setDepth(9));
      this.fireCooldown = 0.28;
      sfx.pew();
    }

    if (this.invuln > 0) {
      this.invuln -= dt;
      this.ship.setAlpha(Math.floor(this.invuln * 10) % 2 ? 0.3 : 1);
      if (this.invuln <= 0) this.ship.setAlpha(1);
    }
  }

  updateFormation(dt) {
    const alive = this.aliens.filter((a) => a.alive);
    if (!alive.length) { this.waveCleared(); return; }

    // The fewer aliens left, the faster they march (and the faster the beat).
    this.stepTimer -= dt;
    if (this.stepTimer <= 0) {
      const speedUp = 1 - this.wave * 0.2;
      this.stepTimer = (0.04 + 0.5 * (alive.length / this.aliens.length)) * speedUp;
      const xs = alive.map((a) => a.img.x);
      const hitEdge = (this.dir > 0 && Math.max(...xs) + 9 > GAME_W - 4) || (this.dir < 0 && Math.min(...xs) - 9 < 4);
      if (hitEdge) { this.formY += 6; this.dir *= -1; } else this.formX += this.dir * 4;
      this.frame ^= 1;
      for (const a of alive) a.img.setTexture(`alien-${a.type}-${this.frame}`);
      this.placeAliens();
      sfx.step(this.stepIndex++);
    }

    // Aliens chew through shields, and reaching the floor costs a life.
    for (const a of alive) {
      this.blocks = this.blocks.filter((b) => (overlaps(a.img, b) ? (b.destroy(), false) : true));
      if (a.img.y + 4 >= SHIP_Y - 4) { this.formY = this.wave * 10; this.placeAliens(); this.playerDie(); break; }
    }

    // A random bottom-of-column alien fires.
    this.fireTimer -= dt;
    if (this.fireTimer <= 0 && !this.dead) {
      this.fireTimer = Math.max(0.35, 0.9 - this.wave * 0.2 - (1 - alive.length / this.aliens.length) * 0.3);
      const cols = [...new Set(alive.map((a) => a.col))];
      const col = Phaser.Utils.Array.GetRandom(cols);
      const shooter = alive.filter((a) => a.col === col).sort((p, q) => q.row - p.row)[0];
      this.alienShots.push(this.add.image(shooter.img.x, shooter.img.y + 6, 'abullet').setDepth(9));
    }
  }

  // The bonus flying boombox drifts across the top now and then.
  updateSaucer(dt) {
    if (this.saucer) {
      this.saucer.x += this.saucer.vx * dt;
      if (this.saucer.x < -20 || this.saucer.x > GAME_W + 20) { this.saucer.destroy(); this.saucer = null; }
      return;
    }
    this.saucerTimer -= dt;
    if (this.saucerTimer <= 0) {
      this.saucerTimer = Phaser.Math.Between(15, 22);
      const fromLeft = Math.random() < 0.5;
      this.saucer = this.add.image(fromLeft ? -16 : GAME_W + 16, 26, 'boombox').setDepth(6);
      this.saucer.vx = fromLeft ? 55 : -55;
      sfx.ufo();
    }
  }

  updateBullets(dt) {
    // Player bullets
    for (const b of [...this.bullets]) {
      b.y -= 260 * dt;
      let hit = b.y < 18;
      if (!hit) {
        const block = this.blocks.find((k) => overlaps(b, k));
        if (block) { this.destroyBlock(block); hit = true; }
      }
      if (!hit && this.phase === 'wave') {
        const a = this.aliens.find((x) => x.alive && overlaps(b, x.img));
        if (a) { this.killAlien(a); hit = true; }
        if (!hit && this.saucer && overlaps(b, this.saucer)) { this.killSaucer(); hit = true; }
      }
      if (!hit && this.phase === 'boss' && this.boss && overlaps(b, this.boss, 8)) { this.hitBoss(); hit = true; }
      if (hit) { b.destroy(); this.bullets.splice(this.bullets.indexOf(b), 1); }
    }

    // Enemy shots (alien zig-zags + boss pixels)
    for (const list of [this.alienShots, this.bossShots]) {
      for (const s of [...list]) {
        s.x += (s.vx || 0) * dt;
        s.y += (s.vy || 85 + this.wave * 20) * dt;
        let gone = s.y > FLOOR_Y || s.x < -10 || s.x > GAME_W + 10;
        if (!gone) {
          const block = this.blocks.find((k) => overlaps(s, k));
          if (block) { this.destroyBlock(block); gone = true; }
        }
        if (!gone && !this.dead && this.invuln <= 0 && overlaps(s, this.ship, 4)) { this.playerDie(); gone = true; }
        if (gone) { s.destroy(); list.splice(list.indexOf(s), 1); }
      }
    }
  }

  destroyBlock(block) {
    // Knock out the block and a neighbour or two, so shields crumble unevenly.
    const near = this.blocks.filter((k) => Math.abs(k.x - block.x) <= 2 && Math.abs(k.y - block.y) <= 2 && Math.random() < 0.5);
    for (const k of [block, ...near]) k.destroy();
    this.blocks = this.blocks.filter((k) => k.active);
  }

  killAlien(a) {
    a.alive = false;
    this.fx.sparkle(a.img.x, a.img.y, 8);
    a.img.destroy();
    if (!this.demo) addScore(a.points);
    sfx.explode();
  }

  killSaucer() {
    const pts = Phaser.Utils.Array.GetRandom([100, 150, 300]);
    this.fx.sparkle(this.saucer.x, this.saucer.y, 16);
    this.fx.popup(this.saucer.x, this.saucer.y + 8, String(pts), '#ff71ce');
    if (!this.demo) { addScore(pts); slang(this, this.era, 'good', '#ff71ce'); }
    this.saucer.destroy();
    this.saucer = null;
    sfx.eraClear();
  }

  waveCleared() {
    this.wave++;
    if (this.wave < 2) {
      slang(this, this.era, 'good', '#05d9e8');
      this.time.delayedCall(800, () => this.startWave());
      this.phase = 'between';
      this.time.delayedCall(820, () => { this.phase = 'wave'; });
    } else {
      this.startBoss();
    }
  }

  playerDie() {
    if (this.dead || this.invuln > 0 || this.demo || this.phase === 'reveal') return;
    if (state.cheats.god) { this.invuln = 1; return; }
    this.dead = true;
    this.fx.sparkle(this.ship.x, this.ship.y, 20);
    this.cameras.main.shake(200, 0.015);
    this.ship.setVisible(false);
    sfx.explode();
    loseLife(this, this.era, () => {
      this.time.delayedCall(1200, () => {
        this.dead = false;
        this.ship.setVisible(true).setPosition(GAME_W / 2, SHIP_Y);
        this.invuln = 2;
      });
    });
  }

  // ---------- Boss: THE CABINET ----------

  startBoss() {
    this.phase = 'boss';
    for (const s of this.alienShots) s.destroy();
    this.alienShots = [];
    this.saucer?.destroy();
    this.saucer = null;
    this.bossHp = BOSS_HP;
    this.bossT = 0;
    this.bossFire = 2;
    this.boss = this.add.image(GAME_W / 2, -40, `boss-${this.era.id}`).setScale(1.25).setDepth(6);
    this.tweens.add({ targets: this.boss, y: 58, duration: 1500, ease: 'Back.Out' });
    this.fx.banner(this.era.boss.name, '#ff3355', this.era.boss.tagline);
    setEraMusicRate(this.era, 1.1);
    this.bossBarBg = this.add.rectangle(GAME_W / 2 - 50, 24, 100, 3, 0x000000, 0.7).setOrigin(0, 0.5).setDepth(90);
    this.bossBar = this.add.rectangle(GAME_W / 2 - 50, 24, 100, 3, 0xff3355).setOrigin(0, 0.5).setDepth(91);
  }

  updateBoss(dt) {
    this.bossT += dt;
    if (this.bossT < 1.5) return;
    this.boss.x = GAME_W / 2 + Math.sin(this.bossT * 0.9) * 110;
    this.bossFire -= dt;
    if (this.bossFire <= 0 && !this.dead) {
      const rage = 1 - this.bossHp / BOSS_HP;
      this.bossFire = Phaser.Math.Linear(1.2, 0.55, rage);
      // Spread shot, plus a straight "rain" volley once it's angry.
      const angles = rage > 0.5 && Math.random() < 0.4 ? [-40, -20, 0, 20, 40] : [-25, 0, 25];
      for (const a of angles) {
        const s = this.add.image(this.boss.x, this.boss.y + 30, `shot-${this.era.id}-${Phaser.Math.Between(0, 1)}`).setDepth(9);
        s.vx = Math.sin(Phaser.Math.DegToRad(a)) * 90;
        s.vy = Math.cos(Phaser.Math.DegToRad(a)) * 90;
        this.bossShots.push(s);
      }
      sfx.shoot();
    }
  }

  hitBoss() {
    this.bossHp--;
    this.bossBar.width = 100 * Math.max(this.bossHp, 0) / BOSS_HP;
    this.boss.setTintFill(0xffffff);
    this.time.delayedCall(70, () => this.boss?.clearTint());
    this.fx.sparkle(this.boss.x, this.boss.y + 20, 6);
    if (!this.demo) addScore(50);
    sfx.bossHit();
    if (this.bossHp <= 0) this.defeatBoss();
  }

  defeatBoss() {
    this.phase = 'reveal';
    for (const s of this.bossShots) s.destroy();
    this.bossShots = [];
    sfx.bossDown();
    this.cameras.main.flash(250, 255, 255, 255);
    for (let i = 0; i < 6; i++) {
      this.time.delayedCall(i * 140, () => this.fx.sparkle(this.boss.x + Phaser.Math.Between(-20, 20), this.boss.y + Phaser.Math.Between(-30, 30), 12));
    }
    this.tweens.add({ targets: [this.boss, this.bossBar, this.bossBarBg], alpha: 0, duration: 1100 });
    if (this.demo) { this.time.delayedCall(1500, () => this.scene.start('Title')); return; }
    addScore(1000);
    this.time.delayedCall(1300, () => revealMemory(this, this.era));
  }

  // God-mode skip (N): jump straight to the memory reveal.
  finish() {
    this.phase = 'reveal';
    for (const a of this.aliens) a.img.destroy();
    this.aliens = [];
    revealMemory(this, this.era);
  }
}
