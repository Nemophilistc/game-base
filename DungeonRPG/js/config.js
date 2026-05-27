// ============================================
// config.js - 游戏常量配置
// ============================================

// 画布和瓦片大小
export const TILE_SIZE = 24;
export const CANVAS_TILES_X = 40;
export const CANVAS_TILES_Y = 25;
export const CANVAS_WIDTH = TILE_SIZE * CANVAS_TILES_X;
export const CANVAS_HEIGHT = TILE_SIZE * CANVAS_TILES_Y;

// 地牢生成参数
export const DUNGEON_CONFIG = [
  { level: 1, width: 50,  height: 35,  minRoom: 5, maxRoom: 9,  roomMinSize: 4, roomMaxSize: 9,  enemies: 6,  items: 5 },
  { level: 2, width: 60,  height: 42,  minRoom: 6, maxRoom: 11, roomMinSize: 4, roomMaxSize: 10, enemies: 9,  items: 6 },
  { level: 3, width: 70,  height: 50,  minRoom: 7, maxRoom: 13, roomMinSize: 5, roomMaxSize: 11, enemies: 13, items: 7 },
  { level: 4, width: 80,  height: 56,  minRoom: 8, maxRoom: 15, roomMinSize: 5, roomMaxSize: 12, enemies: 17, items: 8 },
  { level: 5, width: 90,  height: 63,  minRoom: 9, maxRoom: 17, roomMinSize: 5, roomMaxSize: 13, enemies: 20, items: 9 },
];

// FOV 参数
export const FOV_RADIUS = 8;

// 瓦片类型
export const TILE = {
  WALL: 0,
  FLOOR: 1,
  DOOR: 2,
  STAIRS_DOWN: 3,
  STAIRS_UP: 4,
  CORRIDOR: 5,
};

// 瓦片颜色
export const TILE_COLORS = {
  [TILE.WALL]:       { visible: '#556b7a', explored: '#2a3540', fg: '#7a8f9e' },
  [TILE.FLOOR]:      { visible: '#3a4a5a', explored: '#1e2830', fg: '#556b7a' },
  [TILE.DOOR]:       { visible: '#8b6914', explored: '#4a3810', fg: '#c4941e' },
  [TILE.STAIRS_DOWN]:{ visible: '#4a9e4a', explored: '#2a5a2a', fg: '#6ece6e' },
  [TILE.STAIRS_UP]:  { visible: '#9e9e4a', explored: '#5a5a2a', fg: '#cece6e' },
  [TILE.CORRIDOR]:   { visible: '#333d4a', explored: '#1a2228', fg: '#4a5a6a' },
};

// 瓦片字符
export const TILE_CHARS = {
  [TILE.WALL]:       '#',
  [TILE.FLOOR]:      '.',
  [TILE.DOOR]:       '+',
  [TILE.STAIRS_DOWN]:'>',
  [TILE.STAIRS_UP]:  '<',
  [TILE.CORRIDOR]:   '.',
};

// 属性名称
export const STAT_NAMES = {
  str: '力量',
  agi: '敏捷',
  con: '体质',
  int: '智力',
};

// 职业
export const CLASSES = {
  warrior:  { name: '战士', str: 14, agi: 10, con: 13, int: 8,  hp: 30, mp: 5,  weapon: 'rusty_sword', armor: 'cloth_armor' },
  rogue:    { name: '盗贼', str: 10, agi: 14, con: 10, int: 10, hp: 22, mp: 10, weapon: 'dagger',       armor: 'leather_armor' },
  mage:     { name: '法师', str: 8,  agi: 10, con: 9,  int: 15, hp: 18, mp: 25, weapon: 'wood_staff',   armor: 'cloth_armor' },
  ranger:   { name: '游侠', str: 11, agi: 13, con: 11, int: 10, hp: 24, mp: 12, weapon: 'short_bow',    armor: 'leather_armor' },
};

