// 道具系统（护盾/三叉弹/速射/回血）
import { H, POWERUP_FALL_SPEED, TRIPLE_DURATION, RAPID_DURATION, MAX_SHIELD, MAX_LIVES } from './config.js';
import { Sound } from './sound.js';

const ICONS = { shield: '🛡', triple: '⚡', rapid: '🔥', heal: '❤️' };

export class ItemManager {
    constructor() {
        this.powerups = [];
        this.shield = 0;
        this.triple = 0;
        this.rapid = 0;
    }

    reset() {
        this.powerups = [];
        this.shield = 0;
        this.triple = 0;
        this.rapid = 0;
    }

    spawn(x, y, type) {
        this.powerups.push({ x, y, type, vy: POWERUP_FALL_SPEED });
    }

    // 检查玩家是否拾取道具，返回 {picked, shield, triple, rapid}
    checkPickup(playerX, playerW) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            if (p.y >= H - 50 && p.x > playerX - playerW / 2 && p.x < playerX + playerW / 2) {
                switch (p.type) {
                    case 'shield':
                        this.shield = Math.min(MAX_SHIELD, this.shield + 1);
                        break;
                    case 'triple':
                        this.triple = TRIPLE_DURATION;
                        break;
                    case 'rapid':
                        this.rapid = RAPID_DURATION;
                        break;
                    case 'heal':
                        // 回血由外部处理（需要访问lives）
                        break;
                }
                Sound.play('powerup');
                this.powerups.splice(i, 1);
                return { picked: true, type: p.type };
            }
        }
        return { picked: false, type: null };
    }

    update() {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            p.y += p.vy;
            if (p.y > H + 20) {
                this.powerups.splice(i, 1);
            }
        }

        if (this.triple > 0) this.triple--;
        if (this.rapid > 0) this.rapid--;
    }

    draw(ctx) {
        this.powerups.forEach(p => {
            ctx.fillStyle = '#fff';
            ctx.font = '18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(ICONS[p.type] || '?', p.x, p.y);
        });
    }
}
