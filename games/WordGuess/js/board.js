// board.js - 猜测板逻辑（输入、验证、颜色标记）

import { WORD_LENGTH, MAX_GUESSES, COLOR, GAME_STATE } from './config.js';
import { isValidWord, getWordList } from './dictionary.js';

/**
 * 创建游戏板状态
 * @param {string} answer - 目标答案
 * @returns {object} 游戏板状态
 */
export function createBoard(answer) {
  return {
    answer: answer.toLowerCase(),
    guesses: [],          // 已提交的猜测 [{word, colors}]
    currentGuess: '',     // 当前输入的猜测
    currentRow: 0,        // 当前行
    gameState: GAME_STATE.PLAYING,
    letterStates: {},     // 字母状态 {letter: color}
  };
}

/**
 * 添加字母到当前猜测
 * @param {object} board - 游戏板状态
 * @param {string} letter - 要添加的字母/汉字
 * @returns {boolean} 是否成功添加
 */
export function addLetter(board, letter) {
  if (board.gameState !== GAME_STATE.PLAYING) return false;
  if (board.currentGuess.length >= WORD_LENGTH) return false;

  board.currentGuess += letter;
  return true;
}

/**
 * 删除最后一个字母
 * @param {object} board - 游戏板状态
 * @returns {boolean} 是否成功删除
 */
export function deleteLetter(board) {
  if (board.gameState !== GAME_STATE.PLAYING) return false;
  if (board.currentGuess.length === 0) return false;

  board.currentGuess = board.currentGuess.slice(0, -1);
  return true;
}

/**
 * 计算单个猜测的颜色反馈
 * @param {string} guess - 猜测的词
 * @param {string} answer - 目标答案
 * @returns {string[]} 颜色数组
 */
export function getColors(guess, answer) {
  const colors = Array(WORD_LENGTH).fill(COLOR.ABSENT);
  const answerArr = answer.split('');
  const guessArr = guess.split('');

  // 第一遍：标记绿色（位置正确）
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) {
      colors[i] = COLOR.CORRECT;
      answerArr[i] = null;  // 标记为已使用
      guessArr[i] = null;
    }
  }

  // 第二遍：标记黄色（存在但位置错误）
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === null) continue;

    const idx = answerArr.indexOf(guessArr[i]);
    if (idx !== -1) {
      colors[i] = COLOR.PRESENT;
      answerArr[idx] = null;
    }
  }

  return colors;
}

/**
 * 提交猜测
 * @param {object} board - 游戏板状态
 * @param {string} mode - 游戏模式
 * @returns {object|null} 提交结果 {colors, won} 或 null（无效）
 */
export function submitGuess(board, mode) {
  if (board.gameState !== GAME_STATE.PLAYING) return null;
  if (board.currentGuess.length !== WORD_LENGTH) return null;

  // 验证是否在词库中
  if (!isValidWord(board.currentGuess, mode)) {
    return { error: 'not_in_list' };
  }

  const colors = getColors(board.currentGuess, board.answer);

  // 更新字母状态
  board.currentGuess.split('').forEach((letter, i) => {
    const currentState = board.letterStates[letter];
    const newColor = colors[i];

    // 优先级：correct > present > absent
    if (newColor === COLOR.CORRECT) {
      board.letterStates[letter] = COLOR.CORRECT;
    } else if (newColor === COLOR.PRESENT && currentState !== COLOR.CORRECT) {
      board.letterStates[letter] = COLOR.PRESENT;
    } else if (!currentState) {
      board.letterStates[letter] = COLOR.ABSENT;
    }
  });

  // 保存猜测
  board.guesses.push({
    word: board.currentGuess,
    colors: colors,
  });

  // 检查是否猜对
  const won = board.currentGuess === board.answer;
  if (won) {
    board.gameState = GAME_STATE.WON;
  } else if (board.currentRow >= MAX_GUESSES - 1) {
    board.gameState = GAME_STATE.LOST;
  }

  board.currentRow++;
  board.currentGuess = '';

  return { colors, won };
}

/**
 * 获取每日挑战的词语
 * @param {string} mode - 游戏模式
 * @returns {string} 每日词语
 */
export function getDailyWord(mode) {
  const wordList = getWordList(mode);
  const today = new Date();
  const seed = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const diff = Math.floor((seed - new Date(2024, 0, 1)) / (1000 * 60 * 60 * 24));
  const index = ((diff * 2654435761) >>> 0) % wordList.length;
  return wordList[index].toLowerCase();
}

/**
 * 获取随机词语
 * @param {string} mode - 游戏模式
 * @returns {string} 随机词语
 */
export function getRandomWord(mode) {
  const wordList = getWordList(mode);
  const index = Math.floor(Math.random() * wordList.length);
  return wordList[index].toLowerCase();
}
