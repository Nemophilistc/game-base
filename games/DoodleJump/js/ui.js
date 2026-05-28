// UI overlays and HUD
import { CONFIG } from './config.js';

export class UI {
  constructor(canvas) {
    this.canvas = canvas;
    this.startOverlay = document.getElementById('start-overlay');
    this.gameOverOverlay = document.getElementById('gameover-overlay');
    this.hudScore = document.getElementById('hud-score');
    this.hudHeight = document.getElementById('hud-height');
    this.hudHigh = document.getElementById('hud-high');
    this.hudHp = document.getElementById('hud-hp');
    this.hudPowerup = document.getElementById('hud-powerup');
    this.finalScore = document.getElementById('final-score');
    this.finalHeight = document.getElementById('final-height');
    this.finalCoins = document.getElementById('final-coins');
    this.finalHigh = document.getElementById('final-high');
    this.newHighEl = document.getElementById('new-high');
  }

  showStart() {
    this.startOverlay.classList.add('active');
    this.gameOverOverlay.classList.remove('active');
  }

  hideStart() {
    this.startOverlay.classList.remove('active');
  }

  showGameOver(height, coins, highScore, isNewHigh) {
    this.finalScore.textContent = Math.floor(height + coins * 10);
    this.finalHeight.textContent = Math.floor(height) + ' 米';
    this.finalCoins.textContent = coins;
    this.finalHigh.textContent = Math.floor(highScore);
    this.newHighEl.style.display = isNewHigh ? 'block' : 'none';
    this.gameOverOverlay.classList.add('active');
  }

  hideGameOver() {
    this.gameOverOverlay.classList.remove('active');
  }

  updateHUD(height, coins, highScore, hp, maxHp, powerup) {
    this.hudScore.textContent = Math.floor(height + coins * 10);
    this.hudHeight.textContent = Math.floor(height) + 'm';
    this.hudHigh.textContent = Math.floor(highScore);

    // HP display
    let hpStr = '';
    for (let i = 0; i < maxHp; i++) {
      hpStr += i < hp ? '❤ ' : '♡ ';
    }
    this.hudHp.textContent = hpStr;

    // Power-up indicator
    if (powerup) {
      this.hudPowerup.textContent = powerup;
      this.hudPowerup.style.display = 'block';
    } else {
      this.hudPowerup.style.display = 'none';
    }
  }
}
