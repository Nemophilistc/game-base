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

        ctx.fillStyle = '#00ff96';
        ctx.beginPath();
        ctx.moveTo(this.x, H - 40);
        ctx.lineTo(this.x - this.w / 2, H - 50);
        ctx.lineTo(this.x - this.w / 4, H - 50);
        ctx.lineTo(this.x - this.w / 4, H - 55);
        ctx.lineTo(this.x + this.w / 4, H - 55);
        ctx.lineTo(this.x + this.w / 4, H - 50);
        ctx.lineTo(this.x + this.w / 2, H - 50);
        ctx.closePath();
        ctx.fill();

        ctx.globalAlpha = 1;

        if (shield > 0) {
            ctx.strokeStyle = 'rgba(0,200,255,0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, H - 48, 28, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}
