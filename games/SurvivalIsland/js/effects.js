// ============================================================
// effects.js - Weather effects, fire particles, damage effects
// ============================================================

const particles = [];
const MAX_PARTICLES = 500;

export function spawnParticle(p) {
    if (particles.length >= MAX_PARTICLES) return;
    particles.push({
        x: p.x, y: p.y,
        vx: p.vx || 0, vy: p.vy || 0,
        life: p.life || 1,
        maxLife: p.life || 1,
        size: p.size || 3,
        color: p.color || '#fff',
        alpha: p.alpha || 1,
        gravity: p.gravity || 0,
        shrink: p.shrink !== undefined ? p.shrink : true,
        type: p.type || 'default',
    });
}

export function spawnHitEffect(x, y) {
    for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 40 + Math.random() * 60;
        spawnParticle({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.3 + Math.random() * 0.2,
            size: 2 + Math.random() * 2,
            color: '#ff6b6b',
            gravity: 80,
        });
    }
}

export function spawnGatherEffect(x, y, type) {
    const colors = {
        tree: '#8B5E3C',
        rock: '#888',
        bush: '#4caf50',
    };
    for (let i = 0; i < 4; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 20 + Math.random() * 40;
        spawnParticle({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 20,
            life: 0.4 + Math.random() * 0.3,
            size: 2 + Math.random() * 3,
            color: colors[type] || '#fff',
            gravity: 60,
        });
    }
}

export function spawnFireParticle(x, y) {
    spawnParticle({
        x: x + (Math.random() - 0.5) * 10,
        y: y,
        vx: (Math.random() - 0.5) * 15,
        vy: -30 - Math.random() * 40,
        life: 0.5 + Math.random() * 0.5,
        size: 2 + Math.random() * 3,
        color: Math.random() > 0.5 ? '#f39c12' : '#e74c3c',
        gravity: -20,
        type: 'fire',
    });
}

export function spawnRainDrop(camX, camY, canvasW) {
    spawnParticle({
        x: camX + Math.random() * canvasW,
        y: camY - 5,
        vx: -20 + Math.random() * 10,
        vy: 300 + Math.random() * 200,
        life: 0.8,
        size: 1,
        color: '#74b9ff',
        alpha: 0.4,
        shrink: false,
        gravity: 0,
        type: 'rain',
    });
}

export function spawnCraftEffect(x, y) {
    for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const speed = 50 + Math.random() * 30;
        spawnParticle({
            x, y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 0.5,
            size: 3,
            color: '#6abf4b',
            gravity: 0,
        });
    }
}

export function spawnSmokeParticle(x, y) {
    spawnParticle({
        x: x + (Math.random() - 0.5) * 6,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: -15 - Math.random() * 20,
        life: 1 + Math.random(),
        size: 4 + Math.random() * 4,
        color: '#777',
        alpha: 0.3,
        gravity: -5,
        type: 'smoke',
    });
}

export function updateEffects(dt, canvasW, canvasH) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life -= dt;
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += p.gravity * dt;
        if (p.shrink) {
            p.size *= (1 - dt * 2);
        }
    }
}

export function drawEffects(ctx, world, camX, camY, canvasW, canvasH) {
    for (const p of particles) {
        const progress = p.life / p.maxLife;
        const alpha = p.alpha * progress;
        ctx.globalAlpha = alpha;

        // Convert world coords to screen coords
        const sx = p.x - camX;
        const sy = p.y - camY;

        if (p.type === 'rain') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = p.size;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + p.vx * 0.02, sy + p.vy * 0.02);
            ctx.stroke();
        } else {
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(sx, sy, Math.max(0.5, p.size), 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
}

export function drawWeatherOverlay(ctx, world, canvasW, canvasH) {
    // Rain/snow particles are spawned from main loop
    if (world.weather === 'storm') {
        // Lightning flash occasionally
        if (Math.random() < 0.003) {
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(0, 0, canvasW, canvasH);
        }
    }
}

export function drawDayNightOverlay(ctx, world, canvasW, canvasH) {
    const daylight = world.getDaylight();
    if (daylight >= 1) return;

    const darkness = 1 - daylight;
    ctx.fillStyle = `rgba(10, 15, 40, ${darkness * 0.6})`;
    ctx.fillRect(0, 0, canvasW, canvasH);
}

// Clear all effects
export function clearEffects() {
    particles.length = 0;
}
