import { state, TUBE_CAPACITY, COLORS, LEVELS, saveHighScore } from './config.js';
import { SoundManager } from './sound.js';
import { generateLevel, canPour, pour, isTubeComplete, isAllComplete, getTopColorCount, drawTube } from './tubes.js';
import { EffectManager } from './effects.js';
import { updateHUD, showStartOverlay, showWinOverlay } from './ui.js';

const sound = new SoundManager();
const effects = new EffectManager();

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let tubeRects = [];
let hoverTube = -1;
let history = [];
let gameTime = 0;

function layoutTubes() {
  const count = state.tubes.length;
  const cols = Math.min(count, 8);
  const rows = Math.ceil(count / cols);
  const tubeW = 60;
  const tubeH = 160;
  const gap = 16;
  const totalW = cols * tubeW + (cols - 1) * gap;
  const startX = (canvas.width - totalW) / 2;
  const startY = canvas.height - rows * (tubeH + gap) - 40;

  tubeRects = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    tubeRects.push({
      x: startX + col * (tubeW + gap),
      y: startY + row * (tubeH + gap),
      w: tubeW, h: tubeH
    });
  }
}

function startLevel(levelIdx) {
  state.currentLevel = levelIdx;
  state.tubes = generateLevel(levelIdx);
  state.selectedTube = -1;
  state.moves = 0;
  state.undosLeft = 3;
  state.timer = 0;
  state.gameActive = true;
  state.pouring = false;
  history = [];
  gameTime = 0;
  layoutTubes();
  updateHUD();
}

window.startLevel = startLevel;

function getTubeAt(mx, my) {
  for (let i = 0; i < tubeRects.length; i++) {
    const r = tubeRects[i];
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) return i;
  }
  return -1;
}

function handleClick(mx, my) {
  if (!state.gameActive || state.pouring) return;
  const idx = getTubeAt(mx, my);
  if (idx === -1) { state.selectedTube = -1; return; }

  if (state.selectedTube === -1) {
    if (state.tubes[idx].length > 0) {
      state.selectedTube = idx;
      sound.play('select');
    }
  } else if (state.selectedTube === idx) {
    state.selectedTube = -1;
  } else {
    const from = state.tubes[state.selectedTube];
    const to = state.tubes[idx];
    if (canPour(from, to)) {
      // Save undo
      history.push({
        from: state.selectedTube,
        to: idx,
        fromState: [...from],
        toState: [...to]
      });
      const count = getTopColorCount(from);
      const maxPour = TUBE_CAPACITY - to.length;
      const actual = Math.min(count, maxPour);
      for (let i = 0; i < actual; i++) pour(from, to);

      state.moves++;
      state.selectedTube = -1;
      sound.play('pour');

      if (isTubeComplete(state.tubes[idx])) {
        const r = tubeRects[idx];
        effects.addComplete(r.x + r.w/2, r.y + r.h/2, state.tubes[idx][0]);
        sound.play('complete');
      }

      if (isAllComplete(state.tubes)) {
        state.gameActive = false;
        const stars = saveHighScore(state.currentLevel, state.moves, state.timer);
        sound.play('level');
        setTimeout(() => showWinOverlay(stars, state.moves, state.timer), 500);
      }
      updateHUD();
    } else {
      sound.play('invalid');
      state.selectedTube = -1;
    }
  }
}

function undo() {
  if (!state.gameActive || history.length === 0 || state.undosLeft <= 0) return;
  const h = history.pop();
  state.tubes[h.from] = h.fromState;
  state.tubes[h.to] = h.toState;
  state.undosLeft--;
  state.moves--;
  state.selectedTube = -1;
  sound.play('undo');
  updateHUD();
}

canvas.addEventListener('click', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  handleClick((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  hoverTube = getTubeAt((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
});

canvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const touch = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  handleClick((touch.clientX - rect.left) * scaleX, (touch.clientY - rect.top) * scaleY);
}, { passive: false });

document.addEventListener('keydown', e => {
  if (e.key === 'r' || e.key === 'R') startLevel(state.currentLevel);
  if (e.key === 'z' || e.key === 'Z') undo();
});

document.getElementById('btnUndo').addEventListener('click', undo);
document.getElementById('btnRestart').addEventListener('click', () => startLevel(state.currentLevel));
document.getElementById('btnNext')?.addEventListener('click', () => {
  if (state.currentLevel < LEVELS.length - 1) {
    document.getElementById('winOverlay').classList.add('hidden');
    startLevel(state.currentLevel + 1);
  }
});

let lastTime = 0;
function gameLoop(ts) {
  const dt = (ts - lastTime) / 1000;
  lastTime = ts;
  if (state.gameActive) {
    state.timer += dt;
    gameTime += dt;
    if (Math.floor(gameTime) !== Math.floor(gameTime - dt)) updateHUD();
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw tubes
  for (let i = 0; i < state.tubes.length; i++) {
    const r = tubeRects[i];
    if (!r) continue;
    drawTube(ctx, r.x, r.y, r.w, r.h, state.tubes[i],
      state.selectedTube === i, hoverTube === i, null);
  }

  effects.update();
  effects.draw(ctx);

  requestAnimationFrame(gameLoop);
}

showStartOverlay();
requestAnimationFrame(gameLoop);
