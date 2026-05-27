// ============================================================
// upgrades.js - 升级系统（15种升级选项）
// ============================================================

import { UPGRADES, XP_TABLE, WEAPONS } from './config.js';
import { sound } from './sound.js';

export class UpgradeSystem {
    constructor() {
        this.pendingLevelUps = 0;
        this.activeUpgrades = {};
        this.acquiredWeapons = new Set();
    }

    checkLevelUp(player) {
        const nextLevelXP = XP_TABLE[player.level] || (XP_TABLE[XP_TABLE.length - 1] + (player.level - XP_TABLE.length + 1) * 500);
        if (player.xp >= nextLevelXP) {
            player.xp -= nextLevelXP;
            player.level++;
            this.pendingLevelUps++;
            sound.levelUp();
            return true;
        }
        return false;
    }

    generateOptions(player, weaponSystem) {
        const options = [];
        const allWeaponIds = Object.keys(WEAPONS);
        const ownedWeapons = Object.keys(weaponSystem.weapons);

        // 可升级的武器
        const upgradableWeapons = ownedWeapons.filter(id => weaponSystem.weapons[id] < 8);

        // 可添加的新武器
        const newWeapons = allWeaponIds.filter(id => !weaponSystem.weapons[id]);

        // 属性升级
        const statUpgrades = Object.keys(UPGRADES).filter(id => {
            if (UPGRADES[id].once && this.activeUpgrades[id]) return false;
            return true;
        });

        // 混合生成3个选项
        const pool = [];

        // 新武器（优先）
        for (const id of newWeapons) {
            pool.push({
                type: 'new_weapon',
                weaponId: id,
                name: WEAPONS[id].name,
                desc: WEAPONS[id].desc,
                icon: WEAPONS[id].icon,
                color: WEAPONS[id].color,
            });
        }

        // 升级武器
        for (const id of upgradableWeapons) {
            pool.push({
                type: 'upgrade_weapon',
                weaponId: id,
                level: weaponSystem.weapons[id] + 1,
                name: `${WEAPONS[id].name} Lv${weaponSystem.weapons[id] + 1}`,
                desc: `强化${WEAPONS[id].name}`,
                icon: WEAPONS[id].icon,
                color: WEAPONS[id].color,
            });
        }

        // 属性升级
        for (const id of statUpgrades) {
            pool.push({
                type: 'stat',
                statId: id,
                name: UPGRADES[id].name,
                desc: UPGRADES[id].desc,
                icon: UPGRADES[id].icon,
                color: '#ffcc00',
            });
        }

        // 从池中随机选3个
        const shuffled = pool.sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(3, shuffled.length); i++) {
            options.push(shuffled[i]);
        }

        return options;
    }

    applyOption(option, player, weaponSystem) {
        switch (option.type) {
            case 'new_weapon':
                weaponSystem.addWeapon(option.weaponId);
                this.acquiredWeapons.add(option.weaponId);
                break;
            case 'upgrade_weapon':
                weaponSystem.addWeapon(option.weaponId);
                break;
            case 'stat':
                UPGRADES[option.statId].apply(player);
                this.activeUpgrades[option.statId] = (this.activeUpgrades[option.statId] || 0) + 1;
                break;
        }
    }
}
