// config.js - Game constants and card definitions

export const GAME_CONFIG = {
  STARTING_HP: 30,
  DECK_SIZE: 20,
  HAND_SIZE: 5,
  MAX_FIELD: 3,
  MAX_MANA: 10,
  CARD_WIDTH: 100,
  CARD_HEIGHT: 140,
  FIELD_CARD_WIDTH: 90,
  FIELD_CARD_HEIGHT: 110,
  CARD_RADIUS: 8,
  ANIMATION_SPEED: 0.08,
};

// Card type constants
export const CARD_TYPE = {
  CREATURE: 'creature',
  SPELL: 'spell',
  HEAL: 'heal',
};

// Card rarity (affects glow color)
export const RARITY = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
};

// All card definitions - 24 unique cards
export const CARD_DEFS = [
  // --- Creatures (14) ---
  { id: 'warrior', name: '战士', type: CARD_TYPE.CREATURE, cost: 1, atk: 1, hp: 2, rarity: RARITY.COMMON, icon: 'sword', desc: '忠诚的战士' },
  { id: 'archer', name: '弓箭手', type: CARD_TYPE.CREATURE, cost: 2, atk: 2, hp: 1, rarity: RARITY.COMMON, icon: 'bow', desc: '远程攻击' },
  { id: 'knight', name: '骑士', type: CARD_TYPE.CREATURE, cost: 3, atk: 3, hp: 3, rarity: RARITY.COMMON, icon: 'shield', desc: '攻守兼备' },
  { id: 'wolf', name: '战狼', type: CARD_TYPE.CREATURE, cost: 2, atk: 2, hp: 2, rarity: RARITY.COMMON, icon: 'wolf', desc: '凶猛的战狼' },
  { id: 'golem', name: '石像魔', type: CARD_TYPE.CREATURE, cost: 4, atk: 2, hp: 6, rarity: RARITY.RARE, icon: 'golem', desc: '坚不可摧' },
  { id: 'mage', name: '法师', type: CARD_TYPE.CREATURE, cost: 3, atk: 3, hp: 2, rarity: RARITY.RARE, icon: 'staff', desc: '奥术之力' },
  { id: 'dragon', name: '幼龙', type: CARD_TYPE.CREATURE, cost: 5, atk: 4, hp: 5, rarity: RARITY.EPIC, icon: 'dragon', desc: '龙族之威' },
  { id: 'assassin', name: '刺客', type: CARD_TYPE.CREATURE, cost: 3, atk: 4, hp: 1, rarity: RARITY.RARE, icon: 'dagger', desc: '一击必杀' },
  { id: 'titan', name: '泰坦', type: CARD_TYPE.CREATURE, cost: 7, atk: 6, hp: 7, rarity: RARITY.LEGENDARY, icon: 'titan', desc: '远古巨神' },
  { id: 'fairy', name: '精灵', type: CARD_TYPE.CREATURE, cost: 1, atk: 1, hp: 1, rarity: RARITY.COMMON, icon: 'star', desc: '小巧灵活' },
  { id: 'elemental', name: '元素', type: CARD_TYPE.CREATURE, cost: 4, atk: 3, hp: 4, rarity: RARITY.RARE, icon: 'element', desc: '自然之力' },
  { id: 'phoenix', name: '凤凰', type: CARD_TYPE.CREATURE, cost: 6, atk: 5, hp: 5, rarity: RARITY.EPIC, icon: 'fire', desc: '涅槃重生' },
  { id: 'skeleton', name: '骷髅兵', type: CARD_TYPE.CREATURE, cost: 1, atk: 1, hp: 1, rarity: RARITY.COMMON, icon: 'skull', desc: '亡灵军团' },
  { id: 'demon', name: '恶魔', type: CARD_TYPE.CREATURE, cost: 5, atk: 5, hp: 4, rarity: RARITY.EPIC, icon: 'demon', desc: '深渊之力' },

  // --- Spells (6) ---
  { id: 'fireball', name: '火球术', type: CARD_TYPE.SPELL, cost: 3, damage: 3, rarity: RARITY.COMMON, icon: 'fireball', desc: '对一个敌人造成3点伤害', target: 'single' },
  { id: 'lightning', name: '闪电链', type: CARD_TYPE.SPELL, cost: 4, damage: 2, rarity: RARITY.RARE, icon: 'lightning', desc: '对所有敌方生物造成2点伤害', target: 'all' },
  { id: 'frostbolt', name: '冰霜箭', type: CARD_TYPE.SPELL, cost: 2, damage: 2, rarity: RARITY.COMMON, icon: 'frost', desc: '对一个敌人造成2点伤害', target: 'single' },
  { id: 'shield', name: '圣盾术', type: CARD_TYPE.SPELL, cost: 2, buffHp: 3, rarity: RARITY.COMMON, icon: 'shieldspell', desc: '使一个友方生物+0/+3', target: 'friendly' },
  { id: 'bloodlust', name: '嗜血术', type: CARD_TYPE.SPELL, cost: 3, buffAtk: 2, rarity: RARITY.RARE, icon: 'blood', desc: '使一个友方生物+2/+0', target: 'friendly' },
  { id: 'inferno', name: '地狱火', type: CARD_TYPE.SPELL, cost: 6, damage: 4, rarity: RARITY.EPIC, icon: 'inferno', desc: '对所有敌方生物造成4点伤害', target: 'all' },

  // --- Heal (4) ---
  { id: 'heal1', name: '治疗术', type: CARD_TYPE.HEAL, cost: 1, healAmount: 3, rarity: RARITY.COMMON, icon: 'heal', desc: '恢复3点生命值' },
  { id: 'heal2', name: '圣光术', type: CARD_TYPE.HEAL, cost: 3, healAmount: 6, rarity: RARITY.RARE, icon: 'holy', desc: '恢复6点生命值' },
  { id: 'heal3', name: '生命泉', type: CARD_TYPE.HEAL, cost: 5, healAmount: 10, rarity: RARITY.EPIC, icon: 'fountain', desc: '恢复10点生命值' },
  { id: 'heal4', name: '药剂', type: CARD_TYPE.HEAL, cost: 2, healAmount: 4, rarity: RARITY.COMMON, icon: 'potion', desc: '恢复4点生命值' },
];

