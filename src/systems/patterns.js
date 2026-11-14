// Hand-designed obstacle "patterns" for the 90s platformer, so every few
// seconds asks for a readable little rhythm (jump, spin, spring...).
// Each item: k = kind, dx = px offset from the spawn point, h = height above ground (coins).
import Phaser from 'phaser';

const L = (dx) => ({ k: 'low', dx }); // jump over
const H = (dx) => ({ k: 'high', dx }); // spin/slide under
const C = (dx, h = 8) => ({ k: 'coin', dx, h });
const G = (dx) => ({ k: 'ghost', dx });
const O = (dx) => ({ k: 'orb', dx });
const S = (dx) => ({ k: 'spring', dx });
const row = (dx, n, h = 8) => Array.from({ length: n }, (_, i) => C(dx + i * 12, h));
const arc = (cx, top = 40) => [-2, -1, 0, 1, 2].map((i) => C(cx + i * 12, top - Math.abs(i) * 8));

// Index = difficulty tier (0 easy, 1 medium, 2 hard), picked from era progress.
const BASE = [
  [
    [L(0)],
    [H(0)],
    row(0, 5),
    [L(0), ...arc(0)],
    [H(0), ...row(-12, 3, 4)], // caps tucked under a high obstacle: spin to grab them
  ],
  [
    [L(0), L(34)],
    [H(0), L(100)],
    [L(0), H(100)],
    [H(0), H(28), ...row(-12, 6, 4)], // long spin
    [L(0), ...arc(0), L(110), ...arc(110)],
  ],
  [
    [L(0), H(80), L(160)],
    [H(0), H(28), L(110), ...arc(110)],
    [L(0), L(34), H(130)],
    [L(0), L(34), L(68)],
    [H(0), L(70), H(140), ...row(128, 3, 4)],
  ],
];

// Springs launch you up to a high trail of caps.
const SPRING_PATTERNS = [
  [S(0), ...arc(70, 100), ...arc(130, 100)],
  [S(0), L(60), L(94), ...arc(80, 90)],
];

const ORB_PATTERN = [...row(-40, 3, 26), O(0)]; // a cap trail leading up to the power orb
const FEAST = [G(0), G(50), G(100), G(150)]; // edible ghosts while powered up
const GHOST = [[G(0)], [G(0), ...row(40, 3, 40)]];

// powerActive: orb active; ghostOnScreen: a hostile ghost is already out.
export function pickPattern(tier, era, { powerActive = false, ghostOnScreen = false } = {}) {
  let items;
  const r = Math.random();
  if (era.ghosts && powerActive && r < 0.7) items = FEAST;
  else if (era.ghosts && !powerActive && r < 0.12) items = ORB_PATTERN;
  else if (era.springs && r < 0.24) items = Phaser.Utils.Array.GetRandom(SPRING_PATTERNS);
  // Hostile ghosts: only from the medium tier on, and never two at once.
  else if (era.ghosts && !powerActive && tier >= 1 && !ghostOnScreen && r < 0.38) items = Phaser.Utils.Array.GetRandom(GHOST);
  else items = Phaser.Utils.Array.GetRandom(BASE[tier]);
  return { items, width: Math.max(...items.map((i) => i.dx)) + 16 };
}
