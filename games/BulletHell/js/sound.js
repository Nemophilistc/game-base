import { CONFIG } from './config.js';

// ============================================================
// 音效系统
// ============================================================
export const Sound = {
    ctx: null,
    muted: false,
    game: null, // 注入game对象

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterGain = this.ctx.createGain();
        this.masterGain.connect(this.ctx.destination);
    },

    play(type) {
        if (this.muted || !this.ctx) return;
        const c = this.ctx, g = c.createGain(), o = c.createOscillator();
        g.connect(this.masterGain); o.connect(g);
        const t = c.currentTime;
        switch (type) {
            case 'shoot':
                o.type = 'square';
                o.frequency.setValueAtTime(800, t);
                o.frequency.exponentialRampToValueAtTime(400, t + 0.05);
                g.gain.setValueAtTime(0.08, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.start(t); o.stop(t + 0.05); break;
            case 'explosion':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(150, t);
                o.frequency.exponentialRampToValueAtTime(30, t + 0.3);
                g.gain.setValueAtTime(0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                o.start(t); o.stop(t + 0.3); break;
            case 'hit':
                o.type = 'square';
                o.frequency.setValueAtTime(300, t);
                o.frequency.exponentialRampToValueAtTime(100, t + 0.1);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t); o.stop(t + 0.1); break;
            case 'pickup':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t);
                o.frequency.exponentialRampToValueAtTime(1200, t + 0.1);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t); o.stop(t + 0.15); break;
            case 'levelup':
                o.type = 'sine';
                o.frequency.setValueAtTime(400, t);
                o.frequency.setValueAtTime(600, t + 0.1);
                o.frequency.setValueAtTime(800, t + 0.2);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                o.start(t); o.stop(t + 0.4); break;
            case 'dash':
                o.type = 'sine';
                o.frequency.setValueAtTime(1200, t);
                o.frequency.exponentialRampToValueAtTime(600, t + 0.15);
                g.gain.setValueAtTime(0.08, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t); o.stop(t + 0.15); break;
            case 'boss':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(80, t);
                o.frequency.setValueAtTime(100, t + 0.2);
                o.frequency.setValueAtTime(60, t + 0.4);
                g.gain.setValueAtTime(0.2, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
                o.start(t); o.stop(t + 0.8); break;
            case 'combo':
                o.type = 'sine';
                o.frequency.setValueAtTime(500 + (this.game ? Math.min(this.game.combo, 20) * 30 : 0), t);
                g.gain.setValueAtTime(0.08, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t); o.stop(t + 0.1); break;
            case 'pause':
                o.type = 'sine';
                o.frequency.setValueAtTime(300, t);
                g.gain.setValueAtTime(0.05, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t); o.stop(t + 0.1); break;
        }
    },

    toggle() {
        this.muted = !this.muted;
        if (this.masterGain) this.masterGain.gain.value = this.muted ? 0 : 1;
        document.getElementById('muteBtn').textContent = this.muted ? '🔇' : '🔊';
    }
};
