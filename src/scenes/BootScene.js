// Builds every texture once at startup, for every era, from the era data files.
import Phaser from 'phaser';
import { GAME_W, GAME_H, GROUND_Y } from '../config.js';
import { ERAS } from '../eras/index.js';
import {
  makePixelTexture, makeCanvasTexture,
  PLAYER_RUN_1, PLAYER_RUN_2, PLAYER_JUMP, PLAYER_SLIDE, HEART,
} from '../gfx/pixelArt.js';

export default class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  create() {
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
    }

    makePixelTexture(this, 'heart', HEART, { r: '#ff3355' });

    // Horizontal CRT scanlines, overlaid with per-era alpha.
    makeCanvasTexture(this, 'scanlines', GAME_W, GAME_H, (ctx, w, h) => {
      ctx.fillStyle = '#000';
      for (let y = 0; y < h; y += 2) ctx.fillRect(0, y, w, 1);
    });

    this.scene.start('Title');
  }
}
