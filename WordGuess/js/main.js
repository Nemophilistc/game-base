// main.js - 游戏初始化、事件监听、统计系统

import { WORD_LENGTH, MAX_GUESSES, GAME_STATE, MODE, STORAGE_KEY } from './config.js';
import { playKeyInput, playFlip, playWin, playLose, playError, playDelete } from './sound.js';
import { getWordList } from './dictionary.js';
import {
  createBoard, addLetter, deleteLetter, submitGuess,
  getDailyWord, getRandomWord
} from './board.js';
import { createKeyboard, updateKeyboard } from './keyboard.js';
import {
  createBoardDOM, updateRow, flipRow, shakeRow, bounceRow,
  showMessage, updateHeader, showGameOver, hideGameOver,
  showStats, hideStats
} from './ui.js';

// ===== 游戏状态 =====
let board = null;
let cells = null;
let currentMode = MODE.ENGLISH;
let isDailyChallenge = false;
let isAnimating = false;

// ===== 统计系统 =====
function loadStats(mode) {
  const key = mode === MODE.CHINESE ? STORAGE_KEY.STATS_CHINESE : STORAGE_KEY.STATS_ENGLISH;
  const saved = localStorage.getItem(key);
  if (saved) return JSON.parse(saved);

  return {
    gamesPlayed: 0,
    wins: 0,
    currentStreak: 0,
    maxStreak: 0,
    guessDistribution: {},  // {1: count, 2: count, ...}
  };
}

function saveStats(mode, stats) {
  const key = mode === MODE.CHINESE ? STORAGE_KEY.STATS_CHINESE : STORAGE_KEY.STATS_ENGLISH;
  localStorage.setItem(key, JSON.stringify(stats));
}

function updateStats(mode, won, guessCount) {
  const stats = loadStats(mode);
  stats.gamesPlayed++;

  if (won) {
    stats.wins++;
    stats.currentStreak++;
    stats.maxStreak = Math.max(stats.maxStreak, stats.currentStreak);
    stats.guessDistribution[guessCount] = (stats.guessDistribution[guessCount] || 0) + 1;
  } else {
    stats.currentStreak = 0;
  }

  saveStats(mode, stats);
  return stats;
}

