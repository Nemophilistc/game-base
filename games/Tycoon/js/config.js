// ============================================================
// config.js - 游戏常量配置
// ============================================================

// --- 画布/格子 ---
export const TILE = 48;                // 每格像素
export const COLS = 16;                // 列数
export const ROWS = 20;               // 行数
export const CANVAS_W = COLS * TILE;  // 768
export const CANVAS_H = ROWS * TILE;  // 960

// --- 时间 ---
export const DAY_LENGTH   = 120;   // 白天秒数（真实秒）
export const NIGHT_LENGTH = 15;    // 夜晚结算秒数
export const CUSTOMER_INTERVAL_BASE = 6; // 基础顾客到达间隔(秒)

// --- 经济 ---
export const START_MONEY = 300;
export const DAILY_RENT  = 50;

// --- 菜品数据 ---
export const DISHES = [
  { id: 'tea',        name: '清茶',     cookTime: 3,  price: 8,   cost: 1,   unlockLevel: 0,  icon: '\u{1F375}' },
  { id: 'rice',       name: '白米饭',   cookTime: 5,  price: 10,  cost: 2,   unlockLevel: 0,  icon: '\u{1F35A}' },
  { id: 'noodle',     name: '阳春面',   cookTime: 8,  price: 18,  cost: 4,   unlockLevel: 0,  icon: '\u{1F35C}' },
  { id: 'dumpling',   name: '水饺',     cookTime: 12, price: 25,  cost: 6,   unlockLevel: 1,  icon: '\u{1F95F}' },
  { id: 'stir_fry',   name: '宫保鸡丁', cookTime: 15, price: 35,  cost: 8,   unlockLevel: 2,  icon: '\u{1F357}' },
  { id: 'fish',       name: '清蒸鱼',   cookTime: 18, price: 45,  cost: 12,  unlockLevel: 3,  icon: '\u{1F41F}' },
  { id: 'steak',      name: '牛排',     cookTime: 20, price: 60,  cost: 18,  unlockLevel: 4,  icon: '\u{1F969}' },
  { id: 'hotpot',     name: '火锅',     cookTime: 25, price: 80,  cost: 22,  unlockLevel: 5,  icon: '\u{1F372}' },
  { id: 'lobster',    name: '龙虾大餐', cookTime: 30, price: 120, cost: 35,  unlockLevel: 7,  icon: '\u{1F99E}' },
  { id: 'feast',      name: '满汉全席', cookTime: 45, price: 200, cost: 60,  unlockLevel: 10, icon: '\u{1F37D}\u{FE0F}' },
];

// --- 装修升级 ---
export const DECORATIONS = [
  { id: 'table_wood',   name: '木桌椅',   cost: 80,   capacity: 2, satisfaction: 0,  maxLevel: 4, icon: '\u{1F4BA}' },
  { id: 'light_warm',   name: '暖光灯',   cost: 120,  capacity: 0, satisfaction: 5,  maxLevel: 3, icon: '\u{1F4A1}' },
  { id: 'plant',        name: '绿植装饰', cost: 60,   capacity: 0, satisfaction: 3,  maxLevel: 3, icon: '\u{1F33F}' },
  { id: 'painting',     name: '艺术画',   cost: 150,  capacity: 0, satisfaction: 8,  maxLevel: 2, icon: '\u{1F3A8}' },
  { id: 'music',        name: '背景音乐', cost: 200,  capacity: 0, satisfaction: 10, maxLevel: 1, icon: '\u{1F3B5}' },
  { id: 'ac',           name: '空调系统', cost: 300,  capacity: 0, satisfaction: 12, maxLevel: 1, icon: '\u{2744}\u{FE0F}' },
];

// --- 厨房设备升级 ---
export const KITCHEN_UPGRADES = [
  { id: 'stove',     name: '高级灶台',   cost: 150, speedBonus: 0.10, maxLevel: 5, icon: '\u{1F525}' },
  { id: 'knife',     name: '精钢刀具',   cost: 100, speedBonus: 0.05, maxLevel: 3, icon: '\u{1F52A}' },
  { id: 'fridge',    name: '大容量冰箱', cost: 250, speedBonus: 0.08, maxLevel: 3, icon: '\u{2744}\u{FE0F}' },
  { id: 'auto_wash', name: '自动洗碗机', cost: 200, speedBonus: 0.07, maxLevel: 2, icon: '\u{1F9F4}' },
];

