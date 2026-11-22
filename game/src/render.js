// Gilded Getaway — everything the player sees: the gallery, the cones, the loot,
// the alarm meter, and every screen between title and getaway. One canvas, no images.
import { CAMERA, FIELD, GUARD, PALETTE, PLAYER } from './config.js';
import { MODE_CHASE, MODE_INVESTIGATE } from './guards.js';
import { laserIsOn } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_LEVEL = 'level';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';

const HUD = FIELD.hud;

function cone(ctx, x, y, facing, range, half, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - half, facing + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - half) * range, y + Math.sin(facing - half) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + half) * range, y + Math.sin(facing + half) * range);
  ctx.stroke();
}

function drawRoom(ctx, world) {
  const level = world.level;
  // Floor: quiet checker so movement reads at a glance.
  for (let ty = 0; ty < FIELD.height / 60; ty += 1) {
    for (let tx = 0; tx < FIELD.width / 60; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floorA : PALETTE.floorB;
      ctx.fillRect(tx * 60, HUD + ty * 60, 60, 60);
    }
  }
  // Gold trim inside the walls.
  ctx.strokeStyle = PALETTE.gold;
  ctx.globalAlpha = 0.35;
  ctx.lineWidth = 2;
  ctx.strokeRect(20, HUD + 20, FIELD.width - 40, FIELD.height - 40);
  ctx.globalAlpha = 1;

  // Walls.
  for (const wall of level.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(wall.x, HUD + wall.y, wall.w, wall.h);
    ctx.strokeStyle = PALETTE.wallEdge;
    ctx.lineWidth = 1;
    ctx.strokeRect(wall.x + 0.5, HUD + wall.y + 0.5, wall.w - 1, wall.h - 1);
  }

  // Display cases: glass over gold frames, a glint inside each.
  for (const c of level.cases) {
    ctx.fillStyle = PALETTE.caseFrame;
    ctx.fillRect(c.x - 3, HUD + c.y - 3, c.w + 6, c.h + 6);
    ctx.fillStyle = PALETTE.caseGlass;
    ctx.fillRect(c.x, HUD + c.y, c.w, c.h);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
    ctx.beginPath();
    ctx.arc(c.x + c.w / 2, HUD + c.y + c.h / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Velvet ropes: crimson lines on gold posts; you can be seen over them.
  for (const rope of level.ropes) {
    ctx.strokeStyle = PALETTE.rope;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(rope.x, HUD + rope.y + 5);
    ctx.quadraticCurveTo(rope.x + rope.w / 2, HUD + rope.y + 14, rope.x + rope.w, HUD + rope.y + 5);
    ctx.stroke();
    ctx.fillStyle = PALETTE.ropePost;
    ctx.beginPath();
    ctx.arc(rope.x, HUD + rope.y + 5, 4, 0, Math.PI * 2);
    ctx.arc(rope.x + rope.w, HUD + rope.y + 5, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Lasers blink on and off: cross only while dark.
  for (const laser of level.lasers) {
    const on = laserIsOn(world, laser);
    ctx.fillStyle = on ? PALETTE.laser : 'rgba(255, 45, 85, 0.12)';
    ctx.fillRect(laser.x, HUD + laser.y, laser.w, laser.h);
    ctx.fillStyle = '#ff5b7a';
    ctx.fillRect(laser.x - 4, HUD + laser.y - 3, 8, laser.h + 6);
    ctx.fillRect(laser.x + laser.w - 4, HUD + laser.y - 3, 8, laser.h + 6);
  }

  // Pickups: smoke canister, coin purse, EMP cell.
  for (const pickup of level.pickups) {
    if (pickup.taken) continue;
    const bob = Math.sin(world.time * 3 + pickup.x) * 2;
    ctx.beginPath();
    ctx.arc(pickup.x, HUD + pickup.y + bob, 9, 0, Math.PI * 2);
    ctx.fillStyle = pickup.kind === 'smoke' ? '#c8cdd7' : pickup.kind === 'coin' ? '#ffd94d' : '#7fd4ff';
    ctx.fill();
    ctx.fillStyle = '#10131d';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(pickup.kind === 'smoke' ? 'S' : pickup.kind === 'coin' ? 'C' : 'E', pickup.x, HUD + pickup.y + bob);
  }

  // Loot pedestal and its glowing prize.
  const loot = level.loot;
  const pulse = 0.6 + 0.4 * Math.sin(world.time * 3);
  ctx.fillStyle = '#3a3f52';
  ctx.fillRect(loot.x - 16, HUD + loot.y - 10, 32, 20);
  ctx.strokeStyle = PALETTE.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(loot.x - 16, HUD + loot.y - 10, 32, 20);
  if (!world.lootTaken) {
    ctx.save();
    ctx.globalAlpha = 0.25 + 0.35 * pulse;
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.arc(loot.x, HUD + loot.y - 14, 22 + 6 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = PALETTE.loot;
    ctx.beginPath();
    ctx.moveTo(loot.x, HUD + loot.y - 26);
    ctx.lineTo(loot.x + 8, HUD + loot.y - 14);
    ctx.lineTo(loot.x, HUD + loot.y - 2);
    ctx.lineTo(loot.x - 8, HUD + loot.y - 14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#10131d';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(loot.name.toUpperCase(), loot.x, HUD + loot.y + 34);
  }

  // Exit vent: dark grate, green and open once the loot is taken.
  const exit = level.exit;
  ctx.fillStyle = world.exitOpen ? PALETTE.exitOpen : PALETTE.exitClosed;
  ctx.beginPath();
  ctx.arc(exit.x, HUD + exit.y, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#10131d';
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i += 1) {
    ctx.beginPath();
    ctx.moveTo(exit.x - 12, HUD + exit.y + i * 6);
    ctx.lineTo(exit.x + 12, HUD + exit.y + i * 6);
    ctx.stroke();
  }
  if (world.exitOpen) {
    ctx.fillStyle = '#d7ffe8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', exit.x, HUD + exit.y - 26);
  }
}

function drawCones(ctx, world) {
  for (const camera of world.cameras) {
    const disabled = camera.disabledLeft > 0;
    cone(
      ctx, camera.x, HUD + camera.y, camera.angle, camera.range, CAMERA.coneHalf,
      disabled ? PALETTE.cameraOff : PALETTE.cameraCone,
      disabled ? 'rgba(120,120,120,0.4)' : 'rgba(220,60,60,0.5)',
    );
  }
  for (const guard of world.guards) {
    const hot = guard.suspicion >= 45;
    cone(
      ctx, guard.x, HUD + guard.y, guard.facing, GUARD.coneRange, GUARD.coneHalf,
      hot ? PALETTE.guardConeHot : PALETTE.guardCone,
      hot ? 'rgba(232,80,40,0.55)' : 'rgba(232,164,60,0.45)',
    );
  }
}

function drawActors(ctx, world) {
  // Smoke clouds hide everything under them.
  for (const cloud of world.tools.clouds) {
    ctx.fillStyle = PALETTE.smoke;
    ctx.beginPath();
    ctx.arc(cloud.x, HUD + cloud.y, cloud.r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cameras: wall mounts with a lens.
  for (const camera of world.cameras) {
    const disabled = camera.disabledLeft > 0;
    ctx.fillStyle = disabled ? '#555a6a' : '#c23b3b';
    ctx.fillRect(camera.x - 8, HUD + camera.y - 6, 16, 12);
    ctx.fillStyle = disabled ? '#222' : '#ffd94d';
    ctx.beginPath();
    ctx.arc(camera.x, HUD + camera.y, 3, 0, Math.PI * 2);
    ctx.fill();
    if (disabled) {
      ctx.fillStyle = '#c8cdd7';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('OFF', camera.x, HUD + camera.y + 18);
    }
  }

  // Guards: pale uniforms, a direction tick, and ? / ! over their heads.
  for (const guard of world.guards) {
    ctx.fillStyle = PALETTE.guard;
    ctx.beginPath();
    ctx.arc(guard.x, HUD + guard.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#10131d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(guard.x, HUD + guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 14, HUD + guard.y + Math.sin(guard.facing) * 14);
    ctx.stroke();
    if (guard.suspicion > 2) {
      ctx.strokeStyle = guard.mode === MODE_CHASE ? '#ff5030' : '#e8a43c';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guard.x, HUD + guard.y, GUARD.radius + 4, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * guard.suspicion) / 100);
      ctx.stroke();
    }
    if (guard.mode === MODE_CHASE || guard.mode === MODE_INVESTIGATE) {
      ctx.fillStyle = guard.mode === MODE_CHASE ? '#ff5030' : '#e8a43c';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.mode === MODE_CHASE ? '!' : '?', guard.x, HUD + guard.y - 20);
    }
  }

  // The thief: a hooded figure in blue, quieter when sneaking.
  const p = world.player;
  ctx.save();
  if (p.sneaking) ctx.globalAlpha = 0.75;
  ctx.fillStyle = PALETTE.playerCloak;
  ctx.beginPath();
  ctx.moveTo(p.x, HUD + p.y - PLAYER.radius - 2);
  ctx.lineTo(p.x - PLAYER.radius, HUD + p.y + PLAYER.radius);
  ctx.lineTo(p.x + PLAYER.radius, HUD + p.y + PLAYER.radius);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(p.x, HUD + p.y - 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#10131d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x, HUD + p.y - 2);
  ctx.lineTo(p.x + Math.cos(p.facing) * 12, HUD + p.y - 2 + Math.sin(p.facing) * 12);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx, world, info) {
  ctx.fillStyle = PALETTE.hud;
  ctx.fillRect(0, 0, FIELD.width, HUD);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`GILDED GETAWAY · ${world.level.name.toUpperCase()}`, 10, HUD / 2);

  // Alarm meter: the room's temper, green to red.
  const ax = 330;
  ctx.fillStyle = '#e8e4d8';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ALARM', ax, HUD / 2);
  const barX = ax + 52;
  const barW = 150;
  ctx.fillStyle = '#2c3350';
  ctx.fillRect(barX, HUD / 2 - 8, barW, 16);
  const alarm = world.alarm;
  ctx.fillStyle = alarm < 45 ? '#37d67a' : alarm < 80 ? '#e8a43c' : '#ff5030';
  ctx.fillRect(barX, HUD / 2 - 8, (barW * alarm) / 100, 16);
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX + 0.5, HUD / 2 - 8.5, barW, 17);
  ctx.fillStyle = '#10131d';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${Math.round(alarm)}%`, barX + barW / 2, HUD / 2);

  // Tools, lives, score, time.
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '12px sans-serif';
  const tools = world.tools;
  ctx.fillText(`◉ ${tools.smoke}   ● ${tools.coin}   ⚡ ${tools.emp}`, 570, HUD / 2);
  ctx.fillStyle = '#ff6b81';
  ctx.fillText('♥'.repeat(Math.max(0, world.lives)), 690, HUD / 2);
  ctx.fillStyle = PALETTE.hudText;
  ctx.textAlign = 'right';
  ctx.fillText(`SCORE ${world.score}`, 940, HUD / 2 - 9);
  ctx.fillStyle = '#9aa3b8';
  ctx.font = '11px sans-serif';
  ctx.fillText(`${Math.floor(world.levelTime)}s / par ${world.level.par}s`, 940, HUD / 2 + 10);
  if (info && info.hint) {
    ctx.fillStyle = '#9aa3b8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(info.hint, FIELD.width / 2, FIELD.height + HUD - 20);
  }
}

function panel(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(10, 12, 20, 0.82)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height + HUD);
  const w = 560;
  const h = 120 + lines.length * 30;
  const x = (FIELD.width - w) / 2;
  const y = (FIELD.height + HUD - h) / 2;
  ctx.fillStyle = '#171c2b';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  ctx.fillStyle = accent;
  ctx.font = 'bold 30px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, FIELD.width / 2, y + 44);
  ctx.fillStyle = PALETTE.hudText;
  ctx.font = '15px sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, FIELD.width / 2, y + 88 + i * 30);
  });
}

export function createRenderer(canvas) {
  canvas.width = FIELD.width;
  canvas.height = FIELD.height + HUD;
  const ctx = canvas.getContext('2d');

  function draw(world, screen, info = {}) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawRoom(ctx, world);
    drawCones(ctx, world);
    drawActors(ctx, world);
    drawHud(ctx, world, info);

    if (screen === SCREEN_TITLE) {
      panel(ctx, 'GILDED GETAWAY', [
        'One thief. Three rooms. The Halcyon Gallery keeps its gold — take it anyway.',
        'WASD / arrows move · Shift sneak · E grab loot · 1 smoke · 2 coin · 3 EMP · click toss a coin',
        'Stay out of the amber cones and the red camera sweeps. Fill the alarm and they run you down.',
        `Best getaway: ${info.best ?? 0} points`,
        'Press Enter to begin the heist',
      ], PALETTE.gold);
    } else if (screen === SCREEN_PAUSED) {
      panel(ctx, 'PAUSED', ['The gallery waits. Press P to slip back into the dark.'], PALETTE.hudText);
    } else if (screen === SCREEN_LEVEL) {
      panel(ctx, 'ROOM CLEARED', [
        `${world.level.name} — loot secured.`,
        `Time bonus ${info.levelBonus ?? 0} · total score ${world.score}`,
        'Press Enter for the next room',
      ], PALETTE.exitOpen);
    } else if (screen === SCREEN_WIN) {
      panel(ctx, 'CLEAN GETAWAY', [
        'Every room emptied, every guard still looking the wrong way.',
        `Final score ${world.score} · best ${info.best ?? world.score}`,
        'Press Enter to run it again',
      ], PALETTE.gold);
    } else if (screen === SCREEN_OVER) {
      panel(ctx, 'CAUGHT', [
        'The gallery keeps its gold this time.',
        `Score ${world.score} · best ${info.best ?? world.score}`,
        'Press Enter to try again',
      ], '#ff5030');
    }
    if (info.flash) {
      ctx.fillStyle = 'rgba(255, 48, 48, 0.25)';
      ctx.fillRect(0, 0, FIELD.width, FIELD.height + HUD);
      ctx.fillStyle = '#ff5030';
      ctx.font = 'bold 44px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('CAUGHT!', FIELD.width / 2, (FIELD.height + HUD) / 2);
    }
  }

  return { draw };
}
