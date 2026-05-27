// ============================================================
// sound.js - Web Audio API Sound Engine
// ============================================================

let ctx = null;
let masterGain = null;

function ensureCtx() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        masterGain = ctx.createGain();
        masterGain.gain.value = 0.3;
        masterGain.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

function playTone(freq, duration, type = 'sine', vol = 0.3, detune = 0) {
    const c = ensureCtx();
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(c.currentTime);
    osc.stop(c.currentTime + duration);
}

function playNoise(duration, vol = 0.1) {
    const c = ensureCtx();
    const bufferSize = c.sampleRate * duration;
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * vol;
    }
    const source = c.createBufferSource();
    source.buffer = buffer;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
    source.connect(gain);
    gain.connect(masterGain);
    source.start();
}

export const Sound = {
    move() {
        playTone(220, 0.06, 'sine', 0.08);
    },
    collectKey() {
        playTone(880, 0.08, 'sine', 0.25);
        setTimeout(() => playTone(1100, 0.12, 'sine', 0.2), 60);
        setTimeout(() => playTone(1320, 0.15, 'sine', 0.18), 120);
    },
    openDoor() {
        playTone(300, 0.15, 'square', 0.15);
        setTimeout(() => playTone(400, 0.15, 'square', 0.12), 100);
        setTimeout(() => playTone(500, 0.2, 'square', 0.1), 200);
    },
    collectTorch() {
        playNoise(0.15, 0.12);
        playTone(600, 0.2, 'sawtooth', 0.08);
    },
    collectPowerup() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((n, i) => {
            setTimeout(() => playTone(n, 0.15, 'sine', 0.2 - i * 0.03), i * 70);
        });
    },
    enemySpot() {
        playTone(150, 0.3, 'sawtooth', 0.2);
        playTone(100, 0.4, 'square', 0.15, -20);
    },
    hit() {
        playTone(80, 0.3, 'sawtooth', 0.3);
        playNoise(0.2, 0.2);
    },
    doorLocked() {
        playTone(200, 0.1, 'square', 0.15);
        setTimeout(() => playTone(150, 0.15, 'square', 0.12), 80);
    },
    levelComplete() {
        const melody = [523, 659, 784, 1047, 784, 1047, 1319];
        melody.forEach((n, i) => {
            setTimeout(() => playTone(n, 0.25, 'sine', 0.25 - i * 0.02), i * 120);
        });
    },
    gameOver() {
        const melody = [400, 350, 300, 200];
        melody.forEach((n, i) => {
            setTimeout(() => playTone(n, 0.3, 'sawtooth', 0.2), i * 200);
        });
    },
    tick() {
        playTone(1000, 0.03, 'sine', 0.05);
    },
    explore() {
        playTone(180, 0.05, 'sine', 0.04);
    },
};
