// ============================================================
// sound.js - Web Audio API 音效系统
// ============================================================

let ctx = null;

function getCtx() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// 通用音符播放
function playTone(freq, duration, type = 'sine', volume = 0.15) {
  const c = getCtx();
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(gain).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

// 噪音（模拟烹饪声）
function playNoise(duration, volume = 0.06) {
  const c = getCtx();
  const bufferSize = c.sampleRate * duration;
  const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.5;
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const gain = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 800;
  gain.gain.setValueAtTime(volume, c.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(filter).connect(gain).connect(c.destination);
  src.start();
}

// --- 公开音效 ---

// 顾客到达 - 门铃声
export function soundCustomerArrive() {
  playTone(880, 0.12, 'sine', 0.12);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.10), 120);
}

// 点餐 - 轻快提示
export function soundOrder() {
  playTone(523, 0.08, 'triangle', 0.12);
  setTimeout(() => playTone(659, 0.08, 'triangle', 0.12), 80);
  setTimeout(() => playTone(784, 0.12, 'triangle', 0.10), 160);
}

// 烹饪中 - 滋滋声
export function soundCooking() {
  playNoise(0.6, 0.05);
  playTone(200, 0.4, 'sawtooth', 0.03);
}

// 上菜 - 清脆叮咚
export function soundServe() {
  playTone(1047, 0.1, 'sine', 0.15);
  setTimeout(() => playTone(1319, 0.15, 'sine', 0.12), 100);
}

// 收钱 - 硬币声
export function soundPayment() {
  playTone(1500, 0.05, 'square', 0.08);
  setTimeout(() => playTone(2000, 0.05, 'square', 0.08), 60);
  setTimeout(() => playTone(2500, 0.1, 'square', 0.06), 120);
}

// 升级 - 升调号角
export function soundUpgrade() {
  const notes = [523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.2, 'triangle', 0.12), i * 120);
  });
}

// 顾客离开(不满) - 低沉下降
export function soundCustomerAngry() {
  playTone(400, 0.15, 'sawtooth', 0.08);
  setTimeout(() => playTone(300, 0.2, 'sawtooth', 0.06), 150);
}

// 新一天开始
export function soundNewDay() {
  const notes = [392, 523, 659, 784, 1047];
  notes.forEach((n, i) => {
    setTimeout(() => playTone(n, 0.25, 'sine', 0.1), i * 150);
  });
}

// 按钮点击
export function soundClick() {
  playTone(700, 0.06, 'square', 0.06);
}

// 错误/不能操作
export function soundError() {
  playTone(200, 0.15, 'square', 0.08);
  setTimeout(() => playTone(150, 0.2, 'square', 0.06), 150);
}
