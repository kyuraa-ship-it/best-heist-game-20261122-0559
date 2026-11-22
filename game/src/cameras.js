// Gilded Getaway — wall cameras: fixed mounts that sweep a red cone back and forth.
// An EMP burst blacks them out for a while; while dark they see nothing and their
// suspicion drains fast.
import { CAMERA } from './config.js';

export function createCamera(def, index) {
  return {
    index,
    x: def.x,
    y: def.y,
    base: def.base,
    range: def.range,
    angle: def.base,
    sweep: 0,
    suspicion: 0,
    disabledLeft: 0,
    tripped: false, // true while this camera's alarm pulse is live
  };
}

export function stepCamera(camera, dt, time) {
  if (camera.disabledLeft > 0) {
    camera.disabledLeft -= dt;
    camera.suspicion = Math.max(0, camera.suspicion - 60 * dt);
    return;
  }
  camera.sweep = Math.sin(time * CAMERA.sweepSpeed + camera.index * 1.7) * CAMERA.sweep;
  camera.angle = camera.base + camera.sweep;
}
