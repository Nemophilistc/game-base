// ============================================================
// sound.js - Web Audio API 音效系统
// ============================================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    ensureContext() {
        if (!this.initialized) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 基础振荡器
    playTone(freq, duration, type = 'sine', volume = 0.15, delay = 0) {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, now);
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + duration);
    }

    // 噪音
    playNoise(duration, volume = 0.05, delay = 0) {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        const now = this.ctx.currentTime + delay;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(now);
    }

    // ---- 游戏音效 ----

    // 抽牌音效 - 轻快的滑动声
    drawCard() {
        this.playTone(800, 0.08, 'sine', 0.08);
        this.playTone(1200, 0.06, 'sine', 0.06, 0.04);
    }

    // 出牌音效 - 清脆的点击
    playCard() {
        this.playTone(600, 0.1, 'square', 0.06);
        this.playTone(900, 0.08, 'sine', 0.08, 0.05);
        this.playNoise(0.05, 0.03, 0.02);
    }

    // 攻击音效 - 有力的打击
    attack() {
        this.playNoise(0.12, 0.08);
        this.playTone(200, 0.15, 'sawtooth', 0.06, 0.02);
        this.playTone(100, 0.2, 'sine', 0.05, 0.08);
    }

    // 防御音效 - 沉稳的金属声
    defend() {
        this.playTone(400, 0.15, 'triangle', 0.08);
        this.playTone(500, 0.12, 'triangle', 0.06, 0.05);
        this.playNoise(0.08, 0.04, 0.03);
    }

    // 技能音效 - 魔法声
    skill() {
        this.playTone(500, 0.15, 'sine', 0.06);
        this.playTone(700, 0.15, 'sine', 0.06, 0.05);
        this.playTone(900, 0.15, 'sine', 0.06, 0.1);
        this.playTone(1100, 0.12, 'sine', 0.04, 0.15);
    }

    // 受伤音效 - 低沉的撞击
    hurt() {
        this.playTone(150, 0.2, 'sawtooth', 0.1);
        this.playNoise(0.15, 0.08, 0.05);
        this.playTone(80, 0.3, 'sine', 0.06, 0.1);
    }

    // 治疗音效 - 清新的铃声
    heal() {
        this.playTone(800, 0.15, 'sine', 0.06);
        this.playTone(1000, 0.15, 'sine', 0.06, 0.08);
        this.playTone(1200, 0.2, 'sine', 0.06, 0.16);
    }

    // 胜利音效 - 欢快的旋律
    victory() {
        const notes = [523, 659, 784, 1047]; // C E G C
        notes.forEach((freq, i) => {
            this.playTone(freq, 0.3, 'sine', 0.08, i * 0.15);
            this.playTone(freq * 2, 0.2, 'sine', 0.04, i * 0.15 + 0.05);
        });
    }

    // 失败音效 - 低沉的下降
    defeat() {
        this.playTone(400, 0.3, 'sawtooth', 0.08);
        this.playTone(300, 0.3, 'sawtooth', 0.08, 0.2);
        this.playTone(200, 0.4, 'sawtooth', 0.08, 0.4);
        this.playTone(100, 0.6, 'sine', 0.06, 0.6);
    }

    // 点击音效
    click() {
        this.playTone(1000, 0.05, 'sine', 0.06);
    }

    // 购买音效
    buy() {
        this.playTone(600, 0.1, 'sine', 0.06);
        this.playTone(800, 0.1, 'sine', 0.06, 0.08);
        this.playTone(1000, 0.15, 'sine', 0.06, 0.16);
    }

    // 升级音效
    upgrade() {
        this.playTone(400, 0.1, 'sine', 0.06);
        this.playTone(600, 0.1, 'sine', 0.06, 0.08);
        this.playTone(800, 0.1, 'sine', 0.06, 0.16);
        this.playTone(1000, 0.2, 'sine', 0.08, 0.24);
    }

    // 中毒音效
    poison() {
        this.playTone(200, 0.15, 'sawtooth', 0.04);
        this.playTone(180, 0.15, 'sawtooth', 0.04, 0.05);
        this.playNoise(0.1, 0.03, 0.02);
    }

    // 敌人出现音效
    enemyAppear() {
        this.playTone(300, 0.2, 'sawtooth', 0.05);
        this.playTone(250, 0.3, 'sawtooth', 0.05, 0.1);
    }

    // 回合开始音效
    turnStart() {
        this.playTone(500, 0.1, 'triangle', 0.05);
        this.playTone(700, 0.15, 'triangle', 0.05, 0.08);
    }

    // 能量不足音效
    noEnergy() {
        this.playTone(200, 0.15, 'square', 0.04);
        this.playTone(150, 0.2, 'square', 0.04, 0.1);
    }
}

export const sound = new SoundManager();
