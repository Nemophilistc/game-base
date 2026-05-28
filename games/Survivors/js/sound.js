// ============================================================
// Web Audio API 音效系统
// ============================================================

export const Sound = {
    ctx: null,
    muted: false,
    volume: 0.3,

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API 不可用');
        }
    },

    ensureCtx() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    },

    // 通用音效播放
    play(type) {
        if (this.muted) return;
        const ctx = this.ensureCtx();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;
        gain.gain.setValueAtTime(this.volume * 0.5, now);

        switch (type) {
            case 'hit':
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;

            case 'kill':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
                break;

            case 'levelup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(523, now);
                osc.frequency.setValueAtTime(659, now + 0.1);
                osc.frequency.setValueAtTime(784, now + 0.2);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
                osc.start(now);
                osc.stop(now + 0.4);
                break;

            case 'exp':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                gain.gain.setValueAtTime(this.volume * 0.2, now);
                osc.start(now);
                osc.stop(now + 0.05);
                break;

            case 'damage':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            case 'fire':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
                break;

            default:
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
                break;
        }
    },

    toggle() {
        this.muted = !this.muted;
        return !this.muted;
    }
};
