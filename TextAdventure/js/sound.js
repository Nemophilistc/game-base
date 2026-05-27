// sound.js - Web Audio API 音效系统
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume = 0.3;
    this._init();
  }

  _init() {
    // 在用户交互后初始化 AudioContext
    const initCtx = () => {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      document.removeEventListener('click', initCtx);
      document.removeEventListener('keydown', initCtx);
    };
    document.addEventListener('click', initCtx);
    document.addEventListener('keydown', initCtx);
  }

  _createOscillator(type, frequency, duration, volume = this.volume) {
    if (!this.enabled || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  _createNoise(duration, volume = this.volume * 0.5) {
    if (!this.enabled || !this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    source.connect(gain);
    gain.connect(this.ctx.destination);
    source.start();
  }

  // 点击音效 - 清脆短促
  click() {
    this._createOscillator('sine', 800, 0.08, this.volume * 0.4);
    setTimeout(() => this._createOscillator('sine', 1200, 0.05, this.volume * 0.3), 30);
  }

  // 战斗音效 - 金属碰撞感
  combat() {
    this._createNoise(0.1, this.volume * 0.4);
    this._createOscillator('sawtooth', 200, 0.15, this.volume * 0.3);
    setTimeout(() => {
      this._createOscillator('square', 150, 0.1, this.volume * 0.2);
      this._createNoise(0.08, this.volume * 0.3);
    }, 80);
  }

  // 获得物品音效 - 上升音阶
  item() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this._createOscillator('sine', freq, 0.2, this.volume * 0.3), i * 80);
    });
  }

  // 死亡音效 - 下降阴沉
  death() {
    const notes = [400, 350, 300, 200, 150];
    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._createOscillator('sawtooth', freq, 0.4, this.volume * 0.25);
      }, i * 200);
    });
    setTimeout(() => this._createNoise(0.8, this.volume * 0.2), 600);
  }

  // 胜利音效 - 欢快上升
  victory() {
    const melody = [523, 659, 784, 1047, 784, 1047, 1319];
    melody.forEach((freq, i) => {
      setTimeout(() => this._createOscillator('sine', freq, 0.25, this.volume * 0.35), i * 120);
    });
  }

  // 恐怖氛围音效
  horror() {
    this._createOscillator('sine', 80, 1.5, this.volume * 0.15);
    setTimeout(() => this._createOscillator('sine', 85, 1.0, this.volume * 0.1), 500);
    this._createNoise(0.3, this.volume * 0.08);
  }

  // 打字音效 - 轻微键盘声
  type() {
    if (!this.enabled || !this.ctx) return;
    const freq = 400 + Math.random() * 200;
    this._createOscillator('sine', freq, 0.02, this.volume * 0.08);
  }

  // 切换音效
  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const sound = new SoundManager();
