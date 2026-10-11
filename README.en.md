# Belgrade Defence

🇷🇺 [Русская версия](README.md) · 🇬🇧 English

A browser **wave-based tower defense** in the spirit of "Plants vs. Zombies": zombies march down a winding road toward Belgrade, and you defend the city with plants. Everything runs locally, no network and no dependencies — **vanilla JS (ES modules) + Canvas 2D + DOM**.

- **6 levels**: 5 story levels ("Outskirts", "Bridge", "Park", "Streets", "Belgrade Gates") plus an endless **Endless** mode.
- **8 plants** unlocked gradually: peashooter, wall-nut, frost plant, cactus trap, mortar, sticky web, coin plant, AA gun.
- **5 zombie types**: normal, runner, armored, flyer and a 5000 HP boss.
- Waves, economy, a shovel that refunds 50%, and per-level progress.

## Screenshots

| Level select | Combat |
| :---: | :---: |
| ![Menu](docs/screenshots/01-menu.png) | ![Combat](docs/screenshots/04-action.png) |

| Placing plants | A wave |
| :---: | :---: |
| ![Planning](docs/screenshots/02-planning.png) | ![Wave](docs/screenshots/03-wave.png) |

## Play without installing anything

Download **`belgrade-defence.html`** from [**Releases → Latest**](https://github.com/krems/belgrade-defence/releases/latest) and open it by double-clicking it in your browser.

That single file is the whole game: no Node.js, no npm, no console required. Progress is not saved in this version (there is no server) — run it from source below to keep progress.

## Run from source

You only need [Node.js](https://nodejs.org/) 18+ (for the built-in mini-server). There are no dependencies.

```bash
git clone https://github.com/krems/belgrade-defence.git
cd belgrade-defence
npm start          # → http://localhost:8000
```

Or without npm:

```bash
node server.js     # → http://localhost:8000
```

Open <http://localhost:8000>. Progress is stored in `data/progress.json` through `GET/POST /api/progress`.

## Build the single-file HTML

Bundles the whole game into one self-contained file `dist/belgrade-defence.html` (the same release artifact):

```bash
npm install
npm run build
```

## Controls

| Action | Key / button |
| --- | --- |
| Select a plant | `1`–`8` or click a card at the bottom |
| Shovel (dig up, refund 50%) | `S` or `0` |
| Place / dig | click a cell |
| Cancel tool | `Esc` or right click |
| Start a wave | `Enter` or the "Начать волну" button |
| Pause | `P` / `Space` |
| Speed x1/x2 | the `x1` button in the HUD |
| Sound | `M` |

Plants go on "plots"; **wall-nut, cactus and sticky web** can only be placed on the road. Flying zombies can be shot down **only by the AA gun**.

## Plants

| Icon | Plant | Cost | Role |
| --- | --- | --- | --- |
| 🌱 | Peashooter | 50 | shoots the nearest zombie (10 dmg, 1/s, range 3) |
| 🥜 | Wall-nut | 50 | on the road, 300 HP, zombies chew on it |
| ❄️ | Frost plant | 75 | aura: −40% speed and 2 dmg/s |
| 🌵 | Cactus trap | 40 | on the road, 8 dmg/s to passers-by |
| 🌽 | Mortar | 125 | lobbed splash, 25 damage in an area |
| 🕸️ | Sticky web | 60 | on the road: −45% speed and 6 dmg/s |
| 💰 | Coin plant | 100 | +25 coins every 10 s |
| 🌾 | AA gun | 100 | hits flyers only (5 dmg, 3/s) |

## Levels

| # | Level | Waves | Feature |
| --- | --- | --- | --- |
| 1 | Outskirts | 8 | tutorial, normal zombies only |
| 2 | Bridge | 10 | runners appear |
| 3 | Park | 12 | armored zombies, coin plant and sticky webs |
| 4 | Streets | 14 | flying zombies — you need the AA gun |
| 5 | Belgrade Gates | 15 | final boss, 5000 HP |
| ∞ | Endless | ∞ | endless waves, a boss every 10 waves |

Levels unlock as you clear them (Endless unlocks after the Gates).

## Project structure

```
belgrade-defence/
├── index.html            # canvas + DOM UI shell
├── server.js             # static files + progress API (node:http, no deps)
├── styles.css
├── tools/
│   ├── build-standalone.mjs  # bundles one HTML into dist/
│   └── generate-levels.mjs   # level generator / auto-balancer
├── docs/screenshots/     # README screenshots
└── src/
    ├── main.js           # bootstrap + game loop (fixed timestep)
    ├── state.js          # state machine MENU → PLANNING → WAVE → WIN/LOSE
    ├── balance.js        # all numeric constants
    ├── config.js         # frozen levels and waves (generated)
    ├── themes.js         # per-level visual themes
    ├── map.js, render.js, fx.js, audio.js, waves.js
    ├── entities/         # plant.js, zombie.js, projectile.js
    └── ui/               # hud.js, shop.js, screens.js
```

## Notes

- Progress is stored **on the server** in `data/progress.json` (not committed to git). When running the bundled HTML file, progress is not saved.
- Levels and waves are frozen in `src/config.js`; regenerate with auto-balancing via `node tools/generate-levels.mjs`.
- Sound is procedural WebAudio, no audio files. Graphics are Canvas primitives, no assets.
