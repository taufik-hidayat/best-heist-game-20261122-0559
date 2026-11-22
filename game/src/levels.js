// The three rooms of The Velvet Vault.
// Each level is a tile map plus the patrol and camera data that the map
// alone cannot express. Legend:
//   # wall   . floor   + doorway   T thief start   X exit
//   L painting ($200)  D gem ($500)  W crown jewel ($1000)
//   G guard spawn  C camera  H hack terminal  K keycard
//   E locked door (needs the keycard)  = laser beam tile
// Maps are 32 columns by 18 rows; every row is exactly 32 characters.

export const TILE = 40;
export const MAP_COLS = 32;
export const MAP_ROWS = 18;

export const LOOT_VALUES = { L: 200, D: 500, W: 1000 };
export const LOOT_NAMES = {
  L: 'Velvet Painting',
  D: 'Moonstone Gem',
  W: 'The Crown Jewel',
};

const LEVEL_1_MAP = [
  '################################',
  '#......#........#..............#',
  '#.L....#...L....#......D.......#',
  '#......#........#..............#',
  '#..T...#........#......C.......#',
  '#......#........#..............#',
  '#......+........+..............#',
  '#......#........#..............#',
  '#......#....G...#..............#',
  '#......#........#..............#',
  '#......#........#..............#',
  '#......+........+..............#',
  '#......#........#..............#',
  '#......#........#......L.......#',
  '#......#........#..............#',
  '#..H...#........#.......X......#',
  '#......#........#..............#',
  '################################',
];

const LEVEL_2_MAP = [
  '################################',
  '#..T...#......K.#.....D........#',
  '#.L....#........#..............#',
  '#......+........+......C.......#',
  '#......#........#..............#',
  '#..G...#...L....#..G.......C...#',
  '#......#........#..............#',
  '#......+........+......=.......#',
  '#......#........#......=.......#',
  '#..H...#...L....#..L...=..D....#',
  '#......#........#......=.......#',
  '#......+........+......=.......#',
  '#......#........#..###E###.....#',
  '#.L....#........#..#.....#.....#',
  '#......#........#..#..D..#.....#',
  '#..D...#........#..#..X..#.....#',
  '#......#........#..#######.....#',
  '################################',
];

const LEVEL_3_MAP = [
  '################################',
  '#..T...#...K....#......D.......#',
  '#.L....#........#..C...........#',
  '#......+........+..............#',
  '#..G...#...L....#..G.....L.....#',
  '#......#........#..............#',
  '#......+....=...+......=.......#',
  '#..H...#....=...#..L...=..D....#',
  '#......#....=...#......=.......#',
  '#..L...#....=...#......=.......#',
  '#......#........#..............#',
  '#......+........+..###E##......#',
  '#.D....#...L....#..#....#......#',
  '#......#........#..#.W..#..C...#',
  '#..L...#........#..#.X..#......#',
  '#......#........#..######......#',
  '#......#...C....#......G.......#',
  '################################',
];

export const LEVELS = [
  {
    name: 'Room 1 · The Velvet Gallery',
    goal: 600,
    map: LEVEL_1_MAP,
    patrols: [
      [
        { x: 9, y: 4 },
        { x: 15, y: 4 },
        { x: 15, y: 13 },
        { x: 9, y: 13 },
      ],
    ],
    cameraSweeps: [{ base: Math.PI / 2, arc: 1.1, speed: 0.55 }],
    intro: 'Lift $600 of art, then slip out the green exit.',
  },
  {
    name: 'Room 2 · The Marble Vault',
    goal: 1200,
    map: LEVEL_2_MAP,
    patrols: [
      [
        { x: 2, y: 2 },
        { x: 5, y: 2 },
        { x: 5, y: 15 },
        { x: 2, y: 15 },
      ],
      [
        { x: 19, y: 2 },
        { x: 30, y: 2 },
        { x: 30, y: 10 },
        { x: 19, y: 10 },
      ],
    ],
    cameraSweeps: [
      { base: Math.PI / 2, arc: 1.2, speed: 0.7 },
      { base: Math.PI, arc: 1.0, speed: 0.6 },
    ],
    intro: 'The exit sits inside a locked vault. Find the keycard first.',
  },
  {
    name: 'Room 3 · The Crown Chamber',
    goal: 2000,
    map: LEVEL_3_MAP,
    patrols: [
      [
        { x: 2, y: 2 },
        { x: 5, y: 2 },
        { x: 5, y: 15 },
        { x: 2, y: 15 },
      ],
      [
        { x: 19, y: 2 },
        { x: 30, y: 2 },
        { x: 30, y: 9 },
        { x: 19, y: 9 },
      ],
      [
        { x: 19, y: 16 },
        { x: 30, y: 16 },
      ],
    ],
    cameraSweeps: [
      { base: Math.PI / 2, arc: 1.2, speed: 0.8 },
      { base: Math.PI, arc: 1.1, speed: 0.65 },
      { base: -Math.PI / 2, arc: 1.0, speed: 0.7 },
    ],
    intro: 'The Crown Jewel is behind the vault door. Take it all.',
  },
];

