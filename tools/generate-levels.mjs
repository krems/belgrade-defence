#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { GRID, PLANTS, PLANT_KEYS, FIXED_DT } from '../src/balance.js';
import { createGame, step, startWave, placeAt, digAt } from '../src/state.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG_PATH = join(ROOT, 'src', 'config.js');

const ALL_PLANTS = [...PLANT_KEYS];

const VOROTA_WAYPOINTS = [
  [-1, 2], [1, 2], [1, 6], [4, 6], [4, 2], [7, 2], [7, 6], [10, 6], [10, 3], [13, 3],
];
const VOROTA_SLOTS = [
  [0, 1], [0, 4], [2, 2], [2, 5], [3, 2], [3, 4],
  [5, 4], [6, 1], [8, 2], [8, 5], [9, 5],
  [10, 2], [11, 2], [11, 4],
  // добор под босса 5000 HP: укрытия в конце змеевика, где прежних слотов не хватало
  [9, 4], [9, 3], [11, 5], [12, 2],
];

const SPECS = [
  {
    id: 'okraina', name: 'Окраина', seed: 1001,
    blurb: 'Обучение: прямой S-путь, только обычные зомби.',
    waves: 8, slots: 16, startCoins: 150, cityHp: 10, hpScalePerWave: 0.08,
    unlockedPlants: ['pea', 'nut'],
    road: { kind: 'S' },
    waveOpts: { grow: 0.5, runnerFrom: Infinity, armoredFrom: Infinity, flyerFrom: Infinity, bossWaves: [] },
  },
  {
    id: 'most', name: 'Мост', seed: 2002,
    blurb: 'Петля у моста, полянок мало. Появляются быстрые бегуны.',
    waves: 10, slots: 11, startCoins: 150, cityHp: 10, hpScalePerWave: 0.09,
    unlockedPlants: ['pea', 'nut', 'frost', 'cactus'],
    road: { kind: 'loop' },
    waveOpts: { grow: 0.55, runnerFrom: 3, armoredFrom: Infinity, flyerFrom: Infinity, bossWaves: [] },
  },
  {
    id: 'park', name: 'Парк', seed: 3003,
    blurb: 'Двойной фронт: появляются броневики, монетник и липучки.',
    waves: 12, slots: 13, startCoins: 150, cityHp: 10, hpScalePerWave: 0.1,
    unlockedPlants: ['pea', 'nut', 'frost', 'cactus', 'mortar', 'trap', 'coin'],
    road: { kind: 'double' },
    waveOpts: { grow: 0.6, runnerFrom: 3, armoredFrom: 5, flyerFrom: Infinity, bossWaves: [] },
  },
  {
    id: 'ulicy', name: 'Улицы', seed: 4004,
    blurb: 'Короткий путь: летающие зомби — без зенитников не выжить.',
    waves: 14, slots: 12, startCoins: 175, cityHp: 10, hpScalePerWave: 0.1,
    unlockedPlants: ALL_PLANTS,
    road: { kind: 'short' },
    waveOpts: { grow: 0.55, runnerFrom: 3, armoredFrom: 4, flyerFrom: 3, bossWaves: [] },
  },
  {
    id: 'vorota-belgrada', name: 'Ворота Белграда', seed: 5005,
    blurb: 'Длинный змеевик у самых ворот. 15 волн и БОСС (5000 HP).',
    waves: 15, slots: 14, startCoins: 150, cityHp: 10, hpScalePerWave: 0.1,
    unlockedPlants: ALL_PLANTS,
    road: { kind: 'fixed', waypoints: VOROTA_WAYPOINTS, slots: VOROTA_SLOTS },
    waveOpts: { grow: 0.6, runnerFrom: 3, armoredFrom: 5, flyerFrom: 4, bossWaves: [15] },
  },
];

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (x) => Math.round(x * 100) / 100;

