export const GRID = Object.freeze({ cols: 13, rows: 9, cell: 64 });
export const CANVAS_W = GRID.cols * GRID.cell;
export const CANVAS_H = GRID.rows * GRID.cell;

export const ECONOMY = Object.freeze({ sellRefund: 0.5 });

export const PLANT_KEYS = Object.freeze(['pea', 'frost', 'mortar', 'nut', 'cactus', 'coin']);

export const PLANTS = Object.freeze({
  pea: {
    key: 'pea', name: 'Горохострел', icon: '🌱', cost: 50, hp: 120, onRoad: false,
    dmg: 10, rate: 1, range: 3,
    desc: 'Стреляет горохом в ближайшего зомби (10 урона, 1 выстрел/с, радиус 3 клетки).',
  },
  frost: {
    key: 'frost', name: 'Морозник', icon: '❄️', cost: 75, hp: 120, onRoad: false,
    range: 2.5, slow: 0.4, slowDuration: 0.9, dps: 2,
    desc: 'Аура 2.5 клетки: замедляет на 40% и наносит 2 урона/с всем врагам внутри.',
  },
  mortar: {
    key: 'mortar', name: 'Мортирка', icon: '🌽', cost: 125, hp: 120, onRoad: false,
    dmg: 25, splash: 1.2, cooldown: 3, rangeMin: 2, rangeMax: 6,
    desc: 'Навесной обстрел: 25 урона по площади (радиус 1.2), перезарядка 3 с. Мёртвая зона 2 клетки, дальность 6.',
  },
  nut: {
    key: 'nut', name: 'Орех', icon: '🥜', cost: 50, hp: 300, onRoad: true,
    desc: 'Ставится на дорогу. Зомби останавливаются и грызут его (25 урона/с), пока он не разрушится.',
  },
  cactus: {
    key: 'cactus', name: 'Кактус-ловушка', icon: '🌵', cost: 40, hp: 150, onRoad: true,
    dps: 8,
    desc: 'Только на дорогу: 8 урона/с каждому проходящему. Изнашивается (150 HP) по мере работы.',
  },
  coin: {
    key: 'coin', name: 'Монетник', icon: '💰', cost: 100, hp: 120, onRoad: false,
    income: 25, every: 10,
    desc: 'Экономика: каждые 10 с выдаёт +25 монет. Урона не наносит.',
  },
});

export const ZOMBIE_KEYS = Object.freeze(['normal', 'runner', 'armored', 'boss']);

export const ZOMBIES = Object.freeze({
  normal: { key: 'normal', name: 'Зомби', hp: 100, speed: 0.5, reward: 10, radius: 13, leak: 1 },
  runner: { key: 'runner', name: 'Бегун', hp: 60, speed: 1.2, reward: 15, radius: 10, leak: 1 },
  armored: { key: 'armored', name: 'Броневик', hp: 400, speed: 0.3, reward: 40, radius: 15, leak: 1 },
  boss: { key: 'boss', name: 'БОСС', hp: 2000, speed: 0.25, reward: 200, radius: 22, leak: 5, slowResist: 0.2 },
});

export const CHEW_DPS = 25;
export const BULLET_SPEED = 420;
export const SHELL_FLIGHT = 0.6;
export const FIXED_DT = 1 / 60;
