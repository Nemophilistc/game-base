// ============================================================
// player.js - Player Entity
// ============================================================

import { CFG } from './config.js';

export class Player {
    constructor(row, col) {
        this.row = row;
        this.col = col;
        // Visual position (smooth interpolation)
        this.x = col + 0.5;
        this.y = row + 0.5;
        this.targetX = this.x;
        this.targetY = this.y;

        this.lives = CFG.STARTING_LIVES;
        this.keys = 0;
        this.torches = 0;
        this.score = 0;
        this.moveTimer = 0;
        this.invulnTimer = 0;
        this.speedMult = 1;
        this.speedTimer = 0;
        this.facing = 'S';      // N S E W
        this.moving = false;
        this.animFrame = 0;
        this.animTimer = 0;
        this.alive = true;
        this.torchRadius = CFG.TORCH_RADIUS;

        // Trail particles
        this.trail = [];
    }

    get rowI() { return Math.round(this.y - 0.5); }
    get colI() { return Math.round(this.x - 0.5); }

    reset(row, col) {
        this.row = row;
        this.col = col;
        this.x = col + 0.5;
        this.y = row + 0.5;
        this.targetX = this.x;
        this.targetY = this.y;
        this.moveTimer = 0;
        this.invulnTimer = 0;
        this.speedMult = 1;
        this.speedTimer = 0;
        this.moving = false;
        this.alive = true;
        this.trail = [];
    }

    update(dt, maze, inputDir) {
        if (!this.alive) return;

        // Update timers
        this.invulnTimer = Math.max(0, this.invulnTimer - dt);
        if (this.speedTimer > 0) {
            this.speedTimer -= dt;
            if (this.speedTimer <= 0) this.speedMult = 1;
        }

        // Movement cooldown
        this.moveTimer = Math.max(0, this.moveTimer - dt);

        // Smooth interpolation toward target
        const lerpSpeed = 12 * dt;
        this.x += (this.targetX - this.x) * Math.min(lerpSpeed, 1);
        this.y += (this.targetY - this.y) * Math.min(lerpSpeed, 1);

        // Snap if close enough
        if (Math.abs(this.x - this.targetX) < 0.01) this.x = this.targetX;
        if (Math.abs(this.y - this.targetY) < 0.01) this.y = this.targetY;

        // Animation
        if (this.moving) {
            this.animTimer += dt;
            if (this.animTimer > 0.12) {
                this.animTimer = 0;
                this.animFrame = (this.animFrame + 1) % 4;
            }
        } else {
            this.animFrame = 0;
            this.animTimer = 0;
        }

        // Trail
        if (this.moving) {
            this.trail.push({ x: this.x, y: this.y, life: 0.4 });
        }
        this.trail = this.trail.filter(t => {
            t.life -= dt;
            return t.life > 0;
        });

        // Process movement input
        this.moving = false;
        if (!inputDir || this.moveTimer > 0) return;

        const currentRow = this.rowI;
        const currentCol = this.colI;

        // Check if still moving toward target
        if (Math.abs(this.x - this.targetX) > 0.1 || Math.abs(this.y - this.targetY) > 0.1) return;

        // Snap to grid
        this.x = currentCol + 0.5;
        this.y = currentRow + 0.5;
        this.targetX = this.x;
        this.targetY = this.y;

        const dirs = {
            N: { dr: -1, dc: 0 },
            S: { dr: 1, dc: 0 },
            E: { dr: 0, dc: 1 },
            W: { dr: 0, dc: -1 },
        };

        if (dirs[inputDir]) {
            this.facing = inputDir;
            const { dr, dc } = dirs[inputDir];

            // First check if there's a wall (ignoring doors)
            const cell = maze.getCell(currentRow, currentCol);
            if (cell && cell.walls[inputDir]) return null; // Wall blocks, no interaction

            // Path is open (no wall) - check for locked door
            const hasLockedDoor = maze.isDoorAt(currentRow, currentCol, inputDir) ||
                maze.hasLockedDoorTo(currentRow, currentCol, inputDir);

            if (hasLockedDoor) {
                if (this.keys > 0) {
                    this.keys--;
                    maze.unlockDoor(currentRow, currentCol);
                    maze.unlockDoor(currentRow + dr, currentCol + dc);
                    return 'door_open';
                } else {
                    return 'door_locked';
                }
            }

            // No wall, no locked door - move
            this.row = currentRow + dr;
            this.col = currentCol + dc;
            this.targetX = this.col + 0.5;
            this.targetY = this.row + 0.5;
            this.moveTimer = 1 / (CFG.PLAYER_SPEED * this.speedMult);
            this.moving = true;
            return 'move';
        }

        return null;
    }