function buildRoad(spec, rng) {
  switch (spec.road.kind) {
    case 'S': {
      const r0 = 1 + Math.floor(rng() * 2);
      const rm = 3 + Math.floor(rng() * 2);
      const r1 = 6 + Math.floor(rng() * 2);
      const cA = 3 + Math.floor(rng() * 2);
      const cB = 8 + Math.floor(rng() * 2);
      return [[-1, r0], [cA, r0], [cA, rm], [cB, rm], [cB, r1], [13, r1]];
    }
    case 'loop': {
      const r0 = 1 + Math.floor(rng() * 2);
      const c1 = 5 + Math.floor(rng() * 2);
      const r2 = 6 + Math.floor(rng() * 2);
      const c2 = 2 + Math.floor(rng() * 2);
      const r3 = 3 + Math.floor(rng() * 2);
      const c3 = 8 + Math.floor(rng() * 2);
      return [[-1, r0], [c1, r0], [c1, r2], [c2, r2], [c2, r3], [c3, r3], [c3, 7], [13, 7]];
    }
    case 'double': {
      const r0 = 1 + Math.floor(rng() * 2);
      const cA = 9 + Math.floor(rng() * 2);
      const cB = 2 + Math.floor(rng() * 2);
      return [[-1, r0], [cA, r0], [cA, r0 + 2], [cB, r0 + 2], [cB, r0 + 4], [13, r0 + 4]];
    }
    case 'short': {
      const r0 = 2 + Math.floor(rng() * 2);
      const cA = 3 + Math.floor(rng() * 2);
      const r1 = 5 + Math.floor(rng() * 2);
      return [[-1, r0], [cA, r0], [cA, r1], [13, r1]];
    }
    case 'fixed':
      return spec.road.waypoints;
    default:
      throw new Error('unknown road kind: ' + spec.road.kind);
  }
}

function roadSequence(waypoints) {
  const road = [];
  const seen = new Set();
  for (let i = 0; i < waypoints.length - 1; i++) {
    let [c, r] = waypoints[i];
    const [c1, r1] = waypoints[i + 1];
    const dc = Math.sign(c1 - c);
    const dr = Math.sign(r1 - r);
    const push = () => {
      const k = c + ',' + r;
      if (!seen.has(k)) { seen.add(k); road.push([c, r]); }
    };
    push();
    while (c !== c1 || r !== r1) { c += dc; r += dr; push(); }
  }
  return { road, seen };
}

function pickSlots(waypoints, count, rng) {
  const { road, seen } = roadSequence(waypoints);
  const progress = new Map();
  road.forEach(([c, r], i) => progress.set(c + ',' + r, i / (road.length - 1)));
  const inGrid = (c, r) => c >= 0 && r >= 0 && c < GRID.cols - 1 && r < GRID.rows;
  const candidates = new Map();
  for (const [c, r] of road) {
    const p = progress.get(c + ',' + r);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (!inGrid(nc, nr)) continue;
      const k = nc + ',' + nr;
      if (seen.has(k)) continue;
      if (!candidates.has(k) || candidates.get(k).p > p) candidates.set(k, { c: nc, r: nr, p });
    }
  }
  const list = [...candidates.values()].sort((a, b) => a.p - b.p);
  const slots = [];
  const used = new Set();
  for (let k = 0; k < count; k++) {
    const target = (k + 0.5) / count + (rng() - 0.5) * (0.6 / count);
    let best = null;
    let bd = Infinity;
    for (const cand of list) {
      const key = cand.c + ',' + cand.r;
      if (used.has(key)) continue;
      const d = Math.abs(cand.p - target);
      if (d < bd) { bd = d; best = cand; }
    }
    if (!best) break;
    used.add(best.c + ',' + best.r);
    slots.push([best.c, best.r]);
  }
  slots.sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  return slots;
}

