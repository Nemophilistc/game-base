// ============================================
// main.js - 游戏主循环、事件监听、状态机
// ============================================

import { TILE, TILE_SIZE, CANVAS_TILES_X, CANVAS_TILES_Y, CANVAS_WIDTH, CANVAS_HEIGHT, FOV_RADIUS, CLASSES, COLORS } from './config.js';
import { Sound } from './sound.js';
import { generateDungeon, isWalkable } from './dungeon.js';
import { createPlayer } from './player.js';
import { generateEnemies } from './enemy.js';
import { generateFloorItems, useConsumable } from './items.js';
import { playerMove, playerRangedAttack, processTurn } from './combat.js';
import { computeFOV, computeFOVSimple } from './fov.js';
import { renderGame, renderStatusBar, renderMinimap, renderLog, renderInventory, renderStatPanel, renderGameOver } from './ui.js';

// ============================================
// 游戏状态
// ============================================
const STATE = {
  MENU: 'menu',
  PLAYING: 'playing',
  INVENTORY: 'inventory',
  STAT_PANEL: 'stat_panel',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
  TARGETING: 'targeting', // 远程攻击选目标
};

let gameState = STATE.MENU;
let canvas, ctx;

// 游戏数据
let player = null;
let dungeon = null;
let enemies = [];
let items = [];
let visible = new Set();
let explored = new Set();
let logMessages = [];
let currentFloor = 1;
let selectedIndex = -1; // 背包选中
let targetingMode = false;
let targetX = 0, targetY = 0;
let menuSelection = 0;
let inventoryPage = 0;

// 相机
let camera = { x: 0, y: 0 };

// 消息队列 (用于日志)
const MAX_LOG = 50;
function addLog(text, type = 'info') {
  logMessages.push({ text, type, time: Date.now() });
  if (logMessages.length > MAX_LOG) logMessages.shift();
}

// ============================================
// 初始化
// ============================================
function init() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  // 事件监听
  window.addEventListener('keydown', handleKeyDown);
  canvas.addEventListener('click', () => {
    if (gameState === STATE.MENU) {
      startNewGame(menuSelection);
    } else if (gameState === STATE.GAME_OVER || gameState === STATE.VICTORY) {
      resetGame();
    }
  });

  // 开始游戏循环
  requestAnimationFrame(gameLoop);
}

// ============================================
// 游戏主循环
// ============================================
let lastTime = 0;
function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  render();

  requestAnimationFrame(gameLoop);
}

function update(dt) {
  // 动画更新等
}

function render() {
  switch (gameState) {
    case STATE.MENU:
      renderMenu();
      break;
    case STATE.PLAYING:
      renderPlaying();
      break;
    case STATE.INVENTORY:
      renderPlaying();
      renderInventory(ctx, player, selectedIndex, CANVAS_WIDTH, CANVAS_HEIGHT);
      break;
    case STATE.STAT_PANEL:
      renderPlaying();
      renderStatPanel(ctx, player, CANVAS_WIDTH, CANVAS_HEIGHT);
      break;
    case STATE.GAME_OVER:
      renderGameOver(ctx, player, CANVAS_WIDTH, CANVAS_HEIGHT, false);
      break;
    case STATE.VICTORY:
      renderGameOver(ctx, player, CANVAS_WIDTH, CANVAS_HEIGHT, true);
      break;
    case STATE.TARGETING:
      renderPlaying();
      renderTargeting();
      break;
  }
}

