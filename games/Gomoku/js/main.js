// main.js — 游戏初始化、事件监听

import { BOARD_SIZE, BLACK, WHITE, COLOR_NAME } from './config.js';
import { playPlace, playWin, playLose } from './sound.js';
import { Board } from './board.js';
import { getAIMove } from './ai.js';
import { checkWin, isValidMove, isBoardFull } from './rules.js';
import { Renderer } from './ui.js';

// ---------- 状态 ----------

let board = new Board();
let renderer;
let gameMode = 'pve';       // 'pvp' | 'pve'
let playerColor = BLACK;    // 玩家执子颜色（人机模式）
let aiColor = WHITE;
let difficulty = 'medium';
let gameOver = false;
let winLine = null;
let aiThinking = false;

// ---------- DOM ----------

const $ = (sel) => document.querySelector(sel);

function init() {
    const canvas = $('#board');
    renderer = new Renderer(canvas);

    bindEvents(canvas);
    render();
    updateStatus();
    updateHistory();
}

// ---------- 事件 ----------

function bindEvents(canvas) {
    // 棋盘点击
    canvas.addEventListener('click', onCanvasClick);
    canvas.addEventListener('mousemove', onCanvasMove);
    canvas.addEventListener('mouseleave', () => {
        renderer.hoverPos = null;
        render();
    });

    // 模式选择
    $('#btn-pvp').addEventListener('click', () => setMode('pvp'));
    $('#btn-pve').addEventListener('click', () => setMode('pve'));

    // 难度选择
    $('#difficulty').addEventListener('change', (e) => {
        difficulty = e.target.value;
    });

    // 先手选择
    $('#btn-black').addEventListener('click', () => setPlayerColor(BLACK));
    $('#btn-white').addEventListener('click', () => setPlayerColor(WHITE));

    // 悔棋
    $('#btn-undo').addEventListener('click', undoMove);

    // 新局
    $('#btn-restart').addEventListener('click', restart);

    // 覆盖层按钮
    $('#btn-play-again').addEventListener('click', () => {
        hideOverlay();
        restart();
    });
}

function onCanvasClick(e) {
    if (gameOver || aiThinking) return;

    const rect = e.target.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const pos = renderer.pxToBoard(px, py);
    if (!pos) return;

    const { row, col } = pos;

    // 人机模式：只在轮到玩家时响应
    if (gameMode === 'pve' && board.current !== playerColor) return;

    if (!isValidMove(board.grid, row, col)) return;

    doMove(row, col);
}

function onCanvasMove(e) {
    if (gameOver || aiThinking) return;
    const rect = e.target.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const pos = renderer.pxToBoard(px, py);
    renderer.hoverPos = pos;
    render();
}

// ---------- 游戏逻辑 ----------

function doMove(row, col) {
    const player = board.current;
    board.place(row, col, player);
    playPlace();

    // 检查胜负
    const win = checkWin(board.grid, row, col, player);
    if (win) {
        winLine = win;
        gameOver = true;
        render();
        onGameEnd(player);
        return;
    }

    // 检查平局
    if (isBoardFull(board.grid)) {
        gameOver = true;
        render();
        onDraw();
        return;
    }

    render();
    updateStatus();
    updateHistory();

    // 人机模式：AI 走
    if (gameMode === 'pve' && board.current === aiColor && !gameOver) {
        aiThinking = true;
        updateStatus('AI 思考中...');
        setTimeout(() => {
            const move = getAIMove(board, aiColor, difficulty);
            aiThinking = false;
            doMove(move.row, move.col);
        }, 100);
    }
}

function onGameEnd(winner) {
    const isPlayerWin = gameMode === 'pvp' || winner === playerColor;
    if (isPlayerWin) {
        playWin();
        showOverlay(`🎉 ${COLOR_NAME[winner]}获胜！`, '#4CAF50');
    } else {
        playLose();
        showOverlay(`😔 ${COLOR_NAME[winner]}获胜！`, '#e53935');
    }
    updateStatus(`游戏结束 — ${COLOR_NAME[winner]}获胜！`);
}

function onDraw() {
    showOverlay('🤝 平局！', '#FF9800');
    updateStatus('平局！');
}

function undoMove() {
    if (gameOver || board.moveCount === 0) return;

    if (gameMode === 'pve') {
        // 人机模式悔两步（AI + 玩家）
        board.undo();
        if (board.moveCount > 0 && board.current !== playerColor) {
            board.undo();
        }
    } else {
        board.undo();
    }

    winLine = null;
    gameOver = false;
    hideOverlay();
    render();
    updateStatus();
    updateHistory();
}

function restart() {
    board.reset();
    gameOver = false;
    winLine = null;
    aiThinking = false;
    hideOverlay();
    render();
    updateStatus();
    updateHistory();

    // 如果人机模式玩家选白，AI先手
    if (gameMode === 'pve' && playerColor === WHITE) {
        aiThinking = true;
        updateStatus('AI 思考中...');
        setTimeout(() => {
            const move = getAIMove(board, aiColor, difficulty);
            aiThinking = false;
            doMove(move.row, move.col);
        }, 200);
    }
}

// ---------- 模式设置 ----------

function setMode(mode) {
    gameMode = mode;
    $('#btn-pvp').classList.toggle('active', mode === 'pvp');
    $('#btn-pve').classList.toggle('active', mode === 'pve');
    $('#difficulty-group').style.display = mode === 'pve' ? 'flex' : 'none';
    $('#color-group').style.display = mode === 'pve' ? 'flex' : 'none';
    restart();
}

function setPlayerColor(color) {
    playerColor = color;
    aiColor = color === BLACK ? WHITE : BLACK;
    $('#btn-black').classList.toggle('active', color === BLACK);
    $('#btn-white').classList.toggle('active', color === WHITE);
    restart();
}

// ---------- 渲染 ----------

function render() {
    renderer.draw(board.grid, board.lastMove, winLine);
}

function updateStatus(text) {
    const el = $('#status');
    if (text) {
        el.textContent = text;
        return;
    }
    if (gameOver) return;
    const name = COLOR_NAME[board.current];
    if (gameMode === 'pve') {
        el.textContent = board.current === playerColor ? `轮到你（${name}）` : `AI（${name}）思考中...`;
    } else {
        el.textContent = `${name}落子`;
    }
}

function updateHistory() {
    const el = $('#history');
    if (board.moveCount === 0) {
        el.innerHTML = '<div class="history-empty">暂无走法</div>';
        return;
    }
    let html = '';
    for (let i = 0; i < board.history.length; i++) {
        const m = board.history[i];
        const colLabel = String.fromCharCode(65 + m.col);
        const rowLabel = BOARD_SIZE - m.row;
        const color = m.player === BLACK ? '●' : '○';
        const num = String(i + 1).padStart(2, ' ');
        html += `<div class="history-item"><span class="h-num">${num}.</span> <span class="h-stone ${m.player === BLACK ? 'black' : 'white'}">${color}</span> ${colLabel}${rowLabel}</div>`;
    }
    el.innerHTML = html;
    el.scrollTop = el.scrollHeight;
}

// ---------- 覆盖层 ----------

function showOverlay(msg, color) {
    const overlay = $('#overlay');
    const msgEl = $('#overlay-msg');
    msgEl.textContent = msg;
    msgEl.style.color = color;
    overlay.classList.add('show');
}

function hideOverlay() {
    $('#overlay').classList.remove('show');
}

// ---------- 启动 ----------

document.addEventListener('DOMContentLoaded', init);
