// ui.js - UI overlays and HUD rendering

import { COLORS, BLACK, WHITE, DIFFICULTY, BOARD_SIZE, CELL_SIZE, BOARD_PADDING, HUD_HEIGHT } from './config.js';

let overlayState = 'start'; // 'start', 'game', 'over'
let startOptions = {
    mode: 'ai',       // 'ai' or 'pvp'
    difficulty: 'medium'
};
let overData = { winner: null, blackCount: 0, whiteCount: 0, highScore: 0 };

// Callbacks
let onStartGame = null;
let onRestart = null;

export function setStartCallback(cb) { onStartGame = cb; }
export function setRestartCallback(cb) { onRestart = cb; }
export function getOverlayState() { return overlayState; }
export function getStartOptions() { return startOptions; }

export function showStart() {
    overlayState = 'start';
}

export function showGameOver(winner, blackCount, whiteCount) {
    overlayState = 'over';
    const hs = parseInt(localStorage.getItem('reversi_highscore') || '0', 10);
    const currentMax = Math.max(blackCount, whiteCount);
    if (currentMax > hs) {
        localStorage.setItem('reversi_highscore', currentMax.toString());
    }
    overData = {
        winner,
        blackCount,
        whiteCount,
        highScore: Math.max(hs, currentMax)
    };
}

export function hideOverlay() {
    overlayState = 'game';
}

export function initUI() {
    // Create overlay container
    const container = document.getElementById('overlay-container');
    if (!container) return;

    renderStartOverlay(container);
    renderGameOverOverlay(container);

    // Listen for clicks on overlay container
    container.addEventListener('click', handleOverlayClick);
}

function renderStartOverlay(container) {
    const overlay = document.createElement('div');
    overlay.id = 'start-overlay';
    overlay.className = 'overlay active';

    overlay.innerHTML = `
        <div class="glass-panel start-panel">
            <h1 class="game-title">翻转棋</h1>
            <p class="game-subtitle">Othello / Reversi</p>

            <div class="option-group">
                <label class="option-label">游戏模式</label>
                <div class="button-group" data-group="mode">
                    <button class="option-btn active" data-value="ai">人机对战</button>
                    <button class="option-btn" data-value="pvp">双人对战</button>
                </div>
            </div>

            <div class="option-group" id="difficulty-group">
                <label class="option-label">AI难度</label>
                <div class="button-group" data-group="difficulty">
                    <button class="option-btn" data-value="easy">简单</button>
                    <button class="option-btn active" data-value="medium">中等</button>
                    <button class="option-btn" data-value="hard">困难</button>
                </div>
            </div>

            <button class="start-btn" id="start-btn">开始游戏</button>

            <div class="help-box">
                <h3>游戏规则</h3>
                <ul>
                    <li>黑棋先行，双方轮流落子</li>
                    <li>落子必须夹住对手的棋子（横、竖、斜均可）</li>
                    <li>被夹住的棋子全部翻转为己方颜色</li>
                    <li>无合法落子时跳过回合</li>
                    <li>双方都无合法落子时游戏结束</li>
                    <li>棋盘上棋子多的一方获胜</li>
                </ul>
            </div>
        </div>
    `;

    container.appendChild(overlay);
}

function renderGameOverOverlay(container) {
    const overlay = document.createElement('div');
    overlay.id = 'gameover-overlay';
    overlay.className = 'overlay';

    overlay.innerHTML = `
        <div class="glass-panel gameover-panel">
            <h2 class="winner-title" id="winner-title">游戏结束</h2>
            <div class="final-score">
                <div class="score-item black-score">
                    <div class="score-disc black-disc-icon"></div>
                    <span class="score-num" id="final-black">0</span>
                </div>
                <div class="score-vs">VS</div>
                <div class="score-item white-score">
                    <div class="score-disc white-disc-icon"></div>
                    <span class="score-num" id="final-white">0</span>
                </div>
            </div>
            <div class="high-score-line">
                最高纪录: <span id="high-score">0</span> 颗
            </div>
            <button class="start-btn" id="restart-btn">再来一局</button>
        </div>
    `;

    container.appendChild(overlay);
}

function handleOverlayClick(e) {
    const target = e.target;

    // Option buttons
    if (target.classList.contains('option-btn')) {
        const group = target.closest('.button-group');
        if (!group) return;
        const groupName = group.dataset.group;

        // Deselect siblings
        group.querySelectorAll('.option-btn').forEach(btn => btn.classList.remove('active'));
        target.classList.add('active');

        if (groupName === 'mode') {
            startOptions.mode = target.dataset.value;
            document.getElementById('difficulty-group').style.display =
                startOptions.mode === 'ai' ? '' : 'none';
        } else if (groupName === 'difficulty') {
            startOptions.difficulty = target.dataset.value;
        }
    }

    // Start button
    if (target.id === 'start-btn') {
        if (onStartGame) onStartGame(startOptions);
    }

    // Restart button
    if (target.id === 'restart-btn') {
        if (onRestart) onRestart();
    }
}

