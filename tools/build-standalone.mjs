// Собирает игру в один самодостаточный HTML-файл (без сервера, без npm в рантайме).
// Запуск: npm run build  →  dist/belgrade-defence.html
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'dist');
const OUT_FILE = join(OUT_DIR, 'belgrade-defence.html');

const [html, css] = await Promise.all([
  readFile(join(ROOT, 'index.html'), 'utf8'),
  readFile(join(ROOT, 'styles.css'), 'utf8'),
]);

const result = await build({
  entryPoints: [join(ROOT, 'src', 'main.js')],
  bundle: true,
  format: 'iife',
  target: 'es2020',
  minify: true,
  charset: 'utf8',
  legalComments: 'none',
  write: false,
});
const js = result.outputFiles[0].text;

const doc = html
  .replace('<link rel="stylesheet" href="styles.css">', `<style>\n${css}\n</style>`)
  .replace('<script type="module" src="src/main.js"></script>', `<script>\n${js}\n</script>`)
  .replace('<title>Belgrade Defence</title>', '<title>Belgrade Defence</title>\n  <meta name="description" content="Belgrade Defence — браузерный tower defense: растения против зомби.">');

if (doc === html || doc.includes('src/main.js')) {
  throw new Error('Не удалось подставить CSS/JS в index.html — проверь разметку');
}

await mkdir(OUT_DIR, { recursive: true });
await writeFile(OUT_FILE, doc, 'utf8');

const kb = (Buffer.byteLength(doc) / 1024).toFixed(1);
console.log(`Belgrade Defence → ${OUT_FILE} (${kb} KB)`);
