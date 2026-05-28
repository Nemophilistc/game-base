// ==================== UI系统 ====================

import {
  CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE,
  TOWER_TYPES, GAME_SPEEDS, INITIAL_GOLD, INITIAL_LIVES,
  GRID_COLS, GRID_ROWS, MAPS
} from './config.js';

// ---- UI状态 ----
export const uiState = {
  selectedTowerType: null,   // 选中的待建造塔类型
  selectedTower: null,       // 选中的已建造塔实例
  hoveredCell: null,         // 鼠标悬停的格子
  gameSpeed: 1,
  gold: INITIAL_GOLD,
  lives: INITIAL_LIVES,
  score: 0,
  isPaused: false,
  showStartMenu: true,
  showGameOver: false,
  showVictory: false,
  isRunning: false,
  waveNumber: 0,
  totalWaves: 30,
  enemyCount: 0,
  killCount: 0,
  towerCount: 0,
  selectedMapIndex: 0        // 选中的地图
};

// ---- 事件回调 ----
let onTowerSelect = null;
let onTowerPlace = null;
let onTowerUpgrade = null;
let onTowerSell = null;
let onStartGame = null;
let onPauseToggle = null;
let onSpeedChange = null;
let onSkipWait = null;
let onMapSelect = null;

export function setCallbacks(cbs) {
  onTowerSelect = cbs.onTowerSelect;
  onTowerPlace = cbs.onTowerPlace;
  onTowerUpgrade = cbs.onTowerUpgrade;
  onTowerSell = cbs.onTowerSell;
  onStartGame = cbs.onStartGame;
  onPauseToggle = cbs.onPauseToggle;
  onSpeedChange = cbs.onSpeedChange;
  onSkipWait = cbs.onSkipWait;
  onMapSelect = cbs.onMapSelect;
}

// ---- 塔选择面板 ----
const towerPanelItems = Object.entries(TOWER_TYPES).map(([key, val]) => ({
  key,
  name: val.name,
  icon: val.icon,
  cost: val.levels[0].cost,
  desc: val.description
}));

