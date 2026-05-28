// effects.js - Particle system
export class Particle {
    constructor(x, y, vx, vy, life, color, size, shrink = true) {
        this.x = x; this.y = y;
        this.vx = vx; this.vy = vy;
        this.life = this.maxLife = life;
        this.color = color;
        this.size = size;
        this.shrink = shrink;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.1;
        this.life--;
        return this.life > 0;
    }
    draw(ctx, camX, camY) {
        const a = this.life / this.maxLife;
        const s = this.shrink ? this.size * a : this.size;
        ctx.globalAlpha = a;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camX - s / 2, this.y - camY - s / 2, s, s);
        ctx.globalAlpha = 1;
    }
}

export class Effects {
    constructor() { this.particles = []; }
    add(p) { this.particles.push(p); }
    update() { this.particles = this.particles.filter(p => p.update()); }
    draw(ctx, camX, camY) { this.particles.forEach(p => p.draw(ctx, camX, camY)); }

    burst(x, y, count, color, speed = 3, size = 4, life = 20) {
        for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2;
            const s = Math.random() * speed;
            this.add(new Particle(x, y, Math.cos(a) * s, Math.sin(a) * s, life + Math.random() * 10, color, size + Math.random() * 2));
        }
    }

    dust(x, y) { this.burst(x, y, 5, '#9B8B6B', 2, 3, 15); }
    land(x, y) { this.burst(x, y, 8, '#9B8B6B', 3, 4, 18); }
    dashTrail(x, y) { this.burst(x, y, 3, '#AADDFF', 1, 3, 10); }
    death(x, y) { this.burst(x, y, 25, '#FF6B6B', 5, 5, 30); }
    starCollect(x, y) { this.burst(x, y, 15, '#FFD700', 4, 4, 25); }
    coinCollect(x, y) { this.burst(x, y, 8, '#FFD700', 2, 3, 15); }
    goalEffect(x, y) { this.burst(x, y, 30, '#7FFF7F', 5, 5, 35); }
}
