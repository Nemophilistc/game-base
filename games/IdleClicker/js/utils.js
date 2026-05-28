// 工具函数
import { CONFIG } from './config.js';

/**
 * 格式化数字
 * @param {number} num - 要格式化的数字
 * @param {boolean} useChinese - 是否使用中文单位（万、亿）
 * @returns {string} 格式化后的字符串
 */
export function formatNumber(num, useChinese = false) {
  if (num === 0) return '0';
  if (!isFinite(num)) return '∞';

  if (useChinese) {
    return formatChineseNumber(num);
  }

  return formatEnglishNumber(num);
}

/**
 * 英文格式化 (K, M, B, T, Qa, Qi...)
 */
function formatEnglishNumber(num) {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum < 1000) {
    return sign + (absNum % 1 === 0 ? absNum.toString() : absNum.toFixed(1));
  }

  const suffixes = CONFIG.numberFormat.suffixes;
  const thresholds = CONFIG.numberFormat.thresholds;

  let index = thresholds.length - 1;
  while (index > 0 && absNum < thresholds[index]) {
    index--;
  }

  const value = absNum / thresholds[index];
  const suffix = suffixes[index];

  // 保留适当的小数位数
  if (value >= 100) {
    return sign + Math.floor(value) + suffix;
  } else if (value >= 10) {
    return sign + value.toFixed(1) + suffix;
  } else {
    return sign + value.toFixed(2) + suffix;
  }
}

/**
 * 中文格式化（万、亿、兆...）
 */
function formatChineseNumber(num) {
  const absNum = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (absNum < 10000) {
    return sign + (absNum % 1 === 0 ? absNum.toString() : absNum.toFixed(1));
  }

  const units = [
    { value: 1e16, name: '京' },
    { value: 1e12, name: '兆' },
    { value: 1e8, name: '亿' },
    { value: 1e4, name: '万' }
  ];

  for (const unit of units) {
    if (absNum >= unit.value) {
      const value = absNum / unit.value;
      if (value >= 1000) {
        return sign + Math.floor(value) + unit.name;
      } else if (value >= 100) {
        return sign + value.toFixed(1) + unit.name;
      } else if (value >= 10) {
        return sign + value.toFixed(2) + unit.name;
      } else {
        return sign + value.toFixed(2) + unit.name;
      }
    }
  }

  return sign + Math.floor(absNum).toString();
}

/**
 * 格式化时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatTime(seconds) {
  if (seconds < 60) {
    return `${Math.floor(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}分${secs > 0 ? secs + '秒' : ''}`;
  } else if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}时${minutes > 0 ? minutes + '分' : ''}`;
  } else {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}天${hours > 0 ? hours + '时' : ''}`;
  }
}

/**
 * 格式化游戏时间（从毫秒）
 * @param {number} ms - 毫秒数
 * @returns {string} 格式化后的时间字符串
 */
export function formatPlayTime(ms) {
  return formatTime(ms / 1000);
}
