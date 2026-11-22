// Gilded Getaway — boot and the one loop: input is read every frame, the world advances
// in fixed 1/60 s steps, and the renderer paints what is there. The game moves between
// title, play, paused, room-cleared, caught and getaway screens.
//
// ?seed=N fixes the run. ?shot=start|play|alarm|win (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady for a screenshot.
import { BEST_KEY, FIELD, STEP } from './config.js';
import { createRandom } from './random.js';
import { createAudio } from './audio.js';
import { ACTION_CONFIRM, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_LEVEL, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';
import { createWorld, EVENT_CAUGHT, EVENT_GRAB, EVENT_LEVEL, EVENT_OVER, EVENT_SPOTTED, EVENT_WIN, resetRun, respawn, step as stepWorld } from './world.js';
import { useCoin, useEmp, useSmoke } from './tools.js';

const MAX_FRAME = 0.25;
const HINT = 'WASD move · Shift sneak · E grab loot · 1 smoke · 2 coin · 3 EMP · click toss a coin · P pause';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld(createRandom(seed));
const renderer = createRenderer(canvas);
const audio = createAudio();

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function fitCanvas() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / (FIELD.height + FIELD.hud));
  canvas.style.width = `${Math.floor(FIELD.width * scale)}px`;
  canvas.style.height = `${Math.floor((FIELD.height + FIELD.hud) * scale)}px`;
}
window.addEventListener('resize', fitCanvas);
fitCanvas();

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world, scene.screen, { best: scene.best });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let flashLeft = 0;
  let alarmWasHigh = false;
  let pendingThrow = null;

  const input = createInput(canvas, (x, y) => {
    if (screen !== SCREEN_PLAY) return;
    pendingThrow = { x, y: y - FIELD.hud };
  });

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function startRun() {
    resetRun(world);
    screen = SCREEN_PLAY;
    flashLeft = 0;
    alarmWasHigh = false;
    setStatus(`Playing ${world.level.name}. Steal the loot and reach the exit.`);
  }

  function handleEvents(events) {
    if (events & EVENT_GRAB) {
      audio.grab();
      setStatus('Loot secured. Reach the green exit vent.');
    }
    if (events & EVENT_SPOTTED) audio.alarm();
    if (events & EVENT_CAUGHT) {
      audio.caught();
      flashLeft = 0.9;
      const outcome = respawn(world);
      if (outcome & EVENT_OVER) {
        screen = SCREEN_OVER;
        if (world.score > best) {
          best = world.score;
          saveBest(best);
        }
        setStatus('Caught. The gallery keeps its gold.');
      } else {
        setStatus('Caught! Slipped back to the door — one life fewer.');
      }
    }
    if (events & EVENT_LEVEL) {
      screen = SCREEN_LEVEL;
      setStatus(`${world.level.name} cleared. Press Enter for the next room.`);
    }
    if (events & EVENT_WIN) {
      audio.win();
      screen = SCREEN_WIN;
      if (world.score > best) {
        best = world.score;
        saveBest(best);
      }
      setStatus(`Clean getaway. Final score ${world.score}.`);
    }
  }

  function frame(now) {
    const elapsed = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;

    if (input.consume(ACTION_MUTE)) audio.toggleMute();
    if (input.consume(ACTION_PAUSE) && (screen === SCREEN_PLAY || screen === SCREEN_PAUSED)) {
      screen = screen === SCREEN_PLAY ? SCREEN_PAUSED : SCREEN_PLAY;
    }

    if (screen === SCREEN_TITLE || screen === SCREEN_OVER || screen === SCREEN_WIN || screen === SCREEN_LEVEL) {
      if (input.consume(ACTION_CONFIRM)) {
        audio.unlock();
        startRun();
      }
    } else if (screen === SCREEN_PLAY) {
      audio.unlock();
      if (input.consume('smoke') && useSmoke(world.tools, world.player.x, world.player.y)) audio.smoke();
      if (input.consume('coin-arm')) {
        const p = world.player;
        const tx = p.x + Math.cos(p.facing) * 90;
        const ty = p.y + Math.sin(p.facing) * 90;
        if (useCoin(world.tools, tx, ty)) {
          audio.coin();
          pendingThrow = { x: tx, y: ty };
        }
      }
      if (input.consume('emp') && useEmp(world.tools, world.cameras)) audio.emp();

      accumulator += elapsed;
      while (accumulator >= STEP) {
        accumulator -= STEP;
        const stepInput = {
          mx: input.mx,
          my: input.my,
          sneak: input.sneak,
          interact: input.interact,
          throwAt: pendingThrow,
        };
        pendingThrow = null;
        handleEvents(stepWorld(world, stepInput, STEP));
        if (screen !== SCREEN_PLAY) break;
      }
      if (world.alarm >= 80 && !alarmWasHigh) {
        alarmWasHigh = true;
        audio.alarm();
      } else if (world.alarm < 50) {
        alarmWasHigh = false;
      }
    }

    if (flashLeft > 0) flashLeft -= elapsed;
    const hint = screen === SCREEN_PLAY ? HINT : null;
    renderer.draw(world, screen, { best, levelBonus: world.levelScore, hint, flash: flashLeft > 0 });
    requestAnimationFrame(frame);
  }

  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
