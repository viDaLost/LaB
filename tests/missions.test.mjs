// Каждая миссия кампании решаема, и её нельзя пройти любым набором с полки.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const E = require('../src/engine.js');
const { MISSIONS } = require('../src/missions.js');

const IND = ['php', 'starch'];
const combos = (arr, k) => { if (!k) return [[]]; if (arr.length < k) return []; const [h, ...t] = arr; return [...combos(t, k - 1).map(c => [h, ...c]), ...combos(t, k)]; };

for (const m of MISSIONS) {
  test(`миссия ${m.n}: ${m.t}`, () => {
    const core = m.shelf.filter(x => !IND.includes(x)), ind = m.shelf.filter(x => IND.includes(x));
    const indSets = [[], ...ind.map(i => [i])];
    let total = 0, solved = 0;
    for (const T of m.heat ? [25, 900] : [25]) for (let k = 1; k <= 3; k++) for (const c of combos(core, k)) for (const is of indSets) {
      total++; if (m.check(E.analyzeT([...c, ...is], T))) solved++;
    }
    assert.ok(solved > 0, 'нет ни одного решения');
    assert.ok(solved < total / 2, `слишком легко: ${solved} из ${total}`);
  });
}
