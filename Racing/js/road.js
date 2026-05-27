// ============================================================
// road.js - 道路渲染（车道线、路边、道具）
// ============================================================

import { W, H, LANE_W, LANES, ROAD_LEFT } from './config.js';

/**
 * 绘制道路背景、车道线、路边、道具
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} frameCount
 * @param {number} roadSpeed
 * @param {Array} pickups
 */
export function drawRoad(ctx, frameCount, roadSpeed, pickups) {
    // 路面背景
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#222';
    ctx.fillRect(ROAD_LEFT, 0, LANES * LANE_W, H);

    // 车道虚线
    const offset = (frameCount * roadSpeed) % 40;
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(ROAD_LEFT + i * LANE_W, -20 + offset);
        ctx.lineTo(ROAD_LEFT + i * LANE_W, H + 20);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // 路边红线
    ctx.fillStyle = '#f44336';
    ctx.fillRect(ROAD_LEFT - 4, 0, 4, H);
    ctx.fillRect(ROAD_LEFT + LANES * LANE_W, 0, 4, H);

    // 道具
    pickups.forEach(p => {
        const pulse = Math.sin(frameCount * 0.1) * 0.2 + 1;
        // 外圈光晕
        ctx.fillStyle = p.type === 'heal' ? '#4caf5060' : '#ffeb3b60';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse * 1.3, 0, Math.PI * 2);
        ctx.fill();
        // 内圈
        ctx.fillStyle = p.type === 'heal' ? '#4caf50' : '#ffeb3b';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2);
        ctx.fill();
        // 图标
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(p.type === 'heal' ? '❤' : '⚡', p.x, p.y + 5);
    });
}
