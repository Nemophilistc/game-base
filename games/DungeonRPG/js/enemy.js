// ============================================
// enemy.js - 怪物系统
// ============================================

import { MONSTERS, TILE } from './config.js';
import { isWalkable, getRandomRoomPos } from './dungeon.js';

export function createEnemy(id, x, y, level) {
  const template = MONSTERS[id];
  if (!template) return null;

  // 根据地牢层级调整怪物属性
  const levelBonus = Math.max(0, level - template.tier);

  return {
    id,
    name: template.name,
    char: template.char,
    color: template.color,
    x, y,
    hp: template.hp + levelBonus * 3,
    maxHp: template.hp + levelBonus * 3,
    atk: template.atk + levelBonus,
    def: template.def + Math.floor(levelBonus * 0.5),
    xp: template.xp + levelBonus * 5,
    ai: template.ai,
    tier: template.tier,
    range: template.range || 1,
    speed: template.speed || 1,
    poison: template.poison || 0,
    phase: template.phase || false,
    boss: template.boss || false,
    desc: template.desc,

    // AI状态
    state: 'idle', // idle, patrol, chase, attack, flee
    patrolDir: Math.floor(Math.random() * 4),
    patrolSteps: 0,
    alertRange: 6,
    lastSeenPlayerX: -1,
    lastSeenPlayerY: -1,
    summonCooldown: 0,
    alive: true,
    stunned: 0,
  };
}

// 生成每层怪物
export function generateEnemies(rooms, count, level, playerStart, stairsPos) {
  const enemies = [];
  const tier = Math.min(level, 5);

  // 按层级选择怪物池
  const pool = [];
  for (const [id, data] of Object.entries(MONSTERS)) {
    if (data.tier <= tier && !data.boss) {
      pool.push(id);
    }
  }

  if (pool.length === 0) return enemies;

  const usedPositions = new Set();
  usedPositions.add(`${playerStart.x},${playerStart.y}`);
  usedPositions.add(`${stairsPos.x},${stairsPos.y}`);

  for (let i = 0; i < count; i++) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    const room = rooms[Math.floor(Math.random() * rooms.length)];
    const pos = getRandomRoomPos(room, usedPositions);
    if (pos) {
      const enemy = createEnemy(id, pos.x, pos.y, level);
      if (enemy) {
        enemies.push(enemy);
        usedPositions.add(`${pos.x},${pos.y}`);
      }
    }
  }

  // 第5层生成Boss
  if (level === 5) {
    const bossRoom = rooms[rooms.length - 1];
    const boss = createEnemy('dragon', bossRoom.cx, bossRoom.cy, 5);
    if (boss) {
      enemies.push(boss);
    }
  }

  return enemies;
}

// 怪物AI行为
export function updateEnemy(enemy, player, map, enemies, log) {
  if (!enemy.alive || enemy.stunned > 0) {
    if (enemy.stunned > 0) enemy.stunned--;
    return;
  }

  const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
  const canSee = dist <= enemy.alertRange && !player.isStealthed();

  // 更新状态
  if (canSee) {
    enemy.lastSeenPlayerX = player.x;
    enemy.lastSeenPlayerY = player.y;
    if (dist <= enemy.range) {
      enemy.state = 'attack';
    } else {
      enemy.state = 'chase';
    }
  } else if (enemy.state === 'chase' && enemy.lastSeenPlayerX >= 0) {
    // 追到最后看到玩家的位置
    const toLast = Math.abs(enemy.x - enemy.lastSeenPlayerX) + Math.abs(enemy.y - enemy.lastSeenPlayerY);
    if (toLast <= 1) {
      enemy.state = 'patrol';
      enemy.lastSeenPlayerX = -1;
    }
  }

  // 执行行为
  switch (enemy.ai) {
    case 'wander':
      aiWander(enemy, player, map, enemies, dist, log);
      break;
    case 'chase':
      aiChase(enemy, player, map, enemies, dist, log);
      break;
    case 'patrol':
      aiPatrol(enemy, player, map, enemies, dist, log);
      break;
    case 'guard':
      aiGuard(enemy, player, map, enemies, dist, log);
      break;
    case 'ranged':
      aiRanged(enemy, player, map, enemies, dist, log);
      break;
    case 'summoner':
      aiSummoner(enemy, player, map, enemies, dist, log);
      break;
    case 'boss':
      aiBoss(enemy, player, map, enemies, dist, log);
      break;
    default:
      aiWander(enemy, player, map, enemies, dist, log);
  }
}

