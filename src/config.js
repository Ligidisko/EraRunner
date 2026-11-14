// Global tuning knobs. Change these to adjust game feel.
export const GAME_W = 320; // internal resolution; scaled up to fit the window
export const GAME_H = 180;
export const GROUND_Y = 150; // y of the ground surface

export const JUMP_VELOCITY = -310; // px/s upward on jump
export const JUMP_CUT = 0.45; // releasing jump early multiplies upward speed by this
export const MAX_HEARTS = 3;
export const INVULN_TIME = 1.2; // seconds of flashing after a hit

// Feel / forgiveness
export const COYOTE_TIME = 0.08; // can still jump this long after running off a ledge/landing late
export const JUMP_BUFFER = 0.12; // a jump pressed this early before landing still fires
export const HITSTOP = 0.08; // freeze-frame on taking damage

// Vertical lanes (y of the BOTTOM edge of things)
export const HIGH_BOTTOM = GROUND_Y - 8; // high obstacles: slide under
export const GHOST_HIGH_BOTTOM = GROUND_Y - 11; // high ghosts bob a little, so sit higher
export const ORB_Y = GROUND_Y - 34; // power orbs: need a jump to grab

export const POWER_TIME = 8; // seconds ghosts stay blue after a power orb
export const POWER_WARN = 2; // ghosts flash for the last N seconds of power
export const MAX_MULT = 5;
export const COINS_PER_MULT = 8; // coins in a row (no hits) to raise the multiplier

export const FONT ='"Press Start 2P", monospace';

// Shared text style helper (8px = one "pixel font" unit).
export const textStyle = (size = 8, color = '#ffffff', outline = false) => ({
  fontFamily: FONT,
  fontSize: `${size}px`,
  color,
  ...(outline ? { stroke: '#000000', strokeThickness: 3 } : {}),
});
