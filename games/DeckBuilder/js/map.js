// ============================================================
// map.js - Roguelike地图生成系统
// ============================================================

import { NODE_TYPE, GAME_CONFIG, COLORS, getEnemyPool, getElitePool, getBoss } from './config.js';

export class MapNode {
    constructor(type, row, col, floor) {
        this.type = type;
        this.row = row;
        this.col = col;
        this.floor = floor;
        this.id = `${floor}_${row}_${col}`;
        this.connections = []; // 连接到下一层的节点ID
        this.visited = false;
        this.accessible = false;
        this.enemyPool = [];
        this.isCurrentNode = false;

        // 根据类型设置敌人池
        this.setupNode();
    }

    setupNode() {
        switch (this.type) {
            case NODE_TYPE.BATTLE:
                this.enemyPool = getEnemyPool(this.floor);
                this.enemiesToSpawn = this.randomInt(1, 2);
                break;
            case NODE_TYPE.ELITE:
                this.enemyPool = getElitePool(this.floor);
                this.enemiesToSpawn = 1;
                break;
            case NODE_TYPE.BOSS:
                this.enemyPool = [getBoss(this.floor)];
                this.enemiesToSpawn = 1;
                break;
            case NODE_TYPE.EVENT:
                this.eventId = null; // 随机选择
                break;
        }
    }

    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // 获取该节点的敌人列表
    getEnemies() {
        const enemies = [];
        for (let i = 0; i < this.enemiesToSpawn; i++) {
            const idx = Math.floor(Math.random() * this.enemyPool.length);
            enemies.push(this.enemyPool[idx]);
        }
        return enemies;
    }

    // 获取节点显示信息
    getDisplayInfo() {
        switch (this.type) {
            case NODE_TYPE.BATTLE: return { emoji: '⚔️', name: '战斗', color: COLORS.NODE_BATTLE };
            case NODE_TYPE.ELITE: return { emoji: '🔥', name: '精英', color: COLORS.NODE_ELITE };
            case NODE_TYPE.BOSS: return { emoji: '💀', name: 'BOSS', color: COLORS.NODE_BOSS };
            case NODE_TYPE.SHOP: return { emoji: '🛒', name: '商店', color: COLORS.NODE_SHOP };
            case NODE_TYPE.REST: return { emoji: '🏕️', name: '休息', color: COLORS.NODE_REST };
            case NODE_TYPE.EVENT: return { emoji: '❓', name: '事件', color: COLORS.NODE_EVENT };
            case NODE_TYPE.TREASURE: return { emoji: '📦', name: '宝藏', color: COLORS.NODE_TREASURE };
            case NODE_TYPE.START: return { emoji: '🏠', name: '起点', color: COLORS.NODE_START };
            default: return { emoji: '?', name: '?', color: '#666' };
        }
    }
}

export class GameMap {
    constructor() {
        this.floors = []; // 3层
        this.currentFloor = 0;
        this.currentNode = null;
        this.visitedNodes = new Set();
    }

    // 生成完整地图
    generate() {
        this.floors = [];
        for (let floor = 0; floor < GAME_CONFIG.MAP_LAYERS; floor++) {
            this.floors.push(this.generateFloor(floor));
        }
        this.currentFloor = 0;
        this.currentNode = null;
        this.visitedNodes = new Set();

        // 标记第一层前排节点为可访问
        if (this.floors[0].length > 0) {
            this.floors[0][0].forEach(node => {
                node.accessible = true;
            });
        }

        return this.floors;
    }

    // 生成单层地图
    generateFloor(floor) {
        const rows = [];
        const rowCounts = [3, 4, 3, 4, 3]; // 5行节点

        // 生成所有行
        for (let row = 0; row < rowCounts.length; row++) {
            const nodes = [];
            const count = rowCounts[row];

            for (let col = 0; col < count; col++) {
                const type = this.getNodeType(row, col, floor, rowCounts.length);
                const node = new MapNode(type, row, col, floor);
                nodes.push(node);
            }
            rows.push(nodes);
        }

        // 建立连接
        for (let row = 0; row < rows.length - 1; row++) {
            this.connectRows(rows[row], rows[row + 1]);
        }

        // 最后一行连接到BOSS
        const bossNode = new MapNode(NODE_TYPE.BOSS, rowCounts.length, 0, floor);
        rows.push([bossNode]);
        const lastRow = rows[rows.length - 2];
        lastRow.forEach(node => {
            node.connections.push(bossNode.id);
        });

        return rows;
    }

