// sound.js - Web Audio API 音效系统

let audioCtx = null;

function getCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

function playTone(freq, duration, type = 'sine', volume = 0.3) {
    try {
        const ctx = getCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) { /* 音频不可用 */ }
}

function playNoise(duration, volume = 0.15) {
    try {
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
        source.start(ctx.currentTime);
    } catch (e) { /* 音频不可用 */ }
}

export const Sound = {
    dice() {
        // 掷骰子：快速抖动音
        for (let i = 0; i < 6; i++) {
            setTimeout(() => playTone(200 + Math.random() * 400, 0.05, 'square', 0.15), i * 40);
        }
        setTimeout(() => playNoise(0.1, 0.2), 200);
    },

    buy() {
        // 买地：成功音效
        playTone(523, 0.12, 'sine', 0.3);
        setTimeout(() => playTone(659, 0.12, 'sine', 0.3), 100);
        setTimeout(() => playTone(784, 0.2, 'sine', 0.3), 200);
    },

    rent() {
        // 收租：收钱音效
        playTone(880, 0.08, 'square', 0.2);
        setTimeout(() => playTone(1100, 0.08, 'square', 0.2), 70);
        setTimeout(() => playTone(1320, 0.15, 'square', 0.2), 140);
    },

    bankrupt() {
        // 破产：低沉失败音
        playTone(300, 0.3, 'sawtooth', 0.3);
        setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.3), 250);
        setTimeout(() => playTone(100, 0.5, 'sawtooth', 0.3), 500);
    },

    card() {
        // 抽卡：翻牌音效
        playNoise(0.08, 0.15);
        setTimeout(() => playTone(600, 0.15, 'sine', 0.25), 80);
    },

    jail() {
        // 进监狱
        playTone(150, 0.2, 'sawtooth', 0.3);
        setTimeout(() => playTone(120, 0.3, 'sawtooth', 0.3), 200);
    },

    build() {
        // 建房
        playTone(440, 0.08, 'sine', 0.25);
        setTimeout(() => playTone(550, 0.08, 'sine', 0.25), 80);
        setTimeout(() => playTone(660, 0.08, 'sine', 0.25), 160);
        setTimeout(() => playTone(880, 0.15, 'sine', 0.25), 240);
    },

    click() {
        // UI点击
        playTone(800, 0.05, 'sine', 0.15);
    },

    move() {
        // 移动一步
        playTone(500, 0.04, 'sine', 0.1);
    },

    win() {
        // 胜利
        const notes = [523, 659, 784, 1047];
        notes.forEach((f, i) => {
            setTimeout(() => playTone(f, 0.3, 'sine', 0.3), i * 200);
        });
    }
};
