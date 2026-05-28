// ============================================
// items.js - 道具系统
// ============================================

import { WEAPONS, ARMORS, RINGS, CONSUMABLES, TILE } from './config.js';

// 合并所有物品数据
const ALL_ITEMS = { ...WEAPONS, ...ARMORS, ...RINGS, ...CONSUMABLES };

// 生成道具实例
export function createItem(id, x, y) {
  const template = ALL_ITEMS[id];
  if (!template) return null;
  return {
    id,
    ...template,
    x, y,
    identified: template.tier <= 2, // 低级物品默认已鉴定
  };
}

// 按层级获取可生成的物品ID列表
function getItemsForTier(tier) {
  const items = [];
  for (const [id, data] of Object.entries(ALL_ITEMS)) {
    if (data.tier <= tier) {
      items.push(id);
    }
  }
  return items;
}

// 随机生成地牢物品
export function generateFloorItems(rooms, count, level, stairsPos) {
  const items = [];
  const tier = Math.min(level, 4);
  const pool = getItemsForTier(tier);

  // 确保每层至少有1个治疗药水
  const guaranteedItems = ['hp_potion_small'];
  if (level >= 3) guaranteedItems.push('hp_potion_medium');

  const usedPositions = new Set();
  usedPositions.add(`${stairsPos.x},${stairsPos.y}`);

  // 放置保证物品
  for (const id of guaranteedItems) {
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const pos = getRandomRoomPos(room, usedPositions);
    if (pos) {
      items.push(createItem(id, pos.x, pos.y));
      usedPositions.add(`${pos.x},${pos.y}`);
    }
  }

  // 随机放置其余物品
  const remaining = count - items.length;
  for (let i = 0; i < remaining; i++) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const pos = getRandomRoomPos(room, usedPositions);
    if (pos) {
      const item = createItem(id, pos.x, pos.y);
      if (item) {
        items.push(item);
        usedPositions.add(`${pos.x},${pos.y}`);
      }
    }
  }

  return items;
}

function getRandomRoomPos(room, used) {
  for (let attempts = 0; attempts < 20; attempts++) {
    const x = Math.floor(Math.random() * (room.w - 2)) + room.x + 1;
    const y = Math.floor(Math.random() * (room.h - 2)) + room.y + 1;
    if (!used.has(`${x},${y}`)) {
      return { x, y };
    }
  }
  return null;
}

// 使用消耗品
export function useConsumable(item, player, enemies, map, log) {
  const data = CONSUMABLES[item.id];
  if (!data) return false;

  // 回血药水
  if (data.heal) {
    const healed = Math.min(data.heal, player.maxHp - player.hp);
    player.hp += healed;
    log(`使用${item.name}，恢复了${healed}点生命！`, 'heal');
    return true;
  }

  // 回蓝药水
  if (data.mana) {
    const restored = Math.min(data.mana, player.maxMp - player.mp);
    player.mp += restored;
    log(`使用${item.name}，恢复了${restored}点魔力！`, 'mana');
    return true;
  }

  // 力量药水
  if (data.buffStr) {
    player.buffs.push({ stat: 'str', value: data.buffStr, duration: data.buffDuration || 30 });
    player.str += data.buffStr;
    log(`使用${item.name}，力量+${data.buffStr}！`, 'buff');
    return true;
  }

  // 敏捷药水
  if (data.buffAgi) {
    player.buffs.push({ stat: 'agi', value: data.buffAgi, duration: data.buffDuration || 30 });
    player.agi += data.buffAgi;
    log(`使用${item.name}，敏捷+${data.buffAgi}！`, 'buff');
    return true;
  }

  // 卷轴效果
  if (data.effect === 'teleport') {
    log('使用传送卷轴，你被传送了！', 'magic');
    return 'teleport';
  }

  if (data.effect === 'identify') {
    log('使用鉴定卷轴！', 'magic');
    return 'identify';
  }

  if (data.effect === 'fireball') {
    log('使用火球卷轴！周围的敌人受到20点火焰伤害！', 'magic');
    return 'fireball';
  }

  if (data.effect === 'mapping') {
    log('使用地图卷轴，当前层地图已显示！', 'magic');
    return 'mapping';
  }

  if (data.effect === 'light') {
    log('使用照明卷轴，视野扩大！', 'magic');
    return 'light';
  }

  if (data.effect === 'curePoison') {
    player.poison = 0;
    log('使用解毒药，中毒状态已解除！', 'heal');
    return true;
  }

  return false;
}

// 获取物品描述
export function getItemDesc(item) {
  if (!item.identified) return '未鉴定的物品';
  return item.desc || '';
}

// 获取物品属性描述
export function getItemStats(item) {
  const stats = [];
  if (item.atk) stats.push(`攻击 +${item.atk}`);
  if (item.def) stats.push(`防御 +${item.def}`);
  if (item.range && item.range > 1) stats.push(`射程 ${item.range}`);
  if (item.str) stats.push(`力量 +${item.str}`);
  if (item.agi) stats.push(`敏捷 +${item.agi}`);
  if (item.con) stats.push(`体质 +${item.con}`);
  if (item.int) stats.push(`智力 +${item.int}`);
  if (item.heal) stats.push(`恢复 ${item.heal} HP`);
  if (item.mana) stats.push(`恢复 ${item.mana} MP`);
  return stats;
}
