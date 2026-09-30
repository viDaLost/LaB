'use strict';
/* ===================== Химлаб 118 — движок реакций =====================
   Всё считается из данных: уравнения уравниваются решением системы
   (сохранение атомов и заряда), ΔH° — по закону Гесса из стандартных
   энтальпий образования (25 °C, NBS/CRC), замещение — по стандартным
   электродным потенциалам, осадки — по таблице растворимости. */

const EL_TXT = `1 H Водород nm g 2.20 1
2 He Гелий ng g - 0
3 Li Литий am s 0.98 1
4 Be Бериллий ae s 1.57 2
5 B Бор ml s 2.04 3
6 C Углерод nm s 2.55 4
7 N Азот nm g 3.04 -3
8 O Кислород nm g 3.44 -2
9 F Фтор hal g 3.98 -1
10 Ne Неон ng g - 0
11 Na Натрий am s 0.93 1
12 Mg Магний ae s 1.31 2
13 Al Алюминий pt s 1.61 3
14 Si Кремний ml s 1.90 4
15 P Фосфор nm s 2.19 -3
16 S Сера nm s 2.58 -2
17 Cl Хлор hal g 3.16 -1
18 Ar Аргон ng g - 0
19 K Калий am s 0.82 1
20 Ca Кальций ae s 1.00 2
21 Sc Скандий tm s 1.36 3
22 Ti Титан tm s 1.54 4
23 V Ванадий tm s 1.63 3
24 Cr Хром tm s 1.66 3
25 Mn Марганец tm s 1.55 2
26 Fe Железо tm s 1.83 3
27 Co Кобальт tm s 1.88 2
28 Ni Никель tm s 1.91 2
29 Cu Медь tm s 1.90 2
30 Zn Цинк tm s 1.65 2
31 Ga Галлий pt s 1.81 3
32 Ge Германий ml s 2.01 4
33 As Мышьяк ml s 2.18 3
34 Se Селен nm s 2.55 -2
35 Br Бром hal l 2.96 -1
36 Kr Криптон ng g 3.00 0
37 Rb Рубидий am s 0.82 1
38 Sr Стронций ae s 0.95 2
39 Y Иттрий tm s 1.22 3
40 Zr Цирконий tm s 1.33 4
41 Nb Ниобий tm s 1.6 5
42 Mo Молибден tm s 2.16 6
43 Tc Технеций tm s 1.9 7
44 Ru Рутений tm s 2.2 3
45 Rh Родий tm s 2.28 3
46 Pd Палладий tm s 2.20 2
47 Ag Серебро tm s 1.93 1
48 Cd Кадмий tm s 1.69 2
49 In Индий pt s 1.78 3
50 Sn Олово pt s 1.96 4
51 Sb Сурьма ml s 2.05 3
52 Te Теллур ml s 2.1 -2
53 I Иод hal s 2.66 -1
54 Xe Ксенон ng g 2.6 0
55 Cs Цезий am s 0.79 1
56 Ba Барий ae s 0.89 2
57 La Лантан la s 1.10 3
58 Ce Церий la s 1.12 3
59 Pr Празеодим la s 1.13 3
60 Nd Неодим la s 1.14 3
61 Pm Прометий la s 1.13 3
62 Sm Самарий la s 1.17 3
63 Eu Европий la s 1.2 3
64 Gd Гадолиний la s 1.20 3
65 Tb Тербий la s 1.2 3
66 Dy Диспрозий la s 1.22 3
67 Ho Гольмий la s 1.23 3
68 Er Эрбий la s 1.24 3
69 Tm Тулий la s 1.25 3
70 Yb Иттербий la s 1.1 3
71 Lu Лютеций la s 1.27 3
72 Hf Гафний tm s 1.3 4
73 Ta Тантал tm s 1.5 5
74 W Вольфрам tm s 2.36 6
75 Re Рений tm s 1.9 7
76 Os Осмий tm s 2.2 4
77 Ir Иридий tm s 2.20 3
78 Pt Платина tm s 2.28 2
79 Au Золото tm s 2.54 3
80 Hg Ртуть tm l 2.00 2
81 Tl Таллий pt s 1.62 1
82 Pb Свинец pt s 2.33 2
83 Bi Висмут pt s 2.02 3
84 Po Полоний pt s 2.0 2
85 At Астат hal s 2.2 -1
86 Rn Радон ng g 2.2 0
87 Fr Франций am s 0.7 1
88 Ra Радий ae s 0.9 2
89 Ac Актиний ac s 1.1 3
90 Th Торий ac s 1.3 4
91 Pa Протактиний ac s 1.5 5
92 U Уран ac s 1.38 4
93 Np Нептуний ac s 1.36 4
94 Pu Плутоний ac s 1.28 4
95 Am Америций ac s 1.13 3
96 Cm Кюрий ac s 1.28 3
97 Bk Берклий ac s 1.3 3
98 Cf Калифорний ac s 1.3 3
99 Es Эйнштейний ac s 1.3 3
100 Fm Фермий ac s 1.3 3
101 Md Менделевий ac s 1.3 3
102 No Нобелий ac s 1.3 2
103 Lr Лоуренсий ac s 1.3 3
104 Rf Резерфордий tm s - 4
105 Db Дубний tm s - 5
106 Sg Сиборгий tm s - 6
107 Bh Борий tm s - 7
108 Hs Хассий tm s - 8
109 Mt Мейтнерий un s - 0
110 Ds Дармштадтий un s - 0
111 Rg Рентгений un s - 0
112 Cn Коперниций un s - 0
113 Nh Нихоний un s - 0
114 Fl Флеровий un s - 0
115 Mc Московий un s - 0
116 Lv Ливерморий un s - 0
117 Ts Теннессин un s - 0
118 Og Оганесон un s - 0`;

const EL = {}, ELS = [];
for (const line of EL_TXT.split('\n')) {
  const [z, sym, name, cat, st, en, ox] = line.trim().split(/\s+/);
  const e = { z: +z, sym, name, cat, st, en: en === '-' ? null : +en, ox: +ox };
  EL[sym] = e; ELS.push(e);
}
const MOLF = { H: 'H2', N: 'N2', O: 'O2', F: 'F2', Cl: 'Cl2', Br: 'Br2', I: 'I2', P: 'P4' };
const molF = s => MOLF[s] || s;
const STD = {}; for (const e of ELS) STD[molF(e.sym)] = e.st;
const CAT_RU = { am: 'щелочной металл', ae: 'щёлочноземельный металл', tm: 'переходный металл', pt: 'постпереходный металл', ml: 'полуметалл', nm: 'неметалл', hal: 'галоген', ng: 'благородный газ', la: 'лантаноид', ac: 'актиноид', un: 'свойства не изучены' };
const isMetal = e => ['am', 'ae', 'tm', 'pt', 'la', 'ac', 'un'].includes(e.cat);
const isRadio = e => e.z === 43 || e.z === 61 || e.z >= 84;
const noMacro = e => e.z === 85 || e.z === 87 || e.z >= 100;
const GEN_EX = { 'Свинец': 'свинца', 'Марганец': 'марганца', 'Никель': 'никеля' };
function gen(name) {
  if (GEN_EX[name]) return GEN_EX[name];
  const n = name.toLowerCase();
  if (n.endsWith('ий')) return n.slice(0, -2) + 'ия';
  if (n.endsWith('ь')) return n.slice(0, -1) + 'и';
  if (n.endsWith('о')) return n.slice(0, -1) + 'а';
  if (n.endsWith('а')) return n.slice(0, -1) + 'ы';
  return n + 'а';
}
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
const MP = { Li: 180.5, Na: 97.8, K: 63.5, Rb: 39.3, Cs: 28.5, Ga: 29.8, In: 156.6, Sn: 231.9, Bi: 271.4, Pb: 327.5, Zn: 419.5, Mg: 650, Al: 660.3, S: 115.2, P: 44.1, I: 113.7, Se: 221, Te: 449.5, Cu: 1084.6, Fe: 1538, Ag: 961.8, Au: 1064.2, Pt: 1768.3, W: 3422, Si: 1414, Ca: 842, Ba: 727, Sr: 777, Ti: 1668, Ni: 1455, Co: 1495, Cr: 1907, Mn: 1246, Sb: 630.6, Cd: 321.1, Tl: 304, B: 2076, Hg: -38.8, Br: -7.2 };

/* ---------- Стандартные энтальпии образования, кДж/моль, 25 °C ---------- */
const HF = {
  // ионы в растворе
  'H^+|aq': 0, 'OH^-|aq': -230.0, 'Li^+|aq': -278.5, 'Na^+|aq': -240.1, 'K^+|aq': -252.4, 'Rb^+|aq': -251.2, 'Cs^+|aq': -258.3, 'NH4^+|aq': -132.5,
  'Mg^2+|aq': -466.9, 'Ca^2+|aq': -542.8, 'Sr^2+|aq': -545.8, 'Ba^2+|aq': -537.6, 'Al^3+|aq': -531.0, 'Zn^2+|aq': -153.9, 'Fe^2+|aq': -89.1, 'Fe^3+|aq': -48.5,
  'Cu^2+|aq': 64.8, 'Ag^+|aq': 105.6, 'Pb^2+|aq': -1.7, 'Ni^2+|aq': -54.0, 'Co^2+|aq': -58.2, 'Mn^2+|aq': -220.8, 'Sn^2+|aq': -8.8, 'Hg^2+|aq': 171.1, 'Cd^2+|aq': -75.9,
  'F^-|aq': -332.6, 'Cl^-|aq': -167.2, 'Br^-|aq': -121.6, 'I^-|aq': -55.2, 'SO4^2-|aq': -909.3, 'HSO4^-|aq': -887.3, 'NO3^-|aq': -207.4, 'CO3^2-|aq': -677.1, 'HCO3^-|aq': -692.0,
  'CH3COO^-|aq': -486.0, 'MnO4^-|aq': -541.4, 'ClO^-|aq': -107.1, 'SCN^-|aq': 76.4, '[Cu(NH3)4]^2+|aq': -348.5, '[Al(OH)4]^-|aq': -1502.5,
  // молекулы в растворе
  'CH3COOH|aq': -485.8, 'NH3|aq': -80.3, 'H2O2|aq': -191.2, 'CO2|aq': -413.8, 'H2CO3|aq': -699.7, 'I2|aq': 22.6, 'Br2|aq': -2.6, 'Cl2|aq': -23.4, 'HClO|aq': -120.9,
  // вода, газы, жидкости
  'H2O|l': -285.8, 'H2O|g': -241.8, 'H2O2|l': -187.8, 'HCl|g': -92.3, 'HF|g': -273.3, 'HBr|g': -36.3, 'HI|g': 26.5, 'H2S|g': -20.6, 'NH3|g': -45.9, 'CH4|g': -74.8,
  'CO2|g': -393.5, 'CO|g': -110.5, 'SO2|g': -296.8, 'NO|g': 91.3, 'NO2|g': 33.2, 'PCl3|l': -319.7, 'PCl5|s': -443.5, 'SiCl4|l': -687.0, 'S2Cl2|l': -59.4, 'CS2|l': 89.0,
  'CF4|g': -933.6, 'SF6|g': -1220.5, 'SiF4|g': -1615.0, 'BF3|g': -1136.0, 'BCl3|g': -403.8, 'PF5|g': -1594.4, 'XeF2|g': -107.5, 'TiCl4|l': -804.2, 'SnCl4|l': -511.3,
  // оксиды
  'Li2O|s': -597.9, 'Na2O|s': -414.2, 'Na2O2|s': -510.9, 'K2O|s': -361.5, 'KO2|s': -284.9, 'MgO|s': -601.6, 'CaO|s': -634.9, 'SrO|s': -592.0, 'BaO|s': -548.0, 'BeO|s': -609.4,
  'Al2O3|s': -1675.7, 'Fe3O4|s': -1118.4, 'Fe2O3|s': -824.2, 'FeO|s': -272.0, 'CuO|s': -157.3, 'Cu2O|s': -168.6, 'ZnO|s': -350.5, 'PbO|s': -219.0, 'HgO|s': -90.8, 'Ag2O|s': -31.1,
  'TiO2|s': -944.0, 'Cr2O3|s': -1139.7, 'MnO2|s': -520.0, 'Mn3O4|s': -1387.8, 'NiO|s': -239.7, 'Co3O4|s': -891.0, 'SnO2|s': -577.6, 'WO3|s': -842.9, 'V2O5|s': -1550.6, 'MoO3|s': -745.1,
  'SeO2|s': -225.4, 'GeO2|s': -580.0, 'P4O10|s': -2984.0, 'SiO2|s': -910.7, 'B2O3|s': -1273.5,
  // галогениды
  'LiCl|s': -408.6, 'NaCl|s': -411.2, 'KCl|s': -436.5, 'RbCl|s': -435.4, 'CsCl|s': -443.0, 'MgCl2|s': -641.3, 'CaCl2|s': -795.4, 'SrCl2|s': -828.9, 'BaCl2|s': -855.0, 'AlCl3|s': -704.2,
  'FeCl3|s': -399.5, 'FeCl2|s': -341.8, 'CuCl2|s': -220.1, 'CuCl|s': -137.2, 'ZnCl2|s': -415.1, 'AgCl|s': -127.0, 'PbCl2|s': -359.4, 'HgCl2|s': -224.3, 'AuCl3|s': -117.6,
  'NaBr|s': -361.1, 'KBr|s': -393.8, 'AgBr|s': -100.4, 'AlBr3|s': -527.2, 'CuBr2|s': -141.8, 'NaI|s': -287.8, 'KI|s': -327.9, 'LiI|s': -270.4, 'AgI|s': -61.8, 'AlI3|s': -313.8,
  'CuI|s': -67.8, 'PbI2|s': -175.5, 'NaF|s': -576.6, 'KF|s': -567.3, 'LiF|s': -616.0, 'CaF2|s': -1228.0, 'MgF2|s': -1124.2, 'AlF3|s': -1510.4,
  // сульфиды, нитриды, гидриды
  'Na2S|s': -364.8, 'K2S|s': -380.7, 'MgS|s': -346.0, 'CaS|s': -482.4, 'Al2S3|s': -724.0, 'FeS|s': -100.0, 'Cu2S|s': -79.5, 'CuS|s': -53.1, 'ZnS|s': -206.0, 'Ag2S|s': -32.6,
  'HgS|s': -58.2, 'PbS|s': -100.4, 'Li3N|s': -164.6, 'Mg3N2|s': -461.1, 'Ca3N2|s': -431.0, 'AlN|s': -318.0, 'TiN|s': -337.9,
  'LiH|s': -90.5, 'NaH|s': -56.3, 'KH|s': -57.7, 'CaH2|s': -181.5,
  // гидроксиды, соли кислородных кислот
  'NaOH|s': -425.6, 'KOH|s': -424.6, 'LiOH|s': -484.9, 'Ca(OH)2|s': -985.2, 'Mg(OH)2|s': -924.5, 'Cu(OH)2|s': -449.8, 'Fe(OH)3|s': -823.0, 'Fe(OH)2|s': -569.0, 'Zn(OH)2|s': -641.9,
  'CaCO3|s': -1207.6, 'Na2CO3|s': -1130.7, 'NaHCO3|s': -950.8, 'MgCO3|s': -1095.8, 'Cu2(OH)2CO3|s': -1051.4, 'BaSO4|s': -1473.2, 'PbSO4|s': -920.0, 'CaSO4|s': -1434.5,
  'KMnO4|s': -837.2, 'NH4Cl|s': -314.4,
  'CrO4^2-|aq': -881.2, 'Cr2O7^2-|aq': -1490.3, '[Fe(CN)6]^4-|aq': 455.6, 'Ag2CrO4|s': -731.7, 'C12H22O11|s': -2226.1, 'C6H12O6|aq': -1263.8, 'H2SO4|l': -814.0, 'CuSO4|s': -771.4
};

/* ---------- Формулы: разбор, заряд, отображение ---------- */
function parseCharge(ch) {
  if (ch === undefined) return 0;
  const m = ch.match(/^(\d*)([+-])$/);
  return (m[1] ? +m[1] : 1) * (m[2] === '+' ? 1 : -1);
}
function parseGroup(s) {
  let i = 0;
  const num = () => { let d = ''; while (i < s.length && /\d/.test(s[i])) d += s[i++]; return d ? +d : 1; };
  function seq() {
    const a = {};
    while (i < s.length) {
      const ch = s[i];
      if (ch === '(' || ch === '[') { i++; const inner = seq(); i++; const n = num(); for (const k in inner) a[k] = (a[k] || 0) + inner[k] * n; }
      else if (ch === ')' || ch === ']') return a;
      else if (/[A-Z]/.test(ch)) { let sym = ch; i++; if (i < s.length && /[a-z]/.test(s[i])) sym += s[i++]; const n = num(); a[sym] = (a[sym] || 0) + n; }
      else i++;
    }
    return a;
  }
  return seq();
}
const _pf = {};
function parseF(f) {
  if (_pf[f]) return _pf[f];
  const [base, ch] = f.split('^');
  const atoms = {};
  for (let part of base.split('·')) {
    let mult = 1; const m = part.match(/^(\d+)(.*)$/);
    if (m) { mult = +m[1]; part = m[2]; }
    const a = parseGroup(part);
    for (const k in a) atoms[k] = (atoms[k] || 0) + a[k] * mult;
  }
  return (_pf[f] = { atoms, charge: parseCharge(ch) });
}
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; }
const lcm = (a, b) => a / gcd(a, b) * b;

function ionParts(ion) { const [b, ch] = ion.split('^'); return { b, z: Math.abs(parseCharge(ch)) }; }
const isPoly = b => !b.startsWith('[') && (b.match(/[A-Z]/g) || []).length > 1;
function saltFormula(cat, an) {
  const c = ionParts(cat), a = ionParts(an), g = gcd(c.z, a.z);
  const nc = a.z / g, na = c.z / g;
  const part = (b, n) => n === 1 ? b : (isPoly(b) ? `(${b})${n}` : `${b}${n}`);
  if (a.b === 'CH3COO') return part(a.b, na) + part(c.b, nc);
  return part(c.b, nc) + part(a.b, na);
}
const CATIONS = ['H^+', 'Li^+', 'Na^+', 'K^+', 'Rb^+', 'Cs^+', 'NH4^+', 'Mg^2+', 'Ca^2+', 'Sr^2+', 'Ba^2+', 'Al^3+', 'Zn^2+', 'Fe^2+', 'Fe^3+', 'Cu^2+', 'Ag^+', 'Pb^2+', 'Ni^2+', 'Co^2+', 'Mn^2+', 'Sn^2+', 'Hg^2+', 'Cd^2+', '[Cu(NH3)4]^2+'];
const ANIONS = ['OH^-', 'F^-', 'Cl^-', 'Br^-', 'I^-', 'SO4^2-', 'NO3^-', 'CO3^2-', 'HCO3^-', 'CH3COO^-', 'MnO4^-', 'ClO^-', 'SCN^-', '[Al(OH)4]^-', 'CrO4^2-', 'Cr2O7^2-', '[Fe(CN)6]^4-'];
const _salt = {};
function saltIons(f) {
  if (f in _salt) return _salt[f];
  for (const c of CATIONS) for (const a of ANIONS) {
    if (saltFormula(c, a) === f) {
      const cz = ionParts(c).z, az = ionParts(a).z, g = gcd(cz, az);
      return (_salt[f] = [[c, az / g], [a, cz / g]]);
    }
  }
  return (_salt[f] = null);
}
function hf(f, s) {
  if (STD[f] === s) return 0;
  const k = f + '|' + s;
  if (k in HF) return HF[k];
  if (s === 'aq') {
    const ions = saltIons(f);
    if (ions) { let t = 0; for (const [ion, n] of ions) { const v = HF[ion + '|aq']; if (v === undefined) return null; t += v * n; } return Math.round(t * 10) / 10; }
  }
  return null;
}

const PSTATE = { H2O: 'l', HCl: 'g', HF: 'g', HBr: 'g', HI: 'g', H2S: 'g', H2Se: 'g', NH3: 'g', CH4: 'g', CO2: 'g', CO: 'g', SO2: 'g', NO: 'g', NO2: 'g', O2: 'g', H2: 'g', N2: 'g', Cl2: 'g', F2: 'g',
  PCl3: 'l', SiCl4: 'l', S2Cl2: 'l', CS2: 'l', CF4: 'g', SF6: 'g', SiF4: 'g', BF3: 'g', BCl3: 'g', PF5: 'g', XeF2: 'g', TiCl4: 'l', SnCl4: 'l', SeF6: 'g', TeF6: 'g', WF6: 'g', MoF6: 'l',
  PBr3: 'l', SiBr4: 'l', BBr3: 'l', GeCl4: 'l', AsCl3: 'l', AsF5: 'g', SbF5: 'l', GeF4: 'g', ClF: 'g', BrCl: 'g', BrF3: 'l', IF5: 'l', Br2: 'l', Hg: 'l' };
const defState = f => /\^/.test(f) ? 'aq' : (STD[f] || PSTATE[f] || 's');

