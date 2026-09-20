import { BULLET_SPEED, SHELL_FLIGHT } from '../balance.js';
import { fx } from '../fx.js';
import { audio } from '../audio.js';

export class Bullet {
  constructor(x, y, angle, dmg, target) {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * BULLET_SPEED;
    this.vy = Math.sin(angle) * BULLET_SPEED;
    this.dmg = dmg;
    this.target = target;
    this.life = 2.5;
    this.dead = false;
  }
  update(g, dt) {
    this.life -= dt;
    if (this.life <= 0) { this.dead = true; return; }
    if (this.target && !this.target.dead && this.target.state !== 'die') {
      const want = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      const cur = Math.atan2(this.vy, this.vx);
      let diff = want - cur;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      const na = cur + diff * Math.min(1, dt * 14);
      this.vx = Math.cos(na) * BULLET_SPEED;
      this.vy = Math.sin(na) * BULLET_SPEED;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    if (this.x < -20 || this.x > g.map.width + 20 || this.y < -20 || this.y > g.map.height + 20) { this.dead = true; return; }
    let hit = null;
    let best = Infinity;
    for (const z of g.zombies) {
      if (z.dead || z.state === 'die') continue;
      const d = Math.hypot(z.x - this.x, z.y - this.y);
      if (d < z.def.radius + 5 && d < best) { best = d; hit = z; }
    }
    if (hit) {
      this.dead = true;
      hit.damage(g, this.dmg, { color: '#eaffd0' });
      fx.splat(g, this.x, this.y);
      audio.hit();
    }
  }
  draw(ctx) {
    ctx.fillStyle = '#8fd94a';
    ctx.strokeStyle = '#4c7a2a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}

export class MortarShell {
  constructor(x0, y0, x1, y1, dmg, splashRadius) {
    this.x0 = x0; this.y0 = y0;
    this.x1 = x1; this.y1 = y1;
    this.t = 0;
    this.dur = SHELL_FLIGHT;
    this.dmg = dmg;
    this.splashRadius = splashRadius;
    this.dead = false;
  }
  update(g, dt) {
    this.t += dt;
    if (this.t < this.dur) return;
    this.dead = true;
    fx.explosion(g, this.x1, this.y1, this.splashRadius);
    fx.shake(g, 6, 0.28);
    audio.explosion();
    for (const z of g.zombies) {
      if (z.dead || z.state === 'die') continue;
      if (Math.hypot(z.x - this.x1, z.y - this.y1) <= this.splashRadius + z.def.radius * 0.4) {
        z.damage(g, this.dmg, { color: '#ffb84a' });
      }
    }
  }
  draw(ctx) {
    const k = this.t / this.dur;
    const x = this.x0 + (this.x1 - this.x0) * k;
    const y = this.y0 + (this.y1 - this.y0) * k - Math.sin(Math.PI * k) * 90;
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(this.x0 + (this.x1 - this.x0) * k, this.y0 + (this.y1 - this.y0) * k, 5, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8c93a';
    ctx.strokeStyle = '#8a7514';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
}
