// effects.js - Card animations, attack effects, damage numbers

const animations = [];
const particles = [];
const damageNumbers = [];

// --- Animation system ---

export function addAnimation(anim) {
  anim.progress = 0;
  anim.done = false;
  animations.push(anim);
  return anim;
}

export function isAnimating() {
  return animations.some(a => !a.done) || damageNumbers.length > 0 || particles.length > 20;
}

export function updateAnimations(dt) {
  // Update animations
  for (let i = animations.length - 1; i >= 0; i--) {
    const a = animations[i];
    a.progress += dt * (a.speed || 2.5);
    if (a.progress >= 1) {
      a.progress = 1;
      a.done = true;
      if (a.onComplete) a.onComplete();
      animations.splice(i, 1);
    } else if (a.onUpdate) {
      a.onUpdate(a.progress);
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += (p.gravity || 0) * dt;
    p.alpha = Math.max(0, p.life / p.maxLife);
  }

  // Update damage numbers
  for (let i = damageNumbers.length - 1; i >= 0; i--) {
    const d = damageNumbers[i];
    d.life -= dt;
    if (d.life <= 0) {
      damageNumbers.splice(i, 1);
      continue;
    }
    d.y -= 40 * dt;
    d.alpha = Math.max(0, d.life / d.maxLife);
    d.scale = 1 + (1 - d.life / d.maxLife) * 0.3;
  }
}

// Easing functions
export function easeOutBack(t) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function easeOutBounce(t) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (t < 1 / d1) return n1 * t * t;
  if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
  if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
  return n1 * (t -= 2.625 / d1) * t + 0.984375;
}

export function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

// --- Particles ---

export function spawnParticles(x, y, count, color, opts = {}) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (opts.speed || 80) * (0.5 + Math.random() * 0.5);
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: (opts.life || 0.6) * (0.5 + Math.random() * 0.5),
      maxLife: opts.life || 0.6,
      color,
      size: (opts.size || 3) * (0.5 + Math.random()),
      alpha: 1,
      gravity: opts.gravity || 100,
    });
  }
}

export function spawnAttackParticles(x, y) {
  spawnParticles(x, y, 12, '#ff4444', { speed: 120, life: 0.4, size: 3, gravity: 200 });
  spawnParticles(x, y, 8, '#ffaa00', { speed: 80, life: 0.3, size: 2, gravity: 150 });
}

export function spawnSpellParticles(x, y, color) {
  spawnParticles(x, y, 20, color, { speed: 100, life: 0.5, size: 4, gravity: -50 });
  spawnParticles(x, y, 10, '#ffffff', { speed: 60, life: 0.4, size: 2, gravity: -30 });
}

export function spawnHealParticles(x, y) {
  spawnParticles(x, y, 15, '#44ff88', { speed: 60, life: 0.8, size: 3, gravity: -80 });
  spawnParticles(x, y, 10, '#88ffaa', { speed: 40, life: 1, size: 2, gravity: -100 });
}

export function spawnDeathParticles(x, y) {
  spawnParticles(x, y, 25, '#666666', { speed: 100, life: 0.6, size: 4, gravity: 200 });
  spawnParticles(x, y, 15, '#333333', { speed: 60, life: 0.8, size: 3, gravity: 150 });
}

// --- Damage Numbers ---

export function addDamageNumber(x, y, amount, color = '#ff4444') {
  damageNumbers.push({
    x, y,
    text: `-${amount}`,
    color,
    life: 1,
    maxLife: 1,
    alpha: 1,
    scale: 1,
  });
}

export function addHealNumber(x, y, amount) {
  damageNumbers.push({
    x, y,
    text: `+${amount}`,
    color: '#44ff88',
    life: 1.2,
    maxLife: 1.2,
    alpha: 1,
    scale: 1,
  });
}

export function addBuffNumber(x, y, text) {
  damageNumbers.push({
    x, y,
    text,
    color: '#ffaa44',
    life: 1,
    maxLife: 1,
    alpha: 1,
    scale: 1,
  });
}

// --- Rendering ---

export function renderEffects(ctx) {
  // Render particles
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Render damage numbers
  for (const d of damageNumbers) {
    ctx.save();
    ctx.globalAlpha = d.alpha;
    ctx.font = `bold ${Math.round(22 * d.scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(d.text, d.x + 1, d.y + 1);
    ctx.fillStyle = d.color;
    ctx.fillText(d.text, d.x, d.y);
    ctx.restore();
  }
}

export function clearEffects() {
  animations.length = 0;
  particles.length = 0;
  damageNumbers.length = 0;
}
