import { CONFIG, initBackground } from './config.js';
import { Sound } from './sound.js';
import { Player, doDash } from './player.js';
import { Enemy, EBullet, spawnEnemy } from './enemies.js';
import { spawnParticle, addDmgNum } from './items.js';
import { showWeaponSelect, levelUp, updateHUD, showGameOver, toggleMute, setUIRefs } from './ui.js';

// ============================================================
// 游戏状态
// ============================================================
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = CONFIG.W;
canvas.height = CONFIG.H;

const game = {
    state: 'menu', time: 0, score: 0, level: 1,
    exp: 0, expToNext: CONFIG.EXP_BASE,
    bombs: 3, bombCD: 0,
    shake: { x: 0, y: 0, intensity: 0 },
    flashColor: null, flashTimer: 0,
    loopRunning: false, bossTimer: 0, difficulty: 1,
    combo: 0, comboTimer: 0, comboMult: 1,
    hitstop: 0,
    bgStars: [], bgNebulas: [],
    selectedWeapon: 'standard',
    activeEffects: {},
    paused: false,
    startTime: 0,
    // 回调钩子（由main设置）
    onGameOver: null,
    onLevelUp: null,
    onStartGame: null
};

let player = null;
let enemies = [], pBullets = [], eBullets = [];
let particles = [], expOrbs = [], powerups = [], dmgNums = [];
let keys = {};

// ============================================================
// UI引用设置
// ============================================================
setUIRefs(game, () => player, (x, y, color, type) => spawnParticle(x, y, color, type, particles));

// 回调钩子
game.onGameOver = gameOver;
game.onLevelUp = () => levelUp();
game.onStartGame = startGame;

// ============================================================
// 输入
// ============================================================
window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyB', 'ShiftLeft', 'ShiftRight'].includes(e.code))
        e.preventDefault();
    if (e.code === 'KeyB' && game.state === 'playing' && !game.paused) useBomb();
    if ((e.code === 'ShiftLeft' || e.code === 'ShiftRight') && game.state === 'playing' && !game.paused)
        doDash(player, keys, particles);
    if (e.code === 'KeyM') { Sound.init(); Sound.toggle(); }
    if ((e.code === 'KeyP' || e.code === 'Escape') && game.state === 'playing') togglePause();
    if (e.code === 'KeyR') { restartGame(); return; }
});
window.addEventListener('keyup', e => { keys[e.code] = false; });

// 按钮事件绑定
document.getElementById('muteBtn').addEventListener('click', toggleMute);
document.getElementById('restartBtn').addEventListener('click', restartGame);
document.querySelector('#startScreen .menu-btn').addEventListener('click', showWeaponSelect);
document.querySelector('#gameOverScreen .menu-btn').addEventListener('click', restartGame);

// ============================================================
// 暂停
// ============================================================
function togglePause() {
    game.paused = !game.paused;
    document.getElementById('pauseOverlay').classList.toggle('active', game.paused);
    Sound.play('pause');
}

// ============================================================
// 炸弹
// ============================================================
function useBomb() {
    if (game.bombs <= 0 || game.bombCD > 0) return;
    game.bombs--; game.bombCD = CONFIG.BOMB_CD;
    eBullets.length = 0; // 原地清空，保持deps引用同步
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].takeDamage(100)) enemies.splice(i, 1);
    }
    for (let i = 0; i < 80; i++) spawnParticle(Math.random() * CONFIG.W, Math.random() * CONFIG.H, '#ffd700', 'lightning', particles);
    game.flashColor = 'rgba(255,255,255,0.5)'; game.flashTimer = 15;
    game.shake.intensity = 15;
    Sound.play('explosion');
}

// ============================================================
// 游戏流程
// ============================================================
function startGame() {
    game.state = 'playing'; game.paused = false;
    initGame();
    if (!game.loopRunning) { game.loopRunning = true; gameLoop(); }
}

function initGame() {
    const deps = {
        pBullets, eBullets, enemies, particles, dmgNums, powerups, expOrbs,
        player: () => player
    };
    player = new Player(game, deps);
    enemies = []; pBullets = []; eBullets = [];
    particles = []; expOrbs = []; powerups = []; dmgNums = [];
    // 重新绑定deps引用（数组被重新赋值了）
    deps.pBullets = pBullets; deps.eBullets = eBullets;
    deps.enemies = enemies; deps.particles = particles;
    deps.dmgNums = dmgNums; deps.powerups = powerups;
    deps.expOrbs = expOrbs;

    game.time = 0; game.score = 0; game.level = 1; game.exp = 0;
    game.expToNext = CONFIG.EXP_BASE;
    game.bombs = 3; game.bombCD = 0; game.difficulty = 1; game.bossTimer = 0;
    game.flashColor = null; game.flashTimer = 0;
    game.shake = { x: 0, y: 0, intensity: 0 };
    game.combo = 0; game.comboTimer = 0; game.comboMult = 1; game.hitstop = 0;
    game.activeEffects = { fireRate: 0, spread: 0, tracking: 0 };
    game.paused = false;
    game.startTime = performance.now();
    initBackground(game);
    updateHUD();
}

