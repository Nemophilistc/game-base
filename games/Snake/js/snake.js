import { CELL, COLS, ROWS } from './config.js';

/**
 * 蛇类：管理蛇的状态、移动、碰撞检测和渲染
 */
export class Snake {
    constructor() {
        /** @type {{x:number, y:number}[]} */
        this.body = [];
        /** @type {{x:number, y:number}} */
        this.dir = { x: 1, y: 0 };
        /** @type {{x:number, y:number}} */
        this.nextDir = { x: 1, y: 0 };
        /** @type {{x:number, y:number}[]} */
        this.mazeWalls = [];
        /** 道具计时器（帧数） */
        this.speedBoost = 0;
        this.speedSlow = 0;
        this.doubleScore = 0;
    }

    /** 初始化蛇到地图中央 */
    init() {
        const cx = Math.floor(COLS / 2);
        const cy = Math.floor(ROWS / 2);
        this.body = [
            { x: cx,     y: cy },
            { x: cx - 1, y: cy },
            { x: cx - 2, y: cy }
        ];
        this.dir = { x: 1, y: 0 };
        this.nextDir = { x: 1, y: 0 };
        this.speedBoost = 0;
        this.speedSlow = 0;
        this.doubleScore = 0;
        this.mazeWalls = [];
    }

    /** 生成迷宫墙壁 */
    generateMaze() {
        this.mazeWalls = [];
        const midX = Math.floor(COLS / 2);
        const midY = Math.floor(ROWS / 2);

        // 上下横墙
        for (let x = 5; x < COLS - 5; x++) {
            if (x !== midX) {
                this.mazeWalls.push({ x, y: 5 });
                this.mazeWalls.push({ x, y: ROWS - 6 });
            }
        }
        // 左右竖墙
        for (let y = 5; y < ROWS - 5; y++) {
            if (y !== midY) {
                this.mazeWalls.push({ x: 5, y });
                this.mazeWalls.push({ x: COLS - 6, y });
            }
        }
        // 中间横墙
        for (let x = 10; x < 20; x++) {
            if (x !== 15) this.mazeWalls.push({ x, y: 12 });
        }
    }

    /** 蛇头位置 */
    get head() {
        return this.body[0];
    }

    /** 蛇长度 */
    get length() {
        return this.body.length;
    }

    /** 设置下一步方向（防止180度反转和快速双键） */
    setDirection(dx, dy) {
        if (this.dir.y !== -dy && this.nextDir.y !== -dy &&
            this.dir.x !== -dx && this.nextDir.x !== -dx) {
            this.nextDir = { x: dx, y: dy };
        }
    }

    /** 检查坐标是否是迷宫墙壁 */
    isMazeWall(x, y) {
        return this.mazeWalls.some(w => w.x === x && w.y === y);
    }

    /** 检查坐标是否在蛇身上（可选排除尾部，因为尾部本帧会移走） */
    isBody(x, y, excludeTail = false) {
        const len = excludeTail ? this.body.length - 1 : this.body.length;
        for (let i = 0; i < len; i++) {
            if (this.body[i].x === x && this.body[i].y === y) return true;
        }
        return false;
    }

    /**
     * 移动一步，返回碰撞结果
     * @param {'classic'|'nowrap'|'maze'} mode
     * @returns {'ok'|'wall'|'self'|'maze_wall'}
     */
    move(mode) {
        this.dir = { ...this.nextDir };
        const newHead = {
            x: this.head.x + this.dir.x,
            y: this.head.y + this.dir.y
        };

        // 穿墙模式：坐标回绕
        if (mode === 'nowrap') {
            if (newHead.x < 0) newHead.x = COLS - 1;
            if (newHead.x >= COLS) newHead.x = 0;
            if (newHead.y < 0) newHead.y = ROWS - 1;
            if (newHead.y >= ROWS) newHead.y = 0;
        }

        // 碰撞检测
        const hitWall = mode !== 'nowrap' &&
            (newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS);
        const hitMaze = this.isMazeWall(newHead.x, newHead.y);
        const hitSelf = this.isBody(newHead.x, newHead.y, true);

        if (hitWall) return 'wall';
        if (hitMaze) return 'maze_wall';
        if (hitSelf) return 'self';

        this.body.unshift(newHead);
        return 'ok';
    }

    /** 移除蛇尾（不吃食物时调用） */
    removeTail() {
        this.body.pop();
    }

    /** 缩短蛇身（毒食物效果，保证最少3节） */
    shrink(count) {
        for (let i = 0; i < count && this.body.length > 3; i++) {
            this.body.pop();
        }
    }

    /** 每帧递减道具计时器 */
    tickPowerups() {
        if (this.speedBoost > 0) this.speedBoost--;
        if (this.speedSlow > 0) this.speedSlow--;
        if (this.doubleScore > 0) this.doubleScore--;
    }

    /** 计算当前移动间隔 */
    getMoveInterval(baseInterval) {
        let interval = baseInterval;
        if (this.speedBoost > 0) interval *= 0.6;
        if (this.speedSlow > 0) interval *= 1.5;
        return interval;
    }

    /** 绘制蛇和迷宫墙壁 */
    draw(ctx) {
        // 迷宫墙壁
        for (const w of this.mazeWalls) {
            ctx.fillStyle = '#455a64';
            ctx.fillRect(w.x * CELL, w.y * CELL, CELL, CELL);
            ctx.fillStyle = '#37474f';
            ctx.fillRect(w.x * CELL + 2, w.y * CELL + 2, CELL - 4, CELL - 4);
        }

        // 蛇身
        this.body.forEach((seg, i) => {
            const t = i / this.body.length;
            ctx.fillStyle = `rgb(${Math.floor(76 + t * 50)},${Math.floor(175 - t * 80)},${Math.floor(80 + t * 30)})`;
            const px = seg.x * CELL;
            const py = seg.y * CELL;
            const pad = i === 0 ? 1 : 2;

            ctx.beginPath();
            if (ctx.roundRect) {
                ctx.roundRect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2, 4);
            } else {
                ctx.rect(px + pad, py + pad, CELL - pad * 2, CELL - pad * 2);
            }
            ctx.fill();

            // 蛇头眼睛
            if (i === 0) {
                ctx.fillStyle = '#fff';
                const ex1 = px + CELL / 2 + this.dir.x * 4 - this.dir.y * 3;
                const ey1 = py + CELL / 2 + this.dir.y * 4 - this.dir.x * 3;
                const ex2 = px + CELL / 2 + this.dir.x * 4 + this.dir.y * 3;
                const ey2 = py + CELL / 2 + this.dir.y * 4 + this.dir.x * 3;
                ctx.beginPath(); ctx.arc(ex1, ey1, 2.5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2, ey2, 2.5, 0, Math.PI * 2); ctx.fill();

                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(ex1 + this.dir.x, ey1 + this.dir.y, 1.2, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(ex2 + this.dir.x, ey2 + this.dir.y, 1.2, 0, Math.PI * 2); ctx.fill();
            }
        });

        // 道具特效覆盖层
        if (this.speedBoost > 0) {
            ctx.fillStyle = 'rgba(255,235,59,0.1)';
            ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
        }
        if (this.speedSlow > 0) {
            ctx.fillStyle = 'rgba(33,150,243,0.1)';
            ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
        }
        if (this.doubleScore > 0) {
            ctx.fillStyle = 'rgba(255,215,0,0.08)';
            ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
        }
    }
}
