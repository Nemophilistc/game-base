import { HOLE_COUNT, MOLE_TYPES } from './config.js';
import { moles } from './moles.js';

/**
 * 创建3x3地鼠洞面板，绑定点击回调
 * @param {function(number):void} onWhack - 点击地鼠洞的回调，参数为洞索引
 */
export function createBoard(onWhack) {
    const board = document.getElementById('board');
    board.innerHTML = '';
    for (let i = 0; i < HOLE_COUNT; i++) {
        const hole = document.createElement('div');
        hole.className = 'hole';
        const mole = document.createElement('div');
        mole.className = 'mole';
        mole.textContent = MOLE_TYPES.normal.emoji;
        hole.appendChild(mole);
        hole.addEventListener('click', () => onWhack(i));
        board.appendChild(hole);
    }
}

/** 根据moles数组渲染所有洞的地鼠状态 */
export function renderMoles() {
    const holes = document.querySelectorAll('.hole');
    for (let i = 0; i < HOLE_COUNT; i++) {
        const moleEl = holes[i].querySelector('.mole');
        if (moles[i]) {
            moleEl.classList.add('up');
            moleEl.classList.remove('normal', 'golden', 'bomb');
            moleEl.classList.add(moles[i].type);
            moleEl.textContent = MOLE_TYPES[moles[i].type].emoji;
        } else {
            moleEl.classList.remove('up', 'normal', 'golden', 'bomb');
        }
    }
}

/** 给被敲击的洞添加闪光动画 */
export function flashHole(idx) {
    const hole = document.querySelectorAll('.hole')[idx];
    hole.classList.add('hit');
    setTimeout(() => hole.classList.remove('hit'), 300);
    return hole;
}

/** 在洞上方显示浮动分数 */
export function showPopup(holeEl, text, color) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.textContent = text;
    popup.style.color = color;
    holeEl.appendChild(popup);
    setTimeout(() => popup.remove(), 800);
}

/** 屏幕中央显示连击里程碑文字 */
export function showComboMilestone(combo) {
    const ct = document.getElementById('comboText');
    ct.textContent = combo + ' 连击！';
    ct.classList.add('active');
    setTimeout(() => ct.classList.remove('active'), 800);
}

/** 更新顶部信息栏 */
export function updateInfoBar(score, combo, highScore) {
    document.getElementById('score').textContent = score;
    document.getElementById('combo').textContent = combo;
    document.getElementById('high').textContent = highScore;
}

/** 更新时间条 */
export function updateTimeBar(remaining, total) {
    document.getElementById('timeFill').style.width = (remaining / total * 100) + '%';
}

/** 隐藏所有覆盖层 */
export function hideOverlays() {
    document.getElementById('startOverlay').classList.add('hidden');
    document.getElementById('endOverlay').classList.add('hidden');
}

/** 显示结算界面 */
export function showEndOverlay(score, maxCombo, highScore) {
    document.getElementById('endStats').innerHTML =
        `分数: ${score}<br>最大连击: ${maxCombo}<br>最高: ${highScore}`;
    document.getElementById('endOverlay').classList.remove('hidden');
}
