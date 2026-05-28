// ui.js - HUD, menus, overlays
import { CANVAS_WIDTH, CANVAS_HEIGHT, GAME_OVER_Y, BUBBLE_COLORS, BUBBLE_COLOR_NAMES } from './config.js';

export function drawHUD(ctx, state) {
  // Top bar background
  const grad = ctx.createLinearGradient(0, 0, 0, 50);
  grad.addColorStop(0, 'rgba(0,0,0,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, 55);

  // Score
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 22px "Microsoft YaHei", Arial';
  ctx.textAlign = 'left';
  ctx.fillText(`分数: ${state.score}`, 15, 30);

  // Level
  ctx.fillStyle = '#FF8800';
  ctx.font = 'bold 18px "Microsoft YaHei", Arial';
  ctx.textAlign = 'center';
  ctx.fillText(`第 ${state.level} 关`, CANVAS_WIDTH / 2, 30);

  // Combo
  if (state.combo > 1) {
    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 24px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    const comboAlpha = 0.5 + Math.sin(Date.now() / 150) * 0.5;
    ctx.globalAlpha = comboAlpha;
    ctx.fillText(`${state.combo}x 连击!`, CANVAS_WIDTH / 2, 52);
    ctx.globalAlpha = 1;
  }

  // High score
  ctx.fillStyle = '#AAA';
  ctx.font = '14px "Microsoft YaHei", Arial';
  ctx.textAlign = 'right';
  ctx.fillText(`最高: ${state.highScore}`, CANVAS_WIDTH - 15, 28);

  // Bottom line (danger zone)
  ctx.beginPath();
  ctx.setLineDash([8, 4]);
  ctx.moveTo(0, GAME_OVER_Y);
  ctx.lineTo(CANVAS_WIDTH, GAME_OVER_Y);
  ctx.strokeStyle = 'rgba(255, 50, 50, 0.4)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.setLineDash([]);

  // Danger zone gradient
  const dangerGrad = ctx.createLinearGradient(0, GAME_OVER_Y, 0, CANVAS_HEIGHT);
  dangerGrad.addColorStop(0, 'rgba(255, 0, 0, 0)');
  dangerGrad.addColorStop(1, 'rgba(255, 0, 0, 0.08)');
  ctx.fillStyle = dangerGrad;
  ctx.fillRect(0, GAME_OVER_Y, CANVAS_WIDTH, CANVAS_HEIGHT - GAME_OVER_Y);

  // Color legend at bottom
  ctx.globalAlpha = 0.5;
  ctx.font = '10px "Microsoft YaHei", Arial';
  ctx.textAlign = 'center';
  const legendY = CANVAS_HEIGHT - 15;
  const activeColors = BUBBLE_COLORS.slice(0, state.colorCount);
  const spacing = CANVAS_WIDTH / (activeColors.length + 1);
  activeColors.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(spacing * (i + 1), legendY - 5, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#888';
    ctx.fillText(BUBBLE_COLOR_NAMES[i], spacing * (i + 1), legendY + 10);
  });
  ctx.globalAlpha = 1;
}

export function drawBackground(ctx) {
  // Dark gradient background
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
  grad.addColorStop(0, '#1a0a2e');
  grad.addColorStop(0.5, '#16213e');
  grad.addColorStop(1, '#0f3460');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Grid lines (subtle)
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_WIDTH; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
  }
}

