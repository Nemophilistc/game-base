// ============================================
// ui.js - UI系统 (小地图/状态栏/背包/战斗日志)
// ============================================

import { TILE, TILE_COLORS, TILE_CHARS, TILE_SIZE, CANVAS_TILES_X, CANVAS_TILES_Y, COLORS, STAT_NAMES } from './config.js';

// 绘制主游戏画面
export function renderGame(ctx, map, player, enemies, items, visible, explored, camera) {
  const w = CANVAS_TILES_X;
  const h = CANVAS_TILES_Y;

  // 清空画布
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 计算相机偏移
  const camX = camera.x;
  const camY = camera.y;

  // 绘制瓦片
  for (let sy = 0; sy < h; sy++) {
    for (let sx = 0; sx < w; sx++) {
      const mx = sx + camX;
      const my = sy + camY;

      if (my < 0 || my >= map.length || mx < 0 || mx >= map[0].length) continue;

      const tile = map[my][mx];
      const key = `${mx},${my}`;
      const isVisible = visible.has(key);
      const isExplored = explored.has(key);

      if (!isVisible && !isExplored) continue;

      const tc = TILE_COLORS[tile] || TILE_COLORS[TILE.WALL];
      const char = TILE_CHARS[tile] || '#';

      const px = sx * TILE_SIZE;
      const py = sy * TILE_SIZE;

      // 背景色
      ctx.fillStyle = isVisible ? tc.visible : tc.explored;
      ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);

      // 字符
      if (isVisible) {
        ctx.fillStyle = tc.fg;
        ctx.font = `${TILE_SIZE - 4}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
      }
    }
  }

  // 绘制道具
  for (const item of items) {
    const key = `${item.x},${item.y}`;
    if (!visible.has(key)) continue;
    const sx = item.x - camX;
    const sy = item.y - camY;
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

    const px = sx * TILE_SIZE;
    const py = sy * TILE_SIZE;
    ctx.fillStyle = item.color || '#ffffff';
    ctx.font = `bold ${TILE_SIZE - 2}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.char || '?', px + TILE_SIZE / 2, py + TILE_SIZE / 2);
  }

  // 绘制怪物
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const key = `${enemy.x},${enemy.y}`;
    if (!visible.has(key)) continue;
    const sx = enemy.x - camX;
    const sy = enemy.y - camY;
    if (sx < 0 || sx >= w || sy < 0 || sy >= h) continue;

    const px = sx * TILE_SIZE;
    const py = sy * TILE_SIZE;

    // 怪物字符
    ctx.fillStyle = enemy.color;
    ctx.font = `bold ${TILE_SIZE - 2}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(enemy.char, px + TILE_SIZE / 2, py + TILE_SIZE / 2);

    // 血条 (如果受伤)
    if (enemy.hp < enemy.maxHp) {
      const barW = TILE_SIZE - 2;
      const barH = 3;
      const barX = px + 1;
      const barY = py - 2;
      ctx.fillStyle = '#333';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = COLORS.enemyHealth;
      ctx.fillRect(barX, barY, barW * (enemy.hp / enemy.maxHp), barH);
    }
  }

  // 绘制玩家
  const playerSX = player.x - camX;
  const playerSY = player.y - camY;
  if (playerSX >= 0 && playerSX < w && playerSY >= 0 && playerSY < h) {
    const px = playerSX * TILE_SIZE;
    const py = playerSY * TILE_SIZE;
    ctx.fillStyle = player.color;
    ctx.font = `bold ${TILE_SIZE}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(player.char, px + TILE_SIZE / 2, py + TILE_SIZE / 2);
  }
}

