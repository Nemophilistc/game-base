// level.js - Level system with procedural generation
import { TILE, T, WORLDS, W, H } from './config.js';
import { PatrolEnemy, FlyingEnemy, BouncingEnemy, TurretEnemy } from './enemies.js';
import { Star, Coin, Key, Door } from './collectibles.js';

// Seeded random
function mulberry32(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

export class Level {
    constructor(worldIdx, levelIdx) {
        this.worldIdx = worldIdx;
        this.levelIdx = levelIdx;
        this.world = WORLDS[worldIdx];
        this.enemies = [];
        this.collectibles = [];
        this.movingPlatforms = [];
        this.lavaY = -1; // For lava world rising lava
        this.lavaSpeed = 0;
        this.playerSpawn = { x: 0, y: 0 };
        this.goal = { x: 0, y: 0 };
        this.door = null;
        this.tiles = [];
        this.cols = 0;
        this.rows = 0;
        this._generate();
    }

    _generate() {
        const world = this.worldIdx;
        const lvl = this.levelIdx;
        const diff = world * 5 + lvl; // 0-19
        const rng = mulberry32(world * 1000 + lvl * 137 + 42);

        const cols = 50 + diff * 3;
        const rows = 18;
        this.cols = cols; this.rows = rows;

        // Initialize empty grid
        const grid = Array.from({ length: rows }, () => new Uint8Array(cols));

        // Ground: bottom 3 rows
        for (let x = 0; x < cols; x++) {
            for (let y = rows - 3; y < rows; y++) grid[y][x] = T.SOLID;
        }

        // Terrain variation: raise/lower ground
        let groundLevel = rows - 3;
        for (let x = 0; x < cols; x++) {
            if (rng() < 0.15 && x > 4 && x < cols - 4) {
                groundLevel += rng() < 0.5 ? -1 : 1;
                groundLevel = Math.max(rows - 6, Math.min(rows - 2, groundLevel));
            }
            for (let y = groundLevel; y < rows; y++) grid[y][x] = T.SOLID;
        }

        // Add gaps (require jumps)
        const numGaps = 3 + Math.floor(diff * 0.5);
        for (let i = 0; i < numGaps; i++) {
            const gx = 8 + Math.floor(rng() * (cols - 16));
            const gw = 2 + Math.floor(rng() * Math.min(3, 1 + diff * 0.15));
            for (let x = gx; x < Math.min(gx + gw, cols - 2); x++) {
                for (let y = 0; y < rows; y++) grid[y][x] = T.AIR;
            }
            // Add spikes at bottom of some gaps
            if (rng() < 0.4 + diff * 0.02) {
                for (let x = gx; x < Math.min(gx + gw, cols - 2); x++) {
                    grid[rows - 1][x] = T.SPIKE;
                }
            }
        }

        // Add platforms over gaps
        for (let x = 6; x < cols - 6; x++) {
            if (grid[rows - 1][x] === T.AIR && grid[rows - 1][x - 1] === T.SOLID) {
                // Gap start - add platform above
                let gapEnd = x;
                while (gapEnd < cols && grid[rows - 1][gapEnd] === T.AIR) gapEnd++;
                const px = x;
                const py = rows - 5 - Math.floor(rng() * 2);
                for (let j = 0; j < gapEnd - x; j++) {
                    if (px + j < cols) grid[py][px + j] = T.PLATFORM;
                }
            }
        }

        // Add floating platforms
        const numPlats = 5 + Math.floor(diff * 0.4);
        for (let i = 0; i < numPlats; i++) {
            const pw = 3 + Math.floor(rng() * 4);
            const px = 4 + Math.floor(rng() * (cols - pw - 8));
            const py = 4 + Math.floor(rng() * (rows - 8));
            let blocked = false;
            for (let dx = 0; dx < pw; dx++) {
                if (grid[py][px + dx] !== T.AIR) { blocked = true; break; }
            }
            if (!blocked) {
                for (let dx = 0; dx < pw; dx++) grid[py][px + dx] = T.PLATFORM;
            }
        }

        // Add walls for wall-jumping sections
        const numWalls = 2 + Math.floor(diff * 0.3);
        for (let i = 0; i < numWalls; i++) {
            const wx = 6 + Math.floor(rng() * (cols - 12));
            const wh = 3 + Math.floor(rng() * 4);
            const wy = rows - 3 - wh;
            for (let dy = 0; dy < wh; dy++) {
                if (wy + dy >= 0 && wy + dy < rows) grid[wy + dy][wx] = T.SOLID;
            }
        }

        // World-specific tiles
        if (world === 1) { // Desert: sand tiles
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    if (grid[y][x] === T.SOLID && rng() < 0.3) grid[y][x] = T.SAND;
                }
            }
        } else if (world === 2) { // Ice: ice tiles
            for (let x = 0; x < cols; x++) {
                for (let y = 0; y < rows; y++) {
                    if (grid[y][x] === T.SOLID && y < rows - 3 && rng() < 0.4) grid[y][x] = T.ICE;
                }
            }
        } else if (world === 3) { // Lava: hazard tiles at bottom
            for (let x = 0; x < cols; x++) {
                if (grid[rows - 1][x] === T.SPIKE) grid[rows - 1][x] = T.HAZARD;
            }
        }

        // Additional spikes/hazards
        const numHazards = 2 + Math.floor(diff * 0.3);
        for (let i = 0; i < numHazards; i++) {
            const hx = 8 + Math.floor(rng() * (cols - 16));
            const hy = rows - 4 - Math.floor(rng() * 3);
            if (grid[hy][hx] === T.AIR) {
                grid[hy][hx] = world === 3 ? T.HAZARD : T.SPIKE;
            }
        }

        this.tiles = grid;

        // Player spawn (left side)
        this.playerSpawn = { x: 3 * TILE, y: 0 };
        for (let y = 0; y < rows; y++) {
            if (grid[y][3] === T.SOLID) { this.playerSpawn.y = (y - 1) * TILE - 28; break; }
        }

        // Goal (right side)
        this.goal = { x: (cols - 4) * TILE, y: 0 };
        for (let y = 0; y < rows; y++) {
            if (grid[y][cols - 4] === T.SOLID) { this.goal.y = (y - 1) * TILE - 32; break; }
        }

        // Moving platforms (grass world feature, but available in all)
        const numMP = world === 0 ? 3 + lvl : Math.floor(1 + diff * 0.2);
        for (let i = 0; i < numMP; i++) {
            const mx = 10 + Math.floor(rng() * (cols - 20));
            const my = 5 + Math.floor(rng() * (rows - 10));
            const horizontal = rng() < 0.7;
            const dist = 60 + Math.floor(rng() * 100);
            const mp = {
                x: mx * TILE, y: my * TILE,
                w: 3 * TILE, h: 8,
                x1: mx * TILE, y1: my * TILE,
                x2: horizontal ? mx * TILE + dist : mx * TILE,
                y2: horizontal ? my * TILE : my * TILE - dist,
                speed: 0.8 + rng() * 0.6,
                t: 0, vx: 0, vy: 0,
                px: mx * TILE, py: my * TILE,
            };
            this.movingPlatforms.push(mp);
        }

        // Enemies
        const enemyTypes = [PatrolEnemy, FlyingEnemy, BouncingEnemy, TurretEnemy];
        const numEnemies = 3 + Math.floor(diff * 0.6);
        for (let i = 0; i < numEnemies; i++) {
            const etype = Math.floor(rng() * Math.min(1 + world, 4));
            const ex = 12 + Math.floor(rng() * (cols - 16));
            let ey = 0;
            for (let y = 0; y < rows; y++) {
                if (grid[y][ex] === T.SOLID) { ey = (y - 1) * TILE; break; }
            }
            if (etype === 0) this.enemies.push(new PatrolEnemy(ex * TILE, ey, 60 + rng() * 80));
            else if (etype === 1) this.enemies.push(new FlyingEnemy(ex * TILE, ey - 80 - rng() * 60));
            else if (etype === 2) this.enemies.push(new BouncingEnemy(ex * TILE, ey - 20));
            else this.enemies.push(new TurretEnemy(ex * TILE, ey - 24));
        }

        // Collectibles - Coins along the path
        const numCoins = 10 + diff * 2;
        for (let i = 0; i < numCoins; i++) {
            const cx = 5 + Math.floor(rng() * (cols - 10));
            let cy = 0;
            for (let y = 0; y < rows - 1; y++) {
                if (grid[y + 1][cx] === T.SOLID && grid[y][cx] === T.AIR) { cy = y; break; }
            }
            this.collectibles.push(new Coin(cx * TILE + 8, cy * TILE + 4));
        }

        // Stars - 3 per level, in hard-to-reach places
        for (let i = 0; i < 3; i++) {
            let sx, sy;
            let attempts = 0;
            do {
                sx = 10 + Math.floor(rng() * (cols - 20));
                sy = 2 + Math.floor(rng() * (rows - 8));
                attempts++;
            } while (attempts < 50 && grid[sy][sx] !== T.AIR);
            if (grid[sy][sx] === T.AIR) {
                this.collectibles.push(new Star(sx * TILE + 6, sy * TILE + 6, i));
            }
        }

        // Key and door (every few levels)
        if (lvl % 2 === 0) {
            const kx = 10 + Math.floor(rng() * (cols / 2));
            let ky = 0;
            for (let y = 0; y < rows - 1; y++) {
                if (grid[y + 1][kx] === T.SOLID && grid[y][kx] === T.AIR) { ky = y; break; }
            }
            this.collectibles.push(new Key(kx * TILE, ky * TILE));

            const dx = Math.floor(cols / 2) + Math.floor(rng() * (cols / 4));
            let dy = 0;
            for (let y = 0; y < rows - 2; y++) {
                if (grid[y + 2][dx] === T.SOLID && grid[y][dx] === T.AIR) { dy = y; break; }
            }
            this.door = new Door(dx * TILE, dy * TILE);
            this.collectibles.push(this.door);
        }

        // Rising lava for lava world
        if (world === 3) {
            this.lavaY = rows * TILE + 100;
            this.lavaSpeed = 0.15 + lvl * 0.05;
        }
    }

    getTile(x, y) {
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return T.AIR;
        return this.tiles[y][x];
    }

    updateMovingPlatforms() {
        for (const mp of this.movingPlatforms) {
            mp.t += mp.speed * 0.01;
            const s = (Math.sin(mp.t) + 1) / 2;
            const newX = mp.x1 + (mp.x2 - mp.x1) * s;
            const newY = mp.y1 + (mp.y2 - mp.y1) * s;
            mp.vx = newX - mp.x;
            mp.vy = newY - mp.y;
            mp.px = mp.x; mp.py = mp.y;
            mp.x = newX; mp.y = newY;
        }
    }

    updateLava() {
        if (this.worldIdx === 3 && this.lavaY > 0) {
            this.lavaY -= this.lavaSpeed;
        }
    }

    drawBackground(ctx, camX, camY) {
        const w = this.world;
        // Sky gradient
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, w.bg[0]);
        grad.addColorStop(1, w.bg[1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Parallax layer 3 (far)
        ctx.fillStyle = w.bg3;
        for (let i = 0; i < 8; i++) {
            const bx = (i * 200 - camX * 0.1) % (W + 200) - 100;
            ctx.beginPath();
            ctx.moveTo(bx, H); ctx.lineTo(bx + 40, H - 120 - (i % 3) * 40);
            ctx.lineTo(bx + 80, H); ctx.fill();
        }

        // Parallax layer 2 (mid)
        ctx.fillStyle = w.bg2;
        for (let i = 0; i < 10; i++) {
            const bx = (i * 150 - camX * 0.3) % (W + 150) - 75;
            ctx.beginPath();
            ctx.moveTo(bx, H); ctx.lineTo(bx + 30, H - 70 - (i % 3) * 25);
            ctx.lineTo(bx + 60, H); ctx.fill();
        }

        // Parallax layer 1 (near)
        ctx.fillStyle = w.bg1;
        for (let i = 0; i < 12; i++) {
            const bx = (i * 120 - camX * 0.5) % (W + 120) - 60;
            ctx.beginPath();
            ctx.moveTo(bx, H); ctx.lineTo(bx + 20, H - 40 - (i % 2) * 15);
            ctx.lineTo(bx + 40, H); ctx.fill();
        }
    }

    drawTiles(ctx, camX, camY) {
        const startCol = Math.max(0, Math.floor(camX / TILE));
        const endCol = Math.min(this.cols, Math.ceil((camX + W) / TILE) + 1);
        const startRow = Math.max(0, Math.floor(camY / TILE));
        const endRow = Math.min(this.rows, Math.ceil((camY + H) / TILE) + 1);

        for (let y = startRow; y < endRow; y++) {
            for (let x = startCol; x < endCol; x++) {
                const t = this.tiles[y][x];
                const px = x * TILE - camX;
                const py = y * TILE - camY;

                if (t === T.SOLID) {
                    const above = y > 0 && this.tiles[y - 1][x] !== T.SOLID && this.tiles[y - 1][x] !== T.ICE && this.tiles[y - 1][x] !== T.SAND;
                    ctx.fillStyle = above ? this.world.tile.top : this.world.tile.body;
                    ctx.fillRect(px, py, TILE, TILE);
                    if (above) {
                        ctx.fillStyle = this.world.tile.topH;
                        ctx.fillRect(px, py, TILE, 4);
                    }
                } else if (t === T.PLATFORM) {
                    ctx.fillStyle = this.world.plat.top;
                    ctx.fillRect(px, py, TILE, 6);
                    ctx.fillStyle = this.world.plat.body;
                    ctx.fillRect(px, py + 6, TILE, 4);
                } else if (t === T.SPIKE) {
                    ctx.fillStyle = this.world.spike;
                    for (let s = 0; s < 3; s++) {
                        ctx.beginPath();
                        ctx.moveTo(px + s * 11, py + TILE);
                        ctx.lineTo(px + s * 11 + 5.5, py + 8);
                        ctx.lineTo(px + s * 11 + 11, py + TILE);
                        ctx.fill();
                    }
                } else if (t === T.HAZARD) {
                    ctx.fillStyle = this.world.hazard;
                    ctx.fillRect(px, py, TILE, TILE);
                    // Animated surface
                    ctx.fillStyle = '#FF8800';
                    const wave = Math.sin(Date.now() * 0.003 + x * 0.5) * 3;
                    ctx.fillRect(px, py + wave, TILE, 4);
                } else if (t === T.ICE) {
                    ctx.fillStyle = this.world.tile.top;
                    ctx.fillRect(px, py, TILE, TILE);
                    ctx.fillStyle = 'rgba(255,255,255,0.3)';
                    ctx.fillRect(px + 2, py + 2, TILE / 2, TILE / 2);
                } else if (t === T.SAND) {
                    ctx.fillStyle = this.world.tile.body;
                    ctx.fillRect(px, py, TILE, TILE);
                    ctx.fillStyle = 'rgba(180,150,100,0.3)';
                    for (let d = 0; d < 3; d++) {
                        ctx.fillRect(px + (d * 10 + x * 3) % TILE, py + (d * 8 + y * 2) % TILE, 3, 2);
                    }
                }
            }
        }
    }

    drawMovingPlatforms(ctx, camX, camY) {
        for (const mp of this.movingPlatforms) {
            ctx.fillStyle = this.world.plat.top;
            ctx.fillRect(mp.x - camX, mp.y - camY, mp.w, mp.h);
            ctx.fillStyle = this.world.plat.body;
            ctx.fillRect(mp.x - camX + 2, mp.y - camY + 2, mp.w - 4, mp.h - 2);
        }
    }

    drawGoal(ctx, camX, camY) {
        const x = this.goal.x - camX;
        const y = this.goal.y - camY;
        // Flag pole
        ctx.fillStyle = '#888';
        ctx.fillRect(x + 2, y, 4, 40);
        // Flag
        ctx.fillStyle = '#44FF44';
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 2);
        ctx.lineTo(x + 28, y + 10);
        ctx.lineTo(x + 6, y + 18);
        ctx.fill();
        // Glow
        ctx.fillStyle = 'rgba(68,255,68,0.15)';
        ctx.beginPath();
        ctx.arc(x + 15, y + 20, 20 + Math.sin(Date.now() * 0.005) * 5, 0, Math.PI * 2);
        ctx.fill();
    }

    drawLava(ctx, camX, camY) {
        if (this.worldIdx !== 3 || this.lavaY < 0) return;
        const y = this.lavaY - camY;
        if (y > H) return;
        ctx.fillStyle = '#FF4500';
        ctx.fillRect(0, y, W, H - y + 50);
        ctx.fillStyle = '#FF6600';
        for (let x = 0; x < W; x += 8) {
            const wave = Math.sin(Date.now() * 0.004 + x * 0.05) * 4;
            ctx.fillRect(x, y + wave, 8, 6);
        }
        ctx.fillStyle = '#FFAA00';
        for (let x = 0; x < W; x += 20) {
            const wave = Math.sin(Date.now() * 0.003 + x * 0.1) * 3;
            ctx.fillRect(x + 2, y + wave + 2, 16, 3);
        }
    }

    checkLavaDeath(player) {
        if (this.worldIdx !== 3) return false;
        return player.y + player.h > this.lavaY;
    }
}

export function getLevelName(worldIdx, levelIdx) {
    return `${WORLDS[worldIdx].name} - 第${levelIdx + 1}关`;
}

export function getTotalLevels() { return 20; }
