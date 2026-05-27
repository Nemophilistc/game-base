// level.js - Procedural level generation
import { TILE, COLS, ROWS, T, COLORS, TILE_COLORS } from './config.js';

// Seeded random
class RNG {
    constructor(seed) { this.seed = seed; }
    next() {
        this.seed = (this.seed * 16807 + 0) % 2147483647;
        return (this.seed - 1) / 2147483646;
    }
    int(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
    pick(arr) { return arr[this.int(0, arr.length - 1)]; }
    chance(p) { return this.next() < p; }
}

export { RNG };

export class Level {
    constructor(depth) {
        this.depth = depth;
        this.cols = COLS;
        this.rows = ROWS;
        this.tiles = [];
        this.enemies = [];
        this.items = [];
        this.traps = [];
        this.arrows = [];
        this.shopItems = [];
        this.playerStart = { x: 0, y: 0 };
        this.exitDoor = { x: 0, y: 0 };
        this.keyPos = { x: 0, y: 0 };
        this.hasKey = false;
        this.doorOpen = false;
        this.torchPositions = [];
        this.rooms = [];
        this.generate();
    }

    generate() {
        const rng = new RNG(Date.now() + this.depth * 7919);
        const grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(T.WALL));

        // Generate rooms using BSP
        const rooms = [];
        this._bspSplit(rooms, rng, 1, 1, this.cols - 2, this.rows - 2, 0);
        this.rooms = rooms;

        // Carve rooms
        for (const room of rooms) {
            for (let y = room.y; y < room.y + room.h; y++) {
                for (let x = room.x; x < room.x + room.w; x++) {
                    if (y >= 0 && y < this.rows && x >= 0 && x < this.cols) {
                        grid[y][x] = T.AIR;
                    }
                }
            }
        }

        // Connect rooms with corridors
        for (let i = 0; i < rooms.length - 1; i++) {
            const a = rooms[i];
            const b = rooms[i + 1];
            const ax = Math.floor(a.x + a.w / 2);
            const ay = Math.floor(a.y + a.h / 2);
            const bx = Math.floor(b.x + b.w / 2);
            const by = Math.floor(b.y + b.h / 2);
            this._carveCorridor(grid, rng, ax, ay, bx, by);
        }

        // Add platforms in larger rooms
        for (const room of rooms) {
            if (room.w >= 6 && room.h >= 5 && rng.chance(0.6)) {
                const py = room.y + Math.floor(room.h * 0.55);
                const px1 = room.x + 1;
                const px2 = room.x + room.w - 2;
                const gap = rng.int(2, 4);
                const mid = Math.floor((px1 + px2) / 2);
                for (let x = px1; x <= px2; x++) {
                    if (Math.abs(x - mid) > gap / 2 || rng.chance(0.3)) {
                        if (grid[py][x] === T.AIR) grid[py][x] = T.PLATFORM;
                    }
                }
            }
        }

        // Add ladders connecting vertically
        for (let i = 0; i < rooms.length - 1; i++) {
            const a = rooms[i];
            const b = rooms[i + 1];
            const ay2 = a.y + a.h - 1;
            const by2 = b.y;
            if (ay2 < by2 && rng.chance(0.5)) {
                const lx = rng.int(a.x + 1, a.x + a.w - 2);
                for (let y = ay2; y <= by2; y++) {
                    if (y >= 0 && y < this.rows && lx >= 0 && lx < this.cols) {
                        if (grid[y][lx] === T.WALL) grid[y][lx] = T.LADDER;
                        else if (grid[y][lx] === T.AIR) grid[y][lx] = T.LADDER;
                    }
                }
            }
        }

        // Place player start in top room
        const topRoom = rooms.reduce((a, b) => a.y < b.y ? a : b);
        this.playerStart = {
            x: (topRoom.x + Math.floor(topRoom.w / 2)) * TILE + TILE / 2,
            y: (topRoom.y + 1) * TILE
        };

