// Seeing and being seen: vision cones and line of sight.
// A watcher (guard or camera) sees the thief only when the thief stands
// inside the cone and no wall crosses the line between them. Smoke hides
// the thief from every watcher at once.

import { TILE, isWall } from './levels.js';

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Does any wall tile cross the segment from (x0, y0) to (x1, y1)?
export function lineOfSightClear(level, x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / (TILE / 3)));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const tx = Math.floor((x0 + dx * t) / TILE);
    const ty = Math.floor((y0 + dy * t) / TILE);
    if (isWall(level, tx, ty)) return false;
  }
  return true;
}

// A watcher at (wx, wy) facing `angle`, with a cone of `range` and
// `halfAngle`, spots the thief at (tx, ty) — unless smoke hides them.
export function canSee(level, watcher, thief, smoke) {
  if (smoke && smoke.active) {
    const d = Math.hypot(thief.x - smoke.x, thief.y - smoke.y);
    if (d < smoke.radius) return false;
  }
  const dx = thief.x - watcher.x;
  const dy = thief.y - watcher.y;
  const dist = Math.hypot(dx, dy);
  if (dist > watcher.range) return false;
  const toThief = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toThief, watcher.angle)) > watcher.halfAngle) return false;
  return lineOfSightClear(level, watcher.x, watcher.y, thief.x, thief.y);
}

// How far the cone reaches before a wall cuts it, along one ray.
export function coneRayLength(level, wx, wy, angle, maxRange) {
  const step = TILE / 3;
  let len = step;
  while (len < maxRange) {
    const px = wx + Math.cos(angle) * len;
    const py = wy + Math.sin(angle) * len;
    if (isWall(level, Math.floor(px / TILE), Math.floor(py / TILE))) return len;
    len += step;
  }
  return maxRange;
}
