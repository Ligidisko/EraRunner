// Tiny Web Audio synth: sound effects + a looping chiptune sequencer.
// Everything is generated in code, so there are no audio files to license.
// (CC0 tracks from OpenGameArt can replace the music later; SFX can stay.)

let ctx = null;
let master = null;
let musicTimer = null;

// Browsers only allow audio after a user gesture — call this on the first key press.
export function initAudio() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
}

const NOTE_INDEX = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };

// "A4" -> 440 Hz
function noteToFreq(note) {
  const m = /^([A-G]#?)(\d)$/.exec(note);
  if (!m) return null;
  const semis = NOTE_INDEX[m[1]] + (Number(m[2]) + 1) * 12 - 69;
  return 440 * Math.pow(2, semis / 12);
}

function tone(freq, dur, { type = 'square', vol = 0.2, when = 0, slideTo = null } = {}) {
  if (!ctx) return;
  const t = when || ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur, vol = 0.3) {
  if (!ctx) return;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = vol;
  src.buffer = buf;
  src.connect(gain).connect(master);
  src.start();
}

export const sfx = {
  jump: () => tone(300, 0.15, { vol: 0.15, slideTo: 700 }),
  coin: () => {
    if (!ctx) return;
    tone(988, 0.07, { vol: 0.12 });
    tone(1319, 0.12, { vol: 0.12, when: ctx.currentTime + 0.07 });
  },
  hit: () => { noise(0.25, 0.3); tone(140, 0.3, { type: 'sawtooth', vol: 0.15, slideTo: 60 }); },
  select: () => tone(660, 0.1, { vol: 0.12 }),
  eraClear: () => {
    if (!ctx) return;
    ['C5', 'E5', 'G5', 'C6'].forEach((n, i) => tone(noteToFreq(n), 0.18, { vol: 0.12, when: ctx.currentTime + i * 0.12 }));
  },
};

// Loops a song: { bpm, lead: {wave, vol, notes[]}, bass: {...} }. One note per 16th step.
export function playMusic(song) {
  stopMusic();
  if (!ctx || !song) return;
  const stepDur = 60 / song.bpm / 4;
  const tracks = [song.lead, song.bass].filter(Boolean);
  const length = Math.max(...tracks.map((t) => t.notes.length));
  let step = 0;
  let nextTime = ctx.currentTime + 0.05;
  // Lookahead scheduler: every 25ms, queue any notes due in the next 100ms.
  musicTimer = setInterval(() => {
    while (nextTime < ctx.currentTime + 0.1) {
      for (const t of tracks) {
        const f = noteToFreq(t.notes[step % t.notes.length]);
        if (f) tone(f, stepDur * 0.9, { type: t.wave, vol: t.vol, when: nextTime });
      }
      step = (step + 1) % length;
      nextTime += stepDur;
    }
  }, 25);
}

export function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
}
