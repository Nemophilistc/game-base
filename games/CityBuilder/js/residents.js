// ============================================
// 城市建设者 - 居民模拟系统
// ============================================

import { GRID, BUILDINGS, RESIDENT_SPEED, RESIDENT_SIZE, RESIDENT_COLORS } from './config.js';

class Resident {
  constructor(homeCol, homeRow, id) {
    this.id = id;
    this.homeCol = homeCol;
    this.homeRow = homeRow;
    this.workCol = -1;
    this.workRow = -1;

    // 世界坐标（像素）
    this.x = homeCol * GRID.cellSize + GRID.cellSize / 2;
    this.y = homeRow * GRID.cellSize + GRID.cellSize / 2;
    this.targetX = this.x;
    this.targetY = this.y;

    // 状态: home -> going_to_work -> work -> going_home
    this.state = 'home';
    this.stateTimer = 60 + Math.random() * 120; // 待在家的时间
    this.moving = false;
    this.speed = RESIDENT_SPEED * GRID.cellSize; // 像素/秒

    // 需求
    this.satisfaction = 70;
    this.employed = false;
    this.hasFood = true;
    this.hasEducation = false;
    this.hasHealthcare = false;

    // 外观
    this.color = RESIDENT_COLORS.happy;
    this.direction = 1; // 1=右, -1=左
  }

  update(dt) {
    const dtSec = dt / 60; // 假设60fps

    switch (this.state) {
      case 'home':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          if (this.employed) {
            this.state = 'going_to_work';
            this.targetX = this.workCol * GRID.cellSize + GRID.cellSize / 2;
            this.targetY = this.workRow * GRID.cellSize + GRID.cellSize / 2;
            this.moving = true;
          } else {
            // 无业游荡
            this.stateTimer = 120 + Math.random() * 120;
            const wander = GRID.cellSize * 2;
            this.targetX = this.x + (Math.random() - 0.5) * wander;
            this.targetY = this.y + (Math.random() - 0.5) * wander;
            // 限制在地图内
            this.targetX = Math.max(0, Math.min(GRID.cols * GRID.cellSize, this.targetX));
            this.targetY = Math.max(0, Math.min(GRID.rows * GRID.cellSize, this.targetY));
            this.moving = true;
            this.state = 'wandering';
          }
        }
        break;

      case 'wandering':
        if (this.moveToTarget(dtSec)) {
          this.moving = false;
          this.state = 'home';
          this.stateTimer = 60 + Math.random() * 180;
        }
        break;

      case 'going_to_work':
        if (this.moveToTarget(dtSec)) {
          this.moving = false;
          this.state = 'work';
          this.stateTimer = 180 + Math.random() * 120; // 工作时间
        }
        break;

      case 'work':
        this.stateTimer -= dt;
        if (this.stateTimer <= 0) {
          this.state = 'going_home';
          this.targetX = this.homeCol * GRID.cellSize + GRID.cellSize / 2;
          this.targetY = this.homeRow * GRID.cellSize + GRID.cellSize / 2;
          this.moving = true;
        }
        break;

      case 'going_home':
        if (this.moveToTarget(dtSec)) {
          this.moving = false;
          this.state = 'home';
          this.stateTimer = 120 + Math.random() * 180;
        }
        break;
    }

    // 更新颜色
    if (this.satisfaction >= 60) {
      this.color = RESIDENT_COLORS.happy;
    } else if (this.satisfaction >= 35) {
      this.color = RESIDENT_COLORS.neutral;
    } else {
      this.color = RESIDENT_COLORS.unhappy;
    }
  }

  moveToTarget(dtSec) {
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 2) {
      this.x = this.targetX;
      this.y = this.targetY;
      return true; // 到达
    }

    const move = this.speed * dtSec;
    const ratio = Math.min(move / dist, 1);
    this.x += dx * ratio;
    this.y += dy * ratio;

    // 更新朝向
    if (Math.abs(dx) > 1) {
      this.direction = dx > 0 ? 1 : -1;
    }

    return false;
  }
}

export class ResidentSystem {
  constructor(grid, economy) {
    this.grid = grid;
    this.economy = economy;
    this.residents = [];
    this.nextId = 0;
    this.maxResidents = 200; // 性能上限
  }

  // 更新居民
  update(dt, buildingStats) {
    const popCapacity = buildingStats.totalPopulationCapacity;
    const totalJobs = buildingStats.totalJobs;
    const currentPop = this.residents.length;

    // 生成新居民
    if (this.economy.population > currentPop && this.residents.length < this.maxResidents) {
      this.spawnResident(buildingStats);
    }

    // 移除多余居民
    if (this.economy.population < currentPop) {
      this.residents.splice(this.economy.population);
    }

    // 分配工作
    this.assignJobs(buildingStats);

    // 更新每个居民
    for (const resident of this.residents) {
      // 更新满意度
      resident.satisfaction = this.economy.satisfaction + (Math.random() - 0.5) * 20;
      resident.hasFood = this.economy.food > 0;
      resident.update(dt);
    }
  }

