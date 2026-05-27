// ============================================================
// ui.js - UI rendering: HUD, crafting menu, overlays
// ============================================================

import {
    MAX_HEALTH, MAX_HUNGER, MAX_THIRST,
    RESOURCE_NAMES, RESOURCE_COLORS,
    STRUCTURE_NAMES, STRUCTURE_COLORS,
    INVENTORY_SLOTS,
    UI_BG, UI_BORDER, UI_TEXT, UI_ACCENT, UI_DANGER, UI_WARNING,
    TILE_SIZE,
} from './config.js';
import { getAvailableRecipes, formatRecipe } from './crafting.js';

// ============ Drawing helpers ============

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawGlassPanel(ctx, x, y, w, h) {
    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Glass background
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = UI_BG;
    ctx.fill();

    // Border
    ctx.shadowBlur = 0;
    ctx.strokeStyle = UI_BORDER;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Highlight
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, 'rgba(255,255,255,0.06)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.restore();
}

function drawBar(ctx, x, y, w, h, value, max, color, icon) {
    const ratio = Math.max(0, value / max);
    // BG
    roundRect(ctx, x, y, w, h, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fill();
    // Fill
    if (ratio > 0) {
        roundRect(ctx, x, y, w * ratio, h, 3);
        ctx.fillStyle = color;
        ctx.fill();
    }
    // Border
    roundRect(ctx, x, y, w, h, 3);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Icon
    if (icon) {
        ctx.fillStyle = '#fff';
        ctx.font = `${h - 2}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(icon, x + 4, y + h - 3);
    }
    // Text
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${h - 3}px sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(value)}`, x + w - 4, y + h - 3);
}

// ============ HUD ============

export function drawHUD(ctx, player, world, canvasW, canvasH, craftingMenu) {
    ctx.save();

    // ---- Top-left: Stats ----
    const panelX = 10, panelY = 10;
    const panelW = 200, panelH = 110;
    drawGlassPanel(ctx, panelX, panelY, panelW, panelH);

    // Health
    const hpColor = player.health > 60 ? '#4caf50' : player.health > 30 ? '#ff9800' : '#f44336';
    drawBar(ctx, panelX + 10, panelY + 10, 180, 16, player.health, MAX_HEALTH, hpColor, '♥');
    // Hunger
    const hungerColor = player.hunger > 40 ? '#8d6e63' : '#f44336';
    drawBar(ctx, panelX + 10, panelY + 32, 180, 14, player.hunger, MAX_HUNGER, hungerColor, '🍖');
    // Thirst
    const thirstColor = player.thirst > 40 ? '#2196f3' : '#f44336';
    drawBar(ctx, panelX + 10, panelY + 52, 180, 14, player.thirst, MAX_THIRST, thirstColor, '💧');

    // Day info
    ctx.fillStyle = UI_TEXT;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`第 ${world.dayCount} 天`, panelX + 10, panelY + 85);

    const todColor = world.isNight() ? '#74b9ff' : world.isDusk() ? '#fdcb6e' : '#f1c40f';
    ctx.fillStyle = todColor;
    ctx.font = '12px sans-serif';
    ctx.fillText(`${world.getTimeOfDayName()} ${world.getTimeString()}`, panelX + 10, panelY + 102);

    // Weather indicator
    if (world.weather !== 'clear') {
        const weatherIcon = world.weather === 'rain' ? '🌧' : '⛈';
        ctx.fillStyle = UI_WARNING;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(weatherIcon, panelX + panelW - 10, panelY + 102);
    }

    // ---- Bottom-center: Inventory ----
    drawInventoryBar(ctx, player, canvasW, canvasH);

    // ---- Top-right: Tools ----
    drawToolsPanel(ctx, player, canvasW);

    // ---- Bottom-right: Action hints ----
    drawActionHints(ctx, player, world, canvasW, canvasH);

    // ---- Crafting menu (center) ----
    if (craftingMenu.isVisible()) {
        drawCraftingMenu(ctx, player, canvasW, canvasH, craftingMenu);
    }

    // ---- Controls hint ----
    ctx.fillStyle = 'rgba(200,220,200,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WASD移动 | E采集/互动 | C制作 | F放置/吃 | Space攻击 | Q钓鱼', canvasW / 2, canvasH - 5);

    ctx.restore();
}

