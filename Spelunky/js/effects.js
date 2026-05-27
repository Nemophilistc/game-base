// effects.js - Particles, screen shake, visual effects
import { COLORS } from './config.js';

class Particle {
    constructor(x, y, vx, vy, color, size, life, gravity = true) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.gravity = gravity;
        this.dead = false;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotSpeed = (Math.random() - 0.5) * 0.2;
    }

    update(dt) {
        const dtScale = dt / 16.667;
        this.x += this.vx * dtScale;
        this.y += this.vy * dtScale;
        if (this.gravity) this.vy += 0.15 * dtScale;
        this.life -= dt;
        this.rotation += this.rotSpeed * dtScale;
        if (this.life <= 0) this.dead = true;
    }

    render(ctx) {
        const alpha = Math.max(0, this.life / this.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;

        const s = this.size * (0.5 + alpha * 0.5);
        ctx.save();
        ctx.translate(Math.round(this.x), Math.round(this.y));
        ctx.rotate(this.rotation);
        ctx.fillRect(-s / 2, -s / 2, s, s);
        ctx.restore();

        ctx.globalAlpha = 1;
    }
}

export class Effects {
    constructor() {
        this.particles = [];
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.flashAlpha = 0;
        this.flashColor = '#fff';
        this.dustParticles = [];
    }

    update(dt) {
        for (const p of this.particles) {
            p.update(dt);
        }
        this.particles = this.particles.filter(p => !p.dead);

        // Screen shake
        if (this.shakeDuration > 0) {
            this.shakeDuration -= dt;
            const intensity = this.shakeIntensity * (this.shakeDuration / 500);
            this.shakeX = (Math.random() - 0.5) * intensity * 2;
            this.shakeY = (Math.random() - 0.5) * intensity * 2;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Flash
        if (this.flashAlpha > 0) {
            this.flashAlpha -= dt * 0.003;
        }
    }

    getShakeOffset() {
        return { x: this.shakeX, y: this.shakeY };
    }

    // Explosion effect
    explosion(x, y, intensity = 1) {
        const count = Math.floor(20 * intensity);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 4 * intensity;
            const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ff6600', '#cc3300'];
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                colors[Math.floor(Math.random() * colors.length)],
                3 + Math.random() * 4,
                300 + Math.random() * 400
            ));
        }
        // Debris
        for (let i = 0; i < Math.floor(8 * intensity); i++) {
            const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI;
            const speed = 2 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#5c3a1e',
                2 + Math.random() * 3,
                500 + Math.random() * 500
            ));
        }
        // Smoke
        for (let i = 0; i < Math.floor(10 * intensity); i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.3 + Math.random() * 1.5;
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 16,
                y + (Math.random() - 0.5) * 16,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 0.5,
                `rgba(100,80,60,${0.3 + Math.random() * 0.3})`,
                6 + Math.random() * 8,
                400 + Math.random() * 300,
                false
            ));
        }

        this.shake(8 * intensity, 300 * intensity);
        this.flash('#ff6600', 0.3 * intensity);
    }

    // Gold collect effect
    goldCollect(x, y) {
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                COLORS.gold,
                2 + Math.random() * 2,
                300 + Math.random() * 200
            ));
        }
    }

    // Gem collect effect
    gemCollect(x, y, color) {
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 1.5 + Math.random();
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 2 === 0 ? color : COLORS.gemShine,
                2 + Math.random() * 2,
                400 + Math.random() * 200
            ));
        }
    }

    // Enemy death effect
    enemyDeath(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                color,
                2 + Math.random() * 3,
                300 + Math.random() * 300
            ));
        }
        this.shake(3, 150);
    }

    // Player hurt effect
    playerHurt(x, y) {
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff4444',
                2 + Math.random() * 2,
                300 + Math.random() * 200
            ));
        }
        this.flash('#ff0000', 0.3);
        this.shake(5, 200);
    }

    // Rope throw dust
    ropeThrowDust(x, y) {
        for (let i = 0; i < 4; i++) {
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 8,
                y,
                (Math.random() - 0.5) * 2,
                -Math.random() * 1.5,
                '#c8a050',
                2 + Math.random() * 2,
                200 + Math.random() * 150
            ));
        }
    }

    // Landing dust
    landingDust(x, y) {
        for (let i = 0; i < 5; i++) {
            const dir = i < 2.5 ? -1 : 1;
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 10,
                y,
                dir * (0.5 + Math.random()),
                -Math.random() * 0.5,
                'rgba(150,120,80,0.5)',
                2 + Math.random() * 2,
                200 + Math.random() * 100,
                false
            ));
        }
    }

    // Walk dust
    walkDust(x, y, dir) {
        if (Math.random() > 0.3) return;
        this.particles.push(new Particle(
            x, y,
            -dir * (0.3 + Math.random() * 0.5),
            -Math.random() * 0.3,
            'rgba(120,100,70,0.3)',
            1.5 + Math.random(),
            150 + Math.random() * 100,
            false
        ));
    }

    // Whip trail
    whipTrail(x, y) {
        this.particles.push(new Particle(
            x + (Math.random() - 0.5) * 6,
            y + (Math.random() - 0.5) * 6,
            (Math.random() - 0.5) * 0.5,
            (Math.random() - 0.5) * 0.5,
            'rgba(200,160,80,0.5)',
            2,
            100,
            false
        ));
    }

    // Key collect sparkle
    keyCollect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 3 === 0 ? COLORS.gold : i % 3 === 1 ? COLORS.goldShine : '#fff',
                2 + Math.random() * 3,
                500 + Math.random() * 300
            ));
        }
        this.flash(COLORS.gold, 0.2);
    }

    // Door open effect
    doorOpen(x, y) {
        for (let i = 0; i < 25; i++) {
            const angle = (i / 25) * Math.PI * 2;
            const speed = 1 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 1,
                COLORS.gold,
                3 + Math.random() * 3,
                600 + Math.random() * 400
            ));
        }
    }

    // Level complete effect
    levelComplete(x, y) {
        for (let i = 0; i < 40; i++) {
            const angle = (i / 40) * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            const colors = ['#ffd700', '#ff8800', '#ffcc00', '#fff'];
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed - 2,
                colors[i % colors.length],
                3 + Math.random() * 4,
                800 + Math.random() * 400
            ));
        }
        this.flash(COLORS.gold, 0.4);
    }

    shake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeDuration = Math.max(this.shakeDuration, duration);
    }

    flash(color, alpha) {
        this.flashColor = color;
        this.flashAlpha = Math.max(this.flashAlpha, alpha);
    }

    renderFlash(ctx, w, h) {
        if (this.flashAlpha > 0) {
            ctx.globalAlpha = Math.min(1, this.flashAlpha);
            ctx.fillStyle = this.flashColor;
            ctx.fillRect(0, 0, w, h);
            ctx.globalAlpha = 1;
        }
    }

    renderParticles(ctx) {
        for (const p of this.particles) {
            p.render(ctx);
        }
    }
}
