// Web Audio API 音效模块
export const Sound = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(type) {
        if (!this.ctx) return;
        const c = this.ctx, o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination); const t = c.currentTime;
        switch (type) {
            case 'place':
                o.type = 'sine'; o.frequency.value = 500;
                g.gain.setValueAtTime(0.06, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
                o.start(t); o.stop(t + 0.06); break;
            case 'error':
                o.type = 'square'; o.frequency.value = 200;
                g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
                o.start(t); o.stop(t + 0.12); break;
            case 'hint':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t); o.frequency.setValueAtTime(800, t + 0.05);
                g.gain.setValueAtTime(0.08, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t); o.stop(t + 0.1); break;
            case 'win':
                o.type = 'sine';
                o.frequency.setValueAtTime(500, t); o.frequency.setValueAtTime(700, t + 0.1);
                o.frequency.setValueAtTime(900, t + 0.2); o.frequency.setValueAtTime(1200, t + 0.3);
                g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                o.start(t); o.stop(t + 0.5); break;
        }
    }
};
