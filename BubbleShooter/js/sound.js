// sound.js - Web Audio API synthesized sounds
let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function resumeAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

function playTone(freq, duration, type = 'sine', volume = 0.3, detune = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (detune) osc.detune.setValueAtTime(detune, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.15) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(3000, ctx.currentTime);
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export function playShoot() {
  playTone(280, 0.12, 'triangle', 0.25);
  playTone(360, 0.08, 'sine', 0.15);
}

export function playPop() {
  playTone(600, 0.15, 'sine', 0.2);
  playTone(900, 0.1, 'sine', 0.15);
  playNoise(0.06, 0.08);
}

export function playCombo(comboLevel) {
  const baseFreq = 400 + comboLevel * 100;
  playTone(baseFreq, 0.2, 'sine', 0.25);
  setTimeout(() => playTone(baseFreq * 1.25, 0.15, 'sine', 0.2), 60);
  setTimeout(() => playTone(baseFreq * 1.5, 0.2, 'triangle', 0.2), 120);
}

export function playFall() {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(500, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.3);
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

export function playBomb() {
  playNoise(0.3, 0.25);
  playTone(80, 0.4, 'sawtooth', 0.2);
  playTone(60, 0.5, 'sine', 0.15);
}

export function playLevelUp() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.25, 'sine', 0.2), i * 100);
  });
}

export function playGameOver() {
  const notes = [400, 350, 300, 200];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.4, 'triangle', 0.2), i * 150);
  });
}
