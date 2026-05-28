// sound.js — Web Audio API 音效
let audioCtx = null;

function getCtx() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
}

function beep(freq, duration, vol = 0.15) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

export function playMove()  { beep(300, 0.08, 0.08); }
export function playMerge() { beep(520, 0.12, 0.15); }
export function playWin()   { beep(660, 0.3, 0.2); setTimeout(() => beep(880, 0.4, 0.2), 150); }
export function playLose()  { beep(200, 0.4, 0.15); }
