// ============================================
// fov.js - 视野系统 (FOV计算)
// ============================================

import { TILE, FOV_RADIUS } from './config.js';

// 用阴影投射算法计算FOV
export function computeFOV(map, px, py, radius, explored) {
  const visible = new Set();
  const h = map.length;
  const w = map[0].length;

  // 始终可以看到自己
  visible.add(`${px},${py}`);
  explored.add(`${px},${py}`);

  // 8个象限的阴影投射
  for (let octant = 0; octant < 8; octant++) {
    castLight(map, px, py, radius, 1, 1.0, 0.0, octant, visible, explored, w, h);
  }

  return visible;
}

// 递归阴影投射
function castLight(map, cx, cy, radius, row, startSlope, endSlope, octant, visible, explored, mapW, mapH) {
  if (startSlope < endSlope) return;

  let nextStartSlope = startSlope;

  for (let i = row; i <= radius; i++) {
    let blocked = false;

    for (let dx = -i; dx <= 0; dx++) {
      const dy = -i;
      // 转换到实际坐标
      const [mx, my] = transformOctant(dx, dy, octant);
      const ax = cx + mx;
      const ay = cy + my;

      if (ax < 0 || ax >= mapW || ay < 0 || ay >= mapH) continue;

      // 计算斜率
      const leftSlope = (dx - 0.5) / (dy + 0.5);
      const rightSlope = (dx + 0.5) / (dy - 0.5);

      if (startSlope < rightSlope) continue;
      if (endSlope > leftSlope) break;

      // 计算距离
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= radius) {
        visible.add(`${ax},${ay}`);
        explored.add(`${ax},${ay}`);
      }

      const isWall = map[ay][ax] === TILE.WALL;

      if (blocked) {
        if (isWall) {
          nextStartSlope = rightSlope;
        } else {
          blocked = false;
          startSlope = nextStartSlope;
        }
      } else if (isWall && i < radius) {
        blocked = true;
        castLight(map, cx, cy, radius, i + 1, startSlope, leftSlope, octant, visible, explored, mapW, mapH);
        nextStartSlope = rightSlope;
      }
    }

    if (blocked) break;
  }
}

// 八象限坐标变换
function transformOctant(x, y, octant) {
  switch (octant) {
    case 0: return [x, y];
    case 1: return [y, x];
    case 2: return [y, -x];
    case 3: return [-x, y];
    case 4: return [-x, -y];
    case 5: return [-y, -x];
    case 6: return [-y, x];
    case 7: return [x, -y];
    default: return [x, y];
  }
}

// 简化版FOV (射线投射，用于性能要求不高的场景)
export function computeFOVSimple(map, px, py, radius, explored) {
  const visible = new Set();
  const h = map.length;
  const w = map[0].length;

  visible.add(`${px},${py}`);
  explored.add(`${px},${py}`);

  const steps = 360;
  for (let i = 0; i < steps; i++) {
    const angle = (i / steps) * Math.PI * 2;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);

    let x = px + 0.5;
    let y = py + 0.5;

    for (let d = 0; d < radius; d++) {
      x += dx;
      y += dy;
      const ix = Math.floor(x);
      const iy = Math.floor(y);

      if (ix < 0 || ix >= w || iy < 0 || iy >= h) break;

      visible.add(`${ix},${iy}`);
      explored.add(`${ix},${iy}`);

      if (map[iy][ix] === TILE.WALL) break;
    }
  }

  return visible;
}
