import { GUARD_CONFIG, COLORS } from './config.js';
import { castVisionCone, hasLineOfSight } from './raycast.js';

export const STATE_PATROL = 'PATROL';
export const STATE_SUSPICIOUS = 'SUSPICIOUS';
export const STATE_INVESTIGATING = 'INVESTIGATING';
export const STATE_ALERT = 'ALERT';

export class Guard {
  constructor(id, name, waypoints, startAngle = 0) {
    this.id = id;
    this.name = name;
    this.waypoints = waypoints; // Array of {x, y, waitSec}
    this.waypointIndex = 0;
    this.x = waypoints[0].x;
    this.y = waypoints[0].y;
    this.angle = startAngle;
    this.targetAngle = startAngle;
    this.state = STATE_PATROL;
    this.suspicion = 0; // 0 to 1
    this.waitTimer = waypoints[0].waitSec || 1.5;
    
    this.investigateTarget = null;
    this.thought = '';
    this.thoughtTimer = 0;
    this.conePoints = [];
  }

  setThought(text, duration = 2.5) {
    this.thought = text;
    this.thoughtTimer = duration;
  }

  hearNoise(targetX, targetY, isPebble = false) {
    if (this.state === STATE_ALERT) return; // already in combat chase
    this.state = STATE_INVESTIGATING;
    this.investigateTarget = { x: targetX, y: targetY };
    this.targetAngle = Math.atan2(targetY - this.y, targetX - this.x);
    this.setThought(isPebble ? 'What was that noise?' : 'Footsteps?');
  }

  update(dt, player, segments, inShadow, soundController) {
    if (this.thoughtTimer > 0) {
      this.thoughtTimer -= dt;
      if (this.thoughtTimer <= 0) this.thought = '';
    }

    // Smooth angle rotation
    let angleDiff = this.targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    this.angle += angleDiff * Math.min(1, dt * 6);

    // Compute dynamic vision cone
    const effectiveRange = inShadow ? GUARD_CONFIG.coneRangeShadow : (player.inLight ? GUARD_CONFIG.coneRangeLit : GUARD_CONFIG.coneRangeNormal);
    this.conePoints = castVisionCone(this.x, this.y, this.angle, GUARD_CONFIG.coneFov, effectiveRange, segments);

    // Check player detection inside vision cone
    const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);
    let canSeePlayer = false;

    if (distToPlayer <= effectiveRange) {
      const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
      let fovDiff = angleToPlayer - this.angle;
      while (fovDiff > Math.PI) fovDiff -= Math.PI * 2;
      while (fovDiff < -Math.PI) fovDiff += Math.PI * 2;

      if (Math.abs(fovDiff) <= GUARD_CONFIG.coneFov / 2) {
        if (hasLineOfSight(this.x, this.y, player.x, player.y, segments)) {
          // If sneaking in deep shadow and far, hard to spot
          if (!player.isSneaking || !inShadow || distToPlayer < 70) {
            canSeePlayer = true;
          }
        }
      }
    }

    // State machine transitions
    if (canSeePlayer) {
      this.suspicion += dt * GUARD_CONFIG.suspicionBuildRate * (player.inLight ? 2.0 : (inShadow ? 0.8 : 1.2));
      this.targetAngle = Math.atan2(player.y - this.y, player.x - this.x);

      if (this.suspicion >= 1.0) {
        if (this.state !== STATE_ALERT) {
          this.state = STATE_ALERT;
          this.setThought('Intruder! Sound the alarm!');
          if (soundController) soundController.playAlarm();
        }
      } else if (this.suspicion >= 0.3) {
        if (this.state === STATE_PATROL) {
          this.state = STATE_SUSPICIOUS;
          this.setThought('Wait... who is there?');
          if (soundController) soundController.playGuardSuspicious();
        }
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - dt * GUARD_CONFIG.suspicionDecayRate);
      if (this.suspicion <= 0.05 && this.state === STATE_SUSPICIOUS) {
        this.state = STATE_PATROL;
      }
    }

    // Movement execution
    if (this.state === STATE_ALERT) {
      // Chase directly toward player
      this.targetAngle = Math.atan2(player.y - this.y, player.x - this.x);
      const moveX = Math.cos(this.angle) * GUARD_CONFIG.chaseSpeed * dt;
      const moveY = Math.sin(this.angle) * GUARD_CONFIG.chaseSpeed * dt;
      this.x += moveX;
      this.y += moveY;
    } else if (this.state === STATE_INVESTIGATING && this.investigateTarget) {
      const d = Math.hypot(this.investigateTarget.x - this.x, this.investigateTarget.y - this.y);
      if (d > 15) {
        this.targetAngle = Math.atan2(this.investigateTarget.y - this.y, this.investigateTarget.x - this.x);
        this.x += Math.cos(this.angle) * GUARD_CONFIG.investigateSpeed * dt;
        this.y += Math.sin(this.angle) * GUARD_CONFIG.investigateSpeed * dt;
      } else {
        // Reached investigation target
        this.setThought('Nothing here...');
        this.state = STATE_PATROL;
        this.investigateTarget = null;
        this.waitTimer = 2.0;
      }
    } else if (this.state === STATE_PATROL) {
      const wp = this.waypoints[this.waypointIndex];
      const d = Math.hypot(wp.x - this.x, wp.y - this.y);

      if (d > 6) {
        this.targetAngle = Math.atan2(wp.y - this.y, wp.x - this.x);
        this.x += Math.cos(this.angle) * GUARD_CONFIG.patrolSpeed * dt;
        this.y += Math.sin(this.angle) * GUARD_CONFIG.patrolSpeed * dt;
      } else {
        // At waypoint, wait
        this.waitTimer -= dt;
        if (this.waitTimer <= 0) {
          this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
          const nextWp = this.waypoints[this.waypointIndex];
          this.waitTimer = nextWp.waitSec || 1.5;
        }
      }
    }
  }
}