    // 确定节点类型
    getNodeType(row, col, floor, totalRows) {
        // 第一行：普通战斗
        if (row === 0) return NODE_TYPE.BATTLE;

        // 最后一行：精英或事件
        if (row === totalRows - 1) {
            return Math.random() < 0.5 ? NODE_TYPE.ELITE : NODE_TYPE.BATTLE;
        }

        // 中间行：混合
        const rand = Math.random();
        if (rand < 0.40) return NODE_TYPE.BATTLE;
        if (rand < 0.55) return NODE_TYPE.EVENT;
        if (rand < 0.65) return NODE_TYPE.ELITE;
        if (rand < 0.75) return NODE_TYPE.SHOP;
        if (rand < 0.85) return NODE_TYPE.REST;
        return NODE_TYPE.TREASURE;
    }

    // 连接两行节点
    connectRows(row1, row2) {
        // 确保每个节点至少有一个连接
        row1.forEach((node1, i1) => {
            // 计算可能的连接目标
            const ratio = row2.length / row1.length;
            const center = i1 * ratio + ratio / 2;

            // 连接1-2个下一行节点
            const connections = [];
            const mainIdx = Math.min(Math.floor(center), row2.length - 1);
            connections.push(mainIdx);

            // 有时添加第二个连接
            if (Math.random() < 0.5) {
                if (mainIdx > 0 && Math.random() < 0.5) {
                    connections.push(mainIdx - 1);
                } else if (mainIdx < row2.length - 1) {
                    connections.push(mainIdx + 1);
                }
            }

            connections.forEach(idx => {
                if (!node1.connections.includes(row2[idx].id)) {
                    node1.connections.push(row2[idx].id);
                }
            });
        });

        // 确保下一行每个节点至少被一个上一行节点连接
        row2.forEach((node2, i2) => {
            const hasConnection = row1.some(n => n.connections.includes(node2.id));
            if (!hasConnection) {
                // 找最近的上一行节点
                const closestIdx = Math.min(Math.floor(i2 * row1.length / row2.length), row1.length - 1);
                row1[closestIdx].connections.push(node2.id);
            }
        });
    }

    // 访问节点
    visitNode(nodeId) {
        const node = this.findNode(nodeId);
        if (!node) return null;

        node.visited = true;
        node.isCurrentNode = true;
        this.visitedNodes.add(nodeId);

        // 取消前一个当前节点标记
        this.getAllNodes().forEach(n => {
            if (n.id !== nodeId) n.isCurrentNode = false;
        });

        // 更新可访问节点
        this.updateAccessibility(node);

        return node;
    }

    // 更新可访问性
    updateAccessibility(currentNode) {
        // 取消所有可访问标记
        this.getAllNodes().forEach(n => n.accessible = false);

        // 设置连接的节点为可访问
        currentNode.connections.forEach(connId => {
            const node = this.findNode(connId);
            if (node) node.accessible = true;
        });
    }

    // 查找节点
    findNode(nodeId) {
        for (const floor of this.floors) {
            for (const row of floor) {
                for (const node of row) {
                    if (node.id === nodeId) return node;
                }
            }
        }
        return null;
    }

    // 获取当前楼层所有节点
    getCurrentFloorNodes() {
        return this.floors[this.currentFloor] || [];
    }

    // 获取所有节点
    getAllNodes() {
        const nodes = [];
        this.floors.forEach(floor => {
            floor.forEach(row => {
                row.forEach(node => nodes.push(node));
            });
        });
        return nodes;
    }

    // 进入下一层
    advanceFloor() {
        if (this.currentFloor < GAME_CONFIG.MAP_LAYERS - 1) {
            this.currentFloor++;
            // 标记新层前排节点为可访问
            const firstRow = this.floors[this.currentFloor][0];
            if (firstRow) {
                firstRow.forEach(node => node.accessible = true);
            }
            return true;
        }
        return false;
    }