        // Place exit in bottom room
        const bottomRoom = rooms.reduce((a, b) => a.y > b.y ? a : b);
        this.exitDoor = {
            x: (bottomRoom.x + Math.floor(bottomRoom.w / 2)) * TILE,
            y: (bottomRoom.y + bottomRoom.h - 2) * TILE
        };
        const ex = Math.floor(this.exitDoor.x / TILE);
        const ey = Math.floor(this.exitDoor.y / TILE);
        if (ey >= 0 && ey < this.rows && ex >= 0 && ex < this.cols) {
            grid[ey][ex] = T.EXIT_DOOR;
            grid[ey + 1][ex] = T.AIR;
            // Place solid under door
            if (ey + 2 < this.rows) grid[ey + 2][ex] = T.PLATFORM;
        }

        // Place key in a room far from exit
        const farRooms = rooms.filter(r => {
            const ry = r.y + r.h / 2;
            return ry < this.rows * 0.6;
        });
        const keyRoom = farRooms.length > 0 ? rng.pick(farRooms) : rng.pick(rooms);
        this.keyPos = {
            x: (keyRoom.x + rng.int(1, keyRoom.w - 2)) * TILE + TILE / 2,
            y: (keyRoom.y + rng.int(1, keyRoom.h - 2)) * TILE + TILE / 2
        };

        // Place enemies
        const enemyRooms = rooms.filter(r => r !== topRoom);
        for (const room of enemyRooms) {
            const count = Math.min(3, 1 + Math.floor(this.depth * 0.3) + (rng.chance(0.3) ? 1 : 0));
            for (let i = 0; i < count; i++) {
                const types = ['bat', 'snake', 'spider', 'skeleton'];
                const weights = [0.35, 0.3, 0.2, 0.15 + this.depth * 0.02];
                let r = rng.next(), acc = 0, type = 'bat';
                for (let j = 0; j < types.length; j++) {
                    acc += weights[j];
                    if (r < acc) { type = types[j]; break; }
                }
                const ex = (room.x + rng.int(1, room.w - 2)) * TILE;
                const ey = (room.y + rng.int(1, room.h - 2)) * TILE;
                this.enemies.push({ type, x: ex + TILE / 2, y: ey });
            }
        }

        // Place items
        for (const room of enemyRooms) {
            // Gold
            if (rng.chance(0.7)) {
                const ix = (room.x + rng.int(1, room.w - 2)) * TILE + TILE / 2;
                const iy = (room.y + room.h - 2) * TILE + TILE / 2;
                const types = ['gold_nugget', 'gold_nugget', 'gold_nugget', 'gold_bar'];
                this.items.push({ type: rng.pick(types), x: ix, y: iy });
            }
            // Gems
            if (rng.chance(0.2 + this.depth * 0.03)) {
                const ix = (room.x + rng.int(1, room.w - 2)) * TILE + TILE / 2;
                const iy = (room.y + rng.int(1, room.h - 3)) * TILE + TILE / 2;
                const gems = ['gem_ruby', 'gem_emerald', 'gem_sapphire'];
                this.items.push({ type: rng.pick(gems), x: ix, y: iy });
            }
        }

        // Place rope/bomb pickups
        const supplyCount = 1 + Math.floor(rng.next() * 2);
        for (let i = 0; i < supplyCount; i++) {
            const room = rng.pick(rooms);
            const ix = (room.x + rng.int(1, room.w - 2)) * TILE + TILE / 2;
            const iy = (room.y + room.h - 2) * TILE + TILE / 2;
            this.items.push({ type: rng.chance(0.5) ? 'rope_pickup' : 'bomb_pickup', x: ix, y: iy });
        }

        // Health pickup
        if (rng.chance(0.3)) {
            const room = rng.pick(rooms);
            const ix = (room.x + rng.int(1, room.w - 2)) * TILE + TILE / 2;
            const iy = (room.y + room.h - 2) * TILE + TILE / 2;
            this.items.push({ type: 'health', x: ix, y: iy });
        }

