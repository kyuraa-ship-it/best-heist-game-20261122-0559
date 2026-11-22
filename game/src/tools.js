// Gilded Getaway — the thief's tools, each bought with a charge, never with money.
// Smoke hides the thief, a thrown coin pulls a guard away, an EMP blacks out the cameras.
import { TOOLS } from './config.js';

export function createTools() {
  return {
    smoke: TOOLS.smokeStart,
    coin: TOOLS.coinStart,
    emp: TOOLS.empStart,
    clouds: [], // {x, y, r, ttl}
    lures: [], // {x, y, ttl}
    empLeft: 0,
  };
}

export function useSmoke(tools, x, y) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  tools.clouds.push({ x, y, r: TOOLS.smokeRadius, ttl: TOOLS.smokeSeconds });
  return true;
}

export function useCoin(tools, x, y) {
  if (tools.coin <= 0) return false;
  tools.coin -= 1;
  tools.lures.push({ x, y, ttl: TOOLS.coinLureSeconds });
  return true;
}

export function useEmp(tools, cameras) {
  if (tools.emp <= 0) return false;
  tools.emp -= 1;
  tools.empLeft = TOOLS.empSeconds;
  for (const camera of cameras) camera.disabledLeft = TOOLS.empSeconds;
  return true;
}

export function stepTools(tools, dt) {
  tools.clouds = tools.clouds.filter((c) => (c.ttl -= dt) > 0);
  tools.lures = tools.lures.filter((l) => (l.ttl -= dt) > 0);
  if (tools.empLeft > 0) tools.empLeft -= dt;
}

export function chargesLeft(tools) {
  return tools.smoke + tools.coin + tools.emp;
}
