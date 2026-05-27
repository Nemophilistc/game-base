// ============================================
// MetalSlug UI系统
// ============================================

import { CANVAS_WIDTH, CANVAS_HEIGHT, WEAPONS } from './config.js';

export class UI {
    constructor(ctx) {
        this.ctx = ctx;
        this.messages = [];
        this.fadeTimer = 0;
        this.screenShake = 0;
        this.screenShakeDecay = 0.9;
    }

    addMessage(text, duration = 120, color = '#FFD700', size = 24) {
        this.messages.push({
            text,
            timer: duration,
            maxTimer: duration,
            color,
            size
        });
    }

    shake(intensity = 5) {
        this.screenShake = intensity;
    }

    update() {
        // 更新消息
        for (let i = this.messages.length - 1; i >= 0; i--) {
            this.messages[i].timer--;
            if (this.messages[i].timer <= 0) {
                this.messages.splice(i, 1);
            }
        }

        // 更新屏幕震动
        if (this.screenShake > 0.1) {
            this.screenShake *= this.screenShakeDecay;
        } else {
            this.screenShake = 0;
        }
    }

    getShakeOffset() {
        if (this.screenShake > 0.1) {
            return {
                x: (Math.random() - 0.5) * this.screenShake * 2,
                y: (Math.random() - 0.5) * this.screenShake * 2
            };
        }
        return { x: 0, y: 0 };
    }

    drawHUD(player, weaponSystem, level, score) {
        const ctx = this.ctx;

        // 生命条
        this.drawPlayerHP(ctx, player);

        // 武器信息
        this.drawWeaponInfo(ctx, weaponSystem);

        // 手雷数量
        this.drawGrenades(ctx, player);

        // 分数
        this.drawScore(ctx, score);

        // 关卡名称
        this.drawLevelName(ctx, level);

        // 载具状态
        if (player.inVehicle) {
            this.drawVehicleStatus(ctx, player);
        }
    }

    drawPlayerHP(ctx, player) {
        const x = 20;
        const y = 20;
        const width = 200;
        const height = 20;

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - 5, y - 5, width + 10, height + 30);

        // 标签
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('生命值', x, y + 12);