        // Chest
        if (rng.chance(0.15 + this.depth * 0.02)) {
            const room = rng.pick(rooms);
            const ix = (room.x + rng.int(1, room.w - 2)) * TILE + TILE / 2;
            const iy = (room.y + room.h - 2) * TILE + TILE / 2;
            this.items.push({ type: 'chest', x: ix, y: iy });
        }

        // Place traps
        for (const room of rooms) {
            // Spike pits
            if (room.w >= 5 && rng.chance(0.25)) {
                const sy = room.y + room.h - 1;
                const sx = room.x + rng.int(1, room.w - 3);
                const sw = rng.int(2, 3);
                for (let x = sx; x < sx + sw && x < this.cols; x++) {
                    if (grid[sy][x] === T.AIR) {
                        grid[sy][x] = T.SPIKE;
                    }
                }
            }
            // Arrow traps
            if (rng.chance(0.15 + this.depth * 0.02)) {
                const side = rng.chance(0.5) ? 'left' : 'right';
                const ay = room.y + rng.int(1, room.h - 2);
                let ax;
                if (side === 'left') {
                    ax = room.x;
                    while (ax < room.x + room.w - 1 && grid[ay][ax] !== T.WALL) ax++;
                    if (ax > room.x) ax = room.x;
                } else {
                    ax = room.x + room.w - 1;
                    while (ax > room.x && grid[ay][ax] !== T.WALL) ax--;
                    if (ax < room.x + room.w - 1) ax = room.x + room.w - 1;
                }
                if (ax >= 0 && ax < this.cols && ay >= 0 && ay < this.rows) {
                    grid[ay][ax] = T.ARROW_TRAP;
                    this.traps.push({ type: 'arrow', x: ax * TILE, y: ay * TILE, dir: side === 'left' ? 1 : -1, fired: false });
                }
            }
        }

        // Place torches (decorative)
        for (const room of rooms) {
            if (rng.chance(0.5)) {
                const tx = room.x + rng.int(0, room.w - 1);
                const ty = room.y;
                if (grid[ty][tx] === T.WALL) {
                    this.torchPositions.push({ x: tx * TILE + TILE / 2, y: ty * TILE + TILE });
                }
            }
        }

