/* Visual physics uses seconds and world units. It is illustrative, not a CFD or kinetics solver. */
const LabPhysics = (() => {
  const DENSITY = { Li: .53, Na: .97, K: .86, Mg: 1.74, Al: 2.70, Fe: 7.87, Cu: 8.96, Zn: 7.14, Ag: 10.49, Au: 19.3, Hg: 13.53 };
  function material(id) {
    const S = getSub(id);
    if (!S) return null;
    const metal = S.kind === 'el' && isMetal(S.el);
    const density = DENSITY[id] || null;
    return { id, phase: S.ph, metal, density,
      floats: density !== null && density < 1,
      soluble: S.kind === 'rg' && S.ph === 's' && !!S.dis,
      immiscible: id === 'Hg',
      roughness: metal ? .26 : S.ph === 's' ? .92 : .08,
      note: id === 'Hg' ? 'Тяжёлые капли остаются на дне и не смешиваются с водой.'
        : density && density < 1 ? 'Легче воды: держится у поверхности, пока реагирует.'
        : S.ph === 'g' ? 'Бесцветный газ не изображается дымом. Окрашенные газы видны в объёме колбы.'
        : S.ph === 's' && S.dis ? 'В воде постепенно растворяется; цвет зависит от растворённых частиц.'
        : S.ph === 's' ? 'Твёрдые частицы оседают; растворение возможно при химической реакции.'
        : S.ph === 'aq' ? 'Водный раствор. Пузырьки появляются при выделении газа или кипении.'
        : 'Жидкость. Её свойства зависят от состава и температуры.' };
  }
  // Semi-implicit Euler. All acceleration and velocity are per second.
  function stepParticle(q, dt, gravity = 0) {
    const steps = Math.max(1, Math.ceil(dt / (1 / 120))), h = dt / steps;
    for (let i = 0; i < steps; i++) {
      q.vy = (q.vy || 0) + gravity * h;
      q.x += (q.vx || 0) * h; q.y += q.vy * h; q.z += (q.vz || 0) * h;
    }
    return q;
  }
  const ease = (rate, dt) => 1 - Math.exp(-rate * dt);
  // Fractional emission avoids rounding a positive rate up once on every frame.
  function emit(pool, rate, dt, create) {
    pool.carry = (pool.carry || 0) + Math.max(0, rate) * dt;
    const count = Math.min(pool.n - pool.list.length, Math.floor(pool.carry));
    pool.carry -= Math.floor(pool.carry);
    for (let i = 0; i < count; i++) pool.list.push(create());
  }
  function consumed(id, events) {
    const S = getSub(id);
    return !!S && events.some(e => e.kind === 'rx' && e.subs.some(s =>
      s.eq.r.some(t => t.f === S.f) && !s.eq.p.some(t => t.f === S.f)));
  }
  return { material, stepParticle, ease, emit, consumed };
})();
if (typeof module !== 'undefined') module.exports = LabPhysics;
