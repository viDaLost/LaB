// Браузерная проверка собранной игры: вся кампания, мобильный экран, отсутствие ошибок.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { serve } from './serve.mjs';

const SOLUTIONS = ['hcl naoh', 'nahco3 ch3cooh', 'agno3 nacl', 'caoh2 co2', 'naoh php', 'Na h2o', 'Zn hcl', 'Cu agno3', 'Fe cuso4', 'Cu hno3', 'Al fe2o3 !',
  'pbno3 ki', 'cuso4 naoh', 'fecl3 naoh', 'fecl3 kscn', 'fecl3 k4fecn6', 'kmno4 naoh glucose', 'S O !', 'H O !', 'nh4cl h2o', 'srcl2 !', 'Mg co2 !', 'Xe F !',
  'h2o2 mno2', 'luminol h2o2 fecl3', 'agno3 glucose nh3', 'h2o2 h2so4 ki starch', 'Cl kbr', 'sucrose h2so4c'];
let server, browser, url;
const launch = { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] };
if (process.env.CHROMIUM_PATH) launch.executablePath = process.env.CHROMIUM_PATH;

before(async () => { server = await serve(); url = `http://127.0.0.1:${server.address().port}/`; browser = await chromium.launch(launch); });
after(async () => { await browser?.close(); server?.close(); });

function watchErrors(page) {
  const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); });
  return errs;
}

test('3D-сцена запускается', async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } }); const errs = watchErrors(page);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.click('[data-go="free"]');
  assert.ok(await page.evaluate(() => !!document.getElementById('lab3d')), 'нет WebGL-холста');
  await page.click('[data-show="0"]'); await page.waitForTimeout(1500);
  assert.deepEqual(errs, []); await page.close();
});

test('кампания проходится целиком на три звезды', { timeout: 600000 }, async () => {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' }); const errs = watchErrors(page);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.click('#ctaPlay');
  for (let i = 0; i < SOLUTIONS.length; i++) {
    const parts = SOLUTIONS[i].split(' ');
    for (const id of parts.filter(x => x !== '!')) await page.click(`.ing[data-id="${id}"]`);
    if (parts.includes('!')) await page.click('[data-t="900"]');
    await page.click('#go');
    await page.waitForSelector('#modal:not([hidden])', { timeout: 8000 }).catch(() => { throw new Error(`миссия ${i + 1} (${SOLUTIONS[i]}) не засчитана`); });
    await page.click(i < SOLUTIONS.length - 1 ? '#mNext' : '#mMap');
  }
  assert.match(await page.textContent('#mapStars'), /87 \/ 87/);
  assert.deepEqual(errs, []); await page.close();
});

test('телефон: вёрстка без горизонтальной прокрутки, «Очистить» убирает струю', async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }); const errs = watchErrors(page);
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.tap('#ctaPlay');
  await page.tap('.ing[data-id="hcl"]'); await page.tap('.ing[data-id="nacl"]'); await page.tap('#go');
  await page.waitForTimeout(1300); await page.tap('#clear'); await page.waitForTimeout(3000);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 390);
  assert.equal(await page.isHidden('#resCard'), true, 'карточка результата не должна появиться после очистки');
  assert.deepEqual(errs, []); await page.close();
});