        // Cracked walls (bombable)
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (grid[y][x] === T.WALL && rng.chance(0.04)) {
                    // Check if wall has air on at least one side
                    const hasAir = (
                        (x > 0 && grid[y][x - 1] === T.AIR) ||
                        (x < this.cols - 1 && grid[y][x + 1] === T.AIR) ||
                        (y > 0 && grid[y - 1][x] === T.AIR) ||
                        (y < this.rows - 1 && grid[y + 1][x] === T.AIR)
                    );
                    if (hasAir) grid[y][x] = T.CRACKED_WALL;
                }
            }
        }

        // Diversify wall types
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                if (grid[y][x] === T.WALL) {
                    const r = rng.next();
                    if (r < 0.1) grid[y][x] = T.STONE;
                    else if (r < 0.18) grid[y][x] = T.MOSS_WALL;
                    else if (r < 0.24) grid[y][x] = T.DIRT;
                }
            }
        }

        this.tiles = grid;
    }

    _bspSplit(rooms, rng, x, y, w, h, depth) {
        const MIN_SIZE = 5;
        const MAX_DEPTH = 5;

        if (depth >= MAX_DEPTH || (w < MIN_SIZE * 2 && h < MIN_SIZE * 2)) {
            const rw = rng.int(Math.min(w, MIN_SIZE + 2), w);
            const rh = rng.int(Math.min(h, MIN_SIZE + 1), h);
            const rx = x + rng.int(0, w - rw);
            const ry = y + rng.int(0, h - rh);
            rooms.push({ x: rx, y: ry, w: rw, h: rh });
            return;
        }

        const splitH = h > w ? true : w > h ? false : rng.chance(0.5);

        if (splitH && h >= MIN_SIZE * 2) {
            const split = rng.int(MIN_SIZE, h - MIN_SIZE);
            this._bspSplit(rooms, rng, x, y, w, split, depth + 1);
            this._bspSplit(rooms, rng, x, y + split, w, h - split, depth + 1);
        } else if (w >= MIN_SIZE * 2) {
            const split = rng.int(MIN_SIZE, w - MIN_SIZE);
            this._bspSplit(rooms, rng, x, y, split, h, depth + 1);
            this._bspSplit(rooms, rng, x + split, y, w - split, h, depth + 1);
        } else {
            const rw = rng.int(Math.max(3, w - 2), w);
            const rh = rng.int(Math.max(3, h - 2), h);
            const rx = x + rng.int(0, Math.max(0, w - rw));
            const ry = y + rng.int(0, Math.max(0, h - rh));
            rooms.push({ x: rx, y: ry, w: rw, h: rh });
        }
    }

    _carveCorridor(grid, rng, x1, y1, x2, y2) {
        let cx = x1, cy = y1;
        while (cx !== x2 || cy !== y2) {
            if (cx >= 0 && cx < this.cols && cy >= 0 && cy < this.rows) {
                grid[cy][cx] = T.AIR;
                // Widen corridor sometimes
                if (rng.chance(0.3) && cy + 1 < this.rows) grid[cy + 1][cx] = T.AIR;
            }
            if (rng.chance(0.5)) {
                if (cx < x2) cx++;
                else if (cx > x2) cx--;
                else if (cy < y2) cy++;
                else cy--;
            } else {
                if (cy < y2) cy++;
                else if (cy > y2) cy--;
                else if (cx < x2) cx++;
                else cx--;
            }
        }
    }

    getTile(x, y) {
        const col = Math.floor(x / TILE);
        const row = Math.floor(y / TILE);
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return T.WALL;
        return this.tiles[row][col];
    }

    setTile(col, row, type) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            this.tiles[row][col] = type;
        }
    }

    isSolid(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return true;
        const t = this.tiles[row][col];
        return t === T.WALL || t === T.STONE || t === T.MOSS_WALL || t === T.DIRT ||
               t === T.CRACKED_WALL || t === T.SHOP_WALL;
    }

    isPlatform(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.tiles[row][col] === T.PLATFORM || this.tiles[row][col] === T.SHOP_FLOOR;
    }

    isLadder(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.tiles[row][col] === T.LADDER;
    }

    isSpike(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.tiles[row][col] === T.SPIKE;
    }

    isDoor(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.tiles[row][col] === T.EXIT_DOOR;
    }

    isCracked(col, row) {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) return false;
        return this.tiles[row][col] === T.CRACKED_WALL;
    }

    destroyTile(col, row) {
        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const t = this.tiles[row][col];
            if (t === T.CRACKED_WALL || t === T.DIRT || t === T.MOSS_WALL) {
                this.tiles[row][col] = T.AIR;
                return true;
            }
            if (t === T.WALL) {
                this.tiles[row][col] = T.CRACKED_WALL;
                return false;
            }
        }
        return false;
    }

    destroyRadius(cx, cy, radius) {
        const col = Math.floor(cx / TILE);
        const row = Math.floor(cy / TILE);
        const destroyed = [];
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx * dx + dy * dy <= radius * radius) {
                    const c = col + dx;
                    const r = row + dy;
                    if (this.destroyTile(c, r)) {
                        destroyed.push({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 });
                    }
                }
            }
        }
        return destroyed;
    }

    render(ctx, camX, camY, viewW, viewH) {
        const startCol = Math.max(0, Math.floor(camX / TILE) - 1);
        const endCol = Math.min(this.cols, Math.ceil((camX + viewW) / TILE) + 1);
        const startRow = Math.max(0, Math.floor(camY / TILE) - 1);
        const endRow = Math.min(this.rows, Math.ceil((camY + viewH) / TILE) + 1);

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const t = this.tiles[row][col];
                const x = col * TILE;
                const y = row * TILE;

                if (t === T.AIR) continue;

                const colors = TILE_COLORS[t];
                if (!colors) continue;

                // Base fill
                ctx.fillStyle = colors[0];
                ctx.fillRect(x, y, TILE, TILE);

                // Texture
                if (t === T.WALL || t === T.STONE || t === T.DIRT || t === T.MOSS_WALL || t === T.CRACKED_WALL) {
                    // Brick pattern
                    ctx.fillStyle = colors[1] || colors[0];
                    ctx.fillRect(x, y, TILE, 1);
                    ctx.fillRect(x, y + TILE / 2, TILE, 1);
                    if (row % 2 === 0) {
                        ctx.fillRect(x + TILE / 2, y, 1, TILE / 2);
                        ctx.fillRect(x, y + TILE / 2, 1, TILE / 2);
                    } else {
                        ctx.fillRect(x, y, 1, TILE / 2);
                        ctx.fillRect(x + TILE / 2, y + TILE / 2, 1, TILE / 2);
                    }
                    // Random dots for texture
                    if (colors[2]) {
                        ctx.fillStyle = colors[2];
                        const seed = (col * 31 + row * 17) % 7;
                        if (seed < 2) {
                            ctx.fillRect(x + 8 + seed * 3, y + 10, 3, 3);
                        }
                    }
                    // Cracked wall cracks
                    if (t === T.CRACKED_WALL) {
                        ctx.strokeStyle = '#2a1a0a';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(x + 5, y + 5);
                        ctx.lineTo(x + 15, y + 18);
                        ctx.lineTo(x + 25, y + 12);
                        ctx.stroke();
                        ctx.beginPath();
                        ctx.moveTo(x + 20, y + 4);
                        ctx.lineTo(x + 12, y + 20);
                        ctx.lineTo(x + 22, y + 28);
                        ctx.stroke();
                    }
                    // Moss overlay
                    if (t === T.MOSS_WALL) {
                        ctx.fillStyle = 'rgba(50,120,40,0.3)';
                        ctx.fillRect(x, y + TILE - 6, TILE, 6);
                    }
                }

                // Platform
                if (t === T.PLATFORM || t === T.SHOP_FLOOR) {
                    ctx.fillStyle = colors[1] || colors[0];
                    ctx.fillRect(x, y, TILE, 3);
                    // Support posts
                    ctx.fillStyle = colors[0];
                    ctx.fillRect(x + 4, y + 3, 3, TILE - 3);
                    ctx.fillRect(x + TILE - 7, y + 3, 3, TILE - 3);
                }

                // Ladder
                if (t === T.LADDER) {
                    ctx.fillStyle = COLORS.bg || '#1a0e05';
                    ctx.fillRect(x, y, TILE, TILE);
                    ctx.fillStyle = colors[0];
                    ctx.fillRect(x + 8, y, 4, TILE);
                    ctx.fillRect(x + 20, y, 4, TILE);
                    for (let ry = 4; ry < TILE; ry += 8) {
                        ctx.fillRect(x + 8, y + ry, 16, 3);
                    }
                }

                // Spikes
                if (t === T.SPIKE) {
                    ctx.fillStyle = COLORS.bg || '#1a0e05';
                    ctx.fillRect(x, y, TILE, TILE);
                    ctx.fillStyle = colors[0];
                    for (let sx = 0; sx < TILE; sx += 8) {
                        ctx.beginPath();
                        ctx.moveTo(x + sx, y + TILE);
                        ctx.lineTo(x + sx + 4, y + 8);
                        ctx.lineTo(x + sx + 8, y + TILE);
                        ctx.fill();
                    }
                    ctx.fillStyle = colors[1] || '#e0e0e0';
                    for (let sx = 0; sx < TILE; sx += 8) {
                        ctx.beginPath();
                        ctx.moveTo(x + sx + 2, y + TILE - 4);
                        ctx.lineTo(x + sx + 4, y + 10);
                        ctx.lineTo(x + sx + 6, y + TILE - 4);
                        ctx.fill();
                    }
                }

                // Arrow trap
                if (t === T.ARROW_TRAP) {
                    ctx.fillStyle = colors[0];
                    ctx.fillRect(x, y, TILE, TILE);
                    ctx.fillStyle = colors[1];
                    ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
                    // Small hole
                    ctx.fillStyle = '#222';
                    ctx.fillRect(x + 12, y + 12, 8, 8);
                }

                // Exit door
                if (t === T.EXIT_DOOR) {
                    ctx.fillStyle = COLORS.bg || '#1a0e05';
                    ctx.fillRect(x, y, TILE, TILE);
                    // Door frame
                    ctx.fillStyle = COLORS.doorFrame;
                    ctx.fillRect(x + 2, y, TILE - 4, TILE);
                    // Door body
                    ctx.fillStyle = this.doorOpen ? '#4a2a10' : COLORS.door;
                    ctx.fillRect(x + 5, y + 3, TILE - 10, TILE - 3);
                    // Planks
                    ctx.strokeStyle = '#3a1a08';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + TILE / 2, y + 3);
                    ctx.lineTo(x + TILE / 2, y + TILE);
                    ctx.stroke();
                    // Door knob
                    ctx.fillStyle = COLORS.doorKnob;
                    ctx.beginPath();
                    ctx.arc(x + TILE / 2 + 6, y + TILE / 2 + 3, 3, 0, Math.PI * 2);
                    ctx.fill();
                    // Glow when open
                    if (this.doorOpen) {
                        ctx.fillStyle = COLORS.doorGlow;
                        ctx.fillRect(x - 4, y - 4, TILE + 8, TILE + 8);
                    }
                }

                // Shop wall
                if (t === T.SHOP_WALL) {
                    ctx.fillStyle = colors[0];
                    ctx.fillRect(x, y, TILE, TILE);
                    ctx.fillStyle = colors[1];
                    ctx.fillRect(x, y, TILE, 2);
                    ctx.fillRect(x, y + TILE - 2, TILE, 2);
                }
            }
        }

        // Render torches
        const time = Date.now() / 1000;
        for (const torch of this.torchPositions) {
            if (torch.x < camX - 50 || torch.x > camX + viewW + 50) continue;
            if (torch.y < camY - 50 || torch.y > camY + viewH + 50) continue;

            // Glow
            const flicker = 0.8 + Math.sin(time * 8 + torch.x) * 0.2;
            const grad = ctx.createRadialGradient(torch.x, torch.y, 0, torch.x, torch.y, 80 * flicker);
            grad.addColorStop(0, 'rgba(255,150,50,0.12)');
            grad.addColorStop(1, 'rgba(255,150,50,0)');
            ctx.fillStyle = grad;
            ctx.fillRect(torch.x - 80, torch.y - 80, 160, 160);

            // Flame
            ctx.fillStyle = '#ff8800';
            ctx.beginPath();
            ctx.moveTo(torch.x - 4, torch.y);
            ctx.quadraticCurveTo(torch.x, torch.y - 10 - Math.sin(time * 12) * 3, torch.x + 4, torch.y);
            ctx.fill();
            ctx.fillStyle = '#ffcc00';
            ctx.beginPath();
            ctx.moveTo(torch.x - 2, torch.y);
            ctx.quadraticCurveTo(torch.x, torch.y - 6 - Math.sin(time * 15) * 2, torch.x + 2, torch.y);
            ctx.fill();

            // Bracket
            ctx.fillStyle = '#666';
            ctx.fillRect(torch.x - 1, torch.y, 2, 6);
        }
    }
}
