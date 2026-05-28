// 玩家飞船
import { W, H, PLAYER_W, PLAYER_SPEED, PLAYER_Y_BASE, BULLET_SPEED, TRIPLE_SIDE_VX, TRIPLE_SIDE_VY, RAPID_COOLDOWN, NORMAL_COOLDOWN, INVINCIBLE_FRAMES } from './config.js';
import { Sound } from './sound.js';

export class Player {
    constructor() {
        this.x = W / 2;
        this.w = PLAYER_W;
        this.speed = PLAYER_SPEED;
        this.shootCooldown = 0;
        this.invincibleTimer = 0; // Bug#4: 无敌帧计时器
    }

    reset() {
        this.x = W / 2;
        this.shootCooldown = 0;
        this.invincibleTimer = 0;
    }

    // 是否处于无敌状态
    isInvincible() {
        return this.invincibleTimer > 0;
    }

    // 进入无敌状态
    startInvincible() {
        this.invincibleTimer = INVINCIBLE_FRAMES;
    }

    update(keys) {
        if (keys['ArrowLeft'] || keys['KeyA']) this.x -= this.speed;
        if (keys['ArrowRight'] || keys['KeyD']) this.x += this.speed;
        this.x = Math.max(this.w / 2, Math.min(W - this.w / 2, this.x));

        if (this.shootCooldown > 0) this.shootCooldown--;
        if (this.invincibleTimer > 0) this.invincibleTimer--;
    }

    shoot(bullets, triple, rapid) {
        if (this.shootCooldown > 0) return;
        this.shootCooldown = rapid > 0 ? RAPID_COOLDOWN : NORMAL_COOLDOWN;
        Sound.play('shoot');

        if (triple > 0) {
            bullets.push({ x: this.x, y: PLAYER_Y_BASE, vx: 0, vy: -BULLET_SPEED });
            bullets.push({ x: this.x - 15, y: PLAYER_Y_BASE, vx: -TRIPLE_SIDE_VX, vy: TRIPLE_SIDE_VY });
            bullets.push({ x: this.x + 15, y: PLAYER_Y_BASE, vx: TRIPLE_SIDE_VX, vy: TRIPLE_SIDE_VY });
        } else {
            bullets.push({ x: this.x, y: PLAYER_Y_BASE, vx: 0, vy: -BULLET_SPEED });
        }
    }

    draw(ctx, shield, triple) {
        // 无敌时闪烁效果
        if (this.isInvincible() && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        const cx = this.x;
        const baseY = H - 50;
        const hw = this.w / 2;

        // 引擎火焰
        const flicker = Math.random() * 6;
        ctx.fillStyle = '#ff6b35';
        ctx.beginPath();
        ctx.moveTo(cx - 8, baseY + 6);
        ctx.lineTo(cx, baseY + 18 + flicker);
        ctx.lineTo(cx + 8, baseY + 6);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffff00';
        ctx.beginPath();
        ctx.moveTo(cx - 4, baseY + 6);
        ctx.lineTo(cx, baseY + 12 + flicker * 0.6);
        ctx.lineTo(cx + 4, baseY + 6);
        ctx.closePath();
        ctx.fill();

        // 主机身（深蓝渐变）
        const bodyGrad = ctx.createLinearGradient(cx - hw, baseY, cx + hw, baseY);
        bodyGrad.addColorStop(0, '#1565c0');
        bodyGrad.addColorStop(0.5, '#42a5f5');
        bodyGrad.addColorStop(1, '#1565c0');
        ctx.fillStyle = bodyGrad;
        ctx.beginPath();
        ctx.moveTo(cx, baseY - 18);
        ctx.lineTo(cx - hw, baseY + 6);
        ctx.lineTo(cx - hw * 0.6, baseY + 6);
        ctx.lineTo(cx - hw * 0.3, baseY + 2);
        ctx.lineTo(cx + hw * 0.3, baseY + 2);
        ctx.lineTo(cx + hw * 0.6, baseY + 6);
        ctx.lineTo(cx + hw, baseY + 6);
        ctx.closePath();
        ctx.fill();

        // 左翼
        ctx.fillStyle = '#0d47a1';
        ctx.beginPath();
        ctx.moveTo(cx - hw * 0.5, baseY - 2);
        ctx.lineTo(cx - hw - 6, baseY + 8);
        ctx.lineTo(cx - hw * 0.6, baseY + 6);
        ctx.closePath();
        ctx.fill();
        // 右翼
        ctx.beginPath();
        ctx.moveTo(cx + hw * 0.5, baseY - 2);
        ctx.lineTo(cx + hw + 6, baseY + 8);
        ctx.lineTo(cx + hw * 0.6, baseY + 6);
        ctx.closePath();
        ctx.fill();

        // 驾驶舱
        ctx.fillStyle = '#90caf9';
        ctx.beginPath();
        ctx.ellipse(cx, baseY - 6, 5, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#e3f2fd';
        ctx.beginPath();
        ctx.ellipse(cx - 1, baseY - 8, 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 翼尖灯
        ctx.fillStyle = '#00e5ff';
        ctx.beginPath(); ctx.arc(cx - hw - 4, baseY + 7, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + hw + 4, baseY + 7, 2, 0, Math.PI * 2); ctx.fill();

        ctx.globalAlpha = 1;

        // 护盾
        if (shield > 0) {
            ctx.strokeStyle = 'rgba(0,200,255,0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(cx, baseY - 4, 30, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = 'rgba(0,200,255,0.08)';
            ctx.fill();
        }
    }
}
