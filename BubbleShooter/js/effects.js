// effects.js - Particle effects for pops and falling bubbles
import { BUBBLE_RADIUS, SPECIAL_BOMB, SPECIAL_RAINBOW } from './config.js';

export function createPopParticles(x, y, color, count = 12) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 3 + Math.random() * 4,
      color,
      life: 1,
      decay: 0.02 + Math.random() * 0.02,
      type: 'circle',
    });
  }
  return particles;
}

export function createBombParticles(x, y, count = 30) {
  const particles = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 8;
    const colors = ['#FF4400', '#FF8800', '#FFCC00', '#FFFFFF'];
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 1,
      decay: 0.015 + Math.random() * 0.015,
      type: 'fire',
    });
  }
  return particles;
}

export function createRainbowParticles(x, y, count = 16) {
  const particles = [];
  const rainbowColors = ['#FF0000', '#FF8800', '#FFFF00', '#00FF00', '#0088FF', '#8800FF'];
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    const speed = 3 + Math.random() * 3;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4 + Math.random() * 3,
      color: rainbowColors[i % rainbowColors.length],
      life: 1,
      decay: 0.02,
      type: 'star',
    });
  }
  return particles;
}

export function updateParticles(particles, dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt * 60;
    p.y += p.vy * dt * 60;
    p.vy += 0.1 * dt * 60; // gravity
    p.life -= p.decay * dt * 60;
    if (p.type === 'fire') {
      p.radius *= 0.98;
    }
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

export function drawParticles(ctx, particles) {
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    if (p.type === 'star') {
      drawStar(ctx, p.x, p.y, p.radius, p.color);
    } else if (p.type === 'fire') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      // glow
      ctx.globalAlpha = p.life * 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * 2, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function drawStar(ctx, x, y, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
    const method = i === 0 ? 'moveTo' : 'lineTo';
    ctx[method](x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    const innerAngle = angle + Math.PI / 5;
    ctx.lineTo(x + Math.cos(innerAngle) * r * 0.4, y + Math.sin(innerAngle) * r * 0.4);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

export function createPopAnimation(x, y, color) {
  return {
    x, y, color,
    radius: BUBBLE_RADIUS,
    maxRadius: BUBBLE_RADIUS * 1.8,
    life: 1,
    speed: 0.05,
  };
}

export function updatePopAnimations(anims, dt) {
  for (let i = anims.length - 1; i >= 0; i--) {
    const a = anims[i];
    a.life -= a.speed * dt * 60;
    a.radius = BUBBLE_RADIUS + (a.maxRadius - BUBBLE_RADIUS) * (1 - a.life);
    if (a.life <= 0) anims.splice(i, 1);
  }
}

export function drawPopAnimations(ctx, anims) {
  for (const a of anims) {
    ctx.globalAlpha = a.life * 0.6;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
    ctx.fillStyle = a.color;
    ctx.fill();
    ctx.globalAlpha = a.life * 0.3;
    ctx.beginPath();
    ctx.arc(a.x, a.y, a.radius * 1.4, 0, Math.PI * 2);
    ctx.strokeStyle = a.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
