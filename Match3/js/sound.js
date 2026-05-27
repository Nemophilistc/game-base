// ============================================================
// sound.js - Web Audio API 音效系统
// ============================================================

let audioCtx = null;
let masterGain = null;

function ensureContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
}

// --- 工具函数 ---
function playTone(freq, duration, type = 'sine', volume = 0.3) {
  ensureContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(audioCtx.currentTime);
  osc.stop(audioCtx.currentTime + duration);
}

function playNoise(duration, volume = 0.15) {
  ensureContext();
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const src = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 3000;
  src.buffer = buffer;
  gain.gain.setValueAtTime(volume, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start();
}

// --- 音效接口 ---
export const Sound = {
  swap() {
    playTone(440, 0.12, 'sine', 0.2);
    setTimeout(() => playTone(550, 0.1, 'sine', 0.15), 60);
  },

  match(chainLevel = 0) {
    const baseFreq = 520 + chainLevel * 80;
    playTone(baseFreq, 0.15, 'triangle', 0.25);
    setTimeout(() => playTone(baseFreq * 1.25, 0.15, 'triangle', 0.2), 80);
    setTimeout(() => playTone(baseFreq * 1.5, 0.2, 'triangle', 0.15), 160);
    playNoise(0.1, 0.08);
  },

  chain(chainLevel) {
    const baseFreq = 600 + chainLevel * 120;
    playTone(baseFreq, 0.1, 'square', 0.15);
    setTimeout(() => playTone(baseFreq * 1.5, 0.15, 'square', 0.12), 50);
    setTimeout(() => playTone(baseFreq * 2, 0.2, 'sine', 0.2), 100);
  },

  special() {
    playTone(300, 0.3, 'sawtooth', 0.15);
    playTone(600, 0.2, 'sine', 0.2);
    setTimeout(() => playTone(900, 0.3, 'sine', 0.15), 100);
    setTimeout(() => playNoise(0.15, 0.1), 150);
  },

  fail() {
    playTone(300, 0.15, 'square', 0.2);
    setTimeout(() => playTone(220, 0.25, 'square', 0.15), 100);
  },

  levelComplete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.3, 'sine', 0.25), i * 120);
    });
  },

  gameOver() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.4, 'triangle', 0.2), i * 200);
    });
  },

  click() {
    playTone(800, 0.06, 'sine', 0.15);
  },
};
