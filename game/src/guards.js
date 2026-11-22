// The museum guards: they walk their patrol loop, pause at each stop,
// turn toward where they walk, and raise the alarm when the thief
// crosses their vision cone. A guard that just lost the thief keeps
// looking the way they last saw them for a moment.

import { angleDiff, canSee } from './sight.js';

export const GUARD_SPEED = 62;
export const GUARD_RANGE = 210;
export const GUARD_HALF_ANGLE = 0.62;

export function createGuard(spawn) {
  return {
    x: spawn.x,
    y: spawn.y,
    patrol: spawn.patrol,
    waypoint: 1 % Math.max(1, spawn.patrol.length),
    pause: 0,
    angle: 0,
    seeing: false,
    suspicious: 0,
    speed: GUARD_SPEED,
  };
}

export function updateGuard(guard, dt, level, thief, smoke) {
  const target = guard.patrol[guard.waypoint];
  if (guard.pause > 0) {
    guard.pause -= dt;
  } else {
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 6) {
      guard.waypoint = (guard.waypoint + 1) % guard.patrol.length;
      guard.pause = 0.9;
    } else {
      const step = guard.speed * dt;
      guard.x += (dx / dist) * step;
      guard.y += (dy / dist) * step;
      const want = Math.atan2(dy, dx);
      guard.angle += angleDiff(want, guard.angle) * Math.min(1, dt * 8);
    }
  }
  const wasSeeing = guard.seeing;
  guard.seeing = canSee(
    level,
    { x: guard.x, y: guard.y, angle: guard.angle, range: GUARD_RANGE, halfAngle: GUARD_HALF_ANGLE },
    thief,
    smoke,
  );
  if (guard.seeing) guard.suspicious = 1;
  else guard.suspicious = Math.max(0, guard.suspicious - dt * 0.5);
  return guard.seeing && !wasSeeing;
}
