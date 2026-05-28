// ui.js - HUD, overlays, UI rendering

import { GAME_WIDTH, GAME_HEIGHT, MAX_LIVES, COMBO, COLORS } from './config.js';

export class UI {
    constructor() {
        this.showStartOverlay = true;
        this.showGameOverOverlay = false;
        this.showHelp = false;
        this.gameOverStats = null;
        this.highScore = parseInt(localStorage.getItem('coinCatcher_highScore') || '0');
    }

    saveHighScore(score) {
        if (score > this.highScore) {
            this.highScore = score;
            localStorage.setItem('coinCatcher_highScore', score.toString());
        }
    }

    drawHUD(ctx, score, lives, combo, comboCount, player, elapsed, misses) {
        ctx.save();

        // Top HUD bar
        const hudH = 50;
        const grad = ctx.createLinearGradient(0, 0, 0, hudH);
        grad.addColorStop(0, 'rgba(0,0,0,0.7)');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, GAME_WIDTH, hudH);

        // Score
        ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = COLORS.gold;
        ctx.textAlign = 'left';
        ctx.fillText(`💰 ${score}`, 15, hudH / 2);

        // High score
        ctx.font = '13px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.textSecondary;
        ctx.fillText(`最高: ${this.highScore}`, 140, hudH / 2);

        // Lives
        ctx.textAlign = 'center';
        ctx.font = '20px "Segoe UI", Arial, sans-serif';
        let heartsStr = '';
        for (let i = 0; i < MAX_LIVES; i++) {
            heartsStr += i < lives ? '❤️' : '🖤';
        }
        ctx.fillText(heartsStr, GAME_WIDTH / 2, hudH / 2);

        // Miss counter
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = misses >= 7 ? '#F44336' : COLORS.textSecondary;
        ctx.fillText(`掉落: ${misses}/10`, GAME_WIDTH / 2, hudH / 2 + 18);

        // Combo
        if (comboCount >= 2) {
            ctx.textAlign = 'right';
            ctx.font = `bold ${20 + combo * 2}px "Segoe UI", Arial, sans-serif`;
            const comboColors = ['#FFFFFF', '#FFD700', '#FFA000', '#FF6F00', '#FF3D00'];
            ctx.fillStyle = comboColors[Math.min(combo, comboColors.length - 1)];
            ctx.shadowColor = ctx.fillStyle;
            ctx.shadowBlur = 10;
            ctx.fillText(`连击 x${combo}`, GAME_WIDTH - 15, hudH / 2 - 5);
            ctx.shadowBlur = 0;

            // Combo bar
            ctx.font = '11px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = COLORS.textSecondary;
            const nextThreshold = COMBO.thresholds.find(t => t > comboCount) || comboCount + 5;
            const prevThreshold = COMBO.thresholds.filter(t => t <= comboCount).pop() || 0;
            const progress = (comboCount - prevThreshold) / (nextThreshold - prevThreshold);
            const barW = 80;
            const barX = GAME_WIDTH - 15 - barW;
            const barY = hudH / 2 + 8;
            ctx.fillStyle = 'rgba(255,255,255,0.15)';
            ctx.fillRect(barX, barY, barW, 6);
            ctx.fillStyle = COLORS.gold;
            ctx.fillRect(barX, barY, barW * Math.min(1, progress), 6);
        }

        // Active power-ups on left side
        this._drawActivePowerUps(ctx, player, hudH);

        // Elapsed time
        ctx.textAlign = 'right';
        ctx.font = '12px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = COLORS.textSecondary;
        const mins = Math.floor(elapsed / 60000);
        const secs = Math.floor((elapsed / 1000) % 60);
        ctx.fillText(`${mins}:${secs.toString().padStart(2, '0')}`, GAME_WIDTH - 15, hudH + 20);