// ============================================
// 菜单渲染
// ============================================
function renderMenu() {
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // 标题
  ctx.font = 'bold 48px monospace';
  ctx.fillStyle = COLORS.textGold;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('地牢探险', CANVAS_WIDTH / 2, 100);

  ctx.font = '16px monospace';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText('Roguelike Dungeon RPG', CANVAS_WIDTH / 2, 140);

  // 职业选择
  const classes = Object.entries(CLASSES);
  const startY = 200;

  ctx.font = '14px monospace';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText('选择职业:', CANVAS_WIDTH / 2, startY - 20);

  for (let i = 0; i < classes.length; i++) {
    const [id, cls] = classes[i];
    const y = startY + i * 70;
    const isSelected = i === menuSelection;

    // 选中框
    if (isSelected) {
      ctx.fillStyle = 'rgba(60, 100, 160, 0.3)';
      ctx.fillRect(CANVAS_WIDTH / 2 - 180, y - 25, 360, 60);
      ctx.strokeStyle = COLORS.textBlue;
      ctx.lineWidth = 2;
      ctx.strokeRect(CANVAS_WIDTH / 2 - 180, y - 25, 360, 60);
    }

    ctx.font = 'bold 18px monospace';
    ctx.fillStyle = isSelected ? COLORS.textGold : COLORS.textPrimary;
    ctx.fillText(cls.name, CANVAS_WIDTH / 2 - 100, y - 5);

    ctx.font = '12px monospace';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.fillText(`力${cls.str} 敏${cls.agi} 体${cls.con} 智${cls.int} HP:${cls.hp} MP:${cls.mp}`, CANVAS_WIDTH / 2 + 20, y - 5);

    // 描述
    const descs = {
      warrior: '近战专家，高生命高攻击',
      rogue: '高暴击高闪避，擅长潜行',
      mage: '魔法大师，远程法术攻击',
      ranger: '远程弓箭手，箭雨覆盖',
    };
    ctx.fillText(descs[id] || '', CANVAS_WIDTH / 2, y + 15);
  }

  // 操作提示
  ctx.font = '13px monospace';
  ctx.fillStyle = COLORS.textSecondary;
  ctx.fillText('↑↓ 选择职业   Enter 开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 60);

  // 操作说明
  ctx.font = '12px monospace';
  ctx.fillStyle = '#556677';
  ctx.fillText('WASD/方向键 移动 | I 背包 | Q 属性 | 数字键 使用道具 | F 远程攻击', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 30);
}

// ============================================
// 游戏渲染
// ============================================
function renderPlaying() {
  if (!player || !dungeon) return;

  // 更新相机
  updateCamera();

  // 更新FOV
  visible = computeFOV(dungeon.map, player.x, player.y, player.fovRadius, explored);

  // 渲染
  renderGame(ctx, dungeon.map, player, enemies, items, visible, explored, camera);
  renderStatusBar(ctx, player, CANVAS_WIDTH);
  renderMinimap(ctx, dungeon.map, player, enemies, visible, explored, CANVAS_WIDTH);
  renderLog(ctx, logMessages, CANVAS_WIDTH, CANVAS_HEIGHT);
}

function updateCamera() {
  const halfW = Math.floor(CANVAS_TILES_X / 2);
  const halfH = Math.floor(CANVAS_TILES_Y / 2);
  camera.x = Math.max(0, Math.min(dungeon.width - CANVAS_TILES_X, player.x - halfW));
  camera.y = Math.max(0, Math.min(dungeon.height - CANVAS_TILES_Y, player.y - halfH));
}

// 绘制瞄准模式
function renderTargeting() {
  const sx = targetX - camera.x;
  const sy = targetY - camera.y;
  if (sx >= 0 && sx < CANVAS_TILES_X && sy >= 0 && sy < CANVAS_TILES_Y) {
    const px = sx * TILE_SIZE;
    const py = sy * TILE_SIZE;
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, TILE_SIZE, TILE_SIZE);

    // 显示射程范围内的敌人
    const weapon = player.equipment.weapon;
    if (weapon && weapon.range) {
      ctx.font = '12px monospace';
      ctx.fillStyle = '#ffcc00';
      ctx.textAlign = 'center';
      ctx.fillText(`射程:${weapon.range} 距离:${Math.abs(targetX - player.x) + Math.abs(targetY - player.y)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT - 100);
    }
  }
}

// ============================================
// 开始新游戏
// ============================================
function startNewGame(classId) {
  const classKeys = Object.keys(CLASSES);
  const cls = CLASSES[classKeys[classId]] || CLASSES.warrior;

  currentFloor = 1;
  logMessages = [];
  addLog('欢迎来到地牢！寻找楼梯(>)前往下一层。', 'info');
  addLog('WASD/方向键移动，I打开背包，数字键使用道具', 'info');

  generateFloor(currentFloor, classKeys[classId]);
  gameState = STATE.PLAYING;
}

function generateFloor(level, classId) {
  dungeon = generateDungeon(level);
  explored = new Set();

  if (!player) {
    player = createPlayer(classId, dungeon.playerStart.x, dungeon.playerStart.y);
  } else {
    player.x = dungeon.playerStart.x;
    player.y = dungeon.playerStart.y;
  }

  player.fovRadius = FOV_RADIUS;
  player.floorsCleared = level;

  enemies = generateEnemies(dungeon.rooms, dungeon.config.enemies, level, dungeon.playerStart, dungeon.stairsPos);
  items = generateFloorItems(dungeon.rooms, dungeon.config.items, level, dungeon.stairsPos);

  addLog(`--- 第${level}层 ---`, 'info');
  if (level === 5) {
    addLog('你感受到了强大的气息...最终Boss就在这一层！', 'enemy');
    Sound.bossAppear();
  }

  // 更新FOV
  visible = computeFOV(dungeon.map, player.x, player.y, player.fovRadius, explored);
}

// 下一层
function goNextFloor() {
  if (currentFloor >= 5) {
    // 检查Boss是否被击杀
    const boss = enemies.find(e => e.boss);
    if (boss && !boss.alive) {
      gameState = STATE.VICTORY;
      addLog('你击败了巨龙，征服了地牢！', 'levelup');
      return;
    }
    addLog('你必须击败巨龙才能通关！', 'enemy');
    return;
  }

  currentFloor++;
  Sound.stairs();
  generateFloor(currentFloor, player.classId);
}

// ============================================
// 输入处理
// ============================================
function handleKeyDown(e) {
  // 防止方向键滚动
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }

  switch (gameState) {
    case STATE.MENU:
      handleMenuInput(e);
      break;
    case STATE.PLAYING:
      handlePlayingInput(e);
      break;
    case STATE.INVENTORY:
      handleInventoryInput(e);
      break;
    case STATE.STAT_PANEL:
      handleStatPanelInput(e);
      break;
    case STATE.GAME_OVER:
    case STATE.VICTORY:
      if (e.key === 'Enter') {
        resetGame();
      }
      break;
    case STATE.TARGETING:
      handleTargetingInput(e);
      break;
  }
}

function handleMenuInput(e) {
  const classCount = Object.keys(CLASSES).length;
  if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
    menuSelection = (menuSelection - 1 + classCount) % classCount;
  } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
    menuSelection = (menuSelection + 1) % classCount;
  } else if (e.key === 'Enter') {
    startNewGame(menuSelection);
  }
}

function handlePlayingInput(e) {
  if (!player || !player.alive) return;

  const key = e.key;
  let moved = false;
  let dx = 0, dy = 0;

  // 移动
  if (key === 'ArrowUp' || key === 'w' || key === 'W') { dy = -1; moved = true; }
  if (key === 'ArrowDown' || key === 's' || key === 'S') { dy = 1; moved = true; }
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') { dx = -1; moved = true; }
  if (key === 'ArrowRight' || key === 'd' || key === 'D') { dx = 1; moved = true; }

  // 等待一回合
  if (key === '.' || key === ' ') {
    moved = true;
  }

  if (moved && (dx !== 0 || dy !== 0)) {
    const result = playerMove(player, dx, dy, dungeon.map, enemies, items, addLog);
    if (result) {
      // 消耗回合
      const turnResult = processTurn(player, dungeon.map, enemies, items, addLog);
      if (turnResult === 'dead') {
        gameState = STATE.GAME_OVER;
      } else if (turnResult === 'stairs_down') {
        // 自动提示下楼梯
      }
    }
  } else if (moved) {
    // 等待回合
    const turnResult = processTurn(player, dungeon.map, enemies, items, addLog);
    if (turnResult === 'dead') {
      gameState = STATE.GAME_OVER;
    }
  }

  // 下楼梯 (Enter或>键)
  if (key === 'Enter' || key === '>') {
    if (dungeon.map[player.y][player.x] === TILE.STAIRS_DOWN) {
      goNextFloor();
    }
  }

  // 打开背包
  if (key === 'i' || key === 'I') {
    gameState = STATE.INVENTORY;
    selectedIndex = -1;
  }

  // 属性面板
  if (key === 'q' || key === 'Q') {
    if (player.statPoints > 0) {
      gameState = STATE.STAT_PANEL;
    }
  }

  // 快捷使用道具 (数字键)
  if (key >= '1' && key <= '9') {
    const idx = parseInt(key) - 1;
    if (idx < player.inventory.length) {
      const item = player.inventory[idx];
      if (item.type === 'consumable') {
        const result = player.useItem(idx, enemies, dungeon.map, addLog);
        if (result === 'teleport') {
          teleportPlayer();
        } else if (result === 'fireball') {
          fireballScroll();
        } else if (result === 'mapping') {
          revealMap();
        } else if (result === 'light') {
          player.fovRadius = Math.min(FOV_RADIUS + 4, 15);
          addLog('视野扩大了！', 'buff');
        } else if (result) {
          Sound.useItem();
          // 消耗回合
          const turnResult = processTurn(player, dungeon.map, enemies, items, addLog);
          if (turnResult === 'dead') gameState = STATE.GAME_OVER;
        }
      } else if (item.slot) {
        player.equipItem(item);
        Sound.useItem();
        addLog(`装备了${item.name}！`, 'equip');
      }
    }
  }

  // 远程攻击模式
  if (key === 'f' || key === 'F') {
    const weapon = player.equipment.weapon;
    if (weapon && weapon.range > 1) {
      targetingMode = true;
      targetX = player.x;
      targetY = player.y;
      gameState = STATE.TARGETING;
      addLog('进入远程攻击模式，选择目标后按Enter确认', 'info');
    } else {
      addLog('需要远程武器！', 'info');
      Sound.error();
    }
  }
}

function handleInventoryInput(e) {
  const key = e.key;

  if (key === 'i' || key === 'I' || key === 'Escape') {
    gameState = STATE.PLAYING;
    return;
  }

  // 数字键选择物品
  if (key >= '1' && key <= '9') {
    const idx = parseInt(key) - 1;
    if (idx < player.inventory.length) {
      selectedIndex = idx;
      const item = player.inventory[idx];

      if (item.type === 'consumable') {
        const result = player.useItem(idx, enemies, dungeon.map, addLog);
        if (result === 'teleport') {
          teleportPlayer();
          gameState = STATE.PLAYING;
        } else if (result === 'fireball') {
          fireballScroll();
          gameState = STATE.PLAYING;
        } else if (result === 'mapping') {
          revealMap();
          gameState = STATE.PLAYING;
        } else if (result === 'light') {
          player.fovRadius = Math.min(FOV_RADIUS + 4, 15);
          gameState = STATE.PLAYING;
        } else if (result) {
          Sound.useItem();
          gameState = STATE.PLAYING;
        }
      } else if (item.slot) {
        player.equipItem(item);
        Sound.useItem();
        addLog(`装备了${item.name}！`, 'equip');
      }
    }
  }

  // D键丢弃
  if ((key === 'd' || key === 'D') && selectedIndex >= 0) {
    const dropped = player.dropItem(selectedIndex);
    if (dropped) {
      dropped.x = player.x;
      dropped.y = player.y;
      items.push(dropped);
      addLog(`丢弃了${dropped.name}`, 'info');
      selectedIndex = Math.min(selectedIndex, player.inventory.length - 1);
    }
  }
}

function handleStatPanelInput(e) {
  const key = e.key;

  if (key === 'q' || key === 'Q' || key === 'Escape') {
    gameState = STATE.PLAYING;
    return;
  }

  if (key >= '1' && key <= '4') {
    const stats = ['str', 'agi', 'con', 'int'];
    const idx = parseInt(key) - 1;
    if (idx < stats.length && player.statPoints > 0) {
      player.addStat(stats[idx]);
      Sound.pickup();
      addLog(`${stats[idx] === 'str' ? '力量' : stats[idx] === 'agi' ? '敏捷' : stats[idx] === 'con' ? '体质' : '智力'}+1！`, 'buff');
      if (player.statPoints <= 0) {
        gameState = STATE.PLAYING;
      }
    }
  }
}

function handleTargetingInput(e) {
  const key = e.key;

  if (key === 'Escape' || key === 'f' || key === 'F') {
    gameState = STATE.PLAYING;
    targetingMode = false;
    return;
  }

  // 移动目标
  if (key === 'ArrowUp' || key === 'w' || key === 'W') targetY--;
  if (key === 'ArrowDown' || key === 's' || key === 'S') targetY++;
  if (key === 'ArrowLeft' || key === 'a' || key === 'A') targetX--;
  if (key === 'ArrowRight' || key === 'd' || key === 'D') targetX++;

  // 确认攻击
  if (key === 'Enter' || key === ' ') {
    const result = playerRangedAttack(player, targetX, targetY, enemies, addLog);
    if (result) {
      const turnResult = processTurn(player, dungeon.map, enemies, items, addLog);
      if (turnResult === 'dead') {
        gameState = STATE.GAME_OVER;
      }
    }
    gameState = STATE.PLAYING;
    targetingMode = false;
  }
}

// ============================================
// 特殊效果
// ============================================
function teleportPlayer() {
  // 传送到随机已探索位置
  const exploredList = Array.from(explored);
  if (exploredList.length === 0) return;

  for (let i = 0; i < 100; i++) {
    const key = exploredList[Math.floor(Math.random() * exploredList.length)];
    const [x, y] = key.split(',').map(Number);
    if (isWalkable(dungeon.map, x, y) && !enemies.some(e => e.alive && e.x === x && e.y === y)) {
      player.x = x;
      player.y = y;
      Sound.magic();
      addLog('你被传送到了新的位置！', 'magic');
      return;
    }
  }
}

function fireballScroll() {
  Sound.magic();
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dist = Math.abs(enemy.x - player.x) + Math.abs(enemy.y - player.y);
    if (dist <= 3) {
      const damage = 20 + Math.floor(player.int * 0.5);
      const actualDmg = Math.max(1, damage - enemy.def);
      enemy.hp -= actualDmg;
      addLog(`火球对${enemy.name}造成${actualDmg}点伤害！`, 'magic');
      if (enemy.hp <= 0) {
        enemy.hp = 0;
        enemy.alive = false;
        Sound.enemyDeath();
        player.gainXP(enemy.xp, addLog);
        player.kills++;
        addLog(`${enemy.name}被消灭了！`, 'kill');
      }
    }
  }
}

function revealMap() {
  // 显示整层地图
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      if (dungeon.map[y][x] !== TILE.WALL || hasAdjacentFloor(x, y)) {
        explored.add(`${x},${y}`);
      }
    }
  }
  Sound.discover();
  addLog('地图已显示！', 'magic');
}

function hasAdjacentFloor(x, y) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (ny >= 0 && ny < dungeon.height && nx >= 0 && nx < dungeon.width) {
        if (dungeon.map[ny][nx] !== TILE.WALL) return true;
      }
    }
  }
  return false;
}

function resetGame() {
  player = null;
  dungeon = null;
  enemies = [];
  items = [];
  visible = new Set();
  explored = new Set();
  logMessages = [];
  currentFloor = 1;
  selectedIndex = -1;
  targetingMode = false;
  menuSelection = 0;
  gameState = STATE.MENU;
}

// ============================================
// 启动
// ============================================
document.addEventListener('DOMContentLoaded', init);
