// ============================================================
// ui.js - Canvas渲染餐厅场景、HUD、覆盖层
// ============================================================
import {
  TILE, COLS, ROWS, CANVAS_W, CANVAS_H, COLORS,
  LAYOUT_TEMPLATE, TABLE_POSITIONS, ENTRANCE,
  DISHES, DECORATIONS, KITCHEN_UPGRADES, STAFF_TYPES,
} from './config.js';
import { CUST_STATE } from './customer.js';
import { ORDER_STATE } from './cooking.js';

// roundRect polyfill for older browsers
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
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
    return this;
  };
}

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // 覆盖层状态
    this.overlay = null; // { type, data, onClose }

    // 动画帧计数
    this.frame = 0;

    // 浮动文字
    this.floatingTexts = [];

    // HUD高度
    this.hudHeight = 80;

    // 点击区域记录（用于事件处理）
    this.clickAreas = [];

    // 菜单滚动偏移
    this.menuScrollY = 0;
  }

  // 添加浮动文字（收钱、升级提示等）
  addFloatingText(x, y, text, color = '#FFD700') {
    this.floatingTexts.push({ x, y, text, color, life: 1.5, startY: y });
  }

  // ============ 渲染主入口 ============
  render(game) {
    const ctx = this.ctx;
    this.frame++;
    this.clickAreas = [];

    // 清屏
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 绘制餐厅场景
    this.drawRestaurant(ctx, game);

    // 绘制顾客
    this.drawCustomers(ctx, game);

    // 绘制员工
    this.drawStaff(ctx, game);

    // 绘制浮动文字
    this.drawFloatingTexts(ctx, game.dt);

    // 绘制HUD（顶部信息栏）
    this.drawHUD(ctx, game);

    // 绘制底部操作栏
    this.drawBottomBar(ctx, game);

    // 绘制覆盖层
    if (this.overlay) {
      this.drawOverlay(ctx, game);
    }
  }

  // ============ 餐厅场景 ============
  drawRestaurant(ctx, game) {
    const layout = game.restaurant.layout;
    const offsetY = this.hudHeight;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * TILE;
        const y = r * TILE + offsetY;
        const cell = layout[r][c];

        switch (cell) {
          case 0: // 空地/地板
            ctx.fillStyle = (r <= 4) ? COLORS.kitchenFloor : COLORS.floor;
            ctx.fillRect(x, y, TILE, TILE);
            // 地板纹理
            ctx.strokeStyle = 'rgba(0,0,0,0.08)';
            ctx.strokeRect(x, y, TILE, TILE);
            break;
          case 1: // 墙
            ctx.fillStyle = COLORS.wall;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x, y, TILE, 4);
            break;
          case 2: // 桌子
            ctx.fillStyle = (r <= 4) ? COLORS.kitchenFloor : COLORS.floor;
            ctx.fillRect(x, y, TILE, TILE);
            this.drawTable(ctx, x, y);
            break;
          case 3: // 椅子
            ctx.fillStyle = (r <= 4) ? COLORS.kitchenFloor : COLORS.floor;
            ctx.fillRect(x, y, TILE, TILE);
            this.drawChair(ctx, x, y);
            break;
          case 4: // 灶台
            ctx.fillStyle = COLORS.kitchenFloor;
            ctx.fillRect(x, y, TILE, TILE);
            this.drawStove(ctx, x, y, game);
            break;
          case 5: // 门口
            ctx.fillStyle = COLORS.door;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = '#FFF';
            ctx.font = `${TILE * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\u{1F6AA}', x + TILE / 2, y + TILE / 2);
            break;
          case 6: // 柜台
            ctx.fillStyle = COLORS.floor;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = COLORS.counter;
            ctx.fillRect(x + 2, y + TILE * 0.3, TILE - 4, TILE * 0.5);
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(x + 4, y + TILE * 0.2, TILE - 8, 4);
            break;
          case 7: // 装饰
            ctx.fillStyle = (r <= 4) ? COLORS.kitchenFloor : COLORS.floor;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = COLORS.decoration;
            ctx.font = `${TILE * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('\u{1F33F}', x + TILE / 2, y + TILE / 2);
            break;
          case 8: // 厨房墙
            ctx.fillStyle = COLORS.kitchenWall;
            ctx.fillRect(x, y, TILE, TILE);
            ctx.fillStyle = 'rgba(255,255,255,0.05)';
            ctx.fillRect(x, y, TILE, 2);
            break;
        }
      }
    }

    // 区域标签
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u{1F373} 厨房', CANVAS_W / 2, offsetY + 1.5 * TILE);
    ctx.fillText('\u{1F37D}\u{FE0F} 用餐区', CANVAS_W / 2, offsetY + 9 * TILE);
    ctx.fillText('\u{1F3EA} 入口', 8 * TILE, offsetY + 18.5 * TILE);

    // 桌号标记
    for (const t of TABLE_POSITIONS) {
      const tx = t.col * TILE + TILE / 2;
      const ty = t.row * TILE + offsetY - 4;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`T${t.id + 1}`, tx, ty);
    }

    // 清洁度指示
    const cleanBarX = CANVAS_W - 120;
    const cleanBarY = offsetY + 18.5 * TILE;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cleanBarX, cleanBarY, 100, 12);
    const cl = game.restaurant.cleanliness;
    ctx.fillStyle = cl > 70 ? COLORS.success : cl > 40 ? COLORS.accent : COLORS.danger;
    ctx.fillRect(cleanBarX, cleanBarY, cl, 12);
    ctx.fillStyle = COLORS.text;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`清洁 ${Math.floor(cl)}%`, cleanBarX, cleanBarY - 2);
  }

  drawTable(ctx, x, y) {
    // 桌面
    ctx.fillStyle = COLORS.table;
    const pad = 6;
    ctx.beginPath();
    ctx.roundRect(x + pad, y + pad, TILE - pad * 2, TILE - pad * 2, 4);
    ctx.fill();
    // 桌布纹理
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + pad + 2, y + pad + 2, TILE - pad * 2 - 4, 3);
  }

  drawChair(ctx, x, y) {
    ctx.fillStyle = COLORS.chair;
    const cx = x + TILE / 2;
    const cy = y + TILE / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.1)';
    ctx.beginPath();
    ctx.arc(cx, cy, TILE * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  drawStove(ctx, x, y, game) {
    // 灶台底座
    ctx.fillStyle = COLORS.stove;
    ctx.fillRect(x + 4, y + 4, TILE - 8, TILE - 8);
    // 火焰（如果在烹饪中）
    const isCooking = game.cookingSystem.getCookingOrders().length > 0;
    if (isCooking && this.frame % 20 < 10) {
      ctx.fillStyle = '#FF5722';
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + TILE / 2, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFC107';
      ctx.beginPath();
      ctx.arc(x + TILE / 2, y + TILE / 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    // 锅图标
    ctx.font = `${TILE * 0.5}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('\u{1F373}', x + TILE / 2, y + TILE / 2);
  }

  // ============ 顾客 ============
  drawCustomers(ctx, game) {
    const offsetY = this.hudHeight;
    for (const c of game.customerManager.customers) {
      const px = c.x * TILE;
      const py = c.y * TILE + offsetY;

      // 身体
      ctx.fillStyle = c.shirtColor;
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + TILE * 0.6, TILE * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // 头
      ctx.fillStyle = c.skinTone;
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + TILE * 0.3, TILE * 0.22, 0, Math.PI * 2);
      ctx.fill();

      // 头发
      ctx.fillStyle = c.hairColor;
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + TILE * 0.22, TILE * 0.22, Math.PI, Math.PI * 2);
      ctx.fill();

      // 状态指示
      this.drawCustomerStatus(ctx, px, py, c);

      // 耐心条
      if (c.state === CUST_STATE.WAITING || c.state === CUST_STATE.SITTING || c.state === CUST_STATE.EATING) {
        const barW = TILE * 0.8;
        const barH = 3;
        const barX = px + (TILE - barW) / 2;
        const barY = py - 6;
        const pct = c.patience / c.maxPatience;
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = pct > 0.5 ? COLORS.success : pct > 0.25 ? COLORS.accent : COLORS.danger;
        ctx.fillRect(barX, barY, barW * pct, barH);
      }
    }
  }

  drawCustomerStatus(ctx, px, py, customer) {
    let icon = '';
    let color = '#FFF';
    switch (customer.state) {
      case CUST_STATE.SITTING:
        icon = '\u{1F4AC}'; color = '#FFD700';
        break;
      case CUST_STATE.ORDERING:
        icon = '\u{1F4CB}'; color = '#4FC3F7';
        break;
      case CUST_STATE.WAITING:
        icon = '\u{23F3}'; color = '#FF9800';
        break;
      case CUST_STATE.EATING:
        icon = '\u{1F60B}'; color = '#4CAF50';
        break;
      case CUST_STATE.PAYING:
        icon = '\u{1F4B5}'; color = '#FFD700';
        break;
      case CUST_STATE.ANGRY:
        icon = '\u{1F621}'; color = '#F44336';
        break;
    }
    if (icon) {
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = color;
      ctx.fillText(icon, px + TILE / 2, py - 8);
    }
  }

  // ============ 员工 ============
  drawStaff(ctx, game) {
    const offsetY = this.hudHeight;
    for (const s of game.staffManager.staffList) {
      const px = s.x * TILE;
      const py = s.y * TILE + offsetY;

      // 员工圆圈
      ctx.fillStyle = s.type === 'chef' ? '#FFFFFF' : '#2196F3';
      ctx.strokeStyle = s.type === 'chef' ? '#FF5722' : '#1565C0';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + TILE / 2, TILE * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 图标
      ctx.font = `${TILE * 0.45}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(s.icon, px + TILE / 2, py + TILE / 2);

      // 等级
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText(`Lv${s.level}`, px + TILE / 2, py + TILE - 2);

      // 忙碌指示
      if (s.busy) {
        ctx.fillStyle = 'rgba(255,152,0,0.3)';
        ctx.beginPath();
        ctx.arc(px + TILE / 2, py + TILE / 2, TILE * 0.4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ============ 浮动文字 ============
  drawFloatingTexts(ctx, dt) {
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      ft.y -= dt * 40;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      const alpha = Math.min(1, ft.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.globalAlpha = 1;
    }
  }

  // ============ HUD ============
  drawHUD(ctx, game) {
    // 背景
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, CANVAS_W, this.hudHeight);

    // 金币
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`\u{1F4B0} ${game.money}`, 10, 22);

    // 餐厅等级
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(`\u{2B50} Lv.${game.restaurantLevel}`, 10, 45);

    // 经验
    const expPct = game.expToNext > 0 ? (game.exp / game.expToNext * 100) : 0;
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fillRect(10, 52, 100, 8);
    ctx.fillStyle = COLORS.info;
    ctx.fillRect(10, 52, expPct, 8);
    ctx.fillStyle = '#FFF';
    ctx.font = '9px sans-serif';
    ctx.fillText(`${game.exp}/${game.expToNext} EXP`, 12, 59);

    // 时间/天数
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    const timeStr = game.isNight
      ? `\u{1F319} 夜晚 - 结算中`
      : `\u{2600}\u{FE0F} 第${game.day}天 ${Math.floor(game.dayTimer)}s`;
    ctx.fillText(timeStr, CANVAS_W / 2, 22);

    // 速度
    const speedLabels = ['1x', '2x', '3x'];
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(`\u{23E9} ${speedLabels[game.speedIdx]}`, CANVAS_W / 2, 45);

    // 今日统计
    ctx.textAlign = 'right';
    ctx.fillStyle = '#4CAF50';
    ctx.font = '13px sans-serif';
    ctx.fillText(`\u{1F4B0}+${game.todayRevenue}`, CANVAS_W - 10, 22);
    ctx.fillStyle = '#FF9800';
    ctx.fillText(`\u{1F464} ${game.customerManager.activeCustomers.length}客`, CANVAS_W - 10, 40);
    ctx.fillStyle = '#F44336';
    ctx.fillText(`\u{1F621} ${game.customerManager.totalAngry}走`, CANVAS_W - 10, 58);
  }

  // ============ 底部操作栏 ============
  drawBottomBar(ctx, game) {
    const barH = 50;
    const barY = CANVAS_H - barH;
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, barY, CANVAS_W, barH);

    const buttons = [
      { label: '\u{1F4D6} 菜单', action: 'menu' },
      { label: '\u{1F468}\u{200D}\u{1F373} 员工', action: 'staff' },
      { label: '\u{1F3E0} 装修', action: 'decor' },
      { label: '\u{2699}\u{FE0F} 厨房', action: 'kitchen' },
      { label: '\u{23E9} 速度', action: 'speed' },
    ];

    const btnW = (CANVAS_W - 20) / buttons.length;
    buttons.forEach((btn, i) => {
      const bx = 10 + i * btnW;
      const by = barY + 5;
      const bw = btnW - 6;
      const bh = barH - 10;

      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(bx, by, bw, bh, 6);
      ctx.fill();

      ctx.fillStyle = COLORS.text;
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(btn.label, bx + bw / 2, by + bh / 2);

      this.clickAreas.push({
        x: bx, y: by, w: bw, h: bh,
        action: btn.action,
      });
    });
  }

  // ============ 覆盖层 ============
  drawOverlay(ctx, game) {
    // 半透明背景
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    const panelW = CANVAS_W - 40;
    const panelH = CANVAS_H - 160;
    const panelX = 20;
    const panelY = 90;

    // 面板
    ctx.fillStyle = COLORS.panelBg;
    ctx.beginPath();
    ctx.roundRect(panelX, panelY, panelW, panelH, 12);
    ctx.fill();

    // 标题
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(this.overlay.title, CANVAS_W / 2, panelY + 30);

    // 关闭按钮
    const closeX = panelX + panelW - 36;
    const closeY = panelY + 8;
    ctx.fillStyle = COLORS.danger;
    ctx.beginPath();
    ctx.roundRect(closeX, closeY, 28, 28, 6);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('\u{2716}', closeX + 14, closeY + 18);
    this.clickAreas.push({
      x: closeX, y: closeY, w: 28, h: 28,
      action: 'close_overlay',
    });

    // 内容
    switch (this.overlay.type) {
      case 'menu': this.drawMenuPanel(ctx, panelX, panelY + 50, panelW, panelH - 60, game); break;
      case 'staff': this.drawStaffPanel(ctx, panelX, panelY + 50, panelW, panelH - 60, game); break;
      case 'decor': this.drawDecorPanel(ctx, panelX, panelY + 50, panelW, panelH - 60, game); break;
      case 'kitchen': this.drawKitchenPanel(ctx, panelX, panelY + 50, panelW, panelH - 60, game); break;
      case 'night': this.drawNightPanel(ctx, panelX, panelY + 50, panelW, panelH - 60, game); break;
    }
  }

  // --- 菜单面板 ---
  drawMenuPanel(ctx, x, y, w, h, game) {
    const dishes = game.menu.getAvailableDishes();
    const itemH = 50;

    ctx.font = '14px sans-serif';
    dishes.forEach((dish, i) => {
      const iy = y + 10 + i * itemH - this.menuScrollY;
      if (iy < y - itemH || iy > y + h) return;

      // 背景
      ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(x + 10, iy, w - 20, itemH - 4);

      // 菜品图标
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(dish.icon, x + 20, iy + 30);

      // 菜名
      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText(dish.name, x + 55, iy + 18);

      // 信息
      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#AAA';
      ctx.fillText(`烹饪 ${dish.cookTime}s | 成本 \u{1F4B0}${dish.cost}`, x + 55, iy + 35);

      // 售价
      ctx.fillStyle = '#4CAF50';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`\u{1F4B0}${dish.price}`, x + w - 20, iy + 25);

      // 利润
      ctx.fillStyle = dish.price - dish.cost > 10 ? '#4CAF50' : '#FF9800';
      ctx.font = '11px sans-serif';
      ctx.fillText(`利润+${dish.price - dish.cost}`, x + w - 20, iy + 40);
    });
  }

  // --- 员工面板 ---
  drawStaffPanel(ctx, x, y, w, h, game) {
    const sm = game.staffManager;
    let iy = y + 10;

    // 现有员工列表
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('\u{1F4CB} 现有员工', x + 15, iy);
    iy += 25;

    for (const s of sm.staffList) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x + 10, iy, w - 20, 44);

      ctx.font = '20px sans-serif';
      ctx.fillText(s.icon, x + 20, iy + 28);

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(`${s.name} Lv.${s.level}`, x + 50, iy + 18);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#AAA';
      const info = s.type === 'chef'
        ? `速度 ${s.speed.toFixed(2)} | 工资 ${s.salary}/天`
        : `速度 ${s.speed.toFixed(2)} | 服务 ${s.capacity}桌 | 工资 ${s.salary}/天`;
      ctx.fillText(info, x + 50, iy + 35);

      // 升级按钮
      if (s.level < s.config.maxLevel) {
        const btnX = x + w - 120;
        const btnW = 50;
        ctx.fillStyle = COLORS.info;
        ctx.beginPath();
        ctx.roundRect(btnX, iy + 10, btnW, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`\u{2B06}\u{FE0F}${s.upgradeCost}`, btnX + btnW / 2, iy + 25);
        this.clickAreas.push({
          x: btnX, y: iy + 10, w: btnW, h: 24,
          action: 'upgrade_staff', staffId: s.id,
        });
      }

      iy += 50;
    }

    iy += 10;

    // 雇佣按钮
    const hireTypes = [
      { type: 'chef', label: '\u{1F468}\u{200D}\u{1F373} 雇佣厨师' },
      { type: 'waiter', label: '\u{1F469}\u{200D}\u{1F373} 雇佣服务员' },
    ];

    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('\u{2795} 雇佣新员工', x + 15, iy);
    iy += 25;

    for (const ht of hireTypes) {
      const cost = sm.getHireCost(ht.type);
      const btnX = x + 15;
      const btnW = w - 30;
      const canHire = game.money >= cost;

      ctx.fillStyle = canHire ? 'rgba(76,175,80,0.2)' : 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.roundRect(btnX, iy, btnW, 36, 6);
      ctx.fill();

      ctx.fillStyle = canHire ? COLORS.text : '#666';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(ht.label, btnX + 10, iy + 22);

      ctx.textAlign = 'right';
      ctx.fillStyle = canHire ? '#FFD700' : '#666';
      ctx.fillText(`\u{1F4B0}${cost}`, btnX + btnW - 10, iy + 22);

      if (canHire) {
        this.clickAreas.push({
          x: btnX, y: iy, w: btnW, h: 36,
          action: `hire_${ht.type}`,
        });
      }
      iy += 42;
    }

    // 工资信息
    iy += 10;
    ctx.fillStyle = '#FF9800';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`\u{1F4B0} 每日工资总计: ${sm.totalDailySalary}`, x + 15, iy);
  }

  // --- 装修面板 ---
  drawDecorPanel(ctx, x, y, w, h, game) {
    let iy = y + 10;
    const itemH = 50;

    for (const deco of DECORATIONS) {
      const level = game.restaurant.decoLevels[deco.id];
      const maxed = level >= deco.maxLevel;
      const cost = maxed ? 0 : deco.cost * (level + 1);
      const canBuy = !maxed && game.money >= cost;

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x + 10, iy, w - 20, itemH - 4);

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(deco.icon, x + 20, iy + 30);

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(deco.name, x + 55, iy + 18);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#AAA';
      const effects = [];
      if (deco.capacity > 0) effects.push(`+${deco.capacity}桌`);
      if (deco.satisfaction > 0) effects.push(`+${deco.satisfaction}满意`);
      ctx.fillText(`Lv.${level}/${deco.maxLevel} | ${effects.join(' | ')}`, x + 55, iy + 35);

      if (maxed) {
        ctx.fillStyle = COLORS.success;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('\u{2705} 满级', x + w - 20, iy + 28);
      } else {
        const btnX = x + w - 100;
        const btnW = 80;
        ctx.fillStyle = canBuy ? COLORS.accent : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(btnX, iy + 8, btnW, 28, 4);
        ctx.fill();
        ctx.fillStyle = canBuy ? '#FFF' : '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`\u{1F4B0}${cost}`, btnX + btnW / 2, iy + 25);

        if (canBuy) {
          this.clickAreas.push({
            x: btnX, y: iy + 8, w: btnW, h: 28,
            action: 'upgrade_decor', decoId: deco.id,
          });
        }
      }
      iy += itemH;
    }
  }

  // --- 厨房设备面板 ---
  drawKitchenPanel(ctx, x, y, w, h, game) {
    let iy = y + 10;
    const itemH = 50;

    for (const kit of KITCHEN_UPGRADES) {
      const level = game.restaurant.kitchenLevels[kit.id];
      const maxed = level >= kit.maxLevel;
      const cost = maxed ? 0 : kit.cost * (level + 1);
      const canBuy = !maxed && game.money >= cost;

      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x + 10, iy, w - 20, itemH - 4);

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(kit.icon, x + 20, iy + 30);

      ctx.fillStyle = COLORS.text;
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(kit.name, x + 55, iy + 18);

      ctx.font = '11px sans-serif';
      ctx.fillStyle = '#AAA';
      ctx.fillText(`Lv.${level}/${kit.maxLevel} | 烹饪速度+${(kit.speedBonus * 100).toFixed(0)}%/级`, x + 55, iy + 35);

      if (maxed) {
        ctx.fillStyle = COLORS.success;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText('\u{2705} 满级', x + w - 20, iy + 28);
      } else {
        const btnX = x + w - 100;
        const btnW = 80;
        ctx.fillStyle = canBuy ? COLORS.info : 'rgba(255,255,255,0.1)';
        ctx.beginPath();
        ctx.roundRect(btnX, iy + 8, btnW, 28, 4);
        ctx.fill();
        ctx.fillStyle = canBuy ? '#FFF' : '#666';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`\u{1F4B0}${cost}`, btnX + btnW / 2, iy + 25);

        if (canBuy) {
          this.clickAreas.push({
            x: btnX, y: iy + 8, w: btnW, h: 28,
            action: 'upgrade_kitchen', kitId: kit.id,
          });
        }
      }
      iy += itemH;
    }

    // 当前总速度加成
    iy += 20;
    ctx.fillStyle = COLORS.accent;
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    const totalBonus = game.restaurant.cookingSpeedBonus;
    ctx.fillText(`\u{26A1} 当前烹饪速度加成: +${(totalBonus * 100).toFixed(0)}%`, x + 15, iy);
  }

  // --- 夜晚结算面板 ---
  drawNightPanel(ctx, x, y, w, h, game) {
    let iy = y + 20;

    const items = [
      { label: '\u{1F37D}\u{FE0F} 营业收入', value: `+${game.todayRevenue}`, color: '#4CAF50' },
      { label: '\u{1F4B0} 小费收入', value: `+${game.todayTips}`, color: '#FFD700' },
      { label: '\u{1F4B5} 食材成本', value: `-${game.todayCost}`, color: '#F44336' },
      { label: '\u{1F4B5} 员工工资', value: `-${game.staffManager.totalDailySalary}`, color: '#F44336' },
      { label: '\u{1F3E0} 店租', value: `-${game.dailyRent}`, color: '#F44336' },
    ];

    const totalProfit = game.todayRevenue + game.todayTips - game.todayCost
      - game.staffManager.totalDailySalary - game.dailyRent;

    for (const item of items) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(x + 20, iy, w - 40, 32);

      ctx.fillStyle = COLORS.text;
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, x + 30, iy + 20);

      ctx.fillStyle = item.color;
      ctx.textAlign = 'right';
      ctx.fillText(item.value, x + w - 30, iy + 20);

      iy += 36;
    }

    iy += 10;
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(x + 20, iy, w - 40, 40);

    ctx.fillStyle = totalProfit >= 0 ? '#4CAF50' : '#F44336';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `${totalProfit >= 0 ? '\u{1F4B0}' : '\u{1F4B8}'} 净利润: ${totalProfit >= 0 ? '+' : ''}${totalProfit}`,
      CANVAS_W / 2, iy + 25
    );

    // 顾客统计
    iy += 55;
    ctx.fillStyle = '#AAA';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `服务 ${game.customerManager.totalServed} 位顾客 | ${game.customerManager.totalAngry} 位不满离开`,
      CANVAS_W / 2, iy
    );

    // 升级提示
    if (game.pendingNewDishes && game.pendingNewDishes.length > 0) {
      iy += 25;
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('\u{1F389} 解锁新菜品!', CANVAS_W / 2, iy);
      for (const dish of game.pendingNewDishes) {
        iy += 22;
        ctx.fillStyle = '#FFF';
        ctx.font = '13px sans-serif';
        ctx.fillText(`${dish.icon} ${dish.name} - ${dish.price}\u{1F4B0}`, CANVAS_W / 2, iy);
      }
    }

    // 继续按钮
    iy = y + h - 50;
    const btnX = CANVAS_W / 2 - 80;
    const btnW = 160;
    ctx.fillStyle = COLORS.success;
    ctx.beginPath();
    ctx.roundRect(btnX, iy, btnW, 40, 8);
    ctx.fill();
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('\u{27A1}\u{FE0F} 开始新一天', CANVAS_W / 2, iy + 25);
    this.clickAreas.push({
      x: btnX, y: iy, w: btnW, h: 40,
      action: 'new_day',
    });
  }

  // ============ 点击检测 ============
  handleClick(px, py) {
    // 从后往前检测（覆盖层优先）
    for (let i = this.clickAreas.length - 1; i >= 0; i--) {
      const a = this.clickAreas[i];
      if (px >= a.x && px <= a.x + a.w && py >= a.y && py <= a.y + a.h) {
        return a;
      }
    }
    return null;
  }
}