/* ---------- Уравнения: разбор, уравнивание, ΔH ---------- */
function parseSide(s) {
  return s.split(' + ').map(t => {
    t = t.trim();
    const m = t.match(/^(\d+)?\s*(.+?)(?:\((s|l|g|aq)\))?$/);
    const f = m[2];
    return { c: m[1] ? +m[1] : null, f, s: m[3] || defState(f) };
  });
}
function balanceTerms(terms) {
  const els = new Set();
  const comp = terms.map(t => { const p = parseF(t.f); Object.keys(p.atoms).forEach(e => els.add(e)); return p; });
  const rows = [...els].map(e => comp.map((c, i) => (c.atoms[e] || 0) * terms[i].side));
  rows.push(comp.map((c, i) => c.charge * terms[i].side));
  const n = terms.length, M = rows.map(r => r.slice());
  const piv = []; let r = 0;
  for (let col = 0; col < n && r < M.length; col++) {
    let p = -1; for (let i = r; i < M.length; i++) if (M[i][col] !== 0) { p = i; break; }
    if (p < 0) continue;
    [M[r], M[p]] = [M[p], M[r]];
    for (let i = 0; i < M.length; i++) {
      if (i === r || M[i][col] === 0) continue;
      const a = M[r][col], b = M[i][col];
      M[i] = M[i].map((v, j) => v * a - M[r][j] * b);
      const g = M[i].reduce((x, y) => gcd(x, y), 0) || 1;
      M[i] = M[i].map(v => v / g);
    }
    piv.push(col); r++;
  }
  const free = []; for (let c = 0; c < n; c++) if (!piv.includes(c)) free.push(c);
  if (free.length !== 1) return null;
  const f = free[0]; let L = 1;
  piv.forEach((c, i) => { L = lcm(L, Math.abs(M[i][c])); });
  const x = new Array(n).fill(0); x[f] = L;
  piv.forEach((c, i) => { x[c] = -M[i][f] * L / M[i][c]; });
  let g = x.reduce((a, b) => gcd(a, b), 0) || 1; let res = x.map(v => v / g);
  if (res.every(v => v <= 0)) res = res.map(v => -v);
  if (res.some(v => v <= 0 || !Number.isInteger(v))) return null;
  return res;
}
function checkBalance(terms) {
  const tot = {}; let q = 0;
  for (const t of terms) { const p = parseF(t.f); for (const k in p.atoms) tot[k] = (tot[k] || 0) + p.atoms[k] * t.c * t.side; q += p.charge * t.c * t.side; }
  return q === 0 && Object.values(tot).every(v => v === 0);
}
const BAD_EQ = [];
function mk(str, over) {
  const rev = str.includes('<=>');
  const [L, R] = str.split(rev ? '<=>' : '->');
  const r = parseSide(L), p = parseSide(R);
  const terms = [...r.map(t => ({ ...t, side: 1 })), ...p.map(t => ({ ...t, side: -1 }))];
  const given = terms.some(t => t.c !== null);
  if (given) terms.forEach(t => { if (t.c === null) t.c = 1; });
  else { const c = balanceTerms(terms); if (c) c.forEach((v, i) => terms[i].c = v); else terms.forEach(t => t.c = 1); }
  const ok = checkBalance(terms);
  if (!ok) BAD_EQ.push(str);
  const R2 = terms.filter(t => t.side === 1), P2 = terms.filter(t => t.side === -1);
  let dH = 0;
  for (const t of terms) { const v = hf(t.f, t.s); if (v === null) { dH = null; break; } dH -= t.side * t.c * v; }
  if (dH !== null) dH = Math.round(dH * 10) / 10;
  return { r: R2, p: P2, rev, over: over || '', dH, ok };
}
const eqText = eq => eq.r.map(t => (t.c > 1 ? t.c : '') + t.f).join(' + ') + (eq.rev ? ' ⇄ ' : ' → ') + eq.p.map(t => (t.c > 1 ? t.c : '') + t.f).join(' + ');

/* ---------- Справочные таблицы ---------- */
// Стандартные электродные потенциалы M^n+/M, В
const E0 = { Li: [-3.04, 1], Cs: [-3.03, 1], Rb: [-2.98, 1], K: [-2.93, 1], Ba: [-2.91, 2], Sr: [-2.89, 2], Ca: [-2.87, 2], Na: [-2.71, 1], Mg: [-2.37, 2], Be: [-1.85, 2], Al: [-1.66, 3],
  Ti: [-1.63, 2], Mn: [-1.18, 2], Zn: [-0.76, 2], Cr: [-0.74, 3], Ga: [-0.53, 3], Fe: [-0.44, 2], Cd: [-0.40, 2], In: [-0.34, 3], Tl: [-0.34, 1], Co: [-0.28, 2], Ni: [-0.25, 2], Sn: [-0.14, 2],
  Pb: [-0.13, 2], Cu: [0.34, 2], Bi: [0.31, 3], Ag: [0.80, 1], Hg: [0.85, 2], Pd: [0.95, 2], Pt: [1.18, 2], Au: [1.50, 3] };
const ACTIVE = new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'Ca', 'Sr', 'Ba']);
const HAL_ORDER = ['F', 'Cl', 'Br', 'I'];
const FLAME = { Li: ['#d4193a', 'карминово-красный', '670,8 нм'], Na: ['#ffb000', 'ярко-жёлтый', '589 нм (D-линия)'], K: ['#b98ce0', 'бледно-фиолетовый', '766 и 404 нм'],
  Rb: ['#c2185b', 'красно-фиолетовый', '780 нм'], Cs: ['#6f63d9', 'сине-фиолетовый', '455 нм'], Ca: ['#ef5a24', 'кирпично-красный', '≈ 622 нм'], Sr: ['#e3122b', 'малиново-красный', '≈ 606–680 нм'],
  Ba: ['#9fd12e', 'жёлто-зелёный', '≈ 524 нм'], Cu: ['#1fb7a6', 'сине-зелёный', '≈ 510–525 нм'], B: ['#3fcf6a', 'ярко-зелёный', '≈ 548 нм'] };
const OXIDE = { Li: 'Li2O', Na: 'Na2O2', K: 'KO2', Rb: 'RbO2', Cs: 'CsO2', Fe: 'Fe3O4', Mn: 'Mn3O4', Co: 'Co3O4', Pb: 'PbO', Cu: 'CuO', Ti: 'TiO2', V: 'V2O5', Cr: 'Cr2O3', W: 'WO3', Mo: 'MoO3',
  Sn: 'SnO2', Ni: 'NiO', Hg: 'HgO', Os: 'OsO4', Re: 'Re2O7', Ce: 'CeO2', U: 'U3O8', Ba: 'BaO', Tl: 'Tl2O', Bi: 'Bi2O3', Sb: 'Sb2O3', As: 'As2O3', Ge: 'GeO2', Se: 'SeO2', Te: 'TeO2',
  C: 'CO2', S: 'SO2', P: 'P4O10', Si: 'SiO2', B: 'B2O3', Mg: 'MgO', Ca: 'CaO', Sr: 'SrO', Zn: 'ZnO', Al: 'Al2O3', Be: 'BeO', Cd: 'CdO', Zr: 'ZrO2', Hf: 'HfO2', Nb: 'Nb2O5', Ta: 'Ta2O5',
  Pr: 'Pr6O11', Tb: 'Tb4O7', Th: 'ThO2', Pu: 'PuO2', Np: 'NpO2', Pd: 'PdO', Ru: 'RuO2', Rh: 'Rh2O3' };
const NAMES = { H2O: 'вода', HCl: 'хлороводород', HF: 'фтороводород', HBr: 'бромоводород', HI: 'иодоводород', H2S: 'сероводород', H2Se: 'селеноводород', NH3: 'аммиак', CH4: 'метан',
  Na2O2: 'пероксид натрия', KO2: 'надпероксид калия', RbO2: 'надпероксид рубидия', CsO2: 'надпероксид цезия', Fe3O4: 'оксид железа(II,III), железная окалина', Mn3O4: 'оксид марганца(II,III)',
  Co3O4: 'оксид кобальта(II,III)', U3O8: 'оксид урана(V,VI)', Pr6O11: 'смешанный оксид празеодима', Tb4O7: 'смешанный оксид тербия', XeF2: 'дифторид ксенона', P4S3: 'сесквисульфид фосфора' };
const PCOLOR = { MgO: '#f7f7f5', CuO: '#1d1b1a', Fe3O4: '#26231f', Cu2S: '#2a2a2e', FeS: '#3a3834', ZnS: '#f3f1e8', Al2S3: '#d8d3a7', FeCl3: '#6b3a1b', CuCl2: '#9a6a2c', AuCl3: '#b3441e',
  HgS: '#232323', PbO: '#e9b83c', HgO: '#c94a2a', Mg3N2: '#c9cf7a', Li3N: '#8b2b4d', Na2O2: '#f3e8b5', KO2: '#f0b347', AlI3: '#efe7df', CuBr2: '#3a2320', FeBr3: '#5a2c1a',
  Cu2O: '#b1391e', AgCl: '#f4f4f0', Ag2S: '#1f1f1f', PbS: '#2b2b2b', CuI: '#efe9df', FeI2: '#5d4a3a', Cr2O3: '#3f6b3a', Co3O4: '#1f1f22', NiO: '#4f6b4a', V2O5: '#e39b2a', MoO3: '#e8ecef', WO3: '#d9d34a',
  C: '#1c1c1c', Cu: '#b8562c', Fe: '#5a5d61', Ag: '#cfd2d6', Mn: '#8a8c8e', Pb: '#8d939a', Sn: '#c8ccd0', Zn: '#b8bec5', Ni: '#a9aca8', Co: '#8a8f99', Hg: '#cfd3d8', Au: '#e2b64a', Pt: '#d7d9db', Bi: '#c9b8c9', Cd: '#b9bec2', Al2O3: '#f7f7f5', P4O10: '#fbfbfb', SiO2: '#efefef', B2O3: '#f5f5f5' };
const ELCOLOR = { Cu: '#c26b3a', Au: '#e2b64a', Cs: '#dcc57e', S: '#e9d23a', P: '#efe6c8', C: '#262626', I: '#3b2c55', Br: '#8e2a12', Hg: '#cfd3d8', Cl: '#c5d86a', F: '#eeeaa8', Se: '#5f5f63',
  B: '#5b4a3a', Si: '#6f7a86', As: '#707476', Te: '#8b8f93', Sb: '#9da2a6', Ge: '#8c9196', Os: '#8fa0b7', Bi: '#c9b8c9' };
const ION_COLOR = { 'Cu^2+': '#3b8fd9', 'Fe^3+': '#d39a2a', 'Fe^2+': '#b9d69b', 'MnO4^-': '#7a1fa8', '[Cu(NH3)4]^2+': '#2140c4', '[Fe(SCN)]^2+': '#8e0b12', 'I2': '#9a5a17', 'Br2': '#e0892f', 'Cl2': '#e3eeb0', 'Ni^2+': '#58b36a', 'Co^2+': '#e58aa8', 'php': '#d6246e', 'CrO4^2-': '#f2c418', 'Cr2O7^2-': '#ee7a12', '[Fe(CN)6]^4-': '#efe08a', '[Ni(NH3)6]^2+': '#6b5bd6', '[CoCl4]^2-': '#2d4fd6' };
const GASCOLOR = { Cl2: '#c7d65a', F2: '#e8e39a', Br2: '#9c3a17', NO2: '#8a3b12', I2: '#7b3fa0' };

/* Осадки: катион|анион → формула, цвет, описание. Где осадок образуется не простым
   соединением ионов, задано своё уравнение. */
const PPT = {
  'Ag^+|Cl^-': ['AgCl', '#f4f4f0', 'белый творожистый осадок хлорида серебра'],
  'Ag^+|Br^-': ['AgBr', '#eee3b0', 'светло-жёлтый осадок бромида серебра', true],
  'Ag^+|I^-': ['AgI', '#f2d651', 'жёлтый осадок иодида серебра', true],
  'Ag^+|OH^-': ['Ag2O', '#5a3d2b', 'бурый осадок оксида серебра (AgOH сразу теряет воду)', false, '2Ag^+ + 2OH^- -> Ag2O(s) + H2O(l)'],
  'Ag^+|CO3^2-': ['Ag2CO3', '#efe8c8', 'желтовато-белый осадок карбоната серебра'],
  'Ag^+|SCN^-': ['AgSCN', '#f3f3ee', 'белый осадок роданида серебра'],
  'Pb^2+|I^-': ['PbI2', '#ffd21f', 'ярко-жёлтый осадок иодида свинца — «золотой дождь»: при нагревании растворяется, при остывании выпадает блестящими чешуйками', true],
  'Pb^2+|Cl^-': ['PbCl2', '#f3f3f0', 'белый осадок хлорида свинца (растворяется в горячей воде)'],
  'Pb^2+|Br^-': ['PbBr2', '#f3f3f0', 'белый осадок бромида свинца'],
  'Pb^2+|SO4^2-': ['PbSO4', '#f5f5f2', 'белый осадок сульфата свинца'],
  'Pb^2+|OH^-': ['Pb(OH)2', '#f1f1ee', 'белый осадок гидроксида свинца'],
  'Pb^2+|CO3^2-': ['PbCO3', '#f4f4f1', 'белый осадок карбоната свинца'],
  'Ba^2+|SO4^2-': ['BaSO4', '#f7f7f5', 'белый мелкокристаллический осадок сульфата бария — нерастворим даже в кислотах'],
  'Ba^2+|CO3^2-': ['BaCO3', '#f5f5f3', 'белый осадок карбоната бария'],
  'Ca^2+|CO3^2-': ['CaCO3', '#f5f5f2', 'белый осадок карбоната кальция (мел)'],
  'Ca^2+|SO4^2-': ['CaSO4', '#f3f3f0', 'белая муть малорастворимого сульфата кальция (гипс)'],
  'Cu^2+|OH^-': ['Cu(OH)2', '#5aa9e6', 'голубой студенистый осадок гидроксида меди(II)'],
  'Cu^2+|CO3^2-': ['Cu2(OH)2CO3', '#3fae9a', 'зелёно-голубой осадок основного карбоната меди (как малахит) и пузырьки CO₂', false, '2Cu^2+ + 2CO3^2- + H2O(l) -> Cu2(OH)2CO3(s) + CO2(g)'],
  'Fe^3+|OH^-': ['Fe(OH)3', '#9a4a1c', 'бурый осадок гидроксида железа(III) — цвет ржавчины'],
  'Fe^3+|CO3^2-': ['Fe(OH)3', '#9a4a1c', 'бурый осадок Fe(OH)₃ и пузырьки CO₂: карбонат железа(III) не существует, он сразу гидролизуется', false, '2Fe^3+ + 3CO3^2- + 3H2O(l) -> 2Fe(OH)3(s) + 3CO2(g)'],
  'Fe^2+|OH^-': ['Fe(OH)2', '#7d9a64', 'серо-зелёный осадок гидроксида железа(II); на воздухе буреет'],
  'Fe^2+|CO3^2-': ['FeCO3', '#c9c9b0', 'светлый осадок карбоната железа(II)'],
  'Mg^2+|OH^-': ['Mg(OH)2', '#f5f5f2', 'белый осадок гидроксида магния'],
  'Mg^2+|CO3^2-': ['MgCO3', '#f5f5f2', 'белый осадок карбоната магния'],
  'Zn^2+|OH^-': ['Zn(OH)2', '#f5f5f2', 'белый осадок гидроксида цинка (растворяется в избытке щёлочи)'],
  'Zn^2+|CO3^2-': ['ZnCO3', '#f5f5f2', 'белый осадок карбоната цинка'],
  'Al^3+|OH^-': ['Al(OH)3', '#f2f4f5', 'белый студенистый осадок гидроксида алюминия'],
  'Ag^+|CrO4^2-': ['Ag2CrO4', '#a2331e', 'кирпично-красный осадок хромата серебра'],
  'Pb^2+|CrO4^2-': ['PbCrO4', '#f5c400', 'ярко-жёлтый осадок хромата свинца — старинный пигмент «крон жёлтый»', true],
  'Ba^2+|CrO4^2-': ['BaCrO4', '#f1d63a', 'жёлтый осадок хромата бария', true],
  'Ni^2+|OH^-': ['Ni(OH)2', '#6fbf6a', 'яблочно-зелёный осадок гидроксида никеля'],
  'Co^2+|OH^-': ['Co(OH)2', '#d97a9a', 'осадок гидроксида кобальта: сначала синий, затем розовеет'],
  'Ni^2+|CO3^2-': ['NiCO3', '#8ccf86', 'светло-зелёный осадок карбоната никеля'],
  'Co^2+|CO3^2-': ['CoCO3', '#e39ab5', 'розовый осадок карбоната кобальта'],
  'Sr^2+|SO4^2-': ['SrSO4', '#f5f5f2', 'белый осадок сульфата стронция'],
  'Sr^2+|CO3^2-': ['SrCO3', '#f5f5f2', 'белый осадок карбоната стронция'],
  'Fe^3+|[Fe(CN)6]^4-': ['Fe4[Fe(CN)6]3', '#143a9e', 'тёмно-синий осадок берлинской лазури — первого синтетического пигмента (Берлин, 1706)'],
  'Cu^2+|[Fe(CN)6]^4-': ['Cu2[Fe(CN)6]', '#8a3a1e', 'красно-бурый осадок гексацианоферрата меди']
};
const ANAME = { O: 'оксид', S: 'сульфид', Se: 'селенид', Te: 'теллурид', N: 'нитрид', P: 'фосфид', As: 'арсенид', H: 'гидрид', F: 'фторид', Cl: 'хлорид', Br: 'бромид', I: 'иодид', C: 'карбид' };
const ACHARGE = { O: 2, S: 2, Se: 2, Te: 2, N: 3, P: 3, As: 3, H: 1, F: 1, Cl: 1, Br: 1, I: 1 };
const FIXVAL = new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra', 'Al', 'Ga', 'In', 'Zn', 'Cd', 'Ag', 'Sc', 'Y', 'H', 'La', 'Gd', 'Lu']);
function compoundName(f) {
  if (NAMES[f]) return NAMES[f];
  const at = parseF(f).atoms, ks = Object.keys(at);
  if (ks.length !== 2) return '';
  let an = ks.find(k => ANAME[k] && (ks.length === 2) && (EL[k].en || 0) >= Math.max(...ks.map(x => EL[x].en || 0)));
  if (!an) an = ks.find(k => ANAME[k]);
  if (!an) return '';
  const ca = ks.find(k => k !== an);
  if (!ACHARGE[an]) return '';
  const ox = ACHARGE[an] * at[an] / at[ca];
  let name = ANAME[an] + ' ' + gen(EL[ca].name);
  if (!FIXVAL.has(ca) && Number.isInteger(ox) && ox <= 8) name += `(${ROMAN[ox]})`;
  return name;
}
function binary(m, mc, x, xc) {
  const g = gcd(mc, xc), a = xc / g, b = mc / g;
  return `${m}${a > 1 ? a : ''}${x}${b > 1 ? b : ''}`;
}
function mixColors(list) {
  const cs = list.filter(Boolean);
  if (!cs.length) return null;
  const rgb = cs.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)));
  const avg = [0, 1, 2].map(i => Math.round(rgb.reduce((s, c) => s + c[i], 0) / rgb.length));
  return '#' + avg.map(v => v.toString(16).padStart(2, '0')).join('');
}

