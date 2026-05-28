import { GAME_TIME } from './config.js';
import { Sound } from './sound.js';
import { spawnMole, whackMole, expireMoles, getSpawnRate, resetMoles } from './moles.js';
import {
    createBoard, renderMoles, flashHole, showPopup,
    showComboMilestone, updateInfoBar, updateTimeBar,
    hideOverlays, showEndOverlay
} from './ui.js';

// 游戏状态
let score = 0;
let combo = 0;
let maxCombo = 0;
let gameActive = false;
let timerStart = 0;
let lastSpawn = 0;
let highScore = parseInt(localStorage.getItem('whack_high')) || 0;

/** 开始/重新开始游戏 */
function startGame() {
    Sound.init();
    hideOverlays();

    score = 0;
    combo = 0;
    maxCombo = 0;
    gameActive = true;
    lastSpawn = 0;

    resetMoles();
    timerStart = performance.now();

    updateInfoBar(0, 0, highScore);
    renderMoles();
    requestAnimationFrame(gameLoop);
}

/** 敲击地鼠回调 */
function onWhack(idx) {
    if (!gameActive) return;

    const result = whackMole(idx, combo, maxCombo);
    if (!result) return;

    const holeEl = flashHole(idx);

    if (result.type === 'bomb') {
        score = Math.max(0, score + result.points);
        combo = result.combo;
        maxCombo = result.maxCombo;
        Sound.play(result.sound);
        showPopup(holeEl, result.points, '#f44336');
    } else {
        combo = result.combo;
        maxCombo = result.maxCombo;
        score += result.points;
        Sound.play(result.sound);
        showPopup(holeEl, '+' + result.points, result.type === 'golden' ? '#ffd700' : '#4caf50');

        if (result.isComboMilestone) {
            Sound.play('combo');
            showComboMilestone(combo);
        }
    }

    updateInfoBar(score, combo, highScore);
    renderMoles();
}

/** 主游戏循环 */
function gameLoop(time) {
    if (!gameActive) return;

    const elapsed = time - timerStart;
    const remaining = Math.max(0, GAME_TIME - elapsed);
    updateTimeBar(remaining, GAME_TIME);

    // 时间到
    if (remaining <= 0) {
        gameActive = false;
        Sound.play('end');
        highScore = Math.max(highScore, score);
        localStorage.setItem('whack_high', highScore);
        setTimeout(() => showEndOverlay(score, maxCombo, highScore), 300);
        renderMoles();
        return;
    }

    // 按节奏生成地鼠
    if (time - lastSpawn > getSpawnRate(score)) {
        spawnMole(score);
        lastSpawn = time;
    }

    // 过期地鼠自动消失
    if (expireMoles()) {
        combo = 0;
        updateInfoBar(score, combo, highScore);
    }

    renderMoles();
    requestAnimationFrame(gameLoop);
}

// 初始化：创建面板，显示初始最高分
createBoard(onWhack);
updateInfoBar(0, 0, highScore);

// 暴露startGame给HTML按钮的onclick
window.startGame = startGame;
