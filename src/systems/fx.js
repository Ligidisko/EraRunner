// "Juice": small particle bursts and floating text that make actions feel good.
import Phaser from 'phaser';
import { GAME_W, textStyle } from '../config.js';

export function makeFx(scene, dustHex) {
  const dust = scene.add.particles(0, 0, 'px', {
    speed: { min: 10, max: 45 },
    angle: { min: 200, max: 340 },
    lifespan: 320,
    scale: { start: 1, end: 0 },
    gravityY: 80,
    tint: Phaser.Display.Color.HexStringToColor(dustHex).color,
    emitting: false,
  }).setDepth(20);

  const sparkle = scene.add.particles(0, 0, 'px', {
    speed: { min: 30, max: 100 },
    lifespan: 450,
    scale: { start: 1.5, end: 0 },
    tint: [0xffffff, 0xffd93b, 0x05d9e8, 0xff71ce],
    emitting: false,
  }).setDepth(45);

  return {
    dust: (x, y, n = 6) => dust.explode(n, x, y),
    sparkle: (x, y, n = 8) => sparkle.explode(n, x, y),

    // Floating "+50" style text that drifts up and fades.
    popup(x, y, text, color = '#ffffff') {
      const t = scene.add.text(x, y, text, textStyle(8, color, true)).setOrigin(0.5).setDepth(75);
      scene.tweens.add({ targets: t, y: y - 18, alpha: 0, duration: 750, ease: 'Cubic.Out', onComplete: () => t.destroy() });
    },

    // Big centred announcement ("SPEED UP!", boss names).
    banner(text, color = '#ffffff', sub = null) {
      const t = scene.add.text(GAME_W / 2, 60, text, textStyle(16, color, true)).setOrigin(0.5).setDepth(80).setScale(0);
      const s = sub ? scene.add.text(GAME_W / 2, 80, sub, textStyle(8, '#ffffff', true)).setOrigin(0.5).setDepth(80).setAlpha(0) : null;
      scene.tweens.add({ targets: t, scale: 1, duration: 250, ease: 'Back.Out' });
      if (s) scene.tweens.add({ targets: s, alpha: 1, duration: 300, delay: 200 });
      scene.time.delayedCall(1400, () => {
        scene.tweens.add({ targets: [t, s].filter(Boolean), alpha: 0, duration: 300, onComplete: () => { t.destroy(); s?.destroy(); } });
      });
    },
  };
}
