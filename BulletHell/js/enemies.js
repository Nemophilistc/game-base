import { CONFIG } from './config.js';
import { Sound } from './sound.js';
import { spawnPowerup, spawnParticle, addDmgNum, ExpOrb } from './items.js';
import { BOSS_TYPES, bossUpdate, bossGhostUpdate, bossFire } from './boss.js';

// ============================================================
// 敌人子弹
// ============================================================
export class EBullet {
    constructor(x, y, vx, vy, color, size, tracking) {
        this.x = x; this.y = y; this.vx = vx; this.vy = vy;
        this.color = color;
        this.size = size || 4;
        this.tracking = tracking || false;
        this.life = 300;
    }

    update(playerRef) {
        if (!playerRef) return false;
        if (this.tracking) {
            const a = Math.atan2(playerRef.y - this.y, playerRef.x - this.x);
            this.vx += Math.cos(a) * 0.1;
            this.vy += Math.sin(a) * 0.1;
            const sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            if (sp > 5) { this.vx = this.vx / sp * 5; this.vy = this.vy / sp * 5; }
        }
        this.x += this.vx; this.y += this.vy; this.life--;
        if (Math.hypot(playerRef.x - this.x, playerRef.y - this.y) < playerRef.hitbox + this.size) {
            playerRef.takeDamage(10);
            return false;
        }
        return this.life > 0 && this.y < CONFIG.H + 10 && this.y > -10 && this.x > -10 && this.x < CONFIG.W + 10;
    }