// --- 餐厅布局模板 (0=空地 1=墙 2=桌 3=椅 4=灶台 5=门口 6=柜台 7=装饰 8=厨房墙) ---
export const LAYOUT_TEMPLATE = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,8,8,8,8,8,8,8,8,8,8,8,8,8,8,1],
  [1,8,4,4,0,0,4,4,0,0,4,4,0,0,8,1],
  [1,8,4,4,0,0,4,4,0,0,4,4,0,0,8,1],
  [1,8,0,0,0,0,0,0,0,0,0,0,0,0,8,1],
  [1,1,1,1,1,6,6,6,6,6,6,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,3,0,0,2,3,0,0,2,3,0,0,0,1],
  [1,0,2,3,0,0,2,3,0,0,2,3,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,3,0,0,2,3,0,0,2,3,0,0,0,1],
  [1,0,2,3,0,0,2,3,0,0,2,3,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,3,0,0,2,3,0,0,0,0,0,0,0,1],
  [1,0,2,3,0,0,2,3,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,0,0,0,5,5,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

// 桌子位置映射 (桌子中心格子坐标，用于顾客寻路)
export const TABLE_POSITIONS = [
  { col: 2, row: 7, id: 0 },
  { col: 6, row: 7, id: 1 },
  { col: 10, row: 7, id: 2 },
  { col: 2, row: 11, id: 3 },
  { col: 6, row: 11, id: 4 },
  { col: 10, row: 11, id: 5 },
  { col: 2, row: 15, id: 6 },
  { col: 6, row: 15, id: 7 },
];

// 门口坐标
export const ENTRANCE = { col: 7.5, row: 18 };

// 厨房区域（用于厨师巡逻）
export const KITCHEN_AREA = { colStart: 2, colEnd: 13, rowStart: 2, rowEnd: 4 };

// 柜台位置
export const COUNTER_Y = 5;

// --- 员工数据 ---
export const STAFF_TYPES = {
  chef: {
    name: '厨师',
    baseSalary: 30,
    baseSpeed: 1.0,
    upgradeCost: 200,
    maxLevel: 5,
    icon: '\u{1F468}\u{200D}\u{1F373}',
  },
  waiter: {
    name: '服务员',
    baseSalary: 20,
    baseSpeed: 1.0,
    baseCapacity: 2, // 同时服务桌数
    upgradeCost: 150,
    maxLevel: 5,
    icon: '\u{1F469}\u{200D}\u{1F373}',
  },
};

// --- 顾客耐心 (秒) ---
export const PATIENCE_BASE     = 60;
export const PATIENCE_PER_LVL  = -3; // 餐厅等级越高，来的客人越挑剔
export const EAT_TIME_BASE     = 15;

// --- 满意度 ---
export const SATISFACTION_PERFECT = 100;
export const SATISFACTION_GOOD    = 75;
export const SATISFACTION_OK      = 50;
export const SATISFACTION_BAD     = 25;
export const TIP_RATE_PER_SATISFACTION = 0.005; // 每点满意度 → 0.5% 小费

// --- 颜色主题 ---
export const COLORS = {
  wall:       '#5D4037',
  kitchenWall:'#37474F',
  floor:      '#8D6E63',
  kitchenFloor:'#607D8B',
  table:      '#A1887F',
  chair:      '#BCAAA4',
  stove:      '#455A64',
  counter:    '#5D4037',
  door:       '#4CAF50',
  decoration: '#FFD54F',
  text:       '#FFF',
  hudBg:      'rgba(0,0,0,0.7)',
  panelBg:    'rgba(30,30,30,0.92)',
  accent:     '#FF9800',
  success:    '#4CAF50',
  danger:     '#F44336',
  info:       '#2196F3',
};
