// Every pixel of The Velvet Vault is drawn here, on one canvas:
// marble floors, gold-framed paintings, sweeping vision cones, the
// thief's purple cloak. No image files, no fonts beyond the system stack.

import { TILE, MAP_COLS, MAP_ROWS, isWall, doorAt } from './levels.js';
import { coneRayLength } from './sight.js';
import { GUARD_RANGE, GUARD_HALF_ANGLE } from './guards.js';
import { CAMERA_RANGE, CAMERA_HALF_ANGLE } from './cameras.js';

export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 80;
export const MAP_Y = HUD_H;

const GOLD = '#d4af37';
const GOLD_DIM = '#8a6d1f';
const CREAM = '#e9dcc3';
const MARBLE_DARK = '#cbb894';
const WALL_TOP = '#3d2b52';
const WALL_FACE = '#2a1c3d';
const CARPET = '#7a1f2b';
const CARPET_EDGE = '#a33340';
const INK = '#f5eeda';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, level, x, y, angle, range, halfAngle, color, alert) {
  const steps = 14;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= steps; i++) {
    const a = angle - halfAngle + (2 * halfAngle * i) / steps;
    const len = coneRayLength(level, x, y, a, range);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  if (alert) {
    ctx.strokeStyle = 'rgba(255,60,60,0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}

function drawPainting(ctx, loot, time) {
  const px = loot.x * TILE + 5;
  const py = MAP_Y + loot.y * TILE + 8;
  const hue = (loot.x * 47 + loot.y * 89) % 360;
  ctx.fillStyle = GOLD;
  ctx.fillRect(px - 2, py - 2, 34, 28);
  ctx.fillStyle = 'hsl(' + hue + ', 45%, 32%)';
  ctx.fillRect(px, py, 30, 24);
  ctx.fillStyle = 'hsl(' + ((hue + 120) % 360) + ', 60%, 60%)';
  ctx.beginPath();
  ctx.arc(px + 10 + Math.sin(time + loot.x) * 2, py + 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'hsl(' + ((hue + 240) % 360) + ', 55%, 55%)';
  ctx.fillRect(px + 18, py + 13, 8, 8);
  ctx.fillStyle = INK;
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$200', px + 15, py + 38);
}

function drawGem(ctx, loot, time) {
  const cx = loot.x * TILE + TILE / 2;
  const cy = MAP_Y + loot.y * TILE + TILE / 2;
  const tw = 1 + Math.sin(time * 5 + loot.x * 2) * 0.15;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(tw, 1);
  ctx.fillStyle = '#7fe7ff';
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(11, 0);
  ctx.lineTo(0, 13);
  ctx.lineTo(-11, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#d8f8ff';
  ctx.beginPath();
  ctx.moveTo(0, -13);
  ctx.lineTo(6, 0);
  ctx.lineTo(0, 13);
  ctx.lineTo(-6, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#bff3ff';
  ctx.font = 'bold 9px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$500', cx, cy + 26);
}

function drawCrown(ctx, loot, time) {
  const cx = loot.x * TILE + TILE / 2;
  const cy = MAP_Y + loot.y * TILE + TILE / 2;
  const bob = Math.sin(time * 3) * 3;
  ctx.save();
  ctx.translate(cx, cy + bob);
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(-14, 8);
  ctx.lineTo(-14, -6);
  ctx.lineTo(-7, 2);
  ctx.lineTo(0, -12);
  ctx.lineTo(7, 2);
  ctx.lineTo(14, -6);
  ctx.lineTo(14, 8);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ff5b7a';
  ctx.beginPath();
  ctx.arc(0, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$1000 · CROWN', cx, cy + 26);
}

function drawGuard(ctx, guard, time) {
  const bob = guard.pause > 0 ? 0 : Math.sin(time * 10) * 1.5;
  ctx.save();
  ctx.translate(guard.x, guard.y + MAP_Y + bob * 0.2);
  ctx.fillStyle = guard.seeing ? '#ff3b30' : '#22355e';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16233f';
  ctx.beginPath();
  ctx.arc(0, -2, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f2c14e';
  ctx.fillRect(-9, -13, 18, 4);
  ctx.fillStyle = '#f5eeda';
  const fx = Math.cos(guard.angle) * 7;
  const fy = Math.sin(guard.angle) * 7;
  ctx.beginPath();
  ctx.arc(fx - 3, fy - 2, 1.8, 0, Math.PI * 2);
  ctx.arc(fx + 3, fy - 2, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (guard.seeing) {
    ctx.fillStyle = '#ff3b30';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -22);
  } else if (guard.suspicious > 0.3) {
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 16px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', 0, -22);
  }
  ctx.restore();
}

function drawCamera(ctx, camera, camerasOff) {
  const cx = camera.x;
  const cy = camera.y + MAP_Y;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = '#1c2733';
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(camera.angle);
  ctx.fillStyle = camerasOff ? '#39434f' : '#3d6f8f';
  ctx.fillRect(0, -5, 16, 10);
  ctx.fillStyle = camerasOff ? '#222' : '#ff4d4d';
  ctx.beginPath();
  ctx.arc(15, 0, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawThief(ctx, thief, time) {
  const cx = thief.x;
  const cy = thief.y + MAP_Y;
  const bob = thief.moving ? Math.sin(time * 14) * 2 : Math.sin(time * 2) * 0.8;
  ctx.save();
  ctx.translate(cx, cy + bob * 0.3);
  ctx.fillStyle = '#5b21a8';
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b1470';
  ctx.beginPath();
  ctx.arc(0, -3, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f5eeda';
  ctx.beginPath();
  ctx.arc(-3, -3, 2, 0, Math.PI * 2);
  ctx.arc(3, -3, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd23e';
  ctx.beginPath();
  ctx.arc(0, 6, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLaser(ctx, laser, time) {
  const on = laser.on;
  const y1 = laser.y1 + MAP_Y;
  const y2 = laser.y2 + MAP_Y;
  ctx.save();
  if (!on) {
    ctx.globalAlpha = 0.25;
    ctx.strokeStyle = '#ff6b6b';
    ctx.setLineDash([4, 6]);
  } else {
    ctx.globalAlpha = 0.85 + Math.sin(time * 12) * 0.15;
    ctx.strokeStyle = '#ff2d2d';
    ctx.setLineDash([]);
    ctx.shadowColor = '#ff2d2d';
    ctx.shadowBlur = 8;
  }
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(laser.x1, y1);
  ctx.lineTo(laser.x2, y2);
  ctx.stroke();
  ctx.restore();
  for (const [ex, ey] of [
    [laser.x1, y1],
    [laser.x2, y2],
  ]) {
    ctx.fillStyle = '#8a94a6';
    ctx.fillRect(ex - 5, ey - 5, 10, 10);
    ctx.fillStyle = on ? '#ff2d2d' : '#5a2323';
    ctx.beginPath();
    ctx.arc(ex, ey, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

// The whole room: floor, walls, loot, doors, exit, terminals, lasers,
// then cones, cameras, guards and the thief on top.
export function drawScene(ctx, state) {
  const level = state.level;
  const time = state.time;
  ctx.fillStyle = '#17101f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  for (let y = 0; y < MAP_ROWS; y++) {
    for (let x = 0; x < MAP_COLS; x++) {
      const px = x * TILE;
      const py = MAP_Y + y * TILE;
      if (isWall(level, x, y)) {
        ctx.fillStyle = WALL_FACE;
        ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = WALL_TOP;
        ctx.fillRect(px, py, TILE, 6);
        ctx.fillStyle = GOLD_DIM;
        ctx.fillRect(px, py + TILE - 3, TILE, 3);
        continue;
      }
      const checker = (x + y) % 2 === 0;
      ctx.fillStyle = checker ? CREAM : MARBLE_DARK;
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(px, py, TILE, 2);
      if (x % 8 === 0 && y % 6 === 0) {
        ctx.fillStyle = 'rgba(122,31,43,0.16)';
        ctx.fillRect(px, py, TILE, TILE);
      }
    }
  }
  // Crimson carpet runner down the middle corridor of each room.
  ctx.fillStyle = CARPET;
  for (let y = 1; y < MAP_ROWS - 1; y++) {
    ctx.fillRect(15 * TILE, MAP_Y + y * TILE + 12, TILE, 16);
  }
  ctx.fillStyle = CARPET_EDGE;
  for (let y = 1; y < MAP_ROWS - 1; y++) {
    ctx.fillRect(15 * TILE, MAP_Y + y * TILE + 12, TILE, 2);
    ctx.fillRect(15 * TILE, MAP_Y + y * TILE + 26, TILE, 2);
  }

  for (const loot of level.loot) {
    if (loot.taken) continue;
    if (loot.kind === 'L') drawPainting(ctx, loot, time);
    else if (loot.kind === 'D') drawGem(ctx, loot, time);
    else drawCrown(ctx, loot, time);
  }

  for (const door of level.doors) {
    const px = door.x * TILE;
    const py = MAP_Y + door.y * TILE;
    if (door.open) {
      ctx.fillStyle = '#3f7d4e';
      ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    } else {
      ctx.fillStyle = '#5a6b7a';
      ctx.fillRect(px, py, TILE, TILE);
      ctx.fillStyle = GOLD;
      ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
      ctx.fillStyle = '#22303c';
      ctx.beginPath();
      ctx.arc(px + TILE / 2, py + TILE / 2, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.font = 'bold 8px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KEYCARD', px + TILE / 2, py + TILE - 6);
    }
  }

  if (level.keycard && !level.keycard.taken) {
    const cx = level.keycard.x * TILE + TILE / 2;
    const cy = MAP_Y + level.keycard.y * TILE + TILE / 2;
    ctx.fillStyle = '#ffd23e';
    rr(ctx, cx - 11, cy - 7, 22, 14, 3);
    ctx.fill();
    ctx.fillStyle = '#22303c';
    ctx.fillRect(cx - 7, cy - 3, 10, 2);
    ctx.fillRect(cx - 7, cy + 1, 7, 2);
    ctx.fillStyle = INK;
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KEYCARD', cx, cy + 20);
  }

  for (const term of level.terminals) {
    const px = term.x * TILE;
    const py = MAP_Y + term.y * TILE;
    ctx.fillStyle = '#1c2733';
    rr(ctx, px + 4, py + 6, TILE - 8, TILE - 12, 4);
    ctx.fill();
    ctx.fillStyle = term.used ? '#22303c' : '#39d98a';
    ctx.fillRect(px + 9, py + 11, TILE - 18, 10);
    ctx.fillStyle = INK;
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(term.used ? 'OFFLINE' : 'HACK · E', px + TILE / 2, py + TILE - 4);
    if (term.progress > 0 && !term.used) {
      ctx.fillStyle = '#111';
      ctx.fillRect(px + 4, py + 2, TILE - 8, 5);
      ctx.fillStyle = '#39d98a';
      ctx.fillRect(px + 4, py + 2, (TILE - 8) * term.progress, 5);
    }
  }

  if (level.exit) {
    const ex = level.exit.x * TILE;
    const ey = MAP_Y + level.exit.y * TILE;
    const glow = 0.55 + Math.sin(time * 3) * 0.25;
    ctx.fillStyle = 'rgba(57,217,138,' + glow.toFixed(2) + ')';
    ctx.fillRect(ex, ey, TILE, TILE);
    ctx.fillStyle = '#0e3d24';
    ctx.fillRect(ex + 6, ey + 4, TILE - 12, TILE - 8);
    ctx.fillStyle = '#39d98a';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EXIT', ex + TILE / 2, ey + TILE / 2 + 4);
  }

  for (const laser of level.lasers) drawLaser(ctx, laser, time);

  const camerasOff = state.time < state.camerasOffUntil;
  for (const camera of state.cameras) {
    if (!camerasOff) {
      drawCone(
        ctx,
        level,
        camera.x,
        camera.y + MAP_Y,
        camera.angle,
        CAMERA_RANGE,
        CAMERA_HALF_ANGLE,
        camera.seeing ? 'rgba(255,80,80,0.34)' : 'rgba(120,190,255,0.22)',
        camera.seeing,
      );
    }
  }
  for (const guard of state.guards) {
    drawCone(
      ctx,
      level,
      guard.x,
      guard.y + MAP_Y,
      guard.angle,
      GUARD_RANGE,
      GUARD_HALF_ANGLE,
      guard.seeing ? 'rgba(255,70,60,0.36)' : 'rgba(255,210,62,0.20)',
      guard.seeing,
    );
  }

  for (const camera of state.cameras) drawCamera(ctx, camera, camerasOff);
  for (const guard of state.guards) drawGuard(ctx, guard, time);

  if (state.smoke && state.smoke.active) {
    const sx = state.smoke.x;
    const sy = state.smoke.y + MAP_Y;
    ctx.fillStyle = 'rgba(200,200,210,0.55)';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + time;
      ctx.beginPath();
      ctx.arc(
        sx + Math.cos(a) * state.smoke.radius * 0.5,
        sy + Math.sin(a) * state.smoke.radius * 0.5,
        18,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.fillStyle = 'rgba(220,220,230,0.7)';
    ctx.beginPath();
    ctx.arc(sx, sy, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  drawThief(ctx, state.thief, time);

  if (state.alarm >= 70 && state.phase === 'play') {
    const pulse = 0.1 + (state.alarm - 70) / 30 * 0.12 + Math.sin(time * 8) * 0.04;
    ctx.fillStyle = 'rgba(255,30,30,' + pulse.toFixed(3) + ')';
    ctx.fillRect(0, MAP_Y, VIEW_W, VIEW_H - MAP_Y);
  }
}

function alarmColor(alarm) {
  if (alarm < 35) return '#39d98a';
  if (alarm < 65) return '#ffd23e';
  return '#ff3b30';
}

// The top bar: game title, room name, loot goal, alarm meter, timer.
export function drawHud(ctx, state) {
  ctx.fillStyle = '#1d1428';
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, HUD_H - 3, VIEW_W, 3);
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('THE VELVET VAULT', 18, 32);
  ctx.fillStyle = '#c9b8e0';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText(state.level.name, 18, 56);

  ctx.fillStyle = INK;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('LOOT  $' + state.lootValue + ' / $' + state.level.goal, 430, 30);
  ctx.fillStyle = '#c9b8e0';
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('SCORE ' + state.score, 430, 54);
  ctx.fillStyle = state.hasKeycard ? '#39d98a' : '#8a7ba3';
  ctx.fillText(state.hasKeycard ? 'KEYCARD ✓' : 'KEYCARD —', 600, 54);

  ctx.fillStyle = INK;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', 700, 24);
  ctx.fillStyle = '#33244a';
  rr(ctx, 700, 30, 260, 18, 9);
  ctx.fill();
  ctx.fillStyle = alarmColor(state.alarm);
  const w = Math.max(0, Math.min(1, state.alarm / 100)) * 260;
  if (w > 2) {
    rr(ctx, 700, 30, w, 18, 9);
    ctx.fill();
  }
  ctx.fillStyle = INK;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(Math.round(state.alarm) + '%', 830, 44);
  ctx.textAlign = 'left';
  if (state.time < state.camerasOffUntil) {
    ctx.fillStyle = '#39d98a';
    ctx.fillText('CAMERAS OFF ' + Math.ceil(state.camerasOffUntil - state.time) + 's', 700, 66);
  } else {
    ctx.fillStyle = '#8a7ba3';
    ctx.fillText('Hold E at a terminal to kill the cameras', 700, 66);
  }

  ctx.fillStyle = INK;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(formatTime(state.time), 1255, 32);
  ctx.fillStyle = '#c9b8e0';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Q smoke · ' + state.smokes + ' left', 1255, 54);
  ctx.textAlign = 'left';

  if (state.message && state.time < state.messageUntil) {
    ctx.fillStyle = 'rgba(20,12,30,0.92)';
    const mw = ctx.measureText(state.message).width + 36;
    rr(ctx, (VIEW_W - mw) / 2, HUD_H + 10, mw, 30, 15);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(state.message, VIEW_W / 2, HUD_H + 30);
    ctx.textAlign = 'left';
  }
}

export function formatTime(t) {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return m + ':' + String(s).padStart(2, '0');
}

function overlay(ctx, title, lines, accent, hint) {
  ctx.fillStyle = 'rgba(12,7,20,0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 260);
  ctx.fillStyle = INK;
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 320 + i * 34);
  });
  ctx.fillStyle = '#ffd23e';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(hint, VIEW_W / 2, 320 + lines.length * 34 + 40);
  ctx.textAlign = 'left';
}

export function drawTitle(ctx) {
  ctx.fillStyle = '#17101f';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('THE VELVET VAULT', VIEW_W / 2, 190);
  ctx.fillStyle = '#c9b8e0';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('A midnight museum heist in three rooms', VIEW_W / 2, 235);
  ctx.fillStyle = GOLD;
  ctx.fillRect(VIEW_W / 2 - 180, 260, 360, 2);
  const lines = [
    'Sneak past the guards and their vision cones.',
    'Dodge the sweeping cameras — or hack a terminal (hold E) to kill them.',
    'Grab paintings, gems and the Crown Jewel. Reach the green EXIT',
    'with enough loot before the ALARM hits 100%.',
    '',
    'Move: WASD / arrows      Hack: hold E      Smoke bomb: Q (costs 50)',
    'Lasers sting. A locked vault door needs the keycard.',
  ];
  ctx.fillStyle = INK;
  ctx.font = '18px system-ui, sans-serif';
  lines.forEach((line, i) => {
    ctx.fillText(line, VIEW_W / 2, 310 + i * 32);
  });
  const pulse = 0.6 + Math.sin(Date.now() / 350) * 0.4;
  ctx.fillStyle = 'rgba(255,210,62,' + pulse.toFixed(2) + ')';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('CLICK OR PRESS ENTER TO START THE HEIST', VIEW_W / 2, 600);
  ctx.fillStyle = '#8a7ba3';
  ctx.font = '14px system-ui, sans-serif';
  ctx.fillText('An original game · art and sound made in code · no files fetched', VIEW_W / 2, 650);
  ctx.textAlign = 'left';
}

export function drawIntro(ctx, state) {
  overlay(
    ctx,
    state.level.name,
    [state.level.intro, '', 'Goal: $' + state.level.goal + ' of loot, then the green EXIT.'],
    GOLD,
    'CLICK OR PRESS ENTER TO BEGIN',
  );
}

export function drawWin(ctx, state) {
  overlay(
    ctx,
    'CLEAN GETAWAY!',
    [
      'Room cleared: $' + state.lootValue + ' of loot in ' + formatTime(state.time) + '.',
      'Score: ' + state.score + (state.levelIndex < 2 ? ' — one room down, the vault waits.' : ''),
    ],
    '#39d98a',
    state.levelIndex < 2 ? 'CLICK OR PRESS ENTER FOR THE NEXT ROOM' : 'CLICK OR PRESS ENTER TO SEE THE TAKE',
  );
}

export function drawLose(ctx, state) {
  overlay(
    ctx,
    'BUSTED!',
    [
      'The alarm hit 100% and the museum locked down.',
      'You kept $' + state.lootValue + ' of loot. The guards were faster this time.',
    ],
    '#ff3b30',
    'CLICK OR PRESS ENTER TO TRY THE ROOM AGAIN',
  );
}

export function drawComplete(ctx, state) {
  overlay(
    ctx,
    'THE VELVET VAULT IS YOURS',
    [
      'All three rooms cleaned out. Total take: $' + state.totalLoot + '.',
      'Final score: ' + state.score + ' in ' + formatTime(state.totalTime) + '.',
      'Not a single guard ever saw your face. Probably.',
    ],
    GOLD,
    'CLICK OR PRESS ENTER TO RUN IT ALL AGAIN',
  );
}
