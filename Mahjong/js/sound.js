// sound.js - Web Audio API sound effects

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', vol = 0.15) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch(e) {}
}

function playNoise(duration, vol = 0.08) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch(e) {}
}

export const Sound = {
  select() {
    playTone(800, 0.08, 'sine', 0.12);
  },
  match() {
    playTone(523, 0.1, 'sine', 0.15);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.15), 80);
    setTimeout(() => playTone(784, 0.15, 'sine', 0.15), 160);
  },
  invalid() {
    playTone(200, 0.15, 'square', 0.1);
    setTimeout(() => playTone(180, 0.15, 'square', 0.1), 100);
  },
  shuffle() {
    playNoise(0.3, 0.1);
    setTimeout(() => playTone(400, 0.2, 'triangle', 0.08), 100);
  },
  hint() {
    playTone(880, 0.08, 'sine', 0.1);
    setTimeout(() => playTone(1100, 0.12, 'sine', 0.12), 60);
  },
  complete() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((n, i) => setTimeout(() => playTone(n, 0.25, 'sine', 0.15), i * 120));
  },
  gameOver() {
    playTone(400, 0.3, 'sawtooth', 0.08);
    setTimeout(() => playTone(300, 0.3, 'sawtooth', 0.08), 200);
    setTimeout(() => playTone(200, 0.5, 'sawtooth', 0.08), 400);
  }
};
