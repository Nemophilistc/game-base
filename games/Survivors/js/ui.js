// ============================================================
// 末日幸存者 - UI系统（HUD、升级菜单、覆盖层）
// ============================================================

import { CONFIG, game, state, UPGRADE_DEFS } from './config.js';
import { Weapon } from './weapons.js';
import { spawnParticle } from './items.js';

// ============================================================
// 升级选项应用逻辑
// ============================================================
function applyUpgrade(id) {
    const player = state.player;

    switch (id) {
        case 'sword': {
            const existing = player.weapons.find(w => w.type === 'sword');
            if (existing) existing.levelUp();
            else player.weapons.push(new Weapon('sword'));
            break;
        }
        case 'fire': {
            const existing = player.weapons.find(w => w.type === 'fire');
            if (existing) existing.levelUp();
            else player.weapons.push(new Weapon('fire'));
            break;
        }
        case 'lightning': {
            const existing = player.weapons.find(w => w.type === 'lightning');
            if (existing) existing.levelUp();
            else player.weapons.push(new Weapon('lightning'));
            break;
        }
        case 'orbit': {
            const existing = player.weapons.find(w => w.type === 'orbit');
            if (existing) existing.levelUp();
            else player.weapons.push(new Weapon('orbit'));
            break;
        }
        case 'aura': {
            const existing = player.weapons.find(w => w.type === 'aura');
            if (existing) existing.levelUp();
            else player.weapons.push(new Weapon('aura'));
            break;
        }
        case 'shield': {
            const existing = player.weapons.find(w => w.type === 'shield');
            if (existing) existing.levelUp();
            else player.weapons.push(new Weapon('shield'));
            break;
        }
        case 'maxhp':
            player.maxHp += 20;
            player.hp = Math.min(player.hp + 20, player.maxHp);
            break;
        case 'wind': {
            const existing = player.weapons.find(w => w.type === 'wind');
            if (existing) existing.levelUp();
            else player.weapons.push(new Weapon('wind'));
            break;
        }
        case 'magnet':
            CONFIG.ITEM_MAGNET_RANGE += 50;
            break;
        case 'heal':
            player.heal(player.maxHp * 0.3);
            break;
        case 'speed':
            player.speed += 0.5;
            break;
    }
}

// ============================================================
// 更新HUD
// ============================================================
export function updateHUD() {
    const player = state.player;

    document.getElementById('hp').textContent = Math.floor(player.hp);
    document.getElementById('kills').textContent = game.kills;

    const minutes = Math.floor(game.time / 3600);
    const seconds = Math.floor((game.time % 3600) / 60);
    document.getElementById('time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('level').textContent = player.level;
    document.getElementById('expFill').style.width = `${(player.exp / player.expToNext) * 100}%`;

    const weaponNames = player.weapons.map(w => w.icon).join(' ');
    document.getElementById('weapons').textContent = weaponNames || '无';
}

// ============================================================
// 升级界面
// ============================================================
export function levelUp() {
    game.state = 'levelup';
    const player = state.player;

    // 升级特效
    for (let i = 0; i < 40; i++) spawnParticle(player.x, player.y, '#ffd700', 'exp');
    for (let i = 0; i < 20; i++) spawnParticle(player.x, player.y, '#4ecdc4', 'lightning');

    game.flashColor = 'rgba(255, 215, 0, 0.3)';
    game.flashTimer = 15;
    game.shake.intensity = 5;

    document.getElementById('levelUpScreen').classList.add('active');

    const options = document.getElementById('upgradeOptions');
    options.innerHTML = '';

    const shuffled = [...UPGRADE_DEFS].sort(() => Math.random() - 0.5).slice(0, 3);
    shuffled.forEach(upgrade => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-desc">${upgrade.desc}</div>
        `;
        card.onclick = () => {
            applyUpgrade(upgrade.id);
            document.getElementById('levelUpScreen').classList.remove('active');
            game.state = 'playing';

            for (let i = 0; i < 25; i++) spawnParticle(player.x, player.y, '#4ecdc4', 'exp');

            updateHUD();
        };
        options.appendChild(card);
    });
}

// ============================================================
// 游戏结束
// ============================================================
export function gameOver() {
    game.state = 'gameover';
    const player = state.player;

    for (let i = 0; i < 50; i++) spawnParticle(player.x, player.y, '#ff6b6b', 'fire');
    for (let i = 0; i < 30; i++) spawnParticle(player.x, player.y, '#ffd700', 'lightning');
    for (let i = 0; i < 20; i++) spawnParticle(player.x, player.y, '#4ecdc4', 'exp');

    game.shake.intensity = 20;
    game.flashColor = 'rgba(255, 0, 0, 0.5)';
    game.flashTimer = 30;

    setTimeout(() => {
        document.getElementById('gameOverScreen').classList.add('active');

        const minutes = Math.floor(game.time / 3600);
        const seconds = Math.floor((game.time % 3600) / 60);
        document.getElementById('gameOverStats').innerHTML = `
            存活时间: ${minutes}:${seconds.toString().padStart(2, '0')}<br>
            击杀数量: ${game.kills}<br>
            最终等级: ${player.level}<br>
            武器数量: ${player.weapons.length}
        `;
    }, 1000);
}
