export function updateHUD(score, lives, highScore) {
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('high').textContent = Math.max(highScore, score);
}

export function hideAllOverlays() {
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('gameOverOverlay').classList.add('hidden');
    document.getElementById('winOverlay').classList.add('hidden');
}

export function showGameOver(score, highScore) {
    document.getElementById('goStats').innerHTML = `分数: ${score}<br>最高: ${highScore}`;
    document.getElementById('gameOverOverlay').classList.remove('hidden');
}

export function showWin(score, highScore) {
    document.getElementById('winStats').innerHTML = `分数: ${score}<br>最高: ${highScore}`;
    document.getElementById('winOverlay').classList.remove('hidden');
}
