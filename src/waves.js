const ENDLESS_WAVES = 200;

export function endlessWaveAt(index) {
  const n = index + 1;
  const every = Math.max(0.75, 2.1 - index * 0.03);
  const entries = [{
    type: 'normal',
    count: Math.min(30, 5 + Math.floor(index * 1.3)),
    every: Math.round(every * 100) / 100,
    delay: 1,
  }];
  if (n >= 3) {
    entries.push({
      type: 'runner',
      count: Math.min(16, 2 + Math.floor((n - 2) * 0.9)),
      every: Math.max(0.9, Math.round((every + 0.3) * 100) / 100),
      delay: 4,
    });
  }
  if (n >= 5) {
    entries.push({
      type: 'armored',
      count: Math.min(10, 1 + Math.floor((n - 4) / 2)),
      every: 5,
      delay: 8,
    });
  }
  if (n >= 8) {
    entries.push({
      type: 'flyer',
      count: Math.min(12, 1 + Math.floor((n - 7) / 2)),
      every: Math.max(1.2, Math.round((every + 0.4) * 100) / 100),
      delay: 6,
    });
  }
  if (n % 10 === 0) {
    entries.unshift({ type: 'boss', count: Math.floor(n / 10), every: 6, delay: 10 });
  }
  return entries;
}

export function buildEndlessWaves() {
  return Array.from({ length: ENDLESS_WAVES }, (_, i) => endlessWaveAt(i));
}