function draftWaves(rng, waveCount, opts) {
  const waves = [];
  for (let w = 1; w <= waveCount; w++) {
    const entries = [];
    const nCount = Math.round(4 + w * opts.grow + rng() * 1.2);
    entries.push({ type: 'normal', count: nCount, every: r2(Math.max(1.2, 2.3 - w * 0.05)), delay: 1 });
    if (w >= opts.runnerFrom) {
      entries.push({
        type: 'runner',
        count: Math.max(1, Math.round((w - opts.runnerFrom + 1) * 0.9)),
        every: r2(Math.max(1.4, 2.6 - w * 0.05)),
        delay: 4 + Math.floor(rng() * 3),
      });
    }
    if (w >= opts.armoredFrom) {
      entries.push({
        type: 'armored',
        count: Math.max(1, Math.round((w - opts.armoredFrom + 1) / 2)),
        every: 6,
        delay: 8 + Math.floor(rng() * 4),
      });
    }
    if (w >= opts.flyerFrom) {
      entries.push({
        type: 'flyer',
        count: Math.max(1, Math.round((w - opts.flyerFrom + 1) * 0.8)),
        every: r2(Math.max(1.6, 2.8 - w * 0.05)),
        delay: 5 + Math.floor(rng() * 3),
      });
    }
    if (opts.bossWaves.includes(w)) {
      entries.unshift({ type: 'boss', count: 1, every: 1, delay: 6 });
    }
    waves.push(entries);
  }
  return waves;
}

function scaleWaves(waves, kCount, kEvery, mode) {
  const nextCount = (n) => Math.max(1, mode === 'thin' ? Math.floor(n * kCount) : Math.round(n * kCount));
  return waves.map((entries) => entries.map((e) => ({
    ...e,
    count: nextCount(e.count),
    every: r2(Math.max(0.6, e.every * kEvery)),
    delay: Math.max(1, r2(e.delay * kEvery)),
  })));
}

function makeRoadProgress(waypoints) {
  const { road } = roadSequence(waypoints);
  const map = new Map();
  road.forEach(([c, r], i) => map.set(c + ',' + r, i / (road.length - 1)));
  return map;
}

function makeSlotProgress(waypoints, slots) {
  const { road } = roadSequence(waypoints);
  const center = (c, r) => [c * GRID.cell + GRID.cell / 2, r * GRID.cell + GRID.cell / 2];
  const progress = new Map();
  road.forEach(([c, r], i) => progress.set(c + ',' + r, i / (road.length - 1)));
  const out = new Map();
  for (const [c, r] of slots) {
    const [x, y] = center(c, r);
    let best = 0;
    let bd = Infinity;
    for (const [rc, rr] of road) {
      const [rx, ry] = center(rc, rr);
      const d = Math.hypot(rx - x, ry - y);
      if (d < bd) { bd = d; best = progress.get(rc + ',' + rr); }
    }
    out.set(c + ',' + r, best);
  }
  return out;
}

