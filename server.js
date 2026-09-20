import { createServer } from 'node:http';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { extname, join, normalize, dirname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ? Number(process.env.PORT) : 8000;
const DATA_DIR = join(ROOT, 'data');
const PROGRESS_FILE = join(DATA_DIR, 'progress.json');
const DEFAULT_PROGRESS = { levels: {}, updatedAt: null };
const LEGACY_LEVEL_ID = 'vorota-belgrada';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

function migrateLegacy(data) {
  const bestWave = Number(data.bestWave);
  const bestKills = Number(data.bestKills);
  if (!Number.isFinite(bestWave) || bestWave < 0 || !Number.isFinite(bestKills) || bestKills < 0) return null;
  return {
    levels: {
      [LEGACY_LEVEL_ID]: {
        completed: Boolean(data.levelCompleted),
        bestWave: Math.floor(bestWave),
        bestKills: Math.floor(bestKills),
      },
    },
    updatedAt: data.updatedAt ?? null,
  };
}

function normalizeLevels(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const levels = {};
  for (const [id, rec] of Object.entries(raw)) {
    if (typeof id !== 'string' || id.length === 0 || id.length > 64) return null;
    if (typeof rec !== 'object' || rec === null || Array.isArray(rec)) return null;
    const bestWave = Number(rec.bestWave);
    const bestKills = Number(rec.bestKills);
    if (!Number.isFinite(bestWave) || bestWave < 0) return null;
    if (!Number.isFinite(bestKills) || bestKills < 0) return null;
    levels[id] = {
      completed: Boolean(rec.completed),
      bestWave: Math.floor(bestWave),
      bestKills: Math.floor(bestKills),
    };
  }
  return levels;
}

async function readProgress() {
  try {
    const raw = await readFile(PROGRESS_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (data.levels !== undefined) {
      const levels = normalizeLevels(data.levels);
      if (levels) return { levels, updatedAt: data.updatedAt ?? null };
      return { ...DEFAULT_PROGRESS };
    }
    const migrated = migrateLegacy(data);
    return migrated ?? { ...DEFAULT_PROGRESS };
  } catch {
    return { ...DEFAULT_PROGRESS };
  }
}

function validateProgress(body) {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null;
  if (body.levels === undefined && typeof body.levelCompleted === 'boolean') {
    return migrateLegacy(body);
  }
  const levels = normalizeLevels(body.levels);
  if (!levels) return null;
  return { levels, updatedAt: new Date().toISOString() };
}

async function handleApi(req, res) {
  if (req.method === 'GET') {
    return sendJson(res, 200, await readProgress());
  }
  if (req.method === 'POST') {
    let body = '';
    let overflow = false;
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 16384) {
        overflow = true;
        req.destroy();
      }
    });
    await new Promise((resolve) => req.on('end', resolve).on('error', resolve));
    if (overflow) return sendJson(res, 413, { error: 'payload too large' });
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      return sendJson(res, 400, { error: 'invalid json' });
    }
    const clean = validateProgress(parsed);
    if (!clean) return sendJson(res, 400, { error: 'invalid progress shape' });
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(PROGRESS_FILE, JSON.stringify(clean, null, 2) + '\n', 'utf8');
    return sendJson(res, 200, { ok: true, progress: clean });
  }
  res.writeHead(405, { Allow: 'GET, POST' });
  return res.end();
}

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const filePath = normalize(join(ROOT, rel));
  if (filePath !== ROOT && !filePath.startsWith(ROOT + sep)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  try {
    const data = await readFile(filePath);
    const type = MIME[extname(filePath).toLowerCase()] ?? 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  }
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host ?? 'localhost'}`);
    if (url.pathname === '/api/progress') return await handleApi(req, res);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' });
      return res.end();
    }
    return await serveStatic(req, res, url.pathname);
  } catch (err) {
    console.error(err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('500 Internal Server Error');
  }
});

server.listen(PORT, () => {
  console.log(`Belgrade Defence → http://localhost:${PORT}`);
});
