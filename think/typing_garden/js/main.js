// Entry point that wires up the UI and game logic.

import { Game } from './game.js';
import * as ui from './ui.js';
import { toggleAudio } from './audio.js';

let game = null;
let playing = false;

function setSoundVisualState(isOn) {
  document.body.classList.toggle('sound-is-off', !isOn);

  if (typeof ui.updateSoundIcon === 'function') {
    ui.updateSoundIcon();
  }
}

function startGame() {
  if (!game) return;

  ui.showScreen('play');
  ui.hideGameOver();
  ui.hideInstructions?.();

  requestAnimationFrame(() => {
    playing = true;
    game.start();
    ui.hidePause?.();
  });
}

function restartGame() {
  if (!game) return;

  ui.showScreen('play');
  ui.hideGameOver();

  requestAnimationFrame(() => {
    playing = true;
    game.start();
    ui.hidePause?.();
  });
}

function togglePause() {
  if (!game || !playing) return;

  if (game.running) {
    game.pause();
    ui.showPause?.();
  } else {
    game.resume();
    ui.hidePause?.();
  }
}

function init() {
  const bestKey = 'palindromEchoBest';
  const savedBest = parseInt(localStorage.getItem(bestKey) || '0', 10);

  ui.updateScore?.(0);
  ui.updateBest?.(savedBest);
  ui.updateTier?.('short');

  const canvas = document.getElementById('game-canvas');
  if (!canvas) {
    console.error('Canvas element #game-canvas not found.');
    return;
  }

  game = new Game(
    canvas,
    (score) => {
      ui.updateScore?.(score);
    },
    (score, best) => {
      playing = false;
      ui.updateBest?.(best);
      ui.showGameOver?.(score, best);
    },
    (tier) => {
      ui.updateTier?.(tier);
    }
  );

  const startBtn = document.getElementById('start-btn');
  const howBtn = document.getElementById('how-btn');
  const closeHowBtn = document.getElementById('close-how');
  const pauseBtn = document.getElementById('pause-btn');
  const restartBtn = document.getElementById('restart-btn');
  const soundButtons = document.querySelectorAll('.sound-toggle');

  startBtn?.addEventListener('click', startGame);

  howBtn?.addEventListener('click', () => {
    ui.showInstructions?.();
  });

  closeHowBtn?.addEventListener('click', () => {
    ui.hideInstructions?.();
  });

  pauseBtn?.addEventListener('click', () => {
    togglePause();
  });

  restartBtn?.addEventListener('click', () => {
    restartGame();
  });

  soundButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const isOn = toggleAudio();
      setSoundVisualState(isOn);
    });
  });

  window.addEventListener('keydown', (event) => {
    if (!playing || !game) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      togglePause();
      return;
    }

    game.handleKey(event.key);
  });

  // default sound state = on
  setSoundVisualState(true);
}

window.addEventListener('DOMContentLoaded', init);