// Rarity colors
export const RARITY_COLORS = {
  [RARITY.COMMON]: '#a0a0a0',
  [RARITY.RARE]: '#4a9eff',
  [RARITY.EPIC]: '#b44aff',
  [RARITY.LEGENDARY]: '#ffaa00',
};

// Icon symbols for card art
export const ICON_SYMBOLS = {
  sword: '⚔',
  bow: '🏹',
  shield: '🛡',
  wolf: '🐺',
  golem: '🧱',
  staff: '🪄',
  dragon: '🐉',
  dagger: '🗡',
  titan: '🧍',
  star: '⭐',
  element: '🌊',
  fire: '🔥',
  skull: '💀',
  demon: '👿',
  fireball: '🔥',
  lightning: '⚡',
  frost: '❄',
  shieldspell: '🛡',
  blood: '🩸',
  inferno: '🔥',
  heal: '❤',
  holy: '✨',
  fountain: '🌊',
  potion: '🧪',
};

// Background colors for card art by icon
export const ICON_BG_COLORS = {
  sword: '#8B4513',
  bow: '#2E7D32',
  shield: '#37474F',
  wolf: '#5D4037',
  golem: '#616161',
  staff: '#4A148C',
  dragon: '#B71C1C',
  dagger: '#212121',
  titan: '#1A237E',
  star: '#F57F17',
  element: '#00695C',
  fire: '#BF360C',
  skull: '#37474F',
  demon: '#4A0000',
  fireball: '#D84315',
  lightning: '#1565C0',
  frost: '#0277BD',
  shieldspell: '#1B5E20',
  blood: '#880E4F',
  inferno: '#BF360C',
  heal: '#2E7D32',
  holy: '#F9A825',
  fountain: '#00838F',
  potion: '#6A1B9A',
};
