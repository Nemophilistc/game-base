// endings.js - 结局系统（多结局条件判定）

export const ENDINGS = {
  dark_lord: {
    id: 'dark_lord',
    title: '暗影之王',
    description: '你戴上了诅咒王冠，成为了新的暗影之王。你的灵魂被吞噬，诅咒将永远延续。',
    type: 'bad', // bad / neutral / good / true
    condition: (char) => char.currentScene === 'ending_dark_lord',
  },
  seal: {
    id: 'seal',
    title: '灵魂解放者',
    description: '你用三件圣物封印了王冠，解放了所有被困的灵魂。城堡的诅咒终于被解除。',
    type: 'good',
    condition: (char) => char.currentScene === 'ending_seal',
  },
  destroy: {
    id: 'destroy',
    title: '毁灭者',
    description: '你用蛮力摧毁了王冠，但也摧毁了整座城堡。诅咒被永远埋葬在废墟之下。',
    type: 'neutral',
    condition: (char) => char.currentScene === 'ending_destroy',
  },
  escape: {
    id: 'escape',
    title: '幸存者',
    description: '你选择了活着离开诅咒古堡。虽然没有终结诅咒，但你保住了自己的性命。',
    type: 'neutral',
    condition: (char) => char.currentScene === 'ending_escape',
  },
  hero: {
    id: 'hero',
    title: '传奇英雄',
    description: '你不仅封印了王冠，还获得了城堡的宝藏。你的名字将被永远铭记。',
    type: 'true',
    condition: (char) =>
      char.currentScene === 'ending_seal' &&
      char.hasFlag('ghost_quest') &&
      char.hasFlag('butler_quest'),
  },
  curse: {
    id: 'curse',
    title: '守护者',
    description: '你控制了王冠的力量，成为了城堡新的守护者。你的命运与城堡永远绑定。',
    type: 'neutral',
    condition: (char) =>
      char.currentScene === 'ending_dark_lord' &&
      char.getStat('charisma') >= 7,
  },
  sacrifice: {
    id: 'sacrifice',
    title: '牺牲者',
    description: '你用自己的生命力净化了王冠，成为了永恒的传说。你的牺牲拯救了所有人。',
    type: 'good',
    condition: (char) =>
      char.currentScene === 'ending_seal' &&
      char.hasFlag('spoke_to_ghost') &&
      char.hp <= 20,
  },
  fairy: {
    id: 'fairy',
    title: '精灵的救赎',
    description: '你之前释放的精灵在你最危急的时刻出现，将你从诅咒中解救出来。',
    type: 'good',
    condition: (char) =>
      char.currentScene === 'ending_dark_lord' &&
      char.hasFlag('freed_fairy'),
  },
  death: {
    id: 'death',
    title: '诅咒的牺牲品',
    description: '你在冒险途中失去了生命，成为了诅咒古堡的又一个牺牲品。',
    type: 'bad',
    condition: (char) => char.hp <= 0,
  },
};

// 根据当前状态判断结局
export function evaluateEnding(character) {
  // 优先检查特殊结局
  if (character.hp <= 0) return ENDINGS.death;

  // 检查场景结局
  for (const ending of Object.values(ENDINGS)) {
    if (ending.condition(character)) {
      return ending;
    }
  }
  return null;
}

// 获取所有已解锁的结局
export function getUnlockedEndings() {
  try {
    const data = JSON.parse(localStorage.getItem('text_adventure_endings') || '[]');
    return data;
  } catch {
    return [];
  }
}

// 保存已解锁的结局
export function unlockEnding(endingId) {
  const unlocked = getUnlockedEndings();
  if (!unlocked.includes(endingId)) {
    unlocked.push(endingId);
    localStorage.setItem('text_adventure_endings', JSON.stringify(unlocked));
  }
}

// 获取结局完成度
export function getCompletionRate() {
  const unlocked = getUnlockedEndings();
  const total = Object.keys(ENDINGS).length;
  return { unlocked: unlocked.length, total, rate: Math.round((unlocked.length / total) * 100) };
}
