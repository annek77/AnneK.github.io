// Core game engine for Palindrom Echo

import { palindromeData } from './data-palindromes.js';
import { randomRange, pickRandom, determineTier } from './utils.js';
import { playType, playResolve } from './audio.js';

export class Game {
  constructor(canvas, onScoreUpdate, onGameOver, onTierChange) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onScoreUpdate = onScoreUpdate;
    this.onGameOver = onGameOver;
    this.onTierChange = onTierChange;
    this.width = 0;
    this.height = 0;
    this.running = false;
    this.echoes = [];
    this.activeEcho = null;
    this.score = 0;
    this.best = 0;
    this.tier = 'short';
    this.spawnInterval = 3000;
    this.lastSpawn = 0;
    this.speedFactor = 30; // pixels per second baseline
    this.lastFrameTime = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    this.width = this.canvas.clientWidth;
    this.height = this.canvas.clientHeight;
    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start() {
    this.reset();
    this.running = true;
    requestAnimationFrame(this.loop.bind(this));
  }

  reset() {
    this.echoes = [];
    this.activeEcho = null;
    this.score = 0;
    this.tier = 'short';
    this.spawnInterval = 3000;
    this.speedFactor = 30;
    this.lastSpawn = performance.now();
    this.lastFrameTime = performance.now();
    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    if (this.onTierChange) this.onTierChange(this.tier);
    document.getElementById('game-over').classList.add('hidden');
  }

  pause() {
    this.running = false;
  }

  resume() {
    if (!this.running) {
      this.running = true;
      this.lastFrameTime = performance.now();
      requestAnimationFrame(this.loop.bind(this));
    }
  }

  loop(now) {
    if (!this.running) return;
    const dt = now - this.lastFrameTime;
    this.lastFrameTime = now;

    this.update(dt);
    this.draw();

    requestAnimationFrame(this.loop.bind(this));
  }

  update(dt) {
    // Spawn new echoes
    if (performance.now() - this.lastSpawn > this.spawnInterval) {
      this.spawnEcho();
      this.lastSpawn = performance.now();
    }

    // Update echoes positions
    const speed = this.speedFactor;
    this.echoes.forEach(echo => {
      echo.y += (speed + echo.speedMod) * (dt / 1000);
    });

    // Remove resolved echoes gracefully (fade out)
    this.echoes = this.echoes.filter(echo => {
      if (echo.resolved && echo.opacity <= 0) {
        return false;
      }
      return true;
    });

    // Fade out resolved echoes
    this.echoes.forEach(echo => {
      if (echo.resolved) {
        echo.opacity -= dt / 800; // fade out over 0.8s
      }
    });

    // Check for game over (echo reached bottom)
    for (const echo of this.echoes) {
      if (!echo.resolved && echo.y - echo.radius > this.height) {
        // Garden is overgrown
        this.endGame();
        return;
      }
    }

    // Difficulty scaling: increase speed and spawn rate as score climbs
    this.tier = determineTier(this.score);
    if (this.onTierChange) this.onTierChange(this.tier);
    this.speedFactor = 30 + this.score * 0.5;
    this.spawnInterval = Math.max(800, 3000 - this.score * 30);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Draw each echo
    this.echoes.forEach(echo => {
      ctx.save();
      ctx.globalAlpha = echo.opacity;
      // Draw glow
      const grad = ctx.createRadialGradient(
        echo.x,
        echo.y,
        0,
        echo.x,
        echo.y,
        echo.radius
      );
      grad.addColorStop(0, 'rgba(196,162,101,0.25)');
      grad.addColorStop(1, 'rgba(196,162,101,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(echo.x, echo.y, echo.radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw text
      const text = echo.word;
      ctx.font = `${echo.fontSize}px 'DM Sans', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      // Untyped letters: ghost colour
      const untyped = text.slice(echo.typedIndex);
      // Typed letters: warm highlight
      const typed = text.slice(0, echo.typedIndex);
      // Draw typed letters
      ctx.fillStyle = 'rgba(235,213,176,0.9)';
      ctx.fillText(typed, echo.x - ctx.measureText(untyped).width / 2, echo.y);
      // Draw untyped letters slightly dimmer
      ctx.fillStyle = 'rgba(224,208,184,0.6)';
      ctx.fillText(untyped, echo.x + ctx.measureText(typed).width / 2, echo.y);
      ctx.restore();
    });
  }

  spawnEcho() {
    const tierWords = palindromeData[this.tier];
    const word = pickRandom(tierWords);
    const radius = 40 + word.length * 2;
    const x = randomRange(radius, this.width - radius);
    const y = -radius; // start just above the canvas
    const speedMod = randomRange(-10, 10);
    const opacity = 1;
    const fontSize = 18 + Math.min(word.length, 10);
    this.echoes.push({
      word,
      x,
      y,
      radius,
      speedMod,
      typedIndex: 0,
      opacity,
      resolved: false,
      fontSize
    });
  }

  handleKey(key) {
    if (!this.running) return;
    const letter = key.toLowerCase();
    if (!/^[a-z]$/.test(letter)) return;

    // If an active echo exists, check next letter
    if (this.activeEcho) {
      const echo = this.activeEcho;
      if (echo.word[echo.typedIndex] === letter) {
        echo.typedIndex++;
        playType();
        if (echo.typedIndex >= echo.word.length) {
          // resolve echo
          echo.resolved = true;
          playResolve();
          this.score += echo.word.length;
          this.onScoreUpdate(this.score);
          this.activeEcho = null;
        }
      }
      return;
    }

    // No active echo yet; find an echo whose first untyped letter matches
    for (const echo of this.echoes) {
      if (!echo.resolved && echo.word[0] === letter) {
        echo.typedIndex = 1;
        this.activeEcho = echo;
        playType();
        // if one-letter word resolved
        if (echo.typedIndex >= echo.word.length) {
          echo.resolved = true;
          playResolve();
          this.score += echo.word.length;
          this.onScoreUpdate(this.score);
          this.activeEcho = null;
        }
        return;
      }
    }
  }

  endGame() {
    this.running = false;
    const bestKey = 'palindromEchoBest';
    let best = parseInt(localStorage.getItem(bestKey) || '0');
    if (this.score > best) {
      best = this.score;
      localStorage.setItem(bestKey, best);
    }
    this.onGameOver(this.score, best);
  }
}