/* ---------- Реактивы лаборатории ---------- */
const REAGENTS = [
  { id: 'h2o', name: 'Вода', f: 'H2O', ph: 'l', g: 'Растворители и газы' },
  { id: 'co2', name: 'Углекислый газ', f: 'CO2', ph: 'g', g: 'Растворители и газы' },
  { id: 'hcl', name: 'Соляная кислота', f: 'HCl', ph: 'aq', note: 'разбавленная', ions: [['H^+', 1], ['Cl^-', 1]], acid: 's', g: 'Кислоты' },
  { id: 'h2so4', name: 'Серная кислота', f: 'H2SO4', ph: 'aq', note: 'разбавленная', ions: [['H^+', 2], ['SO4^2-', 1]], acid: 's', g: 'Кислоты' },
  { id: 'hno3', name: 'Азотная кислота', f: 'HNO3', ph: 'aq', note: 'разбавленная', ions: [['H^+', 1], ['NO3^-', 1]], acid: 's', g: 'Кислоты' },
  { id: 'ch3cooh', name: 'Уксусная кислота', f: 'CH3COOH', ph: 'aq', note: 'столовый уксус', mol: 'CH3COOH', acid: 'w', g: 'Кислоты' },
  { id: 'naoh', name: 'Гидроксид натрия', f: 'NaOH', ph: 'aq', note: 'раствор щёлочи', ions: [['Na^+', 1], ['OH^-', 1]], base: 's', g: 'Основания' },
  { id: 'caoh2', name: 'Известковая вода', f: 'Ca(OH)2', ph: 'aq', note: 'насыщенный раствор', ions: [['Ca^2+', 1], ['OH^-', 2]], base: 's', g: 'Основания' },
  { id: 'nh3', name: 'Нашатырный спирт', f: 'NH3', ph: 'aq', note: 'водный аммиак', mol: 'NH3', base: 'w', g: 'Основания' },
  { id: 'nacl', name: 'Хлорид натрия', f: 'NaCl', ph: 'aq', note: 'поваренная соль', ions: [['Na^+', 1], ['Cl^-', 1]], g: 'Соли в растворе' },
  { id: 'ki', name: 'Иодид калия', f: 'KI', ph: 'aq', ions: [['K^+', 1], ['I^-', 1]], g: 'Соли в растворе' },
  { id: 'kbr', name: 'Бромид калия', f: 'KBr', ph: 'aq', ions: [['K^+', 1], ['Br^-', 1]], g: 'Соли в растворе' },
  { id: 'agno3', name: 'Нитрат серебра', f: 'AgNO3', ph: 'aq', note: 'ляпис', ions: [['Ag^+', 1], ['NO3^-', 1]], g: 'Соли в растворе' },
  { id: 'cuso4', name: 'Сульфат меди(II)', f: 'CuSO4', ph: 'aq', note: 'медный купорос', ions: [['Cu^2+', 1], ['SO4^2-', 1]], g: 'Соли в растворе' },
  { id: 'fecl3', name: 'Хлорид железа(III)', f: 'FeCl3', ph: 'aq', ions: [['Fe^3+', 1], ['Cl^-', 3]], g: 'Соли в растворе' },
  { id: 'feso4', name: 'Сульфат железа(II)', f: 'FeSO4', ph: 'aq', note: 'железный купорос', ions: [['Fe^2+', 1], ['SO4^2-', 1]], g: 'Соли в растворе' },
  { id: 'bacl2', name: 'Хлорид бария', f: 'BaCl2', ph: 'aq', ions: [['Ba^2+', 1], ['Cl^-', 2]], g: 'Соли в растворе' },
  { id: 'pbno3', name: 'Нитрат свинца(II)', f: 'Pb(NO3)2', ph: 'aq', ions: [['Pb^2+', 1], ['NO3^-', 2]], g: 'Соли в растворе' },
  { id: 'na2co3', name: 'Карбонат натрия', f: 'Na2CO3', ph: 'aq', note: 'кальцинированная сода', ions: [['Na^+', 2], ['CO3^2-', 1]], basicInd: true, g: 'Соли в растворе' },
  { id: 'kscn', name: 'Роданид калия', f: 'KSCN', ph: 'aq', ions: [['K^+', 1], ['SCN^-', 1]], g: 'Соли в растворе' },
  { id: 'nahco3', name: 'Пищевая сода', f: 'NaHCO3', ph: 's', dis: true, ions: [['Na^+', 1], ['HCO3^-', 1]], basicInd: true, g: 'Твёрдые вещества' },
  { id: 'nh4cl', name: 'Хлорид аммония', f: 'NH4Cl', ph: 's', note: 'нашатырь', dis: true, ions: [['NH4^+', 1], ['Cl^-', 1]], g: 'Твёрдые вещества' },
  { id: 'kmno4', name: 'Перманганат калия', f: 'KMnO4', ph: 's', note: 'марганцовка', dis: true, ions: [['K^+', 1], ['MnO4^-', 1]], g: 'Твёрдые вещества' },
  { id: 'caco3', name: 'Карбонат кальция', f: 'CaCO3', ph: 's', note: 'мел, мрамор', g: 'Твёрдые вещества' },
  { id: 'mno2', name: 'Оксид марганца(IV)', f: 'MnO2', ph: 's', g: 'Твёрдые вещества' },
  { id: 'fe2o3', name: 'Оксид железа(III)', f: 'Fe2O3', ph: 's', note: 'ржавчина', oxide: 'Fe^3+', g: 'Твёрдые вещества' },
  { id: 'cuo', name: 'Оксид меди(II)', f: 'CuO', ph: 's', oxide: 'Cu^2+', g: 'Твёрдые вещества' },
  { id: 'h2so4c', name: 'Серная кислота', f: 'H2SO4', ph: 'l', note: 'концентрированная', conc: true, g: 'Кислоты' },
  { id: 'k2cro4', name: 'Хромат калия', f: 'K2CrO4', ph: 'aq', ions: [['K^+', 2], ['CrO4^2-', 1]], g: 'Соли в растворе' },
  { id: 'k4fecn6', name: 'Жёлтая кровяная соль', f: 'K4[Fe(CN)6]', ph: 'aq', note: 'гексацианоферрат(II) калия', ions: [['K^+', 4], ['[Fe(CN)6]^4-', 1]], g: 'Соли в растворе' },
  { id: 'cocl2', name: 'Хлорид кобальта(II)', f: 'CoCl2', ph: 'aq', ions: [['Co^2+', 1], ['Cl^-', 2]], g: 'Соли в растворе' },
  { id: 'niso4', name: 'Сульфат никеля(II)', f: 'NiSO4', ph: 'aq', ions: [['Ni^2+', 1], ['SO4^2-', 1]], g: 'Соли в растворе' },
  { id: 'srcl2', name: 'Хлорид стронция', f: 'SrCl2', ph: 'aq', ions: [['Sr^2+', 1], ['Cl^-', 2]], g: 'Соли в растворе' },
  { id: 'licl', name: 'Хлорид лития', f: 'LiCl', ph: 'aq', ions: [['Li^+', 1], ['Cl^-', 1]], g: 'Соли в растворе' },
  { id: 'glucose', name: 'Глюкоза', f: 'C6H12O6', ph: 'aq', note: 'раствор', mol: 'C6H12O6', org: true, g: 'Органика' },
  { id: 'sucrose', name: 'Сахар', f: 'C12H22O11', ph: 's', note: 'сахароза', dis: true, org: true, g: 'Органика' },
  { id: 'luminol', name: 'Люминол', f: 'C8H7N3O2', ph: 'aq', note: 'в щелочном растворе', mol: 'C8H7N3O2', org: true, g: 'Органика' },
  { id: 'starch', name: 'Крахмал', f: '(C6H10O5)n', ph: 'aq', note: 'индикатор на иод', ind: true, g: 'Прочее' },
  { id: 'h2o2', name: 'Перекись водорода', f: 'H2O2', ph: 'aq', note: '3 %', mol: 'H2O2', g: 'Прочее' },
  { id: 'php', name: 'Фенолфталеин', f: 'C20H14O4', ph: 'aq', note: 'индикатор', ind: true, g: 'Прочее' }
];
const RG = {}; REAGENTS.forEach(r => RG[r.id] = r);
const RCOLOR = { sucrose: '#fbfbf7', h2o2: null, fe2o3: '#9b3d1f', cuo: '#1d1b1a', mno2: '#2b2522', caco3: '#f3f1ea', nahco3: '#fafafa', nh4cl: '#f7f7f7', kmno4: '#4d0f63' };

function getSub(id) {
  if (EL[id]) { const e = EL[id]; return { id, kind: 'el', el: e, name: e.name, f: molF(e.sym), ph: e.st }; }
  const r = RG[id]; return r ? { ...r, kind: 'rg' } : null;
}
const wetSub = S => S.kind === 'rg' && (S.ph === 'aq' || S.ph === 'l');
const ionsOf = S => (S.ions || []);

/* ---------- Конструкторы событий ---------- */
const SRC = { curated: 'Проверенная реакция', rules: 'Выведено по правилам', none: 'Проверено', unknown: 'Нет в базе' };
function ev(o) { return Object.assign({ kind: 'rx', type: '', source: 'rules', subs: [], obs: [], why: '', cond: '', danger: '', fx: {}, tags: [] }, o); }
const NONE = (why, o = {}) => ev(Object.assign({ kind: 'none', type: 'Нет реакции', source: 'none', why }, o));
const UNK = (why, o = {}) => ev(Object.assign({ kind: 'unknown', type: 'Не описано', source: 'unknown', why }, o));
const PHYS = (type, why, o = {}) => ev(Object.assign({ kind: 'phys', type, source: 'curated', why }, o));
const NEEDHEAT = (why, preview) => ev({ kind: 'none', type: 'Нужен нагрев', source: 'none', why, needHeat: true, preview });
const sub = (str, over) => ({ eq: mk(str, over) });
const term = (f, s) => `${f}(${s})`;

/* ---------- Проверенные реакции ---------- */
const CUR = {};
const key = ids => ids.slice().sort().join('+');
function cur(ids, spec) { CUR[key(ids.split(' '))] = spec; }

// неметалл + неметалл
cur('H O', { eq: '2H2(g) + O2(g) -> 2H2O(l)', h: true, type: 'Соединение · горение', cond: 'искра или пламя',
  obs: ['Громкий хлопок: смесь водорода с кислородом называют «гремучим газом»', 'На холодных стенках колбы оседают капли воды'],
  why: 'При 25 °C смесь H₂ и O₂ может храниться годами: чтобы разорвать связи H–H и O=O, нужна энергия активации. Искра запускает цепную радикальную реакцию, и энергия выделяется за миллисекунды.',
  danger: 'Водород взрывоопасен в воздухе при концентрации от 4 до 75 %.', fx: { boom: true, flame: '#ffd9a0', gasOut: true }, tags: ['boom'],
  cold: 'Водород и кислород перемешались, но не реагируют: без искры скорость реакции при комнатной температуре практически нулевая.' });
cur('H Cl', { eq: 'H2(g) + Cl2(g) -> 2HCl(g)', h: true, type: 'Соединение · цепная реакция', cond: 'яркий свет или поджиг',
  obs: ['Взрыв; жёлто-зелёная окраска хлора исчезает', 'Бесцветный газ HCl дымит во влажном воздухе'],
  why: 'Квант света разрывает молекулу Cl₂ на два радикала, и каждый запускает цепь Cl· + H₂ → HCl + H·, H· + Cl₂ → HCl + Cl·. Одна цепь успевает дать до 100 000 молекул HCl.',
  danger: 'Хлор ядовит, смесь с водородом взрывается на солнце.', fx: { boom: true, flame: '#fff2c0' }, tags: ['boom'],
  cold: 'В темноте смесь водорода с хлором стабильна. На солнце или при нагреве она взрывается.' });
cur('H F', { eq: 'H2(g) + F2(g) -> 2HF(g)', type: 'Соединение', obs: ['Взрыв сразу при смешивании, даже в темноте и при −250 °C'],
  why: 'Фтор — самый электроотрицательный элемент, а связь H–F одна из самых прочных (565 кДж/моль). Энергии активации почти нет.',
  danger: 'Фтор и фтороводород разрушают ткани и стекло.', fx: { boom: true, flame: '#fff6d8' }, tags: ['boom'] });
cur('H Br', { eq: 'H2(g) + Br2(l) -> 2HBr(g)', h: true, type: 'Соединение', cond: 'нагрев',
  obs: ['Красно-бурые пары брома постепенно обесцвечиваются', 'Без взрыва: реакция идёт спокойнее, чем с хлором'],
  why: 'Бром менее активен, чем хлор: цепная реакция идёт медленнее и не переходит во взрыв.', fx: { gas: '#9c3a17', gasFade: true } });
cur('H I', { eq: 'H2(g) + I2(s) <=> 2HI(g)', h: true, type: 'Соединение · равновесие', cond: 'нагрев ~400 °C',
  obs: ['Фиолетовые пары иода обесцвечиваются лишь частично', 'Реакция обратима: HI одновременно разлагается обратно'],
  why: 'Классическое равновесие, на котором Боденштейн в 1890-х изучал кинетику. ΔH° > 0 здесь из-за того, что твёрдый иод сначала нужно испарить.',
  fx: { gas: '#7b3fa0' } });
cur('H N', { none: true, why: 'Азот и водород в колбе не реагируют. Аммиак получают процессом Габера: 450 °C, 200 атмосфер и железный катализатор. При атмосферном давлении над горелкой выход ничтожен: связь N≡N (945 кДж/моль) — одна из самых прочных в химии.' });
cur('H S', { eq: 'H2(g) + S(s) -> H2S(g)', h: true, type: 'Соединение', cond: 'нагрев выше 150 °C', obs: ['Сера плавится, появляется запах тухлых яиц'],
  why: 'Сера — окислитель слабее кислорода, поэтому реакция требует нагрева и идёт с небольшим тепловым эффектом.', danger: 'Сероводород ядовит уже в концентрации 0,1 %.' });
cur('C H', { none: true, why: 'Углерод и водород напрямую в колбе не соединяются. Метан из простых веществ получается только около 1000 °C на никелевом катализаторе.' });
cur('C O', { eq: 'C(s) + O2(g) -> CO2(g)', h: true, type: 'Горение', cond: 'нагрев', obs: ['Уголь раскаляется докрасна и сгорает почти без пламени', 'Образуется газ, от которого мутнеет известковая вода'],
  why: 'При недостатке кислорода образуется угарный газ CO — поэтому печи опасны с закрытой заслонкой.', fx: { glow: '#ff6a2a' }, tags: ['co2'] });
cur('O S', { eq: 'S(s) + O2(g) -> SO2(g)', h: true, type: 'Горение', cond: 'нагрев', obs: ['Сера плавится и горит бледно-голубым пламенем', 'Резкий удушливый запах сернистого газа'],
  why: 'Сера отдаёт кислороду четыре электрона (степень окисления 0 → +4).', danger: 'SO₂ ядовит и раздражает дыхательные пути.', fx: { flame: '#5a78ff' } });
cur('O P', { eq: 'P4(s) + 5O2(g) -> P4O10(s)', type: 'Горение', obs: ['Белый фосфор самовоспламеняется уже около 30 °C', 'Колбу заполняет густой белый дым P₄O₁₀'],
  why: 'Молекула P₄ — тетраэдр с сильно напряжёнными связями под углом 60°, поэтому белый фосфор так реакционноспособен. Красный фосфор устойчивее и загорается только при поджиге.',
  danger: 'Белый фосфор ядовит и вызывает тяжёлые ожоги.', fx: { flame: '#fff1c2', smoke: '#fbfbfb' } });
cur('N O', { none: true, why: 'Азот с кислородом соединяется только около 3000 °C — в разряде молнии или в цилиндре двигателя: N₂ + O₂ → 2NO, ΔH° = +182,6 кДж. Пламени горелки для этого мало.' });
cur('Cl P', { eq: 'P4(s) + 6Cl2(g) -> 4PCl3(l)', type: 'Соединение', obs: ['Фосфор самовоспламеняется в хлоре', 'С избытком хлора получаются жёлтоватые кристаллы PCl₅'],
  why: 'Какой продукт получится — PCl₃ или PCl₅ — зависит от соотношения реагентов.', fx: { flame: '#fff0b0', smoke: '#f2f2e8' } });
cur('Br P', { eq: 'P4(s) + 6Br2(l) -> 4PBr3(l)', type: 'Соединение', obs: ['Бурная реакция со вспышками'], why: 'Бром окисляет фосфор до степени окисления +3.', fx: { flame: '#ffcf8a' } });
cur('Cl S', { eq: '2S(s) + Cl2(g) -> S2Cl2(l)', h: true, type: 'Соединение', cond: 'нагрев', obs: ['Золотисто-жёлтая дымящая жидкость S₂Cl₂'], why: 'S₂Cl₂ используют при вулканизации каучука.' });
cur('C S', { eq: 'C(s) + 2S(s) -> CS2(l)', h: true, type: 'Соединение', cond: '≈ 900 °C', obs: ['Пары серы над раскалённым углём дают летучую жидкость CS₂'],
  why: 'Эндотермическая реакция: CS₂ менее устойчив, чем исходные простые вещества, поэтому его приходится «заряжать» энергией при высокой температуре.' });
cur('F S', { eq: 'S(s) + 3F2(g) -> SF6(g)', type: 'Соединение', obs: ['Сера сгорает во фторе'], why: 'SF₆ — один из самых инертных газов: шесть атомов фтора плотно закрывают атом серы.' });
cur('F P', { eq: 'P4(s) + 10F2(g) -> 4PF5(g)', type: 'Соединение', obs: ['Фосфор вспыхивает во фторе'], why: 'Фтор доводит фосфор до высшей степени окисления +5.', fx: { flame: '#fff6d0' } });
cur('C F', { eq: 'C(s) + 2F2(g) -> CF4(g)', type: 'Соединение', obs: ['Древесный уголь загорается во фторе без поджига'], why: 'Фтор — единственный элемент, который окисляет углерод без нагрева.', fx: { flame: '#fff6d0' } });
cur('F Si', { eq: 'Si(s) + 2F2(g) -> SiF4(g)', type: 'Соединение', obs: ['Кремний вспыхивает во фторе'], why: 'Связь Si–F — самая прочная одинарная связь кремния (≈ 565 кДж/моль).', fx: { flame: '#fff6d0' } });
cur('B F', { eq: '2B(s) + 3F2(g) -> 2BF3(g)', type: 'Соединение', obs: ['Бор загорается во фторе'], why: 'BF₃ — классическая кислота Льюиса: у бора пустая орбиталь.', fx: { flame: '#3fcf6a' } });
cur('F Xe', { eq: 'Xe(g) + F2(g) -> XeF2(g)', h: true, type: 'Соединение', cond: '≈ 400 °C или солнечный свет',
  obs: ['При охлаждении оседают бесцветные кристаллы XeF₂'],
  why: 'До 1962 года благородные газы считали абсолютно инертными. Нил Бартлетт показал, что крупный атом ксенона со слабо удерживаемыми электронами может отдать их фтору.',
  tags: ['noble'], cold: 'При комнатной температуре в темноте ксенон и фтор почти не реагируют. Нужен нагрев или ультрафиолет.' });
cur('F Kr', { none: true, why: 'KrF₂ существует, но его получают только в электрическом разряде при −196 °C. Криптон удерживает электроны крепче ксенона, и в колбе с горелкой реакция не идёт.' });
cur('Cl F', { eq: 'Cl2(g) + F2(g) -> 2ClF(g)', h: true, type: 'Соединение', cond: '≈ 250 °C', obs: ['Бесцветный газ ClF'], why: 'Межгалогенное соединение: более электроотрицательный фтор принимает электрон от хлора.' });
cur('Cl I', { eq: 'I2(s) + Cl2(g) -> 2ICl(s)', type: 'Соединение', obs: ['Тёмные кристаллы иода превращаются в красно-бурый ICl'], why: 'Хлор электроотрицательнее иода, поэтому иод в ICl имеет степень окисления +1.' });
cur('Br Cl', { eq: 'Br2(l) + Cl2(g) <=> 2BrCl(g)', type: 'Соединение · равновесие', obs: ['Окраска смеси становится золотисто-коричневой'], why: 'BrCl в газе частично распадается обратно, поэтому устанавливается равновесие.' });
cur('Br F', { eq: 'Br2(l) + 3F2(g) -> 2BrF3(l)', type: 'Соединение', obs: ['Бром вспыхивает во фторе'], why: 'BrF₃ настолько агрессивен, что фторирует даже оксиды металлов.', fx: { flame: '#ffd7a0' } });
cur('F I', { eq: 'I2(s) + 5F2(g) -> 2IF5(l)', type: 'Соединение', obs: ['Иод загорается бледным пламенем'], why: 'Крупный атом иода может окружить себя пятью атомами фтора.', fx: { flame: '#fff0d0' } });
cur('Cl Si', { eq: 'Si(s) + 2Cl2(g) -> SiCl4(l)', h: true, type: 'Соединение', cond: '≈ 600 °C', obs: ['Летучая жидкость SiCl₄ дымит на воздухе'], why: 'Так получают сверхчистый кремний для микросхем: SiCl₄ перегоняют, а затем восстанавливают.' });
cur('B Cl', { eq: '2B(s) + 3Cl2(g) -> 2BCl3(g)', h: true, type: 'Соединение', cond: '≈ 500 °C', obs: ['Бесцветный газ, дымящий во влажном воздухе'], why: 'Галогениды бора бурно гидролизуются влагой воздуха.' });
cur('H Se', { eq: 'H2(g) + Se(s) -> H2Se(g)', h: true, type: 'Соединение', cond: '≈ 400 °C', obs: ['Образуется бесцветный газ с отвратительным запахом'], why: 'H₂Se менее устойчив, чем H₂S: связь H–Se слабее.', danger: 'Селеноводород ядовитее сероводорода.' });
cur('P S', { eq: 'P4(s) + 3S(s) -> P4S3(s)', h: true, type: 'Соединение', cond: 'сплавление', obs: ['Жёлтые кристаллы P₄S₃'], why: 'P₄S₃ входит в головки спичек, которые зажигаются о любую поверхность.' });
for (const p of ['F O', 'F N', 'Cl O', 'Br O', 'I O', 'Cl N', 'Br N', 'I N', 'N S', 'N P', 'C N', 'C Cl', 'H P', 'C Si', 'B N', 'N Si', 'Br C', 'C I', 'C P', 'N Se', 'I S'])
  cur(p, { none: true, why: 'Эти простые вещества не соединяются напрямую в лабораторных условиях. Их соединения, если они существуют, получают косвенными путями: из других соединений, в электрическом разряде или при экстремальных температурах.' });

// металл + неметалл
cur('Na Cl', { eq: '2Na(s) + Cl2(g) -> 2NaCl(s)', h: true, type: 'Соединение · ОВР', cond: 'лёгкий нагрев',
  obs: ['Натрий вспыхивает ярко-жёлтым пламенем', 'Колба заполняется белым дымом — это мельчайшие кристаллы NaCl', 'Жёлто-зелёная окраска хлора исчезает'],
  why: 'Натрий (один внешний электрон, χ = 0,93) отдаёт электрон хлору (χ = 3,16). Из металла, который взрывается в воде, и ядовитого газа получается поваренная соль.',
  danger: 'Хлор ядовит; натрий вызывает ожоги.', fx: { flame: '#ffb000', smoke: '#f7f7f5' },
  cold: 'Холодный натрий покрыт плёнкой оксида, и реакция в хлоре едва идёт. При небольшом нагреве начинается бурное горение.' });
cur('Na O', [
  { h: false, eq: '4Na(s) + O2(g) -> 2Na2O(s)', type: 'Окисление', obs: ['Серебристый срез натрия за секунды тускнеет и покрывается белым налётом'], why: 'Натрий настолько активен, что окисляется на воздухе без нагрева. Поэтому его хранят под керосином.' },
  { h: true, eq: '2Na(s) + O2(g) -> Na2O2(s)', type: 'Горение', obs: ['Натрий плавится и горит ярко-жёлтым пламенем', 'Продукт — бледно-жёлтый пероксид Na₂O₂, а не оксид Na₂O'],
    why: 'При горении натрия в избытке кислорода образуется пероксид, в котором есть связь O–O. Жёлтый цвет пламени дают возбуждённые атомы Na (линия 589 нм).', fx: { flame: '#ffb000', smoke: '#f3e8b5' } }]);
