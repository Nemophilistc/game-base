// ui.js - UI overlays and HUD
import { TILE, COLORS, SHOP_ITEMS } from './config.js';

export class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.overlay = 'start'; // 'start', 'gameover', 'shop', 'none'
        this.selectedShopItem = 0;
        this.transitionAlpha = 0;
        this.transitionDir = 0; // 1 = fading in, -1 = fading out
        this.transitionCallback = null;
        this.shopItems = [];
        this.shopPlayer = null;
        this.shopMessage = '';
        this.shopMessageTimer = 0;
        this.deathStats = null;
        this.levelStartTimer = 0;
        this.levelStartText = '';
        this.compassAngle = 0;
        this.tutorialText = '';
        this.tutorialTimer = 0;
    }

    showStart() {
        this.overlay = 'start';
    }

    showGameOver(stats) {
        this.overlay = 'gameover';
        this.deathStats = stats;
    }

    showShop(items, player) {
        this.overlay = 'shop';
        this.shopItems = items;
        this.shopPlayer = player;
        this.selectedShopItem = 0;
    }

    hideShop() {
        this.overlay = 'none';
    }

    hide() {
        this.overlay = 'none';
    }

    showLevelStart(text) {
        this.levelStartText = text;
        this.levelStartTimer = 2000;
    }

    showTutorial(text) {
        this.tutorialText = text;
        this.tutorialTimer = 3000;
    }

    update(dt) {
        if (this.levelStartTimer > 0) this.levelStartTimer -= dt;
        if (this.tutorialTimer > 0) this.tutorialTimer -= dt;
        if (this.shopMessageTimer > 0) this.shopMessageTimer -= dt;
        if (this.transitionDir !== 0) {
            this.transitionAlpha += this.transitionDir * dt * 0.003;
            if (this.transitionAlpha >= 1 && this.transitionDir === 1) {
                this.transitionAlpha = 1;
                if (this.transitionCallback) {
                    this.transitionCallback();
                    this.transitionCallback = null;
                }
                this.transitionDir = -1;
            }
            if (this.transitionAlpha <= 0 && this.transitionDir === -1) {
                this.transitionAlpha = 0;
                this.transitionDir = 0;
            }
        }
    }

    transition(callback) {
        this.transitionDir = 1;
        this.transitionAlpha = 0;
        this.transitionCallback = callback;
    }

    renderHUD(ctx, player, level, timeBonus, viewW, viewH) {
        const pad = 8;
        const barH = 36;

        // HUD background
        ctx.fillStyle = COLORS.hudBg;
        ctx.fillRect(0, 0, viewW, barH);
        ctx.strokeStyle = COLORS.hudBorder;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, barH);
        ctx.lineTo(viewW, barH);
        ctx.stroke();

        ctx.font = 'bold 11px monospace';

        // HP
        const hpX = pad;
        for (let i = 0; i < player.maxHp; i++) {
            const hx = hpX + i * 16;
            ctx.fillStyle = i < player.hp ? '#cc3333' : '#331111';
            ctx.beginPath();
            ctx.arc(hx + 5, 12, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(hx + 11, 12, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(hx + 1, 14);
            ctx.lineTo(hx + 8, 22);
            ctx.lineTo(hx + 15, 14);
            ctx.fill();
        }

        // Gold/Score
        const scoreX = hpX + player.maxHp * 16 + 20;
        ctx.fillStyle = COLORS.gold;
        ctx.fillRect(scoreX, 10, 8, 8);
        ctx.fillStyle = COLORS.hudText;
        ctx.fillText(`${player.gold}`, scoreX + 12, 18);

        // Ropes
        const ropeX = scoreX + 80;
        ctx.fillStyle = COLORS.ropePickup;
        ctx.beginPath();
        ctx.arc(ropeX + 5, 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.hudText;
        ctx.fillText(`${player.ropes}`, ropeX + 12, 18);

        // Bombs
        const bombX = ropeX + 40;
        ctx.fillStyle = COLORS.bomb;
        ctx.beginPath();
        ctx.arc(bombX + 5, 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.hudText;
        ctx.fillText(`${player.bombs}`, bombX + 12, 18);

        // Key indicator
        if (player.hasKey) {
            const keyX = bombX + 40;
            ctx.fillStyle = COLORS.gold;
            ctx.beginPath();
            ctx.arc(keyX + 4, 12, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.bg;
            ctx.beginPath();
            ctx.arc(keyX + 4, 12, 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = COLORS.gold;
            ctx.fillRect(keyX + 6, 11, 6, 2);
            ctx.fillRect(keyX + 10, 13, 2, 2);
        }

        // Level depth
        ctx.fillStyle = COLORS.uiAccent;
        ctx.textAlign = 'right';
        ctx.fillText(`深度 ${level.depth}`, viewW - pad, 14);

        // Time bonus
        if (timeBonus > 0) {
            ctx.fillStyle = COLORS.hudText;
            ctx.fillText(`时间奖励: ${timeBonus}`, viewW - pad, 28);
        }
        ctx.textAlign = 'left';

        // Compass indicator (if player has compass)
        if (player.hasCompass) {
            this._renderCompass(ctx, player, level, viewW, viewH);
        }

        // Level start text
        if (this.levelStartTimer > 0) {
            const alpha = Math.min(1, this.levelStartTimer / 300);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = COLORS.uiAccent;
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.levelStartText, viewW / 2, viewH / 2);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }

        // Tutorial text
        if (this.tutorialTimer > 0) {
            const alpha = Math.min(1, this.tutorialTimer / 500);
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(15,8,3,0.85)';
            const tw = ctx.measureText(this.tutorialText).width + 20;
            ctx.fillRect(viewW / 2 - tw / 2, viewH - 60, tw, 24);
            ctx.strokeStyle = COLORS.uiAccent;
            ctx.lineWidth = 1;
            ctx.strokeRect(viewW / 2 - tw / 2, viewH - 60, tw, 24);
            ctx.fillStyle = COLORS.hudText;
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.tutorialText, viewW / 2, viewH - 44);
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    }

    _renderCompass(ctx, player, level, viewW, viewH) {
        const doorX = level.exitDoor.x;
        const doorY = level.exitDoor.y;
        const dx = doorX - player.x;
        const dy = doorY - player.y;
        const angle = Math.atan2(dy, dx);
        const dist = Math.hypot(dx, dy);

        const cx = viewW - 40;
        const cy = viewH - 40;
        const r = 12;

        ctx.fillStyle = 'rgba(15,8,3,0.7)';
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = COLORS.uiAccent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
        ctx.stroke();

        // Arrow
        ctx.fillStyle = level.doorOpen ? COLORS.uiSuccess : COLORS.gold;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(-4, -4);
        ctx.lineTo(-2, 0);
        ctx.lineTo(-4, 4);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Distance
        ctx.fillStyle = COLORS.hudText;
        ctx.font = '8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(dist / TILE)}`, cx, cy + r + 12);
        ctx.textAlign = 'left';
    }

    renderStartOverlay(ctx, viewW, viewH) {
        // Background
        ctx.fillStyle = 'rgba(10,5,2,0.95)';
        ctx.fillRect(0, 0, viewW, viewH);

        // Title
        const titleY = viewH * 0.25;
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 42px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('矿洞探险', viewW / 2, titleY);

        // Subtitle
        ctx.fillStyle = COLORS.uiAccent;
        ctx.font = '16px monospace';
        ctx.fillText('CAVE EXPLORER', viewW / 2, titleY + 30);

        // Decorative line
        ctx.strokeStyle = COLORS.uiAccent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(viewW / 2 - 120, titleY + 42);
        ctx.lineTo(viewW / 2 + 120, titleY + 42);
        ctx.stroke();

        // Character preview
        const charY = titleY + 70;
        ctx.fillStyle = COLORS.playerBandana;
        ctx.fillRect(viewW / 2 - 8, charY, 16, 4);
        ctx.fillStyle = COLORS.playerSkin;
        ctx.fillRect(viewW / 2 - 7, charY + 4, 14, 10);
        ctx.fillStyle = COLORS.player;
        ctx.fillRect(viewW / 2 - 7, charY + 14, 14, 16);
        ctx.fillStyle = COLORS.playerEye;
        ctx.fillRect(viewW / 2 + 1, charY + 7, 2, 3);
        ctx.fillRect(viewW / 2 + 4, charY + 7, 2, 3);

        // Start button
        const btnY = titleY + 140;
        const btnW = 180;
        const btnH = 40;
        const pulse = 0.8 + Math.sin(Date.now() / 400) * 0.2;
        ctx.fillStyle = `rgba(180,140,60,${0.15 * pulse})`;
        ctx.fillRect(viewW / 2 - btnW / 2, btnY, btnW, btnH);
        ctx.strokeStyle = COLORS.uiAccent;
        ctx.lineWidth = 2;
        ctx.strokeRect(viewW / 2 - btnW / 2, btnY, btnW, btnH);
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 18px monospace';
        ctx.fillText('按 SPACE 开始', viewW / 2, btnY + 26);

        // Help box
        const helpY = btnY + 60;
        ctx.fillStyle = 'rgba(30,20,10,0.8)';
        ctx.fillRect(viewW / 2 - 200, helpY, 400, 160);
        ctx.strokeStyle = COLORS.hudBorder;
        ctx.lineWidth = 1;
        ctx.strokeRect(viewW / 2 - 200, helpY, 400, 160);

        ctx.fillStyle = COLORS.uiAccent;
        ctx.font = 'bold 13px monospace';
        ctx.fillText('操作说明', viewW / 2, helpY + 20);

        ctx.fillStyle = COLORS.hudText;
        ctx.font = '11px monospace';
        const helpLines = [
            'A/D 或 方向键 - 移动',
            'W/上键 - 攀爬梯子',
            'SPACE - 跳跃 (墙壁可蹬墙跳)',
            'SHIFT/V - 鞭子攻击',
            'Z - 放置炸弹',
            'C - 投掷绳索',
            '找到钥匙 → 到达出口 → 进入下一层',
            '收集黄金和宝石！死亡即永久失败！',
        ];
        for (let i = 0; i < helpLines.length; i++) {
            ctx.fillText(helpLines[i], viewW / 2, helpY + 38 + i * 15);
        }

        ctx.textAlign = 'left';
    }

    renderGameOver(ctx, viewW, viewH) {
        // Background
        ctx.fillStyle = 'rgba(10,5,2,0.92)';
        ctx.fillRect(0, 0, viewW, viewH);

        const centerY = viewH * 0.3;

        // Title
        ctx.fillStyle = COLORS.uiDanger;
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('探险结束', viewW / 2, centerY);

        // Stats
        if (this.deathStats) {
            ctx.fillStyle = COLORS.hudText;
            ctx.font = '16px monospace';
            const stats = [
                `到达深度: ${this.deathStats.depth}`,
                `收集黄金: ${this.deathStats.gold}`,
                `消灭敌人: ${this.deathStats.kills}`,
            ];
            for (let i = 0; i < stats.length; i++) {
                ctx.fillText(stats[i], viewW / 2, centerY + 50 + i * 28);
            }

            // High score
            ctx.fillStyle = COLORS.gold;
            ctx.font = 'bold 14px monospace';
            ctx.fillText(`最高纪录: ${this.deathStats.highScore}`, viewW / 2, centerY + 140);
        }

        // Restart button
        const btnY = centerY + 170;
        const pulse = 0.8 + Math.sin(Date.now() / 400) * 0.2;
        ctx.fillStyle = `rgba(180,140,60,${0.15 * pulse})`;
        ctx.fillRect(viewW / 2 - 120, btnY, 240, 36);
        ctx.strokeStyle = COLORS.uiAccent;
        ctx.lineWidth = 1;
        ctx.strokeRect(viewW / 2 - 120, btnY, 240, 36);
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 14px monospace';
        ctx.fillText('按 SPACE 重新开始', viewW / 2, btnY + 24);

        ctx.textAlign = 'left';
    }

    renderShopOverlay(ctx, viewW, viewH) {
        // Semi-transparent background
        ctx.fillStyle = 'rgba(10,5,2,0.85)';
        ctx.fillRect(0, 0, viewW, viewH);

        const panelW = 400;
        const panelH = 320;
        const panelX = (viewW - panelW) / 2;
        const panelY = (viewH - panelH) / 2;

        // Panel
        ctx.fillStyle = COLORS.uiBg;
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = COLORS.uiBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(panelX, panelY, panelW, panelH);

        // Title
        ctx.fillStyle = COLORS.gold;
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('商店', viewW / 2, panelY + 30);

        // Gold display
        ctx.fillStyle = COLORS.hudText;
        ctx.font = '14px monospace';
        ctx.fillText(`持有黄金: ${this.shopPlayer?.gold || 0}`, viewW / 2, panelY + 52);

        // Shop items
        if (this.shopItems) {
            for (let i = 0; i < this.shopItems.length; i++) {
                const item = this.shopItems[i];
                const iy = panelY + 70 + i * 42;
                const selected = i === this.selectedShopItem;
                const purchased = item.purchased;

                // Item row
                ctx.fillStyle = selected ? 'rgba(180,140,60,0.15)' : 'rgba(40,25,10,0.5)';
                ctx.fillRect(panelX + 10, iy, panelW - 20, 36);
                if (selected) {
                    ctx.strokeStyle = COLORS.uiAccent;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(panelX + 10, iy, panelW - 20, 36);
                }

                // Item name
                ctx.fillStyle = purchased ? '#555' : COLORS.hudText;
                ctx.font = '13px monospace';
                ctx.textAlign = 'left';
                ctx.fillText(item.name, panelX + 20, iy + 22);

                // Cost
                ctx.fillStyle = purchased ? '#555' : COLORS.gold;
                ctx.textAlign = 'right';
                ctx.fillText(purchased ? '已购' : `$${item.cost}`, panelX + panelW - 20, iy + 22);
                ctx.textAlign = 'left';
            }
        }

        // Shop message
        if (this.shopMessageTimer > 0) {
            ctx.fillStyle = COLORS.uiDanger;
            ctx.font = '12px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.shopMessage, viewW / 2, panelY + panelH - 30);
            ctx.textAlign = 'left';
        }

        // Instructions
        ctx.fillStyle = COLORS.hudText;
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('上下键选择  SPACE购买  ESC离开', viewW / 2, panelY + panelH - 12);
        ctx.textAlign = 'left';
    }

    renderTransition(ctx, viewW, viewH) {
        if (this.transitionAlpha > 0) {
            ctx.globalAlpha = Math.min(1, this.transitionAlpha);
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, viewW, viewH);
            ctx.globalAlpha = 1;
        }
    }
}
