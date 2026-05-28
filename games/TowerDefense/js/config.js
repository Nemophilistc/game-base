// ==================== 游戏常量配置 ====================

// 网格配置
export const GRID_COLS = 20;
export const GRID_ROWS = 12;
export const CELL_SIZE = 56;
export const CANVAS_WIDTH = GRID_COLS * CELL_SIZE;
export const CANVAS_HEIGHT = GRID_ROWS * CELL_SIZE;

// 游戏初始资源
export const INITIAL_GOLD = 300;
export const INITIAL_LIVES = 20;

// 多地图路径定义
export const MAPS = [
  {
    name: '蜿蜒峡谷',
    icon: '🏜️',
    desc: '经典蛇形路线，适合新手',
    path: [
      [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],
      [7,2],[7,3],[7,4],[7,5],
      [6,5],[5,5],[4,5],[3,5],[2,5],
      [2,6],[2,7],[2,8],
      [3,8],[4,8],[5,8],[6,8],[7,8],[8,8],[9,8],[10,8],[11,8],
      [11,7],[11,6],[11,5],[11,4],[11,3],
      [12,3],[13,3],[14,3],[15,3],
      [15,4],[15,5],[15,6],[15,7],[15,8],[15,9],
      [16,9],[17,9],[18,9],[19,9]
    ]
  },
  {
    name: '迷宫回廊',
    icon: '🏰',
    desc: '多层迂回，需要多点布防',
    path: [
      [0,5],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],
      [9,4],[9,3],[9,2],[9,1],
      [10,1],[11,1],[12,1],[13,1],[14,1],[15,1],
      [15,2],[15,3],[15,4],[15,5],[15,6],[15,7],
      [14,7],[13,7],[12,7],[11,7],[10,7],[9,7],
      [9,8],[9,9],[9,10],
      [10,10],[11,10],[12,10],[13,10],[14,10],[15,10],[16,10],[17,10],[18,10],[19,10]
    ]
  },
  {
    name: '蛇形长廊',
    icon: '🐍',
    desc: '超长蛇形路线，最大化布塔空间',
    path: [
      [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],[11,1],[12,1],[13,1],[14,1],[15,1],[16,1],[17,1],[18,1],
      [18,2],[18,3],
      [17,3],[16,3],[15,3],[14,3],[13,3],[12,3],[11,3],[10,3],[9,3],[8,3],[7,3],[6,3],[5,3],[4,3],[3,3],
      [3,4],[3,5],
      [4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[10,5],[11,5],[12,5],[13,5],[14,5],[15,5],[16,5],[17,5],
      [17,6],[17,7],
      [16,7],[15,7],[14,7],[13,7],[12,7],[11,7],[10,7],[9,7],[8,7],[7,7],[6,7],[5,7],[4,7],
      [4,8],[4,9],
      [5,9],[6,9],[7,9],[8,9],[9,9],[10,9],[11,9],[12,9],[13,9],[14,9],[15,9],[16,9],[17,9],[18,9],[19,9]
    ]
  }
];

// 默认路径（兼容旧代码）
export const ENEMY_PATH = MAPS[0].path;

// 路径类型标记
export const CELL_EMPTY = 0;
export const CELL_PATH = 1;
export const CELL_TOWER = 2;

