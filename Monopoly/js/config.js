// config.js - 大富翁游戏常量配置

// 棋盘格子数量
export const TOTAL_SQUARES = 40;

// 玩家颜色
export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
export const PLAYER_NAMES = ['红方', '蓝方', '绿方', '黄方'];

// 骰子动画
export const DICE_ANIM_FRAMES = 12;
export const DICE_ANIM_INTERVAL = 80;

// 起始资金
export const START_MONEY = 1500;

// 经过起点奖励
export const PASS_GO_BONUS = 200;

// 入狱格位置
export const JAIL_POSITION = 10;

// 监狱保释金
export const JAIL_BAIL = 50;

// 最大房屋数
export const MAX_HOUSES = 4;
export const HOTEL_COST_MULTIPLIER = 1; // 酒店 = 5栋房子(4房+1酒店)

// 房屋/酒店成本（按颜色组）
export const BUILDING_COSTS = {
    brown: 50,
    lightblue: 50,
    pink: 100,
    orange: 100,
    red: 150,
    yellow: 150,
    green: 200,
    darkblue: 200
};

// 棋盘40格数据
// type: property | railroad | utility | chance | chest | tax | go | jail | parking | gotojail
export const SQUARES = [
    { id: 0,  name: '起点',           type: 'go' },
    { id: 1,  name: '地中海大道',     type: 'property', color: 'brown',      price: 60,   rent: [2, 10, 30, 90, 160, 250] },
    { id: 2,  name: '命运',           type: 'chest' },
    { id: 3,  name: '波罗的海大道',   type: 'property', color: 'brown',      price: 60,   rent: [4, 20, 60, 180, 320, 450] },
    { id: 4,  name: '所得税',         type: 'tax', amount: 200 },
    { id: 5,  name: '阅读铁路',       type: 'railroad', price: 200 },
    { id: 6,  name: '东方大道',       type: 'property', color: 'lightblue',  price: 100,  rent: [6, 30, 90, 270, 400, 550] },
    { id: 7,  name: '机会',           type: 'chance' },
    { id: 8,  name: '佛蒙特大道',     type: 'property', color: 'lightblue',  price: 100,  rent: [6, 30, 90, 270, 400, 550] },
    { id: 9,  name: '康州大道',       type: 'property', color: 'lightblue',  price: 120,  rent: [8, 40, 100, 300, 450, 600] },
    { id: 10, name: '监狱/探监',      type: 'jail' },
    { id: 11, name: '圣查尔斯',       type: 'property', color: 'pink',       price: 140,  rent: [10, 50, 150, 450, 625, 750] },
    { id: 12, name: '电力公司',       type: 'utility', price: 150 },
    { id: 13, name: '国家大道',       type: 'property', color: 'pink',       price: 140,  rent: [10, 50, 150, 450, 625, 750] },
    { id: 14, name: '弗吉尼亚大道',   type: 'property', color: 'pink',       price: 160,  rent: [12, 60, 180, 500, 700, 900] },
    { id: 15, name: '宾州铁路',       type: 'railroad', price: 200 },
    { id: 16, name: '圣詹姆斯',       type: 'property', color: 'orange',     price: 180,  rent: [14, 70, 200, 550, 750, 950] },
    { id: 17, name: '命运',           type: 'chest' },
    { id: 18, name: '田纳西大道',     type: 'property', color: 'orange',     price: 180,  rent: [14, 70, 200, 550, 750, 950] },
    { id: 19, name: '纽约大道',       type: 'property', color: 'orange',     price: 200,  rent: [16, 80, 220, 600, 800, 1000] },
    { id: 20, name: '免费停车',       type: 'parking' },
    { id: 21, name: '肯塔基大道',     type: 'property', color: 'red',        price: 220,  rent: [18, 90, 250, 700, 875, 1050] },
    { id: 22, name: '机会',           type: 'chance' },
    { id: 23, name: '印第安纳大道',   type: 'property', color: 'red',        price: 220,  rent: [18, 90, 250, 700, 875, 1050] },
    { id: 24, name: '伊利诺伊大道',   type: 'property', color: 'red',        price: 240,  rent: [20, 100, 300, 750, 925, 1100] },
    { id: 25, name: '短线铁路',       type: 'railroad', price: 200 },
    { id: 26, name: '大西洋大道',     type: 'property', color: 'yellow',     price: 260,  rent: [22, 110, 330, 800, 975, 1150] },
    { id: 27, name: '文特诺大道',     type: 'property', color: 'yellow',     price: 260,  rent: [22, 110, 330, 800, 975, 1150] },
    { id: 28, name: '水务公司',       type: 'utility', price: 150 },
    { id: 29, name: '马文花园',       type: 'property', color: 'yellow',     price: 280,  rent: [24, 120, 360, 850, 1025, 1200] },
    { id: 30, name: '入狱',           type: 'gotojail' },
    { id: 31, name: '太平洋大道',     type: 'property', color: 'green',      price: 300,  rent: [26, 130, 390, 900, 1100, 1275] },
    { id: 32, name: '北卡大道',       type: 'property', color: 'green',      price: 300,  rent: [26, 130, 390, 900, 1100, 1275] },
    { id: 33, name: '命运',           type: 'chest' },
    { id: 34, name: '宾州大道',       type: 'property', color: 'green',      price: 320,  rent: [28, 150, 450, 1000, 1200, 1400] },
    { id: 35, name: '线路铁路',       type: 'railroad', price: 200 },
    { id: 36, name: '机会',           type: 'chance' },
    { id: 37, name: '公园广场',       type: 'property', color: 'darkblue',   price: 350,  rent: [35, 175, 500, 1100, 1300, 1500] },
    { id: 38, name: '奢侈税',         type: 'tax', amount: 100 },
    { id: 39, name: '木板步道',       type: 'property', color: 'darkblue',   price: 400,  rent: [50, 200, 600, 1400, 1700, 2000] }
];

