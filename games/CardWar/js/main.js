// main.js - Game loop, state management, event handling
import { GAME_CONFIG, CARD_TYPE } from './config.js';

const { FIELD_CARD_WIDTH, FIELD_CARD_HEIGHT } = GAME_CONFIG;
import { Sound } from './sound.js';
import { buildDeck, buildAIDeck, drawCards, removeFromHand, removeFromField, isCreature, isSpell, isHeal, shuffle } from './cards.js';
import { executeCreatureAttack, playSpell, playHeal, removeDeadCreatures, resetCreaturesForTurn, damageFace } from './combat.js';
import { aiDecideTurn } from './ai.js';
import {
  updateAnimations, isAnimating, addAnimation,
  spawnAttackParticles, spawnSpellParticles, spawnHealParticles, spawnDeathParticles,
  addDamageNumber, addHealNumber, addBuffNumber, renderEffects, clearEffects,
  easeOutBack, easeInOutCubic, lerp
} from './effects.js';
import {
  drawCard, drawBattleScene, drawStartOverlay, drawGameOverOverlay,
  drawTooltip, getFieldLayout, getCardAtPos, setCtxRef, updateCanvasSize, drawManaBar, drawHpBar
} from './ui.js';

// --- Game State ---
let gameState = null;
let canvas, ctx;
let layout = {};
let hoveredCard = null;
let selectedCard = null; // for targeting spells
let selectedAttacker = null; // for choosing attack target
let pendingSpell = null;
let difficulty = 'medium';
let gameOverResult = null;
let gameOverBtn = null;
let startButtons = [];
let screen = 'start'; // 'start', 'battle', 'gameover'
let stats = {};
let mouseX = 0, mouseY = 0;
let aiActionQueue = [];
let aiActionTimer = 0;
let turnMessage = '';
let turnMessageTimer = 0;
let bestStreak = parseInt(localStorage.getItem('cardwar_best_streak') || '0');
let currentStreak = parseInt(localStorage.getItem('cardwar_streak') || '0');

function createPlayer() {
  return {
    hp: GAME_CONFIG.STARTING_HP,
    mana: 0,
    maxMana: 0,
    deck: [],
    hand: [],
    field: [],
  };
}

function initGame(diff) {
  difficulty = diff;
  Sound.init();

  const player = createPlayer();
  const ai = createPlayer();

  player.deck = buildDeck();
  ai.deck = buildAIDeck(difficulty);

  // Draw initial hands
  drawCards(player.deck, player.hand, GAME_CONFIG.HAND_SIZE);
  drawCards(ai.deck, ai.hand, GAME_CONFIG.HAND_SIZE);

  gameState = {
    player,
    ai,
    turn: 'player',
    phase: 'play', // 'play', 'selectTarget', 'selectAttackTarget'
    turnNumber: 0,
    gameOver: false,
  };

  stats = {
    turns: 0,
    cardsPlayed: 0,
    damageDealt: 0,
    damageTaken: 0,
  };

  selectedCard = null;
  selectedAttacker = null;
  pendingSpell = null;
  hoveredCard = null;
  aiActionQueue = [];
  aiActionTimer = 0;
  gameOverResult = null;
  gameOverBtn = null;
  screen = 'battle';

  startPlayerTurn();
}

function startPlayerTurn() {
  const { player } = gameState;
  gameState.turn = 'player';
  gameState.phase = 'play';
  gameState.turnNumber++;
  stats.turns = gameState.turnNumber;

  // Increase mana
  player.maxMana = Math.min(GAME_CONFIG.MAX_MANA, player.maxMana + 1);
  player.mana = player.maxMana;

  // Draw a card
  const drawn = drawCards(player.deck, player.hand, 1);
  if (drawn.length > 0) Sound.cardDraw();

  // Reset creatures
  resetCreaturesForTurn(player.field);

  Sound.turnStart();
  turnMessage = '你的回合';
  turnMessageTimer = 1.5;
}

function startAITurn() {
  const { ai } = gameState;
  gameState.turn = 'ai';
  gameState.phase = 'play';
  selectedCard = null;
  selectedAttacker = null;
  pendingSpell = null;

  // Increase mana
  ai.maxMana = Math.min(GAME_CONFIG.MAX_MANA, ai.maxMana + 1);
  ai.mana = ai.maxMana;

  // Draw a card
  const drawn = drawCards(ai.deck, ai.hand, 1);
  if (drawn.length > 0) Sound.cardDraw();

  // Reset creatures
  resetCreaturesForTurn(ai.field);

  turnMessage = '对手回合';
  turnMessageTimer = 1;

  // AI decides actions
  aiActionQueue = aiDecideTurn(gameState);
  aiActionTimer = 0.8; // delay before first action
}