function botStep(g, ctx) {
  const level = g.level;
  const unlocked = new Set(level.unlockedPlants);
  const cnt = (t) => g.plants.filter((p) => p.type === t && !p.dead).length;
  const freeSlots = level.slotCells.filter(([c, r]) => !g.occupancy.has(c + ',' + r));
  const slotAt = (frac) => {
    let best = null;
    let bd = Infinity;
    for (const [c, r] of freeSlots) {
      const f = ctx.slotProgress.get(c + ',' + r);
      const d = Math.abs(f - frac);
      if (d < bd) { bd = d; best = [c, r]; }
    }
    return best;
  };
  const roadAt = (frac) => {
    let best = null;
    let bd = Infinity;
    for (const [k, f] of ctx.roadProgress) {
      const [c, r] = k.split(',').map(Number);
      if (c < 0 || c >= GRID.cols) continue;
      if (g.occupancy.has(k)) continue;
      const d = Math.abs(f - frac);
      if (d < bd) { bd = d; best = [c, r]; }
    }
    return best;
  };
  const buy = (t, cell) => (cell ? placeAt(g, cell[0], cell[1], t) : false);
  // Покупка не должна обрывать цепочку, если конкретный слот не нашёлся:
  // иначе бот застревает (слоты кончились — и дорогие растения тоже не куплены).
  const tryBuy = (t, frac, place) => buy(t, (place ?? slotAt)(frac));

  // Перед боссовой волной зенитники бесполезны (по боссу не стреляют) —
  // перекапываем их в горохострелы, как сделал бы игрок.
  const nextWave = g.waves[g.waveIndex];
  const bossWaveNext = Boolean(nextWave && nextWave.some((e) => e.type === 'boss'));
  if (bossWaveNext) {
    const spareAa = g.plants.find((p) => p.type === 'aa' && !p.dead);
    if (spareAa) {
      digAt(g, spareAa.col, spareAa.row);
      return true;
    }
    if (cnt('mortar') < 3 && g.coins >= PLANTS.mortar.cost + 50
      && tryBuy('mortar', 0.7)) return true;
    // Перед последней волной доход не нужен — монетники становятся горохострелами.
    if (g.coins >= 300) {
      const spareCoin = g.plants.find((p) => p.type === 'coin' && !p.dead);
      if (spareCoin) {
        digAt(g, spareCoin.col, spareCoin.row);
        return true;
      }
    }
  }

  if (cnt('pea') < 2 && tryBuy('pea', 0.12)) return true;
  const coinCap = g.waves.length >= 14 ? 3 : 2;
  if (unlocked.has('coin') && cnt('coin') < Math.min(coinCap, 1 + Math.floor(g.waveIndex / 2))
    && g.coins >= PLANTS.coin.cost + PLANTS.pea.cost
    && tryBuy('coin', 0.55)) return true;
  // Зенитник — приоритет на уровнях с летающими (Улицы, Ворота): обычные стрелки по ним не попадают.
  if (!bossWaveNext && unlocked.has('aa') && cnt('aa') < 3 && g.waveIndex >= 1 && g.coins >= PLANTS.aa.cost + 20
    && tryBuy('aa', 0.3)) return true;
  if (unlocked.has('frost') && cnt('frost') < 2 && g.waveIndex >= 1 && g.coins >= PLANTS.frost.cost + 50
    && tryBuy('frost', 0.45)) return true;
  if (unlocked.has('mortar') && cnt('mortar') < 2 && g.waveIndex >= 3 && g.coins >= PLANTS.mortar.cost + 50
    && tryBuy('mortar', 0.7)) return true;
  if (unlocked.has('cactus') && cnt('cactus') < 2 && g.waveIndex >= 2 && g.coins >= PLANTS.cactus.cost + 50
    && tryBuy('cactus', 0.5, roadAt)) return true;
  if (unlocked.has('trap') && cnt('trap') < 2 && g.waveIndex >= 2 && g.coins >= PLANTS.trap.cost + 50
    && tryBuy('trap', 0.55, roadAt)) return true;
  if (unlocked.has('nut') && (ctx.lastLeaks > 0 || g.waveIndex >= 3) && cnt('nut') < 2
    && g.coins >= PLANTS.nut.cost + 40
    && tryBuy('nut', cnt('nut') === 0 ? 0.85 : 0.65, roadAt)) return true;
  if (cnt('pea') < 8 && g.coins >= PLANTS.pea.cost
    && (cnt('mortar') >= 2 || cnt('pea') < 4) // резервируем 2 слота под мортирки
    && tryBuy('pea', cnt('pea') % 2 === 0 ? 0.25 : 0.8)) return true;
  if (unlocked.has('cactus') && cnt('cactus') < 3 && g.coins >= PLANTS.cactus.cost
    && tryBuy('cactus', 0.35, roadAt)) return true;
  if (unlocked.has('nut') && cnt('nut') < 3 && g.coins >= PLANTS.nut.cost
    && tryBuy('nut', 0.5, roadAt)) return true;
  if (!bossWaveNext && unlocked.has('aa') && cnt('aa') < 4 && g.coins >= PLANTS.aa.cost
    && tryBuy('aa', 0.5)) return true;
  return false;
}

