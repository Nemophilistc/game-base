// ============================================================
// ui.js - UI Overlays and HUD (Chinese Interface)
// ============================================================

import { CFG, DIFFICULTY, POWERUP_TYPES } from './config.js';

export class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.overlay = document.getElementById('overlay');
        this.overlayContent = document.getElementById('overlay-content');
        this.hud = document.getElementById('hud');
        this.notification = document.getElementById('notification');
        this.notifTimer = 0;
        this.minimapCanvas = document.getElementById('minimap');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
    }

    showStartScreen(highScores, onStart) {
        const diffButtons = Object.entries(DIFFICULTY).map(([key, val]) => {
            return `<button class="diff-btn" data-diff="${key}">${val.name}</button>`;
        }).join('');

        const hsRows = Object.entries(highScores).map(([key, val]) => {
            const d = DIFFICULTY[key];
            return `<div class="hs-row"><span>${d.name}</span><span class="hs-val">${val || '---'}</span></div>`;
        }).join('');

        this.overlayContent.innerHTML = `
            <div class="title-area">
                <h1 class="game-title">迷宫逃脱</h1>
                <p class="subtitle">MAZE ESCAPE</p>
            </div>
            <div class="menu-section">
                <h2 class="section-title">选择难度</h2>
                <div class="diff-buttons">${diffButtons}</div>
            </div>
            <div class="menu-section">
                <h2 class="section-title">最高分</h2>
                <div class="hs-table">${hsRows}</div>
            </div>
            <div class="help-box">
                <h3>操作说明</h3>
                <div class="help-grid">
                    <div class="help-item"><span class="key">W A S D</span> 或 <span class="key">方向键</span> 移动</div>
                    <div class="help-item"><span class="key">🔑</span> 收集钥匙开门</div>
                    <div class="help-item"><span class="key">🔥</span> 火把扩大视野</div>
                    <div class="help-item"><span class="key">⚡</span> 加速 <span class="key">❄</span> 冻结敌人 <span class="key">🗺</span> 全图</div>
                    <div class="help-item"><span class="key">★</span> 到达右下角出口逃脱!</div>
                </div>
            </div>
        `;

        this.overlay.classList.remove('hidden');

        // Bind buttons
        this.overlayContent.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const diff = btn.dataset.diff;
                this.overlay.classList.add('hidden');
                onStart(diff);
            });
        });
    }

    showGameOver(score, time, keys, difficulty) {
        const diffName = DIFFICULTY[difficulty]?.name || difficulty;
        this.overlayContent.innerHTML = `
            <div class="result-screen gameover">
                <h1 class="result-title danger">游戏结束</h1>
                <p class="result-sub">GAME OVER</p>
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">得分</div>
                        <div class="stat-val">${score}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">用时</div>
                        <div class="stat-val">${this.formatTime(time)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">难度</div>
                        <div class="stat-val">${diffName}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">钥匙</div>
                        <div class="stat-val">${keys}</div>
                    </div>
                </div>
                <button class="restart-btn" id="btn-restart">重新开始</button>
            </div>
        `;
        this.overlay.classList.remove('hidden');

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.overlay.classList.add('hidden');
            window.startGame(difficulty);
        });
    }

    showWin(score, time, keys, difficulty, isNewHigh) {
        const diffName = DIFFICULTY[difficulty]?.name || difficulty;
        this.overlayContent.innerHTML = `
            <div class="result-screen win">
                <h1 class="result-title gold">逃脱成功!</h1>
                <p class="result-sub">ESCAPE COMPLETE</p>
                ${isNewHigh ? '<p class="new-high">新纪录!</p>' : ''}
                <div class="stats-grid">
                    <div class="stat-item">
                        <div class="stat-label">得分</div>
                        <div class="stat-val gold">${score}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">用时</div>
                        <div class="stat-val">${this.formatTime(time)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">难度</div>
                        <div class="stat-val">${diffName}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">钥匙</div>
                        <div class="stat-val">${keys}</div>
                    </div>
                </div>
                <button class="restart-btn" id="btn-restart">再来一局</button>
            </div>
        `;
        this.overlay.classList.remove('hidden');

        document.getElementById('btn-restart').addEventListener('click', () => {
            this.overlay.classList.add('hidden');
            window.startGame(difficulty);
        });
    }

    updateHUD(player, time, difficulty) {
        const diffName = DIFFICULTY[difficulty]?.name || difficulty;
        const hearts = '❤'.repeat(player.lives) + '🖤'.repeat(CFG.STARTING_LIVES - player.lives);

        this.hud.innerHTML = `
            <div class="hud-item">
                <span class="hud-icon">⏱</span>
                <span class="hud-val">${this.formatTime(time)}</span>
            </div>
            <div class="hud-item">
                <span class="hud-icon">⭐</span>
                <span class="hud-val">${player.score}</span>
            </div>
            <div class="hud-item">
                <span class="hud-icon">🔑</span>
                <span class="hud-val">${player.keys}</span>
            </div>
            <div class="hud-item lives">
                <span class="hud-val">${hearts}</span>
            </div>
            <div class="hud-item diff">
                <span class="hud-val">${diffName}</span>
            </div>
        `;
    }

    showNotification(text, duration = 2) {
        this.notification.textContent = text;
        this.notification.style.display = 'block';
        // Force reflow before adding show class for transition
        this.notification.offsetHeight;
        this.notification.classList.add('show');
        this.notifTimer = duration;
    }

    updateNotification(dt) {
        if (this.notifTimer > 0) {
            this.notifTimer -= dt;
            if (this.notifTimer <= 0) {
                this.notification.classList.remove('show');
                // Hide after transition completes
                setTimeout(() => {
                    if (!this.notification.classList.contains('show')) {
                        this.notification.style.display = 'none';
                    }
                }, 350);
            }
        }
    }

    drawMinimap(maze, player, enemies, cellSize) {
        const mc = this.minimapCanvas;
        const mctx = this.minimapCtx;
        const scale = Math.min(mc.width / maze.cols, mc.height / maze.rows);
        const ox = (mc.width - maze.cols * scale) / 2;
        const oy = (mc.height - maze.rows * scale) / 2;

        mctx.clearRect(0, 0, mc.width, mc.height);

        // Background
        mctx.fillStyle = 'rgba(0, 10, 0, 0.8)';
        mctx.fillRect(0, 0, mc.width, mc.height);

        // Draw cells
        for (let r = 0; r < maze.rows; r++) {
            for (let c = 0; c < maze.cols; c++) {
                const cell = maze.getCell(r, c);
                if (!cell.revealed) continue;

                const x = ox + c * scale;
                const y = oy + r * scale;

                // Floor
                mctx.fillStyle = 'rgba(20, 60, 20, 0.6)';
                mctx.fillRect(x, y, scale, scale);

                // Walls
                mctx.strokeStyle = 'rgba(46, 204, 113, 0.4)';
                mctx.lineWidth = 0.5;

                if (cell.walls.N) { mctx.beginPath(); mctx.moveTo(x, y); mctx.lineTo(x + scale, y); mctx.stroke(); }
                if (cell.walls.S) { mctx.beginPath(); mctx.moveTo(x, y + scale); mctx.lineTo(x + scale, y + scale); mctx.stroke(); }
                if (cell.walls.W) { mctx.beginPath(); mctx.moveTo(x, y); mctx.lineTo(x, y + scale); mctx.stroke(); }
                if (cell.walls.E) { mctx.beginPath(); mctx.moveTo(x + scale, y); mctx.lineTo(x + scale, y + scale); mctx.stroke(); }

                // Doors
                if (cell.locked) {
                    mctx.fillStyle = CFG.LOCKED_COLOR;
                    if (cell.doorDir === 'E') mctx.fillRect(x + scale - 1, y + 1, 2, scale - 2);
                    if (cell.doorDir === 'S') mctx.fillRect(x + 1, y + scale - 1, scale - 2, 2);
                }
            }
        }

        // Exit
        mctx.fillStyle = CFG.EXIT_COLOR;
        mctx.fillRect(ox + (maze.cols - 1) * scale + 1, oy + (maze.rows - 1) * scale + 1, scale - 2, scale - 2);

        // Enemies (visible only)
        for (const e of enemies) {
            if (!e.visible) continue;
            mctx.fillStyle = e.frozen ? CFG.FREEZE_COLOR : CFG.ENEMY_COLOR;
            mctx.fillRect(ox + e.colI * scale + 1, oy + e.rowI * scale + 1, scale - 2, scale - 2);
        }

        // Player
        mctx.fillStyle = CFG.PLAYER_GLOW;
        mctx.fillRect(ox + player.colI * scale, oy + player.rowI * scale, scale, scale);

        // Border
        mctx.strokeStyle = CFG.GLASS_BORDER;
        mctx.lineWidth = 1;
        mctx.strokeRect(0, 0, mc.width, mc.height);
    }

    formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
}
