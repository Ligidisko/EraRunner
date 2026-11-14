// Global tuning knobs. Change these to adjust game feel.
export const GAME_W = 320; // internal resolution; scaled up to fit the window
export const GAME_H = 180;
export const GROUND_Y = 150; // y of the ground surface

export const JUMP_VELOCITY = -310; // px/s upward on jump
export const JUMP_CUT = 0.45; // releasing jump early multiplies upward speed by this
export const MAX_HEARTS = 3;
export const INVULN_TIME = 1.2; // seconds of flashing after a hit

export const FONT = '"Press Start 2P", monospace';

// Shared text style helper (8px = one "pixel font" unit).
export const textStyle = (size = 8, color = '#ffffff') => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  color,
});
