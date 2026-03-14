// Lightweight audio system using the Web Audio API.
// Generates soft sine tones for typing and resolving echoes.

let audioEnabled = true;
let audioContext;
let ambientNode;

function ensureCtx() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playTone(freq, duration = 0.15, volume = 0.2) {
  if (!audioEnabled) return;
  ensureCtx();
  const now = audioContext.currentTime;
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
  osc.connect(gain).connect(audioContext.destination);
  osc.start(now);
  osc.stop(now + duration);
}

export function playType() {
  // gentle mid-range tone
  playTone(440, 0.07, 0.15);
}

export function playResolve() {
  // brighter tone for completed word
  playTone(660, 0.25, 0.22);
}

export function toggleAudio() {
  audioEnabled = !audioEnabled;
  return audioEnabled;
}

export function isAudioEnabled() {
  return audioEnabled;
}
