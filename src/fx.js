const COIN_TARGET = { x: 66, y: 30 };

function spawn(g, p) {
  g.particles.push(p);
}

export const fx = {
  dot(g, x, y, opts = {}) {
    spawn(g, {
      kind: 'dot', x, y,
      vx: opts.vx ?? 0, vy: opts.vy ?? 0,
      grav: opts.grav ?? 0,
      life: opts.life ?? 0.6, maxLife: opts.life ?? 0.6,
      size: opts.size ?? 3, color: opts.color ?? '#fff',
      drag: opts.drag ?? 0,
    });
  },
  burst(g, x, y, { color = '#fff', count = 10, speed = 90, life = 0.6, size = 3, grav = 60 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.8);
      spawn(g, {
        kind: 'dot', x, y,
        vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.2,
        grav, life: life * (0.6 + Math.random() * 0.7), maxLife: life,
        size: size * (0.6 + Math.random() * 0.8), color,
        drag: 1.5,
      });
    }
  },
  ring(g, x, y, { r0 = 4, r1 = 40, life = 0.35, color = '#fff', width = 3 } = {}) {
    spawn(g, { kind: 'ring', x, y, r0, r1, life, maxLife: life, color, width });
  },
  text(g, x, y, str, { color = '#fff', size = 14, life = 0.9, vy = -36 } = {}) {
    spawn(g, { kind: 'text', x, y, vy, str, life, maxLife: life, color, size });
  },
  coin(g, x, y) {
    const n = 1;
    for (let i = 0; i < n; i++) {
      spawn(g, {
        kind: 'coin', x: x + (Math.random() - 0.5) * 12, y,
        vx: (Math.random() - 0.5) * 160, vy: -120 - Math.random() * 60,
        grav: 380, life: 4, maxLife: 4, size: 6,
        state: 'fly', tx: COIN_TARGET.x, ty: COIN_TARGET.y,
      });
    }
  },
  dirt(g, x, y) {
    this.burst(g, x, y + 8, { color: '#8a6a42', count: 8, speed: 70, life: 0.5, size: 3, grav: 240 });
  },
  leafBurst(g, x, y) {
    this.burst(g, x, y, { color: '#7fbf5a', count: 12, speed: 110, life: 0.7, size: 3.5, grav: 180 });
    this.burst(g, x, y, { color: '#4f8a3a', count: 6, speed: 70, life: 0.6, size: 2.5, grav: 180 });
  },
  splat(g, x, y, color = '#9be564') {
    this.burst(g, x, y, { color, count: 5, speed: 60, life: 0.35, size: 2.5, grav: 100 });
  },
  explosion(g, x, y, r) {
    this.ring(g, x, y, { r0: 6, r1: r, life: 0.4, color: '#ffd54a', width: 4 });
    this.ring(g, x, y, { r0: 2, r1: r * 0.6, life: 0.25, color: '#fff3c4', width: 2 });
    this.burst(g, x, y, { color: '#ff9a3d', count: 16, speed: 160, life: 0.5, size: 4, grav: 100 });
    this.burst(g, x, y, { color: '#6b625a', count: 10, speed: 70, life: 0.9, size: 5, grav: -30 });
  },
  shake(g, mag, dur) {
    g.shakeMag = Math.max(g.shakeMag, mag);
    g.shakeDur = Math.max(g.shakeDur, dur);
    g.shakeT = Math.max(g.shakeT, dur);
  },
  flashGate(g) {
    g.gateFlash = 1;
  },
  update(g, dt) {
    const ps = g.particles;
    for (let i = ps.length - 1; i >= 0; i--) {
      const p = ps[i];
      p.life -= dt;
      if (p.life <= 0) { ps.splice(i, 1); continue; }
      if (p.kind === 'dot') {
        p.vy += (p.grav ?? 0) * dt;
        if (p.drag) { const f = Math.max(0, 1 - p.drag * dt); p.vx *= f; p.vy *= f; }
        p.x += p.vx * dt; p.y += p.vy * dt;
      } else if (p.kind === 'text') {
        p.y += p.vy * dt;
      } else if (p.kind === 'coin') {
        if (p.state === 'fly') {
          p.vy += p.grav * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (p.vy > 0 && p.y > 0 && Math.random() < 0.1) p.state = 'home';
        } else {
          const dx = p.tx - p.x, dy = p.ty - p.y;
          const d = Math.hypot(dx, dy);
          if (d < 18) { ps.splice(i, 1); continue; }
          const v = 500 + (4 - p.life) * 900;
          p.x += (dx / d) * v * dt;
          p.y += (dy / d) * v * dt;
        }
      }
    }
    if (g.shakeT > 0) {
      g.shakeT -= dt;
      if (g.shakeT <= 0) { g.shakeT = 0; g.shakeMag = 0; g.shakeDur = 0; }
    }
    if (g.gateFlash > 0) g.gateFlash = Math.max(0, g.gateFlash - dt * 1.4);
  },
  draw(ctx, g) {
    for (const p of g.particles) {
      const k = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = Math.min(1, k * 1.5);
      if (p.kind === 'dot') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + k * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'ring') {
        const r = p.r0 + (1 - k) * (p.r1 - p.r0);
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.width * k + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.kind === 'text') {
        ctx.font = `bold ${p.size}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic';
        ctx.lineWidth = 3;
        ctx.strokeStyle = 'rgba(20,24,16,0.75)';
        ctx.strokeText(p.str, p.x, p.y);
        ctx.fillStyle = p.color;
        ctx.fillText(p.str, p.x, p.y);
      } else if (p.kind === 'coin') {
        ctx.fillStyle = '#ffd54a';
        ctx.strokeStyle = '#b8860b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#b8860b';
        ctx.font = 'bold 8px system-ui';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('$', p.x, p.y + 0.5);
      }
    }
    ctx.globalAlpha = 1;
  },
};