        // 血条背景
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y + 18, width, height);

        // 血条
        const hpRatio = player.hp / player.maxHP;
        const gradient = ctx.createLinearGradient(x, y + 18, x + width * hpRatio, y + 18);
        if (hpRatio > 0.6) {
            gradient.addColorStop(0, '#00CC00');
            gradient.addColorStop(1, '#00FF00');
        } else if (hpRatio > 0.3) {
            gradient.addColorStop(0, '#CC8800');
            gradient.addColorStop(1, '#FFAA00');
        } else {
            gradient.addColorStop(0, '#CC0000');
            gradient.addColorStop(1, '#FF2222');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y + 18, width * hpRatio, height);

        // 边框
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y + 18, width, height);

        // 数值
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.ceil(player.hp)} / ${player.maxHP}`, x + width / 2, y + 32);
    }

    drawWeaponInfo(ctx, weaponSystem) {
        const x = 20;
        const y = 70;
        const weapon = weaponSystem.getCurrentWeapon();

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - 5, y - 5, 180, 50);

        // 武器名称
        ctx.fillStyle = weapon.color;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(weapon.name, x, y + 15);

        // 弹药数量
        ctx.fillStyle = '#FFF';
        ctx.font = '14px Arial';
        const ammoText = weapon.currentAmmo === Infinity ? '∞' : weapon.currentAmmo;
        ctx.fillText(`弹药: ${ammoText}`, x, y + 35);

        // 武器图标（小方块）
        ctx.fillStyle = weapon.color;
        ctx.fillRect(x + 140, y + 5, 25, 15);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 140, y + 5, 25, 15);
    }

    drawGrenades(ctx, player) {
        const x = 20;
        const y = 130;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - 5, y - 5, 120, 30);

        ctx.fillStyle = '#2E8B57';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`手雷: ${player.grenades}`, x, y + 15);
    }

    drawScore(ctx, score) {
        const x = CANVAS_WIDTH - 20;
        const y = 25;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - 120, y - 15, 130, 30);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`分数: ${score}`, x, y + 8);
    }

    drawLevelName(ctx, level) {
        const x = CANVAS_WIDTH / 2;
        const y = 25;

        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x - 80, y - 15, 160, 25);

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(level.name, x, y + 3);
    }

    drawVehicleStatus(ctx, player) {
        const x = 240;
        const y = 20;
        const width = 150;
        const height = 16;

        ctx.fillStyle = 'rgba(0,0,0,0.6)';
        ctx.fillRect(x - 5, y - 5, width + 10, height + 25);

        ctx.fillStyle = '#556B2F';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('载具装甲', x, y + 10);

        ctx.fillStyle = '#333';
        ctx.fillRect(x, y + 14, width, height);

        const ratio = player.vehicleHP / player.vehicleMaxHP;
        ctx.fillStyle = ratio > 0.5 ? '#556B2F' : ratio > 0.25 ? '#8B8B00' : '#8B0000';
        ctx.fillRect(x, y + 14, width * ratio, height);

        ctx.strokeStyle = '#888';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y + 14, width, height);
    }

    drawMessages() {
        const ctx = this.ctx;
        const centerX = CANVAS_WIDTH / 2;
        let y = CANVAS_HEIGHT / 2 - 50;

        for (const msg of this.messages) {
            const alpha = msg.timer / msg.maxTimer;
            const scale = 1 + (1 - alpha) * 0.3;

            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(centerX, y);
            ctx.scale(scale, scale);

            // 文字阴影
            ctx.fillStyle = '#000';
            ctx.font = `bold ${msg.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(msg.text, 2, 2);

            // 文字
            ctx.fillStyle = msg.color;
            ctx.fillText(msg.text, 0, 0);

            ctx.restore();

            y += msg.size + 10;
        }
    }

    drawStartScreen() {
        const ctx = this.ctx;

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // 标题
        ctx.fillStyle = '#FF4444';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('合金弹头', CANVAS_WIDTH / 2, 200);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText('METAL SLUG', CANVAS_WIDTH / 2, 250);

        // 副标题
        ctx.fillStyle = '#AAA';
        ctx.font = '18px Arial';
        ctx.fillText('横版射击游戏', CANVAS_WIDTH / 2, 290);

        // 操作说明
        const startY = 360;
        ctx.fillStyle = '#FFF';
        ctx.font = '16px Arial';

        const controls = [
            'W / ↑ - 跳跃',
            'A D / ← → - 左右移动',
            'S / ↓ - 蹲下',
            '鼠标左键 - 射击',
            '空格键 - 投掷手雷',
            '1-5 - 切换武器',
            'R - 进入载具',
            'M - 静音/开启音效'
        ];

        for (let i = 0; i < controls.length; i++) {
            ctx.fillText(controls[i], CANVAS_WIDTH / 2, startY + i * 28);
        }

        // 开始提示
        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 24px Arial';
            ctx.fillText('点击任意位置开始游戏', CANVAS_WIDTH / 2, 630);
        }
    }

    drawPauseScreen() {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('游戏暂停', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

        ctx.fillStyle = '#FFF';
        ctx.font = '20px Arial';
        ctx.fillText('按 P 继续', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30);
    }

    drawGameOverScreen(score) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FF0000';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('任务失败', CANVAS_WIDTH / 2, 250);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 28px Arial';
        ctx.fillText(`最终分数: ${score}`, CANVAS_WIDTH / 2, 330);

        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.fillStyle = '#FFF';
            ctx.font = '22px Arial';
            ctx.fillText('点击重新开始', CANVAS_WIDTH / 2, 420);
        }
    }

    drawLevelCompleteScreen(levelName, score) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#00FF00';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('任务完成!', CANVAS_WIDTH / 2, 230);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`${levelName} - 已通关`, CANVAS_WIDTH / 2, 290);

        ctx.fillStyle = '#FFF';
        ctx.font = '22px Arial';
        ctx.fillText(`分数: ${score}`, CANVAS_WIDTH / 2, 340);

        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.fillText('点击进入下一关', CANVAS_WIDTH / 2, 420);
        }
    }

    drawVictoryScreen(score) {
        const ctx = this.ctx;

        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('恭喜通关!', CANVAS_WIDTH / 2, 200);

        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('你成功完成了所有任务!', CANVAS_WIDTH / 2, 270);

        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(`最终分数: ${score}`, CANVAS_WIDTH / 2, 350);

        ctx.fillStyle = '#AAA';
        ctx.font = '18px Arial';
        ctx.fillText('感谢游玩 合金弹头', CANVAS_WIDTH / 2, 420);

        const blink = Math.sin(Date.now() * 0.005) > 0;
        if (blink) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '20px Arial';
            ctx.fillText('点击重新开始', CANVAS_WIDTH / 2, 500);
        }
    }

    drawCrosshair(mouseX, mouseY) {
        const ctx = this.ctx;
        const size = 15;

        ctx.strokeStyle = '#FF0000';
        ctx.lineWidth = 2;

        // 十字准心
        ctx.beginPath();
        ctx.moveTo(mouseX - size, mouseY);
        ctx.lineTo(mouseX - size / 3, mouseY);
        ctx.moveTo(mouseX + size / 3, mouseY);
        ctx.lineTo(mouseX + size, mouseY);
        ctx.moveTo(mouseX, mouseY - size);
        ctx.lineTo(mouseX, mouseY - size / 3);
        ctx.moveTo(mouseX, mouseY + size / 3);
        ctx.lineTo(mouseX, mouseY + size);
        ctx.stroke();

        // 中心点
        ctx.fillStyle = '#FF0000';
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 2, 0, Math.PI * 2);
        ctx.fill();
    }

    clear() {
        this.messages = [];
        this.screenShake = 0;
    }
}
