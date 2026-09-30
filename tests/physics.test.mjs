import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const context = vm.createContext({ module: { exports: {} }, console });
vm.runInContext(readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8'), context);
const E = context.module.exports;
vm.runInContext(readFileSync(new URL('../src/physics.js', import.meta.url), 'utf8'), context);
const P = context.module.exports;

test('плавучесть, растворимость и тяжёлые капли различаются', () => {
  assert.equal(P.material('Na').floats, true);
  assert.equal(P.material('Cu').floats, false);
  assert.equal(P.material('Hg').immiscible, true);
  assert.equal(P.material('nahco3').soluble, true);
  assert.equal(P.material('mno2').soluble, false);
});
test('катализатор остаётся, расходуется только участвующий реагент', () => {
  const events = E.analyze(['h2o2', 'mno2'], false);
  assert.equal(P.consumed('mno2', events), false);
  assert.equal(P.consumed('h2o2', events), true);
  assert.equal(P.consumed('Cu', E.analyze(['Cu', 'hcl'], false)), false);
  assert.equal(P.consumed('Zn', E.analyze(['Zn', 'hcl'], false)), true);
  assert.equal(events.some(e => e.fx.foam), false);
});
test('частицы и эмиссия дают сходный результат при 30 и 120 FPS', () => {
  const simulate = fps => {
    const q = { x: 0, y: 5, z: 0, vx: .5, vy: 0 };
    const pool = { n: 1000, list: [] };
    for (let i = 0; i < fps * 2; i++) { P.stepParticle(q, 1 / fps, -1); P.emit(pool, 31.5, 1 / fps, () => ({})); }
    return { q, count: pool.list.length };
  };
  const a = simulate(30), b = simulate(120);
  assert.ok(Math.abs(a.q.y - b.q.y) < .03);
  assert.ok(Math.abs(a.q.x - b.q.x) < 1e-10);
  assert.ok(Math.abs(a.count - b.count) <= 1);
  assert.ok(a.count >= 62 && a.count <= 63);
});
test('пауза не меняет положение и не порождает частицы', () => {
  const q = { x: 1, y: 2, z: 3, vx: 4, vy: 5 };
  const before = { ...q }, pool = { n: 10, list: [] };
  P.stepParticle(q, 0, -10); P.emit(pool, 100, 0, () => ({}));
  assert.deepEqual(q, before); assert.equal(pool.list.length, 0);
});
test('фазовые переходы воды не применяются к концентрированной кислоте', () => {
  for (const T of [-20, 110, 900]) assert.equal(E.analyzeT(['h2so4c'], T).some(e => ['Замерзание', 'Кипение', 'Выпаривание'].includes(e.type)), false);
  assert.equal(E.freezePoint(['h2o']), 0);
  assert.equal(E.freezePoint(['h2o', 'sucrose']), -7);
  assert.equal(E.rateAt(900), E.rateAt(65));
});

test('нагретый иод может плавиться; сера плавится до 300 °C', () => {
  assert.ok(E.analyzeT(['I'], 100).some(e => e.type === 'Возгонка'));
  assert.ok(E.analyzeT(['I'], 120).some(e => e.type === 'Плавление иода'));
  assert.ok(E.analyzeT(['I'], 190).some(e => e.type === 'Кипение иода'));
  assert.ok(E.analyzeT(['S'], 120).some(e => e.type === 'Плавление серы'));
});
