// ui.js - HUD, menus, level select
import { W, H, WORLDS, ST } from './config.js';
import { Sound } from './sound.js';
import { getLevelName, getTotalLevels } from './level.js';

export class UI {
    constructor() {
        this.selectedWorld = 0;
        this.selectedLevel = 0;
        this.menuAnim = 0;
        this.scrollY = 0;
        this.starRating = {}; // { "0-0": 2, "0-1": 3, ... }
        this.completedLevels = new Set();
        this.unlockedLevels = new Set([0]); // Level 0 always unlocked
        this.loadProgress();
    }

    loadProgress() {
        try {
            const d = JSON.parse(localStorage.getItem('platformer_save') || '{}');
            this.starRating = d.stars || {};
            this.completedLevels = new Set(d.completed || [0]);
            this.unlockedLevels = new Set(d.unlocked || [0]);
        } catch { }
    }

    saveProgress() {
        try {
            localStorage.setItem('platformer_save', JSON.stringify({
                stars: this.starRating,
                completed: [...this.completedLevels],
                unlocked: [...this.unlockedLevels],
            }));
        } catch { }
    }

    completeLevel(worldIdx, levelIdx, stars) {
        const key = `${worldIdx}-${levelIdx}`;
        const prev = this.starRating[key] || 0;
        if (stars > prev) this.starRating[key] = stars;
        this.completedLevels.add(key);
        const nextKey = worldIdx * 5 + levelIdx + 1;
        if (nextKey < getTotalLevels()) this.unlockedLevels.add(nextKey);
        this.saveProgress();
    }

    isLevelUnlocked(worldIdx, levelIdx) {
        return this.unlockedLevels.has(worldIdx * 5 + levelIdx);
    }

    getStarRating(worldIdx, levelIdx) {
        return this.starRating[`${worldIdx}-${levelIdx}`] || 0;
    }

    drawMenu(ctx) {
        this.menuAnim++;
        // Background
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#1a1a2e');
        grad.addColorStop(1, '#16213e');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Decorative particles
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        for (let i = 0; i < 30; i++) {
            const px = (i * 73 + this.menuAnim * 0.5) % W;
            const py = (i * 47 + this.menuAnim * 0.3) % H;
            ctx.beginPath(); ctx.arc(px, py, 2 + (i % 3), 0, Math.PI * 2); ctx.fill();
        }

        // Title
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 56px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('横版大冒险', W / 2, 160);

        ctx.font = '20px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#AAA';
        ctx.fillText('20个关卡 · 4个世界 · 无限乐趣', W / 2, 200);

        // Buttons
        this._drawBtn(ctx, W / 2, 300, 220, 50, '开始游戏', '#4CAF50', '#66BB6A');
        this._drawBtn(ctx, W / 2, 370, 220, 50, '关卡选择', '#2196F3', '#42A5F5');

        // Controls info
        ctx.font = '14px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#888';
        ctx.fillText('操作: WASD/方向键移动跳跃 | Shift冲刺 | 空格跳跃', W / 2, 480);
        ctx.fillText('墙壁跳: 靠近墙壁时按跳跃键 | 蹲下: 按下键', W / 2, 505);

        ctx.textAlign = 'left';
    }

    drawLevelSelect(ctx, progress) {
        this.menuAnim++;
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, '#0f0c29');
        grad.addColorStop(1, '#302b63');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Title
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('关卡选择', W / 2, 50);

        // World tabs
        for (let i = 0; i < 4; i++) {
            const tx = 120 + i * 155;
            const selected = i === this.selectedWorld;
            ctx.fillStyle = selected ? WORLDS[i].tile.top : '#333';
            ctx.beginPath(); ctx.roundRect(tx - 60, 70, 120, 36, 8); ctx.fill();
            ctx.fillStyle = selected ? '#FFF' : '#AAA';
            ctx.font = '16px "Microsoft YaHei", sans-serif';
            ctx.fillText(WORLDS[i].name, tx, 94);
        }

        // Level grid
        const wy = 130;
        for (let i = 0; i < 5; i++) {
            const lx = 120 + i * 130;
            const ly = wy + 80;
            const key = this.selectedWorld * 5 + i;
            const unlocked = this.unlockedLevels.has(key);
            const completed = this.completedLevels.has(`${this.selectedWorld}-${i}`);
            const stars = this.getStarRating(this.selectedWorld, i);

            // Card background
            ctx.fillStyle = unlocked ? (completed ? 'rgba(76,175,80,0.3)' : 'rgba(255,255,255,0.1)') : 'rgba(0,0,0,0.3)';
            ctx.beginPath(); ctx.roundRect(lx - 45, ly - 30, 90, 100, 10); ctx.fill();
            ctx.strokeStyle = unlocked ? (completed ? '#4CAF50' : '#555') : '#333';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Level number
            ctx.fillStyle = unlocked ? '#FFF' : '#555';
            ctx.font = 'bold 28px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}`, lx, ly + 10);

            // Stars
            for (let s = 0; s < 3; s++) {
                ctx.fillStyle = s < stars ? '#FFD700' : '#444';
                ctx.font = '18px sans-serif';
                ctx.fillText('★', lx - 20 + s * 20, ly + 45);
            }

            // Lock icon
            if (!unlocked) {
                ctx.fillStyle = '#666';
                ctx.font = '24px sans-serif';
                ctx.fillText('🔒', lx, ly + 10);
            }
        }

        // Back button
        this._drawBtn(ctx, W / 2, H - 50, 160, 40, '返回', '#F44336', '#EF5350');