  // 生成居民
  spawnResident(buildingStats) {
    // 找一个住宅建筑
    const residentialBuildings = buildingStats.buildings.filter(b => b.type === 'residential');
    if (residentialBuildings.length === 0) return;

    // 计算每个住宅的当前居民数
    const homeCounts = {};
    for (const r of this.residents) {
      const key = `${r.homeCol},${r.homeRow}`;
      homeCounts[key] = (homeCounts[key] || 0) + 1;
    }

    // 找一个有空位的住宅
    for (const rb of residentialBuildings) {
      const config = BUILDINGS.residential;
      const capacity = Math.floor(config.populationCapacity * Math.pow(1.5, (rb.level || 1) - 1));
      const key = `${rb.col},${rb.row}`;
      const current = homeCounts[key] || 0;

      if (current < capacity) {
        const resident = new Resident(rb.col, rb.row, this.nextId++);
        // 随机偏移初始位置
        resident.x += (Math.random() - 0.5) * GRID.cellSize * 0.5;
        resident.y += (Math.random() - 0.5) * GRID.cellSize * 0.5;
        this.residents.push(resident);
        return;
      }
    }
  }

  // 分配工作
  assignJobs(buildingStats) {
    // 收集所有工作岗位
    const workplaces = buildingStats.buildings.filter(b =>
      b.type === 'commercial' || b.type === 'industrial' || b.type === 'farm'
    );

    // 收集每个工作地的在职工人数
    const workerCounts = {};
    for (const r of this.residents) {
      if (r.employed) {
        const key = `${r.workCol},${r.workRow}`;
        workerCounts[key] = (workerCounts[key] || 0) + 1;
      }
    }

    // 为失业居民找工作
    for (const resident of this.residents) {
      if (resident.employed) continue;

      for (const wp of workplaces) {
        const config = BUILDINGS[wp.type];
        const capacity = Math.floor((config.jobs || 0) * Math.pow(1.5, (wp.level || 1) - 1));
        const key = `${wp.col},${wp.row}`;
        const current = workerCounts[key] || 0;

        if (current < capacity) {
          resident.employed = true;
          resident.workCol = wp.col;
          resident.workRow = wp.row;
          workerCounts[key] = current + 1;
          break;
        }
      }
    }

    // 如果工作岗位不足，解雇多余的人
    const employedResidents = this.residents.filter(r => r.employed);
    const totalCapacity = workplaces.reduce((sum, wp) => {
      const config = BUILDINGS[wp.type];
      return sum + Math.floor((config.jobs || 0) * Math.pow(1.5, (wp.level || 1) - 1));
    }, 0);

    if (employedResidents.length > totalCapacity) {
      // 解雇多余的
      const toFire = employedResidents.length - totalCapacity;
      for (let i = 0; i < toFire && employedResidents.length > 0; i++) {
        const idx = Math.floor(Math.random() * employedResidents.length);
        const fired = employedResidents.splice(idx, 1)[0];
        fired.employed = false;
        fired.workCol = -1;
        fired.workRow = -1;
        fired.state = 'home';
        fired.stateTimer = 60;
      }
    }
  }

  // 渲染居民
  render(ctx, camera) {
    ctx.save();
    ctx.translate(camera.x, camera.y);
    ctx.scale(camera.zoom, camera.zoom);

    // 只在合适的缩放级别下渲染居民
    if (camera.zoom >= 0.5) {
      const size = RESIDENT_SIZE * (camera.zoom < 1 ? 1 : 1);

      for (const resident of this.residents) {
        // 居民本体
        ctx.fillStyle = resident.color;
        ctx.beginPath();
        ctx.arc(resident.x, resident.y - 4, size, 0, Math.PI * 2);
        ctx.fill();

        // 头部
        ctx.fillStyle = '#FFCCBC';
        ctx.beginPath();
        ctx.arc(resident.x, resident.y - 8, size * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // 身体
        ctx.fillStyle = resident.color;
        ctx.fillRect(resident.x - size * 0.6, resident.y - 4, size * 1.2, size * 1.5);

        // 工作时显示小图标
        if (resident.state === 'work' && camera.zoom >= 1) {
          ctx.font = '8px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fff';
          ctx.fillText('💼', resident.x, resident.y - 14);
        }
      }
    }

    ctx.restore();
  }

  // 获取居民统计
  getStats() {
    const total = this.residents.length;
    const employed = this.residents.filter(r => r.employed).length;
    const avgSatisfaction = total > 0
      ? this.residents.reduce((sum, r) => sum + r.satisfaction, 0) / total
      : 0;

    return {
      total,
      employed,
      unemployed: total - employed,
      avgSatisfaction: Math.floor(avgSatisfaction)
    };
  }
}
