// Run-wide state shared by every scene: score, lives, credits, cheats.
// One "run" = one credit = all three eras back to back, like an arcade game.
import { sfx } from './audio/audio.js';

export const START_LIVES = 3;
export const EXTRA_LIFE_EVERY = 10000;

export const state = {
  score: 0,
  lives: START_LIVES,
  credits: 0,
  memories: [], // era ids whose memory item you've collected
  eraIndex: 0,
  nextExtraLife: EXTRA_LIFE_EVERY,
  cheats: { god: false, bighead: false },
  cartridgeBlown: false, // the "blow on the cartridge" gag only happens once per session
};

export function newRun() {
  state.score = 0;
  state.lives = START_LIVES;
  state.memories = [];
  state.eraIndex = 0;
  state.nextExtraLife = EXTRA_LIFE_EVERY;
}

// Continue after game over: arcade rules — score resets, you keep your progress.
export function continueRun() {
  state.score = 0;
  state.lives = START_LIVES;
  state.nextExtraLife = EXTRA_LIFE_EVERY;
}

// Adds points; returns true if that crossed an extra-life threshold.
export function addScore(points) {
  state.score += Math.round(points);
  if (state.score >= state.nextExtraLife) {
    state.lives++;
    state.nextExtraLife += EXTRA_LIFE_EVERY;
    sfx.oneUp();
    return true;
  }
  return false;
}

export const pad = (n, width = 6) => String(Math.max(0, Math.floor(n))).padStart(width, '0');
