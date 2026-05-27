// ============================================
// 农场模拟游戏 - Web Audio API 音效系统
// ============================================

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
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
  filter.type = 'bandpass';
  filter.frequency.value = 800;
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start();
}

export const Sound = {
  // 锄地 - 沉闷的敲击声
  hoe() {
    playTone(120, 0.15, 'square', 0.2);
    setTimeout(() => playNoise(0.08, 0.15), 50);
  },

  // 浇水 - 流水声
  water() {
    const ctx = getCtx();
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        playTone(600 + Math.random() * 400, 0.12, 'sine', 0.15);
      }, i * 60);
    }
    playNoise(0.3, 0.08);
  },

  // 种植 - 轻柔的放入声
  plant() {
    playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(300, 0.15, 'sine', 0.15), 80);
  },

  // 收获 - 欢快的上升音
  harvest() {
    playTone(523, 0.12, 'sine', 0.25);
    setTimeout(() => playTone(659, 0.12, 'sine', 0.25), 100);
    setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 200);
  },

  // 喂养 - 咀嚼声
  feed() {
    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        playTone(200 + Math.random() * 100, 0.08, 'square', 0.1);
      }, i * 80);
    }
  },

  // 买卖 - 收银机声
  buy() {
    playTone(800, 0.08, 'square', 0.2);
    setTimeout(() => playTone(1000, 0.08, 'square', 0.2), 80);
    setTimeout(() => playTone(1200, 0.15, 'square', 0.25), 160);
  },

  sell() {
    playTone(1200, 0.08, 'sine', 0.2);
    setTimeout(() => playTone(1000, 0.08, 'sine', 0.2), 80);
    setTimeout(() => playTone(800, 0.15, 'sine', 0.15), 160);
  },

  // 错误/无法操作
  error() {
    playTone(200, 0.15, 'square', 0.2);
    setTimeout(() => playTone(150, 0.2, 'square', 0.2), 120);
  },

  // 新一天开始
  newDay() {
    playTone(440, 0.15, 'sine', 0.2);
    setTimeout(() => playTone(554, 0.15, 'sine', 0.2), 150);
    setTimeout(() => playTone(659, 0.3, 'sine', 0.25), 300);
  },

  // 下雨
  rain() {
    playNoise(0.5, 0.05);
  },

  // 动物叫
  animalSound(type) {
    switch (type) {
      case 'chicken':
        playTone(800, 0.08, 'sawtooth', 0.1);
        setTimeout(() => playTone(900, 0.12, 'sawtooth', 0.12), 100);
        setTimeout(() => playTone(700, 0.15, 'sawtooth', 0.08), 200);
        break;
      case 'cow':
        playTone(150, 0.3, 'sawtooth', 0.15);
        setTimeout(() => playTone(130, 0.4, 'sawtooth', 0.12), 200);
        break;
      case 'sheep':
        playTone(300, 0.15, 'sawtooth', 0.12);
        setTimeout(() => playTone(280, 0.2, 'sawtooth', 0.1), 150);
        break;
    }
  },

  // 季节变化
  seasonChange() {
    const notes = [392, 440, 494, 523, 587];
    notes.forEach((n, i) => {
      setTimeout(() => playTone(n, 0.15, 'sine', 0.2), i * 120);
    });
  },

  // 繁殖成功
  breed() {
    playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => playTone(659, 0.1, 'sine', 0.2), 100);
    setTimeout(() => playTone(784, 0.1, 'sine', 0.2), 200);
    setTimeout(() => playTone(1047, 0.3, 'sine', 0.3), 300);
  },
};

// 用户首次交互后初始化音频上下文
export function initAudio() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') {
    ctx.resume();
  }
}
