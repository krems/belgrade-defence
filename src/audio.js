let ac = null;
let master = null;
let noiseBuf = null;
let muted = false;
const lastPlay = {};

function ensure() {
  if (typeof window === 'undefined') return false;
  if (!ac) {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return false;
      ac = new Ctx();
      master = ac.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ac.destination);
      const len = ac.sampleRate * 0.5;
      noiseBuf = ac.createBuffer(1, len, ac.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch {
      return false;
    }
  }
  if (ac.state === 'suspended') ac.resume();
  return true;
}

function tone(wave, freq, dur, vol, slideTo = null, delay = 0) {
  if (!ensure()) return;
  const t0 = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = wave;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo != null) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

function noise(dur, vol, filterFreq, delay = 0) {
  if (!ensure()) return;
  const t0 = ac.currentTime + delay;
  const src = ac.createBufferSource();
  src.buffer = noiseBuf;
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(filter).connect(gain).connect(master);
  src.start(t0);
  src.stop(t0 + dur + 0.02);
}

function limited(name, minGap, fn) {
  if (!ac) { ensure(); if (!ac) return; }
  const now = ac.currentTime;
  if (lastPlay[name] && now - lastPlay[name] < minGap) return;
  lastPlay[name] = now;
  fn();
}

export const audio = {
  unlock() {
    ensure();
  },
  setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.5;
  },
  isMuted() {
    return muted;
  },
  click() {
    tone('triangle', 640, 0.05, 0.08);
  },
  shoot() {
    limited('shoot', 0.08, () => tone('square', 900, 0.07, 0.1, 260));
  },
  hit() {
    limited('hit', 0.05, () => tone('triangle', 210, 0.05, 0.09, 120));
  },
  explosion() {
    noise(0.4, 0.4, 900);
    tone('sine', 100, 0.35, 0.3, 40);
  },
  mortarFire() {
    tone('sine', 180, 0.15, 0.18, 60);
    noise(0.12, 0.15, 600);
  },
  coin() {
    tone('square', 988, 0.06, 0.1);
    tone('square', 1319, 0.09, 0.1, null, 0.06);
  },
  plant() {
    noise(0.09, 0.16, 420);
    tone('triangle', 260, 0.07, 0.08, 160);
  },
  shovel() {
    noise(0.12, 0.2, 320);
    tone('triangle', 150, 0.09, 0.12, 80);
  },
  chomp() {
    limited('chomp', 0.24, () => {
      tone('sawtooth', 95, 0.09, 0.13, 55);
      noise(0.06, 0.08, 300);
    });
  },
  zombieDie() {
    limited('zdie', 0.12, () => tone('sawtooth', 160, 0.22, 0.1, 50));
  },
  leak() {
    tone('sawtooth', 220, 0.45, 0.2, 55);
    noise(0.3, 0.18, 500);
  },
  wave() {
    tone('square', 392, 0.12, 0.14);
    tone('square', 523, 0.2, 0.14, null, 0.12);
  },
  win() {
    [523, 659, 784, 1047].forEach((f, i) => tone('square', f, 0.22, 0.14, null, i * 0.16));
  },
  lose() {
    [392, 330, 262, 196].forEach((f, i) => tone('sawtooth', f, 0.3, 0.12, null, i * 0.2));
  },
};
