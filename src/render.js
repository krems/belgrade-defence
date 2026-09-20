import { CANVAS_W, CANVAS_H, PLANTS } from './balance.js';
import { fx } from './fx.js';
import { checkPlace } from './state.js';

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

function drawGrass(ctx, map) {
  ctx.fillStyle = '#7aa74f';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const rand = mulberry32(42);
  for (let r = 0; r < map.rows; r++) {
    for (let c = 0; c < map.cols; c++) {
      if ((c + r) % 2 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.045)';
        ctx.fillRect(c * 64, r * 64, 64, 64);
      }
    }
  }
  for (let i = 0; i < 110; i++) {
    const x = rand() * CANVAS_W;
    const y = rand() * CANVAS_H;
    ctx.fillStyle = rand() < 0.5 ? 'rgba(70,110,45,0.12)' : 'rgba(190,225,130,0.10)';
    ctx.beginPath();
    ctx.ellipse(x, y, 12 + rand() * 26, 8 + rand() * 16, rand() * Math.PI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRoad(ctx, map) {
  const pts = map.waypoints;
  const stroke = (w, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
  };
  stroke(58, '#6d4f33');
  stroke(48, '#b08a5a');
  stroke(34, '#c4a06e');
  for (const p of map.decor.pebbles) {
    ctx.fillStyle = `rgba(122,88,56,${p.a})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlots(ctx, map) {
  for (const key of map.slotCells) {
    const [c, r] = key.split(',').map(Number);
    const { x, y } = map.cellCenter(c, r);
    ctx.fillStyle = '#8a6a42';
    ctx.strokeStyle = '#6d4f33';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(109,79,51,0.7)';
    ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(x, y + i * 7, 14, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
  }
}

function drawDecor(ctx, map) {
  for (const d of map.decor.decor) {
    if (d.kind === 'bush') {
      ctx.fillStyle = d.hue < 0.5 ? '#5d8a3f' : '#6e9c4a';
      for (const [ox, oy, r] of [[-6, 2, 8], [5, 0, 9], [0, -5, 8]]) {
        ctx.beginPath();
        ctx.arc(d.x + ox * d.s, d.y + oy * d.s, r * d.s, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.arc(d.x - 4 * d.s, d.y - 7 * d.s, 3.5 * d.s, 0, Math.PI * 2);
      ctx.fill();
    } else if (d.kind === 'rock') {
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot);
      ctx.fillStyle = '#9aa0a6';
      ctx.beginPath();
      ctx.ellipse(0, 0, 10 * d.s, 7 * d.s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.beginPath();
      ctx.ellipse(-3 * d.s, -2 * d.s, 4 * d.s, 2.5 * d.s, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.strokeStyle = '#4c7a2a';
      ctx.lineWidth = 1.6;
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.moveTo(d.x + i * 3 * d.s, d.y + 4 * d.s);
        ctx.quadraticCurveTo(d.x + i * 4 * d.s, d.y - 4 * d.s, d.x + i * 5 * d.s, d.y - 8 * d.s);
        ctx.stroke();
      }
    }
  }
}

function drawGraves(ctx) {
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

function drawCity(ctx, map) {
  const W = map.width;
  const H = map.height;
  const wallX = W - 30;
  const cx = W - 13;
  ctx.fillStyle = '#8f98a3';
  ctx.fillRect(wallX, 56, 30, H - 112);
  ctx.strokeStyle = '#6f7883';
  ctx.lineWidth = 1.5;
  for (let y = 64; y < H - 56; y += 16) {
    ctx.beginPath();
    ctx.moveTo(wallX, y);
    ctx.lineTo(wallX + 30, y);
    ctx.stroke();
  }
  ctx.fillStyle = '#8f98a3';
  for (let y = 56; y < H - 56; y += 34) {
    ctx.fillRect(wallX - 4, y, 38, 12);
  }
  const tower = (y) => {
    ctx.fillStyle = '#7d8794';
    ctx.fillRect(W - 38, y, 38, 44);
    ctx.fillStyle = '#a34a3f';
    ctx.beginPath();
    ctx.moveTo(W - 42, y);
    ctx.lineTo(W + 4, y);
    ctx.lineTo(W - 19, y - 18);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#6f7883';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W - 38, y, 38, 44);
  };
  tower(34);
  tower(H - 82);
  ctx.strokeStyle = '#5c4326';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx, 16); ctx.lineTo(cx, -4);
  ctx.stroke();
  ctx.fillStyle = '#e5484d';
  ctx.beginPath();
  ctx.moveTo(cx, -4);
  ctx.lineTo(cx + 20, 1);
  ctx.lineTo(cx, 7);
  ctx.closePath();
  ctx.fill();

  const gy = map.gate.y;
  ctx.fillStyle = '#5c4026';
  ctx.beginPath();
  ctx.moveTo(cx - 13, gy + 34);
  ctx.lineTo(cx - 13, gy - 20);
  ctx.arc(cx, gy - 20, 13, Math.PI, 0);
  ctx.lineTo(cx + 13, gy + 34);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#4a3018';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(cx - 9 + i * 6, gy - 24);
    ctx.lineTo(cx - 9 + i * 6, gy + 34);
    ctx.stroke();
  }
}

export function syncBackground(canvas, map) {
  bg = document.createElement('canvas');
  bg.width = canvas.width;
  bg.height = canvas.height;
  const bctx = bg.getContext('2d');
  const kx = bg.width / CANVAS_W;
  const ky = bg.height / CANVAS_H;
  bctx.setTransform(kx, 0, 0, ky, 0, 0);
  drawGrass(bctx, map);
  drawRoad(bctx, map);
  drawSlots(bctx, map);
  drawDecor(bctx, map);
  drawGraves(bctx);
  drawCity(bctx, map);
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

const PLANT_DRAWERS = {
  pea: drawPea,
  frost: drawFrost,
  mortar: drawMortar,
  nut: drawNut,
  cactus: drawCactus,
  coin: drawCoin,
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

function drawZombie(ctx, z, t) {
  const s = z.def.radius / 13;
  const dying = z.state === 'die';
  const k = dying ? Math.max(0, 1 - z.deathT / 0.8) : 1;
  const walk = z.state === 'walk' ? Math.sin(z.phase * 8) : Math.sin(z.phase * 20);
  const facing = z.dx >= 0 ? 1 : -1;
  ctx.save();
  ctx.globalAlpha = dying ? k : 1;
  ctx.translate(z.x, z.y + (dying ? (1 - k) * 8 : 0));
  if (dying) ctx.rotate((1 - k) * 1.4 * -facing);
  ctx.scale(s, s);
  drawShadow(ctx, 0, 16 / s, 13, 4.5);
  const chewLunge = z.state === 'chew' ? Math.max(0, Math.sin(z.phase * 18)) * 3 : 0;
  ctx.translate(facing * chewLunge, 0);
  ctx.fillStyle = '#4a3a30';
  ctx.beginPath();
  ctx.ellipse(-4 + walk * 2, 13, 3.4, 4.6, 0, 0, Math.PI * 2);
  ctx.ellipse(4 - walk * 2, 13, 3.4, 4.6, 0, 0, Math.PI * 2);
  ctx.fill();
  const bodyColor = z.type === 'boss' ? '#5c6e52' : z.type === 'armored' ? '#7d8a6a' : z.type === 'runner' ? '#8fa06a' : '#7d9e6a';
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = 'rgba(35,45,28,0.85)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.ellipse(0, 2, 9.5, 12, facing * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = bodyColor;
  ctx.strokeStyle = 'rgba(35,45,28,0.85)';
  for (const side of [-1, 1]) {
    const swing = Math.sin(z.phase * 8 + (side > 0 ? 0 : Math.PI)) * 3;
    ctx.beginPath();
    ctx.arc(facing * (8 + chewLunge) , 0 + swing * 0.5 + side * 1.5, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, -13, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#23301c';
  ctx.beginPath();
  ctx.ellipse(0, -19, 6.5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff5a4a';
  if (z.type === 'boss') {
    ctx.shadowColor = '#ff2a1a';
    ctx.shadowBlur = 5;
  }
  ctx.beginPath();
  ctx.arc(facing * 3 - 1.5, -13, 1.6, 0, Math.PI * 2);
  ctx.arc(facing * 3 + 2.5, -13, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  if (z.type === 'armored') {
    ctx.fillStyle = '#9aa3ad';
    ctx.strokeStyle = '#5f6870';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, -15, 8.6, Math.PI * 1.05, Math.PI * 1.95);
    ctx.lineTo(8, -12);
    ctx.lineTo(-8, -12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5f6870';
    for (const px of [-5, 0, 5]) {
      ctx.beginPath();
      ctx.arc(px, -21, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (z.type === 'runner') {
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 1.4;
    for (let i = 1; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(-facing * (11 + i * 4), -8 + i * 4);
      ctx.lineTo(-facing * (17 + i * 4), -8 + i * 4);
      ctx.stroke();
    }
  }
  if (z.type === 'boss') {
    ctx.fillStyle = '#c8b07a';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5 - 2, -20);
      ctx.lineTo(i * 5, -27);
      ctx.lineTo(i * 5 + 2, -20);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (z.slowT > 0 && !dying) {
    ctx.fillStyle = 'rgba(120,200,255,0.4)';
    ctx.strokeStyle = 'rgba(160,220,255,0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(0, -4, 11.5, 17, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
  if (!dying && (z.hp < z.maxHp || z.type === 'boss')) {
    const w = z.type === 'boss' ? 52 : 26;
    const pct = Math.max(0, z.hp / z.maxHp);
    drawHpBar(ctx, z.x, z.y - 24 * s - 8, w, pct, `hsl(${Math.round(pct * 110)},70%,45%)`);
  }
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
    ctx.fillStyle = '#7aa74f';
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
