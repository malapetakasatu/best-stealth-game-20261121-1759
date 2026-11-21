import { VIEWPORT, PLAYER_CONFIG, GUARD_CONFIG } from './config.js';
import { InputManager } from './input.js';
import { SoundController } from './sound.js';
import { World } from './world.js';
import { Renderer } from './render.js';
import { STATE_ALERT } from './guard.js';

const STATE_MENU = 'MENU';
const STATE_PLAYING = 'PLAYING';
const STATE_CAUGHT = 'CAUGHT';
const STATE_VICTORY = 'VICTORY';

class StealthGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new Renderer(this.canvas);
    this.input = new InputManager(this.canvas);
    this.sound = new SoundController();

    this.state = STATE_MENU;
    this.world = new World();
    this.gameTime = 0;
    this.lastFrameTime = performance.now();

    this.player = {
      x: 90,
      y: 550,
      angle: -Math.PI / 2,
      radius: PLAYER_CONFIG.radius,
      pebbles: PLAYER_CONFIG.maxPebbles
    };

    this.pebbles = [];
    this.ripples = [];
    this.footstepTimer = 0;
    this.caughtReason = '';

    // Bind event listeners for menu transitions
    window.addEventListener('keydown', (e) => {
      if (e.code === 'KeyM') {
        this.sound.toggleMute();
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        if (this.state === STATE_MENU || this.state === STATE_CAUGHT || this.state === STATE_VICTORY) {
          this.sound.ensureContext();
          this.resetGame();
          this.state = STATE_PLAYING;
        }
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (this.state === STATE_MENU || this.state === STATE_CAUGHT || this.state === STATE_VICTORY) {
        this.sound.ensureContext();
        this.resetGame();
        this.state = STATE_PLAYING;
      }
    });

    // Start RAF loop
    requestAnimationFrame(this.loop.bind(this));
  }

  resetGame() {
    this.world = new World();
    this.gameTime = 0;
    this.player.x = 90;
    this.player.y = 550;
    this.player.angle = -Math.PI / 2;
    this.player.pebbles = PLAYER_CONFIG.maxPebbles;
    this.pebbles = [];
    this.ripples = [];
    this.caughtReason = '';
  }

  throwPebble(targetX, targetY) {
    if (this.player.pebbles <= 0) return;
    this.player.pebbles--;

    const dist = Math.hypot(targetX - this.player.x, targetY - this.player.y);
    const clampedDist = Math.min(dist, PLAYER_CONFIG.throwRange);
    const angle = Math.atan2(targetY - this.player.y, targetX - this.player.x);
    const endX = this.player.x + Math.cos(angle) * clampedDist;
    const endY = this.player.y + Math.sin(angle) * clampedDist;

    this.pebbles.push({
      x: this.player.x,
      y: this.player.y,
      startX: this.player.x,
      startY: this.player.y,
      endX,
      endY,
      duration: Math.max(0.3, clampedDist / 400),
      elapsed: 0,
      height: 0
    });

    this.sound.playPebbleThrow();
  }

  spawnNoiseRipple(x, y, maxRadius, isPebble = false) {
    this.ripples.push({
      x,
      y,
      radius: 5,
      maxRadius,
      isPebble
    });

    // Notify all guards in hearing range
    for (const guard of this.world.guards) {
      const d = Math.hypot(guard.x - x, guard.y - y);
      if (d <= maxRadius) {
        guard.hearNoise(x, y, isPebble);
      }
    }
  }

  update(dt) {
    if (this.state !== STATE_PLAYING) return;

    this.gameTime += dt;
    this.world.updateLasers(dt);

    // 1. Process Player Movement & Stance
    const move = this.input.getMovementVector();
    let stance = 'WALK';
    let speed = PLAYER_CONFIG.walkSpeed;
    let hearRadius = GUARD_CONFIG.hearRadiusNormal;

    if (this.input.isPressed('ShiftLeft') || this.input.isPressed('ShiftRight')) {
      stance = 'SNEAK';
      speed = PLAYER_CONFIG.sneakSpeed;
      hearRadius = 0; // Completely silent crouching
    } else if (this.input.isPressed('Space')) {
      stance = 'SPRINT';
      speed = PLAYER_CONFIG.sprintSpeed;
      hearRadius = GUARD_CONFIG.hearRadiusSprint;
    }

    if (move.dx !== 0 || move.dy !== 0) {
      const newX = this.player.x + move.dx * speed * dt;
      const newY = this.player.y + move.dy * speed * dt;
      const resolved = this.world.resolveCircleCollision(newX, newY, this.player.radius);
      this.player.x = resolved.x;
      this.player.y = resolved.y;

      // Footstep sound & ripples
      this.footstepTimer += dt;
      const stepInterval = stance === 'SPRINT' ? 0.22 : 0.42;
      if (this.footstepTimer >= stepInterval) {
        this.footstepTimer = 0;
        this.sound.playFootstep(stance === 'SNEAK');
        if (hearRadius > 0) {
          this.spawnNoiseRipple(this.player.x, this.player.y, hearRadius, false);
        }
      }
    }

    // Aim towards mouse
    this.player.angle = Math.atan2(this.input.mouse.y - this.player.y, this.input.mouse.x - this.player.x);

    // Mouse click pebble throw
    if (this.input.mouse.clicked) {
      this.input.mouse.clicked = false;
      this.throwPebble(this.input.mouse.x, this.input.mouse.y);
    }

    // 2. Update Pebbles
    for (let i = this.pebbles.length - 1; i >= 0; i--) {
      const p = this.pebbles[i];
      p.elapsed += dt;
      const progress = Math.min(1, p.elapsed / p.duration);
      p.x = p.startX + (p.endX - p.startX) * progress;
      p.y = p.startY + (p.endY - p.startY) * progress;
      p.height = Math.sin(progress * Math.PI) * 25; // Parabolic arc height

      if (progress >= 1) {
        // Pebble landed
        this.sound.playPebbleLand();
        this.spawnNoiseRipple(p.endX, p.endY, GUARD_CONFIG.hearRadiusPebble, true);
        this.pebbles.splice(i, 1);
      }
    }

    // 3. Update Noise Ripples
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const rip = this.ripples[i];
      rip.radius += 240 * dt;
      if (rip.radius >= rip.maxRadius) {
        this.ripples.splice(i, 1);
      }
    }

    // 4. Update Guards AI & Vision
    const inLight = this.world.isInLight(this.player.x, this.player.y);
    this.player.inLight = inLight;
    this.player.isSneaking = (stance === 'SNEAK');
    let maxSuspicion = 0;

    for (const guard of this.world.guards) {
      guard.update(dt, this.player, this.world.segments, !inLight, this.sound);
      if (guard.suspicion > maxSuspicion) {
        maxSuspicion = guard.suspicion;
      }

      // Check melee apprehension
      const d = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (guard.state === STATE_ALERT && d < guard.radius + this.player.radius + 6) {
        this.caughtReason = `${guard.name} tackled operative!`;
        this.state = STATE_CAUGHT;
        this.sound.playAlarm();
        return;
      }
    }

    // 5. Laser Tripwire Detection
    for (const laser of this.world.lasers) {
      if (!laser.active) continue;
      // Distance from point to line segment
      const lx = laser.x2 - laser.x1;
      const ly = laser.y2 - laser.y1;
      const lLen = Math.hypot(lx, ly);
      if (lLen > 0) {
        const u = ((this.player.x - laser.x1) * lx + (this.player.y - laser.y1) * ly) / (lLen * lLen);
        if (u >= 0 && u <= 1) {
          const px = laser.x1 + u * lx;
          const py = laser.y1 + u * ly;
          const distToLaser = Math.hypot(this.player.x - px, this.player.y - py);
          if (distToLaser < this.player.radius + 4) {
            // Laser tripped!
            this.caughtReason = 'Security Laser Grid Breached!';
            for (const g of this.world.guards) {
              g.state = STATE_ALERT;
              g.suspicion = 1.0;
              g.targetAngle = Math.atan2(this.player.y - g.y, this.player.x - g.x);
              g.setThought('ALARM! INTRUDER!');
            }
            this.sound.playAlarm();
          }
        }
      }
    }

    // 6. Check Objectives
    let collectedCount = 0;
    for (const term of this.world.terminals) {
      if (!term.collected) {
        const d = Math.hypot(this.player.x - term.x, this.player.y - term.y);
        if (d < term.radius + this.player.radius + 10) {
          term.collected = true;
          this.sound.playLoot();
        }
      } else {
        collectedCount++;
      }
    }

    // If all terminals secured, unlock exit elevator
    if (collectedCount === this.world.terminals.length) {
      this.world.exit.unlocked = true;
    }

    // 7. Check Extraction Exit
    if (this.world.exit.unlocked) {
      const e = this.world.exit;
      if (
        this.player.x >= e.x &&
        this.player.x <= e.x + e.w &&
        this.player.y >= e.y &&
        this.player.y <= e.y + e.h
      ) {
        this.sound.playVictory();
        this.state = STATE_VICTORY;
      }
    }

    this.currentAlertLevel = maxSuspicion;
    this.currentStance = stance;
  }

  render() {
    this.renderer.clear();
    this.renderer.renderFloor();
    this.renderer.renderSpotlights(this.world.lights);
    this.renderer.renderWalls(this.world.walls);
    this.renderer.renderLasers(this.world.lasers);
    this.renderer.renderTerminals(this.world.terminals);
    this.renderer.renderExit(this.world.exit);
    this.renderer.renderNoiseRipples(this.ripples);
    this.renderer.renderPebbles(this.pebbles);
    this.renderer.renderVisionCones(this.world.guards);
    this.renderer.renderGuards(this.world.guards);

    const inLight = this.world.isInLight(this.player.x, this.player.y);
    this.renderer.renderPlayer(this.player, this.currentStance || 'WALK', !inLight);

    // Apply dark stealth atmosphere mask
    this.renderer.renderDarknessOverlay(this.player, this.world.lights, this.world.guards);

    // Render HUD
    if (this.state === STATE_PLAYING) {
      this.renderer.renderHUD(
        this.player,
        this.world,
        this.currentStance || 'WALK',
        this.player.pebbles,
        this.currentAlertLevel || 0,
        this.gameTime
      );
    } else if (this.state === STATE_MENU) {
      this.renderer.renderMenu();
    } else if (this.state === STATE_CAUGHT) {
      this.renderer.renderGameOver(this.caughtReason);
    } else if (this.state === STATE_VICTORY) {
      const mins = Math.floor(this.gameTime / 60);
      const secs = Math.floor(this.gameTime % 60);
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      this.renderer.renderVictory({ timeStr });
    }
  }

  loop(timestamp) {
    const dt = Math.min((timestamp - this.lastFrameTime) / 1000, 0.1);
    this.lastFrameTime = timestamp;

    this.update(dt);
    this.render();

    requestAnimationFrame(this.loop.bind(this));
  }
}

// Instantiate game on page load
window.addEventListener('DOMContentLoaded', () => {
  new StealthGame();
});
