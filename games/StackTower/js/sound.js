// sound.js - Web Audio API sound effects
const Sound = {
    ctx: null,
    init() {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    },
    play(type) {
        if (!this.ctx) return;
        const c = this.ctx, o = c.createOscillator(), g = c.createGain();
        o.connect(g);
        g.connect(c.destination);
        const t = c.currentTime;
        switch (type) {
            case 'drop':
                o.type = 'sine';
                o.frequency.setValueAtTime(400, t);
                o.frequency.exponentialRampToValueAtTime(200, t + 0.1);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t);
                o.stop(t + 0.1);
                break;
            case 'perfect':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t);
                o.frequency.setValueAtTime(800, t + 0.05);
                o.frequency.setValueAtTime(1000, t + 0.1);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                o.start(t);
                o.stop(t + 0.2);
                break;
            case 'gameover':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(300, t);
                o.frequency.exponentialRampToValueAtTime(50, t + 0.4);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                o.start(t);
                o.stop(t + 0.4);
                break;
        }
    }
};

export default Sound;
