// ============================================
// sound.js - Web Audio API 音效系统
// ============================================

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'square', volume = 0.15) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.08) {
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
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export const Sound = {
  // 脚步声
  step() {
    playNoise(0.05, 0.04);
  },

  // 攻击声
  attack() {
    playTone(200, 0.1, 'sawtooth', 0.12);
    setTimeout(() => playTone(150, 0.08, 'sawtooth', 0.1), 50);
  },

  // 受伤
  hurt() {
    playTone(300, 0.1, 'square', 0.12);
    setTimeout(() => playTone(200, 0.15, 'square', 0.1), 60);
  },

  // 怪物死亡
  enemyDeath() {
    playTone(400, 0.08, 'square', 0.1);
    setTimeout(() => playTone(300, 0.08, 'square', 0.08), 60);
    setTimeout(() => playTone(200, 0.12, 'square', 0.06), 120);
  },

  // 拾取道具
  pickup() {
    playTone(500, 0.08, 'sine', 0.12);
    setTimeout(() => playTone(700, 0.1, 'sine', 0.1), 60);
  },

  // 使用道具
  useItem() {
    playTone(400, 0.06, 'sine', 0.1);
    setTimeout(() => playTone(500, 0.08, 'sine', 0.08), 40);
    setTimeout(() => playTone(600, 0.1, 'sine', 0.06), 80);
  },

  // 升级
  levelUp() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.2, 'sine', 0.12), i * 120);
    });
  },

  // 玩家死亡
  death() {
    playTone(300, 0.2, 'sawtooth', 0.15);
    setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.12), 150);
    setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.1), 350);
  },

  // 下楼梯
  stairs() {
    const notes = [400, 350, 300, 250];
    notes.forEach((freq, i) => {
      setTimeout(() => playTone(freq, 0.12, 'sine', 0.08), i * 80);
    });
  },

  // 开门
  door() {
    playTone(200, 0.15, 'triangle', 0.08);
    setTimeout(() => playTone(250, 0.1, 'triangle', 0.06), 80);
  },

  // 治疗
  heal() {
    playTone(600, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(800, 0.15, 'sine', 0.1), 80);
    setTimeout(() => playTone(1000, 0.2, 'sine', 0.08), 180);
  },

  // 魔法施放
  magic() {
    playTone(800, 0.15, 'sine', 0.08);
    playTone(1000, 0.2, 'triangle', 0.06);
    setTimeout(() => playTone(600, 0.15, 'sine', 0.06), 100);
  },

  // 错误/无法操作
  error() {
    playTone(200, 0.15, 'square', 0.08);
    setTimeout(() => playTone(180, 0.15, 'square', 0.06), 100);
  },

  // 发现秘密
  discover() {
    playTone(600, 0.1, 'sine', 0.1);
    setTimeout(() => playTone(900, 0.15, 'sine', 0.1), 100);
    setTimeout(() => playTone(1200, 0.2, 'sine', 0.08), 220);
  },

  // Boss出现
  bossAppear() {
    playTone(100, 0.3, 'sawtooth', 0.15);
    setTimeout(() => playTone(80, 0.3, 'sawtooth', 0.12), 200);
    setTimeout(() => playTone(120, 0.4, 'sawtooth', 0.1), 400);
    setTimeout(() => playTone(150, 0.5, 'sawtooth', 0.12), 600);
  },
};
