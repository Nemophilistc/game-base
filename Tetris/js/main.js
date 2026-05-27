// 游戏主循环、初始化、事件监听
import { Sound } from './sound.js';
import { rotate, fits, getGhostY } from './tetromino.js';
import {
    createGameState, spawnNewPiece, lockPiece,
    doHold, resetLockTimer
} from './board.js';
import { draw, updateHUD, initHUD } from './ui.js';
import { LOCK_DELAY_MS, CLEAR_ANIM_DURATION } from './config.js';

let state = createGameState();
initHUD(state.highScore);

// ========== 游戏启动 ==========

function startGame() {
    Sound.init();
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');

    state = createGameState();
    state.gameActive = true;
    state.highScore = parseInt(localStorage.getItem('tetris_high')) || 0;

    spawnNewPiece(state);
    updateHUD(state);
}

// 暴露给 HTML onclick
window.startGame = startGame;

// ========== 游戏结束 ==========

function endGame() {
    state.gameActive = false;
    Sound.play('gameover');
    state.highScore = Math.max(state.highScore, state.score);
    localStorage.setItem('tetris_high', state.highScore);

    setTimeout(() => {
        document.getElementById('goStats').innerHTML =
            `分数: ${state.score}<br>等级: ${state.level}<br>消行: ${state.lines}<br>最高: ${state.highScore}`;
        document.getElementById('gameOverOverlay').classList.remove('hidden');
    }, 500);
}

// ========== 锁定处理（含 Bug fix）==========

function handleLock() {
    const result = lockPiece(state);
    if (result === 'gameover') {
        endGame();
    }
    state.dropTimer = 0;
}

// ========== 键盘事件 ==========

window.addEventListener('keydown', e => {
    if (e.code === 'KeyP' && state.gameActive) {
        state.paused = !state.paused;
        return;
    }
    if (e.code === 'KeyR') {
        startGame();
        return;
    }
    if (!state.gameActive || state.paused) return;

    const cur = state.current;
    if (!cur) return;

    switch (e.code) {
        case 'ArrowLeft': case 'KeyA':
            if (fits(cur.shape, cur.x - 1, cur.y, state.board)) {
                cur.x--;
                Sound.play('move');
                resetLockTimer(state);
            }
            e.preventDefault();
            break;

        case 'ArrowRight': case 'KeyD':
            if (fits(cur.shape, cur.x + 1, cur.y, state.board)) {
                cur.x++;
                Sound.play('move');
                resetLockTimer(state);
            }
            e.preventDefault();
            break;

        case 'ArrowDown': case 'KeyS':
            if (fits(cur.shape, cur.x, cur.y + 1, state.board)) {
                cur.y++;
                state.score += 1;
                state.dropTimer = 0;
            }
            e.preventDefault();
            break;

        case 'ArrowUp': case 'KeyW': {
            const rotated = rotate(cur.shape);
            for (const dx of [0, -1, 1, -2, 2]) {
                if (fits(rotated, cur.x + dx, cur.y, state.board)) {
                    cur.shape = rotated;
                    cur.x += dx;
                    Sound.play('rotate');
                    resetLockTimer(state);
                    break;
                }
            }
            e.preventDefault();
            break;
        }

        case 'Space': {
            const ghostY = getGhostY(cur, state.board);
            state.score += (ghostY - cur.y) * 2;
            cur.y = ghostY;
            handleLock();
            Sound.play('drop');
            e.preventDefault();
            break;
        }

        case 'KeyC':
            doHold(state);
            break;
    }
});

// ========== 游戏主循环 ==========

function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    if (!state.gameActive || state.paused) return;

    // 跳过首帧
    if (state.lastTime === 0) {
        state.lastTime = time;
        return;
    }
    const dt = time - state.lastTime;
    state.lastTime = time;

    // 消行动画计时（纯视觉效果，棋盘数据已同步更新）
    if (state.clearAnim) {
        state.clearAnim.elapsed = (state.clearAnim.elapsed || 0) + dt;
        if (state.clearAnim.elapsed >= CLEAR_ANIM_DURATION) {
            state.clearAnim = null;
        }
    }

    state.dropTimer += dt;

    // 锁定延迟逻辑（含 Bug fix: 最大重置次数）
    if (fits(state.current.shape, state.current.x, state.current.y + 1, state.board)) {
        // 还能下落，重置锁定计时（不消耗重置次数——只有主动移动/旋转才消耗）
        state.lockTimer = 0;
        if (state.dropTimer >= state.dropInterval) {
            state.dropTimer = 0;
            state.current.y++;
        }
    } else {
        // 不能下落，开始锁定倒计时
        state.lockTimer += dt;
        if (state.lockTimer >= LOCK_DELAY_MS) {
            handleLock();
        }
    }

    draw(state);
    updateHUD(state);
}

// ========== 启动 ==========
requestAnimationFrame(gameLoop);
