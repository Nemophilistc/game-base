// ============================================
// dungeon.js - BSP地牢生成 + 走廊连接
// ============================================

import { TILE, DUNGEON_CONFIG } from './config.js';

// BSP树节点
class BSPNode {
  constructor(x, y, w, h) {
    this.x = x; this.y = y;
    this.w = w; this.h = h;
    this.left = null;
    this.right = null;
    this.room = null;
  }
}

// 生成BSP树
function splitBSP(node, minSize, depth) {
  if (depth <= 0 || node.w < minSize * 2 + 2 || node.h < minSize * 2 + 2) {
    // 创建房间
    const rw = randInt(Math.max(4, Math.floor(node.w * 0.4)), Math.min(node.w - 2, Math.floor(node.w * 0.8)));
    const rh = randInt(Math.max(4, Math.floor(node.h * 0.4)), Math.min(node.h - 2, Math.floor(node.h * 0.8)));
    const rx = randInt(node.x + 1, node.x + node.w - rw - 1);
    const ry = randInt(node.y + 1, node.y + node.h - rh - 1);
    node.room = { x: rx, y: ry, w: rw, h: rh, cx: Math.floor(rx + rw / 2), cy: Math.floor(ry + rh / 2) };
    return node;
  }

  // 决定水平还是垂直分割
  const splitH = node.w < node.h ? true : node.h < node.w ? false : Math.random() < 0.5;

  if (splitH) {
    const splitY = randInt(node.y + minSize + 1, node.y + node.h - minSize - 1);
    node.left = new BSPNode(node.x, node.y, node.w, splitY - node.y);
    node.right = new BSPNode(node.x, splitY, node.w, node.y + node.h - splitY);
  } else {
    const splitX = randInt(node.x + minSize + 1, node.x + node.w - minSize - 1);
    node.left = new BSPNode(node.x, node.y, splitX - node.x, node.h);
    node.right = new BSPNode(splitX, node.y, node.x + node.w - splitX, node.h);
  }

  node.left = splitBSP(node.left, minSize, depth - 1);
  node.right = splitBSP(node.right, minSize, depth - 1);
  return node;
}

// 收集所有房间
function getRooms(node, rooms = []) {
  if (node.room) {
    rooms.push(node.room);
  }
  if (node.left) getRooms(node.left, rooms);
  if (node.right) getRooms(node.right, rooms);
  return rooms;
}

// 连接走廊
function connectRooms(node, map) {
  if (!node.left || !node.right) return;

  const leftRooms = getRooms(node.left);
  const rightRooms = getRooms(node.right);

  if (leftRooms.length === 0 || rightRooms.length === 0) return;

  // 找最近的一对房间连接
  let bestDist = Infinity;
  let bestA = null, bestB = null;
  for (const a of leftRooms) {
    for (const b of rightRooms) {
      const dist = Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
      if (dist < bestDist) {
        bestDist = dist;
        bestA = a;
        bestB = b;
      }
    }
  }

  if (bestA && bestB) {
    carveCorridor(map, bestA.cx, bestA.cy, bestB.cx, bestB.cy);
  }

  connectRooms(node.left, map);
  connectRooms(node.right, map);
}

// 挖走廊
function carveCorridor(map, x1, y1, x2, y2) {
  let x = x1, y = y1;
  // 先水平再垂直 (L形走廊)
  if (Math.random() < 0.5) {
    while (x !== x2) {
      if (map[y] && map[y][x] !== undefined) {
        if (map[y][x] === TILE.WALL) map[y][x] = TILE.CORRIDOR;
      }
      x += x < x2 ? 1 : -1;
    }
    while (y !== y2) {
      if (map[y] && map[y][x] !== undefined) {
        if (map[y][x] === TILE.WALL) map[y][x] = TILE.CORRIDOR;
      }
      y += y < y2 ? 1 : -1;
    }
  } else {
    while (y !== y2) {
      if (map[y] && map[y][x] !== undefined) {
        if (map[y][x] === TILE.WALL) map[y][x] = TILE.CORRIDOR;
      }
      y += y < y2 ? 1 : -1;
    }
    while (x !== x2) {
      if (map[y] && map[y][x] !== undefined) {
        if (map[y][x] === TILE.WALL) map[y][x] = TILE.CORRIDOR;
      }
      x += x < x2 ? 1 : -1;
    }
  }
  // 最后一格
  if (map[y2] && map[y2][x2] !== undefined) {
    if (map[y2][x2] === TILE.WALL) map[y2][x2] = TILE.CORRIDOR;
  }
}

function randInt(min, max) {
  if (min >= max) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 生成地牢
export function generateDungeon(level) {
  const config = DUNGEON_CONFIG[level - 1];
  const { width, height, minRoom, maxRoom, roomMinSize, roomMaxSize } = config;
  const maxDepth = 5;

  // 创建全墙地图
  const map = [];
  for (let y = 0; y < height; y++) {
    map[y] = [];
    for (let x = 0; x < width; x++) {
      map[y][x] = TILE.WALL;
    }
  }

  // BSP生成
  const root = new BSPNode(1, 1, width - 2, height - 2);
  splitBSP(root, roomMinSize, maxDepth);

  // 挖房间
  const rooms = getRooms(root);
  for (const room of rooms) {
    for (let y = room.y; y < room.y + room.h; y++) {
      for (let x = room.x; x < room.x + room.w; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          map[y][x] = TILE.FLOOR;
        }
      }
    }
  }

  // 连接走廊
  connectRooms(root, map);

  // 放置楼梯
  const startRoom = rooms[0];
  const endRoom = rooms[rooms.length - 1];

  const playerStart = { x: startRoom.cx, y: startRoom.cy };
  const stairsPos = { x: endRoom.cx, y: endRoom.cy };

  map[stairsPos.y][stairsPos.x] = TILE.STAIRS_DOWN;

  // 如果不是第一层，放置上楼梯
  if (level > 1) {
    const upRoom = rooms[Math.floor(rooms.length / 2)];
    map[upRoom.cy][upRoom.cx] = TILE.STAIRS_UP;
  }

  return {
    map,
    width,
    height,
    rooms,
    playerStart,
    stairsPos,
    level,
    config,
  };
}

// 检查瓦片是否可通行
export function isWalkable(map, x, y) {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false;
  const tile = map[y][x];
  return tile !== TILE.WALL;
}

// 获取房间内的随机位置
export function getRandomRoomPos(room) {
  return {
    x: randInt(room.x + 1, room.x + room.w - 2),
    y: randInt(room.y + 1, room.y + room.h - 2),
  };
}