export function drawStartOverlay(ctx, state) {
  // Dim overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Glass panel
  drawGlassPanel(ctx, CANVAS_WIDTH / 2 - 180, 80, 360, 520);

  // Title
  ctx.fillStyle = '#FF6600';
  ctx.font = 'bold 56px "Microsoft YaHei", Arial';
  ctx.textAlign = 'center';
  ctx.fillText('泡泡龙', CANVAS_WIDTH / 2, 170);

  // Subtitle
  ctx.fillStyle = '#FFD700';
  ctx.font = '18px "Microsoft YaHei", Arial';
  ctx.fillText('经典泡泡射击游戏', CANVAS_WIDTH / 2, 205);

  // High score
  if (state.highScore > 0) {
    ctx.fillStyle = '#FFA500';
    ctx.font = '16px "Microsoft YaHei", Arial';
    ctx.fillText(`最高分: ${state.highScore}`, CANVAS_WIDTH / 2, 240);
  }

  // Start button
  const btnX = CANVAS_WIDTH / 2 - 90;
  const btnY = 280;
  const btnW = 180;
  const btnH = 55;
  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
  btnGrad.addColorStop(0, '#FF6600');
  btnGrad.addColorStop(1, '#CC3300');
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 24px "Microsoft YaHei", Arial';
  ctx.fillText('开始游戏', CANVAS_WIDTH / 2, btnY + 36);

  // Help text
  const helpY = 380;
  drawGlassPanel(ctx, CANVAS_WIDTH / 2 - 150, helpY - 15, 300, 200);

  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 16px "Microsoft YaHei", Arial';
  ctx.textAlign = 'center';
  ctx.fillText('游戏规则', CANVAS_WIDTH / 2, helpY + 12);

  const rules = [
    '鼠标移动瞄准，点击发射泡泡',
    '3个及以上相同颜色泡泡消除',
    '消除后悬空泡泡会掉落得分',
    '炸弹泡泡: 范围爆炸消除',
    '彩虹泡泡: 匹配任意颜色',
    '连续消除获得连击加分!',
  ];

  ctx.fillStyle = '#CCDDEE';
  ctx.font = '14px "Microsoft YaHei", Arial';
  rules.forEach((rule, i) => {
    ctx.fillText(rule, CANVAS_WIDTH / 2, helpY + 40 + i * 24);
  });

  // Version
  ctx.fillStyle = '#556';
  ctx.font = '11px Arial';
  ctx.fillText('v1.0 | ES Modules', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 20);
}

export function drawGameOverOverlay(ctx, state) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  drawGlassPanel(ctx, CANVAS_WIDTH / 2 - 170, 140, 340, 380);

  ctx.fillStyle = '#FF4444';
  ctx.font = 'bold 44px "Microsoft YaHei", Arial';
  ctx.textAlign = 'center';
  ctx.fillText('游戏结束', CANVAS_WIDTH / 2, 220);

  // Stats
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 28px "Microsoft YaHei", Arial';
  ctx.fillText(`最终得分`, CANVAS_WIDTH / 2, 275);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 40px Arial';
  ctx.fillText(`${state.score}`, CANVAS_WIDTH / 2, 325);

  ctx.fillStyle = '#FF8800';
  ctx.font = '18px "Microsoft YaHei", Arial';
  ctx.fillText(`到达第 ${state.level} 关`, CANVAS_WIDTH / 2, 365);

  // New high score
  if (state.score >= state.highScore && state.score > 0) {
    ctx.fillStyle = '#FF4444';
    ctx.font = 'bold 20px "Microsoft YaHei", Arial';
    const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillText('新纪录!', CANVAS_WIDTH / 2, 400);
    ctx.globalAlpha = 1;
  } else {
    ctx.fillStyle = '#888';
    ctx.font = '16px "Microsoft YaHei", Arial';
    ctx.fillText(`最高分: ${state.highScore}`, CANVAS_WIDTH / 2, 400);
  }

  // Restart button
  const btnX = CANVAS_WIDTH / 2 - 80;
  const btnY = 430;
  const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + 50);
  btnGrad.addColorStop(0, '#FF6600');
  btnGrad.addColorStop(1, '#CC3300');
  ctx.fillStyle = btnGrad;
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, 160, 50, 12);
  ctx.fill();
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px "Microsoft YaHei", Arial';
  ctx.fillText('重新开始', CANVAS_WIDTH / 2, btnY + 33);
}

function drawGlassPanel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(20, 30, 60, 0.7)';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 16);
  ctx.stroke();
}

// Level up notification
export function drawLevelUpNotice(ctx, timer) {
  if (timer <= 0) return;
  const alpha = Math.min(1, timer / 500);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 36px "Microsoft YaHei", Arial';
  ctx.textAlign = 'center';
  const y = CANVAS_HEIGHT / 2 - 50 - (1 - alpha) * 30;
  ctx.fillText(`第 ${Math.floor(timer / 1000) + 2} 关!`, CANVAS_WIDTH / 2, y);
  ctx.globalAlpha = 1;
}
