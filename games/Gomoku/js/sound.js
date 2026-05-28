// sound.js — Web Audio API 音效

let ctx = null;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
}

function play(freq, duration, type = 'sine', volume = 0.3) {
    try {
        const c = getCtx();
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, c.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
        osc.connect(gain);
        gain.connect(c.destination);
        osc.start(c.currentTime);
        osc.stop(c.currentTime + duration);
    } catch (_) { /* 静默失败 */ }
}

/** 落子音效 — 清脆短促 */
export function playPlace() {
    play(800, 0.12, 'sine', 0.25);
    setTimeout(() => play(1200, 0.08, 'sine', 0.15), 30);
}

/** 获胜音效 — 上升和弦 */
export function playWin() {
    play(523, 0.3, 'sine', 0.3);
    setTimeout(() => play(659, 0.3, 'sine', 0.3), 150);
    setTimeout(() => play(784, 0.4, 'sine', 0.35), 300);
    setTimeout(() => play(1047, 0.6, 'sine', 0.3), 500);
}

/** 失败音效 — 下降音 */
export function playLose() {
    play(400, 0.3, 'sawtooth', 0.15);
    setTimeout(() => play(300, 0.4, 'sawtooth', 0.12), 200);
    setTimeout(() => play(200, 0.6, 'sawtooth', 0.1), 450);
}
