// ============================================================
// ui.js - HUD 与菜单覆盖层管理
// ============================================================

/**
 * 更新 HUD 显示
 * @param {number} score
 * @param {number} roadSpeed
 * @param {number} highScore
 * @param {number} lives
 */
export function updateHUD(score, roadSpeed, highScore, lives) {
    document.getElementById('score').textContent = score;
    document.getElementById('speed').textContent = Math.floor(roadSpeed * 20) + 'km/h';
    document.getElementById('high').textContent = Math.max(highScore, score);
    const livesEl = document.getElementById('lives');
    if (livesEl) {
        livesEl.textContent = '❤'.repeat(Math.max(0, lives));
    }
}

/**
 * 隐藏开始菜单
 */
export function hideStartOverlay() {
    document.getElementById('startOverlay').classList.add('hidden');
}

/**
 * 隐藏游戏结束菜单
 */
export function hideGameOverOverlay() {
    document.getElementById('gameOverOverlay').classList.add('hidden');
}

/**
 * 显示游戏结束菜单
 * @param {number} score
 * @param {number} highScore
 * @param {number} lives - 剩余生命（用于判断是碰撞结束还是生命耗尽）
 */
export function showGameOver(score, highScore, lives) {
    const title = document.querySelector('#gameOverOverlay .overlay-title');
    if (lives <= 0) {
        title.textContent = '生命耗尽！';
    } else {
        title.textContent = '车祸！';
    }
    document.getElementById('goStats').innerHTML =
        `分数: ${score}<br>最高: ${highScore}`;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}
