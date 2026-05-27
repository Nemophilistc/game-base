// Web Audio API sound effects
import { CONFIG } from './config.js';

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.15, ramp = true) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (ramp) {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch (e) { /* ignore audio errors */ }
}

function playNoise(duration, volume = 0.1) {
  try {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
    }
    const src = ctx.createBufferSource();
    const gain = ctx.createGain();
    src.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    src.connect(gain);
    gain.connect(ctx.destination);
    src.start();
  } catch (e) { /* ignore */ }
}

export const Sound = {
  jump() {
    playTone(400, 0.12, 'sine', 0.1);
    playTone(600, 0.1, 'sine', 0.08);
  },

  springBounce() {
    playTone(300, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(500, 0.08, 'sine', 0.12), 40);
    setTimeout(() => playTone(800, 0.15, 'sine', 0.1), 80);
  },

  platformBreak() {
    playNoise(0.2, 0.15);
    playTone(200, 0.15, 'sawtooth', 0.06);
  },

  shoot() {
    playTone(800, 0.06, 'square', 0.08);
    playTone(600, 0.08, 'square', 0.06);
  },

  enemyDie() {
    playTone(500, 0.08, 'square', 0.1);
    setTimeout(() => playTone(300, 0.1, 'square', 0.08), 60);
    setTimeout(() => playTone(150, 0.15, 'sawtooth', 0.06), 120);
  },

  coinCollect() {
    playTone(880, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(1100, 0.12, 'sine', 0.1), 60);
  },

  jetpackActivate() {
    playTone(300, 0.3, 'sawtooth', 0.08);
    playTone(200, 0.3, 'sawtooth', 0.06);
  },

  propellerActivate() {
    playTone(400, 0.15, 'triangle', 0.1);
    setTimeout(() => playTone(500, 0.15, 'triangle', 0.08), 80);
  },

  gameOver() {
    playTone(400, 0.2, 'square', 0.1, false);
    setTimeout(() => playTone(300, 0.2, 'square', 0.1, false), 200);
    setTimeout(() => playTone(200, 0.4, 'square', 0.08), 400);
  },

  spikeHit() {
    playTone(200, 0.15, 'sawtooth', 0.12);
    playNoise(0.1, 0.12);
  },

  // Resume audio context on user interaction
  resume() {
    try {
      const ctx = getCtx();
      if (ctx.state === 'suspended') ctx.resume();
    } catch (e) { /* ignore */ }
  }
};
