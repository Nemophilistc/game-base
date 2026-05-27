// ============================================================
// collectibles.js - Stars, fuel, boost, shield collectibles
// ============================================================

import { COLLECTIBLES, WORLD } from './config.js';

export class CollectibleManager {
    constructor(canvasWidth, canvasHeight, groundY) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.groundY = groundY;
        this.items = [];
        this.frame = 0;
        this.respawnTimers = [];

        this._spawnAll();
    }

    _spawnAll() {
        this.items = [];
        this.respawnTimers = [];

        // Stars
        for (let i = 0; i < COLLECTIBLES.STAR_COUNT; i++) {
            this.items.push(this._createItem('star', i));
        }
        // Fuel
        for (let i = 0; i < COLLECTIBLES.FUEL_COUNT; i++) {
            this.items.push(this._createItem('fuel', i));
        }
        // Boost
        for (let i = 0; i < COLLECTIBLES.BOOST_COUNT; i++) {
            this.items.push(this._createItem('boost', i));
        }
        // Shield
        for (let i = 0; i < COLLECTIBLES.SHIELD_COUNT; i++) {
            this.items.push(this._createItem('shield', i));
        }
    }

    _createItem(type, index) {
        const yMin = this.canvasHeight * COLLECTIBLES.SPAWN_RANGE_Y_MIN;
        const yMax = this.canvasHeight * COLLECTIBLES.SPAWN_RANGE_Y_MAX;
        return {
            type,
            x: 300 + index * (WORLD.WIDTH - 600) / 8 + Math.random() * 200,
            y: yMin + Math.random() * (yMax - yMin),
            collected: false,
            respawnTimer: 0,
            phase: Math.random() * Math.PI * 2,
            glowPhase: Math.random() * Math.PI * 2,
        };
    }

    reset() {
        this._spawnAll();
    }

    update(planeX) {
        this.frame++;

        this.items.forEach((item, idx) => {
            if (item.collected) {
                item.respawnTimer--;
                if (item.respawnTimer <= 0) {
                    // Respawn near the plane
                    const yMin = this.canvasHeight * COLLECTIBLES.SPAWN_RANGE_Y_MIN;
                    const yMax = this.canvasHeight * COLLECTIBLES.SPAWN_RANGE_Y_MAX;
                    item.x = planeX + (Math.random() > 0.5 ? 1 : -1) * (300 + Math.random() * 400);
                    item.y = yMin + Math.random() * (yMax - yMin);
                    item.collected = false;
                    item.phase = Math.random() * Math.PI * 2;
                }
            }
        });
    }

    checkCollision(planeX, planeY, planeW, planeH) {
        const collected = [];
        this.items.forEach(item => {
            if (item.collected) return;
            const dx = planeX - item.x;
            const dy = planeY - item.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const hitSize = item.type === 'star' ? COLLECTIBLES.STAR_SIZE :
                           item.type === 'fuel' ? COLLECTIBLES.FUEL_SIZE :
                           item.type === 'boost' ? COLLECTIBLES.BOOST_SIZE :
                           COLLECTIBLES.SHIELD_SIZE;
            if (dist < hitSize + planeW * 0.3) {
                item.collected = true;
                item.respawnTimer = COLLECTIBLES.RESPAWN_INTERVAL;
                collected.push(item.type);
            }
        });
        return collected;
    }

    draw(ctx, cameraX) {
        this.items.forEach(item => {
            if (item.collected) return;

            const sx = item.x - cameraX;
            const sy = item.y + Math.sin(this.frame * 0.04 + item.phase) * 5;

            ctx.save();

            switch (item.type) {
                case 'star':
                    this._drawStar(ctx, sx, sy);
                    break;
                case 'fuel':
                    this._drawFuel(ctx, sx, sy);
                    break;
                case 'boost':
                    this._drawBoost(ctx, sx, sy);
                    break;
                case 'shield':
                    this._drawShield(ctx, sx, sy);
                    break;
            }

            ctx.restore();
        });
    }

    _drawStar(ctx, x, y) {
        const s = COLLECTIBLES.STAR_SIZE;
        const glow = Math.sin(this.frame * 0.06 + y * 0.01) * 0.3 + 0.7;

        // Glow
        ctx.shadowColor = '#ffdd00';
        ctx.shadowBlur = 12 * glow;

        // Star shape
        ctx.fillStyle = '#ffdd00';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
            const px = x + Math.cos(angle) * s * 0.5;
            const py = y + Math.sin(angle) * s * 0.5;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner highlight
        ctx.fillStyle = '#fff8cc';
        ctx.beginPath();
        ctx.arc(x - s * 0.08, y - s * 0.08, s * 0.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    _drawFuel(ctx, x, y) {
        const s = COLLECTIBLES.FUEL_SIZE;
        const glow = Math.sin(this.frame * 0.05) * 0.2 + 0.8;

        // Glow
        ctx.shadowColor = '#44ff44';
        ctx.shadowBlur = 10 * glow;

        // Barrel body
        ctx.fillStyle = '#44aa44';
        ctx.beginPath();
        ctx.roundRect(x - s * 0.35, y - s * 0.45, s * 0.7, s * 0.9, 3);
        ctx.fill();

        // Barrel stripes
        ctx.fillStyle = '#338833';
        ctx.fillRect(x - s * 0.35, y - s * 0.15, s * 0.7, s * 0.08);
        ctx.fillRect(x - s * 0.35, y + s * 0.1, s * 0.7, s * 0.08);

        // Label
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${s * 0.3}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('F', x, y + s * 0.05);

        // Cap
        ctx.fillStyle = '#66cc66';
        ctx.fillRect(x - s * 0.1, y - s * 0.5, s * 0.2, s * 0.1);

        ctx.shadowBlur = 0;
    }

    _drawBoost(ctx, x, y) {
        const s = COLLECTIBLES.BOOST_SIZE;
        const glow = Math.sin(this.frame * 0.08) * 0.3 + 0.7;

        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 12 * glow;

        // Lightning bolt
        ctx.fillStyle = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(x + s * 0.1, y - s * 0.5);
        ctx.lineTo(x - s * 0.2, y - s * 0.05);
        ctx.lineTo(x + s * 0.05, y - s * 0.05);
        ctx.lineTo(x - s * 0.1, y + s * 0.5);
        ctx.lineTo(x + s * 0.2, y + s * 0.05);
        ctx.lineTo(x - s * 0.05, y + s * 0.05);
        ctx.closePath();
        ctx.fill();

        // Highlight
        ctx.fillStyle = '#88ccff';
        ctx.beginPath();
        ctx.moveTo(x + s * 0.05, y - s * 0.35);
        ctx.lineTo(x - s * 0.1, y - s * 0.05);
        ctx.lineTo(x + s * 0.02, y - s * 0.05);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;
    }

    _drawShield(ctx, x, y) {
        const s = COLLECTIBLES.SHIELD_SIZE;
        const glow = Math.sin(this.frame * 0.07) * 0.3 + 0.7;
        const pulse = Math.sin(this.frame * 0.04) * 0.1 + 0.9;

        ctx.shadowColor = '#44ffff';
        ctx.shadowBlur = 12 * glow;

        // Shield shape
        ctx.fillStyle = '#44cccc';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.5 * pulse);
        ctx.quadraticCurveTo(x + s * 0.45, y - s * 0.3, x + s * 0.4, y + s * 0.1);
        ctx.quadraticCurveTo(x + s * 0.2, y + s * 0.45, x, y + s * 0.5 * pulse);
        ctx.quadraticCurveTo(x - s * 0.2, y + s * 0.45, x - s * 0.4, y + s * 0.1);
        ctx.quadraticCurveTo(x - s * 0.45, y - s * 0.3, x, y - s * 0.5 * pulse);
        ctx.fill();

        // Inner shine
        ctx.fillStyle = '#88ffff';
        ctx.beginPath();
        ctx.moveTo(x, y - s * 0.3 * pulse);
        ctx.quadraticCurveTo(x + s * 0.2, y - s * 0.15, x + s * 0.15, y + s * 0.05);
        ctx.quadraticCurveTo(x + s * 0.05, y + s * 0.2, x, y + s * 0.25 * pulse);
        ctx.quadraticCurveTo(x - s * 0.05, y + s * 0.1, x - s * 0.1, y);
        ctx.quadraticCurveTo(x - s * 0.15, y - s * 0.1, x, y - s * 0.3 * pulse);
        ctx.fill();

        ctx.shadowBlur = 0;
    }
}
