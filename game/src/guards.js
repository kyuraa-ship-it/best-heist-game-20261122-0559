// Gilded Getaway — guard patrols: walk a loop, pause at each corner, then react.
// A guard has one of three moods: patrol (its loop), investigate (walk to a sound or a
// glimpse and look around), chase (run the thief down). The world sets the mood from
// suspicion; this file only moves the guard and turns its head.
import { GUARD } from './config.js';

export const MODE_PATROL = 'patrol';
export const MODE_INVESTIGATE = 'investigate';
export const MODE_CHASE = 'chase';

export function createGuard(def, index) {
  const [sx, sy] = def.path[0];
  return {
    index,
    path: def.path,
    waypoint: 1 % def.path.length,
    x: sx,
    y: sy,
    facing: 0,
    speed: def.speed,
    mode: MODE_PATROL,
    suspicion: 0,
    pauseLeft: 0,
    lookLeft: 0,
    lookDir: 1,
    target: null, // {x, y} for investigate / chase
    lostLeft: 0, // seconds a chase keeps going after losing sight
  };
}

function turnToward(guard, angle, dt) {
  let diff = angle - guard.facing;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const maxTurn = 3.2 * dt;
  guard.facing += Math.max(-maxTurn, Math.min(maxTurn, diff));
}

function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  turnToward(guard, Math.atan2(dy, dx), dt);
  return dist - step < 2;
}

/** Move one guard for dt. `seen` is the thief's position when this guard can see them, else null. */
export function stepGuard(guard, dt, seen, player) {
  if (guard.mode === MODE_CHASE) {
    if (seen) {
      guard.target = { x: seen.x, y: seen.y };
      guard.lostLeft = 3;
    } else {
      guard.lostLeft -= dt;
      if (guard.lostLeft <= 0) {
        guard.mode = MODE_INVESTIGATE;
        guard.lookLeft = 2.5;
      }
    }
    if (guard.target) walkToward(guard, guard.target.x, guard.target.y, GUARD.chase, dt);
    return;
  }

  if (guard.mode === MODE_INVESTIGATE) {
    if (guard.target) {
      if (walkToward(guard, guard.target.x, guard.target.y, GUARD.investigate, dt)) {
        guard.target = null;
        guard.lookLeft = 2.5;
      }
      return;
    }
    // Arrived: stand and sweep the room before giving up.
    guard.lookLeft -= dt;
    guard.facing += guard.lookDir * 1.6 * dt;
    if (guard.lookLeft <= 0) guard.mode = MODE_PATROL;
    return;
  }

  // Patrol: walk the loop, pausing at each waypoint to look around. The world
  // (suspicion) decides when a glimpse becomes a chase; this file only walks.
  if (guard.pauseLeft > 0) {
    guard.pauseLeft -= dt;
    guard.facing += Math.sin(guard.pauseLeft * 2.2) * 0.9 * dt;
    return;
  }
  const [wx, wy] = guard.path[guard.waypoint];
  if (walkToward(guard, wx, wy, guard.speed, dt)) {
    guard.waypoint = (guard.waypoint + 1) % guard.path.length;
    guard.pauseLeft = GUARD.pause;
  }
}

/** Point a guard at a noise (coin clink, camera trip): investigate that spot. */
export function sendGuard(guard, x, y) {
  if (guard.mode === MODE_CHASE) return;
  guard.mode = MODE_INVESTIGATE;
  guard.target = { x, y };
  guard.lookLeft = 0;
}
