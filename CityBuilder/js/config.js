// ============================================
// 城市建设者 - 配置文件
// ============================================

export const GRID = {
  cols: 30,
  rows: 20,
  cellSize: 40
};

export const DAY_LENGTH = 600; // 每天帧数 (60fps下约10秒)
export const TICK_RATE = 60;

// 建筑类型定义
export const BUILDINGS = {
  residential: {
    name: '住宅',
    icon: '🏠',
    color: '#4CAF50',
    colorDark: '#388E3C',
    cost: 100,
    maintenance: 5,
    powerNeed: 1,
    populationCapacity: 5,
    description: '提供人口容量',
    detail: '每座住宅容纳5人'
  },
  commercial: {
    name: '商业',
    icon: '🏪',
    color: '#42A5F5',
    colorDark: '#1E88E5',
    cost: 200,
    maintenance: 10,
    powerNeed: 2,
    taxIncome: 20,
    jobs: 3,
    description: '产生税收收入',
    detail: '提供3个岗位，每日+20金币'
  },
  industrial: {
    name: '工业',
    icon: '🏭',
    color: '#78909C',
    colorDark: '#546E7A',
    cost: 300,
    maintenance: 15,
    powerNeed: 3,
    taxIncome: 15,
    resourceIncome: 10,
    jobs: 5,
    description: '产生资源和税收',
    detail: '提供5个岗位，每日+15金币+10资源'
  },
  farm: {
    name: '农场',
    icon: '🌾',
    color: '#FDD835',
    colorDark: '#F9A825',
    cost: 150,
    maintenance: 8,
    powerNeed: 0,
    foodIncome: 10,
    jobs: 2,
    description: '提供食物',
    detail: '提供2个岗位，每日+10食物'
  },
  school: {
    name: '学校',
    icon: '🏫',
    color: '#FF9800',
    colorDark: '#F57C00',
    cost: 250,
    maintenance: 12,
    powerNeed: 2,
    satisfactionBonus: 8,
    description: '提升满意度',
    detail: '满意度+8'
  },
  hospital: {
    name: '医院',
    icon: '🏥',
    color: '#EF5350',
    colorDark: '#E53935',
    cost: 300,
    maintenance: 15,
    powerNeed: 3,
    satisfactionBonus: 10,
    description: '提升满意度',
    detail: '满意度+10'
  },
  police: {
    name: '警察局',
    icon: '🚔',
    color: '#5C6BC0',
    colorDark: '#3949AB',
    cost: 200,
    maintenance: 10,
    powerNeed: 2,
    satisfactionBonus: 6,
    description: '降低犯罪率',
    detail: '满意度+6'
  },
  park: {
    name: '公园',
    icon: '🌳',
    color: '#66BB6A',
    colorDark: '#43A047',
    cost: 100,
    maintenance: 5,
    powerNeed: 0,
    satisfactionBonus: 4,
    description: '美化环境',
    detail: '满意度+4'
  },
  powerplant: {
    name: '发电厂',
    icon: '⚡',
    color: '#FFEE58',
    colorDark: '#FDD835',
    cost: 400,
    maintenance: 20,
    powerNeed: 0,
    powerSupply: 20,
    description: '提供电力',
    detail: '提供20单位电力'
  },
  road: {
    name: '道路',
    icon: '🛣️',
    color: '#BDBDBD',
    colorDark: '#9E9E9E',
    cost: 20,
    maintenance: 1,
    powerNeed: 0,
    description: '连接建筑',
    detail: '连接各建筑'
  }
};

// 建筑类型列表（用于UI顺序）
export const BUILDING_ORDER = [
  'residential', 'commercial', 'industrial', 'farm',
  'school', 'hospital', 'police', 'park',
  'powerplant', 'road'
];

// 初始资源
export const INITIAL_RESOURCES = {
  gold: 1000,
  population: 0,
  food: 50,
  power: 0,
  powerCapacity: 0,
  satisfaction: 50
};

// 升级倍率
export const UPGRADE_COST_MULTIPLIER = 1.5;
export const UPGRADE_OUTPUT_MULTIPLIER = 1.5;
export const MAX_BUILDING_LEVEL = 3;

// 居民相关
export const RESIDENT_SPEED = 0.8; // 格/秒
export const RESIDENT_SIZE = 4;
export const RESIDENT_COLORS = {
  happy: '#4CAF50',
  neutral: '#FFC107',
  unhappy: '#F44336'
};

// 相机默认值
export const CAMERA_DEFAULTS = {
  zoom: 1,
  minZoom: 0.3,
  maxZoom: 3,
  zoomStep: 0.1
};
