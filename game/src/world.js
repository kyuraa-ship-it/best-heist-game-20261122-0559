// Gilded Getaway — the world: one room, its thief, its watchers, and the rules that
// decide whether the thief is seen. Everything the renderer draws comes from here.
import { CAMERA, DETECT, FIELD, GUARD, LASER, PLAYER, STEP, TOOLS } from './config.js';
import { LEVELS } from './levels.js';
import { createCamera, stepCamera } from './cameras.js';
import { MODE_CHASE, MODE_INVESTIGATE, createGuard, sendGuard, stepGuard } from './guards.js';
import { chargesLeft, createTools, stepTools } from './tools.js';

export const EVENT_NONE = 0;
export const EVENT_CAUGHT = 1;
export const EVENT_LEVEL = 2;
export const EVENT_WIN = 4;
export const EVENT_OVER = 8;
export const EVENT_GRAB = 16;
export const EVENT_SPOTTED = 32;

export function createWorld(random) {
  const world = {
    random,
    levelIndex: 0,
    level: LEVELS[0],
    player: { x: 0, y: 0, facing: -Math.PI / 2, moving: false, sneaking: false },
    guards: [],
    cameras: [],
    tools: createTools(),
    pickups: [],
    lootTaken: false,
    exitOpen: false,
    alarm: 0,
    alarmPulse: 0,
    maxAlarm: 0,
    lives: 3,
    score: 0,
    time: 0,
    laserCooldown: 0,
    levelScore: 0,
    levelTime: 0,
    won: false,
  };
  loadLevel(world, 0);
  return world;
}

export function loadLevel(world, index) {
  const level = LEVELS[index];
  world.levelIndex = index;
  world.level = level;
  world.player.x = level.player.x;
  world.player.y = level.player.y;
  world.player.facing = -Math.PI / 2;
  world.guards = level.guards.map((def, i) => createGuard(def, i));
  world.cameras = level.cameras.map((def, i) => createCamera(def, i));
  world.tools = createTools();
  world.pickups = level.pickups.map((p) => ({ ...p, taken: false }));
  world.lootTaken = false;
  world.exitOpen = false;
  world.alarm = 0;
  world.alarmPulse = 0;
  world.levelTime = 0;
  world.laserCooldown = 0;
}

export function resetRun(world) {
  world.lives = 3;
  world.score = 0;
  world.time = 0;
  world.won = false;
  loadLevel(world, 0);
}

/** Solid shapes: walls, cases and ropes all stop the thief. */
function solids(world) {
  const level = world.level;
  return [...level.walls, ...level.cases, ...level.ropes];
}

function circleHitsRect(x, y, r, rect) {
  const cx = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const cy = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return (x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r;
}

function movePlayer(world, dx, dy) {
  const p = world.player;
  const r = PLAYER.radius;
  const nx = p.x + dx;
  if (!solids(world).some((s) => circleHitsRect(nx, p.y, r, s))) p.x = nx;
  const ny = p.y + dy;
  if (!solids(world).some((s) => circleHitsRect(p.x, ny, r, s))) p.y = ny;
  p.x = Math.max(PLAYER.radius, Math.min(FIELD.width - PLAYER.radius, p.x));
  p.y = Math.max(PLAYER.radius, Math.min(FIELD.height - PLAYER.radius, p.y));
}

// Segment (x1,y1)-(x2,y2) against one rect, slab test; true when they cross.
function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

/** Sight is blocked by walls and cases; smoke blocks it too. */
export function lineOfSight(world, x1, y1, x2, y2) {
  const blockers = [...world.level.walls, ...world.level.cases];
  if (blockers.some((b) => segmentHitsRect(x1, y1, x2, y2, b))) return false;
  for (const cloud of world.tools.clouds) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((cloud.x - x1) * dx + (cloud.y - y1) * dy) / len2));
    const px = x1 + dx * t;
    const py = y1 + dy * t;
    if (Math.hypot(px - cloud.x, py - cloud.y) < cloud.r) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

/** True when an observer at (ox,oy) facing `facing` can see the thief right now. */
export function canSee(world, ox, oy, facing, range, halfAngle) {
  const p = world.player;
  const dx = p.x - ox;
  const dy = p.y - oy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return { seen: false, dist };
  if (angleDiff(Math.atan2(dy, dx), facing) > halfAngle) return { seen: false, dist };
  if (!lineOfSight(world, ox, oy, p.x, p.y)) return { seen: false, dist };
  return { seen: true, dist };
}

function watchGuard(world, guard, dt) {
  const seen = canSee(world, guard.x, guard.y, guard.facing, GUARD.coneRange, GUARD.coneHalf);
  const p = world.player;
  if (seen.seen) {
    const closeness = 1 - (1 - DETECT.farFactor) * (seen.dist / GUARD.coneRange);
    const rate = DETECT.guardRate * closeness * (p.sneaking ? DETECT.sneakFactor : 1);
    guard.suspicion = Math.min(DETECT.alertAt, guard.suspicion + rate * dt);
    if (guard.suspicion >= DETECT.alertAt) guard.mode = MODE_CHASE;
    else if (guard.suspicion >= DETECT.suspiciousAt && guard.mode !== MODE_CHASE) {
      guard.mode = MODE_INVESTIGATE;
      guard.target = { x: p.x, y: p.y };
    }
    return seen.seen ? { x: p.x, y: p.y } : null;
  }
  guard.suspicion = Math.max(0, guard.suspicion - DETECT.decay * dt);
  return null;
}

