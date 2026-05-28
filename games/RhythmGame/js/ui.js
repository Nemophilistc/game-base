// ui.js - HUD、连击显示、覆盖层
import { CONFIG } from './config.js';

export class UIManager {
  constructor() {
    this.judgeDisplay = null;  // { text, color, life, maxLife }
    this.combo = 0;
    this.score = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.maxScore = 0;
    this.progress = 0; // 0-1

    // 加载最高分
    this.highScore = parseInt(localStorage.getItem('rhythm_highscore') || '0');
  }

  reset() {
    this.combo = 0;
    this.score = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.judgeDisplay = null;
    this.progress = 0;
  }

  saveHighScore() {
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('rhythm_highscore', this.highScore.toString());
    }
  }

  addJudgment(judgeType) {
    const scoreValue = CONFIG.SCORE[judgeType];
    this.multiplier = this._getMultiplier(this.combo);
    this.score += scoreValue * this.multiplier;

    if (judgeType === 'MISS') {
      this.combo = 0;
      this.multiplier = 1;
    } else {
      this.combo++;
      if (this.combo > this.maxCombo) this.maxCombo = this.combo;
      this.multiplier = this._getMultiplier(this.combo);
    }

    // 显示判定文字
    this.judgeDisplay = {
      text: CONFIG.JUDGE_TEXT[judgeType],
      color: CONFIG.JUDGE_COLORS[judgeType],
      life: CONFIG.JUDGE_TEXT_DURATION,
      maxLife: CONFIG.JUDGE_TEXT_DURATION,
    };

    return { combo: this.combo, score: this.score, multiplier: this.multiplier };
  }

  _getMultiplier(combo) {
    let mult = 1;
    for (const m of CONFIG.COMBO_MULTIPLIERS) {
      if (combo >= m.threshold) mult = m.mult;
    }
    return mult;
  }

  update(dt) {
    if (this.judgeDisplay) {
      this.judgeDisplay.life -= dt * 1000;
      if (this.judgeDisplay.life <= 0) {
        this.judgeDisplay = null;
      }
    }
  }

  drawHUD(ctx, w, h) {
    ctx.save();

    // 分数 (右上角)
    ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${this.score.toLocaleString()}`, w - 20, 40);

    // 倍率
    if (this.multiplier > 1) {
      ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffdd44';
      ctx.fillText(`x${this.multiplier}`, w - 20, 65);
    }

    // 连击 (中间偏上)
    if (this.combo > 0) {
      const comboY = h * 0.25;
      const comboScale = 1 + Math.min(this.combo / 100, 0.5);

      ctx.save();
      ctx.translate(w / 2, comboY);
      ctx.scale(comboScale, comboScale);

      // 连击数字
      ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      const comboColor = this._getComboColor();
      ctx.fillStyle = comboColor;
      ctx.shadowColor = comboColor;
      ctx.shadowBlur = 20;
      ctx.fillText(this.combo.toString(), 0, 0);

      // "COMBO" 标签
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffffffcc';
      ctx.shadowBlur = 0;
      ctx.fillText('COMBO', 0, 24);

      ctx.restore();
    }

    // 判定文字 (中间)
    if (this.judgeDisplay) {
      const jd = this.judgeDisplay;
      const alpha = jd.life / jd.maxLife;
      const scale = 1 + (1 - alpha) * 0.3;
      const judgeY = h * CONFIG.JUDGMENT_LINE_RATIO - 60;

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(w / 2, judgeY);
      ctx.scale(scale, scale);
      ctx.font = 'bold 32px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = jd.color;
      ctx.shadowColor = jd.color;
      ctx.shadowBlur = 20;
      ctx.fillText(jd.text, 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();
    }

    // 进度条 (顶部)
    if (this.progress > 0) {
      const barW = w - 40;
      const barH = 4;
      const barX = 20;
      const barY = 8;

      ctx.fillStyle = '#ffffff22';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#44aaff';
      ctx.fillRect(barX, barY, barW * this.progress, barH);
    }

    // 最高分 (左上角)
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#ffffff88';
    ctx.fillText(`最高: ${this.highScore.toLocaleString()}`, 20, 30);

    ctx.restore();
  }

  drawKeyHints(ctx, w, h, lanePositions, pressedKeys) {
    const judgeY = h * CONFIG.JUDGMENT_LINE_RATIO;

    for (let i = 0; i < CONFIG.LANE_COUNT; i++) {
      const lx = lanePositions[i];
      const pressed = pressedKeys.has(CONFIG.KEYS[i]);

      // 按键提示背景
      ctx.save();
      ctx.globalAlpha = pressed ? 0.6 : 0.25;
      ctx.fillStyle = CONFIG.LANE_COLORS[i];
      ctx.beginPath();
      ctx.arc(lx, judgeY, 22, 0, Math.PI * 2);
      ctx.fill();

      if (pressed) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // 按键字母
      ctx.globalAlpha = pressed ? 1 : 0.7;
      ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(CONFIG.KEY_LABELS[i], lx, judgeY);
      ctx.restore();
    }
  }

  drawJudgmentLine(ctx, w, h, laneWidth) {
    const judgeY = h * CONFIG.JUDGMENT_LINE_RATIO;

    // 判定线
    ctx.save();
    ctx.strokeStyle = '#ffffff44';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(laneWidth / 2 - 10, judgeY);
    ctx.lineTo(w - laneWidth / 2 + 10, judgeY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawStartScreen(ctx, w, h) {
    ctx.save();

    // 背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(0, 0, w, h);

    // 标题
    ctx.font = 'bold 56px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd44';
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 30;
    ctx.fillText('MIMO 节奏', w / 2, h * 0.25);
    ctx.shadowBlur = 0;

    // 副标题
    ctx.font = '20px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffffffcc';
    ctx.fillText('选择难度开始游戏', w / 2, h * 0.35);

    // 难度按钮
    const difficulties = [
      { key: 'easy', label: '简单', color: '#44ff88', bpm: '120 BPM', desc: '适合新手' },
      { key: 'hard', label: '困难', color: '#ffaa44', bpm: '140 BPM', desc: '进阶挑战' },
      { key: 'hell', label: '地狱', color: '#ff4488', bpm: '170 BPM', desc: '极限手速' },
    ];

    const btnW = 200;
    const btnH = 80;
    const startY = h * 0.45;
    const gap = 20;

    for (let i = 0; i < difficulties.length; i++) {
      const d = difficulties[i];
      const bx = w / 2 - btnW / 2;
      const by = startY + i * (btnH + gap);

      // 按钮背景
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.strokeStyle = d.color;
      ctx.lineWidth = 2;
      this._drawRoundRect(ctx, bx, by, btnW, btnH, 12);
      ctx.fill();
      ctx.stroke();

      // 难度名
      ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = d.color;
      ctx.fillText(d.label, w / 2, by + 32);

      // BPM和描述
      ctx.font = '14px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffffffaa';
      ctx.fillText(`${d.bpm} | ${d.desc}`, w / 2, by + 58);
    }

    // 按键提示
    ctx.font = '14px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffffff66';
    ctx.fillText('按 1/2/3 选择难度 | D F J K 操作音符', w / 2, h * 0.9);

    // 最高分
    if (this.highScore > 0) {
      ctx.font = '16px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffdd4488';
      ctx.fillText(`最高分: ${this.highScore.toLocaleString()}`, w / 2, h * 0.95);
    }

    ctx.restore();
  }

  drawGameOver(ctx, w, h, stats) {
    ctx.save();

    // 背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.88)';
    ctx.fillRect(0, 0, w, h);

    // 标题
    ctx.font = 'bold 48px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffdd44';
    ctx.shadowColor = '#ffdd44';
    ctx.shadowBlur = 20;
    ctx.fillText('演奏结束', w / 2, h * 0.2);
    ctx.shadowBlur = 0;

    // 评级
    const grade = this._getGrade(stats.accuracy);
    ctx.font = 'bold 72px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = grade.color;
    ctx.shadowColor = grade.color;
    ctx.shadowBlur = 30;
    ctx.fillText(grade.label, w / 2, h * 0.35);
    ctx.shadowBlur = 0;

    // 统计
    const lines = [
      `分数: ${stats.score.toLocaleString()}`,
      `最高连击: ${stats.maxCombo}`,
      `准确率: ${stats.accuracy.toFixed(1)}%`,
      `Perfect: ${stats.perfects}`,
      `Great: ${stats.greats}`,
      `Good: ${stats.goods}`,
      `Miss: ${stats.misses}`,
    ];

    ctx.font = '20px "Microsoft YaHei", sans-serif';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === 0 ? '#ffffff' : '#ffffffcc';
      ctx.fillText(lines[i], w / 2, h * 0.45 + i * 30);
    }

    // 新纪录
    if (stats.isNewHighScore) {
      ctx.font = 'bold 24px "Microsoft YaHei", sans-serif';
      ctx.fillStyle = '#ffdd44';
      ctx.fillText('新纪录!', w / 2, h * 0.78);
    }

    // 提示
    ctx.font = '16px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffffff66';
    ctx.fillText('按 R 重新开始 | 按 ESC 返回菜单', w / 2, h * 0.88);

    ctx.restore();
  }

  _getGrade(accuracy) {
    if (accuracy >= 95) return { label: 'S', color: '#ffdd44' };
    if (accuracy >= 85) return { label: 'A', color: '#44ff88' };
    if (accuracy >= 70) return { label: 'B', color: '#44aaff' };
    if (accuracy >= 50) return { label: 'C', color: '#ffaa44' };
    return { label: 'D', color: '#ff4444' };
  }

  _getComboColor() {
    if (this.combo >= 100) return '#ff44ff';
    if (this.combo >= 50) return '#ffaa44';
    if (this.combo >= 30) return '#ffdd44';
    if (this.combo >= 10) return '#44ffaa';
    return '#ffffff';
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
}
