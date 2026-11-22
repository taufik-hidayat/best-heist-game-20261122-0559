// The Velvet Vault — the game loop and its rules.
// A thief crosses three museum rooms, lifts the loot, and slips out
// the green exit before the alarm meter fills. Guards patrol with
// vision cones, cameras sweep, lasers sting, and a hacked terminal
// buys fifteen quiet seconds.

import { LEVELS, parseLevel, TILE, tileBlocks } from './levels.js';
import { createGuard, updateGuard } from './guards.js';
import { createCamera, updateCamera, CAMERAS_OFF_SECONDS } from './cameras.js';
import { createInput } from './input.js';
import { makeRng } from './rng.js';
import {
  drawScene,
  drawHud,
  drawTitle,
  drawIntro,
  drawWin,
  drawLose,
  drawComplete,
  VIEW_W,
  VIEW_H,
  MAP_Y,
} from './render.js';
import {
  ensureAudio,
  setAlarmLevel,
  playPickup,
  playKeycard,
  playHackTick,
  playLaserZap,
  playSmoke,
  playDoor,
  playSpotted,
  playWin,
  playLose,
  playClick,
} from './audio.js';
import { renderShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const input = createInput(canvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number(params.get('seed') || '1') || 1;

// A staged shot renders one frozen frame and never starts the loop,
// so a screenshot is a real render of this code, reproducible by seed.
if (shot) {
  renderShot(ctx, shot, seed);
} else {
  startGame();
}

function startGame() {
  const state = {
    levelIndex: 0,
    level: null,
    guards: [],
    cameras: [],
    thief: { x: 0, y: 0, angle: 0, moving: false },
    alarm: 0,
    score: 0,
    lootValue: 0,
    totalLoot: 0,
    totalTime: 0,
    time: 0,
    phase: 'title',
    camerasOffUntil: -1,
    smoke: { active: false, x: 0, y: 0, radius: 80, until: 0 },
    smokes: 3,
    hasKeycard: false,
    message: '',
    messageUntil: 0,
    hackSoundAt: 0,
    zapSoundAt: 0,
    spottedSoundAt: 0,
    rng: makeRng((Date.now() % 2147483647) + 1),
  };

  function loadLevel(index) {
    const def = LEVELS[index];
    const level = parseLevel(def);
    state.levelIndex = index;
    state.level = level;
    state.guards = level.guardSpawns.map(createGuard);
    state.cameras = level.cameraSpawns.map(createCamera);
    state.thief.x = level.thiefStart.x;
    state.thief.y = level.thiefStart.y;
    state.thief.angle = 0;
    state.alarm = 0;
    state.lootValue = 0;
    state.time = 0;
    state.camerasOffUntil = -1;
    state.smoke.active = false;
    state.smokes = 3;
    state.hasKeycard = false;
    state.phase = 'intro';
    setMessage(def.intro);
  }

  function setMessage(text, seconds = 4) {
    state.message = text;
    state.messageUntil = state.time + seconds;
  }

  function moveThief(dt) {
    const v = input.moveVector();
    const speed = 175;
    const r = 12;
    const t = state.thief;
    t.moving = v.x !== 0 || v.y !== 0;
    if (t.moving) t.angle = Math.atan2(v.y, v.x);
    tryMove(t, v.x * speed * dt, 0, r);
    tryMove(t, 0, v.y * speed * dt, r);
  }

  function tryMove(t, dx, dy, r) {
    const nx = t.x + dx;
    const ny = t.y + dy;
    const corners = [
      [nx - r, ny - r],
      [nx + r, ny - r],
      [nx - r, ny + r],
      [nx + r, ny + r],
    ];
    for (const [px, py] of corners) {
      const tx = Math.floor(px / TILE);
      const ty = Math.floor((py - MAP_Y) / TILE);
      if (tileBlocks(state.level, tx, ty)) return;
    }
    t.x = nx;
    t.y = ny;
  }

  function nearestTerminal() {
    let best = null;
    let bestD = 78;
    for (const term of state.level.terminals) {
      if (term.used) continue;
      const d = Math.hypot(
        term.x * TILE + TILE / 2 - state.thief.x,
        term.y * TILE + TILE / 2 - state.thief.y,
      );
      if (d < bestD) {
        bestD = d;
        best = term;
      }
    }
    return best;
  }

  function updateHack(dt) {
    const term = nearestTerminal();
    for (const t of state.level.terminals) {
      if (t !== term) t.progress = 0;
    }
    if (!term) return;
    if (input.hacking()) {
      term.progress += dt / 2;
      if (state.time - state.hackSoundAt > 0.25) {
        state.hackSoundAt = state.time;
        playHackTick(false);
      }
      if (term.progress >= 1) {
        term.used = true;
        term.progress = 0;
        state.camerasOffUntil = state.time + CAMERAS_OFF_SECONDS;
        state.alarm = Math.max(0, state.alarm - 20);
        playHackTick(true);
        setMessage('Cameras down for ' + CAMERAS_OFF_SECONDS + ' seconds. Move!');
      }
    } else {
      term.progress = Math.max(0, term.progress - dt);
    }
  }

  function updateSmoke(dt) {
    if (state.smoke.active && state.time >= state.smoke.until) {
      state.smoke.active = false;
    }
    if (input.smokePressed() && state.phase === 'play') {
      if (state.smokes <= 0) {
        setMessage('No smoke bombs left.');
        return;
      }
      if (state.score < 50) {
        setMessage('A smoke bomb costs 50 score. You have ' + state.score + '.');
        return;
      }
      state.smokes -= 1;
      state.score -= 50;
      state.smoke.active = true;
      state.smoke.x = state.thief.x;
      state.smoke.y = state.thief.y;
      state.smoke.until = state.time + 4;
      playSmoke();
      setMessage('Smoke! They cannot see you inside it.');
    }
  }

  function distToSegment(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy));
  }

  function updateLasers(dt) {
    for (const laser of state.level.lasers) {
      laser.on = (state.time * 0.5 + laser.phase) % 1 < 0.6;
      if (!laser.on) continue;
      const d = distToSegment(
        state.thief.x,
        state.thief.y,
        laser.x1,
        laser.y1,
        laser.x2,
        laser.y2,
      );
      if (d < 13) {
        state.alarm = Math.min(100, state.alarm + 45 * dt);
        if (state.time - state.zapSoundAt > 0.5) {
          state.zapSoundAt = state.time;
          playLaserZap();
        }
      }
    }
  }

  function updatePickups() {
    const t = state.thief;
    for (const loot of state.level.loot) {
      if (loot.taken) continue;
      const cx = loot.x * TILE + TILE / 2;
      const cy = loot.y * TILE + TILE / 2;
      if (Math.hypot(cx - t.x, cy - t.y) < 26) {
        loot.taken = true;
        state.lootValue += loot.value;
        state.score += loot.value;
        playPickup(loot.kind);
        setMessage(loot.name + ' lifted! +$' + loot.value, 2.5);
      }
    }
    const kc = state.level.keycard;
    if (kc && !kc.taken) {
      const cx = kc.x * TILE + TILE / 2;
      const cy = kc.y * TILE + TILE / 2;
      if (Math.hypot(cx - t.x, cy - t.y) < 26) {
        kc.taken = true;
        state.hasKeycard = true;
        playKeycard();
        setMessage('Keycard taken — the vault door will open now.', 4);
      }
    }
    for (const door of state.level.doors) {
      if (!door.open && state.hasKeycard) {
        const cx = door.x * TILE + TILE / 2;
        const cy = door.y * TILE + TILE / 2;
        if (Math.hypot(cx - t.x, cy - t.y) < 60) {
          door.open = true;
          playDoor();
          setMessage('Vault door unlocked.', 3);
        }
      }
    }
    const exit = state.level.exit;
    if (exit) {
      const cx = exit.x * TILE + TILE / 2;
      const cy = exit.y * TILE + TILE / 2;
      if (Math.hypot(cx - t.x, cy - t.y) < 26) {
        if (state.lootValue >= state.level.goal) {
          winLevel();
        } else {
          setMessage(
            'The exit wants $' + state.level.goal + ' of loot. You have $' + state.lootValue + '.',
            3,
          );
        }
      }
    }
  }

  function winLevel() {
    const timeBonus = Math.max(0, 500 - Math.floor(state.time) * 5);
    state.score += timeBonus;
    state.totalLoot += state.lootValue;
    state.totalTime += state.time;
    state.phase = 'win';
    playWin();
  }

  function busted() {
    state.phase = 'lose';
    playLose();
  }

  function update(dt) {
    if (state.phase !== 'play') return;
    state.time += dt;
    moveThief(dt);
    updateHack(dt);
    updateSmoke(dt);
    updateLasers(dt);

    let seen = false;
    for (const guard of state.guards) {
      const fresh = updateGuard(guard, dt, state.level, state.thief, state.smoke);
      if (fresh && state.time - state.spottedSoundAt > 1) {
        state.spottedSoundAt = state.time;
        playSpotted();
      }
      if (guard.seeing) seen = true;
    }
    const camerasOff = state.time < state.camerasOffUntil;
    for (const camera of state.cameras) {
      const fresh = updateCamera(camera, dt, state.time, state.level, state.thief, state.smoke, camerasOff);
      if (fresh && state.time - state.spottedSoundAt > 1) {
        state.spottedSoundAt = state.time;
        playSpotted();
      }
      if (camera.seeing) seen = true;
    }

    if (seen) {
      state.alarm = Math.min(100, state.alarm + 32 * dt);
    } else {
      state.alarm = Math.max(0, state.alarm - 7 * dt);
    }
    setAlarmLevel(state.alarm);
    updatePickups();
    if (state.alarm >= 100) busted();
  }

  function render() {
    ctx.clearRect(0, 0, VIEW_W, VIEW_H);
    if (state.phase === 'title') {
      drawTitle(ctx);
      return;
    }
    drawScene(ctx, state);
    drawHud(ctx, state);
    if (state.phase === 'intro') drawIntro(ctx, state);
    else if (state.phase === 'win') drawWin(ctx, state);
    else if (state.phase === 'lose') drawLose(ctx, state);
    else if (state.phase === 'complete') drawComplete(ctx, state);
  }

  function onConfirm() {
    ensureAudio();
    playClick();
    if (state.phase === 'title') {
      loadLevel(0);
    } else if (state.phase === 'intro') {
      state.phase = 'play';
    } else if (state.phase === 'win') {
      if (state.levelIndex < LEVELS.length - 1) {
        loadLevel(state.levelIndex + 1);
      } else {
        state.phase = 'complete';
      }
    } else if (state.phase === 'lose') {
      loadLevel(state.levelIndex);
    } else if (state.phase === 'complete') {
      state.score = 0;
      state.totalLoot = 0;
      state.totalTime = 0;
      loadLevel(0);
    }
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (input.confirmPressed()) onConfirm();
    update(dt);
    render();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
