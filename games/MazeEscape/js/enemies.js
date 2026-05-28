// ============================================================
// enemies.js - Enemy AI (Patrol + Chase)
// ============================================================

import { CFG } from './config.js';

export class Enemy {
    constructor(row, col, id) {
        this.id = id;
        this.row = row;
        this.col = col;
        this.x = col + 0.5;
        this.y = row + 0.5;
        this.targetX = this.x;
        this.targetY = this.y;
        this.facing = 'S';
        this.speed = CFG.ENEMY_SPEED;
        this.moveTimer = 0;
        this.patrolDir = ['N', 'S', 'E', 'W'][Math.floor(Math.random() * 4)];
        this.patrolTimer = Math.random() * 2;
        this.chasing = false;
        this.frozen = false;
        this.freezeTimer = 0;
        this.animFrame = 0;
        this.animTimer = 0;
        this.visible = false; // For fog of war
        this.spotted = false; // Just became visible
    }

    get rowI() { return Math.round(this.y - 0.5); }
    get colI() { return Math.round(this.x - 0.5); }

    freeze(duration) {
        this.frozen = true;
        this.freezeTimer = duration;
        this.chasing = false;
    }

    update(dt, maze, playerRow, playerCol) {
        // Freeze
        if (this.frozen) {
            this.freezeTimer -= dt;
            if (this.freezeTimer <= 0) {
                this.frozen = false;
            }
            return;
        }

        // Animation
        this.animTimer += dt;
        if (this.animTimer > 0.15) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }

        // Smooth movement
        const lerpSpeed = 10 * dt;
        this.x += (this.targetX - this.x) * Math.min(lerpSpeed, 1);
        this.y += (this.targetY - this.y) * Math.min(lerpSpeed, 1);
        if (Math.abs(this.x - this.targetX) < 0.01) this.x = this.targetX;
        if (Math.abs(this.y - this.targetY) < 0.01) this.y = this.targetY;

        this.moveTimer = Math.max(0, this.moveTimer - dt);
        if (this.moveTimer > 0) return;

        // Snap to grid
        const cr = this.rowI;
        const cc = this.colI;
        if (Math.abs(this.x - (cc + 0.5)) > 0.15 || Math.abs(this.y - (cr + 0.5)) > 0.15) return;
        this.x = cc + 0.5;
        this.y = cr + 0.5;
        this.row = cr;
        this.col = cc;

        // Chase mode detection
        const dist = Math.abs(playerRow - cr) + Math.abs(playerCol - cc);
        const eucDist = Math.sqrt((playerRow - cr) ** 2 + (playerCol - cc) ** 2);
        this.chasing = eucDist <= CFG.ENEMY_CHASE_RANGE;

        let dir = null;

        if (this.chasing) {
            // Use pathfinding to chase
            const path = maze.findPath(cr, cc, playerRow, playerCol);
            if (path && path.length > 0) {
                dir = path[0];
            }
            this.speed = CFG.ENEMY_CHASE_SPEED;
        } else {
            // Patrol: random wandering with preference
            this.speed = CFG.ENEMY_SPEED;
            this.patrolTimer -= dt;

            const validDirs = [];
            ['N', 'S', 'E', 'W'].forEach(d => {
                if (maze.canMove(cr, cc, d)) validDirs.push(d);
            });

            if (validDirs.length > 0) {
                // Prefer current direction, but change periodically
                if (this.patrolTimer <= 0 || !validDirs.includes(this.patrolDir)) {
                    this.patrolDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                    this.patrolTimer = 1.5 + Math.random() * 2;
                }
                dir = this.patrolDir;
            }
        }