    // 绘制地图
    drawMap(ctx, canvasWidth, canvasHeight, hoveredNode = null) {
        const floor = this.floors[this.currentFloor];
        if (!floor) return;

        const nodeSize = 40;
        const padding = 60;
        const availH = canvasHeight - padding * 2;
        const availW = canvasWidth - padding * 2;

        // 计算节点位置
        const nodePositions = {};
        const rowGap = availH / (floor.length + 1);

        floor.forEach((row, rowIdx) => {
            const colGap = availW / (row.length + 1);
            row.forEach((node, colIdx) => {
                const x = padding + colGap * (colIdx + 1);
                const y = padding + rowGap * (rowIdx + 1);
                nodePositions[node.id] = { x, y, node };
            });
        });

        // 绘制连接线
        ctx.lineWidth = 2;
        floor.forEach(row => {
            row.forEach(node => {
                const pos = nodePositions[node.id];
                if (!pos) return;

                node.connections.forEach(connId => {
                    const targetPos = nodePositions[connId];
                    if (!targetPos) return;

                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y);

                    // 贝塞尔曲线
                    const midY = (pos.y + targetPos.y) / 2;
                    ctx.bezierCurveTo(pos.x, midY, targetPos.x, midY, targetPos.x, targetPos.y);

                    const isAccessible = node.visited && targetPos.node.accessible;
                    ctx.strokeStyle = isAccessible ? '#e74c3c' : '#4a5568';
                    ctx.lineWidth = isAccessible ? 3 : 1.5;
                    ctx.setLineDash(isAccessible ? [] : [5, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]);
                });
            });
        });

        // 绘制节点
        Object.values(nodePositions).forEach(({ x, y, node }) => {
            const info = node.getDisplayInfo();
            const isHovered = hoveredNode && hoveredNode.id === node.id;
            const size = isHovered ? nodeSize * 1.2 : nodeSize;

            // 节点阴影
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 2;

            // 节点背景圆
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);

            if (node.visited) {
                ctx.fillStyle = info.color + '80';
            } else if (node.accessible) {
                ctx.fillStyle = info.color;
            } else {
                ctx.fillStyle = '#2d3748';
            }
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.shadowOffsetY = 0;

            // 边框
            ctx.beginPath();
            ctx.arc(x, y, size / 2, 0, Math.PI * 2);
            if (node.isCurrentNode) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
            } else if (node.accessible) {
                ctx.strokeStyle = info.color;
                ctx.lineWidth = 2;
            } else if (node.visited) {
                ctx.strokeStyle = info.color + '60';
                ctx.lineWidth = 1;
            } else {
                ctx.strokeStyle = '#4a5568';
                ctx.lineWidth = 1;
            }
            ctx.stroke();

            // 节点图标
            ctx.font = `${isHovered ? 22 : 18}px serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(info.emoji, x, y);

            // 节点名称（悬停时显示）
            if (isHovered) {
                ctx.font = '12px "Microsoft YaHei", sans-serif';
                ctx.fillStyle = '#fff';
                ctx.fillText(info.name, x, y + size / 2 + 14);
            }
        });

        // 绘制楼层标题
        ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ecf0f1';
        ctx.textAlign = 'center';
        const floorNames = ['第一层', '第二层', '第三层'];
        ctx.fillText(floorNames[this.currentFloor] || `第${this.currentFloor + 1}层`, canvasWidth / 2, 30);
    }

    // 获取悬停的节点
    getNodeAtPos(x, y, canvasWidth, canvasHeight) {
        const floor = this.floors[this.currentFloor];
        if (!floor) return null;

        const nodeSize = 40;
        const padding = 60;
        const availH = canvasHeight - padding * 2;
        const availW = canvasWidth - padding * 2;
        const rowGap = availH / (floor.length + 1);

        for (let rowIdx = 0; rowIdx < floor.length; rowIdx++) {
            const colGap = availW / (floor[rowIdx].length + 1);
            for (let colIdx = 0; colIdx < floor[rowIdx].length; colIdx++) {
                const node = floor[rowIdx][colIdx];
                const nx = padding + colGap * (colIdx + 1);
                const ny = padding + rowGap * (rowIdx + 1);

                const dist = Math.sqrt((x - nx) ** 2 + (y - ny) ** 2);
                if (dist <= nodeSize / 2 + 5) {
                    return node;
                }
            }
        }
        return null;
    }
}
