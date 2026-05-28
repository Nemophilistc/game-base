// sound.js - Web Audio API sound system
let audioCtx = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function resumeAudio() {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
}

function playTone(freq, duration, type = 'square', volume = 0.15, ramp = true) {
    resumeAudio();
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    if (ramp) {
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    }
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
}

function playNoise(duration, volume = 0.1) {
    resumeAudio();
    const ctx = getCtx();
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufferSize);
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
}

export const Sound = {
    jump() {
        playTone(300, 0.12, 'square', 0.1);
        setTimeout(() => playTone(450, 0.1, 'square', 0.08), 40);
    },

    land() {
        playNoise(0.06, 0.08);
    },

    collectGold() {
        playTone(880, 0.08, 'square', 0.1);
        setTimeout(() => playTone(1100, 0.12, 'square', 0.1), 60);
    },

    collectGem() {
        playTone(660, 0.08, 'square', 0.1);
        setTimeout(() => playTone(880, 0.08, 'square', 0.1), 50);
        setTimeout(() => playTone(1320, 0.15, 'square', 0.1), 100);
    },

    collectKey() {
        playTone(523, 0.1, 'triangle', 0.12);
        setTimeout(() => playTone(659, 0.1, 'triangle', 0.12), 100);
        setTimeout(() => playTone(784, 0.15, 'triangle', 0.12), 200);
        setTimeout(() => playTone(1047, 0.2, 'triangle', 0.12), 300);
    },

    collectItem() {
        playTone(600, 0.1, 'square', 0.08);
        setTimeout(() => playTone(800, 0.12, 'square', 0.08), 60);
    },

    bombExplode() {
        playNoise(0.5, 0.3);
        playTone(80, 0.4, 'sawtooth', 0.2);
        setTimeout(() => playTone(50, 0.3, 'sawtooth', 0.15), 50);
    },

    ropeThrow() {
        playTone(200, 0.1, 'sawtooth', 0.06);
        setTimeout(() => playTone(160, 0.15, 'sawtooth', 0.04), 50);
    },

    ropeExtend() {
        playTone(120, 0.05, 'triangle', 0.04);
    },

    enemyDie() {
        playTone(400, 0.08, 'square', 0.1);
        setTimeout(() => playTone(200, 0.15, 'square', 0.08), 40);
    },

    playerHurt() {
        playTone(200, 0.15, 'sawtooth', 0.15);
        setTimeout(() => playTone(120, 0.2, 'sawtooth', 0.12), 60);
    },

    doorOpen() {
        playTone(330, 0.15, 'triangle', 0.1);
        setTimeout(() => playTone(440, 0.15, 'triangle', 0.1), 100);
        setTimeout(() => playTone(660, 0.2, 'triangle', 0.12), 200);
    },

    shopBuy() {
        playTone(523, 0.1, 'square', 0.08);
        setTimeout(() => playTone(659, 0.1, 'square', 0.08), 80);
        setTimeout(() => playTone(784, 0.15, 'square', 0.1), 160);
    },

    shopDeny() {
        playTone(200, 0.2, 'square', 0.1);
        setTimeout(() => playTone(150, 0.3, 'square', 0.1), 150);
    },

    whip() {
        playNoise(0.08, 0.1);
        playTone(800, 0.06, 'sawtooth', 0.06);
    },

    death() {
        playTone(400, 0.15, 'sawtooth', 0.15);
        setTimeout(() => playTone(300, 0.15, 'sawtooth', 0.12), 120);
        setTimeout(() => playTone(200, 0.2, 'sawtooth', 0.1), 240);
        setTimeout(() => playTone(100, 0.4, 'sawtooth', 0.08), 360);
    },

    levelComplete() {
        const notes = [523, 659, 784, 1047, 784, 1047];
        notes.forEach((f, i) => {
            setTimeout(() => playTone(f, 0.15, 'triangle', 0.1), i * 100);
        });
    },

    arrowShoot() {
        playTone(300, 0.05, 'sawtooth', 0.1);
        setTimeout(() => playTone(600, 0.1, 'sawtooth', 0.08), 30);
    },

    spikeHit() {
        playNoise(0.15, 0.15);
        playTone(100, 0.2, 'sawtooth', 0.1);
    },

    tick() {
        playTone(1000, 0.03, 'square', 0.03);
    },
};
