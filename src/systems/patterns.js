// Hand-designed obstacle "patterns" instead of pure randomness, so every few
// seconds asks for a readable little rhythm (jump, slide, jump...).
// Each item: k = kind, dx = px offset from the spawn point, h = height above ground (coins).
import Phaser from 'phaser';

const L = (dx) => ({ k: 'low', dx }); // jump over
const H = (dx) => ({ k: 'high', dx }); // slide under
const C = (dx, h = 8) => ({ k: 'coin', dx, h });
const GL = (dx) => ({ k: 'ghostLow', dx });
const GH = (dx) => ({ k: 'ghostHigh', dx });
const O = (dx) => ({ k: 'orb', dx });
const row = (dx, n, h = 8) => Array.from({ length: n }, (_, i) => C(dx + i * 12, h));
const arc = (cx) => [-2, -1, 0, 1, 2].map((i) => C(cx + i * 12, 40 - Math.abs(i) * 8));

// Index = difficulty tier (0 easy, 1 medium, 2 hard), picked from era progress.
const BASE = [
  [
    [L(0)],
    [H(0)],
    row(0, 5),
    [L(0), ...arc(0)],
    [H(0), ...row(-12, 3, 4)], // coins tucked under a high obstacle: slide to grab them
  ],
  [
    [L(0), L(34)],
    [H(0), L(100)],
    [L(0), H(100)],
    [H(0), H(28), ...row(-12, 6, 4)], // long slide
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

const GHOSTS = [
  [[GL(0)], [GH(0)]],
  [[GL(0), GH(90)], [GH(0), L(90)]],
  [[GL(0), GL(55)], [GH(0), GL(85), H(170)]],
];

const ORB_PATTERN = [...row(-40, 3, 26), O(0)]; // coin trail leading up to the orb
const FEAST = [GL(0), GH(60), GL(120), GH(180)]; // lots of ghosts while they're edible

export function pickPattern(tier, era, powerActive) {
  let items;
  if (era.ghosts && powerActive && Math.random() < 0.6) items = FEAST;
  else if (era.ghosts && !powerActive && Math.random() < 0.13) items = ORB_PATTERN;
  else {
    let pool = BASE[tier];
    if (era.ghosts) pool = pool.concat(GHOSTS[tier], GHOSTS[tier]);
    items = Phaser.Utils.Array.GetRandom(pool);
  }
  return { items, width: Math.max(...items.map((i) => i.dx)) + 16 };
}
