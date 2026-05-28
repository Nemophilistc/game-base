// sound.js - Web Audio API sound effects

let audioCtx = null;
let masterGain = null;
let muted = false;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
  }
  return audioCtx;
}

function ensureResumed() {
  const ctx = getCtx();
  if (ctx.state === 'suspended') ctx.resume();
}

function playTone(freq, duration, type = 'sine', volume = 0.3, delay = 0) {
  if (muted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0;
  osc.connect(gain);
  gain.connect(masterGain);
  const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  osc.start(t);
  osc.stop(t + duration + 0.01);
}

function playNoise(duration, volume = 0.1, delay = 0) {
  if (muted) return;
  const ctx = getCtx();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  source.connect(gain);
  gain.connect(masterGain);
  const t = ctx.currentTime + delay;
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  source.start(t);
  source.stop(t + duration + 0.01);
}

export const Sound = {
  init() { ensureResumed(); },

  toggleMute() {
    muted = !muted;
    return muted;
  },

  isMuted() { return muted; },

  // Card draw - quick rising tone
  cardDraw() {
    ensureResumed();
    playTone(600, 0.08, 'sine', 0.2);
    playTone(900, 0.1, 'sine', 0.15, 0.04);
  },

  // Card play - satisfying thunk
  cardPlay() {
    ensureResumed();
    playTone(300, 0.06, 'square', 0.15);
    playTone(450, 0.12, 'sine', 0.2, 0.03);
    playNoise(0.05, 0.08, 0.02);
  },

  // Creature attack - aggressive swoosh
  creatureAttack() {
    ensureResumed();
    playTone(200, 0.15, 'sawtooth', 0.15);
    playTone(400, 0.1, 'square', 0.12, 0.05);
    playNoise(0.12, 0.15, 0.02);
  },

  // Spell cast - magical shimmer
  spellCast() {
    ensureResumed();
    playTone(800, 0.15, 'sine', 0.15);
    playTone(1000, 0.12, 'sine', 0.12, 0.05);
    playTone(1200, 0.1, 'sine', 0.1, 0.1);
    playTone(1600, 0.2, 'sine', 0.08, 0.15);
  },

  // Lightning - electric crackle
  lightning() {
    ensureResumed();
    playNoise(0.3, 0.2);
    playTone(100, 0.2, 'sawtooth', 0.15);
    playTone(2000, 0.1, 'square', 0.1, 0.1);
  },

  // Damage taken - impact thud
  damageTaken() {
    ensureResumed();
    playTone(120, 0.2, 'sine', 0.25);
    playTone(80, 0.3, 'sine', 0.2, 0.05);
    playNoise(0.1, 0.12, 0.03);
  },

  // Heal - gentle rising chime
  heal() {
    ensureResumed();
    playTone(500, 0.15, 'sine', 0.15);
    playTone(600, 0.15, 'sine', 0.15, 0.08);
    playTone(800, 0.2, 'sine', 0.12, 0.16);
    playTone(1000, 0.3, 'sine', 0.1, 0.24);
  },

  // Turn start - bell
  turnStart() {
    ensureResumed();
    playTone(800, 0.4, 'sine', 0.2);
    playTone(1200, 0.5, 'sine', 0.15, 0.05);
  },

  // Game win - triumphant fanfare
  gameWin() {
    ensureResumed();
    playTone(523, 0.2, 'sine', 0.2);
    playTone(659, 0.2, 'sine', 0.2, 0.15);
    playTone(784, 0.2, 'sine', 0.2, 0.3);
    playTone(1047, 0.6, 'sine', 0.25, 0.45);
  },

  // Game lose - descending sad tones
  gameLose() {
    ensureResumed();
    playTone(400, 0.3, 'sine', 0.2);
    playTone(350, 0.3, 'sine', 0.18, 0.2);
    playTone(300, 0.3, 'sine', 0.16, 0.4);
    playTone(250, 0.5, 'sine', 0.14, 0.6);
  },

  // Creature death
  creatureDeath() {
    ensureResumed();
    playTone(200, 0.15, 'square', 0.12);
    playTone(100, 0.3, 'sine', 0.15, 0.08);
    playNoise(0.15, 0.1, 0.05);
  },

  // Button click
  click() {
    ensureResumed();
    playTone(700, 0.06, 'sine', 0.12);
  },
};