// 颜色组定义
export const COLOR_GROUPS = {
    brown:     { name: '棕色',   squares: [1, 3],        css: '#8B4513' },
    lightblue: { name: '浅蓝',   squares: [6, 8, 9],     css: '#87CEEB' },
    pink:      { name: '粉色',   squares: [11, 13, 14],  css: '#FF69B4' },
    orange:    { name: '橙色',   squares: [16, 18, 19],  css: '#FF8C00' },
    red:       { name: '红色',   squares: [21, 23, 24],  css: '#E74C3C' },
    yellow:    { name: '黄色',   squares: [26, 27, 29],  css: '#F1C40F' },
    green:     { name: '绿色',   squares: [31, 32, 34],  css: '#27AE60' },
    darkblue:  { name: '深蓝',   squares: [37, 39],      css: '#2C3E50' }
};

// 铁路位置
export const RAILROAD_POSITIONS = [5, 15, 25, 35];

// 公用事业位置
export const UTILITY_POSITIONS = [12, 28];

// 机会卡数据（16张）
export const CHANCE_CARDS = [
    { id: 1,  text: '前进到起点，收取$200', action: 'moveTo', value: 0 },
    { id: 2,  text: '前进到伊利诺伊大道', action: 'moveTo', value: 24 },
    { id: 3,  text: '前进到圣查尔斯', action: 'moveTo', value: 11 },
    { id: 4,  text: '前进到最近的公用事业', action: 'nearestUtility' },
    { id: 5,  text: '前进到最近的铁路', action: 'nearestRailroad' },
    { id: 6,  text: '银行给你$50', action: 'collect', value: 50 },
    { id: 7,  text: '获得出狱卡', action: 'getOutOfJail' },
    { id: 8,  text: '后退三格', action: 'back', value: 3 },
    { id: 9,  text: '入狱（不经过起点）', action: 'goToJail' },
    { id: 10, text: '每栋房屋支付$25，每家酒店支付$100', action: 'payPerBuilding', house: 25, hotel: 100 },
    { id: 11, text: '支付$15税金', action: 'pay', value: 15 },
    { id: 12, text: '前进到木板步道', action: 'moveTo', value: 39 },
    { id: 13, text: '每位玩家给你$50', action: 'collectFromAll', value: 50 },
    { id: 14, text: '你的投资获得$150', action: 'collect', value: 150 },
    { id: 15, text: '前进到阅读铁路', action: 'moveTo', value: 5 },
    { id: 16, text: '你被选为董事会主席，每位玩家给你$50', action: 'collectFromAll', value: 50 }
];

// 命运卡数据（16张）
export const CHEST_CARDS = [
    { id: 1,  text: '你继承了$100', action: 'collect', value: 100 },
    { id: 2,  text: '你赢得储蓄利息$50', action: 'collect', value: 50 },
    { id: 3,  text: '支付医疗费$50', action: 'pay', value: 50 },
    { id: 4,  text: '支付学校税$50', action: 'pay', value: 150 },
    { id: 5,  text: '咨询费收入$25', action: 'collect', value: 25 },
    { id: 6,  text: '街道修缮费 每栋$40', action: 'payPerBuilding', house: 40, hotel: 115 },
    { id: 7,  text: '你赢得比赛奖金$10', action: 'collect', value: 10 },
    { id: 8,  text: '你出售股票获利$50', action: 'collect', value: 50 },
    { id: 9,  text: '获得出狱卡', action: 'getOutOfJail' },
    { id: 10, text: '前进到起点，收取$200', action: 'moveTo', value: 0 },
    { id: 11, text: '你被评估修路费$45', action: 'pay', value: 45 },
    { id: 12, text: '你获得生日礼金$100', action: 'collect', value: 100 },
    { id: 13, text: '入狱（不经过起点）', action: 'goToJail' },
    { id: 14, text: '退还所得税$20', action: 'collect', value: 20 },
    { id: 15, text: '你获得人寿保险到期$100', action: 'collect', value: 100 },
    { id: 16, text: '你赢得慈善抽奖$45', action: 'collect', value: 45 }
];

// 颜色常量
export const SQUARE_COLORS = {
    go: '#FFD700',
    brown: '#8B4513',
    chest: '#FFB6C1',
    lightblue: '#87CEEB',
    pink: '#FF69B4',
    orange: '#FF8C00',
    railroad: '#808080',
    utility: '#C0C0C0',
    chance: '#FFA07A',
    red: '#E74C3C',
    yellow: '#F1C40F',
    green: '#27AE60',
    darkblue: '#2C3E50',
    tax: '#DDA0DD',
    jail: '#D2B48C',
    parking: '#90EE90',
    gotojail: '#FF6347'
};