// 绘制状态栏
export function renderStatusBar(ctx, player, canvasWidth) {
  const barH = 60;
  const y = 0;

  // 背景
  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(0, y, canvasWidth, barH);
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(0, y, canvasWidth, barH);

  ctx.font = '13px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  let x = 10;
  const lineH = 18;
  const line1 = y + 14;
  const line2 = y + 32;
  const line3 = y + 50;

  // 第一行: 名字 等级 经验
  ctx.fillStyle = COLORS.textGold;
  ctx.fillText(`${player.name} Lv.${player.level}`, x, line1);
  x += 160;

  // HP条
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText('HP:', x, line1);
  x += 25;
  const hpBarW = 100;
  ctx.fillStyle = '#333';
  ctx.fillRect(x, line1 - 6, hpBarW, 12);
  ctx.fillStyle = COLORS.hpBar;
  ctx.fillRect(x, line1 - 6, hpBarW * (player.hp / player.maxHp), 12);
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = '11px monospace';
  ctx.fillText(`${player.hp}/${player.maxHp}`, x + 5, line1);
  x += hpBarW + 10;

  // MP条
  ctx.font = '13px monospace';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText('MP:', x, line1);
  x += 25;
  ctx.fillStyle = '#333';
  ctx.fillRect(x, line1 - 6, hpBarW, 12);
  ctx.fillStyle = COLORS.mpBar;
  ctx.fillRect(x, line1 - 6, hpBarW * (player.mp / player.maxMp), 12);
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = '11px monospace';
  ctx.fillText(`${player.mp}/${player.maxMp}`, x + 5, line1);
  x += hpBarW + 10;

  // 经验条
  ctx.font = '13px monospace';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText('EXP:', x, line1);
  x += 30;
  const xpBarW = 80;
  ctx.fillStyle = '#333';
  ctx.fillRect(x, line1 - 6, xpBarW, 12);
  ctx.fillStyle = COLORS.xpBar;
  ctx.fillRect(x, line1 - 6, xpBarW * (player.xp / player.xpToNext), 12);
  ctx.fillStyle = COLORS.textPrimary;
  ctx.font = '11px monospace';
  ctx.fillText(`${player.xp}/${player.xpToNext}`, x + 5, line1);

  // 第二行: 属性
  x = 10;
  ctx.font = '12px monospace';
  ctx.fillStyle = COLORS.textSecondary;
  const stats = [
    `力量:${player.str}`,
    `敏捷:${player.agi}`,
    `体质:${player.con}`,
    `智力:${player.int}`,
    `攻击:${player.atk}`,
    `防御:${player.def}`,
  ];
  ctx.fillText(stats.join('  '), x, line2);

  // 属性点提示
  if (player.statPoints > 0) {
    ctx.fillStyle = COLORS.textGold;
    ctx.fillText(`  [可用属性点:${player.statPoints} 按Q分配]`, x + stats.join('  ').length * 7.2, line2);
  }

  // 第三行: 装备
  x = 10;
  ctx.fillStyle = COLORS.textSecondary;
  const weaponName = player.equipment.weapon ? player.equipment.weapon.name : '无';
  const armorName = player.equipment.armor ? player.equipment.armor.name : '无';
  const ringName = player.equipment.ring ? player.equipment.ring.name : '无';
  ctx.fillText(`武器:${weaponName}  护甲:${armorName}  戒指:${ringName}`, x, line3);
}

// 绘制小地图
export function renderMinimap(ctx, map, player, enemies, visible, explored, canvasWidth) {
  const miniSize = 3;
  const mapW = map[0].length;
  const mapH = map.length;
  const miniMapW = mapW * miniSize;
  const miniMapH = mapH * miniSize;
  const startX = canvasWidth - miniMapW - 10;
  const startY = 70;

  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillRect(startX - 2, startY - 2, miniMapW + 4, miniMapH + 4);
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.strokeRect(startX - 2, startY - 2, miniMapW + 4, miniMapH + 4);

  for (let y = 0; y < mapH; y++) {
    for (let x = 0; x < mapW; x++) {
      const key = `${x},${y}`;
      if (!explored.has(key)) continue;

      const tile = map[y][x];
      const isVis = visible.has(key);
      const px = startX + x * miniSize;
      const py = startY + y * miniSize;

      if (tile === TILE.WALL) {
        ctx.fillStyle = isVis ? '#445566' : '#223344';
      } else if (tile === TILE.STAIRS_DOWN) {
        ctx.fillStyle = '#44ff44';
      } else {
        ctx.fillStyle = isVis ? '#556677' : '#334455';
      }
      ctx.fillRect(px, py, miniSize, miniSize);
    }
  }

  // 怪物点
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    if (!visible.has(`${enemy.x},${enemy.y}`)) continue;
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(startX + enemy.x * miniSize, startY + enemy.y * miniSize, miniSize, miniSize);
  }

  // 玩家点
  ctx.fillStyle = '#ffd700';
  ctx.fillRect(startX + player.x * miniSize, startY + player.y * miniSize, miniSize, miniSize);
}

