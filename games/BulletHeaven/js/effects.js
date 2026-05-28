// ============================================================
// effects.js - 粒子系统、伤害数字、屏幕震动
// ============================================================

class Particle {
    constructor(x, y, vx, vy, color, size, life) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.alive = true;
    }

    update(dt) {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += 0.02; // 重力
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(sx, sy, this.size * alpha, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class DamageNumber {
    constructor(x, y, value, color = '#ffff00') {
        this.x = x;
        this.y = y;
        this.value = Math.floor(value);
        this.color = color;
        this.vy = -2;
        this.life = 800;
        this.maxLife = 800;
        this.alive = true;
    }

    update(dt) {
        this.y += this.vy;
        this.vy *= 0.98;
        this.life -= dt;
        if (this.life <= 0) this.alive = false;
    }

    draw(ctx, camera) {
        if (!this.alive) return;
        const sx = this.x - camera.x;
        const sy = this.y - camera.y;
        const alpha = this.life / this.maxLife;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${14 + (1 - alpha) * 6}px Arial`;
        ctx.fillStyle = this.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.textAlign = 'center';
        ctx.strokeText(this.value, sx, sy);
        ctx.fillText(this.value, sx, sy);
        ctx.restore();
    }
}

export class EffectsSystem {
    constructor() {
        this.particles = [];
        this.damageNumbers = [];
        this.screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
    }

    // 通用粒子爆炸
    spawnParticles(x, y, color, count = 8, speed = 3, size = 3, life = 500) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const s = speed * (0.5 + Math.random() * 0.5);
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * s,
                Math.sin(angle) * s,
                color, size * (0.5 + Math.random() * 0.5), life
            ));
        }
    }

    // 敌人死亡特效
    enemyDeath(x, y, color) {
        this.spawnParticles(x, y, color, 12, 4, 4, 600);
        this.spawnParticles(x, y, '#ffffff', 4, 2, 2, 300);
    }

    // 伤害数字
    addDamageNumber(x, y, value, color) {
        this.damageNumbers.push(new DamageNumber(
            x + (Math.random() - 0.5) * 10,
            y - 10,
            value,
            color
        ));
    }

    // 屏幕震动
    shake(intensity) {
        this.screenShake.intensity = Math.max(this.screenShake.intensity, intensity);
    }

    // 升级特效
    levelUpEffect(x, y) {
        const colors = ['#ffff00', '#ff8800', '#ff44ff', '#44ffff'];
        for (const color of colors) {
            this.spawnParticles(x, y, color, 8, 5, 5, 800);
        }
    }

    update(dt) {
        // 粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(dt);
            if (!this.particles[i].alive) this.particles.splice(i, 1);
        }
        // 限制粒子数量
        if (this.particles.length > 1000) {
            this.particles.splice(0, this.particles.length - 1000);
        }

        // 伤害数字
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            this.damageNumbers[i].update(dt);
            if (!this.damageNumbers[i].alive) this.damageNumbers.splice(i, 1);
        }

        // 屏幕震动
        if (this.screenShake.intensity > 0.5) {
            this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
            this.screenShake.intensity *= this.screenShake.decay;
        } else {
            this.screenShake.x = 0;
            this.screenShake.y = 0;
            this.screenShake.intensity = 0;
        }
    }

    draw(ctx, camera) {
        for (const p of this.particles) {
            p.draw(ctx, camera);
        }
        for (const d of this.damageNumbers) {
            d.draw(ctx, camera);
        }
    }
}
