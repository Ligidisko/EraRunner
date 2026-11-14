// High score in localStorage. Wrapped in try/catch because itch's iframe
// (or private browsing) can block storage — the game must still work.
const KEY = 'era-runner-highscore';

export function getHighScore() {
  try { return Number(localStorage.getItem(KEY)) || 0; } catch { return 0; }
}

export function saveHighScore(score) {
  try {
    if (score > getHighScore()) { localStorage.setItem(KEY, String(score)); return true; }
  } catch { /* storage blocked: ignore */ }
  return false;
}