function runLevel(def, mode, rngSeed) {
  const prevRandom = Math.random;
  Math.random = mulberry32(rngSeed);
  try {
    const g = createGame(def, -1);
    const ctx = {
      roadProgress: makeRoadProgress(def.roadWaypoints),
      slotProgress: makeSlotProgress(def.roadWaypoints, def.slotCells),
      lastLeaks: 0,
    };
    if (mode === 'full') {
      g.coins = 1e9;
      // aa обязателен там, где есть летающие: обычные стрелки по ним не попадают
      const hasFlyers = def.waves.some((w) => w.some((e) => e.type === 'flyer'));
      let i = 0;
      for (const [c, r] of def.slotCells) {
        placeAt(g, c, r, hasFlyers && i % 3 === 1 ? 'aa' : i % 3 === 2 ? 'frost' : 'pea');
        i++;
      }
    }
    let hpBefore = g.cityHp;
    let guard = 0;
    while (g.screen !== 'win' && g.screen !== 'lose' && guard++ < 300000) {
      if (g.screen === 'planning') {
        ctx.lastLeaks = hpBefore - g.cityHp;
        hpBefore = g.cityHp;
        if (mode === 'honest') {
          for (let k = 0; k < 30 && botStep(g, ctx); k++);
        }
        startWave(g);
      } else {
        step(g, FIXED_DT);
      }
    }
    const timeout = g.screen !== 'win' && g.screen !== 'lose';
    return { result: timeout ? 'timeout' : g.screen, cityHp: g.cityHp, kills: g.kills, wavesCleared: g.waveIndex };
  } finally {
    Math.random = prevRandom;
  }
}

const score = (c) => (c.honest.result === 'win'
  ? 1000 - Math.abs(c.leak - 1.5) * 100
  : c.honest.wavesCleared);

function autobalance(spec, base) {
  const rng = mulberry32(spec.seed ^ 0x51ab);
  let waves = draftWaves(rng, spec.waves, spec.waveOpts);
  let best = null;
  let iterations = 0;
  for (let iter = 0; iter < 18; iter++) {
    iterations = iter + 1;
    const honest = runLevel({ ...base, waves }, 'honest', spec.seed + iter * 131 + 7);
    const cand = { waves, honest, leak: spec.cityHp - honest.cityHp };
    if (!best || score(cand) > score(best)) best = cand;
    if (honest.result === 'win' && cand.leak >= 1 && cand.leak <= 2) break;
    if (honest.result === 'win' && cand.leak === 0) waves = scaleWaves(waves, 1.12, 0.94, 'thicken');
    else if (honest.result === 'win') waves = scaleWaves(waves, 0.9, 1.06, 'thin');
    else waves = scaleWaves(waves, 0.75, 1.15, 'thin');
  }
  return { waves: best.waves, report: { iterations, ...best } };
}

function buildLevelDef(spec) {
  const rng = mulberry32(spec.seed);
  const waypoints = buildRoad(spec, rng);
  const slotCells = spec.road.kind === 'fixed'
    ? spec.road.slots
    : pickSlots(waypoints, spec.slots, rng);
  const base = {
    id: spec.id,
    name: spec.name,
    seed: spec.seed,
    blurb: spec.blurb,
    roadWaypoints: waypoints,
    slotCells,
    waves: [],
    startCoins: spec.startCoins,
    cityHp: spec.cityHp,
    hpScalePerWave: spec.hpScalePerWave,
    unlockedPlants: spec.unlockedPlants,
  };
  const { waves, report } = autobalance(spec, base);
  return {
    def: { ...base, waves },
    report: {
      id: spec.id,
      slots: slotCells.length,
      waveCount: waves.length,
      honest: report.honest.result,
      leak: report.leak,
      iterations: report.iterations,
    },
  };
}

