// player.js - Player basket with movement

import { BASKET_WIDTH, BASKET_HEIGHT, BASKET_SPEED, BASKET_Y_OFFSET, GAME_WIDTH, COLORS } from './config.js';

export class Player {
    constructor(canvasHeight) {
        this.width = BASKET_WIDTH;
        this.height = BASKET_HEIGHT;
        this.x = GAME_WIDTH / 2 - this.width / 2;
        this.y = canvasHeight - BASKET_Y_OFFSET - this.height;
        this.speed = BASKET_SPEED;
        this.baseSpeed = BASKET_SPEED;
        this.vx = 0;

        // Visual feedback
        this.catchFlash = 0;
        this.missFlash = 0;
        this.tilt = 0;

        // Slow debuff
        this.slowTimer = 0;
        this.isSlowed = false;

        // Power-up states
        this.hasShield = false;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.multiplier = 1;
        this.multiplierTimer = 0;
        this.shieldUsed = false;
    }

    get centerX() {
        return this.x + this.width / 2;
    }

    get centerY() {
        return this.y + this.height / 2;
    }

    get bounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height,
        };
    }

    applySlow(duration) {
        this.slowTimer = duration;
        this.isSlowed = true;
        this.speed = this.baseSpeed * 0.5;
    }

    activateMagnet(duration) {
        this.hasMagnet = true;
        this.magnetTimer = duration;
    }

    activateShield() {
        this.hasShield = true;
    }

    activateMultiplier(duration) {
        this.multiplier = 2;
        this.multiplierTimer = duration;
    }

    onCatch() {
        this.catchFlash = 0.3;
    }

    onMiss() {
        this.missFlash = 0.3;
        this.tilt = (Math.random() - 0.5) * 0.3;
    }

    update(dt, keys, mouseX) {
        // Movement from keyboard
        let moveDir = 0;
        if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) moveDir -= 1;
        if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) moveDir += 1;

        // Mouse/touch override - direct lerp for fast tracking
        if (mouseX !== null) {
            const targetX = mouseX - this.width / 2;
            const diff = targetX - this.x;
            if (Math.abs(diff) > 1) {
                // Lerp directly toward mouse with high factor for responsive feel
                const lerpFactor = 1 - Math.pow(0.05, dt); // ~0.85 effective per frame at 60fps
                this.x += diff * lerpFactor;
                this.vx = diff * lerpFactor / dt;
            } else {
                this.x = targetX;
                this.vx = 0;
            }
        } else {
            // Apply keyboard velocity
            this.vx = moveDir * this.speed;
            this.x += this.vx * dt;
        }

        // Clamp to bounds
        this.x = Math.max(0, Math.min(GAME_WIDTH - this.width, this.x));

        // Update timers
        if (this.slowTimer > 0) {
            this.slowTimer -= dt * 1000;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
                this.speed = this.baseSpeed;
            }
        }

        if (this.magnetTimer > 0) {
            this.magnetTimer -= dt * 1000;
            if (this.magnetTimer <= 0) {
                this.hasMagnet = false;
            }
        }

        if (this.multiplierTimer > 0) {
            this.multiplierTimer -= dt * 1000;
            if (this.multiplierTimer <= 0) {
                this.multiplier = 1;
            }
        }

        // Visual feedback decay
        this.catchFlash = Math.max(0, this.catchFlash - dt * 2);
        this.missFlash = Math.max(0, this.missFlash - dt * 2);
        this.tilt *= 0.95;
    }

    draw(ctx) {
        ctx.save();

        // Screen feedback tint
        if (this.catchFlash > 0) {
            ctx.globalAlpha = this.catchFlash;
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.globalAlpha = 1;
        }
        if (this.missFlash > 0) {
            ctx.globalAlpha = this.missFlash * 0.5;
            ctx.fillStyle = '#FF0000';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.globalAlpha = 1;
        }

        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;

        ctx.translate(cx, cy);
        ctx.rotate(this.tilt);

        // Shadow
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.roundRect(-this.width / 2 + 3, -this.height / 2 + 3, this.width, this.height, 8);
        ctx.fill();

        // Basket body gradient
        const grad = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
        if (this.isSlowed) {
            grad.addColorStop(0, '#6D4C41');
            grad.addColorStop(1, '#3E2723');
        } else {
            grad.addColorStop(0, '#FFB300');
            grad.addColorStop(0.5, '#FF8F00');
            grad.addColorStop(1, '#E65100');
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 8);
        ctx.fill();

        // Basket rim highlight
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-this.width / 2, -this.height / 2, this.width, this.height, 8);
        ctx.stroke();

        // Inner detail lines (basket weave look)
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        for (let i = -this.width / 2 + 15; i < this.width / 2; i += 15) {
            ctx.beginPath();
            ctx.moveTo(i, -this.height / 2 + 4);
            ctx.lineTo(i, this.height / 2 - 4);
            ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(-this.width / 2 + 4, 0);
        ctx.lineTo(this.width / 2 - 4, 0);
        ctx.stroke();

        // Shield indicator
        if (this.hasShield) {
            ctx.strokeStyle = 'rgba(66, 165, 245, 0.6)';
            ctx.lineWidth = 3;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.ellipse(0, 0, this.width / 2 + 8, this.height / 2 + 8, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        // Magnet indicator
        if (this.hasMagnet) {
            ctx.strokeStyle = 'rgba(244, 67, 54, 0.5)';
            ctx.lineWidth = 2;
            const pulseR = this.width / 2 + 15 + Math.sin(Date.now() / 200) * 5;
            ctx.beginPath();
            ctx.arc(0, 0, pulseR, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Multiplier glow
        if (this.multiplier > 1) {
            ctx.shadowColor = '#FF6F00';
            ctx.shadowBlur = 20;
            ctx.strokeStyle = '#FF6F00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(-this.width / 2 - 3, -this.height / 2 - 3, this.width + 6, this.height + 6, 10);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    }
}
