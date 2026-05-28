// js/ui.js - DOM渲染、菜单

export function renderBoard(cardsArr, flippedArr, matchedArr, cols, onCardClick) {
    const board = document.getElementById('board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${cols},90px)`;
    for (let i = 0; i < cardsArr.length; i++) {
        const card = document.createElement('div');
        card.className = 'card';
        if (flippedArr[i] || matchedArr[i]) {
            card.classList.add(flippedArr[i] && !matchedArr[i] ? 'flipped' : 'matched');
        }
        card.innerHTML = `<div class="card-inner"><div class="card-front">?</div><div class="card-back">${cardsArr[i]}</div></div>`;
        card.addEventListener('click', () => onCardClick(i));
        board.appendChild(card);
    }
}

export function updateInfo(moves, matchCount, totalPairs) {
    document.getElementById('moves').textContent = moves;
    document.getElementById('pairs').textContent = `${matchCount}/${totalPairs}`;
}

export function updateTimer(seconds) {
    document.getElementById('timer').textContent = seconds;
}

export function showStartOverlay() {
    document.getElementById('startOverlay').classList.remove('hidden');
    document.getElementById('winOverlay').classList.add('hidden');
}

export function hideOverlays() {
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('winOverlay').classList.add('hidden');
}

export function showWinOverlay(moves, elapsed, best) {
    document.getElementById('winStats').innerHTML =
        `步数: ${moves}<br>时间: ${elapsed}秒<br>最佳: ${best}步`;
    document.getElementById('winOverlay').classList.remove('hidden');
}

export function setActiveDiffBtn(el) {
    document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
    if (el) el.classList.add('active');
}
