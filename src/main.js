import { CANVAS_W, CANVAS_H, FIXED_DT, PLANT_KEYS } from './balance.js';
import { LEVELS } from './config.js';
import { fx } from './fx.js';
import {
  createGame, step, startWave, togglePause, toggleSpeed,
  selectPlant, selectShovel, cancelSelection, placeAt, digAt, selectInfo,
} from './state.js';
import { render, syncBackground } from './render.js';
import { audio } from './audio.js';
import { initHud, updateHud, showTooltip, hideTooltip } from './ui/hud.js';
import { initShop, updateShop } from './ui/shop.js';
import { initScreens, showLevelSelect, showPause, showEnd, hideOverlay, flushToasts, toast } from './ui/screens.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const EMPTY_REC = { completed: false, bestWave: 0, bestKills: 0 };

let g = createGame(LEVELS[0], 0);
let progress = { levels: {}, updatedAt: null };
let endShown = false;
let saveFailedShown = false;

const levelRec = (id) => (progress.levels && progress.levels[id]) || EMPTY_REC;

function toLogic(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((e.clientX - rect.left) / rect.width) * CANVAS_W,
    y: ((e.clientY - rect.top) / rect.height) * CANVAS_H,
  };
}

async function loadProgress() {
  try {
    const res = await fetch('/api/progress');
    if (res.ok) {
      const data = await res.json();
      progress = {
        levels: data.levels && typeof data.levels === 'object' ? { ...data.levels } : {},
        updatedAt: data.updatedAt ?? null,
      };
    }
  } catch {
    saveFailedShown = true;
  }
}

function mergeProgress() {
  const id = g.level.id;
  const cleared = g.screen === 'win' ? g.waves.length : g.waveIndex;
  const prev = levelRec(id);
  progress = {
    levels: {
      ...progress.levels,
      [id]: {
        completed: prev.completed || (g.screen === 'win' && !g.level.endless),
        bestWave: Math.max(prev.bestWave, cleared),
        bestKills: Math.max(prev.bestKills, g.kills),
      },
    },
    updatedAt: new Date().toISOString(),
  };
}

async function persistProgress() {
  try {
    const res = await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(progress),
    });
    if (!res.ok) throw new Error('status ' + res.status);
  } catch {
    if (!saveFailedShown) {
      saveFailedShown = true;
      toast('Прогресс не сохранён — сервер недоступен');
    }
  }
}

const controls = {
  startWave: () => startWave(g),
  togglePause: () => {
    togglePause(g);
    if (g.paused && g.screen === 'wave') showPause();
    else hideOverlay();
  },
  toggleSpeed: () => toggleSpeed(g),
  toggleMute: () => {
    audio.setMuted(!audio.isMuted());
    g.muted = audio.isMuted();
  },
  toMenu: () => exitToMenu(),
  resume: () => controls.togglePause(),
  restart: () => startLevel(g.levelIndex),
  exit: () => exitToMenu(),
  selectPlant: (type) => selectPlant(g, type),
  selectShovel: () => selectShovel(g),
};

const screensApi = {
  selectLevel: (i) => startLevel(i),
  next: () => startLevel(Math.min(g.levelIndex + 1, LEVELS.length - 1)),
  resume: () => controls.togglePause(),
  restart: () => startLevel(g.levelIndex),
  exit: () => exitToMenu(),
};

function startLevel(index) {
  g = createGame(LEVELS[index], index);
  endShown = false;
  syncBackground(canvas, g.map);
  hideOverlay();
  hideTooltip();
  flushToasts(g);
}

async function exitToMenu() {
  if (g.screen === 'wave' || g.screen === 'planning') {
    mergeProgress();
    await persistProgress();
  }
  g.screen = 'menu';
  g.paused = false;
  endShown = false;
  cancelSelection(g);
  hideTooltip();
  hideOverlay();
  showLevelSelect(progress);
}

function endScreen() {
  const win = g.screen === 'win';
  mergeProgress();
  endShown = true;
  const hasNext = win && !g.level.endless && g.levelIndex + 1 < LEVELS.length;
  showEnd(win, {
    kills: g.kills,
    earned: g.earned,
    wave: g.waveIndex,
    wavesTotal: g.waves.length,
    cityHp: g.cityHp,
    endless: Boolean(g.level.endless),
    levelId: g.level.id,
    levelName: g.level.name,
    hasNext,
  }, progress);
  persistProgress();
}

