// ============================================================
// sound.js - Web Audio API 音效系统
// ============================================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.3;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }

    _osc(freq, type, duration, vol = 1, detune = 0) {
        if (!this.ctx || !this.enabled) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.detune.value = detune;
        gain.gain.setValueAtTime(this.volume * vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    }

    _noise(duration, vol = 1) {
        if (!this.ctx || !this.enabled) return;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.volume * vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
    }

    // 剑气 - 清脆的金属挥砍声
    swordWave() {
        this._osc(800, 'sawtooth', 0.12, 0.4);
        this._osc(600, 'square', 0.08, 0.3);
        setTimeout(() => this._osc(400, 'sawtooth', 0.06, 0.2), 30);
    }

    // 火球 - 低沉的轰鸣
    fireball() {
        this._osc(120, 'sawtooth', 0.3, 0.5);
        this._osc(80, 'square', 0.4, 0.3);
        this._noise(0.15, 0.2);
    }

    // 闪电 - 啪嗒电击声
    lightning() {
        this._noise(0.08, 0.6);
        this._osc(2000, 'square', 0.05, 0.4);
        setTimeout(() => this._noise(0.06, 0.4), 40);
        setTimeout(() => this._osc(1500, 'sawtooth', 0.04, 0.3), 60);
    }

    // 光环 - 持续的嗡嗡声
    aura() {
        this._osc(300, 'sine', 0.15, 0.15);
        this._osc(450, 'sine', 0.1, 0.1);
    }

    // 圣光 - 空灵的钟声
    holyLight() {
        this._osc(523, 'sine', 0.5, 0.3);
        this._osc(659, 'sine', 0.4, 0.2);
        this._osc(784, 'sine', 0.3, 0.15);
    }

    // 冰锥 - 清脆的碎冰声
    iceSpike() {
        this._osc(1200, 'sine', 0.15, 0.3);
        this._osc(1800, 'triangle', 0.1, 0.2);
        this._noise(0.05, 0.15);
    }

    // 毒雾 - 嘶嘶的气泡声
    poisonCloud() {
        this._osc(200, 'sawtooth', 0.4, 0.2);
        this._noise(0.3, 0.15);
    }

    // 飞刀 - 快速的嗖声
    throwingKnife() {
        this._osc(1000, 'sawtooth', 0.06, 0.3);
        this._osc(600, 'sine', 0.04, 0.2);
    }

    // 爆炸
    explosion() {
        this._noise(0.3, 0.5);
        this._osc(60, 'sawtooth', 0.4, 0.4);
        this._osc(40, 'square', 0.5, 0.3);
    }

    // 受伤
    hit() {
        this._osc(200, 'square', 0.1, 0.4);
        this._osc(150, 'sawtooth', 0.15, 0.3);
    }

    // 升级 - 上升的音阶
    levelUp() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this._osc(freq, 'sine', 0.25, 0.3), i * 80);
        });
    }

    // 拾取宝石
    pickup() {
        this._osc(800, 'sine', 0.08, 0.2);
        setTimeout(() => this._osc(1200, 'sine', 0.06, 0.15), 40);
    }

    // 敌人死亡
    enemyDeath() {
        this._osc(300, 'square', 0.1, 0.2);
        this._noise(0.08, 0.15);
    }

    // Boss出现
    bossAppear() {
        this._osc(80, 'sawtooth', 0.8, 0.5);
        this._osc(60, 'square', 1.0, 0.4);
        setTimeout(() => this._osc(100, 'sawtooth', 0.5, 0.3), 200);
    }

    // 游戏结束
    gameOver() {
        const notes = [523, 440, 349, 262];
        notes.forEach((freq, i) => {
            setTimeout(() => this._osc(freq, 'sine', 0.5, 0.3), i * 200);
        });
    }
}

export const sound = new SoundManager();
