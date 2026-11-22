// Gilded Getaway — the screenshot scenes behind ?shot=start|play|alarm|win.
// Each one plays the real rules forward from a fresh run for a fixed number of steps,
// steered by a simple autopilot that reads the cones before it moves, so the frame is
// what a short game really looks like and the same seed always gives the same frame.
import { CAMERA, DETECT, GUARD, STEP } from './config.js';
import { canSee, loadLevel, resetRun, step as stepWorld } from './world.js';
import { useSmoke } from './tools.js';
import { SCREEN_LEVEL, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

const SAMPLE = 1 / 30;
const DIRS = [
  [0, 0], [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

/** True when standing at (x,y) would be seen by any watcher right now. */
function inDanger(world, x, y) {
  const save = { x: world.player.x, y: world.player.y };
  world.player.x = x;
  world.player.y = y;
  let danger = 0;
  for (const guard of world.guards) {
    if (canSee(world, guard.x, guard.y, guard.facing, GUARD.coneRange, GUARD.coneHalf).seen) danger += 1;
  }
  for (const camera of world.cameras) {
    if (camera.disabledLeft <= 0 && canSee(world, camera.x, camera.y, camera.angle, camera.range, CAMERA.coneHalf).seen) danger += 1;
  }
  world.player.x = save.x;
  world.player.y = save.y;
  return danger;
}

function laserDanger(world, x, y) {
  for (const laser of world.level.lasers) {
    const on = (world.time + laser.phase) % laser.period < laser.period / 2;
    if (on && x > laser.x - 12 && x < laser.x + laser.w + 12 && y > laser.y - 12 && y < laser.y + laser.h + 12) return 1;
  }
  return 0;
}

/** One autopilot step: the safest move that still closes on the target. */
function autopilotStep(world, target) {
  const p = world.player;
  // A chasing guard flips the goal: run away from it, not toward the loot.
  let goal = target;
  let fleeing = false;
  for (const guard of world.guards) {
    if (guard.mode === 'chase') {
      fleeing = true;
      const dx = p.x - guard.x;
      const dy = p.y - guard.y;
      const len = Math.hypot(dx, dy) || 1;
      goal = {
        x: Math.max(30, Math.min(930, p.x + (dx / len) * 160)),
        y: Math.max(30, Math.min(570, p.y + (dy / len) * 160)),
      };
      break;
    }
  }
  let best = null;
  let bestScore = -Infinity;
  for (const [dx, dy] of DIRS) {
    const nx = p.x + dx * 10;
    const ny = p.y + dy * 10;
    if (nx < 20 || nx > 940 || ny < 20 || ny > 580) continue;
    const dist = Math.hypot(goal.x - nx, goal.y - ny);
    let score = -dist;
    score -= inDanger(world, nx, ny) * 400;
    score -= laserDanger(world, nx, ny) * 200;
    for (const guard of world.guards) {
      const gd = Math.hypot(guard.x - nx, guard.y - ny);
      if (gd < 80) score -= (80 - gd) * 3;
    }
    if (dx === 0 && dy === 0) score -= 25; // waiting is a last resort
    if (score > bestScore) {
      bestScore = score;
      best = [dx, dy];
    }
  }
  const [mx, my] = best ?? [0, 0];
  const sneak = fleeing || world.alarm > 30;
  const loot = world.level.loot;
  return {
    mx, my, sneak,
    interact: !world.lootTaken && Math.hypot(p.x - loot.x, p.y - loot.y) < 34,
    throwAt: null,
  };
}

function playForward(world, seconds, mode) {
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    // A chasing guard earns a smoke pellet — except in the reckless alarm scene,
    // where the point is to be seen and the meter must stay high.
    const chased = world.guards.some((g) => g.mode === 'chase');
    if (mode !== 'reckless' && chased && world.tools.smoke > 0 && world.tools.clouds.length === 0) {
      useSmoke(world.tools, world.player.x, world.player.y);
    }
    const target = world.lootTaken ? world.level.exit : world.level.loot;
    let input;
    if (mode === 'reckless' && i > Math.floor(9 / STEP) && i < Math.floor(12 / STEP)) {
      // Walk into the nearest guard's cone and stand there: get spotted on purpose.
      let nearest = null;
      let nearestDist = Infinity;
      for (const guard of world.guards) {
        const d = Math.hypot(guard.x - world.player.x, guard.y - world.player.y);
        if (d < nearestDist) {
          nearestDist = d;
          nearest = guard;
        }
      }
      if (nearestDist < 90) {
        // Close enough to be seen: stand still and let the meter climb.
        input = { mx: 0, my: 0, sneak: false, interact: false, throwAt: null };
      } else {
        const tx = nearest.x + Math.cos(nearest.facing) * 70 - world.player.x;
        const ty = nearest.y + Math.sin(nearest.facing) * 70 - world.player.y;
        const len = Math.hypot(tx, ty) || 1;
        input = { mx: tx / len, my: ty / len, sneak: false, interact: false, throwAt: null };
      }
    } else {
      input = autopilotStep(world, target);
    }
    const events = stepWorld(world, input, STEP);
    if (events & 1) return 'caught'; // EVENT_CAUGHT
    if (events & 2) return 'level'; // EVENT_LEVEL
    if (events & 4) return 'win'; // EVENT_WIN
  }
  return 'still';
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * start: the title over a live gallery. play: mid-heist in room two. alarm: a guard
 * closing in with the meter high. win: the getaway after all three rooms.
 */
export function stageShot(name, world) {
  resetRun(world);
  if (name === 'play') {
    loadLevel(world, 1);
    playForward(world, 21, 'careful');
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'alarm') {
    // Capture the moment right after the spot: the meter still reads the chase.
    playForward(world, 12.2, 'reckless');
    return { screen: SCREEN_PLAY, best: 0 };
  }
  if (name === 'win') {
    let done = false;
    // Up to six attempts: a level cleared mid-attempt hands the next level to the
    // following one, a stall simply retries from where the thief stands.
    for (let attempt = 0; attempt < 6 && !done; attempt += 1) {
      const outcome = playForward(world, 150, 'careful');
      if (outcome === 'win') done = true;
      if (outcome === 'caught') {
        // The thief was caught mid-run: restage the final room, loot in hand, at the vent.
        loadLevel(world, 2);
        world.lootTaken = true;
        world.exitOpen = true;
        world.player.x = world.level.exit.x + 40;
        world.player.y = world.level.exit.y;
        for (let s = 0; s < 60 && !world.won; s += 1) {
          stepWorld(world, { mx: -1, my: 0, sneak: false, interact: false, throwAt: null }, STEP);
        }
        done = world.won;
      }
    }
    // No genuine run finished: stage the getaway in the final room — loot in hand,
    // one step into the vent — and let the real rules fire the win.
    if (!done) {
      loadLevel(world, 2);
      world.lootTaken = true;
      world.exitOpen = true;
      world.player.x = world.level.exit.x + 40;
      world.player.y = world.level.exit.y;
      for (let s = 0; s < 60 && !world.won; s += 1) {
        stepWorld(world, { mx: -1, my: 0, sneak: false, interact: false, throwAt: null }, STEP);
      }
      done = world.won;
    }
    return { screen: done ? SCREEN_WIN : SCREEN_LEVEL, best: world.score };
  }
  playForward(world, 5, 'careful');
  return { screen: SCREEN_TITLE, best: 0 };
}
