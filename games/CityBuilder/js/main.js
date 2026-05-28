// ============================================
// 城市建设者 - 游戏主循环
// ============================================

import { GRID, CAMERA_DEFAULTS, BUILDINGS, DAY_LENGTH } from './config.js';
import { Grid } from './grid.js';
import { BuildingSystem } from './buildings.js';
import { ResidentSystem } from './residents.js';
import { Economy } from './economy.js';
import { UI } from './ui.js';
import * as Sound from './sound.js';

// ---- 全局状态 ----
let canvas, ctx;
let grid, buildingSystem, residentSystem, economy, ui;
let camera;
let gameSpeed = 1;
let isRunning = true;
let lastTime = 0;
let hoverCell = null;

// 拖拽状态
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let cameraStartX = 0, cameraStartY = 0;
let mouseMoved = false;

// ---- 初始化 ----
function init() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // 初始化相机
  camera = {
    x: 0, y: 0,
    zoom: 1,
    screenW: canvas.width,
    screenH: canvas.height,

    screenToWorld(sx, sy) {
      return {
        x: (sx - this.x) / this.zoom,
        y: (sy - this.y) / this.zoom
      };
    },

    worldToScreen(wx, wy) {
      return {
        x: wx * this.zoom + this.x,
        y: wy * this.zoom + this.y
      };
    },

    centerOn(wx, wy) {
      this.x = this.screenW / 2 - wx * this.zoom;
      this.y = this.screenH / 2 - wy * this.zoom;
    }
  };

  // 居中相机到地图中心
  const mapW = GRID.cols * GRID.cellSize;
  const mapH = GRID.rows * GRID.cellSize;
  camera.centerOn(mapW / 2, mapH / 2);

  // 初始化游戏系统
  grid = new Grid();
  economy = new Economy();
  buildingSystem = new BuildingSystem(grid, economy);
  residentSystem = new ResidentSystem(grid, economy);
  ui = new UI(buildingSystem, economy);

  // 绑定事件
  bindEvents();

  // 开始游戏循环
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);

  ui.addNotification('欢迎来到城市建设者！选择建筑类型开始建造', 'info');
}

// ---- 画布大小 ----
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  if (camera) {
    camera.screenW = canvas.width;
    camera.screenH = canvas.height;
  }
}

