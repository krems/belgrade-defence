import { PLANTS } from '../balance.js';
import { cellKey } from '../map.js';
import { fx } from '../fx.js';
import { audio } from '../audio.js';
import { Bullet, MortarShell } from './projectile.js';

export class Plant {
  constructor(type, col, row, map) {
    const def = PLANTS[type];
    this.type = type;
    this.def = def;
    this.col = col;
    this.row = row;
    const c = map.cellCenter(col, row);
    this.x = c.x;
    this.y = c.y;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.dead = false;
    this.age = Math.random() * 10;
  }
  get key() {
    return cellKey(this.col, this.row);
  }
  update() {}
  kill(g) {
    if (this.dead) return;
    this.dead = true;
    fx.leafBurst(g, this.x, this.y);
  }
}

export class PeaPlant extends Plant {
  constructor(col, row, map) {
    super('pea', col, row, map);
    this.cd = 0.4;
    this.aim = 0;
    this.recoil = 0;
  }
  update(g, dt) {
    this.age += dt;
    this.cd -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 4);
    let target = null;
    let best = Infinity;
    const range = this.def.range * g.map.cell;
    for (const z of g.zombies) {
      if (z.dead || z.state === 'die') continue;
      const d = Math.hypot(z.x - this.x, z.y - this.y);
      if (d <= range && d < best) { best = d; target = z; }
    }
    if (target) {
      const want = Math.atan2(target.y - this.y, target.x - this.x);
      let diff = want - this.aim;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      this.aim += diff * Math.min(1, dt * 10);
      if (this.cd <= 0) {
        this.cd = 1 / this.def.rate;
        this.recoil = 1;
        const sx = this.x + Math.cos(this.aim) * 12;
        const sy = this.y - 8 + Math.sin(this.aim) * 12;
        g.projectiles.push(new Bullet(sx, sy, this.aim, this.def.dmg, target));
        fx.splat(g, sx, sy, '#b8e986');
        audio.shoot();
      }
    }
  }
}

export class FrostPlant extends Plant {
  constructor(col, row, map) {
    super('frost', col, row, map);
    this.pulse = 0;
  }
  update(g, dt) {
    this.age += dt;
    this.pulse += dt;
    const r = this.def.range * g.map.cell;
    for (const z of g.zombies) {
      if (z.dead || z.state === 'die') continue;
      if (Math.hypot(z.x - this.x, z.y - this.y) <= r) {
        z.applySlow(1 - this.def.slow, this.def.slowDuration);
        z.softDamage(g, this.def.dps * dt, '#8fd8ff');
      }
    }
  }
}

export class MortarPlant extends Plant {
  constructor(col, row, map) {
    super('mortar', col, row, map);
    this.cd = 1;
    this.aim = Math.PI;
    this.recoil = 0;
  }
  update(g, dt) {
    this.age += dt;
    this.cd -= dt;
    this.recoil = Math.max(0, this.recoil - dt * 3);
    if (this.cd > 0) return;
    let target = null;
    let best = Infinity;
    const dMin = this.def.rangeMin * g.map.cell;
    const dMax = this.def.rangeMax * g.map.cell;
    for (const z of g.zombies) {
      if (z.dead || z.state === 'die') continue;
      const d = Math.hypot(z.x - this.x, z.y - this.y);
      if (d >= dMin && d <= dMax && d < best) { best = d; target = z; }
    }
    if (target) {
      this.cd = this.def.cooldown;
      this.recoil = 1;
      this.aim = Math.atan2(target.y - this.y, target.x - this.x);
      g.projectiles.push(new MortarShell(this.x, this.y - 10, target.x, target.y, this.def.dmg, this.def.splash * g.map.cell));
      fx.dot(g, this.x, this.y - 12, { color: '#cfd8dc', size: 5, vy: -30, life: 0.5 });
      audio.mortarFire();
    }
  }
}

export class NutPlant extends Plant {
  constructor(col, row, map) {
    super('nut', col, row, map);
    this.chewT = 0;
  }
  chew(g, amount) {
    this.hp -= amount;
    this.chewT = 0.25;
    if (this.hp <= 0) this.kill(g);
  }
  update(g, dt) {
    this.age += dt;
    this.chewT = Math.max(0, this.chewT - dt);
  }
}

export class CactusPlant extends Plant {
  constructor(col, row, map) {
    super('cactus', col, row, map);
    this.activeT = 0;
  }
  update(g, dt) {
    this.age += dt;
    this.activeT = Math.max(0, this.activeT - dt);
    let hitAny = false;
    for (const z of g.zombies) {
      if (z.dead || z.state === 'die') continue;
      if (g.map.keyAt(z.x, z.y) === this.key) {
        hitAny = true;
        const dmg = this.def.dps * dt;
        z.damage(g, dmg, { color: '#7fe06a', silent: true });
        this.hp -= dmg;
      }
    }
    if (hitAny) {
      this.activeT = 0.2;
      if (this.hp <= 0) this.kill(g);
    }
  }
}

export class CoinPlant extends Plant {
  constructor(col, row, map) {
    super('coin', col, row, map);
    this.timer = this.def.every * 0.6;
    this.bounce = 0;
  }
  update(g, dt) {
    this.age += dt;
    this.bounce = Math.max(0, this.bounce - dt * 3);
    this.timer += dt;
    if (this.timer >= this.def.every) {
      this.timer -= this.def.every;
      this.bounce = 1;
      g.coins += this.def.income;
      g.earned += this.def.income;
      fx.coin(g, this.x, this.y - 10);
      fx.text(g, this.x, this.y - 20, '+' + this.def.income, { color: '#ffd54a', size: 13 });
      audio.coin();
    }
  }
}

const FACTORY = {
  pea: PeaPlant,
  frost: FrostPlant,
  mortar: MortarPlant,
  nut: NutPlant,
  cactus: CactusPlant,
  coin: CoinPlant,
};

export function createPlant(type, col, row, map) {
  return new (FACTORY[type] ?? Plant)(col, row, map);
}
