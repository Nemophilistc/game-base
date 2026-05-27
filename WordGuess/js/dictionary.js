// dictionary.js - 词库（500+ 中文五字词语 / 英文五字母单词）

// ===== 中文五字词语/短语 =====
export const CHINESE_WORDS = [
  // --- 日常生活 ---
  '一不做二不', '人不可貌相', '百闻不如一', '小不忍则乱', '三下五除二',
  '四两拨千斤', '一物降一物', '二一添作五', '八字没一撇', '十八般武艺',
  '八九不离十', '十万八千里', '快刀斩乱麻', '千里送鹅毛', '物以稀为贵',
  '习惯成自然', '事后诸葛亮', '十万火急事', '风马牛不相', '九牛二虎力',
  '一问三不知', '三思而后行', '五十步笑百', '不打不相识', '无风不起浪',
  '眼不见为净', '防患于未然', '赶鸭子上架', '老牛拉破车', '摸着石头过',
  '临时抱佛脚', '空口说白话', '换汤不换药', '久旱逢甘霖', '贪多嚼不烂',
  '真人不露相', '恨铁不成钢', '打蛇打七寸', '独木不成林', '覆巢无完卵',
  '瑞雪兆丰年', '枪打出头鸟', '名师出高徒', '时势造英雄', '乱点鸳鸯谱',
  '破罐子破摔', '好心办坏事', '无巧不成书', '先下手为强', '坐山观虎斗',
  '隔墙有耳目', '纸包不住火', '水火不相容', '开门见山色', '大鱼吃小鱼',
  '心静自然凉', '萝卜白菜各', '一个巴掌拍', '一朝被蛇咬', '一言既出驷',
  '一日不见如', '一年之计在', '一分耕耘一', '一寸光阴一', '一失足成千',
  '一朝天子一', '一个萝卜一', '一方水土一', '一回生二回', '一人得道鸡',
  '一碗水端不', '一朝被蛇怕', '一只筷子吃', '一粒老鼠屎', '一山不容二',
  '一把钥匙开', '一朝君子一', '一个女婿半', '一块石头落', '一手遮不了',

  // --- 自然/动物 ---
  '风花雪月夜', '花鸟鱼虫草', '梅兰竹菊松', '山川湖海河', '风雨雷电雪',
  '春夏秋冬夏', '日月星辰光', '江河湖海泊', '飞禽走兽类', '龙飞凤舞姿',
  '虎头蛇尾功', '鸡飞狗跳墙', '龙腾虎跃时', '鹤立鸡群中', '凤毛麟角稀',
  '画蛇添足事', '守株待兔人', '亡羊补牢策', '对牛弹琴曲', '狐假虎威风',
  '狼吞虎咽食', '鱼跃龙门志', '鸟语花香春', '莺歌燕舞天', '蛛丝马迹藏',
  '螳螂捕蝉后', '鹬蚌相争时', '蚕食鲸吞势', '鸦雀无声夜', '鸡鸣狗盗术',
  '兔死狐悲情', '兔死狗烹时', '龙争虎斗场', '虎视眈眈态', '牛鬼蛇神出',
  '猪狗不如生', '马到成功日', '羊入虎口险', '狗急跳墙时', '鼠目寸光人',

  // --- 情感/性格 ---
  '心花怒放时', '喜出望外中', '悲欢离合事', '爱恨情仇深', '酸甜苦辣咸',
  '喜怒哀乐惧', '忧愁烦恼去', '欢天喜地时', '怒发冲冠状', '哀鸿遍野景',
  '乐极生悲事', '惊弓之鸟态', '胆战心惊时', '心惊肉跳夜', '心旷神怡处',
  '心急如焚中', '心平气和时', '心领神会意', '心心相印中', '心服口服地',
  '宽宏大量人', '光明磊落处', '刚正不阿风', '两袖清风官', '大公无私心',
  '舍己为人志', '视死如归心', '鞠躬尽瘁后', '赴汤蹈火行', '肝胆相照情',
  '同甘共苦日', '风雨同舟时', '荣辱与共心', '患难之交情', '莫逆之交深',

  // --- 学习/智慧 ---
  '学富五车才', '才高八斗学', '博古通今识', '博学多才人', '满腹经纶士',
  '出口成章才', '下笔成文思', '一目十行速', '过目不忘忆', '举一反三智',
  '融会贯通理', '温故知新学', '不耻下问风', '勤学苦练功', '悬梁刺股志',
  '凿壁偷光读', '囊萤映雪夜', '程门立雪礼', '闻鸡起舞人', '废寝忘食中',
  '手不释卷时', '学以致用法', '因材施教道', '教学相长理', '青出于蓝胜',
  '冰寒于水时', '后生可畏处', '后来居上势', '前车之鉴后', '亡羊补牢时',
  '塞翁失马焉', '愚公移山志', '精卫填海心', '铁杵磨针功', '滴水穿石力',

  // --- 社会/历史 ---
  '天下为公理', '国泰民安世', '安居乐业中', '丰衣足食年', '太平盛世时',
  '盛世太平日', '风调雨顺年', '五谷丰登岁', '六畜兴旺时', '百业兴旺日',
  '政通人和处', '国富民强时', '长治久安策', '励精图治志', '卧薪尝胆心',
  '破釜沉舟决', '背水一战时', '置之死地后', '绝处逢生路', '柳暗花明村',
  '峰回路转时', '否极泰来日', '苦尽甘来时', '雨过天晴后', '守得云开见',
  '拨云见日时', '重见天日处', '死灰复燃势', '卷土重来日', '东山再起时',

  // --- 现代用语 ---
  '人工智能化', '大数据时代', '云计算平台', '物联网技术', '区块链应用',
  '虚拟现实境', '增强现实感', '机器学习法', '深度学习算', '自然语言处',
  '计算机视觉', '语音识别技', '自动驾驶车', '智能家居系', '移动互联网',
  '电子商务平', '社交媒体圈', '数字人民币', '量子计算机', '基因编辑术',
  '新能源汽车', '光伏发电站', '风力发电场', '碳中和目标', '绿色可持续',
  '高速铁路网', '跨海大桥建', '超级计算机', '空间站建设', '探月工程组',

  // --- 饮食/文化 ---
  '色香味俱全', '八大菜系中', '满汉全席宴', '山珍海味佳', '龙井虾仁鲜',
  '东坡肉肥美', '叫花鸡香嫩', '佛跳墙浓香', '麻婆豆腐辣', '宫保鸡丁香',
  '回锅肉下饭', '红烧肉酥烂', '清蒸鱼鲜嫩', '水煮鱼麻辣', '糖醋排骨甜',
  '酸菜鱼开胃', '夫妻肺片辣', '担担面香辣', '热干面香浓', '炸酱面醇厚',
  '兰州拉面筋', '刀削面劲道', '小笼包鲜美', '灌汤包多汁', '生煎包香脆',
  '饺子宴丰富', '月饼代表团', '粽子飘香时', '元宵甜蜜蜜', '腊八粥温暖',

  // --- 建筑/地理 ---
  '万里长城长', '故宫博物院', '天安门广场', '颐和园美景', '圆明园遗址',
  '秦始皇陵墓', '布达拉宫殿', '敦煌莫高窟', '龙门石窟像', '云冈石窟雕',
  '黄果树瀑布', '桂林山水甲', '九寨沟仙境', '张家界峰林', '黄山云海景',
  '泰山日出美', '华山论剑处', '峨眉山秀色', '五台山佛光', '普陀山海天',
  '长江三峡景', '黄河壶口瀑', '西湖断桥雪', '太湖风光好', '洞庭湖烟波',
  '鄱阳湖候鸟', '青海湖碧蓝', '洱海月映照', '泸沽湖宁静', '纳木错天湖',

  // --- 更多成语/俗语 ---
  '半途而废事', '持之以恒心', '锲而不舍志', '坚持不懈功', '百折不挠行',
  '勇往直前路', '奋发图强日', '自强不息人', '厚德载物心', '上善若水德',
  '海纳百川容', '壁立千仞刚', '天道酬勤人', '地道酬善心', '商道酬信义',
  '业道酬精技', '人道酬诚德', '知足常乐者', '无欲则刚人', '有容乃大心',
  '宁静以致远', '淡泊以明志', '静以修身性', '俭以养德行', '非淡泊无以',
  '非宁静无致', '志当存高远', '路在脚下行', '千里之行始', '万丈高楼起',
  '台上一分钟', '台下十年功', '冰冻三尺非', '一日之寒来', '滴水之恩涌',
  '相报以涌泉', '君子之交淡', '小人之交甘', '近朱者赤身', '近墨者黑者',
  '己所不欲勿', '施于人前先', '知之为知之', '不知为不知', '三人行必有',
  '择其善者从', '其不善者改', '学而时习之', '不亦说乎哉', '温故而知新',
  '可以为师矣', '学而不思则', '思而不学则', '知之者不如', '好之者不如',
  '乐之者最好', '不愤不启举', '不悱不发愤', '举一隅不以', '三隅反则复',
  '默而识之学', '不厌诲人不', '倦何有于哉', '我哉躬自省', '厚而薄责人',
  '则远怨矣哉', '德不孤必有', '邻里相助时', '四海之内皆', '兄弟也情深',

  // --- 旅行/地理 ---
  '一帆风顺行', '乘风破浪时', '披荆斩棘路', '劈波斩浪行', '翻山越岭途',
  '跋山涉水行', '风餐露宿夜', '披星戴月时', '栉风沐雨中', '走南闯北人',
  '天南海北处', '五湖四海内', '大江南北地', '长城内外景', '塞北江南春',

  // --- 情感补充 ---
  '心如刀割痛', '肝肠寸断时', '泪如雨下中', '欣喜若狂处', '喜不自胜时',
  '手舞足蹈乐', '眉飞色舞处', '满面春风时', '笑逐颜开日', '如沐春风中',
  '心花怒放处', '破涕为笑时', '喜笑颜开日', '笑容满面时', '满心欢喜处',
  '黯然神伤时', '愁眉不展日', '忧心忡忡夜', '忐忑不安心', '如坐针毡时',
  '寝食难安夜', '辗转反侧时', '百感交集处', '感慨万千时', '思绪万千夜',

  // --- 工作/职业 ---
  '一丝不苟工', '兢兢业业人', '勤勤恳恳做', '脚踏实地行', '埋头苦干时',
  '夜以继日做', '争分夺秒时', '只争朝夕日', '分秒必争时', '任劳任怨人',
  '克己奉公心', '恪尽职守责', '尽心尽力做', '竭尽全力拼', '全力以赴时',

  // --- 外貌/描写 ---
  '虎背熊腰汉', '眉清目秀人', '唇红齿白面', '明眸皓齿女', '亭亭玉立人',
  '风度翩翩君', '仪表堂堂相', '相貌堂堂人', '容光焕发面', '满面红光时',
  '精神抖擞人', '神采奕奕面', '英姿飒爽时', '气宇轩昂处', '昂首阔步行',

  // --- 天气/自然 ---
  '风和日丽天', '春暖花开时', '秋高气爽日', '万里无云天', '烈日炎炎夏',
  '寒风凛冽冬', '大雪纷飞夜', '倾盆大雨时', '电闪雷鸣夜', '风雨交加夜',
  '春回大地时', '万物复苏日', '百花齐放春', '硕果累累秋', '银装素裹冬',
  '骄阳似火夏', '冰天雪地冬', '鸟语花香春', '层林尽染秋', '白雪皑皑冬',

  // --- 音乐/艺术 ---
  '高山流水曲', '阳春白雪歌', '余音绕梁中', '铿锵有力声', '娓娓动听话',
  '字正腔圆唱', '声情并茂演', '绘声绘色说', '栩栩如生画', '惟妙惟肖描',
  '活灵活现处', '入木三分功', '炉火纯青技', '登峰造极境', '出神入化功',

  // --- 军事/策略 ---
  '运筹帷幄中', '决胜千里外', '出奇制胜法', '声东击西策', '围魏救赵计',
  '暗度陈仓谋', '釜底抽薪策', '以逸待劳法', '知己知彼后', '百战不殆时',
  '兵不厌诈术', '兵贵神速行', '先礼后兵策', '远交近攻谋', '合纵连横计',

  // --- 人生哲理 ---
  '塞翁失马焉', '知足常乐心', '无欲则刚人', '有容乃大海', '上善若水德',
  '厚德载物心', '自强不息志', '天道酬勤人', '地道酬善行', '人道酬诚心',
  '宁静以致远', '淡泊以明志', '静以修身性', '俭以养德行', '志当存高远',
  '路在脚下行', '千里之行始', '万丈高楼起', '台上一分钟', '台下十年功',

  // --- 科学/技术 ---
  '人工智能化', '大数据分析', '云计算平台', '物联网技术', '区块链应用',
  '虚拟现实境', '增强现实感', '机器学习法', '深度学习算', '自动驾驶车',
  '量子计算机', '基因编辑术', '新能源开发', '光伏发电站', '风力发电场',
  '高速铁路网', '超级计算机', '空间站建设', '探月工程组', '火星探测器',

  // --- 社会/民生 ---
  '天下为公理', '国泰民安世', '安居乐业中', '丰衣足食年', '太平盛世时',
  '风调雨顺年', '五谷丰登岁', '百业兴旺日', '政通人和处', '长治久安策',
  '安居乐业处', '国富民强时', '励精图治志', '革故鼎新时', '继往开来日',
];

