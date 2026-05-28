// Web Audio API 音效管理
export const Sound = {
    ctx: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    play(type) {
        if (!this.ctx) return;
        const c = this.ctx;
        const o = c.createOscillator();
        const g = c.createGain();
        o.connect(g);
        g.connect(c.destination);
        const t = c.currentTime;

        switch (type) {
            case 'hit':
                o.type = 'sine';
                o.frequency.setValueAtTime(500, t);
                o.frequency.exponentialRampToValueAtTime(800, t + 0.08);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t);
                o.stop(t + 0.1);
                break;
            case 'golden':
                o.type = 'sine';
                o.frequency.setValueAtTime(800, t);
                o.frequency.setValueAtTime(1000, t + 0.05);
                o.frequency.setValueAtTime(1200, t + 0.1);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                o.start(t);
                o.stop(t + 0.2);
                break;
            case 'bomb':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(200, t);
                o.frequency.exponentialRampToValueAtTime(50, t + 0.2);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                o.start(t);
                o.stop(t + 0.2);
                break;
            case 'combo':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t);
                o.frequency.setValueAtTime(900, t + 0.05);
                g.gain.setValueAtTime(0.08, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                o.start(t);
                o.stop(t + 0.12);
                break;
            case 'end':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(400, t);
                o.frequency.exponentialRampToValueAtTime(100, t + 0.5);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                o.start(t);
                o.stop(t + 0.5);
                break;
        }
    }
};