// --- AI Action Execution ---

function executeNextAIAction() {
  if (aiActionQueue.length === 0) {
    // AI turn done
    setTimeout(() => startPlayerTurn(), 500);
    return;
  }

  const action = aiActionQueue.shift();
  const { ai, player } = gameState;

  if (action.type === 'play') {
    const card = ai.hand.find(c => c.uid === action.cardUid);
    if (!card || card.cost > ai.mana) {
      executeNextAIAction();
      return;
    }

    // Play the card
    removeFromHand(ai.hand, card.uid);
    ai.mana -= card.cost;
    stats.cardsPlayed++;

    if (isCreature(card)) {
      if (ai.field.length >= GAME_CONFIG.MAX_FIELD) {
        executeNextAIAction();
        return;
      }
      card.canAttack = false; // summoning sickness
      card.hasAttacked = false;
      ai.field.push(card);
      Sound.cardPlay();
    } else if (isSpell(card)) {
      Sound.spellCast();
      if (card.id === 'lightning' || card.id === 'inferno') {
        Sound.lightning();
      }
      if (card.target === 'single') {
        if (action.targetUid !== null) {
          const target = player.field.find(c => c.uid === action.targetUid);
          if (target) {
            const dmgResult = playSpell(card, target, player.field, player, ai);
            addDamageNumber(canvas.width / 2, canvas.height * 0.3, dmgResult.damage, '#ff4444');
            stats.damageDealt += dmgResult.damage;
            spawnSpellParticles(canvas.width / 2, canvas.height * 0.3, '#ff4444');
          }
        } else {
          // Hit face
          const faceResult = playSpell(card, null, [], player, ai);
          if (faceResult.faceDamage) {
            addDamageNumber(canvas.width / 2, 30, faceResult.faceDamage, '#ff4444');
            stats.damageDealt += faceResult.faceDamage;
            Sound.damageTaken();
            spawnSpellParticles(canvas.width / 2, 30, '#ff4444');
          }
        }
      } else if (card.target === 'all') {
        const result = playSpell(card, null, player.field, player, ai);
        spawnSpellParticles(canvas.width / 2, canvas.height * 0.35, '#ff6644');
        stats.damageDealt += result.damage * result.targets.length;
        const dead = removeDeadCreatures(player.field);
        for (const d of dead) spawnDeathParticles(canvas.width / 2, canvas.height * 0.3);
      } else if (card.target === 'friendly') {
        const target = ai.field.find(c => c.uid === action.targetUid);
        if (target) {
          playSpell(card, target, player.field, player, ai);
          addBuffNumber(canvas.width / 2, canvas.height * 0.3, card.buffAtk ? `+${card.buffAtk} ATK` : `+${card.buffHp} HP`);
        }
      }
    } else if (isHeal(card)) {
      Sound.heal();
      playHeal(card, ai);
      addHealNumber(canvas.width / 2, 40, card.healAmount);
      spawnHealParticles(canvas.width / 2, 40);
    }

    // Remove dead from both sides
    removeDeadCreatures(player.field);
    removeDeadCreatures(ai.field);

    if (checkGameOver()) return;

    aiActionTimer = 0.6;
  } else if (action.type === 'attack') {
    const attacker = ai.field.find(c => c.uid === action.attackerUid);
    if (!attacker || !attacker.canAttack) {
      executeNextAIAction();
      return;
    }

    Sound.creatureAttack();

    if (action.targetUid === null) {
      // Attack face
      const result = executeCreatureAttack(attacker, null, player.field, player);
      addDamageNumber(canvas.width / 2, canvas.height - 60, result.faceDamage, '#ff4444');
      stats.damageTaken += result.faceDamage;
      Sound.damageTaken();
      spawnAttackParticles(canvas.width / 2, canvas.height - 60);
    } else {
      // Attack creature
      const target = player.field.find(c => c.uid === action.targetUid);
      if (target) {
        const result = executeCreatureAttack(attacker, target, player.field, player);
        const tx = canvas.width / 2;
        const ty = canvas.height * 0.5;
        addDamageNumber(tx, ty, result.targetDmg, '#ff4444');
        spawnAttackParticles(tx, ty);
        if (result.attackerDmg > 0) {
          addDamageNumber(tx, ty - 20, result.attackerDmg, '#ff8844');
        }
        if (result.targetDied) {
          Sound.creatureDeath();
          spawnDeathParticles(tx, ty);
        }
        if (result.attackerDied) {
          Sound.creatureDeath();
          spawnDeathParticles(tx, ty - 30);
        }
      }
    }

    // Remove dead
    const deadPlayer = removeDeadCreatures(player.field);
    const deadAI = removeDeadCreatures(ai.field);
    for (const d of deadPlayer) spawnDeathParticles(canvas.width / 2, canvas.height * 0.5);
    for (const d of deadAI) spawnDeathParticles(canvas.width / 2, canvas.height * 0.35);

    if (checkGameOver()) return;

    aiActionTimer = 0.5;
  }
}

