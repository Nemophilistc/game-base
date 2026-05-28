// Web Audio API 音效系统
export const Sound = {
    ctx: null,

    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
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
            case 'shoot':
                o.type = 'square';
                o.frequency.setValueAtTime(800, t);
                o.frequency.exponentialRampToValueAtTime(400, t + 0.06);
                g.gain.setValueAtTime(0.06, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                o.start(t);
                o.stop(t + 0.06);
                break;
            case 'hit':
                o.type = 'sine';
                o.frequency.setValueAtTime(500, t);
                o.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t);
                o.stop(t + 0.1);
                break;
            case 'die':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(300, t);
                o.frequency.exponentialRampToValueAtTime(50, t + 0.3);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                o.start(t);
                o.stop(t + 0.3);
                break;
            case 'powerup':
                o.type = 'sine';
                o.frequency.setValueAtTime(800, t);
                o.frequency.setValueAtTime(1000, t + 0.05);
                o.frequency.setValueAtTime(1200, t + 0.1);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t);
                o.stop(t + 0.15);
                break;
            case 'ufo':
                o.type = 'sine';
                o.frequency.setValueAtTime(300, t);
                o.frequency.setValueAtTime(500, t + 0.1);
                o.frequency.setValueAtTime(300, t + 0.2);
                g.gain.setValueAtTime(0.08, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                o.start(t);
                o.stop(t + 0.3);
                break;
        }
    }
};
