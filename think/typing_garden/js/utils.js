// Utility functions used throughout the game

// Returns a random number between min (inclusive) and max (exclusive)
export function randomRange(min, max) {
  return Math.random() * (max - min) + min;
}

// Randomly picks an item from an array
export function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Easing between difficulty tiers based on score or time
export function determineTier(score) {
  if (score < 20) return 'short';
  if (score < 40) return 'medium';
  return 'long';
}

// Clamps a value between min and max
export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
