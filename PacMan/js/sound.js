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
            case 'eat':
                o.type = 'sine'; o.frequency.value = 400;
                g.gain.setValueAtTime(0.05, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
                o.start(t); o.stop(t + 0.04); break;
            case 'power':
                o.type = 'sine';
                o.frequency.setValueAtTime(300, t); o.frequency.setValueAtTime(600, t + 0.1); o.frequency.setValueAtTime(900, t + 0.2);
                g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                o.start(t); o.stop(t + 0.3); break;
            case 'ghost':
                o.type = 'sine';
                o.frequency.setValueAtTime(800, t); o.frequency.exponentialRampToValueAtTime(200, t + 0.15);
                g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                o.start(t); o.stop(t + 0.15); break;
            case 'die':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(400, t); o.frequency.exponentialRampToValueAtTime(50, t + 0.5);
                g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                o.start(t); o.stop(t + 0.5); break;
        }
    }
};
