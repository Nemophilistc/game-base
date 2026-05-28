import { CELL, COLS, ROWS, FOOD_TYPES } from './config.js';

/**
 * 食物系统：生成、存储和渲染食物
 */
export class Food {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.type = 'normal';
        this.color = '#f44336';
        this.pulse = 0;
    }

    /**
     * 生成新食物
     * @param {(x:number,y:number)=>boolean} isBlocked 检查坐标是否被占用
     */
    spawn(isBlocked) {
        // 按权重随机选择类型
        const total = FOOD_TYPES.reduce((s, t) => s + t.weight, 0);
        let r = Math.random() * total;
        let chosen = FOOD_TYPES[0];
        for (const t of FOOD_TYPES) {
            r -= t.weight;
            if (r <= 0) { chosen = t; break; }
        }

        // 寻找空位
        let fx, fy, tries = 0;
        do {
            fx = Math.floor(Math.random() * COLS);
            fy = Math.floor(Math.random() * ROWS);
            tries++;
        } while (isBlocked(fx, fy) && tries < 1000);

        this.x = fx;
        this.y = fy;
        this.type = chosen.type;
        this.color = chosen.color;
        this.pulse = 0;
    }

    /**
     * 绘制食物（含脉冲动画）
     * @param {CanvasRenderingContext2D} ctx
     */
    draw(ctx) {
        this.pulse += 0.05;
        const pr = Math.sin(this.pulse) * 0.2 + 1;
        const cx = this.x * CELL + CELL / 2;
        const cy = this.y * CELL + CELL / 2;

        // 光晕
        ctx.fillStyle = this.color + '30';
        ctx.beginPath();
        ctx.arc(cx, cy, CELL * pr * 0.7, 0, Math.PI * 2);
        ctx.fill();

        // 实体
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(cx, cy, CELL / 2 * pr * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}
