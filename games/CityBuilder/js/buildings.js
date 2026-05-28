// ============================================
// 城市建设者 - 建筑系统
// ============================================

import { BUILDINGS, BUILDING_ORDER, UPGRADE_COST_MULTIPLIER, MAX_BUILDING_LEVEL, GRID } from './config.js';

export class BuildingSystem {
  constructor(grid, economy) {
    this.grid = grid;
    this.economy = economy;
    this.selectedType = null;
    this.selectedCell = null; // { col, row } 当前选中的格子
  }

  // 选择建筑类型
  selectType(type) {
    if (this.selectedType === type) {
      this.selectedType = null; // 取消选择
    } else {
      this.selectedType = type;
    }
    this.selectedCell = null;
  }

  // 选择格子
  selectCell(col, row) {
    const building = this.grid.getBuilding(col, row);
    if (building) {
      this.selectedCell = { col, row };
      this.selectedType = null;
    } else {
      this.selectedCell = null;
    }
  }

  // 能否放置
  canPlace(type, col, row) {
    const config = BUILDINGS[type];
    if (!config) return false;
    if (!this.grid.isEmpty(col, row)) return false;
    if (this.economy.gold < config.cost) return false;
    return true;
  }

  // 放置建筑
  place(type, col, row) {
    if (!this.canPlace(type, col, row)) return null;
    const config = BUILDINGS[type];

    const building = {
      type,
      level: 1,
      placedDay: this.economy.day,
      workers: 0
    };

    if (this.grid.placeBuilding(col, row, building)) {
      this.economy.spendGold(config.cost);
      return building;
    }
    return null;
  }

  // 拆除建筑
  demolish(col, row) {
    const building = this.grid.getBuilding(col, row);
    if (!building) return null;
    const config = BUILDINGS[building.type];
    const refund = Math.floor(config.cost * 0.5 * building.level);
    this.economy.gold += refund;
    this.grid.removeBuilding(col, row);
    if (this.selectedCell && this.selectedCell.col === col && this.selectedCell.row === row) {
      this.selectedCell = null;
    }
    return { building, refund };
  }

  // 升级建筑
  upgrade(col, row) {
    const building = this.grid.getBuilding(col, row);
    if (!building) return null;
    if (building.level >= MAX_BUILDING_LEVEL) return null;

    const config = BUILDINGS[building.type];
    const upgradeCost = Math.floor(config.cost * Math.pow(UPGRADE_COST_MULTIPLIER, building.level));

    if (this.economy.gold < upgradeCost) return null;

    this.economy.gold -= upgradeCost;
    building.level++;
    return { building, cost: upgradeCost };
  }

  // 获取升级费用
  getUpgradeCost(col, row) {
    const building = this.grid.getBuilding(col, row);
    if (!building || building.level >= MAX_BUILDING_LEVEL) return null;
    const config = BUILDINGS[building.type];
    return Math.floor(config.cost * Math.pow(UPGRADE_COST_MULTIPLIER, building.level));
  }

  // 渲染建筑
  render(ctx, camera, hoverCell, dayProgress) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    const cellSize = GRID.cellSize;

    // 遍历所有格子绘制建筑
    const { x: sx, y: sy } = camera.screenToWorld(0, 0);
    const { x: ex, y: ey } = camera.screenToWorld(camera.screenW, camera.screenH);
    const sc = Math.max(0, Math.floor(sx / cellSize));
    const sr = Math.max(0, Math.floor(sy / cellSize));
    const ec = Math.min(GRID.cols - 1, Math.ceil(ex / cellSize));
    const er = Math.min(GRID.rows - 1, Math.ceil(ey / cellSize));

    for (let r = sr; r <= er; r++) {
      for (let c = sc; c <= ec; c++) {
        const building = this.grid.getBuilding(c, r);
        if (!building) continue;
        this.drawBuilding(ctx, building, c * cellSize, r * cellSize, cellSize);
      }
    }

