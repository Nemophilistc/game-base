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

export function drawGameOverOverlay(ctx, state, timer) {
  const t = timer || 0;
  const fadeDuration = 0.8;
  const overlayAlpha = Math.min(0.85, (t / fadeDuration) * 0.85);
  const flashAlpha = t < 0.3 ? Math.max(0, (0.3 - t) / 0.3) * 0.35 : 0;

  // Dark overlay with fade-in
  ctx.globalAlpha = overlayAlpha;
  ctx.fillStyle = '#0a0008';
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  ctx.globalAlpha = 1;

  // Red flash burst (brief)
  if (flashAlpha > 0) {
    ctx.globalAlpha = flashAlpha;
    const flashGrad = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 0,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.7
    );
    flashGrad.addColorStop(0, '#FF2200');
    flashGrad.addColorStop(0.6, '#880000');
    flashGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = flashGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }

  // Dark vignette (always on after overlay fades in)
  if (overlayAlpha > 0.3) {
    const vigAlpha = Math.min(0.5, (overlayAlpha - 0.3) * 0.8);
    ctx.globalAlpha = vigAlpha;
    const vignette = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.15,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_WIDTH * 0.65
    );
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, '#000000');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;
  }

  // === Staggered content: each element fades in with a delay ===

  // Glass panel (appears at t=0.2)
  const panelAlpha = clamp01((t - 0.2) / 0.4);
  if (panelAlpha > 0) {
    ctx.globalAlpha = panelAlpha;
    drawGlassPanel(ctx, CANVAS_WIDTH / 2 - 170, 140, 340, 380);
    ctx.globalAlpha = 1;
  }

  // "游戏结束" title (appears at t=0.3, slides down)
  const titleAlpha = clamp01((t - 0.3) / 0.4);
  if (titleAlpha > 0) {
    const titleSlide = (1 - titleAlpha) * -30;
    ctx.globalAlpha = titleAlpha;
    ctx.fillStyle = '#FF3333';
    ctx.font = 'bold 48px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, 220 + titleSlide);

    // Red glow behind title
    ctx.globalAlpha = titleAlpha * 0.15;
    ctx.shadowColor = '#FF0000';
    ctx.shadowBlur = 30;
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, 220 + titleSlide);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // Score label (appears at t=0.5)
  const scoreLabelAlpha = clamp01((t - 0.5) / 0.3);
  if (scoreLabelAlpha > 0) {
    ctx.globalAlpha = scoreLabelAlpha;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('最终得分', CANVAS_WIDTH / 2, 275);
    ctx.globalAlpha = 1;
  }

  // Score number (appears at t=0.6, scales up)
  const scoreAlpha = clamp01((t - 0.6) / 0.35);
  if (scoreAlpha > 0) {
    const scaleUp = 0.5 + scoreAlpha * 0.5; // scales from 0.5 to 1.0
    ctx.save();
    ctx.globalAlpha = scoreAlpha;
    ctx.translate(CANVAS_WIDTH / 2, 325);
    ctx.scale(scaleUp, scaleUp);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 44px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${state.score}`, 0, 0);
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // Level reached (appears at t=0.75)
  const levelAlpha = clamp01((t - 0.75) / 0.3);
  if (levelAlpha > 0) {
    ctx.globalAlpha = levelAlpha;
    ctx.fillStyle = '#FF8800';
    ctx.font = '18px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`到达第 ${state.level} 关`, CANVAS_WIDTH / 2, 365);
    ctx.globalAlpha = 1;
  }

  // High score / New record (appears at t=0.9)
  const hsAlpha = clamp01((t - 0.9) / 0.3);
  if (hsAlpha > 0) {
    ctx.globalAlpha = hsAlpha;
    if (state.score >= state.highScore && state.score > 0) {
      ctx.fillStyle = '#FF4444';
      ctx.font = 'bold 22px "Microsoft YaHei", Arial';
      const pulse = 0.6 + Math.sin(Date.now() / 200) * 0.4;
      ctx.globalAlpha = hsAlpha * pulse;
      ctx.fillText('新纪录!', CANVAS_WIDTH / 2, 400);
    } else {
      ctx.fillStyle = '#888';
      ctx.font = '16px "Microsoft YaHei", Arial';
      ctx.fillText(`最高分: ${state.highScore}`, CANVAS_WIDTH / 2, 400);
    }
    ctx.globalAlpha = 1;
  }

  // Restart button (appears at t=1.2, with glow pulse)
  const btnAlpha = clamp01((t - 1.2) / 0.4);
  if (btnAlpha > 0) {
    const btnX = CANVAS_WIDTH / 2 - 80;
    const btnY = 430;
    const btnW = 160;
    const btnH = 50;
    const glowPulse = 0.4 + Math.sin(Date.now() / 400) * 0.3;

    // Outer glow
    ctx.globalAlpha = btnAlpha * glowPulse;
    ctx.shadowColor = '#FF6600';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FF6600';
    ctx.beginPath();
    ctx.roundRect(btnX - 3, btnY - 3, btnW + 6, btnH + 6, 14);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Button body
    ctx.globalAlpha = btnAlpha;
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
    btnGrad.addColorStop(0, '#FF7700');
    btnGrad.addColorStop(1, '#CC3300');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnW, btnH, 12);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px "Microsoft YaHei", Arial';
    ctx.textAlign = 'center';
    ctx.fillText('重新开始', CANVAS_WIDTH / 2, btnY + 33);
    ctx.globalAlpha = 1;
  }
}

function clamp01(v) {
  return Math.max(0, Math.min(1, v));
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
