// Web Audio API 音效系统
class SoundManager {
  constructor() {
    this.audioContext = null;
    this.initialized = false;
  }

  // 初始化音频上下文（需要用户交互后调用）
  init() {
    if (this.initialized) return;

    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio API 不支持:', e);
    }
  }

  // 播放点击音效
  playClick() {
    this.playTone(600, 0.05, 'sine', 0.3);
  }

  // 播放购买音效
  playBuy() {
    this.playTone(400, 0.1, 'sine', 0.2);
    setTimeout(() => this.playTone(500, 0.1, 'sine', 0.2), 50);
    setTimeout(() => this.playTone(600, 0.1, 'sine', 0.2), 100);
  }

  // 播放升级音效
  playUpgrade() {
    this.playTone(300, 0.15, 'sine', 0.3);
    setTimeout(() => this.playTone(400, 0.15, 'sine', 0.3), 80);
    setTimeout(() => this.playTone(500, 0.15, 'sine', 0.3), 160);
    setTimeout(() => this.playTone(600, 0.2, 'sine', 0.3), 240);
  }

  // 播放成就音效
  playAchievement() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'sine', 0.3), i * 100);
    });
  }

  // 播放错误音效
  playError() {
    this.playTone(200, 0.2, 'square', 0.2);
  }

  // 基础音调生成
  playTone(frequency, duration, type = 'sine', volume = 0.3) {
    if (!this.initialized || !this.audioContext) return;

    // 如果上下文被挂起，尝试恢复
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // 音量包络
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }
}

// 导出单例
export const sound = new SoundManager();
