import { ECONOMY, PLANTS } from './balance.js';
import { buildMap, cellKey } from './map.js';
import { createPlant } from './entities/plant.js';
import { spawnZombie } from './entities/zombie.js';
import { buildEndlessWaves } from './waves.js';
import { fx } from './fx.js';
import { audio } from './audio.js';

export function createGame(level, levelIndex = null) {
  const map = buildMap(level);
  return {
    level,
    levelIndex,
    map,
    waves: level.endless ? buildEndlessWaves() : level.waves,
    screen: 'planning',
    paused: false,
    speed: 1,
    muted: false,
    coins: level.startCoins,
    cityHp: level.cityHp,
    waveIndex: 0,
    waveT: 0,
    spawnQueue: [],
    plants: [],
    zombies: [],
    projectiles: [],
    particles: [],
    occupancy: new Map(),
    selection: { mode: null, type: null, plant: null },
    hover: null,
    mouse: { x: 0, y: 0, inside: false },
    kills: 0,
    earned: 0,
    shakeT: 0,
    shakeDur: 0,
    shakeMag: 0,
    gateFlash: 0,
    time: 0,
    toasts: [],
  };
}

function toast(g, msg) {
  g.toasts.push(msg);
}

export function checkPlace(type, col, row, g) {
  if (!g.map.inGrid(col, row)) return 'out';
  const def = PLANTS[type];
  const key = cellKey(col, row);
  if (g.occupancy.has(key)) return 'occupied';
  if (def.onRoad) return g.map.isRoad(col, row) ? 'ok' : 'road';
  return g.map.isSlot(col, row) ? 'ok' : 'slot';
}

export function selectPlant(g, type) {
  if (g.screen !== 'planning' && g.screen !== 'wave') return;
  if (!g.level.unlockedPlants.includes(type)) {
    toast(g, PLANTS[type].name + ' откроется на следующем уровне');
    audio.click();
    return;
  }
  if (g.coins < PLANTS[type].cost) {
    toast(g, 'Не хватает монет: ' + PLANTS[type].name);
    audio.click();
  }
  g.selection = { mode: 'plant', type, plant: null };
  audio.click();
}

export function selectShovel(g) {
  if (g.screen !== 'planning' && g.screen !== 'wave') return;
  g.selection = g.selection.mode === 'shovel'
    ? { mode: null, type: null, plant: null }
    : { mode: 'shovel', type: null, plant: null };
  audio.click();
}

export function cancelSelection(g) {
  g.selection = { mode: null, type: null, plant: null };
}

export function selectInfo(g, plant) {
  g.selection = { mode: 'info', type: null, plant };
}

export function placeAt(g, col, row, typeOverride = null) {
  const type = typeOverride ?? g.selection.type;
  if (!type || !PLANTS[type]) return false;
  const def = PLANTS[type];
  const status = checkPlace(type, col, row, g);
  if (status === 'occupied') { toast(g, 'Клетка занята'); return false; }
  if (status === 'road') { toast(g, def.name + ' ставится только на полянки'); return false; }
  if (status === 'slot') { toast(g, def.name + ' ставится только на дорогу'); return false; }
  if (status === 'out') return false;
  if (g.coins < def.cost) { toast(g, 'Не хватает монет'); return false; }
  g.coins -= def.cost;
  const plant = createPlant(type, col, row, g.map);
  g.plants.push(plant);
  g.occupancy.set(plant.key, plant);
  fx.dirt(g, plant.x, plant.y);
  audio.plant();
  cancelSelection(g);
  return true;
}

export function digAt(g, col, row) {
  const key = cellKey(col, row);
  const plant = g.occupancy.get(key);
  if (!plant || plant.dead) return false;
  const refund = Math.floor(plant.def.cost * ECONOMY.sellRefund);
  g.coins += refund;
  plant.dead = true;
  g.occupancy.delete(key);
  fx.dirt(g, plant.x, plant.y);
  fx.text(g, plant.x, plant.y - 18, '+' + refund, { color: '#ffd54a', size: 13 });
  audio.shovel();
  return true;
}

export function startWave(g) {
  if (g.screen !== 'planning') return;
  const wave = g.waves[g.waveIndex];
  if (!wave) return;
  const queue = [];
  for (const entry of wave) {
    for (let i = 0; i < entry.count; i++) {
      queue.push({ t: entry.delay + i * entry.every, type: entry.type });
    }
  }
  queue.sort((a, b) => a.t - b.t);
  g.spawnQueue = queue;
  g.waveT = 0;
  g.screen = 'wave';
  cancelSelection(g);
  const isBoss = wave.some((e) => e.type === 'boss');
  const total = g.level.endless ? '∞' : g.waves.length;
  toast(g, isBoss ? 'ВОЛНА ' + (g.waveIndex + 1) + ': БОСС!' : 'Волна ' + (g.waveIndex + 1) + ' из ' + total);
  audio.wave();
}

export function togglePause(g) {
  if (g.screen !== 'wave') return;
  g.paused = !g.paused;
  audio.click();
}

export function toggleSpeed(g) {
  if (g.screen !== 'wave') return;
  g.speed = g.speed === 1 ? 2 : 1;
  audio.click();
}

function finishWave(g) {
  g.waveIndex += 1;
  g.projectiles = [];
  if (!g.level.endless && g.waveIndex >= g.waves.length) {
    win(g);
  } else {
    g.screen = 'planning';
    toast(g, 'Волна отбита! Расставьтесь и начните следующую');
    audio.coin();
  }
}

function win(g) {
  g.screen = 'win';
  g.paused = false;
  audio.win();
}

function lose(g) {
  g.screen = 'lose';
  g.paused = false;
  audio.lose();
}

function leak(g, z) {
  g.cityHp -= z.def.leak;
  fx.flashGate(g);
  fx.shake(g, 5, 0.3);
  fx.text(g, g.map.gate.x - 30, g.map.gate.y - 40, '−' + z.def.leak + ' ♥', { color: '#ff6b6b', size: 18 });
  audio.leak();
  if (g.cityHp <= 0) {
    g.cityHp = 0;
    lose(g);
  }
}

export function step(g, dt) {
  if (g.screen !== 'wave' || g.paused) return;
  g.time += dt;
  g.waveT += dt;

  while (g.spawnQueue.length && g.spawnQueue[0].t <= g.waveT) {
    spawnZombie(g, g.spawnQueue.shift().type);
  }

  for (const p of g.plants) if (!p.dead) p.update(g, dt);
  for (const z of g.zombies) z.update(g, dt);
  for (const pr of g.projectiles) pr.update(g, dt);

  if (g.zombies.some((z) => z.reached)) {
    const reached = g.zombies.filter((z) => z.reached);
    for (const z of reached) leak(g, z);
  }
  if (g.screen !== 'wave') return;

  for (const p of g.plants) {
    if (p.dead) g.occupancy.delete(p.key);
  }
  g.plants = g.plants.filter((p) => !p.dead);
  g.zombies = g.zombies.filter((z) => !z.dead);
  g.projectiles = g.projectiles.filter((p) => !p.dead);

  if (g.selection.mode === 'info' && g.selection.plant && g.selection.plant.dead) {
    cancelSelection(g);
  }

  if (!g.spawnQueue.length && !g.zombies.length) finishWave(g);
}

export function levelStats(g) {
  return {
    kills: g.kills,
    earned: g.earned,
    wave: g.waveIndex,
    wavesTotal: g.waves.length,
    cityHp: g.cityHp,
    endless: Boolean(g.level.endless),
  };
}
