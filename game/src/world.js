import { Guard } from './guard.js';

export class World {
  constructor() {
    this.width = 1024;
    this.height = 640;

    // Outer perimeter walls and interior security partitions
    this.walls = [
      // Perimeter bounds
      { x: 0, y: 0, w: 1024, h: 24, type: 'wall' },
      { x: 0, y: 616, w: 1024, h: 24, type: 'wall' },
      { x: 0, y: 24, w: 24, h: 592, type: 'wall' },
      { x: 1000, y: 24, w: 24, h: 592, type: 'wall' },

      // Infiltration Entry / West Partition
      { x: 240, y: 24, w: 18, h: 220, type: 'wall' },
      { x: 240, y: 340, w: 18, h: 300, type: 'wall' },

      // High-Security Vault (Central North)
      { x: 380, y: 24, w: 18, h: 180, type: 'wall' },
      { x: 640, y: 24, w: 18, h: 180, type: 'wall' },
      { x: 380, y: 204, w: 100, h: 18, type: 'wall' },
      { x: 540, y: 204, w: 118, h: 18, type: 'wall' }, // Vault doorway between x 480 and 540

      // East Archive Partition
      { x: 740, y: 150, w: 18, h: 320, type: 'wall' },
      { x: 740, y: 530, w: 18, h: 110, type: 'wall' },

      // Center Divider / Server Room
      { x: 380, y: 340, w: 260, h: 18, type: 'wall' },
      { x: 500, y: 450, w: 18, h: 190, type: 'wall' },

      // Tactical Cover Obstacles (Waist-high servers, crates, display pedestals)
      { x: 100, y: 180, w: 60, h: 40, type: 'cover', name: 'Cargo Crate A' },
      { x: 110, y: 380, w: 50, h: 60, type: 'cover', name: 'Server Rack 01' },
      { x: 310, y: 110, w: 40, h: 40, type: 'cover', name: 'Display Pedestal' },
      { x: 310, y: 480, w: 45, h: 70, type: 'cover', name: 'Cooling Unit' },
      { x: 420, y: 260, w: 50, h: 35, type: 'cover', name: 'Archive Console' },
      { x: 560, y: 260, w: 50, h: 35, type: 'cover', name: 'Archive Console' },
      { x: 420, y: 390, w: 50, h: 40, type: 'cover', name: 'Backup Power' },
      { x: 600, y: 420, w: 70, h: 45, type: 'cover', name: 'Cargo Crate B' },
      { x: 820, y: 220, w: 50, h: 50, type: 'cover', name: 'Mainframe Array' },
      { x: 820, y: 360, w: 50, h: 50, type: 'cover', name: 'Secure Cabinet' },
      { x: 920, y: 480, w: 55, h: 45, type: 'cover', name: 'Ventilation Hub' }
    ];

    // Ceiling spot lights (illuminate zones - walking in spotlight raises detection range)
    this.lights = [
      { x: 130, y: 120, radius: 100, intensity: 0.8 },
      { x: 512, y: 110, radius: 130, intensity: 1.0 }, // Central Vault Light
      { x: 512, y: 275, radius: 90, intensity: 0.75 },
      { x: 740, y: 80, radius: 110, intensity: 0.85 },
      { x: 880, y: 280, radius: 120, intensity: 0.9 },
      { x: 300, y: 400, radius: 95, intensity: 0.7 }
    ];

    // Primary Infiltration Objectives
    this.terminals = [
      {
        id: 'cipher',
        name: 'CYBER VAULT CIPHER',
        x: 100,
        y: 80,
        radius: 20,
        collected: false,
        desc: 'Unlocks North Vault Security Gate'
      },
      {
        id: 'schematic',
        name: 'SECURITY SCHEMATIC',
        x: 930,
        y: 380,
        radius: 20,
        collected: false,
        desc: 'Deactivates Extraction Laser Barrier'
      },
      {
        id: 'core',
        name: 'THE OBSIDIAN CORE',
        x: 512,
        y: 90,
        radius: 24,
        collected: false,
        desc: 'High-Value Prototype Prototype'
      }
    ];

    // Extraction Elevator
    this.exit = {
      x: 900,
      y: 44,
      w: 80,
      h: 60,
      unlocked: false
    };

    // Laser tripwires that sweep back and forth
    this.lasers = [
      {
        x1: 480, y1: 204,
        x2: 540, y2: 204,
        active: true,
        timer: 0,
        cycleSec: 4.0
      },
      {
        x1: 740, y1: 470,
        x2: 740, y2: 530,
        active: true,
        timer: 1.5,
        cycleSec: 3.5
      }
    ];

    // Extract segments for raycasting vision and shadow casting
    this.segments = this.buildSegments();

    // Guard units with tactical patrol routes
    this.guards = [
      new Guard('G-01', 'Vanguard Alpha', [
        { x: 290, y: 280, waitSec: 1.5 },
        { x: 340, y: 550, waitSec: 2.0 },
        { x: 100, y: 550, waitSec: 1.5 },
        { x: 100, y: 280, waitSec: 2.0 }
      ], Math.PI * 0.5),

      new Guard('G-02', 'Vault Sentinel', [
        { x: 340, y: 220, waitSec: 1.5 },
        { x: 512, y: 240, waitSec: 2.5 },
        { x: 680, y: 220, waitSec: 1.5 },
        { x: 512, y: 320, waitSec: 2.0 }
      ], 0),

      new Guard('G-03', 'Archive Sweeper', [
        { x: 800, y: 120, waitSec: 2.0 },
        { x: 890, y: 120, waitSec: 1.5 },
        { x: 890, y: 560, waitSec: 2.0 },
        { x: 790, y: 560, waitSec: 1.5 }
      ], Math.PI),

      new Guard('G-04', 'Central Enforcer', [
        { x: 440, y: 560, waitSec: 1.5 },
        { x: 680, y: 560, waitSec: 2.0 },
        { x: 680, y: 380, waitSec: 1.5 },
        { x: 440, y: 380, waitSec: 2.0 }
      ], -Math.PI * 0.5)
    ];
  }