function drawInventoryBar(ctx, player, canvasW, canvasH) {
    const slotSize = 44;
    const gap = 4;
    const totalW = INVENTORY_SLOTS * slotSize + (INVENTORY_SLOTS - 1) * gap;
    const startX = (canvasW - totalW) / 2;
    const startY = canvasH - slotSize - 15;

    drawGlassPanel(ctx, startX - 6, startY - 6, totalW + 12, slotSize + 12);

    for (let i = 0; i < INVENTORY_SLOTS; i++) {
        const x = startX + i * (slotSize + gap);
        const y = startY;

        // Slot bg
        roundRect(ctx, x, y, slotSize, slotSize, 6);
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();

        if (i < player.inventory.length) {
            const item = player.inventory[i];
            const color = RESOURCE_COLORS[item.type] || STRUCTURE_COLORS[item.type] || '#aaa';
            const name = RESOURCE_NAMES[item.type] || STRUCTURE_NAMES[item.type] || item.type;

            // Item icon (colored circle)
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x + slotSize / 2, y + slotSize / 2 - 4, 12, 0, Math.PI * 2);
            ctx.fill();

            // Item letter
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(name[0], x + slotSize / 2, y + slotSize / 2 + 1);

            // Count
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(item.count, x + slotSize - 4, y + slotSize - 4);
        }

        // Slot number
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(i + 1, x + 3, y + 12);
    }
}

