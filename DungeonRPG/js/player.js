// ============================================
// player.js - 玩家角色系统
// ============================================

import { CLASSES, XP_TABLE, WEAPONS, ARMORS, RINGS, SKILLS, TILE, FOV_RADIUS } from './config.js';
import { createItem, useConsumable, getItemDesc, getItemStats } from './items.js';

export function createPlayer(classId, x, y) {
  const cls = CLASSES[classId];
  if (!cls) return null;

  const player = {
    // 基本信息
    name: cls.name,
    classId,
    char: '@',
    color: '#ffd700',

    // 位置
    x, y,

    // 基础属性
    str: cls.str,
    agi: cls.agi,
    con: cls.con,
    int: cls.int,

    // 生命和魔力
    hp: cls.hp,
    maxHp: cls.hp,
    mp: cls.mp,
    maxMp: cls.mp,

    // 战斗属性 (由属性计算)
    atk: 0,
    def: 0,

    // 等级和经验
    level: 1,
    xp: 0,
    xpToNext: XP_TABLE[1] || 20,

    // 属性点
    statPoints: 0,

    // 装备
    equipment: {
      weapon: null,
      armor: null,
      ring: null,
    },

    // 背包 (最多20格)
    inventory: [],
    maxInventory: 20,

    // Buff/debuff
    buffs: [],
    poison: 0,

    // 技能冷却
    skillCooldowns: {},

    // 视野
    fovRadius: FOV_RADIUS,

    // 统计
    kills: 0,
    steps: 0,
    floorsCleared: 0,

    // 状态
    alive: true,

    // 回合数
    turn: 0,

    // 初始装备
    init() {
      // 给初始装备
      if (cls.weapon) {
        const weapon = createItem(cls.weapon, -1, -1);
        if (weapon) this.equipItem(weapon);
      }
      if (cls.armor) {
        const armor = createItem(cls.armor, -1, -1);
        if (armor) this.equipItem(armor);
      }
      // 给初始药水
      const potion = createItem('hp_potion_small', -1, -1);
      if (potion) this.inventory.push(potion);
      const potion2 = createItem('hp_potion_small', -1, -1);
      if (potion2) this.inventory.push(potion2);

      this.recalcStats();
    },

    // 重新计算战斗属性
    recalcStats() {
      let totalAtk = Math.floor(this.str * 0.8);
      let totalDef = Math.floor(this.con * 0.5);

      // 装备加成
      if (this.equipment.weapon) totalAtk += this.equipment.weapon.atk || 0;
      if (this.equipment.armor) totalDef += this.equipment.armor.def || 0;
      if (this.equipment.ring) {
        const ring = this.equipment.ring;
        if (ring.def) totalDef += ring.def;
      }

      this.atk = totalAtk;
      this.def = totalDef;
    },

    // 装备物品
    equipItem(item) {
      const slot = item.slot;
      if (!slot) return false;

      // 卸下旧装备
      if (this.equipment[slot]) {
        this.inventory.push(this.equipment[slot]);
      }

      // 装备新物品
      this.equipment[slot] = item;

      // 从背包移除
      const idx = this.inventory.indexOf(item);
      if (idx >= 0) this.inventory.splice(idx, 1);

      // 应用戒指属性
      if (slot === 'ring') {
        if (item.str) this.str += item.str;
        if (item.agi) this.agi += item.agi;
        if (item.con) this.con += item.con;
        if (item.int) this.int += item.int;
      }

      this.recalcStats();
      return true;
    },

    // 卸下装备
    unequipItem(slot) {
      if (!this.equipment[slot]) return false;
      if (this.inventory.length >= this.maxInventory) return false;

      const item = this.equipment[slot];
      this.equipment[slot] = null;

      // 移除戒指属性
      if (slot === 'ring') {
        if (item.str) this.str -= item.str;
        if (item.agi) this.agi -= item.agi;
        if (item.con) this.con -= item.con;
        if (item.int) this.int -= item.int;
      }

      this.inventory.push(item);
      this.recalcStats();
      return true;
    },

    // 使用背包物品
    useItem(index, enemies, map, log) {
      if (index < 0 || index >= this.inventory.length) return false;
      const item = this.inventory[index];

      if (item.type === 'consumable') {
        const result = useConsumable(item, this, enemies, map, log);
        if (result) {
          this.inventory.splice(index, 1);
          return result;
        }
      } else if (item.slot) {
        // 装备类物品
        this.equipItem(item);
        log(`装备了${item.name}！`, 'equip');
        return true;
      }

      return false;
    },

    // 丢弃物品
    dropItem(index) {
      if (index < 0 || index >= this.inventory.length) return null;
      return this.inventory.splice(index, 1)[0];
    },

    // 获得经验值
    gainXP(amount, log) {
      this.xp += amount;
      while (this.xp >= this.xpToNext) {
        this.levelUp(log);
      }
    },

    // 升级
    levelUp(log) {
      this.level++;
      this.xp -= this.xpToNext;
      this.xpToNext = XP_TABLE[this.level] || (this.xpToNext * 1.5);

      // 属性成长
      const hpGain = 5 + Math.floor(this.con * 0.5);
      const mpGain = 2 + Math.floor(this.int * 0.3);
      this.maxHp += hpGain;
      this.maxMp += mpGain;
      this.hp = this.maxHp; // 升级回满
      this.mp = this.maxMp;

      this.statPoints += 2;

      if (log) {
        log(`升级！达到等级${this.level}！HP+${hpGain} MP+${mpGain} 获得2属性点`, 'levelup');
      }
    },

    // 分配属性点
    addStat(stat) {
      if (this.statPoints <= 0) return false;
      this[stat]++;
      this.statPoints--;
      this.recalcStats();

      // 体质加血量
      if (stat === 'con') {
        this.maxHp += 3;
        this.hp += 3;
      }
      // 智力加魔力
      if (stat === 'int') {
        this.maxMp += 2;
        this.mp += 2;
      }

      return true;
    },

    // 受到伤害
    takeDamage(amount, log) {
      const actualDmg = Math.max(1, amount - this.def);
      this.hp -= actualDmg;
      if (this.hp <= 0) {
        this.hp = 0;
        this.alive = false;
      }
      return actualDmg;
    },

    // 治疗
    heal(amount) {
      const healed = Math.min(amount, this.maxHp - this.hp);
      this.hp += healed;
      return healed;
    },

    // 获取技能列表
    getSkills() {
      const skills = [];
      if (this.classId === 'warrior') {
        skills.push(SKILLS.power_strike, SKILLS.whirlwind);
      } else if (this.classId === 'rogue') {
        skills.push(SKILLS.stealth, SKILLS.power_strike);
      } else if (this.classId === 'mage') {
        skills.push(SKILLS.fireball, SKILLS.heal);
      } else if (this.classId === 'ranger') {
        skills.push(SKILLS.arrow_rain, SKILLS.stealth);
      }
      return skills;
    },

    // 使用技能
    useSkill(skillIndex, target, enemies, log) {
      const skills = this.getSkills();
      if (skillIndex < 0 || skillIndex >= skills.length) return false;

      const skill = skills[skillIndex];
      const cooldownKey = skill.name;

      // 检查冷却
      if (this.skillCooldowns[cooldownKey] > 0) {
        if (log) log(`${skill.name}还在冷却中(${this.skillCooldowns[cooldownKey]}回合)`, 'info');
        return false;
      }

      // 检查魔力
      if (this.mp < skill.mp) {
        if (log) log(`魔力不足！需要${skill.mp}MP`, 'info');
        return false;
      }

      this.mp -= skill.mp;
      this.skillCooldowns[cooldownKey] = skill.cooldown;

      // 执行技能效果
      if (skill.type === 'attack' && target) {
        const damage = Math.floor(this.atk * skill.mult);
        const actualDmg = Math.max(1, damage - target.def);
        target.hp -= actualDmg;
        if (log) log(`使用${skill.name}，对${target.name}造成${actualDmg}点伤害！`, 'attack');
        return true;
      }

      if (skill.type === 'heal') {
        const healed = this.heal(skill.amount + Math.floor(this.int * 0.5));
        if (log) log(`使用${skill.name}，恢复${healed}点生命！`, 'heal');
        return true;
      }

      if (skill.type === 'magic' && target) {
        const damage = skill.damage + Math.floor(this.int * 1.2);
        const actualDmg = Math.max(1, damage - Math.floor(target.def * 0.3));
        target.hp -= actualDmg;
        if (log) log(`使用${skill.name}，对${target.name}造成${actualDmg}点魔法伤害！`, 'magic');
        return true;
      }

      if (skill.type === 'buff') {
        this.buffs.push({ stat: 'stealth', value: 1, duration: skill.duration || 5 });
        if (log) log(`使用${skill.name}，进入隐身状态${skill.duration}回合！`, 'buff');
        return true;
      }

      if (skill.type === 'aoe') {
        let totalDamage = 0;
        const range = skill.range || 2;
        for (const enemy of enemies) {
          const dist = Math.abs(enemy.x - this.x) + Math.abs(enemy.y - this.y);
          if (dist <= range) {
            const damage = skill.mult ? Math.floor(this.atk * skill.mult) : skill.damage;
            const actualDmg = Math.max(1, damage - enemy.def);
            enemy.hp -= actualDmg;
            totalDamage += actualDmg;
            if (log) log(`${skill.name}对${enemy.name}造成${actualDmg}点伤害！`, 'attack');
          }
        }
        if (totalDamage === 0 && log) {
          log(`${skill.name}没有命中任何敌人`, 'info');
        }
        return true;
      }

      return false;
    },

    // 更新buff
    updateBuffs(log) {
      for (let i = this.buffs.length - 1; i >= 0; i--) {
        this.buffs[i].duration--;
        if (this.buffs[i].duration <= 0) {
          const buff = this.buffs[i];
          if (buff.stat === 'str') this.str -= buff.value;
          if (buff.stat === 'agi') this.agi -= buff.value;
          if (buff.stat === 'stealth') {
            if (log) log('隐身效果消失了', 'info');
          }
          this.buffs.splice(i, 1);
          this.recalcStats();
        }
      }

      // 中毒
      if (this.poison > 0) {
        this.hp -= this.poison;
        this.poison--;
        if (log) log(`中毒！受到${this.poison}点伤害`, 'damage');
        if (this.hp <= 0) {
          this.hp = 0;
          this.alive = false;
        }
      }

      // 技能冷却
      for (const key in this.skillCooldowns) {
        if (this.skillCooldowns[key] > 0) {
          this.skillCooldowns[key]--;
        }
      }
    },

    // 是否隐身
    isStealthed() {
      return this.buffs.some(b => b.stat === 'stealth');
    },

    // 总属性显示
    getTotalStat(stat) {
      let total = this[stat];
      if (this.equipment.ring) {
        total += this.equipment.ring[stat] || 0;
      }
      return total;
    },
  };

  player.init();
  return player;
}
