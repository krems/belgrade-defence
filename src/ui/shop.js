import { PLANTS, PLANT_KEYS, ECONOMY } from '../balance.js';
import { drawPlantShape } from '../render.js';
import { showTooltip, hideTooltip } from './hud.js';

const PLANT_HOTKEYS = ['1', '2', '3', '4', '5', '6'];

let shovelCard = null;
let cards = new Map();

function statLines(def) {
  const lines = [];
  if (def.dmg && def.rate) lines.push(`Урон ${def.dmg} · ${def.rate}/с · радиус ${def.range}`);
  if (def.dps && def.slow) lines.push(`Аура ${def.range}: −${Math.round(def.slow * 100)}% скорости, ${def.dps} урона/с`);
  if (def.splash) lines.push(`${def.dmg} урона · площадь ${def.splash} · перезарядка ${def.cooldown} с · дальность ${def.rangeMin}–${def.rangeMax}`);
  if (def.hp && def.onRoad && def.key === 'nut') lines.push(`Прочность ${def.hp} · грызутся 25/с`);
  if (def.dps && def.onRoad && def.key === 'cactus') lines.push(`${def.dps} урона/с · износ ${def.hp}`);
  if (def.income) lines.push(`+${def.income} монет каждые ${def.every} с`);
  lines.push(`Возврат лопатой: ${Math.floor(def.cost * ECONOMY.sellRefund)}`);
  return lines;
}

function tooltipHtml(title, lines) {
  return `<b>${title}</b>` + lines.map((l) => `<div class="tip-line">${l}</div>`).join('');
}

export function initShop(controls) {
  const shop = document.getElementById('shop');
  PLANT_KEYS.forEach((type, i) => {
    const def = PLANTS[type];
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.type = type;
    const key = document.createElement('span');
    key.className = 'key';
    key.textContent = PLANT_HOTKEYS[i];
    const icon = document.createElement('canvas');
    icon.width = 52;
    icon.height = 52;
    const ictx = icon.getContext('2d');
    ictx.save();
    ictx.translate(26, 30);
    ictx.scale(0.82, 0.82);
    drawPlantShape(ictx, type, 0, 0, 1.2);
    ictx.restore();
    const price = document.createElement('span');
    price.className = 'price';
    price.textContent = def.cost;
    card.append(key, icon, price);
    card.addEventListener('click', () => controls.selectPlant(type));
    card.addEventListener('mouseenter', (e) => {
      showTooltip(tooltipHtml(`${def.icon} ${def.name}`, [def.desc, ...statLines(def)]), e.clientX, e.clientY);
    });
    card.addEventListener('mousemove', (e) => {
      showTooltip(tooltipHtml(`${def.icon} ${def.name}`, [def.desc, ...statLines(def)]), e.clientX, e.clientY);
    });
    card.addEventListener('mouseleave', hideTooltip);
    shop.appendChild(card);
    cards.set(type, card);
  });
  const sep = document.createElement('div');
  sep.className = 'shop-sep';
  shop.appendChild(sep);
  shovelCard = document.createElement('div');
  shovelCard.className = 'card shovel';
  const key = document.createElement('span');
  key.className = 'key';
  key.textContent = 'S';
  const icon = document.createElement('canvas');
  icon.width = 52;
  icon.height = 52;
  const ictx = icon.getContext('2d');
  ictx.save();
  ictx.translate(26, 26);
  ictx.rotate(-0.6);
  ictx.strokeStyle = '#8a6236';
  ictx.lineWidth = 4;
  ictx.lineCap = 'round';
  ictx.beginPath();
  ictx.moveTo(0, -16);
  ictx.lineTo(0, 6);
  ictx.stroke();
  ictx.strokeStyle = '#5c4326';
  ictx.lineWidth = 3.5;
  ictx.beginPath();
  ictx.arc(0, -18, 4, 0, Math.PI * 2);
  ictx.stroke();
  ictx.fillStyle = '#aeb6bd';
  ictx.strokeStyle = '#6f7883';
  ictx.lineWidth = 1.5;
  ictx.beginPath();
  ictx.moveTo(-6, 5);
  ictx.lineTo(6, 5);
  ictx.lineTo(5, 16);
  ictx.quadraticCurveTo(0, 21, -5, 16);
  ictx.closePath();
  ictx.fill();
  ictx.stroke();
  ictx.restore();
  shovelCard.append(key, icon);
  shovelCard.addEventListener('click', controls.selectShovel);
  shovelCard.addEventListener('mouseenter', (e) => showTooltip('<b>🪏 Лопата</b><div class="tip-line">Выкопать растение, вернув 50% цены. Работает и в бою. ПКМ/Esc — отменить.</div>', e.clientX, e.clientY));
  shovelCard.addEventListener('mousemove', (e) => showTooltip('<b>🪏 Лопата</b><div class="tip-line">Выкопать растение, вернув 50% цены. Работает и в бою. ПКМ/Esc — отменить.</div>', e.clientX, e.clientY));
  shovelCard.addEventListener('mouseleave', hideTooltip);
  shop.appendChild(shovelCard);
}

export function updateShop(g) {
  const active = g.screen === 'planning' || g.screen === 'wave';
  const unlocked = new Set(g.level.unlockedPlants);
  for (const [type, card] of cards) {
    const def = PLANTS[type];
    const hidden = active && !unlocked.has(type);
    card.classList.toggle('hidden-plant', hidden);
    const poor = g.coins < def.cost;
    card.classList.toggle('disabled', !active || poor);
    card.classList.toggle('selected', active && g.selection.mode === 'plant' && g.selection.type === type);
    card.querySelector('.price').classList.toggle('poor', active && poor);
  }
  shovelCard.classList.toggle('disabled', !active);
  shovelCard.classList.toggle('selected', active && g.selection.mode === 'shovel');
}
