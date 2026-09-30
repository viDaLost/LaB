/* ---------- Колба (canvas) ---------- */
const Lab2D = Lab3D ? null : (() => {
  const cv = $('#lab'), ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, tok = {}, tokT = 0;
  let sc = null, parts = [], rxT = -1, fx = {}, heat = false, T = 25, paused = false, clock = 0, lastNow = 0, speed = 1;
  const rgb = h => h ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : null;
  const lerp = (a, b, t) => a + (b - a) * t;
  const mixRGB = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function resize() {
    const r = cv.getBoundingClientRect(); dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  }
  function tokens(now) {
    if (now - tokT < 800 && tok.glass) return tok;
    const cs = getComputedStyle(document.documentElement);
    tok = { glass: cs.getPropertyValue('--glass').trim(), ink: cs.getPropertyValue('--ink').trim(), accent: cs.getPropertyValue('--accent').trim(), muted: cs.getPropertyValue('--muted').trim() };
    tokT = now; return tok;
  }
  function geo() {
    const baseY = H * 0.74, fh = Math.min(H * 0.62, 240), bw = Math.min(W * 0.6, fh * 0.98), nw = bw * 0.24, cx = W / 2;
    const y0 = baseY - fh, y1 = y0 + fh * 0.26;
    return { cx, baseY, fh, bw, nw, y0, y1, r: bw * 0.07 };
  }
  function flask(g) {
    ctx.beginPath();
    ctx.moveTo(g.cx - g.nw / 2, g.y0);
    ctx.lineTo(g.cx - g.nw / 2, g.y1);
    ctx.lineTo(g.cx - g.bw / 2 + g.r * 0.3, g.baseY - g.r);
    ctx.quadraticCurveTo(g.cx - g.bw / 2, g.baseY, g.cx - g.bw / 2 + g.r, g.baseY);
    ctx.lineTo(g.cx + g.bw / 2 - g.r, g.baseY);
    ctx.quadraticCurveTo(g.cx + g.bw / 2, g.baseY, g.cx + g.bw / 2 - g.r * 0.3, g.baseY - g.r);
    ctx.lineTo(g.cx + g.nw / 2, g.y1);
    ctx.lineTo(g.cx + g.nw / 2, g.y0);
  }
  const halfW = (g, y) => y <= g.y1 ? g.nw / 2 : lerp(g.nw / 2, g.bw / 2, (y - g.y1) / (g.baseY - g.y1));

  function setScene(ids, h) {
    heat = h; rxT = -1; fx = {}; parts = [];
    const subs = ids.map(getSub);
    const liquids = subs.filter(S => S.kind === 'rg' && (S.ph === 'aq' || S.ph === 'l'));
    const wet = liquids.length > 0;
    const ionCols = [];
    for (const S of subs) if (S.kind === 'rg' && (wet || S.ph !== 's') && (S.ph !== 's' || S.dis)) for (const [i] of (S.ions || [])) if (ION_COLOR[i]) ionCols.push(ION_COLOR[i]);
    if (wet && subs.some(S => S.kind === 'el' && S.el.sym === 'Br')) ionCols.push('#e0892f');
    const liqEl = subs.filter(S => S.kind === 'el' && S.el.st === 'l');
    let level = wet ? 0.3 + 0.1 * liquids.length : 0;
    const solids = [];
    subs.forEach((S, k) => {
      if (S.kind === 'el') {
        const e = S.el;
        if (e.st === 's') solids.push({ id: S.id, col: ELCOLOR[e.sym] || (isMetal(e) ? '#a3abb4' : '#bdbdbd'), shape: isMetal(e) ? 'chunk' : 'powder', k });
        if (e.st === 'l' && (!wet || e.sym === 'Hg')) solids.push({ id: S.id, col: ELCOLOR[e.sym] || '#999', shape: 'drop', k });
      } else if (S.ph === 's') solids.push({ id: S.id, col: RCOLOR[S.id] || '#eeeeee', shape: 'powder', k });
    });
    const gases = subs.filter(S => S.ph === 'g').map(S => S.kind === 'el' ? GASCOLOR[S.f] : null).filter(Boolean);
    if (!wet && liqEl.some(S => S.el.sym === 'Br')) gases.push('#9c3a17');
    const base = rgb(mixColors(ionCols) || '#cfe3f2');
    const ph = subs.some(S => S.id === 'php') && subs.some(S => ['naoh', 'caoh2', 'nh3', 'na2co3'].includes(S.id)) && !subs.some(S => S.acid);
    sc = { wet, level, initialLevel: level, aqueous: aqueousMedium(ids), fp: freezePoint(ids), col: ph ? rgb('#d6246e') : base, colA: mixColors(ionCols) || ph ? 0.72 : 0.28, to: null, toA: null, solids, gas: gases.length ? rgb(mixColors(gases)) : null, gasA: gases.length ? .3 : 0, ppt: null, pptAmt: 0, coat: null, coatT: 0, shrink: 1 };
    $('#temp').hidden = true;
  }
  function react(events, opt = {}) {
    speed = opt.speed || 1;
    sc.solids.forEach(s => s.consumed = LabPhysics.consumed(s.id, events));
    fx = {};
    let sol;
    let seq = null;
    for (const e of events) { for (const k in e.fx) { if (k === 'sol') { if (e.fx.sol !== undefined) sol = e.fx.sol; } else if (k === 'solSeq') { seq = (seq || []).concat(e.fx.solSeq); } else if (e.fx[k]) fx[k] = e.fx[k]; } }
    if (seq && sc) {
      if (!sc.wet) { sc.wet = true; sc.level = .32; }
      const start = sc.col.slice();
      sc.seq = seq.sort((a, b) => a[0] - b[0]).map(([t, c]) => [t, c ? rgb(c) : start]);
      sol = undefined; sc.to = null;
    } else if (sc) sc.seq = null;
    if (sc && sc.wet && sol !== undefined) { sc.to = rgb(sol || '#cfe3f2'); sc.toA = sol ? 0.72 : 0.28; }
    if (sc && !sc.wet && sol) { sc.wet = true; sc.level = 0.3; sc.col = rgb(sol); sc.colA = 0; sc.to = rgb(sol); sc.toA = .7; }
    if (fx.ppt) sc.ppt = rgb(fx.ppt);
    if (fx.deposit || fx.coat) sc.coat = rgb(fx.deposit || fx.coat);
    if (fx.gas) { sc.gasTo = rgb(fx.gas); }
    if (fx.gasFade) sc.gasTo = 'fade';
    const dHs = events.flatMap(e => e.subs.map(s => s.eq.dH)).filter(v => v != null);
    const rx = events.some(e => e.kind === 'rx' || e.kind === 'phys' || e.kind === 'flame');
    const t = $('#temp');
    if (rx && dHs.length) { const d = dHs[0]; t.hidden = false; t.textContent = d < 0 ? 'тепло выделяется' : d > 0 ? 'тепло поглощается' : 'ΔH ≈ 0'; t.style.color = `var(--${d < 0 ? 'exo' : d > 0 ? 'endo' : 'muted'})`; }
    else t.hidden = true;
    if (fx.frost) { t.hidden = false; t.textContent = 'колба холодеет'; t.style.color = 'var(--endo)'; }
    rxT = clock; parts = [];
    if (RM.matches) { finish(); }
    queueMicrotask(() => opt.onReady?.()); return 0;
  }
  function finish() {
    if (!sc) return;
    if (sc.to) { sc.col = sc.to; sc.colA = sc.toA; sc.to = null; }
    if (sc.seq) { sc.col = sc.seq[sc.seq.length - 1][1]; sc.colA = .78; sc.seq = null; }
    if (sc.ppt) sc.pptAmt = 1;
    if (sc.coat) sc.coatT = 1;
    if (fx.dissolve) sc.shrink = .45;
    if (sc.gasTo) { if (sc.gasTo === 'fade') sc.gasA = 0; else { sc.gas = sc.gasTo; sc.gasA = .35; } sc.gasTo = null; }
  }
  function spawn(now, g, p, dt) {
    if (T <= sc.fp || fx.ice || paused || dt === 0) return;
    const k = dt * 60;
    const lqY = sc.wet ? g.baseY - sc.level * (g.baseY - g.y1) : g.baseY - 6;
    const rnd = Math.random;
    if (fx.bubbles && p < 5.5 && rnd() < Math.min(1, .55 * k)) {
      for (let i = 0; i < (fx.foam ? 3 : 1); i++) {
        const y = g.baseY - 6 - rnd() * 10, hw = halfW(g, y) - 10;
        parts.push({ t: 'b', x: g.cx + (rnd() * 2 - 1) * hw * (fx.dissolve ? .4 : 1), y, r: 1.5 + rnd() * (fx.foam ? 4 : 2.5), vy: -(0.6 + rnd() * 1.2), top: lqY, life: 1 });
      }
    }
    if (sc.ppt && p > .3 && p < 2.6 && rnd() < .8 * k) {
      const y = lqY + 4 + rnd() * 20, hw = halfW(g, y) - 8;
      parts.push({ t: 'p', x: g.cx + (rnd() * 2 - 1) * hw, y, r: 1 + rnd() * 1.8, vy: .35 + rnd() * .5, life: 1 });
    }
    if (fx.smoke && p < 4.5 && rnd() < .5 * k) parts.push({ t: 's', x: g.cx + (rnd() - .5) * g.nw * .5, y: g.y1, r: 6 + rnd() * 8, vy: -(0.4 + rnd() * .6), vx: (rnd() - .5) * .4, life: 1, col: rgb(fx.smoke) });
    if (fx.steam && p < 6 && rnd() < .35 * k) parts.push({ t: 's', x: g.cx + (rnd() - .5) * g.nw * .4, y: g.y0, r: 5 + rnd() * 6, vy: -(0.5 + rnd() * .5), vx: (rnd() - .5) * .5, life: 1, col: [235, 240, 245] });
    if (fx.sparks && p < 2.2) for (let i = 0; i < Math.floor(3 * k + rnd()); i++) { const a = -Math.PI / 2 + (rnd() - .5) * 2.2, v = 2 + rnd() * 4; parts.push({ t: 'k', x: g.cx, y: g.baseY - 14, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, col: rgb(fx.sparks) }); }
    if (fx.gasTop && p < 4 && rnd() < .3 * k) parts.push({ t: 's', x: g.cx + (rnd() - .5) * g.nw * .4, y: g.y0 + 4, r: 4 + rnd() * 5, vy: -(0.3 + rnd() * .4), vx: (rnd() - .5) * .3, life: 1, col: rgb(fx.gasTop) });
  }
  function drawBurner(g, now) {
    const by = g.baseY + 10;
    ctx.fillStyle = rgba(rgb(hexish(tok.muted)), .5);
    ctx.fillRect(g.cx - g.bw / 2 - 6, by - 2, g.bw + 12, 3);
    const bx = g.cx, bt = H - 10;
    ctx.fillStyle = rgba(rgb(hexish(tok.muted)), .75);
    ctx.fillRect(bx - 8, by + 26, 16, bt - by - 26);
    ctx.fillRect(bx - 22, bt - 6, 44, 6);
    if (heat) {
      const f = 1 + Math.sin(now / 70) * .06 + Math.sin(now / 37) * .04;
      const top = by + 26 - 30 * f;
      const grd = ctx.createLinearGradient(0, top, 0, by + 26);
      grd.addColorStop(0, 'rgba(90,140,255,0)'); grd.addColorStop(.5, 'rgba(70,120,255,.65)'); grd.addColorStop(1, 'rgba(40,90,240,.9)');
      ctx.fillStyle = grd; ctx.beginPath(); ctx.moveTo(bx - 7, by + 26); ctx.quadraticCurveTo(bx - 6, top + 10, bx, top); ctx.quadraticCurveTo(bx + 6, top + 10, bx + 7, by + 26); ctx.fill();
    }
  }
  function hexish(c) { if (c.startsWith('#') && c.length === 7) return c; const d = document.createElement('div'); d.style.color = c; document.body.appendChild(d); const m = getComputedStyle(d).color.match(/\d+/g); d.remove(); return '#' + m.slice(0, 3).map(v => (+v).toString(16).padStart(2, '0')).join(''); }
  function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min(.25, (now - (lastNow || now)) / 1000); lastNow = now;
    if (paused || document.hidden || RM.matches || $('#scrLab').hidden) dt = 0;
    clock += dt * 1000; now = clock;
    if ($('#scrLab').hidden) return;
    if (!W) resize(); if (!W || !sc) return;
    tokens(now);
    const p = rxT < 0 ? -1 : RM.matches ? 9 : (now - rxT) / 1000 * speed;
    const frozen = sc.wet && (T <= sc.fp || fx.ice);
    const step = dt * 60;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    let shx = 0, shy = 0;
    if (fx.boom && p >= 0 && p < .6 && !RM.matches && !paused) { const k = (1 - p / .6) * 6; shx = (Math.random() - .5) * k; shy = (Math.random() - .5) * k; }
    ctx.translate(shx, shy);
    const g = geo();
    if (p >= 0 && !RM.matches) {
      const k = Math.min(1, Math.max(0, (p - .3) / 2.5));
      if (sc.to) { sc.col = mixRGB(sc.col, sc.to, LabPhysics.ease(1 + k * 3, dt)); sc.colA = lerp(sc.colA, sc.toA, LabPhysics.ease(2, dt)); }
      if (sc.seq) {
        const q = sc.seq; let i = 0; while (i < q.length - 1 && p >= q[i + 1][0]) i++;
        if (i >= q.length - 1) sc.col = q[q.length - 1][1];
        else { const [t0, c0] = q[i], [t1, c1] = q[i + 1]; const u = Math.max(0, Math.min(1, (p - t0) / Math.max(.3, (t1 - t0) * .6))); sc.col = mixRGB(c0, c1, u < 1 ? u : 1); }
        sc.colA = lerp(sc.colA, .78, LabPhysics.ease(3, dt));
      }
      if (sc.ppt && p > .6) sc.pptAmt = Math.min(1, sc.pptAmt + .36 * dt);
      if (sc.coat) sc.coatT = Math.min(1, sc.coatT + .36 * dt);
      if (fx.dissolve) sc.shrink = Math.max(.45, sc.shrink - .09 * dt);
      if (sc.gasTo) { if (sc.gasTo === 'fade') sc.gasA = Math.max(0, sc.gasA - .24 * dt); else { sc.gas = sc.gas ? mixRGB(sc.gas, sc.gasTo, LabPhysics.ease(2, dt)) : sc.gasTo; sc.gasA = Math.min(.35, sc.gasA + .24 * dt); } }
      spawn(now, g, p, dt);
    }
    drawBurner(g, now);
    const glass = rgb(hexish(tok.glass));
    // газ внутри
    ctx.save(); flask(g); ctx.closePath(); ctx.clip();
    if (sc.gas && sc.gasA > 0) { ctx.fillStyle = rgba(sc.gas, sc.gasA); ctx.fillRect(0, g.y0, W, g.baseY - g.y0); }
    // жидкость
    const lqY = g.baseY - sc.level * (g.baseY - g.y1);
    if (sc.wet) {
      const wob = p >= 0 && p < 1.5 && !RM.matches ? Math.sin(now / 90) * 3 * (1 - p / 1.5) : 0;
      ctx.fillStyle = frozen ? '#c9e5f5' : rgba(sc.col, sc.colA);
      ctx.beginPath(); ctx.moveTo(0, lqY + wob); ctx.quadraticCurveTo(g.cx, lqY - wob, W, lqY + wob); ctx.lineTo(W, g.baseY + 2); ctx.lineTo(0, g.baseY + 2); ctx.fill();
      ctx.fillStyle = rgba(sc.col, Math.min(1, sc.colA + .2)); ctx.fillRect(0, lqY + wob - 1, W, 2);
    }
    // осадок
    if (sc.ppt && sc.pptAmt > 0) { const hh = 4 + sc.pptAmt * 14; ctx.fillStyle = rgba(sc.ppt, .95); ctx.beginPath(); ctx.ellipse(g.cx, g.baseY, g.bw / 2 - 4, hh, 0, Math.PI, 0); ctx.fill(); }
    // твёрдые вещества
    sc.solids.forEach((s, i) => {
      const n = sc.solids.length, x = g.cx + (i - (n - 1) / 2) * Math.min(56, g.bw / (n + 1)), y = g.baseY - 4;
      const m = LabPhysics.material(s.id);
      const dissolved = sc.wet && m.soluble && p >= 0 ? Math.exp(-p * .65) : 1;
      const k = Math.min(dissolved, s.consumed && p >= 0 ? Math.max(.04, 1 - p / 6) : 1);
      if (k <= .04) return;
      let c = rgb(s.col); if (sc.coat && sc.coatT > 0) c = mixRGB(c, sc.coat, sc.coatT * .85);
      ctx.fillStyle = rgba(c, 1);
      let bx = x, by = sc.wet && m.floats ? lqY : y;
      if (fx.darting && p >= 0 && p < 6 && sc.wet) { bx = g.cx + Math.sin(now / 260 + i) * (halfW(g, lqY) - 18); by = lqY + 2; }
      if (s.shape === 'chunk') { const w = 22 * k, h = 14 * k; ctx.beginPath(); ctx.moveTo(bx - w / 2, by); ctx.lineTo(bx - w / 2 + 3, by - h); ctx.lineTo(bx + w / 2 - 2, by - h + 2); ctx.lineTo(bx + w / 2, by); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(bx - w / 2 + 4, by - h + 3, w * .4, 2); }
      else if (s.shape === 'drop') { ctx.beginPath(); ctx.ellipse(bx, by - 5, 12, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.ellipse(bx - 4, by - 7, 3, 1.5, 0, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.beginPath(); ctx.ellipse(bx, by, 20 * k, 8 * k, 0, Math.PI, 0); ctx.fill(); }
    });
    // свечение
    if (fx.glow && p >= 0 && p < 5) { const a = Math.max(0, 1 - p / 5) * .7; const gr = ctx.createRadialGradient(g.cx, g.baseY - 8, 2, g.cx, g.baseY - 8, g.bw * .45); gr.addColorStop(0, rgba(rgb(fx.glow), a)); gr.addColorStop(1, rgba(rgb(fx.glow), 0)); ctx.fillStyle = gr; ctx.fillRect(0, g.y0, W, g.baseY - g.y0); }
    if (fx.frost && p >= 0) { const a = Math.min(.45, p / 3 * .45); ctx.strokeStyle = `rgba(190,230,255,${a})`; ctx.lineWidth = 6; flask(g); ctx.stroke(); }
    // частицы
    for (const q of parts) {
      if (q.t === 'b') { q.y += q.vy * (frozen ? 0 : step); q.x += Math.sin(q.y / 7) * .3 * (frozen ? 0 : step); if (q.y < q.top) q.life = 0; ctx.strokeStyle = 'rgba(255,255,255,.85)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.stroke(); }
      else if (q.t === 'p') { q.y += q.vy * (frozen ? 0 : step); if (q.y > g.baseY - 6) q.life = 0; ctx.fillStyle = rgba(sc.ppt, .9); ctx.fillRect(q.x, q.y, q.r, q.r); }
    }
    // серебряное зеркало на стенках
    if (fx.mirror && p >= 0) {
      const a = RM.matches ? .85 : Math.min(.85, Math.max(0, (p - 1) / 3.5) * .85);
      const gr = ctx.createLinearGradient(g.cx - g.bw / 2, 0, g.cx + g.bw / 2, 0);
      gr.addColorStop(0, `rgba(120,126,134,${a})`); gr.addColorStop(.3, `rgba(236,240,244,${a})`); gr.addColorStop(.5, `rgba(150,156,164,${a})`); gr.addColorStop(.75, `rgba(245,247,250,${a})`); gr.addColorStop(1, `rgba(110,116,124,${a})`);
      ctx.fillStyle = gr; ctx.fillRect(0, g.y1 - 10, W, g.baseY - g.y1 + 12);
    }
    ctx.restore();
    // свечение люминола
    if (fx.lum && p >= 0) {
      const life = fx.lumWeak ? 6 : 14, env = Math.max(0, Math.min(1, p * 2) * (1 - Math.max(0, p - 2) / life));
      if (env > 0) {
        ctx.save(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.fillStyle = `rgba(4,8,24,${.72 * env})`; ctx.fillRect(0, 0, W, H);
        ctx.translate(shx, shy);
        const c = rgb(fx.lum), pulse = .85 + Math.sin(now / 240) * .15, str = (fx.lumWeak ? .35 : 1) * env * pulse;
        ctx.save(); flask(g); ctx.closePath(); ctx.clip();
        ctx.fillStyle = rgba(c, .75 * str); ctx.fillRect(0, lqY, W, g.baseY - lqY + 2);
        ctx.restore();
        const gr = ctx.createRadialGradient(g.cx, g.baseY - 20, 5, g.cx, g.baseY - 20, g.bw * .9);
        gr.addColorStop(0, rgba(c, .55 * str)); gr.addColorStop(1, rgba(c, 0));
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        ctx.restore();
      }
    }
    // стекло
    flask(g); ctx.strokeStyle = rgba(glass, .75); ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = rgba(glass, .25); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(g.cx - g.nw / 2 + 5, g.y0 + 8); ctx.lineTo(g.cx - g.nw / 2 + 5, g.y1); ctx.lineTo(g.cx - g.bw / 2 + g.r + 6, g.baseY - g.r - 8); ctx.stroke();
    ctx.fillStyle = rgba(glass, .8); ctx.fillRect(g.cx - g.nw / 2 - 4, g.y0 - 3, g.nw + 8, 4);
    // частицы вне колбы
    for (const q of parts) {
      if (q.t === 's') { q.y += q.vy * step; q.x += q.vx * step; q.r += .12 * step; q.life -= .006 * step; ctx.fillStyle = rgba(q.col, Math.max(0, q.life) * .55); ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, Math.PI * 2); ctx.fill(); if (q.y < -20) q.life = 0; }
      else if (q.t === 'k') { q.x += q.vx * step; q.y += q.vy * step; q.vy += .12 * step; q.life -= .02 * step; ctx.strokeStyle = rgba(q.col, Math.max(0, q.life)); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - q.vx * 2, q.y - q.vy * 2); ctx.stroke(); }
    }
    parts = parts.filter(q => q.life > 0).slice(-420);
    // чёрная змея
    if (fx.snake && p >= 0) {
      const k = RM.matches ? 1 : Math.min(1, Math.max(0, (p - .8) / 6));
      const bottom = g.baseY - 4, top = lerp(bottom - 10, g.y0 - 90, k), w = g.nw * .92;
      ctx.fillStyle = '#1b1917';
      ctx.beginPath(); ctx.ellipse(g.cx, bottom, (g.bw / 2 - 8) * Math.min(1, k * 3), 16 * Math.min(1, k * 3), 0, Math.PI, 0); ctx.fill();
      if (k > .05) {
        ctx.beginPath(); ctx.moveTo(g.cx - w / 2, bottom - 8);
        for (let y = bottom - 8; y > top; y -= 8) ctx.lineTo(g.cx - w / 2 + Math.sin(y * .21) * 2.5, y);
        ctx.quadraticCurveTo(g.cx, top - 16, g.cx + w / 2, top);
        for (let y = top; y < bottom - 8; y += 8) ctx.lineTo(g.cx + w / 2 + Math.sin(y * .17) * 2.5, y);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(90,86,80,.55)';
        for (let y = top + 6; y < bottom - 12; y += 11) for (let x = -1; x <= 1; x++) { ctx.beginPath(); ctx.arc(g.cx + x * w * .28 + Math.sin(y) * 2, y, 1.6, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    // пламя у горлышка
    if (fx.flame && p >= 0 && p < 4.2) {
      const a = Math.min(1, p * 4) * Math.max(0, Math.min(1, (4.2 - p) / 1.2));
      const f = 1 + Math.sin(now / 55) * .12 + Math.sin(now / 23) * .06, fh = 46 * f, top = g.y0 - fh;
      const c = rgb(fx.flame);
      const gr = ctx.createLinearGradient(0, top, 0, g.y0);
      gr.addColorStop(0, rgba(c, 0)); gr.addColorStop(.45, rgba(c, .75 * a)); gr.addColorStop(1, rgba(mixRGB(c, [255, 255, 255], .5), .95 * a));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(g.cx - g.nw / 2 + 3, g.y0); ctx.quadraticCurveTo(g.cx - g.nw / 2, top + fh * .4, g.cx, top); ctx.quadraticCurveTo(g.cx + g.nw / 2, top + fh * .4, g.cx + g.nw / 2 - 3, g.y0); ctx.fill();
      // окраска объёма колбы светом
      ctx.save(); flask(g); ctx.closePath(); ctx.clip(); ctx.fillStyle = rgba(c, .12 * a); ctx.fillRect(0, g.y0, W, g.fh); ctx.restore();
    }
    // вспышка
    if ((fx.boom || fx.light || fx.flash) && p >= 0 && p < (fx.boom ? .7 : 1.2)) {
      const dur = fx.boom ? .7 : 1.2, a = (1 - p / dur) * (fx.boom ? .85 : .5);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = `rgba(255,250,235,${RM.matches ? 0 : a})`; ctx.fillRect(0, 0, W, H);
    }
    if (p > 6.5 && rxT > 0) { finish(); }
  }
  addEventListener('resize', () => { resize(); });
  requestAnimationFrame(frame);
  return { setScene, react, resize, setTemp(v) { T = v; heat = v >= 150; }, setHeat(v) { heat = v; }, setPaused(v) { paused = v; } };
})();

