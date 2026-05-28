// ============================================================
// sound.js - Web Audio API 音效系统
// ============================================================

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
            case 'pass':
                o.type = 'sine';
                o.frequency.value = 300;
                g.gain.setValueAtTime(0.04, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.start(t);
                o.stop(t + 0.05);
                break;
            case 'collect':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t);
                o.frequency.setValueAtTime(900, t + 0.05);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t);
                o.stop(t + 0.1);
                break;
            case 'crash':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(300, t);
                o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
                g.gain.setValueAtTime(0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                o.start(t);
                o.stop(t + 0.4);
                break;
        }
    }
};
