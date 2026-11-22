// The ceiling cameras: they sweep back and forth across their arc and
// spot the thief in a pale cone. Hacking a terminal shuts every camera
// down for a while; their lenses go dark and their cones vanish.

import { canSee } from './sight.js';

export const CAMERA_RANGE = 230;
export const CAMERA_HALF_ANGLE = 0.5;
export const CAMERAS_OFF_SECONDS = 15;

export function createCamera(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    base: spawn.base,
    arc: spawn.arc,
    speed: spawn.speed,
    phase: (spawn.x * 3 + spawn.y * 5) % 6,
    angle: spawn.base,
    seeing: false,
  };
}

export function updateCamera(camera, dt, time, level, thief, smoke, camerasOff) {
  camera.angle =
    camera.base + Math.sin(time * camera.speed + camera.phase) * camera.arc;
  if (camerasOff) {
    camera.seeing = false;
    return false;
  }
  const wasSeeing = camera.seeing;
  camera.seeing = canSee(
    level,
    { x: camera.x, y: camera.y, angle: camera.angle, range: CAMERA_RANGE, halfAngle: CAMERA_HALF_ANGLE },
    thief,
    smoke,
  );
  return camera.seeing && !wasSeeing;
}