cur('K O', [
  { h: false, eq: '4K(s) + O2(g) -> 2K2O(s)', type: 'Окисление', obs: ['Срез калия мгновенно тускнеет'], why: 'Калий активнее натрия: его внешний электрон дальше от ядра.' },
  { h: true, eq: 'K(s) + O2(g) -> KO2(s)', type: 'Горение', obs: ['Калий горит бледно-фиолетовым пламенем', 'Продукт — оранжево-жёлтый надпероксид KO₂'],
    why: 'KO₂ поглощает CO₂ и выделяет O₂: 4KO₂ + 2CO₂ → 2K₂CO₃ + 3O₂. На этом основаны регенеративные патроны дыхательных аппаратов.', fx: { flame: '#b98ce0', smoke: '#f0b347' } }]);
cur('Li O', { eq: '4Li(s) + O2(g) -> 2Li2O(s)', h: true, type: 'Горение', obs: ['Литий горит карминово-красным пламенем', 'Белый порошок Li₂O'],
  why: 'Маленький ион Li⁺ не стабилизирует пероксид, поэтому литий, в отличие от натрия, даёт обычный оксид.', fx: { flame: '#d4193a', smoke: '#f7f7f5' },
  cold: 'При комнатной температуре литий тускнеет медленно, в основном из-за реакции с азотом и влагой. Сгорает он при нагреве.' });
cur('Li N', { eq: '6Li(s) + N2(g) -> 2Li3N(s)', type: 'Соединение', obs: ['Поверхность лития медленно покрывается тёмно-красным нитридом'],
  why: 'Литий — единственный щелочной металл, который реагирует с азотом при комнатной температуре: маленький ион Li⁺ образует очень прочную решётку с N³⁻.', fx: {} });
cur('Mg O', { eq: '2Mg(s) + O2(g) -> 2MgO(s)', h: true, type: 'Горение', cond: 'поджиг', obs: ['Ослепительно-белое пламя с ультрафиолетом — не смотрите на него прямо', 'Остаётся белый порошок MgO'],
  why: 'Выделяется так много энергии, что частицы MgO раскаляются до 3000 °C и светятся белым. Раньше магниевую вспышку использовали фотографы.', danger: 'Яркий свет повреждает сетчатку.',
  fx: { flame: '#ffffff', light: true, smoke: '#f7f7f5' } });
cur('Mg N', { eq: '3Mg(s) + N2(g) -> Mg3N2(s)', h: true, type: 'Соединение', cond: 'нагрев', obs: ['Жёлто-зелёный порошок нитрида магния'], why: 'Когда магний горит на воздухе, часть его связывается с азотом. Поэтому в пепле есть Mg₃N₂.' });
cur('Al O', { eq: '4Al(s) + 3O2(g) -> 2Al2O3(s)', h: true, type: 'Горение', cond: 'порошок, поджиг', obs: ['Алюминиевая пудра сгорает снопом ослепительных искр', 'Фольга только покрывается прочной оксидной плёнкой и не горит'],
  why: 'У Al₂O₃ одна из самых больших энтальпий образования (−1675,7 кДж/моль). На этом основаны термит и твёрдое ракетное топливо.', fx: { sparks: '#fff3c8', flame: '#ffffff', smoke: '#f7f7f5' } });
cur('Al Br', { eq: '2Al(s) + 3Br2(l) -> 2AlBr3(s)', type: 'Соединение · ОВР', obs: ['Через несколько секунд вспышка и искры', 'Над колбой поднимаются бурые пары брома'],
  why: 'Бром разрушает оксидную плёнку алюминия. Реакция сильно экзотермична, и часть брома испаряется от тепла.', danger: 'Пары брома ядовиты и вызывают ожоги.', fx: { flame: '#ffcf8a', sparks: '#ffe0a0', gas: '#9c3a17' } });
cur('Al I', [{ h: false, none: true, why: 'Сухая смесь алюминия с иодом не реагирует. Добавьте каплю воды — она катализатор — или нагрейте смесь.' },
  { h: true, eq: '2Al(s) + 3I2(s) -> 2AlI3(s)', type: 'Соединение · ОВР', obs: ['Вспышка и клубы фиолетовых паров иода'], why: 'Тепло реакции испаряет часть иода, отсюда фиолетовый дым.', fx: { flame: '#ffcf8a', gas: '#7b3fa0' } }]);
cur('Al I h2o', { eq: '2Al(s) + 3I2(s) -> 2AlI3(s)', over: 'H₂O', type: 'Соединение · катализ', obs: ['После капли воды через несколько секунд смесь вспыхивает', 'Поднимается фиолетовый дым иода'],
  why: 'Вода растворяет немного иода и разрушает оксидную плёнку алюминия. Дальше реакция разгоняется за счёт собственного тепла.', fx: { flame: '#ffcf8a', gas: '#7b3fa0' }, tags: ['catalysis'] });
cur('Fe S', { eq: 'Fe(s) + S(s) -> FeS(s)', h: true, type: 'Соединение', cond: 'нагрев одной точки', obs: ['Смесь раскаляется докрасна, и свечение идёт по всей массе даже после того, как горелку убрали', 'Магнит больше не притягивает продукт: смесь стала новым веществом'],
  why: 'Классический пример различия смеси и соединения: до нагрева железо можно вытащить магнитом, после — нет.', fx: { glow: '#ff5a1f' } });
cur('Fe O', { eq: '3Fe(s) + 2O2(g) -> Fe3O4(s)', h: true, type: 'Горение', cond: 'стальная вата или порошок', obs: ['Стальная вата горит снопом искр', 'Образуется чёрная железная окалина Fe₃O₄'],
  why: 'Массивное железо в воздухе не горит, а тонкая вата — горит: у неё огромная поверхность и мало массы, которая отводила бы тепло.', fx: { sparks: '#ffb347', glow: '#ff7a2a' } });
cur('Fe Cl', { eq: '2Fe(s) + 3Cl2(g) -> 2FeCl3(s)', h: true, type: 'Соединение · ОВР', cond: 'нагретая проволока', obs: ['Раскалённая железная проволока горит в хлоре', 'Бурый дым хлорида железа(III)'],
  why: 'Хлор — сильный окислитель и доводит железо до +3. С соляной кислотой получилось бы только FeCl₂.', fx: { flame: '#ffb060', smoke: '#6b3a1b' } });
cur('Cu O', { eq: '2Cu(s) + O2(g) -> 2CuO(s)', h: true, type: 'Окисление', cond: 'нагрев', obs: ['Медная пластинка в пламени чернеет — налёт CuO'], why: 'Медь окисляется медленно, без пламени. Горелка лишь ускоряет процесс.', fx: { coat: '#1d1b1a' } });
cur('Cu S', { eq: '2Cu(s) + S(s) -> Cu2S(s)', h: true, type: 'Соединение', cond: 'нагрев', obs: ['Медь раскаляется в парах серы, образуется чёрный Cu₂S'], why: 'С таким слабым окислителем, как сера, медь проявляет степень окисления +1.', fx: { glow: '#ff6a2a', coat: '#2a2a2e' } });
cur('Cu Cl', { eq: 'Cu(s) + Cl2(g) -> CuCl2(s)', h: true, type: 'Соединение · ОВР', cond: 'нагрев', obs: ['Нагретая медная фольга горит в хлоре', 'Бурый дым; в воде продукт даёт зелёно-голубой раствор'], why: 'Хлор окисляет медь до +2.', fx: { flame: '#1fb7a6', smoke: '#9a6a2c' } });
cur('S Zn', { eq: 'Zn(s) + S(s) -> ZnS(s)', h: true, type: 'Соединение', cond: 'поджиг смеси порошков', obs: ['Бурная вспышка с сине-зелёным пламенем и клубами белого дыма'],
  why: 'Смесь цинка с серой когда-то использовали как ракетное топливо любители. ZnS — люминофор старых телевизионных экранов.', fx: { flame: '#6fd6c9', smoke: '#f3f1e8', flash: true } });
cur('Hg S', { eq: 'Hg(l) + S(s) -> HgS(s)', type: 'Соединение', obs: ['При растирании капли ртути связываются в чёрный порошок HgS (метакиноварь)'],
  why: 'Так обезвреживают разлитую ртуть — это называется демеркуризация. Серу насыпают на капли, и летучая ядовитая ртуть превращается в нелетучий сульфид.', danger: 'Пары ртути ядовиты.', fx: { coat: '#232323' } });
cur('Au Cl', { eq: '2Au(s) + 3Cl2(g) -> 2AuCl3(s)', h: true, type: 'Соединение · ОВР', cond: '≈ 200 °C', obs: ['Золото медленно покрывается красно-бурыми кристаллами AuCl₃'],
  why: 'Золото не боится кислорода и кислот, но сухой хлор при нагреве его окисляет. В царской водке золото растворяется тоже благодаря хлору.', fx: { coat: '#b3441e' } });
cur('K Na', { phys: true, type: 'Сплав', eq: null, obs: ['Кусочки металлов при соприкосновении сливаются в серебристую жидкость'],
  why: 'Сплав натрия с калием NaK жидкий при комнатной температуре (эвтектика плавится при −12,6 °C). Его используют как теплоноситель в ядерных реакторах.', danger: 'NaK самовоспламеняется на воздухе.' });
cur('C Fe', { none: true, why: 'Сталь и чугун — это растворы углерода в железе. Их получают при температуре выше 1150 °C в доменной печи, а стеклянная колба над горелкой так не нагреется.' });
cur('H Pd', { phys: true, type: 'Поглощение газа', eq: null, obs: ['Палладий «впитывает» водород: до 900 объёмов газа на объём металла'],
  why: 'Молекулы H₂ распадаются на поверхности палладия на атомы, которые проникают в кристаллическую решётку. Палладиевые мембраны пропускают только водород.' });
cur('K Cl', { eq: '2K(s) + Cl2(g) -> 2KCl(s)', type: 'Соединение · ОВР', obs: ['Калий самовоспламеняется в хлоре с фиолетовой вспышкой', 'Белый дым KCl'], why: 'Калий активнее натрия, поэтому ему не нужен даже нагрев.', fx: { flame: '#b98ce0', smoke: '#f7f7f5' } });
cur('Br K', { eq: '2K(s) + Br2(l) -> 2KBr(s)', type: 'Соединение · ОВР', obs: ['Взрыв при соприкосновении'], why: 'Калий с жидким бромом реагирует взрывообразно (натрий — значительно спокойнее).', danger: 'Взрыв с разбрызгиванием брома.', fx: { boom: true, flame: '#b98ce0' }, tags: ['boom'] });

// с участием реактивов
cur('h2o2 mno2', { eq: '2H2O2(aq) -> 2H2O(l) + O2(g)', over: 'MnO₂', type: 'Разложение · катализ', obs: ['Выделяются пузырьки бесцветного кислорода', 'Тлеющая лучинка у горлышка ярко вспыхивает — это кислород', 'Чёрный MnO₂ в конце остаётся тем же — это катализатор'],
  why: 'Без катализатора перекись разлагается месяцами. MnO₂ открывает путь с меньшей энергией активации, но сам в реакции не расходуется.', fx: { bubbles: '#ffffff' }, tags: ['catalysis'] });
cur('h2o2 ki', { eq: '2H2O2(aq) -> 2H2O(l) + O2(g)', over: 'I⁻', type: 'Разложение · катализ', obs: ['Бурно выделяется кислород; с добавкой моющего средства получилась бы «зубная паста для слона»', 'Раствор желтеет, потому что часть иодид-ионов окисляется до I₂'],
  why: 'Иодид-ион работает как катализатор: H₂O₂ + I⁻ → H₂O + IO⁻, затем H₂O₂ + IO⁻ → H₂O + O₂ + I⁻.', fx: { bubbles: '#ffffff', sol: '#d9b25a' }, tags: ['catalysis'] });
cur('caoh2 co2', { eq: 'Ca^2+(aq) + 2OH^-(aq) + CO2(g) -> CaCO3(s) + H2O(l)', mol: 'Ca(OH)2(aq) + CO2(g) -> CaCO3(s) + H2O(l)', type: 'Качественная реакция', obs: ['Прозрачная известковая вода мутнеет', 'При избытке CO₂ муть исчезает: CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂'],
  why: 'Это стандартная проба на углекислый газ. Так же образуются сталактиты — только в обратном направлении.', fx: { ppt: '#f5f5f2', bubbles: '#ffffff' }, tags: ['ppt'] });
cur('co2 naoh', { eq: 'CO2(g) + 2OH^-(aq) -> CO3^2-(aq) + H2O(l)', mol: 'CO2(g) + 2NaOH(aq) -> Na2CO3(aq) + H2O(l)', type: 'Кислотный оксид + щёлочь', obs: ['Видимых изменений нет, но газ поглощается'], why: 'CO₂ — кислотный оксид. Щёлочь связывает его в карбонат: так очищают воздух на подводных лодках.' });
cur('co2 h2o', { eq: 'CO2(g) + H2O(l) <=> H2CO3(aq)', type: 'Равновесие', obs: ['Раствор становится слабокислым, pH ≈ 4–5 — получилась газировка'], why: 'Только около 0,2 % растворённого CO₂ превращается в угольную кислоту. Остальной газ просто растворён.' });
cur('Mg co2', { eq: '2Mg(s) + CO2(g) -> 2MgO(s) + C(s)', h: true, type: 'Замещение · ОВР', cond: 'горящий магний', obs: ['Магний продолжает гореть в углекислом газе', 'Белый MgO вперемешку с чёрными крупинками углерода'],
  why: 'Связь Mg–O прочнее связи C=O в CO₂, поэтому магний отнимает кислород у углекислого газа. Вот почему горящий магний нельзя тушить углекислотным огнетушителем.', fx: { flame: '#ffffff', light: true, smoke: '#dcdcdc' } });
cur('cuso4 nh3', { eq: 'Cu^2+(aq) + 4NH3(aq) -> [Cu(NH3)4]^2+(aq)', mol: 'CuSO4(aq) + 4NH3(aq) -> [Cu(NH3)4]SO4(aq)', type: 'Комплексообразование', obs: ['Сначала выпадает голубой осадок Cu(OH)₂', 'В избытке аммиака осадок растворяется, и раствор становится ярко-синим, васильковым'],
  why: 'Четыре молекулы NH₃ отдают неподелённые пары электронов иону меди и образуют квадратный комплекс. Такой раствор (реактив Швейцера) даже растворяет целлюлозу.', fx: { sol: '#2140c4' }, tags: ['complex'] });
cur('fecl3 kscn', { eq: 'Fe^3+(aq) + SCN^-(aq) <=> [Fe(SCN)]^2+(aq)', mol: 'FeCl3(aq) + 3KSCN(aq) <=> Fe(SCN)3(aq) + 3KCl(aq)', type: 'Качественная реакция · комплекс', obs: ['Раствор мгновенно становится кроваво-красным'],
  why: 'Так обнаруживают даже следы ионов Fe³⁺. На этой реакции основан киношный трюк с «кровью»: одну руку смачивают FeCl₃, другую — KSCN.', fx: { sol: '#8e0b12' }, tags: ['complex'] });
cur('hcl kmno4', { eq: '2MnO4^- + 16H^+ + 10Cl^- -> 2Mn^2+ + 5Cl2(g) + 8H2O(l)', mol: '2KMnO4(aq) + 16HCl(aq) -> 2KCl(aq) + 2MnCl2(aq) + 5Cl2(g) + 8H2O(l)', type: 'ОВР', cond: 'в реальности нужна концентрированная HCl',
  obs: ['Фиолетовая окраска исчезает', 'Выделяется жёлто-зелёный хлор с резким запахом'], why: 'Mn(+7) принимает 5 электронов и становится Mn²⁺, а хлорид-ионы окисляются до Cl₂. Так получают хлор в лаборатории.',
  danger: 'Хлор ядовит — только под тягой.', fx: { sol: null, bubbles: '#c7d65a', gas: '#c7d65a' } });
cur('h2o2 kmno4', { eq: '2MnO4^- + 3H2O2(aq) -> 2MnO2(s) + 3O2(g) + 2OH^- + 2H2O(l)', type: 'ОВР', obs: ['Фиолетовая окраска исчезает, выпадает бурый осадок MnO₂', 'Выделяются пузырьки кислорода'],
  why: 'В нейтральной среде перманганат восстанавливается только до MnO₂ (Mn +7 → +4). Если добавить кислоту, получится бесцветный Mn²⁺.', fx: { sol: null, ppt: '#4a2f22', bubbles: '#ffffff' } });
cur('h2o2 h2so4 kmno4', { eq: '2MnO4^- + 5H2O2(aq) + 6H^+ -> 2Mn^2+ + 5O2(g) + 8H2O(l)', type: 'ОВР', obs: ['Раствор полностью обесцвечивается', 'Бурно выделяется кислород'],
  why: 'В кислой среде перманганат принимает 5 электронов (Mn +7 → +2). Перекись здесь восстановитель: её кислород окисляется из степени −1 в 0.', fx: { sol: null, bubbles: '#ffffff' } });
cur('feso4 kmno4', { eq: 'MnO4^- + 3Fe^2+ + 7H2O(l) -> MnO2(s) + 3Fe(OH)3(s) + 5H^+', type: 'ОВР', obs: ['Фиолетовая окраска пропадает, выпадает бурый осадок'], why: 'Без кислоты перманганат даёт MnO₂, а железо(III) гидролизуется до Fe(OH)₃. Подкислите раствор, чтобы реакция шла чисто.', fx: { sol: null, ppt: '#7a3d1c' } });
cur('feso4 h2so4 kmno4', { eq: 'MnO4^- + 5Fe^2+ + 8H^+ -> Mn^2+ + 5Fe^3+ + 4H2O(l)', type: 'ОВР · титрование', obs: ['Капли перманганата обесцвечиваются, пока в растворе есть Fe²⁺', 'Первая лишняя капля оставляет устойчивую розовую окраску — конец титрования'],
  why: 'Это перманганатометрия: по объёму KMnO₄ узнают, сколько в пробе железа. Индикатор не нужен — его роль играет сам перманганат.', fx: { sol: '#e3c77a' } });
cur('ki kmno4', { eq: '2MnO4^- + 6I^- + 4H2O(l) -> 2MnO2(s) + 3I2(aq) + 8OH^-', type: 'ОВР', obs: ['Раствор буреет от выделившегося иода, выпадает бурый MnO₂'], why: 'Перманганат окисляет иодид до свободного иода.', fx: { sol: '#9a5a17', ppt: '#4a2f22' } });
cur('feso4 h2o2', { eq: '2Fe^2+ + H2O2(aq) + 4H2O(l) -> 2Fe(OH)3(s) + 4H^+', type: 'ОВР', obs: ['Бледно-зелёный раствор мутнеет и буреет'], why: 'Перекись окисляет Fe²⁺ до Fe³⁺. На смеси Fe²⁺ и H₂O₂ (реактив Фентона) основана очистка сточных вод.', fx: { sol: '#d8b36a', ppt: '#9a4a1c' } });
cur('feso4 h2o2 h2so4', { eq: '2Fe^2+ + H2O2(aq) + 2H^+ -> 2Fe^3+ + 2H2O(l)', type: 'ОВР', obs: ['Бледно-зелёный раствор желтеет'], why: 'В кислой среде Fe³⁺ остаётся в растворе и не выпадает в осадок.', fx: { sol: '#d39a2a' } });
cur('Cl naoh', { eq: 'Cl2(g) + 2OH^-(aq) -> Cl^-(aq) + ClO^-(aq) + H2O(l)', mol: 'Cl2(g) + 2NaOH(aq) -> NaCl(aq) + NaClO(aq) + H2O(l)', type: 'Диспропорционирование', obs: ['Жёлто-зелёный газ поглощается раствором', 'Появляется запах хлорки'],
  why: 'Хлор одновременно окисляется (до +1 в ClO⁻) и восстанавливается (до −1 в Cl⁻). Получается гипохлорит натрия — действующее вещество отбеливателей.', fx: { gasFade: true } });
cur('I ki', { eq: 'I2(s) + I^-(aq) -> I3^-(aq)', type: 'Комплексообразование', obs: ['Иод, почти нерастворимый в воде, легко растворяется, и раствор становится тёмно-бурым'], why: 'Иодид-ион связывает I₂ в трииодид I₃⁻. Так готовят раствор Люголя.', fx: { sol: '#7a4210' } });
cur('Al fe2o3', { eq: '2Al(s) + Fe2O3(s) -> Al2O3(s) + 2Fe(s)', h: true, type: 'Замещение · металлотермия', cond: 'поджиг магниевой лентой',
  obs: ['Ослепительная вспышка, температура около 2500 °C', 'Раскалённое жидкое железо стекает вниз каплями'],
  why: 'Это термит. Алюминий отнимает кислород у железа, потому что Al₂O₃ намного прочнее Fe₂O₃. Термитом сваривают рельсы прямо на путях.', danger: 'Температура выше плавления стали; воду на термит лить нельзя.',
  fx: { flame: '#fff0c0', sparks: '#ffcf70', light: true, glow: '#ff9a3a' }, tags: ['thermite'], cold: 'Смесь порошков алюминия и ржавчины стабильна и не загорается даже от спички — нужен поджиг магниевой лентой.' });
cur('H cuo', { eq: 'CuO(s) + H2(g) -> Cu(s) + H2O(g)', h: true, type: 'Восстановление', cond: 'нагрев', obs: ['Чёрный порошок краснеет — восстанавливается медь', 'На холодных стенках трубки оседают капли воды'],
  why: 'Водород отнимает кислород у оксида меди. Именно так в XIX веке определили массовый состав воды.', fx: { coat: '#b8562c' } });
cur('C cuo', { eq: '2CuO(s) + C(s) -> 2Cu(s) + CO2(g)', h: true, type: 'Восстановление', cond: 'сильный нагрев', obs: ['Чёрная смесь становится красноватой — медь', 'Выделяется газ, от которого мутнеет известковая вода'],
  why: 'Углерод — древнейший восстановитель: так тысячелетия назад выплавляли медь из руды.', fx: { coat: '#b8562c', glow: '#ff6a2a' }, tags: ['co2'] });