// 绘制战斗日志
export function renderLog(ctx, logMessages, canvasWidth, canvasHeight) {
  const logH = 80;
  const y = canvasHeight - logH;

  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(0, y, canvasWidth, logH);
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 1;
  ctx.strokeRect(0, y, canvasWidth, logH);

  ctx.font = '12px monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  const maxLines = 5;
  const startIdx = Math.max(0, logMessages.length - maxLines);
  for (let i = startIdx; i < logMessages.length; i++) {
    const msg = logMessages[i];
    const lineY = y + 8 + (i - startIdx) * 14;
    ctx.fillStyle = getLogColor(msg.type);
    ctx.fillText(msg.text, 10, lineY);
  }
}

function getLogColor(type) {
  switch (type) {
    case 'attack': return '#ff8844';
    case 'crit': return '#ffaa00';
    case 'enemy': return '#ff4444';
    case 'heal': return '#44ff44';
    case 'mana': return '#4488ff';
    case 'magic': return '#cc66ff';
    case 'pickup': return '#ffcc00';
    case 'equip': return '#66ccff';
    case 'levelup': return '#ffd700';
    case 'kill': return '#ff6633';
    case 'buff': return '#66ffcc';
    case 'damage': return '#ff3333';
    default: return '#aabbcc';
  }
}

// 绘制背包界面
export function renderInventory(ctx, player, selectedIndex, canvasWidth, canvasHeight) {
  const panelW = 420;
  const panelH = 450;
  const px = (canvasWidth - panelW) / 2;
  const py = (canvasHeight - panelH) / 2;

  // 半透明背景
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 面板
  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(px, py, panelW, panelH);
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, panelW, panelH);

  // 标题
  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = COLORS.textGold;
  ctx.textAlign = 'center';
  ctx.fillText('背包 [I关闭]', px + panelW / 2, py + 20);

  // 装备栏
  ctx.font = '13px monospace';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.textAlign = 'left';
  ctx.fillText('-- 装备 --', px + 10, py + 45);

  const equipSlots = [
    { key: 'weapon', label: '武器' },
    { key: 'armor', label: '护甲' },
    { key: 'ring', label: '戒指' },
  ];

  let ey = py + 60;
  for (const slot of equipSlots) {
    const item = player.equipment[slot.key];
    ctx.fillStyle = item ? '#66ccff' : '#555';
    ctx.fillText(`[${slot.label}] ${item ? item.name : '空'}`, px + 10, ey);
    if (item && item.atk) {
      ctx.fillStyle = '#aaa';
      ctx.fillText(` 攻击+${item.atk}`, px + 180, ey);
    }
    if (item && item.def) {
      ctx.fillStyle = '#aaa';
      ctx.fillText(` 防御+${item.def}`, px + 180, ey);
    }
    ey += 18;
  }

  // 分隔线
  ctx.strokeStyle = '#333';
  ctx.beginPath();
  ctx.moveTo(px + 10, ey + 5);
  ctx.lineTo(px + panelW - 10, ey + 5);
  ctx.stroke();
  ey += 15;

  // 背包物品
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText(`-- 背包 (${player.inventory.length}/${player.maxInventory}) --`, px + 10, ey);
  ey += 18;

  for (let i = 0; i < player.inventory.length; i++) {
    const item = player.inventory[i];
    const isSelected = i === selectedIndex;

    if (isSelected) {
      ctx.fillStyle = 'rgba(60, 100, 160, 0.3)';
      ctx.fillRect(px + 5, ey - 12, panelW - 10, 16);
    }

    ctx.fillStyle = isSelected ? COLORS.textPrimary : (item.color || '#aaa');
    const prefix = `[${i + 1}]`;
    ctx.fillText(`${prefix} ${item.name}`, px + 10, ey);

    // 显示简要属性
    if (item.atk) {
      ctx.fillStyle = '#ff8844';
      ctx.fillText(`攻+${item.atk}`, px + 250, ey);
    }
    if (item.def) {
      ctx.fillStyle = '#4488ff';
      ctx.fillText(`防+${item.def}`, px + 250, ey);
    }
    if (item.heal) {
      ctx.fillStyle = '#44ff44';
      ctx.fillText(`回复${item.heal}HP`, px + 250, ey);
    }

    ey += 16;
    if (ey > py + panelH - 30) break;
  }

  // 操作提示
  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('数字键选择 使用/装备 | D丢弃 | I关闭', px + panelW / 2, py + panelH - 12);
}

