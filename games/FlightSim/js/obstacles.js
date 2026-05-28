// ============================================================
// obstacles.js - Obstacles: balloons, birds, storm clouds
// ============================================================

import { OBSTACLES, WORLD } from './config.js';

export class ObstacleManager {
    constructor(canvasWidth, canvasHeight, groundY) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.groundY = groundY;
        this.balloons = [];
        this.birds = [];
        this.storms = [];
        this.frame = 0;

        this._spawnBalloons();
        this._spawnBirds();
        this._spawnStorms();
    }

    _spawnBalloons() {
        this.balloons = [];
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
        for (let i = 0; i < OBSTACLES.BALLOON_COUNT; i++) {
            this.balloons.push({
                x: 400 + Math.random() * (WORLD.WIDTH - 800),
                y: this.canvasHeight * 0.15 + Math.random() * this.canvasHeight * 0.5,
                baseY: 0,
                size: OBSTACLES.BALLOON_SIZE + Math.random() * 10,
                color: colors[i % colors.length],
                bobPhase: Math.random() * Math.PI * 2,
                bobSpeed: 0.02 + Math.random() * 0.02,
                bobAmp: 8 + Math.random() * 12,
                stringLen: 20 + Math.random() * 15,
                hit: false,
                hitTimer: 0,
            });
            this.balloons[i].baseY = this.balloons[i].y;
        }
    }

    _spawnBirds() {
        this.birds = [];
        for (let i = 0; i < OBSTACLES.BIRD_COUNT; i++) {
            const cx = 300 + Math.random() * (WORLD.WIDTH - 600);
            const cy = this.canvasHeight * 0.12 + Math.random() * this.canvasHeight * 0.55;
            this.birds.push({
                x: cx,
                y: cy,
                centerX: cx,
                centerY: cy,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 1,
                size: OBSTACLES.BIRD_SIZE + Math.random() * 8,
                wingPhase: Math.random() * Math.PI * 2,
                wingSpeed: 0.15 + Math.random() * 0.1,
                wanderTimer: Math.random() * 100,
                wanderDir: Math.random() * Math.PI * 2,
            });
        }
    }

    _spawnStorms() {
        this.storms = [];
        for (let i = 0; i < OBSTACLES.STORM_COUNT; i++) {
            this.storms.push({
                x: 600 + Math.random() * (WORLD.WIDTH - 1200),
                y: this.canvasHeight * 0.1 + Math.random() * this.canvasHeight * 0.35,
                radius: OBSTACLES.STORM_RADIUS + Math.random() * 40,
                phase: Math.random() * Math.PI * 2,
                lightningTimer: 0,
                lightningFlash: 0,
                darkening: 0,
            });
        }
    }

    reset() {
        this._spawnBalloons();
        this._spawnBirds();
        this._spawnStorms();
    }

    update(planeX, planeY) {
        this.frame++;

        // Update balloons
        this.balloons.forEach(b => {
            if (b.hit) {
                b.hitTimer--;
                if (b.hitTimer <= 0) {
                    b.hit = false;
                    b.x = planeX + (Math.random() > 0.5 ? 1 : -1) * (400 + Math.random() * 600);
                    b.y = this.canvasHeight * 0.15 + Math.random() * this.canvasHeight * 0.5;
                    b.baseY = b.y;
                }
                return;
            }
            b.y = b.baseY + Math.sin(this.frame * b.bobSpeed + b.bobPhase) * b.bobAmp;
        });

        // Update birds
        this.birds.forEach(bird => {
            bird.wingPhase += bird.wingSpeed;
            bird.wanderTimer--;

            if (bird.wanderTimer <= 0) {
                bird.wanderDir = Math.random() * Math.PI * 2;
                bird.wanderTimer = 60 + Math.random() * 120;
            }

            bird.vx += Math.cos(bird.wanderDir) * 0.05;
            bird.vy += Math.sin(bird.wanderDir) * 0.05;

            // Pull back to center
            const dx = bird.centerX - bird.x;
            const dy = bird.centerY - bird.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > OBSTACLES.BIRD_WANDER_RANGE) {
                bird.vx += dx * 0.003;
                bird.vy += dy * 0.003;
            }

            // Speed limit
            const spd = Math.sqrt(bird.vx * bird.vx + bird.vy * bird.vy);
            const maxSpd = OBSTACLES.BIRD_SPEED_MAX;
            if (spd > maxSpd) {
                bird.vx = (bird.vx / spd) * maxSpd;
                bird.vy = (bird.vy / spd) * maxSpd;
            }

            bird.x += bird.vx;
            bird.y += bird.vy;

            // Keep in bounds
            if (bird.y < 30) { bird.y = 30; bird.vy = Math.abs(bird.vy); }
            if (bird.y > this.groundY - 20) { bird.y = this.groundY - 20; bird.vy = -Math.abs(bird.vy); }
        });

        // Update storms
        this.storms.forEach(storm => {
            storm.phase += 0.01;
            storm.lightningTimer--;
            if (storm.lightningFlash > 0) storm.lightningFlash--;

            if (storm.lightningTimer <= 0) {
                storm.lightningTimer = OBSTACLES.STORM_INTERVAL_MIN +
                    Math.random() * (OBSTACLES.STORM_INTERVAL_MAX - OBSTACLES.STORM_INTERVAL_MIN);
                storm.lightningFlash = 6;
            }
        });
    }

    checkBalloonCollision(planeX, planeY, planeW, planeH) {
        for (const b of this.balloons) {
            if (b.hit) continue;
            const dx = planeX - b.x;
            const dy = planeY - b.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < b.size + planeW * 0.4) {
                b.hit = true;
                b.hitTimer = 120;
                return b;
            }
        }
        return null;
    }

    checkBirdCollision(planeX, planeY, planeW, planeH) {
        for (const bird of this.birds) {
            const dx = planeX - bird.x;
            const dy = planeY - bird.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < bird.size + planeW * 0.3) {
                // Move bird away
                bird.vx = (dx / dist) * 5;
                bird.vy = (dy / dist) * 5;
                return bird;
            }
        }
        return null;
    }

    isInStorm(planeX, planeY) {
        for (const storm of this.storms) {
            const dx = planeX - storm.x;
            const dy = planeY - storm.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < storm.radius) {
                return storm;
            }
        }
        return null;
    }

    draw(ctx, cameraX) {
        // Draw storms
        this.storms.forEach(storm => {
            const sx = storm.x - cameraX;
            const sy = storm.y;

            // Storm cloud body
            ctx.save();
            const stormGrad = ctx.createRadialGradient(sx, sy, storm.radius * 0.2, sx, sy, storm.radius);
            stormGrad.addColorStop(0, 'rgba(40, 40, 60, 0.7)');
            stormGrad.addColorStop(0.6, 'rgba(60, 60, 80, 0.5)');
            stormGrad.addColorStop(1, 'rgba(80, 80, 100, 0)');
            ctx.fillStyle = stormGrad;
            ctx.beginPath();
            ctx.arc(sx, sy, storm.radius, 0, Math.PI * 2);
            ctx.fill();

            // Dark puffs
            ctx.fillStyle = 'rgba(30, 30, 50, 0.5)';
            for (let i = 0; i < 6; i++) {
                const a = (i / 6) * Math.PI * 2 + storm.phase;
                const r = storm.radius * 0.5;
                const px = sx + Math.cos(a) * r;
                const py = sy + Math.sin(a) * r * 0.6;
                ctx.beginPath();
                ctx.ellipse(px, py, storm.radius * 0.25, storm.radius * 0.2, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            // Lightning
            if (storm.lightningFlash > 0) {
                ctx.strokeStyle = `rgba(255, 255, 200, ${storm.lightningFlash / 6})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(sx, sy);
                let lx = sx, ly = sy;
                for (let j = 0; j < 5; j++) {
                    lx += (Math.random() - 0.5) * 30;
                    ly += 20 + Math.random() * 20;
                    ctx.lineTo(lx, ly);
                }
                ctx.stroke();

                // Flash overlay
                ctx.fillStyle = `rgba(255, 255, 255, ${storm.lightningFlash * 0.03})`;
                ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);
            }

            // Rain
            ctx.strokeStyle = 'rgba(150, 180, 220, 0.3)';
            ctx.lineWidth = 1;
            for (let i = 0; i < 15; i++) {
                const rx = sx + (Math.random() - 0.5) * storm.radius * 1.5;
                const ry = sy + (Math.random() - 0.5) * storm.radius;
                ctx.beginPath();
                ctx.moveTo(rx, ry);
                ctx.lineTo(rx - 2, ry + 8);
                ctx.stroke();
            }

            ctx.restore();
        });

        // Draw balloons
        this.balloons.forEach(b => {
            if (b.hit && b.hitTimer > 90) return;
            const sx = b.x - cameraX;
            const sy = b.y;

            ctx.save();
            if (b.hit) {
                ctx.globalAlpha = b.hitTimer / 120;
            }

            // String
            ctx.strokeStyle = '#888888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(sx, sy + b.size);
            ctx.quadraticCurveTo(sx + Math.sin(this.frame * 0.03) * 5, sy + b.size + b.stringLen * 0.5, sx, sy + b.size + b.stringLen);
            ctx.stroke();

            // Balloon body
            const grad = ctx.createRadialGradient(sx - b.size * 0.2, sy - b.size * 0.2, b.size * 0.1, sx, sy, b.size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, b.color);
            grad.addColorStop(1, b.color);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.ellipse(sx, sy, b.size * 0.7, b.size, 0, 0, Math.PI * 2);
            ctx.fill();

            // Highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.beginPath();
            ctx.ellipse(sx - b.size * 0.2, sy - b.size * 0.3, b.size * 0.15, b.size * 0.2, -0.3, 0, Math.PI * 2);
            ctx.fill();

            // Knot
            ctx.fillStyle = b.color;
            ctx.beginPath();
            ctx.moveTo(sx - 3, sy + b.size);
            ctx.lineTo(sx, sy + b.size + 5);
            ctx.lineTo(sx + 3, sy + b.size);
            ctx.fill();

            ctx.restore();
        });

        // Draw birds
        this.birds.forEach(bird => {
            const sx = bird.x - cameraX;
            const sy = bird.y;
            const wing = Math.sin(bird.wingPhase) * 0.6;
            const s = bird.size;

            ctx.save();
            ctx.translate(sx, sy);

            // Body
            ctx.fillStyle = '#333333';
            ctx.beginPath();
            ctx.ellipse(0, 0, s * 0.5, s * 0.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Wings
            ctx.strokeStyle = '#444444';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-s * 0.2, 0);
            ctx.quadraticCurveTo(-s * 0.1, -s * wing, -s * 0.7, -s * wing * 0.5);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(s * 0.2, 0);
            ctx.quadraticCurveTo(s * 0.1, -s * wing, s * 0.7, -s * wing * 0.5);
            ctx.stroke();

            // Beak
            ctx.fillStyle = '#ff8800';
            const dir = bird.vx > 0 ? 1 : -1;
            ctx.beginPath();
            ctx.moveTo(dir * s * 0.5, 0);
            ctx.lineTo(dir * s * 0.7, -s * 0.05);
            ctx.lineTo(dir * s * 0.7, s * 0.05);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(dir * s * 0.25, -s * 0.05, s * 0.06, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(dir * s * 0.27, -s * 0.05, s * 0.03, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
        });
    }
}
