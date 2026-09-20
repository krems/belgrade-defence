#!/usr/bin/env node
// Отладка: честный бот генератора на заданном уровне, погодовая сводка.
// Использование: node tools/debug-honest.mjs [seedN] [levelId] [mode=honest|full]
import { FIXED_DT } from '../src/balance.js';
import { createGame, step, startWave, placeAt } from '../src/state.js';
import { LEVELS } from '../src/config.js';
import { makeRoadProgress, makeSlotProgress, botStep } from './generate-levels.mjs';

const seedArg = Number(process.argv[2] ?? 0);
const levelId = process.argv[3] ?? 'ulicy';
const mode = process.argv[4] ?? 'honest';

const def = LEVELS.find((l) => l.id === levelId);

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const prevRandom = Math.random;
Math.random = mulberry32(def.seed + seedArg * 131 + 7);
const g = createGame(def, -1);
const ctx = {
  roadProgress: makeRoadProgress(def.roadWaypoints),
  slotProgress: makeSlotProgress(def.roadWaypoints, def.slotCells),
  lastLeaks: 0,
};
if (mode === 'full') {
  g.coins = 1e9;
  const hasFlyers = def.waves.some((w) => w.some((e) => e.type === 'flyer'));
  let i = 0;
  for (const [c, r] of def.slotCells) {
    placeAt(g, c, r, hasFlyers && i % 3 === 1 ? 'aa' : i % 3 === 2 ? 'frost' : 'pea');
    i++;
  }
}
let hpBefore = g.cityHp;
let guard = 0;
const events = [];
const traceBoss = process.argv.includes('--boss');
const bossTrace = [];
while (g.screen !== 'win' && g.screen !== 'lose' && guard++ < 300000) {
  if (g.screen === 'planning') {
    const leaked = hpBefore - g.cityHp;
    hpBefore = g.cityHp;
    ctx.lastLeaks = leaked;
    if (mode === 'honest') {
      for (let k = 0; k < 30 && botStep(g, ctx); k++);
    }
    const roster = {};
    for (const p of g.plants) if (!p.dead) roster[p.type] = (roster[p.type] ?? 0) + 1;
    events.push(`волна ${g.waveIndex + 1}: утечек ${leaked}, монет ${g.coins}, ростер ${JSON.stringify(roster)}`);
    startWave(g);
  } else {
    step(g, FIXED_DT);
    const boss = g.zombies.find((z) => z.type === 'boss' && z.state !== 'die');
    if (boss) {
      const prog = boss.dist / g.map.totalLength;
      if (!bossTrace.length || prog - bossTrace[bossTrace.length - 1][0] > 0.01) {
        bossTrace.push([prog, boss.hp]);
      }
    }
  }
}
console.log('итог:', g.screen, 'cityHp:', g.cityHp, 'волна:', g.waveIndex + 1, 'убито:', g.kills, 'заработано:', g.earned);
for (const e of events) console.log(' ', e);
if (traceBoss) {
  console.log('босс: HP по прогрессу пути:');
  let prevBucket = -1;
  for (const [prog, hp] of bossTrace) {
    const bucket = Math.round(prog * 20) / 20;
    if (bucket !== prevBucket) {
      console.log(`  ${(bucket * 100).toFixed(0)}%: ${Math.max(0, Math.round(hp))}`);
      prevBucket = bucket;
    }
  }
}
Math.random = prevRandom;
