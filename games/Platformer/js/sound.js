// sound.js - Web Audio API sound effects
let ctx = null;
let muted = false;

function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
}

function osc(freq, type, dur, vol = 0.15, delay = 0) {
    if (muted) return;
    const c = getCtx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + delay);
    o.stop(c.currentTime + delay + dur + 0.05);
}

function noise(dur, vol = 0.1, delay = 0) {
    if (muted) return;
    const c = getCtx();
    const bufSize = c.sampleRate * dur;
    const buf = c.createBuffer(1, bufSize, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const s = c.createBufferSource();
    s.buffer = buf;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    s.connect(g).connect(c.destination);
    s.start(c.currentTime + delay);
    s.stop(c.currentTime + delay + dur + 0.05);
}

export const Sound = {
    toggleMute() { muted = !muted; return muted; },
    jump() {
        osc(300, 'square', 0.1, 0.1);
        osc(450, 'square', 0.08, 0.08, 0.03);
    },
    wallJump() {
        osc(350, 'square', 0.08, 0.1);
        osc(500, 'square', 0.1, 0.08, 0.02);
        noise(0.05, 0.06);
    },
    land() {
        noise(0.08, 0.12);
        osc(80, 'sine', 0.1, 0.08);
    },
    dash() {
        noise(0.15, 0.1);
        osc(200, 'sawtooth', 0.12, 0.06);
    },
    coin() {
        osc(880, 'square', 0.06, 0.08);
        osc(1100, 'square', 0.1, 0.08, 0.06);
    },
    star() {
        osc(523, 'square', 0.1, 0.1);
        osc(659, 'square', 0.1, 0.1, 0.1);
        osc(784, 'square', 0.15, 0.1, 0.2);
    },
    key() {
        osc(600, 'triangle', 0.08, 0.1);
        osc(900, 'triangle', 0.12, 0.1, 0.08);
    },
    door() {
        osc(200, 'square', 0.15, 0.08);
        osc(150, 'square', 0.2, 0.06, 0.1);
        noise(0.3, 0.05, 0.05);
    },
    die() {
        osc(400, 'sawtooth', 0.1, 0.1);
        osc(300, 'sawtooth', 0.1, 0.1, 0.1);
        osc(200, 'sawtooth', 0.15, 0.1, 0.2);
        osc(100, 'sawtooth', 0.2, 0.08, 0.35);
    },
    win() {
        osc(523, 'square', 0.12, 0.1);
        osc(659, 'square', 0.12, 0.1, 0.12);
        osc(784, 'square', 0.12, 0.1, 0.24);
        osc(1047, 'square', 0.3, 0.12, 0.36);
    },
    click() { osc(600, 'sine', 0.05, 0.08); },
};
