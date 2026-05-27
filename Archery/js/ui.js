// ui.js - UI overlays, HUD, menus
import { CONFIG } from './config.js';

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.showStart = true;
    this.showGameOver = false;
    this.showHelp = false;
    this.selectedMode = 'CLASSIC';
    this.gameActive = false;

    // Score display
    this.displayScore = 0;
    this.targetScore = 0;

    // Callbacks
    this.onStart = null;
    this.onRestart = null;
    this.onModeSelect = null;

    this._setupEventListeners();
  }

  _setupEventListeners() {
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      if (this.showStart) {
        this._handleStartClick(x, y);
      } else if (this.showGameOver) {
        this._handleGameOverClick(x, y);
      }
    });
  }

  _handleStartClick(x, y) {
    // Mode buttons
    const modes = ['CLASSIC', 'TIME_ATTACK', 'CHALLENGE'];
    const modeY = 280;
    for (let i = 0; i < modes.length; i++) {
      const btnX = 400 + i * 140;
      if (x > btnX && x < btnX + 130 && y > modeY && y < modeY + 45) {
        this.selectedMode = modes[i];
        if (this.onModeSelect) this.onModeSelect(modes[i]);
        return;
      }
    }

    // Start button
    if (x > 450 && x < 750 && y > 370 && y < 430) {
      this.showStart = false;
      this.gameActive = true;
      if (this.onStart) this.onStart(this.selectedMode);
    }

    // Help toggle
    if (x > 520 && x < 680 && y > 445 && y < 475) {
      this.showHelp = !this.showHelp;
    }
  }

  _handleGameOverClick(x, y) {
    // Restart button
    if (x > 420 && x < 780 && y > 480 && y < 540) {
      this.showGameOver = false;
      this.gameActive = true;
      if (this.onRestart) this.onRestart();
    }

    // Menu button
    if (x > 420 && x < 780 && y > 555 && y < 615) {
      this.showGameOver = false;
      this.showStart = true;
      this.gameActive = false;
    }
  }

  updateScore(score) {
    this.targetScore = score;
  }

  update() {
    // Animate score counter
    if (this.displayScore < this.targetScore) {
      const diff = this.targetScore - this.displayScore;
      this.displayScore += Math.ceil(diff * 0.1);
      if (this.displayScore > this.targetScore) this.displayScore = this.targetScore;
    }
  }

  drawStartScreen(ctx) {
    if (!this.showStart) return;

    // Full overlay
    ctx.fillStyle = 'rgba(10, 8, 20, 0.92)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    // Title
    ctx.save();
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(255, 165, 0, 0.5)';
    ctx.lineWidth = 4;
    ctx.strokeText('射箭大师', 600, 160);
    ctx.fillText('射箭大师', 600, 160);

    // Subtitle
    ctx.fillStyle = '#E8D5B0';
    ctx.font = '24px sans-serif';
    ctx.fillText('拉弓瞄准，射出完美一箭！', 600, 210);

    // Mode selection buttons
    const modes = [
      { id: 'CLASSIC', name: '经典模式', desc: '10支箭' },
      { id: 'TIME_ATTACK', name: '限时挑战', desc: '60秒' },
      { id: 'CHALLENGE', name: '挑战模式', desc: '15支箭' },
    ];

    const modeY = 280;
    modes.forEach((mode, i) => {
      const btnX = 400 + i * 140;
      const selected = this.selectedMode === mode.id;

      // Button background
      ctx.fillStyle = selected
        ? 'rgba(180, 140, 60, 0.6)'
        : 'rgba(60, 50, 40, 0.6)';
      ctx.strokeStyle = selected ? '#FFD700' : 'rgba(180, 140, 80, 0.4)';
      ctx.lineWidth = selected ? 2 : 1;
      this._roundRect(ctx, btnX, modeY, 130, 45, 8);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = selected ? '#FFD700' : '#E8D5B0';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText(mode.name, btnX + 65, modeY + 20);

      ctx.fillStyle = selected ? '#FFEEBB' : '#999';
      ctx.font = '13px sans-serif';
      ctx.fillText(mode.desc, btnX + 65, modeY + 38);
    });

    // Mode description
    const modeInfo = CONFIG.MODES[this.selectedMode];
    ctx.fillStyle = '#BBAA88';
    ctx.font = '16px sans-serif';
    ctx.fillText(`模式: ${modeInfo.name} | ${modeInfo.arrows === Infinity ? '无限箭矢' : modeInfo.arrows + '支箭'}${modeInfo.timeLimit ? ' | ' + modeInfo.timeLimit + '秒' : ''}`, 600, 345);

    // Start button
    const startHover = false;
    ctx.fillStyle = startHover ? 'rgba(200, 80, 30, 0.8)' : 'rgba(180, 60, 20, 0.7)';
    ctx.strokeStyle = '#FF6644';
    ctx.lineWidth = 2;
    this._roundRect(ctx, 450, 370, 300, 60, 12);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('开始游戏', 600, 410);

    // Help button
    ctx.fillStyle = 'rgba(60, 50, 40, 0.5)';
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.3)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, 520, 445, 160, 30, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#BBAA88';
    ctx.font = '14px sans-serif';
    ctx.fillText('操作说明', 600, 464);

    // Help box
    if (this.showHelp) {
      this._drawHelpBox(ctx);
    }

    // High scores
    this._drawHighScores(ctx);

    ctx.restore();
  }

  _drawHelpBox(ctx) {
    const bx = 300, by = 490, bw = 600, bh = 180;

    ctx.fillStyle = 'rgba(20, 15, 30, 0.95)';
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.5)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, bx, by, bw, bh, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('操作说明', 600, by + 25);

    ctx.fillStyle = '#E8D5B0';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    const lines = [
      '鼠标点击弓箭位置，向后拖动拉弓',
      '拖动距离决定射箭力度，方向决定射箭角度',
      '松开鼠标射出箭矢',
      '风会影响箭矢飞行轨迹，注意风向指示器',
      '靶心(金色)10分，连击可获得倍率加成',
      '气球和苹果是高分目标，但更难命中',
      '按 M 键切换音效开关',
    ];
    lines.forEach((line, i) => {
      ctx.fillText('  ' + line, bx + 30, by + 50 + i * 18);
    });
  }

  _drawHighScores(ctx) {
    const scores = this._getHighScores();
    if (!scores) return;

    ctx.fillStyle = 'rgba(20, 15, 30, 0.8)';
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.3)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, 20, 20, 200, 130, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('最高记录', 35, 42);

    ctx.fillStyle = '#E8D5B0';
    ctx.font = '13px sans-serif';
    const modes = ['CLASSIC', 'TIME_ATTACK', 'CHALLENGE'];
    const modeNames = ['经典', '限时', '挑战'];
    modes.forEach((mode, i) => {
      const s = scores[mode] || 0;
      ctx.fillText(`${modeNames[i]}: ${s}分`, 35, 65 + i * 22);
    });
  }

  drawHUD(ctx, state) {
    if (this.showStart || this.showGameOver) return;

    // Top HUD bar
    ctx.fillStyle = 'rgba(10, 8, 20, 0.75)';
    this._roundRect(ctx, 10, 10, CONFIG.CANVAS_WIDTH - 20, 60, 10);
    ctx.fill();

    ctx.strokeStyle = 'rgba(180, 140, 80, 0.4)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, 10, 10, CONFIG.CANVAS_WIDTH - 20, 60, 10);
    ctx.stroke();

    // Score
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 28px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.displayScore}`, 30, 50);

    ctx.fillStyle = '#BBAA88';
    ctx.font = '14px sans-serif';
    ctx.fillText('得分', 30, 28);

    // Mode-specific display
    if (state.mode === 'TIME_ATTACK') {
      // Timer
      ctx.fillStyle = state.timeLeft < 10 ? '#FF4444' : '#E8D5B0';
      ctx.font = 'bold 28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.ceil(state.timeLeft)}`, 300, 50);
      ctx.fillStyle = '#BBAA88';
      ctx.font = '14px sans-serif';
      ctx.fillText('剩余时间', 300, 28);
    } else {
      // Arrow count
      ctx.fillStyle = '#E8D5B0';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${state.arrowsLeft}`, 300, 50);
      ctx.fillStyle = '#BBAA88';
      ctx.font = '14px sans-serif';
      ctx.fillText('剩余箭矢', 300, 28);

      // Arrow quiver visualization
      this._drawQuiver(ctx, 330, 25, state.arrowsLeft, state.totalArrows);
    }

    // Wind indicator
    this._drawWindIndicator(ctx, 550, 40, state.wind);

    // Combo
    if (state.combo > 0) {
      const comboColors = ['#FF44FF', '#FF44FF', '#FF88FF', '#FFAAFF', '#FFFFFF'];
      const color = comboColors[Math.min(state.combo - 1, comboColors.length - 1)];
      ctx.fillStyle = color;
      ctx.font = `bold ${22 + state.combo}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${state.combo}x连击`, 800, 48);

      // Combo multiplier
      const mult = CONFIG.COMBO_MULTIPLIERS[Math.min(state.combo - 1, CONFIG.COMBO_MULTIPLIERS.length - 1)];
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`x${mult}`, 800, 65);
    }

    // High score
    ctx.fillStyle = '#888';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`最高: ${state.highScore}`, CONFIG.CANVAS_WIDTH - 25, 30);

    // Challenge mode objective
    if (state.mode === 'CHALLENGE' && state.challenge) {
      this._drawChallengeObjective(ctx, state.challenge, state.challengeProgress);
    }

    // Sound indicator
    ctx.fillStyle = state.soundEnabled ? '#888' : '#FF4444';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(state.soundEnabled ? '[M] 音效开' : '[M] 音效关', CONFIG.CANVAS_WIDTH - 25, 55);
  }

  _drawQuiver(ctx, x, y, current, total) {
    const maxShow = Math.min(total, 10);
    for (let i = 0; i < maxShow; i++) {
      const filled = i < current;
      ctx.fillStyle = filled ? '#C4A35A' : 'rgba(100, 80, 60, 0.3)';
      ctx.fillRect(x + i * 12, y, 8, 30);
      if (filled) {
        // Feather
        ctx.fillStyle = '#CC3333';
        ctx.beginPath();
        ctx.moveTo(x + i * 12, y);
        ctx.lineTo(x + i * 12 - 3, y - 5);
        ctx.lineTo(x + i * 12 + 4, y);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  _drawWindIndicator(ctx, cx, cy, wind) {
    const indicatorWidth = 160;
    const indicatorHeight = 40;

    // Background
    ctx.fillStyle = 'rgba(30, 25, 40, 0.8)';
    ctx.strokeStyle = 'rgba(100, 180, 255, 0.3)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, cx - indicatorWidth / 2, cy - indicatorHeight / 2, indicatorWidth, indicatorHeight, 6);
    ctx.fill();
    ctx.stroke();

    // Wind label
    ctx.fillStyle = '#88BBDD';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('风力', cx, cy - 10);

    // Wind arrow
    const windStrength = Math.sqrt(wind.x * wind.x + wind.y * wind.y);
    const normalizedStrength = windStrength / CONFIG.WIND_MAX_STRENGTH;

    if (windStrength > 0.2) {
      const arrowLen = normalizedStrength * 40;
      const angle = Math.atan2(wind.y, wind.x);

      ctx.save();
      ctx.translate(cx, cy + 5);
      ctx.rotate(angle);

      // Arrow shaft
      ctx.strokeStyle = `rgba(100, 200, 255, ${0.4 + normalizedStrength * 0.6})`;
      ctx.lineWidth = 2 + normalizedStrength * 2;
      ctx.beginPath();
      ctx.moveTo(-arrowLen / 2, 0);
      ctx.lineTo(arrowLen / 2, 0);
      ctx.stroke();

      // Arrow head
      ctx.fillStyle = `rgba(100, 200, 255, ${0.4 + normalizedStrength * 0.6})`;
      ctx.beginPath();
      ctx.moveTo(arrowLen / 2 + 6, 0);
      ctx.lineTo(arrowLen / 2 - 4, -5);
      ctx.lineTo(arrowLen / 2 - 4, 5);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // Strength text
      ctx.fillStyle = '#AADDFF';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      const strengthLabel = windStrength < 1.5 ? '微风' : windStrength < 3 ? '中风' : '强风';
      ctx.fillText(strengthLabel, cx, cy + 16);
    } else {
      ctx.fillStyle = '#668888';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('无风', cx, cy + 8);
    }
  }

  _drawChallengeObjective(ctx, challenge, progress) {
    const bx = 900, by = 80, bw = 280, bh = 50;

    ctx.fillStyle = 'rgba(10, 8, 20, 0.85)';
    ctx.strokeStyle = 'rgba(255, 180, 60, 0.4)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, bx, by, bw, bh, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('当前目标:', bx + 12, by + 20);

    ctx.fillStyle = '#E8D5B0';
    ctx.font = '14px sans-serif';
    ctx.fillText(challenge.description, bx + 12, by + 40);

    // Progress bar
    const barX = bx + 150, barY = by + 12, barW = 115, barH = 12;
    ctx.fillStyle = 'rgba(60, 50, 40, 0.6)';
    this._roundRect(ctx, barX, barY, barW, barH, 4);
    ctx.fill();

    const fillW = (progress / challenge.count) * barW;
    ctx.fillStyle = '#FF6644';
    this._roundRect(ctx, barX, barY, fillW, barH, 4);
    ctx.fill();

    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${progress}/${challenge.count}`, barX + barW / 2, barY + 10);
  }

  drawGameOver(ctx, stats) {
    if (!this.showGameOver) return;

    // Overlay
    ctx.fillStyle = 'rgba(10, 8, 20, 0.92)';
    ctx.fillRect(0, 0, CONFIG.CANVAS_WIDTH, CONFIG.CANVAS_HEIGHT);

    ctx.save();

    // Title
    ctx.fillStyle = stats.isNewHighScore ? '#FFD700' : '#E8D5B0';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stats.isNewHighScore ? '新纪录!' : '游戏结束', 600, 130);

    if (stats.isNewHighScore) {
      ctx.fillStyle = '#FF6644';
      ctx.font = '20px sans-serif';
      ctx.fillText('恭喜打破最高记录！', 600, 165);
    }

    // Score box
    const bx = 350, by = 185, bw = 500, bh = 270;
    ctx.fillStyle = 'rgba(20, 15, 30, 0.9)';
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.5)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, bx, by, bw, bh, 12);
    ctx.fill();
    ctx.stroke();

    // Score breakdown
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText(`${stats.totalScore}`, 600, by + 50);

    ctx.fillStyle = '#BBAA88';
    ctx.font = '16px sans-serif';
    ctx.fillText('总分', 600, by + 72);

    // Stats grid
    const statsList = [
      { label: '命中率', value: `${stats.hitRate}%` },
      { label: '最高连击', value: `${stats.maxCombo}x` },
      { label: '命中次数', value: `${stats.hits}/${stats.shots}` },
      { label: '靶心命中', value: `${stats.bullseyes}次` },
      { label: '气球击破', value: `${stats.balloons}个` },
      { label: '苹果命中', value: `${stats.apples}个` },
    ];

    ctx.font = '15px sans-serif';
    statsList.forEach((stat, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const sx = bx + 60 + col * 220;
      const sy = by + 100 + row * 45;

      ctx.fillStyle = '#999';
      ctx.textAlign = 'left';
      ctx.fillText(stat.label, sx, sy);

      ctx.fillStyle = '#E8D5B0';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(stat.value, sx + 160, sy);
      ctx.font = '15px sans-serif';
    });

    // Buttons
    // Restart
    ctx.fillStyle = 'rgba(180, 60, 20, 0.7)';
    ctx.strokeStyle = '#FF6644';
    ctx.lineWidth = 2;
    this._roundRect(ctx, 420, 480, 360, 50, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('再来一局', 600, 512);

    // Menu
    ctx.fillStyle = 'rgba(60, 50, 40, 0.6)';
    ctx.strokeStyle = 'rgba(180, 140, 80, 0.4)';
    ctx.lineWidth = 1;
    this._roundRect(ctx, 420, 555, 360, 45, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#BBAA88';
    ctx.font = '18px sans-serif';
    ctx.fillText('返回主菜单', 600, 582);

    ctx.restore();
  }

  _getHighScores() {
    try {
      return JSON.parse(localStorage.getItem('archery_highscores') || '{}');
    } catch {
      return {};
    }
  }

  _roundRect(ctx, x, y, w, h, r) {
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
