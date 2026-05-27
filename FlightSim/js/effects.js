// ============================================================
// effects.js - Particle systems: trails, explosions, sparks
// ============================================================

import { EFFECTS } from './config.js';

export class EffectsManager {
    constructor() {
        this.trails = [];
        this.explosions = [];
        this.sparks = [];
        this.collectEffects = [];
        this.stormEffects = [];
    }

    reset() {
        this.trails = [];
        this.explosions = [];
        this.sparks = [];
        this.collectEffects = [];
        this.stormEffects = [];
    }

    addTrail(x, y, vx, vy, boosted) {
        if (this.trails.length > EFFECTS.TRAIL_PARTICLES * 3) return;
        this.trails.push({
            x: x - vx * 0.5 + (Math.random() - 0.5) * 4,
            y: y + (Math.random() - 0.5) * 4,
            vx: -vx * 0.1 + (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.3 + 0.2,
            life: EFFECTS.TRAIL_LIFETIME + Math.random() * 10,
            maxLife: EFFECTS.TRAIL_LIFETIME + 10,
            size: EFFECTS.TRAIL_SIZE_MIN + Math.random() * (EFFECTS.TRAIL_SIZE_MAX - EFFECTS.TRAIL_SIZE_MIN),
            boosted,
        });
    }

    addExplosion(x, y, color = '#ff6600') {
        for (let i = 0; i < EFFECTS.EXPLOSION_PARTICLES; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 5;
            const colors = ['#ff4400', '#ff8800', '#ffcc00', '#ff2200', '#ffaa00', '#ffffff'];
            this.explosions.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: EFFECTS.EXPLOSION_LIFETIME + Math.random() * 20,
                maxLife: EFFECTS.EXPLOSION_LIFETIME + 20,
                size: 3 + Math.random() * 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                gravity: 0.02 + Math.random() * 0.03,
            });
        }
        // Central flash
        this.explosions.push({
            x, y,
            vx: 0, vy: 0,
            life: 10,
            maxLife: 10,
            size: 40,
            color: '#ffffff',
            gravity: 0,
            flash: true,
        });
    }

    addSparks(x, y, count = EFFECTS.SPARK_PARTICLES) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.sparks.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: EFFECTS.SPARK_LIFETIME + Math.random() * 10,
                maxLife: EFFECTS.SPARK_LIFETIME + 10,
                size: 1.5 + Math.random() * 2,
            });
        }
    }

    addCollectEffect(x, y, type) {
        const color = type === 'star' ? '#ffdd00' :
                     type === 'fuel' ? '#44ff44' :
                     type === 'boost' ? '#4488ff' : '#44ffff';
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const speed = 1.5 + Math.random() * 2;
            this.collectEffects.push({
                x, y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 25,
                maxLife: 25,
                size: 3 + Math.random() * 3,
                color,
            });
        }
    }

    addStormEffect(x, y) {
        if (this.stormEffects.length > 30) return;
        this.stormEffects.push({
            x: x + (Math.random() - 0.5) * 60,
            y: y + (Math.random() - 0.5) * 40,
            vx: (Math.random() - 0.5) * 2,
            vy: 1 + Math.random() * 2,
            life: 20 + Math.random() * 20,
            maxLife: 40,
            size: 2 + Math.random() * 3,
        });
    }

    update() {
        // Trails
        this.trails = this.trails.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.size *= 0.97;
            return p.life > 0;
        });

        // Explosions
        this.explosions = this.explosions.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity || 0;
            p.vx *= 0.98;
            p.vy *= 0.98;
            p.life--;
            if (!p.flash) p.size *= 0.97;
            return p.life > 0;
        });

        // Sparks
        this.sparks = this.sparks.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life--;
            return p.life > 0;
        });

        // Collect effects
        this.collectEffects = this.collectEffects.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.95;
            p.vy *= 0.95;
            p.life--;
            return p.life > 0;
        });

        // Storm effects
        this.stormEffects = this.stormEffects.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });
    }

    draw(ctx, cameraX) {
        // Trails
        this.trails.forEach(p => {
            const sx = p.x - cameraX;
            const alpha = (p.life / p.maxLife) * 0.6;
            if (p.boosted) {
                ctx.fillStyle = `rgba(68, 170, 255, ${alpha})`;
            } else {
                ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
            }
            ctx.beginPath();
            ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Explosions
        this.explosions.forEach(p => {
            const sx = p.x - cameraX;
            const alpha = p.life / p.maxLife;
            if (p.flash) {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(sx, p.y, p.size * alpha, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = p.color;
                ctx.globalAlpha = alpha;
                ctx.beginPath();
                ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
            }
        });

        // Sparks
        this.sparks.forEach(p => {
            const sx = p.x - cameraX;
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
            ctx.beginPath();
            ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });

        // Collect effects
        this.collectEffects.forEach(p => {
            const sx = p.x - cameraX;
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        });

        // Storm effects
        this.stormEffects.forEach(p => {
            const sx = p.x - cameraX;
            const alpha = p.life / p.maxLife;
            ctx.fillStyle = `rgba(150, 180, 220, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(sx, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