        ctx.textAlign = 'left';
    }

    drawHUD(ctx, player, level) {
        // Health
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(10, 10, 180, 36, 8); ctx.fill();
        for (let i = 0; i < player.maxHealth; i++) {
            ctx.fillStyle = i < player.health ? '#FF4444' : '#444';
            ctx.font = '22px sans-serif';
            ctx.fillText('♥', 20 + i * 28, 34);
        }

        // Coins
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(10, 52, 100, 28, 8); ctx.fill();
        ctx.fillStyle = '#FFD700';
        ctx.font = '18px sans-serif';
        ctx.fillText(`● ${player.coins}`, 20, 72);

        // Stars
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath(); ctx.roundRect(120, 52, 90, 28, 8); ctx.fill();
        ctx.font = '16px sans-serif';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = player.stars[i] ? '#FFD700' : '#444';
            ctx.fillText('★', 130 + i * 24, 72);
        }

        // Keys
        if (player.keys > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.roundRect(220, 52, 60, 28, 8); ctx.fill();
            ctx.fillStyle = '#FFD700';
            ctx.font = '16px sans-serif';
            ctx.fillText(`🗝 ${player.keys}`, 230, 72);
        }

        // Dash cooldown
        if (player.dashCooldown > 0) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath(); ctx.roundRect(W - 160, 10, 150, 24, 8); ctx.fill();
            const pct = 1 - player.dashCooldown / 120;
            ctx.fillStyle = '#88DDFF';
            ctx.fillRect(W - 155, 14, 140 * pct, 16);
            ctx.fillStyle = '#FFF';
            ctx.font = '12px "Microsoft YaHei", sans-serif';
            ctx.fillText('冲刺', W - 80, 26);
        }

        // Level name
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.font = '14px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(getLevelName(level.worldIdx, level.levelIdx), W - 15, H - 10);
        ctx.textAlign = 'left';
    }

    drawPause(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 40px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('暂停', W / 2, H / 2 - 40);
        ctx.font = '20px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#AAA';
        ctx.fillText('按 ESC 继续', W / 2, H / 2 + 10);
        this._drawBtn(ctx, W / 2, H / 2 + 60, 180, 44, '返回菜单', '#F44336', '#EF5350');
        ctx.textAlign = 'left';
    }

    drawLevelComplete(ctx, stars, coins) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 40px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('关卡完成!', W / 2, H / 2 - 80);

        // Stars
        ctx.font = '40px sans-serif';
        for (let i = 0; i < 3; i++) {
            ctx.fillStyle = i < stars ? '#FFD700' : '#444';
            ctx.fillText('★', W / 2 - 60 + i * 60, H / 2 - 20);
        }

        ctx.fillStyle = '#FFD700';
        ctx.font = '22px "Microsoft YaHei", sans-serif';
        ctx.fillText(`金币: ${coins}`, W / 2, H / 2 + 30);

        this._drawBtn(ctx, W / 2, H / 2 + 80, 180, 44, '下一关', '#4CAF50', '#66BB6A');
        this._drawBtn(ctx, W / 2, H / 2 + 135, 180, 44, '返回菜单', '#2196F3', '#42A5F5');
        ctx.textAlign = 'left';
    }

    drawGameOver(ctx) {
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 44px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('游戏结束', W / 2, H / 2 - 40);
        this._drawBtn(ctx, W / 2, H / 2 + 20, 180, 44, '重试', '#FF9800', '#FFA726');
        this._drawBtn(ctx, W / 2, H / 2 + 80, 180, 44, '返回菜单', '#F44336', '#EF5350');
        ctx.textAlign = 'left';
    }

    _drawBtn(ctx, x, y, w, h, text, color, hoverColor) {
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 10); ctx.fill();
        ctx.fillStyle = '#FFF';
        ctx.font = '18px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(text, x, y + 6);
        ctx.textAlign = 'left';
    }

    getButtonAt(state, mx, my) {
        if (state === ST.MENU) {
            if (this._inBtn(W / 2, 300, 220, 50, mx, my)) return 'play';
            if (this._inBtn(W / 2, 370, 220, 50, mx, my)) return 'select';
        } else if (state === ST.SELECT) {
            for (let i = 0; i < 4; i++) {
                if (this._inBtn(120 + i * 155, 88, 120, 36, mx, my)) return `world_${i}`;
            }
            for (let i = 0; i < 5; i++) {
                if (this._inBtn(120 + i * 130, 190, 90, 100, mx, my)) return `level_${this.selectedWorld}_${i}`;
            }
            if (this._inBtn(W / 2, H - 50, 160, 40, mx, my)) return 'back';
        } else if (state === ST.PAUSE) {
            if (this._inBtn(W / 2, H / 2 + 60, 180, 44, mx, my)) return 'menu';
        } else if (state === ST.WIN) {
            if (this._inBtn(W / 2, H / 2 + 80, 180, 44, mx, my)) return 'next';
            if (this._inBtn(W / 2, H / 2 + 135, 180, 44, mx, my)) return 'menu';
        } else if (state === ST.DEAD) {
            if (this._inBtn(W / 2, H / 2 + 20, 180, 44, mx, my)) return 'retry';
            if (this._inBtn(W / 2, H / 2 + 80, 180, 44, mx, my)) return 'menu';
        }
        return null;
    }

    _inBtn(x, y, w, h, mx, my) {
        return mx >= x - w / 2 && mx <= x + w / 2 && my >= y - h / 2 && my <= y + h / 2;
    }
}
