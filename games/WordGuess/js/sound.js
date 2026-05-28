// sound.js - Web Audio API 音效系统

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

// 键盘输入音效 - 短促清脆
export function playKeyInput() {
  playTone(600, 0.08, 'sine', 0.15);
}

// 格子翻转音效 - 柔和
export function playFlip() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(400, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.15);

  gain.gain.setValueAtTime(0.12, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.2);
}

// 猜对胜利音效 - 欢快上升
export function playWin() {
  const notes = [523, 659, 784, 1047]; // C5 E5 G5 C6
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.3, 'sine', 0.2), i * 120);
  });
}

// 猜错失败音效 - 低沉下降
export function playLose() {
  const notes = [400, 350, 300, 250];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.25, 'triangle', 0.2), i * 200);
  });
}

// 错误输入音效 - 警告
export function playError() {
  playTone(200, 0.15, 'square', 0.1);
}

// 删除音效
export function playDelete() {
  playTone(350, 0.06, 'sine', 0.1);
}
