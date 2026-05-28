// 粒子系统
export let particles = [];

export function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x, y,
            vx: (Math.random() - 0.5) * 6,
            vy: (Math.random() - 0.5) * 6,
            life: 20 + Math.random() * 15,
            color
        });
    }
}

export function resetParticles() {
    particles = [];
}

export function updateParticles() {
    particles = particles.filter(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        return p.life > 0;
    });
}

export function drawParticles(ctx) {
    particles.forEach(p => {
        ctx.globalAlpha = p.life / 35;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1;
}
