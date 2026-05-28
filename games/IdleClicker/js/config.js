// 游戏配置常量
export const CONFIG = {
  // 建筑配置
  buildings: [
    {
      id: 'lemonade',
      name: '柠檬水摊',
      icon: '🍋',
      baseCost: 10,
      baseProduction: 0.5,
      description: '清凉柠檬水，童叟无欺'
    },
    {
      id: 'newspaper',
      name: '报刊亭',
      icon: '📰',
      baseCost: 100,
      baseProduction: 2,
      description: '最新报刊杂志'
    },
    {
      id: 'pizza',
      name: '披萨店',
      icon: '🍕',
      baseCost: 1000,
      baseProduction: 10,
      description: '美味披萨，现做现卖'
    },
    {
      id: 'cinema',
      name: '电影院',
      icon: '🎬',
      baseCost: 10000,
      baseProduction: 50,
      description: '视听盛宴'
    },
    {
      id: 'bank',
      name: '银行',
      icon: '🏦',
      baseCost: 100000,
      baseProduction: 250,
      description: '钱生钱'
    },
    {
      id: 'factory',
      name: '工厂',
      icon: '🏭',
      baseCost: 1000000,
      baseProduction: 1200,
      description: '自动化生产线'
    },
    {
      id: 'laboratory',
      name: '实验室',
      icon: '🔬',
      baseCost: 10000000,
      baseProduction: 6000,
      description: '科技创新'
    },
    {
      id: 'spacestation',
      name: '太空站',
      icon: '🚀',
      baseCost: 100000000,
      baseProduction: 30000,
      description: '探索宇宙'
    },
    {
      id: 'dyson',
      name: '戴森球',
      icon: '☀️',
      baseCost: 1000000000,
      baseProduction: 150000,
      description: '恒星能量收集器'
    },
    {
      id: 'timemachine',
      name: '时间机器',
      icon: '⏰',
      baseCost: 10000000000,
      baseProduction: 750000,
      description: '穿越时空'
    }
  ],

  // 升级配置 - 每种建筑有多个升级
  upgrades: [
    // 柠檬水摊升级
    { id: 'lemon_1', buildingId: 'lemonade', name: '新鲜柠檬', multiplier: 2, cost: 100, requiredCount: 1, description: '柠檬水产量x2' },
    { id: 'lemon_2', buildingId: 'lemonade', name: '秘制配方', multiplier: 2, cost: 500, requiredCount: 5, description: '柠檬水产量x2' },
    { id: 'lemon_3', buildingId: 'lemonade', name: '连锁经营', multiplier: 5, cost: 5000, requiredCount: 25, description: '柠檬水产量x5' },
    { id: 'lemon_4', buildingId: 'lemonade', name: '品牌效应', multiplier: 10, cost: 50000, requiredCount: 50, description: '柠檬水产量x10' },
    { id: 'lemon_5', buildingId: 'lemonade', name: '全球垄断', multiplier: 100, cost: 5000000, requiredCount: 100, description: '柠檬水产量x100' },

    // 报刊亭升级
    { id: 'news_1', buildingId: 'newspaper', name: '头版头条', multiplier: 2, cost: 1000, requiredCount: 1, description: '报刊亭产量x2' },
    { id: 'news_2', buildingId: 'newspaper', name: '日报周刊', multiplier: 2, cost: 5000, requiredCount: 5, description: '报刊亭产量x2' },
    { id: 'news_3', buildingId: 'newspaper', name: '媒体帝国', multiplier: 5, cost: 50000, requiredCount: 25, description: '报刊亭产量x5' },
    { id: 'news_4', buildingId: 'newspaper', name: '新闻自由', multiplier: 10, cost: 500000, requiredCount: 50, description: '报刊亭产量x10' },
    { id: 'news_5', buildingId: 'newspaper', name: '信息霸权', multiplier: 100, cost: 50000000, requiredCount: 100, description: '报刊亭产量x100' },

    // 披萨店升级
    { id: 'pizza_1', buildingId: 'pizza', name: '芝士加倍', multiplier: 2, cost: 10000, requiredCount: 1, description: '披萨店产量x2' },
    { id: 'pizza_2', buildingId: 'pizza', name: '外卖服务', multiplier: 2, cost: 50000, requiredCount: 5, description: '披萨店产量x2' },
    { id: 'pizza_3', buildingId: 'pizza', name: '连锁披萨', multiplier: 5, cost: 500000, requiredCount: 25, description: '披萨店产量x5' },
    { id: 'pizza_4', buildingId: 'pizza', name: '披萨帝国', multiplier: 10, cost: 5000000, requiredCount: 50, description: '披萨店产量x10' },
    { id: 'pizza_5', buildingId: 'pizza', name: '全球披萨', multiplier: 100, cost: 500000000, requiredCount: 100, description: '披萨店产量x100' },

    // 电影院升级
    { id: 'cinema_1', buildingId: 'cinema', name: '爆米花', multiplier: 2, cost: 100000, requiredCount: 1, description: '电影院产量x2' },
    { id: 'cinema_2', buildingId: 'cinema', name: '3D放映', multiplier: 2, cost: 500000, requiredCount: 5, description: '电影院产量x2' },
    { id: 'cinema_3', buildingId: 'cinema', name: 'IMAX巨幕', multiplier: 5, cost: 5000000, requiredCount: 25, description: '电影院产量x5' },
    { id: 'cinema_4', buildingId: 'cinema', name: '影视帝国', multiplier: 10, cost: 50000000, requiredCount: 50, description: '电影院产量x10' },
    { id: 'cinema_5', buildingId: 'cinema', name: '奥斯卡奖', multiplier: 100, cost: 5000000000, requiredCount: 100, description: '电影院产量x100' },

    // 银行升级
    { id: 'bank_1', buildingId: 'bank', name: 'VIP客户', multiplier: 2, cost: 1000000, requiredCount: 1, description: '银行产量x2' },
    { id: 'bank_2', buildingId: 'bank', name: '理财产品', multiplier: 2, cost: 5000000, requiredCount: 5, description: '银行产量x2' },
    { id: 'bank_3', buildingId: 'bank', name: '跨国银行', multiplier: 5, cost: 50000000, requiredCount: 25, description: '银行产量x5' },
    { id: 'bank_4', buildingId: 'bank', name: '金融帝国', multiplier: 10, cost: 500000000, requiredCount: 50, description: '银行产量x10' },
    { id: 'bank_5', buildingId: 'bank', name: '央行行长', multiplier: 100, cost: 50000000000, requiredCount: 100, description: '银行产量x100' },

    // 工厂升级
    { id: 'factory_1', buildingId: 'factory', name: '流水线', multiplier: 2, cost: 10000000, requiredCount: 1, description: '工厂产量x2' },
    { id: 'factory_2', buildingId: 'factory', name: '自动化', multiplier: 2, cost: 50000000, requiredCount: 5, description: '工厂产量x2' },
    { id: 'factory_3', buildingId: 'factory', name: '智能制造', multiplier: 5, cost: 500000000, requiredCount: 25, description: '工厂产量x5' },
    { id: 'factory_4', buildingId: 'factory', name: '工业4.0', multiplier: 10, cost: 5000000000, requiredCount: 50, description: '工厂产量x10' },
    { id: 'factory_5', buildingId: 'factory', name: '纳米工厂', multiplier: 100, cost: 500000000000, requiredCount: 100, description: '工厂产量x100' },

    // 实验室升级
    { id: 'lab_1', buildingId: 'laboratory', name: '显微镜', multiplier: 2, cost: 100000000, requiredCount: 1, description: '实验室产量x2' },
    { id: 'lab_2', buildingId: 'laboratory', name: '基因工程', multiplier: 2, cost: 500000000, requiredCount: 5, description: '实验室产量x2' },
    { id: 'lab_3', buildingId: 'laboratory', name: '量子计算', multiplier: 5, cost: 5000000000, requiredCount: 25, description: '实验室产量x5' },
    { id: 'lab_4', buildingId: 'laboratory', name: '人工智能', multiplier: 10, cost: 50000000000, requiredCount: 50, description: '实验室产量x10' },
    { id: 'lab_5', buildingId: 'laboratory', name: '奇点降临', multiplier: 100, cost: 5000000000000, requiredCount: 100, description: '实验室产量x100' },

    // 太空站升级
    { id: 'space_1', buildingId: 'spacestation', name: '月球基地', multiplier: 2, cost: 1000000000, requiredCount: 1, description: '太空站产量x2' },
    { id: 'space_2', buildingId: 'spacestation', name: '火星殖民', multiplier: 2, cost: 5000000000, requiredCount: 5, description: '太空站产量x2' },
    { id: 'space_3', buildingId: 'spacestation', name: '星际旅行', multiplier: 5, cost: 50000000000, requiredCount: 25, description: '太空站产量x5' },
    { id: 'space_4', buildingId: 'spacestation', name: '虫洞技术', multiplier: 10, cost: 500000000000, requiredCount: 50, description: '太空站产量x10' },
    { id: 'space_5', buildingId: 'spacestation', name: '银河帝国', multiplier: 100, cost: 50000000000000, requiredCount: 100, description: '太空站产量x100' },

    // 戴森球升级
    { id: 'dyson_1', buildingId: 'dyson', name: '能量护盾', multiplier: 2, cost: 10000000000, requiredCount: 1, description: '戴森球产量x2' },
    { id: 'dyson_2', buildingId: 'dyson', name: '恒星引擎', multiplier: 2, cost: 50000000000, requiredCount: 5, description: '戴森球产量x2' },
    { id: 'dyson_3', buildingId: 'dyson', name: '反物质', multiplier: 5, cost: 500000000000, requiredCount: 25, description: '戴森球产量x5' },
    { id: 'dyson_4', buildingId: 'dyson', name: '暗能量', multiplier: 10, cost: 5000000000000, requiredCount: 50, description: '戴森球产量x10' },
    { id: 'dyson_5', buildingId: 'dyson', name: '宇宙之心', multiplier: 100, cost: 500000000000000, requiredCount: 100, description: '戴森球产量x100' },

    // 时间机器升级
    { id: 'time_1', buildingId: 'timemachine', name: '时光倒流', multiplier: 2, cost: 100000000000, requiredCount: 1, description: '时间机器产量x2' },
    { id: 'time_2', buildingId: 'timemachine', name: '平行宇宙', multiplier: 2, cost: 500000000000, requiredCount: 5, description: '时间机器产量x2' },
    { id: 'time_3', buildingId: 'timemachine', name: '因果律', multiplier: 5, cost: 5000000000000, requiredCount: 25, description: '时间机器产量x5' },
    { id: 'time_4', buildingId: 'timemachine', name: '命运之轮', multiplier: 10, cost: 50000000000000, requiredCount: 50, description: '时间机器产量x10' },
    { id: 'time_5', buildingId: 'timemachine', name: '永恒之主', multiplier: 100, cost: 5000000000000000, requiredCount: 100, description: '时间机器产量x100' }
  ],

  // 成就配置
  achievements: [
    // 点击成就
    { id: 'click_1', name: '初次点击', description: '点击1次', condition: { type: 'clicks', value: 1 }, reward: 0.01 },
    { id: 'click_2', name: '点击新手', description: '点击100次', condition: { type: 'clicks', value: 100 }, reward: 0.01 },
    { id: 'click_3', name: '点击达人', description: '点击1000次', condition: { type: 'clicks', value: 1000 }, reward: 0.02 },
    { id: 'click_4', name: '点击大师', description: '点击10000次', condition: { type: 'clicks', value: 10000 }, reward: 0.05 },
    { id: 'click_5', name: '点击之神', description: '点击100000次', condition: { type: 'clicks', value: 100000 }, reward: 0.1 },

    // 金币成就
    { id: 'gold_1', name: '小有积蓄', description: '累计获得1000金币', condition: { type: 'totalGold', value: 1000 }, reward: 0.01 },
    { id: 'gold_2', name: '万元户', description: '累计获得10000金币', condition: { type: 'totalGold', value: 10000 }, reward: 0.01 },
    { id: 'gold_3', name: '百万富翁', description: '累计获得1000000金币', condition: { type: 'totalGold', value: 1000000 }, reward: 0.02 },
    { id: 'gold_4', name: '亿万富翁', description: '累计获得1000000000金币', condition: { type: 'totalGold', value: 1000000000 }, reward: 0.05 },
    { id: 'gold_5', name: '世界首富', description: '累计获得1000000000000金币', condition: { type: 'totalGold', value: 1000000000000 }, reward: 0.1 },

    // 建筑成就 - 每种建筑拥有1个
    { id: 'build_lemonade', name: '柠檬水大王', description: '拥有50个柠檬水摊', condition: { type: 'building', buildingId: 'lemonade', value: 50 }, reward: 0.02 },
    { id: 'build_newspaper', name: '报业大亨', description: '拥有50个报刊亭', condition: { type: 'building', buildingId: 'newspaper', value: 50 }, reward: 0.02 },
    { id: 'build_pizza', name: '披萨之王', description: '拥有50个披萨店', condition: { type: 'building', buildingId: 'pizza', value: 50 }, reward: 0.02 },
    { id: 'build_cinema', name: '影视大亨', description: '拥有50个电影院', condition: { type: 'building', buildingId: 'cinema', value: 50 }, reward: 0.02 },
    { id: 'build_bank', name: '银行家', description: '拥有50个银行', condition: { type: 'building', buildingId: 'bank', value: 50 }, reward: 0.02 },
    { id: 'build_factory', name: '工业巨头', description: '拥有50个工厂', condition: { type: 'building', buildingId: 'factory', value: 50 }, reward: 0.02 },
    { id: 'build_laboratory', name: '科学狂人', description: '拥有50个实验室', condition: { type: 'building', buildingId: 'laboratory', value: 50 }, reward: 0.02 },
    { id: 'build_spacestation', name: '太空霸主', description: '拥有50个太空站', condition: { type: 'building', buildingId: 'spacestation', value: 50 }, reward: 0.02 },
    { id: 'build_dyson', name: '能源之王', description: '拥有50个戴森球', condition: { type: 'building', buildingId: 'dyson', value: 50 }, reward: 0.02 },
    { id: 'build_timemachine', name: '时间领主', description: '拥有50个时间机器', condition: { type: 'building', buildingId: 'timemachine', value: 50 }, reward: 0.02 },

    // 升级成就
    { id: 'upgrade_1', name: '初次升级', description: '购买1个升级', condition: { type: 'upgrades', value: 1 }, reward: 0.01 },
    { id: 'upgrade_2', name: '升级达人', description: '购买10个升级', condition: { type: 'upgrades', value: 10 }, reward: 0.02 },
    { id: 'upgrade_3', name: '升级大师', description: '购买25个升级', condition: { type: 'upgrades', value: 25 }, reward: 0.05 },

    // 产量成就
    { id: 'prod_1', name: '小作坊', description: '每秒产出10金币', condition: { type: 'production', value: 10 }, reward: 0.01 },
    { id: 'prod_2', name: '小工厂', description: '每秒产出1000金币', condition: { type: 'production', value: 1000 }, reward: 0.02 },
    { id: 'prod_3', name: '大企业', description: '每秒产出100000金币', condition: { type: 'production', value: 100000 }, reward: 0.05 },
    { id: 'prod_4', name: '商业帝国', description: '每秒产出10000000金币', condition: { type: 'production', value: 10000000 }, reward: 0.1 },

    // 特殊成就
    { id: 'special_1', name: '全面发展', description: '每种建筑至少拥有1个', condition: { type: 'allBuildings', value: 1 }, reward: 0.05 },
    { id: 'special_2', name: '建筑狂魔', description: '总计拥有500个建筑', condition: { type: 'totalBuildings', value: 500 }, reward: 0.05 },
    { id: 'special_3', name: '建筑之神', description: '总计拥有2000个建筑', condition: { type: 'totalBuildings', value: 2000 }, reward: 0.1 }
  ],

  // 游戏设置
  settings: {
    saveInterval: 10000,  // 自动存档间隔（毫秒）
    offlineEfficiency: 0.5,  // 离线收益效率
    costMultiplier: 1.15,  // 建筑价格递增倍率
    clickBaseValue: 1,  // 基础点击价值
    ticksPerSecond: 1  // 每秒游戏tick数
  },

  // 数字格式化配置
  numberFormat: {
    suffixes: ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc'],
    thresholds: [1, 1e3, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30, 1e33]
  }
};
