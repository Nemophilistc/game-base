// Web Audio API 音效模块
const Sound = {
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
            case 'reveal':
                o.type = 'sine';
                o.frequency.value = 300;
                g.gain.setValueAtTime(0.04, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.start(t);
                o.stop(t + 0.05);
                break;
            case 'flag':
                o.type = 'sine';
                o.frequency.value = 500;
                g.gain.setValueAtTime(0.06, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
                o.start(t);
                o.stop(t + 0.08);
                break;
            case 'boom':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(200, t);
                o.frequency.exponentialRampToValueAtTime(30, t + 0.4);
                g.gain.setValueAtTime(0.15, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
                o.start(t);
                o.stop(t + 0.4);
                break;
            case 'win':
                o.type = 'sine';
                o.frequency.setValueAtTime(500, t);
                o.frequency.setValueAtTime(700, t + 0.1);
                o.frequency.setValueAtTime(900, t + 0.2);
                o.frequency.setValueAtTime(1100, t + 0.3);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                o.start(t);
                o.stop(t + 0.5);
                break;
        }
    }
};

export default Sound;