// 随机移动AI
function aiWander(enemy, player, map, enemies, dist, log) {
  if (enemy.state === 'attack') {
    attackPlayer(enemy, player, log);
    return;
  }
  if (enemy.state === 'chase') {
    moveToward(enemy, player.x, player.y, map, enemies);
    return;
  }
  // 随机走动
  if (Math.random() < 0.3) {
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const dir = dirs[Math.floor(Math.random() * 4)];
    tryMove(enemy, enemy.x + dir[0], enemy.y + dir[1], map, enemies);
  }
}

// 追击AI
function aiChase(enemy, player, map, enemies, dist, log) {
  if (enemy.state === 'attack' || dist <= enemy.range) {
    attackPlayer(enemy, player, log);
    return;
  }
  const tx = enemy.lastSeenPlayerX >= 0 ? enemy.lastSeenPlayerX : player.x;
  const ty = enemy.lastSeenPlayerY >= 0 ? enemy.lastSeenPlayerY : player.y;
  moveToward(enemy, tx, ty, map, enemies);
}

// 巡逻AI
function aiPatrol(enemy, player, map, enemies, dist, log) {
  if (enemy.state === 'attack') {
    attackPlayer(enemy, player, log);
    return;
  }
  if (enemy.state === 'chase') {
    moveToward(enemy, player.x, player.y, map, enemies);
    return;
  }
  // 巡逻移动
  enemy.patrolSteps++;
  if (enemy.patrolSteps >= 4) {
    enemy.patrolDir = (enemy.patrolDir + 1) % 4;
    enemy.patrolSteps = 0;
  }
  const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
  const dir = dirs[enemy.patrolDir];
  if (!tryMove(enemy, enemy.x + dir[0], enemy.y + dir[1], map, enemies)) {
    enemy.patrolDir = (enemy.patrolDir + 1) % 4;
    enemy.patrolSteps = 0;
  }
}

// 守卫AI (不离开太远)
function aiGuard(enemy, player, map, enemies, dist, log) {
  if (enemy.state === 'attack') {
    attackPlayer(enemy, player, log);
    return;
  }
  if (enemy.state === 'chase') {
    moveToward(enemy, player.x, player.y, map, enemies);
    return;
  }
  // 小范围走动
  if (Math.random() < 0.2) {
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const dir = dirs[Math.floor(Math.random() * 4)];
    tryMove(enemy, enemy.x + dir[0], enemy.y + dir[1], map, enemies);
  }
}

// 远程AI
function aiRanged(enemy, player, map, enemies, dist, log) {
  if (dist <= enemy.range && dist > 1) {
    // 远程攻击
    attackPlayer(enemy, player, log, true);
    return;
  }
  if (dist <= 1) {
    // 近距离，后退
    moveAway(enemy, player.x, player.y, map, enemies);
    return;
  }
  if (enemy.state === 'chase') {
    moveToward(enemy, player.x, player.y, map, enemies);
    return;
  }
  // 随机走动
  if (Math.random() < 0.3) {
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    const dir = dirs[Math.floor(Math.random() * 4)];
    tryMove(enemy, enemy.x + dir[0], enemy.y + dir[1], map, enemies);
  }
}

// 召唤AI
function aiSummoner(enemy, player, map, enemies, dist, log) {
  if (enemy.summonCooldown <= 0 && enemies.filter(e => e.alive && !e.boss).length < 15) {
    // 召唤骷髅
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    for (const dir of dirs) {
      const nx = enemy.x + dir[0];
      const ny = enemy.y + dir[1];
      if (isWalkable(map, nx, ny) && !enemies.some(e => e.x === nx && e.y === ny && e.alive)) {
        const summon = createEnemy('skeleton', nx, ny, enemy.tier);
        if (summon) {
          enemies.push(summon);
          enemy.summonCooldown = 8;
          if (log) log(`${enemy.name}召唤了一个${summon.name}！`, 'enemy');
          return;
        }
      }
    }
  }
  if (enemy.summonCooldown > 0) enemy.summonCooldown--;

  // 其余行为类似远程
  aiRanged(enemy, player, map, enemies, dist, log);
}

