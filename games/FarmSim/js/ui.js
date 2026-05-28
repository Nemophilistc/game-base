// ============================================
// 农场模拟游戏 - Canvas渲染 + HUD + 商店界面
// ============================================

import {
  GRID_COLS, GRID_ROWS, TILE_SIZE, CANVAS_WIDTH,
  SEASONS, STAGE_NAMES, CROPS, ANIMALS, TOOLS
} from './config.js';
import { TILE_STATES } from './farm.js';

const GRID_PX_W = GRID_COLS * TILE_SIZE;
const GRID_PX_H = GRID_ROWS * TILE_SIZE;
const HUD_HEIGHT = 160;

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = GRID_PX_W;
    canvas.height = GRID_PX_H + HUD_HEIGHT;

    // 交互状态
    this.hoveredTile = null;    // { row, col }
    this.selectedTool = 'hoe';
    this.selectedSeed = null;   // 选中的种子类型
    this.selectedTab = 'seeds'; // 商店标签: seeds / animals / inventory
    this.showShop = false;
    this.showAnimalPanel = false;
    this.message = '';
    this.messageTimer = 0;
    this.messageColor = '#FFF';

    // 颜色
    this.COLORS = {
      grass: '#4A7C2E',
      grassDark: '#3D6B25',
      tilled: '#8B6914',
      tilledDark: '#7A5C10',
      planted: '#6B4E0A',
      hudBg: '#2C1810',
      hudText: '#F5DEB3',
      hudAccent: '#FFD700',
      buttonBg: '#5C3A1E',
      buttonHover: '#7A4E2A',
      buttonActive: '#FFD700',
      shopBg: 'rgba(20, 10, 5, 0.95)',
      tileHighlight: 'rgba(255, 255, 200, 0.3)',
      tileDanger: 'rgba(255, 50, 50, 0.3)',
      waterOverlay: 'rgba(30, 100, 200, 0.3)',
    };
  }

  // 显示消息
  showMessage(text, color = '#FFF', duration = 120) {
    this.message = text;
    this.messageTimer = duration;
    this.messageColor = color;
  }

  // ============ 绘制农田 ============
  drawFarm(farm, weatherType) {
    const ctx = this.ctx;

    // 背景色根据天气变化
    let bg = '#6BAF5B'; // 晴天草地
    if (weatherType === 'rain') bg = '#5A9F4B';
    if (weatherType === 'storm') bg = '#4A7A3B';
    if (weatherType === 'drought') bg = '#8AAF6B';
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, GRID_PX_W, GRID_PX_H);

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;
        const tile = farm.tiles[r][c];
        const crop = farm.crops[r][c];

        // 画地块
        if (tile === TILE_STATES.GRASS) {
          ctx.fillStyle = (r + c) % 2 === 0 ? this.COLORS.grass : this.COLORS.grassDark;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          // 草地纹理
          ctx.fillStyle = 'rgba(0,0,0,0.05)';
          for (let i = 0; i < 3; i++) {
            const gx = x + 10 + Math.sin(r * 7 + c * 13 + i * 17) * 20 + 20;
            const gy = y + 15 + Math.cos(r * 11 + c * 7 + i * 23) * 15 + 15;
            ctx.fillRect(gx, gy, 2, 6);
          }
        } else if (tile === TILE_STATES.TILLED) {
          ctx.fillStyle = (r + c) % 2 === 0 ? this.COLORS.tilled : this.COLORS.tilledDark;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          // 犁沟纹理
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 1;
          for (let i = 0; i < 4; i++) {
            ctx.beginPath();
            ctx.moveTo(x + 5, y + 10 + i * 14);
            ctx.lineTo(x + TILE_SIZE - 5, y + 10 + i * 14);
            ctx.stroke();
          }
        } else if (tile === TILE_STATES.PLANTED) {
          ctx.fillStyle = (r + c) % 2 === 0 ? this.COLORS.planted : '#5C4208';
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

          // 浇水效果
          if (crop && crop.watered) {
            ctx.fillStyle = this.COLORS.waterOverlay;
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          }

          // 画作物
          if (crop) {
            this.drawCrop(ctx, x, y, crop);
          }
        }

        // 地块边框
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);

        // 悬停高亮
        if (this.hoveredTile && this.hoveredTile.row === r && this.hoveredTile.col === c) {
          ctx.fillStyle = this.COLORS.tileHighlight;
          ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = '#FFD700';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
        }
      }
    }

    // 下雨粒子效果
    if (weatherType === 'rain' || weatherType === 'storm') {
      this.drawRain(ctx, weatherType === 'storm');
    }
  }

  // 画作物
  drawCrop(ctx, x, y, crop) {
    const cx = x + TILE_SIZE / 2;
    const cy = y + TILE_SIZE / 2;

    if (!crop.alive) {
      // 枯萎 - 灰色
      ctx.fillStyle = '#696969';
      ctx.font = '28px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('💀', cx, cy);
      return;
    }

    switch (crop.stage) {
      case 0: // 种子
        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.arc(cx, cy + 8, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#654321';
        ctx.fillRect(cx - 1, cy + 4, 2, 6);
        break;

      case 1: // 幼苗
        ctx.fillStyle = '#228B22';
        ctx.fillRect(cx - 1, cy - 2, 2, 18);
        // 小叶子
        ctx.fillStyle = '#32CD32';
        ctx.beginPath();
        ctx.ellipse(cx - 6, cy + 2, 6, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(cx + 6, cy - 2, 6, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 2: // 生长中
        ctx.fillStyle = '#228B22';
        ctx.fillRect(cx - 1, cy - 10, 2, 28);
        // 多片叶子
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 3; i++) {
          const ly = cy - 4 + i * 8;
          const dir = i % 2 === 0 ? -1 : 1;
          ctx.beginPath();
          ctx.ellipse(cx + dir * 10, ly, 8, 4, dir * 0.3, 0, Math.PI * 2);
          ctx.fill();
        }
        // 顶部小果实/花苞
        ctx.fillStyle = crop.data.color;
        ctx.beginPath();
        ctx.arc(cx, cy - 12, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 3: // 成熟
        // 茎
        ctx.fillStyle = '#228B22';
        ctx.fillRect(cx - 2, cy - 12, 4, 30);
        // 大叶子
        ctx.fillStyle = '#32CD32';
        for (let i = 0; i < 3; i++) {
          const ly = cy + i * 6;
          const dir = i % 2 === 0 ? -1 : 1;
          ctx.beginPath();
          ctx.ellipse(cx + dir * 12, ly, 10, 5, dir * 0.4, 0, Math.PI * 2);
          ctx.fill();
        }
        // 果实/花朵
        ctx.fillStyle = crop.data.color;
        ctx.beginPath();
        ctx.arc(cx, cy - 14, 8, 0, Math.PI * 2);
        ctx.fill();
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.arc(cx - 2, cy - 16, 3, 0, Math.PI * 2);
        ctx.fill();
        // 成熟提示
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', cx + 16, cy - 18);
        break;
    }
  }

  // 下雨效果
  drawRain(ctx, heavy) {
    const count = heavy ? 60 : 30;
    ctx.strokeStyle = 'rgba(150, 200, 255, 0.5)';
    ctx.lineWidth = 1;
    const time = Date.now() * 0.01;
    for (let i = 0; i < count; i++) {
      const rx = (Math.sin(i * 37.7 + time) * 0.5 + 0.5) * GRID_PX_W;
      const ry = ((time * 3 + i * 47.3) % GRID_PX_H);
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 2, ry + heavy ? 12 : 8);
      ctx.stroke();
    }
  }

  // ============ 绘制HUD ============
  drawHUD(gameState) {
    const ctx = this.ctx;
    const y0 = GRID_PX_H;

    // HUD背景
    ctx.fillStyle = this.COLORS.hudBg;
    ctx.fillRect(0, y0, GRID_PX_W, HUD_HEIGHT);

    // 顶部装饰线
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(0, y0, GRID_PX_W, 3);

    // === 第一行：状态信息 ===
    ctx.fillStyle = this.COLORS.hudText;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';

    const { season, day, hour, money, weather, seasonProgress } = gameState;

    // 季节+日期
    ctx.fillText(`${season} 第${day}天  ${hour}:00`, 10, y0 + 8);

    // 季节进度条
    const barX = 170;
    const barW = 80;
    ctx.fillStyle = '#3A2510';
    ctx.fillRect(barX, y0 + 8, barW, 14);
    const seasonColors = { '春': '#90EE90', '夏': '#FFD700', '秋': '#FF8C00', '冬': '#87CEEB' };
    ctx.fillStyle = seasonColors[season] || '#FFD700';
    ctx.fillRect(barX, y0 + 8, barW * seasonProgress, 14);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, y0 + 8, barW, 14);

    // 天气
    ctx.fillStyle = this.COLORS.hudText;
    ctx.fillText(`${weather.icon} ${weather.name}`, 265, y0 + 8);

    // 资金
    ctx.fillStyle = this.COLORS.hudAccent;
    ctx.fillText(`💰 ${money} 金币`, 380, y0 + 8);

    // 动物数量
    ctx.fillStyle = this.COLORS.hudText;
    ctx.fillText(`🐾 动物: ${gameState.animalCount}`, 530, y0 + 8);

    // === 第二行：工具栏 ===
    const toolY = y0 + 32;
    const toolKeys = Object.keys(TOOLS);
    const toolW = 70;
    const toolGap = 6;
    const totalToolW = toolKeys.length * toolW + (toolKeys.length - 1) * toolGap;
    const toolStartX = (GRID_PX_W - totalToolW) / 2;

    ctx.font = '13px sans-serif';
    toolKeys.forEach((key, i) => {
      const tx = toolStartX + i * (toolW + toolGap);
      const isSelected = this.selectedTool === key;
      const isHovered = this._isInRect(this._mx, this._my, tx, toolY, toolW, 28);

      ctx.fillStyle = isSelected ? '#8B6914' : isHovered ? this.COLORS.buttonHover : this.COLORS.buttonBg;
      ctx.fillRect(tx, toolY, toolW, 28);
      ctx.strokeStyle = isSelected ? '#FFD700' : '#6B4E0A';
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.strokeRect(tx, toolY, toolW, 28);

      ctx.fillStyle = isSelected ? '#FFD700' : this.COLORS.hudText;
      ctx.textAlign = 'center';
      ctx.fillText(`${TOOLS[key].icon} ${TOOLS[key].name}`, tx + toolW / 2, toolY + 9);
    });

    // === 第三行：种子选择栏（仅种植模式） ===
    if (this.selectedTool === 'plant' && this.selectedSeed) {
      ctx.fillStyle = this.COLORS.hudText;
      ctx.textAlign = 'left';
      ctx.font = '12px sans-serif';
      ctx.fillText(`当前种子: ${CROPS[this.selectedSeed].icon} ${CROPS[this.selectedSeed].name}`, 10, toolY + 34);
    }

    // === 第四行：功能按钮 ===
    const btnY = y0 + 68;
    const buttons = [
      { key: 'shop',   label: '🏪 商店 (B)', w: 90 },
      { key: 'animal', label: '🐾 动物 (N)', w: 90 },
      { key: 'collect', label: '📦 收集产品', w: 90 },
      { key: 'nextDay', label: '🌅 下一天 (Space)', w: 110 },
    ];
    const btnGap = 8;
    const totalBtnW = buttons.reduce((s, b) => s + b.w, 0) + (buttons.length - 1) * btnGap;
    let btnX = (GRID_PX_W - totalBtnW) / 2;

    buttons.forEach(btn => {
      const isHovered = this._isInRect(this._mx, this._my, btnX, btnY, btn.w, 30);
      ctx.fillStyle = isHovered ? this.COLORS.buttonHover : this.COLORS.buttonBg;
      ctx.fillRect(btnX, btnY, btn.w, 30);
      ctx.strokeStyle = '#6B4E0A';
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, btnY, btn.w, 30);

      ctx.fillStyle = isHovered ? '#FFD700' : this.COLORS.hudText;
      ctx.textAlign = 'center';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(btn.label, btnX + btn.w / 2, btnY + 10);
      btn.btnX = btnX;
      btnX += btn.w + btnGap;
    });

    // === 消息 ===
    if (this.message && this.messageTimer > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      const msgW = ctx.measureText(this.message).width + 30;
      const msgX = (GRID_PX_W - msgW) / 2;
      ctx.fillRect(msgX, y0 + 105, msgW, 24);
      ctx.fillStyle = this.messageColor;
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(this.message, GRID_PX_W / 2, y0 + 111);
      this.messageTimer--;
    }

    // 保存按钮区域供点击检测
    this._toolbarBtns = toolKeys.map((key, i) => ({
      key, x: toolStartX + i * (toolW + toolGap), y: toolY, w: toolW, h: 28
    }));
    this._funcBtns = buttons.map(b => ({ ...b, y: btnY, h: 30 }));
  }

  // ============ 绘制商店面板 ============
  drawShop(market, money, season, inventory, seeds, farmInventory) {
    const ctx = this.ctx;
    const panelW = 700;
    const panelH = 500;
    const px = (GRID_PX_W - panelW) / 2;
    const py = 20;

    // 半透明背景
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, GRID_PX_W, GRID_PX_H + HUD_HEIGHT);

    // 面板背景
    ctx.fillStyle = this.COLORS.shopBg;
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, panelW, panelH);

    // 标题
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏪 农场商店', GRID_PX_W / 2, py + 30);

    // 标签页
    const tabs = [
      { key: 'seeds', label: '🌱 种子' },
      { key: 'animals', label: '🐾 动物' },
      { key: 'sell', label: '💰 出售' },
    ];
    const tabW = 120;
    const tabY = py + 45;
    tabs.forEach((tab, i) => {
      const tx = GRID_PX_W / 2 - (tabs.length * tabW) / 2 + i * tabW;
      const isActive = this.selectedTab === tab.key;
      ctx.fillStyle = isActive ? '#8B6914' : '#3A2510';
      ctx.fillRect(tx, tabY, tabW - 4, 30);
      ctx.strokeStyle = isActive ? '#FFD700' : '#6B4E0A';
      ctx.lineWidth = isActive ? 2 : 1;
      ctx.strokeRect(tx, tabY, tabW - 4, 30);
      ctx.fillStyle = isActive ? '#FFD700' : '#D2B48C';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tab.label, tx + (tabW - 4) / 2, tabY + 10);
    });

    // 内容区
    const contentY = tabY + 40;
    ctx.fillStyle = '#1A0E06';
    ctx.fillRect(px + 10, contentY, panelW - 20, panelH - 100);
    ctx.strokeStyle = '#6B4E0A';
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 10, contentY, panelW - 20, panelH - 100);

    // 显示资金
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`💰 ${money} 金币`, px + panelW - 20, py + 30);

    // 当前季节
    ctx.fillStyle = '#90EE90';
    ctx.textAlign = 'left';
    ctx.fillText(`当前: ${season}`, px + 20, py + 30);

    this._shopItems = [];

    if (this.selectedTab === 'seeds') {
      this._drawSeedTab(ctx, market, money, season, seeds, px, contentY, panelW);
    } else if (this.selectedTab === 'animals') {
      this._drawAnimalTab(ctx, market, money, px, contentY, panelW);
    } else if (this.selectedTab === 'sell') {
      this._drawSellTab(ctx, market, farmInventory, px, contentY, panelW);
    }

    // 关闭按钮
    const closeX = px + panelW - 35;
    const closeY = py + 5;
    ctx.fillStyle = '#CC3333';
    ctx.fillRect(closeX, closeY, 28, 28);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', closeX + 14, closeY + 9);
    this._closeBtn = { x: closeX, y: closeY, w: 28, h: 28 };
  }

  _drawSeedTab(ctx, market, money, season, seeds, px, contentY, panelW) {
    const items = market.getSeedList();
    const itemH = 40;
    ctx.font = '13px sans-serif';

    items.forEach((item, i) => {
      const iy = contentY + 10 + i * itemH;
      const canPlant = item.seasons.includes(season);
      const canBuy = money >= item.price;
      const owned = seeds[item.type] || 0;

      // 行背景
      ctx.fillStyle = i % 2 === 0 ? 'rgba(60,30,10,0.5)' : 'rgba(40,20,5,0.5)';
      ctx.fillRect(px + 15, iy, panelW - 30, itemH - 2);

      // 图标+名称
      ctx.fillStyle = canPlant ? '#FFF' : '#888';
      ctx.textAlign = 'left';
      ctx.fillText(`${item.icon} ${item.name}`, px + 20, iy + 14);

      // 季节标签
      ctx.font = '11px sans-serif';
      ctx.fillStyle = canPlant ? '#90EE90' : '#FF6666';
      ctx.fillText(`适合: ${item.seasons.join('/')}`, px + 140, iy + 14);

      // 生长时间
      ctx.fillStyle = '#AAA';
      ctx.fillText(`生长: ${item.growTime}天`, px + 260, iy + 14);

      // 持有数量
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`持有: ${owned}`, px + 350, iy + 14);

      // 购买按钮
      ctx.font = '13px sans-serif';
      const btnX = px + panelW - 130;
      const btnW = 100;
      const isHovered = this._isInRect(this._mx, this._my, btnX, iy + 2, btnW, 24);
      ctx.fillStyle = !canBuy ? '#555' : isHovered ? '#7A4E2A' : '#5C3A1E';
      ctx.fillRect(btnX, iy + 2, btnW, 24);
      ctx.strokeStyle = canBuy ? '#8B6914' : '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, iy + 2, btnW, 24);
      ctx.fillStyle = canBuy ? '#FFD700' : '#888';
      ctx.textAlign = 'center';
      ctx.fillText(`购买 ${item.price}💰`, btnX + btnW / 2, iy + 13);

      this._shopItems.push({ type: 'seed', cropType: item.type, x: btnX, y: iy + 2, w: btnW, h: 24, price: item.price });
    });
  }

  _drawAnimalTab(ctx, market, money, px, contentY, panelW) {
    const items = market.getAnimalList();
    const itemH = 55;

    items.forEach((item, i) => {
      const iy = contentY + 10 + i * itemH;
      const canBuy = money >= item.price;

      ctx.fillStyle = i % 2 === 0 ? 'rgba(60,30,10,0.5)' : 'rgba(40,20,5,0.5)';
      ctx.fillRect(px + 15, iy, panelW - 30, itemH - 2);

      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'left';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(`${item.icon} ${item.name}`, px + 20, iy + 12);

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#CCC';
      ctx.fillText(`产出: ${item.product} (${item.price}💰/个)`, px + 20, iy + 32);

      const btnX = px + panelW - 130;
      const btnW = 100;
      const isHovered = this._isInRect(this._mx, this._my, btnX, iy + 10, btnW, 28);
      ctx.fillStyle = !canBuy ? '#555' : isHovered ? '#7A4E2A' : '#5C3A1E';
      ctx.fillRect(btnX, iy + 10, btnW, 28);
      ctx.strokeStyle = canBuy ? '#8B6914' : '#444';
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, iy + 10, btnW, 28);
      ctx.fillStyle = canBuy ? '#FFD700' : '#888';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`购买 ${item.price}💰`, btnX + btnW / 2, iy + 18);

      this._shopItems.push({ type: 'animal', animalType: item.type, x: btnX, y: iy + 10, w: btnW, h: 28, price: item.price });
    });
  }

  _drawSellTab(ctx, market, farmInventory, px, contentY, panelW) {
    const items = [];
    // 农作物库存
    for (const [key, inv] of Object.entries(farmInventory)) {
      if (inv.amount > 0) {
        items.push({
          category: 'crop', type: key, name: inv.name, icon: inv.icon,
          amount: inv.amount, price: market.getCropSellPrice(key),
        });
      }
    }

    if (items.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('暂无可出售物品', GRID_PX_W / 2, contentY + 60);
      return;
    }

    const itemH = 40;
    items.forEach((item, i) => {
      const iy = contentY + 10 + i * itemH;

      ctx.fillStyle = i % 2 === 0 ? 'rgba(60,30,10,0.5)' : 'rgba(40,20,5,0.5)';
      ctx.fillRect(px + 15, iy, panelW - 30, itemH - 2);

      ctx.fillStyle = '#FFF';
      ctx.textAlign = 'left';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${item.icon} ${item.name} x${item.amount}`, px + 20, iy + 14);
      ctx.fillStyle = '#FFD700';
      ctx.fillText(`单价: ${item.price}💰  总价: ${item.price * item.amount}💰`, px + 200, iy + 14);

      const btnX = px + panelW - 130;
      const btnW = 100;
      const isHovered = this._isInRect(this._mx, this._my, btnX, iy + 2, btnW, 24);
      ctx.fillStyle = isHovered ? '#7A4E2A' : '#5C3A1E';
      ctx.fillRect(btnX, iy + 2, btnW, 24);
      ctx.strokeStyle = '#8B6914';
      ctx.lineWidth = 1;
      ctx.strokeRect(btnX, iy + 2, btnW, 24);
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('出售全部', btnX + btnW / 2, iy + 13);

      this._shopItems.push({ type: 'sell', category: item.category, itemType: item.type, x: btnX, y: iy + 2, w: btnW, h: 24 });
    });
  }

  // ============ 动物面板 ============
  drawAnimalPanel(animalMgr) {
    const ctx = this.ctx;
    const panelW = 600;
    const panelH = 450;
    const px = (GRID_PX_W - panelW) / 2;
    const py = 30;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, GRID_PX_W, GRID_PX_H + HUD_HEIGHT);

    ctx.fillStyle = this.COLORS.shopBg;
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.strokeRect(px, py, panelW, panelH);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🐾 动物管理', GRID_PX_W / 2, py + 30);

    const animals = animalMgr.animals;
    if (animals.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.fillText('还没有动物，去商店购买吧！', GRID_PX_W / 2, py + 100);
    } else {
      const itemH = 50;
      animals.forEach((animal, i) => {
        const iy = py + 50 + i * itemH;
        if (iy + itemH > py + panelH - 50) return;

        ctx.fillStyle = i % 2 === 0 ? 'rgba(60,30,10,0.5)' : 'rgba(40,20,5,0.5)';
        ctx.fillRect(px + 10, iy, panelW - 20, itemH - 2);

        ctx.fillStyle = '#FFF';
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`${animal.data.icon} ${animal.name}`, px + 15, iy + 8);

        ctx.font = '11px sans-serif';
        // 饥饿条
        this._drawBar(ctx, px + 15, iy + 26, 80, 10, animal.hunger / 100,
          animal.hunger > 50 ? '#4CAF50' : animal.hunger > 20 ? '#FF9800' : '#F44336', '饱');
        // 清洁条
        this._drawBar(ctx, px + 105, iy + 26, 80, 10, animal.cleanliness / 100,
          animal.cleanliness > 50 ? '#2196F3' : '#FF9800', '洁');
        // 幸福条
        this._drawBar(ctx, px + 195, iy + 26, 80, 10, animal.happiness / 100,
          animal.happiness > 50 ? '#E91E63' : '#FF9800', '乐');

        // 产品状态
        ctx.fillStyle = animal.hasProduct ? '#FFD700' : '#888';
        ctx.textAlign = 'left';
        ctx.fillText(animal.hasProduct ? `有${animal.data.product}可收集` : '暂无产品', px + 290, iy + 30);

        // 喂养按钮
        const feedX = px + panelW - 170;
        const isHoveredFeed = this._isInRect(this._mx, this._my, feedX, iy + 5, 60, 22);
        ctx.fillStyle = isHoveredFeed ? '#7A4E2A' : '#5C3A1E';
        ctx.fillRect(feedX, iy + 5, 60, 22);
        ctx.fillStyle = '#FFD700';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('喂养', feedX + 30, iy + 14);

        // 清洁按钮
        const cleanX = px + panelW - 100;
        const isHoveredClean = this._isInRect(this._mx, this._my, cleanX, iy + 5, 60, 22);
        ctx.fillStyle = isHoveredClean ? '#7A4E2A' : '#5C3A1E';
        ctx.fillRect(cleanX, iy + 5, 60, 22);
        ctx.fillStyle = '#FFD700';
        ctx.textAlign = 'center';
        ctx.fillText('清洁', cleanX + 30, iy + 14);

        if (!this._animalActions) this._animalActions = [];
        this._animalActions.push({ id: animal.id, feedX, cleanX, y: iy + 5 });
      });
    }

    // 关闭按钮
    const closeX = px + panelW - 35;
    const closeY = py + 5;
    ctx.fillStyle = '#CC3333';
    ctx.fillRect(closeX, closeY, 28, 28);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', closeX + 14, closeY + 9);
    this._closeBtn = { x: closeX, y: closeY, w: 28, h: 28 };
  }

  _drawBar(ctx, x, y, w, h, ratio, color, label) {
    ctx.fillStyle = '#1A0E06';
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w * Math.max(0, Math.min(1, ratio)), h);
    ctx.strokeStyle = '#6B4E0A';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#FFF';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${label} ${Math.round(ratio * 100)}%`, x + w / 2, y + 8);
  }

  // ============ 绘制种子选择面板 ============
  drawSeedSelectPanel(seeds, season) {
    const ctx = this.ctx;
    const panelW = 350;
    const panelH = 300;
    const px = (GRID_PX_W - panelW) / 2;
    const py = 80;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, GRID_PX_W, GRID_PX_H + HUD_HEIGHT);

    ctx.fillStyle = this.COLORS.shopBg;
    ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, panelW, panelH);

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('选择种子', GRID_PX_W / 2, py + 25);

    const seedList = Object.entries(seeds).filter(([_, count]) => count > 0);
    if (seedList.length === 0) {
      ctx.fillStyle = '#888';
      ctx.font = '14px sans-serif';
      ctx.fillText('没有种子，请先去商店购买', GRID_PX_W / 2, py + 80);
    }

    this._seedSelectItems = [];
    const itemH = 35;
    seedList.forEach(([type, count], i) => {
      const iy = py + 40 + i * itemH;
      const crop = CROPS[type];
      const canPlant = crop.seasons.includes(season);

      ctx.fillStyle = i % 2 === 0 ? 'rgba(60,30,10,0.5)' : 'rgba(40,20,5,0.5)';
      ctx.fillRect(px + 10, iy, panelW - 20, itemH - 2);

      ctx.fillStyle = canPlant ? '#FFF' : '#888';
      ctx.textAlign = 'left';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${crop.icon} ${crop.name} x${count}`, px + 20, iy + 12);

      ctx.fillStyle = canPlant ? '#90EE90' : '#FF6666';
      ctx.font = '11px sans-serif';
      ctx.fillText(canPlant ? `${season}可种` : `${season}不可种`, px + 180, iy + 12);

      this._seedSelectItems.push({ type, x: px + 10, y: iy, w: panelW - 20, h: itemH - 2, canPlant });
    });

    // 关闭按钮
    const closeX = px + panelW - 30;
    const closeY = py + 3;
    ctx.fillStyle = '#CC3333';
    ctx.fillRect(closeX, closeY, 24, 24);
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('X', closeX + 12, closeY + 7);
    this._closeBtn = { x: closeX, y: closeY, w: 24, h: 24 };
  }

  // ============ 绘制信息提示（悬停地块） ============
  drawTooltip(farm, row, col) {
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return;
    const info = farm.getTileInfo(row, col);
    if (!info) return;

    const ctx = this.ctx;
    const x = col * TILE_SIZE + TILE_SIZE / 2;
    const y = row * TILE_SIZE;

    let lines = [];
    if (info.state === TILE_STATES.GRASS) {
      lines = ['草地', '使用锄头翻地'];
    } else if (info.state === TILE_STATES.TILLED) {
      lines = ['已翻地', '可种植作物'];
    } else if (info.crop) {
      const crop = info.crop;
      lines = [
        `${crop.data.icon} ${crop.data.name}`,
        `阶段: ${crop.getStageName()}`,
        crop.watered ? '已浇水 ✓' : '需要浇水!',
      ];
      if (crop.isHarvestable()) {
        lines.push('可收获! 使用镰刀');
      }
      if (!crop.alive) {
        lines = [`${crop.data.icon} ${crop.data.name}`, '已枯萎', '使用锄头清除'];
      }
    }

    if (lines.length === 0) return;

    ctx.font = '12px sans-serif';
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width));
    const tw = maxW + 20;
    const th = lines.length * 18 + 10;
    let tx = Math.min(x - tw / 2, GRID_PX_W - tw - 5);
    let ty = y - th - 5;
    if (ty < 5) ty = y + TILE_SIZE + 5;
    tx = Math.max(5, tx);

    ctx.fillStyle = 'rgba(20, 10, 5, 0.9)';
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1;
    ctx.strokeRect(tx, ty, tw, th);

    ctx.fillStyle = '#F5DEB3';
    ctx.textAlign = 'left';
    lines.forEach((line, i) => {
      ctx.fillText(line, tx + 10, ty + 16 + i * 18);
    });
  }

  // ============ 辅助方法 ============
  _isInRect(mx, my, x, y, w, h) {
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  }

  getClickedTool(mx, my) {
    if (!this._toolbarBtns) return null;
    for (const btn of this._toolbarBtns) {
      if (this._isInRect(mx, my, btn.x, btn.y, btn.w, btn.h)) return btn.key;
    }
    return null;
  }

  getClickedFuncBtn(mx, my) {
    if (!this._funcBtns) return null;
    for (const btn of this._funcBtns) {
      if (this._isInRect(mx, my, btn.btnX, btn.y, btn.w, btn.h)) return btn.key;
    }
    return null;
  }

  getClickedShopItem(mx, my) {
    if (!this._shopItems) return null;
    for (const item of this._shopItems) {
      if (this._isInRect(mx, my, item.x, item.y, item.w, item.h)) return item;
    }
    return null;
  }

  getClickedSeedSelect(mx, my) {
    if (!this._seedSelectItems) return null;
    for (const item of this._seedSelectItems) {
      if (this._isInRect(mx, my, item.x, item.y, item.w, item.h)) return item;
    }
    return null;
  }

  getClickedCloseBtn(mx, my) {
    if (!this._closeBtn) return false;
    return this._isInRect(mx, my, this._closeBtn.x, this._closeBtn.y, this._closeBtn.w, this._closeBtn.h);
  }

  getClickedAnimalAction(mx, my) {
    if (!this._animalActions) return null;
    for (const act of this._animalActions) {
      if (this._isInRect(mx, my, act.feedX, act.y, 60, 22)) return { id: act.id, action: 'feed' };
      if (this._isInRect(mx, my, act.cleanX, act.y, 60, 22)) return { id: act.id, action: 'clean' };
    }
    return null;
  }

  getClickedTile(mx, my) {
    const col = Math.floor(mx / TILE_SIZE);
    const row = Math.floor(my / TILE_SIZE);
    if (row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS) {
      return { row, col };
    }
    return null;
  }

  updateMouse(mx, my) {
    this._mx = mx;
    this._my = my;
    if (my < GRID_PX_H) {
      this.hoveredTile = this.getClickedTile(mx, my);
    } else {
      this.hoveredTile = null;
    }
  }
}
