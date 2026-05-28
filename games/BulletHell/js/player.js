import { CONFIG, WEAPONS } from './config.js';
import { Sound } from './sound.js';
import { addDmgNum, spawnParticle } from './items.js';

// ============================================================
// 玩家子弹
// ============================================================
export class PBullet {
    constructor(x, y, vx, vy, dmg, color, deps) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.dmg = dmg; this.color = color; this.size = 4; this.trail = [];
        this._deps = deps; // { game, enemies, dmgNums }
    }

    update() {
        this.trail.push({ x: this.x, y: this.y });
        if (this.trail.length > 5) this.trail.shift();
        this.x += this.vx; this.y += this.vy;
        const { game, enemies, dmgNums } = this._deps;
        if (game.activeEffects.tracking > 0 && enemies.length > 0) {
            let nearest = null, minD = Infinity;
            for (const e of enemies) {
                if (e.visible === false) continue;
                const d = Math.hypot(e.x - this.x, e.y - this.y);
                if (d < minD) { minD = d; nearest = e; }
            }
            if (nearest && minD < 200) {
                const a = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                this.vx += Math.cos(a) * 0.3;
                this.vy += Math.sin(a) * 0.3;
                const sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                if (sp > 10) { this.vx = this.vx / sp * 10; this.vy = this.vy / sp * 10; }
            }
        }
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.visible === false) continue;
            if (Math.hypot(e.x - this.x, e.y - this.y) < e.size + this.size) {
                if (e.takeDamage(this.dmg)) enemies.splice(i, 1);
                return false;
            }
        }
        return this.y > -10 && this.x > -10 && this.x < CONFIG.W + 10;
    }

    draw(ctx) {
        this.trail.forEach((t, i) => {
            ctx.globalAlpha = i / this.trail.length * 0.3;
            ctx.fillStyle = this.color;
            ctx.beginPath(); ctx.arc(t.x, t.y, this.size * 0.6, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1; ctx.fillStyle = this.color;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill();
    }
}

export class LaserBeam {
    constructor(x, y, width, dmg, color, deps) {
        this.x = x; this.y = y; this.width = width; this.dmg = dmg; this.color = color;
        this.life = 8; this.hitEnemies = new Set();
        this._deps = deps; // { enemies }
    }

    update() {
        this.life--;
        const { enemies } = this._deps;
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            if (e.visible === false) continue;
            if (!this.hitEnemies.has(e) && Math.abs(e.x - this.x) < (e.size + this.width / 2) && e.y < this.y) {
                if (e.takeDamage(this.dmg)) { enemies.splice(i, 1); }
                else { this.hitEnemies.add(e); }
            }
        }
        return this.life > 0;
    }

    draw(ctx) {
        const a = this.life / 8;
        ctx.globalAlpha = a;
        ctx.fillStyle = this.color; ctx.fillRect(this.x - this.width / 2, 0, this.width, this.y);
        ctx.fillStyle = '#fff'; ctx.fillRect(this.x - this.width / 4, 0, this.width / 2, this.y);
        ctx.globalAlpha = 1;
    }
}

// ============================================================
// 玩家
// ============================================================
export class Player {
    constructor(gameRef, deps) {
        this.x = CONFIG.W / 2; this.y = CONFIG.H - 80;
        this.size = CONFIG.PLAYER_SIZE; this.speed = CONFIG.PLAYER_SPEED;
        this.hp = CONFIG.PLAYER_HP; this.maxHp = CONFIG.PLAYER_HP;
        this.inv = 0; this.wlv = 1; this.fireRate = 10; this.fireTimer = 0;
        this.power = 10; this.hitbox = 3; this.shield = 0;
        this.dashCD = 0; this.dashing = 0; this.dashDx = 0; this.dashDy = 0;
        this.afterimages = [];
        this.weaponType = gameRef.selectedWeapon;
        this._game = gameRef;
        this._deps = deps; // { pBullets, enemies, particles, dmgNums }
    }

    update(keys) {
        if (this.dashCD > 0) this.dashCD--;
        if (this.inv > 0) this.inv--;

        if (this.dashing > 0) {
            this.dashing--;
            this.x += this.dashDx * 12;
            this.y += this.dashDy * 12;
            this.afterimages.push({ x: this.x, y: this.y, life: 10 });
        } else {
            let dx = 0, dy = 0;
            if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
            if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
            if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
            if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
            if (dx !== 0 && dy !== 0) { const l = Math.SQRT2; dx /= l; dy /= l; }
            this.x += dx * this.speed;
            this.y += dy * this.speed;
        }

        this.x = Math.max(this.size, Math.min(CONFIG.W - this.size, this.x));
        this.y = Math.max(this.size, Math.min(CONFIG.H - this.size, this.y));

        let fr = this.fireRate;
        if (this._game.activeEffects.fireRate > 0) fr = Math.max(3, fr - 3);
        this.fireTimer++;
        if (this.fireTimer >= fr) { this.fireTimer = 0; this.fire(); }

        this.afterimages = this.afterimages.filter(a => { a.life--; return a.life > 0; });
        for (let k in this._game.activeEffects) {
            if (this._game.activeEffects[k] > 0) this._game.activeEffects[k]--;
        }
    }

    fire() {
        Sound.play('shoot');
        const bulletDeps = {
            PBullet, LaserBeam,
            game: this._game,
            enemies: this._deps.enemies,
            dmgNums: this._deps.dmgNums
        };
        WEAPONS[this.weaponType].fire(this, this._deps.pBullets, bulletDeps);
    }

    draw(ctx) {
        ctx.save();
        this.afterimages.forEach(a => {
            ctx.globalAlpha = a.life / 10 * 0.3;
            this._drawShip(ctx, a.x, a.y);
        });
        ctx.globalAlpha = 1;
        if (this.inv > 0 && this.inv % 4 < 2) ctx.globalAlpha = 0.5;
        if (this.dashing > 0) ctx.globalAlpha = 0.6;
        this._drawShip(ctx, this.x, this.y);
        if (this.shield > 0) {
            ctx.strokeStyle = 'rgba(0,200,255,0.5)';
            ctx.lineWidth = 2; ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.arc(this.x, this.y, this.hitbox, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath();
        ctx.arc(this.x, this.y, this.hitbox + 5, 0, Math.PI * 2); ctx.fill();
        if (this._game.activeEffects.tracking > 0) {
            ctx.strokeStyle = 'rgba(160,0,255,0.4)';
            ctx.lineWidth = 1; ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 12, 0, Math.PI * 2); ctx.stroke();
        }
        if (this._game.activeEffects.spread > 0) {
            ctx.strokeStyle = 'rgba(255,200,0,0.4)';
            ctx.lineWidth = 1; ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 14, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.restore();
    }

    _drawShip(ctx, x, y) {
        const s = this.size;
        ctx.fillStyle = '#00aaff';
        ctx.beginPath(); ctx.moveTo(x, y - s);
        ctx.lineTo(x - s * 1.5, y + s * 0.5);
        ctx.lineTo(x - s * 0.5, y + s * 0.3);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(x, y - s);
        ctx.lineTo(x + s * 1.5, y + s * 0.5);
        ctx.lineTo(x + s * 0.5, y + s * 0.3);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = this.weaponType === 'laser' ? '#ff3366' : this.weaponType === 'spread' ? '#ffcc00' : '#00d4ff';
        ctx.beginPath(); ctx.moveTo(x, y - s * 1.2);
        ctx.lineTo(x - s * 0.4, y + s * 0.8);
        ctx.lineTo(x + s * 0.4, y + s * 0.8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath();
        ctx.ellipse(x, y - s * 0.2, s * 0.2, s * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        const f = Math.random() * 5;
        ctx.fillStyle = '#ff6b35'; ctx.beginPath();
        ctx.moveTo(x - s * 0.3, y + s * 0.8);
        ctx.lineTo(x, y + s * 1.5 + f);
        ctx.lineTo(x + s * 0.3, y + s * 0.8);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffff00'; ctx.beginPath();
        ctx.moveTo(x - s * 0.15, y + s * 0.8);
        ctx.lineTo(x, y + s * 1.2 + f * 0.6);
        ctx.lineTo(x + s * 0.15, y + s * 0.8);
        ctx.closePath(); ctx.fill();
    }

    takeDamage(amt) {
        if (this.inv > 0 || this.dashing > 0) return;
        if (this.shield > 0) {
            this.shield--; this.inv = 30;
            Sound.play('hit'); return;
        }
        this.hp -= amt;
        // Bug修复: 被击中后1.5秒无敌（原为1秒60帧，现90帧）
        this.inv = CONFIG.INV_TIME;
        this._game.shake.intensity = 10;
        addDmgNum(this.x, this.y - 30, amt, '#ff6b6b', this._deps.dmgNums);
        for (let i = 0; i < 12; i++) spawnParticle(this.x, this.y, '#ff6b6b', 'normal', this._deps.particles);
        this._game.flashColor = 'rgba(255,0,0,0.3)';
        this._game.flashTimer = 10;
        Sound.play('hit');
        if (this.hp <= 0) this._game.onGameOver();
    }

    addExp(a) {
        const game = this._game;
        game.exp += a;
        while (game.exp >= game.expToNext) {
            game.exp -= game.expToNext; game.level++;
            game.expToNext = Math.floor(CONFIG.EXP_BASE * Math.pow(CONFIG.EXP_GROWTH, game.level - 1));
            game.onLevelUp();
        }
    }
}

// ============================================================
// 闪避冲刺
// ============================================================
export function doDash(player, keys, particles) {
    if (!player || player.dashCD > 0 || player.dashing > 0) return;
    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) dy = -1;
    if (keys['KeyS'] || keys['ArrowDown']) dy = 1;
    if (keys['KeyA'] || keys['ArrowLeft']) dx = -1;
    if (keys['KeyD'] || keys['ArrowRight']) dx = 1;
    if (dx === 0 && dy === 0) dy = -1;
    const l = Math.sqrt(dx * dx + dy * dy); dx /= l; dy /= l;
    player.dashDx = dx; player.dashDy = dy;
    player.dashing = CONFIG.DASH_INV; player.dashCD = CONFIG.DASH_CD;
    Sound.play('dash');
    for (let i = 0; i < 8; i++) spawnParticle(player.x, player.y, '#00d4ff', 'lightning', particles);
}
