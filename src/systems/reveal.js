// Shared moments every era uses: slang popups, the memory-item reveal,
// losing a life (-> continue screen), and moving on to the next era.
import Phaser from 'phaser';
import { GAME_W, GAME_H, textStyle } from '../config.js';
import { ERAS } from '../eras/index.js';
import { state, addScore } from '../state.js';
import { stopMusic, sfx } from '../audio/audio.js';

// Shouts a random decade-slang word ("TUBULAR!", "AS IF!") in the middle of the screen.
export function slang(scene, era, kind, color = '#ffffff') {
  const words = era.slang?.[kind];
  if (!words?.length) return;
  const word = Phaser.Utils.Array.GetRandom(words);
  const t = scene.add.text(GAME_W / 2, 58, word, textStyle(16, color, true)).setOrigin(0.5).setDepth(95).setScale(0.2).setAngle(-6);
  scene.tweens.add({ targets: t, scale: 1, angle: 0, duration: 260, ease: 'Back.Out' });
  scene.tweens.add({ targets: t, alpha: 0, y: 46, duration: 400, delay: 800, onComplete: () => t.destroy() });
}

// Called by a scene when the player is hit. Returns true if a life was lost.
// `onRespawn` runs when there are lives left; otherwise we go to CONTINUE?.
export function loseLife(scene, era, onRespawn) {
  if (state.cheats.god) return false;
  state.lives--;
  slang(scene, era, 'hit', '#ff3355');
  if (state.lives <= 0) {
    stopMusic();
    scene.time.delayedCall(1200, () => scene.scene.start('Continue'));
  } else {
    onRespawn();
  }
  return true;
}

// Beat the boss: the era's memory item drops in, front and centre.
export function revealMemory(scene, era) {
  stopMusic();
  sfx.memory();
  const cx = GAME_W / 2;
  const dim = scene.add.rectangle(0, 0, GAME_W, GAME_H, 0x000000, 0).setOrigin(0).setDepth(100);
  scene.tweens.add({ targets: dim, fillAlpha: 0.65, duration: 400 });

  const glow = scene.add.circle(cx, 72, 30, 0xffffff, 0.15).setDepth(101);
  scene.tweens.add({ targets: glow, scale: 1.3, alpha: 0.05, duration: 600, yoyo: true, repeat: -1 });

  const item = scene.add.image(cx, -30, `memory-${era.id}`).setScale(4).setDepth(102);
  scene.tweens.add({ targets: item, y: 72, duration: 900, ease: 'Bounce.Out' });
  scene.tweens.add({ targets: item, angle: { from: -4, to: 4 }, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.InOut' });
  if (scene.fx) {
    scene.time.addEvent({ delay: 250, repeat: 10, callback: () => scene.fx.sparkle(cx + Phaser.Math.Between(-30, 30), 72 + Phaser.Math.Between(-30, 30), 6) });
  }

  const name = scene.add.text(cx, 116, `${era.memory.toUpperCase()} GET!`, textStyle(8, '#ffd93b', true)).setOrigin(0.5).setDepth(103).setAlpha(0);
  const line = scene.add.text(cx, 132, era.memoryLine, textStyle(8, '#ffffff', true)).setOrigin(0.5).setDepth(103).setAlpha(0);
  scene.tweens.add({ targets: name, alpha: 1, duration: 300, delay: 900 });
  scene.tweens.add({ targets: line, alpha: 1, duration: 500, delay: 1400 });
  scene.time.delayedCall(700, () => slang(scene, era, 'clear', '#ffd93b'));

  const bonus = 2000;
  scene.time.delayedCall(1900, () => {
    addScore(bonus);
    const b = scene.add.text(cx, 150, `ERA CLEAR BONUS +${bonus}`, textStyle(8, '#ff71ce', true)).setOrigin(0.5).setDepth(103);
    scene.tweens.add({ targets: b, alpha: { from: 0, to: 1 }, duration: 300 });
  });

  if (!state.memories.includes(era.id)) state.memories.push(era.id);
  scene.time.delayedCall(4300, () => nextEra(scene));
}

export function nextEra(scene) {
  stopMusic();
  state.eraIndex++;
  if (state.eraIndex < ERAS.length) scene.scene.start('EraCard', { fresh: true });
  else scene.scene.start('End');
}
