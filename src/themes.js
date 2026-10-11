// Визуальные темы уровней: графика подгоняется под название уровня.
// Темы чисто визуальные — баланс, волны и геометрия не зависят от них.

const DEFAULT_THEME = {
  stage: '#7aa74f',
  field: 'grass', // grass | water | pavement | cobble
  ground: '#7aa74f',
  checker: 'rgba(255,255,255,0.045)',
  patches: ['rgba(70,110,45,0.12)', 'rgba(190,225,130,0.10)'],
  overlay: null,
  road: {
    style: 'dirt', // dirt | sand | asphalt | stone | planks
    edge: '#6d4f33',
    mid: '#b08a5a',
    center: '#c4a06e',
    pebble: '122,88,56',
    mark: '#e8e6df',
    seam: 'rgba(40,30,18,0.35)',
  },
  slot: {
    style: 'circle', // circle | patch
    fill: '#8a6a42',
    edge: '#6d4f33',
    furrow: 'rgba(109,79,51,0.7)',
  },
  decor: {
    density: 0.42, // шанс пропустить клетку
    weights: { bush: 3, rock: 2, tuft: 3 },
    bush: ['#5d8a3f', '#6e9c4a'],
    bushLight: 'rgba(255,255,255,0.15)',
    rock: '#9aa0a6',
    tuft: '#4c7a2a',
    tree: { trunk: '#6b4a2c', canopy: ['#4f7f36', '#619648'], light: 'rgba(255,255,255,0.14)' },
    flower: ['#e58ab4', '#e5d15c', '#f2f2f2', '#d9634f'],
    flowerCore: '#f5d76a',
    reed: ['#7c8f4a', '#9aa05f'],
    reedTip: '#7a5230',
    lilypad: '#4f8f4a',
    lamp: { post: '#3d4147', glow: '#ffe28c', halo: 'rgba(255,220,120,0.25)' },
    hydrant: '#c94f3d',
    planter: { box: '#7a5a38', shrub: '#5d8a3f' },
    barrel: { body: '#8a5f34', band: '#4a3620' },
    banner: { pole: '#5c4326', colors: ['#c8402f', '#3d5fa8'] },
  },
  graves: true,
  graveReplace: null, // 'fountain' | 'kiosk' | null
  city: {
    wall: '#8f98a3',
    wallLine: '#6f7883',
    tower: '#7d8794',
    roof: '#a34a3f',
    flag: '#e5484d',
    flagAlt: '#3d5fa8',
    flagPole: '#5c4326',
    gate: '#5c4026',
    gateLine: '#4a3018',
    towers: 2,
    extraFlags: 0,
  },
};

