// collectibles.js - Collectible system
import { TILE } from './config.js';

class Collectible {
    constructor(x, y, w, h) {
        this.x = x; this.y = y; this.w = w; this.h = h;
        this.collected = false;
        this.animTimer = Math.random() * 100;
    }
    update() { if (!this.collected) this.animTimer++; }
    getBounds() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
    overlaps(rect) {
        return !this.collected &&
            this.x < rect.x + rect.w && this.x + this.w > rect.x &&
            this.y < rect.y + rect.h && this.y + this.h > rect.y;
    }
}

export class Star extends Collectible {
    constructor(x, y, index) {
        super(x, y, 20, 20);
        this.index = index;
    }
    draw(ctx, cx, cy) {
        if (this.collected) return;
        const x = this.x - cx + 10, y = this.y - cy + 10 + Math.sin(this.animTimer * 0.05) * 3;
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const a = (i * 72 - 90) * Math.PI / 180;
            const r = i === 0 ? 0 : 10;
            const px = x + Math.cos(a) * 10;
            const py = y + Math.sin(a) * 10;
            if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            const a2 = ((i * 72 + 36) - 90) * Math.PI / 180;
            ctx.lineTo(x + Math.cos(a2) * 5, y + Math.sin(a2) * 5);
        }
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
    }
}

export class Coin extends Collectible {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.value = 1;
    }
    draw(ctx, cx, cy) {
        if (this.collected) return;
        const x = this.x - cx, y = this.y - cy + Math.sin(this.animTimer * 0.06) * 2;
        const squeeze = Math.abs(Math.cos(this.animTimer * 0.04));
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.ellipse(x + 8, y + 8, 6 * squeeze + 1, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        if (squeeze > 0.3) {
            ctx.fillStyle = '#DAA520';
            ctx.beginPath();
            ctx.ellipse(x + 8, y + 8, 3 * squeeze, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

export class Key extends Collectible {
    constructor(x, y) {
        super(x, y, 18, 18);
    }
    draw(ctx, cx, cy) {
        if (this.collected) return;
        const x = this.x - cx, y = this.y - cy + Math.sin(this.animTimer * 0.04) * 2;
        // Key head
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(x + 7, y + 6, 5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#B8860B';
        ctx.beginPath(); ctx.arc(x + 7, y + 6, 2.5, 0, Math.PI * 2); ctx.fill();
        // Key shaft
        ctx.fillStyle = '#FFD700';
        ctx.fillRect(x + 6, y + 10, 3, 8);
        ctx.fillRect(x + 9, y + 14, 3, 2);
        ctx.fillRect(x + 9, y + 17, 4, 2);
    }
}

export class Door extends Collectible {
    constructor(x, y) {
        super(x, y, TILE, TILE * 2);
        this.open = false;
    }
    tryOpen(player) {
        if (this.open) return false;
        if (player.keys > 0) {
            player.keys--;
            this.open = true;
            return true;
        }
        return false;
    }
    draw(ctx, cx, cy) {
        const x = this.x - cx, y = this.y - cy;
        if (this.open) {
            ctx.fillStyle = '#553311';
            ctx.fillRect(x, y, this.w, this.h);
            ctx.fillStyle = '#332200';
            ctx.fillRect(x + 4, y + 4, this.w - 8, this.h - 8);
            return;
        }
        ctx.fillStyle = '#8B5A2B';
        ctx.fillRect(x, y, this.w, this.h);
        ctx.fillStyle = '#6B3A1B';
        ctx.fillRect(x + 2, y + 2, this.w - 4, this.h - 4);
        // Planks
        ctx.strokeStyle = '#5B2A0B';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 4, y + 4, this.w / 2 - 5, this.h / 2 - 5);
        ctx.strokeRect(x + this.w / 2 + 1, y + 4, this.w / 2 - 5, this.h / 2 - 5);
        ctx.strokeRect(x + 4, y + this.h / 2 + 1, this.w - 8, this.h / 2 - 5);
        // Keyhole
        ctx.fillStyle = '#FFD700';
        ctx.beginPath(); ctx.arc(x + this.w / 2, y + this.h * 0.6, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillRect(x + this.w / 2 - 1.5, y + this.h * 0.6, 3, 6);
        // Handle
        ctx.fillStyle = '#DAA520';
        ctx.beginPath(); ctx.arc(x + this.w - 8, y + this.h * 0.5, 3, 0, Math.PI * 2); ctx.fill();
    }
    getBounds() { return this.open ? null : { x: this.x, y: this.y, w: this.w, h: this.h }; }
}