    takeDamage() {
        if (this.invulnTimer > 0 || !this.alive) return false;
        this.lives--;
        this.invulnTimer = CFG.INVULN_DURATION;
        if (this.lives <= 0) {
            this.alive = false;
        }
        return true;
    }

    addKey() { this.keys++; }
    addTorch() {
        this.torches++;
        this.torchRadius = CFG.TORCH_RADIUS + this.torches * 0.8;
    }
    addScore(pts) { this.score += pts; }

    applySpeedBoost() {
        this.speedMult = CFG.SPEED_BOOST_MULT;
        this.speedTimer = CFG.SPEED_BOOST_DURATION;
    }

    draw(ctx, cellSize) {
        const px = this.x * cellSize;
        const py = this.y * cellSize;
        const r = CFG.PLAYER_RADIUS * cellSize;

        // Trail
        for (const t of this.trail) {
            const alpha = (t.life / 0.4) * 0.3;
            ctx.beginPath();
            ctx.arc(t.x * cellSize, t.y * cellSize, r * 0.5, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
            ctx.fill();
        }

        // Glow
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer * 10) % 2 === 0) {
            // Flashing when invulnerable
            return;
        }

        const glow = ctx.createRadialGradient(px, py, r * 0.3, px, py, r * 2.5);
        glow.addColorStop(0, 'rgba(0, 255, 136, 0.3)');
        glow.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.beginPath();
        ctx.arc(px, py, r * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = glow;
        ctx.fill();

        // Body
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = CFG.PLAYER_COLOR;
        ctx.fill();
        ctx.strokeStyle = CFG.PLAYER_GLOW;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Eyes
        const eyeOffset = r * 0.35;
        const eyeR = r * 0.18;
        let ex1, ey1, ex2, ey2;
        const bounce = this.moving ? Math.sin(this.animTimer * 30) * 2 : 0;

        switch (this.facing) {
            case 'N':
                ex1 = px - eyeOffset; ey1 = py - eyeOffset * 0.5 + bounce;
                ex2 = px + eyeOffset; ey2 = py - eyeOffset * 0.5 + bounce;
                break;
            case 'S':
                ex1 = px - eyeOffset; ey1 = py + eyeOffset * 0.3 + bounce;
                ex2 = px + eyeOffset; ey2 = py + eyeOffset * 0.3 + bounce;
                break;
            case 'E':
                ex1 = px + eyeOffset * 0.3; ey1 = py - eyeOffset + bounce;
                ex2 = px + eyeOffset * 0.3; ey2 = py + eyeOffset * 0.3 + bounce;
                break;
            case 'W':
                ex1 = px - eyeOffset * 0.3; ey1 = py - eyeOffset + bounce;
                ex2 = px - eyeOffset * 0.3; ey2 = py + eyeOffset * 0.3 + bounce;
                break;
        }

        ctx.beginPath();
        ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Pupils
        const pupilOff = eyeR * 0.4;
        let pdx = 0, pdy = 0;
        if (this.facing === 'N') pdy = -pupilOff;
        if (this.facing === 'S') pdy = pupilOff;
        if (this.facing === 'E') pdx = pupilOff;
        if (this.facing === 'W') pdx = -pupilOff;

        ctx.beginPath();
        ctx.arc(ex1 + pdx, ey1 + pdy, eyeR * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(ex2 + pdx, ey2 + pdy, eyeR * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
    }
}
