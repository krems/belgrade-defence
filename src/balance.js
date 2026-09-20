export const GRID = Object.freeze({ cols: 13, rows: 9, cell: 64 });
export const CANVAS_W = GRID.cols * GRID.cell;
export const CANVAS_H = GRID.rows * GRID.cell;

export const ECONOMY = Object.freeze({ sellRefund: 0.5 });

// Порядок = порядок разблокировки по уровням; горячие клавиши 1..8.
export const PLANT_KEYS = Object.freeze(['pea', 'nut', 'frost', 'cactus', 'mortar', 'trap', 'coin', 'aa']);

export const PLANTS = Object.freeze({
  pea: {
    key: 'pea', name: 'Горохострел', icon: '🌱', cost: 50, hp: 120, onRoad: false,
    dmg: 10, rate: 1, range: 3,
    desc: 'Стреляет горохом в ближайшего зомби (10 урона, 1 выстрел/с, радиус 3 клетки).',
  },
  nut: {
    key: 'nut', name: 'Орех', icon: '🥜', cost: 50, hp: 300, onRoad: true,
    desc: 'Ставится на дорогу. Зомби останавливаются и грызут его (25 урона/с), пока он не разрушится.',
  },
  frost: {
    key: 'frost', name: 'Морозник', icon: '❄️', cost: 75, hp: 120, onRoad: false,
    range: 2.5, slow: 0.4, slowDuration: 0.9, dps: 2,
    desc: 'Аура 2.5 клетки: замедляет на 40% и наносит 2 урона/с всем наземным врагам внутри.',
  },
  cactus: {
    key: 'cactus', name: 'Кактус-ловушка', icon: '🌵', cost: 40, hp: 150, onRoad: true,
    dps: 8,
    desc: 'Только на дорогу: 8 урона/с каждому проходящему по земле. Изнашивается (150 HP) по мере работы.',
  },
  mortar: {
    key: 'mortar', name: 'Мортирка', icon: '🌽', cost: 125, hp: 120, onRoad: false,
    dmg: 25, splash: 1.2, cooldown: 3, rangeMin: 2, rangeMax: 6,
    desc: 'Навесной обстрел: 25 урона по площади (радиус 1.2), перезарядка 3 с. Мёртвая зона 2 клетки, дальность 6. По летающим не попадает.',
  },
  trap: {
    key: 'trap', name: 'Липучка', icon: '🕸️', cost: 60, hp: 200, onRoad: true,
    dps: 6, slow: 0.45, slowDuration: 0.5,
    desc: 'Только на дорогу: замедляет проходящих на 45% и наносит 6 урона/с. Изнашивается (200 HP). Летающие пролетают сверху.',
  },
  coin: {
    key: 'coin', name: 'Монетник', icon: '💰', cost: 100, hp: 120, onRoad: false,
    income: 25, every: 10,
    desc: 'Экономика: каждые 10 с выдаёт +25 монет. Урона не наносит.',
  },
  aa: {
    key: 'aa', name: 'Зенитник', icon: '🌾', cost: 100, hp: 120, onRoad: false,
    dmg: 5, rate: 3, range: 3.5, antiAir: true,
    desc: 'Скорострельная зенитка: 3 выстрела/с по 5 урона, радиус 3.5. Сбивает ТОЛЬКО летающих зомби.',
  },
});

export const ZOMBIE_KEYS = Object.freeze(['normal', 'runner', 'armored', 'flyer', 'boss']);

export const ZOMBIES = Object.freeze({
  normal: { key: 'normal', name: 'Зомби', hp: 100, speed: 0.5, reward: 10, radius: 13, leak: 1 },
  runner: { key: 'runner', name: 'Бегун', hp: 60, speed: 1.2, reward: 15, radius: 10, leak: 1 },
  armored: { key: 'armored', name: 'Броневик', hp: 400, speed: 0.3, reward: 40, radius: 15, leak: 1 },
  flyer: { key: 'flyer', name: 'Летун', hp: 80, speed: 0.65, reward: 20, radius: 12, leak: 1, flying: true },
  boss: { key: 'boss', name: 'БОСС', hp: 5000, speed: 0.25, reward: 200, radius: 22, leak: 5, slowResist: 0.2 },
});

export const WAVE_BONUS = 75;

export const CHEW_DPS = 25;
export const BULLET_SPEED = 420;
export const SHELL_FLIGHT = 0.6;
export const FIXED_DT = 1 / 60;
