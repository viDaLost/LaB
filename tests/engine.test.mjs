// Проверки химического движка: полнота, баланс уравнений, справочные ΔH, температура.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../src/engine.js');

const IDS = [...E.ELS.map(e => e.sym), ...E.REAGENTS.map(r => r.id)];

test('все пары веществ анализируются без исключений, с нагревом и без', () => {
  let n = 0;
  for (const heat of [false, true]) {
    for (const a of IDS) E.analyze([a], heat);
    for (let i = 0; i < IDS.length; i++) for (let j = i + 1; j < IDS.length; j++) { E.analyze([IDS[i], IDS[j]], heat); n++; }
  }
  assert.ok(n > 20000, `проверено пар: ${n}`);
});

test('все записанные уравнения сходятся по атомам и заряду', () => {
  for (const k of Object.keys(E.CUR)) for (const h of [false, true]) E.analyze(k.split('+'), h);
  assert.deepEqual([...new Set(E.BAD_EQ)], []);
});

test('ΔH° совпадает со справочными значениями', () => {
  const dH = (ids, heat) => E.analyze(ids, heat)[0].subs[0].eq.dH;
  assert.equal(dH(['hcl', 'naoh']), -55.8);   // нейтрализация
  assert.equal(dH(['Na', 'h2o']), -368.6);    // 2Na + 2H2O
  assert.equal(dH(['H', 'O'], true), -571.6); // гремучий газ
  assert.equal(dH(['agno3', 'nacl']), -65.4); // осаждение AgCl
  assert.equal(dH(['caco3'], true), 179.2);   // обжиг известняка
});

test('ряд активности и растворимость', () => {
  assert.equal(E.analyze(['Cu', 'hcl'], false)[0].kind, 'none');
  assert.equal(E.analyze(['Zn', 'hcl'], false)[0].kind, 'rx');
  assert.equal(E.analyze(['nacl', 'kbr'], false)[0].kind, 'none');
  const naCu = E.analyze(['Na', 'cuso4'], false)[0];
  assert.ok(naCu.subs.some(s => s.eq.p.some(t => t.f === 'Cu(OH)2')), 'натрий в купоросе даёт Cu(OH)2, а не медь');
});

test('температурные пороги, замерзание, кипение', () => {
  const kinds = (ids, T) => E.analyzeT(ids, T).map(e => e.kind + ':' + e.type);
  assert.match(kinds(['S', 'O'], 200)[0], /^none/);
  assert.match(kinds(['S', 'O'], 300)[0], /^rx/);
  assert.match(kinds(['caco3'], 500)[0], /^info/);
  assert.match(kinds(['caco3'], 850)[0], /^rx/);
  assert.match(kinds(['nacl', 'agno3'], -10)[0], /Замерзание/);
  assert.ok(kinds(['hcl', 'naoh'], 110).some(k => /Кипение/.test(k)));
  assert.equal(E.requiredT(['Al', 'fe2o3']), 850);
});

test('каталог коллекции', () => {
  const c = E.catalog();
  assert.ok(c.length >= 90);
  assert.ok(c.every(x => x.rarity >= 0 && x.rarity <= 3));
});
