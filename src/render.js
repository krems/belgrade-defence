import { CANVAS_W, CANVAS_H, PLANTS } from './balance.js';
import { fx } from './fx.js';
import { checkPlace } from './state.js';
import { getTheme } from './themes.js';

let bg = null;
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function strokePath(ctx, pts, w, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

function drawField(ctx, map, theme) {
  ctx.fillStyle = theme.ground;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const rand = mulberry32(map.level.seed);
  if (theme.field === 'grass') {
    if (theme.checker) {
      ctx.fillStyle = theme.checker;
      for (let r = 0; r < map.rows; r++) {
        for (let c = 0; c < map.cols; c++) {
          if ((c + r) % 2 === 0) ctx.fillRect(c * 64, r * 64, 64, 64);
        }
      }
    }
    for (let i = 0; i < 110; i++) {
      const x = rand() * CANVAS_W;
      const y = rand() * CANVAS_H;
      ctx.fillStyle = theme.patches[rand() < 0.5 ? 0 : 1];
      ctx.beginPath();
      ctx.ellipse(x, y, 12 + rand() * 26, 8 + rand() * 16, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (theme.field === 'water') {
    for (let i = 0; i < 60; i++) {
      const x = rand() * CANVAS_W;
      const y = rand() * CANVAS_H;
      ctx.fillStyle = theme.patches[rand() < 0.6 ? 0 : 1];
      ctx.beginPath();
      ctx.ellipse(x, y, 26 + rand() * 54, 14 + rand() * 30, rand() * Math.PI, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(255,255,255,0.13)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x = rand() * CANVAS_W;
      const y = rand() * CANVAS_H;
      const w = 14 + rand() * 22;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + w / 2, y - 3, x + w, y);
      ctx.stroke();
    }
  } else if (theme.field === 'pavement') {
    for (let r = 0; r < map.rows; r++) {
      for (let c = 0; c < map.cols; c++) {
        if (rand() < 0.5) {
          ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
          ctx.fillRect(c * 64, r * 64, 64, 64);
        }
      }
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.10)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let x = 32; x < CANVAS_W; x += 32) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_H);
    }
    for (let y = 32; y < CANVAS_H; y += 32) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
    }
    ctx.stroke();
  } else if (theme.field === 'cobble') {
    const RH = 16;
    const RW = 24;
    for (let y = 0, row = 0; y < CANVAS_H; y += RH, row++) {
      const off = row % 2 ? RW / 2 : 0;
      for (let x = -RW; x < CANVAS_W; x += RW) {
        if (rand() < 0.4) {
          ctx.fillStyle = rand() < 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
          ctx.fillRect(x + off + 1.5, y + 1.5, RW - 3, RH - 3);
        }
      }
    }
    ctx.strokeStyle = 'rgba(30,30,24,0.10)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let y = RH; y < CANVAS_H; y += RH) {
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_W, y);
    }
    ctx.stroke();
  }
  if (theme.overlay) {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
    grad.addColorStop(0, theme.overlay[0]);
    grad.addColorStop(1, theme.overlay[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }
}

function drawRoad(ctx, map, theme) {
  const pts = map.waypoints;
  const r = theme.road;
  if (r.style === 'planks') {
    strokePath(ctx, pts, 62, r.edge);
    strokePath(ctx, pts, 50, r.mid);
    ctx.strokeStyle = 'rgba(52,36,20,0.5)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    for (let d = 0; d <= map.totalLength; d += 13) {
      const p = map.posAt(d);
      ctx.beginPath();
      ctx.moveTo(p.x - p.dy * 24, p.y + p.dx * 24);
      ctx.lineTo(p.x + p.dy * 24, p.y - p.dx * 24);
      ctx.stroke();
    }
    ctx.strokeStyle = r.edge;
    ctx.lineWidth = 4;
    for (const side of [-1, 1]) {
      ctx.beginPath();
      for (let d = 0; d <= map.totalLength; d += 8) {
        const p = map.posAt(d);
        const x = p.x + p.dy * 29 * side;
        const y = p.y - p.dx * 29 * side;
        if (d === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.fillStyle = r.edge;
    for (let d = 6; d <= map.totalLength; d += 44) {
      const p = map.posAt(d);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(p.x + p.dy * 29 * side, p.y - p.dx * 29 * side, 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    return;
  }
  strokePath(ctx, pts, 58, r.edge);
  strokePath(ctx, pts, 48, r.mid);
  if (r.style === 'asphalt') {
    ctx.save();
    ctx.strokeStyle = r.mark;
    ctx.lineWidth = 4;
    ctx.setLineDash([16, 20]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.restore();
  } else {
    strokePath(ctx, pts, 34, r.center);
    if (r.style === 'stone') {
      ctx.strokeStyle = r.seam;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'butt';
      for (let d = 0; d <= map.totalLength; d += 26) {
        const p = map.posAt(d);
        ctx.beginPath();
        ctx.moveTo(p.x - p.dy * 16, p.y + p.dx * 16);
        ctx.lineTo(p.x + p.dy * 16, p.y - p.dx * 16);
        ctx.stroke();
      }
    }
  }
  for (const p of map.decor.pebbles) {
    ctx.fillStyle = `rgba(${r.pebble},${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlots(ctx, map, theme) {
  const s = theme.slot;
  for (const key of map.slotCells) {
    const [c, r] = key.split(',').map(Number);
    const { x, y } = map.cellCenter(c, r);
    if (s.style === 'patch') {
      ctx.fillStyle = s.fill;
      ctx.strokeStyle = s.edge;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(x - 22, y - 22, 44, 44);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = s.furrow;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - 12, y + 6);
      ctx.lineTo(x - 2, y - 8);
      ctx.lineTo(x + 10, y + 2);
      ctx.moveTo(x - 4, y - 14);
      ctx.lineTo(x + 6, y - 2);
      ctx.stroke();
    } else {
      ctx.fillStyle = s.fill;
      ctx.strokeStyle = s.edge;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = s.furrow;
      ctx.lineWidth = 2;
      for (let i = -1; i <= 1; i++) {
        ctx.beginPath();
        ctx.arc(x, y + i * 7, 14, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }
    }
  }
}

function drawDecor(ctx, map, theme) {
  const c = theme.decor;
  for (const d of map.decor.decor) {
    switch (d.kind) {
      case 'bush': {
        ctx.fillStyle = c.bush[d.hue < 0.5 ? 0 : 1];
        for (const [ox, oy, r] of [[-6, 2, 8], [5, 0, 9], [0, -5, 8]]) {
          ctx.beginPath();
          ctx.arc(d.x + ox * d.s, d.y + oy * d.s, r * d.s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = c.bushLight;
        ctx.beginPath();
        ctx.arc(d.x - 4 * d.s, d.y - 7 * d.s, 3.5 * d.s, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'rock': {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(d.rot);
        ctx.fillStyle = c.rock;
        ctx.beginPath();
        ctx.ellipse(0, 0, 10 * d.s, 7 * d.s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath();
        ctx.ellipse(-3 * d.s, -2 * d.s, 4 * d.s, 2.5 * d.s, -0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'tuft': {
        ctx.strokeStyle = c.tuft;
        ctx.lineWidth = 1.6;
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath();
          ctx.moveTo(d.x + i * 3 * d.s, d.y + 4 * d.s);
          ctx.quadraticCurveTo(d.x + i * 4 * d.s, d.y - 4 * d.s, d.x + i * 5 * d.s, d.y - 8 * d.s);
          ctx.stroke();
        }
        break;
      }
      case 'tree': {
        ctx.fillStyle = c.tree.trunk;
        ctx.fillRect(d.x - 2.5 * d.s, d.y - 2 * d.s, 5 * d.s, 12 * d.s);
        const col = c.tree.canopy[d.hue < 0.5 ? 0 : 1];
        for (const [ox, oy, r] of [[-8, -6, 11], [8, -6, 11], [0, -16, 13], [0, -6, 12]]) {
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(d.x + ox * d.s, d.y + oy * d.s, r * d.s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = c.tree.light;
        ctx.beginPath();
        ctx.arc(d.x - 5 * d.s, d.y - 18 * d.s, 4.5 * d.s, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'flower': {
        ctx.strokeStyle = c.tuft;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y + 4 * d.s);
        ctx.quadraticCurveTo(d.x + 2, d.y - 2, d.x, d.y - 8 * d.s);
        ctx.stroke();
        const col = c.flower[Math.floor(d.hue * c.flower.length) % c.flower.length];
        ctx.fillStyle = col;
        for (let i = 0; i < 5; i++) {
          const a = (i / 5) * Math.PI * 2 + d.rot;
          ctx.beginPath();
          ctx.arc(d.x + Math.cos(a) * 3.2 * d.s, d.y - 8 * d.s + Math.sin(a) * 3.2 * d.s, 2.2 * d.s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = c.flowerCore;
        ctx.beginPath();
        ctx.arc(d.x, d.y - 8 * d.s, 1.8 * d.s, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'reed': {
        ctx.lineWidth = 1.8;
        ctx.lineCap = 'round';
        const rc = c.reed[d.hue < 0.5 ? 0 : 1];
        ctx.strokeStyle = rc;
        for (let i = 0; i < 3; i++) {
          const bx = d.x + (i - 1) * 5 * d.s;
          const h = (16 + ((d.hue * 7 + i * 3) % 6)) * d.s;
          ctx.beginPath();
          ctx.moveTo(bx, d.y + 5);
          ctx.quadraticCurveTo(bx + 3 * d.s, d.y - h * 0.5, bx + 1.5 * d.s, d.y - h);
          ctx.stroke();
          if (i === 1) {
            ctx.fillStyle = c.reedTip;
            ctx.beginPath();
            ctx.ellipse(bx + 1.5 * d.s, d.y - h - 3 * d.s, 1.8 * d.s, 4 * d.s, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case 'lilypad': {
        ctx.fillStyle = c.lilypad;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 9 * d.s, 6.5 * d.s, d.rot, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(20,50,40,0.5)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + Math.cos(d.rot) * 9 * d.s, d.y + Math.sin(d.rot) * 6.5 * d.s);
        ctx.stroke();
        if (d.hue > 0.75) {
          ctx.fillStyle = c.flower[0];
          ctx.beginPath();
          ctx.arc(d.x + 2 * d.s, d.y - 2 * d.s, 2.2 * d.s, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }
      case 'lamp': {
        ctx.strokeStyle = c.lamp.post;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y + 10 * d.s);
        ctx.lineTo(d.x, d.y - 22 * d.s);
        ctx.stroke();
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(d.x, d.y - 26 * d.s, 5 * d.s, Math.PI, 0);
        ctx.stroke();
        ctx.fillStyle = c.lamp.halo;
        ctx.beginPath();
        ctx.arc(d.x, d.y - 27 * d.s, 11 * d.s, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = c.lamp.glow;
        ctx.beginPath();
        ctx.arc(d.x, d.y - 27 * d.s, 4.5 * d.s, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
      case 'hydrant': {
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate((d.rot - Math.PI / 2) * 0.12);
        ctx.fillStyle = c.hydrant;
        ctx.beginPath();
        ctx.arc(0, -6 * d.s, 4.5 * d.s, Math.PI, 0);
        ctx.fill();
        ctx.fillRect(-5 * d.s, -6 * d.s, 10 * d.s, 12 * d.s);
        ctx.fillRect(-8 * d.s, -3 * d.s, 2.5 * d.s, 4 * d.s);
        ctx.fillRect(5.5 * d.s, -3 * d.s, 2.5 * d.s, 4 * d.s);
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.fillRect(-3 * d.s, -10.5 * d.s, 6 * d.s, 2 * d.s);
        ctx.restore();
        break;
      }
      case 'planter': {
        ctx.fillStyle = c.planter.shrub;
        for (const [ox, oy, r] of [[-5, -7, 5], [4, -7, 5], [0, -11, 5]]) {
          ctx.beginPath();
          ctx.arc(d.x + ox * d.s, d.y + oy * d.s, r * d.s, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = c.planter.box;
        ctx.fillRect(d.x - 10 * d.s, d.y - 4 * d.s, 20 * d.s, 10 * d.s);
        ctx.strokeStyle = 'rgba(0,0,0,0.25)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(d.x - 10 * d.s, d.y - 4 * d.s, 20 * d.s, 10 * d.s);
        break;
      }
      case 'barrel': {
        ctx.fillStyle = c.barrel.body;
        ctx.beginPath();
        ctx.ellipse(d.x, d.y, 7 * d.s, 9 * d.s, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = c.barrel.band;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(d.x - 7 * d.s, d.y - 3 * d.s);
        ctx.lineTo(d.x + 7 * d.s, d.y - 3 * d.s);
        ctx.moveTo(d.x - 7 * d.s, d.y + 3 * d.s);
        ctx.lineTo(d.x + 7 * d.s, d.y + 3 * d.s);
        ctx.stroke();
        break;
      }
      case 'banner': {
        const col = c.banner.colors[d.hue < 0.5 ? 0 : 1];
        ctx.strokeStyle = c.banner.pole;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y + 8 * d.s);
        ctx.lineTo(d.x, d.y - 22 * d.s);
        ctx.stroke();
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - 22 * d.s);
        ctx.lineTo(d.x + 12 * d.s, d.y - 18 * d.s);
        ctx.lineTo(d.x, d.y - 12 * d.s);
        ctx.closePath();
        ctx.fill();
        break;
      }
    }
  }
}

function drawGraves(ctx, theme) {
  if (theme.graveReplace === 'fountain') {
    ctx.fillStyle = '#9aa0a6';
    ctx.beginPath();
    ctx.ellipse(70, 30, 26, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5b9cc4';
    ctx.beginPath();
    ctx.ellipse(70, 30, 19, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8f98a3';
    ctx.fillRect(67, 18, 6, 14);
    ctx.beginPath();
    ctx.ellipse(70, 16, 6, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.ellipse(62, 27, 6, 2.5, -0.4, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  if (theme.graveReplace === 'kiosk') {
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i % 2 ? '#c8402f' : '#e8e2d2';
      ctx.fillRect(40 + i * 8, 4, 8, 9);
    }
    ctx.fillStyle = '#8a5f3c';
    ctx.fillRect(42, 13, 44, 25);
    ctx.fillStyle = '#6e4a2c';
    ctx.fillRect(42, 13, 44, 4);
    ctx.fillStyle = '#3b3f45';
    ctx.fillRect(50, 22, 12, 10);
    ctx.fillStyle = '#5c4326';
    ctx.fillRect(70, 22, 8, 16);
    return;
  }
  if (!theme.graves) return;
  const grave = (x, y, tilt) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tilt);
    ctx.fillStyle = '#8f959b';
    ctx.beginPath();
    ctx.moveTo(-9, 14);
    ctx.lineTo(-9, -6);
    ctx.arc(0, -6, 9, Math.PI, 0);
    ctx.lineTo(9, 14);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6d7378';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-4, -2); ctx.lineTo(4, -2);
    ctx.moveTo(0, -6); ctx.lineTo(0, 2);
    ctx.stroke();
    ctx.restore();
  };
  grave(24, 30, -0.08);
  grave(104, 22, 0.1);
  ctx.strokeStyle = '#5c4326';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(64, 44); ctx.lineTo(64, 8);
  ctx.moveTo(64, 18); ctx.lineTo(52, 6);
  ctx.moveTo(64, 14); ctx.lineTo(76, 2);
  ctx.stroke();
}

function drawCity(ctx, map, theme) {
  const W = map.width;
  const H = map.height;
  const city = theme.city;
  const wallX = W - 30;
  const cx = W - 13;
  ctx.fillStyle = city.wall;
  ctx.fillRect(wallX, 56, 30, H - 112);
  ctx.strokeStyle = city.wallLine;
  ctx.lineWidth = 1.5;
  for (let y = 64; y < H - 56; y += 16) {
    ctx.beginPath();
    ctx.moveTo(wallX, y);
    ctx.lineTo(wallX + 30, y);
    ctx.stroke();
  }
  ctx.fillStyle = city.wall;
  for (let y = 56; y < H - 56; y += 34) {
    ctx.fillRect(wallX - 4, y, 38, 12);
  }
  const tower = (y) => {
    ctx.fillStyle = city.tower;
    ctx.fillRect(W - 38, y, 38, 44);
    ctx.fillStyle = city.roof;
    ctx.beginPath();
    ctx.moveTo(W - 42, y);
    ctx.lineTo(W + 4, y);
    ctx.lineTo(W - 19, y - 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = city.wallLine;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W - 38, y, 38, 44);
  };
  const ys = city.towers >= 3 ? [34, Math.round(H / 2) - 22, H - 82] : [34, H - 82];
  for (const y of ys) tower(y);
  const pennant = (px, py, col) => {
    ctx.strokeStyle = city.flagPole;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px, py - 11);
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(px, py - 11);
    ctx.lineTo(px + 10, py - 8);
    ctx.lineTo(px, py - 5);
    ctx.closePath();
    ctx.fill();
  };
  ctx.strokeStyle = city.flagPole;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, 16); ctx.lineTo(cx, -4);
  ctx.stroke();
  ctx.fillStyle = city.flag;
  ctx.beginPath();
  ctx.moveTo(cx, -4);
  ctx.lineTo(cx + 20, 1);
  ctx.lineTo(cx, 7);
  ctx.closePath();
  ctx.fill();
  if (city.extraFlags >= 1) pennant(W - 19, ys[0] - 18, city.flagAlt);
  if (city.extraFlags >= 2) pennant(W - 19, ys[ys.length - 1] - 18, city.flag);

  const gy = map.gate.y;
  ctx.fillStyle = city.gate;
  ctx.beginPath();
  ctx.moveTo(cx - 13, gy + 34);
  ctx.lineTo(cx - 13, gy - 20);
  ctx.arc(cx, gy - 20, 13, Math.PI, 0);
  ctx.lineTo(cx + 13, gy + 34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = city.gateLine;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 9 + i * 6, gy - 24);
    ctx.lineTo(cx - 9 + i * 6, gy + 34);
    ctx.stroke();
  }
}

export function bakeBackground(bctx, map, w, h) {
  const theme = getTheme(map.level);
  const kx = w / CANVAS_W;
  const ky = h / CANVAS_H;
  bctx.setTransform(kx, 0, 0, ky, 0, 0);
  drawField(bctx, map, theme);
  drawRoad(bctx, map, theme);
  drawSlots(bctx, map, theme);
  drawDecor(bctx, map, theme);
  drawGraves(bctx, theme);
  drawCity(bctx, map, theme);
}

export function syncBackground(canvas, map) {
  bg = document.createElement('canvas');
  bg.width = canvas.width;
  bg.height = canvas.height;
  bakeBackground(bg.getContext('2d'), map, bg.width, bg.height);
}

function drawShadow(ctx, x, y, rx, ry) {
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPea(ctx, p, t) {
  const sway = Math.sin(p.age * 2 + p.x) * 1.5;
  drawShadow(ctx, p.x, p.y + 14, 12, 4.5);
  ctx.strokeStyle = '#3f7a2a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 14);
  ctx.quadraticCurveTo(p.x + sway, p.y, p.x + sway * 0.5, p.y - 8);
  ctx.stroke();
  ctx.fillStyle = '#4f8a3a';
  ctx.beginPath();
  ctx.ellipse(p.x - 6, p.y + 12, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.ellipse(p.x + 6, p.y + 12, 6, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  const hx = p.x + sway * 0.5 - Math.cos(p.aim) * p.recoil * 3;
  const hy = p.y - 8 - Math.sin(p.aim) * p.recoil * 3;
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(p.aim);
  ctx.fillStyle = '#59a832';
  ctx.strokeStyle = '#3f7a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-3 - p.recoil * 2, 0, 10, 9, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#59a832';
  ctx.beginPath();
  ctx.roundRect(4, -3.5, 10, 7, 3);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#1c2b14';
  ctx.beginPath();
  ctx.arc(1, -3, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFrost(ctx, p, t) {
  drawShadow(ctx, p.x, p.y + 14, 12, 4.5);
  ctx.strokeStyle = '#3a6a8a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 14);
  ctx.lineTo(p.x, p.y - 2);
  ctx.stroke();
  const rot = p.pulse * 0.5;
  ctx.fillStyle = '#9fd8f7';
  ctx.strokeStyle = '#5da4cc';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 6; i++) {
    const a = rot + (i * Math.PI * 2) / 6;
    ctx.save();
    ctx.translate(p.x + Math.cos(a) * 8, p.y - 6 + Math.sin(a) * 8);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(3, 0, 7, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = '#d8f2ff';
  ctx.strokeStyle = '#5da4cc';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 6, 6.5 + Math.sin(p.pulse * 3) * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawMortar(ctx, p, t) {
  drawShadow(ctx, p.x, p.y + 12, 13, 5);
  ctx.strokeStyle = '#5c4326';
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  for (const a of [-2.5, -1.57, -0.65]) {
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + 10);
    ctx.lineTo(p.x + Math.cos(a) * 9, p.y + 10 + Math.sin(a) * 9);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(p.x, p.y - 4);
  ctx.rotate(p.aim);
  const rec = p.recoil * 3;
  ctx.fillStyle = '#e8c93a';
  ctx.strokeStyle = '#8a7514';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-rec, 0, 13, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b09a20';
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      ctx.beginPath();
      ctx.arc(-rec + i * 5, j * 4, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = '#6b625a';
  ctx.beginPath();
  ctx.roundRect(8 - rec, -4, 9, 8, 3);
  ctx.fill();
  ctx.restore();
}

function drawNut(ctx, p, t) {
  const wobble = p.chewT > 0 ? Math.sin(p.age * 40) * 0.06 : 0;
  drawShadow(ctx, p.x, p.y + 16, 14, 5);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(wobble);
  const k = p.hp / p.maxHp;
  ctx.fillStyle = '#b98a4e';
  ctx.strokeStyle = '#8a6236';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 15, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(-5, -7, 5, 8, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2a14';
  ctx.beginPath();
  ctx.arc(-4.5, -4, 1.8, 0, Math.PI * 2);
  ctx.arc(4.5, -4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  if (p.chewT > 0) {
    ctx.strokeStyle = '#3a2a14';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 3, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.strokeStyle = '#7a5230';
  ctx.lineWidth = 1.5;
  if (k < 0.66) {
    ctx.beginPath();
    ctx.moveTo(-10, -12);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-9, 0);
    ctx.stroke();
  }
  if (k < 0.33) {
    ctx.beginPath();
    ctx.moveTo(9, -10);
    ctx.lineTo(5, -3);
    ctx.lineTo(8, 4);
    ctx.moveTo(0, 8);
    ctx.lineTo(3, 13);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCactus(ctx, p, t) {
  drawShadow(ctx, p.x, p.y + 12, 11, 4.5);
  const flash = p.activeT > 0;
  ctx.fillStyle = flash ? '#8fd97a' : '#4f9e4f';
  ctx.strokeStyle = '#3a7a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(p.x - 8, p.y - 16, 16, 28, 7);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.roundRect(p.x - 15, p.y - 8, 7, 12, 3.5);
  ctx.roundRect(p.x + 8, p.y - 11, 7, 12, 3.5);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = 'rgba(58,122,58,0.8)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(p.x - 3, p.y - 13); ctx.lineTo(p.x - 3, p.y + 9);
  ctx.moveTo(p.x + 3, p.y - 13); ctx.lineTo(p.x + 3, p.y + 9);
  ctx.stroke();
  ctx.strokeStyle = flash ? '#fff' : '#2d5c2d';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI * 2) / 8 + 0.4;
    const x = p.x + Math.cos(a) * 9;
    const y = p.y - 2 + Math.sin(a) * 13;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5);
    ctx.stroke();
  }
  ctx.fillStyle = '#e58ab0';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 17, 3.5, 0, Math.PI * 2);
  ctx.fill();
  const k = p.hp / p.maxHp;
  if (k < 0.5) {
    ctx.strokeStyle = '#2d5c2d';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(p.x - 5, p.y - 10);
    ctx.lineTo(p.x - 2, p.y - 4);
    ctx.lineTo(p.x - 5, p.y + 2);
    ctx.stroke();
  }
}

function drawCoin(ctx, p, t) {
  const b = p.bounce;
  const sc = 1 + Math.sin(b * Math.PI) * 0.15;
  drawShadow(ctx, p.x, p.y + 14, 11, 4);
  ctx.save();
  ctx.translate(p.x, p.y - 4 - b * 6);
  ctx.scale(sc, sc);
  ctx.strokeStyle = '#3f7a2a';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.quadraticCurveTo(2, 8, 0, 0);
  ctx.stroke();
  ctx.fillStyle = '#ffd54a';
  ctx.strokeStyle = '#c9971d';
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 8; i++) {
    const a = p.age * 0.6 + (i * Math.PI * 2) / 8;
    ctx.save();
    ctx.translate(Math.cos(a) * 9, Math.sin(a) * 9);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(3.5, 0, 6, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#c9971d';
  ctx.font = 'bold 9px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('$', 0, 0.5);
  ctx.restore();
}

function drawTrap(ctx, p, t) {
  const flash = p.activeT > 0;
  const k = Math.max(0.25, p.hp / p.maxHp);
  drawShadow(ctx, p.x, p.y + 10, 17, 6);
  ctx.fillStyle = flash ? 'rgba(190,140,230,0.55)' : 'rgba(120,80,160,0.42)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 4, 22 * k + 4, 13 * k + 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? 'rgba(230,200,255,0.95)' : 'rgba(160,120,200,0.8)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI * 2) / 6 + p.age * 0.15;
    const x1 = p.x + Math.cos(a) * (20 * k + 3);
    const y1 = p.y + 4 + Math.sin(a) * (11 * k + 2);
    const x2 = p.x + Math.cos(a + 0.5) * 6;
    const y2 = p.y + 4 + Math.sin(a + 0.5) * 4;
    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.quadraticCurveTo((x1 + x2) / 2 + Math.cos(a) * 5, (y1 + y2) / 2 - 3, x1, y1);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(230,200,255,0.85)';
  for (const [ox, oy] of [[-8, -2], [6, 1], [0, 6]]) {
    ctx.beginPath();
    ctx.arc(p.x + ox, p.y + 4 + oy, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAA(ctx, p, t) {
  const sway = Math.sin(p.age * 3 + p.x) * 1;
  drawShadow(ctx, p.x, p.y + 14, 12, 4.5);
  ctx.strokeStyle = '#3f7a2a';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(p.x, p.y + 14);
  ctx.quadraticCurveTo(p.x + sway, p.y + 4, p.x + sway * 0.5, p.y - 4);
  ctx.stroke();
  ctx.fillStyle = '#4f8a3a';
  ctx.beginPath();
  ctx.ellipse(p.x - 6, p.y + 12, 6, 3, -0.5, 0, Math.PI * 2);
  ctx.ellipse(p.x + 6, p.y + 12, 6, 3, 0.5, 0, Math.PI * 2);
  ctx.fill();
  const hx = p.x + sway * 0.5 - Math.cos(p.aim) * p.recoil * 4;
  const hy = p.y - 10 - Math.sin(p.aim) * p.recoil * 4;
  ctx.fillStyle = '#b0c46a';
  ctx.strokeStyle = '#77873a';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(p.x + sway * 0.5, p.y - 4, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.translate(hx, hy);
  ctx.rotate(p.aim);
  ctx.fillStyle = '#7d8a52';
  ctx.strokeStyle = '#54602f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-5, -2.4, 19, 4.8, 2.4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#95a55c';
  ctx.beginPath();
  ctx.roundRect(-8, -4.5, 8, 9, 3);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,213,74,0.7)';
  ctx.lineWidth = 1.4;
  const sweep = p.age * 2.2;
  ctx.beginPath();
  ctx.arc(p.x + sway * 0.5, p.y - 4, 13, sweep, sweep + 1.1);
  ctx.stroke();
}

const PLANT_DRAWERS = {
  pea: drawPea,
  frost: drawFrost,
  mortar: drawMortar,
  nut: drawNut,
  cactus: drawCactus,
  trap: drawTrap,
  coin: drawCoin,
  aa: drawAA,
};

export function drawPlantShape(ctx, type, x, y, t, opts = {}) {
  const fake = {
    type,
    x,
    y,
    age: t,
    aim: opts.aim ?? -0.3,
    recoil: 0,
    pulse: t,
    chewT: 0,
    activeT: 0,
    bounce: 0,
    hp: 1,
    maxHp: 1,
  };
  (PLANT_DRAWERS[type] ?? drawPea)(ctx, fake, t);
}

function drawHpBar(ctx, x, y, w, k, color) {
  ctx.fillStyle = 'rgba(20,24,16,0.7)';
  ctx.beginPath();
  ctx.roundRect(x - w / 2 - 1, y - 1, w + 2, 5.5, 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x - w / 2, y, w * Math.max(0, k), 3.5, 1.5);
  ctx.fill();
}

// Зомби — дизайн подсмотрен у belgrade-zombies: поношенный пиджак с галстуком,
// вытянутые руки, шаркающие ноги, голова с растрёпанными волосами;
// при смерти голова отрывается и улетает. K — масштаб дизайна (80px → наши клетки).
const ZOMBIE_SKIN = '#9fae7e';
const ZOMBIE_JACKETS = {
  normal: '#6b5d4a',
  runner: '#8fa06a',
  armored: '#7d8a6a',
  flyer: '#9a8fb8',
  boss: '#5c6e52',
};

function drawZombie(ctx, z, t) {
  const s = z.def.radius / 13;
  const K = 0.5;
  const dying = z.state === 'die';
  const d = dying ? z.deathT : 0;
  const facing = z.dx >= 0 ? 1 : -1;
  const flying = Boolean(z.def.flying);
  const hover = flying ? 8 + Math.sin(z.phase * 4) * 3 : 0;
  const jacket = ZOMBIE_JACKETS[z.type] ?? ZOMBIE_JACKETS.normal;
  const skin = z.type === 'boss' ? '#8fa07a' : ZOMBIE_SKIN;
  const alpha = dying ? Math.max(0, 1 - Math.max(0, (d / 0.8 - 0.6) / 0.4)) : 1;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(z.x, z.y + 14);
  drawShadow(ctx, 0, 2, flying ? 9 : 13 * s, 4.5 * s);
  ctx.translate(0, -hover);
  if (dying) ctx.rotate(-facing * d * 1.5);
  else if (z.state === 'chew') ctx.rotate(facing * (0.14 + Math.sin(z.phase * 14) * 0.035));
  else ctx.rotate(facing * (0.06 + Math.sin(z.phase * 2.3) * 0.02));
  ctx.scale(-facing * s * K, s * K);

  const walking = z.state === 'walk';
  const walkSwing = walking ? Math.sin(z.phase * 5) * 6 : 0;
  const bob = walking ? Math.abs(Math.sin(z.phase * 5)) * 2 : 0;
  ctx.translate(0, -bob);

  if (flying) {
    const flap = Math.sin(z.phase * 16) * 0.55;
    ctx.fillStyle = 'rgba(232,240,255,0.8)';
    ctx.strokeStyle = 'rgba(130,160,200,0.9)';
    ctx.lineWidth = 1.2;
    for (const sd of [-1, 1]) {
      ctx.save();
      ctx.translate(sd * 7, -46);
      ctx.rotate(sd * (0.55 + flap));
      ctx.beginPath();
      ctx.ellipse(sd * 6, 0, 9, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  }

  drawZombieLeg(ctx, -6, flying ? 0 : walkSwing);
  drawZombieLeg(ctx, 6, flying ? 0 : -walkSwing);

  ctx.fillStyle = jacket;
  ctx.strokeStyle = '#4a3f31';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-14, -58, 28, 34, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = z.type === 'boss' ? '#c8a03a' : '#a03b2a';
  ctx.beginPath();
  ctx.moveTo(-3, -55);
  ctx.lineTo(3, -55);
  ctx.lineTo(0, -42);
  ctx.closePath();
  ctx.fill();

  const armY = -50 + Math.sin(z.phase * 5) * 2.5;
  ctx.strokeStyle = jacket;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-8, armY);
  ctx.lineTo(-36, armY + 4);
  ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(-39, armY + 4, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8, armY + 7);
  ctx.lineTo(-30, armY + 12);
  ctx.stroke();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(-33, armY + 12, 4, 0, Math.PI * 2);
  ctx.fill();

  if (!dying) {
    ctx.save();
    ctx.translate(-2, -72);
    drawZombieHead(ctx, z, z.state === 'chew' ? z.phase * 14 : z.phase * 2.5);
    ctx.restore();
  }

  if (z.type === 'runner' && !dying) {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'butt';
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(16 + i * 6, -46 + i * 8);
      ctx.lineTo(26 + i * 6, -46 + i * 8);
      ctx.stroke();
    }
  }

  if (z.slowT > 0 && !dying) {
    ctx.fillStyle = 'rgba(120,200,255,0.35)';
    ctx.strokeStyle = 'rgba(160,220,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -38, 24, 42, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();

  if (dying) {
    const hx = z.x - facing * (2 + 45 * d) * s * K;
    const hy = z.y + 14 - 72 * s * K - 100 * s * K * d + 280 * s * K * d * d;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(hx, hy);
    ctx.rotate(-facing * d * 6);
    ctx.scale(s * K, s * K);
    drawZombieHead(ctx, z, d * 10);
    ctx.restore();
  }

  if (!dying && (z.hp < z.maxHp || z.type === 'boss')) {
    const w = z.type === 'boss' ? 52 : 26;
    const pct = Math.max(0, z.hp / z.maxHp);
    drawHpBar(ctx, z.x, z.y - 30 * s - 10 - hover, w, pct, `hsl(${Math.round(pct * 110)},70%,45%)`);
  }
}

function drawZombieLeg(ctx, x, swing) {
  ctx.save();
  ctx.translate(x + swing * 0.4, -26);
  ctx.rotate(swing * 0.02);
  ctx.fillStyle = '#4a3f33';
  ctx.beginPath();
  ctx.roundRect(-4.5, 0, 9, 22, 3);
  ctx.fill();
  ctx.fillStyle = '#2c2620';
  ctx.beginPath();
  ctx.roundRect(-6.5, 20, 12, 6, 3);
  ctx.fill();
  ctx.restore();
}

function drawZombieHead(ctx, z, chewT) {
  const boss = z.type === 'boss';
  const skin = boss ? '#8fa07a' : ZOMBIE_SKIN;
  ctx.save();
  ctx.rotate(Math.sin(chewT) * 0.06);
  ctx.fillStyle = skin;
  ctx.strokeStyle = boss ? '#5c6e46' : '#6b7a52';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = boss ? '#6f8258' : '#8fa06f';
  ctx.beginPath();
  ctx.roundRect(-9, 6, 16, 7, 3);
  ctx.fill();
  ctx.strokeStyle = '#3d3a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-4, -13);
  ctx.lineTo(-7, -19);
  ctx.moveTo(1, -14);
  ctx.lineTo(1, -20);
  ctx.moveTo(6, -13);
  ctx.lineTo(9, -18);
  ctx.stroke();
  if (boss) {
    ctx.fillStyle = '#ff5a4a';
    ctx.shadowColor = '#ff2a1a';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(-6, -3, 2.6, 0, Math.PI * 2);
    ctx.arc(3, -3, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#e8ead8';
    ctx.beginPath();
    ctx.arc(-6, -3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20241a';
    ctx.beginPath();
    ctx.arc(-7, -3, 1.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#4a3f31';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(3, -6);
  ctx.lineTo(8, -4);
  ctx.stroke();
  ctx.strokeStyle = '#20241a';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, 9);
  ctx.lineTo(-1, 10.5);
  ctx.moveTo(0, 9.5);
  ctx.lineTo(3, 11);
  ctx.stroke();
  if (boss) {
    ctx.fillStyle = '#c8b07a';
    ctx.strokeStyle = '#8a743e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-9, -12);
    ctx.lineTo(-9, -20);
    ctx.lineTo(-4.5, -15);
    ctx.lineTo(0, -22);
    ctx.lineTo(4.5, -15);
    ctx.lineTo(9, -20);
    ctx.lineTo(9, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  if (z.type === 'armored') drawTrafficCone(ctx);
  ctx.restore();
}

// Дорожный конус — броня броневика, поверх головы
function drawTrafficCone(ctx) {
  ctx.fillStyle = '#e2762c';
  ctx.strokeStyle = '#a04d16';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(0, -8, 15, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-8, -9);
  ctx.lineTo(-3.5, -32);
  ctx.lineTo(3.5, -32);
  ctx.lineTo(8, -9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#f2e9dc';
  ctx.beginPath();
  ctx.moveTo(-6.7, -18);
  ctx.lineTo(-5.4, -25);
  ctx.lineTo(5.4, -25);
  ctx.lineTo(6.7, -18);
  ctx.closePath();
  ctx.fill();
}

function drawProjectiles(ctx, g) {
  for (const pr of g.projectiles) pr.draw(ctx);
}

function drawAuras(ctx, g, t) {
  for (const p of g.plants) {
    if (p.type !== 'frost' || p.dead) continue;
    const r = p.def.range * g.map.cell;
    const pulse = 0.75 + Math.sin(t * 3 + p.x) * 0.25;
    ctx.fillStyle = `rgba(140,210,255,${0.07 * pulse})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = `rgba(160,220,255,${0.35 * pulse})`;
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 8]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
}

function drawRangeCircle(ctx, map, x, y, rCells, color = 'rgba(255,255,255,0.7)') {
  const r = rCells * map.cell;
  ctx.fillStyle = 'rgba(255,255,255,0.07)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPlacement(ctx, g, t) {
  const { mode, type, plant } = g.selection;
  const hover = g.hover;
  const map = g.map;
  if (mode === 'info' && plant && !plant.dead) {
    const def = plant.def;
    if (def.range) drawRangeCircle(ctx, map, plant.x, plant.y, def.range);
    if (def.rangeMax) {
      drawRangeCircle(ctx, map, plant.x, plant.y, def.rangeMax);
      ctx.strokeStyle = 'rgba(255,120,90,0.5)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 5]);
      ctx.beginPath();
      ctx.arc(plant.x, plant.y, def.rangeMin * map.cell, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = '#ffd54a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(plant.x, plant.y, 26, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (!hover) return;
  const { x, y } = map.cellCenter(hover.c, hover.r);
  if (mode === 'plant' && type) {
    const status = checkPlace(type, hover.c, hover.r, g);
    const ok = status === 'ok';
    const color = ok ? 'rgba(120,230,120,' : 'rgba(240,90,90,';
    ctx.fillStyle = color + '0.25)';
    ctx.strokeStyle = color + '0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 30, y - 30, 60, 60, 8);
    ctx.fill();
    ctx.stroke();
    if (ok) {
      ctx.globalAlpha = 0.6;
      drawPlantShape(ctx, type, x, y, t);
      ctx.globalAlpha = 1;
      const def = PLANTS[type];
      if (def.range) drawRangeCircle(ctx, map, x, y, def.range);
      if (def.rangeMax) {
        drawRangeCircle(ctx, map, x, y, def.rangeMax);
        ctx.strokeStyle = 'rgba(255,120,90,0.5)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 5]);
        ctx.beginPath();
        ctx.arc(x, y, def.rangeMin * map.cell, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  } else if (mode === 'shovel') {
    ctx.strokeStyle = 'rgba(255,220,90,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x - 30, y - 30, 60, 60, 8);
    ctx.stroke();
    if (g.occupancy.has(hover.c + ',' + hover.r)) {
      ctx.strokeStyle = 'rgba(255,90,90,0.9)';
      ctx.beginPath();
      ctx.roundRect(x - 30, y - 30, 60, 60, 8);
      ctx.stroke();
    }
    drawShovel(ctx, g.mouse.x + 14, g.mouse.y + 14, 1.1);
  }
}

function drawShovel(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-0.6);
  ctx.scale(s, s);
  ctx.strokeStyle = '#8a6236';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(0, 6);
  ctx.stroke();
  ctx.strokeStyle = '#5c4326';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, -18, 4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#aeb6bd';
  ctx.strokeStyle = '#6f7883';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-6, 5);
  ctx.lineTo(6, 5);
  ctx.lineTo(5, 16);
  ctx.quadraticCurveTo(0, 21, -5, 16);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function render(ctx, g, t) {
  ctx.save();
  if (g.shakeT > 0) {
    const k = g.shakeT / g.shakeDur;
    const m = g.shakeMag * k;
    ctx.translate((Math.random() - 0.5) * 2 * m, (Math.random() - 0.5) * 2 * m);
  }
  if (bg) ctx.drawImage(bg, 0, 0, CANVAS_W, CANVAS_H);
  else {
    ctx.fillStyle = getTheme(g.map.level).ground;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  if (g.gateFlash > 0) {
    const grad = ctx.createRadialGradient(g.map.gate.x, g.map.gate.y, 4, g.map.gate.x, g.map.gate.y, 90);
    grad.addColorStop(0, `rgba(255,60,40,${0.55 * g.gateFlash})`);
    grad.addColorStop(1, 'rgba(255,60,40,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(g.map.gate.x - 100, g.map.gate.y - 100, 200, 200);
  }

  const sortedPlants = [...g.plants].sort((a, b) => a.y - b.y);
  for (const p of sortedPlants) {
    if (p.def.onRoad) (PLANT_DRAWERS[p.type] ?? drawPea)(ctx, p, t);
  }
  for (const p of sortedPlants) {
    if (!p.def.onRoad) (PLANT_DRAWERS[p.type] ?? drawPea)(ctx, p, t);
  }

  const zs = [...g.zombies].sort((a, b) => a.y - b.y);
  for (const z of zs) drawZombie(ctx, z, t);

  drawAuras(ctx, g, t);
  drawProjectiles(ctx, g);
  fx.draw(ctx, g);
  drawPlacement(ctx, g, t);

  if (g.selection.mode === 'plant' && g.mouse.inside && !g.hover) {
    drawGhostFree(ctx, g, t);
  }
  ctx.restore();
}

function drawGhostFree(ctx, g, t) {
  if (g.selection.mode !== 'plant') return;
  ctx.globalAlpha = 0.35;
  drawPlantShape(ctx, g.selection.type, g.mouse.x, g.mouse.y, t);
  ctx.globalAlpha = 1;
}