// 武器数据
export const WEAPONS = {
  rusty_sword:    { name: '锈剑',     type: 'weapon', slot: 'weapon', atk: 3,  range: 1, char: '/', color: '#aa8866', tier: 1, desc: '一把生锈的旧剑' },
  dagger:         { name: '匕首',     type: 'weapon', slot: 'weapon', atk: 2,  range: 1, char: '/', color: '#cccccc', tier: 1, desc: '锋利的匕首，攻击速度快' },
  wood_staff:     { name: '木杖',     type: 'weapon', slot: 'weapon', atk: 2,  range: 2, char: '/', color: '#8b6914', tier: 1, desc: '普通的木质法杖' },
  short_bow:      { name: '短弓',     type: 'weapon', slot: 'weapon', atk: 2,  range: 4, char: '}', color: '#8b6914', tier: 1, desc: '简易的短弓' },
  iron_sword:     { name: '铁剑',     type: 'weapon', slot: 'weapon', atk: 5,  range: 1, char: '/', color: '#aaaaaa', tier: 2, desc: '坚固的铁剑' },
  battle_axe:     { name: '战斧',     type: 'weapon', slot: 'weapon', atk: 7,  range: 1, char: '/', color: '#888888', tier: 2, desc: '沉重的战斧，伤害极高' },
  long_bow:       { name: '长弓',     type: 'weapon', slot: 'weapon', atk: 4,  range: 5, char: '}', color: '#a07830', tier: 2, desc: '射程更远的长弓' },
  crystal_staff:  { name: '水晶杖',   type: 'weapon', slot: 'weapon', atk: 4,  range: 3, char: '/', color: '#66ccff', tier: 2, desc: '蕴含魔力的水晶法杖' },
  flame_sword:    { name: '烈焰之剑', type: 'weapon', slot: 'weapon', atk: 9,  range: 1, char: '/', color: '#ff6633', tier: 3, desc: '燃烧着火焰的魔法剑' },
  shadow_dagger:  { name: '暗影匕首', type: 'weapon', slot: 'weapon', atk: 6,  range: 1, char: '/', color: '#6633cc', tier: 3, desc: '暗影之力附魔的匕首，暴击率高' },
  dragon_bow:     { name: '龙骨弓',   type: 'weapon', slot: 'weapon', atk: 7,  range: 6, char: '}', color: '#ff9933', tier: 3, desc: '用龙骨制作的弓' },
  arcane_staff:   { name: '奥术法杖', type: 'weapon', slot: 'weapon', atk: 7,  range: 4, char: '/', color: '#cc33ff', tier: 3, desc: '蕴含强大奥术力量的法杖' },
  demon_blade:    { name: '魔剑',     type: 'weapon', slot: 'weapon', atk: 12, range: 1, char: '/', color: '#ff0033', tier: 4, desc: '吸取生命的魔剑' },
  god_bow:        { name: '神弓',     type: 'weapon', slot: 'weapon', atk: 10, range: 7, char: '}', color: '#ffcc00', tier: 4, desc: '神明使用的弓' },
};

// 防具数据
export const ARMORS = {
  cloth_armor:    { name: '布甲',     type: 'armor', slot: 'armor', def: 1,  char: '[', color: '#aa9977', tier: 1, desc: '普通的布制衣服' },
  leather_armor:  { name: '皮甲',     type: 'armor', slot: 'armor', def: 2,  char: '[', color: '#8b6914', tier: 1, desc: '轻便的皮革护甲' },
  chain_mail:     { name: '锁子甲',   type: 'armor', slot: 'armor', def: 4,  char: '[', color: '#aaaaaa', tier: 2, desc: '由铁环编织的护甲' },
  iron_armor:     { name: '铁甲',     type: 'armor', slot: 'armor', def: 5,  char: '[', color: '#888888', tier: 2, desc: '厚重的铁制护甲' },
  mithril_armor:  { name: '秘银甲',   type: 'armor', slot: 'armor', def: 7,  char: '[', color: '#66ccff', tier: 3, desc: '轻巧而坚固的秘银护甲' },
  dragon_armor:   { name: '龙鳞甲',   type: 'armor', slot: 'armor', def: 9,  char: '[', color: '#ff9933', tier: 3, desc: '用龙鳞制作的护甲' },
  plate_armor:    { name: '板甲',     type: 'armor', slot: 'armor', def: 11, char: '[', color: '#cccccc', tier: 4, desc: '全身覆盖的重型板甲' },
};