// Turn a level's map strings into the live objects a run uses.
export function parseLevel(def) {
  const walls = new Set();
  const loot = [];
  const guards = [];
  const cameras = [];
  const terminals = [];
  const lasers = [];
  const doors = [];
  let keycard = null;
  let exit = null;
  let thiefStart = { x: 2, y: 2 };

  const laserTiles = [];
  def.map.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      const key = x + ',' + y;
      if (ch === '#') walls.add(key);
      else if (ch === 'L' || ch === 'D' || ch === 'W') {
        loot.push({
          x,
          y,
          kind: ch,
          value: LOOT_VALUES[ch],
          name: LOOT_NAMES[ch],
          taken: false,
          sparkle: 0,
        });
      } else if (ch === 'G') {
        guards.push({ tileX: x, tileY: y });
      } else if (ch === 'C') {
        cameras.push({ tileX: x, tileY: y });
      } else if (ch === 'H') {
        terminals.push({ x, y, used: false, progress: 0 });
      } else if (ch === 'K') {
        keycard = { x, y, taken: false };
      } else if (ch === 'X') {
        exit = { x, y };
      } else if (ch === 'T') {
        thiefStart = { x, y };
      } else if (ch === 'E') {
        doors.push({ x, y, open: false });
      } else if (ch === '=') {
        laserTiles.push({ x, y });
      }
    }
  });

  // Group consecutive laser tiles into one beam each.
  const seen = new Set();
  for (const t of laserTiles) {
    const key = t.x + ',' + t.y;
    if (seen.has(key)) continue;
    const vertical =
      laserTiles.some((o) => o.x === t.x && o.y === t.y + 1) &&
      !laserTiles.some((o) => o.x === t.x + 1 && o.y === t.y);
    const run = [t];
    seen.add(key);
    if (vertical) {
      let ny = t.y + 1;
      while (laserTiles.some((o) => o.x === t.x && o.y === ny)) {
        run.push({ x: t.x, y: ny });
        seen.add(t.x + ',' + ny);
        ny++;
      }
    } else {
      let nx = t.x + 1;
      while (laserTiles.some((o) => o.x === nx && o.y === t.y)) {
        run.push({ x: nx, y: t.y });
        seen.add(nx + ',' + t.y);
        nx++;
      }
    }
    const first = run[0];
    const last = run[run.length - 1];
    lasers.push({
      x1: (first.x + 0.5) * TILE,
      y1: (first.y + 0.5) * TILE,
      x2: (last.x + 0.5) * TILE,
      y2: (last.y + 0.5) * TILE,
      phase: (first.x * 7 + first.y * 13) % 10 / 10,
      on: true,
    });
  }

  const guardSpawns = guards.map((g, i) => ({
    x: (g.tileX + 0.5) * TILE,
    y: (g.tileY + 0.5) * TILE,
    patrol: (def.patrols[i] || [{ x: g.tileX, y: g.tileY }]).map((p) => ({
      x: (p.x + 0.5) * TILE,
      y: (p.y + 0.5) * TILE,
    })),
  }));
  const cameraSpawns = cameras.map((c, i) => ({
    x: (c.tileX + 0.5) * TILE,
    y: (c.tileY + 0.5) * TILE,
    base: (def.cameraSweeps[i] || { base: Math.PI / 2 }).base,
    arc: (def.cameraSweeps[i] || { arc: 1 }).arc,
    speed: (def.cameraSweeps[i] || { speed: 0.6 }).speed,
  }));

  return {
    name: def.name,
    goal: def.goal,
    intro: def.intro,
    walls,
    loot,
    guardSpawns,
    cameraSpawns,
    terminals,
    lasers,
    doors,
    keycard,
    exit,
    thiefStart: {
      x: (thiefStart.x + 0.5) * TILE,
      y: (thiefStart.y + 0.5) * TILE,
    },
  };
}

export function isWall(level, tileX, tileY) {
  if (tileX < 0 || tileY < 0 || tileX >= MAP_COLS || tileY >= MAP_ROWS) return true;
  return level.walls.has(tileX + ',' + tileY);
}

// Is the tile a locked door that is still shut?
export function doorAt(level, tileX, tileY) {
  return level.doors.find((d) => d.x === tileX && d.y === tileY && !d.open) || null;
}

// True when a circle of radius r at (px, py) may not pass through tile (tx, ty).
export function tileBlocks(level, tx, ty) {
  return isWall(level, tx, ty) || doorAt(level, tx, ty) !== null;
}
