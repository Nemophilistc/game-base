// Web Audio API 音效模块
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
            case 'move':
                o.type = 'sine';
                o.frequency.value = 200;
                g.gain.setValueAtTime(0.04, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
                o.start(t); o.stop(t + 0.03);
                break;
            case 'rotate':
                o.type = 'sine';
                o.frequency.value = 400;
                g.gain.setValueAtTime(0.06, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
                o.start(t); o.stop(t + 0.05);
                break;
            case 'drop':
                o.type = 'square';
                o.frequency.setValueAtTime(150, t);
                o.frequency.exponentialRampToValueAtTime(80, t + 0.1);
                g.gain.setValueAtTime(0.08, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                o.start(t); o.stop(t + 0.1);
                break;
            case 'clear':
                o.type = 'sine';
                o.frequency.setValueAtTime(500, t);
                o.frequency.setValueAtTime(700, t + 0.05);
                o.frequency.setValueAtTime(1000, t + 0.1);
                g.gain.setValueAtTime(0.1, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
                o.start(t); o.stop(t + 0.2);
                break;
            case 'tetris':
                o.type = 'sine';
                o.frequency.setValueAtTime(600, t);
                o.frequency.setValueAtTime(800, t + 0.05);
                o.frequency.setValueAtTime(1000, t + 0.1);
                o.frequency.setValueAtTime(1200, t + 0.15);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
                o.start(t); o.stop(t + 0.3);
                break;
            case 'gameover':
                o.type = 'sawtooth';
                o.frequency.setValueAtTime(300, t);
                o.frequency.exponentialRampToValueAtTime(50, t + 0.5);
                g.gain.setValueAtTime(0.12, t);
                g.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
                o.start(t); o.stop(t + 0.5);
                break;
        }
    }
};
