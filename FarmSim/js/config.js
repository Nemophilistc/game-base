// ============================================
// 农场模拟游戏 - 常量配置
// ============================================

// 农场网格
export const GRID_COLS = 12;
export const GRID_ROWS = 8;
export const TILE_SIZE = 64;

// 游戏画布
export const CANVAS_WIDTH = GRID_COLS * TILE_SIZE;  // 768
export const CANVAS_HEIGHT = GRID_ROWS * TILE_SIZE + 160; // 672 (网格 + HUD)

// 季节
export const SEASONS = ['春', '夏', '秋', '冬'];
export const DAYS_PER_SEASON = 30;
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR = 20;
export const HOURS_PER_DAY = DAY_END_HOUR - DAY_START_HOUR; // 14小时劳作时间

// 作物数据
export const CROPS = {
  wheat:      { name: '小麦',   seedPrice: 5,   sellPrice: 12,  growTime: 3,  seasons: ['春','秋'], waterNeed: 1, yield: [2,4], icon: '🌾', color: '#DAA520' },
  corn:       { name: '玉米',   seedPrice: 8,   sellPrice: 18,  growTime: 4,  seasons: ['夏'],     waterNeed: 2, yield: [2,3], icon: '🌽', color: '#FFD700' },
  tomato:     { name: '番茄',   seedPrice: 10,  sellPrice: 22,  growTime: 4,  seasons: ['夏','秋'], waterNeed: 2, yield: [3,5], icon: '🍅', color: '#FF6347' },
  potato:     { name: '土豆',   seedPrice: 6,   sellPrice: 15,  growTime: 3,  seasons: ['春','秋'], waterNeed: 1, yield: [2,4], icon: '🥔', color: '#DEB887' },
  carrot:     { name: '胡萝卜', seedPrice: 4,   sellPrice: 10,  growTime: 2,  seasons: ['春','夏'], waterNeed: 1, yield: [3,5], icon: '🥕', color: '#FF8C00' },
  strawberry: { name: '草莓',   seedPrice: 15,  sellPrice: 35,  growTime: 5,  seasons: ['春'],     waterNeed: 3, yield: [2,4], icon: '🍓', color: '#DC143C' },
  pumpkin:    { name: '南瓜',   seedPrice: 12,  sellPrice: 30,  growTime: 6,  seasons: ['秋'],     waterNeed: 2, yield: [1,2], icon: '🎃', color: '#FF8C00' },
  watermelon: { name: '西瓜',   seedPrice: 20,  sellPrice: 45,  growTime: 7,  seasons: ['夏'],     waterNeed: 3, yield: [1,2], icon: '🍉', color: '#228B22' },
  sunflower:  { name: '向日葵', seedPrice: 8,   sellPrice: 20,  growTime: 4,  seasons: ['夏','秋'], waterNeed: 1, yield: [2,3], icon: '🌻', color: '#FFD700' },
  rose:       { name: '玫瑰',   seedPrice: 25,  sellPrice: 60,  growTime: 6,  seasons: ['春','夏'], waterNeed: 2, yield: [1,3], icon: '🌹', color: '#DC143C' },
};

// 生长阶段
export const GROWTH_STAGES = {
  SEED:    0,  // 种子
  SPROUT:  1,  // 幼苗
  GROWING: 2,  // 生长中
  MATURE:  3,  // 成熟（可收获）
  WITHERED: 4, // 枯萎
};

export const STAGE_NAMES = ['种子', '幼苗', '生长中', '成熟', '枯萎'];
export const STAGE_COLORS = ['#8B4513', '#90EE90', '#32CD32', '#FFD700', '#696969'];

// 动物数据
export const ANIMALS = {
  chicken: {
    name: '鸡', price: 50, feedCost: 2, cleanCost: 1,
    product: '鸡蛋', productPrice: 8, productInterval: 1, // 每天产
    feedInterval: 1, cleanInterval: 2,
    breedChance: 0.1, breedCooldown: 5,
    icon: '🐔', color: '#FFFACD',
  },
  cow: {
    name: '牛', price: 200, feedCost: 5, cleanCost: 2,
    product: '牛奶', productPrice: 15, productInterval: 1,
    feedInterval: 1, cleanInterval: 2,
    breedChance: 0.05, breedCooldown: 10,
    icon: '🐄', color: '#F5F5DC',
  },
  sheep: {
    name: '羊', price: 150, feedCost: 4, cleanCost: 2,
    product: '羊毛', productPrice: 25, productInterval: 3, // 每3天
    feedInterval: 1, cleanInterval: 3,
    breedChance: 0.07, breedCooldown: 7,
    icon: '🐑', color: '#FFFAF0',
  },
};

// 工具
export const TOOLS = {
  hoe:     { name: '锄头', icon: '🪓', desc: '翻地/清除枯萎作物' },
  water:   { name: '水壶', icon: '🪣', desc: '浇水' },
  sickle:  { name: '镰刀', icon: '🔪', desc: '收获成熟作物' },
  feed:    { name: '饲料', icon: '🥣', desc: '喂养动物' },
  plant:   { name: '种植', icon: '🌱', desc: '选择种子种植' },
};

// 天气
export const WEATHER_TYPES = {
  sunny:   { name: '晴天', icon: '☀️', effect: 'none',     chance: 0.40 },
  cloudy:  { name: '多云', icon: '☁️', effect: 'none',     chance: 0.20 },
  rain:    { name: '下雨', icon: '🌧️', effect: 'water',   chance: 0.20 },
  storm:   { name: '暴风雨', icon: '⛈️', effect: 'damage',  chance: 0.05 },
  drought: { name: '干旱', icon: '🏜️', effect: 'wither',  chance: 0.10 },
  bug:     { name: '虫害', icon: '🐛', effect: 'pest',    chance: 0.05 },
};

// 价格波动范围
export const PRICE_FLUCTUATION = 0.3; // ±30%

// 初始资金
export const INITIAL_MONEY = 200;
