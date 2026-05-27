import { CONFIG, UPGRADES, WEAPONS } from './config.js';
import { Sound } from './sound.js';

// ============================================================
// UI管理
// ============================================================

let _game = null;
let _player = null;
let _spawnParticle = null;

export function setUIRefs(game, playerGetter, spawnParticleFn) {
    _game = game;
    _player = playerGetter;
    _spawnParticle = spawnParticleFn;
}

// ============================================================
// 武器选择界面
// ============================================================
export function showWeaponSelect() {
    Sound.init();
    document.getElementById('startScreen').classList.add('hidden');
    const ws = document.getElementById('weaponSelect');
    ws.classList.add('active');
    const cards = document.getElementById('weaponCards');
    cards.innerHTML = '';
    for (let key in WEAPONS) {
        const w = WEAPONS[key];
        const card = document.createElement('div');
        card.className = 'weapon-card';
        card.innerHTML = `<div class="weapon-icon">${w.icon}</div><div class="weapon-name">${w.name}</div><div class="weapon-desc">${w.desc}</div>`;
        card.onclick = () => {
            _game.selectedWeapon = key;
            ws.classList.remove('active');
            _game.onStartGame();
        };
        cards.appendChild(card);
    }
}

// ============================================================
// 升级界面
// ============================================================
export function levelUp() {
    _game.state = 'levelup';
    const player = _player();
    for (let i = 0; i < 30; i++) _spawnParticle(player.x, player.y, '#ffd700', 'lightning');
    _game.flashColor = 'rgba(255,215,0,0.3)'; _game.flashTimer = 15;
    Sound.play('levelup');
    document.getElementById('levelUpScreen').classList.add('active');
    const opts = document.getElementById('upgradeOptions');
    opts.innerHTML = '';
    const shuffled = [...UPGRADES].sort(() => Math.random() - 0.5).slice(0, 3);
    shuffled.forEach(u => {
        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `<div class="upgrade-icon">${u.icon}</div><div class="upgrade-name">${u.name}</div><div class="upgrade-desc">${u.desc}</div>`;
        card.onclick = () => {
            u.apply(player, _game);
            document.getElementById('levelUpScreen').classList.remove('active');
            _game.state = 'playing';
            updateHUD();
        };
        opts.appendChild(card);
    });
}

// ============================================================
// HUD更新
// ============================================================
export function updateHUD() {
    const player = _player();
    if (!player) return;
    document.getElementById('hp').textContent = Math.floor(player.hp);
    document.getElementById('score').textContent = _game.score;
    const elapsed = Math.floor((performance.now() - _game.startTime) / 1000);
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    document.getElementById('time').textContent = `${m}:${s.toString().padStart(2, '0')}`;
    document.getElementById('level').textContent = _game.level;
    document.getElementById('bombs').textContent = _game.bombs;
    document.getElementById('shield').textContent = player.shield;
    document.getElementById('weapon').textContent = WEAPONS[player.weaponType].name + ' Lv.' + player.wlv;
    const cd = document.getElementById('comboDisplay');
    if (_game.combo >= 3) {
        cd.classList.add('active');
        document.getElementById('comboCount').textContent = _game.combo;
        document.getElementById('comboMult').textContent = 'x' + _game.comboMult;
    } else {
        cd.classList.remove('active');
    }
    const pct = Math.max(0, (1 - player.dashCD / CONFIG.DASH_CD) * 100);
    document.getElementById('dashBar').style.width = pct + '%';
}

// ============================================================
// 游戏结束界面
// ============================================================
export function showGameOver() {
    document.getElementById('gameOverScreen').classList.add('active');
    const elapsed = Math.floor((performance.now() - _game.startTime) / 1000);
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    document.getElementById('gameOverStats').innerHTML =
        `存活时间: ${m}:${s.toString().padStart(2, '0')}<br>最终分数: ${_game.score}<br>最终等级: ${_game.level}<br>最高连击: ${_game.combo}`;
}

// ============================================================
// 静音切换
// ============================================================
export function toggleMute() {
    Sound.init();
    Sound.toggle();
}
