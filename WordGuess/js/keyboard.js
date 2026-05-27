// keyboard.js - 虚拟键盘（颜色反馈）

import { COLOR, MODE } from './config.js';

// 英文键盘布局
const ENGLISH_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['Enter', 'z', 'x', 'c', 'v', 'b', 'n', 'm', 'Backspace'],
];

/**
 * 创建虚拟键盘
 * @param {HTMLElement} container - 键盘容器
 * @param {Function} onKeyPress - 按键回调
 * @param {string} mode - 游戏模式
 */
export function createKeyboard(container, onKeyPress, mode) {
  container.innerHTML = '';

  if (mode === MODE.CHINESE) {
    // 中文模式：使用输入框，不需要虚拟键盘
    createChineseInput(container, onKeyPress);
    return;
  }

  // 英文模式：创建QWERTY键盘
  ENGLISH_ROWS.forEach(row => {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'keyboard-row';

    row.forEach(key => {
      const button = document.createElement('button');
      button.className = 'key';
      button.dataset.key = key;

      if (key === 'Enter') {
        button.textContent = '确认';
        button.classList.add('key-wide');
      } else if (key === 'Backspace') {
        button.textContent = '删除';
        button.classList.add('key-wide');
      } else {
        button.textContent = key.toUpperCase();
      }

      button.addEventListener('click', () => onKeyPress(key));
      rowDiv.appendChild(button);
    });

    container.appendChild(rowDiv);
  });
}

/**
 * 创建中文输入区域
 * @param {HTMLElement} container - 容器
 * @param {Function} onKeyPress - 按键回调
 */
function createChineseInput(container, onKeyPress) {
  const inputDiv = document.createElement('div');
  inputDiv.className = 'chinese-input-area';

  const info = document.createElement('p');
  info.className = 'input-hint';
  info.textContent = '请使用键盘输入5个汉字';
  inputDiv.appendChild(info);

  // 操作按钮行
  const btnRow = document.createElement('div');
  btnRow.className = 'keyboard-row';

  const enterBtn = document.createElement('button');
  enterBtn.className = 'key key-wide';
  enterBtn.textContent = '确认';
  enterBtn.addEventListener('click', () => onKeyPress('Enter'));

  const delBtn = document.createElement('button');
  delBtn.className = 'key key-wide';
  delBtn.textContent = '删除';
  delBtn.addEventListener('click', () => onKeyPress('Backspace'));

  btnRow.appendChild(enterBtn);
  btnRow.appendChild(delBtn);
  inputDiv.appendChild(btnRow);

  container.appendChild(inputDiv);
}

/**
 * 更新键盘颜色
 * @param {HTMLElement} container - 键盘容器
 * @param {object} letterStates - 字母状态映射
 */
export function updateKeyboard(container, letterStates) {
  const keys = container.querySelectorAll('.key');
  keys.forEach(key => {
    const letter = key.dataset.key;
    if (letter && letterStates[letter]) {
      // 移除旧的颜色类
      key.classList.remove(COLOR.CORRECT, COLOR.PRESENT, COLOR.ABSENT);
      // 添加新的颜色类
      key.classList.add(letterStates[letter]);
    }
  });
}