// ===== 英文五字母单词 =====
export const ENGLISH_WORDS = [
  // --- 常见高频词 ---
  'about', 'above', 'abuse', 'actor', 'acute', 'admit', 'adopt', 'adult',
  'after', 'again', 'agent', 'agree', 'ahead', 'alarm', 'album', 'alert',
  'alien', 'align', 'alike', 'alive', 'alley', 'allow', 'alone', 'along',
  'alter', 'amaze', 'ample', 'angel', 'anger', 'angle', 'angry', 'anime',
  'ankle', 'annex', 'apart', 'apple', 'apply', 'arena', 'argue', 'arise',
  'armor', 'array', 'arrow', 'aside', 'asset', 'atlas', 'attic', 'avoid',
  'aware', 'awful',

  // --- 常用补充 ---
  'hello', 'world', 'house',

  // --- B ---
  'bacon', 'badge', 'badly', 'basic', 'basin', 'basis', 'batch', 'beach',
  'beard', 'beast', 'begin', 'being', 'below', 'bench', 'berry', 'black',
  'blade', 'blame', 'bland', 'blank', 'blast', 'blaze', 'bleed', 'blend',
  'bless', 'blind', 'block', 'blood', 'bloom', 'blown', 'bluff', 'blunt',
  'board', 'bonus', 'boost', 'booth', 'bound', 'brain', 'brand', 'brave',
  'bread', 'break', 'breed', 'brick', 'bride', 'brief', 'bring', 'broad',
  'broke', 'brook', 'brown', 'brush', 'buddy', 'build', 'built', 'bunch',
  'burst', 'buyer',

  // --- C ---
  'cabin', 'cable', 'camel', 'candy', 'cargo', 'carry', 'catch', 'cause',
  'cedar', 'chain', 'chair', 'chalk', 'chaos', 'charm', 'chase', 'cheap',
  'check', 'cheek', 'cheer', 'chess', 'chest', 'chief', 'child', 'china',
  'chunk', 'civic', 'civil', 'claim', 'clash', 'class', 'clean', 'clear',
  'clerk', 'click', 'cliff', 'climb', 'cling', 'clock', 'clone', 'close',
  'cloth', 'cloud', 'clown', 'coach', 'coast', 'color', 'coral', 'count',
  'court', 'cover', 'crack', 'craft', 'crane', 'crash', 'crazy', 'cream',
  'crime', 'crisp', 'cross', 'crowd', 'crown', 'crude', 'crush', 'curve',
  'cycle',

  // --- D ---
  'daily', 'dance', 'death', 'debug', 'decay', 'decor', 'decoy', 'delta',
  'demon', 'dense', 'depot', 'depth', 'derby', 'devil', 'diary', 'dirty',
  'disco', 'dodge', 'doubt', 'dough', 'draft', 'drain', 'drape', 'dream',
  'dress', 'dried', 'drift', 'drill', 'drink', 'drive', 'drone', 'drown',
  'drunk', 'dryer', 'dwarf', 'dwell',

  // --- E ---
  'eager', 'eagle', 'early', 'earth', 'eight', 'elder', 'elect', 'elite',
  'email', 'ember', 'empty', 'enemy', 'enjoy', 'enter', 'entry', 'equal',
  'equip', 'erase', 'error', 'essay', 'event', 'every', 'exact', 'exile',
  'exist', 'extra',

  // --- F ---
  'fable', 'facet', 'faint', 'fairy', 'faith', 'false', 'fancy', 'fatal',
  'fault', 'feast', 'fence', 'ferry', 'fever', 'fiber', 'field', 'fifth',
  'fifty', 'fight', 'final', 'flame', 'flash', 'fleet', 'flesh', 'float',
  'flock', 'flood', 'floor', 'flora', 'flour', 'fluid', 'flush', 'flute',
  'focus', 'force', 'forge', 'forum', 'found', 'frame', 'frank', 'fraud',
  'fresh', 'front', 'frost', 'froze', 'fruit', 'funny',

  // --- G ---
  'ghost', 'giant', 'given', 'glare', 'glass', 'gleam', 'glide', 'globe',
  'gloom', 'glory', 'gloss', 'glove', 'going', 'grace', 'grade', 'grain',
  'grand', 'grant', 'graph', 'grasp', 'grass', 'grave', 'great', 'green',
  'greet', 'grief', 'grill', 'grind', 'groan', 'groom', 'gross', 'group',
  'grove', 'growl', 'grown', 'guard', 'guess', 'guest', 'guide', 'guild',
  'guilt',

  // --- H ---
  'happy', 'harsh', 'hasty', 'haunt', 'haven', 'heart', 'heavy', 'hedge',
  'hence', 'honey', 'honor', 'horse', 'hotel', 'house', 'hover', 'human',
  'humor', 'hurry',

  // --- I ---
  'ideal', 'image', 'imply', 'inbox', 'indie', 'infer', 'inner', 'input',
  'inter', 'intro', 'irony', 'ivory',

  // --- J ---
  'jewel', 'joint', 'joker', 'judge', 'juice',

  // --- K ---
  'kayak', 'knack', 'knead', 'kneel', 'knife', 'knock',

  // --- L ---
  'label', 'lance', 'large', 'laser', 'latch', 'later', 'laugh', 'layer',
  'learn', 'lease', 'leave', 'legal', 'lemon', 'level', 'lever', 'light',
  'limit', 'linen', 'liner', 'liver', 'llama', 'lobby', 'local', 'lodge',
  'logic', 'loose', 'lotus', 'lover', 'lower', 'loyal', 'lucky', 'lunar',
  'lunch', 'lyric',

  // --- M ---
  'magic', 'major', 'maker', 'manor', 'maple', 'march', 'marry', 'marsh',
  'match', 'mayor', 'medal', 'media', 'melon', 'mercy', 'merge', 'merit',
  'metal', 'meter', 'might', 'minor', 'minus', 'model', 'money', 'month',
  'moral', 'mount', 'mourn', 'mouse', 'mouth', 'movie', 'mural', 'music',

  // --- N ---
  'naive', 'nerve', 'never', 'niche', 'night', 'noble', 'noise', 'notch',
  'noted', 'novel', 'nurse',

  // --- O ---
  'oasis', 'occur', 'ocean', 'olive', 'onset', 'opera', 'orbit', 'order',
  'other', 'outer', 'oxide', 'ozone',

  // --- P ---
  'paint', 'panel', 'panic', 'paper', 'parse', 'party', 'pasta', 'paste',
  'patch', 'pause', 'peace', 'peach', 'pearl', 'pedal', 'penny', 'perch',
  'phase', 'phone', 'photo', 'piano', 'piece', 'pilot', 'pinch', 'pitch',
  'pixel', 'pizza', 'place', 'plain', 'plane', 'plant', 'plate', 'plaza',
  'plead', 'plumb', 'plume', 'plump', 'plush', 'poach', 'point', 'polar',
  'poppy', 'porch', 'pouch', 'pound', 'power', 'press', 'price', 'pride',
  'prime', 'print', 'prior', 'prism', 'prize', 'probe', 'prone', 'proof',
  'prose', 'proud', 'prove', 'prowl', 'prude', 'prune', 'psalm', 'pulse',
  'punch', 'pupil', 'purse',

  // --- Q ---
  'queen', 'query', 'quest', 'queue', 'quick', 'quiet', 'quilt', 'quirk',
  'quota', 'quote',

  // --- R ---
  'radar', 'radio', 'raise', 'rally', 'ranch', 'range', 'rapid', 'ratio',
  'reach', 'realm', 'rebel', 'reign', 'relax', 'relay', 'renew', 'repay',
  'reply', 'rider', 'ridge', 'rifle', 'right', 'rigid', 'risky', 'rival',
  'river', 'robin', 'robot', 'rocky', 'rouge', 'rough', 'round', 'route',
  'rover', 'royal', 'rugby', 'ruler', 'rumor', 'rural',

  // --- S ---
  'salad', 'salon', 'salty', 'sandy', 'sauce', 'sauna', 'savor', 'scale',
  'scare', 'scarf', 'scary', 'scene', 'scent', 'scope', 'score', 'scout',
  'scrap', 'sedan', 'sense', 'serum', 'serve', 'setup', 'seven', 'shade',
  'shaft', 'shake', 'shame', 'shape', 'share', 'shark', 'sharp', 'shave',
  'shear', 'sheep', 'sheer', 'sheet', 'shelf', 'shell', 'shift', 'shine',
  'shirt', 'shock', 'shoot', 'shore', 'short', 'shout', 'shove', 'shrub',
  'siege', 'sight', 'since', 'sixth', 'sixty', 'sized', 'skate', 'skill',
  'skull', 'slate', 'slave', 'sleep', 'sleet', 'slice', 'slide', 'slime',
  'slope', 'small', 'smart', 'smell', 'smile', 'smoke', 'snack', 'snake',
  'snare', 'sneak', 'snore', 'solar', 'solid', 'solve', 'sonic', 'sorry',
  'south', 'space', 'spare', 'spark', 'spawn', 'speak', 'spear', 'speed',
  'spell', 'spend', 'spice', 'spill', 'spine', 'spite', 'split', 'spoke',
  'spoon', 'sport', 'spray', 'squad', 'stack', 'staff', 'stage', 'stain',
  'stair', 'stake', 'stale', 'stalk', 'stall', 'stamp', 'stand', 'stare',
  'stark', 'start', 'state', 'stays', 'steak', 'steal', 'steam', 'steel',
  'steep', 'steer', 'stern', 'stick', 'stiff', 'still', 'sting', 'stock',
  'stomp', 'stone', 'stood', 'stool', 'stoop', 'store', 'storm', 'story',
  'stout', 'stove', 'strap', 'straw', 'stray', 'strip', 'stuck', 'study',
  'stuff', 'stump', 'stung', 'stunk', 'style', 'sugar', 'suite', 'sunny',
  'super', 'surge', 'swamp', 'swarm', 'swear', 'sweat', 'sweep', 'sweet',
  'swept', 'swift', 'swing', 'swirl', 'swoop', 'sword', 'swore', 'sworn',
  'swung', 'syrup',

  // --- T ---
  'table', 'taste', 'teach', 'tempo', 'tense', 'tenth', 'theft', 'theme',
  'there', 'thick', 'thief', 'thing', 'think', 'third', 'thorn', 'those',
  'three', 'threw', 'throw', 'thumb', 'tiger', 'tight', 'timer', 'tired',
  'title', 'toast', 'today', 'token', 'topic', 'torch', 'total', 'touch',
  'tough', 'towel', 'tower', 'toxic', 'trace', 'track', 'trade', 'trail',
  'train', 'trait', 'trash', 'tread', 'treat', 'trend', 'trial', 'tribe',
  'trick', 'troop', 'trout', 'truck', 'truly', 'trunk', 'trust', 'truth',
  'tumor', 'twist',

  // --- U ---
  'ultra', 'uncle', 'under', 'union', 'unite', 'unity', 'until', 'upper',
  'upset', 'urban', 'usage', 'usual', 'utter',

  // --- V ---
  'vague', 'valid', 'value', 'valve', 'vapor', 'vault', 'venue', 'verge',
  'verse', 'vigor', 'viral', 'virus', 'visit', 'vista', 'vital', 'vivid',
  'vocal', 'vodka', 'voice', 'voter', 'vouch', 'vowel',

  // --- W ---
  'wafer', 'wagon', 'watch', 'water', 'weary', 'weave', 'wedge', 'weigh',
  'weird', 'whale', 'wheat', 'wheel', 'where', 'which', 'while', 'whine',
  'whirl', 'white', 'whole', 'whose', 'widow', 'width', 'witch', 'woman',
  'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'wrath',
  'wreck', 'wrist', 'write', 'wrong', 'wrote',

  // --- Y/Z ---
  'yacht', 'yearn', 'yield', 'young', 'youth', 'zebra',

  // --- 更多补充词汇 ---
  'abort', 'adore', 'agile', 'aisle', 'amber', 'amble', 'ample', 'angel',
  'ankle', 'aroma', 'atone', 'badge', 'baron', 'batch',
  'beads', 'belle', 'birch', 'bliss', 'blond', 'blunt', 'board', 'bough',
  'brace', 'brash', 'brisk', 'broil', 'brood', 'brush', 'bulge', 'bunch',
  'cabin', 'camel', 'cargo', 'cedar', 'chord', 'cleft', 'clerk', 'clink',
  'cluck', 'clung', 'crane', 'crawl', 'creed', 'creep', 'crest', 'crimp',
  'crisp', 'curse', 'daisy', 'dealt', 'decay', 'decoy', 'delve', 'depth',
  'digit', 'dodge', 'donor', 'doubt', 'douse', 'drape', 'drone', 'drool',
  'drove', 'dryer', 'duvet', 'eager', 'easel', 'edict', 'eerie', 'elbow',
  'ember', 'emcee', 'enact', 'endow', 'envoy', 'epoch', 'erode', 'evict',
  'exact', 'exalt', 'excel', 'exert', 'exile', 'exist', 'expat', 'fable',
  'facet', 'feast', 'feign', 'felon', 'feral', 'fiber', 'filth', 'finch',
  'flair', 'flask', 'fling', 'flint', 'flora', 'floss', 'fluke', 'foyer',
  'frail', 'frill', 'froth', 'fudge', 'fully', 'fungi', 'gaffe', 'gauge',
  'gavel', 'giddy', 'girth', 'given', 'glade', 'gland', 'gleam', 'glean',
  'glint', 'gloat', 'globe', 'gloom', 'gloss', 'gnome', 'going', 'gourd',
  'graft', 'grand', 'grape', 'grate', 'greed', 'grief', 'grill', 'grind',
  'gripe', 'grist', 'groan', 'groom', 'grout', 'grove', 'growl', 'gruel',
  'guava', 'guile', 'guise', 'gulch', 'gusto', 'haven', 'hazel', 'heave',
  'hedge', 'hefty', 'heron', 'hitch', 'hoard', 'homer', 'honey', 'hover',
  'humus', 'hutch', 'hyena', 'imply', 'incur', 'index', 'inept',
  'inert', 'ingot', 'inlet', 'input', 'irony', 'ivory', 'jaunt', 'jazzy',
  'jeans', 'jenny', 'jiffy', 'joker', 'jolly', 'joust', 'judge', 'juice',
  'juicy', 'jumbo', 'kayak', 'kebab', 'khaki', 'knack', 'knead', 'kneel',
  'knelt', 'knoll', 'label', 'lance', 'lapse', 'latch', 'laugh', 'layer',
  'leach', 'leapt', 'ledge', 'lefty', 'legal', 'leggy', 'lemon', 'level',
  'lever', 'liken', 'lilac', 'limbo', 'linen', 'liner', 'lingo', 'llama',
  'lofty', 'lorry', 'lotus', 'lover', 'lower', 'loyal', 'lucid', 'lunar',
  'lunch', 'lunge', 'lyric', 'macro', 'magic', 'major', 'manor', 'maple',
  'march', 'marsh', 'match', 'mayor', 'medal', 'melon', 'mercy', 'merge',
  'merit', 'metal', 'meter', 'mirth', 'mogul', 'moist', 'molar', 'moldy',
  'moose', 'moral', 'mound', 'mourn', 'mouse', 'mouth', 'mover', 'mucus',
  'muddy', 'mural', 'murky', 'mushy', 'music', 'musty', 'naive', 'nerve',
  'niece', 'noble', 'noise', 'noisy', 'north', 'notch', 'noted', 'novel',
  'nudge', 'nurse', 'oasis', 'ocean', 'olive', 'onset', 'opera', 'orbit',
  'order', 'other', 'outer', 'outdo', 'oxide', 'ozone', 'paddy', 'pagan',
  'paint', 'panel', 'panic', 'paper', 'parse', 'pasta', 'paste', 'patch',
  'pause', 'peace', 'peach', 'pearl', 'pedal', 'penal', 'penny', 'perch',
  'peril', 'petal', 'phase', 'phone', 'photo', 'piano', 'piece', 'pilot',
  'pinch', 'pitch', 'pixel', 'pizza', 'place', 'plain', 'plane', 'plant',
  'plate', 'plaza', 'plead', 'plumb', 'plume', 'plump', 'plush', 'poach',
  'point', 'polar', 'poppy', 'porch', 'pouch', 'pound', 'power', 'press',
  'price', 'pride', 'prime', 'print', 'prior', 'prism', 'prize', 'probe',
  'prone', 'proof', 'prose', 'proud', 'prove', 'prowl', 'prude', 'prune',
  'psalm', 'pulse', 'punch', 'pupil', 'purse', 'qualm', 'quart', 'queen',
  'query', 'quest', 'queue', 'quick', 'quiet', 'quilt', 'quirk', 'quota',
  'quote', 'rabbi', 'radar', 'radio', 'raise', 'rally', 'ranch', 'range',
  'rapid', 'ratio', 'reach', 'realm', 'rebel', 'reign', 'relax', 'relay',
  'remit', 'renew', 'repay', 'reply', 'rider', 'ridge', 'rifle', 'right',
  'rigid', 'risky', 'rival', 'river', 'robin', 'robot', 'rocky', 'rogue',
  'rouge', 'rough', 'round', 'route', 'rover', 'royal', 'rugby', 'ruler',
  'rumor', 'rural', 'saint', 'salad', 'salon', 'salty', 'sandy', 'sauce',
  'sauna', 'savor', 'scale', 'scare', 'scarf', 'scary', 'scene', 'scent',
  'scope', 'score', 'scout', 'scrap', 'sedan', 'sense', 'serum', 'serve',
  'setup', 'seven', 'shade', 'shaft', 'shake', 'shame', 'shape', 'share',
  'shark', 'sharp', 'shave', 'shear', 'sheep', 'sheer', 'sheet', 'shelf',
  'shell', 'shift', 'shine', 'shirt', 'shock', 'shoot', 'shore', 'short',
  'shout', 'shove', 'shrub', 'siege', 'sight', 'since', 'sixth', 'sixty',
  'sized', 'skate', 'skill', 'skull', 'slate', 'slave', 'sleep', 'sleet',
  'slice', 'slide', 'slime', 'slope', 'small', 'smart', 'smell', 'smile',
  'smoke', 'snack', 'snake', 'snare', 'sneak', 'snore', 'solar', 'solid',
  'solve', 'sonic', 'sorry', 'south', 'space', 'spare', 'spark', 'spawn',
  'speak', 'spear', 'speed', 'spell', 'spend', 'spice', 'spill', 'spine',
  'spite', 'split', 'spoke', 'spoon', 'sport', 'spray', 'squad', 'stack',
  'staff', 'stage', 'stain', 'stair', 'stake', 'stale', 'stalk', 'stall',
  'stamp', 'stand', 'stare', 'stark', 'start', 'state', 'stays', 'steak',
  'steal', 'steam', 'steel', 'steep', 'steer', 'stern', 'stick', 'stiff',
  'still', 'sting', 'stock', 'stomp', 'stone', 'stood', 'stool', 'stoop',
  'store', 'storm', 'story', 'stout', 'stove', 'strap', 'straw', 'stray',
  'strip', 'stuck', 'study', 'stuff', 'stump', 'stung', 'stunk', 'style',
  'sugar', 'suite', 'sunny', 'super', 'surge', 'swamp', 'swarm', 'swear',
  'sweat', 'sweep', 'sweet', 'swept', 'swift', 'swing', 'swirl', 'swoop',
  'sword', 'swore', 'sworn', 'swung', 'syrup', 'taint', 'talon', 'taper',
  'taste', 'teach', 'tempo', 'tense', 'tenth', 'theft', 'theme', 'there',
  'thick', 'thief', 'thing', 'think', 'third', 'thorn', 'those', 'three',
  'threw', 'throw', 'thumb', 'tiger', 'tight', 'timer', 'tired', 'title',
  'toast', 'today', 'token', 'topic', 'torch', 'total', 'touch', 'tough',
  'towel', 'tower', 'toxic', 'trace', 'track', 'trade', 'trail', 'train',
  'trait', 'trash', 'tread', 'treat', 'trend', 'trial', 'tribe', 'trick',
  'troop', 'trout', 'truck', 'truly', 'trunk', 'trust', 'truth', 'tumor',
  'twist', 'ultra', 'uncle', 'under', 'union', 'unite', 'unity', 'until',
  'upper', 'upset', 'urban', 'usage', 'usual', 'utter', 'vague', 'valid',
  'value', 'valve', 'vapor', 'vault', 'venue', 'verge', 'verse', 'vigor',
  'viral', 'virus', 'visit', 'vista', 'vital', 'vivid', 'vocal', 'vodka',
  'voice', 'voter', 'vouch', 'vowel', 'wafer', 'wagon', 'watch', 'water',
  'weary', 'weave', 'wedge', 'weigh', 'weird', 'whale', 'wheat', 'wheel',
  'where', 'which', 'while', 'whine', 'whirl', 'white', 'whole', 'whose',
  'widow', 'width', 'witch', 'woman', 'world', 'worry', 'worse', 'worst',
  'worth', 'would', 'wound', 'wrath', 'wreck', 'wrist', 'write', 'wrong',
  'wrote', 'yacht', 'yearn', 'yield', 'young', 'youth', 'zebra', 'zonal',
];

/**
 * 根据模式获取词库
 * @param {string} mode - 'chinese' 或 'english'
 * @returns {string[]}
 */
export function getWordList(mode) {
  return mode === 'chinese' ? CHINESE_WORDS : ENGLISH_WORDS;
}

/**
 * 验证猜测是否在词库中
 * @param {string} guess - 猜测的词
 * @param {string} mode - 游戏模式
 * @returns {boolean}
 */
export function isValidWord(guess, mode) {
  const list = getWordList(mode);
  return list.includes(guess.toLowerCase());
}
