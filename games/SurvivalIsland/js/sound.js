// ============================================================
// sound.js - Web Audio API sound effects
// ============================================================

let audioCtx = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.3, detune = 0) {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    if (detune) osc.detune.value = detune;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.15) {
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * volume;
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
    resume() {
        const ctx = getCtx();
        if (ctx.state === 'suspended') ctx.resume();
    },

    chop() {
        playTone(220, 0.1, 'sawtooth', 0.2);
        setTimeout(() => playTone(180, 0.08, 'sawtooth', 0.15), 60);
        playNoise(0.08, 0.1);
    },

    mine() {
        playTone(400, 0.08, 'square', 0.15);
        setTimeout(() => playTone(300, 0.06, 'square', 0.12), 50);
        playNoise(0.06, 0.08);
    },

    gather() {
        playTone(500, 0.1, 'sine', 0.15);
        setTimeout(() => playTone(600, 0.1, 'sine', 0.12), 80);
    },

    eat() {
        playTone(300, 0.08, 'sine', 0.2);
        setTimeout(() => playTone(350, 0.08, 'sine', 0.15), 100);
        setTimeout(() => playTone(400, 0.08, 'sine', 0.12), 200);
    },

    drink() {
        playTone(600, 0.15, 'sine', 0.15);
        setTimeout(() => playTone(500, 0.12, 'sine', 0.12), 100);
    },

    craft() {
        playTone(400, 0.1, 'triangle', 0.25);
        setTimeout(() => playTone(500, 0.1, 'triangle', 0.2), 100);
        setTimeout(() => playTone(600, 0.15, 'triangle', 0.25), 200);
    },

    build() {
        playTone(200, 0.15, 'square', 0.2);
        setTimeout(() => playTone(250, 0.12, 'square', 0.15), 100);
        setTimeout(() => playTone(300, 0.15, 'square', 0.2), 200);
        playNoise(0.2, 0.08);
    },

    wolfHowl() {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.8);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.8);
    },

    rain() {
        for (let i = 0; i < 3; i++) {
            setTimeout(() => playNoise(0.3, 0.04), i * 100);
        }
    },

    fire() {
        playNoise(0.15, 0.06);
        playTone(100 + Math.random() * 50, 0.1, 'sawtooth', 0.03);
    },

    hit() {
        playTone(150, 0.1, 'sawtooth', 0.25);
        playNoise(0.08, 0.15);
    },

    gameOver() {
        playTone(300, 0.3, 'sine', 0.3);
        setTimeout(() => playTone(250, 0.3, 'sine', 0.25), 300);
        setTimeout(() => playTone(200, 0.5, 'sine', 0.3), 600);
    },

    win() {
        const notes = [400, 500, 600, 800];
        notes.forEach((n, i) => {
            setTimeout(() => playTone(n, 0.2, 'triangle', 0.25), i * 150);
        });
    },

    pickup() {
        playTone(700, 0.08, 'sine', 0.15);
        setTimeout(() => playTone(900, 0.08, 'sine', 0.12), 60);
    },

    damage() {
        playTone(120, 0.15, 'sawtooth', 0.3);
        playNoise(0.1, 0.2);
    },
};
