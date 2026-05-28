import {
    HOLE_COUNT, MOLE_TYPES,
    SPAWN_RATE_BASE, SPAWN_RATE_MIN, SPAWN_RATE_SCORE_FACTOR,
    DURATION_MIN, DURATION_SCORE_FACTOR
} from './config.js';

// 地鼠状态数组，null表示空洞
export let moles = Array(HOLE_COUNT).fill(null);

/** 重置所有地鼠（就地修改，保持引用不变） */
export function resetMoles() {
    for (let i = 0; i < HOLE_COUNT; i++) moles[i] = null;
}

/**
 * 生成一只地鼠
 * @param {number} score - 当前分数，影响普通地鼠冒出时长
 * @returns {number|null} 被选中的洞索引，无空洞时返回null
 */
export function spawnMole(score) {
    const empty = [];
    for (let i = 0; i < HOLE_COUNT; i++) {
        if (!moles[i]) empty.push(i);
    }
    if (empty.length === 0) return null;

    const idx = empty[Math.floor(Math.random() * empty.length)];
    const rand = Math.random();

    let type, duration;
    if (rand < 0.7) {
        // 70% 普通地鼠
        type = 'normal';
        duration = Math.max(DURATION_MIN, MOLE_TYPES.normal.duration - score * DURATION_SCORE_FACTOR);
    } else if (rand < 0.9) {
        // 20% 金色地鼠
        type = 'golden';
        duration = MOLE_TYPES.golden.duration;
    } else {
        // 10% 炸弹地鼠
        type = 'bomb';
        duration = MOLE_TYPES.bomb.duration;
    }

    moles[idx] = { type, upTime: performance.now(), duration };
    return idx;
}

/**
 * 计算当前生成间隔
 * @param {number} score
 * @returns {number} 毫秒
 */
export function getSpawnRate(score) {
    return Math.max(SPAWN_RATE_MIN, SPAWN_RATE_BASE - score * SPAWN_RATE_SCORE_FACTOR);
}

/**
 * 敲击地鼠，清除该洞状态
 * @param {number} idx 洞索引
 * @param {number} combo 当前连击数
 * @returns {{type:string, points:number, combo:number, maxCombo:number, sound:string, isComboMilestone:boolean}|null}
 */
export function whackMole(idx, combo, maxCombo) {
    const mole = moles[idx];
    if (!mole) return null;
    moles[idx] = null;

    if (mole.type === 'bomb') {
        return {
            type: 'bomb',
            points: MOLE_TYPES.bomb.baseScore,  // -20
            combo: 0,
            maxCombo,
            sound: 'bomb',
            isComboMilestone: false
        };
    }

    combo++;
    if (combo > maxCombo) maxCombo = combo;

    const mult = Math.min(5, 1 + Math.floor(combo / 3));
    const pts = MOLE_TYPES[mole.type].baseScore * mult;

    return {
        type: mole.type,
        points: pts,
        combo,
        maxCombo,
        sound: mole.type === 'golden' ? 'golden' : 'hit',
        isComboMilestone: combo > 0 && combo % 5 === 0
    };
}

/**
 * 自动消失过期地鼠，未命中的非炸弹地鼠会重置连击
 * @returns {boolean} 是否有非炸弹地鼠超时（需要重置连击）
 */
export function expireMoles() {
    const now = performance.now();
    let comboBroken = false;
    for (let i = 0; i < HOLE_COUNT; i++) {
        if (moles[i] && now - moles[i].upTime > moles[i].duration) {
            if (moles[i].type !== 'bomb') comboBroken = true;
            moles[i] = null;
        }
    }
    return comboBroken;
}