// ===== 每日挑战 =====
function getDailyKey() {
  const today = new Date();
  return `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
}

function loadDailyState() {
  const key = STORAGE_KEY.DAILY_STATE;
  const saved = localStorage.getItem(key);
  if (saved) {
    const state = JSON.parse(saved);
    if (state.date === getDailyKey() && state.mode === currentMode) {
      return state;
    }
  }
  return null;
}

function saveDailyState(state) {
  state.date = getDailyKey();
  state.mode = currentMode;
  localStorage.setItem(STORAGE_KEY.DAILY_STATE, JSON.stringify(state));
}

// ===== 分享功能 =====
function generateShareText() {
  if (!board) return '';

  const title = isDailyChallenge
    ? `WordGuess 每日挑战 ${getDailyKey()}`
    : 'WordGuess';

  const modeLabel = currentMode === MODE.CHINESE ? '中文' : 'English';
  const guessCount = board.gameState === GAME_STATE.WON ? board.guesses.length : 'X';
  const header = `${title} (${modeLabel}) ${guessCount}/${MAX_GUESSES}`;

  const emojiRows = board.guesses.map(g => {
    return g.colors.map(c => {
      if (c === 'correct') return '🟩';
      if (c === 'present') return '🟨';
      return '⬛';
    }).join('');
  }).join('\n');

  return `${header}\n\n${emojiRows}`;
}

function copyShareText() {
  const text = generateShareText();
  navigator.clipboard.writeText(text).then(() => {
    showMessage('已复制到剪贴板!', 'success');
  }).catch(() => {
    showMessage('复制失败，请手动复制', 'error');
  });
}

// ===== 游戏初始化 =====
function startNewGame(daily = false) {
  isDailyChallenge = daily;
  isAnimating = false;

  const word = daily ? getDailyWord(currentMode) : getRandomWord(currentMode);
  board = createBoard(word);

  // 重新创建游戏板DOM
  const boardContainer = document.getElementById('board');
  cells = createBoardDOM(boardContainer);

  // 创建键盘
  const keyboardContainer = document.getElementById('keyboard');
  createKeyboard(keyboardContainer, handleKeyPress, currentMode);

  // 更新标题
  updateHeader(currentMode, isDailyChallenge);

  hideGameOver();

  console.log('[WordGuess] 新游戏开始:', daily ? '每日挑战' : '随机模式', '答案:', word);
}

// ===== 输入处理 =====
function handleKeyPress(key) {
  if (isAnimating) return;
  if (board.gameState !== GAME_STATE.PLAYING) return;

  if (key === 'Enter') {
    handleSubmit();
  } else if (key === 'Backspace') {
    handleDelete();
  } else {
    handleInput(key);
  }
}

function handleInput(letter) {
  if (board.currentGuess.length >= WORD_LENGTH) return;

  const added = addLetter(board, letter);
  if (added) {
    playKeyInput();
    updateRow(cells, board.currentRow, board.currentGuess);
  }
}

function handleDelete() {
  if (board.currentGuess.length === 0) return;

  deleteLetter(board);
  playDelete();
  updateRow(cells, board.currentRow, board.currentGuess);
}

function handleSubmit() {
  if (board.currentGuess.length !== WORD_LENGTH) {
    showMessage('请输入完整的词语', 'error');
    shakeRow(cells, board.currentRow);
    playError();
    return;
  }

  const result = submitGuess(board, currentMode);
  if (!result) return;

  if (result.error === 'not_in_list') {
    showMessage('词语不在词库中', 'error');
    shakeRow(cells, board.currentRow);
    playError();
    return;
  }

  isAnimating = true;

  // 翻转动画
  const rowNum = board.currentRow - 1;
  flipRow(cells, rowNum, result.colors, () => {
    // 更新键盘颜色
    if (currentMode === MODE.ENGLISH) {
      const keyboardContainer = document.getElementById('keyboard');
      updateKeyboard(keyboardContainer, board.letterStates);
    }

    isAnimating = false;

    // 保存每日挑战状态
    if (isDailyChallenge) {
      saveDailyState({
        guesses: board.guesses.map(g => g.word),
        gameState: board.gameState,
      });
    }

    if (result.won) {
      // 胜利
      playWin();
      bounceRow(cells, rowNum);
      const stats = updateStats(currentMode, true, board.guesses.length);
      setTimeout(() => {
        showGameOver(GAME_STATE.WON, board.answer, board.guesses.length,
          () => startNewGame(isDailyChallenge),
          copyShareText
        );
      }, 800);
    } else if (board.gameState === GAME_STATE.LOST) {
      // 失败
      playLose();
      const stats = updateStats(currentMode, false, board.guesses.length);
      setTimeout(() => {
        showGameOver(GAME_STATE.LOST, board.answer, board.guesses.length,
          () => startNewGame(isDailyChallenge),
          copyShareText
        );
      }, 500);
    }
  }, playFlip);
}

// ===== 物理键盘事件 =====
function handleKeyDown(e) {
  // 忽略IME组合
  if (e.isComposing) return;

  const key = e.key;

  if (key === 'Enter') {
    e.preventDefault();
    handleKeyPress('Enter');
  } else if (key === 'Backspace') {
    e.preventDefault();
    handleKeyPress('Backspace');
  } else if (/^[a-zA-Z]$/.test(key) && currentMode === MODE.ENGLISH) {
    handleKeyPress(key.toLowerCase());
  }
}

// 中文输入处理
function handleChineseInput(e) {
  if (currentMode !== MODE.CHINESE) return;
  if (isAnimating) return;
  if (board.gameState !== GAME_STATE.PLAYING) return;

  const char = e.data;
  if (char && char.length === 1) {
    // 检查是否为中文字符
    if (/[一-鿿]/.test(char)) {
      handleInput(char);
    }
  }
}

// ===== 模式切换 =====
function switchMode(mode) {
  currentMode = mode;
  localStorage.setItem(STORAGE_KEY.CURRENT_MODE, mode);
  startNewGame(false);
}

// ===== 初始化 =====
export function init() {
  // 加载保存的模式
  const savedMode = localStorage.getItem(STORAGE_KEY.CURRENT_MODE);
  if (savedMode && Object.values(MODE).includes(savedMode)) {
    currentMode = savedMode;
  }

  // 开始新游戏
  startNewGame(false);

  // 绑定物理键盘
  document.addEventListener('keydown', handleKeyDown);

  // 中文输入监听
  const input = document.getElementById('chinese-input');
  if (input) {
    input.addEventListener('input', handleChineseInput);
  }

  // 模式切换按钮
  document.getElementById('btn-mode-chinese')?.addEventListener('click', () => switchMode(MODE.CHINESE));
  document.getElementById('btn-mode-english')?.addEventListener('click', () => switchMode(MODE.ENGLISH));

  // 每日挑战按钮
  document.getElementById('btn-daily')?.addEventListener('click', () => startNewGame(true));

  // 新游戏按钮
  document.getElementById('btn-new-game')?.addEventListener('click', () => startNewGame(false));

  // 统计按钮
  document.getElementById('btn-stats')?.addEventListener('click', () => {
    const stats = loadStats(currentMode);
    showStats(stats);
  });

  // 统计面板关闭
  document.getElementById('stats-close')?.addEventListener('click', hideStats);

  // 点击遮罩关闭弹窗
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('show');
      }
    });
  });

  console.log('[WordGuess] 游戏初始化完成');
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
