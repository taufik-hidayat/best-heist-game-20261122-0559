// All sound in The Velvet Vault is synthesized live with WebAudio:
// no audio files are shipped, nothing is fetched. The vault hums low,
// pickups chime, the alarm howls as it climbs, and the getaway pays off
// with a little fanfare.

let ctx = null;
let master = null;
let alarmOsc = null;
let alarmGain = null;
let humOsc = null;

export function ensureAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0.35;
  master.connect(ctx.destination);

  // A low museum hum that never stops once the game starts.
  humOsc = ctx.createOscillator();
  const humGain = ctx.createGain();
  humOsc.type = 'sine';
  humOsc.frequency.value = 55;
  humGain.gain.value = 0.05;
  humOsc.connect(humGain);
  humGain.connect(master);
  humOsc.start();

  // The alarm voice: silent until the meter climbs.
  alarmOsc = ctx.createOscillator();
  alarmGain = ctx.createGain();
  alarmOsc.type = 'sawtooth';
  alarmOsc.frequency.value = 620;
  alarmGain.gain.value = 0;
  alarmOsc.connect(alarmGain);
  alarmGain.connect(master);
  alarmOsc.start();
}

// How loud the alarm howls follows the alarm meter, 0 to 100.
export function setAlarmLevel(level) {
  if (!ctx || !alarmGain) return;
  const now = ctx.currentTime;
  const target = level <= 5 ? 0 : 0.02 + (level / 100) * 0.09;
  alarmGain.gain.setTargetAtTime(target, now, 0.15);
  alarmOsc.frequency.setTargetAtTime(520 + level * 4, now, 0.2);
}

function tone(freq, dur, type, vol, when = 0, slideTo = null) {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + when;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

export function playPickup(kind) {
  if (kind === 'W') {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.22, 'triangle', 0.22, i * 0.07));
  } else if (kind === 'D') {
    [660, 880].forEach((f, i) => tone(f, 0.16, 'triangle', 0.2, i * 0.06));
  } else {
    tone(880, 0.12, 'triangle', 0.18);
    tone(1175, 0.18, 'triangle', 0.16, 0.06);
  }
}

export function playKeycard() {
  tone(440, 0.1, 'square', 0.12);
  tone(660, 0.14, 'square', 0.12, 0.09);
}

export function playHackTick(done) {
  if (done) {
    tone(520, 0.1, 'square', 0.15);
    tone(780, 0.16, 'square', 0.15, 0.08);
    tone(1040, 0.22, 'square', 0.15, 0.16);
  } else {
    tone(1200, 0.05, 'square', 0.07);
  }
}

export function playLaserZap() {
  tone(180, 0.25, 'sawtooth', 0.2, 0, 90);
}

export function playSmoke() {
  tone(300, 0.4, 'sine', 0.14, 0, 90);
}

export function playDoor() {
  tone(140, 0.3, 'triangle', 0.18, 0, 320);
}

export function playSpotted() {
  tone(980, 0.12, 'square', 0.16);
  tone(740, 0.18, 'square', 0.16, 0.11);
}

export function playWin() {
  [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.32, 'triangle', 0.2, i * 0.11));
  tone(262, 0.9, 'sine', 0.12, 0.1);
}

export function playLose() {
  [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, 'sawtooth', 0.14, i * 0.18));
}

export function playClick() {
  tone(700, 0.06, 'square', 0.1);
}
