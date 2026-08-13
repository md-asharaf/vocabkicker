declare global {
  interface Window {
    webkitAudioContext: typeof AudioContext;
  }
}

let _ac: AudioContext | null = null;
function ac() {
  if (!_ac) _ac = new (window.AudioContext || window.webkitAudioContext)();
  return _ac;
}

export function osc(type: OscillatorType, freq: number, dur: number, vol = 0.3, endFreq: number | null = null) {
  if (!_ac) return;
  const osc = _ac.createOscillator();
  const gain = _ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, _ac.currentTime);
  if (endFreq) {
    osc.frequency.exponentialRampToValueAtTime(endFreq, _ac.currentTime + dur);
  }
  gain.gain.setValueAtTime(vol, _ac.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.01, _ac.currentTime + dur);
  osc.connect(gain);
  gain.connect(_ac.destination);
  osc.start();
  osc.stop(_ac.currentTime + dur);
}

export function noise(dur: number, vol = 1, filterType: BiquadFilterType = 'lowpass', filterFreq = 600) {
  const ctx = ac();
  const buf = ctx!.createBuffer(1, Math.floor(ctx!.sampleRate * dur), ctx!.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx!.createBufferSource();
  src.buffer = buf;
  const flt = ctx!.createBiquadFilter();
  flt.type = filterType; flt.frequency.value = filterFreq;
  const g = ctx!.createGain();
  g.gain.setValueAtTime(vol, ctx!.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + dur);
  src.connect(flt); flt.connect(g); g.connect(ctx!.destination);
  src.start();
}

export function playKick() {
  noise(0.12, 1.0, 'lowpass', 520);
}

export function playStep() {
  noise(0.04, 0.35, 'lowpass', 280);
}

export function playGoal() {
  [0, 80, 170, 290, 450].forEach((delay, i) => {
    setTimeout(() => osc('sine', 500 + i * 130, 0.5, 0.28, 900 + i * 80), delay);
  });
  noise(1.0, 0.5, 'bandpass', 900);
}

export function playMiss() {
  osc('sawtooth', 280, 0.4, 0.4, 65);
  setTimeout(() => noise(0.08, 0.5, 'lowpass', 250), 320);
}

export function playWhistle() {
  const ctx = ac();
  const o = ctx!.createOscillator();
  const g = ctx!.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(2400, ctx!.currentTime);
  o.frequency.setValueAtTime(2000, ctx!.currentTime + 0.14);
  o.frequency.setValueAtTime(2400, ctx!.currentTime + 0.3);
  g.gain.setValueAtTime(0.28, ctx!.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx!.currentTime + 0.5);
  o.connect(g); g.connect(ctx!.destination);
  o.start(); o.stop(ctx!.currentTime + 0.52);
}