export function updateGameOverUI() {
    const titleEl = document.getElementById('winner-title');
    const blackEl = document.getElementById('final-black');
    const whiteEl = document.getElementById('final-white');
    const hsEl = document.getElementById('high-score');

    if (!titleEl) return;

    if (overData.winner === BLACK) {
        titleEl.textContent = '黑棋获胜!';
        titleEl.style.color = '#f0f0f0';
    } else if (overData.winner === WHITE) {
        titleEl.textContent = '白棋获胜!';
        titleEl.style.color = '#f0f0f0';
    } else {
        titleEl.textContent = '平局!';
        titleEl.style.color = COLORS.teal;
    }

    blackEl.textContent = overData.blackCount;
    whiteEl.textContent = overData.whiteCount;
    hsEl.textContent = overData.highScore;
}

/**
 * Draw HUD elements on canvas
 */
export function drawHUD(ctx, canvasWidth, currentTurn, blackCount, whiteCount, difficulty, isPVP, validMoveCount, animating) {
    const hudY = 10;

    // Background bar
    ctx.save();
    ctx.fillStyle = 'rgba(10, 25, 18, 0.9)';
    ctx.fillRect(0, 0, canvasWidth, 52);
    ctx.strokeStyle = COLORS.glassBorder;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 52);
    ctx.lineTo(canvasWidth, 52);
    ctx.stroke();

    // Black score
    const centerX = canvasWidth / 2;

    // Black disc icon
    ctx.beginPath();
    ctx.arc(centerX - 120, hudY + 20, 14, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.blackDisc;
    ctx.fill();
    ctx.strokeStyle = 'rgba(80,80,80,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Black count
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(blackCount.toString(), centerX - 98, hudY + 27);

    // Turn indicator
    ctx.textAlign = 'center';
    ctx.font = '14px "Segoe UI", sans-serif';

    if (currentTurn === BLACK) {
        ctx.fillStyle = COLORS.textAccent;
        ctx.fillText('黑棋走', centerX, hudY + 15);
        // Arrow
        ctx.beginPath();
        ctx.moveTo(centerX - 5, hudY + 22);
        ctx.lineTo(centerX + 5, hudY + 22);
        ctx.lineTo(centerX, hudY + 28);
        ctx.closePath();
        ctx.fillStyle = COLORS.textAccent;
        ctx.fill();
    } else {
        ctx.fillStyle = COLORS.textAccent;
        ctx.fillText('白棋走', centerX, hudY + 15);
        ctx.beginPath();
        ctx.moveTo(centerX - 5, hudY + 22);
        ctx.lineTo(centerX + 5, hudY + 22);
        ctx.lineTo(centerX, hudY + 28);
        ctx.closePath();
        ctx.fill();
    }

    // Difficulty / mode
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillStyle = COLORS.textSecondary;
    if (isPVP) {
        ctx.fillText('双人对战', centerX, hudY + 42);
    } else {
        ctx.fillText(`AI: ${DIFFICULTY[difficulty].label}`, centerX, hudY + 42);
    }

    // White count
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'right';
    ctx.fillText(whiteCount.toString(), centerX + 98, hudY + 27);

    // White disc icon
    ctx.beginPath();
    ctx.arc(centerX + 120, hudY + 20, 14, 0, Math.PI * 2);
    const wGrad = ctx.createRadialGradient(centerX + 117, hudY + 17, 0, centerX + 120, hudY + 20, 14);
    wGrad.addColorStop(0, COLORS.whiteDiscHighlight);
    wGrad.addColorStop(1, COLORS.whiteDisc);
    ctx.fillStyle = wGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(200,200,200,0.3)';
    ctx.stroke();

    ctx.textAlign = 'left';

    // Valid move count hint (below board)
    if (validMoveCount === 0 && !animating) {
        const boardBottom = HUD_HEIGHT + BOARD_PADDING + BOARD_SIZE * CELL_SIZE + 16;
        ctx.textAlign = 'center';
        ctx.font = '13px "Segoe UI", sans-serif';
        ctx.fillStyle = COLORS.textSecondary;
        ctx.fillText('无合法落子，回合跳过', centerX, boardBottom);
        ctx.textAlign = 'left';
    }

    ctx.restore();
}
