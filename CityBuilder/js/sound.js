// ============================================
// 城市建设者 - 音效系统 (Web Audio API)
// ============================================

let audioCtx = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(frequency, duration, type = 'sine', volume = 0.15) {
  try {
    const ctx = getCtx();
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
  } catch (e) {
    // 音频不可用时静默失败
  }
}

// 建造音效 - 短促上升音
export function playBuild() {
  playTone(440, 0.1, 'sine', 0.12);
  setTimeout(() => playTone(660, 0.15, 'sine', 0.1), 80);
  setTimeout(() => playTone(880, 0.2, 'sine', 0.08), 160);
}

// 拆除音效 - 下降音
export function playDemolish() {
  playTone(440, 0.15, 'sawtooth', 0.08);
  setTimeout(() => playTone(330, 0.15, 'sawtooth', 0.06), 100);
  setTimeout(() => playTone(220, 0.2, 'sawtooth', 0.05), 200);
}

// 收税音效 - 硬币声
export function playTax() {
  playTone(1200, 0.08, 'sine', 0.08);
  setTimeout(() => playTone(1500, 0.08, 'sine', 0.06), 60);
  setTimeout(() => playTone(1800, 0.12, 'sine', 0.05), 120);
}

// 升级音效 - 和弦上升
export function playUpgrade() {
  playTone(523, 0.15, 'sine', 0.1);
  setTimeout(() => playTone(659, 0.15, 'sine', 0.1), 100);
  setTimeout(() => playTone(784, 0.15, 'sine', 0.1), 200);
  setTimeout(() => playTone(1047, 0.25, 'sine', 0.12), 300);
}

// 错误音效 - 低沉警告
export function playError() {
  playTone(200, 0.2, 'square', 0.06);
  setTimeout(() => playTone(180, 0.3, 'square', 0.04), 150);
}

// 通知音效 - 清脆提示
export function playNotify() {
  playTone(880, 0.1, 'sine', 0.08);
  setTimeout(() => playTone(1100, 0.15, 'sine', 0.06), 80);
}
