// sound.js - Web Audio API 音效 + 程序化生成BGM
import { CONFIG } from './config.js';

export class SoundManager {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bgmGain = null;
    this.sfxGain = null;
    this.bgmPlaying = false;
    this.bgmScheduler = null;
    this.bgmStartTime = 0;
    this.bpm = 120;
    this.currentBeat = 0;
    this.nextBeatTime = 0;
    this.scheduleAheadTime = 0.1;
    this.lookahead = 25; // ms
  }

  init() {
    if (this.ctx) return;
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.7;
    this.masterGain.connect(this.ctx.destination);

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.value = 0.5;
    this.bgmGain.connect(this.masterGain);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 0.6;
    this.sfxGain.connect(this.masterGain);
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // === 合成打击音 ===
  playKick(time) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.12);
    gain.gain.setValueAtTime(0.8, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
    osc.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.3);
  }

  playSnare(time) {
    // 噪声层
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.value = 1000;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6, time);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.bgmGain);
    noise.start(time);
    noise.stop(time + 0.15);

    // 音调层
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);
    oscGain.gain.setValueAtTime(0.5, time);
    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
    osc.connect(oscGain);
    oscGain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + 0.08);
  }

  playHiHat(time, open = false) {
    const bufferSize = this.ctx.sampleRate * (open ? 0.15 : 0.05);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7000;
    const gain = this.ctx.createGain();
    const dur = open ? 0.15 : 0.05;
    gain.gain.setValueAtTime(open ? 0.25 : 0.2, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    noise.start(time);
    noise.stop(time + dur);
  }

  playBass(time, freq, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;
    gain.gain.setValueAtTime(0.2, time);
    gain.gain.setValueAtTime(0.2, time + dur * 0.7);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + dur);
  }

  playSynth(time, freq, dur) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000, time);
    filter.frequency.exponentialRampToValueAtTime(300, time + dur);
    gain.gain.setValueAtTime(0.12, time);
    gain.gain.setValueAtTime(0.12, time + dur * 0.6);
    gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.bgmGain);
    osc.start(time);
    osc.stop(time + dur);
  }

  // === BGM调度器 ===
  startBGM(bpm) {
    this.init();
    this.resume();
    this.bpm = bpm;
    this.bgmPlaying = true;
    this.currentBeat = 0;
    this.bgmStartTime = this.ctx.currentTime + 0.1;
    this.nextBeatTime = this.bgmStartTime;

    // 和弦进行 (bass notes in Hz)
    this.bassPattern = [
      65.41,  // C2
      65.41,
      73.42,  // D2
      73.42,
      82.41,  // E2
      82.41,
      73.42,  // D2
      73.42,
    ];

    // 合成旋律音符
    this.melodyNotes = [
      261.63, 329.63, 392.00, 523.25,
      440.00, 349.23, 293.66, 261.63,
      329.63, 392.00, 440.00, 523.25,
      587.33, 523.25, 392.00, 329.63,
    ];

    this._scheduleBGM();
  }

  _scheduleBGM() {
    if (!this.bgmPlaying) return;

    while (this.nextBeatTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this._scheduleBeat(this.nextBeatTime, this.currentBeat);

      const secondsPerBeat = 60.0 / this.bpm;
      // 有时用半拍细分
      const subdivision = (this.currentBeat % 2 === 0) ? 1 : 0.5;
      this.nextBeatTime += secondsPerBeat * subdivision;
      this.currentBeat++;
    }

    this.bgmScheduler = setTimeout(() => this._scheduleBGM(), this.lookahead);
  }

  _scheduleBeat(time, beat) {
    const bar = Math.floor(beat / 8) % 4;
    const pos = beat % 8;

    // Kick: beat 0, 4 (每小节)
    if (pos === 0 || pos === 4) {
      this.playKick(time);
    }

    // Snare: beat 2, 6
    if (pos === 2 || pos === 6) {
      this.playSnare(time);
    }

    // Hi-hat: every beat
    this.playHiHat(time, pos === 3 || pos === 7);

    // Bass: every 2 beats
    if (pos % 2 === 0) {
      const bassIdx = (bar * 2 + Math.floor(pos / 2)) % this.bassPattern.length;
      this.playBass(time, this.bassPattern[bassIdx], 60 / this.bpm * 1.8);
    }

    // Synth melody: some beats
    if (pos === 0 || pos === 3 || pos === 5) {
      const melIdx = (bar * 4 + Math.floor(pos / 2)) % this.melodyNotes.length;
      this.playSynth(time, this.melodyNotes[melIdx], 60 / this.bpm * 0.8);
    }
  }

  stopBGM() {
    this.bgmPlaying = false;
    if (this.bgmScheduler) {
      clearTimeout(this.bgmScheduler);
      this.bgmScheduler = null;
    }
  }

  getBGMTime() {
    if (!this.ctx || !this.bgmPlaying) return 0;
    return (this.ctx.currentTime - this.bgmStartTime) * 1000; // 返回毫秒
  }

  // === 判定音效 ===
  playJudgeSfx(type) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    switch (type) {
      case 'PERFECT':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.04);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.15);
        // 叠加泛音
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.value = 1320;
        gain2.gain.setValueAtTime(0.15, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc2.connect(gain2);
        gain2.connect(this.sfxGain);
        osc2.start(now);
        osc2.stop(now + 0.1);
        break;
      case 'GREAT':
        osc.type = 'sine';
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.12);
        break;
      case 'GOOD':
        osc.type = 'triangle';
        osc.frequency.value = 440;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.1);
        break;
      case 'MISS':
        osc.type = 'sawtooth';
        osc.frequency.value = 100;
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 300;
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.sfxGain);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  }

  playComboSfx(combo) {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const baseFreq = 400 + Math.min(combo, 100) * 5;

    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = baseFreq * (1 + i * 0.5);
      const t = now + i * 0.04;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  playMenuSfx() {
    if (!this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}
