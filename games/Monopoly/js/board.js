// board.js - 棋盘系统

import { SQUARES, COLOR_GROUPS, RAILROAD_POSITIONS, UTILITY_POSITIONS, BUILDING_COSTS } from './config.js';

export class Board {
    constructor() {
        this.squares = SQUARES;
        this.colorGroups = COLOR_GROUPS;
    }

    getSquare(id) {
        return this.squares.find(s => s.id === id);
    }

    // 查找某格的所有者
    findOwner(squareId, players) {
        for (const p of players) {
            if (!p.bankrupt && p.properties.includes(squareId)) return p;
        }
        return null;
    }

    // 计算租金
    calculateRent(square, owner, diceTotal) {
        if (!square || !owner) return 0;

        if (square.type === 'railroad') {
            const owned = RAILROAD_POSITIONS.filter(pos => owner.properties.includes(pos)).length;
            return 25 * Math.pow(2, owned - 1); // 25, 50, 100, 200
        }

        if (square.type === 'utility') {
            const owned = UTILITY_POSITIONS.filter(pos => owner.properties.includes(pos)).length;
            return owned === 1 ? diceTotal * 4 : diceTotal * 10;
        }

        if (square.type === 'property') {
            const houses = owner.getHousesOn(square.id);
            if (houses === 0) {
                // 无建筑，检查是否拥有同色全部
                const group = this.colorGroups[square.color];
                if (group && owner.ownsColorGroup(group.squares)) {
                    return square.rent[0] * 2; // 同色双倍地租
                }
                return square.rent[0];
            }
            return square.rent[houses]; // rent[1]=1房 ... rent[5]=酒店
        }

        return 0;
    }

    // 获取建筑成本
    getBuildCost(square) {
        if (!square || !square.color) return 0;
        return BUILDING_COSTS[square.color] || 100;
    }

    // 检查是否可以建房
    canBuild(square, owner) {
        if (!square || square.type !== 'property' || !square.color) return false;
        if (!owner.properties.includes(square.id)) return false;

        const group = this.colorGroups[square.color];
        if (!group || !owner.ownsColorGroup(group.squares)) return false;

        const current = owner.getHousesOn(square.id);
        if (current >= 5) return false; // 已有酒店

        // 均匀建造规则：每格差不能超过1
        for (const sid of group.squares) {
            if (owner.getHousesOn(sid) < current) return false;
        }

        return true;
    }

    // 检查是否可以卖房
    canSell(square, owner) {
        if (!square || square.type !== 'property' || !square.color) return false;
        if (!owner.properties.includes(square.id)) return false;

        const current = owner.getHousesOn(square.id);
        if (current <= 0) return false;

        // 均匀拆除规则
        const group = this.colorGroups[square.color];
        if (group) {
            for (const sid of group.squares) {
                if (owner.getHousesOn(sid) > current) return false;
            }
        }

        return true;
    }

    // 获取最近的铁路/公用事业
    getNearest(fromPos, type) {
        const positions = type === 'railroad' ? RAILROAD_POSITIONS : UTILITY_POSITIONS;
        let nearest = positions[0];
        let minDist = 40;
        for (const pos of positions) {
            let dist = (pos - fromPos + 40) % 40;
            if (dist < minDist) {
                minDist = dist;
                nearest = pos;
            }
        }
        return nearest;
    }
}
