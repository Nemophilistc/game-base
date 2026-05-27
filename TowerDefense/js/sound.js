// ==================== Web Audio API 音效系统 ====================

let audioCtx = null;
let masterGain = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.3;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function ensureResumed() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// ---- 工具函数 ----
function playTone(freq, duration, type = 'square', volume = 0.3) {
  const ctx = ensureResumed();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.2) {
  const ctx = ensureResumed();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(masterGain);
  source.start();
}

// ---- 音效定义 ----

/** 建造音效：上升音阶 */
export function playBuild() {
  const ctx = ensureResumed();
  const t = ctx.currentTime;
  [400, 600, 800].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.15, t + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.12);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + i * 0.08);
    osc.stop(t + i * 0.08 + 0.15);
  });
}

/** 射击音效：短促尖锐 */
export function playShoot() {
  playTone(800, 0.08, 'square', 0.1);
}

/** 箭矢射击 */
export function playArrowShoot() {
  playTone(1200, 0.06, 'sawtooth', 0.08);
}

/** 炮击音效：低沉爆炸 */
export function playCannonShoot() {
  playNoise(0.25, 0.25);
  playTone(100, 0.3, 'sine', 0.2);
}

/** 冰冻音效 */
export function playIceShoot() {
  const ctx = ensureResumed();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(2000, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.2);
  g.gain.setValueAtTime(0.1, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  osc.connect(g);
  g.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.3);
}

/** 电击音效 */
export function playElectricShoot() {
  const ctx = ensureResumed();
  for (let i = 0; i < 3; i++) {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = 100 + Math.random() * 2000;
    g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 0.08);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(ctx.currentTime + i * 0.05);
    osc.stop(ctx.currentTime + i * 0.05 + 0.1);
  }
}

/** 火焰音效 */
export function playFlameShoot() {
  playNoise(0.15, 0.1);
}

/** 激光音效 */
export function playLaserShoot() {
  const ctx = ensureResumed();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(3000, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.15);
  g.gain.setValueAtTime(0.12, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(g);
  g.connect(masterGain);
  osc.start();
  osc.stop(ctx.currentTime + 0.25);
}

/** 爆炸音效 */
export function playExplosion() {
  playNoise(0.4, 0.3);
  playTone(60, 0.5, 'sine', 0.25);
}

/** 敌人死亡音效 */
export function playEnemyDeath() {
  playTone(300, 0.15, 'square', 0.1);
  playTone(200, 0.2, 'square', 0.08);
}

/** 波次开始音效：号角 */
export function playWaveStart() {
  const ctx = ensureResumed();
  const t = ctx.currentTime;
  [523, 659, 784].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.2, t + i * 0.15);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.15 + 0.3);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + i * 0.15);
    osc.stop(t + i * 0.15 + 0.35);
  });
}

/** 胜利音效 */
export function playVictory() {
  const ctx = ensureResumed();
  const t = ctx.currentTime;
  [523, 659, 784, 1047].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.25, t + i * 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.4);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + i * 0.2);
    osc.stop(t + i * 0.2 + 0.5);
  });
}

/** 失败音效 */
export function playDefeat() {
  const ctx = ensureResumed();
  const t = ctx.currentTime;
  [400, 350, 300, 200].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.15, t + i * 0.2);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.2 + 0.4);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + i * 0.2);
    osc.stop(t + i * 0.2 + 0.45);
  });
}

/** 升级音效 */
export function playUpgrade() {
  const ctx = ensureResumed();
  const t = ctx.currentTime;
  [600, 800, 1000, 1200].forEach((f, i) => {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    g.gain.setValueAtTime(0.12, t + i * 0.06);
    g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.1);
    osc.connect(g);
    g.connect(masterGain);
    osc.start(t + i * 0.06);
    osc.stop(t + i * i * 0.06 + 0.15);
  });
}

/** 出售音效 */
export function playSell() {
  playTone(600, 0.1, 'sine', 0.15);
  playTone(400, 0.15, 'sine', 0.12);
}

/** 设置主音量 (0-1) */
export function setMasterVolume(v) {
  getCtx();
  masterGain.gain.value = Math.max(0, Math.min(1, v));
}

/** 预热音频上下文（需用户交互后调用） */
export function initAudio() {
  ensureResumed();
}