// 饰品
export const RINGS = {
  ring_strength:  { name: '力量戒指', type: 'ring', slot: 'ring', str: 3,  char: '=', color: '#ff6633', tier: 2, desc: '增加3点力量' },
  ring_agility:   { name: '敏捷戒指', type: 'ring', slot: 'ring', agi: 3,  char: '=', color: '#33ff66', tier: 2, desc: '增加3点敏捷' },
  ring_vitality:  { name: '生命戒指', type: 'ring', slot: 'ring', con: 3,  char: '=', color: '#ff3333', tier: 2, desc: '增加3点体质' },
  ring_wisdom:    { name: '智慧戒指', type: 'ring', slot: 'ring', int: 3,  char: '=', color: '#3366ff', tier: 2, desc: '增加3点智力' },
  ring_power:     { name: '全能戒指', type: 'ring', slot: 'ring', str: 2, agi: 2, con: 2, int: 2, char: '=', color: '#ffcc00', tier: 3, desc: '所有属性+2' },
  ring_protection:{ name: '守护戒指', type: 'ring', slot: 'ring', def: 4,  char: '=', color: '#66ccff', tier: 3, desc: '增加4点防御' },
};

// 消耗品
export const CONSUMABLES = {
  hp_potion_small:  { name: '小治疗药水',   type: 'consumable', subtype: 'potion', heal: 15,   char: '!', color: '#ff3333', tier: 1, desc: '恢复15点生命' },
  hp_potion_medium: { name: '中治疗药水',   type: 'consumable', subtype: 'potion', heal: 35,   char: '!', color: '#ff6666', tier: 2, desc: '恢复35点生命' },
  hp_potion_large:  { name: '大治疗药水',   type: 'consumable', subtype: 'potion', heal: 60,   char: '!', color: '#ff9999', tier: 3, desc: '恢复60点生命' },
  mp_potion_small:  { name: '小魔力药水',   type: 'consumable', subtype: 'potion', mana: 10,   char: '!', color: '#3333ff', tier: 1, desc: '恢复10点魔力' },
  mp_potion_medium: { name: '中魔力药水',   type: 'consumable', subtype: 'potion', mana: 25,   char: '!', color: '#6666ff', tier: 2, desc: '恢复25点魔力' },
  str_potion:       { name: '力量药水',     type: 'consumable', subtype: 'potion', buffStr: 5,  char: '!', color: '#ff6600', tier: 2, desc: '临时增加5点力量(30回合)', buffDuration: 30 },
  agi_potion:       { name: '敏捷药水',     type: 'consumable', subtype: 'potion', buffAgi: 5,  char: '!', color: '#00ff66', tier: 2, desc: '临时增加5点敏捷(30回合)', buffDuration: 30 },
  scroll_teleport:  { name: '传送卷轴',     type: 'consumable', subtype: 'scroll', effect: 'teleport',  char: '?', color: '#cc66ff', tier: 2, desc: '传送到随机已探索位置' },
  scroll_identify:  { name: '鉴定卷轴',     type: 'consumable', subtype: 'scroll', effect: 'identify',  char: '?', color: '#ccccff', tier: 1, desc: '鉴定背包中一件未鉴定物品' },
  scroll_fireball:  { name: '火球卷轴',     type: 'consumable', subtype: 'scroll', effect: 'fireball',  char: '?', color: '#ff3300', tier: 3, desc: '对周围敌人造成20点火焰伤害' },
  scroll_mapping:   { name: '地图卷轴',     type: 'consumable', subtype: 'scroll', effect: 'mapping',   char: '?', color: '#ffcc00', tier: 2, desc: '显示当前层的完整地图' },
  scroll_light:     { name: '照明卷轴',     type: 'consumable', subtype: 'scroll', effect: 'light',     char: '?', color: '#ffff66', tier: 1, desc: '暂时增加视野范围' },
  antidote:         { name: '解毒药',       type: 'consumable', subtype: 'potion', effect: 'curePoison', char: '!', color: '#33cc99', tier: 1, desc: '解除中毒状态' },
};

