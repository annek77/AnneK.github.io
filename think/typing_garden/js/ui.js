// UI functions for showing/hiding screens and updating HUD.

import { isAudioEnabled } from './audio.js';

export function showScreen(id) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(scr => {
    if (scr.id === id) scr.classList.remove('hidden');
    else scr.classList.add('hidden');
  });
}

export function updateScore(score) {
  const scoreEl = document.getElementById('score');
  if (scoreEl) scoreEl.textContent = score;
}

export function updateBest(best) {
  const bestEl = document.getElementById('best');
  if (bestEl) bestEl.textContent = best;
}

export function updateTier(tier) {
  const tierEl = document.getElementById('tier');
  if (tierEl) tierEl.textContent = tier.charAt(0).toUpperCase() + tier.slice(1);
}

export function showGameOver(score, best) {
  const panel = document.getElementById('game-over');
  document.getElementById('final-score').textContent = score;
  document.getElementById('final-best').textContent = best;
  panel.classList.remove('hidden');
}

export function hideGameOver() {
  document.getElementById('game-over').classList.add('hidden');
}

export function showInstructions() {
  document.getElementById('how-panel').classList.remove('hidden');
}

export function hideInstructions() {
  document.getElementById('how-panel').classList.add('hidden');
}

export function updateSoundIcon() {
  const btns = document.querySelectorAll('.sound-toggle');
  const enabled = isAudioEnabled();
  btns.forEach(btn => {
    if (enabled) {
      btn.classList.remove('sound-off');
      btn.title = 'Sound on';
    } else {
      btn.classList.add('sound-off');
      btn.title = 'Sound off';
    }
  });
}

export function showPause() {
  // Could display a pause overlay; here we update the pause button text
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.textContent = 'Resume';
}

export function hidePause() {
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.textContent = 'Pause';
}
