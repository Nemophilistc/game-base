// ============================================================
// items.js - Keys, Torches, Power-ups
// ============================================================

import { CFG, POWERUP_TYPES } from './config.js';

export class Item {
    constructor(row, col, type) {
        this.row = row;
        this.col = col;
        this.type = type; // 'key', 'torch', 'speed', 'freeze', 'reveal'
        this.collected = false;
        this.bobTimer = Math.random() * Math.PI * 2;
        this.glowTimer = 0;
    }

    update(dt) {
        this.bobTimer += dt * 3;
        this.glowTimer += dt;
    }

    draw(ctx, cellSize) {
        if (this.collected) return;

        const px = (this.col + 0.5) * cellSize;
        const py = (this.row + 0.5) * cellSize;
        const bob = Math.sin(this.bobTimer) * 3;
        const r = CFG.ITEM_RADIUS * cellSize;

        let color, glowColor, symbol;
        switch (this.type) {
            case 'key':
                color = CFG.KEY_COLOR;
                glowColor = 'rgba(241, 196, 15, 0.25)';
                symbol = '🔑';
                break;
            case 'torch':
                color = CFG.TORCH_COLOR;
                glowColor = 'rgba(230, 126, 34, 0.25)';
                symbol = '🔥';
                break;
            case 'speed':
                color = CFG.SPEED_COLOR;
                glowColor = 'rgba(52, 152, 219, 0.25)';
                symbol = '⚡';
                break;
            case 'freeze':
                color = CFG.FREEZE_COLOR;
                glowColor = 'rgba(155, 89, 182, 0.25)';
                symbol = '❄';
                break;
            case 'reveal':
                color = CFG.REVEAL_COLOR;
                glowColor = 'rgba(26, 188, 156, 0.25)';
                symbol = '🗺';
                break;
            default:
                return;
        }

        // Glow
        const pulse = 0.7 + Math.sin(this.glowTimer * 2) * 0.3;
        const glow = ctx.createRadialGradient(px, py + bob, r * 0.3, px, py + bob, r * 2.2 * pulse);
        glow.addColorStop(0, glowColor);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(px, py + bob, r * 2.2 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Background circle
        ctx.beginPath();
        ctx.arc(px, py + bob, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Symbol
        ctx.font = `${r * 1.4}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText(symbol, px, py + bob + 1);
    }
}

export class ItemManager {
    constructor() {
        this.items = [];
    }

    spawn(maze, keyCount) {
        this.items = [];
        const occupied = new Set();
        occupied.add('0,0');
        occupied.add(`${maze.rows - 1},${maze.cols - 1}`);

        // Mark door positions as occupied
        for (const d of maze.doors) {
            occupied.add(`${d.row},${d.col}`);
        }

        const allCells = [];
        for (let r = 0; r < maze.rows; r++) {
            for (let c = 0; c < maze.cols; c++) {
                if (!occupied.has(`${r},${c}`)) {
                    allCells.push({ row: r, col: c });
                }
            }
        }

        // Shuffle
        for (let i = allCells.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [allCells[i], allCells[j]] = [allCells[j], allCells[i]];
        }

        let idx = 0;

        // Place keys (spread them out)
        const keyPositions = this._spreadPositions(allCells, keyCount, idx);
        for (const pos of keyPositions) {
            this.items.push(new Item(pos.row, pos.col, 'key'));
            occupied.add(`${pos.row},${pos.col}`);
        }
        idx += keyCount;

        // Place torches
        const torchCount = Math.max(2, Math.floor(keyCount * 0.6));
        const torchPositions = this._spreadPositions(allCells, torchCount, idx);
        for (const pos of torchPositions) {
            if (!occupied.has(`${pos.row},${pos.col}`)) {
                this.items.push(new Item(pos.row, pos.col, 'torch'));
                occupied.add(`${pos.row},${pos.col}`);
            }
        }
        idx += torchCount;

        // Place power-ups
        const powerupTypes = ['speed', 'freeze', 'reveal'];
        for (const type of powerupTypes) {
            const count = Math.max(1, Math.floor(maze.rows * maze.cols / 50));
            for (let i = 0; i < count; i++) {
                const posIdx = idx + i;
                if (posIdx < allCells.length) {
                    const pos = allCells[posIdx];
                    if (!occupied.has(`${pos.row},${pos.col}`)) {
                        this.items.push(new Item(pos.row, pos.col, type));
                        occupied.add(`${pos.row},${pos.col}`);
                    }
                }
            }
            idx += count;
        }
    }

    _spreadPositions(cells, count, startIdx) {
        const result = [];
        const available = cells.slice(startIdx);

        if (available.length === 0) return result;

        // Pick evenly spaced from shuffled array
        const step = Math.max(1, Math.floor(available.length / (count + 1)));
        for (let i = 0; i < count && i * step < available.length; i++) {
            result.push(available[i * step]);
        }

        return result;
    }

    update(dt) {
        for (const item of this.items) {
            item.update(dt);
        }
    }

    checkPickup(playerRow, playerCol) {
        const picked = [];
        for (const item of this.items) {
            if (!item.collected && item.row === playerRow && item.col === playerCol) {
                item.collected = true;
                picked.push(item.type);
            }
        }
        return picked;
    }

    draw(ctx, cellSize, revealedSet) {
        for (const item of this.items) {
            if (item.collected) continue;
            // Only draw if cell is revealed
            const key = `${item.row},${item.col}`;
            if (revealedSet && !revealedSet.has(key)) continue;
            item.draw(ctx, cellSize);
        }
    }
}
