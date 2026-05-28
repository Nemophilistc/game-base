// enemies.js - Enemy system
import { GRAVITY, TILE, T } from './config.js';

class Enemy {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.vx = 0; this.vy = 0;
        this.alive = true;
        this.health = 1;
        this.animTimer = 0;
        this.facing = 1;
    }
    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    update() { this.animTimer++; }
    stomped(effects) {
        this.health--;
        if (this.health <= 0) { this.alive = false; effects.burst(this.x + this.w / 2, this.y + this.h / 2, 12, '#FF8844', 4, 4, 20); }
    }
}

// Patrol enemy - walks back and forth
export class PatrolEnemy extends Enemy {
    constructor(x, y, range = 80) {
        super(x, y, 26, 26);
        this.startX = x; this.range = range;
        this.speed = 1.2;
        this.vx = this.speed;
    }
    update(level) {
        super.update();
        this.x += this.vx;
        this.vy += GRAVITY;
        this.y += this.vy;
        // Ground collision
        const bot = Math.floor((this.y + this.h) / TILE);
        const left = Math.floor(this.x / TILE);
        const right = Math.floor((this.x + this.w) / TILE);
        for (let tx = left; tx <= right; tx++) {
            const t = level.getTile(tx, bot);
            if (t === T.SOLID || t === T.ICE) { this.y = bot * TILE - this.h; this.vy = 0; }
        }
        // Turn at edges or range
        if (this.x < this.startX - this.range || this.x > this.startX + this.range) { this.vx = -this.vx; this.facing = -this.facing; }
        // Turn at walls
        const wallX = this.vx > 0 ? this.x + this.w + 1 : this.x - 1;
        const wallT = level.getTile(Math.floor(wallX / TILE), Math.floor((this.y + this.h / 2) / TILE));
        if (wallT === T.SOLID || wallT === T.ICE) { this.vx = -this.vx; this.facing = -this.facing; }
    }
    draw(ctx, cx, cy) {
        if (!this.alive) return;
        const x = this.x - cx, y = this.y - cy;
        ctx.fillStyle = '#E05555';
        ctx.beginPath(); ctx.roundRect(x, y, this.w, this.h, 4); ctx.fill();
        // Eyes
        const ex = this.facing > 0 ? x + 14 : x + 4;
        ctx.fillStyle = '#FFF'; ctx.fillRect(ex, y + 6, 6, 6);
        ctx.fillStyle = '#222'; ctx.fillRect(ex + (this.facing > 0 ? 2 : 0), y + 7, 3, 4);
    }
}

// Flying enemy - flies in a sine pattern
export class FlyingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 24, 20);
        this.startX = x; this.startY = y;
        this.phase = Math.random() * Math.PI * 2;
        this.speed = 1.5;
        this.range = 60;
    }
    update() {
        super.update();
        this.x = this.startX + Math.sin(this.animTimer * 0.02 + this.phase) * this.range;
        this.y = this.startY + Math.cos(this.animTimer * 0.03 + this.phase) * 30;
    }
    draw(ctx, cx, cy) {
        if (!this.alive) return;
        const x = this.x - cx, y = this.y - cy;
        ctx.fillStyle = '#5588DD';
        ctx.beginPath(); ctx.moveTo(x + 12, y); ctx.lineTo(x, y + this.h); ctx.lineTo(x + 24, y + this.h); ctx.closePath(); ctx.fill();
        // Wings
        const wingY = Math.sin(this.animTimer * 0.2) * 3;
        ctx.fillStyle = '#77AAFF';
        ctx.fillRect(x - 4, y + 6 + wingY, 8, 4);
        ctx.fillRect(x + 20, y + 6 - wingY, 8, 4);
        // Eye
        ctx.fillStyle = '#FFF'; ctx.fillRect(x + 9, y + 8, 5, 4);
        ctx.fillStyle = '#222'; ctx.fillRect(x + 11, y + 9, 2, 2);
    }
    stomped(effects) {
        this.health--;
        if (this.health <= 0) { this.alive = false; effects.burst(this.x + this.w / 2, this.y + this.h / 2, 12, '#5588DD', 4, 4, 20); }
    }
}