/** 绘制塔选择面板 */
function drawTowerPanel(ctx) {
  const panelX = 0;
  const panelY = CANVAS_HEIGHT;
  const panelW = CANVAS_WIDTH;
  const panelH = 100;

  // 背景
  ctx.fillStyle = 'rgba(20,20,30,0.95)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // 标题
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('建造防御塔', panelX + 10, panelY + 5);

  // 塔按钮
  const btnW = 90;
  const btnH = 65;
  const startX = 10;
  const startY = panelY + 25;

  towerPanelItems.forEach((item, i) => {
    const x = startX + i * (btnW + 8);
    const y = startY;
    const isSelected = uiState.selectedTowerType === item.key;
    const canAfford = uiState.gold >= item.cost;

    // 按钮背景
    ctx.fillStyle = isSelected ? 'rgba(52,152,219,0.5)' : 'rgba(40,40,50,0.8)';
    ctx.fillRect(x, y, btnW, btnH);
    ctx.strokeStyle = isSelected ? '#3498db' : '#555';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(x, y, btnW, btnH);

    // 图标
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = canAfford ? '#fff' : '#666';
    ctx.fillText(item.icon, x + btnW / 2, y + 18);

    // 名称
    ctx.font = '11px Arial';
    ctx.fillStyle = canAfford ? '#ddd' : '#555';
    ctx.fillText(item.name, x + btnW / 2, y + 38);

    // 费用
    ctx.font = 'bold 11px Arial';
    ctx.fillStyle = canAfford ? '#f1c40f' : '#c0392b';
    ctx.fillText(`${item.cost}G`, x + btnW / 2, y + 53);

    // 存储按钮区域用于点击检测
    item._rect = { x, y, w: btnW, h: btnH };
  });

  // 速度控制
  const speedX = panelW - 200;
  const speedY = panelY + 10;
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('游戏速度:', speedX, speedY + 5);

  GAME_SPEEDS.forEach((spd, i) => {
    const bx = speedX + 70 + i * 38;
    const by = speedY;
    const isActive = uiState.gameSpeed === spd;
    ctx.fillStyle = isActive ? '#3498db' : 'rgba(40,40,50,0.8)';
    ctx.fillRect(bx, by, 34, 22);
    ctx.strokeStyle = isActive ? '#5dade2' : '#555';
    ctx.strokeRect(bx, by, 34, 22);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${spd}x`, bx + 17, by + 11);
    // 存储区域
    if (!GAME_SPEEDS._rects) GAME_SPEEDS._rects = [];
    GAME_SPEEDS._rects[i] = { x: bx, y: by, w: 34, h: 22, speed: spd };
  });
}

// ---- 顶部HUD ----
function drawHUD(ctx) {
  const hudH = 32;
  ctx.fillStyle = 'rgba(20,20,30,0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, hudH);
  ctx.strokeStyle = '#444';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, hudH);
  ctx.lineTo(CANVAS_WIDTH, hudH);
  ctx.stroke();

  ctx.textBaseline = 'middle';
  const y = hudH / 2;

  // 金币
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#f1c40f';
  ctx.fillText(`💰 ${uiState.gold}`, 10, y);

  // 生命
  ctx.fillStyle = '#e74c3c';
  ctx.fillText(`❤️ ${uiState.lives}`, 120, y);

  // 波次
  ctx.fillStyle = '#3498db';
  ctx.fillText(`🌊 ${uiState.waveNumber}/${uiState.totalWaves}`, 230, y);

  // 击杀
  ctx.fillStyle = '#2ecc71';
  ctx.fillText(`💀 ${uiState.killCount}`, 360, y);

  // 分数
  ctx.fillStyle = '#fff';
  ctx.fillText(`🏆 ${uiState.score}`, 460, y);

  // 暂停按钮
  const pauseX = CANVAS_WIDTH - 80;
  const pauseY = 4;
  const pauseW = 36;
  const pauseH = 24;
  ctx.fillStyle = uiState.isPaused ? '#e74c3c' : 'rgba(40,40,50,0.8)';
  ctx.fillRect(pauseX, pauseY, pauseW, pauseH);
  ctx.strokeStyle = '#555';
  ctx.strokeRect(pauseX, pauseY, pauseW, pauseH);
  ctx.fillStyle = '#fff';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(uiState.isPaused ? '▶' : '⏸', pauseX + pauseW / 2, y);
  // 存储
  uiState._pauseRect = { x: pauseX, y: pauseY, w: pauseW, h: pauseH };

  // 下一波按钮
  const nextX = CANVAS_WIDTH - 170;
  const nextW = 80;
  ctx.fillStyle = 'rgba(46,204,113,0.8)';
  ctx.fillRect(nextX, pauseY, nextW, pauseH);
  ctx.strokeStyle = '#2ecc71';
  ctx.strokeRect(nextX, pauseY, nextW, pauseH);
  ctx.fillStyle = '#fff';
  ctx.font = '11px Arial';
  ctx.fillText('下一波', nextX + nextW / 2, y);
  uiState._nextWaveRect = { x: nextX, y: pauseY, w: nextW, h: pauseH };
}

// ---- 塔信息面板（选中已建造的塔时） ----
function drawTowerInfo(ctx) {
  const tower = uiState.selectedTower;
  if (!tower) return;

  const panelW = 180;
  const panelH = 200;
  const panelX = CANVAS_WIDTH - panelW - 10;
  const panelY = 45;

  // 背景
  ctx.fillStyle = 'rgba(20,20,30,0.95)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';

  // 名称和等级
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 14px Arial';
  ctx.fillText(`${tower.icon} ${tower.typeName} Lv.${tower.level + 1}`, panelX + panelW / 2, panelY + 8);

  // 属性
  const s = tower.stats;
  ctx.font = '11px Arial';
  ctx.textAlign = 'left';
  const infoX = panelX + 12;
  let infoY = panelY + 32;
  const lineH = 18;

  const infos = [
    [`⚔️ 伤害: ${s.damage}`, '#e74c3c'],
    [`🎯 射程: ${s.range}`, '#3498db'],
    [`⏱️ 射速: ${s.fireRate.toFixed(1)}s`, '#f39c12'],
  ];

  if (s.splashRadius) infos.push([`💥 溅射: ${s.splashRadius.toFixed(1)}`, '#e67e22']);
  if (s.slowFactor) infos.push([`❄️ 减速: ${Math.round((1 - s.slowFactor) * 100)}%`, '#00BFFF']);
  if (s.chainCount) infos.push([`⚡ 连锁: ${s.chainCount}个`, '#FFD700']);
  if (s.burnDamage) infos.push([`🔥 灼烧: ${s.burnDamage}/s`, '#FF4500']);
  if (s.pierceCount) infos.push([`🔫 穿透: ${s.pierceCount + 1}个`, '#FF00FF']);

  for (const [text, color] of infos) {
    ctx.fillStyle = color;
    ctx.fillText(text, infoX, infoY);
    infoY += lineH;
  }

  // 出售价值
  infoY += 5;
  ctx.fillStyle = '#f1c40f';
  ctx.fillText(`💰 出售: ${tower.sellValue}G`, infoX, infoY);
  infoY += lineH;

  // 升级按钮
  const btnY = panelY + panelH - 50;

  if (tower.canUpgrade()) {
    const cost = tower.upgradeCost;
    const canAfford = uiState.gold >= cost;
    const ubx = panelX + 10;
    const uby = btnY;
    const ubw = panelW - 20;
    const ubh = 28;

    ctx.fillStyle = canAfford ? 'rgba(46,204,113,0.8)' : 'rgba(100,100,100,0.5)';
    ctx.fillRect(ubx, uby, ubw, ubh);
    ctx.strokeStyle = canAfford ? '#2ecc71' : '#555';
    ctx.strokeRect(ubx, uby, ubw, ubh);
    ctx.fillStyle = canAfford ? '#fff' : '#888';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`⬆ 升级 (${cost}G)`, panelX + panelW / 2, uby + ubh / 2);
    uiState._upgradeRect = { x: ubx, y: uby, w: ubw, h: ubh };
  } else {
    ctx.fillStyle = '#f39c12';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('已满级!', panelX + panelW / 2, btnY + 14);
    uiState._upgradeRect = null;
  }

  // 出售按钮
  const sbx = panelX + 10;
  const sby = btnY + 32;
  const sbw = panelW - 20;
  const sbh = 24;
  ctx.fillStyle = 'rgba(231,76,60,0.7)';
  ctx.fillRect(sbx, sby, sbw, sbh);
  ctx.strokeStyle = '#e74c3c';
  ctx.strokeRect(sbx, sby, sbw, sbh);
  ctx.fillStyle = '#fff';
  ctx.font = '11px Arial';
  ctx.fillText(`出售 (+${tower.sellValue}G)`, panelX + panelW / 2, sby + sbh / 2);
  uiState._sellRect = { x: sbx, y: sby, w: sbw, h: sbh };
}

// ---- 开始菜单 ----
function drawStartMenu(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.85)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 标题
  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 42px Arial';
  ctx.fillText('塔防大战', CANVAS_WIDTH / 2, 50);

  ctx.fillStyle = '#bdc3c7';
  ctx.font = '14px Arial';
  ctx.fillText('30波敌人入侵，建造防御塔保卫家园！', CANVAS_WIDTH / 2, 80);

  // 地图选择
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 16px Arial';
  ctx.fillText('选择地图', CANVAS_WIDTH / 2, 115);

  uiState._mapBtnRects = [];
  const mapBtnW = 160;
  const mapBtnH = 70;
  const mapStartX = CANVAS_WIDTH / 2 - (MAPS.length * (mapBtnW + 12) - 12) / 2;
  const mapY = 135;

  MAPS.forEach((m, i) => {
    const mx = mapStartX + i * (mapBtnW + 12);
    const isSelected = uiState.selectedMapIndex === i;

    ctx.fillStyle = isSelected ? 'rgba(52,152,219,0.5)' : 'rgba(40,40,50,0.8)';
    ctx.beginPath();
    ctx.roundRect(mx, mapY, mapBtnW, mapBtnH, 8);
    ctx.fill();
    ctx.strokeStyle = isSelected ? '#3498db' : '#555';
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.strokeRect(mx, mapY, mapBtnW, mapBtnH);

    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(m.icon, mx + mapBtnW / 2, mapY + 22);
    ctx.font = 'bold 13px Arial';
    ctx.fillStyle = isSelected ? '#5dade2' : '#ddd';
    ctx.fillText(m.name, mx + mapBtnW / 2, mapY + 42);
    ctx.font = '10px Arial';
    ctx.fillStyle = '#999';
    ctx.fillText(m.desc, mx + mapBtnW / 2, mapY + 58);

    uiState._mapBtnRects.push({ x: mx, y: mapY, w: mapBtnW, h: mapBtnH, index: i });
  });

  // 塔介绍
  ctx.font = '13px Arial';
  const types = Object.values(TOWER_TYPES);
  const startY = 225;
  types.forEach((t, i) => {
    ctx.fillStyle = '#ddd';
    ctx.fillText(`${t.icon} ${t.name} - ${t.description}`, CANVAS_WIDTH / 2, startY + i * 20);
  });

  // 开始按钮
  const btnW = 200;
  const btnH = 50;
  const btnX = CANVAS_WIDTH / 2 - btnW / 2;
  const btnY = CANVAS_HEIGHT / 2 + 120;

  ctx.fillStyle = '#2ecc71';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('开始游戏', CANVAS_WIDTH / 2, btnY + btnH / 2);
  uiState._startBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
}

// ---- 游戏结束覆盖层 ----
function drawGameOver(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#e74c3c';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#fff';
  ctx.font = '18px Arial';
  ctx.fillText(`坚持到第 ${uiState.waveNumber} 波`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  ctx.fillText(`击杀数: ${uiState.killCount}  |  得分: ${uiState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  drawRestartButton(ctx, CANVAS_HEIGHT / 2 + 70);
}

function drawVictory(ctx) {
  ctx.fillStyle = 'rgba(0,0,0,0.8)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#f1c40f';
  ctx.font = 'bold 48px Arial';
  ctx.fillText('胜利！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);

  ctx.fillStyle = '#fff';
  ctx.font = '18px Arial';
  ctx.fillText(`成功防守30波进攻！`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
  ctx.fillText(`击杀数: ${uiState.killCount}  |  得分: ${uiState.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

  drawRestartButton(ctx, CANVAS_HEIGHT / 2 + 70);
}

function drawRestartButton(ctx, y) {
  const btnW = 180;
  const btnH = 45;
  const btnX = CANVAS_WIDTH / 2 - btnW / 2;

  ctx.fillStyle = '#3498db';
  ctx.beginPath();
  ctx.roundRect(btnX, y, btnW, btnH, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('重新开始', CANVAS_WIDTH / 2, y + btnH / 2);
  uiState._restartBtnRect = { x: btnX, y, w: btnW, h: btnH };
}

// ---- 鼠标交互 ----
let _canvas = null;

export function initUI(canvas) {
  _canvas = canvas;

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    uiState.hoveredCell = {
      col: Math.floor(mx / CELL_SIZE),
      row: Math.floor(my / CELL_SIZE),
      x: mx,
      y: my
    };
  });

  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    handleClick(mx, my);
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    // 右键取消选择
    uiState.selectedTowerType = null;
    uiState.selectedTower = null;
  });
}

function handleClick(mx, my) {
  // 开始菜单
  if (uiState.showStartMenu) {
    // 地图选择
    if (uiState._mapBtnRects) {
      for (const r of uiState._mapBtnRects) {
        if (hitTest(mx, my, r)) {
          uiState.selectedMapIndex = r.index;
          onMapSelect?.(r.index);
          return;
        }
      }
    }
    if (uiState._startBtnRect && hitTest(mx, my, uiState._startBtnRect)) {
      uiState.showStartMenu = false;
      uiState.isRunning = true;
      onStartGame?.();
    }
    return;
  }

  // 游戏结束/胜利
  if (uiState.showGameOver || uiState.showVictory) {
    if (uiState._restartBtnRect && hitTest(mx, my, uiState._restartBtnRect)) {
      // 重新加载页面
      location.reload();
    }
    return;
  }

  // 暂停按钮
  if (uiState._pauseRect && hitTest(mx, my, uiState._pauseRect)) {
    uiState.isPaused = !uiState.isPaused;
    onPauseToggle?.();
    return;
  }

  // 下一波按钮
  if (uiState._nextWaveRect && hitTest(mx, my, uiState._nextWaveRect)) {
    onSkipWait?.();
    return;
  }

  // 塔选择面板
  for (const item of towerPanelItems) {
    if (item._rect && hitTest(mx, my, item._rect)) {
      if (uiState.selectedTowerType === item.key) {
        uiState.selectedTowerType = null;
      } else {
        uiState.selectedTowerType = item.key;
        uiState.selectedTower = null;
      }
      onTowerSelect?.(item.key);
      return;
    }
  }

  // 速度按钮
  if (GAME_SPEEDS._rects) {
    for (const r of GAME_SPEEDS._rects) {
      if (r && hitTest(mx, my, r)) {
        uiState.gameSpeed = r.speed;
        onSpeedChange?.(r.speed);
        return;
      }
    }
  }

  // 升级按钮
  if (uiState._upgradeRect && hitTest(mx, my, uiState._upgradeRect)) {
    onTowerUpgrade?.();
    return;
  }

  // 出售按钮
  if (uiState._sellRect && hitTest(mx, my, uiState._sellRect)) {
    onTowerSell?.();
    return;
  }

  // 点击地图
  if (my < CANVAS_HEIGHT) {
    const col = Math.floor(mx / CELL_SIZE);
    const row = Math.floor(my / CELL_SIZE);

    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      if (uiState.selectedTowerType) {
        // 建造塔
        onTowerPlace?.(col, row);
      } else {
        // 选择已建造的塔
        onTowerSelect?.(null, col, row);
      }
    }
  }
}

function hitTest(mx, my, rect) {
  return mx >= rect.x && mx <= rect.x + rect.w &&
         my >= rect.y && my <= rect.y + rect.h;
}

// ---- 悬停提示 ----
function drawHoverInfo(ctx) {
  if (!uiState.hoveredCell || uiState.showStartMenu) return;
  const { x, y, col, row } = uiState.hoveredCell;
  if (y >= CANVAS_HEIGHT) return;

  // 建造预览
  if (uiState.selectedTowerType) {
    const px = col * CELL_SIZE;
    const py = row * CELL_SIZE;
    ctx.strokeStyle = 'rgba(46,204,113,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);

    // 射程预览
    const type = TOWER_TYPES[uiState.selectedTowerType];
    const range = type.levels[0].range * CELL_SIZE;
    ctx.beginPath();
    ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, range, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.stroke();
  }
}

// ---- 主绘制 ----
export function drawUI(ctx) {
  drawHUD(ctx);
  drawTowerPanel(ctx);
  drawTowerInfo(ctx);
  drawHoverInfo(ctx);

  if (uiState.showStartMenu) {
    drawStartMenu(ctx);
  } else if (uiState.showVictory) {
    drawVictory(ctx);
  } else if (uiState.showGameOver) {
    drawGameOver(ctx);
  } else if (uiState.isPaused) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('已暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
  }
}
