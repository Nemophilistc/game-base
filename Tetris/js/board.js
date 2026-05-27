// 游戏板模块：消行、锁定、状态管理
import { COLS, ROWS, MAX_LOCK_RESETS } from './config.js';
import { fits, createPiece, randomPieceName } from './tetromino.js';
import { Sound } from './sound.js';

/**
 * 创建空棋盘
 */
export function createBoard() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

/**
 * 游戏状态对象
 */
export function createGameState() {
    return {
        board: createBoard(),
        current: null,
        next: null,
        hold: null,
        canHold: true,
        score: 0,
        level: 1,
        lines: 0,
        highScore: parseInt(localStorage.getItem('tetris_high')) || 0,
        gameActive: false,
        paused: false,
        dropTimer: 0,
        dropInterval: 500,
        lockTimer: 0,
        lockResets: 0,       // Bug fix: 锁定重置次数计数
        lastTime: 0,
        clearAnim: null      // { elapsed: number } 纯视觉消行动画
    };
}

/**
 * 生成新方块并检查游戏结束
 */
export function spawnNewPiece(state) {
    const nextName = state.next || randomPieceName();
    state.next = randomPieceName();
    state.current = createPiece(null, nextName);
    state.lockTimer = 0;
    state.lockResets = 0;

    if (!fits(state.current.shape, state.current.x, state.current.y, state.board)) {
        return false; // 游戏结束
    }
    return true;
}

/**
 * 锁定当前方块到棋盘
 * Bug fix: 同步消行，不再用 setTimeout 延迟
 */
export function lockPiece(state) {
    const cur = state.current;
    for (let r = 0; r < cur.shape.length; r++) {
        for (let c = 0; c < cur.shape[r].length; c++) {
            if (!cur.shape[r][c]) continue;
            const ny = cur.y + r;
            if (ny < 0) return 'gameover';
            state.board[ny][cur.x + c] = cur.color;
        }
    }

    // Bug fix: 同步消行（棋盘数据立即更新），不再用 setTimeout
    const clearedCount = clearLinesSync(state);
    if (clearedCount > 0) {
        // 纯视觉动画，棋盘数据已更新
        state.clearAnim = { elapsed: 0 };
        Sound.play(clearedCount >= 4 ? 'tetris' : 'clear');
    }

    state.canHold = true;

    // 消行后立即生成新方块（棋盘已是最新状态）
    if (!spawnNewPiece(state)) {
        return 'gameover';
    }
    return 'ok';
}

/**
 * 同步消除已满行，返回消除行数
 * Bug fix: 替代原来的 setTimeout 延迟消行
 */
function clearLinesSync(state) {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
        if (state.board[r].every(c => c)) {
            state.board.splice(r, 1);
            state.board.unshift(Array(COLS).fill(null));
            cleared++;
            r++; // 回退一行检查（splice 后上面的行下移了）
        }
    }

    if (cleared > 0) {
        const pts = [0, 100, 300, 500, 800][cleared] || 800;
        state.score += pts * state.level;
        state.lines += cleared;
        state.level = Math.floor(state.lines / 10) + 1;
        state.dropInterval = Math.max(50, 500 - (state.level - 1) * 40);
    }

    return cleared;
}

/**
 * 暂存操作
 */
export function doHold(state) {
    if (!state.canHold) return;
    state.canHold = false;
    if (state.hold) {
        const tmp = state.hold;
        state.hold = state.current.name;
        state.current = createPiece(tmp);
    } else {
        state.hold = state.current.name;
        state.current = createPiece(null, state.next);
        state.next = randomPieceName();
    }
    state.lockTimer = 0;
    state.lockResets = 0;
}

/**
 * 重置锁定计时器（移动/旋转时调用）
 * Bug fix: 增加最大重置次数限制（15次），超过后强制锁定
 * @returns {boolean} 是否成功重置
 */
export function resetLockTimer(state) {
    if (state.lockResets < MAX_LOCK_RESETS) {
        state.lockTimer = 0;
        state.lockResets++;
        return true;
    }
    return false; // 超过最大重置次数，不再重置
}
