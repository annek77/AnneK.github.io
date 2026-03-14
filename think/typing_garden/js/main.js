// Entry point that wires up the UI and game logic.

import { Game } from './game.js';
import * as ui from './ui.js';
import { toggleAudio } from './audio.js';

let game;
let playing = false;

function init() {
  // Initialize high score display
  const bestKey = 'palindromEchoBest';
  const savedBest = parseInt(localStorage.getItem(bestKey) || '0');
  ui.updateBest(savedBest);
  ui.updateScore(0);
  ui.updateTier('short');
  ui.updateSoundIcon();

  const canvas = document.getElementById('game-canvas');
  game = new Game(
    canvas,
    score => ui.updateScore(score),
    (score, best) => {
      playing = false;
      ui.updateBest(best);
      ui.showGameOver(score, best);
    },
    tier => ui.updateTier(tier)
  );

  // Button events
  document.getElementById('start-btn').addEventListener('click', () => {
    ui.showScreen('play');
    ui.hideGameOver();
    playing = true;
    game.start();
  });

  document.getElementById('how-btn').addEventListener('click', () => {
    ui.showInstructions();
  });
  document.getElementById('close-how').addEventListener('click', () => {
    ui.hideInstructions();
  });

  document.getElementById('pause-btn').addEventListener('click', () => {
    if (!playing) return;
    if (game.running) {
      game.pause();
      ui.showPause();
    } else {
      game.resume();
      ui.hidePause();
    }
  });

  document.getElementById('restart-btn').addEventListener('click', () => {
    ui.showScreen('play');
    ui.hideGameOver();
    playing = true;
    game.start();
  });

  // Sound toggles
  const soundButtons = document.querySelectorAll('.sound-toggle');
  soundButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleAudio();
      ui.updateSoundIcon();
    });
  });

  // Keyboard controls
  window.addEventListener('keydown', e => {
    if (!playing) return;
    if (e.key === 'Escape') {
      // toggle pause
      if (game.running) {
        game.pause();
        ui.showPause();
      } else {
        game.resume();
        ui.hidePause();
      }
    } else {
      game.handleKey(e.key);
    }
  });
}

window.addEventListener('DOMContentLoaded', init);
