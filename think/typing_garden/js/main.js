// Entry point that wires up the UI and game logic.

import { Game } from './game.js';
import * as ui from './ui.js';
import { toggleAudio } from './audio.js';

let game;
let playing = false;

function startGame() {
  ui.showScreen('play');
  ui.hideGameOver();

  requestAnimationFrame(() => {
    playing = true;
    game.start();
  });
}

function restartGame() {
  ui.showScreen('play');
  ui.hideGameOver();

  requestAnimationFrame(() => {
    playing = true;
    game.start();
  });
}

function togglePause() {
  if (!playing) return;

  if (game.running) {
    game.pause();
    ui.showPause();
  } else {
    game.resume();
    ui.hidePause();
  }
}

function init() {
  const bestKey = 'palindromEchoBest';
  const savedBest = parseInt(localStorage.getItem(bestKey) || '0', 10);

  ui.updateBest(savedBest);
  ui.updateScore(0);
  ui.updateTier('short');
  ui.updateSoundIcon();

  const canvas = document.getElementById('game-canvas');

  game = new Game(
    canvas,
    (score) => ui.updateScore(score),
    (score, best) => {
      playing = false;
      ui.updateBest(best);
      ui.showGameOver(score, best);
    },
    (tier) => ui.updateTier(tier)
  );

  const startBtn = document.getElementById('start-btn');
  const howBtn = document.getElementById('how-btn');
  const closeHowBtn = document.getElementById('close-how');
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');
  const soundButtons = document.querySelectorAll('.sound-toggle');

  if (startBtn) {
    startBtn.addEventListener('click', startGame);
  }

  if (howBtn) {
    howBtn.addEventListener('click', () => {
      ui.showInstructions();
    });
  }

  if (closeHowBtn) {
    closeHowBtn.addEventListener('click', () => {
      ui.hideInstructions();
    });
  }

  if (pauseBtn) {
    pauseBtn.addEventListener('click', togglePause);
  }

  if (restartBtn) {
    restartBtn.addEventListener('click', restartGame);
  }

  soundButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      toggleAudio();
      ui.updateSoundIcon();
    });
  });

  window.addEventListener('keydown', (e) => {
    if (!playing) return;

    if (e.key === 'Escape') {
      togglePause();
      return;
    }

    game.handleKey(e.key);
  });
}

window.addEventListener('DOMContentLoaded', init);