function checkGameOver() {
  const { player, ai } = gameState;
  if (player.hp <= 0) {
    endGame(false);
    return true;
  }
  if (ai.hp <= 0) {
    endGame(true);
    return true;
  }
  return false;
}

function endGame(won) {
  gameState.gameOver = true;
  screen = 'gameover';

  if (won) {
    currentStreak++;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
    Sound.gameWin();
  } else {
    currentStreak = 0;
    Sound.gameLose();
  }
  localStorage.setItem('cardwar_streak', currentStreak.toString());
  localStorage.setItem('cardwar_best_streak', bestStreak.toString());

  gameOverResult = won;
  stats.streak = currentStreak;
  stats.bestStreak = bestStreak;
}

// --- Event Handlers ---

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX,
    y: (e.clientY - rect.top) * scaleY,
  };
}

function handleMouseMove(e) {
  const pos = getMousePos(e);
  mouseX = pos.x;
  mouseY = pos.y;

  if (screen !== 'battle' || !gameState) return;

  const hit = getCardAtPos(pos.x, pos.y, gameState, layout);
  hoveredCard = hit ? hit.card ? hit.card.uid : null : null;
  canvas.style.cursor = hit ? 'pointer' : 'default';
}

function handleClick(e) {
  const pos = getMousePos(e);
  Sound.init();

  if (screen === 'start') {
    for (const btn of startButtons) {
      if (pos.x >= btn.x && pos.x <= btn.x + btn.w && pos.y >= btn.y && pos.y <= btn.y + btn.h) {
        Sound.click();
        initGame(btn.key);
        return;
      }
    }
    return;
  }

  if (screen === 'gameover') {
    if (gameOverBtn &&
      pos.x >= gameOverBtn.x && pos.x <= gameOverBtn.x + gameOverBtn.w &&
      pos.y >= gameOverBtn.y && pos.y <= gameOverBtn.y + gameOverBtn.h) {
      Sound.click();
      screen = 'start';
      gameOverResult = null;
      gameOverBtn = null;
    }
    return;
  }

  if (screen !== 'battle' || !gameState || gameState.gameOver) return;
  if (gameState.turn !== 'player') return;
  if (isAnimating()) return;

  const hit = getCardAtPos(pos.x, pos.y, gameState, layout);
  if (!hit) {
    // Clicked empty space - deselect
    selectedCard = null;
    selectedAttacker = null;
    pendingSpell = null;
    gameState.phase = 'play';
    return;
  }

  // --- Handle End Turn ---
  if (hit.zone === 'endTurn') {
    Sound.click();
    selectedCard = null;
    selectedAttacker = null;
    pendingSpell = null;
    startAITurn();
    return;
  }

  // --- Select Attack Target ---
  if (gameState.phase === 'selectAttackTarget') {
    if (hit.zone === 'aiField') {
      // Attack this creature
      executePlayerAttack(selectedAttacker, hit.card);
      return;
    }
    if (hit.zone === 'aiFace') {
      // Attack face
      executePlayerAttack(selectedAttacker, null);
      return;
    }
    // Cancel
    gameState.phase = 'play';
    selectedAttacker = null;
    return;
  }

  // --- Select Spell Target ---
  if (gameState.phase === 'selectTarget') {
    if (pendingSpell.target === 'single') {
      if (hit.zone === 'aiField') {
        executePlayerSpell(pendingSpell, hit.card);
        return;
      }
      if (hit.zone === 'aiFace') {
        executePlayerSpell(pendingSpell, null);
        return;
      }
    } else if (pendingSpell.target === 'friendly') {
      if (hit.zone === 'playerField') {
        executePlayerSpell(pendingSpell, hit.card);
        return;
      }
    }
    // Cancel
    gameState.phase = 'play';
    selectedCard = null;
    pendingSpell = null;
    return;
  }

  // --- Play from hand ---
  if (hit.zone === 'hand') {
    const card = hit.card;
    if (card.cost > gameState.player.mana) return; // Can't afford

    if (isCreature(card)) {
      if (gameState.player.field.length >= GAME_CONFIG.MAX_FIELD) return; // Field full
      playCreatureCard(card);
    } else if (isSpell(card)) {
      if (card.target === 'all') {
        executePlayerSpell(card, null);
      } else if (card.target === 'single' || card.target === 'friendly') {
        // Need target selection
        selectedCard = card.uid;
        pendingSpell = card;
        gameState.phase = 'selectTarget';
      }
    } else if (isHeal(card)) {
      executePlayerHeal(card);
    }
    return;
  }

  // --- Select creature to attack with ---
  if (hit.zone === 'playerField') {
    const creature = hit.card;
    if (creature.canAttack && !creature.hasAttacked) {
      selectedAttacker = creature.uid;
      gameState.phase = 'selectAttackTarget';
      Sound.click();
    }
    return;
  }
}

