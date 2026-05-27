// note.js - 音符类（下落、判定、特效）
import { CONFIG } from './config.js';

export class Note {
  constructor({ type, lane, time, duration = 0, slideDir = 0 }) {
    this.type = type;           // 'tap', 'hold', 'slide'
    this.lane = lane;           // 0-3
    this.time = time;           // 判定时间 (ms, 相对于BGM开始)
    this.duration = duration;   // hold持续时间 (ms)
    this.slideDir = slideDir;   // slide方向: -1左, 1右

    this.y = -50;               // 当前屏幕Y
    this.active = true;         // 是否还在屏幕上
    this.judged = false;        // 是否已判定
    this.holdActive = false;    // hold是否正在按住
    this.holdComplete = false;  // hold是否完成
    this.slideTriggered = false;
    this.judgeResult = null;    // 判定结果

    // hold尾部位置
    this.endY = -50;

    // 视觉
    this.glow = 0;
    this.trail = [];
  }

  update(currentTime, judgmentY, noteSpeed) {
    // 计算音符Y位置: 距离判定线的时间差 * 速度
    const timeDiff = this.time - currentTime;
    this.y = judgmentY - (timeDiff / 1000) * noteSpeed;

    // hold音符的尾部
    if (this.type === 'hold' && this.duration > 0) {
      const endTimeDiff = (this.time + this.duration) - currentTime;
      this.endY = judgmentY - (endTimeDiff / 1000) * noteSpeed;
    }

    // 拖尾效果
    if (this.active && !this.judged) {
      this.trail.push({ x: 0, y: this.y, alpha: 1 });
      if (this.trail.length > 8) this.trail.shift();
    }
    // 更新拖尾透明度
    for (let t of this.trail) {
      t.alpha *= 0.85;
    }

    // 超出屏幕底部 → miss
    if (this.y > judgmentY + 200 && !this.judged) {
      this.active = false;
      this.judgeResult = 'MISS';
      return 'MISS';
    }

    // hold音符尾部超出屏幕
    if (this.type === 'hold' && this.endY > judgmentY + 200) {
      this.active = false;
    }

    // 已判定的非hold音符移除
    if (this.judged && this.type !== 'hold') {
      this.active = false;
    }

    // hold完成
    if (this.judged && this.type === 'hold' && this.holdComplete) {
      this.active = false;
    }

    return null;
  }

  checkJudgment(currentTime) {
    if (this.judged) return null;
    const diff = Math.abs(currentTime - this.time);

    if (diff <= CONFIG.TIMING.PERFECT) return 'PERFECT';
    if (diff <= CONFIG.TIMING.GREAT) return 'GREAT';
    if (diff <= CONFIG.TIMING.GOOD) return 'GOOD';

    // 如果在good窗口之前，还不算miss
    if (diff <= CONFIG.TIMING.GOOD + 50) return null;
    return null;
  }

  judge(result) {
    this.judged = true;
    this.judgeResult = result;
    this.glow = 1;
    return result;
  }

  draw(ctx, laneX, laneWidth) {
    if (!this.active && this.judgeResult !== null) return;

    const centerX = laneX + laneWidth / 2;
    const noteW = this.type === 'hold' ? CONFIG.HOLD_WIDTH : CONFIG.NOTE_WIDTH;
    const color = CONFIG.LANE_COLORS[this.lane];

    ctx.save();

    // 绘制拖尾
    for (const t of this.trail) {
      if (t.alpha < 0.05) continue;
      ctx.globalAlpha = t.alpha * 0.4;
      ctx.fillStyle = color;
      const tw = noteW * t.alpha;
      const th = CONFIG.NOTE_HEIGHT * t.alpha * 0.6;
      this._drawRoundRect(ctx, centerX - tw / 2, t.y - th / 2, tw, th, 4);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // glow效果
    if (this.glow > 0) {
      ctx.shadowColor = color;
      ctx.shadowBlur = 20 * this.glow;
      this.glow *= 0.9;
    }

    if (this.type === 'tap') {
      this._drawTapNote(ctx, centerX, this.y, noteW, color);
    } else if (this.type === 'hold') {
      this._drawHoldNote(ctx, centerX, this.y, this.endY, noteW, color);
    } else if (this.type === 'slide') {
      this._drawSlideNote(ctx, centerX, this.y, noteW, color);
    }

    ctx.restore();
  }

  _drawTapNote(ctx, cx, cy, w, color) {
    const h = CONFIG.NOTE_HEIGHT;
    // 主体
    const grad = ctx.createLinearGradient(cx, cy - h / 2, cx, cy + h / 2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, color);
    grad.addColorStop(1, this._darken(color));
    ctx.fillStyle = grad;
    this._drawRoundRect(ctx, cx - w / 2, cy - h / 2, w, h, 6);
    ctx.fill();
    // 边框
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1.5;
    this._drawRoundRect(ctx, cx - w / 2, cy - h / 2, w, h, 6);
    ctx.stroke();
  }

  _drawHoldNote(ctx, cx, startY, endY, w, color) {
    const h = CONFIG.NOTE_HEIGHT;
    const topY = Math.min(startY, endY);
    const botY = Math.max(startY, endY);
    const holdH = botY - topY;

    // hold条身
    ctx.fillStyle = color + '88';
    this._drawRoundRect(ctx, cx - w / 2, topY, w, holdH, 4);
    ctx.fill();

    // 条纹装饰
    ctx.strokeStyle = color + 'cc';
    ctx.lineWidth = 2;
    for (let y = topY; y < botY; y += 12) {
      ctx.beginPath();
      ctx.moveTo(cx - w / 4, y);
      ctx.lineTo(cx + w / 4, y);
      ctx.stroke();
    }

    // 头部 (像tap note)
    if (startY === topY) {
      this._drawTapNote(ctx, cx, startY, w, color);
    }
    // 尾部
    ctx.fillStyle = color;
    this._drawRoundRect(ctx, cx - w / 2, endY - h / 3, w, h * 0.66, 4);
    ctx.fill();
  }

  _drawSlideNote(ctx, cx, cy, w, color) {
    const h = CONFIG.NOTE_HEIGHT;
    // 三角形箭头
    const dir = this.slideDir;
    ctx.fillStyle = color;
    ctx.beginPath();
    if (dir > 0) {
      // 右滑箭头
      ctx.moveTo(cx - w / 2, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy);
      ctx.lineTo(cx - w / 2, cy + h / 2);
    } else {
      // 左滑箭头
      ctx.moveTo(cx + w / 2, cy - h / 2);
      ctx.lineTo(cx - w / 2, cy);
      ctx.lineTo(cx + w / 2, cy + h / 2);
    }
    ctx.closePath();
    ctx.fill();

    // 边框
    ctx.strokeStyle = '#ffffff88';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  _drawRoundRect(ctx, x, y, w, h, r) {
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

  _darken(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.floor(r * 0.5)},${Math.floor(g * 0.5)},${Math.floor(b * 0.5)})`;
  }
}
