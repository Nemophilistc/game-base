// ============================================================
// resources.js - Resource spawning and gathering visuals
// ============================================================

import { TILE_SIZE } from './config.js';

// Resource rendering
export function drawResources(ctx, world, camX, camY, canvasW, canvasH) {
    const startCol = Math.max(0, Math.floor(camX / TILE_SIZE) - 1);
    const startRow = Math.max(0, Math.floor(camY / TILE_SIZE) - 1);
    const endCol = Math.min(39, Math.ceil((camX + canvasW) / TILE_SIZE) + 1);
    const endRow = Math.min(39, Math.ceil((camY + canvasH) / TILE_SIZE) + 1);

    for (const res of world.resources) {
        if (res.x < startCol || res.x > endCol || res.y < startRow || res.y > endRow) continue;
        const sx = res.x * TILE_SIZE + TILE_SIZE / 2 - camX;
        const sy = res.y * TILE_SIZE + TILE_SIZE / 2 - camY;
        drawResource(ctx, res.type, sx, sy, res.hp / res.maxHp);
    }
}

function drawResource(ctx, type, x, y, hpRatio) {
    ctx.save();
    if (type === 'tree') {
        // Trunk
        ctx.fillStyle = '#5d3a1a';
        ctx.fillRect(x - 3, y - 2, 6, 10);
        // Crown - darker when damaged
        const green = Math.floor(100 + hpRatio * 80);
        ctx.fillStyle = `rgb(30, ${green}, 30)`;
        ctx.beginPath();
        ctx.arc(x, y - 8, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(20, ${green - 20}, 20)`;
        ctx.beginPath();
        ctx.arc(x - 4, y - 6, 8, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'rock') {
        const gray = Math.floor(100 + hpRatio * 50);
        ctx.fillStyle = `rgb(${gray}, ${gray}, ${gray + 10})`;
        ctx.beginPath();
        ctx.moveTo(x - 10, y + 5);
        ctx.lineTo(x - 6, y - 8);
        ctx.lineTo(x + 4, y - 10);
        ctx.lineTo(x + 10, y - 3);
        ctx.lineTo(x + 8, y + 5);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,0.15)`;
        ctx.beginPath();
        ctx.moveTo(x - 4, y - 6);
        ctx.lineTo(x + 2, y - 8);
        ctx.lineTo(x + 6, y - 2);
        ctx.lineTo(x, y);
        ctx.closePath();
        ctx.fill();
    } else if (type === 'bush') {
        ctx.fillStyle = '#3a7a20';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2d6018';
        ctx.beginPath();
        ctx.arc(x + 5, y - 2, 6, 0, Math.PI * 2);
        ctx.fill();
        // Berries
        ctx.fillStyle = '#c44569';
        ctx.beginPath();
        ctx.arc(x - 3, y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + 4, y - 1, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();
}

// Draw structures
export function drawStructures(ctx, world, camX, camY, canvasW, canvasH) {
    for (const s of world.structures) {
        const sx = s.x * TILE_SIZE + TILE_SIZE / 2;
        const sy = s.y * TILE_SIZE + TILE_SIZE / 2;
        const dx = sx - camX, dy = sy - camY;
        if (dx < -48 || dy < -48 || dx > canvasW + 48 || dy > canvasH + 48) continue;
        drawStructure(ctx, s.type, dx, dy, s.hp / s.maxHp, s);
    }
}

function drawStructure(ctx, type, x, y, hpRatio, struct) {
    ctx.save();
    if (type === 'campfire') {
        // Base stones
        ctx.fillStyle = '#666';
        for (let i = 0; i < 6; i++) {
            const angle = i * Math.PI / 3;
            ctx.beginPath();
            ctx.arc(x + Math.cos(angle) * 10, y + Math.sin(angle) * 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        // Fire
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(x, y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(x, y - 4, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (type === 'shelter') {
        // Tent shape
        ctx.fillStyle = '#8d6e63';
        ctx.beginPath();
        ctx.moveTo(x - 18, y + 12);
        ctx.lineTo(x, y - 14);
        ctx.lineTo(x + 18, y + 12);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#6d4c41';
        ctx.beginPath();
        ctx.moveTo(x - 14, y + 12);
        ctx.lineTo(x, y - 8);
        ctx.lineTo(x + 14, y + 12);
        ctx.closePath();
        ctx.fill();
        // Door
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(x - 4, y + 2, 8, 10);
    } else if (type === 'farm') {
        // Tilled soil
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(x - 14, y - 10, 28, 20);
        // Crops
        ctx.fillStyle = '#7cb342';
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 4; col++) {
                ctx.fillRect(x - 12 + col * 7, y - 8 + row * 7, 3, 5);
            }
        }
    } else if (type === 'storage') {
        // Chest
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x - 12, y - 8, 24, 16);
        ctx.fillStyle = '#6d4c41';
        ctx.fillRect(x - 12, y - 8, 24, 4);
        ctx.fillStyle = '#ffc107';
        ctx.fillRect(x - 3, y - 4, 6, 6);
    } else if (type === 'boat') {
        // Boat hull
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.moveTo(x - 16, y);
        ctx.lineTo(x - 12, y + 10);
        ctx.lineTo(x + 12, y + 10);
        ctx.lineTo(x + 16, y);
        ctx.closePath();
        ctx.fill();
        // Mast
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x - 1, y - 16, 3, 18);
        // Sail
        ctx.fillStyle = '#e8e8e8';
        ctx.beginPath();
        ctx.moveTo(x + 2, y - 14);
        ctx.lineTo(x + 14, y - 6);
        ctx.lineTo(x + 2, y - 2);
        ctx.closePath();
        ctx.fill();
    }

    // Health bar for damaged structures
    if (hpRatio < 1) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x - 16, y + 16, 32, 4);
        ctx.fillStyle = hpRatio > 0.5 ? '#4caf50' : hpRatio > 0.25 ? '#ff9800' : '#f44336';
        ctx.fillRect(x - 16, y + 16, 32 * hpRatio, 4);
    }
    ctx.restore();
}

// Draw animals
export function drawAnimals(ctx, world, camX, camY, canvasW, canvasH) {
    for (const a of world.animals) {
        const dx = a.x - camX, dy = a.y - camY;
        if (dx < -32 || dy < -32 || dx > canvasW + 32 || dy > canvasH + 32) continue;
        drawAnimal(ctx, a, dx, dy);
    }
}

function drawAnimal(ctx, animal, x, y) {
    ctx.save();
    if (animal.type === 'rabbit') {
        // Body
        ctx.fillStyle = '#c4a882';
        ctx.beginPath();
        ctx.ellipse(x, y + 2, 7, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.beginPath();
        ctx.arc(x + 5, y - 2, 4, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = '#b09070';
        ctx.fillRect(x + 3, y - 9, 2, 6);
        ctx.fillRect(x + 6, y - 8, 2, 5);
        // Eye
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x + 7, y - 3, 1, 0, Math.PI * 2);
        ctx.fill();
        // Tail
        ctx.fillStyle = '#ddd';
        ctx.beginPath();
        ctx.arc(x - 6, y, 2, 0, Math.PI * 2);
        ctx.fill();
    } else if (animal.type === 'wolf') {
        // Body
        ctx.fillStyle = '#555';
        ctx.beginPath();
        ctx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        // Head
        ctx.fillStyle = '#444';
        ctx.beginPath();
        ctx.ellipse(x + 8, y - 3, 6, 5, -0.3, 0, Math.PI * 2);
        ctx.fill();
        // Ears
        ctx.fillStyle = '#333';
        ctx.beginPath();
        ctx.moveTo(x + 6, y - 8);
        ctx.lineTo(x + 8, y - 14);
        ctx.lineTo(x + 10, y - 8);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(x + 10, y - 7);
        ctx.lineTo(x + 12, y - 13);
        ctx.lineTo(x + 14, y - 7);
        ctx.fill();
        // Eyes - red at night
        ctx.fillStyle = '#c0392b';
        ctx.beginPath();
        ctx.arc(x + 10, y - 4, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Mouth
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 12, y - 1);
        ctx.lineTo(x + 15, y);
        ctx.stroke();
        // Tail
        ctx.fillStyle = '#666';
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.quadraticCurveTo(x - 14, y - 6, x - 12, y - 10);
        ctx.lineWidth = 3;
        ctx.strokeStyle = '#666';
        ctx.stroke();
    }

    // Health bar
    if (animal.hp < animal.maxHp) {
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x - 12, y - 16, 24, 3);
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x - 12, y - 16, 24 * (animal.hp / animal.maxHp), 3);
    }
    ctx.restore();
}