    draw(ctx) {
        ctx.fillStyle = this.color + '60';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================================
// 敌人
// ============================================================
export class Enemy {
    constructor(x, y, type, gameRef, deps) {
        this.x = x; this.y = y; this.type = type;
        this.angle = 0; this.hitFlash = 0; this.shootTimer = 0;
        this.visible = true;
        this.frontArmor = false;
        this.dir = 1; // Bug修复: 默认方向，boss和tracker使用
        this._game = gameRef;
        this._deps = deps; // { eBullets, particles, dmgNums, powerups, expOrbs, enemies, player: () => player }
        this.initType();
    }

    initType() {
        const m = 1 + (this._game.difficulty - 1) * 0.25;
        switch (this.type) {
            case 'small':
                this.hp = Math.floor(20 * m); this.size = 15; this.speed = 2;
                this.score = 50; this.color = '#ff6b6b'; this.pattern = 'straight'; break;
            case 'medium':
                this.hp = Math.floor(50 * m); this.size = 25; this.speed = 1.5;
                this.score = 100; this.color = '#ffa502'; this.pattern = 'sine'; break;
            case 'large':
                this.hp = Math.floor(100 * m); this.size = 35; this.speed = 1;
                this.score = 200; this.color = '#9b59b6'; this.pattern = 'circle'; break;
            case 'tracker':
                this.hp = Math.floor(40 * m); this.size = 20; this.speed = 1.2;
                this.score = 150; this.color = '#00e5ff'; this.pattern = 'track';
                // Bug修复: tracker随机方向
                this.dir = Math.random() < 0.5 ? -1 : 1; break;
            case 'splitter':
                this.hp = Math.floor(35 * m); this.size = 22; this.speed = 1.8;
                this.score = 120; this.color = '#4caf50'; this.pattern = 'sine'; break;
            case 'armored':
                this.hp = Math.floor(120 * m); this.size = 28; this.speed = 0.8;
                this.score = 250; this.color = '#78909c'; this.pattern = 'straight';
                this.frontArmor = true; break;
            case 'boss_mech':
            case 'boss_ghost':
            case 'boss_final': {
                const cfg = BOSS_TYPES[this.type];
                this.hp = Math.floor(cfg.hpMult * m); this.size = cfg.size;
                this.speed = cfg.speed; this.score = cfg.score;
                this.color = cfg.color; this.pattern = 'boss';
                this.phase = 0; this.phaseTimer = 0;
                this.bossType = cfg.bossType;
                this.dir = Math.random() < 0.5 ? -1 : 1;
                if (cfg.visTimer !== undefined) this.visTimer = cfg.visTimer;
                break;
            }
        }
        this.maxHp = this.hp;
    }

    update() {
        const player = this._deps.player();
        this.angle += 0.02; this.shootTimer++;
        if (this.hitFlash > 0) this.hitFlash--;

        if (this.bossType === 'ghost') bossGhostUpdate(this);

        switch (this.pattern) {
            case 'straight': this.y += this.speed; break;
            case 'sine': this.y += this.speed; this.x += Math.sin(this.angle * 3) * 2; break;
            case 'circle': this.y += this.speed * 0.5; this.x += Math.cos(this.angle) * 3; break;
            case 'track':
                this.y += this.speed * 0.7;
                // Bug修复: tracker随机左右方向移动
                if (player) {
                    const dx = player.x - this.x;
                    this.x += Math.sign(dx) * Math.min(Math.abs(dx) * 0.02, 1.5) + this.dir * 0.5;
                }
                break;
            case 'boss':
                bossUpdate(this);
                break;
        }

        this.x = Math.max(this.size, Math.min(CONFIG.W - this.size, this.x));
        this.fire();
        return this.y < CONFIG.H + 50;
    }

    fire() {
        const player = this._deps.player();
        switch (this.type) {
            case 'small': if (this.shootTimer % 60 === 0) this._aimed(); break;
            case 'medium': if (this.shootTimer % 45 === 0) this._spread(3, 0.2); break;
            case 'large': if (this.shootTimer % 30 === 0) this._circle(8); break;
            case 'tracker': if (this.shootTimer % 50 === 0) this._tracking(); break;
            case 'splitter': if (this.shootTimer % 55 === 0) this._aimed(); break;
            case 'armored': if (this.shootTimer % 40 === 0) this._spread(5, 0.15); break;
            case 'boss_mech':
            case 'boss_ghost':
            case 'boss_final':
                bossFire(this, player, this._deps.eBullets, EBullet);
                break;
        }
    }

    _aimed() {
        const player = this._deps.player();
        if (!player) return;
        const dx = player.x - this.x, dy = player.y - this.y, d = Math.hypot(dx, dy);
        if (d > 0) this._deps.eBullets.push(new EBullet(this.x, this.y, dx / d * 4, dy / d * 4, this.color, 5));
    }

    _spread(n, sp) {
        const player = this._deps.player();
        if (!player) return;
        const ba = Math.atan2(player.y - this.y, player.x - this.x);
        for (let i = 0; i < n; i++) {
            const a = ba + (i - (n - 1) / 2) * sp;
            this._deps.eBullets.push(new EBullet(this.x, this.y, Math.cos(a) * 4, Math.sin(a) * 4, this.color, 5));
        }
    }

    _circle(n) {
        for (let i = 0; i < n; i++) {
            const a = Math.PI * 2 / n * i + this.angle;
            this._deps.eBullets.push(new EBullet(this.x, this.y, Math.cos(a) * 3, Math.sin(a) * 3, this.color, 4));
        }
    }

    _tracking() {
        this._deps.eBullets.push(new EBullet(this.x, this.y, 0, 3, this.color, 6, true));
    }

    takeDamage(amt) {
        const player = this._deps.player();
        if (this.frontArmor && player && Math.abs(player.x - this.x) < this.size * 0.8 && player.y < this.y) {
            addDmgNum(this.x, this.y - this.size, 'DEF', '#78909c', this._deps.dmgNums);
            return false;
        }
        this.hp -= amt; this.hitFlash = 5;
        addDmgNum(this.x, this.y - 20, amt, '#ffd700', this._deps.dmgNums);
        Sound.play('hit');
        if (this.hp <= 0) { this.die(); return true; }
        return false;
    }

    die() {
        const game = this._game;
        game.combo++; game.comboTimer = CONFIG.COMBO_TIMEOUT;
        game.comboMult = game.combo >= 30 ? 8 : game.combo >= 15 ? 4 : game.combo >= 5 ? 2 : 1;
        game.score += this.score * game.comboMult;
        Sound.play('combo');
        const ec = Math.ceil(this.score / 20);
        const player = this._deps.player();
        for (let i = 0; i < ec; i++) {
            const orb = new ExpOrb(this.x, this.y, 10);
            orb.setPlayerRef(player);
            this._deps.expOrbs.push(orb);
        }
        if (Math.random() < CONFIG.POWERUP_CHANCE && !this.type.startsWith('boss_'))
            spawnPowerup(this.x, this.y, player, game, this._deps.particles, this._deps.powerups);
        for (let i = 0; i < 15; i++) spawnParticle(this.x, this.y, this.color, 'normal', this._deps.particles);
        Sound.play('explosion');
        if (this.type.startsWith('boss_')) {
            for (let i = 0; i < 40; i++) spawnParticle(this.x, this.y, '#ff6b35', 'fire', this._deps.particles);
            for (let i = 0; i < 25; i++) spawnParticle(this.x, this.y, '#ffd700', 'lightning', this._deps.particles);
            game.shake.intensity = 20;
            game.flashColor = 'rgba(255,255,0,0.3)'; game.flashTimer = 20;
            for (let i = 0; i < 3; i++)
                spawnPowerup(this.x + (Math.random() - 0.5) * 40, this.y + (Math.random() - 0.5) * 40,
                    player, game, this._deps.particles, this._deps.powerups);
        }
        if (this.type === 'splitter') {
            for (let i = 0; i < 2; i++) {
                const e = new Enemy(this.x + (Math.random() - 0.5) * 20, this.y, 'small', game, this._deps);
                e.hp = Math.floor(e.hp * 0.6); e.maxHp = e.hp; e.score = Math.floor(e.score * 0.5);
                this._deps.enemies.push(e);
            }
        }
        game.hitstop = this.type.startsWith('boss_') ? 6 : 3;
    }

    draw(ctx) {
        if (this.bossType === 'ghost' && !this.visible) ctx.globalAlpha = 0.15;
        ctx.save();
        ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
        this._body(ctx);
        if (this.hp < this.maxHp) {
            const bw = this.size * 2, bh = 4, bx = this.x - bw / 2, by = this.y - this.size - 10;
            ctx.fillStyle = '#333'; ctx.fillRect(bx, by, bw, bh);
            const pct = this.hp / this.maxHp;
            ctx.fillStyle = pct > 0.6 ? '#4ecdc4' : pct > 0.3 ? '#ffa502' : '#ff6b6b';
            ctx.fillRect(bx, by, bw * pct, bh);
        }
        if (this.frontArmor) {
            ctx.fillStyle = 'rgba(200,200,200,0.3)';
            ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 0.6);
        }
        ctx.restore(); ctx.globalAlpha = 1;
    }

    _body(ctx) {
        const s = this.size;
        const t = this.angle;
        switch (this.type) {
            case 'small': {
                // 小型战斗机：三角机身+机翼+引擎火焰
                ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
                // 机身
                ctx.beginPath(); ctx.moveTo(this.x, this.y + s);
                ctx.lineTo(this.x - s * 0.3, this.y - s * 0.2);
                ctx.lineTo(this.x + s * 0.3, this.y - s * 0.2);
                ctx.closePath(); ctx.fill();
                // 左翼
                ctx.beginPath(); ctx.moveTo(this.x - s * 0.2, this.y);
                ctx.lineTo(this.x - s, this.y + s * 0.4);
                ctx.lineTo(this.x - s * 0.4, this.y + s * 0.2);
                ctx.closePath(); ctx.fill();
                // 右翼
                ctx.beginPath(); ctx.moveTo(this.x + s * 0.2, this.y);
                ctx.lineTo(this.x + s, this.y + s * 0.4);
                ctx.lineTo(this.x + s * 0.4, this.y + s * 0.2);
                ctx.closePath(); ctx.fill();
                // 驾驶舱
                ctx.fillStyle = '#4dd0e1';
                ctx.beginPath(); ctx.arc(this.x, this.y - s * 0.1, s * 0.2, 0, Math.PI * 2); ctx.fill();
                // 引擎火焰
                ctx.fillStyle = '#ff6b35';
                ctx.beginPath(); ctx.moveTo(this.x - s * 0.15, this.y + s * 0.2);
                ctx.lineTo(this.x, this.y + s * 0.8 + Math.random() * s * 0.3);
                ctx.lineTo(this.x + s * 0.15, this.y + s * 0.2);
                ctx.closePath(); ctx.fill();
                break;
            }
            case 'medium': {
                // 中型战舰：宽翼+双引擎+铆钉
                ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
                // 主体
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + s * 0.8);
                ctx.lineTo(this.x - s * 0.6, this.y + s * 0.2);
                ctx.lineTo(this.x - s * 0.4, this.y - s * 0.6);
                ctx.lineTo(this.x + s * 0.4, this.y - s * 0.6);
                ctx.lineTo(this.x + s * 0.6, this.y + s * 0.2);
                ctx.closePath(); ctx.fill();
                // 左翼
                ctx.beginPath(); ctx.moveTo(this.x - s * 0.4, this.y);
                ctx.lineTo(this.x - s * 1.1, this.y + s * 0.3);
                ctx.lineTo(this.x - s * 0.5, this.y + s * 0.4);
                ctx.closePath(); ctx.fill();
                // 右翼
                ctx.beginPath(); ctx.moveTo(this.x + s * 0.4, this.y);
                ctx.lineTo(this.x + s * 1.1, this.y + s * 0.3);
                ctx.lineTo(this.x + s * 0.5, this.y + s * 0.4);
                ctx.closePath(); ctx.fill();
                // 铆钉
                ctx.fillStyle = '#555';
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath(); ctx.arc(this.x + i * s * 0.25, this.y - s * 0.2, 1.5, 0, Math.PI * 2); ctx.fill();
                }
                // 双引擎
                ctx.fillStyle = '#ff4444';
                ctx.beginPath(); ctx.moveTo(this.x - s * 0.3, this.y + s * 0.5);
                ctx.lineTo(this.x - s * 0.2, this.y + s + Math.random() * s * 0.3);
                ctx.lineTo(this.x - s * 0.1, this.y + s * 0.5);
                ctx.closePath(); ctx.fill();
                ctx.beginPath(); ctx.moveTo(this.x + s * 0.1, this.y + s * 0.5);
                ctx.lineTo(this.x + s * 0.2, this.y + s + Math.random() * s * 0.3);
                ctx.lineTo(this.x + s * 0.3, this.y + s * 0.5);
                ctx.closePath(); ctx.fill();
                break;
            }
            case 'large': {
                // 大型战列舰：多层装甲+炮塔+护盾
                ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
                // 主装甲
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + s * 0.9);
                ctx.lineTo(this.x - s * 0.8, this.y + s * 0.4);
                ctx.lineTo(this.x - s, this.y - s * 0.2);
                ctx.lineTo(this.x - s * 0.6, this.y - s * 0.8);
                ctx.lineTo(this.x + s * 0.6, this.y - s * 0.8);
                ctx.lineTo(this.x + s, this.y - s * 0.2);
                ctx.lineTo(this.x + s * 0.8, this.y + s * 0.4);
                ctx.closePath(); ctx.fill();
                // 内层装甲
                ctx.fillStyle = '#7e57c2';
                ctx.beginPath();
                ctx.moveTo(this.x, this.y + s * 0.5);
                ctx.lineTo(this.x - s * 0.5, this.y);
                ctx.lineTo(this.x - s * 0.4, this.y - s * 0.5);
                ctx.lineTo(this.x + s * 0.4, this.y - s * 0.5);
                ctx.lineTo(this.x + s * 0.5, this.y);
                ctx.closePath(); ctx.fill();
                // 左炮塔
                ctx.fillStyle = '#9575cd';
                ctx.beginPath(); ctx.arc(this.x - s * 0.6, this.y - s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.fill();
                // 右炮塔
                ctx.beginPath(); ctx.arc(this.x + s * 0.6, this.y - s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.fill();
                // 中央核心
                ctx.fillStyle = '#e040fb';
                ctx.beginPath(); ctx.arc(this.x, this.y - s * 0.2, s * 0.2, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(this.x, this.y - s * 0.2, s * 0.08, 0, Math.PI * 2); ctx.fill();
                // 护盾光环
                ctx.strokeStyle = 'rgba(149,117,205,0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(this.x, this.y, s * 1.2, 0, Math.PI * 2); ctx.stroke();
                break;
            }
            case 'tracker': {
                // 追踪者：球形+机械眼+旋转环
                ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
                // 外壳
                ctx.beginPath(); ctx.arc(this.x, this.y, s, 0, Math.PI * 2); ctx.fill();
                // 装甲带
                ctx.strokeStyle = '#00acc1';
                ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(this.x, this.y, s * 0.75, 0, Math.PI * 2); ctx.stroke();
                // 机械眼
                ctx.fillStyle = '#fff';
                ctx.beginPath(); ctx.arc(this.x, this.y, s * 0.45, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#d32f2f';
                ctx.beginPath(); ctx.arc(this.x, this.y, s * 0.25, 0, Math.PI * 2); ctx.fill();
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(this.x + Math.cos(t * 2) * s * 0.1, this.y + Math.sin(t * 2) * s * 0.1, s * 0.1, 0, Math.PI * 2); ctx.fill();
                // 旋转装饰环
                ctx.strokeStyle = 'rgba(0,229,255,0.4)';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.ellipse(this.x, this.y, s * 1.3, s * 0.5, t, 0, Math.PI * 2);
                ctx.stroke();
                break;
            }
            case 'splitter': {
                // 分裂体：六角星+脉冲核心+分裂裂纹
                ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
                // 外星
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = Math.PI / 3 * i + t;
                    const r = i % 2 === 0 ? s : s * 0.55;
                    ctx.lineTo(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r);
                }
                ctx.closePath(); ctx.fill();
                // 内星
                ctx.fillStyle = '#81c784';
                ctx.beginPath();
                for (let i = 0; i < 6; i++) {
                    const a = Math.PI / 3 * i + t + Math.PI / 6;
                    const r = i % 2 === 0 ? s * 0.5 : s * 0.3;
                    ctx.lineTo(this.x + Math.cos(a) * r, this.y + Math.sin(a) * r);
                }
                ctx.closePath(); ctx.fill();
                // 脉冲核心
                const pulse = 0.8 + Math.sin(t * 3) * 0.2;
                ctx.fillStyle = '#c8e6c9';
                ctx.beginPath(); ctx.arc(this.x, this.y, s * 0.2 * pulse, 0, Math.PI * 2); ctx.fill();
                // 裂纹
                ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 3; i++) {
                    const a = Math.PI * 2 / 3 * i + t * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(this.x + Math.cos(a) * s * 0.2, this.y + Math.sin(a) * s * 0.2);
                    ctx.lineTo(this.x + Math.cos(a) * s * 0.8, this.y + Math.sin(a) * s * 0.8);
                    ctx.stroke();
                }
                break;
            }
            case 'armored': {
                // 重装甲：多层方块+铆钉+前挡板
                ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
                // 外装甲
                ctx.fillRect(this.x - s, this.y - s, s * 2, s * 2);
                // 内装甲
                ctx.fillStyle = '#546e7a';
                ctx.fillRect(this.x - s + 4, this.y - s + 4, s * 2 - 8, s * 2 - 8);
                // 核心区域
                ctx.fillStyle = '#37474f';
                ctx.fillRect(this.x - s * 0.4, this.y - s * 0.4, s * 0.8, s * 0.8);
                // 铆钉
                ctx.fillStyle = '#90a4ae';
                const corners = [[-1,-1],[1,-1],[-1,1],[1,1]];
                for (const [cx, cy] of corners) {
                    ctx.beginPath();
                    ctx.arc(this.x + cx * (s - 6), this.y + cy * (s - 6), 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                // 中央铆钉
                ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill();
                // 前挡板高光
                ctx.fillStyle = 'rgba(200,200,200,0.15)';
                ctx.fillRect(this.x - s, this.y - s, s * 2, s * 0.5);
                break;
            }
            default:
                if (this.type.startsWith('boss_')) {
                    // Boss：复杂多层+光环+装饰
                    ctx.fillStyle = this.hitFlash > 0 ? '#fff' : this.color;
                    // 主体
                    ctx.beginPath(); ctx.moveTo(this.x, this.y + s);
                    ctx.lineTo(this.x - s * 1.5, this.y + s * 0.3);
                    ctx.lineTo(this.x - s * 1.2, this.y - s * 0.5);
                    ctx.lineTo(this.x - s * 0.5, this.y - s);
                    ctx.lineTo(this.x + s * 0.5, this.y - s);
                    ctx.lineTo(this.x + s * 1.2, this.y - s * 0.5);
                    ctx.lineTo(this.x + s * 1.5, this.y + s * 0.3);
                    ctx.closePath(); ctx.fill();
                    // 装甲层
                    ctx.fillStyle = this.bossType === 'ghost' ? '#7b1fa2' : this.bossType === 'final' ? '#c62828' : '#e65100';
                    ctx.beginPath(); ctx.moveTo(this.x, this.y + s * 0.6);
                    ctx.lineTo(this.x - s, this.y + s * 0.1);
                    ctx.lineTo(this.x - s * 0.8, this.y - s * 0.4);
                    ctx.lineTo(this.x + s * 0.8, this.y - s * 0.4);
                    ctx.lineTo(this.x + s, this.y + s * 0.1);
                    ctx.closePath(); ctx.fill();
                    // 核心
                    ctx.fillStyle = '#fff';
                    ctx.beginPath(); ctx.arc(this.x, this.y - s * 0.2, s * 0.25, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = this.bossType === 'ghost' ? '#ce93d8' : this.bossType === 'final' ? '#ff0' : '#ff6b35';
                    ctx.beginPath(); ctx.arc(this.x, this.y - s * 0.2, s * 0.15, 0, Math.PI * 2); ctx.fill();
                    // 翅膀装饰
                    ctx.fillStyle = this.bossType === 'ghost' ? 'rgba(206,147,216,0.4)' : 'rgba(255,107,53,0.4)';
                    ctx.beginPath(); ctx.moveTo(this.x - s * 1.5, this.y + s * 0.3);
                    ctx.lineTo(this.x - s * 2, this.y - s * 0.2);
                    ctx.lineTo(this.x - s * 1.2, this.y - s * 0.5);
                    ctx.closePath(); ctx.fill();
                    ctx.beginPath(); ctx.moveTo(this.x + s * 1.5, this.y + s * 0.3);
                    ctx.lineTo(this.x + s * 2, this.y - s * 0.2);
                    ctx.lineTo(this.x + s * 1.2, this.y - s * 0.5);
                    ctx.closePath(); ctx.fill();
                    // 光环
                    ctx.strokeStyle = this.bossType === 'ghost' ? '#ce93d8' : this.bossType === 'final' ? '#ff0' : '#ff6b35';
                    ctx.lineWidth = 2; ctx.beginPath();
                    ctx.arc(this.x, this.y, s * 1.5, 0, Math.PI * 2); ctx.stroke();
                    // 内光环
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.lineWidth = 1; ctx.beginPath();
                    ctx.arc(this.x, this.y, s * 1.2 + Math.sin(t * 3) * 5, 0, Math.PI * 2); ctx.stroke();
                }
                break;
        }
    }
}

// ============================================================
// 敌人生成
// ============================================================
export function spawnEnemy(gameRef, enemiesRef, deps) {
    const types = ['small', 'medium', 'large', 'tracker', 'splitter', 'armored'];
    let type = 'small';
    const r = Math.random();
    if (r < 0.05 * gameRef.difficulty) type = types[Math.floor(Math.random() * types.length)];
    else if (r < 0.15) type = 'armored';
    else if (r < 0.25) type = 'tracker';
    else if (r < 0.35) type = 'splitter';
    else if (r < 0.5) type = 'medium';
    else if (r < 0.7) type = 'large';

    // Bug修复: tracker/UFO从随机方向进入（原只从上方）
    let x, y;
    if (type === 'tracker') {
        const fromLeft = Math.random() < 0.5;
        x = fromLeft ? -20 : CONFIG.W + 20;
        y = Math.random() * CONFIG.H * 0.3 + 50;
    } else {
        x = Math.random() * (CONFIG.W - 100) + 50;
        y = -50;
    }
    enemiesRef.push(new Enemy(x, y, type, gameRef, deps));
}