cur('H fe2o3', { eq: 'Fe2O3(s) + 3H2(g) -> 2Fe(s) + 3H2O(g)', h: true, type: 'Восстановление', cond: 'выше 500 °C', obs: ['Красно-бурая ржавчина темнеет и превращается в серое железо'],
  why: 'Реакция эндотермична, поэтому идёт только при сильном нагреве. Сейчас так пытаются делать «зелёную» сталь без угля.', fx: { coat: '#4a4d51' } });

// красочные реакции витрины
cur('glucose kmno4 naoh', { eq: ['2MnO4^- + C6H12O6(aq) + 3OH^- -> 2MnO4^2- + C6H11O7^- + 2H2O(l)', 'MnO4^2- + C6H12O6(aq) -> MnO2(s) + C6H11O7^- + OH^-'], type: 'ОВР · «химический хамелеон»',
  obs: ['Фиолетовый раствор синеет, затем становится изумрудно-зелёным', 'Потом желтеет и, наконец, делается оранжево-бурым'],
  why: 'Марганец восстанавливается ступенями: фиолетовый MnO₄⁻ (степень окисления +7) → зелёный манганат MnO₄²⁻ (+6) → бурый коллоидный MnO₂ (+4). Синий и жёлтый оттенки — это смеси соседних стадий. Глюкоза при этом окисляется до глюконат-иона.',
  fx: { solSeq: [[0, '#7a1fa8'], [1.4, '#4338b8'], [2.8, '#2f8f4a'], [4.6, '#c9a227'], [6.2, '#b0561a']] }, tags: ['colorseq'] });
cur('agno3 glucose nh3', { eq: '2Ag^+ + C6H12O6(aq) + 2NH3(aq) + H2O(l) -> 2Ag(s) + C6H12O7(aq) + 2NH4^+', type: 'ОВР · «серебряное зеркало»', cond: 'тёплая водяная баня',
  obs: ['Сначала выпадает бурый Ag₂O, в избытке аммиака он растворяется', 'Стенки колбы покрываются блестящим зеркальным слоем серебра'],
  why: 'Аммиачный комплекс [Ag(NH₃)₂]⁺ (реактив Толленса) — мягкий окислитель. Альдегидная группа глюкозы отдаёт ему электроны, и серебро восстанавливается прямо на стекле ровной плёнкой. Так со времён Юстуса Либиха (1835) серебрят стекло для зеркал и ёлочных игрушек.',
  fx: { mirror: true, sol: null }, tags: ['mirror'] });
const LUM = { eq: 'C8H7N3O2(aq) + 2H2O2(aq) + 2OH^- -> C8H5NO4^2- + N2(g) + 4H2O(l)', type: 'Хемилюминесценция',
  obs: ['Раствор светится ярким голубым светом (≈ 425 нм) — без всякого нагрева', 'Свечение длится несколько десятков секунд и постепенно гаснет'],
  why: 'Люминол окисляется до 3-аминофталат-иона, который образуется в возбуждённом электронном состоянии. Возвращаясь в основное состояние, он отдаёт энергию не теплом, а квантом света. Криминалисты так находят следы крови: железо гемоглобина катализирует реакцию.', tags: ['lum'] };
cur('fecl3 h2o2 luminol', Object.assign({}, LUM, { over: 'Fe³⁺', fx: { lum: '#3f7dff', bubbles: '#ffffff' } }));
cur('cuso4 h2o2 luminol', Object.assign({}, LUM, { over: 'Cu²⁺', fx: { lum: '#3f7dff', bubbles: '#ffffff' } }));
cur('h2o2 luminol', Object.assign({}, LUM, { obs: ['Без катализатора свечение слабое — его видно только в полной темноте', 'Добавьте FeCl₃ или CuSO₄, и раствор ярко засветится'], fx: { lum: '#3f7dff', lumWeak: true } }));
cur('h2so4c sucrose', { eq: 'C12H22O11(s) -> 12C(s) + 11H2O(l)', over: 'H₂SO₄ конц.', type: 'Дегидратация · «чёрная змея»',
  obs: ['Сахар желтеет, буреет и чернеет', 'Из колбы медленно поднимается пористый чёрный столб угля', 'Валит пар, чувствуется резкий запах SO₂'],
  why: 'Концентрированная серная кислота жадно отнимает у сахара воду, и от молекулы остаётся углерод. Тепло гидратации кислоты превращает воду в пар, и он вспенивает уголь в столб. Часть углерода кислота окисляет, отсюда SO₂ и CO₂.',
  danger: 'Концентрированная серная кислота вызывает тяжёлые ожоги.', fx: { snake: true, steam: true, smoke: '#77736e' } });
cur('Cu h2so4c', { eq: 'Cu(s) + 2H2SO4(l) -> CuSO4(s) + SO2(g) + 2H2O(l)', h: true, type: 'ОВР', cond: 'нагрев',
  obs: ['Медь растворяется, выделяется бесцветный газ с резким запахом — SO₂', 'На дне белый безводный CuSO₄; если разбавить водой, раствор станет голубым'],
  why: 'С разбавленной серной кислотой медь не реагирует, а горячая концентрированная окисляет её атомом серы (+6 → +4), а не ионом водорода.', danger: 'SO₂ ядовит, горячая кислота опасна.', fx: { bubbles: '#ffffff', dissolve: true },
  cold: 'На холоде медь с концентрированной серной кислотой почти не реагирует. Нагрейте.' });
cur('cuso4 glucose naoh', { h: true, eq: '2Cu^2+ + C6H12O6(aq) + 5OH^- -> Cu2O(s) + C6H11O7^- + 3H2O(l)', type: 'ОВР · проба Троммера', cond: 'нагрев',
  obs: ['Голубая смесь при нагреве зеленеет, затем желтеет', 'Выпадает кирпично-красный осадок оксида меди(I)'],
  why: 'Альдегидная группа глюкозы восстанавливает Cu²⁺ до Cu⁺. Этой пробой раньше находили сахар в моче при диабете.',
  fx: { solSeq: [[0, '#3b8fd9'], [1.5, '#3fae7a'], [3, '#d9b53a'], [4.5, '#c8643a']], ppt: '#b8391e' }, tags: ['colorseq'],
  cold: 'Без нагрева голубой осадок Cu(OH)₂ растворяется в глюкозе, и раствор становится ярко-синим. Чтобы пошло восстановление, нагрейте.' });
cur('h2o2 h2so4 ki', { eq: 'H2O2(aq) + 2I^- + 2H^+ -> I2(aq) + 2H2O(l)', type: 'ОВР · иодные часы', obs: ['Бесцветный раствор постепенно буреет от иода', 'С крахмалом он внезапно становится тёмно-синим'],
  why: 'В кислой среде перекись окисляет иодид до иода. Реакция идёт не мгновенно, поэтому окраска появляется с задержкой — на этом основаны «часовые» реакции.', fx: { solSeq: [[0, null], [2.5, '#9a5a17']] }, clock: true });
cur('niso4 nh3', { eq: 'Ni^2+(aq) + 6NH3(aq) -> [Ni(NH3)6]^2+(aq)', mol: 'NiSO4(aq) + 6NH3(aq) -> [Ni(NH3)6]SO4(aq)', type: 'Комплексообразование',
  obs: ['Сначала выпадает зелёный осадок Ni(OH)₂', 'В избытке аммиака он растворяется, и зелёный раствор становится сине-фиолетовым'],
  why: 'Шесть молекул аммиака окружают ион никеля октаэдром. Лиганды меняют расщепление d-орбиталей, поглощается свет другой длины волны, и поэтому меняется цвет.', fx: { solSeq: [[0, '#58b36a'], [2.5, '#6b5bd6']] }, tags: ['complex'] });
cur('cocl2 hcl', { eq: '[Co(H2O)6]^2+ + 4Cl^- <=> [CoCl4]^2- + 6H2O(l)', type: 'Равновесие · Ле Шателье', cond: 'в реальности нужна концентрированная HCl',
  obs: ['Розовый раствор становится синим', 'Если разбавить водой, он снова розовеет'],
  why: 'Избыток хлорид-ионов сдвигает равновесие вправо, к синему комплексу [CoCl₄]²⁻. Вода сдвигает его обратно.', fx: { solSeq: [[0, '#e58aa8'], [2, '#2d4fd6']] }, tags: ['complex'] });

/* Нагрев одного вещества */
const DECOMP = {
  caco3: { eq: 'CaCO3(s) -> CaO(s) + CO2(g)', type: 'Разложение', cond: '≈ 850 °C', obs: ['Внешне мел почти не меняется, но выделяет CO₂', 'Остаётся негашёная известь CaO'], why: 'Так тысячи лет обжигают известняк. ΔH° > 0: чтобы разорвать решётку карбоната, нужна энергия.', tags: ['co2'] },
  nahco3: { eq: '2NaHCO3(s) -> Na2CO3(s) + H2O(g) + CO2(g)', type: 'Разложение', cond: 'выше 80 °C', obs: ['Сода «кипит»: выделяются пар и углекислый газ'], why: 'Поэтому тесто с содой поднимается в духовке: пузырьки CO₂ разрыхляют его.', tags: ['co2'] },
  nh4cl: { eq: 'NH4Cl(s) <=> NH3(g) + HCl(g)', type: 'Разложение · возгонка', cond: '≈ 340 °C', obs: ['Соль словно испаряется', 'У холодного горлышка газы снова соединяются в белый налёт NH₄Cl'], why: 'Это не настоящая возгонка, а разложение и обратное соединение. Равновесие смещается в зависимости от температуры.', fx: { smoke: '#f7f7f7' } },
  kmno4: { eq: '2KMnO4(s) -> K2MnO4(s) + MnO2(s) + O2(g)', type: 'Разложение', cond: '≈ 240 °C', obs: ['Кристаллы потрескивают и чернеют', 'Выделяется кислород: тлеющая лучинка вспыхивает'], why: 'Лабораторный способ получить немного чистого кислорода.' },
  cocl2: { eq: '[Co(H2O)6]^2+ + 4Cl^- <=> [CoCl4]^2- + 6H2O(l)', type: 'Равновесие · термохромизм', cond: 'нагрев', obs: ['Розовый раствор при нагревании синеет', 'Если убрать горелку, при остывании он снова розовеет'],
    why: 'Прямая реакция эндотермична, поэтому по принципу Ле Шателье нагрев сдвигает равновесие к синему тетраэдрическому комплексу [CoCl₄]²⁻. На этом же равновесии основаны индикаторы влажности: сухой хлорид кобальта синий, влажный — розовый.', fx: { bubbles: null, solSeq: [[0, '#e58aa8'], [1, '#b67ac8'], [2.5, '#2d4fd6']] }, tags: ['colorseq'] },
  sucrose: { eq: 'C12H22O11(s) -> 12C(s) + 11H2O(g)', type: 'Карамелизация · обугливание', cond: 'сильный нагрев', obs: ['Сахар плавится около 186 °C и становится янтарной карамелью', 'При сильном нагреве чернеет и дымит — остаётся уголь'],
    why: 'При нагреве молекулы сахарозы теряют воду и сцепляются в окрашенные полимеры — это и есть карамель. Полное обугливание оставляет почти чистый углерод.', fx: { bubbles: null, smoke: '#8a7a6a', coat: '#2a1c10' } },
  h2o2: { eq: '2H2O2(aq) -> 2H2O(l) + O2(g)', type: 'Разложение', cond: 'нагрев', obs: ['Выделяются мелкие пузырьки кислорода'], why: 'Нагрев ускоряет разложение, но катализатор — MnO₂ или KI — действует гораздо эффективнее.', fx: { bubbles: '#ffffff' } }
};

/* ---------- Правила ---------- */
function heatHint(eqs) { return eqs; }

function waterReaction(m, heat) {
  const s = m.sym;
  if (ACTIVE.has(s)) {
    const [, n] = E0[s];
    const hyd = saltFormula(`${s}^${n > 1 ? n : ''}+`, 'OH^-');
    const aq = !(s === 'Ca');
    const eq = mk(`${s}(s) + H2O(l) -> ${hyd}(${aq ? 'aq' : 's'}) + H2(g)`);
    const OBS = { Li: 'Литий плавает на поверхности и спокойно шипит', Na: 'Натрий плавится в блестящий шарик и с шипением носится по поверхности', K: 'Калий мгновенно вспыхивает бледно-фиолетовым пламенем: загорается выделяющийся водород',
      Rb: 'Рубидий взрывается сразу при контакте с водой', Cs: 'Цезий взрывается мгновенно — даже в ледяной воде', Ca: 'Кальций тонет и ровно выделяет пузырьки; раствор мутнеет от малорастворимого Ca(OH)₂',
      Sr: 'Стронций энергично выделяет водород', Ba: 'Барий бурно реагирует, раствор нагревается' };
    const boom = s === 'Rb' || s === 'Cs';
    return ev({ type: 'Замещение · ОВР', subs: [{ eq }], source: 'curated',
      obs: [OBS[s], 'Раствор становится щелочным — фенолфталеин окрасится в малиновый'],
      why: `${m.name} отдаёт электрон${n > 1 ? 'ы' : ''} молекулам воды (E° = ${fmtV(E0[s][0])}), и те восстанавливаются до водорода. Чем ниже металл в первой группе, тем дальше внешний электрон от ядра и тем бурнее реакция.`,
      danger: 'Щелочные металлы хранят под керосином; реакция с водой может выбросить горячую щёлочь.',
      fx: { bubbles: '#ffffff', flame: s === 'K' ? '#b98ce0' : (boom ? '#ffd9a0' : null), boom, dissolve: true, ppt: s === 'Ca' ? '#f5f5f2' : null, darting: s === 'Na' || s === 'Li' },
      tags: ['water-metal', ...(boom ? ['boom'] : [])], base: true });
  }
  if (s === 'Mg') {
    if (!heat) return NONE('В холодной воде магний реагирует так медленно, что изменений не видно: его защищает плёнка Mg(OH)₂. В горячей воде пойдут пузырьки водорода.', { needHeatHint: true });
    return ev({ type: 'Замещение · ОВР', source: 'curated', subs: [sub('Mg(s) + H2O(l) -> Mg(OH)2(s) + H2(g)')], obs: ['В горячей воде на магнии появляются пузырьки водорода', 'Раствор слегка подщелачивается'],
      why: 'Нагрев разрушает защитную плёнку гидроксида. С водяным паром магний вообще горит: Mg + H₂O → MgO + H₂.', fx: { bubbles: '#ffffff' }, tags: ['water-metal'], base: true });
  }
  if (s === 'F') return ev({ type: 'ОВР', source: 'curated', subs: [sub('2F2(g) + 2H2O(l) -> 4HF(aq) + O2(g)')], obs: ['Вода «горит» во фторе с выделением кислорода'], why: 'Фтор — единственный окислитель, который отнимает электроны у кислорода воды.', danger: 'Фтороводородная кислота крайне токсична.', fx: { bubbles: '#ffffff', flame: '#fff6d8' } });
  if (s === 'Cl') return ev({ type: 'Диспропорционирование · равновесие', source: 'curated', subs: [sub('Cl2(g) + H2O(l) <=> HCl(aq) + HClO(aq)')], obs: ['Получается бледно-жёлто-зелёная «хлорная вода» с запахом хлора', 'Раствор обесцвечивает красители'],
    why: 'Хлорноватистая кислота HClO — сильный окислитель, поэтому хлорная вода отбеливает и обеззараживает.', fx: { sol: '#e3eeb0' } });
  if (s === 'Br') return PHYS('Растворение', 'Бром немного растворяется в воде (≈ 3,4 г/100 мл), получается оранжевая «бромная вода». Химической реакции почти нет: равновесие Br₂ + H₂O ⇄ HBr + HBrO сильно смещено влево.', { fx: { sol: '#e0892f' } });
  if (s === 'I') return PHYS('Растворение', 'Иод почти нерастворим в воде (0,03 г/100 мл): раствор едва желтеет. Если добавить иодид калия, иод растворится хорошо.', { fx: { sol: '#e2c37a' } });
  if (s === 'P') return NONE('Белый фосфор не реагирует с водой — поэтому его и хранят под водой, подальше от кислорода воздуха.');
  if (s === 'Al') return NONE('Алюминий покрыт плотной плёнкой Al₂O₃ толщиной в несколько нанометров, и вода до металла не добирается. Без плёнки (например, в амальгаме) алюминий бурно выделял бы водород.');
  if (s === 'Be') return NONE('Бериллий защищён оксидной плёнкой и с водой не реагирует даже при нагреве.');
  if (s === 'Fe') return NONE('Сразу железо с водой не реагирует. За дни и недели, при доступе кислорода воздуха, оно ржавеет: 4Fe + 3O₂ + 6H₂O → 4Fe(OH)₃.');
  if (isMetal(m)) {
    if (m.cat === 'la') return UNK('Лантаноиды медленно реагируют с водой с выделением водорода, но скорость сильно зависит от металла и состояния его поверхности. В симуляторе эти реакции не описаны.');
    const E = E0[s];
    return NONE(`${m.name} с водой не реагирует${E ? ` (E° = ${fmtV(E[0])})` : ''}: он недостаточно активен, чтобы восстановить водород из воды${E && E[0] < 0 ? ', либо его защищает оксидная плёнка' : ''}.`);
  }
  if (m.cat === 'ng') return PHYS('Растворение', `${m.name} слегка растворяется в воде, но химически с ней не взаимодействует.`);
  return NONE(`${m.name} с водой не реагирует.`);
}

