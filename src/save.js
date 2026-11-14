// High-score table (top 10, 3-letter initials) in localStorage. Wrapped in
// try/catch because itch's iframe or private browsing can block storage —
// the game must still work, it just won't remember scores.
const KEY = 'era-runner-scores-v2';

// Arcade machines ship with a pre-filled table, so it never looks empty.
const DEFAULT_TABLE = [
  ['ACE', 25000], ['RAD', 20000], ['MOM', 15000], ['DAD', 12000], ['BFF', 10000],
  ['LOL', 8000], ['XYZ', 6000], ['ZAP', 4000], ['JOY', 2000], ['NEW', 1000],
].map(([name, score]) => ({ name, score }));

export function getScores() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(raw) && raw.length) return raw;
  } catch { /* storage blocked or corrupt */ }
  return DEFAULT_TABLE.map((e) => ({ ...e }));
}

export function getHighScore() {
  return getScores()[0].score;
}

export function qualifies(score) {
  const table = getScores();
  return score > 0 && (table.length < 10 || score > table[table.length - 1].score);
}

// Inserts the entry and returns its rank (0-based) so the table can highlight it.
export function addScore(name, score) {
  const table = getScores();
  table.push({ name, score });
  table.sort((a, b) => b.score - a.score);
  const trimmed = table.slice(0, 10);
  try { localStorage.setItem(KEY, JSON.stringify(trimmed)); } catch { /* ignore */ }
  return trimmed.findIndex((e) => e.name === name && e.score === score);
}
