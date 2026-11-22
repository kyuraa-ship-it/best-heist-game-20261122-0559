// Gilded Getaway — the three rooms of the Halcyon Gallery, each with several routes in.
// Walls and display cases block sight and movement; velvet ropes block movement only
// (a thief can be seen over them, never through a case). Lasers blink on and off.
const WALL = 14; // border thickness
const W = 960;
const H = 600;

function border() {
  return [
    { x: 0, y: 0, w: W, h: WALL },
    { x: 0, y: H - WALL, w: W, h: WALL },
    { x: 0, y: 0, w: WALL, h: H },
    { x: W - WALL, y: 0, w: WALL, h: H },
  ];
}

export const LEVELS = [
  {
    name: 'The Marble Gallery',
    par: 90,
    loot: { x: 800, y: 96, name: 'Star Sapphire', value: 500 },
    exit: { x: 58, y: 542 },
    player: { x: 480, y: 548 },
    walls: [
      ...border(),
      { x: 300, y: 110, w: 14, h: 150 },
      { x: 646, y: 340, w: 14, h: 150 },
    ],
    cases: [
      { x: 150, y: 150, w: 92, h: 52 },
      { x: 430, y: 104, w: 92, h: 52 },
      { x: 700, y: 150, w: 92, h: 52 },
      { x: 180, y: 400, w: 92, h: 52 },
      { x: 470, y: 420, w: 92, h: 52 },
      { x: 720, y: 400, w: 92, h: 52 },
    ],
    ropes: [
      { x: 330, y: 300, w: 120, h: 10 },
      { x: 520, y: 300, w: 120, h: 10 },
    ],
    lasers: [],
    pickups: [
      { x: 120, y: 120, kind: 'smoke' },
      { x: 850, y: 480, kind: 'coin' },
    ],
    guards: [
      { path: [[170, 300], [790, 300]], speed: 55 },
      { path: [[480, 110], [480, 480]], speed: 50 },
    ],
    cameras: [
      { x: 480, y: 14, base: Math.PI / 2, range: 200 },
    ],
  },
  {
    name: 'The Vault Corridor',
    par: 120,
    loot: { x: 862, y: 92, name: 'Gilded Idol', value: 800 },
    exit: { x: 58, y: 542 },
    player: { x: 480, y: 548 },
    walls: [
      ...border(),
      { x: 210, y: 110, w: 14, h: 380 },
      { x: 540, y: 110, w: 14, h: 180 },
      { x: 540, y: 410, w: 14, h: 80 },
      { x: 736, y: 210, w: 14, h: 180 },
    ],
    cases: [
      { x: 300, y: 140, w: 92, h: 52 },
      { x: 620, y: 140, w: 92, h: 52 },
      { x: 300, y: 420, w: 92, h: 52 },
      { x: 620, y: 420, w: 92, h: 52 },
      { x: 790, y: 300, w: 92, h: 52 },
    ],
    ropes: [
      { x: 360, y: 290, w: 100, h: 10 },
      { x: 620, y: 290, w: 100, h: 10 },
    ],
    lasers: [
      // The beam across the middle gap blinks: cross it while it is dark.
      { x: 540, y: 290, w: 196, h: 10, period: 5, phase: 0 },
    ],
    pickups: [
      { x: 120, y: 300, kind: 'emp' },
      { x: 850, y: 500, kind: 'smoke' },
    ],
    guards: [
      { path: [[120, 100], [120, 500]], speed: 58 },
      { path: [[430, 500], [430, 100]], speed: 58 },
      { path: [[640, 100], [900, 100], [900, 500], [640, 500]], speed: 52 },
    ],
    cameras: [
      { x: 330, y: 14, base: Math.PI / 2, range: 200 },
      { x: 640, y: 586, base: -Math.PI / 2, range: 200 },
    ],
  },
  {
    name: 'The Vault Chamber',
    par: 150,
    loot: { x: 480, y: 150, name: 'Crown of Halcyon', value: 1200 },
    exit: { x: 58, y: 58 },
    player: { x: 480, y: 548 },
    walls: [
      ...border(),
      { x: 330, y: 90, w: 14, h: 130 },
      { x: 616, y: 90, w: 14, h: 130 },
      { x: 330, y: 380, w: 14, h: 130 },
      { x: 616, y: 380, w: 14, h: 130 },
    ],
    cases: [
      { x: 380, y: 120, w: 200, h: 46 },
      { x: 250, y: 280, w: 92, h: 52 },
      { x: 618, y: 280, w: 92, h: 52 },
      { x: 250, y: 460, w: 92, h: 52 },
      { x: 618, y: 460, w: 92, h: 52 },
    ],
    ropes: [
      { x: 380, y: 240, w: 200, h: 10 },
      { x: 380, y: 340, w: 200, h: 10 },
    ],
    lasers: [
      { x: 344, y: 240, w: 272, h: 10, period: 4, phase: 0 },
      { x: 344, y: 340, w: 272, h: 10, period: 4, phase: 2 },
    ],
    pickups: [
      { x: 120, y: 540, kind: 'smoke' },
      { x: 840, y: 540, kind: 'coin' },
    ],
    guards: [
      { path: [[170, 170], [790, 170]], speed: 62 },
      { path: [[170, 430], [790, 430]], speed: 62 },
      { path: [[480, 230], [480, 520]], speed: 56 },
      { path: [[860, 120], [860, 480]], speed: 56 },
    ],
    cameras: [
      { x: 240, y: 14, base: Math.PI / 2, range: 200 },
      { x: 720, y: 14, base: Math.PI / 2, range: 200 },
      { x: 480, y: 586, base: -Math.PI / 2, range: 210 },
    ],
  },
];