function drawToolsPanel(ctx, player, canvasW) {
    const tools = [];
    if (player.tools.axe) tools.push({ name: '石斧', icon: '🪓', color: '#8d6e63' });
    if (player.tools.pickaxe) tools.push({ name: '石镐', icon: '⛏', color: '#78909c' });
    if (player.tools.fishingRod) tools.push({ name: '钓鱼竿', icon: '🎣', color: '#5d4037' });

    if (tools.length === 0) return;

    const panelW = 120;
    const panelH = 24 + tools.length * 22;
    const px = canvasW - panelW - 10;
    const py = 10;

    drawGlassPanel(ctx, px, py, panelW, panelH);

    ctx.fillStyle = UI_ACCENT;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('工具', px + panelW / 2, py + 16);

    tools.forEach((t, i) => {
        ctx.fillStyle = t.color;
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${t.icon} ${t.name}`, px + 10, py + 36 + i * 22);
    });
}

function drawActionHints(ctx, player, world, canvasW, canvasH) {
    const hints = [];

    // Check what player can interact with
    const nearResource = world.getResourceAt(player.x, player.y, 48);
    if (nearResource) {
        hints.push('[E] 采集');
    }

    const nearCampfire = world.structures.find(s =>
        s.type === 'campfire' &&
        Math.abs(s.x * 32 + 16 - player.x) < 48 &&
        Math.abs(s.y * 32 + 16 - player.y) < 48
    );
    if (nearCampfire) {
        if (player.getItemCount('rawMeat') > 0) hints.push('[F] 烹饪生肉');
        if (player.getItemCount('fish') > 0) hints.push('[F] 烹饪鱼');
    }

    // Check for food to eat
    const foods = ['berry', 'cookedMeat', 'cookedFish'];
    for (const f of foods) {
        if (player.getItemCount(f) > 0) {
            hints.push(`[F] 吃${RESOURCE_NAMES[f]}`);
            break;
        }
    }

    // Place structure hints
    const placeable = ['campfire', 'shelter', 'farm', 'storage', 'boat'];
    for (const p of placeable) {
        if (player.getItemCount(p) > 0) {
            hints.push(`[R] 放置${STRUCTURE_NAMES[p]}`);
        }
    }

    // Fishing
    if (player.tools.fishingRod && world.isAdjacentToWater(player.x, player.y)) {
        hints.push('[Q] 钓鱼');
    }

    if (hints.length === 0) return;

    const panelW = 140;
    const panelH = 20 + hints.length * 18;
    const px = canvasW - panelW - 10;
    const py = canvasH - panelH - 70;

    drawGlassPanel(ctx, px, py, panelW, panelH);

    ctx.fillStyle = UI_TEXT;
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    hints.forEach((h, i) => {
        ctx.fillText(h, px + 10, py + 18 + i * 18);
    });
}

function drawCraftingMenu(ctx, player, canvasW, canvasH, craftingMenu) {
    const recipes = getAvailableRecipes(player);
    const menuW = 360;
    const menuH = 340;
    const mx = (canvasW - menuW) / 2;
    const my = (canvasH - menuH) / 2;

    drawGlassPanel(ctx, mx, my, menuW, menuH);

    // Title
    ctx.fillStyle = UI_ACCENT;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('制 作', mx + menuW / 2, my + 28);

    // Recipe list
    const listY = my + 44;
    const itemH = 36;
    const sel = craftingMenu.getSelectedIndex();

    for (let i = 0; i < recipes.length; i++) {
        const r = recipes[i];
        const iy = listY + i * itemH;
        if (iy + itemH > my + menuH - 10) break;

        // Selection highlight
        if (i === sel) {
            roundRect(ctx, mx + 8, iy, menuW - 16, itemH - 2, 6);
            ctx.fillStyle = 'rgba(106, 191, 75, 0.15)';
            ctx.fill();
            ctx.strokeStyle = UI_ACCENT;
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        // Recipe name
        ctx.fillStyle = r.owned ? '#888' : r.canCraft ? UI_TEXT : '#666';
        ctx.font = r.owned ? '13px sans-serif' : 'bold 14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r.name, mx + 16, iy + 16);

        // Type tag
        ctx.fillStyle = r.type === 'tool' ? '#74b9ff' : '#fdcb6e';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        const tag = r.type === 'tool' ? '工具' : '建筑';
        ctx.fillText(`[${tag}]`, mx + 70, iy + 16);

        // Owned marker
        if (r.owned) {
            ctx.fillStyle = '#888';
            ctx.font = '12px sans-serif';
            ctx.fillText('已拥有', mx + 110, iy + 16);
        }

        // Ingredients
        const ingStr = Object.entries(r.ingredients)
            .map(([t, c]) => {
                const have = player.getItemCount(t);
                const name = RESOURCE_NAMES[t] || t;
                return `${name}${have}/${c}`;
            }).join('  ');
        ctx.fillStyle = r.canCraft ? '#8bc34a' : '#e74c3c';
        ctx.font = '11px sans-serif';
        ctx.fillText(ingStr, mx + 16, iy + 30);

        // Description
        ctx.fillStyle = '#888';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(r.description, mx + menuW - 16, iy + 16);
    }

    // Footer
    ctx.fillStyle = 'rgba(200,220,200,0.5)';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('↑↓选择 | Enter制作 | C关闭', mx + menuW / 2, my + menuH - 10);
}

// ============ Overlays ============

export function drawStartOverlay(ctx, canvasW, canvasH) {
    ctx.save();
    // Dark background
    ctx.fillStyle = 'rgba(10, 20, 10, 0.92)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const cx = canvasW / 2;

    // Title
    ctx.fillStyle = '#4caf50';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('生存岛屿', cx, 120);

    ctx.fillStyle = '#8bc34a';
    ctx.font = '18px sans-serif';
    ctx.fillText('Survival Island', cx, 155);

    // Decorative island
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath();
    ctx.ellipse(cx, 220, 60, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.ellipse(cx, 210, 40, 20, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#795548';
    ctx.beginPath();
    ctx.moveTo(cx - 5, 195);
    ctx.lineTo(cx, 180);
    ctx.lineTo(cx + 5, 195);
    ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(cx, 180, 8, 0, Math.PI * 2);
    ctx.fill();

    // Water
    ctx.fillStyle = '#1565c0';
    ctx.beginPath();
    ctx.ellipse(cx, 240, 80, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Help box
    const helpY = 270;
    const helpW = 400;
    const helpH = 200;
    drawGlassPanel(ctx, cx - helpW / 2, helpY, helpW, helpH);

    ctx.fillStyle = UI_ACCENT;
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('操作说明', cx, helpY + 25);

    const controls = [
        'WASD / 方向键 - 移动',
        'E - 采集资源 / 互动',
        'C - 打开制作菜单',
        'Space - 攻击',
        'Q - 钓鱼（需钓鱼竿）',
        'F - 吃食物 / 烹饪',
        'R - 放置建筑',
        '',
        '白天采集资源，夜晚注意狼群！',
        '建造木筏逃离岛屿即可获胜！',
    ];

    ctx.fillStyle = UI_TEXT;
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    controls.forEach((line, i) => {
        ctx.fillStyle = line.startsWith('建造') || line.startsWith('白天') ? UI_WARNING : UI_TEXT;
        ctx.fillText(line, cx - helpW / 2 + 30, helpY + 50 + i * 16);
    });

    // Start button
    const btnW = 200, btnH = 48;
    const btnX = cx - btnW / 2, btnY = helpY + helpH + 20;

    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fillStyle = '#2e7d32';
    ctx.fill();
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('开始生存', cx, btnY + 32);

    // Version
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.fillText('v1.0', cx, canvasH - 15);

    ctx.restore();
}

export function drawGameOverOverlay(ctx, player, world, canvasW, canvasH, deathReason) {
    ctx.save();
    ctx.fillStyle = 'rgba(30, 10, 10, 0.9)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const cx = canvasW / 2;

    ctx.fillStyle = '#e74c3c';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('你死了', cx, 130);

    ctx.fillStyle = '#bbb';
    ctx.font = '16px sans-serif';
    ctx.fillText(deathReason || '你在荒岛上倒下了...', cx, 170);

    // Stats
    const statsY = 200;
    const stats = [
        { label: '存活天数', value: world.dayCount, color: '#f1c40f' },
        { label: '制作物品', value: player.itemsCrafted, color: '#3498db' },
        { label: '建造建筑', value: player.structuresBuilt, color: '#2ecc71' },
        { label: '击杀动物', value: player.animalsKilled, color: '#e74c3c' },
    ];

    drawGlassPanel(ctx, cx - 150, statsY, 300, stats.length * 36 + 20);

    stats.forEach((s, i) => {
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(s.label, cx - 130, statsY + 28 + i * 36);

        ctx.fillStyle = s.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(s.value, cx + 130, statsY + 30 + i * 36);
    });

    // High score
    const hs = localStorage.getItem('survivalIsland_highScore') || 0;
    if (world.dayCount > hs) {
        localStorage.setItem('survivalIsland_highScore', world.dayCount);
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('新纪录！', cx, statsY + stats.length * 36 + 40);
    } else {
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`最高纪录: ${hs} 天`, cx, statsY + stats.length * 36 + 40);
    }

    // Restart button
    const btnW = 200, btnH = 44;
    const btnX = cx - btnW / 2;
    const btnY = statsY + stats.length * 36 + 60;

    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fillStyle = '#c0392b';
    ctx.fill();
    ctx.strokeStyle = '#e74c3c';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('再来一次', cx, btnY + 30);

    ctx.restore();
}

export function drawWinOverlay(ctx, player, world, canvasW, canvasH) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 30, 10, 0.9)';
    ctx.fillRect(0, 0, canvasW, canvasH);

    const cx = canvasW / 2;

    ctx.fillStyle = '#f1c40f';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('逃离成功！', cx, 130);

    ctx.fillStyle = '#8bc34a';
    ctx.font = '18px sans-serif';
    ctx.fillText('你建造了木筏，成功逃离了荒岛！', cx, 170);

    // Stats
    const statsY = 200;
    const stats = [
        { label: '存活天数', value: world.dayCount, color: '#f1c40f' },
        { label: '制作物品', value: player.itemsCrafted, color: '#3498db' },
        { label: '建造建筑', value: player.structuresBuilt, color: '#2ecc71' },
        { label: '击杀动物', value: player.animalsKilled, color: '#e74c3c' },
    ];

    drawGlassPanel(ctx, cx - 150, statsY, 300, stats.length * 36 + 20);

    stats.forEach((s, i) => {
        ctx.fillStyle = '#888';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(s.label, cx - 130, statsY + 28 + i * 36);

        ctx.fillStyle = s.color;
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(s.value, cx + 130, statsY + 30 + i * 36);
    });

    // Restart button
    const btnW = 200, btnH = 44;
    const btnX = cx - btnW / 2;
    const btnY = statsY + stats.length * 36 + 40;

    roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fillStyle = '#2e7d32';
    ctx.fill();
    ctx.strokeStyle = '#4caf50';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('再玩一次', cx, btnY + 30);

    ctx.restore();
}

// Minimap
export function drawMinimap(ctx, world, player, canvasW, canvasH) {
    const mapSize = 100;
    const mx = canvasW - mapSize - 10;
    const my = canvasH - mapSize - 70;
    const scale = mapSize / (40 * TILE_SIZE);

    drawGlassPanel(ctx, mx - 4, my - 4, mapSize + 8, mapSize + 8);

    // Draw tiles
    const tileScale = mapSize / 40;
    for (let y = 0; y < 40; y++) {
        for (let x = 0; x < 40; x++) {
            const tile = world.tiles[y][x];
            const colors = {
                0: '#1a6b8a', 1: '#d4b96a', 2: '#5a9e4b',
                3: '#2d6b30', 4: '#7a7a7a', 5: '#1a6b8a',
            };
            ctx.fillStyle = colors[tile] || '#000';
            ctx.fillRect(mx + x * tileScale, my + y * tileScale, tileScale + 0.5, tileScale + 0.5);
        }
    }

    // Structures
    for (const s of world.structures) {
        ctx.fillStyle = STRUCTURE_COLORS[s.type] || '#fff';
        ctx.fillRect(mx + s.x * tileScale - 1, my + s.y * tileScale - 1, 3, 3);
    }

    // Player
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(mx + player.x * scale, my + player.y * scale, 3, 0, Math.PI * 2);
    ctx.fill();

    // Campfire lights at night
    if (world.isNight()) {
        for (const s of world.structures) {
            if (s.type === 'campfire') {
                ctx.fillStyle = 'rgba(255,180,50,0.4)';
                ctx.beginPath();
                ctx.arc(mx + s.x * tileScale + tileScale / 2, my + s.y * tileScale + tileScale / 2, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
}

// Notification system
const notifications = [];

export function addNotification(text, color = '#fff') {
    notifications.push({ text, color, time: 3, alpha: 1 });
}

export function updateNotifications(dt) {
    for (let i = notifications.length - 1; i >= 0; i--) {
        notifications[i].time -= dt;
        if (notifications[i].time < 1) {
            notifications[i].alpha = notifications[i].time;
        }
        if (notifications[i].time <= 0) {
            notifications.splice(i, 1);
        }
    }
}

export function drawNotifications(ctx, canvasW) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.font = '15px sans-serif';
    notifications.forEach((n, i) => {
        ctx.globalAlpha = n.alpha;
        ctx.fillStyle = n.color;
        ctx.fillText(n.text, canvasW / 2, 140 + i * 22);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
}
