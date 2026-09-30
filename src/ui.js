(() => {
'use strict';
const $ = s => document.querySelector(s);
const RM = matchMedia('(prefers-reduced-motion: reduce)');
const store = {
  get(k, d) { try { const v = localStorage.getItem('himlab.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('himlab.' + k, JSON.stringify(v)); } catch (e) {} }
};
const G = {
  xp: store.get('xp', 0), missions: store.get('missions', {}), disc: store.get('disc', {}), own: store.get('own', {}), quests: store.get('quests', {}),
  daily: store.get('daily', {}), reveal: store.get('reveal', {}), sound: store.get('sound', true)
};
const save = () => { for (const k of ['xp', 'missions', 'disc', 'own', 'quests', 'daily', 'reveal', 'sound']) store.set(k, G[k]); };
const state = { sel: [], heat: false, mode: 'free', mission: null, attempts: 0, hints: 0, freeTab: store.get('tab', 'show'), colFilter: 'all' };
const CATALOG = catalog();
const RAR = ['Обычная', 'Редкая', 'Эпическая', 'Легендарная'];
const RAR_XP = [15, 25, 40, 60];

/* ---------- Звания ---------- */
const RANKS = ['Лаборант', 'Практикант', 'Младший химик', 'Химик', 'Старший химик', 'Научный сотрудник', 'Кандидат наук', 'Доктор наук', 'Профессор', 'Академик'];
const need = L => 60 * (L - 1) * L;
function levelOf(xp) { let L = 1; while (xp >= need(L + 1)) L++; return L; }
const rankOf = L => RANKS[Math.min(RANKS.length - 1, L - 1)];

/* ---------- Формулы и журнал ---------- */
function fHTML(f) {
  if (!f) return '';
  const [b, ch] = f.split('^');
  let out = '', prev = 'start';
  for (const c of b) {
    if (/\d/.test(c)) { if (prev === 'el' || prev === 'sub') { out += '<sub>' + c + '</sub>'; prev = 'sub'; } else { out += c; prev = 'num'; } }
    else { out += c; prev = /[A-Za-z\)\]]/.test(c) ? 'el' : 'other'; }
  }
  out = out.replace(/<\/sub><sub>/g, '');
  if (ch) out += '<sup>' + ch.replace('-', '−') + '</sup>';
  return out;
}
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ST = { s: 'тв', l: 'ж', g: 'г', aq: 'р-р' };
const termHTML = t => `<span>${t.c > 1 ? `<span class="co">${t.c}</span>` : ''}${fHTML(t.f)}${!t.f.includes('^') ? `<span class="st">(${ST[t.s] || t.s})</span>` : ''}</span>`;
function eqHTML(eq, cond) {
  const side = arr => arr.map(termHTML).join('<span class="plus">+</span>');
  const over = [eq.over, cond].filter(Boolean).join(', ');
  return `<div class="eq">${side(eq.r)}<span class="arrow">${over ? `<small>${esc(over)}</small>` : ''}<span>${eq.rev ? '⇄' : '→'}</span></span>${side(eq.p)}</div>`;
}
function dhHTML(dH) {
  if (dH == null) return `<div class="energy"><span class="dh na">ΔH° нет данных</span><span class="meta">нет справочной энтальпии для одного из веществ</span></div>`;
  const cls = dH < 0 ? 'exo' : dH > 0 ? 'endo' : 'na';
  const w = Math.min(100, Math.log10(1 + Math.abs(dH)) / Math.log10(4001) * 100);
  const txt = dH < 0 ? 'экзотермическая: тепло выделяется' : dH > 0 ? 'эндотермическая: тепло поглощается' : 'тепловой эффект близок к нулю';
  return `<div class="energy"><span class="dh ${cls}">ΔH° = ${fmtDH(dH)}</span><span class="meta">${txt}</span><div class="bar"><i style="width:${w}%;background:var(--${cls === 'na' ? 'muted' : cls})"></i></div></div>`;
}
const subName = id => { const S = getSub(id); return S.kind === 'el' ? S.el.sym : S.f; };
const shortName = id => { const S = getSub(id); return S.id === 'h2so4c' ? 'H2SO4 конц.' : subName(id); };
const comboHTML = ids => ids.map(i => getSub(i) ? fHTML(subName(i)) + (i === 'h2so4c' ? '<small> конц.</small>' : '') : esc(i)).join(' + ');
function renderEvent(e, isNew) {
  const k = e.kind;
  let h = `<article class="rx k-${k}"><div class="rx-h"><span class="pill type">${esc(e.type)}</span>`;
  const src = ['rx', 'phys', 'flame', 'ind'].includes(k) ? e.source : k === 'unknown' ? 'unknown' : 'none';
  if (k !== 'info') h += `<span class="pill s-${src}">${SRC[src] || ''}</span>`;
  if (isNew) h += `<span class="pill new">Новое открытие</span>`;
  if (e.pair && e.pair.length > 1 && state.sel.filter(x => !isInd(x)).length > 2) h += `<span class="pill">${comboHTML(e.pair)}</span>`;
  h += `</div>`;
  const cond = e.cond && e.cond !== 'нагрев' ? e.cond : (e.cond === 'нагрев' ? 't°' : '');
  const multi = e.subs.length > 1;
  e.subs.forEach((s, i) => {
    if (e.ionic || e.mol) h += `<div class="eqlabel">${multi ? `Стадия ${i + 1} · ` : ''}${e.ionic ? 'сокращённое ионное уравнение' : 'уравнение'}</div>`;
    else if (multi) h += `<div class="eqlabel">Стадия ${i + 1}</div>`;
    h += `<div class="eqbox">${eqHTML(s.eq, i === 0 ? cond : '')}</div>` + dhHTML(s.eq.dH);
  });
  if (e.mol) h += `<div class="eqlabel">молекулярное уравнение</div><div class="eqbox">${eqHTML(e.mol, '')}</div>`;
  if (e.preview && k === 'none') h += `<div class="eqlabel">${e.needHeat ? 'что произойдёт при нагреве' : 'гипотетическое уравнение'}</div><div class="eqbox preview">${eqHTML(e.preview, e.needHeat ? 't°' : '')}</div>${e.needHeat ? '' : dhHTML(e.preview.dH)}`;
  if (e.obs.length) h += `<ul class="obs">${e.obs.map(o => `<li>${esc(o)}</li>`).join('')}</ul>`;
  if (e.why) h += `<p class="why">${esc(e.why)}</p>`;
  if (e.needT) h += `<p class="meta" style="color:var(--warn)">Нужна температура не ниже ${e.needT} °C, сейчас ${fmtT(state.T)}.</p>`;
  if (e.tReq) h += `<p class="meta">Идёт при температуре от ${e.tReq} °C (в колбе ${fmtT(state.T)}).</p>`;
  if (e.danger) h += `<p class="danger">${esc(e.danger)}</p>`;
  return h + '</article>';
}

/* ---------- Навигация ---------- */
function show(scr) {
  const map = { menu: 'scrMenu', map: 'scrMap', lab: 'scrLab', col: 'scrCol', ach: 'scrAch' };
  for (const k in map) $('#' + map[k]).hidden = k !== scr;
  document.querySelectorAll('.nav button').forEach(b => b.setAttribute('aria-current', (b.dataset.go === scr || (b.dataset.go === 'free' && scr === 'lab' && state.mode === 'free') || (b.dataset.go === 'map' && scr === 'lab' && state.mode === 'mission')) ? 'page' : 'false'));
  if (scr === 'menu') renderMenu(); if (scr === 'map') renderMap(); if (scr === 'col') renderCol(); if (scr === 'ach') renderAch();
  scrollTo({ top: 0, behavior: 'auto' });
  if (scr === 'lab') requestAnimationFrame(() => Lab.resize());
}
function go(where) { if (where === 'free') openFree(); else show(where); }

/* ---------- Профиль и опыт ---------- */
function renderMe() {
  const L = levelOf(G.xp), a = need(L), b = need(L + 1), pct = Math.round((G.xp - a) / (b - a) * 100);
  $('#meLvl').textContent = L; $('#meRank').textContent = rankOf(L); $('#meBar').style.width = pct + '%';
  $('#meXp').textContent = `${G.xp} / ${b} XP`;
}
function addXP(n, label) {
  const before = levelOf(G.xp);
  G.xp += n; save(); renderMe();
  pop(label, n);
  const after = levelOf(G.xp);
  if (after > before) setTimeout(() => { pop(`Новое звание: ${rankOf(after)}`, 0); confetti(80); chime(true); }, 700);
}
function pop(text, xp) {
  const d = document.createElement('div'); d.className = 'popx';
  d.innerHTML = `${esc(text)}${xp ? ` <em>+${xp} XP</em>` : ''}`;
  $('#pops').appendChild(d); setTimeout(() => d.remove(), 2700);
}

/* ---------- Меню ---------- */
const doneCount = () => MISSIONS.filter(m => G.missions[m.id]).length;
const starCount = () => MISSIONS.reduce((s, m) => s + (G.missions[m.id] ? G.missions[m.id].stars : 0), 0);
function nextMission() { return MISSIONS.find(m => !G.missions[m.id]) || null; }
function todayKey() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
function daily() { const d = new Date(); const n = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 864e5); return DAILY[n % DAILY.length]; }
function dailyDone() { return G.daily.date === todayKey(); }
function renderMenu() {
  const L = levelOf(G.xp), a = need(L), b = need(L + 1);
  $('#rkLvl').textContent = L; $('#rkName').textContent = rankOf(L);
  $('#rkNext').textContent = `${G.xp} XP · до звания «${rankOf(L + 1)}» ещё ${b - G.xp} XP`;
  $('#rkBar').style.width = Math.round((G.xp - a) / (b - a) * 100) + '%';
  $('#kMis').textContent = `${doneCount()}/${MISSIONS.length}`; $('#kStar').textContent = `${starCount()}/${MISSIONS.length * 3}`; $('#kCol').textContent = `${Object.keys(G.disc).length}/${CATALOG.length}`;
  const nm = nextMission();
  $('#ctaPlay').textContent = nm ? (doneCount() ? `Продолжить: миссия ${nm.n}` : 'Начать кампанию') : 'Кампания пройдена — к карте';
  $('#mmMap').textContent = `${doneCount()} из ${MISSIONS.length} · ${starCount()} ★`;
  $('#mmCol').textContent = `${Object.keys(G.disc).length} из ${CATALOG.length}`;
  $('#mmAch').textContent = `${Object.keys(G.quests).length} из ${QUESTS.length}`;
  const [, title] = daily();
  $('#dailyMenu').innerHTML = `<span class="tag${dailyDone() ? ' done' : ''}">${dailyDone() ? 'Выполнено' : 'Задание дня'}</span><div class="dt"><b>${esc(title)}</b><span>Любые вещества в свободной лаборатории. Награда — 150 XP, новое задание завтра.</span></div><button class="btn" data-go="free" type="button">В лабораторию</button>`;
}

/* ---------- Карта ---------- */
function unlocked(m) { return m.n === 1 || !!G.missions[MISSIONS[m.n - 2].id]; }
function renderMap() {
  $('#mapStars').textContent = `${starCount()} / ${MISSIONS.length * 3} ★`;
  const nm = nextMission();
  $('#map').innerHTML = CHAPTERS.map(c => {
    const ms = MISSIONS.filter(m => m.ch === c.id);
    const st = ms.reduce((s, m) => s + (G.missions[m.id] ? G.missions[m.id].stars : 0), 0);
    return `<section class="panel chap"><div class="chap-h"><h2><small>Глава ${c.id}</small>${esc(c.title)}</h2><span class="chap-stars">${st} / ${ms.length * 3} ★</span></div><p class="meta" style="margin-top:-8px">${esc(c.sub)}</p>
      <div class="path">${ms.map(m => {
        const r = G.missions[m.id], open = unlocked(m);
        return `<button type="button" class="node${r ? ' done' : ''}${nm && nm.id === m.id ? ' next' : ''}" data-m="${m.id}" ${open ? '' : 'disabled'}><span class="nn">${m.n}</span><span class="nt">${open ? esc(m.t) : 'Закрыто'}</span><span class="ns">${starsHTML(r ? r.stars : 0)}</span></button>`;
      }).join('')}</div></section>`;
  }).join('');
}
const starsHTML = n => [0, 1, 2].map(i => i < n ? '<b>★</b>' : '★').join('');

/* ---------- Лаборатория: игровой экран ---------- */
const STATE_RU = { s: 'твёрдое', l: 'жидкость', g: 'газ' };
const PH_RU = { aq: 'водный раствор', l: 'жидкость', s: 'твёрдое вещество', g: 'газ' };
const STRIP_TABS = [['show', 'Витрина'], ['Кислоты', 'Кислоты'], ['Основания', 'Основания'], ['Соли в растворе', 'Соли'], ['Твёрдые вещества', 'Твёрдые'], ['Органика', 'Органика'], ['Растворители и газы', 'Вода и газы'], ['Прочее', 'Индикаторы'], ['el', 'Элементы']];
const T_PRE = [[-20, 'лёд'], [25, 'комн.'], [100, '100°'], [300, '300°'], [600, '600°'], [900, '900°']];
Object.assign(state, { runId: 0, T: 25, stripTab: store.get('strip', 'show'), q: '', ran: false, sig: '' });
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
const fmtT = T => (T < 0 ? '−' : '') + Math.abs(T) + ' °C';
function tLabel(T) { return T <= -5 ? 'мороз' : T < 15 ? 'ледяная баня' : T < 40 ? 'комнатная' : T < 100 ? 'тёплая' : T < 150 ? 'кипящая баня' : T < 500 ? 'горелка' : 'сильное пламя'; }
function fmtRate(r) { return r < .1 ? '<0,1' : r < 10 ? r.toFixed(1).replace('.', ',') : r < 1e4 ? String(Math.round(r)) : '>10⁴'; }
const animSpeed = T => clampN(Math.pow(rateAt(T), .3), .45, 2.4);
function setT(v, live) {
  state.T = Math.round(clampN(v, -30, 900) / 5) * 5;
  paintT();
  if (Lab.setTemp) Lab.setTemp(state.T); else if (Lab.setHeat) Lab.setHeat(state.T >= 150);
  if (live) liveUpdate();
}
function paintT() {
  const T = state.T, k = (T + 30) / 930;
  $('#tVal').textContent = fmtT(T); $('#tState').textContent = tLabel(T);
  const m = $('#tMerc'); m.style.height = (8 + k * 92) + '%'; $('#tTube').style.setProperty('--k', k.toFixed(3));
  m.style.background = T < 15 ? 'linear-gradient(to top,#2a8cff,#8fd0ff)' : T < 150 ? 'linear-gradient(to top,#ff7a2a,#ffc44a)' : 'linear-gradient(to top,#ff3b1a,#ffb04a)';
  $('#tTube').setAttribute('aria-valuenow', T); $('#tTube').setAttribute('aria-valuetext', fmtT(T));
  $('#tRate').innerHTML = `скорость<br><b>×${fmtRate(rateAt(T))}</b>`;
  $('#tRate').title = 'Правило Вант-Гоффа: при нагревании на каждые 10 °C скорость реакции растёт примерно вдвое';
  document.querySelectorAll('[data-t]').forEach(b => b.setAttribute('aria-pressed', +b.dataset.t === T));
}
let liveT;
function liveUpdate() {
  clearTimeout(liveT);
  liveT = setTimeout(() => {
    if (!state.ran || !state.sel.length) return;
    const sig = analyzeT(state.sel, state.T).map(evSig).join('#');
    if (sig !== state.sig) run({ live: true });
  }, 450);
}

function openFree(ids, T) {
  state.mode = 'free'; state.mission = null;
  show('lab'); renderStrip(); renderGoal(); $('#mPanel').hidden = true;
  if (ids) loadCombo(ids, T); else { state.sel = []; setT(25); renderSel(); Lab.setScene([], false); clearReport(); }
}
function openMission(id) {
  const m = MISSIONS.find(x => x.id === id); if (!m || !unlocked(m)) return;
  state.mode = 'mission'; state.mission = m; state.attempts = 0; state.hints = 0; state.won = 0; state.sel = []; state.ran = false;
  show('lab'); setT(25); renderStrip(); renderSel(); Lab.setScene([], false); clearReport();
  renderGoal(); renderMissionPanel();
}
function renderGoal() {
  const g = $('#goalBar');
  if (state.mode === 'mission') {
    const m = state.mission;
    g.innerHTML = `<div class="gb-t"><span class="gb-n">Миссия ${m.n}</span><b>${esc(m.t)}</b></div><div class="gb-goal">Цель: ${esc(m.goal)}</div><div class="gb-say" id="say">${esc(m.brief)}</div>
      <div class="gb-btns"><button type="button" class="gbb" id="hintBtn" ${state.hints >= 2 ? 'disabled' : ''}>${state.hints >= 2 ? 'Подсказок нет' : 'Подсказка −1★'}</button><button type="button" class="gbb" id="toPanel">Подробнее</button></div>`;
    g.hidden = false;
  } else {
    const [, t] = daily();
    g.innerHTML = `<div class="gb-t"><span class="gb-n">${dailyDone() ? 'Выполнено' : 'Задание дня'}</span><b>${esc(t)}</b></div><div class="gb-say">${dailyDone() ? 'Новое задание появится завтра.' : 'Любые вещества. Награда — 150 XP.'}</div>`;
    g.hidden = false;
  }
}
function renderMissionPanel() {
  const m = state.mission, c = CHAPTERS.find(x => x.id === m.ch), p = $('#mPanel');
  const fore = state.won || (state.hints === 0 && state.attempts < 2 ? 3 : (state.hints <= 1 && state.attempts < 4 ? 2 : 1));
  p.hidden = false;
  p.innerHTML = `<span class="mch">Глава ${c.id} · ${esc(c.title)} · миссия ${m.n} из ${MISSIONS.length}</span><h2>${esc(m.t)}</h2>
    <div class="mentor"><div class="av">${flaskSVG(22)}</div><div class="bubble">${esc(m.brief)}</div></div>
    <div class="goal"><span>Цель</span><b>${esc(m.goal)}</b></div>
    <div class="mstats"><span class="pill">попыток: ${state.attempts}</span><span class="pill">подсказок: ${state.hints}/2</span><span class="stars-f">${starsHTML(fore)}</span></div>
    <div class="hintbox">${m.hints.slice(0, state.hints).map(h => `<p>${esc(h)}</p>`).join('')}</div>
    <div class="mstats"><button class="btn ghost" id="hintBtn2" type="button" ${state.hints >= 2 ? 'disabled' : ''}>${state.hints >= 2 ? 'Подсказок больше нет' : 'Подсказка (−1 ★)'}</button><button class="btn ghost" data-go="map" type="button">К карте</button></div>`;
}
function say(text, kind) { const b = $('#say'); if (!b) return; b.textContent = text; b.className = 'gb-say' + (kind ? ' say-' + kind : ''); }
function useHint() { if (state.hints < 2) { state.hints++; renderGoal(); renderMissionPanel(); toast('Подсказка: ' + state.mission.hints[state.hints - 1]); } }

/* иконки ингредиентов */
function iconSVG(id) {
  const S = getSub(id);
  if (S.kind === 'el') return '';
  const col = RCOLOR[S.id] || (S.ions && solColor(S.ions.map(i => i[0]))) || (S.id === 'php' ? '#eef2f4' : '#bcd6ea');
  const cap = (typeof T3 !== 'undefined' && T3.CAP[S.g]) || '#3c4148';
  if (S.ph === 's') return `<svg viewBox="0 0 48 56" class="ico" aria-hidden="true"><rect x="9" y="10" width="30" height="8" rx="2" fill="${cap}"/><rect x="10" y="18" width="28" height="32" rx="4" fill="rgba(210,225,236,.25)" stroke="rgba(200,215,228,.7)"/><rect x="12" y="32" width="24" height="16" rx="3" fill="${col}"/><rect x="12" y="22" width="24" height="8" fill="#f6f1e4" opacity=".9"/></svg>`;
  if (S.ph === 'g') return `<svg viewBox="0 0 48 56" class="ico" aria-hidden="true"><rect x="20" y="4" width="8" height="8" rx="2" fill="#9aa1a8"/><rect x="14" y="10" width="20" height="42" rx="10" fill="#2b2f35"/><rect x="14" y="26" width="20" height="10" fill="#f6f1e4" opacity=".9"/></svg>`;
  const amber = typeof T3 !== 'undefined' && T3.AMBER.has(S.id);
  return `<svg viewBox="0 0 48 56" class="ico" aria-hidden="true"><rect x="19" y="3" width="10" height="6" rx="1.5" fill="${cap}"/><path d="M20 9h8v7l8 7v27a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V23l8-7z" fill="${amber ? 'rgba(122,61,12,.55)' : 'rgba(210,225,236,.22)'}" stroke="rgba(200,215,228,.75)"/><path d="M13 30h22v20a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2z" fill="${col}" opacity="${col === '#bcd6ea' ? .55 : .95}"/><rect x="14" y="34" width="20" height="9" fill="#f6f1e4" opacity=".9"/></svg>`;
}
function ingHTML(id) {
  const S = getSub(id);
  if (S.kind === 'el') { const e = S.el; return `<button type="button" class="ing el ${e.cat}${noMacro(e) ? ' nomac' : ''}" data-id="${id}" title="${esc(e.name)}"><span class="ez">${e.z}${isRadio(e) ? ' ☢' : ''}</span><span class="es">${e.sym}</span><span class="en">${esc(e.name)}</span></button>`; }
  return `<button type="button" class="ing" data-id="${id}" title="${esc(S.name)}">${iconSVG(id)}<span class="if">${fHTML(S.f)}${id === 'h2so4c' ? '<small> конц.</small>' : ''}</span><span class="in">${esc(S.name)}</span></button>`;
}
function showCardHTML(x, i) {
  const [ids, , t, d, cols] = x;
  const grad = cols.length > 2 ? `conic-gradient(from 200deg, ${cols.join(', ')}, ${cols[0]})` : `linear-gradient(160deg, ${cols[0]} 0 38%, ${cols[1]} 62%)`;
  return `<button type="button" class="ing show" data-show="${i}"><span class="swatch" style="background:${grad}"></span><span class="in"><b>${esc(t)}</b>${esc(d)}</span></button>`;
}
function matchQ(x) {
  const q = state.q; if (!q) return true;
  if (x.sym) return x.sym.toLowerCase() === q || x.name.toLowerCase().includes(q) || String(x.z) === q || (q.length > 1 && x.sym.toLowerCase().startsWith(q));
  return (x.name + ' ' + x.f + ' ' + (x.note || '')).toLowerCase().includes(q);
}
function renderStrip() {
  const bar = $('#stripTabs'), row = $('#stripRow'), srch = $('#stripSearch');
  if (state.mode === 'mission') {
    bar.innerHTML = `<span class="sec-h" style="color:#aab6c2">Полка миссии · ${state.mission.shelf.length} ${plural(state.mission.shelf.length, 'вещество', 'вещества', 'веществ')}</span>`;
    srch.hidden = true; row.innerHTML = state.mission.shelf.map(ingHTML).join(''); paintSel(); return;
  }
  srch.hidden = false;
  bar.innerHTML = STRIP_TABS.map(([k, n]) => `<button type="button" class="stab" data-stab="${k}" aria-pressed="${!state.q && state.stripTab === k}">${n}</button>`).join('');
  if (state.q) row.innerHTML = [...REAGENTS.filter(matchQ).map(r => ingHTML(r.id)), ...ELS.filter(matchQ).map(e => ingHTML(e.sym))].join('') || '<div class="strip-empty">Ничего не найдено</div>';
  else if (state.stripTab === 'show') row.innerHTML = SHOW.map(showCardHTML).join('');
  else if (state.stripTab === 'el') row.innerHTML = ELS.map(e => ingHTML(e.sym)).join('');
  else row.innerHTML = REAGENTS.filter(r => r.g === state.stripTab).map(r => ingHTML(r.id)).join('');
  paintSel();
}
function descOf(id) {
  const S = getSub(id);
  if (S.kind === 'el') { const e = S.el; const b = [CAT_RU[e.cat]]; if (e.z < 104) b.push(`${STATE_RU[e.st]} при 25 °C`); if (e.en != null) b.push(`χ = ${fmtN(e.en)}`); if (E0[e.sym]) b.push(`E° = ${fmtV(E0[e.sym][0])}`); if (MP[e.sym] !== undefined) b.push(`tпл ${fmtN(MP[e.sym])} °C`); if (noMacro(e)) b.push('существует лишь отдельными атомами'); else if (isRadio(e)) b.push('радиоактивен'); return b.join(' · '); }
  const b = [PH_RU[S.ph] || '']; if (S.note) b.push(S.note);
  if (S.ions && (S.ph !== 's' || S.dis)) b.push('ионы: ' + S.ions.map(x => ionTxt(x[0])).join(', '));
  if (S.acid) b.push(S.acid === 's' ? 'сильная кислота' : 'слабая кислота'); if (S.base) b.push(S.base === 's' ? 'сильное основание' : 'слабое основание');
  if (S.ind) b.push('индикатор, места в колбе не занимает');
  return b.filter(Boolean).join(' · ');
}
function renderAdded() {
  const el = $('#added'), core = state.sel.filter(x => !isInd(x)).length;
  if (!state.sel.length) { el.innerHTML = `<div class="add-h">В колбе <span>0/3</span></div><p class="add-empty">Колба пуста. Выберите вещества на ленте внизу — до трёх, индикаторы не в счёт.</p>`; return; }
  el.innerHTML = `<div class="add-h">В колбе <span>${core}/3</span></div>` + state.sel.map(id => { const S = getSub(id); return `<div class="add-it"><span class="ai-f">${fHTML(subName(id))}${id === 'h2so4c' ? '<small> конц.</small>' : ''}</span><div class="ai-t"><b>${esc(S.name)}</b><span>${esc(descOf(id))}</span></div><button type="button" data-rm="${id}" aria-label="Убрать ${esc(S.name)}">×</button></div>`; }).join('');
}

/* ---------- Колба: выбор ---------- */
const isInd = x => x === 'php' || x === 'starch';
function toggle(id) {
  const i = state.sel.indexOf(id);
  if (i >= 0) state.sel.splice(i, 1);
  else {
    if (!isInd(id) && state.sel.filter(x => !isInd(x)).length >= 3) { toast('В колбе максимум три вещества (индикаторы не в счёт). Уберите одно.'); return; }
    state.sel.push(id);
  }
  state.ran = false; state.runId++; $('#resCard').hidden = true;
  renderSel(); Lab.setScene(state.sel, state.T >= 150);
}
function renderSel() { renderAdded(); $('#go').disabled = !state.sel.length; paintSel(); }
function paintSel() { document.querySelectorAll('.ing[data-id]').forEach(b => b.classList.toggle('sel', state.sel.includes(b.dataset.id))); }
function clearReport() { $('#report').innerHTML = '<div class="empty">Здесь появится подробный разбор каждой реакции.</div>'; $('#resCard').hidden = true; }
function loadCombo(ids, T) {
  state.sel = ids.slice(); setT(T == null ? 25 : T); renderSel(); Lab.setScene(state.sel, state.T >= 150); run();
}
function comboT(ids, h) { const need = requiredT(ids); return need > 25 ? Math.min(900, Math.ceil((need + 20) / 50) * 50) : (h ? 150 : 25); }

/* ---------- Главный ход ---------- */
function run(opt = {}) {
  if (!state.sel.length) return;
  const token = ++state.runId;
  ac();
  const events = analyzeT(state.sel, state.T);
  state.sig = events.map(evSig).join('#'); state.ran = true;
  const order = { rx: 0, phys: 1, flame: 1, ind: 2, none: 3, unknown: 3, info: 4 };
  events.sort((a, b) => order[a.kind] - order[b.kind]);
  const fresh = new Set(); let delay = 300;
  for (const e of events) {
    if (e.curKey && !G.disc[e.curKey]) {
      const c = CATALOG.find(x => x.key === e.curKey); const r = c ? c.rarity : 0;
      G.disc[e.curKey] = { t: Date.now(), ids: state.sel.slice(), T: state.T }; fresh.add(e);
      setTimeout(() => addXP(RAR_XP[r], `${RAR[r]} реакция в коллекции`), delay); delay += 500;
    } else if (!e.curKey && e.kind === 'rx' && e.subs[0]) {
      const k = eqText(e.subs[0].eq);
      if (!G.own[k]) { G.own[k] = { t: Date.now(), ids: state.sel.slice(), T: state.T }; fresh.add(e); setTimeout(() => addXP(10, 'Самостоятельное открытие'), delay); delay += 500; }
    }
    for (const t of e.tags) if (QUESTS.some(q => q[0] === t) && !G.quests[t]) {
      G.quests[t] = state.sel.join('+'); const q = QUESTS.find(x => x[0] === t);
      setTimeout(() => { addXP(50, `Достижение: ${q[1]}`); chime(); }, delay); delay += 500;
    }
  }
  const [dk, dt, dcheck] = daily();
  if (!dailyDone() && dcheck(events)) { G.daily = { date: todayKey(), id: dk }; setTimeout(() => { addXP(150, `Задание дня: ${dt}`); confetti(60); chime(true); if (state.mode === 'free') renderGoal(); }, delay); delay += 500; }
  save();
  $('#report').innerHTML = events.map(e => renderEvent(e, fresh.has(e))).join('');
  const pourMs = Lab.react(events, { noPour: !!opt.live, speed: animSpeed(state.T) }) || 0;
  setTimeout(() => { if (token !== state.runId) return; audio(events); showResult(events, fresh); }, pourMs);
  if (state.mode === 'mission') missionCheck(events, pourMs);
}
function showResult(events, fresh) {
  const e = events[0], c = $('#resCard'); if (!e) return;
  const main = e.subs[0];
  let h = `<button type="button" class="rc-x" id="rcClose" aria-label="Скрыть">×</button><div class="rx-h"><span class="pill type">${esc(e.type)}</span>${fresh.has(e) ? '<span class="pill new">Новое открытие</span>' : ''}</div>`;
  if (main) h += `<div class="eqbox">${eqHTML(main.eq, e.cond && e.cond !== 'нагрев' ? e.cond : '')}</div>` + (main.eq.dH != null ? `<div class="rc-dh ${main.eq.dH < 0 ? 'exo' : 'endo'}">ΔH° = ${fmtDH(main.eq.dH)}</div>` : '');
  const line = e.obs[0] || e.why;
  if (line) h += `<p class="rc-p">${esc(line.length > 190 ? line.slice(0, 187) + '…' : line)}</p>`;
  if (e.needT) h += `<p class="rc-p rc-need">Нужно не ниже ${e.needT} °C, сейчас ${fmtT(state.T)}. Поднимите температуру справа.</p>`;
  const more = events.length > 1 ? ` · ещё ${events.length - 1}` : '';
  h += `<button type="button" class="rc-more" id="toJournal">Подробный разбор${more} ↓</button>`;
  c.innerHTML = h; c.hidden = false; placeResult();
}
const PORTRAIT = matchMedia('(max-width:760px), (orientation:portrait) and (max-width:1024px)');
function placeResult() { const c = $('#resCard'), over = PORTRAIT.matches; c.classList.toggle('over', over); const host = over ? $('#stage .canvas-wrap') : $('.hud-top'); if (c.parentNode !== host) host.appendChild(c); }
PORTRAIT.addEventListener ? PORTRAIT.addEventListener('change', placeResult) : PORTRAIT.addListener(placeResult);
function missionCheck(events, pourMs) {
  const m = state.mission; state.attempts++;
  if (m.check(events)) {
    const stars = state.hints === 0 && state.attempts <= 2 ? 3 : (state.hints <= 1 && state.attempts <= 4 ? 2 : 1);
    const prev = G.missions[m.id] ? G.missions[m.id].stars : 0, first = !G.missions[m.id];
    const gain = first ? 60 + 30 * stars : Math.max(0, stars - prev) * 30;
    if (stars > prev || first) G.missions[m.id] = { stars: Math.max(stars, prev), t: Date.now() };
    save(); state.won = stars;
    renderMissionPanel(); say('Отлично! Цель достигнута.', 'ok');
    setTimeout(() => winModal(m, stars, gain, first), RM.matches ? 200 : pourMs + 2200);
  } else {
    renderMissionPanel();
    const any = events.some(e => ['rx', 'phys', 'flame', 'ind'].includes(e.kind));
    const need = events.map(e => e.needT).filter(Boolean);
    say(need.length ? `Не хватает энергии: нужно не ниже ${Math.min(...need)} °C. Поднимите температуру.` : events.some(e => e.type === 'Замерзание') ? 'Раствор замёрз — во льду реакции не идут. Нагрейте колбу.' : any ? 'Реакция прошла, но это не то, что нужно для цели. Попробуйте другую комбинацию.' : 'Здесь реакции нет. Подумайте, какие вещества должны встретиться.', 'no');
    if (state.attempts === 3 && state.hints === 0) setTimeout(() => toast('Застряли? Нажмите «Подсказка».'), 1200);
  }
}
function winModal(m, stars, gain, first) {
  const next = MISSIONS[m.n] || null;
  $('#mbox').innerHTML = `<span class="sec-h">Миссия ${m.n} пройдена</span><h2 id="mTitle">${esc(m.t)}</h2>
    <div class="bigstars">${[0, 1, 2].map(i => i < stars ? '<b>★</b>' : '<span>★</span>').join('')}</div>
    <p class="fact">${esc(m.fact)}</p>
    <div class="rewards">${gain ? `<span>+${gain} XP${first ? '' : ' за улучшение'}</span>` : '<span>Звёзд не больше, чем в прошлый раз</span>'}<span>попыток: ${state.attempts} · подсказок: ${state.hints}</span></div>
    <div class="mbtns">${next ? `<button class="btn gold" id="mNext" type="button">Миссия ${next.n}: ${esc(next.t)}</button>` : `<button class="btn gold" id="mEnd" type="button">Кампания пройдена!</button>`}<button class="btn ghost" id="mMap" type="button">К карте</button><button class="btn ghost" id="mStay" type="button">Остаться</button></div>`;
  $('#modal').hidden = false;
  confetti(stars === 3 ? 160 : 90); chime(true);
  if (gain) setTimeout(() => addXP(gain, stars === 3 ? 'Идеально!' : 'Миссия пройдена'), 400);
  const close = () => { $('#modal').hidden = true; };
  if (next) $('#mNext').onclick = () => { close(); openMission(next.id); };
  else $('#mEnd').onclick = () => { close(); show('map'); confetti(200); };
  $('#mMap').onclick = () => { close(); show('map'); };
  $('#mStay').onclick = close;
  setTimeout(() => ($('#mNext') || $('#mEnd')).focus(), 50);
}

/* ---------- Коллекция ---------- */
function renderCol() {
  const found = Object.keys(G.disc).length;
  $('#colSub').textContent = `Открыто ${found} из ${CATALOG.length} проверенных реакций. Нажмите на пустую карточку, чтобы узнать одно из веществ.`;
  $('#rarbar').innerHTML = RAR.map((n, r) => { const all = CATALOG.filter(c => c.rarity === r); const f = all.filter(c => G.disc[c.key]).length; return `<span style="color:var(--r${r})">${n}: ${f}/${all.length}</span>`; }).join('');
  const list = CATALOG.slice().sort((a, b) => b.rarity - a.rarity).filter(c => state.colFilter === 'all' || (state.colFilter === 'found') === !!G.disc[c.key]);
  $('#coll').innerHTML = list.map(c => {
    const f = G.disc[c.key];
    if (f) return `<button type="button" class="cc r${c.rarity}" data-open="${c.key}"><span class="rar">${RAR[c.rarity]}</span><span class="ctp">${esc(c.type)}</span><span class="cin">${comboHTML(c.ids)}${c.heat ? ' · t°' : ''}</span>${c.eq ? `<span class="ceq">${esc(eqText(mk(c.eq)))}</span>` : ''}</button>`;
    const rv = G.reveal[c.key];
    return `<button type="button" class="cc locked r${c.rarity}" data-reveal="${c.key}"><span class="rar">${RAR[c.rarity]}</span><span class="ctp">???</span><span class="dots">${c.ids.map(() => '<i></i>').join('')}${c.heat ? '<span class="meta" style="margin-left:6px">нужен нагрев</span>' : ''}</span><span class="cin">${rv ? 'одно из веществ: ' + fHTML(subName(c.ids[0])) + (c.ids[0] === 'h2so4c' ? ' конц.' : '') + ' — ' + esc(getSub(c.ids[0]).name) : 'нажмите за подсказкой'}</span></button>`;
  }).join('');
  const own = Object.keys(G.own).length;
  $('#ownDisc').textContent = own ? `Кроме того, выведено самостоятельно по правилам: ${own} ${plural(own, 'реакция', 'реакции', 'реакций')}.` : 'Реакции, выведенные по правилам, тоже приносят опыт, но в коллекцию не входят.';
}
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : (m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c); };

/* ---------- Достижения ---------- */
const QUESTS = [
  ['boom', 'Взрыв', 'Реакция, которая идёт со взрывом'], ['ppt-yellow', 'Жёлтый осадок', 'Получите осадок жёлтого цвета'],
  ['displace', 'Вытеснение', 'Один металл или галоген вытесняет другой из соли'], ['endo', 'Холодная химия', 'Процесс, который поглощает тепло: ΔH > 0'],
  ['co2', 'Углекислый газ', 'Получите CO₂ любым способом'], ['complex', 'Яркий комплекс', 'Получите окрашенный комплексный ион'],
  ['noble', 'Не такой уж инертный', 'Заставьте реагировать благородный газ'], ['flame', 'Пламенная проба', 'Узнайте металл по цвету пламени'],
  ['neutral', 'Нейтрализация', 'Кислота встречает основание'], ['thermite', 'Металлотермия', 'Отнимите кислород у оксида более активным металлом'],
  ['water-metal', 'Металл и вода', 'Найдите металл, который реагирует с водой'], ['catalysis', 'Катализ', 'Ускорьте реакцию веществом, которое не расходуется'],
  ['colorseq', 'Смена цвета', 'Реакция, в которой раствор меняет окраску'], ['lum', 'Холодный свет', 'Заставьте раствор светиться без нагрева'], ['mirror', 'Зеркало', 'Покройте стекло металлом из раствора']
];
function renderAch() {
  $('#achCount').textContent = `${Object.keys(G.quests).length} / ${QUESTS.length}`;
  $('#ach').innerHTML = QUESTS.map(([id, t, d], i) => `<div class="badge${G.quests[id] ? ' done' : ''}"><span class="bi">${G.quests[id] ? '★' : i + 1}</span><div><b>${t}</b><span>${d}</span>${G.quests[id] ? `<span style="display:block;font-family:var(--f-mono);margin-top:2px">${comboHTML(G.quests[id].split('+'))}</span>` : ''}</div></div>`).join('');
}

/* ---------- Лаборатория: свободный режим ---------- */
const SHOW = [
  ['glucose kmno4 naoh', 0, 'Химический хамелеон', 'Фиолетовый → зелёный → оранжевый', ['#7a1fa8', '#2f8f4a', '#c9a227', '#b0561a']],
  ['fecl3 h2o2 luminol', 0, 'Холодный свет', 'Люминол светится голубым', ['#0b1030', '#3f7dff']],
  ['agno3 glucose nh3', 0, 'Серебряное зеркало', 'Стекло покрывается серебром', ['#dfe3e8', '#8d949c', '#f4f6f8']],
  ['fecl3 k4fecn6', 0, 'Берлинская лазурь', 'Первый синтетический пигмент', ['#efe08a', '#143a9e']],
  ['pbno3 ki', 0, 'Золотой дождь', 'Ярко-жёлтые чешуйки PbI₂', ['#f4f6f8', '#ffd21f']],
  ['fecl3 kscn', 0, 'Кровь из пробирки', 'Мгновенный кроваво-красный', ['#d39a2a', '#8e0b12']],
  ['cuso4 nh3', 0, 'Васильковый комплекс', 'Голубой → ярко-синий', ['#3b8fd9', '#2140c4']],
  ['h2so4c sucrose', 0, 'Чёрная змея', 'Кислота обугливает сахар', ['#fbfbf7', '#1d1b1a']],
  ['h2o2 h2so4 ki starch', 0, 'Иодные часы', 'Внезапная тёмная синева', ['#eef3f7', '#171b63']],
  ['cuso4 glucose naoh', 1, 'Проба Троммера', 'Синий → зелёный → кирпичный', ['#3b8fd9', '#3fae7a', '#d9b53a', '#b8391e']],
  ['k2cro4 h2so4', 0, 'Жёлтое в оранжевое', 'Хромат → дихромат', ['#f2c418', '#ee7a12']],
  ['k2cro4 agno3', 0, 'Кирпичный осадок', 'Хромат серебра', ['#f2c418', '#a2331e']],
  ['cocl2', 1, 'Кобальтовый термометр', 'Розовый при нагреве синеет', ['#e58aa8', '#2d4fd6']],
  ['niso4 nh3', 0, 'Никелевый аммиакат', 'Зелёный → сине-фиолетовый', ['#58b36a', '#6b5bd6']],
  ['srcl2', 1, 'Красное пламя', 'Пламенная проба стронция', ['#ffd9a0', '#e3122b']],
  ['cuso4', 1, 'Зелёное пламя', 'Пламенная проба меди', ['#ffd9a0', '#1fb7a6']],
  ['K h2o php', 0, 'Калий в воде', 'Лиловое пламя, малиновый раствор', ['#b98ce0', '#d6246e']],
  ['Al fe2o3', 1, 'Термит', 'Жидкое железо и снопы искр', ['#fff0c0', '#ff9a3a', '#5a5d61']],
  ['Mg O', 1, 'Магниевая вспышка', 'Ослепительный белый свет', ['#ffffff', '#f7f7f5', '#dfe7fb']],
  ['Cu agno3', 0, 'Серебряное дерево', 'Кристаллы серебра на меди', ['#c26b3a', '#cfd2d6', '#3b8fd9']]
];
/* ---------- Звук, частицы, всплывающие сообщения ---------- */
let AC = null;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } } return AC; }
function noise(dur, freq, q, gain, type = 'bandpass') {
  const c = ac(); if (!c || !G.sound) return;
  const n = c.createBuffer(1, c.sampleRate * dur, c.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const src = c.createBufferSource(); src.buffer = n;
  const f = c.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
  const g = c.createGain(); g.gain.value = gain;
  src.connect(f).connect(g).connect(c.destination); src.start();
}
function audio(events) {
  const fx = events.reduce((a, e) => Object.assign(a, e.fx), {});
  if (fx.boom) noise(1.2, 120, .7, 1.4, 'lowpass'); else if (fx.flame || fx.sparks) noise(1.6, 900, .4, .35);
  if (fx.bubbles) noise(2.2, 3200, .8, .25);
}
function chime(big) {
  const c = ac(); if (!c || !G.sound) return;
  const notes = big ? [523, 659, 784, 1047] : [660, 880];
  notes.forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + i * .11; o.type = 'triangle'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.12, t + .02); g.gain.exponentialRampToValueAtTime(.001, t + .5); o.connect(g).connect(c.destination); o.start(t); o.stop(t + .6); });
}
let toastT;
function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600); }
const FX = (() => {
  const cv = $('#fx'), ctx = cv.getContext('2d'); let parts = [], run = false;
  const cols = ['#f5c542', '#2a59d6', '#e3122b', '#1fb7a6', '#8a3fd1', '#ff9a3a'];
  function burst(n) {
    if (RM.matches) return;
    const dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (let i = 0; i < n; i++) parts.push({ x: innerWidth / 2 + (Math.random() - .5) * 200, y: innerHeight * .38, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 3, r: Math.random() * 6.28, vr: (Math.random() - .5) * .3, w: 6 + Math.random() * 6, c: cols[i % cols.length], life: 1 });
    if (!run) { run = true; requestAnimationFrame(step); }
  }
  function step() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) { p.x += p.vx; p.y += p.vy; p.vy += .35; p.vx *= .99; p.r += p.vr; p.life -= .008; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.c; ctx.fillRect(-p.w / 2, -p.w / 4, p.w, p.w / 2); ctx.restore(); }
    parts = parts.filter(p => p.life > 0 && p.y < innerHeight + 40);
    if (parts.length) requestAnimationFrame(step); else { run = false; ctx.clearRect(0, 0, innerWidth, innerHeight); }
  }
  return { burst };
})();
const confetti = n => FX.burst(n);
function flaskSVG(s) { return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M7.2 15h9.6l1.9 3.4a1 1 0 0 1-.9 1.6H6.2a1 1 0 0 1-.9-1.6z" fill="var(--accent)"/></svg>`; }
function heroArt() {
  const cv = $('#heroArt'); if (!cv) return; const ctx = cv.getContext('2d'); const cols = ['#7a1fa8', '#2f8f4a', '#c9a227', '#3f7dff', '#e3122b'];
  let t0 = performance.now();
  function f(now) {
    if ($('#scrMenu').hidden) { requestAnimationFrame(f); return; }
    const t = Math.max(0, now - t0) / 1000; ctx.clearRect(0, 0, 220, 220);
    const i = Math.floor(t / 2) % cols.length, k = (t / 2) % 1;
    const a = cols[i], b = cols[(i + 1) % cols.length];
    const mix = (h1, h2, u) => { const p = h => [1, 3, 5].map(j => parseInt(h.slice(j, j + 2), 16)); const x = p(h1), y = p(h2); return `rgb(${x.map((v, j) => Math.round(v + (y[j] - v) * u)).join(',')})`; };
    ctx.save(); ctx.beginPath(); ctx.moveTo(90, 30); ctx.lineTo(90, 80); ctx.lineTo(40, 180); ctx.quadraticCurveTo(35, 195, 55, 195); ctx.lineTo(165, 195); ctx.quadraticCurveTo(185, 195, 180, 180); ctx.lineTo(130, 80); ctx.lineTo(130, 30); ctx.closePath();
    ctx.globalAlpha = .9; ctx.clip(); ctx.fillStyle = mix(a, b, RM.matches ? 0 : k); ctx.fillRect(0, 118 + Math.sin(t * 2) * 3, 220, 120);
    ctx.fillStyle = 'rgba(255,255,255,.7)'; for (let j = 0; j < 7; j++) { const y = 190 - ((t * 30 + j * 23) % 70); ctx.beginPath(); ctx.arc(70 + j * 13, y, 3, 0, 7); ctx.fill(); }
    ctx.restore(); ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink'); ctx.globalAlpha = .6; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(90, 30); ctx.lineTo(90, 80); ctx.lineTo(40, 180); ctx.quadraticCurveTo(35, 195, 55, 195); ctx.lineTo(165, 195); ctx.quadraticCurveTo(185, 195, 180, 180); ctx.lineTo(130, 80); ctx.lineTo(130, 30); ctx.stroke(); ctx.globalAlpha = 1;
    if (!RM.matches) requestAnimationFrame(f);
  }
  requestAnimationFrame(f);
}

/*LAB*/

/* ---------- События интерфейса ---------- */
function bind() {
  document.addEventListener('click', e => {
    const gg = e.target.closest('[data-go]'); if (gg) { go(gg.dataset.go); return; }
    const m = e.target.closest('.node[data-m]'); if (m) { openMission(m.dataset.m); return; }
    const st = e.target.closest('[data-stab]'); if (st) { state.stripTab = st.dataset.stab; state.q = ''; $('#stripSearch').value = ''; store.set('strip', state.stripTab); renderStrip(); $('#stripRow').scrollLeft = 0; return; }
    const sh = e.target.closest('[data-show]'); if (sh) { const [ids, h, title] = SHOW[+sh.dataset.show]; const list = ids.split(' '); loadCombo(list, comboT(list, h)); toast(`Опыт «${title}»`); return; }
    const tl = e.target.closest('.ing[data-id]'); if (tl) { toggle(tl.dataset.id); return; }
    const rm = e.target.closest('[data-rm]'); if (rm) { toggle(rm.dataset.rm); return; }
    const op = e.target.closest('[data-open]'); if (op) { const c2 = CATALOG.find(x => x.key === op.dataset.open); openFree(c2.ids, comboT(c2.ids, c2.heat)); return; }
    const rv = e.target.closest('[data-reveal]'); if (rv) { G.reveal[rv.dataset.reveal] = true; save(); renderCol(); return; }
    const cf = e.target.closest('#colFilter button'); if (cf) { state.colFilter = cf.dataset.f; document.querySelectorAll('#colFilter button').forEach(b => b.setAttribute('aria-pressed', b === cf)); renderCol(); return; }
    const tp = e.target.closest('[data-t]'); if (tp) { setT(+tp.dataset.t, true); return; }
    const td = e.target.closest('[data-dt]'); if (td) { setT(state.T + (+td.dataset.dt), true); return; }
    if (e.target.closest('#hintBtn, #hintBtn2')) { useHint(); return; }
    if (e.target.closest('#toPanel')) { $('#mPanel').scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); return; }
    if (e.target.closest('#rcClose')) { $('#resCard').hidden = true; return; }
    if (e.target.closest('#toJournal')) { $('.journal').scrollIntoView({ behavior: RM.matches ? 'auto' : 'smooth', block: 'start' }); return; }
  });
  $('#stripSearch').addEventListener('input', e => { state.q = e.target.value.trim().toLowerCase(); renderStrip(); });
  const tube = $('#tTube'); let tDrag = false;
  const fromY = ev => { const r = tube.getBoundingClientRect(); const k = r.width > r.height ? (ev.clientX - r.left) / r.width : 1 - (ev.clientY - r.top) / r.height; setT(-30 + clampN(k, 0, 1) * 930, true); };
  tube.addEventListener('pointerdown', ev => { tDrag = true; tube.setPointerCapture(ev.pointerId); fromY(ev); });
  tube.addEventListener('pointermove', ev => { if (tDrag) fromY(ev); });
  tube.addEventListener('pointerup', () => { tDrag = false; });
  tube.addEventListener('keydown', ev => { const d = { ArrowUp: 10, ArrowRight: 10, ArrowDown: -10, ArrowLeft: -10, PageUp: 100, PageDown: -100 }[ev.key]; if (d) { ev.preventDefault(); setT(state.T + d, true); } });
  $('#logo').onclick = () => show('menu');
  $('#ctaPlay').onclick = () => { const nm = nextMission(); if (nm) openMission(nm.id); else show('map'); };
  $('#go').addEventListener('click', () => run());
  $('#clear').onclick = () => { state.sel = []; state.ran = false; state.runId++; renderSel(); Lab.setScene([], false); clearReport(); };
  const snd = $('#snd'); const paint = () => { snd.setAttribute('aria-pressed', G.sound); snd.textContent = G.sound ? 'Звук: вкл' : 'Звук: выкл'; };
  snd.onclick = () => { G.sound = !G.sound; save(); paint(); }; paint();
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') $('#modal').hidden = true; });
  addEventListener('keydown', e => { if (e.key === 'Escape') $('#modal').hidden = true; });
  paintT(); renderAdded();
}
bind(); renderMe(); if (!hero3D($('#heroArt'))) heroArt(); show('menu');
Lab.setScene([], false);
})();
