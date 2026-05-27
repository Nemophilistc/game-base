// js/cards.js - 卡牌逻辑（翻转、配对检测）

import { THEMES, DEFAULT_GRID } from './config.js';

// 游戏状态
let gridCols = DEFAULT_GRID.cols;
let gridRows = DEFAULT_GRID.rows;
let totalPairs = 0;
let cards = [];
let flipped = [];
let matched = [];
let moves = 0;
let gameActive = false;
let timerInterval = null;
let elapsed = 0;
let bestScores = {};

// 翻牌状态
let firstFlip = -1;
let secondFlip = -1;
let lockBoard = false;

export function getGridCols() { return gridCols; }
export function getGridRows() { return gridRows; }
export function getTotalPairs() { return totalPairs; }
export function getCards() { return cards; }
export function getFlipped() { return flipped; }
export function getMatched() { return matched; }
export function getMoves() { return moves; }
export function getElapsed() { return elapsed; }
export function getBestScores() { return bestScores; }
export function isGameActive() { return gameActive; }

export function setDifficulty(cols, rows) {
    gridCols = cols;
    gridRows = rows;
}

export function loadBestScores() {
    bestScores = JSON.parse(localStorage.getItem('memory_best')) || {};
}

export function initGame(callbacks = {}) {
    totalPairs = Math.floor(gridCols * gridRows / 2);

    const themeKeys = Object.keys(THEMES);
    const theme = THEMES[themeKeys[Math.floor(Math.random() * themeKeys.length)]];
    const symbols = [];
    for (let i = 0; i < totalPairs; i++) {
        symbols.push(theme[i % theme.length], theme[i % theme.length]);
    }
    // Fisher-Yates shuffle
    for (let i = symbols.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [symbols[i], symbols[j]] = [symbols[j], symbols[i]];
    }

    cards = symbols;
    flipped = Array(symbols.length).fill(false);
    matched = Array(symbols.length).fill(false);
    moves = 0;
    gameActive = true;
    elapsed = 0;
    firstFlip = -1;
    secondFlip = -1;
    lockBoard = false;

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        elapsed++;
        if (callbacks.onTimerTick) callbacks.onTimerTick(elapsed);
    }, 1000);
}

export function onCardClick(idx, callbacks = {}) {
    if (!gameActive || lockBoard || flipped[idx] || matched[idx]) return;
    if (idx === firstFlip) return;

    flipped[idx] = true;
    if (callbacks.onFlip) callbacks.onFlip();

    if (firstFlip === -1) {
        firstFlip = idx;
        if (callbacks.onUpdateUI) callbacks.onUpdateUI();
    } else {
        secondFlip = idx;
        moves++;
        lockBoard = true;
        if (callbacks.onUpdateUI) callbacks.onUpdateUI();

        if (cards[firstFlip] === cards[secondFlip]) {
            matched[firstFlip] = true;
            matched[secondFlip] = true;
            const matchCount = matched.filter(m => m).length / 2;
            if (callbacks.onMatch) callbacks.onMatch(matchCount);
            firstFlip = -1;
            secondFlip = -1;
            lockBoard = false;
            if (callbacks.onUpdateUI) callbacks.onUpdateUI();

            if (matched.every(m => m)) {
                gameActive = false;
                clearInterval(timerInterval);
                const key = gridCols + 'x' + gridRows;
                if (!bestScores[key] || moves < bestScores[key]) {
                    bestScores[key] = moves;
                    localStorage.setItem('memory_best', JSON.stringify(bestScores));
                }
                if (callbacks.onWin) {
                    setTimeout(() => callbacks.onWin(moves, elapsed, bestScores[key] || moves), 400);
                }
            }
        } else {
            setTimeout(() => {
                flipped[firstFlip] = false;
                flipped[secondFlip] = false;
                if (callbacks.onMismatch) callbacks.onMismatch();
                firstFlip = -1;
                secondFlip = -1;
                lockBoard = false;
                if (callbacks.onUpdateUI) callbacks.onUpdateUI();
            }, 800);
        }
    }
}