        if (dir && maze.canMove(cr, cc, dir)) {
            const dirs = { N: [-1, 0], S: [1, 0], E: [0, 1], W: [0, -1] };
            const [dr, dc] = dirs[dir];
            this.row = cr + dr;
            this.col = cc + dc;
            this.targetX = this.col + 0.5;
            this.targetY = this.row + 0.5;
            this.facing = dir;
            this.moveTimer = 1 / this.speed;
        }
    }

    draw(ctx, cellSize, frozen) {
        if (!this.visible) return;

        const px = this.x * cellSize;
        const py = this.y * cellSize;
        const r = CFG.ENEMY_RADIUS * cellSize;

        // Glow
        const glowColor = frozen ? 'rgba(155, 89, 182, 0.2)' : 'rgba(231, 76, 60, 0.2)';
        const glow = ctx.createRadialGradient(px, py, r * 0.3, px, py, r * 2);
        glow.addColorStop(0, glowColor);
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(px, py, r * 2, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Body
        const color = frozen ? CFG.FREEZE_COLOR : CFG.ENEMY_COLOR;
        const strokeColor = frozen ? '#bb77dd' : CFG.ENEMY_GLOW;

        // Spiky body
        ctx.beginPath();
        const spikes = 5;
        for (let i = 0; i < spikes * 2; i++) {
            const angle = (i * Math.PI) / spikes - Math.PI / 2;
            const rad = i % 2 === 0 ? r : r * 0.65;
            const sx = px + Math.cos(angle) * rad;
            const sy = py + Math.sin(angle) * rad;
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        const eyeOffset = r * 0.25;
        const eyeR = r * 0.16;

        ctx.beginPath();
        ctx.arc(px - eyeOffset, py - eyeOffset * 0.3, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + eyeOffset, py - eyeOffset * 0.3, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Pupils (look toward player when chasing)
        const pdx = this.chasing ? (this.facing === 'E' ? 1 : this.facing === 'W' ? -1 : 0) * eyeR * 0.4 : 0;
        const pdy = this.chasing ? (this.facing === 'S' ? 1 : this.facing === 'N' ? -1 : 0) * eyeR * 0.4 : 0;

        ctx.beginPath();
        ctx.arc(px - eyeOffset + pdx, py - eyeOffset * 0.3 + pdy, eyeR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = frozen ? '#ddd' : '#111';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(px + eyeOffset + pdx, py - eyeOffset * 0.3 + pdy, eyeR * 0.55, 0, Math.PI * 2);
        ctx.fillStyle = frozen ? '#ddd' : '#111';
        ctx.fill();

        // Frozen indicator
        if (frozen) {
            ctx.beginPath();
            ctx.arc(px, py - r * 1.3, r * 0.3, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(155, 89, 182, 0.6)';
            ctx.fill();
            ctx.font = `${r * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#fff';
            ctx.fillText('❄', px, py - r * 1.0);
        }

        // Chase indicator
        if (this.chasing && !frozen) {
            ctx.font = `bold ${r * 0.7}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.fillStyle = '#ff6666';
            ctx.fillText('!', px, py - r * 1.2);
        }
    }
}

export class EnemyManager {
    constructor() {
        this.enemies = [];
    }

    spawn(maze, count, playerRow, playerCol) {
        this.enemies = [];
        const positions = this._findPositions(maze, count, playerRow, playerCol);
        positions.forEach((pos, i) => {
            this.enemies.push(new Enemy(pos.row, pos.col, i));
        });
    }

    _findPositions(maze, count, playerRow, playerCol) {
        const positions = [];
        const minDist = Math.floor(maze.rows * 0.4);

        for (let r = 0; r < maze.rows; r++) {
            for (let c = 0; c < maze.cols; c++) {
                const dist = Math.abs(r - playerRow) + Math.abs(c - playerCol);
                if (dist >= minDist && dist > 3) {
                    positions.push({ row: r, col: c });
                }
            }
        }

        // Shuffle and pick
        for (let i = positions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [positions[i], positions[j]] = [positions[j], positions[i]];
        }

        return positions.slice(0, count);
    }

    update(dt, maze, playerRow, playerCol) {
        for (const e of this.enemies) {
            e.update(dt, maze, playerRow, playerCol);
        }
    }

    checkCollision(playerRow, playerCol) {
        for (const e of this.enemies) {
            if (!e.visible || e.frozen) continue;
            const dist = Math.sqrt((e.rowI - playerRow) ** 2 + (e.colI - playerCol) ** 2);
            if (dist < 0.8) return e;
        }
        return null;
    }

    freezeAll(duration) {
        for (const e of this.enemies) {
            e.freeze(duration);
        }
    }

    updateVisibility(playerRow, playerCol, radius, maze) {
        for (const e of this.enemies) {
            const dist = Math.sqrt((e.rowI - playerRow) ** 2 + (e.colI - playerCol) ** 2);
            const wasVisible = e.visible;
            e.visible = dist <= radius + 1 && this._hasLineOfSight(maze, playerRow, playerCol, e.rowI, e.colI);
            if (e.visible && !wasVisible) {
                e.spotted = true;
            } else {
                e.spotted = false;
            }
        }
    }

    _hasLineOfSight(maze, r1, c1, r2, c2) {
        // Simple line check - step through cells
        const dr = r2 - r1;
        const dc = c2 - c1;
        const steps = Math.max(Math.abs(dr), Math.abs(dc));
        if (steps === 0) return true;

        for (let i = 0; i <= steps; i++) {
            const r = Math.round(r1 + (dr * i) / steps);
            const c = Math.round(c1 + (dc * i) / steps);
            const cell = maze.getCell(r, c);
            if (!cell || !cell.revealed) return false;
        }
        return true;
    }

    freeze(duration) {
        for (const e of this.enemies) {
            e.freeze(duration);
        }
    }

    draw(ctx, cellSize) {
        for (const e of this.enemies) {
            e.draw(ctx, cellSize, e.frozen);
        }
    }
}
