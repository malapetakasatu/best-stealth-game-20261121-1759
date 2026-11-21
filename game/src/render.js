import { COLORS, VIEWPORT } from './config.js';
import { STATE_ALERT, STATE_SUSPICIOUS, STATE_INVESTIGATING } from './guard.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.width = VIEWPORT.width;
    this.height = VIEWPORT.height;

    // Dark mask offscreen canvas for dynamic shadows
    this.maskCanvas = document.createElement('canvas');
    this.maskCanvas.width = this.width;
    this.maskCanvas.height = this.height;
    this.maskCtx = this.maskCanvas.getContext('2d');
  }

  clear() {
    this.ctx.fillStyle = COLORS.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  renderFloor() {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.floor;
    ctx.fillRect(24, 24, this.width - 48, this.height - 48);

    // Subtle 32x32 tech tile grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.025)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 24; x < this.width - 24; x += 32) {
      ctx.moveTo(x, 24);
      ctx.lineTo(x, this.height - 24);
    }
    for (let y = 24; y < this.height - 24; y += 32) {
      ctx.moveTo(24, y);
      ctx.lineTo(this.width - 24, y);
    }
    ctx.stroke();

    // Blueprint room labels
    ctx.font = '600 11px monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.textAlign = 'center';
    ctx.fillText('SECTOR A: WEST FOYER', 130, 60);
    ctx.fillText('SECTOR B: CENTRAL OBSIDIAN VAULT', 512, 50);
    ctx.fillText('SECTOR C: DATA ARCHIVE', 870, 600);
    ctx.fillText('SECURE EXTRACTION ELEVATOR', 880, 125);
  }

  renderSpotlights(lights) {
    const ctx = this.ctx;
    for (const light of lights) {
      const grad = ctx.createRadialGradient(light.x, light.y, 10, light.x, light.y, light.radius);
      grad.addColorStop(0, 'rgba(254, 240, 138, 0.25)');
      grad.addColorStop(0.6, 'rgba(253, 224, 71, 0.10)');
      grad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();

      // Spotlight lamp fixture icon
      ctx.fillStyle = 'rgba(254, 240, 138, 0.8)';
      ctx.beginPath();
      ctx.arc(light.x, light.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderWalls(walls) {
    const ctx = this.ctx;

    for (const wall of walls) {
      if (wall.type === 'wall') {
        // Wall drop shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
        ctx.fillRect(wall.x + 3, wall.y + 4, wall.w, wall.h);

        // Wall base
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

        // Wall top highlighted bevel
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(wall.x + 1, wall.y + 1, wall.w - 2, 4);

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      } else if (wall.type === 'cover') {
        // Cover obstacle (Crate / Server Rack)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(wall.x + 2, wall.y + 3, wall.w, wall.h);

        ctx.fillStyle = COLORS.cover;
        ctx.fillRect(wall.x, wall.y, wall.w, wall.h);

        // Tech vent stripes / hazard styling
        ctx.fillStyle = COLORS.coverHatch;
        ctx.fillRect(wall.x + 3, wall.y + 3, wall.w - 6, wall.h - 6);

        // Server LED indicator
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(wall.x + 8, wall.y + 8, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
      }
    }
  }

  renderLasers(lasers) {
    const ctx = this.ctx;
    for (const laser of lasers) {
      if (!laser.active) {
        // Deactivated / warming up indicator
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.setLineDash([4, 6]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(laser.x1, laser.y1);
        ctx.lineTo(laser.x2, laser.y2);
        ctx.stroke();
        ctx.setLineDash([]);
        continue;
      }

      // Active glowing laser beam
      ctx.save();
      ctx.shadowColor = '#ef4444';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(laser.x1, laser.y1);
      ctx.lineTo(laser.x2, laser.y2);
      ctx.stroke();

      // Laser emitter nodes
      ctx.fillStyle = '#f87171';
      ctx.beginPath();
      ctx.arc(laser.x1, laser.y1, 4, 0, Math.PI * 2);
      ctx.arc(laser.x2, laser.y2, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderTerminals(terminals) {
    const ctx = this.ctx;
    const time = performance.now() * 0.003;

    for (const term of terminals) {
      ctx.save();
      const pulse = Math.sin(time + term.x) * 3;

      if (term.collected) {
        // Deactivated terminal
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(term.x - 14, term.y - 14, 28, 28);
        ctx.fillStyle = '#475569';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('DOWNLOADED', term.x, term.y + 24);
      } else {
        // Glowing active terminal
        ctx.shadowColor = term.id === 'core' ? '#a855f7' : '#06b6d4';
        ctx.shadowBlur = 12 + pulse;

        ctx.fillStyle = term.id === 'core' ? 'rgba(168, 85, 247, 0.2)' : 'rgba(6, 182, 212, 0.2)';
        ctx.beginPath();
        ctx.arc(term.x, term.y, term.radius + pulse * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Terminal console box
        ctx.strokeStyle = term.id === 'core' ? '#c084fc' : '#22d3ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(term.x - 12, term.y - 12, 24, 24);

        // Core symbol
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(term.x, term.y, 4, 0, Math.PI * 2);
        ctx.fill();

        // Hologram text
        ctx.fillStyle = term.id === 'core' ? '#e9d5ff' : '#cffafe';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(term.name, term.x, term.y - 18);
      }
      ctx.restore();
    }
  }

  renderExit(exit) {
    const ctx = this.ctx;
    ctx.save();

    if (exit.unlocked) {
      // Unlocked extraction point with green landing pad pulse
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);

      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXTRACTION', exit.x + exit.w / 2, exit.y + 26);
      ctx.fillText('READY [ESCAPE]', exit.x + exit.w / 2, exit.y + 44);
    } else {
      // Locked exit
      ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
      ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(exit.x, exit.y, exit.w, exit.h);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('EXTRACTION', exit.x + exit.w / 2, exit.y + 26);
      ctx.fillText('LOCKED', exit.x + exit.w / 2, exit.y + 42);
    }
    ctx.restore();
  }

  renderVisionCones(guards) {
    const ctx = this.ctx;

    for (const guard of guards) {
      if (!guard.conePoints || guard.conePoints.length === 0) continue;

      ctx.save();
      let coneFill = 'rgba(245, 158, 11, 0.16)';
      let coneEdge = 'rgba(245, 158, 11, 0.4)';

      if (guard.state === STATE_ALERT) {
        coneFill = 'rgba(239, 68, 68, 0.32)';
        coneEdge = 'rgba(239, 68, 68, 0.8)';
      } else if (guard.state === STATE_SUSPICIOUS || guard.state === STATE_INVESTIGATING) {
        coneFill = 'rgba(234, 179, 8, 0.24)';
        coneEdge = 'rgba(234, 179, 8, 0.6)';
      }

      ctx.beginPath();
      ctx.moveTo(guard.x, guard.y);
      for (const pt of guard.conePoints) {
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.closePath();

      // Vision cone gradient originating from flashlight
      const grad = ctx.createRadialGradient(guard.x, guard.y, 10, guard.x, guard.y, 280);
      grad.addColorStop(0, coneFill);
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = coneEdge;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.restore();
    }
  }

  renderGuards(guards) {
    const ctx = this.ctx;

    for (const guard of guards) {
      ctx.save();
      ctx.translate(guard.x, guard.y);

      // Guard body shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.arc(2, 3, 14, 0, Math.PI * 2);
      ctx.fill();

      // Guard torso
      let guardColor = COLORS.guardPatrol;
      if (guard.state === STATE_ALERT) guardColor = COLORS.guardAlert;
      else if (guard.state === STATE_SUSPICIOUS || guard.state === STATE_INVESTIGATING) guardColor = COLORS.guardSuspicious;

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(0, 0, 13, 0, Math.PI * 2);
      ctx.fill();

      // Armor shoulder guards
      ctx.fillStyle = guardColor;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0, Math.PI * 2);
      ctx.fill();

      // Directional helmet visor & flashlight mount
      ctx.rotate(guard.angle);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(8, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // Flashlight emitter dot
      ctx.fillStyle = guardColor;
      ctx.fillRect(8, -2, 6, 4);

      ctx.restore();

      // Suspicion meter above head
      if (guard.suspicion > 0.05 && guard.state !== STATE_ALERT) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(guard.x - 16, guard.y - 24, 32, 5);

        ctx.fillStyle = guard.suspicion > 0.65 ? '#ef4444' : '#eab308';
        ctx.fillRect(guard.x - 15, guard.y - 23, 30 * guard.suspicion, 3);
      }

      // Alert / Suspicious emote icon
      if (guard.state === STATE_ALERT) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('!', guard.x, guard.y - 22);
      } else if (guard.state === STATE_SUSPICIOUS || guard.state === STATE_INVESTIGATING) {
        ctx.fillStyle = '#eab308';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('?', guard.x, guard.y - 22);
      }

      // Guard dialogue / thought bubble
      if (guard.thought) {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = '#475569';
        ctx.font = '10px sans-serif';
        const txtWidth = ctx.measureText(guard.thought).width;
        ctx.fillRect(guard.x - txtWidth / 2 - 6, guard.y - 42, txtWidth + 12, 16);
        ctx.strokeRect(guard.x - txtWidth / 2 - 6, guard.y - 42, txtWidth + 12, 16);

        ctx.fillStyle = '#f8fafc';
        ctx.textAlign = 'center';
        ctx.fillText(guard.thought, guard.x, guard.y - 30);
      }
    }
  }

  renderPlayer(player, stance, inShadow) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(player.x, player.y);

    // Sound emission radius circle
    let soundRadius = 120; // Walking
    if (stance === 'SNEAK') soundRadius = 60;
    else if (stance === 'SPRINT') soundRadius = 210;

    ctx.strokeStyle = stance === 'SPRINT' ? 'rgba(239, 68, 68, 0.25)' : (stance === 'SNEAK' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(56, 189, 248, 0.25)');
    ctx.setLineDash([3, 4]);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, soundRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Player shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.arc(2, 3, 11, 0, Math.PI * 2);
    ctx.fill();

    // Player body
    ctx.fillStyle = inShadow ? 'rgba(30, 41, 59, 0.9)' : COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Directional visor
    ctx.rotate(player.angle);
    ctx.fillStyle = inShadow ? '#38bdf8' : '#ffffff';
    ctx.beginPath();
    ctx.arc(6, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderNoiseRipples(ripples) {
    const ctx = this.ctx;
    for (const rip of ripples) {
      const alpha = Math.max(0, 1 - rip.radius / rip.maxRadius);
      ctx.strokeStyle = rip.isPebble ? `rgba(234, 179, 8, ${alpha * 0.7})` : `rgba(56, 189, 248, ${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(rip.x, rip.y, rip.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  renderPebbles(pebbles) {
    const ctx = this.ctx;
    for (const p of pebbles) {
      // Pebble shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.arc(p.x, p.y + p.height, 3, 0, Math.PI * 2);
      ctx.fill();

      // Flying pebble
      ctx.fillStyle = '#cbd5e1';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  renderDarknessOverlay(player, lights, guards) {
    // Fill darkness mask
    const mctx = this.maskCtx;
    mctx.globalCompositeOperation = 'source-over';
    mctx.fillStyle = 'rgba(10, 13, 20, 0.82)';
    mctx.fillRect(0, 0, this.width, this.height);

    // Carve out vision around player
    mctx.globalCompositeOperation = 'destination-out';

    // Player ambient sight circle
    const pgrad = mctx.createRadialGradient(player.x, player.y, 30, player.x, player.y, 160);
    pgrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
    pgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    mctx.fillStyle = pgrad;
    mctx.beginPath();
    mctx.arc(player.x, player.y, 160, 0, Math.PI * 2);
    mctx.fill();

    // Carve out ceiling spotlights
    for (const l of lights) {
      const lgrad = mctx.createRadialGradient(l.x, l.y, 10, l.x, l.y, l.radius);
      lgrad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
      lgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      mctx.fillStyle = lgrad;
      mctx.beginPath();
      mctx.arc(l.x, l.y, l.radius, 0, Math.PI * 2);
      mctx.fill();
    }

    // Carve out guard flashlight cones
    for (const g of guards) {
      if (g.conePoints && g.conePoints.length > 0) {
        mctx.beginPath();
        mctx.moveTo(g.x, g.y);
        for (const pt of g.conePoints) {
          mctx.lineTo(pt.x, pt.y);
        }
        mctx.closePath();
        mctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        mctx.fill();
      }
    }

    // Blend dark overlay onto primary game canvas
    this.ctx.drawImage(this.maskCanvas, 0, 0);
  }

  renderHUD(player, world, stance, pebblesLeft, alertLevel, gameTime) {
    const ctx = this.ctx;
    ctx.save();

    // Top Header HUD Bar
    ctx.fillStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(20, 10, this.width - 40, 36);
    ctx.strokeRect(20, 10, this.width - 40, 36);

    // Title / Codename
    ctx.font = 'bold 12px monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOWCLOAK: OBSIDIAN VAULT', 32, 33);

    // Objective checklist
    let coresFound = 0;
    for (const t of world.terminals) {
      if (t.collected) coresFound++;
    }

    ctx.font = '11px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`DATA CORES: [${coresFound}/3]`, 280, 33);

    ctx.fillText(`STATUS:`, 440, 33);
    if (world.exit.unlocked) {
      ctx.fillStyle = '#34d399';
      ctx.fillText('EXTRACTION READY', 495, 33);
    } else {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('INFILTRATING', 495, 33);
    }

    // Threat / Alert Level Meter
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('THREAT:', 650, 33);

    ctx.fillStyle = '#334155';
    ctx.fillRect(710, 22, 120, 12);

    const alertColor = alertLevel > 0.6 ? '#ef4444' : (alertLevel > 0.2 ? '#eab308' : '#10b981');
    ctx.fillStyle = alertColor;
    ctx.fillRect(712, 24, 116 * Math.min(1, alertLevel), 8);

    // Mission Timer
    const mins = Math.floor(gameTime / 60);
    const secs = Math.floor(gameTime % 60);
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    ctx.fillStyle = '#cbd5e1';
    ctx.textAlign = 'right';
    ctx.fillText(`TIME: ${timeStr}`, this.width - 35, 33);

    // Bottom Infiltrator Control Strip
    ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.fillRect(20, this.height - 40, this.width - 40, 30);
    ctx.strokeRect(20, this.height - 40, this.width - 40, 30);

    // Stance Indicator
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'left';
    let stanceColor = '#38bdf8';
    if (stance === 'SNEAK') stanceColor = '#34d399';
    if (stance === 'SPRINT') stanceColor = '#ef4444';

    ctx.fillStyle = stanceColor;
    ctx.fillText(`STANCE: ${stance}`, 35, this.height - 21);

    // Pebbles Lure ammo
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(`PEBBLES (LURE): ${pebblesLeft}/3 [CLICK TO THROW]`, 200, this.height - 21);

    // Controls reminder
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    ctx.fillText('[WASD] MOVE  •  [SHIFT] SNEAK  •  [SPACE] SPRINT  •  [MOUSE] AIM & THROW', this.width - 35, this.height - 21);

    ctx.restore();
  }

  renderMenu() {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(11, 15, 25, 0.9)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('SHADOWCLOAK: THE OBSIDIAN ARCHIVE', this.width / 2, 200);
    ctx.restore();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('A Pure Tactical Top-Down Stealth Heist', this.width / 2, 235);

    // Mission Briefing Box
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.fillRect(this.width / 2 - 280, 270, 560, 160);
    ctx.strokeRect(this.width / 2 - 280, 270, 560, 160);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'left';
    const lines = [
      'OBJECTIVE: Infiltrate Sector 7 Black Site unseen.',
      '1. Recover 3 High-Value Data Cores (Cipher, Schematic, Obsidian Core).',
      '2. Avoid Guard Vision Cones and Security Laser Grids.',
      '3. Use shadows for cover. Sneak [Shift] to silence footsteps.',
      '4. Throw pebbles [Click] to distract guards and lure patrols away.',
      '5. Reach the extraction elevator to escape.'
    ];
    lines.forEach((l, i) => {
      ctx.fillText(l, this.width / 2 - 260, 305 + i * 22);
    });

    // Start Button Prompt
    const pulse = Math.sin(performance.now() * 0.005) * 5;
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('▶ PRESS SPACE OR CLICK ANYWHERE TO COMMENCE INFILTRATION ◀', this.width / 2, 480 + pulse * 0.3);
  }

  renderGameOver(cause) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(15, 5, 5, 0.88)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('INFILTRATION COMPROMISED', this.width / 2, 250);

    ctx.fillStyle = '#fca5a5';
    ctx.font = '14px monospace';
    ctx.fillText(cause || 'Guard apprehending operative.', this.width / 2, 290);

    ctx.fillStyle = '#ffffff';
    ctx.font = '15px monospace';
    ctx.fillText('PRESS SPACE OR CLICK TO RETRY MISSION', this.width / 2, 370);
  }

  renderVictory(stats) {
    const ctx = this.ctx;
    ctx.fillStyle = 'rgba(5, 20, 15, 0.92)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 36px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HEIST SUCCESSFUL: EXTRACTED', this.width / 2, 220);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '15px monospace';
    ctx.fillText(`OPERATIVE RANK: [GHOST - S TIER]`, this.width / 2, 270);
    ctx.fillText(`DATA CORES SECURED: 3/3`, this.width / 2, 300);
    ctx.fillText(`TIME ELAPSED: ${stats.timeStr}`, this.width / 2, 330);
    ctx.fillText(`DETECTION RATING: 0 ALARMS TRIGGERED (CLEAN RUN)`, this.width / 2, 360);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px monospace';
    ctx.fillText('PRESS SPACE OR CLICK TO PLAY AGAIN', this.width / 2, 430);
  }
}
