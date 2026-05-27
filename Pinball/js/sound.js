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
            case 'bounce':
                o.type = 'sine'; o.frequency.value = 400;
                g.gain.setValueAtTime(0.08, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.start(t); o.stop(t + 0.05);
                break;
            case 'flipper':
                o.type = 'sine'; o.frequency.value = 600;
                g.gain.setValueAtTime(0.06, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
                o.start(t); o.stop(t + 0.04);
                break;
            case 'target':
                o.type = 'sine';
                o.frequency.setValueAtTime(800, t);
                o.frequency.setValueAtTime(1000, t + 0.05);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t); o.stop(t + 0.1);
                break;
            case 'die':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(200, t);
                o.frequency.exponentialRampToValueAtTime(50, t + 0.3);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                o.start(t); o.stop(t + 0.3);
                break;
        }
    }
};