const OVERRIDES = {
  // Окраина — дикая желтоватая трава, деревенская грунтовка
  okraina: {
    stage: '#86a348',
    ground: '#86a348',
    patches: ['rgba(150,150,60,0.13)', 'rgba(215,215,120,0.10)'],
    decor: { weights: { bush: 3, rock: 2, tuft: 4 }, tuft: '#557f2d' },
  },

  // Мост — река и деревянный мост с перилами, камыши и кувшинки
  most: {
    stage: '#41809f',
    field: 'water',
    ground: '#41809f',
    checker: null,
    patches: ['rgba(20,60,95,0.18)', 'rgba(130,190,220,0.10)'],
    road: {
      style: 'planks',
      edge: '#4a3620',
      mid: '#7a5a33',
      center: '#8f6b3d',
    },
    slot: {
      fill: '#c0a878',
      edge: '#8a744c',
      furrow: 'rgba(122,100,60,0.55)',
    },
    decor: {
      density: 0.3,
      weights: { reed: 3, lilypad: 3 },
    },
    graves: false,
  },

  // Парк — ухоженный газон, песчаные дорожки, деревья и клумбы, фонтан
  park: {
    stage: '#5f9e3e',
    field: 'grass',
    ground: '#5f9e3e',
    checker: 'rgba(255,255,255,0.05)',
    patches: ['rgba(40,90,30,0.14)', 'rgba(160,210,110,0.12)'],
    road: {
      style: 'sand',
      edge: '#a08656',
      mid: '#cbb07a',
      center: '#d9c48c',
      pebble: '150,120,70',
    },
    slot: {
      fill: '#6b4f33',
      edge: '#54402a',
      furrow: 'rgba(60,45,28,0.7)',
    },
    decor: {
      density: 0.38,
      weights: { tree: 2, flower: 4, bush: 2 },
    },
    graves: false,
    graveReplace: 'fountain',
  },

  // Улицы — тротуарная плитка, асфальт с разметкой, фонари и гидранты
  ulicy: {
    stage: '#9aa0a6',
    field: 'pavement',
    ground: '#9aa0a6',
    checker: null,
    patches: ['rgba(70,75,82,0.12)', 'rgba(235,238,240,0.10)'],
    road: {
      style: 'asphalt',
      edge: '#33373c',
      mid: '#4a4e54',
      center: '#565b62',
      pebble: '190,190,195',
    },
    slot: {
      style: 'patch',
      fill: '#3f444b',
      edge: '#2e3238',
      furrow: 'rgba(230,230,220,0.25)',
    },
    decor: {
      density: 0.4,
      weights: { lamp: 2, hydrant: 1, tree: 2, planter: 2 },
    },
    graves: false,
    graveReplace: 'kiosk',
  },

  // Ворота Белграда — сумрачная брусчатка, каменная мостовая, бочки и знамёна, крепость
  'vorota-belgrada': {
    stage: '#6f7364',
    field: 'cobble',
    ground: '#75796a',
    checker: null,
    patches: ['rgba(45,48,40,0.16)', 'rgba(200,205,185,0.08)'],
    overlay: ['rgba(60,60,120,0.16)', 'rgba(20,20,50,0.05)'],
    road: {
      style: 'stone',
      edge: '#55503f',
      mid: '#8a8272',
      center: '#98907e',
      pebble: '70,66,52',
      seam: 'rgba(40,36,26,0.35)',
    },
    slot: {
      fill: '#7b7466',
      edge: '#55503f',
      furrow: 'rgba(60,56,42,0.7)',
    },
    decor: {
      density: 0.45,
      weights: { barrel: 2, banner: 2, rock: 2 },
    },
    graves: true,
    city: { towers: 3, extraFlags: 2 },
  },

  // Endless — закат: тёплая сумеречная трава, камень, знамёна
  endless: {
    stage: '#71893c',
    field: 'grass',
    ground: '#71893c',
    checker: 'rgba(255,255,255,0.04)',
    patches: ['rgba(120,90,30,0.14)', 'rgba(230,190,110,0.10)'],
    overlay: ['rgba(255,150,70,0.14)', 'rgba(80,40,90,0.08)'],
    road: {
      style: 'stone',
      edge: '#4f4636',
      mid: '#7e7360',
      center: '#8d826c',
      pebble: '60,52,38',
      seam: 'rgba(35,30,20,0.3)',
    },
    slot: {
      fill: '#75603e',
      edge: '#544630',
      furrow: 'rgba(70,58,38,0.7)',
    },
    decor: {
      density: 0.42,
      weights: { bush: 2, tuft: 3, banner: 1, rock: 1 },
    },
    graves: true,
    city: { towers: 3, extraFlags: 2 },
  },
};

function mergeTheme(base, over) {
  const out = { ...base };
  for (const k of Object.keys(over)) {
    const b = base[k];
    const v = over[k];
    // weights — распределение видов декора, заменяется целиком
    out[k] = b && v && typeof b === 'object' && typeof v === 'object' && !Array.isArray(b) && !Array.isArray(v) && k !== 'weights'
      ? mergeTheme(b, v)
      : v;
  }
  return out;
}

export function getTheme(level) {
  const over = level ? OVERRIDES[level.id] : null;
  return over ? mergeTheme(DEFAULT_THEME, over) : DEFAULT_THEME;
}