        ctx.restore();
    }

    _drawActivePowerUps(ctx, player, startY) {
        const icons = [];
        if (player.hasMagnet) icons.push({ emoji: '🧲', timer: player.magnetTimer / 1000, color: '#F44336' });
        if (player.hasShield) icons.push({ emoji: '🛡️', timer: 0, color: '#42A5F5' });
        if (player.multiplier > 1) icons.push({ emoji: '⭐', timer: player.multiplierTimer / 1000, color: '#FF6F00' });
        if (player.isSlowed) icons.push({ emoji: '🐌', timer: player.slowTimer / 1000, color: '#795548' });

        if (icons.length === 0) return;

        const startX = 15;
        const y = startY + 20;
        ctx.font = '16px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';

        icons.forEach((icon, i) => {
            const x = startX + i * 60;
            ctx.fillStyle = `${icon.color}88`;
            ctx.beginPath();
            ctx.roundRect(x - 4, y - 10, 55, 22, 6);
            ctx.fill();
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(icon.emoji, x, y + 3);
            if (icon.timer > 0) {
                ctx.font = '11px "Segoe UI", Arial, sans-serif';
                ctx.fillText(`${Math.ceil(icon.timer)}s`, x + 22, y + 3);
                ctx.font = '16px "Segoe UI", Arial, sans-serif';
            }
        });
    }

    drawStartOverlay(ctx) {
        ctx.save();

        // Dark overlay
        ctx.fillStyle = 'rgba(10, 10, 30, 0.85)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Glass panel
        const panelW = 460;
        const panelH = 420;
        const panelX = (GAME_WIDTH - panelW) / 2;
        const panelY = (GAME_HEIGHT - panelH) / 2;

        // Panel bg with glassmorphism
        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 20);
        ctx.stroke();

        // Title
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Title glow
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 30;
        ctx.font = 'bold 56px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText('接金币', GAME_WIDTH / 2, panelY + 70);
        ctx.shadowBlur = 0;

        // Subtitle
        ctx.font = '16px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#B0BEC5';
        ctx.fillText('Coin Catcher', GAME_WIDTH / 2, panelY + 110);

        // Start button
        const btnW = 200;
        const btnH = 50;
        const btnX = (GAME_WIDTH - btnW) / 2;
        const btnY = panelY + 140;
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
        btnGrad.addColorStop(0, '#FFB300');
        btnGrad.addColorStop(1, '#FF8F00');
        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 12);
        ctx.fill();
        ctx.shadowColor = '#FF8F00';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 12);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.font = 'bold 22px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#1a1a2e';
        ctx.fillText('开始游戏', GAME_WIDTH / 2, btnY + btnH / 2);

        // Help box
        const helpY = btnY + btnH + 25;
        const helpH = 180;
        ctx.fillStyle = 'rgba(255,255,255,0.04)';
        ctx.beginPath();
        ctx.roundRect(panelX + 20, helpY, panelW - 40, helpH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(panelX + 20, helpY, panelW - 40, helpH, 12);
        ctx.stroke();

        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#E0E0E0';
        const lines = [
            '🎯  用篮子接住掉落的金币和宝物',
            '⬅️➡️  方向键 或 鼠标/触屏 移动篮子',
            '🪙 金币+10  🪙 银币+5  💎 钻石+25',
            '⭐ 双倍得分  🧲 磁铁  🛡️ 护盾  🐌 减速',
            '💣 炸弹扣命  🪨 岩石减速篮子',
            '🔥 连续接住提升连击倍率 (最高x5)',
            '⚠️  掉落10个物品或炸弹命中失去生命',
        ];
        const lineH = 22;
        const textX = panelX + 35;
        lines.forEach((line, i) => {
            ctx.fillText(line, textX, helpY + 20 + i * lineH);
        });

        // High score
        ctx.textAlign = 'center';
        ctx.font = '14px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#FFD700';
        ctx.fillText(`🏆 最高分: ${this.highScore}`, GAME_WIDTH / 2, panelY + panelH - 20);

        ctx.restore();
    }

    drawGameOverOverlay(ctx, stats) {
        ctx.save();

        // Dark overlay
        ctx.fillStyle = 'rgba(10, 10, 30, 0.88)';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // Glass panel
        const panelW = 400;
        const panelH = 380;
        const panelX = (GAME_WIDTH - panelW) / 2;
        const panelY = (GAME_HEIGHT - panelH) / 2;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 20);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 20);
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Game Over title
        ctx.shadowColor = '#F44336';
        ctx.shadowBlur = 20;
        ctx.font = 'bold 44px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#F44336';
        ctx.fillText('游戏结束', GAME_WIDTH / 2, panelY + 55);
        ctx.shadowBlur = 0;

        // New high score?
        if (stats.isNewHighScore) {
            ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.fillText('🏆 新纪录!', GAME_WIDTH / 2, panelY + 95);
            ctx.shadowBlur = 0;
        }

        // Stats
        const statY = panelY + 130;
        const statH = 36;
        ctx.font = '16px "Segoe UI", Arial, sans-serif';

        const statItems = [
            { label: '最终得分', value: stats.score, color: '#FFD700' },
            { label: '接住物品', value: stats.itemsCaught, color: '#4CAF50' },
            { label: '最高连击', value: `${stats.maxCombo}x`, color: '#FF9800' },
            { label: '接住金币', value: stats.coinsCaught, color: '#FFD700' },
            { label: '接住钻石', value: stats.diamondsCaught, color: '#00E5FF' },
            { label: '存活时间', value: stats.survivalTime, color: '#B0BEC5' },
        ];

        statItems.forEach((stat, i) => {
            const y = statY + i * statH;
            ctx.textAlign = 'left';
            ctx.fillStyle = '#B0BEC5';
            ctx.fillText(stat.label, panelX + 40, y);
            ctx.textAlign = 'right';
            ctx.fillStyle = stat.color;
            ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
            ctx.fillText(stat.value.toString(), panelX + panelW - 40, y);
            ctx.font = '16px "Segoe UI", Arial, sans-serif';
        });

        // Restart button
        const btnW = 180;
        const btnH = 46;
        const btnX = (GAME_WIDTH - btnW) / 2;
        const btnY = panelY + panelH - 70;
        const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH);
        btnGrad.addColorStop(0, '#FFB300');
        btnGrad.addColorStop(1, '#FF8F00');
        ctx.fillStyle = btnGrad;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 12);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, btnW, btnH, 12);
        ctx.stroke();
        ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
        ctx.fillStyle = '#1a1a2e';
        ctx.textAlign = 'center';
        ctx.fillText('再来一局', GAME_WIDTH / 2, btnY + btnH / 2);

        ctx.restore();
    }

    drawComboPopup(ctx, combo) {
        if (combo < 3) return;
        ctx.save();
        const t = (Date.now() % 1000) / 1000;
        const scale = 1 + Math.sin(t * Math.PI) * 0.05;
        ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50);
        ctx.scale(scale, scale);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const colors = ['', '', '', '#FFA000', '#FF6F00', '#FF3D00'];
        ctx.fillStyle = colors[Math.min(combo, colors.length - 1)];
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 20;
        ctx.font = `bold ${32 + combo * 2}px "Segoe UI", Arial, sans-serif`;
        ctx.globalAlpha = 0.6;
        ctx.fillText(`连击 x${combo}!`, 0, 0);
        ctx.shadowBlur = 0;
        ctx.restore();
    }
}
