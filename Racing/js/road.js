// ============================================================
// road.js - 道路渲染（沉浸式场景：天空、山脉、树木、护栏、路面）
// ============================================================

import { W, H, LANE_W, LANES, ROAD_LEFT } from './config.js';

// 路边场景元素（只生成一次）
const sceneryLeft = [];
const sceneryRight = [];
for (let i = 0; i < 20; i++) {
    sceneryLeft.push({ y: i * 50, type: Math.random() < 0.5 ? 'tree' : 'bush', size: 0.7 + Math.random() * 0.6 });
    sceneryRight.push({ y: i * 50, type: Math.random() < 0.4 ? 'tree' : Math.random() < 0.6 ? 'bush' : 'pole', size: 0.7 + Math.random() * 0.6 });
}

function drawScenery(ctx, items, baseX, offset) {
    items.forEach(item => {
        const y = ((item.y + offset) % (H + 100)) - 50;
        const s = item.size;
        if (item.type === 'tree') {
            // 树干
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(baseX - 3 * s, y - 5 * s, 6 * s, 20 * s);
            // 树冠
            ctx.fillStyle = '#2e7d32';
            ctx.beginPath(); ctx.arc(baseX, y - 10 * s, 12 * s, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#388e3c';
            ctx.beginPath(); ctx.arc(baseX - 5 * s, y - 5 * s, 8 * s, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(baseX + 5 * s, y - 7 * s, 9 * s, 0, Math.PI * 2); ctx.fill();
        } else if (item.type === 'bush') {
            ctx.fillStyle = '#33691e';
            ctx.beginPath(); ctx.ellipse(baseX, y, 10 * s, 7 * s, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#558b2f';
            ctx.beginPath(); ctx.ellipse(baseX + 4 * s, y - 2 * s, 7 * s, 5 * s, 0, 0, Math.PI * 2); ctx.fill();
        } else if (item.type === 'pole') {
            ctx.fillStyle = '#757575';
            ctx.fillRect(baseX - 1, y - 15, 2, 30);
            ctx.fillStyle = '#ffc107';
            ctx.beginPath(); ctx.arc(baseX, y - 15, 3, 0, Math.PI * 2); ctx.fill();
        }
    });
}

export function drawRoad(ctx, frameCount, roadSpeed, pickups) {
    const offset = (frameCount * roadSpeed * 2) % 50;

    // === 天空渐变 ===
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.35);
    skyGrad.addColorStop(0, '#0d1b2a');
    skyGrad.addColorStop(0.5, '#1b2838');
    skyGrad.addColorStop(1, '#2d4a3e');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H * 0.35);

    // 星星
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    for (let i = 0; i < 30; i++) {
        const sx = (i * 47 + frameCount * 0.02) % W;
        const sy = (i * 31) % (H * 0.3);
        ctx.fillRect(sx, sy, 1, 1);
    }

    // === 远山 ===
    ctx.fillStyle = '#1a3a2a';
    ctx.beginPath(); ctx.moveTo(0, H * 0.35);
    for (let x = 0; x <= W; x += 20) {
        const mh = Math.sin(x * 0.015 + 1) * 25 + Math.sin(x * 0.03) * 15;
        ctx.lineTo(x, H * 0.35 - mh);
    }
    ctx.lineTo(W, H * 0.35); ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#243b2f';
    ctx.beginPath(); ctx.moveTo(0, H * 0.35);
    for (let x = 0; x <= W; x += 15) {
        const mh = Math.sin(x * 0.02 + 3) * 18 + Math.sin(x * 0.04 + 1) * 10;
        ctx.lineTo(x, H * 0.35 - mh + 15);
    }
    ctx.lineTo(W, H * 0.35); ctx.closePath(); ctx.fill();

    // === 路边草地 ===
    ctx.fillStyle = '#2d5a1e';
    ctx.fillRect(0, H * 0.35, ROAD_LEFT - 8, H * 0.65);
    ctx.fillRect(ROAD_LEFT + LANES * LANE_W + 8, H * 0.35, W - ROAD_LEFT - LANES * LANE_W - 8, H * 0.65);

    // 草地纹理
    ctx.fillStyle = '#3a6b28';
    for (let y = H * 0.35; y < H; y += 12) {
        const lx = Math.sin(y * 0.1 + offset * 0.3) * 3;
        ctx.fillRect(ROAD_LEFT - 30 + lx, y, 18, 2);
        ctx.fillRect(ROAD_LEFT + LANES * LANE_W + 12 + lx, y, 18, 2);
    }

    // === 路边场景 ===
    drawScenery(ctx, sceneryLeft, ROAD_LEFT - 40, offset);
    drawScenery(ctx, sceneryRight, ROAD_LEFT + LANES * LANE_W + 40, offset);

    // === 路面 ===
    // 路肩（灰色）
    ctx.fillStyle = '#555';
    ctx.fillRect(ROAD_LEFT - 8, 0, 8, H);
    ctx.fillRect(ROAD_LEFT + LANES * LANE_W, 0, 8, H);
    // 路肩纹理（坑洼标记）
    ctx.fillStyle = '#666';
    for (let y = 0; y < H; y += 15) {
        const ry = (y + offset * 0.5) % H;
        ctx.fillRect(ROAD_LEFT - 8, ry, 8, 2);
        ctx.fillRect(ROAD_LEFT + LANES * LANE_W, ry, 8, 2);
    }

    // 主路面
    const roadGrad = ctx.createLinearGradient(ROAD_LEFT, 0, ROAD_LEFT + LANES * LANE_W, 0);
    roadGrad.addColorStop(0, '#2a2a2a');
    roadGrad.addColorStop(0.1, '#333');
    roadGrad.addColorStop(0.5, '#383838');
    roadGrad.addColorStop(0.9, '#333');
    roadGrad.addColorStop(1, '#2a2a2a');
    ctx.fillStyle = roadGrad;
    ctx.fillRect(ROAD_LEFT, 0, LANES * LANE_W, H);

    // 路面噪点纹理
    ctx.fillStyle = 'rgba(255,255,255,0.02)';
    for (let i = 0; i < 60; i++) {
        const nx = ROAD_LEFT + Math.random() * LANES * LANE_W;
        const ny = Math.random() * H;
        ctx.fillRect(nx, ny, 2, 1);
    }

    // === 车道虚线 ===
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < LANES; i++) {
        ctx.beginPath();
        ctx.moveTo(ROAD_LEFT + i * LANE_W, -20 + offset);
        ctx.lineTo(ROAD_LEFT + i * LANE_W, H + 20);
        ctx.stroke();
    }
    ctx.setLineDash([]);

    // === 路边白线 ===
    ctx.fillStyle = '#fff';
    ctx.fillRect(ROAD_LEFT - 2, 0, 2, H);
    ctx.fillRect(ROAD_LEFT + LANES * LANE_W, 0, 2, H);

    // === 护栏 ===
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 3;
    // 左护栏
    for (let y = 0; y < H; y += 30) {
        const ry = (y + offset) % H;
        ctx.fillStyle = '#aaa';
        ctx.fillRect(ROAD_LEFT - 14, ry, 3, 18);
    }
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ROAD_LEFT - 12, 0); ctx.lineTo(ROAD_LEFT - 12, H); ctx.stroke();
    // 右护栏
    for (let y = 0; y < H; y += 30) {
        const ry = (y + offset) % H;
        ctx.fillStyle = '#aaa';
        ctx.fillRect(ROAD_LEFT + LANES * LANE_W + 11, ry, 3, 18);
    }
    ctx.beginPath(); ctx.moveTo(ROAD_LEFT + LANES * LANE_W + 12, 0); ctx.lineTo(ROAD_LEFT + LANES * LANE_W + 12, H); ctx.stroke();

    // === 道具 ===
    pickups.forEach(p => {
        const pulse = Math.sin(frameCount * 0.1) * 0.2 + 1;
        ctx.fillStyle = p.type === 'heal' ? '#4caf5060' : '#ffeb3b60';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * pulse * 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = p.type === 'heal' ? '#4caf50' : '#ffeb3b';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '14px Arial'; ctx.textAlign = 'center';
        ctx.fillText(p.type === 'heal' ? '❤' : '⚡', p.x, p.y + 5);
    });
}
