// ============================================================
// ui.js - HUD、升级选择界面、覆盖层
// ============================================================

import { XP_TABLE, WEAPONS } from './config.js';

export class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.upgradeOptions = [];
        this.showingUpgrades = false;
        this.selectedOption = -1;
        this.rerollsAvailable = 0;
        this.onSelect = null;
        this.onReroll = null;
        this.showingGameOver = false;
        this.gameOverStats = null;
        this.showingStart = true;
        this.showingPause = false;
        this.showingWeaponPanel = false;
    }

    showUpgradeOptions(options, rerolls, onSelect, onReroll) {
        this.upgradeOptions = options;
        this.showingUpgrades = true;
        this.selectedOption = -1;
        this.rerollsAvailable = rerolls;
        this.onSelect = onSelect;
        this.onReroll = onReroll;
    }

    hideUpgradeOptions() {
        this.showingUpgrades = false;
        this.upgradeOptions = [];
    }

    showGameOver(stats) {
        this.showingGameOver = true;
        this.gameOverStats = stats;
    }

    handleClick(mx, my) {
        if (this.showingUpgrades) {
            const cw = this.canvas.width;
            const ch = this.canvas.height;
            const cardW = 200;
            const cardH = 280;
            const gap = 30;
            const totalW = this.upgradeOptions.length * cardW + (this.upgradeOptions.length - 1) * gap;
            const startX = (cw - totalW) / 2;
            const startY = (ch - cardH) / 2;

            for (let i = 0; i < this.upgradeOptions.length; i++) {
                const cx = startX + i * (cardW + gap);
                if (mx >= cx && mx <= cx + cardW && my >= startY && my <= startY + cardH) {
                    this.onSelect(i);
                    return true;
                }
            }

            // 重随按钮
            if (this.rerollsAvailable > 0) {
                const rerollBtnX = cw / 2 - 60;
                const rerollBtnY = startY + cardH + 30;
                if (mx >= rerollBtnX && mx <= rerollBtnX + 120 && my >= rerollBtnY && my <= rerollBtnY + 40) {
                    this.onReroll();
                    return true;
                }
            }
        }

        if (this.showingGameOver) {
            const cw = this.canvas.width;
            const ch = this.canvas.height;
            const btnX = cw / 2 - 100;
            const btnY = ch / 2 + 120;
            if (mx >= btnX && mx <= btnX + 200 && my >= btnY && my <= btnY + 50) {
                return 'restart';
            }
        }

        if (this.showingStart) {
            const cw = this.canvas.width;
            const ch = this.canvas.height;
            const btnX = cw / 2 - 120;
            const btnY = ch / 2 + 60;
            if (mx >= btnX && mx <= btnX + 240 && my >= btnY && my <= btnY + 60) {
                return 'start';
            }
        }

        return false;
    }

    draw(ctx, player, gameTime, enemyCount, weaponSystem) {
        const cw = this.canvas.width;
        const ch = this.canvas.height;

        // HUD
        this._drawHUD(ctx, player, gameTime, enemyCount, cw, ch, weaponSystem);

        // 升级选择界面
        if (this.showingUpgrades) {
            this._drawUpgradePanel(ctx, cw, ch);
        }

        // 游戏结束界面
        if (this.showingGameOver) {
            this._drawGameOver(ctx, cw, ch);
        }

        // 开始界面
        if (this.showingStart) {
            this._drawStartScreen(ctx, cw, ch);
        }
    }

    _drawHUD(ctx, player, gameTime, enemyCount, cw, ch, weaponSystem) {
        ctx.save();

        // HP条
        const hpBarW = 250;
        const hpBarH = 16;
        const hpX = 20;
        const hpY = 20;
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(hpX - 2, hpY - 2, hpBarW + 4, hpBarH + 4);
        ctx.fillStyle = '#333';
        ctx.fillRect(hpX, hpY, hpBarW, hpBarH);
        const hpRatio = player.hp / player.maxHp;
        const hpColor = hpRatio > 0.5 ? '#44ff44' : hpRatio > 0.25 ? '#ffaa00' : '#ff4444';
        ctx.fillStyle = hpColor;
        ctx.fillRect(hpX, hpY, hpBarW * hpRatio, hpBarH);
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHp}`, hpX + hpBarW / 2, hpY + 13);

        // XP条
        const xpBarW = 250;
        const xpBarH = 8;
        const xpY = hpY + hpBarH + 6;
        const nextXP = XP_TABLE[player.level] || (XP_TABLE[XP_TABLE.length - 1] + (player.level - XP_TABLE.length + 1) * 500);
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(hpX - 2, xpY - 2, xpBarW + 4, xpBarH + 4);
        ctx.fillStyle = '#222';
        ctx.fillRect(hpX, xpY, xpBarW, xpBarH);
        ctx.fillStyle = '#4488ff';
        ctx.fillRect(hpX, xpY, xpBarW * (player.xp / nextXP), xpBarH);

        // 等级
        ctx.font = 'bold 16px Arial';
        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'left';
        ctx.fillText(`Lv.${player.level}`, hpX, xpY + xpBarH + 18);

        // 时间
        const minutes = Math.floor(gameTime / 60);
        const seconds = Math.floor(gameTime % 60);
        ctx.font = 'bold 20px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, cw / 2, 35);

        // 敌人数量
        ctx.font = '14px Arial';
        ctx.fillStyle = '#ff8888';
        ctx.textAlign = 'right';
        ctx.fillText(`敌人: ${enemyCount}`, cw - 20, 30);

        // 击杀数
        if (this.gameOverStats) {
            ctx.fillText(`击杀: ${this.gameOverStats.kills}`, cw - 20, 50);
        }

        // 武器列表
        const weaponKeys = Object.keys(weaponSystem.weapons);
        const weaponStartX = 20;
        const weaponStartY = ch - 50;
        ctx.font = '12px Arial';
        for (let i = 0; i < weaponKeys.length; i++) {
            const id = weaponKeys[i];
            const level = weaponSystem.weapons[id];
            const cfg = WEAPONS[id];
            const x = weaponStartX + i * 40;
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(x, weaponStartY, 36, 36);
            ctx.strokeStyle = cfg.color;
            ctx.lineWidth = 1;
            ctx.strokeRect(x, weaponStartY, 36, 36);
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(cfg.icon, x + 18, weaponStartY + 22);
            ctx.font = 'bold 10px Arial';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(`${level}`, x + 18, weaponStartY + 34);
        }

        // 操作提示
        ctx.font = '12px Arial';
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.textAlign = 'right';
        ctx.fillText('WASD移动', cw - 20, ch - 20);

        ctx.restore();
    }

    _drawUpgradePanel(ctx, cw, ch) {
        // 半透明遮罩
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, cw, ch);

        // 标题
        ctx.font = 'bold 32px Arial';
        ctx.fillStyle = '#ffcc00';
        ctx.textAlign = 'center';
        ctx.fillText('选择升级', cw / 2, ch / 2 - 170);

        const cardW = 200;
        const cardH = 280;
        const gap = 30;
        const totalW = this.upgradeOptions.length * cardW + (this.upgradeOptions.length - 1) * gap;
        const startX = (cw - totalW) / 2;
        const startY = (ch - cardH) / 2;

        for (let i = 0; i < this.upgradeOptions.length; i++) {
            const opt = this.upgradeOptions[i];
            const cx = startX + i * (cardW + gap);

            // 卡片背景
            ctx.fillStyle = 'rgba(30,30,60,0.9)';
            ctx.strokeStyle = opt.color || '#ffcc00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx, startY, cardW, cardH, 12);
            ctx.fill();
            ctx.stroke();

            // 图标
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText(opt.icon, cx + cardW / 2, startY + 70);

            // 名称
            ctx.font = 'bold 18px Arial';
            ctx.fillStyle = opt.color || '#ffcc00';
            ctx.fillText(opt.name, cx + cardW / 2, startY + 120);

            // 类型标签
            ctx.font = '12px Arial';
            ctx.fillStyle = '#aaa';
            const typeLabel = opt.type === 'new_weapon' ? '新武器' :
                opt.type === 'upgrade_weapon' ? '武器升级' : '属性强化';
            ctx.fillText(typeLabel, cx + cardW / 2, startY + 145);

            // 描述
            ctx.font = '14px Arial';
            ctx.fillStyle = '#ccc';
            // 简单的换行
            const words = opt.desc;
            const lines = [];
            let line = '';
            for (const char of words) {
                line += char;
                if (line.length >= 10) {
                    lines.push(line);
                    line = '';
                }
            }
            if (line) lines.push(line);
            for (let j = 0; j < lines.length; j++) {
                ctx.fillText(lines[j], cx + cardW / 2, startY + 175 + j * 20);
            }

            // 快捷键提示
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#ffcc00';
            ctx.fillText(`[${i + 1}]`, cx + cardW / 2, startY + cardH - 20);
        }

        // 重随按钮
        if (this.rerollsAvailable > 0) {
            const rerollBtnX = cw / 2 - 60;
            const rerollBtnY = startY + cardH + 30;
            ctx.fillStyle = 'rgba(60,60,100,0.9)';
            ctx.strokeStyle = '#8888ff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(rerollBtnX, rerollBtnY, 120, 40, 8);
            ctx.fill();
            ctx.stroke();
            ctx.font = 'bold 16px Arial';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'center';
            ctx.fillText(`重随 (${this.rerollsAvailable})`, cw / 2, rerollBtnY + 27);
        }

        ctx.restore();
    }

    _drawGameOver(ctx, cw, ch) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, cw, ch);

        const stats = this.gameOverStats;
        ctx.font = 'bold 48px Arial';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', cw / 2, ch / 2 - 100);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#fff';
        const minutes = Math.floor(stats.time / 60);
        const seconds = Math.floor(stats.time % 60);
        ctx.fillText(`存活时间: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`, cw / 2, ch / 2 - 40);
        ctx.fillText(`击杀数: ${stats.kills}`, cw / 2, ch / 2 - 10);
        ctx.fillText(`达到等级: ${stats.level}`, cw / 2, ch / 2 + 20);

        // 重新开始按钮
        const btnX = cw / 2 - 100;
        const btnY = ch / 2 + 60;
        ctx.fillStyle = 'rgba(40,80,40,0.9)';
        ctx.strokeStyle = '#44ff44';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, 200, 50, 10);
        ctx.fill();
        ctx.stroke();
        ctx.font = 'bold 22px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('重新开始', cw / 2, btnY + 34);

        ctx.restore();
    }

    _drawStartScreen(ctx, cw, ch) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, cw, ch);

        ctx.font = 'bold 56px Arial';
        ctx.fillStyle = '#ff4400';
        ctx.textAlign = 'center';
        ctx.fillText('弹幕天堂', cw / 2, ch / 2 - 100);

        ctx.font = '20px Arial';
        ctx.fillStyle = '#aaa';
        ctx.fillText('类吸血鬼幸存者弹幕生存游戏', cw / 2, ch / 2 - 60);
        ctx.fillText('WASD移动 | 武器自动攻击', cw / 2, ch / 2 - 30);

        // 开始按钮
        const btnX = cw / 2 - 120;
        const btnY = ch / 2 + 20;
        ctx.fillStyle = 'rgba(80,20,20,0.9)';
        ctx.strokeStyle = '#ff4400';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(btnX, btnY, 240, 60, 12);
        ctx.fill();
        ctx.stroke();
        ctx.font = 'bold 28px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText('开始游戏', cw / 2, btnY + 42);

        ctx.font = '14px Arial';
        ctx.fillStyle = '#666';
        ctx.fillText('点击按钮或按任意键开始', cw / 2, ch / 2 + 120);

        ctx.restore();
    }
}
