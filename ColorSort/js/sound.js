export class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  play(type) {
    if (!this.enabled) return;
    this.init();
    const c = this.ctx;
    const now = c.currentTime;
    const g = c.createGain();
    g.connect(c.destination);
    const o = c.createOscillator();
    o.connect(g);
    switch(type) {
      case 'pour':
        o.type = 'sine';
        o.frequency.setValueAtTime(400, now);
        o.frequency.linearRampToValueAtTime(600, now + 0.15);
        g.gain.setValueAtTime(0.15, now);
        g.gain.linearRampToValueAtTime(0, now + 0.2);
        o.start(now); o.stop(now + 0.2);
        break;
      case 'select':
        o.type = 'sine';
        o.frequency.setValueAtTime(800, now);
        g.gain.setValueAtTime(0.1, now);
        g.gain.linearRampToValueAtTime(0, now + 0.1);
        o.start(now); o.stop(now + 0.1);
        break;
      case 'invalid':
        o.type = 'square';
        o.frequency.setValueAtTime(200, now);
        g.gain.setValueAtTime(0.08, now);
        g.gain.linearRampToValueAtTime(0, now + 0.15);
        o.start(now); o.stop(now + 0.15);
        break;
      case 'complete':
        o.type = 'sine';
        o.frequency.setValueAtTime(523, now);
        o.frequency.setValueAtTime(659, now + 0.1);
        o.frequency.setValueAtTime(784, now + 0.2);
        g.gain.setValueAtTime(0.15, now);
        g.gain.linearRampToValueAtTime(0, now + 0.4);
        o.start(now); o.stop(now + 0.4);
        break;
      case 'level':
        for (let i = 0; i < 5; i++) {
          const osc = c.createOscillator();
          const gn = c.createGain();
          osc.connect(gn); gn.connect(c.destination);
          osc.type = 'sine';
          osc.frequency.setValueAtTime(440 * Math.pow(2, i/4), now + i*0.1);
          gn.gain.setValueAtTime(0.1, now + i*0.1);
          gn.gain.linearRampToValueAtTime(0, now + i*0.1 + 0.2);
          osc.start(now + i*0.1); osc.stop(now + i*0.1 + 0.2);
        }
        return;
      case 'undo':
        o.type = 'triangle';
        o.frequency.setValueAtTime(600, now);
        o.frequency.linearRampToValueAtTime(300, now + 0.15);
        g.gain.setValueAtTime(0.1, now);
        g.gain.linearRampToValueAtTime(0, now + 0.15);
        o.start(now); o.stop(now + 0.15);
        break;
      default: return;
    }
  }
}
