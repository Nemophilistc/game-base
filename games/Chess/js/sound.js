// ============================================================
// sound.js — Web Audio API 音效系统
// ============================================================

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', gainVal = 0.15, detune = 0) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  osc.detune.value = detune;
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, gainVal = 0.08) {
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const gain = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 2000;
  gain.gain.setValueAtTime(gainVal, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  src.start();
  src.stop(ctx.currentTime + duration);
}

/** 普通落子音效 */
export function playMoveSound() {
  playNoise(0.08, 0.12);
  playTone(600, 0.1, 'sine', 0.08);
}

/** 吃子音效（稍重） */
export function playCaptureSound() {
  playNoise(0.12, 0.18);
  playTone(300, 0.15, 'square', 0.06);
  setTimeout(() => playTone(200, 0.1, 'sine', 0.05), 60);
}

/** 将军音效（警示） */
export function playCheckSound() {
  playTone(800, 0.12, 'square', 0.1);
  setTimeout(() => playTone(1000, 0.15, 'square', 0.1), 120);
}

/** 将杀音效（结束） */
export function playCheckmateSound() {
  playTone(500, 0.2, 'square', 0.12);
  setTimeout(() => playTone(400, 0.2, 'square', 0.12), 200);
  setTimeout(() => playTone(300, 0.4, 'sine', 0.1), 400);
}

/** 王车易位音效 */
export function playCastleSound() {
  playNoise(0.06, 0.1);
  setTimeout(() => playTone(500, 0.12, 'sine', 0.08), 80);
}

/** 和棋/逼和音效 */
export function playDrawSound() {
  playTone(400, 0.3, 'sine', 0.08);
  setTimeout(() => playTone(350, 0.3, 'sine', 0.08), 300);
}

/** 兵升变音效 */
export function playPromotionSound() {
  playTone(400, 0.1, 'sine', 0.1);
  setTimeout(() => playTone(600, 0.1, 'sine', 0.1), 100);
  setTimeout(() => playTone(800, 0.2, 'sine', 0.12), 200);
}

/** 悔棋音效 */
export function playUndoSound() {
  playTone(500, 0.08, 'sine', 0.06);
  setTimeout(() => playTone(400, 0.1, 'sine', 0.06), 80);
}