// 塔类型定义
export const TOWER_TYPES = {
  arrow: {
    name: '箭塔',
    description: '单体高伤害，攻速快',
    icon: '🏹',
    levels: [
      { cost: 100, damage: 25, range: 3, fireRate: 0.5, color: '#8B4513', size: 0.7 },
      { cost: 80,  damage: 45, range: 3.5, fireRate: 0.4, color: '#A0522D', size: 0.75 },
      { cost: 120, damage: 75, range: 4, fireRate: 0.3, color: '#CD853F', size: 0.8 }
    ]
  },
  cannon: {
    name: '炮塔',
    description: '范围伤害，攻速慢',
    icon: '💣',
    levels: [
      { cost: 150, damage: 40, range: 2.5, fireRate: 1.5, splashRadius: 1.2, color: '#555', size: 0.8 },
      { cost: 100, damage: 70, range: 3, fireRate: 1.3, splashRadius: 1.5, color: '#666', size: 0.85 },
      { cost: 150, damage: 110, range: 3.5, fireRate: 1.0, splashRadius: 1.8, color: '#777', size: 0.9 }
    ]
  },
  ice: {
    name: '冰塔',
    description: '减速敌人移动速度',
    icon: '❄️',
    levels: [
      { cost: 120, damage: 10, range: 2.5, fireRate: 1.0, slowFactor: 0.5, slowDuration: 2, color: '#00BFFF', size: 0.7 },
      { cost: 80,  damage: 15, range: 3, fireRate: 0.8, slowFactor: 0.35, slowDuration: 2.5, color: '#00CED1', size: 0.75 },
      { cost: 120, damage: 25, range: 3.5, fireRate: 0.6, slowFactor: 0.2, slowDuration: 3, color: '#40E0D0', size: 0.8 }
    ]
  },
  electric: {
    name: '电塔',
    description: '连锁闪电，攻击多个敌人',
    icon: '⚡',
    levels: [
      { cost: 180, damage: 20, range: 2.5, fireRate: 1.0, chainCount: 3, chainRange: 1.5, color: '#FFD700', size: 0.7 },
      { cost: 120, damage: 35, range: 3, fireRate: 0.8, chainCount: 4, chainRange: 2, color: '#FFA500', size: 0.75 },
      { cost: 160, damage: 55, range: 3.5, fireRate: 0.6, chainCount: 5, chainRange: 2.5, color: '#FF8C00', size: 0.8 }
    ]
  },
  flame: {
    name: '火焰塔',
    description: '持续灼烧，DOT伤害',
    icon: '🔥',
    levels: [
      { cost: 140, damage: 8, range: 2, fireRate: 0.3, burnDamage: 5, burnDuration: 3, color: '#FF4500', size: 0.7 },
      { cost: 100, damage: 14, range: 2.5, fireRate: 0.25, burnDamage: 8, burnDuration: 3.5, color: '#FF6347', size: 0.75 },
      { cost: 140, damage: 22, range: 3, fireRate: 0.2, burnDamage: 13, burnDuration: 4, color: '#FF7F50', size: 0.8 }
    ]
  },
  laser: {
    name: '激光塔',
    description: '高伤害直线穿透攻击',
    icon: '🔫',
    levels: [
      { cost: 200, damage: 35, range: 4, fireRate: 1.2, pierceCount: 2, color: '#FF00FF', size: 0.7 },
      { cost: 150, damage: 60, range: 4.5, fireRate: 1.0, pierceCount: 3, color: '#EE82EE', size: 0.75 },
      { cost: 200, damage: 95, range: 5, fireRate: 0.8, pierceCount: 4, color: '#DA70D6', size: 0.8 }
    ]
  }
};

// 敌人类型定义
export const ENEMY_TYPES = {
  normal: {
    name: '普通',
    hp: 80,
    speed: 1.0,
    reward: 25,
    color: '#e74c3c',
    size: 0.6,
    armor: 0
  },
  fast: {
    name: '快速',
    hp: 50,
    speed: 2.0,
    reward: 30,
    color: '#f39c12',
    size: 0.5,
    armor: 0
  },
  flying: {
    name: '飞行',
    hp: 60,
    speed: 1.2,
    reward: 35,
    color: '#9b59b6',
    size: 0.55,
    armor: 0,
    flying: true
  },
  armored: {
    name: '装甲',
    hp: 200,
    speed: 0.7,
    reward: 40,
    color: '#7f8c8d',
    size: 0.75,
    armor: 15
  },
  healer: {
    name: '治疗',
    hp: 100,
    speed: 0.9,
    reward: 50,
    color: '#2ecc71',
    size: 0.6,
    armor: 0,
    healAmount: 5,
    healRange: 2,
    healInterval: 1.5
  },
  boss: {
    name: 'Boss',
    hp: 800,
    speed: 0.5,
    reward: 200,
    color: '#c0392b',
    size: 1.0,
    armor: 10
  }
};

// 出售塔退还比例
export const SELL_REFUND_RATIO = 0.6;

// 游戏速度
export const GAME_SPEEDS = [1, 2, 3];
