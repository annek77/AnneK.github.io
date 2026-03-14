// UI helpers for Palindrom Echo

export function showScreen(id) {
  const screens = document.querySelectorAll('.screen');

  screens.forEach((screen) => {
    if (screen.id === id) {
      screen.classList.remove('hidden');
    } else {
      screen.classList.add('hidden');
    }
  });
}

export function updateScore(score) {
  const el = document.getElementById('score');
  if (el) el.textContent = String(score);
}

export function updateBest(best) {
  const el = document.getElementById('best');
  if (el) el.textContent = String(best);
}

export function updateTier(tier) {
  const el = document.getElementById('tier');
  if (!el) return;

  const label = tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : '—';
  el.textContent = label;
}

export function showGameOver(score, best) {
  const panel = document.getElementById('game-over');
  const finalScore = document.getElementById('final-score');
  const finalBest = document.getElementById('final-best');

  if (finalScore) finalScore.textContent = String(score);
  if (finalBest) finalBest.textContent = String(best);
  if (panel) panel.classList.remove('hidden');
}

export function hideGameOver() {
  const panel = document.getElementById('game-over');
  if (panel) panel.classList.add('hidden');
}

export function showInstructions() {
  const panel = document.getElementById('how-panel');
  if (panel) panel.classList.remove('hidden');
}

export function hideInstructions() {
  const panel = document.getElementById('how-panel');
  if (panel) panel.classList.add('hidden');
}

export function showPause() {
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.textContent = 'Resume';
}

export function hidePause() {
  const pauseBtn = document.getElementById('pause-btn');
  if (pauseBtn) pauseBtn.textContent = 'Pause';
}

export function updateSoundIcon() {
  const buttons = document.querySelectorAll('.sound-toggle');
  const soundOn = !document.body.classList.contains('sound-is-off');

  buttons.forEach((btn) => {
    btn.textContent = soundOn ? 'Sound On' : 'Sound Off';
    btn.setAttribute('aria-label', soundOn ? 'Sound on' : 'Sound off');
    btn.setAttribute('title', soundOn ? 'Sound on' : 'Sound off');
  });
}

export function setSoundState(isOn) {
  document.body.classList.toggle('sound-is-off', !isOn);
  updateSoundIcon();
}