// Boss AI
function aiBoss(enemy, player, map, enemies, dist, log) {
  if (enemy.summonCooldown <= 0 && enemies.filter(e => e.alive && !e.boss).length < 10) {
    // 召唤恶魔
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0], [-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (const dir of dirs) {
      const nx = enemy.x + dir[0];
      const ny = enemy.y + dir[1];
      if (isWalkable(map, nx, ny) && !enemies.some(e => e.x === nx && e.y === ny && e.alive)) {
        const summon = createEnemy('demon', nx, ny, 4);
        if (summon) {
          enemies.push(summon);
          enemy.summonCooldown = 12;
          if (log) log(`${enemy.name}召唤了一个${summon.name}！`, 'enemy');
          break;
        }
      }
    }
  }
  if (enemy.summonCooldown > 0) enemy.summonCooldown--;

  // 远程攻击
  if (dist <= enemy.range && dist > 1) {
    attackPlayer(enemy, player, log, true);
    return;
  }
  // 近战攻击
  if (dist <= 1) {
    attackPlayer(enemy, player, log);
    return;
  }
  // 追击
  moveToward(enemy, player.x, player.y, map, enemies);
}

// 怪物攻击玩家
function attackPlayer(enemy, player, log, ranged = false) {
  const damage = enemy.atk + Math.floor(Math.random() * 3);
  const actualDmg = player.takeDamage(damage, log);
  if (log) {
    const rangeStr = ranged ? '(远程)' : '';
    log(`${enemy.name}${rangeStr}攻击了你，造成${actualDmg}点伤害！(${player.hp}/${player.maxHp})`, 'enemy');
  }
  // 中毒效果
  if (enemy.poison > 0 && Math.random() < 0.3) {
    player.poison = enemy.poison;
    if (log) log(`你中毒了！`, 'enemy');
  }
}

// 向目标移动
function moveToward(enemy, tx, ty, map, enemies) {
  const dx = tx - enemy.x;
  const dy = ty - enemy.y;

  // 优先走距离更远的轴
  let moveX = 0, moveY = 0;
  if (Math.abs(dx) > Math.abs(dy)) {
    moveX = dx > 0 ? 1 : -1;
  } else if (dy !== 0) {
    moveY = dy > 0 ? 1 : -1;
  } else if (dx !== 0) {
    moveX = dx > 0 ? 1 : -1;
  }

  if (moveX !== 0 || moveY !== 0) {
    if (!tryMove(enemy, enemy.x + moveX, enemy.y + moveY, map, enemies)) {
      // 尝试另一个方向
      if (moveX !== 0 && dy !== 0) {
        tryMove(enemy, enemy.x, enemy.y + (dy > 0 ? 1 : -1), map, enemies);
      } else if (moveY !== 0 && dx !== 0) {
        tryMove(enemy, enemy.x + (dx > 0 ? 1 : -1), enemy.y, map, enemies);
      }
    }
  }
}

// 远离目标
function moveAway(enemy, tx, ty, map, enemies) {
  const dx = enemy.x - tx;
  const dy = enemy.y - ty;
  let moveX = dx > 0 ? 1 : dx < 0 ? -1 : 0;
  let moveY = dy > 0 ? 1 : dy < 0 ? -1 : 0;

  if (!tryMove(enemy, enemy.x + moveX, enemy.y + moveY, map, enemies)) {
    // 尝试侧移
    tryMove(enemy, enemy.x + moveY, enemy.y - moveX, map, enemies);
  }
}

// 尝试移动
function tryMove(enemy, nx, ny, map, enemies) {
  if (!isWalkable(map, nx, ny) && !enemy.phase) return false;
  // 检查是否和其他怪物重叠
  if (enemies.some(e => e !== enemy && e.alive && e.x === nx && e.y === ny)) return false;
  enemy.x = nx;
  enemy.y = ny;
  return true;
}

// 伤害怪物
export function damageEnemy(enemy, amount, log) {
  const actualDmg = Math.max(1, amount - enemy.def);
  enemy.hp -= actualDmg;
  if (enemy.hp <= 0) {
    enemy.hp = 0;
    enemy.alive = false;
    if (log) log(`${enemy.name}被消灭了！获得${enemy.xp}经验`, 'kill');
  }
  return actualDmg;
}
