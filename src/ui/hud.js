let refs = null;
let cached = { coins: -1, wave: '', hearts: -1, paused: null, speed: null, muted: null, screen: '' };

export function initHud(controls) {
  refs = {
    coins: document.getElementById('coins'),
    wave: document.getElementById('wave'),
    hearts: document.getElementById('stat-hearts'),
    start: document.getElementById('btn-start'),
    pause: document.getElementById('btn-pause'),
    speed: document.getElementById('btn-speed'),
    mute: document.getElementById('btn-mute'),
    menu: document.getElementById('btn-menu'),
  };
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('span');
    s.className = 'heart';
    s.textContent = '♥';
    refs.hearts.appendChild(s);
  }
  refs.start.addEventListener('click', controls.startWave);
  refs.pause.addEventListener('click', controls.togglePause);
  refs.speed.addEventListener('click', controls.toggleSpeed);
  refs.mute.addEventListener('click', controls.toggleMute);
  refs.menu.addEventListener('click', controls.toMenu);
}

export function updateHud(g) {
  if (!refs) return;
  if (g.coins !== cached.coins) {
    refs.coins.textContent = g.coins;
    if (cached.coins >= 0 && g.coins > cached.coins) {
      refs.coins.classList.remove('pop');
      void refs.coins.offsetWidth;
      refs.coins.classList.add('pop');
    }
    cached.coins = g.coins;
  }
  const total = g.spawnQueue.length + g.zombies.filter((z) => z.state !== 'die').length;
  const waveTotal = g.level.endless ? '∞' : g.waves.length;
  let waveText;
  if (g.screen === 'menu') waveText = '—';
  else if (g.screen === 'win') waveText = `${waveTotal}/${waveTotal} ✓`;
  else if (g.screen === 'lose') waveText = `${g.waveIndex + 1}/${waveTotal}`;
  else if (g.screen === 'wave') waveText = `${g.waveIndex + 1}/${waveTotal} · осталось ${total}`;
  else waveText = `${Math.min(g.waveIndex + 1, g.waves.length)}/${waveTotal}`;
  if (waveText !== cached.wave) {
    refs.wave.textContent = waveText;
    cached.wave = waveText;
  }
  const hp = Math.max(0, g.cityHp);
  if (hp !== cached.hearts) {
    [...refs.hearts.children].forEach((el, i) => el.classList.toggle('lost', i >= hp));
    cached.hearts = hp;
  }
  const inPlanning = g.screen === 'planning';
  refs.start.disabled = !inPlanning;
  refs.start.style.display = inPlanning ? '' : 'none';
  refs.pause.disabled = g.screen !== 'wave';
  const pausedKey = g.screen === 'wave' && g.paused;
  if (pausedKey !== cached.paused) {
    refs.pause.textContent = pausedKey ? '▶' : '⏸';
    cached.paused = pausedKey;
  }
  refs.speed.disabled = g.screen !== 'wave';
  if (g.speed !== cached.speed) {
    refs.speed.textContent = 'x' + g.speed;
    refs.speed.classList.toggle('active', g.speed === 2);
    cached.speed = g.speed;
  }
  if (g.muted !== cached.muted) {
    refs.mute.textContent = g.muted ? '🔇' : '🔊';
    cached.muted = g.muted;
  }
  if (g.screen !== cached.screen) {
    document.body.dataset.screen = g.screen;
    cached.screen = g.screen;
  }
}

export function showTooltip(html, x, y) {
  const el = document.getElementById('tooltip');
  el.innerHTML = html;
  el.hidden = false;
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  let left = x + 14;
  let top = y + 14;
  if (left + w > window.innerWidth - 8) left = x - w - 12;
  if (top + h > window.innerHeight - 8) top = y - h - 12;
  el.style.left = Math.max(4, left) + 'px';
  el.style.top = Math.max(4, top) + 'px';
}

export function hideTooltip() {
  const el = document.getElementById('tooltip');
  el.hidden = true;
}
