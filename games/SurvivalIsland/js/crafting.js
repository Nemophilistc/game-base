// ============================================================
// crafting.js - Crafting recipes and crafting menu logic
// ============================================================

import { RECIPES, RESOURCE_NAMES, STRUCTURE_NAMES } from './config.js';

export function getAvailableRecipes(player) {
    return RECIPES.map(recipe => ({
        ...recipe,
        canCraft: player.canCraft(recipe),
        owned: recipe.type === 'tool' ? player.tools[recipe.result] : false,
    }));
}

export function formatRecipe(recipe) {
    const ingredients = Object.entries(recipe.ingredients)
        .map(([type, count]) => `${RESOURCE_NAMES[type] || STRUCTURE_NAMES[type] || type}x${count}`)
        .join(' + ');
    return `${recipe.name}: ${ingredients}`;
}

export function createCraftingMenu() {
    let visible = false;
    let selectedIndex = 0;

    function toggle() {
        visible = !visible;
        if (visible) selectedIndex = 0;
    }

    function show() { visible = true; selectedIndex = 0; }
    function hide() { visible = false; }
    function isVisible() { return visible; }

    function selectNext() {
        selectedIndex = (selectedIndex + 1) % RECIPES.length;
    }

    function selectPrev() {
        selectedIndex = (selectedIndex - 1 + RECIPES.length) % RECIPES.length;
    }

    function getSelectedIndex() { return selectedIndex; }
    function setSelectedIndex(i) { selectedIndex = i; }

    function craftSelected(player) {
        const recipe = RECIPES[selectedIndex];
        if (recipe && player.canCraft(recipe)) {
            if (recipe.type === 'structure') {
                // For structures, just craft (adds to inventory)
                return player.craft(recipe);
            }
            return player.craft(recipe);
        }
        return false;
    }

    return {
        toggle, show, hide, isVisible,
        selectNext, selectPrev,
        getSelectedIndex, setSelectedIndex,
        craftSelected,
    };
}
