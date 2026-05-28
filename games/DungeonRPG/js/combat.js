// ============================================
// combat.js - 回合制战斗系统
// ============================================

import { Sound } from './sound.js';
import { damageEnemy, updateEnemy } from './enemy.js';
import { TILE } from './config.js';

// 玩家尝试移动/攻击
export function playerMove(player, dx, dy, map, enemies, items, log) {
  const nx = player.x + dx;
  const ny = player.y + dy;

  // 检查是否有敌人
  const enemy = enemies.find(e => e.alive && e.x === nx && e.y === ny);
  if (enemy) {
    // 攻击敌人
    playerAttack(player, enemy, log);
    return true; // 消耗回合
  }

  // 检查墙壁
  if (!isWalkable(map, nx, ny)) {
    return false; // 不消耗回合
  }

  // 移动
  player.x = nx;
  player.y = ny;
  player.steps++;
  Sound.step();

  // 检查道具
  const itemOnGround = items.find(i => i.x === nx && i.y === ny);
  if (itemOnGround) {
    if (player.inventory.length < player.maxInventory) {
      // 自动拾取
      const idx = items.indexOf(itemOnGround);
      items.splice(idx, 1);
      player.inventory.push(itemOnGround);
      Sound.pickup();
      log(`拾取了${itemOnGround.name}`, 'pickup');
    } else {
      log('背包已满，无法拾取！', 'info');
    }
  }

  return true; // 消耗回合
}

// 玩家攻击
function playerAttack(player, enemy, log) {
  // 计算伤害
  let damage = player.atk + Math.floor(Math.random() * 3);
  // 敏捷影响暴击
  const critChance = Math.min(0.3, player.agi * 0.015);
  const isCrit = Math.random() < critChance;
  if (isCrit) {
    damage = Math.floor(damage * 1.8);
  }

  const actualDmg = damageEnemy(enemy, damage, log);
  Sound.attack();

  if (isCrit) {
    log(`暴击！你对${enemy.name}造成${actualDmg}点伤害！(${enemy.hp}/${enemy.maxHp})`, 'crit');
  } else {
    log(`你攻击了${enemy.name}，造成${actualDmg}点伤害！(${enemy.hp}/${enemy.maxHp})`, 'attack');
  }

  if (!enemy.alive) {
    Sound.enemyDeath();
    player.gainXP(enemy.xp, log);
    player.kills++;
  }
}

// 远程攻击 (弓/法杖)
export function playerRangedAttack(player, targetX, targetY, enemies, log) {
  const weapon = player.equipment.weapon;
  if (!weapon || !weapon.range || weapon.range <= 1) {
    log('需要远程武器才能远程攻击！', 'info');
    return false;
  }

  const dist = Math.abs(targetX - player.x) + Math.abs(targetY - player.y);
  if (dist > weapon.range) {
    log(`目标超出射程！(最大${weapon.range})`, 'info');
    return false;
  }

  const enemy = enemies.find(e => e.alive && e.x === targetX && e.y === targetY);
  if (!enemy) {
    log('那里没有敌人', 'info');
    return false;
  }

  let damage = player.atk + Math.floor(Math.random() * 3);
  const critChance = Math.min(0.25, player.agi * 0.012);
  const isCrit = Math.random() < critChance;
  if (isCrit) damage = Math.floor(damage * 1.8);

  const actualDmg = damageEnemy(enemy, damage, log);
  Sound.attack();

  if (isCrit) {
    log(`远程暴击！对${enemy.name}造成${actualDmg}点伤害！`, 'crit');
  } else {
    log(`远程攻击${enemy.name}，造成${actualDmg}点伤害！`, 'attack');
  }

  if (!enemy.alive) {
    Sound.enemyDeath();
    player.gainXP(enemy.xp, log);
    player.kills++;
  }

  return true;
}

// 执行回合
export function processTurn(player, map, enemies, items, log) {
  // 更新玩家buff
  player.updateBuffs(log);
  player.turn++;

  // 怪物行动
  for (const enemy of enemies) {
    if (enemy.alive) {
      updateEnemy(enemy, player, map, enemies, log);
    }
  }

  // 检查玩家是否死亡
  if (!player.alive) {
    Sound.death();
    return 'dead';
  }

  // 检查是否在楼梯上
  if (map[player.y][player.x] === TILE.STAIRS_DOWN) {
    return 'stairs_down';
  }

  return 'continue';
}

// 检查是否可通行
function isWalkable(map, x, y) {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;
  return map[y][x] !== TILE.WALL;
}
