// cards.js - Card definitions, deck building, hand management
import { CARD_DEFS, CARD_TYPE, GAME_CONFIG } from './config.js';

let nextId = 1;

// Create a card instance from a definition
export function createCardInstance(defId) {
  const def = CARD_DEFS.find(d => d.id === defId);
  if (!def) return null;
  const card = {
    ...def,
    uid: nextId++,
    currentHp: def.hp || 0,
    currentAtk: def.atk || 0,
    canAttack: false, // summoning sickness
    hasAttacked: false,
    buffAtk: 0,
    buffHp: 0,
  };
  return card;
}

// Build a random deck of 20 cards with good variety
export function buildDeck() {
  const deck = [];
  // Ensure we have at least: 10 creatures, 4 spells, 3 heals
  const creatures = CARD_DEFS.filter(c => c.type === CARD_TYPE.CREATURE);
  const spells = CARD_DEFS.filter(c => c.type === CARD_TYPE.SPELL);
  const heals = CARD_DEFS.filter(c => c.type === CARD_TYPE.HEAL);

  // Add 10-12 creatures
  const shuffledCreatures = shuffle([...creatures]);
  for (let i = 0; i < 11; i++) {
    deck.push(createCardInstance(shuffledCreatures[i % shuffledCreatures.length].id));
  }

  // Add 5 spells
  const shuffledSpells = shuffle([...spells]);
  for (let i = 0; i < 5; i++) {
    deck.push(createCardInstance(shuffledSpells[i % shuffledSpells.length].id));
  }

  // Add 4 heals
  const shuffledHeals = shuffle([...heals]);
  for (let i = 0; i < 4; i++) {
    deck.push(createCardInstance(shuffledHeals[i % shuffledHeals.length].id));
  }

  return shuffle(deck);
}

// Shuffle array (Fisher-Yates)
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Draw cards from deck to hand
export function drawCards(deck, hand, count) {
  const drawn = [];
  for (let i = 0; i < count && deck.length > 0 && hand.length < 10; i++) {
    const card = deck.pop();
    hand.push(card);
    drawn.push(card);
  }
  return drawn;
}

// Remove card from hand by uid
export function removeFromHand(hand, uid) {
  const idx = hand.findIndex(c => c.uid === uid);
  if (idx >= 0) return hand.splice(idx, 1)[0];
  return null;
}

// Remove card from field by uid
export function removeFromField(field, uid) {
  const idx = field.findIndex(c => c.uid === uid);
  if (idx >= 0) return field.splice(idx, 1)[0];
  return null;
}

// Check if card is a creature
export function isCreature(card) {
  return card && card.type === CARD_TYPE.CREATURE;
}

// Check if card is a spell
export function isSpell(card) {
  return card && card.type === CARD_TYPE.SPELL;
}

// Check if card is heal
export function isHeal(card) {
  return card && card.type === CARD_TYPE.HEAL;
}

// Create a specific deck for AI based on difficulty
export function buildAIDeck(difficulty) {
  const deck = buildDeck();
  // Hard difficulty gets slightly better cards
  if (difficulty === 'hard') {
    // Replace some low-cost cards with higher-cost ones
    for (let i = 0; i < 3; i++) {
      const lowIdx = deck.findIndex(c => c.cost <= 1);
      if (lowIdx >= 0) {
        const epics = CARD_DEFS.filter(c => c.rarity === 'epic' || c.rarity === 'legendary');
        const replacement = createCardInstance(epics[Math.floor(Math.random() * epics.length)].id);
        deck[lowIdx] = replacement;
      }
    }
  }
  return shuffle(deck);
}
