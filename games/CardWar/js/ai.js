// ai.js - AI opponent card play strategy
import { CARD_TYPE } from './config.js';
import { isCreature, isSpell, isHeal } from './cards.js';
import { totalFieldDamage, evaluateBoard } from './combat.js';

// AI decides what plays to make this turn
// Returns array of actions: { type: 'play'|'attack', cardUid, targetUid, attackTargetUid }
export function aiDecideTurn(gameState) {
  const { ai, player, difficulty } = gameState;
  const actions = [];

  // Phase 1: Decide which cards to play
  const playActions = aiDecidePlays(gameState);
  actions.push(...playActions);

  // Phase 2: Decide attack targets
  const attackActions = aiDecideAttacks(gameState);
  actions.push(...attackActions);

  return actions;
}

// Decide card plays
function aiDecidePlays(gameState) {
  const { ai, player, difficulty } = gameState;
  const plays = [];
  let availableMana = ai.mana;
  const hand = [...ai.hand];
  const field = ai.field;

  // Sort hand by priority based on difficulty
  const prioritized = prioritizeHand(hand, gameState, difficulty);

  for (const card of prioritized) {
    if (card.cost > availableMana) continue;
    if (isCreature(card) && field.length >= 3) continue;

    // Decide target for targeted spells
    let target = null;
    if (isSpell(card)) {
      if (card.target === 'single') {
        target = aiChooseSpellTarget(card, gameState);
        if (target === undefined) continue; // No good target
      } else if (card.target === 'friendly') {
        target = aiChooseBuffTarget(card, gameState);
        if (!target) continue; // No friendly creature to buff
      }
    }

    // For heal, check if AI needs healing
    if (isHeal(card)) {
      if (ai.hp > 20 && difficulty !== 'easy') continue; // Don't waste heals at high HP
      if (ai.hp > 25 && difficulty === 'easy') continue;
    }

    plays.push({
      type: 'play',
      cardUid: card.uid,
      targetUid: target ? target.uid : null,
    });
    availableMana -= card.cost;

    // Remove from simulated hand
    const idx = hand.findIndex(c => c.uid === card.uid);
    if (idx >= 0) hand.splice(idx, 1);
  }

  return plays;
}

// Prioritize hand cards for playing
function prioritizeHand(hand, gameState, difficulty) {
  const sorted = [...hand];

  if (difficulty === 'easy') {
    // Random order
    for (let i = sorted.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
    }
    return sorted;
  }

  sorted.sort((a, b) => {
    const scoreA = cardPlayScore(a, gameState);
    const scoreB = cardPlayScore(b, gameState);
    return scoreB - scoreA;
  });

  return sorted;
}

// Score a card for playing (higher = better)
function cardPlayScore(card, gameState) {
  const { ai, player } = gameState;

  if (isCreature(card)) {
    let score = card.currentAtk + card.currentHp;
    // Prefer filling the board
    if (ai.field.length < 2) score += 3;
    // Prefer higher cost cards if we have the mana
    score += card.cost * 0.5;
    return score;
  }

  if (isSpell(card)) {
    if (card.target === 'all') {
      // AOE is great when opponent has multiple creatures
      const killCount = player.field.filter(c => c.currentHp <= card.damage).length;
      return killCount * 4 + card.damage;
    }
    if (card.target === 'single') {
      // Good if we can kill a high-value target
      const bestTarget = player.field.reduce((best, c) => {
        const value = c.currentAtk + c.currentHp;
        return value > best ? value : best;
      }, 0);
      return bestTarget > 0 ? bestTarget + card.damage : 2;
    }
    if (card.target === 'friendly') {
      // Buff is good if we have creatures
      if (ai.field.length === 0) return -1;
      return 3 + (card.buffAtk || 0) + (card.buffHp || 0);
    }
  }

  if (isHeal(card)) {
    const hpMissing = gameState.ai.hp < 20 ? (20 - gameState.ai.hp) * 0.8 : 0;
    return hpMissing + card.healAmount * 0.3;
  }

  return 0;
}

