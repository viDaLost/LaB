// Собирает игру в один файл dist/index.html (+ локальная копия Three.js).
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = f => readFileSync(join(root, 'src', f), 'utf8');
const dist = join(root, 'dist');

const lab = `${src('lab3d.js')}\n${src('lab2d.js')}\nconst Lab = Lab3D || Lab2D;\n`;
const ui = src('ui.js');
if (!ui.includes('/*LAB*/')) throw new Error('src/ui.js: нет метки /*LAB*/');

let html = src('app.html');
const parts = {
  '/*STYLES*/': src('styles.css'),
  '<!--THREE-->': '<script src="vendor/three.min.js"></script>',
  '<!--ENGINE-->': `<script>\n${src('engine.js')}</script>`,
  '<!--MISSIONS-->': `<script>\n${src('missions.js')}</script>`,
  '<!--UI-->': `<script>\n${ui.replace('/*LAB*/', () => lab)}</script>`
};
for (const [mark, code] of Object.entries(parts)) {
  if (!html.includes(mark)) throw new Error(`src/app.html: нет метки ${mark}`);
  html = html.replace(mark, () => code);
}

rmSync(dist, { recursive: true, force: true });
mkdirSync(join(dist, 'vendor'), { recursive: true });
writeFileSync(join(dist, 'index.html'), html);
copyFileSync(join(root, 'vendor', 'three.min.js'), join(dist, 'vendor', 'three.min.js'));
writeFileSync(join(dist, '.nojekyll'), '');
console.log(`dist/index.html собран: ${(html.length / 1024).toFixed(0)} КБ`);
