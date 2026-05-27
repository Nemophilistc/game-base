// ============================================================
// terrain.js - Procedural terrain generation
// ============================================================

import { TERRAIN, WORLD } from './config.js';

export class Terrain {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.groundY = canvasHeight * TERRAIN.GROUND_Y;
        this.mountains = [];
        this.clouds = [];
        this.bgStars = [];
        this.offset = 0;

        this._generateMountains();
        this._generateClouds();
        this._generateStars();
    }

    _generateMountains() {
        this.mountains = [];
        const totalWidth = WORLD.WIDTH + 800;
        let x = -200;
        while (x < totalWidth) {
            const w = TERRAIN.MOUNTAIN_MIN_WIDTH + Math.random() * (TERRAIN.MOUNTAIN_MAX_WIDTH - TERRAIN.MOUNTAIN_MIN_WIDTH);
            const h = TERRAIN.MOUNTAIN_MIN_HEIGHT + Math.random() * (TERRAIN.MOUNTAIN_MAX_HEIGHT - TERRAIN.MOUNTAIN_MIN_HEIGHT);
            const peaks = 1 + Math.floor(Math.random() * 3);
            const color = TERRAIN.MOUNTAIN_COLORS[Math.floor(Math.random() * TERRAIN.MOUNTAIN_COLORS.length)];
            this.mountains.push({
                x, width: w, height: h, peaks, color,
                snowLine: 0.65 + Math.random() * 0.15,
                ridge: Array.from({ length: 8 }, () => Math.random() * 0.4 - 0.2),
            });
            x += w * 0.6 + Math.random() * w * 0.4;
        }
    }

    _generateClouds() {
        this.clouds = [];
        for (let i = 0; i < TERRAIN.CLOUD_COUNT; i++) {
            this.clouds.push({
                x: Math.random() * WORLD.WIDTH,
                y: this.canvasHeight * (TERRAIN.CLOUD_MIN_Y + Math.random() * (TERRAIN.CLOUD_MAX_Y - TERRAIN.CLOUD_MIN_Y)),
                width: 80 + Math.random() * 180,
                height: 30 + Math.random() * 50,
                opacity: 0.3 + Math.random() * 0.4,
                speed: 0.2 + Math.random() * 0.5,
                puffs: Array.from({ length: 3 + Math.floor(Math.random() * 4) }, () => ({
                    ox: (Math.random() - 0.5) * 0.8,
                    oy: (Math.random() - 0.5) * 0.5,
                    r: 0.3 + Math.random() * 0.4,
                })),
            });
        }
    }

    _generateStars() {
        this.bgStars = [];
        for (let i = 0; i < 80; i++) {
            this.bgStars.push({
                x: Math.random() * this.canvasWidth,
                y: Math.random() * this.canvasHeight * 0.4,
                size: 0.5 + Math.random() * 2,
                twinkle: Math.random() * Math.PI * 2,
                speed: 0.02 + Math.random() * 0.03,
            });
        }
    }

    getGroundY() {
        return this.groundY;
    }

    getMountainHitboxes() {
        return this.mountains.map(m => ({
            x: m.x,
            y: this.groundY - m.height,
            width: m.width,
            height: m.height,
        }));
    }

    update(cameraX) {
        this.offset = cameraX;
        // Move clouds
        this.clouds.forEach(c => {
            c.x += c.speed;
            if (c.x > WORLD.WIDTH + 200) c.x = -200;
        });
    }

    drawSky(ctx, frame) {
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
        grad.addColorStop(0, TERRAIN.SKY_TOP);
        grad.addColorStop(0.6, TERRAIN.SKY_BOTTOM);
        grad.addColorStop(1, '#b8d4e8');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Stars (visible at top)
        this.bgStars.forEach(s => {
            const twinkle = Math.sin(frame * s.speed + s.twinkle) * 0.3 + 0.7;
            ctx.fillStyle = `rgba(255, 255, 255, ${twinkle * 0.5})`;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawClouds(ctx, cameraX, layer) {
        // layer: 0 = far (behind mountains), 1 = near (in front)
        const parallax = layer === 0 ? 0.15 : 0.4;
        this.clouds.forEach((c, i) => {
            if (layer === 0 && i % 2 !== 0) return;
            if (layer === 1 && i % 2 === 0) return;

            const sx = c.x - cameraX * parallax;
            const wrapped = ((sx % (this.canvasWidth + 400)) + this.canvasWidth + 400) % (this.canvasWidth + 400) - 200;

            ctx.save();
            ctx.globalAlpha = c.opacity * (layer === 0 ? 0.6 : 0.8);
            ctx.fillStyle = '#ffffff';

            c.puffs.forEach(p => {
                ctx.beginPath();
                ctx.ellipse(
                    wrapped + p.ox * c.width,
                    c.y + p.oy * c.height,
                    c.width * p.r * 0.5,
                    c.height * p.r,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            });
            ctx.restore();
        });
    }

    drawMountains(ctx, cameraX) {
        const parallax = 0.5;
        this.mountains.forEach(m => {
            const sx = m.x - cameraX * parallax;
            if (sx + m.width < -100 || sx > this.canvasWidth + 100) return;

            const baseY = this.groundY;
            const topY = baseY - m.height;

            // Mountain body
            ctx.fillStyle = m.color;
            ctx.beginPath();
            ctx.moveTo(sx, baseY);

            // Ridge with variation
            const steps = 20;
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = sx + t * m.width;
                const peakFactor = Math.sin(t * Math.PI * m.peaks);
                const ridgeNoise = m.ridge[Math.floor(t * (m.ridge.length - 1))] || 0;
                const py = baseY - m.height * (peakFactor * (1 - Math.abs(t - 0.5) * 0.5) + ridgeNoise * 0.3);
                ctx.lineTo(px, py);
            }
            ctx.lineTo(sx + m.width, baseY);
            ctx.closePath();
            ctx.fill();

            // Snow caps
            ctx.fillStyle = TERRAIN.SNOW_COLOR;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.moveTo(sx, baseY);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = sx + t * m.width;
                const peakFactor = Math.sin(t * Math.PI * m.peaks);
                const ridgeNoise = m.ridge[Math.floor(t * (m.ridge.length - 1))] || 0;
                const fullPy = baseY - m.height * (peakFactor * (1 - Math.abs(t - 0.5) * 0.5) + ridgeNoise * 0.3);
                const py = baseY - m.height * m.snowLine;
                if (fullPy < py) {
                    ctx.lineTo(px, fullPy);
                } else {
                    ctx.lineTo(px, py);
                }
            }
            ctx.lineTo(sx + m.width, baseY);
            ctx.closePath();
            ctx.fill();
            ctx.globalAlpha = 1.0;

            // Shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.beginPath();
            ctx.moveTo(sx + m.width * 0.3, baseY);
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const px = sx + m.width * 0.3 + t * m.width * 0.7;
                const peakFactor = Math.sin(t * Math.PI * m.peaks);
                const ridgeNoise = m.ridge[Math.floor(t * (m.ridge.length - 1))] || 0;
                const py = baseY - m.height * (peakFactor * (1 - Math.abs(t - 0.5) * 0.5) + ridgeNoise * 0.3) * 0.7;
                ctx.lineTo(px, py);
            }
            ctx.lineTo(sx + m.width, baseY);
            ctx.closePath();
            ctx.fill();
        });
    }

    drawGround(ctx, cameraX) {
        const parallax = 0.8;
        const gx = -cameraX * parallax;

        // Main ground
        const groundGrad = ctx.createLinearGradient(0, this.groundY, 0, this.canvasHeight);
        groundGrad.addColorStop(0, TERRAIN.GROUND_TOP);
        groundGrad.addColorStop(1, TERRAIN.GROUND_BOTTOM);
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, this.groundY, this.canvasWidth, this.canvasHeight - this.groundY);

        // Ground details - stripes
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            const y = this.groundY + 10 + i * 12;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.canvasWidth, y);
            ctx.stroke();
        }

        // Ground texture dots
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        for (let i = 0; i < 40; i++) {
            const dx = ((i * 73 + gx) % this.canvasWidth + this.canvasWidth) % this.canvasWidth;
            const dy = this.groundY + 5 + (i * 37) % 40;
            ctx.beginPath();
            ctx.arc(dx, dy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Runway markers
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        for (let i = 0; i < 5; i++) {
            const rx = ((i * 120 + gx * 0.5) % this.canvasWidth + this.canvasWidth) % this.canvasWidth;
            ctx.fillRect(rx, this.groundY + 2, 30, 3);
        }
    }

    draw(ctx, cameraX, frame) {
        this.drawSky(ctx, frame);
        this.drawClouds(ctx, cameraX, 0);
        this.drawMountains(ctx, cameraX);
        this.drawGround(ctx, cameraX);
        this.drawClouds(ctx, cameraX, 1);
    }
}
