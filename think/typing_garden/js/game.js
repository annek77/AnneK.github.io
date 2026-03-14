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
    this.speedFactor = 30;
    this.lastFrameTime = 0;

    this.helperText = 'Type the first letter of a drifting palindrome.';
    this.inputPulse = 0;

    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const parent = this.canvas.parentElement;

    this.width =
      Math.floor(rect.width) ||
      parent?.clientWidth ||
      window.innerWidth ||
      1024;

    this.height =
      Math.floor(rect.height) ||
      parent?.clientHeight ||
      window.innerHeight ||
      768;

    this.canvas.width = this.width;
    this.canvas.height = this.height;
  }

  start() {
    this.resize();
    this.reset();

    // Spawn immediately so the field is never empty at start
    this.spawnEcho();
    this.spawnEcho();

    this.running = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  reset() {
    this.resize();

    this.echoes = [];
    this.activeEcho = null;
    this.score = 0;
    this.tier = 'short';
    this.spawnInterval = 3000;
    this.speedFactor = 30;
    this.lastSpawn = performance.now();
    this.lastFrameTime = performance.now();
    this.inputPulse = 0;

    if (this.onScoreUpdate) this.onScoreUpdate(this.score);
    if (this.onTierChange) this.onTierChange(this.tier);

    const gameOverPanel = document.getElementById('game-over');
    if (gameOverPanel) {
      gameOverPanel.classList.add('hidden');
    }
  }

  pause() {
    this.running = false;
  }

  resume() {
    if (!this.running) {
      this.resize();
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
    // Spawn new echoes over time
    if (performance.now() - this.lastSpawn > this.spawnInterval) {
      this.spawnEcho();
      this.lastSpawn = performance.now();
    }

    // Safety: if the field is empty, add one
    if (this.echoes.length === 0) {
      this.spawnEcho();
      this.lastSpawn = performance.now();
    }

    // Update movement
    const speed = this.speedFactor;

    this.echoes.forEach((echo) => {
      if (!echo.resolved) {
        echo.y += (speed + echo.speedMod) * (dt / 1000);
        echo.x += echo.drift * (dt / 1000);

        // keep within field softly
        if (echo.x < echo.radius) {
          echo.x = echo.radius;
          echo.drift *= -1;
        }
        if (echo.x > this.width - echo.radius) {
          echo.x = this.width - echo.radius;
          echo.drift *= -1;
        }
      } else {
        echo.opacity -= dt / 800;
        echo.scale += dt / 2500;
      }

      if (echo.flash > 0) {
        echo.flash -= dt / 250;
      }
    });

    if (this.inputPulse > 0) {
      this.inputPulse -= dt / 250;
    }

    // Remove resolved echoes once invisible
    this.echoes = this.echoes.filter((echo) => !(echo.resolved && echo.opacity <= 0));

    // Clear active echo if it has resolved
    if (this.activeEcho && this.activeEcho.resolved) {
      this.activeEcho = null;
    }

    // Check fail state
    for (const echo of this.echoes) {
      if (!echo.resolved && echo.y - echo.radius > this.height) {
        this.endGame();
        return;
      }
    }

    // Difficulty scaling
    this.tier = determineTier(this.score);
    if (this.onTierChange) this.onTierChange(this.tier);

    this.speedFactor = 30 + this.score * 0.5;
    this.spawnInterval = Math.max(1000, 3000 - this.score * 25);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    this.drawFieldHint();

    this.echoes.forEach((echo) => {
      this.drawEcho(echo);
    });
  }

  drawFieldHint() {
    const ctx = this.ctx;

    ctx.save();

    const alpha = this.activeEcho ? 0.18 : 0.65 - Math.max(0, this.inputPulse) * 0.2;

    ctx.font = "500 14px 'DM Sans', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = `rgba(224, 208, 184, ${Math.max(0.12, alpha)})`;

    const message = this.activeEcho
      ? `Continue: ${this.activeEcho.word}`
      : this.helperText;

    ctx.fillText(message, this.width / 2, Math.max(80, this.height * 0.16));

    ctx.restore();
  }

  drawEcho(echo) {
    const ctx = this.ctx;
    const radius = echo.radius * echo.scale;

    ctx.save();
    ctx.globalAlpha = Math.max(0, echo.opacity);

    // soft glow
    const glow = ctx.createRadialGradient(
      echo.x,
      echo.y,
      0,
      echo.x,
      echo.y,
      radius
    );
    glow.addColorStop(0, 'rgba(212,184,122,0.24)');
    glow.addColorStop(0.55, 'rgba(196,162,101,0.12)');
    glow.addColorStop(1, 'rgba(196,162,101,0)');

    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(echo.x, echo.y, radius, 0, Math.PI * 2);
    ctx.fill();

    // subtle ring
    ctx.strokeStyle = echo === this.activeEcho
      ? 'rgba(232,213,176,0.5)'
      : 'rgba(196,162,101,0.18)';
    ctx.lineWidth = echo === this.activeEcho ? 1.8 : 1;
    ctx.beginPath();
    ctx.arc(echo.x, echo.y, radius * 0.9, 0, Math.PI * 2);
    ctx.stroke();

    // word rendering
    const text = echo.word;
    const typed = text.slice(0, echo.typedIndex);
    const untyped = text.slice(echo.typedIndex);

    ctx.font = `600 ${echo.fontSize}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const typedWidth = ctx.measureText(typed).width;
    const untypedWidth = ctx.measureText(untyped).width;
    const totalWidth = typedWidth + untypedWidth;
    const startX = echo.x - totalWidth / 2;

    // shadow for visibility
    ctx.shadowColor = 'rgba(42, 31, 20, 0.9)';
    ctx.shadowBlur = 18;

    if (typed) {
      ctx.fillStyle = 'rgba(242,230,208,0.98)';
      ctx.fillText(typed, startX, echo.y);
    }

    ctx.fillStyle = echo.flash > 0
      ? 'rgba(255,210,190,0.95)'
      : 'rgba(232,213,176,0.92)';
    ctx.fillText(untyped, startX + typedWidth, echo.y);

    ctx.restore();
  }

  spawnEcho() {
    const tierWords = palindromeData[this.tier];
    if (!tierWords || tierWords.length === 0) return;

    const word = pickRandom(tierWords);
    const radius = Math.max(48, 34 + word.length * 4);

    const minX = radius + 20;
    const maxX = Math.max(minX + 1, this.width - radius - 20);

    const x = randomRange(minX, maxX);
    const y = -radius - randomRange(10, 80);

    const speedMod = randomRange(-8, 12);
    const drift = randomRange(-10, 10);
    const opacity = 1;
    const fontSize = Math.min(30, Math.max(20, 14 + word.length * 1.2));

    this.echoes.push({
      word,
      x,
      y,
      radius,
      speedMod,
      drift,
      typedIndex: 0,
      opacity,
      resolved: false,
      fontSize,
      flash: 0,
      scale: 1
    });
  }

  handleKey(key) {
    if (!this.running) return;

    const letter = key.toLowerCase();
    if (!/^[a-z]$/.test(letter)) return;

    this.inputPulse = 1;

    // Continue active echo
    if (this.activeEcho) {
      const echo = this.activeEcho;
      const expected = echo.word[echo.typedIndex];

      if (expected === letter) {
        echo.typedIndex++;
        playType();

        if (echo.typedIndex >= echo.word.length) {
          echo.resolved = true;
          playResolve();
          this.score += echo.word.length;
          if (this.onScoreUpdate) this.onScoreUpdate(this.score);
          this.activeEcho = null;
        }
      } else {
        echo.flash = 1;
      }

      return;
    }

    // Acquire a new echo by first matching letter
    const candidates = this.echoes
      .filter((echo) => !echo.resolved && echo.word[0] === letter)
      .sort((a, b) => b.y - a.y); // prioritize the lowest one on the field

    if (candidates.length > 0) {
      const echo = candidates[0];
      echo.typedIndex = 1;
      this.activeEcho = echo;
      playType();

      if (echo.typedIndex >= echo.word.length) {
        echo.resolved = true;
        playResolve();
        this.score += echo.word.length;
        if (this.onScoreUpdate) this.onScoreUpdate(this.score);
        this.activeEcho = null;
      }
    }
  }

  endGame() {
    this.running = false;

    const bestKey = 'palindromEchoBest';
    let best = parseInt(localStorage.getItem(bestKey) || '0', 10);

    if (this.score > best) {
      best = this.score;
      localStorage.setItem(bestKey, best);
    }

    if (this.onGameOver) {
      this.onGameOver(this.score, best);
    }
  }
}
