// Auto-charting: turns a song's audio into rhythm-game notes by finding its
// onsets (moments where the sound suddenly gets louder: drum hits, chord
// changes, melody notes). This lets any track become a playable chart with
// notes that land on the music, without hand-writing a chart.
//
// Method (a simple "energy flux" onset detector):
//  1. Split the audio into ~11ms frames and measure each frame's energy.
//  2. Flux = how much louder each frame is than the one before (only increases).
//  3. A frame is an onset if its flux is a local peak AND well above the
//     average flux of the surrounding ~0.5s (an adaptive threshold).
//  4. Keep onsets at least `minGap` apart so the chart stays playable.

const HOP = 512;

export function chartFromBuffer(buffer, { minGap = 0.3, sensitivity = 1.6 } = {}) {
  const sr = buffer.sampleRate;
  const chans = Math.min(buffer.numberOfChannels, 2);
  const data = [...Array(chans).keys()].map((c) => buffer.getChannelData(c));
  const frames = Math.floor(buffer.length / HOP);

  // 1. Energy per frame (both channels mixed).
  const energy = new Float32Array(frames);
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    for (let i = f * HOP; i < (f + 1) * HOP; i++) {
      let s = 0;
      for (let c = 0; c < chans; c++) s += data[c][i];
      sum += (s / chans) ** 2;
    }
    energy[f] = Math.sqrt(sum / HOP);
  }

  // 2. Positive flux.
  const flux = new Float32Array(frames);
  for (let f = 1; f < frames; f++) flux[f] = Math.max(0, energy[f] - energy[f - 1]);

  // 3. Adaptive threshold via a prefix sum (local mean over +/- W frames).
  const W = Math.round((0.5 * sr) / HOP);
  const prefix = new Float64Array(frames + 1);
  for (let f = 0; f < frames; f++) prefix[f + 1] = prefix[f] + flux[f];
  const localMean = (f) => {
    const a = Math.max(0, f - W);
    const b = Math.min(frames, f + W + 1);
    return (prefix[b] - prefix[a]) / (b - a);
  };

  const onsets = [];
  let last = -Infinity;
  for (let f = 1; f < frames - 1; f++) {
    const isPeak = flux[f] > flux[f - 1] && flux[f] >= flux[f + 1];
    const t = (f * HOP) / sr;
    if (isPeak && flux[f] > localMean(f) * sensitivity && flux[f] > 0.002 && t - last >= minGap) {
      onsets.push({ t, strength: flux[f] });
      last = t;
    }
  }

  // Lanes: stronger hits go to the outer lanes, with a little variety, and
  // never the same lane three times in a row.
  const sorted = onsets.map((o) => o.strength).sort((a, b) => a - b);
  const rank = (s) => sorted.indexOf(s) / Math.max(1, sorted.length - 1);
  const notes = [];
  onsets.forEach((o, i) => {
    let lane = [1, 2, 0, 3][Math.min(3, Math.floor(rank(o.strength) * 4))];
    if (i % 5 === 4) lane = 3 - lane;
    const n = notes.length;
    if (n >= 2 && notes[n - 1].lane === lane && notes[n - 2].lane === lane) lane = (lane + 1) % 4;
    notes.push({ t: o.t, lane });
  });
  return { notes, duration: buffer.duration };
}