function watchCamera(world, camera, dt) {
  if (camera.disabledLeft > 0) return;
  const seen = canSee(world, camera.x, camera.y, camera.angle, camera.range, CAMERA.coneHalf);
  if (seen.seen) {
    const closeness = 1 - (1 - DETECT.farFactor) * (seen.dist / camera.range);
    camera.suspicion = Math.min(DETECT.alertAt, camera.suspicion + DETECT.cameraRate * closeness * dt);
    if (camera.suspicion >= DETECT.alertAt && !camera.tripped) {
      camera.tripped = true;
      world.alarmPulse = Math.min(60, world.alarmPulse + 25);
      // The nearest guard goes to look at the thief.
      let best = null;
      let bestDist = Infinity;
      for (const guard of world.guards) {
        const d = Math.hypot(guard.x - world.player.x, guard.y - world.player.y);
        if (d < bestDist) {
          bestDist = d;
          best = guard;
        }
      }
      if (best) sendGuard(best, world.player.x, world.player.y);
    }
  } else {
    camera.suspicion = Math.max(0, camera.suspicion - DETECT.decay * dt);
    if (camera.suspicion < 60) camera.tripped = false;
  }
}

function laserOn(laser, time) {
  return (time + laser.phase) % laser.period < laser.period / 2;
}

export function laserIsOn(world, laser) {
  return laserOn(laser, world.time);
}

/**
 * Advance the world one fixed step. `input` is {mx, my, sneak, interact, throwAt}
 * plus tool calls the caller makes through tools.js. Returns an event bitmask.
 */
export function step(world, input, dt = STEP) {
  const p = world.player;
  let events = EVENT_NONE;
  world.time += dt;
  world.levelTime += dt;
  if (world.laserCooldown > 0) world.laserCooldown -= dt;

  // Move the thief.
  const speed = input.sneak ? PLAYER.sneak : PLAYER.walk;
  const len = Math.hypot(input.mx, input.my);
  p.sneaking = input.sneak;
  p.moving = len > 0.1;
  if (p.moving) {
    const nx = (input.mx / len) * speed * dt;
    const ny = (input.my / len) * speed * dt;
    movePlayer(world, nx, ny);
    p.facing = Math.atan2(input.my, input.mx);
  }

  // Coin toss: a clink pulls the nearest guard in earshot to the landing spot.
  if (input.throwAt) {
    const lure = world.tools.lures[world.tools.lures.length - 1];
    if (lure) {
      for (const guard of world.guards) {
        if (Math.hypot(guard.x - lure.x, guard.y - lure.y) < TOOLS.coinLureRadius) {
          sendGuard(guard, lure.x, lure.y);
        }
      }
    }
  }

  stepTools(world.tools, dt);

  // Lasers sting a thief who crosses a live beam.
  for (const laser of world.level.lasers) {
    if (!laserOn(laser, world.time) || world.laserCooldown > 0) continue;
    if (circleHitsRect(p.x, p.y, PLAYER.radius, laser)) {
      world.alarmPulse = Math.min(60, world.alarmPulse + LASER.alarmHit);
      world.laserCooldown = LASER.cooldown;
      events |= EVENT_SPOTTED;
    }
  }

  // Pickups.
  for (const pickup of world.pickups) {
    if (pickup.taken) continue;
    if (Math.hypot(p.x - pickup.x, p.y - pickup.y) < 26) {
      pickup.taken = true;
      if (pickup.kind === 'smoke') world.tools.smoke += 1;
      if (pickup.kind === 'coin') world.tools.coin += 2;
      if (pickup.kind === 'emp') world.tools.emp += 1;
    }
  }

  // Grab the loot, then the exit opens.
  const loot = world.level.loot;
  if (!world.lootTaken && input.interact && Math.hypot(p.x - loot.x, p.y - loot.y) < 34) {
    world.lootTaken = true;
    world.exitOpen = true;
    world.score += loot.value;
    events |= EVENT_GRAB;
  }

  // Reach the open exit.
  const exit = world.level.exit;
  if (world.exitOpen && Math.hypot(p.x - exit.x, p.y - exit.y) < 28) {
    world.levelScore = Math.max(0, Math.round((world.level.par - world.levelTime) * 10)) + chargesLeft(world.tools) * 25;
    world.score += world.levelScore;
    if (world.levelIndex + 1 >= LEVELS.length) {
      world.won = true;
      return events | EVENT_WIN;
    }
    loadLevel(world, world.levelIndex + 1);
    return events | EVENT_LEVEL;
  }

  // Watchers.
  let maxSuspicion = 0;
  for (const guard of world.guards) {
    const seen = watchGuard(world, guard, dt);
    stepGuard(guard, dt, seen, p);
    maxSuspicion = Math.max(maxSuspicion, guard.suspicion);
    if (guard.mode === MODE_CHASE && Math.hypot(guard.x - p.x, guard.y - p.y) < DETECT.catchRadius) {
      return events | EVENT_CAUGHT;
    }
  }
  for (const camera of world.cameras) {
    stepCamera(camera, dt, world.time);
    watchCamera(world, camera, dt);
    maxSuspicion = Math.max(maxSuspicion, camera.suspicion);
  }

  world.alarmPulse = Math.max(0, world.alarmPulse - 12 * dt);
  world.alarm = Math.min(100, Math.max(maxSuspicion, world.alarmPulse));
  world.maxAlarm = Math.max(world.maxAlarm, world.alarm);
  return events;
}

/** After a catch: the thief slips back to the door, the room settles, one life fewer. */
export function respawn(world) {
  world.lives -= 1;
  if (world.lives <= 0) return EVENT_OVER;
  loadLevel(world, world.levelIndex);
  world.alarm = 30;
  world.alarmPulse = 30;
  return EVENT_NONE;
}
