// UI系统（HUD、菜单覆盖层）

export class UI {
    constructor() {
        this.scoreEl = document.getElementById('score');
        this.levelEl = document.getElementById('level');
        this.livesEl = document.getElementById('lives');
        this.highEl = document.getElementById('high');
        this.startOverlay = document.getElementById('startOverlay');
        this.gameOverOverlay = document.getElementById('gameOverOverlay');
        this.goStats = document.getElementById('goStats');
    }

    updateHUD(score, level, lives, highScore) {
        this.scoreEl.textContent = score;
        this.levelEl.textContent = level;
        this.livesEl.textContent = lives;
        this.highEl.textContent = Math.max(highScore, score);
    }

    showStart() {
        this.startOverlay.classList.remove('hidden');
        this.gameOverOverlay.classList.add('hidden');
    }

    hideStart() {
        this.startOverlay.classList.add('hidden');
        this.gameOverOverlay.classList.add('hidden');
    }

    showGameOver(score, level, highScore) {
        this.goStats.innerHTML = `分数: ${score}<br>关卡: ${level}<br>最高: ${highScore}`;
        this.gameOverOverlay.classList.remove('hidden');
    }

    hideGameOver() {
        this.gameOverOverlay.classList.add('hidden');
    }
}