// Bouncing enemy - bounces around
export class BouncingEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 22, 22);
        this.vx = (Math.random() < 0.5 ? 1 : -1) * 2;
        this.vy = -6;
        this.bounce = 0.8;
    }
    update(level) {
        super.update();
        this.vy += GRAVITY;
        this.x += this.vx;
        this.y += this.vy;
        // Ground bounce
        const bot = Math.floor((this.y + this.h) / TILE);
        const left = Math.floor(this.x / TILE);
        const right = Math.floor((this.x + this.w) / TILE);
        for (let tx = left; tx <= right; tx++) {
            const t = level.getTile(tx, bot);
            if (t === T.SOLID || t === T.ICE) {
                this.y = bot * TILE - this.h;
                this.vy = -Math.abs(this.vy) * this.bounce;
                if (Math.abs(this.vy) < 1) this.vy = -6;
            }
        }
        // Wall bounce
        const wallY = Math.floor((this.y + this.h / 2) / TILE);
        if (this.vx > 0) {
            const t = level.getTile(Math.floor((this.x + this.w) / TILE), wallY);
            if (t === T.SOLID || t === T.ICE) { this.vx = -this.vx; }
        } else {
            const t = level.getTile(Math.floor((this.x - 1) / TILE), wallY);
            if (t === T.SOLID || t === T.ICE) { this.vx = -this.vx; }
        }
    }
    draw(ctx, cx, cy) {
        if (!this.alive) return;
        const x = this.x - cx, y = this.y - cy;
        ctx.fillStyle = '#55BB55';
        ctx.beginPath(); ctx.arc(x + 11, y + 11, 11, 0, Math.PI * 2); ctx.fill();
        // Eyes
        ctx.fillStyle = '#FFF'; ctx.fillRect(x + 5, y + 6, 5, 5); ctx.fillRect(x + 13, y + 6, 5, 5);
        ctx.fillStyle = '#222'; ctx.fillRect(x + 7, y + 7, 2, 3); ctx.fillRect(x + 15, y + 7, 2, 3);
    }
    stomped(effects) {
        this.health--;
        if (this.health <= 0) { this.alive = false; effects.burst(this.x + this.w / 2, this.y + this.h / 2, 12, '#55BB55', 4, 4, 20); }
    }
}

// Turret enemy - shoots projectiles
export class TurretEnemy extends Enemy {
    constructor(x, y) {
        super(x, y, 28, 24);
        this.shootTimer = 0;
        this.shootInterval = 120;
        this.projectiles = [];
        this.dir = -1;
    }
    update(level, playerX) {
        super.update();
        this.dir = playerX < this.x + this.w / 2 ? -1 : 1;
        this.shootTimer++;
        if (this.shootTimer >= this.shootInterval) {
            this.shootTimer = 0;
            this.projectiles.push({
                x: this.x + (this.dir > 0 ? this.w : 0),
                y: this.y + this.h / 2 - 3,
                vx: this.dir * 4,
                w: 8, h: 6, life: 120,
            });
        }
        // Update projectiles
        this.projectiles = this.projectiles.filter(p => {
            p.x += p.vx; p.life--;
            const tx = Math.floor(p.x / TILE);
            const ty = Math.floor(p.y / TILE);
            const t = level.getTile(tx, ty);
            return p.life > 0 && t !== T.SOLID && t !== T.ICE;
        });
    }
    draw(ctx, cx, cy) {
        if (!this.alive) return;
        const x = this.x - cx, y = this.y - cy;
        ctx.fillStyle = '#888';
        ctx.fillRect(x, y + 4, this.w, this.h - 4);
        ctx.fillStyle = '#666';
        const bx = this.dir > 0 ? x + this.w - 4 : x;
        ctx.fillRect(bx, y + 8, 8, 8);
        // Eye
        ctx.fillStyle = '#F44'; ctx.fillRect(x + 10, y + 8, 6, 4);
        // Projectiles
        ctx.fillStyle = '#FF6644';
        for (const p of this.projectiles) {
            ctx.fillRect(p.x - cx, p.y - cy, p.w, p.h);
        }
    }
    getProjectiles() { return this.projectiles; }
    stomped(effects) {
        this.health--;
        if (this.health <= 0) { this.alive = false; effects.burst(this.x + this.w / 2, this.y + this.h / 2, 12, '#888888', 4, 4, 20); }
    }
}