function metalAq(m, S, heat) {
  const s = m.sym, E = E0[s];
  const ions = ionsOf(S);
  const catIons = ions.map(x => x[0]).filter(i => parseCharge(i.split('^')[1]) > 0);
  const anIons = ions.map(x => x[0]).filter(i => parseCharge(i.split('^')[1]) < 0);
  const strongAcid = S.acid === 's', weakAcid = S.acid === 'w';
  if (ACTIVE.has(s)) {
    const n = E0[s][1], cat = `${s}^${n > 1 ? n : ''}+`;
    if (strongAcid) {
      const an = anIons[0];
      return ev({ type: 'Замещение · ОВР', source: 'rules', subs: [sub(`${s}(s) + H^+ -> ${cat} + H2(g)`)], mol: mk(`${s}(s) + ${S.f}(aq) -> ${saltFormula(cat, an)}(aq) + H2(g)`),
        obs: ['Ещё бурнее, чем с водой: в кислоте больше ионов H⁺', 'Водород может воспламениться'], why: `${m.name} — один из самых активных металлов (E° = ${fmtV(E0[s][0])}). Ионы H⁺ восстанавливаются до водорода.`,
        danger: 'Щелочной металл в кислоте — это разбрызгивание и возможный взрыв.', fx: { bubbles: '#ffffff', flame: s === 'K' ? '#b98ce0' : null, boom: s === 'Rb' || s === 'Cs' || s === 'K', dissolve: true }, tags: ['boom'] });
    }
    // металл сначала реагирует с водой, затем гидроксид — с солью
    const w = waterReaction(m, heat);
    const second = [];
    for (const c of catIons) {
      const P = PPT[c + '|OH^-'];
      if (P) second.push({ c, P });
    }
    if (S.ions && S.ions.some(x => x[0] === 'NH4^+')) second.push({ nh4: true });
    if (second.length) {
      for (const x of second) {
        if (x.nh4) { w.subs.push(sub('NH4^+ + OH^- -> NH3(g) + H2O(l)')); w.obs.push('Чувствуется запах аммиака'); continue; }
        const [pf, col, desc, , special] = x.P;
        w.subs.push({ eq: mk(special || `${x.c} + OH^- -> ${pf}(s)`) });
        w.obs.push(`Сразу выпадает ${desc}`);
        w.fx.ppt = col;
      }
      w.obs.push(`Металл из соли не вытесняется! ${m.name} успевает прореагировать с водой раньше, чем с ионами соли`);
      w.type = 'Две стадии: с водой, затем обмен';
      w.tags.push('ppt');
      w.fx.sol = solColor(ions.filter(x => !second.some(y => y.c === x[0])).map(x => x[0]));
    }
    return w;
  }
  if (!E) return UNK(`Для металла ${m.name} (${s}) в симуляторе нет стандартного электродного потенциала, поэтому его реакции в растворах не описаны.`);
  const eStr = fmtV(E[0]);
  const n = E[1];
  const catM = (k) => `${s}^${k > 1 ? k : ''}+`;
  // азотная кислота — окислитель за счёт NO3−
  if (S.id === 'hno3') {
    if (['Au', 'Pt', 'Pd'].includes(s)) return NONE(`${m.name} не растворяется в азотной кислоте. Растворить его может только «царская водка» — смесь HNO₃ и HCl в соотношении 1 : 3.`);
    const k = s === 'Fe' ? 3 : n;
    const cat = catM(k);
    const extra = ['Zn', 'Mg', 'Al', 'Mn'].includes(s) ? ' С очень разбавленной кислотой активные металлы дают также N₂O, N₂ и даже NH₄NO₃ — точный состав зависит от концентрации.' : '';
    return ev({ type: 'ОВР', source: 'rules', subs: [sub(`${s}(s) + H^+ + NO3^- -> ${cat} + NO(g) + H2O(l)`)], mol: mk(`${s}(s) + HNO3(aq) -> ${saltFormula(cat, 'NO3^-')}(aq) + NO(g) + H2O(l)`),
      obs: ['Металл растворяется с выделением бесцветного газа NO', 'У горлышка газ буреет: 2NO + O₂ → 2NO₂', ...(s === 'Cu' ? ['Раствор становится голубым'] : [])],
      why: `Азотная кислота окисляет не ионом H⁺, а нитрат-ионом, поэтому водород не выделяется и реагирует даже медь, стоящая после водорода.${extra}`,
      danger: 'Оксиды азота ядовиты.', fx: { bubbles: '#ffffff', gasTop: '#8a3b12', dissolve: true, sol: solColor([cat]) } });
  }
  if (strongAcid || weakAcid) {
    if (E[0] >= 0) return NONE(`${m.name} стоит в ряду активности после водорода (E° = ${eStr} > 0 В), поэтому не может восстановить ионы H⁺: водород из кислоты не вытесняется.`);
    const cat = catM(n);
    const acidAn = weakAcid ? 'CH3COO^-' : anIons[0];
    const slow = { Pb: 'Реакция быстро останавливается: свинец покрывается нерастворимой плёнкой соли.', Al: 'Первые минуты ничего не происходит, пока кислота растворяет оксидную плёнку. Затем реакция ускоряется.' };
    const ppt = s === 'Pb' && (acidAn === 'Cl^-' || acidAn === 'SO4^2-');
    const eq = weakAcid ? mk(`${s}(s) + CH3COOH(aq) -> ${cat} + CH3COO^- + H2(g)`) : mk(`${s}(s) + H^+ -> ${cat} + H2(g)`);
    return ev({ type: 'Замещение · ОВР', source: 'rules', subs: [{ eq }],
      mol: mk(`${s}(s) + ${S.f}(aq) -> ${saltFormula(cat, acidAn)}(${ppt ? 's' : 'aq'}) + H2(g)`),
      obs: [weakAcid ? 'Медленное выделение пузырьков водорода: уксусная кислота слабая' : 'Металл растворяется, выделяются пузырьки водорода', 'Поднесённая к горлышку спичка даёт характерный хлопок', ...(slow[s] ? [slow[s]] : [])],
      why: `${m.name} стоит в ряду активности до водорода (E° = ${eStr} < 0 В), поэтому отдаёт электроны ионам H⁺.${s === 'Fe' ? ' Кислота-неокислитель переводит железо только в Fe²⁺.' : ''}`,
      fx: { bubbles: '#ffffff', dissolve: true, sol: solColor([cat]) } });
  }
  // замещение металла в соли
  const subs = [], obs = [];
  let fx = { deposit: null }, tags = [];
  for (const c of catIons) {
    if (c === 'Fe^3+') {
      if (E[0] < 0.77) {
        if (s === 'Fe') subs.push({ eq: mk('Fe(s) + 2Fe^3+ -> 3Fe^2+'), mol: mk('Fe(s) + 2FeCl3(aq) -> 3FeCl2(aq)') });
        else subs.push({ eq: mk(`${s}(s) + Fe^3+ -> ${catM(n)} + Fe^2+`), mol: mk(`${s}(s) + FeCl3(aq) -> ${saltFormula(catM(n), 'Cl^-')}(aq) + FeCl2(aq)`) });
        obs.push('Металл растворяется, желто-бурый раствор светлеет до зеленоватого (Fe³⁺ → Fe²⁺)');
        if (s === 'Cu') obs.push('Так травят медные дорожки печатных плат');
        fx.sol = solColor([catM(n), 'Fe^2+']); fx.dissolve = true;
      }
      continue;
    }
    const cm = c.split('^')[0];
    const Ec = E0[cm];
    if (!Ec) continue;
    if (Ec[0] > E[0]) {
      const eq = mk(`${s}(s) + ${c} -> ${catM(n)} + ${cm}(s)`);
      const anion = anIons[0];
      subs.push({ eq, mol: mk(`${s}(s) + ${S.f}(aq) -> ${saltFormula(catM(n), anion)}(aq) + ${cm}(s)`) });
      const DEP = { Cu: 'рыхлым красно-коричневым слоем меди', Ag: 'блестящими игольчатыми кристаллами серебра — «серебряное дерево»', Pb: 'серыми кристаллами — «свинцовое дерево»', Fe: 'тёмным налётом железа' };
      obs.push(`Поверхность ${gen(m.name)} покрывается ${DEP[cm] || 'налётом металла'}`);
      const col = solColor([catM(n)]);
      if (ION_COLOR[c] && !ION_COLOR[catM(n)]) obs.push('Окраска раствора постепенно бледнеет');
      if (ION_COLOR[catM(n)]) obs.push(s === 'Cu' ? 'Раствор постепенно голубеет — в нём появляются ионы Cu²⁺' : 'Раствор меняет окраску');
      fx.deposit = PCOLOR[cm] || '#888'; fx.sol = col; tags.push('displace');
      if (s === 'Al') obs.push('С сульфатом меди реакция идёт очень медленно из-за оксидной плёнки. Хлорид-ионы разрушают плёнку, поэтому с CuCl₂ реакция бурная');
      const d = (Ec[0] - E[0]).toFixed(2).replace('.', ',');
      return ev({ type: 'Замещение · ОВР', source: 'rules', subs, mol: subs[0].mol, obs,
        why: `Металл с меньшим электродным потенциалом вытесняет металл с большим. Здесь E°(${s}) = ${eStr}, E°(${cm}) = ${fmtV(Ec[0])}; разность ${d} В, и реакция самопроизвольна (ΔG° = −nFΔE° < 0).`, fx, tags });
    }
  }
  if (subs.length) return ev({ type: 'ОВР', source: 'rules', subs, mol: subs[0].mol, obs, why: 'Ион Fe³⁺ — окислитель (E°(Fe³⁺/Fe²⁺) = +0,77 В). Любой металл с меньшим потенциалом отдаёт ему электроны.', fx, tags });
  // амфотерные металлы в щёлочи
  if (S.base === 's' && S.ions && S.ions.some(x => x[0] === 'OH^-') && (s === 'Al' || s === 'Zn')) {
    const eq = s === 'Al' ? mk('2Al(s) + 2OH^- + 6H2O(l) -> 2[Al(OH)4]^- + 3H2(g)') : mk('Zn(s) + 2OH^- + 2H2O(l) -> [Zn(OH)4]^2- + H2(g)');
    return ev({ type: 'ОВР · амфотерность', source: 'rules', subs: [{ eq }], obs: ['Металл растворяется в щёлочи с выделением водорода'], why: `${m.name} — амфотерный металл: его гидроксид растворяется в щёлочи, поэтому защитная плёнка не держится и металл реагирует с водой.`, fx: { bubbles: '#ffffff', dissolve: true } });
  }
  if (catIons.length) {
    const list = catIons.filter(c => E0[c.split('^')[0]] || c === 'H^+').map(c => `E°(${c.split('^')[0]}) = ${fmtV(E0[c.split('^')[0]] ? E0[c.split('^')[0]][0] : 0)}`);
    return NONE(`${m.name} (E° = ${eStr}) не может вытеснить металл из этой соли: катионы раствора — более слабые окислители${list.length ? ' (' + list.join(', ') + ')' : ''}. Металл вытесняет только те металлы, что стоят правее его в ряду активности.`);
  }
  if (S.mol === 'H2O2' || S.id === 'kmno4') return UNK(`Реакция металла ${m.name} с этим окислителем в симуляторе не описана.`);
  return NONE(`${m.name} с этим раствором не реагирует.`);
}

function halogenAq(x, S) {
  const s = x.sym, idx = HAL_ORDER.indexOf(s);
  if (s === 'F') return waterReaction(x);
  const ions = ionsOf(S).map(i => i[0]);
  for (const y of HAL_ORDER.slice(idx + 1)) {
    const an = `${y}^-`;
    if (ions.includes(an)) {
      const Y2 = molF(y);
      const cat = ions.find(i => parseCharge(i.split('^')[1]) > 0);
      return ev({ type: 'Замещение галогена · ОВР', source: 'rules', subs: [sub(`${molF(s)}(${x.st === 'g' ? 'g' : x.st}) + ${an} -> ${s}^- + ${Y2}(aq)`)], mol: mk(`${molF(s)}(${x.st}) + ${S.f}(aq) -> ${saltFormula(cat, `${s}^-`)}(aq) + ${Y2}(aq)`),
        obs: [y === 'I' ? 'Бесцветный раствор буреет от выделившегося иода' : 'Раствор окрашивается в жёлто-оранжевый цвет брома'],
        why: `Активность галогенов убывает сверху вниз: F₂ > Cl₂ > Br₂ > I₂. ${x.name} отнимает электроны у ${an.replace('^-', '⁻')} и вытесняет ${y === 'I' ? 'иод' : 'бром'}.`,
        fx: { sol: y === 'I' ? '#9a5a17' : '#e0892f' }, tags: ['displace'] });
    }
  }
  if (ions.includes('Fe^2+') && (s === 'Cl' || s === 'Br')) {
    return ev({ type: 'ОВР', source: 'rules', subs: [sub(`2Fe^2+ + ${molF(s)}(${x.st}) -> 2Fe^3+ + 2${s}^-`)], obs: ['Бледно-зелёный раствор желтеет'], why: `${x.name} окисляет Fe²⁺ до Fe³⁺.`, fx: { sol: '#d39a2a' } });
  }
  if (wetSub(S) || S.dis) return waterReaction(x);
  return NONE(`${x.name} с этим веществом не реагирует.`);
}

function metallothermy(m, S, heat) {
  const mo = m.cat === 'am' || m.cat === 'ae' ? binary(m.sym, m.ox, 'O', 2) : (OXIDE[m.sym] || binary(m.sym, m.ox, 'O', 2));
  const oxM = S.f.match(/^[A-Z][a-z]?/)[0];
  if (oxM === m.sym) return NONE(`${m.name} не реагирует с собственным оксидом.`);
  const eq = mk(`${m.sym}(${m.st}) + ${S.f}(s) -> ${mo}(s) + ${oxM}(s)`);
  if (eq.dH === null) return UNK(`Для оксида ${mo} нет табличной энтальпии образования, поэтому исход не рассчитать.`);
  if (eq.dH >= 0) return NONE(`${m.name} не может отнять кислород у ${S.f}: ΔH° реакции ${fmtDH(eq.dH)} > 0 — оксид ${S.f} прочнее, чем ${mo}.`, { preview: eq });
  if (!heat) return NEEDHEAT('Смесь порошков металла и оксида стабильна при комнатной температуре. Металлотермия начинается только после сильного поджига.', eq);
  return ev({ type: 'Замещение · металлотермия', source: 'rules', subs: [{ eq }], cond: 'поджиг',
    obs: ['Смесь раскаляется и ярко вспыхивает', `Восстанавливается металлический ${EL[oxM].name.toLowerCase()}`],
    why: `Более активный металл отнимает кислород у менее активного. Считаем по закону Гесса: ΔH° = ΔH°f(${mo}) − ΔH°f(${S.f}) с учётом коэффициентов, и выходит ${fmtDH(eq.dH)}.`,
    fx: { sparks: '#ffcf70', glow: '#ff8a3a', coat: PCOLOR[oxM] }, tags: ['thermite'] });
}

const NOBLE = new Set(['Au', 'Pt', 'Ir', 'Rh', 'Ru', 'Os', 'Pd']);
const NITRIDE = { Li: 'Li3N', Mg: 'Mg3N2', Ca: 'Ca3N2', Sr: 'Sr3N2', Ba: 'Ba3N2', Be: 'Be3N2', Al: 'AlN', Ti: 'TiN' };
const HAL_OX = { Fe: 3, Cu: 2, Ti: 4, V: 4, Cr: 3, Mn: 2, Co: 2, Ni: 2, Mo: 5, W: 6, Sn: 4, Pb: 2, Hg: 2, Au: 3, Pt: 2, Ag: 1, Tl: 1, Bi: 3, U: 4, Nb: 5, Ta: 5, Zr: 4, Hf: 4, Ce: 3, Ga: 3, In: 3, Re: 5, Os: 4, Ir: 3, Ru: 3, Rh: 3, Pd: 2 };
const HAL_SP = { 'Fe+I': 'FeI2', 'Cu+I': 'CuI', 'Sn+I': 'SnI4', 'Au+I': 'AuI', 'U+F': 'UF6', 'W+F': 'WF6', 'Mo+F': 'MoF6' };
const SULF = { Cu: 1, Fe: 2, Ag: 1, Sn: 2, Pb: 2, Hg: 2, Ni: 2, Co: 2, Mn: 2, Cr: 3, Bi: 3, Mo: 4, W: 4, Ti: 4, V: 3, Au: 0, Pt: 0 };
const PASSIVE_F = new Set(['Ni', 'Cu', 'Fe', 'Al', 'Mg', 'Au', 'Pt']);
function isSpont(m, x) {
  const s = m.sym;
  if (x === 'F') return !PASSIVE_F.has(s);
  if (x === 'Cl') return m.cat === 'am' && s !== 'Li' && s !== 'Na';
  if (x === 'Br') return ['K', 'Rb', 'Cs', 'Al'].includes(s);
  if (x === 'O') return ['Rb', 'Cs'].includes(s);
  if (x === 'N') return s === 'Li';
  if (x === 'S') return s === 'Hg';
  return false;
}
function metalNonmetal(m, x, heat) {
  const s = m.sym, a = x.sym;
  let f = null, note = '';
  if (['C', 'Si', 'B', 'Ge', 'Sb'].includes(a)) return NONE(`${m.name} и ${x.name.toLowerCase()} не реагируют в колбе. Карбиды, силициды и бориды металлов получают сплавлением в электропечи при температуре выше 1000–2000 °C.`);
  if (a === 'O') {
    if (['Au', 'Pt', 'Ir', 'Ag'].includes(s)) return NONE(`${m.name} не окисляется кислородом даже при нагреве.${s === 'Ag' ? ' Оксид Ag₂O разлагается уже около 200 °C, поэтому серебро на воздухе чернеет только от следов сероводорода.' : ' Это одна из причин, почему этот металл называют благородным.'}`);
    if (!heat && ['Ca', 'Sr', 'Ba'].includes(s)) {
      const fo = binary(s, 2, 'O', 2);
      return ev({ type: 'Окисление', subs: [sub(`${s}(s) + O2(g) -> ${fo}(s)`)], obs: ['Блестящая поверхность металла быстро тускнеет'], why: `${m.name} окисляется на воздухе уже при комнатной температуре. При нагреве он сгорает ярким пламенем.`, fx: { coat: '#e8e8e2' } });
    }
    f = OXIDE[s] || binary(s, m.ox, 'O', 2);
    if (['Os', 'Pd', 'Ru', 'Rh'].includes(s)) note = 'Окисление идёт только при сильном нагреве, выше 400–800 °C.';
    if (s === 'Os') note += ' OsO₄ летуч и крайне ядовит.';
  } else if (a === 'N') {
    f = NITRIDE[s];
    if (!f) return NONE(`${m.name} не реагирует с азотом: тройная связь N≡N очень прочная (945 кДж/моль), и с азотом соединяются лишь немногие металлы — Li, Mg, Ca, Sr, Ba, Al, Ti.`);
    if (s === 'Al' || s === 'Ti') note = 'Реакция идёт при температуре выше 800 °C.';
  } else if (a === 'H') {
    if (m.cat === 'am') f = `${s}H`;
    else if (['Ca', 'Sr', 'Ba'].includes(s)) f = `${s}H2`;
    else return NONE(`${m.name} не образует гидрида при прямом взаимодействии в колбе. Солеобразные гидриды дают только щелочные и щёлочноземельные металлы.`);
  } else if (['F', 'Cl', 'Br', 'I'].includes(a)) {
    if (NOBLE.has(s) && a === 'I') return NONE(`${m.name} с иодом практически не реагирует.`);
    f = HAL_SP[`${s}+${a}`] || binary(s, HAL_OX[s] || m.ox, a, 1);
    if (PASSIVE_F.has(s) && a === 'F') note = 'Металл покрывается плотной плёнкой фторида, которая останавливает реакцию. Поэтому фтор хранят в никелевых и медных сосудах.';
  } else if (['S', 'Se', 'Te'].includes(a)) {
    if (NOBLE.has(s)) return NONE(`${m.name} не реагирует с ${a === 'S' ? 'серой' : x.name.toLowerCase()} при нагреве горелкой.`);
    const k = SULF[s] !== undefined ? SULF[s] : m.ox;
    f = binary(s, k, a, 2);
  } else if (a === 'P' || a === 'As') {
    if (!(m.cat === 'am' || m.cat === 'ae' || ['Al', 'Zn', 'Ga', 'In', 'Cu'].includes(s))) return UNK(`Взаимодействие металла ${m.name} с ${x.name.toLowerCase()} в симуляторе не описано.`);
    f = s === 'Cu' && a === 'P' ? 'Cu3P' : binary(s, m.ox, a, 3);
    if (s === 'Ga' && a === 'As') note = 'GaAs — полупроводник, из него делают светодиоды и солнечные батареи.';
  } else return UNK(`Реакция металла ${m.name} с ${x.name.toLowerCase()} в симуляторе не описана.`);

  const eq = mk(`${s}(${m.st}) + ${molF(a)}(${x.st}) -> ${f}(${defState(f)})`);
  const spont = isSpont(m, a);
  if (!spont && !heat) return NEEDHEAT(`При комнатной температуре ${m.name.toLowerCase()} и ${x.name.toLowerCase()} почти не реагируют: не хватает энергии активации. Включите горелку.`, eq);
  const fl = FLAME[s];
  const d = m.en != null && x.en != null ? Math.round(Math.abs(x.en - m.en) * 100) / 100 : null;
  const ox = ACHARGE[a] ? ACHARGE[a] * parseF(f).atoms[a] / parseF(f).atoms[s] : null;
  const name = compoundName(f);
  const obs = [];
  if (heat || spont) obs.push(fl ? `Металл горит, пламя ${fl[1]}` : (s === 'Mg' || s === 'Al' ? 'Ослепительно-белое пламя' : 'Смесь раскаляется и светится'));
  obs.push(`Образуется ${name || f}${PCOLOR[f] ? '' : ' — твёрдое вещество'}`);
  if (note) obs.push(note);
  const bond = d == null ? '' : (d > 1.7 ? ' Связь в продукте преимущественно ионная.' : ' Связь в продукте ковалентная полярная.');
  return ev({ type: 'Соединение · ОВР', source: 'rules', subs: [{ eq }], cond: spont ? '' : 'нагрев',
    obs, why: `${m.name}${m.en != null ? ` (χ = ${fmtN(m.en)})` : ''} отдаёт электроны, ${x.name.toLowerCase()}${x.en != null ? ` (χ = ${fmtN(x.en)})` : ''} их принимает${d != null ? `; Δχ = ${fmtN(d)}` : ''}.${bond} Формула выведена из степеней окисления ${s}${ox && Number.isInteger(ox) ? '(+' + ox + ')' : ''} и ${a}(−${ACHARGE[a]}).`,
    fx: { flame: fl ? fl[0] : (s === 'Mg' || s === 'Al' ? '#ffffff' : '#ffb347'), smoke: PCOLOR[f] || '#eeeeea', glow: '#ff7a2a' },
    danger: isRadio(m) ? `${m.name} радиоактивен: работа только в защищённых боксах.` : '' });
}

const ALLOYS = { 'Cu+Zn': 'латунь', 'Cu+Sn': 'бронзу', 'Pb+Sn': 'припой (им паяют электронику)', 'Au+Cu': 'красное золото', 'Ag+Au': 'электрум — из него чеканили первые монеты', 'Fe+Ni': 'инвар — сплав, почти не расширяющийся при нагреве', 'Al+Cu': 'основу дюралюминия', 'Ga+In': 'эвтектику, жидкую уже при 15,7 °C', 'Bi+Pb': 'легкоплавкий сплав', 'Bi+Sn': 'легкоплавкий сплав' };
const AMALGAM = new Set(['Na', 'K', 'Li', 'Zn', 'Au', 'Ag', 'Sn', 'Cu', 'Al', 'Pb', 'Cd', 'Mg']);
function metalMetal(x, y, heat) {
  if (x.sym === 'Hg' || y.sym === 'Hg') {
    const o = x.sym === 'Hg' ? y : x;
    if (AMALGAM.has(o.sym)) return PHYS('Амальгама', `${o.name} растворяется в ртути и образует амальгаму — жидкий или пастообразный сплав.${o.sym === 'Au' ? ' Так раньше добывали золото из песка, а потом ртуть выпаривали.' : ''}${o.sym === 'Al' ? ' Амальгама разрушает оксидную плёнку, и алюминий начинает «обрастать» белыми нитями Al₂O₃ прямо на воздухе.' : ''}`, { danger: 'Пары ртути ядовиты.' });
    return NONE(`${o.name} не растворяется в ртути — поэтому ртуть хранят и перевозят в стальных баллонах.`);
  }
  const k = [x.sym, y.sym].sort().join('+');
  if (ALLOYS[k]) return heat ? PHYS('Сплав', `При сплавлении получается ${ALLOYS[k]}. Сплав — это твёрдый раствор, а не химическое соединение: состав у него переменный.`) : NONE(`Твёрдые металлы при смешивании не реагируют. Если их сплавить, получится ${ALLOYS[k]}.`, { needHeatHint: true });
  return NONE('Металлы не вступают друг с другом в реакцию в обычном смысле: у обоих мало электронов на внешнем слое и оба склонны их отдавать. При сплавлении могут образоваться сплавы или интерметаллиды, но их составом этот симулятор не занимается.');
}

