// The Velvet Vault — the entry program (Node 22, standard library only).
// The game is plain static files in game/ (index.html plus ES modules,
// no library, no network request), and this program hands it in: it
// copies game/ and screenshots/ from beside this file to the output
// directory and writes dossier.json, the summary the judge reads,
// with the vendored make.fun library.
//
// Before it copies anything it checks the entry against the scorer's
// own caps, so a bad build fails loudly here instead of silently
// producing an output the gate would refuse.
//
// Serve the game locally with `node serve.ts`, then open
// http://localhost:8080. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The scorer's own caps (reference/gate.json): only text_max_bytes
// shapes the bytes; the others refuse an entry the scorer would refuse.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error('main.ts: ' + message);
}

// Check the entry before copying it, so a bad build fails here.
const indexPath = join(here, 'game', 'index.html');
if (!existsSync(indexPath) || !statSync(indexPath).isFile()) {
  fail('game/index.html is missing');
}
if (statSync(indexPath).size > 1024 * 1024) {
  fail('game/index.html is over the 1 MiB cap');
}
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.')).sort();
if (shots.length < 3 || shots.length > CAPS.screenshots.max) {
  fail('screenshots/ must hold 3 or 4 images, found ' + shots.length);
}
for (const name of shots) {
  const shotPath = join(shotsDir, name);
  if (!statSync(shotPath).isFile()) fail('screenshots/' + name + ' is not a regular file');
  if (!/^[A-Za-z0-9._-]+$/.test(name)) fail('screenshots/' + name + ' has a bad name');
  if (statSync(shotPath).size > CAPS.screenshots.max_bytes) {
    fail('screenshots/' + name + ' is over the 256 KiB cap');
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

const dossier = buildDossier(out, CAPS);
writeFileSync(join(out, 'dossier.json'), dossier);

const gameFiles = readdirSync(join(out, 'game'), { recursive: true }).length;
console.log(
  'The Velvet Vault handed in: ' +
    gameFiles +
    ' game entries, ' +
    shots.length +
    ' screenshots, dossier ' +
    Buffer.byteLength(dossier, 'utf8') +
    ' bytes -> ' +
    out,
);
