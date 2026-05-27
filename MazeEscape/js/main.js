// ============================================================
// main.js - Game Loop & Initialization
// ============================================================

import { CFG, DIFFICULTY } from './config.js';
import { Sound } from './sound.js';
import { Maze } from './maze.js';
import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { ItemManager } from './items.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.ui = new UI(this.canvas);

        this.running = false;
        this.difficulty = 'medium';
        this.maze = null;
        this.player = null;
        this.enemyMgr = new EnemyManager();
        this.itemMgr = new ItemManager();

        this.time = 0;
        this.inputDir = null;
        this.mapRevealTimer = 0;
        this.mapRevealed = false;

        // Camera shake
        this.shakeX = 0;
        this.shakeY = 0;
        this.shakeTimer = 0;
        this.shakeIntensity = 0;

        this.lastTime = 0;
        this.animId = null;

        this.highScores = this._loadHighScores();

        this._setupInput();
        this._resizeCanvas();
        window.addEventListener('resize', () => this._resizeCanvas());

        // Show start screen
        this.ui.showStartScreen(this.highScores, (diff) => this.startGame(diff));
    }

    _loadHighScores() {
        try {
            return JSON.parse(localStorage.getItem('mazeEscapeScores')) || {};
        } catch {
            return {};
        }
    }

    _saveHighScore(diff, score) {
        const current = this.highScores[diff] || 0;
        if (score > current) {
            this.highScores[diff] = score;
            try {
                localStorage.setItem('mazeEscapeScores', JSON.stringify(this.highScores));
            } catch {}
            return true;
        }
        return false;
    }

    _resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    _setupInput() {
        const keyMap = {
            'KeyW': 'N', 'ArrowUp': 'N',
            'KeyS': 'S', 'ArrowDown': 'S',
            'KeyA': 'W', 'ArrowLeft': 'W',
            'KeyD': 'E', 'ArrowRight': 'E',
        };

        this.keysDown = new Set();

        document.addEventListener('keydown', (e) => {
            if (!this.running) return;
            const dir = keyMap[e.code];
            if (dir) {
                e.preventDefault();
                this.keysDown.add(dir);
                this.inputDir = dir;
            }
        });

        document.addEventListener('keyup', (e) => {
            const dir = keyMap[e.code];
            if (dir) {
                this.keysDown.delete(dir);
                // Set input to last held key
                const remaining = [...this.keysDown];
                this.inputDir = remaining.length > 0 ? remaining[remaining.length - 1] : null;
            }
        });

        // Touch / swipe support
        let touchStartX = 0, touchStartY = 0;
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.touches[0];
            touchStartX = t.clientX;
            touchStartY = t.clientY;
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.running) return;
            const t = e.touches[0];
            const dx = t.clientX - touchStartX;
            const dy = t.clientY - touchStartY;
            const threshold = 20;

            if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
                if (Math.abs(dx) > Math.abs(dy)) {
                    this.inputDir = dx > 0 ? 'E' : 'W';
                } else {
                    this.inputDir = dy > 0 ? 'S' : 'N';
                }
                touchStartX = t.clientX;
                touchStartY = t.clientY;
            }
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => {
            this.inputDir = null;
        });
    }

    startGame(difficulty) {
        this.difficulty = difficulty;
        const cfg = DIFFICULTY[difficulty];

        // Generate maze
        this.maze = new Maze(cfg.rows, cfg.cols);
        this.maze.placeDoors(cfg.keys);

        // Player
        this.player = new Player(0, 0);

        // Enemies
        this.enemyMgr.spawn(this.maze, cfg.enemies, 0, 0);

        // Items
        this.itemMgr.spawn(this.maze, cfg.keys);

        // State
        this.time = 0;
        this.inputDir = null;
        this.mapRevealTimer = 0;
        this.mapRevealed = false;
        this.shakeTimer = 0;
        this.shakeX = 0;
        this.shakeY = 0;
        this.running = true;

        // Reveal starting area
        this.maze.reveal(0, 0, this.player.torchRadius);

        this.ui.updateHUD(this.player, this.time, this.difficulty);

        // Start loop
        if (this.animId) cancelAnimationFrame(this.animId);
        this.lastTime = performance.now();
        this._loop(this.lastTime);
    }

    _triggerShake(intensity = 6, duration = 0.3) {
        this.shakeTimer = duration;
        this.shakeIntensity = intensity;
    }

    _loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.05); // cap dt
        this.lastTime = timestamp;
        this.currentDt = dt;

        this._update(dt);
        this._render();

        this.animId = requestAnimationFrame((t) => this._loop(t));
    }

    _update(dt) {
        this.time += dt;

        // Player update
        const result = this.player.update(dt, this.maze, this.inputDir);

        // Handle movement result
        if (result === 'move') {
            Sound.move();
            Sound.explore();
            this.maze.reveal(this.player.rowI, this.player.colI, this.player.torchRadius);
        } else if (result === 'door_open') {
            Sound.openDoor();
            this.ui.showNotification('门已开启!', 1.5);
        } else if (result === 'door_locked') {
            Sound.doorLocked();
            this.ui.showNotification('需要钥匙!', 1.5);
        }

        // Map reveal power-up
        if (this.mapRevealTimer > 0) {
            this.mapRevealTimer -= dt;
            if (this.mapRevealTimer <= 0) {
                this.mapRevealed = false;
                this.maze.resetRevealed();
                this.maze.reveal(this.player.rowI, this.player.colI, this.player.torchRadius);
            }
        }

        // Item pickup
        const picked = this.itemMgr.checkPickup(this.player.rowI, this.player.colI);
        for (const type of picked) {
            switch (type) {
                case 'key':
                    Sound.collectKey();
                    this.player.addKey();
                    this.player.addScore(CFG.SCORE_PER_KEY);
                    this.ui.showNotification('获得钥匙!', 1.5);
                    break;
                case 'torch':
                    Sound.collectTorch();
                    this.player.addTorch();
                    this.player.addScore(CFG.SCORE_PER_TORCH);
                    this.maze.reveal(this.player.rowI, this.player.colI, this.player.torchRadius);
                    this.ui.showNotification('获得火把! 视野扩大', 1.5);
                    break;
                case 'speed':
                    Sound.collectPowerup();
                    this.player.applySpeedBoost();
                    this.player.addScore(CFG.SCORE_PER_POWERUP);
                    this.ui.showNotification('加速!', 1.5);
                    break;
                case 'freeze':
                    Sound.collectPowerup();
                    this.enemyMgr.freezeAll(CFG.ENEMY_FREEZE_DURATION);
                    this.player.addScore(CFG.SCORE_PER_POWERUP);
                    this.ui.showNotification('敌人冻结!', 1.5);
                    break;
                case 'reveal':
                    Sound.collectPowerup();
                    this.maze.revealAll();
                    this.mapRevealed = true;
                    this.mapRevealTimer = CFG.MAP_REVEAL_DURATION;
                    this.player.addScore(CFG.SCORE_PER_POWERUP);
                    this.ui.showNotification('全图显示!', 1.5);
                    break;
            }
        }

        // Update enemies
        this.enemyMgr.update(dt, this.maze, this.player.rowI, this.player.colI);
        this.enemyMgr.updateVisibility(this.player.rowI, this.player.colI, this.player.torchRadius, this.maze);

        // Check enemy spotted
        for (const e of this.enemyMgr.enemies) {
            if (e.spotted) {
                Sound.enemySpot();
            }
        }

        // Check enemy collision
        const hitEnemy = this.enemyMgr.checkCollision(this.player.rowI, this.player.colI);
        if (hitEnemy && this.player.takeDamage()) {
            Sound.hit();
            this._triggerShake(8, 0.4);
            this.ui.showNotification(`受到攻击! 剩余生命: ${this.player.lives}`, 2);
        }

        // Items animation
        this.itemMgr.update(dt);

        // UI
        this.ui.updateHUD(this.player, this.time, this.difficulty);
        this.ui.updateNotification(dt);

        // Check game over
        if (!this.player.alive) {
            this.running = false;
            Sound.gameOver();
            setTimeout(() => {
                this.ui.showGameOver(this.player.score, this.time, this.player.keys, this.difficulty);
            }, 800);
            return;
        }

        // Check win (reached exit)
        if (this.player.rowI === this.maze.rows - 1 && this.player.colI === this.maze.cols - 1) {
            this.running = false;
            this.player.addScore(CFG.SCORE_FINISH_BONUS);
            // Time bonus: faster = more points
            const timeBonus = Math.max(0, Math.floor((300 - this.time) * CFG.SCORE_PER_SECOND));
            this.player.addScore(timeBonus);
            Sound.levelComplete();
            const isNewHigh = this._saveHighScore(this.difficulty, this.player.score);
            setTimeout(() => {
                this.ui.showWin(this.player.score, this.time, this.player.keys, this.difficulty, isNewHigh);
            }, 800);
            return;
        }
    }

    _render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        const cs = CFG.CELL_SIZE;

        // Camera follow player with clamping
        let camX = this.player.x * cs - w / 2;
        let camY = this.player.y * cs - h / 2;
        // Clamp camera to maze bounds (with some padding)
        const mazeW = this.maze.cols * cs;
        const mazeH = this.maze.rows * cs;
        camX = Math.max(-w * 0.2, Math.min(mazeW - w * 0.8, camX));
        camY = Math.max(-h * 0.2, Math.min(mazeH - h * 0.8, camY));

        // Camera shake
        if (this.shakeTimer > 0) {
            this.shakeTimer -= this.currentDt || 0.016;
            const intensity = this.shakeIntensity * (this.shakeTimer / 0.3);
            this.shakeX = (Math.random() - 0.5) * intensity;
            this.shakeY = (Math.random() - 0.5) * intensity;
        } else {
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Clear
        ctx.fillStyle = CFG.BG_COLOR;
        ctx.fillRect(0, 0, w, h);

        ctx.save();
        ctx.translate(-camX + this.shakeX, -camY + this.shakeY);

        // Draw maze
        this._drawMaze(ctx, cs);

        // Draw items
        const revealedSet = new Set();
        for (let r = 0; r < this.maze.rows; r++) {
            for (let c = 0; c < this.maze.cols; c++) {
                if (this.maze.getCell(r, c).revealed) revealedSet.add(`${r},${c}`);
            }
        }
        this.itemMgr.draw(ctx, cs, revealedSet);

        // Draw enemies
        this.enemyMgr.draw(ctx, cs);

        // Draw player
        this.player.draw(ctx, cs);

        // Draw fog of war
        this._drawFog(ctx, cs, w, h, camX, camY);

        ctx.restore();

        // Draw exit indicator
        this._drawExitIndicator(ctx, w, h, cs, camX, camY);

        // Minimap
        this.ui.drawMinimap(this.maze, this.player, this.enemyMgr.enemies, cs);
    }

    _drawMaze(ctx, cs) {
        const maze = this.maze;
        const wallW = CFG.WALL_THICKNESS;

        for (let r = 0; r < maze.rows; r++) {
            for (let c = 0; c < maze.cols; c++) {
                const cell = maze.getCell(r, c);
                if (!cell.revealed && !this.mapRevealed) continue;

                const x = c * cs;
                const y = r * cs;

                // Floor
                ctx.fillStyle = CFG.FLOOR_COLOR;
                ctx.fillRect(x, y, cs, cs);

                // Walls
                ctx.strokeStyle = CFG.WALL_COLOR;
                ctx.lineWidth = wallW;
                ctx.lineCap = 'round';

                if (cell.walls.N) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + cs, y);
                    ctx.stroke();
                }
                if (cell.walls.S) {
                    ctx.beginPath();
                    ctx.moveTo(x, y + cs);
                    ctx.lineTo(x + cs, y + cs);
                    ctx.stroke();
                }
                if (cell.walls.W) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + cs);
                    ctx.stroke();
                }
                if (cell.walls.E) {
                    ctx.beginPath();
                    ctx.moveTo(x + cs, y);
                    ctx.lineTo(x + cs, y + cs);
                    ctx.stroke();
                }

                // Door
                if (cell.doorDir && cell.locked) {
                    ctx.strokeStyle = CFG.LOCKED_COLOR;
                    ctx.lineWidth = wallW + 1;
                    const doorLen = cs * 0.6;
                    const doorOff = (cs - doorLen) / 2;

                    switch (cell.doorDir) {
                        case 'N':
                            ctx.beginPath();
                            ctx.moveTo(x + doorOff, y);
                            ctx.lineTo(x + doorOff + doorLen, y);
                            ctx.stroke();
                            break;
                        case 'S':
                            ctx.beginPath();
                            ctx.moveTo(x + doorOff, y + cs);
                            ctx.lineTo(x + doorOff + doorLen, y + cs);
                            ctx.stroke();
                            break;
                        case 'E':
                            ctx.beginPath();
                            ctx.moveTo(x + cs, y + doorOff);
                            ctx.lineTo(x + cs, y + doorOff + doorLen);
                            ctx.stroke();
                            break;
                        case 'W':
                            ctx.beginPath();
                            ctx.moveTo(x, y + doorOff);
                            ctx.lineTo(x, y + doorOff + doorLen);
                            ctx.stroke();
                            break;
                    }

                    // Lock icon
                    ctx.font = `${cs * 0.3}px sans-serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillStyle = CFG.LOCKED_COLOR;
                    ctx.fillText('🔒', x + cs / 2, y + cs / 2);
                }
            }
        }

        // Exit marker
        const ex = (maze.cols - 1) * cs;
        const ey = (maze.rows - 1) * cs;
        const exitCell = maze.getCell(maze.rows - 1, maze.cols - 1);
        if (exitCell.revealed || this.mapRevealed) {
            // Glow
            const glow = ctx.createRadialGradient(ex + cs / 2, ey + cs / 2, cs * 0.1, ex + cs / 2, ey + cs / 2, cs * 0.8);
            glow.addColorStop(0, 'rgba(241, 196, 15, 0.4)');
            glow.addColorStop(1, 'rgba(241, 196, 15, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(ex, ey, cs, cs);

            // Star
            ctx.font = `${cs * 0.6}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = CFG.EXIT_COLOR;
            ctx.fillText('★', ex + cs / 2, ey + cs / 2);
        }
    }

    _drawFog(ctx, cs, screenW, screenH, camX, camY) {
        // Draw fog over unrevealed cells
        const startCol = Math.max(0, Math.floor(camX / cs) - 1);
        const endCol = Math.min(this.maze.cols, Math.ceil((camX + screenW) / cs) + 1);
        const startRow = Math.max(0, Math.floor(camY / cs) - 1);
        const endRow = Math.min(this.maze.rows, Math.ceil((camY + screenH) / cs) + 1);

        for (let r = startRow; r < endRow; r++) {
            for (let c = startCol; c < endCol; c++) {
                const cell = this.maze.getCell(r, c);
                if (!cell) continue;

                const x = c * cs;
                const y = r * cs;

                if (!cell.revealed && !this.mapRevealed) {
                    ctx.fillStyle = CFG.FOG_COLOR;
                    ctx.fillRect(x - 1, y - 1, cs + 2, cs + 2);
                } else {
                    // Distance-based fog for revealed but far cells
                    const dist = Math.sqrt((r - this.player.rowI) ** 2 + (c - this.player.colI) ** 2);
                    const visRadius = this.player.torchRadius;

                    if (dist > visRadius && !this.mapRevealed) {
                        const fogAlpha = Math.min(0.7, (dist - visRadius) / 3);
                        ctx.fillStyle = `rgba(0,0,0,${fogAlpha})`;
                        ctx.fillRect(x - 1, y - 1, cs + 2, cs + 2);
                    }
                }
            }
        }
    }

    _drawExitIndicator(ctx, screenW, screenH, cs, camX, camY) {
        // Arrow pointing to exit if not visible
        const exitX = (this.maze.cols - 0.5) * cs;
        const exitY = (this.maze.rows - 0.5) * cs;
        const screenExitX = exitX - camX;
        const screenExitY = exitY - camY;

        // If exit is off-screen, show arrow
        if (screenExitX < 0 || screenExitX > screenW || screenExitY < 0 || screenExitY > screenH) {
            const centerX = screenW / 2;
            const centerY = screenH / 2;
            const angle = Math.atan2(screenExitY - centerY, screenExitX - centerX);

            const arrowDist = 60;
            const ax = Math.max(40, Math.min(screenW - 40, centerX + Math.cos(angle) * arrowDist));
            const ay = Math.max(60, Math.min(screenH - 40, centerY + Math.sin(angle) * arrowDist));

            ctx.save();
            ctx.translate(ax, ay);
            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-6, -8);
            ctx.lineTo(-6, 8);
            ctx.closePath();
            ctx.fillStyle = 'rgba(241, 196, 15, 0.6)';
            ctx.fill();

            ctx.restore();

            ctx.font = '11px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'rgba(241, 196, 15, 0.5)';
            ctx.fillText('出口', ax, ay + 20);
        }
    }
}

// ============================================================
// Bootstrap
// ============================================================

window.startGame = function(difficulty) {
    if (window._game) {
        window._game.startGame(difficulty);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    window._game = new Game();
});
