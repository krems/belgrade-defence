import { LEVELS } from '../config.js';
import { PLANTS } from '../balance.js';

let onActions = null;

export function initScreens(actions) {
  onActions = actions;
}

function overlay() {
  return document.getElementById('overlay');
}

function card() {
  return document.getElementById('overlay-card');
}

export function hideOverlay() {
  overlay().hidden = true;
}

export function toast(msg) {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(() => {
    el.classList.add('out');
    setTimeout(() => el.remove(), 350);
  }, 2200);
}

const EMPTY_REC = { completed: false, bestWave: 0, bestKills: 0 };

function levelRec(progress, id) {
  return (progress.levels && progress.levels[id]) || EMPTY_REC;
}

function isUnlocked(progress, i) {
  if (levelRec(progress, LEVELS[i].id).completed) return true;
  return i === 0 || levelRec(progress, LEVELS[i - 1].id).completed;
}

function levelCardHtml(progress, level, i) {
  const rec = levelRec(progress, level.id);
  const unlocked = isUnlocked(progress, i);
  const icons = level.unlockedPlants.map((t) => PLANTS[t].icon).join('');
  const total = level.endless ? '∞' : level.waves.length;
  const cls = ['level-card'];
  if (rec.completed && !level.endless) cls.push('done');
  if (!unlocked) cls.push('locked');
  const mark = !unlocked ? '🔒' : rec.completed && !level.endless ? '✓' : '▶';
  const best = unlocked && (rec.bestWave > 0 || rec.completed)
    ? `<div class="lvl-best">Рекорд: волна ${rec.bestWave}/${total} · убито ${rec.bestKills}</div>`
    : '';
  return `
    <button class="${cls.join(' ')}" data-i="${i}" ${unlocked ? '' : 'disabled'}>
      <div class="lvl-head">
        <span class="lvl-num">${level.endless ? '∞' : i + 1}</span>
        <span class="lvl-name">${level.name}</span>
        <span class="lvl-mark">${mark}</span>
      </div>
      <div class="lvl-meta">${level.blurb}</div>
      <div class="lvl-tags">${total} волн · ${icons}</div>
      ${best}
    </button>
  `;
}

export function showLevelSelect(progress) {
  const el = card();
  const done = LEVELS.filter((l) => !l.endless && levelRec(progress, l.id).completed).length;
  el.innerHTML = `
    <h1>Belgrade Defence</h1>
    <p class="subtitle">Оборони Белград — выбирай уровень${done ? ` · пройдено ${done}/${LEVELS.length - 1}` : ''}</p>
    <div class="level-list">
      ${LEVELS.map((level, i) => levelCardHtml(progress, level, i)).join('')}
    </div>
    <div class="howto">
      <div>🌱 Ставь растения на полянки, 🥜 орехи и 🌵 кактусы — на дорогу</div>
      <div>💰 За убийства дают монеты, монетник приносит доход</div>
      <div>🪏 Лопата выкапывает растение и возвращает 50% цены</div>
      <div>⚔️ Пройди уровень, чтобы открыть следующий</div>
    </div>
  `;
  overlay().hidden = false;
  for (const btn of el.querySelectorAll('.level-card:not(.locked)')) {
    btn.addEventListener('click', () => onActions.selectLevel(Number(btn.dataset.i)));
  }
}

export function showPause() {
  const el = card();
  el.innerHTML = `
    <h2>Пауза</h2>
    <div class="menu-buttons">
      <button id="btn-resume" class="btn primary">▶ Продолжить</button>
      <button id="btn-restart" class="btn">⟲ Начать заново</button>
      <button id="btn-exit" class="btn">☰ В меню</button>
    </div>
  `;
  overlay().hidden = false;
  document.getElementById('btn-resume').addEventListener('click', onActions.resume);
  document.getElementById('btn-restart').addEventListener('click', onActions.restart);
  document.getElementById('btn-exit').addEventListener('click', onActions.exit);
}

export function showEnd(win, stats, progress) {
  const el = card();
  const total = stats.endless ? '∞' : stats.wavesTotal;
  const title = win ? '🏆 Победа!' : stats.endless ? '💀 Город пал' : '💀 Поражение';
  const sub = win
    ? `«${stats.levelName}» — все ${stats.wavesTotal} волн отбиты!`
    : stats.endless
      ? `Ты продержался до волны ${stats.wave + 1}…`
      : `Зомби прорвались в город на волне ${stats.wave + 1}…`;
  const rec = (progress.levels && progress.levels[stats.levelId]) || EMPTY_REC;
  const badge = rec.completed && !stats.endless ? '<span class="badge">✓ уровень пройден</span>' : '';
  const buttons = [
    win && stats.hasNext ? '<button id="btn-next" class="btn primary">▶ Следующий уровень</button>' : '',
    '<button id="btn-restart" class="btn primary">⟲ Играть снова</button>',
    '<button id="btn-exit" class="btn">☰ В меню</button>',
  ].join('');
  el.innerHTML = `
    <h2>${title}</h2>
    <p class="subtitle">${sub}</p>
    <div class="stats">
      <div><span>Убито зомби</span><b>${stats.kills}</b></div>
      <div><span>Заработано</span><b>${stats.earned} 🪙</b></div>
      <div><span>Волна</span><b>${win ? total : stats.wave + 1} / ${total}</b></div>
      <div><span>HP города</span><b>${stats.cityHp} ♥</b></div>
    </div>
    <div class="progress-block">${badge}</div>
    <div class="menu-buttons">${buttons}</div>
  `;
  overlay().hidden = false;
  if (win && stats.hasNext) document.getElementById('btn-next').addEventListener('click', onActions.next);
  document.getElementById('btn-restart').addEventListener('click', onActions.restart);
  document.getElementById('btn-exit').addEventListener('click', onActions.exit);
}

export function flushToasts(g) {
  while (g.toasts.length) toast(g.toasts.shift());
}