const NM_HAL = { F: { As: 'AsF5', Sb: 'SbF5', Se: 'SeF6', Te: 'TeF6', Ge: 'GeF4' }, Cl: { As: 'AsCl3', Sb: 'SbCl3', Ge: 'GeCl4', Se: 'Se2Cl2', Te: 'TeCl4' }, Br: { Si: 'SiBr4', B: 'BBr3', As: 'AsBr3', Sb: 'SbBr3' }, I: { As: 'AsI3', Sb: 'SbI3' } };
function nonmetalPair(x, y, heat) {
  const byS = { [x.sym]: x, [y.sym]: y };
  if (byS.O) {
    const o = x.sym === 'O' ? y : x, f = OXIDE[o.sym];
    if (f) {
      const eq = mk(`${molF(o.sym)}(${o.st}) + O2(g) -> ${f}(${defState(f)})`);
      if (!heat) return NEEDHEAT(`${o.name} на воздухе при комнатной температуре не горит. Нужен нагрев.`, eq);
      return ev({ type: 'Горение', subs: [{ eq }], obs: [`${o.name} сгорает, образуется ${compoundName(f) || f}`, ...(o.sym === 'B' ? ['Пламя ярко-зелёное'] : [])], why: 'Неметалл отдаёт электроны более электроотрицательному кислороду.', fx: { flame: o.sym === 'B' ? '#3fcf6a' : '#ffcf8a', smoke: '#f3f3f3' }, danger: o.sym === 'As' ? 'As₂O₃ — «белый мышьяк», сильный яд.' : '' });
    }
  }
  for (const h of ['F', 'Cl', 'Br', 'I']) {
    if (!byS[h]) continue;
    const o = x.sym === h ? y : x, f = NM_HAL[h] && NM_HAL[h][o.sym];
    if (f) {
      const eq = mk(`${molF(o.sym)}(${o.st}) + ${molF(h)}(${EL[h].st}) -> ${f}(${defState(f)})`);
      if (h !== 'F' && !heat) return NEEDHEAT(`Реакции нужен нагрев.`, eq);
      return ev({ type: 'Соединение', subs: [{ eq }], obs: [`Образуется ${compoundName(f) || f}`], why: `${EL[h].name} — сильный окислитель; ${o.name.toLowerCase()} отдаёт ему электроны.`, fx: { flame: '#fff0c8' }, danger: ['As', 'Se', 'Te', 'Sb'].includes(o.sym) ? 'Соединения этого элемента токсичны.' : '' });
    }
  }
  return UNK(`Прямая реакция между ${x.name.toLowerCase()} и ${y.name.toLowerCase()} в симуляторе не описана. Для многих таких пар она требует особых условий или не идёт вовсе.`);
}

function elemPair(x, y, heat) {
  if (x.cat === 'ng' || y.cat === 'ng') {
    const g = x.cat === 'ng' ? x : y, o = x.cat === 'ng' ? y : x;
    if ((g.sym === 'Xe' || g.sym === 'Rn') && o.sym === 'F') return UNK('Радон с фтором образует RnF₂, но из-за сильной радиоактивности радона эта химия почти не изучена.');
    return NONE(`${g.name} — благородный газ: его внешняя электронная оболочка заполнена${g.sym === 'He' ? ' (1s²)' : ' (ns²np⁶)'}. Отдавать или принимать электроны ему энергетически невыгодно.${g.sym === 'Xe' ? ' Исключение — фтор: попробуйте Xe + F при нагреве.' : ''}`);
  }
  const mx = isMetal(x), my = isMetal(y);
  if (mx && my) return metalMetal(x, y, heat);
  if (mx || my) return metalNonmetal(mx ? x : y, mx ? y : x, heat);
  return nonmetalPair(x, y, heat);
}

function elemReagent(e, S, heat) {
  if (e.cat === 'ng') return NONE(`${e.name} — благородный газ и ни с чем в колбе не реагирует.`);
  if (S.id === 'h2o') return waterReaction(e, heat);
  if (S.id === 'co2') {
    if (isMetal(e) && ACTIVE.has(e.sym)) return UNK('Активные металлы горят и в CO₂, но продукты такой реакции (карбонаты, оксиды, углерод) в симуляторе не описаны.');
    return NONE(`${e.name} не реагирует с углекислым газом: CO₂ не поддерживает горение большинства веществ, поэтому им тушат пожары.`);
  }
  if (isMetal(e)) {
    if (S.oxide) return metallothermy(e, S, heat);
    if (wetSub(S)) return metalAq(e, S, heat);
    if (S.id === 'caco3' || S.id === 'mno2') return heat ? UNK('Эта реакция при нагреве в симуляторе не описана.') : NONE('Твёрдые вещества без растворителя практически не реагируют: частицы соприкасаются лишь в отдельных точках.');
    return NONE('Сухие твёрдые вещества почти не реагируют. Добавьте воду, чтобы получился раствор.');
  }
  if (e.cat === 'hal' && (wetSub(S) || S.dis)) {
    if (S.dis && !wetSub(S)) return NONE('Сухая соль с галогеном почти не реагирует. Растворите соль в воде.');
    return halogenAq(e, S);
  }
  if (wetSub(S)) {
    if (e.sym === 'P' && S.base) return heat ? UNK('Белый фосфор при кипячении со щёлочью даёт ядовитый фосфин PH₃. Точные продукты этой реакции в симуляторе не моделируются.') : NONE('На холоде белый фосфор со щёлочью не реагирует.');
    return heat ? UNK(`При нагревании ${gen(e.name)} с этим раствором возможны реакции, которые в симуляторе не описаны.`) : NONE(`${e.name} в этом растворе не растворяется и не реагирует при комнатной температуре.`);
  }
  return NONE('Эти вещества между собой не реагируют.');
}

function solColor(ionList) { return mixColors(ionList.map(i => ION_COLOR[i])); }

function reagentPair(A, B, heat) {
  if (A.id === 'h2o' || B.id === 'h2o') {
    const O = A.id === 'h2o' ? B : A;
    if (O.id === 'nh4cl') return PHYS('Растворение · эндотермическое', 'Хлорид аммония растворяется с поглощением тепла (ΔH°раств = +14,8 кДж/моль), и колба заметно холодеет. На этом принципе работают охлаждающие пакеты.', { subs: [sub('NH4Cl(s) -> NH4^+ + Cl^-')], fx: { frost: true }, tags: ['endo'] });
    if (O.dis) return PHYS('Растворение', `${O.name} растворяется в воде и распадается на ионы. Химических изменений нет.`, { fx: { sol: solColor(ionsOf(O).map(i => i[0])) } });
    if (O.ph === 'aq') return PHYS('Разбавление', 'Раствор просто разбавляется водой. Ионы и молекулы остаются теми же.');
    return NONE(`${O.name} не растворяется в воде и не реагирует с ней.`);
  }
  const org = [A, B].find(S => S.org);
  if (org) {
    const o = org === A ? B : A;
    if (['kmno4', 'k2cro4', 'agno3', 'h2o2', 'cuso4', 'fecl3', 'hno3'].includes(o.id)) return UNK(`${org.name} с этим веществом может реагировать, но такая пара в симуляторе не описана. Красочные реакции с ${org.id === 'glucose' ? 'глюкозой' : org.id === 'luminol' ? 'люминолом' : 'сахаром'} ищите в витрине.`);
    return NONE(`${org.name} с этим веществом в обычных условиях не реагирует.`);
  }
  const wet = wetSub(A) || wetSub(B);
  if (!wet) return heat ? UNK('Реакция этих сухих веществ при нагреве в симуляторе не описана. Каждое из них можно нагреть отдельно.') : NONE('Сухие твёрдые вещества почти не реагируют между собой: частицы соприкасаются лишь в отдельных точках. Добавьте воду.');
  if (A.id === 'co2' || B.id === 'co2') return NONE('Углекислый газ — кислотный оксид, поэтому он реагирует только с основаниями и щелочными растворами.');

  const subs = [], obs = [], fx = {}, tags = [], consumed = new Set(), produced = [], molReact = [], molProd = [];
  let why = [];
  const pairs = [[A, B], [B, A]];
  const has = (S, ion) => (S.ions || []).some(x => x[0] === ion);
  for (const [X, Y] of pairs) {
    // кислота + основание
    const sA = X.acid === 's' && has(X, 'H^+'), wA = X.acid === 'w';
    const sB = has(Y, 'OH^-'), wB = Y.mol === 'NH3';
    if ((sA || wA) && (sB || wB)) {
      const e = sA && sB ? 'H^+ + OH^- -> H2O(l)' : sA && wB ? 'NH3(aq) + H^+ -> NH4^+' : wA && sB ? 'CH3COOH(aq) + OH^- -> CH3COO^- + H2O(l)' : 'CH3COOH(aq) + NH3(aq) -> CH3COO^- + NH4^+';
      subs.push(sub(e)); tags.push('neutral');
      if (sA) consumed.add('H^+'); if (sB) consumed.add('OH^-');
      if (wB) produced.push('NH4^+'); if (wA) produced.push('CH3COO^-');
      if (wB) molReact.push('NH3'); if (wA) molReact.push('CH3COOH');
      obs.push('Раствор нагревается, других видимых изменений нет');
      why.push(sA && sB ? 'Нейтрализация: ионы H⁺ и OH⁻ соединяются в воду. Для любой пары сильных кислоты и щёлочи тепловой эффект одинаков — около −55,8 кДж на моль воды, ведь реакция всегда одна и та же.'
        : 'Нейтрализация с участием слабого электролита: протон переходит от кислоты к основанию. Слабая кислота или слабое основание в растворе почти не распадается на ионы, поэтому в сокращённом уравнении записана целой молекулой.');
    }
    // кислота + карбонат
    if (sA || wA) {
      let e = null;
      if (has(Y, 'CO3^2-')) { e = sA ? 'CO3^2- + 2H^+ -> CO2(g) + H2O(l)' : 'CO3^2- + 2CH3COOH(aq) -> 2CH3COO^- + CO2(g) + H2O(l)'; consumed.add('CO3^2-'); }
      else if (has(Y, 'HCO3^-')) { e = sA ? 'HCO3^- + H^+ -> CO2(g) + H2O(l)' : 'HCO3^- + CH3COOH(aq) -> CH3COO^- + CO2(g) + H2O(l)'; consumed.add('HCO3^-'); }
      else if (Y.id === 'caco3') { e = sA ? 'CaCO3(s) + 2H^+ -> Ca^2+ + CO2(g) + H2O(l)' : 'CaCO3(s) + 2CH3COOH(aq) -> Ca^2+ + 2CH3COO^- + CO2(g) + H2O(l)'; produced.push('Ca^2+'); molReact.push('CaCO3'); }
      if (e) {
        subs.push(sub(e)); if (sA) consumed.add('H^+'); if (wA) { produced.push('CH3COO^-'); if (!molReact.includes('CH3COOH')) molReact.push('CH3COOH'); }
        obs.push(Y.id === 'caco3' && X.id === 'h2so4' ? 'Шипение быстро стихает: мел покрывается малорастворимым CaSO₄' : 'Бурное шипение: выделяется углекислый газ', 'Горящая лучинка у горлышка гаснет');
        fx.bubbles = '#ffffff'; if (Y.id === 'caco3') fx.dissolve = true; tags.push('co2');
        why.push('Угольная кислота H₂CO₃ неустойчива и сразу распадается на CO₂ и воду. Поэтому любая кислота сильнее угольной вытесняет CO₂ из карбонатов.');
      }
      if (sA && Y.oxide) {
        const cat = Y.oxide;
        subs.push(sub(`${Y.f}(s) + H^+ -> ${cat} + H2O(l)`)); consumed.add('H^+'); produced.push(cat); molReact.push(Y.f);
        obs.push(`Оксид растворяется${heat ? '' : ' (при нагревании быстрее)'}, раствор окрашивается${cat === 'Cu^2+' ? ' в голубой цвет' : ' в жёлто-бурый цвет'}`);
        fx.sol = solColor([cat]); fx.dissolve = true;
        why.push('Основный оксид реагирует с кислотой так же, как основание, — образуются соль и вода.');
      }
    }
    if ((sA || wA) && has(Y, 'CrO4^2-')) {
      subs.push(sub(sA ? '2CrO4^2- + 2H^+ <=> Cr2O7^2- + H2O(l)' : '2CrO4^2- + 2CH3COOH(aq) <=> Cr2O7^2- + 2CH3COO^- + H2O(l)'));
      consumed.add('CrO4^2-'); produced.push('Cr2O7^2-'); if (sA) consumed.add('H^+'); else { produced.push('CH3COO^-'); molReact.push('CH3COOH'); }
      obs.push('Лимонно-жёлтый раствор становится оранжевым'); fx.sol = '#ee7a12'; tags.push('colorseq');
      why.push('Хромат в кислоте превращается в дихромат: два иона CrO₄²⁻ сшиваются через общий атом кислорода. Равновесие обратимо — если добавить щёлочь, раствор снова пожелтеет (принцип Ле Шателье).');
    }
    // аммоний + щёлочь
    if (has(X, 'NH4^+') && sB) {
      subs.push(sub('NH4^+ + OH^- -> NH3(g) + H2O(l)')); consumed.add('NH4^+'); consumed.add('OH^-');
      obs.push(heat ? 'Резкий запах аммиака; влажная лакмусовая бумажка синеет' : 'Слабый запах аммиака; при нагревании газ выделяется активно');
      fx.bubbles = heat ? '#ffffff' : null;
      why.push('Сильное основание вытесняет слабое: NH₄⁺ отдаёт протон гидроксид-иону. Это качественная реакция на ионы аммония.');
    }
    // осадки
    for (const [c] of (X.ions || [])) {
      if (c === 'H^+' || c === 'NH4^+') continue;
      for (const [a] of (Y.ions || [])) {
        const P = PPT[c + '|' + a];
        if (!P) continue;
        if (a === 'OH^-' && consumed.has('OH^-') && subs.some(s => s.eq.p.some(t => t.f === 'H2O') && s.eq.r.some(t => t.f === 'H^+'))) continue;
        const [pf, col, desc, yellow, special] = P;
        subs.push({ eq: mk(special || `${c} + ${a} -> ${pf}(s)`) });
        consumed.add(c); consumed.add(a); molProd.push(pf);
        obs.push(`Выпадает ${desc}`);
        fx.ppt = col; tags.push('ppt'); if (yellow) tags.push('ppt-yellow');
        if (special && special.includes('CO2')) { fx.bubbles = '#ffffff'; }
        why.push(`Ионы ${ionTxt(c)} и ${ionTxt(a)} образуют нерастворимое соединение, и ионный обмен идёт до конца.`);
      }
      if (Y.mol === 'NH3' && PPT[c + '|OH^-']) {
        const [pf, col, desc, , special] = PPT[c + '|OH^-'];
        const z = parseCharge(c.split('^')[1]);
        const e = c === 'Ag^+' ? '2Ag^+ + 2NH3(aq) + H2O(l) -> Ag2O(s) + 2NH4^+' : `${c} + NH3(aq) + H2O(l) -> ${pf}(s) + NH4^+`;
        subs.push(sub(e)); consumed.add(c); produced.push('NH4^+'); molReact.push('NH3', 'H2O'); molProd.push(pf);
        obs.push(`Выпадает ${desc}`); fx.ppt = col; tags.push('ppt');
        if (c === 'Ag^+') obs.push('В избытке аммиака осадок растворяется: образуется [Ag(NH₃)₂]⁺ — реактив Толленса для «серебряного зеркала»');
        why.push('Раствор аммиака — слабое основание: NH₃ + H₂O ⇄ NH₄⁺ + OH⁻. Гидроксид-ионов хватает, чтобы осадить гидроксиды металлов.');
      }
    }
    // окислительно-восстановительные пары
    if (has(X, 'Fe^3+') && has(Y, 'I^-')) {
      subs.push(sub('2Fe^3+ + 2I^- -> 2Fe^2+ + I2(aq)')); consumed.add('Fe^3+'); consumed.add('I^-'); produced.push('Fe^2+', 'I2');
      obs.push('Раствор темнеет до бурого: выделяется иод'); fx.sol = '#8a4b12';
      why.push('Fe³⁺ (E° = +0,77 В) — более сильный окислитель, чем I₂ (E° = +0,54 В), поэтому отнимает электроны у иодид-ионов.');
    }
    if (has(X, 'Cu^2+') && has(Y, 'I^-')) {
      subs.push(sub('2Cu^2+ + 4I^- -> 2CuI(s) + I2(aq)')); consumed.add('Cu^2+'); consumed.add('I^-'); produced.push('I2');
      obs.push('Голубой раствор буреет, выпадает осадок CuI, окрашенный иодом'); fx.ppt = '#d8c8a8'; fx.sol = '#8a4b12'; tags.push('ppt');
      why.push('Cu²⁺ окисляет иодид до иода, а сама восстанавливается до Cu⁺. Выпадение нерастворимого CuI делает реакцию выгодной.');
    }
  }
  if (!subs.length) {
    const nonIonic = [A, B].some(S => !S.ions && !S.mol);
    if (A.mol === 'H2O2' || B.mol === 'H2O2') {
      const O = A.mol === 'H2O2' ? B : A;
      if (['hcl', 'h2so4', 'hno3', 'ch3cooh', 'nacl', 'kbr', 'bacl2', 'na2co3', 'caco3', 'kscn', 'nahco3', 'nh4cl'].includes(O.id)) return NONE('Перекись водорода с этим веществом заметно не реагирует: ни осадка, ни газа, ни смены окраски.');
      return UNK('Перекись водорода бывает и окислителем, и восстановителем, и может разлагаться на катализаторах. Эта пара в базе симулятора не описана.');
    }
    if (A.id === 'mno2' || B.id === 'mno2' || nonIonic) return NONE('Эти вещества в растворе между собой не реагируют.');
    if (A.id === 'kmno4' || B.id === 'kmno4') return NONE('Перманганат калия с этим веществом заметно не реагирует. Он окисляет только восстановители — H₂O₂, Fe²⁺, I⁻, Cl⁻ в кислой среде.');
    const all = [...(A.ions || []), ...(B.ions || [])].map(x => ionTxt(x[0]));
    return NONE(`Ионы ${[...new Set(all)].join(', ')} просто перемешиваются. Не образуется ни осадка, ни газа, ни воды, поэтому реакция ионного обмена не идёт. В растворе все ионы остаются свободными.`);
  }
  // молекулярное уравнение
  let mol = null;
  try {
    const pool = [...(A.ions || []), ...(B.ions || [])].map(x => x[0]).filter(i => !consumed.has(i));
    const spec = [...new Set([...pool, ...produced.filter(p => p.includes('^'))])];
    const cats = spec.filter(i => parseCharge(i.split('^')[1]) > 0), ans = spec.filter(i => parseCharge(i.split('^')[1]) < 0);
    const salts = [];
    if (cats.length === 1) ans.forEach(a => salts.push(saltFormula(cats[0], a)));
    else if (ans.length === 1) cats.forEach(c => salts.push(saltFormula(c, ans[0])));
    else if (cats.length || ans.length) throw 0;
    const reacts = [A, B].map(S => `${S.f}(${S.ph === 'l' ? 'l' : S.ph === 's' && !S.dis ? 's' : 'aq'})`);
    const extraR = [...new Set(molReact.filter(f => f === 'H2O'))].map(f => term(f, 'l'));
    const neutral = [];
    for (const s of subs) for (const t of s.eq.p) if (!t.f.includes('^') && !neutral.some(n => n.f === t.f)) neutral.push(t);
    const prods = [...neutral.filter(t => t.s === 's').map(t => term(t.f, t.s)), ...salts.map(f => term(f, 'aq')), ...neutral.filter(t => t.s !== 's').map(t => term(t.f, t.s))];
    if (prods.length) {
      const str = `${[...reacts, ...extraR].join(' + ')} -> ${prods.join(' + ')}`;
      const m = mk(str);
      if (m.ok) mol = m; else BAD_EQ.pop();
    }
  } catch (e) { mol = null; }
  const remaining = [...[...(A.ions || []), ...(B.ions || [])].map(x => x[0]).filter(i => !consumed.has(i)), ...produced];
  if (fx.sol === undefined) fx.sol = solColor(remaining);
  const type = tags.includes('neutral') ? 'Нейтрализация' : tags.includes('ppt') ? 'Ионный обмен · осадок' : tags.includes('co2') ? 'Ионный обмен · газ' : subs.some(s => s.eq.p.some(t => t.f === 'I2')) ? 'ОВР' : 'Ионный обмен';
  return ev({ type, subs, mol, obs: [...new Set(obs)], why: [...new Set(why)].join(' '), fx, tags, ionic: true });
}

