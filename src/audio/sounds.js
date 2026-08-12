/**
 * sounds.js  —  All game audio via Web Audio API (zero external files).
 */

let _ac = null;
function ac() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  return _ac;
}

function osc(type, freq, dur, vol = 0.3, endFreq = null) {
  const ctx = ac();
  const o   = ctx.createOscillator();
  const g   = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + dur);
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + dur);
}

function noise(dur, vol = 1, filterType = 'lowpass', filterFreq = 600) {
  const ctx = ac();
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const flt = ctx.createBiquadFilter();
  flt.type = filterType; flt.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  src.connect(flt); flt.connect(g); g.connect(ctx.destination);
  src.start();
}

// ── Public sounds ─────────────────────────────────────────────────

/** Thud on ball contact */
export function playKick() {
  noise(0.12, 1.0, 'lowpass', 520);
}

/** Footstep during run-up */
export function playStep() {
  noise(0.04, 0.35, 'lowpass', 280);
}

/** Goal celebration: rising tones + crowd noise */
export function playGoal() {
  [0, 80, 170, 290, 450].forEach((delay, i) => {
    setTimeout(() => osc('sine', 500 + i * 130, 0.5, 0.28, 900 + i * 80), delay);
  });
  noise(1.0, 0.5, 'bandpass', 900);
}

/** Missed / caught: descending buzz */
export function playMiss() {
  osc('sawtooth', 280, 0.4, 0.4, 65);
  setTimeout(() => noise(0.08, 0.5, 'lowpass', 250), 320);
}

/** Referee whistle at question start / game end */
export function playWhistle() {
  const ctx = ac();
  const o   = ctx.createOscillator();
  const g   = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(2400, ctx.currentTime);
  o.frequency.setValueAtTime(2000, ctx.currentTime + 0.14);
  o.frequency.setValueAtTime(2400, ctx.currentTime + 0.3);
  g.gain.setValueAtTime(0.28, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
  o.connect(g); g.connect(ctx.destination);
  o.start(); o.stop(ctx.currentTime + 0.52);
}
