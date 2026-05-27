// config.js - 常量配置
export const CONFIG = {
  // 打字机效果速度（毫秒/字符）
  TYPE_SPEED: 50,
  TYPE_SPEED_FAST: 20,

  // 属性相关
  MAX_STAT: 10,
  MIN_STAT: 1,
  INITIAL_STAT_POINTS: 5, // 初始可分配点数
  BASE_STATS: {
    strength: 3,
    dexterity: 3,
    wisdom: 3,
    charisma: 3,
  },

  // 战斗相关
  COMBAT: {
    BASE_HP: 100,
    BASE_ATTACK: 10,
    BASE_DEFENSE: 5,
    ESCAPE_CHANCE: 0.4,
    CRITICAL_CHANCE: 0.15,
    CRITICAL_MULTIPLIER: 2.0,
    DEFENSE_MULTIPLIER: 0.5, // 防御时受到伤害的倍率
  },

  // 存档
  SAVE_KEY: 'text_adventure_save',
  AUTO_SAVE_INTERVAL: 0, // 每次场景切换时自动保存

  // 章节名称
  CHAPTER_NAMES: {
    prologue: '序章：诅咒之门',
    chapter1: '第一章：幽暗大厅',
    chapter2: '第二章：迷失花园',
    chapter3: '第三章：深渊地牢',
    chapter4: '第四章：暗影高塔',
    chapter5: '终章：命运抉择',
  },

  // 属性名称映射
  STAT_NAMES: {
    strength: '力量',
    dexterity: '敏捷',
    wisdom: '智慧',
    charisma: '魅力',
  },

  // 属性图标
  STAT_ICONS: {
    strength: '⚔️',
    dexterity: '🏃',
    wisdom: '📖',
    charisma: '💬',
  },
};