// 绘制属性分配界面
export function renderStatPanel(ctx, player, canvasWidth, canvasHeight) {
  const panelW = 300;
  const panelH = 250;
  const px = (canvasWidth - panelW) / 2;
  const py = (canvasHeight - panelH) / 2;

  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.fillStyle = COLORS.panelBg;
  ctx.fillRect(px, py, panelW, panelH);
  ctx.strokeStyle = COLORS.panelBorder;
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, panelW, panelH);

  ctx.font = 'bold 16px monospace';
  ctx.fillStyle = COLORS.textGold;
  ctx.textAlign = 'center';
  ctx.fillText(`属性分配 [剩余${player.statPoints}点]`, px + panelW / 2, py + 25);

  const stats = [
    { key: 'str', label: '力量', desc: '影响物理攻击', key1: '1' },
    { key: 'agi', label: '敏捷', desc: '影响暴击和闪避', key1: '2' },
    { key: 'con', label: '体质', desc: '影响生命值', key1: '3' },
    { key: 'int', label: '智力', desc: '影响魔法和魔力', key1: '4' },
  ];

  let sy = py + 55;
  for (const stat of stats) {
    ctx.font = '14px monospace';
    ctx.fillStyle = COLORS.textPrimary;
    ctx.textAlign = 'left';
    ctx.fillText(`[${stat.key1}] ${stat.label}: ${player[stat.key]}`, px + 20, sy);
    ctx.fillStyle = COLORS.textSecondary;
    ctx.font = '11px monospace';
    ctx.fillText(stat.desc, px + 20, sy + 16);
    sy += 40;
  }

  ctx.fillStyle = COLORS.textSecondary;
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('按数字键分配 | Q关闭', px + panelW / 2, py + panelH - 12);
}

// 游戏结束画面
export function renderGameOver(ctx, player, canvasWidth, canvasHeight, won) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  ctx.font = 'bold 36px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (won) {
    ctx.fillStyle = COLORS.textGold;
    ctx.fillText('通关成功！', canvasWidth / 2, canvasHeight / 2 - 60);
  } else {
    ctx.fillStyle = COLORS.textRed;
    ctx.fillText('你死了', canvasWidth / 2, canvasHeight / 2 - 60);
  }

  ctx.font = '16px monospace';
  ctx.fillStyle = COLORS.textPrimary;
  const stats = [
    `职业: ${player.name}`,
    `等级: ${player.level}`,
    `击杀: ${player.kills}`,
    `步数: ${player.steps}`,
    `到达层数: ${player.floorsCleared}`,
  ];
  stats.forEach((text, i) => {
    ctx.fillText(text, canvasWidth / 2, canvasHeight / 2 - 10 + i * 25);
  });

  ctx.font = '14px monospace';
  ctx.fillStyle = COLORS.textGold;
  ctx.fillText('按 Enter 返回主菜单', canvasWidth / 2, canvasHeight / 2 + 120);
}
