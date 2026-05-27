// ============================================================
// car.js - 车辆绘制与创建
// ============================================================

import { ROAD_LEFT, LANE_W, LANES, CAR_COLORS, H } from './config.js';

// roundRect 兼容性 polyfill
function ensureRoundRect(ctx) {
    if (!ctx.roundRect) {
        ctx.roundRect = function (x, y, w, h, radii) {
            const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? radii[0] : 0);
            this.moveTo(x + r, y);
            this.lineTo(x + w - r, y);
            this.quadraticCurveTo(x + w, y, x + w, y + r);
            this.lineTo(x + w, y + h - r);
            this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            this.lineTo(x + r, y + h);
            this.quadraticCurveTo(x, y + h, x, y + h - r);
            this.lineTo(x, y + r);
            this.quadraticCurveTo(x, y, x + r, y);
            this.closePath();
        };
    }
}

/**
 * 绘制一辆车
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {string} color
 * @param {boolean} isPlayer
 */
export function drawCar(ctx, x, y, color, isPlayer) {
    ensureRoundRect(ctx);
    ctx.save();
    ctx.translate(x, y);

    // 车身
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(-18, -30, 36, 60, 8);
    ctx.fill();

    // 挡风玻璃
    ctx.fillStyle = isPlayer ? 'rgba(100,200,255,0.5)' : 'rgba(0,0,0,0.4)';
    ctx.fillRect(-14, -20, 28, 15);

    // 车顶
    ctx.fillStyle = isPlayer ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)';
    ctx.fillRect(-12, -5, 24, 20);

    // 轮胎
    ctx.fillStyle = '#222';
    ctx.fillRect(-20, -25, 6, 14);
    ctx.fillRect(14, -25, 6, 14);
    ctx.fillRect(-20, 12, 6, 14);
    ctx.fillRect(14, 12, 6, 14);

    // 前灯（仅玩家）
    if (isPlayer) {
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath(); ctx.arc(-10, -30, 4, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(10, -30, 4, 0, Math.PI * 2); ctx.fill();
    }

    // 尾灯
    ctx.fillStyle = '#f44336';
    ctx.fillRect(-14, 26, 8, 4);
    ctx.fillRect(6, 26, 8, 4);

    ctx.restore();
}

/**
 * 创建玩家对象
 * @returns {object}
 */
export function createPlayer() {
    const lane = 2;
    return {
        lane,
        x: ROAD_LEFT + lane * LANE_W + LANE_W / 2,
        y: H - 100,
        w: 40,
        h: 70,
        color: '#fff',
        invincible: 0
    };
}

/**
 * 创建敌车
 * @param {number} roadSpeed
 * @param {Array} existingCars
 * @returns {object|null}
 */
export function spawnCar(roadSpeed, existingCars) {
    const lane = Math.floor(Math.random() * LANES);
    if (existingCars.some(c => c.lane === lane && c.y < 100)) return null;
    const color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    return {
        lane,
        x: ROAD_LEFT + lane * LANE_W + LANE_W / 2,
        y: -80,
        w: 40,
        h: 65,
        color,
        speed: roadSpeed * 0.3 + Math.random() * 0.5,
        passed: false
    };
}

/**
 * 创建道具
 * @param {Array} existingPickups
 * @returns {object|null}
 */
export function spawnPickup(existingPickups) {
    const lane = Math.floor(Math.random() * LANES);
    if (existingPickups.some(p => p.lane === lane && p.y < 100)) return null;
    const type = Math.random() < 0.3 ? 'heal' : 'boost';
    return {
        lane,
        x: ROAD_LEFT + lane * LANE_W + LANE_W / 2,
        y: -30,
        type,
        r: 12
    };
}
