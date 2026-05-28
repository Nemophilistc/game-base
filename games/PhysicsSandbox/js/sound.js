// ============================================================
// sound.js — Web Audio API 音效系统
// ============================================================

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

// 创建增益节点
function createGain(ctx, volume = 0.3) {
    const g = ctx.createGain();
    g.gain.value = volume;
    g.connect(ctx.destination);
    return g;
}

// 碰撞音效 — 根据强度变化
export function playCollision(impactSpeed) {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;
        const vol = Math.min(0.4, Math.max(0.02, impactSpeed / 1500));

        // 低频碰撞声
        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120 + impactSpeed * 0.1, t);
        osc.frequency.exponentialRampToValueAtTime(60, t + 0.15);

        const gain = createGain(ctx, vol);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.15);

        // 高频碰撞杂音
        const noise = ctx.createBufferSource();
        const buf = ctx.createBuffer(1, ctx.sampleRate * 0.06, ctx.sampleRate);
        const data = buf.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.3));
        }
        noise.buffer = buf;

        const ng = createGain(ctx, vol * 0.5);
        noise.connect(ng);
        noise.start(t);
    } catch (_) {}
}

// 放置音效 — 清脆短促
export function playPlace() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, t);
        osc.frequency.exponentialRampToValueAtTime(900, t + 0.08);

        const gain = createGain(ctx, 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.12);
    } catch (_) {}
}

// 删除音效 — 下降音调
export function playDelete() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.2);

        const gain = createGain(ctx, 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.25);
    } catch (_) {}
}

// 弹簧音效 — 弹性振动
export function playSpring() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.setValueAtTime(500, t + 0.05);
        osc.frequency.setValueAtTime(350, t + 0.1);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.3);

        const gain = createGain(ctx, 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.35);
    } catch (_) {}
}

// 发射音效 — 上升音调
export function playLaunch() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);

        const gain = createGain(ctx, 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.2);
    } catch (_) {}
}

// 连接音效
export function playConnect() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;

        [400, 600, 800].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;

            const gain = createGain(ctx, 0.1);
            gain.gain.setValueAtTime(0.1, t + i * 0.06);
            gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.06 + 0.15);

            osc.connect(gain);
            osc.start(t + i * 0.06);
            osc.stop(t + i * 0.06 + 0.15);
        });
    } catch (_) {}
}

// UI 点击音效
export function playClick() {
    try {
        const ctx = getCtx();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.value = 1000;

        const gain = createGain(ctx, 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(gain);
        osc.start(t);
        osc.stop(t + 0.04);
    } catch (_) {}
}
