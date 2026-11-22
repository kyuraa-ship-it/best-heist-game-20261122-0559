// Gilded Getaway — shared tuning: field size, speeds, detection, tools, scoring.
// One job: every number the rest of the game agrees on lives here.
export const FIELD = { width: 960, height: 600, hud: 44 };
export const STEP = 1 / 60;
export const BEST_KEY = 'gilded-getaway-best';

export const PLAYER = {
  radius: 11,
  walk: 138,
  sneak: 72,
  chaseEscape: 150,
};

export const GUARD = {
  radius: 12,
  patrol: 55,
  investigate: 85,
  chase: 148,
  coneRange: 168,
  coneHalf: 0.61, // ~35 degrees
  pause: 1.1, // seconds a guard waits at each waypoint
};

export const CAMERA = {
  coneRange: 195,
  coneHalf: 0.49, // ~28 degrees
  sweep: 0.95, // radians either side of base angle
  sweepSpeed: 0.55, // radians per second
};

export const DETECT = {
  guardRate: 62, // suspicion per second while seen, standing, point blank
  cameraRate: 74,
  sneakFactor: 0.45,
  farFactor: 0.55, // multiplier at the edge of the cone
  decay: 20,
  suspiciousAt: 45,
  alertAt: 100,
  catchRadius: 17,
};

export const TOOLS = {
  smokeStart: 2,
  coinStart: 3,
  empStart: 1,
  smokeRadius: 72,
  smokeSeconds: 5,
  empSeconds: 6,
  coinLureRadius: 230,
  coinLureSeconds: 4,
};

export const LASER = {
  alarmHit: 34, // alarm added the instant a live beam is crossed
  cooldown: 1.2, // seconds before the same beam can sting again
};

export const SCORE = {
  timeBonusRate: 10, // points per second under par
  toolBonus: 25, // points per unused tool charge at level end
  alarmPenalty: 2, // points lost per alarm point at level end
};

export const PALETTE = {
  floorA: '#171c2b',
  floorB: '#1b2136',
  wall: '#2c3350',
  wallEdge: '#c9a227',
  caseGlass: '#274b5c',
  caseFrame: '#c9a227',
  rope: '#a33327',
  ropePost: '#d8c27a',
  loot: '#ffd94d',
  exitClosed: '#3a3f52',
  exitOpen: '#37d67a',
  guard: '#e8e4d8',
  guardCone: 'rgba(232, 164, 60, 0.20)',
  guardConeHot: 'rgba(232, 80, 40, 0.30)',
  cameraCone: 'rgba(220, 60, 60, 0.16)',
  cameraOff: 'rgba(120, 120, 120, 0.10)',
  player: '#7fd4ff',
  playerCloak: '#2f6fb2',
  smoke: 'rgba(200, 205, 215, 0.35)',
  laser: 'rgba(255, 45, 85, 0.55)',
  hud: '#10131d',
  hudText: '#e8e4d8',
  gold: '#c9a227',
};
