import { GRID } from './balance.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function cellKey(c, r) {
  return c + ',' + r;
}

export function buildMap(level) {
  const CELL = GRID.cell;
  const waypoints = level.roadWaypoints.map(([c, r]) => ({
    x: c * CELL + CELL / 2,
    y: r * CELL + CELL / 2,
  }));

  const segments = [];
  let totalLength = 0;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const a = waypoints[i];
    const b = waypoints[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segments.push({ a, b, len, cum: totalLength, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len });
    totalLength += len;
  }

  const roadCells = new Set();
  for (let i = 0; i < level.roadWaypoints.length - 1; i++) {
    let [c0, r0] = level.roadWaypoints[i];
    const [c1, r1] = level.roadWaypoints[i + 1];
    const dc = Math.sign(c1 - c0);
    const dr = Math.sign(r1 - r0);
    let c = c0, r = r0;
    roadCells.add(cellKey(c, r));
    while (c !== c1 || r !== r1) {
      c += dc; r += dr;
      roadCells.add(cellKey(c, r));
    }
  }

  const slotCells = new Set(level.slotCells.map(([c, r]) => cellKey(c, r)));

  const exit = level.roadWaypoints[level.roadWaypoints.length - 1];
  const map = {
    level,
    cell: CELL,
    cols: GRID.cols,
    rows: GRID.rows,
    width: GRID.cols * CELL,
    height: GRID.rows * CELL,
    waypoints,
    totalLength,
    roadCells,
    slotCells,
    gate: { x: GRID.cols * CELL - 14, y: exit[1] * CELL + CELL / 2 },
    cellCenter(c, r) {
      return { x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 };
    },
    inGrid(c, r) {
      return c >= 0 && r >= 0 && c < GRID.cols && r < GRID.rows;
    },
    cellAt(x, y) {
      const c = Math.floor(x / CELL);
      const r = Math.floor(y / CELL);
      if (!this.inGrid(c, r)) return null;
      return { c, r };
    },
    keyAt(x, y) {
      const cell = this.cellAt(x, y);
      return cell ? cellKey(cell.c, cell.r) : null;
    },
    isRoad(c, r) {
      return roadCells.has(cellKey(c, r));
    },
    isSlot(c, r) {
      return slotCells.has(cellKey(c, r));
    },
    posAt(dist) {
      const d = Math.max(0, Math.min(totalLength, dist));
      let seg = segments[segments.length - 1];
      for (const s of segments) {
        if (d < s.cum + s.len) { seg = s; break; }
      }
      const t = (d - seg.cum) / seg.len;
      return {
        x: seg.a.x + (seg.b.x - seg.a.x) * t,
        y: seg.a.y + (seg.b.y - seg.a.y) * t,
        dx: seg.dx,
        dy: seg.dy,
      };
    },
  };

  map.decor = buildDecor(map, level.seed);
  return map;
}

function buildDecor(map, seed) {
  const rand = mulberry32(seed);
  const decor = [];
  for (let r = 0; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      if (c >= map.cols - 1) continue;
      if (r === 0 && c <= 2) continue;
      const key = cellKey(c, r);
      if (map.roadCells.has(key) || map.slotCells.has(key)) continue;
      const roll = rand();
      if (roll < 0.42) continue;
      const center = map.cellCenter(c, r);
      const x = center.x + (rand() - 0.5) * 30;
      const y = center.y + (rand() - 0.5) * 30;
      if (roll < 0.62) {
        decor.push({ kind: 'bush', x, y, s: 0.7 + rand() * 0.5, hue: rand() });
      } else if (roll < 0.8) {
        decor.push({ kind: 'rock', x, y, s: 0.6 + rand() * 0.6, rot: rand() * Math.PI });
      } else {
        decor.push({ kind: 'tuft', x, y, s: 0.7 + rand() * 0.6, rot: rand() * Math.PI });
      }
    }
  }
  const pebbles = [];
  for (let i = 0; i < 70; i++) {
    const p = map.posAt(rand() * map.totalLength);
    const off = (rand() - 0.5) * 34;
    pebbles.push({ x: p.x - p.dy * off, y: p.y + p.dx * off, r: 1 + rand() * 1.8, a: 0.25 + rand() * 0.3 });
  }
  return { decor, pebbles };
}
