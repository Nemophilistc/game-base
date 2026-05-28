// sound.js - Web Audio API sound effects

let audioCtx = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.15, startDelay = 0) {
    const ctx = getCtx();
    const t = ctx.currentTime + startDelay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + duration);
}

function playNoise(duration, volume = 0.08, startDelay = 0) {
    const ctx = getCtx();
    const t = ctx.currentTime + startDelay;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(t);
}

export function playPlace() {
    playTone(280, 0.12, 'sine', 0.18);
    playNoise(0.06, 0.06);
}

export function playFlip(index = 0) {
    const delay = index * 0.06;
    playTone(500 + index * 40, 0.1, 'triangle', 0.1, delay);
    playNoise(0.04, 0.03, delay);
}

export function playInvalid() {
    playTone(180, 0.15, 'square', 0.08);
    playTone(140, 0.15, 'square', 0.08, 0.08);
}

export function playStart() {
    playTone(400, 0.15, 'sine', 0.12);
    playTone(500, 0.15, 'sine', 0.12, 0.12);
    playTone(600, 0.2, 'sine', 0.15, 0.24);
}

export function playGameOver() {
    playTone(600, 0.2, 'sine', 0.12);
    playTone(500, 0.2, 'sine', 0.12, 0.15);
    playTone(400, 0.3, 'sine', 0.15, 0.3);
}
