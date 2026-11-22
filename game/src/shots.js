// Staged screenshots for The Velvet Vault.
// ?shot=start|play|alert|win&seed=1 renders one frozen frame from the
// game's own code, with the same seeded positions every time, so the
// cover and the other screenshots are real renders, reproducible on
// demand. The frame is drawn once and the game loop never starts.

import { LEVELS, parseLevel, TILE } from './levels.js';
import { createGuard } from './guards.js';
import { createCamera } from './cameras.js';
import { makeRng } from './rng.js';
import {
  drawScene,
  drawHud,
  drawTitle,
  drawWin,
  VIEW_W,
  VIEW_H,
} from './render.js';

function baseState(rng, seed) {
  const level = parseLevel(LEVELS[0]);
  const guards = level.guardSpawns.map(createGuard);
  const cameras = level.cameraSpawns.map(createCamera);
  return {
    level,
    levelIndex: 0,
    guards,
    cameras,
    thief: { x: level.thiefStart.x, y: level.thiefStart.y, angle: 0, moving: false },
    alarm: 0,
    score: 0,
    lootValue: 0,
    totalLoot: 0,
    totalTime: 0,
    time: 0,
    phase: 'play',
    camerasOffUntil: -1,
    smoke: { active: false, x: 0, y: 0, radius: 80, until: 0 },
    smokes: 3,
    hasKeycard: false,
    message: '',
    messageUntil: 0,
    rng,
    seed,
  };
}

function tileCenter(tx, ty) {
  return { x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE };
}

function aimAt(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function renderShot(ctx, stage, seed) {
  const rng = makeRng(seed * 2654435761 + 97);
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);

  if (stage === 'start') {
    drawTitle(ctx);
    return;
  }

  const state = baseState(rng, seed);

  if (stage === 'play') {
    // The cover frame: thief mid-room near a painting, a guard's cone
    // sweeping toward them, the camera watching, loot and the alarm
    // meter all in one frame. An even seed frames the gem run instead,
    // so a second play shot shows another moment of the same room.
    const gemRun = seed % 2 === 0;
    const thiefAt = gemRun ? tileCenter(23, 3) : tileCenter(13, 9);
    state.thief.x = thiefAt.x;
    state.thief.y = thiefAt.y;
    state.thief.moving = true;
    state.time = gemRun ? 47 : 84;
    state.alarm = gemRun ? 22 : 35;
    state.score = gemRun ? 200 : 400;
    state.lootValue = gemRun ? 200 : 400;
    state.smokes = 2;
    state.message = gemRun
      ? 'The Moonstone Gem glints — grab it and go.'
      : 'Lift $600 of art, then slip out the green exit.';
    state.messageUntil = state.time + 6;
    const guard = state.guards[0];
    const guardAt = gemRun ? tileCenter(19, 6) : tileCenter(15, 6);
    guard.x = guardAt.x;
    guard.y = guardAt.y;
    guard.angle = aimAt(guardAt, thiefAt) + 0.25;
    guard.suspicious = 0.6;
    const camera = state.cameras[0];
    const camAt = tileCenter(24, 4);
    camera.x = camAt.x;
    camera.y = camAt.y;
    camera.angle = aimAt(camAt, thiefAt) - 0.15;
    // One painting already lifted, so the room reads as a live heist.
    state.level.loot[0].taken = true;
    drawScene(ctx, state);
    drawHud(ctx, state);
    return;
  }

  if (stage === 'alert') {
    // Caught in the open: the thief stands inside the guard's cone,
    // the alarm is nearly full, the room burns red.
    const thiefAt = tileCenter(14, 7);
    state.thief.x = thiefAt.x;
    state.thief.y = thiefAt.y;
    state.time = 142;
    state.alarm = 78;
    state.score = 600;
    state.lootValue = 600;
    state.smokes = 1;
    state.message = 'SPOTTED! Break line of sight — now!';
    state.messageUntil = 150;
    const guard = state.guards[0];
    const guardAt = tileCenter(15, 5);
    guard.x = guardAt.x;
    guard.y = guardAt.y;
    guard.angle = aimAt(guardAt, thiefAt);
    guard.seeing = true;
    guard.suspicious = 1;
    const camera = state.cameras[0];
    const camAt = tileCenter(24, 4);
    camera.x = camAt.x;
    camera.y = camAt.y;
    camera.angle = aimAt(camAt, thiefAt) + 0.1;
    state.level.loot[0].taken = true;
    state.level.loot[1].taken = true;
    state.level.loot[2].taken = true;
    drawScene(ctx, state);
    drawHud(ctx, state);
    return;
  }

  if (stage === 'win') {
    // The getaway: thief at the exit, loot over the goal, win banner up.
    const thiefAt = tileCenter(25, 15);
    state.thief.x = thiefAt.x;
    state.thief.y = thiefAt.y;
    state.time = 196;
    state.alarm = 12;
    state.score = 1420;
    state.lootValue = 900;
    state.smokes = 2;
    state.phase = 'win';
    state.message = '';
    const guard = state.guards[0];
    const guardAt = tileCenter(10, 12);
    guard.x = guardAt.x;
    guard.y = guardAt.y;
    guard.angle = Math.PI;
    const camera = state.cameras[0];
    const camAt = tileCenter(24, 4);
    camera.x = camAt.x;
    camera.y = camAt.y;
    camera.angle = -Math.PI / 2;
    for (const loot of state.level.loot) loot.taken = true;
    drawScene(ctx, state);
    drawHud(ctx, state);
    drawWin(ctx, state);
    return;
  }

  // Unknown stage: fall back to the title screen.
  drawTitle(ctx);
}
