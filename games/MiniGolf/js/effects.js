// ============================================
// Mini Golf - Visual Effects
// ============================================

import { CONFETTI_COUNT, SPLASH_COUNT, DUST_COUNT, SPARK_COUNT,
         CELEBRATION_DURATION, TRAIL_LENGTH, TRAIL_COLOR } from './config.js';

// Ball trail
export function createTrail() {
    return { points: [] };
}

export function updateTrail(trail, ballX, ballY, moving) {
    if (moving) {
        trail.points.push({ x: ballX, y: ballY, alpha: 1 });
        if (trail.points.length > TRAIL_LENGTH) trail.points.shift();
    }
    for (let i = 0; i < trail.points.length; i++) {
        trail.points[i].alpha -= 0.05;
    }
    trail.points = trail.points.filter(p => p.alpha > 0);
}

export function drawTrail(ctx, trail, toCanvasX, toCanvasY, scale) {
    for (const p of trail.points) {
        ctx.globalAlpha = p.alpha * 0.3;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(toCanvasX(p.x), toCanvasY(p.y), 5 * scale, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
}

// Particles
export function createParticles() {
    return { list: [] };
}

function addParticle(pool, p) {
    pool.list.push(p);
}

export function spawnConfetti(pool, x, y) {
    for (let i = 0; i < CONFETTI_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        const colors = ['#FF3333', '#33FF33', '#3333FF', '#FFFF33', '#FF33FF', '#33FFFF', '#FF8800', '#88FF00'];
        addParticle(pool, {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            life: 1,
            decay: 0.008 + Math.random() * 0.015,
            size: 3 + Math.random() * 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: 'confetti',
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.2
        });
    }
    // Add star particles
    for (let i = 0; i < 15; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 3;
        addParticle(pool, {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1,
            decay: 0.006 + Math.random() * 0.01,
            size: 4 + Math.random() * 6,
            color: '#FFD700',
            type: 'star',
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.15
        });
    }
}

export function spawnSplash(pool, x, y) {
    for (let i = 0; i < SPLASH_COUNT; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
        const speed = 1 + Math.random() * 3;
        addParticle(pool, {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.02 + Math.random() * 0.03,
            size: 2 + Math.random() * 4,
            color: '#6699DD',
            type: 'splash'
        });
    }
}

export function spawnDust(pool, x, y) {
    for (let i = 0; i < DUST_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.3 + Math.random() * 1.5;
        addParticle(pool, {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.02 + Math.random() * 0.03,
            size: 3 + Math.random() * 5,
            color: '#D4C090',
            type: 'dust'
        });
    }
}

export function spawnSparks(pool, x, y) {
    for (let i = 0; i < SPARK_COUNT; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        addParticle(pool, {
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            decay: 0.03 + Math.random() * 0.05,
            size: 2 + Math.random() * 3,
            color: '#FFFFFF',
            type: 'spark'
        });
    }
}

export function updateParticles(pool) {
    for (const p of pool.list) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life -= p.decay;
        if (p.rotation !== undefined) p.rotation += p.rotSpeed;
    }
    pool.list = pool.list.filter(p => p.life > 0);
}

export function drawParticles(ctx, pool, toCanvasX, toCanvasY, scale) {
    for (const p of pool.list) {
        const cx = toCanvasX(p.x), cy = toCanvasY(p.y);
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;

        if (p.type === 'confetti') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(p.rotation);
            ctx.fillRect(-p.size * scale / 2, -p.size * scale / 4, p.size * scale, p.size * scale / 2);
            ctx.restore();
        } else if (p.type === 'star') {
            ctx.save();
            ctx.translate(cx, cy);
            ctx.rotate(p.rotation);
            drawStar(ctx, 0, 0, p.size * scale, p.color);
            ctx.restore();
        } else if (p.type === 'splash') {
            ctx.beginPath();
            ctx.arc(cx, cy, p.size * scale * p.life, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'spark') {
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(cx, cy, p.size * scale, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.beginPath();
            ctx.arc(cx, cy, p.size * scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

function drawStar(ctx, cx, cy, r, color) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        const a = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const x = cx + r * Math.cos(a);
        const y = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// Celebration effect
export function createCelebration() {
    return { active: false, timer: 0, scale: 1 };
}

export function startCelebration(celeb) {
    celeb.active = true;
    celeb.timer = CELEBRATION_DURATION;
    celeb.scale = 1;
}

export function updateCelebration(celeb, dt) {
    if (!celeb.active) return;
    celeb.timer -= dt;
    celeb.scale = 1 + Math.sin(celeb.timer * 0.005) * 0.1;
    if (celeb.timer <= 0) celeb.active = false;
}

export function drawCelebration(ctx, celeb, toCanvasX, toCanvasY, holeX, holeY) {
    if (!celeb.active) return;
    const cx = toCanvasX(holeX), cy = toCanvasY(holeY);
    const progress = 1 - celeb.timer / CELEBRATION_DURATION;

    // Expanding ring
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 1 - progress;
    ctx.beginPath();
    ctx.arc(cx, cy, (30 + progress * 80) * celeb.scale, 0, Math.PI * 2);
    ctx.stroke();

    // Glow
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, 50 * celeb.scale);
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.globalAlpha = (1 - progress) * 0.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 50 * celeb.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 1;
}
