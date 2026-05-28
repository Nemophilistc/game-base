// ============================================================
// ui.js - Canvas渲染、分数动画、覆盖层UI
// ============================================================

import {
  GRID_ROWS, GRID_COLS, CELL_SIZE, GEM_PADDING,
  GEM_TYPES, SPECIAL, SPECIAL_SYMBOLS,
} from './config.js';

const BOARD_OFFSET_X = 20;
const BOARD_OFFSET_Y = 100;

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scorePopups = [];    // 分数飞字
    this.shakeTimer = 0;
    this.shakeIntensity = 0;
    this.selectedGem = null;  // { row, col }
    this.hintCells = null;    // 提示闪烁
    this.hintTimer = 0;
  }

  get boardX() { return BOARD_OFFSET_X; }
  get boardY() { return BOARD_OFFSET_Y; }

  cellToPixel(row, col) {
    return {
      x: BOARD_OFFSET_X + col * CELL_SIZE,
      y: BOARD_OFFSET_Y + row * CELL_SIZE,
    };
  }

  pixelToCell(px, py) {
    const col = Math.floor((px - BOARD_OFFSET_X) / CELL_SIZE);
    const row = Math.floor((py - BOARD_OFFSET_Y) / CELL_SIZE);
    if (row < 0 || row >= GRID_ROWS || col < 0 || col >= GRID_COLS) return null;
    return { row, col };
  }

  // 屏幕震动
  triggerShake(intensity = 4) {
    this.shakeTimer = 10;
    this.shakeIntensity = intensity;
  }

  // 添加分数飞字
  addScorePopup(cellX, cellY, score, multiplier) {
    this.scorePopups.push({
      x: cellX + CELL_SIZE / 2,
      y: cellY,
      text: `+${score}`,
      sub: multiplier > 1 ? `x${multiplier}` : '',
      life: 1,
      vy: -1.5,
    });
  }

  // --- 主绘制 ---
  draw(board, effects, score, moves, level, chainLevel, state, levelConfig, clearCount) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 屏幕震动偏移
    let sx = 0, sy = 0;
    if (this.shakeTimer > 0) {
      sx = (Math.random() - 0.5) * this.shakeIntensity;
      sy = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeTimer--;
    }

    ctx.save();
    ctx.translate(sx, sy);

    // 背景
    this._drawBackground(ctx, w, h);

    // 棋盘背景
    this._drawBoardBg(ctx);

    // 宝石
    this._drawGems(ctx, board);

    // 选中高亮
    if (this.selectedGem) {
      const { x, y } = this.cellToPixel(this.selectedGem.row, this.selectedGem.col);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fff';
      ctx.shadowBlur = 12;
      ctx.strokeRect(x + 3, y + 3, CELL_SIZE - 6, CELL_SIZE - 6);
      ctx.shadowBlur = 0;
    }

    // 特效
    effects.draw(ctx);

    // 分数飞字
    this._drawScorePopups(ctx);

    // HUD
    this._drawHUD(ctx, score, moves, level, chainLevel, levelConfig, clearCount);

    // 游戏状态覆盖层
    if (state === 'levelComplete') {
      this._drawOverlay(ctx, '关卡通过!', '#4CAF50', w, h);
    } else if (state === 'gameOver') {
      this._drawOverlay(ctx, '游戏结束', '#ff3b5c', w, h);
    } else if (state === 'menu') {
      this._drawMenu(ctx, w, h);
    }

    ctx.restore();
  }

  _drawBackground(ctx, w, h) {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(0.5, '#1a1a4e');
    grad.addColorStop(1, '#0a0a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // 装饰星星
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i < 30; i++) {
      const sx = (Math.sin(i * 137.5 + Date.now() * 0.0001) * 0.5 + 0.5) * w;
      const sy = (Math.cos(i * 97.3 + Date.now() * 0.00008) * 0.5 + 0.5) * h;
      const sr = 0.5 + Math.sin(Date.now() * 0.003 + i) * 0.5;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  _drawBoardBg(ctx) {
    const bx = BOARD_OFFSET_X - 4;
    const by = BOARD_OFFSET_Y - 4;
    const bw = GRID_COLS * CELL_SIZE + 8;
    const bh = GRID_ROWS * CELL_SIZE + 8;

    // 毛玻璃背景
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(bx, by, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    // 网格线
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    for (let r = 0; r <= GRID_ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_OFFSET_X, BOARD_OFFSET_Y + r * CELL_SIZE);
      ctx.lineTo(BOARD_OFFSET_X + GRID_COLS * CELL_SIZE, BOARD_OFFSET_Y + r * CELL_SIZE);
      ctx.stroke();
    }
    for (let c = 0; c <= GRID_COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(BOARD_OFFSET_X + c * CELL_SIZE, BOARD_OFFSET_Y);
      ctx.lineTo(BOARD_OFFSET_X + c * CELL_SIZE, BOARD_OFFSET_Y + GRID_ROWS * CELL_SIZE);
      ctx.stroke();
    }
    ctx.restore();
  }

  _drawGems(ctx, board) {
    if (!board || !board.grid) return;
    const time = Date.now();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const gem = board.grid[r][c];
        if (!gem) continue;

        const { x, y } = this.cellToPixel(r, c);
        const cx = x + CELL_SIZE / 2;
        const cy = y + CELL_SIZE / 2;
        const pad = GEM_PADDING + 2;
        const radius = (CELL_SIZE - pad * 2) / 2;

        // 缩放动画
        let scale = gem.scale;
        if (gem.spawning) {
          scale = 0.3 + Math.sin(time * 0.01) * 0.1;
        }

        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.globalAlpha = gem.alpha;

        // 发光背景
        const glowGrad = ctx.createRadialGradient(0, 0, radius * 0.3, 0, 0, radius * 1.2);
        glowGrad.addColorStop(0, gem.glow + '40');
        glowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGrad;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
        ctx.fill();

        // 宝石主体 - 圆角矩形
        ctx.fillStyle = gem.color;
        ctx.shadowColor = gem.glow;
        ctx.shadowBlur = gem.selected ? 15 : 8;
        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, radius * 0.4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 高光
        const hlGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
        hlGrad.addColorStop(0, 'rgba(255,255,255,0.4)');
        hlGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)');
        hlGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
        ctx.fillStyle = hlGrad;
        ctx.beginPath();
        ctx.roundRect(-radius, -radius, radius * 2, radius * 2, radius * 0.4);
        ctx.fill();

        // 符号
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${radius * 1.1}px "Segoe UI Symbol", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(gem.symbol, 0, 1);
        ctx.shadowBlur = 0;

        // 特殊标记
        if (gem.isSpecial) {
          ctx.font = `bold ${radius * 0.7}px sans-serif`;
          ctx.fillStyle = '#ffd700';
          ctx.shadowColor = '#ffd700';
          ctx.shadowBlur = 8;
          ctx.fillText(gem.specialSymbol, 0, radius * 0.8);
          ctx.shadowBlur = 0;

          // 特殊宝石边框
          ctx.strokeStyle = '#ffd700';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-radius - 1, -radius - 1, (radius + 1) * 2, (radius + 1) * 2, radius * 0.4);
          ctx.stroke();
        }

        // 选中脉冲
        if (gem.selected || (this.selectedGem && this.selectedGem.row === r && this.selectedGem.col === c)) {
          const pulse = 0.5 + Math.sin(time * 0.008) * 0.5;
          ctx.strokeStyle = `rgba(255,255,255,${0.3 + pulse * 0.4})`;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(-radius - 2, -radius - 2, (radius + 2) * 2, (radius + 2) * 2, radius * 0.4);
          ctx.stroke();
        }

        ctx.restore();
      }
    }
  }

  _drawScorePopups(ctx) {
    ctx.save();
    for (let i = this.scorePopups.length - 1; i >= 0; i--) {
      const p = this.scorePopups[i];
      p.y += p.vy;
      p.life -= 0.015;
      if (p.life <= 0) {
        this.scorePopups.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = p.life;
      ctx.fillStyle = '#ffd700';
      ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 4;
      ctx.fillText(p.text, p.x, p.y);
      if (p.sub) {
        ctx.font = 'bold 14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ff9800';
        ctx.fillText(p.sub, p.x, p.y + 18);
      }
      ctx.shadowBlur = 0;
    }
    ctx.restore();
  }

  _drawHUD(ctx, score, moves, level, chainLevel, levelConfig, clearCount) {
    ctx.save();
    const w = this.canvas.width;

    // 标题
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`三消传奇`, 20, 30);

    // 关卡 + 目标
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#aaa';
    ctx.fillText(`第 ${level} 关`, 20, 55);
    if (levelConfig) {
      let goalText = '';
      if (levelConfig.type === 'score') {
        goalText = `目标: ${levelConfig.target}分`;
      } else {
        goalText = `消除: ${clearCount}/${levelConfig.target}`;
      }
      ctx.fillStyle = '#888';
      ctx.font = '13px "Microsoft YaHei", sans-serif';
      ctx.fillText(goalText, 20, 75);
    }

    // 分数
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.fillText(`${score}`, w - 20, 30);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillText(`分数`, w - 20, 50);

    // 步数
    ctx.textAlign = 'center';
    const movesColor = moves <= 5 ? '#ff3b5c' : moves <= 10 ? '#ff9800' : '#4CAF50';
    ctx.fillStyle = movesColor;
    ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
    ctx.fillText(`${moves}`, w / 2, 30);
    ctx.fillStyle = '#aaa';
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillText(`剩余步数`, w / 2, 50);

    // 连锁指示
    if (chainLevel > 0) {
      const chainText = `连锁 x${Math.pow(2, chainLevel)}`;
      ctx.fillStyle = '#ff9800';
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(chainText, w / 2, 80);
    }

    // 底部目标信息
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.fillText('点击宝石选中，再点击相邻宝石交换', w / 2, BOARD_OFFSET_Y + GRID_ROWS * CELL_SIZE + 25);

    ctx.restore();
  }

  _drawOverlay(ctx, text, color, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, w, h);

    ctx.fillStyle = color;
    ctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;
    ctx.fillText(text, w / 2, h / 2 - 30);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.fillText('点击任意位置继续', w / 2, h / 2 + 20);
    ctx.restore();
  }

  _drawMenu(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 标题
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 30;
    ctx.fillText('三消传奇', w / 2, h / 2 - 80);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = '20px "Microsoft YaHei", sans-serif';
    ctx.fillText('Match-3 Legend', w / 2, h / 2 - 40);

    // 开始按钮
    const btnW = 200, btnH = 50;
    const btnX = w / 2 - btnW / 2, btnY = h / 2 + 10;
    ctx.fillStyle = '#4CAF50';
    ctx.shadowColor = '#4CAF50';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 25);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('开始游戏', w / 2, btnY + btnH / 2);

    // 提示
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillText('50个关卡 | 特殊宝石 | 连锁反应', w / 2, h / 2 + 100);

    ctx.restore();

    // 保存按钮区域供点击检测
    this.menuBtn = { x: btnX, y: btnY, w: btnW, h: btnH };
  }

  // 检查菜单按钮点击
  isMenuButtonClick(px, py) {
    if (!this.menuBtn) return false;
    const b = this.menuBtn;
    return px >= b.x && px <= b.x + b.w && py >= b.y && py <= b.y + b.h;
  }
}
