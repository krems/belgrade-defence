import { ZOMBIES, CHEW_DPS } from '../balance.js';
import { fx } from '../fx.js';
import { audio } from '../audio.js';

let nextId = 1;

export class Zombie {
  constructor(g, type, hpMul) {
    const map = g.map;
    const def = ZOMBIES[type];
    this.id = nextId++;
    this.type = type;
    this.def = def;
    this.maxHp = Math.round(def.hp * hpMul);
    this.hp = this.maxHp;
    this.dist = 0;
    this.speed = def.speed * map.cell;
    this.laneOffset = (Math.random() - 0.5) * 18;
    this.x = 0;
    this.y = 0;
    this.dx = 1;
    this.dy = 0;
    this.slowFactor = 1;
    this.slowT = 0;
    this.state = 'walk';
    this.deathT = 0;
    this.phase = Math.random() * Math.PI * 2;
    this.chompCd = 0;
    this.dmgAcc = 0;
    this.dmgAccColor = '#fff';
    this.dmgAccT = 0;
    this.reached = false;
    this.dead = false;
    this.syncPos(map);
  }
  syncPos(map) {
    const p = map.posAt(this.dist);
    this.x = p.x - p.dy * this.laneOffset;
    this.y = p.y + p.dx * this.laneOffset;
    this.dx = p.dx;
    this.dy = p.dy;
  }
  applySlow(factor, duration) {
    if (this.def.slowResist) factor = Math.max(factor, 1 - this.def.slowResist);
    this.slowFactor = Math.min(this.slowFactor, factor);
    this.slowT = Math.max(this.slowT, duration);
  }
  softDamage(g, amount, color) {
    if (this.dead || this.state === 'die') return;
    this.dmgAcc += amount;
    this.dmgAccColor = color;
    this.hp -= amount;
    if (this.hp <= 0) this.die(g);
  }
  damage(g, amount, { color = '#fff', silent = false } = {}) {
    if (this.dead || this.state === 'die') return;
    if (silent) {
      this.dmgAcc += amount;
      this.dmgAccColor = color;
    } else {
      fx.text(g, this.x + (Math.random() - 0.5) * 10, this.y - 24, String(Math.round(amount)), { color, size: 13 });
    }
    this.hp -= amount;
    if (this.hp <= 0) this.die(g);
  }
  die(g) {
    if (this.state === 'die') return;
    this.state = 'die';
    this.deathT = 0;
    g.kills += 1;
    g.coins += this.def.reward;
    g.earned += this.def.reward;
    fx.text(g, this.x, this.y - 30, '+' + this.def.reward, { color: '#ffd54a', size: 14 });
    const coinCount = this.type === 'boss' ? 6 : 1;
    for (let i = 0; i < coinCount; i++) fx.coin(g, this.x, this.y - 10);
    fx.burst(g, this.x, this.y, { color: '#7d9e6a', count: this.type === 'boss' ? 26 : 10, speed: this.type === 'boss' ? 160 : 90, life: 0.7, size: 3.5 });
    if (this.type === 'boss') {
      fx.shake(g, 8, 0.4);
      fx.ring(g, this.x, this.y, { r0: 10, r1: 90, life: 0.6, color: '#ffd54a', width: 4 });
    }
    audio.zombieDie();
  }
  update(g, dt) {
    if (this.dead) return;
    const map = g.map;
    if (this.state === 'die') {
      this.deathT += dt;
      if (this.deathT >= 0.8) this.dead = true;
      return;
    }
    this.phase += dt;
    this.slowT -= dt;
    if (this.slowT <= 0) this.slowFactor = 1;
    this.chompCd -= dt;
    this.dmgAccT -= dt;
    if (this.dmgAccT <= 0 && this.dmgAcc >= 1) {
      fx.text(g, this.x + (Math.random() - 0.5) * 10, this.y - 24, String(Math.max(1, Math.round(this.dmgAcc))), { color: this.dmgAccColor, size: 12 });
      this.dmgAcc = 0;
      this.dmgAccT = 0.85;
    }

    const front = this.dist + 26;
    const p = map.posAt(front);
    const key = map.keyAt(p.x, p.y);
    let blocker = null;
    if (key) {
      const plant = g.occupancy.get(key);
      if (plant && !plant.dead && plant.type === 'nut' && plant.hp > 0) blocker = plant;
    }

    if (blocker) {
      this.state = 'chew';
      blocker.chew(g, CHEW_DPS * dt);
      if (this.chompCd <= 0) {
        this.chompCd = 0.45;
        audio.chomp();
        fx.burst(g, blocker.x + (Math.random() - 0.5) * 14, blocker.y - 6, { color: '#c8a05a', count: 3, speed: 40, life: 0.4, size: 2 });
      }
    } else {
      this.state = 'walk';
      this.dist += this.speed * this.slowFactor * dt;
    }
    this.syncPos(map);

    if (this.dist >= map.totalLength - 4) {
      this.reached = true;
      this.dead = true;
    }
  }
}

export function spawnZombie(g, type) {
  const hpMul = type === 'boss' ? 1 : 1 + g.level.hpScalePerWave * g.waveIndex;
  g.zombies.push(new Zombie(g, type, hpMul));
}
