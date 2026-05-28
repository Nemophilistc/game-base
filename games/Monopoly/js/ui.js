// ui.js - Canvas棋盘渲染、玩家标记、地产卡片、覆盖层

import { SQUARES, SQUARE_COLORS, COLOR_GROUPS, PLAYER_COLORS, PLAYER_NAMES, TOTAL_SQUARES } from './config.js';

export class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.boardSize = 760;
        this.cellSize = 54;
        this.cornerSize = 76;
        this.offset = 10;
        this.playerAnimPos = {}; // 玩家动画位置
        this.diceValues = [0, 0];
        this.diceRolling = false;
        this.hoveredSquare = -1;
        this.messageQueue = [];
        this.currentMessage = null;
        this.messageTimer = 0;

        canvas.width = this.boardSize + 20;
        canvas.height = this.boardSize + 20;

        this._computeLayout();
    }

    _computeLayout() {
        // 预计算每个格子的像素坐标 {x, y, w, h}
        this.cellRects = [];
        const cs = this.cellSize;
        const cn = this.cornerSize;
        const off = this.offset;

        for (let i = 0; i < 40; i++) {
            let x, y, w, h;

            if (i === 0) {
                // 起点 - 右下角
                x = this.boardSize - cn + off;
                y = this.boardSize - cn + off;
                w = cn; h = cn;
            } else if (i < 10) {
                // 底边 右→左
                x = this.boardSize - cn - i * cs + off;
                y = this.boardSize - cn + off;
                w = cs; h = cn;
            } else if (i === 10) {
                // 监狱 - 左下角
                x = off;
                y = this.boardSize - cn + off;
                w = cn; h = cn;
            } else if (i < 20) {
                // 左边 下→上
                x = off;
                y = this.boardSize - cn - (i - 10) * cs + off;
                w = cn; h = cs;
            } else if (i === 20) {
                // 免费停车 - 左上角
                x = off;
                y = off;
                w = cn; h = cn;
            } else if (i < 30) {
                // 上边 左→右
                x = cn + (i - 21) * cs + off;
                y = off;
                w = cs; h = cn;
            } else if (i === 30) {
                // 入狱 - 右上角
                x = this.boardSize - cn + off;
                y = off;
                w = cn; h = cn;
            } else {
                // 右边 上→下
                x = this.boardSize - cn + off;
                y = cn + (i - 31) * cs + off;
                w = cn; h = cs;
            }

            this.cellRects.push({ x, y, w, h });
        }
    }

    // 获取格子中心点
    getCellCenter(id) {
        const r = this.cellRects[id];
        return { x: r.x + r.w / 2, y: r.y + r.h / 2 };
    }

    // 绘制整个棋盘
    drawBoard() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // 背景
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // 中心区域
        const off = this.offset;
        const cn = this.cornerSize;
        ctx.fillStyle = '#16213e';
        ctx.fillRect(cn + off, cn + off, this.boardSize - 2 * cn, this.boardSize - 2 * cn);

        // 中心文字
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const cx = this.boardSize / 2 + off;
        ctx.fillText('大 富 翁', cx, this.boardSize / 2 + off - 30);
        ctx.font = '14px Arial';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText('MONOPOLY', cx, this.boardSize / 2 + off);

        // 绘制每个格子
        for (let i = 0; i < 40; i++) {
            this._drawCell(i);
        }
    }

    _drawCell(id) {
        const ctx = this.ctx;
        const sq = SQUARES[id];
        const r = this.cellRects[id];

        // 格子背景
        ctx.fillStyle = this._getCellBgColor(sq);
        ctx.fillRect(r.x, r.y, r.w, r.h);

        // 边框
        ctx.strokeStyle = '#4a5568';
        ctx.lineWidth = 1;
        ctx.strokeRect(r.x, r.y, r.w, r.h);

        // 高亮
        if (id === this.hoveredSquare) {
            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 2;
            ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2);
        }

        // 色带（地产/铁路/公用事业）
        if (sq.color) {
            const bandSize = 10;
            ctx.fillStyle = COLOR_GROUPS[sq.color]?.css || '#666';
            if (id >= 1 && id <= 9) {
                ctx.fillRect(r.x, r.y, r.w, bandSize); // 底边：上方色带
            } else if (id >= 11 && id <= 19) {
                ctx.fillRect(r.x + r.w - bandSize, r.y, bandSize, r.h); // 左边：右侧色带
            } else if (id >= 21 && id <= 29) {
                ctx.fillRect(r.x, r.y + r.h - bandSize, r.w, bandSize); // 上边：下方色带
            } else if (id >= 31 && id <= 39) {
                ctx.fillRect(r.x, r.y, bandSize, r.h); // 右边：左侧色带
            }
        }

        // 格子名称
        ctx.fillStyle = '#e2e8f0';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const isCorner = [0, 10, 20, 30].includes(id);
        if (isCorner) {
            ctx.font = 'bold 11px Arial';
            ctx.fillText(sq.name, r.x + r.w / 2, r.y + r.h / 2);
        } else {
            // 根据位置调整文字方向
            ctx.font = '9px Arial';
            const cx = r.x + r.w / 2;
            const cy = r.y + r.h / 2;

            if (id >= 1 && id <= 9) {
                // 底边 - 水平
                ctx.fillText(this._truncName(sq.name, 5), cx, cy + 8);
                if (sq.price) {
                    ctx.font = '8px Arial';
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText('$' + sq.price, cx, cy + 20);
                }
            } else if (id >= 11 && id <= 19) {
                // 左边 - 垂直
                ctx.save();
                ctx.translate(cx + 8, cy);
                ctx.rotate(-Math.PI / 2);
                ctx.font = '9px Arial';
                ctx.fillText(this._truncName(sq.name, 5), 0, 0);
                if (sq.price) {
                    ctx.font = '8px Arial';
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText('$' + sq.price, 0, 12);
                }
                ctx.restore();
            } else if (id >= 21 && id <= 29) {
                // 上边 - 水平
                ctx.fillText(this._truncName(sq.name, 5), cx, cy - 8);
                if (sq.price) {
                    ctx.font = '8px Arial';
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText('$' + sq.price, cx, cy - 20);
                }
            } else if (id >= 31 && id <= 39) {
                // 右边 - 垂直
                ctx.save();
                ctx.translate(cx - 8, cy);
                ctx.rotate(Math.PI / 2);
                ctx.font = '9px Arial';
                ctx.fillText(this._truncName(sq.name, 5), 0, 0);
                if (sq.price) {
                    ctx.font = '8px Arial';
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText('$' + sq.price, 0, 12);
                }
                ctx.restore();
            }
        }
    }

    _truncName(name, max) {
        return name.length > max ? name.substring(0, max) : name;
    }

    _getCellBgColor(sq) {
        switch (sq.type) {
            case 'go': return '#FFD700';
            case 'jail': return '#D2B48C';
            case 'parking': return '#90EE90';
            case 'gotojail': return '#FF6347';
            case 'chance': return '#FFA07A';
            case 'chest': return '#FFB6C1';
            case 'tax': return '#DDA0DD';
            case 'railroad': return '#555';
            case 'utility': return '#666';
            default: return '#1e293b';
        }
    }

    // 绘制玩家标记
    drawPlayers(players) {
        const ctx = this.ctx;
        for (const player of players) {
            if (player.bankrupt) continue;

            const pos = this.playerAnimPos[player.id] || player.position;
            const center = this.getCellCenter(Math.round(pos));

            // 计算偏移避免重叠
            const idx = player.id;
            const offsets = [
                { x: -10, y: -10 },
                { x: 10, y: -10 },
                { x: -10, y: 10 },
                { x: 10, y: 10 }
            ];
            const off = offsets[idx] || { x: 0, y: 0 };

            const px = center.x + off.x;
            const py = center.y + off.y;

            // 棋子阴影
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.beginPath();
            ctx.arc(px + 2, py + 2, 10, 0, Math.PI * 2);
            ctx.fill();

            // 棋子主体
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(px, py, 10, 0, Math.PI * 2);
            ctx.fill();

            // 边框
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 初始
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(player.name.charAt(0), px, py);
        }
    }

    // 绘制建筑标记
    drawBuildings(players) {
        const ctx = this.ctx;
        for (const player of players) {
            if (player.bankrupt) continue;
            for (const sid of player.properties) {
                const houses = player.getHousesOn(sid);
                if (houses <= 0) continue;

                const sq = SQUARES[sid];
                if (!sq || sq.type !== 'property') continue;

                const r = this.cellRects[sid];
                let bx, by;

                // 建筑显示在色带对面
                if (sid >= 1 && sid <= 9) {
                    bx = r.x + 6;
                    by = r.y + r.h - 14;
                } else if (sid >= 11 && sid <= 19) {
                    bx = r.x + 6;
                    by = r.y + 6;
                } else if (sid >= 21 && sid <= 29) {
                    bx = r.x + 6;
                    by = r.y + 6;
                } else if (sid >= 31 && sid <= 39) {
                    bx = r.x + r.w - 20;
                    by = r.y + 6;
                } else {
                    continue;
                }

                if (houses === 5) {
                    // 酒店 - 红色矩形
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillRect(bx, by, 14, 10);
                    ctx.strokeStyle = '#c0392b';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(bx, by, 14, 10);
                    ctx.fillStyle = '#fff';
                    ctx.font = '7px Arial';
                    ctx.textAlign = 'center';
                    ctx.fillText('H', bx + 7, by + 7);
                } else {
                    // 房屋 - 绿色小方块
                    for (let h = 0; h < houses; h++) {
                        ctx.fillStyle = '#27ae60';
                        ctx.fillRect(bx + h * 8, by, 7, 7);
                        ctx.strokeStyle = '#1e8449';
                        ctx.lineWidth = 0.5;
                        ctx.strokeRect(bx + h * 8, by, 7, 7);
                    }
                }
            }
        }
    }

    // 绘制骰子
    drawDice(d1, d2, rolling = false) {
        const ctx = this.ctx;
        const cx = this.boardSize / 2 + this.offset;
        const cy = this.boardSize / 2 + this.offset + 40;

        this._drawDie(cx - 30, cy, d1 || 1, rolling);
        this._drawDie(cx + 30, cy, d2 || 1, rolling);
    }

    _drawDie(x, y, value, rolling) {
        const ctx = this.ctx;
        const size = 24;

        ctx.fillStyle = rolling ? '#f59e0b' : '#fff';
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;

        // 圆角矩形
        const r = 4;
        ctx.beginPath();
        ctx.moveTo(x - size + r, y - size);
        ctx.arcTo(x + size, y - size, x + size, y + size, r);
        ctx.arcTo(x + size, y + size, x - size, y + size, r);
        ctx.arcTo(x - size, y + size, x - size, y - size, r);
        ctx.arcTo(x - size, y - size, x + size, y - size, r);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 点数
        if (value > 0 && value <= 6) {
            ctx.fillStyle = rolling ? '#fff' : '#333';
            const dotR = 3;
            const positions = {
                1: [[0, 0]],
                2: [[-8, -8], [8, 8]],
                3: [[-8, -8], [0, 0], [8, 8]],
                4: [[-8, -8], [8, -8], [-8, 8], [8, 8]],
                5: [[-8, -8], [8, -8], [0, 0], [-8, 8], [8, 8]],
                6: [[-8, -8], [8, -8], [-8, 0], [8, 0], [-8, 8], [8, 8]]
            };
            for (const [dx, dy] of positions[value]) {
                ctx.beginPath();
                ctx.arc(x + dx, y + dy, dotR, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // 显示消息
    showMessage(text, duration = 2000) {
        this.currentMessage = { text, timer: duration, alpha: 1 };
    }

    drawMessage() {
        if (!this.currentMessage) return;

        const ctx = this.ctx;
        const msg = this.currentMessage;
        const cx = this.boardSize / 2 + this.offset;
        const cy = this.boardSize / 2 + this.offset - 40;

        ctx.save();
        ctx.globalAlpha = Math.min(1, msg.alpha);

        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.8)';
        const textWidth = ctx.measureText(msg.text).width;
        const boxW = Math.max(200, textWidth + 40);
        ctx.beginPath();
        ctx.roundRect(cx - boxW / 2, cy - 18, boxW, 36, 8);
        ctx.fill();

        // 文字
        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(msg.text, cx, cy);

        ctx.restore();
    }

    update(dt) {
        if (this.currentMessage) {
            this.currentMessage.timer -= dt;
            if (this.currentMessage.timer < 500) {
                this.currentMessage.alpha = this.currentMessage.timer / 500;
            }
            if (this.currentMessage.timer <= 0) {
                this.currentMessage = null;
            }
        }
    }

    // 获取鼠标位置对应的格子ID
    getSquareAtPoint(mx, my) {
        for (let i = 0; i < 40; i++) {
            const r = this.cellRects[i];
            if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
                return i;
            }
        }
        return -1;
    }

    // 渲染属性提示卡
    drawPropertyCard(square, x, y) {
        const ctx = this.ctx;
        const w = 180;
        const h = 220;

        // 背景
        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 10);
        ctx.fill();

        // 色带
        if (square.color) {
            ctx.fillStyle = COLOR_GROUPS[square.color]?.css || '#666';
            ctx.fillRect(x, y, w, 30);
        }

        // 名称
        ctx.fillStyle = square.color ? '#fff' : '#e2e8f0';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(square.name, x + w / 2, y + (square.color ? 20 : 20));

        if (square.type === 'property' && square.rent) {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            const rents = square.rent;
            const labels = ['基本地租', '1栋房', '2栋房', '3栋房', '4栋房', '酒店'];
            for (let i = 0; i < rents.length; i++) {
                ctx.fillText(`${labels[i]}: $${rents[i]}`, x + 15, y + 50 + i * 20);
            }
            ctx.fillStyle = '#fbbf24';
            ctx.fillText(`购买价格: $${square.price}`, x + 15, y + 180);
            ctx.fillText(`建造成本: $${this._getBuildCostForCard(square)}`, x + 15, y + 200);
        } else if (square.type === 'railroad') {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`购买价格: $${square.price}`, x + 15, y + 50);
            ctx.fillText('1条铁路: $25', x + 15, y + 75);
            ctx.fillText('2条铁路: $50', x + 15, y + 95);
            ctx.fillText('3条铁路: $100', x + 15, y + 115);
            ctx.fillText('4条铁路: $200', x + 15, y + 135);
        } else if (square.type === 'utility') {
            ctx.fillStyle = '#94a3b8';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`购买价格: $${square.price}`, x + 15, y + 50);
            ctx.fillText('1个: 骰子点数 x4', x + 15, y + 75);
            ctx.fillText('2个: 骰子点数 x10', x + 15, y + 95);
        }
    }

    _getBuildCostForCard(square) {
        const costs = {
            brown: 50, lightblue: 50, pink: 100, orange: 100,
            red: 150, yellow: 150, green: 200, darkblue: 200
        };
        return costs[square.color] || 100;
    }

    // 渲染一帧
    render(gameState) {
        this.drawBoard();
        this.drawBuildings(gameState.players);
        this.drawPlayers(gameState.players);
        this.drawDice(gameState.dice1, gameState.dice2, gameState.diceRolling);
        this.drawMessage();
    }
}