function playCreatureCard(card) {
  const { player } = gameState;
  removeFromHand(player.hand, card.uid);
  player.mana -= card.cost;
  stats.cardsPlayed++;

  card.canAttack = false; // summoning sickness
  card.hasAttacked = false;
  player.field.push(card);
  Sound.cardPlay();
}

function executePlayerAttack(attackerUid, target) {
  const { player, ai } = gameState;
  const attacker = player.field.find(c => c.uid === attackerUid);
  if (!attacker) return;

  Sound.creatureAttack();

  if (target === null) {
    // Attack face
    const result = executeCreatureAttack(attacker, null, ai.field, ai);
    addDamageNumber(canvas.width / 2, 30, result.faceDamage, '#ff4444');
    stats.damageDealt += result.faceDamage;
    Sound.damageTaken();
    spawnAttackParticles(canvas.width / 2, 30);
  } else {
    // Attack creature
    const result = executeCreatureAttack(attacker, target, ai.field, ai);
    const ty = layout.aiField.y + FIELD_CARD_HEIGHT / 2;
    addDamageNumber(canvas.width / 2, ty, result.targetDmg, '#ff4444');
    spawnAttackParticles(canvas.width / 2, ty);
    if (result.attackerDmg > 0) {
      addDamageNumber(canvas.width / 2, layout.playerField.y + FIELD_CARD_HEIGHT / 2, result.attackerDmg, '#ff8844');
    }
    if (result.targetDied) {
      Sound.creatureDeath();
      spawnDeathParticles(canvas.width / 2, ty);
    }
    if (result.attackerDied) {
      Sound.creatureDeath();
      spawnDeathParticles(canvas.width / 2, layout.playerField.y + FIELD_CARD_HEIGHT / 2);
    }
  }

  // Remove dead
  removeDeadCreatures(player.field);
  removeDeadCreatures(ai.field);

  selectedAttacker = null;
  gameState.phase = 'play';

  checkGameOver();
}

