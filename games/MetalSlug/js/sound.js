// ============================================
// MetalSlug 音效系统 - Web Audio API
// ============================================

class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.volume = 0.5;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    ensureContext() {
        if (!this.ctx) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(frequency, duration, type = 'square', volume = 0.3, decay = true) {
        if (!this.enabled || !this.ctx) return;
        this.ensureContext();

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

        const vol = volume * this.volume;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);

        if (decay) {
            gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        }

        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }

    playNoise(duration, volume = 0.3) {
        if (!this.enabled || !this.ctx) return;
        this.ensureContext();

        const bufferSize = this.ctx.sampleRate * duration;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = this.ctx.createBufferSource();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        noise.buffer = buffer;
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(3000, this.ctx.currentTime);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        gain.gain.setValueAtTime(volume * this.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

        noise.start();
        noise.stop(this.ctx.currentTime + duration);
    }

    pistol() {
        this.playTone(800, 0.08, 'square', 0.25);
        this.playNoise(0.05, 0.2);
    }

    machinegun() {
        this.playTone(600, 0.06, 'sawtooth', 0.2);
        this.playNoise(0.04, 0.15);
    }

    shotgun() {
        this.playNoise(0.15, 0.4);
        this.playTone(200, 0.1, 'sawtooth', 0.3);
    }

    rocket() {
        this.playTone(150, 0.3, 'sawtooth', 0.35);
        this.playNoise(0.2, 0.3);
    }

    laser() {
        this.playTone(1200, 0.1, 'sine', 0.2);
        this.playTone(1800, 0.08, 'sine', 0.15);
    }

    explosion() {
        this.playNoise(0.5, 0.5);
        this.playTone(80, 0.4, 'sawtooth', 0.4);
        this.playTone(40, 0.6, 'sine', 0.3);
    }

    bigExplosion() {
        this.playNoise(0.8, 0.6);
        this.playTone(60, 0.6, 'sawtooth', 0.5);
        this.playTone(30, 0.8, 'sine', 0.4);
    }

    jump() {
        this.playTone(300, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(500, 0.1, 'sine', 0.15), 50);
    }

    hurt() {
        this.playTone(200, 0.15, 'sawtooth', 0.3);
        this.playTone(150, 0.1, 'square', 0.2);
    }

    pickup() {
        this.playTone(600, 0.08, 'sine', 0.2);
        setTimeout(() => this.playTone(800, 0.08, 'sine', 0.2), 60);
        setTimeout(() => this.playTone(1000, 0.1, 'sine', 0.2), 120);
    }

    death() {
        this.playTone(400, 0.2, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(300, 0.2, 'sawtooth', 0.3), 100);
        setTimeout(() => this.playTone(200, 0.3, 'sawtooth', 0.3), 200);
        setTimeout(() => this.playTone(100, 0.5, 'sawtooth', 0.3), 300);
    }

    bossAppear() {
        this.playTone(100, 0.3, 'sawtooth', 0.4);
        setTimeout(() => this.playTone(120, 0.3, 'sawtooth', 0.4), 200);
        setTimeout(() => this.playTone(80, 0.5, 'sawtooth', 0.5), 400);
        setTimeout(() => this.playTone(60, 0.8, 'sawtooth', 0.4), 600);
    }

    grenade() {
        this.playTone(250, 0.15, 'sine', 0.25);
        setTimeout(() => this.playNoise(0.6, 0.5), 300);
        setTimeout(() => this.playTone(60, 0.5, 'sawtooth', 0.4), 300);
    }

    vehicleEnter() {
        this.playTone(200, 0.2, 'sawtooth', 0.3);
        setTimeout(() => this.playTone(300, 0.15, 'sawtooth', 0.25), 100);
        setTimeout(() => this.playTone(400, 0.1, 'sawtooth', 0.2), 200);
    }

    play(soundName) {
        if (!this.enabled) return;
        this.ensureContext();

        switch (soundName) {
            case 'pistol': this.pistol(); break;
            case 'machinegun': this.machinegun(); break;
            case 'shotgun': this.shotgun(); break;
            case 'rocket': this.rocket(); break;
            case 'laser': this.laser(); break;
            case 'explosion': this.explosion(); break;
            case 'bigExplosion': this.bigExplosion(); break;
            case 'jump': this.jump(); break;
            case 'hurt': this.hurt(); break;
            case 'pickup': this.pickup(); break;
            case 'death': this.death(); break;
            case 'bossAppear': this.bossAppear(); break;
            case 'grenade': this.grenade(); break;
            case 'vehicleEnter': this.vehicleEnter(); break;
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    setVolume(v) {
        this.volume = Math.max(0, Math.min(1, v));
    }
}

export const soundManager = new SoundManager();