// 怪物数据
export const MONSTERS = {
  // 第1层怪物
  rat:       { name: '巨鼠',       char: 'r', color: '#8b6914', hp: 8,   atk: 2,  def: 0,  xp: 5,   ai: 'wander',   tier: 1, desc: '变异的大老鼠' },
  bat:       { name: '蝙蝠',       char: 'b', color: '#666666', hp: 6,   atk: 2,  def: 0,  xp: 5,   ai: 'chase',    tier: 1, desc: '嗜血的蝙蝠', speed: 2 },
  slime:     { name: '史莱姆',     char: 's', color: '#33cc33', hp: 12,  atk: 3,  def: 1,  xp: 8,   ai: 'wander',   tier: 1, desc: '黏糊糊的史莱姆' },
  // 第2层怪物
  goblin:    { name: '哥布林',     char: 'g', color: '#33cc33', hp: 18,  atk: 5,  def: 2,  xp: 15,  ai: 'patrol',   tier: 2, desc: '狡猾的哥布林' },
  skeleton:  { name: '骷髅兵',     char: 'S', color: '#cccccc', hp: 22,  atk: 6,  def: 3,  xp: 18,  ai: 'guard',    tier: 2, desc: '不死骷髅战士' },
  spider:    { name: '毒蛛',       char: 'S', color: '#6633cc', hp: 15,  atk: 4,  def: 1,  xp: 14,  ai: 'chase',    tier: 2, desc: '能喷射毒液的蜘蛛', poison: 2 },
  // 第3层怪物
  orc:       { name: '兽人',       char: 'O', color: '#339933', hp: 35,  atk: 8,  def: 4,  xp: 30,  ai: 'patrol',   tier: 3, desc: '强壮的兽人战士' },
  mage_enemy:{ name: '暗黑法师',   char: 'M', color: '#9933ff', hp: 25,  atk: 10, def: 2,  xp: 35,  ai: 'ranged',   tier: 3, desc: '使用黑暗魔法的法师', range: 4 },
  golem:     { name: '石像鬼',     char: 'G', color: '#888888', hp: 50,  atk: 7,  def: 8,  xp: 40,  ai: 'guard',    tier: 3, desc: '坚硬的石像鬼' },
  // 第4层怪物
  demon:     { name: '恶魔',       char: 'D', color: '#cc3333', hp: 45,  atk: 12, def: 5,  xp: 50,  ai: 'chase',    tier: 4, desc: '来自深渊的恶魔' },
  wraith:    { name: '幽灵',       char: 'W', color: '#99ccff', hp: 30,  atk: 9,  def: 3,  xp: 45,  ai: 'ranged',   tier: 4, desc: '飘忽不定的幽灵', range: 3, phase: true },
  necro:     { name: '死灵法师',   char: 'N', color: '#6600cc', hp: 35,  atk: 8,  def: 3,  xp: 60,  ai: 'summoner', tier: 4, desc: '能召唤骷髅的死灵法师' },
  // 第5层 Boss
  dragon:    { name: '巨龙',       char: 'D', color: '#ff3300', hp: 120, atk: 18, def: 10, xp: 200, ai: 'boss',     tier: 5, desc: '最终Boss：远古巨龙', range: 3, boss: true },
};

// 技能数据
export const SKILLS = {
  power_strike:  { name: '重击',     desc: '造成1.5倍伤害', mp: 5,  cooldown: 3, type: 'attack', mult: 1.5 },
  heal:          { name: '治愈',     desc: '恢复20点生命', mp: 8,  cooldown: 5, type: 'heal',   amount: 20 },
  fireball:      { name: '火球术',   desc: '对目标造成魔法伤害', mp: 10, cooldown: 4, type: 'magic', damage: 15 },
  stealth:       { name: '潜行',     desc: '暂时隐身5回合', mp: 12, cooldown: 10, type: 'buff',  duration: 5 },
  whirlwind:     { name: '旋风斩',   desc: '攻击周围所有敌人', mp: 8, cooldown: 6, type: 'aoe',   mult: 1.0 },
  arrow_rain:    { name: '箭雨',     desc: '对区域内敌人造成伤害', mp: 10, cooldown: 5, type: 'aoe', damage: 10, range: 3 },
};

// 升级经验表
export const XP_TABLE = [0, 20, 50, 100, 180, 300, 480, 720, 1050, 1500, 2100, 2900, 4000, 5500, 7500];

// 颜色常量
export const COLORS = {
  bg:          '#0a0e14',
  bgLight:     '#141a24',
  panelBg:     'rgba(15, 20, 30, 0.92)',
  panelBorder: 'rgba(80, 120, 180, 0.4)',
  textPrimary: '#e0e8f0',
  textSecondary:'#8899aa',
  textGold:    '#ffd700',
  textRed:     '#ff4444',
  textGreen:   '#44ff44',
  textBlue:    '#4488ff',
  textPurple:  '#cc66ff',
  hpBar:       '#cc3333',
  mpBar:       '#3366cc',
  xpBar:       '#ccaa33',
  enemyHealth: '#cc3333',
};