function executePlayerSpell(card, target) {
  const { player, ai } = gameState;

  removeFromHand(player.hand, card.uid);
  player.mana -= card.cost;
  stats.cardsPlayed++;

  Sound.spellCast();
  if (card.id === 'lightning' || card.id === 'inferno') Sound.lightning();

  if (card.target === 'single') {
    if (target === null) {
      // Hit face
      damageFace(ai, card.damage);
      addDamageNumber(canvas.width / 2, 30, card.damage, '#ff4444');
      stats.damageDealt += card.damage;
      Sound.damageTaken();
      spawnSpellParticles(canvas.width / 2, 30, '#ff4444');
    } else {
      const died = target.currentHp <= card.damage;
      target.currentHp -= card.damage;
      addDamageNumber(canvas.width / 2, layout.aiField.y + FIELD_CARD_HEIGHT / 2, card.damage, '#ff4444');
      stats.damageDealt += card.damage;
      spawnSpellParticles(canvas.width / 2, layout.aiField.y + FIELD_CARD_HEIGHT / 2, '#ff6644');
      if (died) {
        Sound.creatureDeath();
        spawnDeathParticles(canvas.width / 2, layout.aiField.y + FIELD_CARD_HEIGHT / 2);
      }
    }
  } else if (card.target === 'all') {
    let totalDmg = 0;
    for (const creature of [...ai.field]) {
      creature.currentHp -= card.damage;
      totalDmg += card.damage;
      spawnSpellParticles(canvas.width / 2, layout.aiField.y + FIELD_CARD_HEIGHT / 2, '#ff6644');
    }
    stats.damageDealt += totalDmg;
  } else if (card.target === 'friendly' && target) {
    if (card.buffAtk) {
      target.currentAtk += card.buffAtk;
      target.buffAtk += card.buffAtk;
    }
    if (card.buffHp) {
      target.currentHp += card.buffHp;
      target.buffHp += card.buffHp;
    }
    const tx = layout.playerField.startX + player.field.indexOf(target) * layout.playerField.gap + FIELD_CARD_WIDTH / 2;
    addBuffNumber(tx, layout.playerField.y, card.buffAtk ? `+${card.buffAtk} ATK` : `+${card.buffHp} HP`);
    spawnSpellParticles(tx, layout.playerField.y + FIELD_CARD_HEIGHT / 2, '#44ff88');
  }

  // Remove dead
  removeDeadCreatures(ai.field);
  removeDeadCreatures(player.field);

  selectedCard = null;
  pendingSpell = null;
  gameState.phase = 'play';

  checkGameOver();
}

function executePlayerHeal(card) {
  const { player } = gameState;
  removeFromHand(player.hand, card.uid);
  player.mana -= card.cost;
  stats.cardsPlayed++;

  Sound.heal();
  const oldHp = player.hp;
  player.hp = Math.min(GAME_CONFIG.STARTING_HP + 10, player.hp + card.healAmount);
  const healed = player.hp - oldHp;
  addHealNumber(canvas.width / 2, canvas.height - 60, healed);
  spawnHealParticles(canvas.width / 2, canvas.height - 60);
}

// --- Game Loop ---

let lastTime = 0;

function gameLoop(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.05);
  lastTime = timestamp;

  // Update
  updateAnimations(dt);

  if (turnMessageTimer > 0) {
    turnMessageTimer -= dt;
  }

  // AI action timer
  if (screen === 'battle' && gameState && gameState.turn === 'ai' && !gameState.gameOver && !isAnimating()) {
    aiActionTimer -= dt;
    if (aiActionTimer <= 0) {
      executeNextAIAction();
    }
  }

  // Render
  if (screen === 'start') {
    startButtons = drawStartOverlay(ctx);
  } else if (screen === 'battle' && gameState) {
    drawBattleScene(ctx, gameState, layout, hoveredCard, selectedCard, selectedAttacker, pendingSpell);
    renderEffects(ctx);

    // Draw tooltip for hovered card
    if (hoveredCard && gameState.turn === 'player') {
      const allCards = [
        ...gameState.player.hand,
        ...gameState.player.field,
        ...gameState.ai.field,
      ];
      const card = allCards.find(c => c.uid === hoveredCard);
      if (card) {
        drawTooltip(ctx, card, mouseX + 15, mouseY);
      }
    }

    // Turn message
    if (turnMessageTimer > 0) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, turnMessageTimer);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 28px Arial';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000';
      ctx.shadowBlur = 10;
      ctx.fillText(turnMessage, canvas.width / 2, canvas.height * 0.45 - 20);
      ctx.restore();
    }
  } else if (screen === 'gameover') {
    // Draw battle scene underneath
    drawBattleScene(ctx, gameState, layout, null, null, null, null);
    renderEffects(ctx);
    gameOverBtn = drawGameOverOverlay(ctx, gameOverResult, stats);
  }

  requestAnimationFrame(gameLoop);
}

// --- Initialization ---

function resizeCanvas() {
  const container = canvas.parentElement;
  canvas.width = container.clientWidth;
  canvas.height = container.clientHeight;
  layout = getFieldLayout(canvas.width, canvas.height);
  updateCanvasSize(canvas.width, canvas.height);
}

export function startGame() {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');
  setCtxRef(ctx);

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  canvas.addEventListener('mousemove', handleMouseMove);
  canvas.addEventListener('click', handleClick);

  // Prevent context menu
  canvas.addEventListener('contextmenu', e => e.preventDefault());

  screen = 'start';
  lastTime = performance.now();
  requestAnimationFrame(gameLoop);
}

// Expose to window
window.startGame = startGame;