function buildLevels() {
  const levels = [];
  const reports = [];
  for (const spec of SPECS) {
    const { def, report } = buildLevelDef(spec);
    levels.push(def);
    reports.push(report);
  }
  const vorota = levels[levels.length - 1];
  levels.push({
    id: 'endless',
    name: 'Endless',
    seed: 4242,
    blurb: 'Бесконечные волны, растущие с каждым разом. До первой потери города.',
    roadWaypoints: vorota.roadWaypoints,
    slotCells: vorota.slotCells,
    waves: [],
    endless: true,
    startCoins: 200,
    cityHp: 10,
    hpScalePerWave: 0.12,
    unlockedPlants: ALL_PLANTS,
  });
  return { levels, reports };
}

const lit = (v) => Array.isArray(v)
  ? '[' + v.map(lit).join(', ') + ']'
  : typeof v === 'object' && v !== null
    ? '{ ' + Object.entries(v).map(([k, x]) => k + ': ' + lit(x)).join(', ') + ' }'
    : JSON.stringify(v);

function levelToJs(def) {
  const waves = def.waves.length
    ? '\n' + def.waves.map((w) => '      ' + lit(w) + ',').join('\n') + '\n    '
    : '';
  return `  {
    id: ${JSON.stringify(def.id)},
    name: ${JSON.stringify(def.name)},
    seed: ${def.seed},
    blurb: ${JSON.stringify(def.blurb)},
    roadWaypoints: ${lit(def.roadWaypoints)},
    slotCells: ${lit(def.slotCells)},
    waves: [${waves}],${def.endless ? '\n    endless: true,' : ''}
    startCoins: ${def.startCoins},
    cityHp: ${def.cityHp},
    hpScalePerWave: ${def.hpScalePerWave},
    unlockedPlants: ${lit(def.unlockedPlants)},
  }`;
}

function renderConfig(levels) {
  const header = '// GENERATED by tools/generate-levels.mjs — уровни заморожены, не править руками.\n'
    + '// Регенерация: node tools/generate-levels.mjs\n\n';
  return header + 'export const LEVELS = Object.freeze([\n'
    + levels.map(levelToJs).join(',\n')
    + ',\n]);\n';
}

function sanityCheck(def) {
  const full = runLevel(def, 'full', def.seed + 777);
  const none = runLevel(def, 'none', def.seed + 888);
  return { full, none };
}

function main() {
  const verify = process.argv.includes('--verify');
  const { levels, reports } = buildLevels();
  const config = renderConfig(levels);

  if (verify) {
    const existing = readFileSync(CONFIG_PATH, 'utf8');
    if (existing !== config) {
      console.error('FAIL: src/config.js не совпадает с генерацией от тех же seed');
      process.exit(1);
    }
    console.log('OK: config воспроизводим (тот же seed → тот же уровень)');
  } else {
    writeFileSync(CONFIG_PATH, config, 'utf8');
    console.log('Записан src/config.js (' + levels.length + ' уровней)');
  }

  console.log('');
  console.log('Уровень            | слоты | волн | honest | leak | итер. | full | none');
  console.log('-------------------|-------|------|--------|------|-------|------|-----');
  let failed = false;
  for (let i = 0; i < levels.length; i++) {
    const def = levels[i];
    if (def.endless) continue;
    const rep = reports[i];
    const { full, none } = sanityCheck(def);
    const okFull = full.result === 'win';
    const okNone = none.result === 'lose';
    if (!okFull || !okNone) failed = true;
    console.log(
      String(def.name).padEnd(18).slice(0, 18) + ' | '
      + String(rep.slots).padStart(5) + ' | '
      + String(rep.waveCount).padStart(4) + ' | '
      + String(rep.honest).padStart(6) + ' | '
      + String(rep.leak).padStart(4) + ' | '
      + String(rep.iterations).padStart(5) + ' | '
      + (okFull ? 'win ' : 'FAIL') + ' | '
      + (okNone ? 'lose' : 'FAIL'),
    );
  }
  if (failed) {
    console.error('\nFAIL: санитарные прогоны не сошлись');
    process.exit(1);
  }
  console.log('\nВсе уровни: full-board win, honest win, без растений lose.');
}

export { runLevel, botStep, makeRoadProgress, makeSlotProgress, SPECS, draftWaves };

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
