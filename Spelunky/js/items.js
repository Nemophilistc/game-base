// items.js - Gold, gems, ropes, bombs, shop items
import { TILE, ITEM_VALUES, SHOP_ITEMS, T, COLORS } from './config.js';
import { Sound } from './sound.js';

export class Item {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.collected = false;
        this.w = ITEM_VALUES[type]?.w || 12;
        this.h = ITEM_VALUES[type]?.h || 12;
        this.bobOffset = Math.random() * Math.PI * 2;
        this.shimmer = 0;
    }

    update(dt) {
        this.shimmer += dt * 0.005;
    }

    getHitbox() {
        return {
            x: this.x - this.w / 2,
            y: this.y - this.h / 2,
            w: this.w,
            h: this.h
        };
    }

    render(ctx) {
        if (this.collected) return;

        const bob = Math.sin(Date.now() / 500 + this.bobOffset) * 2;
        const x = Math.round(this.x);
        const y = Math.round(this.y + bob);

        switch (this.type) {
            case 'gold_nugget':
                // Small gold nugget
                ctx.fillStyle = COLORS.gold;
                ctx.beginPath();
                ctx.moveTo(x - 5, y + 3);
                ctx.lineTo(x, y - 4);
                ctx.lineTo(x + 5, y + 2);
                ctx.lineTo(x + 3, y + 5);
                ctx.lineTo(x - 3, y + 5);
                ctx.closePath();
                ctx.fill();
                // Shine
                if (Math.sin(this.shimmer * 3) > 0.5) {
                    ctx.fillStyle = COLORS.goldShine;
                    ctx.fillRect(x - 1, y - 2, 2, 2);
                }
                break;

            case 'gold_bar':
                // Gold bar
                ctx.fillStyle = COLORS.gold;
                ctx.beginPath();
                ctx.moveTo(x - 8, y + 2);
                ctx.lineTo(x - 5, y - 5);
                ctx.lineTo(x + 5, y - 5);
                ctx.lineTo(x + 8, y + 2);
                ctx.lineTo(x + 8, y + 5);
                ctx.lineTo(x - 8, y + 5);
                ctx.closePath();
                ctx.fill();
                // Top face
                ctx.fillStyle = COLORS.goldShine;
                ctx.beginPath();
                ctx.moveTo(x - 5, y - 5);
                ctx.lineTo(x + 5, y - 5);
                ctx.lineTo(x + 2, y - 2);
                ctx.lineTo(x - 2, y - 2);
                ctx.closePath();
                ctx.fill();
                // Shine
                ctx.fillStyle = 'rgba(255,255,200,0.4)';
                ctx.fillRect(x - 4, y - 3, 3, 2);
                break;

            case 'gem_ruby':
                this._renderGem(ctx, x, y, COLORS.gemRuby);
                break;
            case 'gem_emerald':
                this._renderGem(ctx, x, y, COLORS.gemEmerald);
                break;
            case 'gem_sapphire':
                this._renderGem(ctx, x, y, COLORS.gemSapphire);
                break;

            case 'key':
                // Key
                ctx.fillStyle = COLORS.key;
                // Ring
                ctx.beginPath();
                ctx.arc(x - 3, y - 2, 4, 0, Math.PI * 2);
                ctx.fillStyle = COLORS.gold;
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x - 3, y - 2, 2, 0, Math.PI * 2);
                ctx.fillStyle = COLORS.bg;
                ctx.fill();
                // Shaft
                ctx.fillStyle = COLORS.gold;
                ctx.fillRect(x, y - 1, 8, 2);
                // Teeth
                ctx.fillRect(x + 6, y + 1, 2, 3);
                ctx.fillRect(x + 3, y + 1, 2, 2);
                // Shine
                ctx.fillStyle = COLORS.keyShine;
                ctx.fillRect(x - 4, y - 4, 2, 2);
                break;

            case 'rope_pickup':
                // Coil of rope
                ctx.fillStyle = COLORS.ropePickup;
                ctx.beginPath();
                ctx.arc(x, y, 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = COLORS.bg;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(x, y, 5, -0.5, 1.5);
                ctx.stroke();
                // Label
                ctx.fillStyle = COLORS.hudText;
                ctx.font = 'bold 7px monospace';
                ctx.fillText('R', x - 2, y + 3);
                break;

            case 'bomb_pickup':
                // Bomb
                ctx.fillStyle = COLORS.bomb;
                ctx.beginPath();
                ctx.arc(x, y + 1, 6, 0, Math.PI * 2);
                ctx.fill();
                // Fuse
                ctx.strokeStyle = COLORS.bombFuse;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(x + 3, y - 4);
                ctx.lineTo(x + 5, y - 8);
                ctx.stroke();
                // Label
                ctx.fillStyle = COLORS.hudText;
                ctx.font = 'bold 7px monospace';
                ctx.fillText('B', x - 2, y + 4);
                break;

            case 'health':
                // Heart
                ctx.fillStyle = COLORS.health;
                ctx.beginPath();
                ctx.arc(x - 3, y - 2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + 3, y - 2, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x - 7, y);
                ctx.lineTo(x, y + 7);
                ctx.lineTo(x + 7, y);
                ctx.fill();
                // Cross
                ctx.fillStyle = COLORS.healthCross;
                ctx.fillRect(x - 1, y - 3, 2, 6);
                ctx.fillRect(x - 3, y - 1, 6, 2);
                break;

            case 'chest':
                // Chest body
                ctx.fillStyle = COLORS.chest;
                ctx.fillRect(x - 10, y - 4, 20, 12);
                // Lid
                ctx.fillStyle = '#a07818';
                ctx.fillRect(x - 10, y - 8, 20, 5);
                // Bands
                ctx.fillStyle = COLORS.chestBand;
                ctx.fillRect(x - 10, y - 2, 20, 2);
                ctx.fillRect(x - 1, y - 8, 2, 12);
                // Lock
                ctx.fillStyle = COLORS.gold;
                ctx.beginPath();
                ctx.arc(x, y + 1, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#222';
                ctx.fillRect(x - 1, y, 2, 2);
                break;
        }
    }

    _renderGem(ctx, x, y, color) {
        // Diamond shape
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x + 6, y);
        ctx.lineTo(x, y + 6);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.fill();

        // Facets
        const darker = this._darkenColor(color, 0.7);
        ctx.fillStyle = darker;
        ctx.beginPath();
        ctx.moveTo(x, y - 6);
        ctx.lineTo(x, y);
        ctx.lineTo(x - 6, y);
        ctx.closePath();
        ctx.fill();

        // Shine
        ctx.fillStyle = COLORS.gemShine;
        ctx.globalAlpha = 0.4 + Math.sin(this.shimmer * 4) * 0.3;
        ctx.beginPath();
        ctx.moveTo(x - 2, y - 4);
        ctx.lineTo(x, y - 2);
        ctx.lineTo(x - 3, y - 1);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;

        // Sparkle
        if (Math.sin(this.shimmer * 2) > 0.8) {
            ctx.fillStyle = '#fff';
            ctx.fillRect(x - 1, y - 5, 1, 1);
        }
    }

    _darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgb(${Math.floor(r * factor)},${Math.floor(g * factor)},${Math.floor(b * factor)})`;
    }
}

export class ItemManager {
    constructor() {
        this.items = [];
        this.floatingTexts = [];
    }

    clear() {
        this.items = [];
        this.floatingTexts = [];
    }

    spawnFromLevel(level) {
        for (const i of level.items) {
            this.items.push(new Item(i.type, i.x, i.y));
        }
        // Add key
        this.items.push(new Item('key', level.keyPos.x, level.keyPos.y));
    }

    update(dt) {
        for (const item of this.items) {
            item.update(dt);
        }
        this.items = this.items.filter(i => !i.collected);

        // Update floating texts
        for (const ft of this.floatingTexts) {
            ft.y -= dt * 0.03;
            ft.life -= dt;
            ft.alpha = Math.max(0, ft.life / ft.maxLife);
        }
        this.floatingTexts = this.floatingTexts.filter(ft => ft.life > 0);
    }

    addFloatingText(x, y, text, color = COLORS.hudValue) {
        this.floatingTexts.push({
            x, y, text, color,
            life: 1200,
            maxLife: 1200,
            alpha: 1
        });
    }

    render(ctx) {
        for (const item of this.items) {
            item.render(ctx);
        }

        // Render floating texts
        for (const ft of this.floatingTexts) {
            ctx.globalAlpha = ft.alpha;
            ctx.fillStyle = ft.color;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, Math.round(ft.x), Math.round(ft.y));
            ctx.textAlign = 'left';
            ctx.globalAlpha = 1;
        }
    }
}

export class Shop {
    constructor(level, rng) {
        this.items = [];
        this.active = false;
        this.shopkeeper = null;
        this._generateShopItems(rng);
    }

    _generateShopItems(rng) {
        // Pick 3-4 random shop items
        const shuffled = [...SHOP_ITEMS].sort(() => rng.next() - 0.5);
        const count = 3 + (rng.next() > 0.5 ? 1 : 0);
        this.items = shuffled.slice(0, count).map((item, i) => ({
            ...item,
            x: 0,
            y: 0,
            purchased: false,
            index: i
        }));
    }

    placeInRoom(room, tileSize) {
        const startX = (room.x + 1) * tileSize;
        const baseY = (room.y + room.h - 2) * tileSize;
        for (let i = 0; i < this.items.length; i++) {
            this.items[i].x = startX + i * tileSize * 2.5 + tileSize;
            this.items[i].y = baseY;
        }
        this.shopkeeper = {
            x: startX + this.items.length * tileSize * 2.5 + tileSize,
            y: baseY,
            facing: -1,
            state: 'idle'
        };
    }

    render(ctx) {
        // Shop sign
        if (this.items.length > 0) {
            const signX = this.items[0].x - TILE;
            const signY = this.items[0].y - TILE * 2.5;

            ctx.fillStyle = '#4a3520';
            ctx.fillRect(signX - 30, signY, 60, 16);
            ctx.strokeStyle = COLORS.uiAccent;
            ctx.lineWidth = 1;
            ctx.strokeRect(signX - 30, signY, 60, 16);
            ctx.fillStyle = COLORS.gold;
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('商店', signX, signY + 12);
            ctx.textAlign = 'left';
        }

        // Render shop items with price tags
        for (const item of this.items) {
            if (item.purchased) continue;

            const x = Math.round(item.x);
            const y = Math.round(item.y);

            // Item display
            ctx.fillStyle = 'rgba(180,140,60,0.15)';
            ctx.fillRect(x - 14, y - 10, 28, 20);

            // Item icon
            this._renderShopItem(ctx, item, x, y);

            // Price tag
            ctx.fillStyle = COLORS.hudBg;
            ctx.fillRect(x - 16, y + 12, 32, 12);
            ctx.strokeStyle = COLORS.uiAccent;
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x - 16, y + 12, 32, 12);
            ctx.fillStyle = COLORS.gold;
            ctx.font = '8px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`$${item.cost}`, x, y + 21);
            ctx.textAlign = 'left';
        }

        // Shopkeeper
        if (this.shopkeeper) {
            const sx = Math.round(this.shopkeeper.x);
            const sy = Math.round(this.shopkeeper.y);

            // Body
            ctx.fillStyle = COLORS.shopkeeper;
            ctx.fillRect(sx - 6, sy + 6, 12, 14);
            // Head
            ctx.fillStyle = COLORS.playerSkin;
            ctx.fillRect(sx - 5, sy - 2, 10, 10);
            // Hat
            ctx.fillStyle = '#654';
            ctx.fillRect(sx - 6, sy - 4, 12, 4);
            ctx.fillRect(sx - 4, sy - 8, 8, 5);
            // Eyes
            ctx.fillStyle = '#222';
            ctx.fillRect(sx + this.shopkeeper.facing * 2 - 1, sy + 2, 2, 2);
            ctx.fillRect(sx + this.shopkeeper.facing * 2 + 2, sy + 2, 2, 2);
            // Shotgun
            ctx.fillStyle = COLORS.shopkeeperShotgun;
            ctx.fillRect(sx + this.shopkeeper.facing * 6, sy + 8, this.shopkeeper.facing * 12, 3);
        }
    }

    _renderShopItem(ctx, item, x, y) {
        switch (item.type) {
            case 'rope':
                ctx.fillStyle = COLORS.ropePickup;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.hudText;
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('R', x, y + 3);
                ctx.textAlign = 'left';
                break;
            case 'bomb':
                ctx.fillStyle = COLORS.bomb;
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = COLORS.hudText;
                ctx.font = 'bold 8px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('B', x, y + 3);
                ctx.textAlign = 'left';
                break;
            case 'health':
                ctx.fillStyle = COLORS.health;
                ctx.beginPath();
                ctx.arc(x - 2, y - 1, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(x + 2, y - 1, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.moveTo(x - 5, y);
                ctx.lineTo(x, y + 5);
                ctx.lineTo(x + 5, y);
                ctx.fill();
                break;
            case 'compass':
                ctx.fillStyle = '#888';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#cc3333';
                ctx.beginPath();
                ctx.moveTo(x, y - 3);
                ctx.lineTo(x + 1, y);
                ctx.lineTo(x, y + 3);
                ctx.lineTo(x - 1, y);
                ctx.closePath();
                ctx.fill();
                break;
            case 'gloves':
                ctx.fillStyle = '#8b6914';
                ctx.fillRect(x - 5, y - 4, 10, 8);
                ctx.fillStyle = '#a07818';
                ctx.fillRect(x - 3, y - 6, 6, 3);
                break;
            case 'shoes':
                ctx.fillStyle = '#cc3333';
                ctx.fillRect(x - 5, y - 3, 10, 7);
                ctx.fillStyle = '#aa2222';
                ctx.fillRect(x - 6, y + 2, 12, 3);
                break;
        }
    }

    tryBuy(item, player) {
        if (item.purchased) {
            Sound.shopDeny();
            return false;
        }
        if (player.gold < item.cost) {
            Sound.shopDeny();
            return false;
        }

        player.gold -= item.cost;
        item.purchased = true;
        Sound.shopBuy();

        switch (item.type) {
            case 'rope': player.ropes += item.amount; break;
            case 'bomb': player.bombs += item.amount; break;
            case 'health': player.heal(item.amount); break;
            case 'compass': player.hasCompass = true; break;
            case 'gloves': player.hasGloves = true; break;
            case 'shoes': player.hasShoes = true; break;
        }
        return true;
    }
}
