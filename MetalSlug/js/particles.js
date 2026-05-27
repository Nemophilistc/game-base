// ============================================
// MetalSlug 粒子系统
// ============================================

export class Particle {
    constructor(x, y, vx, vy, color, size, life, gravity = 0.1, fade = true) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.fade = fade;
        this.dead = false;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;

        if (this.life <= 0) {
            this.dead = true;
        }
    }

    draw(ctx, cameraX) {
        const alpha = this.fade ? this.life / this.maxLife : 1;
        const drawX = this.x - cameraX;
        const drawY = this.y;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(drawX - this.size / 2, drawY - this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    addExplosion(x, y, size = 30, count = 20) {
        const colors = ['#FF4500', '#FF6600', '#FFD700', '#FF8C00', '#FF0000'];
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 2 + Math.random() * (size / 8);
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const particleSize = 3 + Math.random() * 6;
            const life = 20 + Math.random() * 30;
            this.particles.push(new Particle(x, y, vx, vy, color, particleSize, life));
        }
    }

    addBigExplosion(x, y) {
        this.addExplosion(x, y, 60, 40);
        // 添加烟雾
        for (let i = 0; i < 15; i++) {
            const vx = (Math.random() - 0.5) * 4;
            const vy = -Math.random() * 4 - 1;
            const size = 8 + Math.random() * 15;
            const life = 40 + Math.random() * 30;
            this.particles.push(new Particle(x, y, vx, vy, '#555555', size, life, 0.02));
        }
    }

    addSmoke(x, y, count = 5) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 2;
            const vy = -Math.random() * 3 - 1;
            const size = 5 + Math.random() * 10;
            const life = 30 + Math.random() * 20;
            const gray = 80 + Math.floor(Math.random() * 60);
            this.particles.push(new Particle(x, y, vx, vy, `rgb(${gray},${gray},${gray})`, size, life, 0.02));
        }
    }

    addSparks(x, y, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 3 + Math.random() * 5;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed - 2;
            const colors = ['#FFD700', '#FF6600', '#FFFFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, vx, vy, color, 2, 15 + Math.random() * 10));
        }
    }

    addShellCasing(x, y, direction = 1) {
        const vx = direction * (2 + Math.random() * 2);
        const vy = -3 - Math.random() * 2;
        this.particles.push(new Particle(x, y, vx, vy, '#DAA520', 3, 40, 0.15));
    }

    addBlood(x, y, count = 6) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 6;
            const vy = -Math.random() * 5 - 1;
            const colors = ['#CC0000', '#8B0000', '#FF0000'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, vx, vy, color, 2 + Math.random() * 3, 20 + Math.random() * 15));
        }
    }

    addMuzzleFlash(x, y, angle) {
        const count = 5;
        for (let i = 0; i < count; i++) {
            const spread = (Math.random() - 0.5) * 0.5;
            const speed = 5 + Math.random() * 5;
            const vx = Math.cos(angle + spread) * speed;
            const vy = Math.sin(angle + spread) * speed;
            const colors = ['#FFD700', '#FF6600', '#FFFFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new Particle(x, y, vx, vy, color, 2 + Math.random() * 3, 8 + Math.random() * 5, 0, false));
        }
    }

    addDebris(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const vx = (Math.random() - 0.5) * 8;
            const vy = -Math.random() * 8 - 2;
            const colors = ['#8B8B8B', '#696969', '#A9A9A9', '#555555'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            const size = 3 + Math.random() * 6;
            this.particles.push(new Particle(x, y, vx, vy, color, size, 30 + Math.random() * 20));
        }
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].dead) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx, cameraX) {
        for (const p of this.particles) {
            p.draw(ctx, cameraX);
        }
    }

    clear() {
        this.particles = [];
    }
}