function gameOver() {
    game.state = 'gameover';
    for (let i = 0; i < 40; i++) spawnParticle(player.x, player.y, '#ff6b6b', 'fire', particles);
    game.shake.intensity = 20;
    game.flashColor = 'rgba(255,0,0,0.5)'; game.flashTimer = 30;
    setTimeout(() => showGameOver(), 1000);
}

function restartGame() {
    document.getElementById('gameOverScreen').classList.remove('active');
    document.getElementById('pauseOverlay').classList.remove('active');
    document.getElementById('levelUpScreen').classList.remove('active');
    game.state = 'playing'; game.paused = false;
    initGame();
}

// ============================================================
// 主循环
// ============================================================
function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (game.state !== 'playing' || game.paused) return;
    if (game.hitstop > 0) { game.hitstop--; return; }

    game.time++;
    game.difficulty = 1 + game.time / 36000;
    if (game.bombCD > 0) game.bombCD--;
    if (game.comboTimer > 0) {
        game.comboTimer--;
        if (game.comboTimer <= 0) { game.combo = 0; game.comboMult = 1; }
    }

    // Boss生成
    game.bossTimer++;
    if (game.bossTimer >= CONFIG.BOSS_INTERVAL) {
        game.bossTimer = 0;
        const bossTypes = ['boss_mech', 'boss_ghost', 'boss_final'];
        let idx = game.time < 7200 ? 0 : game.time < 14400 ? 1 : Math.floor(Math.random() * 3);
        enemies.push(new Enemy(CONFIG.W / 2, -50, bossTypes[idx], game, getDeps()));
        const warn = document.getElementById('bossWarning');
        warn.classList.add('active');
        Sound.play('boss');
        setTimeout(() => warn.classList.remove('active'), 2000);
    }

    // 敌人生成
    if (game.time % Math.max(30, CONFIG.ENEMY_SPAWN_RATE - Math.floor(game.difficulty * 10)) === 0
        && enemies.filter(e => !e.type.startsWith('boss_')).length < CONFIG.MAX_ENEMIES)
        spawnEnemy(game, enemies, getDeps());

    player.update(keys);
    // 使用reverse迭代splice原地移除，保持deps引用同步
    // （enemies的die()会push到deps.enemies，必须保持同一数组对象）
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (!enemies[i].update()) enemies.splice(i, 1);
    }
    pBullets = pBullets.filter(b => b.update());
    eBullets = eBullets.filter(b => b.update(player));
    expOrbs = expOrbs.filter(o => o.update());
    powerups = powerups.filter(p => p.update());
    particles = particles.filter(p => p.update());
    dmgNums = dmgNums.filter(n => n.update());

    // ---- 渲染（带屏幕震动）----
    ctx.save();
    if (game.shake.intensity > 0) {
        game.shake.x = (Math.random() - 0.5) * game.shake.intensity;
        game.shake.y = (Math.random() - 0.5) * game.shake.intensity;
        game.shake.intensity *= 0.9;
        if (game.shake.intensity < 0.5) game.shake.intensity = 0;
        ctx.translate(game.shake.x, game.shake.y);
    }

    ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-10, -10, CONFIG.W + 20, CONFIG.H + 20);

    // 背景
    game.bgNebulas.forEach(n => {
        n.y += n.speed;
        if (n.y > CONFIG.H + n.r) { n.y = -n.r; n.x = Math.random() * CONFIG.W; }
        ctx.fillStyle = n.color; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill();
    });
    game.bgStars.forEach(s => {
        s.y += s.speed;
        if (s.y > CONFIG.H) { s.y = 0; s.x = Math.random() * CONFIG.W; }
        ctx.globalAlpha = s.alpha; ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    expOrbs.forEach(o => o.draw(ctx));
    powerups.forEach(p => p.draw(ctx));
    enemies.forEach(e => e.draw(ctx));
    pBullets.forEach(b => b.draw(ctx));
    eBullets.forEach(b => b.draw(ctx));
    player.draw(ctx);
    particles.forEach(p => p.draw(ctx));
    dmgNums.forEach(n => n.draw(ctx));

    if (game.flashTimer > 0) {
        game.flashTimer--;
        ctx.fillStyle = game.flashColor;
        ctx.fillRect(-10, -10, CONFIG.W + 20, CONFIG.H + 20);
    }

    ctx.restore();

    if (game.time % 5 === 0) updateHUD();
}

// ============================================================
// 依赖获取（每次调用返回最新数组引用）
// ============================================================
function getDeps() {
    return {
        eBullets, particles, dmgNums, powerups, expOrbs, enemies,
        player: () => player
    };
}

// ============================================================
// 启动
// ============================================================
initBackground(game);