  buildSegments() {
    const segs = [];
    for (const obj of this.walls) {
      const x1 = obj.x;
      const y1 = obj.y;
      const x2 = obj.x + obj.w;
      const y2 = obj.y + obj.h;

      // 4 perimeter edges of rectangle
      segs.push({ x1, y1, x2, y2: y1 });
      segs.push({ x2, y1, x2, y2 });
      segs.push({ x2, y2, x1, y2 });
      segs.push({ x1, y2, x1, y1 });
    }
    return segs;
  }

  updateLasers(dt) {
    for (const laser of this.lasers) {
      laser.timer = (laser.timer + dt) % laser.cycleSec;
      // Laser is active during the first 60% of cycle
      laser.active = laser.timer < laser.cycleSec * 0.65;
    }
  }

  isInLight(x, y) {
    for (const light of this.lights) {
      const d = Math.hypot(x - light.x, y - light.y);
      if (d < light.radius) {
        return true;
      }
    }
    return false;
  }

  resolveCircleCollision(x, y, radius) {
    let resolvedX = x;
    let resolvedY = y;

    for (const wall of this.walls) {
      // Find closest point in rectangle to circle
      const closestX = Math.max(wall.x, Math.min(resolvedX, wall.x + wall.w));
      const closestY = Math.max(wall.y, Math.min(resolvedY, wall.y + wall.h));

      const dx = resolvedX - closestX;
      const dy = resolvedY - closestY;
      const distSq = dx * dx + dy * dy;

      if (distSq < radius * radius) {
        const dist = Math.sqrt(distSq);
        if (dist === 0) {
          resolvedX += radius;
        } else {
          const overlap = radius - dist;
          resolvedX += (dx / dist) * overlap;
          resolvedY += (dy / dist) * overlap;
        }
      }
    }

    return { x: resolvedX, y: resolvedY };
  }
}
