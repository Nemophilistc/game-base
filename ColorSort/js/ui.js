import { state, LEVELS } from './config.js';

export function updateHUD() {
  const el = document.getElementById('level');
  if (el) el.textContent = state.currentLevel + 1;
  const mv = document.getElementById('moves');
  if (mv) mv.textContent = state.moves;
  const un = document.getElementById('undos');
  if (un) un.textContent = state.undosLeft;
  const tm = document.getElementById('timer');
  if (tm) tm.textContent = formatTime(state.timer);
}

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export function showStartOverlay() {
  document.getElementById('startOverlay').classList.remove('hidden');
  document.getElementById('gameOverOverlay').classList.add('hidden');
  document.getElementById('winOverlay').classList.add('hidden');
  buildLevelGrid();
}

function buildLevelGrid() {
  const grid = document.getElementById('levelGrid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < LEVELS.length; i++) {
    const btn = document.createElement('button');
    btn.className = 'level-btn';
    const stars = state.stars[`l${i}`] || 0;
    const locked = i > 0 && !state.stars[`l${i-1}`] && i > Object.keys(state.stars).length;
    btn.innerHTML = `${i + 1}${stars ? '<br>' + '★'.repeat(stars) + '☆'.repeat(3-stars) : ''}`;
    if (locked) btn.classList.add('locked');
    btn.onclick = () => {
      if (!locked) {
        document.getElementById('startOverlay').classList.add('hidden');
        if (window.startLevel) window.startLevel(i);
      }
    };
    grid.appendChild(btn);
  }
}

export function showWinOverlay(stars, moves, time) {
  const el = document.getElementById('winOverlay');
  el.classList.remove('hidden');
  document.getElementById('winStats').innerHTML =
    `步数: ${moves} | 时间: ${formatTime(time)}<br>评级: ${'★'.repeat(stars)}${'☆'.repeat(3-stars)}`;
}

export function showGameOverOverlay() {
  document.getElementById('gameOverOverlay').classList.remove('hidden');
}