// ---- 事件绑定 ----
function bindEvents() {
  // 鼠标事件
  canvas.addEventListener('mousedown', onMouseDown);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mouseup', onMouseUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  // 键盘事件
  document.addEventListener('keydown', onKeyDown);

  // 速度控制
  document.querySelectorAll('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      gameSpeed = parseInt(btn.dataset.speed);
      document.querySelectorAll('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // 帮助按钮
  document.getElementById('btn-help').addEventListener('click', () => ui.toggleHelp());
  document.getElementById('help-overlay').addEventListener('click', (e) => {
    if (e.target.id === 'help-overlay') ui.toggleHelp();
  });
}

// ---- 鼠标事件 ----
function onMouseDown(e) {
  if (e.button === 0) { // 左键
    isDragging = true;
    mouseMoved = false;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    cameraStartX = camera.x;
    cameraStartY = camera.y;
  }
}

function onMouseMove(e) {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 更新悬停格子
  const worldPos = camera.screenToWorld(mx, my);
  const gc = grid.worldToGrid(worldPos.x, worldPos.y);
  hoverCell = grid.isValid(gc.col, gc.row) ? gc : null;

  // 拖拽
  if (isDragging) {
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      mouseMoved = true;
    }
    if (mouseMoved) {
      camera.x = cameraStartX + dx;
      camera.y = cameraStartY + dy;
    }
  }
}

function onMouseUp(e) {
  if (e.button === 0) {
    if (!mouseMoved && hoverCell) {
      // 点击操作
      if (buildingSystem.selectedType) {
        // 放置建筑
        const result = buildingSystem.place(buildingSystem.selectedType, hoverCell.col, hoverCell.row);
        if (result) {
          const config = BUILDINGS[result.type];
          Sound.playBuild();
          ui.addNotification(`建造了${config.name}`, 'success');
        } else {
          Sound.playError();
          if (!grid.isEmpty(hoverCell.col, hoverCell.row)) {
            ui.addNotification('此处已有建筑', 'warn');
          } else if (buildingSystem.selectedType) {
            const cost = BUILDINGS[buildingSystem.selectedType].cost;
            if (economy.gold < cost) {
              ui.addNotification(`金币不足 (需要${cost})`, 'warn');
            }
          }
        }
      } else {
        // 选中建筑
        buildingSystem.selectCell(hoverCell.col, hoverCell.row);
      }
    }
    isDragging = false;
  }
}

function onWheel(e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // 先计算缩放前鼠标对应的世界坐标
  const worldBefore = camera.screenToWorld(mx, my);

  // 更新缩放
  const zoomDelta = e.deltaY > 0 ? -CAMERA_DEFAULTS.zoomStep : CAMERA_DEFAULTS.zoomStep;
  camera.zoom = Math.max(CAMERA_DEFAULTS.minZoom,
    Math.min(CAMERA_DEFAULTS.maxZoom, camera.zoom + zoomDelta));

  // 缩放后，调整相机位置使鼠标下方的世界坐标不变
  camera.x = mx - worldBefore.x * camera.zoom;
  camera.y = my - worldBefore.y * camera.zoom;
}

function onKeyDown(e) {
  switch (e.key) {
    case 'Escape':
      buildingSystem.selectedType = null;
      buildingSystem.selectedCell = null;
      ui.updateBuildingPanel();
      break;
    case 'h':
    case 'H':
      ui.toggleHelp();
      break;
    case '1': case '2': case '3': case '4': case '5':
    case '6': case '7': case '8': case '9':
      {
        const types = ['residential', 'commercial', 'industrial', 'farm',
          'school', 'hospital', 'police', 'park', 'powerplant', 'road'];
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < types.length) {
          buildingSystem.selectType(types[idx]);
          ui.updateBuildingPanel();
        }
      }
      break;
    case '0':
      buildingSystem.selectType('road');
      ui.updateBuildingPanel();
      break;
    case '+':
    case '=':
      if (buildingSystem.selectedCell) {
        const { col, row } = buildingSystem.selectedCell;
        const result = buildingSystem.upgrade(col, row);
        if (result) {
          Sound.playUpgrade();
          ui.addNotification(`${BUILDINGS[result.building.type].name} 升级到 Lv.${result.building.level}`, 'success');
        }
      }
      break;
    case '-':
    case 'Delete':
      if (buildingSystem.selectedCell) {
        const { col, row } = buildingSystem.selectedCell;
        const building = grid.getBuilding(col, row);
        if (building) {
          const result = buildingSystem.demolish(col, row);
          if (result) {
            Sound.playDemolish();
            ui.addNotification(`拆除${BUILDINGS[building.type].name}，返还${result.refund}金币`, 'warn');
          }
        }
      }
      break;
  }
}

// ---- 游戏主循环 ----
function gameLoop(timestamp) {
  if (!isRunning) return;

  const rawDtMs = Math.min(timestamp - lastTime, 50); // 限制最大dt (ms)
  lastTime = timestamp;

  // dt = 逻辑帧数 (1帧 = 1/60秒 at 1x速度)
  const dt = (rawDtMs / 1000) * 60 * gameSpeed;

  // 更新
  update(dt);

  // 渲染
  render();

  requestAnimationFrame(gameLoop);
}

// ---- 更新 ----
function update(dt) {
  // 更新经济/时间
  const dayEnded = economy.update(dt);
  if (dayEnded) {
    const result = economy.endDay(grid);
    Sound.playTax();
    const dr = result.dailyReport;
    ui.addNotification(`第${economy.day - 1}天结算: 收入+${dr.income} 支出-${dr.expense}`, 'info');
    if (result.notifications.length > 0) {
      ui.addNotifications(result.notifications, 'warn');
    }
  }

  // 更新建筑统计
  const stats = economy.calculateBuildingStats(grid);

  // 更新居民
  residentSystem.update(dt, stats);

  // 同步人口到经济系统
  economy.population = residentSystem.residents.length;

  // 更新UI
  const summary = economy.getSummary(grid);
  ui.updateResources(summary);
  ui.updateBuildingAvailability(economy.gold);
  ui.updateNotifications(dt);

  // 更新信息面板
  if (buildingSystem.selectedCell) {
    ui.updateInfoPanel(buildingSystem.selectedCell.col, buildingSystem.selectedCell.row, grid, economy);
  } else {
    ui.updateInfoPanel(null, null, grid, economy);
  }
}

