// sound.js - Web Audio API sound effects

let audioCtx = null;
let masterGain = null;

function ensureAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = audioCtx.createGain();
        masterGain.gain.value = 0.4;
        masterGain.connect(audioCtx.destination);
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

function playTone(freq, duration, type = 'sine', gainVal = 0.3, detune = 0) {
    const ctx = ensureAudio();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, gainVal = 0.2) {
    const ctx = ensureAudio();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 3000;
    source.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    source.start(ctx.currentTime);
    source.stop(ctx.currentTime + duration);
}

export const Sound = {
    init() {
        ensureAudio();
    },

    coinCatch(combo = 0) {
        const baseFreq = 600 + combo * 80;
        playTone(baseFreq, 0.15, 'sine', 0.25);
        playTone(baseFreq * 1.5, 0.1, 'sine', 0.15);
    },

    diamondCatch() {
        playTone(1200, 0.15, 'sine', 0.25);
        playTone(1500, 0.12, 'sine', 0.2);
        playTone(1800, 0.1, 'sine', 0.15);
        setTimeout(() => playTone(2100, 0.15, 'sine', 0.1), 50);
    },

    bombHit() {
        playNoise(0.3, 0.35);
        playTone(80, 0.4, 'sawtooth', 0.3);
        playTone(60, 0.5, 'square', 0.2);
    },

    bombExplode() {
        playNoise(0.2, 0.2);
        playTone(100, 0.3, 'sawtooth', 0.2);
    },

    powerUp() {
        const ctx = ensureAudio();
        const freqs = [523, 659, 784, 1047];
        freqs.forEach((f, i) => {
            setTimeout(() => playTone(f, 0.15, 'sine', 0.2), i * 60);
        });
    },

    comboBreak() {
        playTone(200, 0.25, 'sawtooth', 0.2);
        playTone(150, 0.3, 'square', 0.15);
    },

    gameOver() {
        const freqs = [523, 440, 349, 262];
        freqs.forEach((f, i) => {
            setTimeout(() => playTone(f, 0.3, 'sine', 0.25), i * 200);
        });
    },

    rockHit() {
        playNoise(0.15, 0.15);
        playTone(120, 0.2, 'triangle', 0.2);
    },

    miss() {
        playTone(180, 0.15, 'triangle', 0.1);
    },

    shieldBlock() {
        playTone(800, 0.1, 'sine', 0.2);
        playTone(1000, 0.15, 'sine', 0.25);
        playNoise(0.08, 0.1);
    },

    comboLevel(combo) {
        const freq = 400 + combo * 100;
        playTone(freq, 0.2, 'sine', 0.3);
        playTone(freq * 1.25, 0.15, 'sine', 0.2);
    },
};
