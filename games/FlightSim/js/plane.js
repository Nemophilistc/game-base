// ============================================================
// plane.js - Aircraft class with physics simulation
// ============================================================

import { PHYSICS, PLANE, WORLD } from './config.js';

export class Plane {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = PLANE.START_X;
        this.y = PLANE.START_Y;
        this.vx = 3;
        this.vy = 0;
        this.angle = 0;
        this.thrust = 0.3;
        this.targetThrust = 0.3;
        this.fuel = PLANE.START_FUEL;
        this.alive = true;
        this.stalling = false;
        this.boosted = false;
        this.boostTimer = 0;
        this.shielded = false;
        this.shieldTimer = 0;
        this.invincible = false;
        this.invincibleTimer = 0;
        this.hitFlash = 0;
        this.trailTimer = 0;
        this.shooting = false;
        this.shootCooldown = 0;
        this.projectiles = [];
        this.distance = 0;
    }

    get speed() {
        return Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    }

    get speedRatio() {
        return this.speed / PHYSICS.MAX_VELOCITY;
    }

    get thrustRatio() {
        return this.thrust;
    }

    get screenX() {
        return this.x;
    }

    get screenY() {
        return this.y;
    }

    shoot() {
        if (this.shootCooldown <= 0 && this.alive) {
            const cosA = Math.cos(this.angle);
            const sinA = Math.sin(this.angle);
            this.projectiles.push({
                x: this.x + cosA * PLANE.WIDTH * 0.6,
                y: this.y + sinA * PLANE.WIDTH * 0.6,
                vx: cosA * 10 + this.vx * 0.5,
                vy: sinA * 10 + this.vy * 0.5,
                life: 60,
            });
            this.shootCooldown = 8;
        }
    }

    update(keys, groundY, dt) {
        if (!this.alive) return;

        // Update invincibility
        if (this.invincible) {
            this.invincibleTimer--;
            if (this.invincibleTimer <= 0) this.invincible = false;
        }

        // Hit flash
        if (this.hitFlash > 0) this.hitFlash--;

        // Boost timer
        if (this.boosted) {
            this.boostTimer--;
            if (this.boostTimer <= 0) this.boosted = false;
        }

        // Shield timer
        if (this.shielded) {
            this.shieldTimer--;
            if (this.shieldTimer <= 0) this.shielded = false;
        }

        // Shoot cooldown
        if (this.shootCooldown > 0) this.shootCooldown--;

        // Update projectiles
        this.projectiles = this.projectiles.filter(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            return p.life > 0;
        });

        // Fuel consumption
        const fuelRate = PLANE.FUEL_CONSUMPTION_BASE + this.thrust * 0.04;
        const boostRate = this.boosted ? PLANE.FUEL_CONSUMPTION_BOOST : 0;
        this.fuel -= (fuelRate + boostRate);
        if (this.fuel <= 0) {
            this.fuel = 0;
            this.targetThrust = 0;
        }

        // Keyboard input
        if (keys['ArrowUp'] || keys['KeyW']) {
            this.angle -= PHYSICS.PITCH_SPEED;
        }
        if (keys['ArrowDown'] || keys['KeyS']) {
            this.angle += PHYSICS.PITCH_SPEED;
        }
        if (keys['ArrowLeft'] || keys['KeyA']) {
            this.angle -= PHYSICS.FINE_PITCH_SPEED;
        }
        if (keys['ArrowRight'] || keys['KeyD']) {
            this.angle += PHYSICS.FINE_PITCH_SPEED;
        }

        // Clamp angle
        this.angle = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, this.angle));

        // Thrust control
        if (this.fuel > 0) {
            const maxThrust = this.boosted ? 1.0 : 0.7;
            if (keys['ShiftLeft'] || keys['ShiftRight']) {
                this.targetThrust = Math.min(maxThrust, this.thrust + PHYSICS.THRUST_ACCEL);
            } else {
                this.targetThrust = 0.3;
            }
        } else {
            this.targetThrust = 0;
        }
        this.thrust += (this.targetThrust - this.thrust) * 0.05;

        // === Four forces ===
        const speed = this.speed;
        const cosA = Math.cos(this.angle);
        const sinA = Math.sin(this.angle);

        // Thrust (along plane's forward direction)
        const thrustMult = this.boosted ? PLANE.BOOST_SPEED_MULT : 1.0;
        let fx = cosA * this.thrust * PHYSICS.THRUST_MAX * thrustMult;
        let fy = sinA * this.thrust * PHYSICS.THRUST_MAX * thrustMult;

        // Gravity
        fy += PHYSICS.GRAVITY;

        // Lift (perpendicular to velocity, proportional to speed^2 and angle of attack)
        if (speed > 0.5) {
            const velAngle = Math.atan2(this.vy, this.vx);
            const aoa = this.angle - velAngle;
            const liftMag = PHYSICS.LIFT_COEFFICIENT * speed * speed * Math.sin(aoa * 2);
            fx += -sinA * liftMag;
            fy += cosA * liftMag;
        }

        // Drag (opposite to velocity)
        if (speed > 0.1) {
            const dragMag = PHYSICS.DRAG_COEFFICIENT * speed * speed;
            fx -= (this.vx / speed) * dragMag;
            fy -= (this.vy / speed) * dragMag;
        }

        // Apply forces
        this.vx += fx;
        this.vy += fy;

        // Speed cap
        const maxV = this.boosted ? PHYSICS.MAX_VELOCITY * 1.5 : PHYSICS.MAX_VELOCITY;
        const currentSpeed = this.speed;
        if (currentSpeed > maxV) {
            this.vx = (this.vx / currentSpeed) * maxV;
            this.vy = (this.vy / currentSpeed) * maxV;
        }

        // Stall check
        this.stalling = false;
        if (speed < PHYSICS.MIN_STALL_SPEED && this.y < groundY - 30) {
            this.stalling = true;
            this.vy += PHYSICS.STALL_PENALTY;
        }

        // Move
        this.x += this.vx;
        this.y += this.vy;

        // Track distance
        this.distance += Math.abs(this.vx) * 0.1;

        // Ground collision
        if (this.y > groundY - PLANE.HEIGHT / 2) {
            this.y = groundY - PLANE.HEIGHT / 2;
            if (this.vy > 3) {
                this.alive = false;
            } else {
                this.vy *= -PHYSICS.BOUNCE_FACTOR;
                this.vx *= PHYSICS.GROUND_FRICTION;
                if (Math.abs(this.vy) < 0.5) this.vy = 0;
            }
        }

        // Ceiling
        if (this.y < WORLD.CEILING) {
            this.y = WORLD.CEILING;
            this.vy = Math.max(0, this.vy);
        }

        // Keep on screen horizontally
        if (this.x < 50) {
            this.x = 50;
            this.vx = Math.max(0, this.vx);
        }
        if (this.x > WORLD.WIDTH - 50) {
            this.x = WORLD.WIDTH - 50;
            this.vx = Math.min(0, this.vx);
        }

        this.trailTimer++;
    }

    hit(damage) {
        if (this.invincible) return false;
        if (this.shielded) {
            this.shielded = false;
            this.shieldTimer = 0;
            this.invincible = true;
            this.invincibleTimer = 60;
            return false;
        }
        this.alive = false;
        return true;
    }

    addBoost() {
        this.boosted = true;
        this.boostTimer = PLANE.BOOST_DURATION;
        this.fuel = Math.min(100, this.fuel + 5);
    }

    addShield() {
        this.shielded = true;
        this.shieldTimer = PLANE.SHIELD_DURATION;
    }

    addFuel(amount) {
        this.fuel = Math.min(100, this.fuel + amount);
    }

    draw(ctx, cameraX) {
        const sx = this.x - cameraX;
        const sy = this.y;

        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(this.angle);

        // Invincibility blink
        if (this.invincible && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        // Shield glow
        if (this.shielded) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(0, 0, PLANE.WIDTH * 0.55, 0, Math.PI * 2);
            const shieldGrad = ctx.createRadialGradient(0, 0, PLANE.WIDTH * 0.2, 0, 0, PLANE.WIDTH * 0.55);
            shieldGrad.addColorStop(0, 'rgba(68, 255, 255, 0)');
            shieldGrad.addColorStop(0.8, 'rgba(68, 255, 255, 0.15)');
            shieldGrad.addColorStop(1, 'rgba(68, 255, 255, 0.3)');
            ctx.fillStyle = shieldGrad;
            ctx.fill();
            ctx.strokeStyle = 'rgba(68, 255, 255, 0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.restore();
        }

        // Hit flash
        if (this.hitFlash > 0) {
            ctx.globalAlpha = 0.5 + Math.sin(this.hitFlash * 0.5) * 0.3;
        }

        // --- Draw plane body ---
        // Fuselage
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.ellipse(0, 0, PLANE.WIDTH * 0.45, PLANE.HEIGHT * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.ellipse(PLANE.WIDTH * 0.15, -PLANE.HEIGHT * 0.12, PLANE.WIDTH * 0.1, PLANE.HEIGHT * 0.18, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.moveTo(-PLANE.WIDTH * 0.05, -PLANE.HEIGHT * 0.1);
        ctx.lineTo(PLANE.WIDTH * 0.05, -PLANE.HEIGHT * 0.8);
        ctx.lineTo(PLANE.WIDTH * 0.15, -PLANE.HEIGHT * 0.7);
        ctx.lineTo(PLANE.WIDTH * 0.05, -PLANE.HEIGHT * 0.1);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-PLANE.WIDTH * 0.05, PLANE.HEIGHT * 0.1);
        ctx.lineTo(PLANE.WIDTH * 0.05, PLANE.HEIGHT * 0.8);
        ctx.lineTo(PLANE.WIDTH * 0.15, PLANE.HEIGHT * 0.7);
        ctx.lineTo(PLANE.WIDTH * 0.05, PLANE.HEIGHT * 0.1);
        ctx.fill();

        // Tail
        ctx.fillStyle = '#999999';
        ctx.beginPath();
        ctx.moveTo(-PLANE.WIDTH * 0.35, -PLANE.HEIGHT * 0.05);
        ctx.lineTo(-PLANE.WIDTH * 0.45, -PLANE.HEIGHT * 0.5);
        ctx.lineTo(-PLANE.WIDTH * 0.3, -PLANE.HEIGHT * 0.05);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(-PLANE.WIDTH * 0.35, PLANE.HEIGHT * 0.05);
        ctx.lineTo(-PLANE.WIDTH * 0.45, PLANE.HEIGHT * 0.35);
        ctx.lineTo(-PLANE.WIDTH * 0.3, PLANE.HEIGHT * 0.05);
        ctx.fill();

        // Nose stripe
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.moveTo(PLANE.WIDTH * 0.35, -PLANE.HEIGHT * 0.08);
        ctx.lineTo(PLANE.WIDTH * 0.45, 0);
        ctx.lineTo(PLANE.WIDTH * 0.35, PLANE.HEIGHT * 0.08);
        ctx.fill();

        // Engine exhaust glow
        if (this.thrust > 0.1) {
            const exhaustLen = this.thrust * 30 + (this.boosted ? 20 : 0);
            const grad = ctx.createLinearGradient(-PLANE.WIDTH * 0.4, 0, -PLANE.WIDTH * 0.4 - exhaustLen, 0);
            grad.addColorStop(0, this.boosted ? '#44aaff' : '#ff8800');
            grad.addColorStop(0.5, this.boosted ? '#2266cc' : '#ff4400');
            grad.addColorStop(1, 'rgba(255, 100, 0, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(-PLANE.WIDTH * 0.35, -PLANE.HEIGHT * 0.08);
            ctx.lineTo(-PLANE.WIDTH * 0.4 - exhaustLen, 0);
            ctx.lineTo(-PLANE.WIDTH * 0.35, PLANE.HEIGHT * 0.08);
            ctx.fill();
        }

        // Stall warning
        if (this.stalling) {
            ctx.strokeStyle = '#ff0000';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.arc(0, 0, PLANE.WIDTH * 0.5, 0, Math.PI * 2);
            ctx.stroke();
            ctx.setLineDash([]);
        }

        ctx.restore();

        // Draw projectiles
        this.projectiles.forEach(p => {
            const px = p.x - cameraX;
            const py = p.y;
            ctx.fillStyle = '#ffff44';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;

            // Trail
            ctx.fillStyle = 'rgba(255, 200, 0, 0.4)';
            ctx.beginPath();
            ctx.arc(px - p.vx * 0.3, py - p.vy * 0.3, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }
}
