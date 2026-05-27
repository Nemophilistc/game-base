// ============================================================
// ui.js - HUD display and overlay screens
// ============================================================

import { UI, PLANE } from './config.js';

export class UIOverlay {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.messages = [];
        this.screenShake = 0;
    }

    showMessage(text, duration = 120, color = '#ffffff') {
        this.messages.push({ text, timer: duration, maxTimer: duration, color });
    }

    triggerShake(intensity = 8) {
        this.screenShake = intensity;
    }

    getShakeOffset() {
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.5) this.screenShake = 0;
            return {
                x: (Math.random() - 0.5) * this.screenShake * 2,
                y: (Math.random() - 0.5) * this.screenShake * 2,
            };
        }
        return { x: 0, y: 0 };
    }

    update() {
        this.messages = this.messages.filter(m => {
            m.timer--;
            return m.timer > 0;
        });
    }

    drawHUD(ctx, plane, score, distance) {
        ctx.save();

        // HUD background bar
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, this.canvasWidth, 60);

        const fontBase = `bold 16px ${UI.FONT_FAMILY}`;
        const fontSmall = `13px ${UI.FONT_FAMILY}`;

        // Fuel gauge
        const fuelX = 20;
        const fuelY = 15;
        const fuelW = 160;
        const fuelH = 14;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(fuelX, fuelY, fuelW, fuelH);
        const fuelColor = plane.fuel > 30 ? UI.FUEL_COLOR :
                         plane.fuel > 15 ? UI.FUEL_LOW_COLOR : UI.WARNING_COLOR;
        ctx.fillStyle = fuelColor;
        ctx.fillRect(fuelX, fuelY, fuelW * (plane.fuel / 100), fuelH);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.strokeRect(fuelX, fuelY, fuelW, fuelH);

        ctx.fillStyle = UI.HUD_COLOR;
        ctx.font = fontBase;
        ctx.textAlign = 'left';
        ctx.fillText(`燃料: ${Math.ceil(plane.fuel)}%`, fuelX, fuelY + fuelH + 16);

        // Low fuel warning
        if (plane.fuel < 20 && Math.floor(Date.now() / 300) % 2 === 0) {
            ctx.fillStyle = UI.WARNING_COLOR;
            ctx.font = `bold 18px ${UI.FONT_FAMILY}`;
            ctx.fillText('! 燃料不足 !', fuelX + fuelW + 20, fuelY + 12);
        }

        // Speed indicator
        const speedX = 220;
        ctx.fillStyle = UI.HUD_COLOR;
        ctx.font = fontBase;
        ctx.fillText(`速度: ${plane.speed.toFixed(1)}`, speedX, 28);

        // Altitude
        const altX = 380;
        const altitude = Math.max(0, Math.floor((this.canvasHeight * 0.75 - plane.y) / 3));
        ctx.fillText(`高度: ${altitude}m`, altX, 28);

        // Thrust / Boost / Shield status
        const statusX = this.canvasWidth - 250;
        ctx.font = fontSmall;

        // Thrust bar
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.fillRect(statusX, 10, 100, 8);
        ctx.fillStyle = '#ff8800';
        ctx.fillRect(statusX, 10, 100 * plane.thrust, 8);
        ctx.fillStyle = UI.HUD_COLOR;
        ctx.fillText('推力', statusX, 30);

        // Status icons
        let iconX = statusX + 80;
        if (plane.boosted) {
            ctx.fillStyle = UI.BOOST_COLOR;
            ctx.fillText('加速', iconX, 30);
            iconX += 50;
        }
        if (plane.shielded) {
            ctx.fillStyle = UI.SHIELD_COLOR;
            ctx.fillText('护盾', iconX, 30);
            iconX += 50;
        }
        if (plane.stalling) {
            ctx.fillStyle = UI.WARNING_COLOR;
            ctx.font = `bold 16px ${UI.FONT_FAMILY}`;
            ctx.fillText('失速!', iconX, 30);
        }

        // Score and distance (right side)
        ctx.textAlign = 'right';
        ctx.font = `bold 20px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = '#ffdd00';
        ctx.fillText(`${Math.floor(score)}`, this.canvasWidth - 20, 25);
        ctx.font = fontSmall;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText(`距离: ${Math.floor(distance)}m`, this.canvasWidth - 20, 48);

        // Bottom bar - controls hint
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, this.canvasHeight - 35, this.canvasWidth, 35);
        ctx.textAlign = 'center';
        ctx.font = `12px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fillText('W/↑拉起  S/↓俯冲  A/D微调  Shift加速  空格射击  M静音  P暂停', this.canvasWidth / 2, this.canvasHeight - 12);

        ctx.restore();
    }

    drawMessages(ctx) {
        ctx.save();
        this.messages.forEach(m => {
            const alpha = Math.min(1, m.timer / 30);
            const y = this.canvasHeight * 0.3 + (m.maxTimer - m.timer) * 0.5;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = m.color;
            ctx.font = `bold 28px ${UI.FONT_FAMILY}`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 6;
            ctx.fillText(m.text, this.canvasWidth / 2, y);
            ctx.shadowBlur = 0;
        });
        ctx.restore();
    }

    drawStartScreen(ctx) {
        ctx.save();
        // Overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        // Title
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 52px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#4488ff';
        ctx.shadowBlur = 20;
        ctx.fillText('模拟飞行', this.canvasWidth / 2, this.canvasHeight * 0.3);
        ctx.shadowBlur = 0;

        ctx.font = `22px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('Flight Simulator', this.canvasWidth / 2, this.canvasHeight * 0.3 + 40);

        // Instructions
        const instructions = [
            'W / ↑ — 拉起机头',
            'S / ↓ — 俯冲',
            'A / D / ← → — 微调方向',
            'Shift — 加速推进',
            '空格 — 发射攻击',
            'M — 静音 / P — 暂停',
        ];
        ctx.font = `18px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        instructions.forEach((line, i) => {
            ctx.fillText(line, this.canvasWidth / 2, this.canvasHeight * 0.48 + i * 30);
        });

        // Collect info
        ctx.font = `16px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = '#ffdd00';
        ctx.fillText('收集星星得分，燃料桶补充燃料，闪电加速，护盾保护', this.canvasWidth / 2, this.canvasHeight * 0.78);
        ctx.fillStyle = '#ff6666';
        ctx.fillText('躲避气球、鸟群、山脉和雷暴云！', this.canvasWidth / 2, this.canvasHeight * 0.78 + 28);

        // Start prompt
        const blink = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.globalAlpha = blink;
        ctx.fillStyle = '#44aaff';
        ctx.font = `bold 26px ${UI.FONT_FAMILY}`;
        ctx.fillText('按任意键开始', this.canvasWidth / 2, this.canvasHeight * 0.92);
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    drawPauseScreen(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.fillStyle = '#ffffff';
        ctx.font = `bold 42px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.fillText('暂停', this.canvasWidth / 2, this.canvasHeight / 2 - 20);

        ctx.font = `20px ${UI.FONT_FAMILY}`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('按 P 继续', this.canvasWidth / 2, this.canvasHeight / 2 + 25);

        ctx.restore();
    }

    drawGameOver(ctx, score, distance) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

        ctx.fillStyle = '#ff4444';
        ctx.font = `bold 48px ${UI.FONT_FAMILY}`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff0000';
        ctx.shadowBlur = 15;
        ctx.fillText('坠毁!', this.canvasWidth / 2, this.canvasHeight * 0.3);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#ffffff';
        ctx.font = `24px ${UI.FONT_FAMILY}`;
        ctx.fillText(`最终得分: ${Math.floor(score)}`, this.canvasWidth / 2, this.canvasHeight * 0.45);
        ctx.fillText(`飞行距离: ${Math.floor(distance)}m`, this.canvasWidth / 2, this.canvasHeight * 0.52);

        // Rating
        let rating = '新手飞行员';
        if (score > 5000) rating = '王牌飞行员';
        else if (score > 3000) rating = '资深机长';
        else if (score > 1500) rating = '副驾驶';
        else if (score > 500) rating = '学员飞行员';

        ctx.fillStyle = '#ffdd00';
        ctx.font = `bold 22px ${UI.FONT_FAMILY}`;
        ctx.fillText(`评级: ${rating}`, this.canvasWidth / 2, this.canvasHeight * 0.62);

        const blink = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.globalAlpha = blink;
        ctx.fillStyle = '#44aaff';
        ctx.font = `bold 24px ${UI.FONT_FAMILY}`;
        ctx.fillText('按 R 重新开始', this.canvasWidth / 2, this.canvasHeight * 0.78);
        ctx.globalAlpha = 1;

        ctx.restore();
    }

    drawMinimap(ctx, plane, mountains, obstacles, collectibles, cameraX) {
        const mw = 150;
        const mh = 50;
        const mx = this.canvasWidth - mw - 15;
        const my = 70;
        const scaleX = mw / 3000;

        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(mx, my, mw, mh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.strokeRect(mx, my, mw, mh);

        // Plane dot
        ctx.fillStyle = '#44ff44';
        ctx.beginPath();
        ctx.arc(mx + plane.x * scaleX, my + mh * 0.5, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Camera view
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(mx + cameraX * scaleX, my, (this.canvasWidth / 3000) * mw * 3, mh);

        ctx.restore();
    }
}
