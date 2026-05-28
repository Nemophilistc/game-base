// js/sound.js - Web Audio API音效

export const Sound = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(type) {
        if (!this.ctx) return;
        const c = this.ctx, o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        const t = c.currentTime;
        switch (type) {
            case 'flip':
                o.type = 'sine'; o.frequency.value = 400;
                g.gain.setValueAtTime(0.06, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                o.start(t); o.stop(t + 0.08); break;
            case 'match':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t);
                o.frequency.setValueAtTime(800, t + 0.08);
                o.frequency.setValueAtTime(1000, t + 0.16);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
                o.start(t); o.stop(t + 0.25); break;
            case 'mismatch':
                o.type = 'square'; o.frequency.value = 200;
                g.gain.setValueAtTime(0.06, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t); o.stop(t + 0.15); break;
            case 'win':
                o.type = 'sine';
                o.frequency.setValueAtTime(500, t);
                o.frequency.setValueAtTime(700, t + 0.1);
                o.frequency.setValueAtTime(900, t + 0.2);
                o.frequency.setValueAtTime(1200, t + 0.3);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                o.start(t); o.stop(t + 0.5); break;
        }
    }
};