// Choose target for single-target damage spell
function aiChooseSpellTarget(card, gameState) {
  const { player, ai, difficulty } = gameState;
  const enemies = player.field;

  if (enemies.length === 0) {
    // No creatures, go face
    return null; // null = face
  }

  if (difficulty === 'easy') {
    // Random target or face
    if (Math.random() < 0.3) return null;
    return enemies[Math.floor(Math.random() * enemies.length)];
  }

  // Medium/Hard: prioritize killing blows
  const canKill = enemies.filter(c => c.currentHp <= card.damage);
  if (canKill.length > 0) {
    // Kill the highest ATK one
    canKill.sort((a, b) => b.currentAtk - a.currentAtk);
    return canKill[0];
  }

  // Otherwise hit highest threat
  enemies.sort((a, b) => (b.currentAtk + b.currentHp) - (a.currentAtk + a.currentHp));
  return enemies[0];
}

// Choose friendly creature to buff
function aiChooseBuffTarget(card, gameState) {
  const { ai, difficulty } = gameState;
  if (ai.field.length === 0) return null;

  if (difficulty === 'easy') {
    return ai.field[Math.floor(Math.random() * ai.field.length)];
  }

  // Prefer buffing creature with highest ATK (for +atk) or lowest HP (for +hp)
  if (card.buffAtk) {
    ai.field.sort((a, b) => b.currentAtk - a.currentAtk);
    return ai.field[0];
  }
  if (card.buffHp) {
    ai.field.sort((a, b) => a.currentHp - b.currentHp);
    return ai.field[0];
  }
  return ai.field[0];
}

// Decide attack targets
function aiDecideAttacks(gameState) {
  const { ai, player, difficulty } = gameState;
  const attacks = [];
  const attackers = ai.field.filter(c => c.canAttack && !c.hasAttacked);
  const enemies = player.field;

  for (const attacker of attackers) {
    const target = aiChooseAttackTarget(attacker, enemies, gameState);
    attacks.push({
      type: 'attack',
      attackerUid: attacker.uid,
      targetUid: target ? target.uid : null, // null = face
    });
  }

  return attacks;
}

// Choose what a creature should attack
function aiChooseAttackTarget(attacker, enemies, gameState) {
  const { player, ai, difficulty } = gameState;

  if (enemies.length === 0) {
    return null; // Go face
  }

  if (difficulty === 'easy') {
    // 50% face, 50% random creature
    if (Math.random() < 0.5) return null;
    return enemies[Math.floor(Math.random() * enemies.length)];
  }

  // Medium/Hard: evaluate trades
  const aliveEnemies = enemies.filter(e => e.currentHp > 0);

  // Can we kill something without dying?
  const goodTrades = aliveEnemies.filter(e =>
    e.currentHp <= attacker.currentAtk && e.currentAtk < attacker.currentHp
  );

  if (goodTrades.length > 0) {
    // Kill the most valuable one
    goodTrades.sort((a, b) => (b.currentAtk + b.currentHp) - (a.currentAtk + a.currentHp));
    return goodTrades[0];
  }

  // Can we kill something (even if we die)?
  const canKill = aliveEnemies.filter(e => e.currentHp <= attacker.currentAtk);
  if (canKill.length > 0 && difficulty === 'hard') {
    // Kill highest value
    canKill.sort((a, b) => (b.currentAtk + b.currentHp) - (a.currentAtk + a.currentHp));
    return canKill[0];
  }

  // Check if we should go face
  const totalDmg = totalFieldDamage(ai.field);
  if (totalDmg >= player.hp) {
    // Lethal! Go face
    return null;
  }

  if (difficulty === 'hard') {
    // Check if clearing a specific enemy is valuable
    const threats = aliveEnemies.filter(e => e.currentAtk >= 3);
    if (threats.length > 0) {
      threats.sort((a, b) => b.currentAtk - a.currentAtk);
      return threats[0];
    }
  }

  // Default: go face if no good trades
  if (attacker.currentAtk >= 2 || enemies.length === 0) {
    return null;
  }

  // Hit lowest HP enemy
  aliveEnemies.sort((a, b) => a.currentHp - b.currentHp);
  return aliveEnemies[0];
}
