// sound.js - Web Audio API sound effects

export class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.3;
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            this.enabled = false;
        }
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime + delay;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(volume * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
    }

    playNoise(duration, volume = 0.2, delay = 0) {
        if (!this.enabled || !this.ctx) return;
        const t = this.ctx.currentTime + delay;
        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume * this.masterVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 2000;
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        source.start(t);
    }

    diceRoll() {
        this.ensureContext();
        for (let i = 0; i < 10; i++) {
            this.playTone(300 + Math.random() * 500, 0.04, 'square', 0.12, i * 0.05);
            this.playNoise(0.03, 0.08, i * 0.05);
        }
    }

    diceStop() {
        this.ensureContext();
        this.playTone(800, 0.08, 'sine', 0.2);
        this.playNoise(0.05, 0.15);
    }

    battleWin() {
        this.ensureContext();
        this.playTone(523, 0.15, 'sine', 0.25, 0);
        this.playTone(659, 0.15, 'sine', 0.25, 0.1);
        this.playTone(784, 0.15, 'sine', 0.25, 0.2);
        this.playTone(1047, 0.35, 'sine', 0.3, 0.3);
    }

    battleLose() {
        this.ensureContext();
        this.playTone(400, 0.2, 'sawtooth', 0.12, 0);
        this.playTone(300, 0.25, 'sawtooth', 0.12, 0.15);
        this.playTone(200, 0.35, 'sawtooth', 0.1, 0.3);
    }

    capture() {
        this.ensureContext();
        this.playTone(880, 0.1, 'sine', 0.2, 0);
        this.playTone(1100, 0.12, 'sine', 0.25, 0.08);
        this.playTone(1320, 0.15, 'sine', 0.2, 0.16);
    }

    turnStart() {
        this.ensureContext();
        this.playTone(440, 0.1, 'sine', 0.15, 0);
        this.playTone(554, 0.12, 'sine', 0.15, 0.08);
    }

    gameWin() {
        this.ensureContext();
        const melody = [523, 659, 784, 659, 784, 1047];
        melody.forEach((freq, i) => {
            this.playTone(freq, 0.25, 'sine', 0.25, i * 0.18);
            this.playTone(freq * 0.5, 0.25, 'triangle', 0.1, i * 0.18);
        });
    }

    click() {
        this.ensureContext();
        this.playTone(600, 0.04, 'square', 0.1);
    }

    error() {
        this.ensureContext();
        this.playTone(200, 0.15, 'square', 0.12, 0);
        this.playTone(150, 0.2, 'square', 0.12, 0.1);
    }

    eliminate() {
        this.ensureContext();
        this.playTone(500, 0.15, 'sawtooth', 0.15, 0);
        this.playTone(400, 0.15, 'sawtooth', 0.12, 0.1);
        this.playTone(300, 0.15, 'sawtooth', 0.1, 0.2);
        this.playTone(200, 0.3, 'sawtooth', 0.08, 0.3);
    }
}