function single(id, heat) {
  const S = getSub(id);
  if (S.kind === 'el' && noMacro(S.el)) return noMacroEv(S.el);
  if (!heat) {
    if (S.kind === 'el') return ev({ kind: 'info', type: 'Одно вещество', source: 'none', why: elemInfo(S.el) + ' Добавьте в колбу ещё вещество или включите горелку.' });
    return ev({ kind: 'info', type: 'Одно вещество', source: 'none', why: `${S.name} (${S.f}). Добавьте в колбу ещё вещество или включите горелку.` });
  }
  if (DECOMP[id]) { const d = DECOMP[id]; return ev({ curKey: 'heat:' + id, type: d.type, source: 'curated', subs: [sub(d.eq)], cond: d.cond, obs: d.obs, why: d.why, fx: Object.assign({ bubbles: '#ffffff' }, d.fx || {}), tags: d.tags || [] }); }
  if (id === 'h2o') return PHYS('Кипение', 'При 100 °C вода закипает. Это физический процесс: молекулы H₂O не меняются, лишь рвутся водородные связи между ними. На испарение моля воды уходит 44 кДж.', { subs: [sub('H2O(l) -> H2O(g)')], fx: { bubbles: '#ffffff', steam: true }, tags: ['endo'] });
  if (S.kind === 'rg') {
    if (S.id === 'h2so4c') return PHYS('Нагревание жидкости', 'Концентрированная серная кислота не является водным раствором в модели. Фазовые переходы и разложение при сильном нагреве здесь не рассчитаны; кипение воды к этому веществу не применяется.');
    const cats = ionsOf(S).map(x => x[0].split('^')[0]).filter(c => FLAME[c]);
    if (cats.length) {
      const [col, name, lam] = FLAME[cats[0]];
      return ev({ kind: 'flame', type: 'Пламенная проба', source: 'curated', obs: [`Капля раствора в пламени окрашивает его в ${name.replace(/ый$/, 'ый')} цвет`], why: `Тепло пламени переводит электроны атомов ${cats[0]} на более высокие уровни. Возвращаясь, они испускают свет строго определённой длины волны (${lam}). По такому «отпечатку» определяют металлы — и на Земле, и в спектрах звёзд.`, fx: { flame: col }, tags: ['flame'] });
    }
    if (S.id === 'nh3') return PHYS('Улетучивание', 'При нагревании аммиак выходит из раствора — появляется резкий запах. Растворимость газов с ростом температуры падает.', { subs: [sub('NH3(aq) -> NH3(g)')], fx: { bubbles: '#ffffff' } });
    if (S.oxide || S.id === 'mno2') return NONE(`${S.name} устойчив при нагреве горелкой.`);
    if (S.id === 'co2') return NONE('Углекислый газ при нагреве не разлагается.');
    return PHYS('Нагревание', `${S.name}: раствор нагревается и закипает. Состав вещества не меняется.`, { fx: { bubbles: '#ffffff' } });
  }
  const e = S.el, mp = MP[e.sym];
  if (e.sym === 'I') return PHYS('Возгонка', 'При умеренном нагреве твёрдый иод сублимирует, образуя фиолетовые пары. Это не исключает жидкую фазу: при атмосферном давлении иод также плавится примерно при 114 °C и кипит около 184 °C.', { fx: { gas: '#7b3fa0' } });
  if (e.sym === 'S') return PHYS('Плавление', 'Сера плавится при 115 °C в жёлтую жидкость. Выше 160 °C кольца S₈ рвутся и сцепляются в длинные цепи: расплав темнеет и становится вязким, как мёд.', { fx: { coat: '#b8561a' } });
  if (e.sym === 'Hg') return PHYS('Испарение', 'Ртуть испаряется уже при комнатной температуре, а нагрев многократно ускоряет процесс.', { danger: 'Пары ртути ядовиты — нагревать ртуть в открытой посуде нельзя.' });
  if (e.st === 'g') return PHYS('Нагревание газа', `${e.name} расширяется при нагреве, но без второго реагента химической реакции нет.`);
  if (mp !== undefined && mp < 500) return PHYS('Плавление', `${e.name} плавится при ${fmtN(mp)} °C. Это физический процесс. Чтобы вещество сгорело, добавьте кислород (O).`);
  if (mp !== undefined) return PHYS('Нагревание', `${e.name} плавится только при ${fmtN(mp)} °C — в стеклянной колбе над горелкой так не нагреть. Без второго реагента реакции нет. Чтобы окислить вещество, добавьте кислород (O).`);
  return PHYS('Нагревание', `${e.name} нагревается, но без второго реагента реакции нет.`);
}

function elemInfo(e) {
  const bits = [`${e.name} (${e.sym}), Z = ${e.z}: ${CAT_RU[e.cat]}.`];
  if (e.en != null) bits.push(`Электроотрицательность по Полингу ${fmtN(e.en)}.`);
  if (isRadio(e)) bits.push('Радиоактивен.');
  return bits.join(' ');
}
function noMacroEv(e) {
  let why;
  if (e.sym === 'At') why = 'Во всей земной коре одновременно есть меньше грамма астата, а видимого его количества никто никогда не получал: оно испарилось бы от собственного радиоактивного тепла.';
  else if (e.sym === 'Fr') why = 'Период полураспада самого долгоживущего изотопа франция 22 минуты. Взвешиваемое количество никогда не получали: до нескольких сотен тысяч атомов удерживали только в магнитооптических ловушках.';
  else why = `${e.name} (Z = ${e.z}) получают на ускорителях поштучно — считанные атомы, которые живут от часов до долей миллисекунды. Смешать его с чем-то в колбе невозможно. Химию таких элементов изучают по единичным атомам.`;
  return NONE(why, { type: 'Недоступен в колбе' });
}

function indicatorEv(core, events) {
  const baseIds = ['naoh', 'caoh2', 'nh3', 'na2co3', 'nahco3'], acidIds = ['hcl', 'h2so4', 'hno3', 'ch3cooh', 'fecl3', 'h2so4c'];
  let basic = core.some(i => baseIds.includes(i)) || events.some(e => e.base);
  if (core.includes('Cl') && core.includes('naoh')) basic = true;
  const acidic = core.some(i => acidIds.includes(i)) || (core.includes('co2') && (core.includes('h2o') || core.some(i => wetSub(getSub(i)))));
  const weak = basic && core.every(i => !['naoh', 'caoh2', 'nh3', 'na2co3'].includes(i)) && core.includes('nahco3') && !events.some(e => e.base);
  let why, col;
  if (basic && !acidic) { why = weak ? 'Бледно-розовая окраска: раствор соды слабощелочной (pH ≈ 8,3) — это порог перехода фенолфталеина.' : 'Малиновая окраска: среда щелочная (pH > 8,2). В щелочной среде молекула фенолфталеина теряет протоны и становится окрашенной.'; col = weak ? '#f2a6c4' : '#d6246e'; }
  else if (basic && acidic) { why = 'Окраска зависит от соотношения веществ. Пока щёлочь в избытке, раствор малиновый; после полной нейтрализации он обесцвечивается. По этому моменту определяют конец титрования.'; col = '#f0b8cf'; }
  else { why = 'Раствор бесцветный: фенолфталеин окрашивается только в щелочной среде (pH > 8,2).'; col = null; }
  return ev({ kind: 'ind', type: 'Индикатор', source: 'curated', why, fx: { sol: col } });
}

function concH2SO4(o, heat) {
  if (o.id === 'h2o') return PHYS('Разбавление · сильный нагрев', 'При смешивании концентрированной серной кислоты с водой выделяется очень много тепла: образуются гидраты H₂SO₄·nH₂O. Отсюда правило «сначала вода, потом кислота»: кислоту льют в воду тонкой струйкой, а не наоборот, иначе вода вскипает и выбрасывает кислоту.', { danger: 'Воду в концентрированную кислоту не лить!', fx: { steam: true, glow: '#ff9a4a' } });
  if (o.kind === 'el' && isMetal(o.el)) {
    const s = o.el.sym;
    if (['Fe', 'Al', 'Cr'].includes(s)) return NONE(`На холоде концентрированная серная кислота пассивирует ${gen(o.el.name)}: поверхность покрывается плотной оксидной плёнкой, и реакция останавливается. Поэтому концентрированную H₂SO₄ перевозят в стальных цистернах.`);
    if (['Au', 'Pt'].includes(s)) return NONE(`${o.el.name} не растворяется даже в концентрированной серной кислоте.`);
    return UNK('Концентрированная H₂SO₄ окисляет металлы не ионом H⁺, а атомом серы: в зависимости от активности металла выделяется SO₂, S или H₂S. Для этого металла продукты в симуляторе не описаны.');
  }
  return UNK('Концентрированная серная кислота — сильный окислитель и водоотнимающее средство, поэтому реагирует иначе, чем разбавленная. Эта пара в симуляторе не описана.');
}

function fromSpec(sp, heat) {
  if (Array.isArray(sp)) {
    const hit = sp.find(v => v.h === undefined || v.h === heat);
    if (hit) return fromSpec(Object.assign({}, hit, { h: undefined }), heat);
    const hot = sp.find(v => v.h === true);
    return fromSpec(hot, heat);
  }
  if (sp.none) return NONE(sp.why, { source: 'none' });
  const eqs = sp.eq ? [].concat(sp.eq).map(s => mk(s, sp.over)) : [];
  if (sp.h === true && !heat) return NEEDHEAT(sp.cold || 'При комнатной температуре реакция не начинается: не хватает энергии активации. Включите горелку.', eqs[0]);
  if (sp.phys) return PHYS(sp.type, sp.why, { obs: sp.obs || [], danger: sp.danger || '' });
  return ev({ type: sp.type, source: 'curated', subs: eqs.map(eq => ({ eq })), mol: sp.mol ? mk(sp.mol) : null, obs: sp.obs || [], why: sp.why || '', cond: sp.cond || '', danger: sp.danger || '', fx: Object.assign({}, sp.fx || {}), tags: (sp.tags || []).slice(), ionic: !!sp.mol });
}

function pair(a, b, heat, wetCtx) {
  const c = CUR[key([a, b])];
  if (c) { const r = fromSpec(c, heat); if (r.kind !== 'none' && r.kind !== 'unknown') r.curKey = key([a, b]); return r; }
  if (a === 'h2so4c' || b === 'h2so4c') return concH2SO4(getSub(a === 'h2so4c' ? b : a), heat);
  const wetten = S => (wetCtx && S.dis ? Object.assign({}, S, { ph: 'aq' }) : S);
  const A = wetten(getSub(a)), B = wetten(getSub(b));
  for (const S of [A, B]) if (S.kind === 'el' && noMacro(S.el)) return noMacroEv(S.el);
  let r;
  if (A.kind === 'el' && B.kind === 'el') r = elemPair(A.el, B.el, heat);
  else if (A.kind === 'el' || B.kind === 'el') { const [E, S] = A.kind === 'el' ? [A, B] : [B, A]; r = elemReagent(E.el, S, heat); }
  else r = reagentPair(A, B, heat);
  const radio = [A, B].filter(S => S.kind === 'el' && isRadio(S.el));
  if (radio.length && r.kind === 'rx' && !r.danger) r.danger = `${radio[0].name} радиоактивен: работа только в защищённых боксах.`;
  return r;
}

function finalize(e, pairIds) {
  e.pair = pairIds;
  for (const s of e.subs) {
    const eq = s.eq;
    if (eq.p.some(t => t.f === 'CO2' && t.s === 'g') && !e.tags.includes('co2')) e.tags.push('co2');
    if (eq.dH != null && eq.dH > 0 && (e.kind === 'rx' || e.kind === 'phys') && !e.tags.includes('endo')) e.tags.push('endo');
  }
  if (e.fx.boom && !e.tags.includes('boom')) e.tags.push('boom');
  return e;
}

function starchEv(core, events) {
  const iodine = core.includes('I') || events.some(e => e.subs.some(s => s.eq.p.some(t => t.f === 'I2' || t.f === 'I3^-')));
  if (!iodine) return ev({ kind: 'ind', type: 'Индикатор', source: 'curated', why: 'Крахмал не изменил цвет: свободного иода в колбе нет.' });
  const clock = events.some(e => e.clock);
  return ev({ kind: 'ind', type: 'Индикатор · иод-крахмал', source: 'curated', obs: [clock ? 'Через несколько секунд бесцветный раствор внезапно становится тёмно-синим' : 'Раствор становится тёмно-синим'],
    why: 'Молекулы иода встраиваются в спираль амилозы (компонента крахмала) цепочками I₅⁻, и такой комплекс сильно поглощает оранжевый свет. Чувствительность огромна: заметна даже миллионная доля иода.',
    fx: { solSeq: [[0, null], [clock ? 2.8 : .4, '#171b63']] }, tags: ['colorseq'] });
}

function analyze(ids, heat) {
  const core = ids.filter(i => i !== 'php' && i !== 'starch');
  const events = [];
  const covered = new Set();
  if (core.length === 3 && CUR[key(core)]) {
    const r = fromSpec(CUR[key(core)], heat); if (r.kind !== 'none') r.curKey = key(core);
    events.push(finalize(r, core));
    core.forEach(x => covered.add(x));
  }
  const wetCtx = core.some(i => wetSub(getSub(i)));
  if (!events.length) {
    if (core.length === 1) events.push(finalize(single(core[0], heat), core));
    for (let i = 0; i < core.length; i++) for (let j = i + 1; j < core.length; j++) events.push(finalize(pair(core[i], core[j], heat, wetCtx), [core[i], core[j]]));
  }
  if (ids.includes('starch')) {
    if (!core.length) events.push(ev({ kind: 'info', type: 'Индикатор', source: 'none', why: 'Раствор крахмала — индикатор на иод. Сам по себе он мутновато-бесцветный; добавьте вещества, которые дают свободный иод.' }));
    else events.push(finalize(starchEv(core, events), ids));
  }
  if (ids.includes('php')) {
    if (!core.length) events.push(ev({ kind: 'info', type: 'Индикатор', source: 'none', why: 'Фенолфталеин — индикатор. Сам по себе он бесцветен; добавьте раствор, чтобы проверить его кислотность.' }));
    else events.push(finalize(indicatorEv(core, events), ids));
  }
  return events;
}

/* ---------- Форматирование ---------- */
const fmtN = x => String(x).replace('.', ',');
const fmtV = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2).replace('.', ',') + ' В';
const fmtDH = x => x == null ? 'нет данных' : (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toFixed(1).replace('.', ',') + ' кДж';
const SUPD = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };
function ionTxt(ion) { const [b, ch] = ion.split('^'); return b.replace(/(\d+)/g, m => m.split('').map(d => '₀₁₂₃₄₅₆₇₈₉'[d]).join('')) + (ch ? ch.split('').map(c => SUPD[c]).join('') : ''); }

function rarityOf(sp) {
  const fx = sp.fx || {}, tags = sp.tags || [];
  if (fx.lum || fx.mirror || fx.snake || tags.includes('noble')) return 3;
  if (fx.boom || tags.includes('thermite') || tags.includes('colorseq') || tags.includes('complex') || fx.light) return 2;
  if (fx.flame || fx.ppt || fx.sparks || fx.smoke || fx.sol) return 1;
  return 0;
}
function catalog() {
  const out = [];
  for (const k in CUR) {
    let sp = CUR[k];
    if (Array.isArray(sp)) sp = sp.find(v => !v.none) || null;
    if (!sp || sp.none || sp.phys) continue;
    out.push({ key: k, ids: k.split('+'), type: sp.type, heat: sp.h === true, rarity: rarityOf(sp), eq: sp.eq ? [].concat(sp.eq)[0] : null });
  }
  for (const id in DECOMP) out.push({ key: 'heat:' + id, ids: [id], type: DECOMP[id].type, heat: true, rarity: rarityOf(DECOMP[id]), eq: DECOMP[id].eq });
  return out;
}


/* ---------- Температура ---------- */
const fmtT0 = T => (T < 0 ? '−' : '') + String(Math.abs(T)).replace('.', ',');
// Ориентиры для учебного сценария: зависят от давления, состава, поверхности и способа инициирования.
const TMIN = { 'H+O': 550, 'Cl+H': 250, 'Br+H': 300, 'H+I': 350, 'H+S': 200, 'C+O': 400, 'O+S': 250, 'Cl+S': 150, 'C+S': 850, 'F+Xe': 400, 'Cl+F': 250, 'Cl+Si': 600, 'B+Cl': 500, 'H+Se': 400, 'P+S': 200,
  'Cl+Na': 100, 'Na+O': 120, 'K+O': 80, 'Li+O': 200, 'Mg+O': 470, 'Mg+N': 500, 'Al+O': 650, 'Al+I': 120, 'Fe+S': 450, 'Fe+O': 350, 'Cl+Fe': 250, 'Cu+O': 300, 'Cu+S': 400, 'Cl+Cu': 300, 'S+Zn': 450, 'Au+Cl': 200,
  'Mg+co2': 500, 'Al+fe2o3': 850, 'H+cuo': 300, 'C+cuo': 700, 'H+fe2o3': 500, 'Cu+h2so4c': 150, 'cuso4+glucose+naoh': 70,
  'heat:caco3': 840, 'heat:nahco3': 80, 'heat:nh4cl': 340, 'heat:kmno4': 240, 'heat:h2o2': 60, 'heat:cocl2': 60, 'heat:sucrose': 190, 'heat:S': 115, 'heat:I': 50 };
function tminOf(e) {
  if (e.pair && e.pair.length === 1 && TMIN['heat:' + e.pair[0]] != null) return TMIN['heat:' + e.pair[0]];
  if (e.curKey && TMIN[e.curKey] != null) return TMIN[e.curKey];
  if (e.type === 'Кипение') return 100;
  if (e.kind === 'flame') return 500;
  if (e.tags.includes('thermite')) return 850;
  if (e.pair && e.pair.includes('Mg') && e.subs.some(s => s.eq.p.some(t => t.f === 'Mg(OH)2'))) return 70;
  if (e.type === 'Улетучивание') return 50;
  return 300;
}
const evSig = e => e.kind + '|' + e.type + '|' + e.subs.map(s => eqText(s.eq)).join(';');
// Animation multiplier only; no activation energies or rate laws are specified.
const rateAt = T => Math.pow(2, (Math.max(5, Math.min(65, T)) - 25) / 10);
function aqueousMedium(core) { return core.some(i => { const S = getSub(i); return S && (S.ph === 'aq' || i === 'h2o'); }); }
// -7 °C is a scenario threshold, not a calculated property of an unspecified solution.
function freezePoint(core) {
  if (!aqueousMedium(core)) return -Infinity;
  return core.every(i => { const S = getSub(i); return i === 'h2o' || (S && !wetSub(S) && !S.dis); }) ? 0 : -7;
}
function analyzeT(ids, T) {
  const core = ids.filter(i => i !== 'php' && i !== 'starch');
  const wet = aqueousMedium(ids);
  const fp = freezePoint(ids);
  if (wet && T <= fp) {
    const pure = fp === 0;
    return [finalize(PHYS('Замерзание', pure
      ? `При ${fmtT0(T)} °C вода замёрзла: молекулы H₂O выстроились в кристаллическую решётку льда. Реакции в твёрдом льду почти не идут — частицам не сдвинуться с места.`
      : `Показана условная кристаллизация раствора при ${fmtT0(T)} °C. Порог −7 °C задан для игрового сценария: реальная температура зависит от растворителя и концентрации, которые здесь не рассчитываются. Кристаллизация замедляет перенос частиц; часть раствора может оставаться жидкой.`, { fx: { ice: true } }), core)];
  }
  const cold = analyze(ids, false);
  let out = cold;
  if (T >= 50) {
    const hot = analyze(ids, true);
    out = cold.map((c, i) => {
      const h = hot[i]; if (!h || evSig(c) === evSig(h)) return c;
      const tm = tminOf(h);
      if (T >= tm) { h.tReq = tm; return h; }
      c.needT = tm; return c;
    });
  } else {
    const hot = analyze(ids, true);
    cold.forEach((c, i) => { const h = hot[i]; if (h && evSig(c) !== evSig(h) && (c.needHeat || c.kind === 'info' || c.kind === 'none')) c.needT = tminOf(h); });
  }
  if (core.length === 1 && core[0] === 'I' && T >= 114) {
    out = [finalize(T < 184
      ? PHYS('Плавление иода', 'При атмосферном давлении иод плавится около 114 °C. Над тёмным расплавом есть фиолетовые пары.', { fx: { melt: true, gas: '#7b3fa0' } })
      : PHYS('Кипение иода', 'При атмосферном давлении иод кипит около 184 °C; образуются фиолетовые пары.', { fx: { gas: '#7b3fa0' } }), core)];
  }
  if (core.length === 1 && core[0] === 'S' && T >= 115) {
    out = [finalize(PHYS('Плавление серы', 'Сера плавится примерно при 115 °C. Выше 160 °C расплав становится более вязким из-за образования цепей; цвет и вязкость зависят от температуры.', { fx: { melt: true, coat: T >= 160 ? '#b8561a' : '#e3c534' } }), core)];
  }
  if (core.length === 1 && EL[core[0]] && T >= 50) {
    const e = EL[core[0]], mp = MP[e.sym];
    if (mp !== undefined && !['I', 'S', 'Hg', 'Br'].includes(e.sym) && e.st === 's') {
      out = [finalize(T >= mp ? PHYS('Плавление', `${e.name} расплавился: температура плавления ${fmtN(mp)} °C, а в колбе ${fmtT0(T)} °C. Это физический процесс — вещество осталось тем же.`, { fx: { melt: true } })
        : PHYS('Нагревание', `${e.name} нагрет до ${fmtT0(T)} °C, но плавится только при ${fmtN(mp)} °C. Без второго реагента реакции нет.`), core)];
    }
  }
  if (wet && T >= 100 && T < 160 && !out.some(e => e.type === 'Кипение'))
    out.push(finalize(PHYS('Кипение', 'Показано кипение водной среды при атмосферном давлении. Для чистой воды ориентир — 100 °C; для раствора температура зависит от состава. Температура нагревателя не равна температуре кипящей жидкости.', { fx: { boil: true, steam: true } }), core));
  if (wet && T >= 160 && !out.some(e => e.type === 'Кипение'))
    out.push(finalize(PHYS('Выпаривание', `Нагреватель установлен на ${fmtT0(T)} °C. Показано упаривание: пока вода остаётся в открытой колбе, жидкость находится около своей температуры кипения. Сухой остаток нагревается дальше; его состав и летучесть здесь количественно не рассчитываются.`, { fx: { boil: true, steam: true } }), core));
  return out;
}
function requiredT(ids) {
  const hot = analyze(ids, true), cold = analyze(ids, false);
  let t = 25; hot.forEach((h, i) => { if (evSig(h) !== evSig(cold[i]) && ['rx', 'phys', 'flame'].includes(h.kind)) t = Math.max(t, tminOf(h)); });
  return t;
}

if (typeof module !== 'undefined') module.exports = { analyzeT, requiredT, rateAt, freezePoint, aqueousMedium, catalog, analyze, mk, BAD_EQ, CUR, ELS, REAGENTS, getSub, eqText, hf, key };
