// ============================================
// Mini Golf - Sound System (Web Audio API)
// ============================================

let audioCtx = null;

function ensureAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(freq, duration, type = 'sine', vol = 0.15, detune = 0) {
    try {
        const ctx = ensureAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);
        if (detune) osc.detune.setValueAtTime(detune, ctx.currentTime);
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) {}
}

function playNoise(duration, vol = 0.08) {
    try {
        const ctx = ensureAudioCtx();
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(2000, ctx.currentTime);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);
        source.start(ctx.currentTime);
    } catch (e) {}
}

export function resumeAudio() {
    try {
        const ctx = ensureAudioCtx();
        if (ctx.state === 'suspended') ctx.resume();
    } catch (e) {}
}

export function playHit() {
    playTone(440, 0.12, 'triangle', 0.2);
    playTone(880, 0.08, 'sine', 0.08);
}

export function playWallBounce() {
    playTone(600, 0.08, 'square', 0.08);
    playNoise(0.04, 0.06);
}

export function playBumper() {
    playTone(800, 0.15, 'sine', 0.15);
    playTone(1200, 0.1, 'sine', 0.1);
}

export function playHoleIn() {
    const ctx = ensureAudioCtx();
    const t = ctx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + i * 0.12);
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.2, t + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.12 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t + i * 0.12);
        osc.stop(t + i * 0.12 + 0.5);
    });
}

export function playWaterSplash() {
    playNoise(0.3, 0.12);
    playTone(200, 0.2, 'sine', 0.06);
}

export function playSandThud() {
    playNoise(0.1, 0.1);
    playTone(150, 0.1, 'triangle', 0.08);
}

export function playWindmillHit() {
    playTone(300, 0.15, 'sawtooth', 0.1);
    playTone(200, 0.1, 'triangle', 0.08);
}