function plantTooltip(plant) {
  const def = plant.def;
  const lines = [`<b>${def.icon} ${def.name}</b>`];
  if (plant.type === 'nut' || plant.type === 'cactus') lines.push(`<div class="tip-line">Прочность: ${Math.ceil(plant.hp)} / ${plant.maxHp}</div>`);
  if (def.dmg && def.rate) lines.push(`<div class="tip-line">Урон ${def.dmg} · ${def.rate}/с · радиус ${def.range}</div>`);
  if (def.dps && def.slow) lines.push(`<div class="tip-line">Аура ${def.range}: замедление −40% и ${def.dps} урона/с</div>`);
  if (def.splash) lines.push(`<div class="tip-line">Сплеш ${def.dmg} · зона ${def.splash} · КД ${def.cooldown} с</div>`);
  if (def.income) lines.push(`<div class="tip-line">+${def.income} 🪙 каждые ${def.every} с</div>`);
  lines.push(`<div class="tip-line">Лопата вернёт ${Math.floor(def.cost * 0.5)} 🪙</div>`);
  return lines.join('');
}

function canvasClick(e) {
  audio.unlock();
  if (g.screen !== 'planning' && g.screen !== 'wave') return;
  const p = toLogic(e);
  const cell = g.map.cellAt(p.x, p.y);
  if (!cell) return;
  const { selection } = g;
  if (selection.mode === 'plant') {
    placeAt(g, cell.c, cell.r);
    return;
  }
  if (selection.mode === 'shovel') {
    digAt(g, cell.c, cell.r);
    return;
  }
  const plant = g.occupancy.get(cell.c + ',' + cell.r);
  if (plant && !plant.dead) {
    selectInfo(g, plant);
    showTooltip(plantTooltip(plant), e.clientX, e.clientY);
  } else {
    cancelSelection(g);
    hideTooltip();
  }
}

function setupInput() {
  canvas.addEventListener('mousemove', (e) => {
    const p = toLogic(e);
    g.mouse.x = p.x;
    g.mouse.y = p.y;
    g.mouse.inside = true;
    g.hover = g.map.cellAt(p.x, p.y);
    if (g.selection.mode === 'info' && g.selection.plant) {
      showTooltip(plantTooltip(g.selection.plant), e.clientX, e.clientY);
    }
  });
  canvas.addEventListener('mouseleave', () => {
    g.mouse.inside = false;
    g.hover = null;
    if (g.selection.mode !== 'info') hideTooltip();
  });
  canvas.addEventListener('click', canvasClick);
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (g.selection.mode) {
      cancelSelection(g);
      hideTooltip();
    }
  });
  window.addEventListener('keydown', (e) => {
    audio.unlock();
    const k = e.key.toLowerCase();
    if (k >= '1' && k <= '6') {
      const type = PLANT_KEYS[Number(k) - 1];
      if (type) selectPlant(g, type);
    } else if (k === 's' || k === '0') {
      selectShovel(g);
    } else if (k === 'escape') {
      if (g.selection.mode) {
        cancelSelection(g);
        hideTooltip();
      } else if (g.screen === 'wave') {
        controls.togglePause();
      }
    } else if (k === 'p' || k === ' ') {
      if (g.screen === 'wave') {
        e.preventDefault();
        controls.togglePause();
      }
    } else if (k === 'm') {
      controls.toggleMute();
    } else if (k === 'enter' && g.screen === 'planning') {
      startWave(g);
    }
  });
  window.addEventListener('blur', () => {
    if (g.screen === 'wave' && !g.paused) {
      g.paused = true;
      showPause();
    }
  });
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
  const cssW = canvas.clientWidth || CANVAS_W;
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssW * dpr * CANVAS_H / CANVAS_W);
  ctx.setTransform(canvas.width / CANVAS_W, 0, 0, canvas.height / CANVAS_H, 0, 0);
  syncBackground(canvas, g.map);
}

let last = performance.now();
let acc = 0;

function frame(now) {
  const frameDt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (g.screen === 'wave' && !g.paused) {
    acc += frameDt * g.speed;
    let guard = 0;
    while (acc >= FIXED_DT && guard < 20) {
      acc -= FIXED_DT;
      step(g, FIXED_DT);
      guard++;
      if (g.screen !== 'wave') { acc = 0; break; }
    }
  } else {
    acc = 0;
  }
  if (!(g.screen === 'wave' && g.paused)) fx.update(g, frameDt);
  flushToasts(g);
  if (g.selection.mode === 'info' && g.selection.plant?.dead) {
    cancelSelection(g);
    hideTooltip();
  }
  render(ctx, g, now / 1000);
  updateHud(g);
  updateShop(g);
  if ((g.screen === 'win' || g.screen === 'lose') && !endShown) endScreen();
  requestAnimationFrame(frame);
}

async function boot() {
  initHud(controls);
  initShop(controls);
  initScreens(screensApi);
  setupInput();
  window.addEventListener('resize', resize);
  resize();
  await loadProgress();
  g.screen = 'menu';
  showLevelSelect(progress);
  requestAnimationFrame(frame);
}

boot();