    // 绘制悬停预览
    if (hoverCell && this.selectedType) {
      const { col, row } = hoverCell;
      if (this.grid.isValid(col, row)) {
        const wx = col * cellSize;
        const wy = row * cellSize;
        const canPlace = this.canPlace(this.selectedType, col, row);

        ctx.globalAlpha = 0.5;
        if (canPlace) {
          this.drawBuilding(ctx, { type: this.selectedType, level: 1 }, wx, wy, cellSize);
        } else {
          ctx.fillStyle = 'rgba(244, 67, 54, 0.4)';
          ctx.fillRect(wx + 1, wy + 1, cellSize - 2, cellSize - 2);
          ctx.strokeStyle = '#F44336';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(wx + 4, wy + 4);
          ctx.lineTo(wx + cellSize - 4, wy + cellSize - 4);
          ctx.moveTo(wx + cellSize - 4, wy + 4);
          ctx.lineTo(wx + 4, wy + cellSize - 4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }
    }

    // 绘制选中高亮
    if (this.selectedCell) {
      const { col, row } = this.selectedCell;
      const wx = col * cellSize;
      const wy = row * cellSize;
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(wx + 1, wy + 1, cellSize - 2, cellSize - 2);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  // 绘制单个建筑
  drawBuilding(ctx, building, x, y, size) {
    const config = BUILDINGS[building.type];
    if (!config) return;

    const level = building.level || 1;
    const padding = 2;
    const bx = x + padding;
    const by = y + padding;
    const bw = size - padding * 2;
    const bh = size - padding * 2;

    // 建筑底色
    ctx.fillStyle = config.color;
    ctx.fillRect(bx, by, bw, bh);

    // 深色边框
    ctx.strokeStyle = config.colorDark;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // 建筑细节
    this.drawBuildingDetail(ctx, building.type, bx, by, bw, bh);

    // 图标
    ctx.font = `${size * 0.45}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.fillText(config.icon, x + size / 2, y + size / 2);

    // 等级标识
    if (level > 1) {
      ctx.font = `bold ${size * 0.22}px sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#FFD700';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      const starText = '★'.repeat(level - 1);
      ctx.strokeText(starText, bx + 2, by + 1);
      ctx.fillText(starText, bx + 2, by + 1);
    }
  }

  // 绘制建筑细节
  drawBuildingDetail(ctx, type, x, y, w, h) {
    ctx.save();
    switch (type) {
      case 'residential':
        // 屋顶
        ctx.fillStyle = '#795548';
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.35);
        ctx.lineTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h * 0.35);
        ctx.closePath();
        ctx.fill();
        break;

      case 'commercial':
        // 橱窗
        ctx.fillStyle = '#1565C0';
        ctx.fillRect(x + w * 0.15, y + h * 0.5, w * 0.7, h * 0.35);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + w * 0.15, y + h * 0.5, w * 0.7, h * 0.35);
        break;

      case 'industrial':
        // 烟囱
        ctx.fillStyle = '#455A64';
        ctx.fillRect(x + w * 0.7, y, w * 0.2, h * 0.5);
        // 烟
        ctx.fillStyle = 'rgba(200,200,200,0.5)';
        ctx.beginPath();
        ctx.arc(x + w * 0.8, y - 3, 4, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'farm':
        // 作物行
        ctx.fillStyle = '#8BC34A';
        for (let i = 0; i < 3; i++) {
          ctx.fillRect(x + w * 0.15, y + h * (0.2 + i * 0.25), w * 0.7, h * 0.1);
        }
        break;

      case 'school':
        // 旗子
        ctx.fillStyle = '#E65100';
        ctx.fillRect(x + w * 0.1, y, 2, h * 0.6);
        ctx.fillStyle = '#F44336';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.1 + 2, y);
        ctx.lineTo(x + w * 0.1 + 12, y + 5);
        ctx.lineTo(x + w * 0.1 + 2, y + 10);
        ctx.closePath();
        ctx.fill();
        break;

      case 'hospital':
        // 红十字
        ctx.fillStyle = '#fff';
        ctx.fillRect(x + w * 0.4, y + h * 0.15, w * 0.2, h * 0.7);
        ctx.fillRect(x + w * 0.15, y + h * 0.4, w * 0.7, h * 0.2);
        break;

      case 'police':
        // 警徽
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(x + w / 2, y + h * 0.3, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'park':
        // 树
        ctx.fillStyle = '#2E7D32';
        ctx.beginPath();
        ctx.arc(x + w * 0.3, y + h * 0.35, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + w * 0.7, y + h * 0.4, w * 0.15, 0, Math.PI * 2);
        ctx.fill();
        // 树干
        ctx.fillStyle = '#795548';
        ctx.fillRect(x + w * 0.28, y + h * 0.5, w * 0.06, h * 0.3);
        ctx.fillRect(x + w * 0.67, y + h * 0.52, w * 0.06, h * 0.25);
        break;

      case 'powerplant':
        // 闪电
        ctx.fillStyle = '#FF6F00';
        ctx.beginPath();
        ctx.moveTo(x + w * 0.55, y + h * 0.1);
        ctx.lineTo(x + w * 0.35, y + h * 0.5);
        ctx.lineTo(x + w * 0.5, y + h * 0.5);
        ctx.lineTo(x + w * 0.4, y + h * 0.9);
        ctx.lineTo(x + w * 0.7, y + h * 0.4);
        ctx.lineTo(x + w * 0.55, y + h * 0.4);
        ctx.closePath();
        ctx.fill();
        break;

      case 'road':
        // 道路标线
        ctx.fillStyle = '#757575';
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + w * 0.5, y);
        ctx.lineTo(x + w * 0.5, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y + h * 0.5);
        ctx.lineTo(x + w, y + h * 0.5);
        ctx.stroke();
        ctx.setLineDash([]);
        break;
    }
    ctx.restore();
  }
}
