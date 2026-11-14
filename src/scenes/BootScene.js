// Loads the era soundtracks (with a loading bar), then builds every texture
// once at startup, for every era, from the era data files.
import Phaser from 'phaser';
import { GAME_W, GAME_H, GROUND_Y, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { setSoundManager } from '../audio/audio.js';
import {
  makePixelTexture, makeCanvasTexture,
  PLAYER_RUN_1, PLAYER_RUN_2, PLAYER_JUMP, PLAYER_SLIDE, HEART,
  GHOST, GHOST_COLORS, GHOST_SCARED_COLORS, ORB, ORB_COLORS, PLAYER_SHOT,
  SHIP, ALIENS, BOOMBOX, BOOMBOX_COLORS, SPRING, SPRING_COLORS, ARROW, LIFE, BIG_HEAD,
} from '../gfx/pixelArt.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    // A chunky "LOADING..." bar, like a cassette game loading.
    this.add.text(GAME_W / 2, 70, 'LOADING...', textStyle(8, '#ffffff')).setOrigin(0.5);
    this.add.rectangle(GAME_W / 2, 90, 162, 10, 0x000000).setStrokeStyle(1, 0xffffff);
    const bar = this.add.rectangle(GAME_W / 2 - 80, 90, 0, 6, 0x3bff6e).setOrigin(0, 0.5);
    this.load.on('progress', (p) => { bar.width = 160 * p; });
    // A track that fails to load is skipped; that era falls back to synth music.
    this.load.on('loaderror', (file) => console.warn('Could not load', file.key));
    for (const era of ERAS) if (era.track) this.load.audio(era.track, era.trackFile);
  }

  create() {
    setSoundManager(this.sound);
    for (const era of ERAS) {
      const id = era.id;
      // Same player sprite, re-coloured per era: the kid "grows up" through palettes.
      makePixelTexture(this, `player-${id}-run1`, PLAYER_RUN_1, era.player);
      makePixelTexture(this, `player-${id}-run2`, PLAYER_RUN_2, era.player);
      makePixelTexture(this, `player-${id}-jump`, PLAYER_JUMP, era.player);
      makePixelTexture(this, `player-${id}-slide`, PLAYER_SLIDE, era.player);

      makePixelTexture(this, `low-${id}`, era.obstacles.low.rows, era.obstacles.low.colors);
      makePixelTexture(this, `high-${id}`, era.obstacles.high.rows, era.obstacles.high.colors);
      makePixelTexture(this, `coin-${id}`, era.coin.rows, era.coin.colors);

      makeCanvasTexture(this, `sky-${id}`, GAME_W, GROUND_Y, (ctx, w, h) => era.drawSky(ctx, w, h));
      makeCanvasTexture(this, `ground-${id}`, 32, GAME_H - GROUND_Y, (ctx, w, h) => era.drawGroundTile(ctx, w, h));

      makePixelTexture(this, `memory-${id}`, era.memorySprite.rows, era.memorySprite.colors);
      makeCanvasTexture(this, `boss-${id}`, era.boss.w, era.boss.h, (ctx) => era.boss.draw(ctx));
      era.boss.shots.forEach((s, i) => makePixelTexture(this, `shot-${id}-${i}`, s.rows, s.colors));
    }

    makePixelTexture(this, 'heart', HEART, { r: '#ff3355' });
    makePixelTexture(this, 'ghost', GHOST, GHOST_COLORS);
    makePixelTexture(this, 'ghost-scared', GHOST, GHOST_SCARED_COLORS);
    makePixelTexture(this, 'ghost-flash', GHOST, { ...GHOST_SCARED_COLORS, w: '#ffffff', k: '#2b4cff' });
    makePixelTexture(this, 'orb', ORB, ORB_COLORS);
    makePixelTexture(this, 'pshot', PLAYER_SHOT, ORB_COLORS);
    makeCanvasTexture(this, 'px', 2, 2, (ctx) => { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, 2, 2); });

    // 80s shooter
    makePixelTexture(this, 'ship', SHIP, { o: '#05d9e8', w: '#ffffff' });
    const alienColors = { squid: '#ff71ce', tape: '#ffd93b', vhs: '#3bff6e' };
    for (const [type, frames] of Object.entries(ALIENS)) {
      frames.forEach((rows, f) => makePixelTexture(this, `alien-${type}-${f}`, rows, { o: alienColors[type] }));
    }
    makePixelTexture(this, 'boombox', BOOMBOX, BOOMBOX_COLORS);
    makePixelTexture(this, 'bullet', ['w', 'w', 'w', 'w', 'w'], { w: '#ffffff' });
    makePixelTexture(this, 'abullet', ['w.', '.w', 'w.', '.w', 'w.', '.w'], { w: '#ffd93b' });

    // 90s platformer
    makePixelTexture(this, 'spring', SPRING, SPRING_COLORS);
    makePixelTexture(this, 'life', LIFE, ERAS[1].player);
    makePixelTexture(this, 'bighead', BIG_HEAD, ERAS[1].player);

    // 00s rhythm
    makePixelTexture(this, 'arrow', ARROW, { o: '#000000', w: '#ffffff' });
    makePixelTexture(this, 'arrow-slot', ARROW, { o: '#ffffff', w: '#1e3a5f' });

    // Horizontal CRT scanlines, overlaid with per-era alpha.
    makeCanvasTexture(this, 'scanlines', GAME_W, GAME_H, (ctx, w, h) => {
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
    });

    this.scene.start('Title');
  }
}
