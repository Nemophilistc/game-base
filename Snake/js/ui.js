/** UI 管理：HUD、菜单、模式选择、游戏结束画面 */

const els = {
    score:       () => document.getElementById('score'),
    length:      () => document.getElementById('length'),
    high:        () => document.getElementById('high'),
    startScreen: () => document.getElementById('startScreen'),
    overScreen:  () => document.getElementById('gameOverScreen'),
    overStats:   () => document.getElementById('gameOverStats'),
    pauseOverlay:() => document.getElementById('pauseOverlay'),
};

/** 更新 HUD 数值 */
export function updateHUD(score, length, highScore) {
    els.score().textContent  = score;
    els.length().textContent = length;
    els.high().textContent   = highScore || localStorage.getItem('snake_high') || 0;
}

/** 设置游戏模式并高亮按钮 */
export function setMode(mode, el) {
    document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
    return mode;
}

/** 显示开始菜单 */
export function showStartScreen() {
    els.overScreen().classList.add('hidden');
    els.startScreen().classList.remove('hidden');
}

/** 隐藏所有覆盖层，准备开始游戏 */
export function hideAllScreens() {
    els.startScreen().classList.add('hidden');
    els.overScreen().classList.add('hidden');
    els.pauseOverlay().classList.remove('active');
}

/** 切换暂停覆盖层 */
export function togglePause(paused) {
    els.pauseOverlay().classList.toggle('active', paused);
}

/** 显示游戏结束画面 */
export function showGameOver(score, length, highScore) {
    els.overScreen().classList.remove('hidden');
    els.overStats().innerHTML =
        `分数: ${score}<br>长度: ${length}<br>最高: ${highScore || 0}`;
}