// ---- 渲染 ----
function render() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // 绘制背景
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 绘制网格
  grid.render(ctx, camera);

  // 绘制建筑
  buildingSystem.render(ctx, camera, hoverCell, economy.dayProgress);

  // 绘制居民
  residentSystem.render(ctx, camera);

  // 日夜叠加层
  renderDayNight();

  // 小地图
  renderMinimap();

  // 悬停提示
  if (hoverCell && !buildingSystem.selectedType) {
    renderHoverTooltip();
  }
}

// 日夜效果
function renderDayNight() {
  const progress = economy.dayProgress;
  let alpha = 0;

  if (progress < 0.2) {
    // 黎明
    alpha = 0.2 - progress; // 0.2 -> 0
  } else if (progress < 0.5) {
    // 白天
    alpha = 0;
  } else if (progress < 0.7) {
    // 黄昏
    alpha = (progress - 0.5) * 1.5; // 0 -> 0.3
  } else {
    // 夜晚
    alpha = 0.3;
  }

  if (alpha > 0) {
    ctx.fillStyle = `rgba(10, 10, 40, ${alpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// 小地图
function renderMinimap() {
  const mmW = 150, mmH = 100;
  const mmX = canvas.width - mmW - 15;
  const mmY = canvas.height - mmH - 15;
  const scaleX = mmW / (GRID.cols * GRID.cellSize);
  const scaleY = mmH / (GRID.rows * GRID.cellSize);

  // 背景
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);

  // 地图区域
  ctx.fillStyle = '#1a3a1a';
  ctx.fillRect(mmX, mmY, mmW, mmH);

  // 建筑
  for (let r = 0; r < GRID.rows; r++) {
    for (let c = 0; c < GRID.cols; c++) {
      const building = grid.getBuilding(c, r);
      if (building) {
        const config = BUILDINGS[building.type];
        ctx.fillStyle = config.color;
        ctx.fillRect(
          mmX + c * GRID.cellSize * scaleX,
          mmY + r * GRID.cellSize * scaleY,
          Math.max(2, GRID.cellSize * scaleX),
          Math.max(2, GRID.cellSize * scaleY)
        );
      }
    }
  }

  // 视口范围
  const topLeft = camera.screenToWorld(0, 0);
  const bottomRight = camera.screenToWorld(canvas.width, canvas.height);
  ctx.strokeStyle = '#FFD700';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    mmX + topLeft.x * scaleX,
    mmY + topLeft.y * scaleY,
    (bottomRight.x - topLeft.x) * scaleX,
    (bottomRight.y - topLeft.y) * scaleY
  );
}

// 绘制圆角矩形辅助函数
function drawRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

// 悬停提示
function renderHoverTooltip() {
  if (!hoverCell) return;
  const building = grid.getBuilding(hoverCell.col, hoverCell.row);
  if (!building) return;

  const config = BUILDINGS[building.type];
  const worldPos = grid.gridToWorldCenter(hoverCell.col, hoverCell.row);
  const screenPos = camera.worldToScreen(worldPos.x, worldPos.y);

  const text = `${config.icon} ${config.name} Lv.${building.level}`;
  ctx.font = 'bold 13px "Microsoft YaHei", sans-serif';
  const tm = ctx.measureText(text);
  const tw = tm.width + 16;
  const th = 28;
  const tx = screenPos.x - tw / 2;
  const ty = screenPos.y - GRID.cellSize * camera.zoom / 2 - th - 8;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  drawRoundRect(ctx, tx, ty, tw, th, 6);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, screenPos.x, ty + th / 2);
}

// ---- 启动 ----
window.addEventListener('DOMContentLoaded', init);
