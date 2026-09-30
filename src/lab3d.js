/* ---------- 3D: общие детали ---------- */
const HAS3D = (() => { try { if (typeof THREE === 'undefined') return false; const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch (e) { return false; } })();
const T3 = { R: 1.05, RN: .3, HB: 2.0, HN: 2.85 };
T3.rAt = y => y <= .1 ? T3.R - .1 + Math.sqrt(Math.max(0, .01 - (.1 - y) * (.1 - y))) : y <= T3.HB ? T3.R + (T3.RN - T3.R) * (y - .1) / (T3.HB - .1) : T3.RN;
T3.env = (renderer, dark) => {
  const pm = new THREE.PMREMGenerator(renderer), s = new THREE.Scene();
  const c = document.createElement('canvas'); c.width = 16; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  if (dark) { gr.addColorStop(0, '#5a6674'); gr.addColorStop(.5, '#1d242b'); gr.addColorStop(1, '#07090b'); }
  else { gr.addColorStop(0, '#ffffff'); gr.addColorStop(.45, '#d5dde5'); gr.addColorStop(.55, '#8c96a0'); gr.addColorStop(1, '#2c333a'); }
  g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
  s.add(new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), side: THREE.BackSide })));
  for (const [x, y, z, w, h, k] of [[-7, 8, 5, 6, 2.5, 1], [8, 5, -4, 3, 6, .8], [0, 12, 6, 10, 1.5, 1.2]]) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k, k), side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); s.add(m); }
  const tex = pm.fromScene(s, .02).texture; pm.dispose(); return tex;
};
T3.glassGeo = () => {
  const p = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= 60; i++) { const y = T3.HN * i / 60; p.push(new THREE.Vector2(T3.rAt(y), y)); }
  p.push(new THREE.Vector2(T3.RN + .05, T3.HN), new THREE.Vector2(T3.RN + .05, T3.HN + .06), new THREE.Vector2(T3.RN - .005, T3.HN + .06));
  return new THREE.LatheGeometry(p, 72);
};
T3.fillGeo = h => {
  const p = [new THREE.Vector2(0, .025)];
  for (let i = 0; i <= 36; i++) { const y = .025 + (h - .025) * i / 36; p.push(new THREE.Vector2(Math.max(.01, T3.rAt(y) - .035), y)); }
  p.push(new THREE.Vector2(0, h));
  return new THREE.LatheGeometry(p, 56);
};
T3.glassMat = (tint) => new THREE.MeshPhysicalMaterial({ color: tint || 0xe4eef6, metalness: 0, roughness: .03, transparent: true, opacity: .08, clearcoat: .6, clearcoatRoughness: .02, envMapIntensity: 1.1, side: THREE.DoubleSide, depthWrite: false });
T3.edge = (geo, col) => { const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col || 0xcfe2f0, transparent: true, opacity: .34, side: THREE.BackSide, depthWrite: false })); m.scale.set(1.012, 1.002, 1.012); m.renderOrder = 4; return m; };
T3.uni = f => {
  if (!f) return '';
  const [b, ch] = f.split('^'); let out = '', prev = 'x';
  for (const c of b) { if (/\d/.test(c) && /[A-Za-z\)\]₀-₉]/.test(prev)) { out += '₀₁₂₃₄₅₆₇₈₉'[c]; prev = '₀'; } else { out += c; prev = c; } }
  return out + (ch ? ch.split('').map(c => ({ '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '+': '⁺', '-': '⁻' }[c] || c)).join('') : '');
};
// цвета баллонов по ГОСТ 949-73
T3.CYL = { O2: '#3b8fd9', H2: '#1f5a36', N2: '#1b1d20', CO2: '#1b1d20', Ar: '#8b9097', He: '#6b4a2b', Cl2: '#6b7a3f', F2: '#9a8c3a', Ne: '#8b9097', Kr: '#8b9097', Xe: '#8b9097', Rn: '#8b9097' };
T3.CAP = { 'Кислоты': '#b8352a', 'Основания': '#2a59d6', 'Соли в растворе': '#e8e4da', 'Твёрдые вещества': '#3c4148', 'Органика': '#2f8f4a', 'Прочее': '#7a4fb0', 'Растворители и газы': '#e8e4da' };
T3.AMBER = new Set(['agno3', 'kmno4', 'h2o2', 'hno3', 'ki']);

/* ---------- 3D-лаборатория ---------- */
const Lab3D = (() => {
  if (!HAS3D) return null;
  const wrap = document.querySelector('#stage .canvas-wrap');
  const cv = document.createElement('canvas'); cv.id = 'lab3d'; cv.setAttribute('aria-label', 'Трёхмерный лабораторный стол. Перетащите, чтобы повернуть.');
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: false }); } catch (e) { return null; }
  wrap.insertBefore(cv, wrap.firstChild);
  document.getElementById('lab').hidden = true;
  const flash = document.createElement('div'); flash.className = 'flash3d'; wrap.appendChild(flash);
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x0d1216, 1);
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  scene.environment = T3.env(renderer, true);
  scene.fog = new THREE.Fog(0x0d1216, 13, 28);
  const cam = new THREE.PerspectiveCamera(36, 1, .1, 100);
  const hemi = new THREE.HemisphereLight(0xc6d6ff, 0x15181b, .45); scene.add(hemi);
  const key = new THREE.SpotLight(0xfff0dc, 1.6, 30, .5, .55, 1); key.position.set(2.6, 9.5, 5.5); key.target.position.set(0, .8, 0); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -.0004; scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x86a8ff, .7); rim.position.set(-5, 5, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffe2c8, .25); fill.position.set(-6, 3, 7); scene.add(fill);
  const TABLE_Y = -1.25;
  const rnd = Math.random;
  const add = (o, x, y, z) => { if (x !== undefined) o.position.set(x, y, z); scene.add(o); return o; };

  // комната
  const tableMat = new THREE.MeshStandardMaterial({ color: 0x1b2025, roughness: .55, metalness: .05, envMapIntensity: .6 });
  const table = add(new THREE.Mesh(new THREE.BoxGeometry(18, .3, 8), tableMat), 0, TABLE_Y - .15, -.6); table.receiveShadow = true;
  const edgeMat = new THREE.MeshStandardMaterial({ color: 0x2a3036, roughness: .4 });
  add(new THREE.Mesh(new THREE.BoxGeometry(18, .06, .08), edgeMat), 0, TABLE_Y - .02, 3.42);
  const tileTex = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    g.fillStyle = '#20262c'; g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const v = 44 + Math.floor(rnd() * 10); g.fillStyle = `rgb(${v},${v + 8},${v + 16})`; g.fillRect(i * 64 + 3, j * 64 + 3, 58, 58); g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(i * 64 + 3, j * 64 + 3, 58, 6); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(5, 2.2); return t;
  })();
  const wall = add(new THREE.Mesh(new THREE.PlaneGeometry(20, 9), new THREE.MeshStandardMaterial({ map: tileTex, roughness: .55, envMapIntensity: .5 })), 0, TABLE_Y + 4.5, -4.4); wall.receiveShadow = true;
  // полка с посудой на стене
  const shelf = add(new THREE.Mesh(new THREE.BoxGeometry(7, .08, .7), new THREE.MeshStandardMaterial({ color: 0x3a3128, roughness: .7 })), 0, TABLE_Y + 3.3, -4.05); shelf.castShadow = true;
  [[-2.8, '#6b3d12', .5], [-2.1, '#d6e6f1', .45], [-1.4, '#6b3d12', .38], [1.3, '#d6e6f1', .52], [2.0, '#2f8f4a', .4], [2.7, '#6b3d12', .46]].forEach(([x, c, h]) => {
    const b = add(new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, h * 1.6, 20), new THREE.MeshPhysicalMaterial({ color: c, transparent: true, opacity: .75, roughness: .1, clearcoat: 1, envMapIntensity: 1.5 })), x, TABLE_Y + 3.34 + h * .8, -4.0); b.castShadow = true;
  });
  // штатив, сетка, горелка
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: .3, metalness: .9, envMapIntensity: 1.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: .5, metalness: .6 });
  const ring = add(new THREE.Mesh(new THREE.TorusGeometry(1.08, .035, 8, 48), steel)); ring.rotation.x = Math.PI / 2; ring.position.y = -.04; ring.castShadow = true;
  for (let i = 0; i < 3; i++) { const a = i / 3 * Math.PI * 2 + .5; const leg = add(new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, 1.25, 8), steel), Math.cos(a) * 1.08, TABLE_Y + .6, Math.sin(a) * 1.08); leg.castShadow = true; }
  add(new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, .025, 40), new THREE.MeshStandardMaterial({ color: 0x8e949a, roughness: .7, metalness: .5 })), 0, -.015, 0).receiveShadow = true;
  const gauzeC = add(new THREE.Mesh(new THREE.CylinderGeometry(.6, .6, .027, 32), new THREE.MeshStandardMaterial({ color: 0x6f6a62, roughness: 1, emissive: 0x000000 })), 0, -.013, 0);
  add(new THREE.Mesh(new THREE.CylinderGeometry(.38, .42, .1, 32), dark), 0, TABLE_Y + .05, 0).castShadow = true;
  add(new THREE.Mesh(new THREE.CylinderGeometry(.085, .095, .72, 20), steel), 0, TABLE_Y + .46, 0).castShadow = true;
  const bfMat = new THREE.MeshBasicMaterial({ color: 0x3a6cff, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false });
  const burnFlame = add(new THREE.Mesh(new THREE.ConeGeometry(.1, .42, 20, 1, true), bfMat)); burnFlame.geometry.translate(0, .21, 0); burnFlame.position.y = TABLE_Y + .82;
  const burnCore = add(new THREE.Mesh(new THREE.ConeGeometry(.05, .22, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xa8d4ff, transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }))); burnCore.geometry.translate(0, .11, 0); burnCore.position.y = TABLE_Y + .82;
  const burnLight = add(new THREE.PointLight(0x4a7dff, 0, 4), 0, TABLE_Y + 1.1, 0);
  // ледяная баня
  const iceBath = new THREE.Group(); scene.add(iceBath);
  iceBath.add(new THREE.Mesh(new THREE.CylinderGeometry(1.55, 1.4, .8, 40, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xcfe6f5, transparent: true, opacity: .28, roughness: .1, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false })));
  iceBath.children[0].position.y = .3;
  const iceMat = new THREE.MeshPhysicalMaterial({ color: 0xe6f5ff, transparent: true, opacity: .75, roughness: .15, clearcoat: 1, envMapIntensity: 2 });
  for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2 + rnd() * .2, r = 1.22 + rnd() * .18; const c = new THREE.Mesh(new THREE.BoxGeometry(.2, .18, .2), iceMat); c.position.set(Math.cos(a) * r, .1 + rnd() * .45, Math.sin(a) * r); c.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); iceBath.add(c); }
  iceBath.visible = false;

  // колба
  const glassMat = T3.glassMat();
  const glass = add(new THREE.Mesh(T3.glassGeo(), glassMat)); glass.renderOrder = 3;
  const glassEdge = add(T3.edge(glass.geometry));
  for (const y of [.55, .95, 1.35]) { const r = add(new THREE.Mesh(new THREE.TorusGeometry(T3.rAt(y) + .004, .005, 4, 40, Math.PI * .5), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: .45 }))); r.rotation.set(Math.PI / 2, 0, Math.PI * .25); r.position.y = y; }
  const liqMat = new THREE.MeshStandardMaterial({ color: 0xcfe3f2, transparent: true, opacity: .5, roughness: .04, metalness: 0, envMapIntensity: 1.6, emissive: 0x000000 });
  const liquid = add(new THREE.Mesh(T3.fillGeo(.6), liqMat)); liquid.renderOrder = 1; liquid.visible = false;
  let liqH = 0;
  const ripples = [];
  for (let i = 0; i < 6; i++) { const m = add(new THREE.Mesh(new THREE.RingGeometry(.9, 1, 40), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }))); m.rotation.x = -Math.PI / 2; m.renderOrder = 2; ripples.push({ m, life: 0 }); }
  const gasMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false });
  const gasVol = add(new THREE.Mesh(T3.fillGeo(T3.HN - .02), gasMat)); gasVol.renderOrder = 0;
  const pptMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 });
  const pptLayer = add(new THREE.Mesh(new THREE.CylinderGeometry(T3.rAt(.24) - .05, T3.R - .07, 1, 48), pptMat)); pptLayer.visible = false;
  const flLight = add(new THREE.PointLight(0xffaa55, 0, 9), 0, T3.HN + .7, 0);
  const inLight = add(new THREE.PointLight(0x3f7dff, 0, 7), 0, .5, 0);
  const hotLight = add(new THREE.PointLight(0xff6a2a, 0, 3.5), 0, -.1, 0);
  const flameG = add(new THREE.Group()); flameG.position.y = T3.HN + .06;
  const flOut = new THREE.Mesh(new THREE.ConeGeometry(.36, 1.3, 24, 1, true), new THREE.MeshBasicMaterial({ color: 0xffaa55, transparent: true, opacity: .7, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); flOut.geometry.translate(0, .65, 0); flameG.add(flOut);
  const flIn = new THREE.Mesh(new THREE.ConeGeometry(.2, .75, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xfff4d8, transparent: true, opacity: .8, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); flIn.geometry.translate(0, .37, 0); flameG.add(flIn);
  flameG.visible = false;
  const shock = add(new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff1c8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false })), 0, 1.3, 0);
  // змея и пена
  function lumpy(r0, r1, h, amp) { const g = new THREE.CylinderGeometry(r0, r1, h, 22, 50); g.translate(0, h / 2, 0); const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) { const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i); const k = 1 + amp * Math.sin(y * 7 + Math.atan2(z, x) * 3) + amp * .7 * Math.sin(y * 17.3 + x * 9); pa.setX(i, x * k); pa.setZ(i, z * k); } g.computeVertexNormals(); return g; }
  const snakeMat = new THREE.MeshStandardMaterial({ color: 0x1c1a18, roughness: 1 });
  const snake = add(new THREE.Mesh(lumpy(.27, .31, 3.3, .12), snakeMat)); snake.position.y = .03; snake.visible = false; snake.castShadow = true;
  const mound = add(new THREE.Mesh(new THREE.SphereGeometry(.9, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2), snakeMat)); mound.position.y = .025; mound.visible = false;
  const foamMat = new THREE.MeshStandardMaterial({ color: 0xf6f3ea, roughness: .85 });
  const foam = add(new THREE.Mesh(lumpy(.29, .29, 3.4, .08), foamMat)); foam.position.y = .5; foam.visible = false; foam.castShadow = true;
  const foamCap = add(new THREE.Mesh(new THREE.SphereGeometry(.55, 24, 14), foamMat)); foamCap.visible = false;

  // частицы
  const sph = new THREE.SphereGeometry(1, 10, 8), cube = new THREE.DodecahedronGeometry(1, 0);
  function pool(n, geo, mat) { const m = new THREE.InstancedMesh(geo, mat, n); m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.frustumCulled = false; scene.add(m); return { m, list: [], n }; }
  const bub = pool(420, sph, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .55, roughness: .02, envMapIntensity: 2, depthWrite: false })); bub.m.renderOrder = 2;
  const pptMat2 = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .9 });
  const pp = pool(300, sph, pptMat2);
  const dropMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .9, roughness: .05, envMapIntensity: 1.5 });
  const drops = pool(160, sph, dropMat);
  const grainMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .8 });
  const grains = pool(260, cube, grainMat);
  const dmy = new THREE.Object3D();
  function flushPool(P, fn) { let i = 0; for (const q of P.list) { if (i >= P.n) break; fn(q); dmy.updateMatrix(); P.m.setMatrixAt(i++, dmy.matrix); } dmy.scale.setScalar(0); dmy.updateMatrix(); for (; i < P.n; i++) P.m.setMatrixAt(i, dmy.matrix); P.m.instanceMatrix.needsUpdate = true; }
  const sparkGeo = new THREE.BufferGeometry(); const sparkPos = new Float32Array(500 * 3); sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparkMat = new THREE.PointsMaterial({ color: 0xffcf70, size: .08, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false });
  const sparkPts = add(new THREE.Points(sparkGeo, sparkMat)); sparkPts.frustumCulled = false;
  let sparks = [];
  const softTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.5, 'rgba(255,255,255,.45)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const smoke = [], fire = [];
  for (let i = 0; i < 110; i++) { const s = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, transparent: true, opacity: 0, depthWrite: false }))); s.visible = false; smoke.push({ s, life: 0 }); }
  for (let i = 0; i < 70; i++) { const s = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }))); s.visible = false; fire.push({ s, life: 0 }); }
  const fireball = add(new THREE.Sprite(new THREE.SpriteMaterial({ map: softTex, color: 0xff8a2a, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending })), 0, 1.6, 0);

  // склянки
  const bottles = [];
  const SLOTS_W = [[-2.3, .25], [2.3, .25], [-2.1, -1.4], [2.1, -1.4], [0, -2.3]];
  const SLOTS_P = [[-1.5, .9], [1.5, .9], [-1.55, -1.1], [1.55, -1.1], [0, -2.1]];
  function label(S, id) {
    const c = document.createElement('canvas'); c.width = 320; c.height = 160; const g = c.getContext('2d');
    g.fillStyle = '#f6f1e4'; g.fillRect(0, 0, 320, 160);
    g.fillStyle = S.acid ? '#b8352a' : S.base ? '#2a59d6' : S.org ? '#2f8f4a' : '#4a4f56'; g.fillRect(0, 0, 320, 18); g.fillRect(0, 142, 320, 18);
    g.fillStyle = '#16181b'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const f = T3.uni(S.kind === 'el' ? S.el.sym : S.f) + (id === 'h2so4c' ? ' конц.' : '');
    g.font = `700 ${f.length > 9 ? 36 : 56}px "JetBrains Mono", Menlo, monospace`; g.fillText(f, 160, 66);
    g.font = '600 24px "Golos Text", Arial, sans-serif'; g.fillStyle = '#3c4148'; g.fillText(S.name.length > 22 ? S.name.slice(0, 21) + '…' : S.name, 160, 118);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  function contentColor(S) {
    if (S.kind === 'el') return ELCOLOR[S.el.sym] || (isMetal(S.el) ? '#a3abb4' : (S.el.st === 'g' ? (GASCOLOR[S.f] || '#dfe8ef') : '#bdbdbd'));
    if (S.id === 'php') return '#eef2f4';
    return RCOLOR[S.id] || (S.ions && solColor(S.ions.map(i => i[0]))) || '#bcd6ea';
  }
  function makeBottle(id, slot) {
    const S = getSub(id), g = new THREE.Group(), col = contentColor(S);
    const kind = S.kind === 'el' ? (S.el.st === 'g' ? 'gas' : S.el.st === 'l' ? 'liq' : 'jar') : (S.ph === 'g' ? 'gas' : S.ph === 's' ? 'jar' : 'liq');
    const lab = new THREE.MeshStandardMaterial({ map: label(S, id), roughness: .75 });
    const clear = col === '#bcd6ea' || col === '#eef2f4';
    let mouth = 1.15, content = null, full = 1;
    if (kind === 'liq') {
      const p = [new THREE.Vector2(0, 0), new THREE.Vector2(.34, 0), new THREE.Vector2(.35, .04), new THREE.Vector2(.35, .74), new THREE.Vector2(.22, .92), new THREE.Vector2(.13, .97), new THREE.Vector2(.13, 1.13), new THREE.Vector2(.155, 1.15), new THREE.Vector2(.12, 1.16)];
      const bm = T3.glassMat(T3.AMBER.has(id) ? 0x7a3d0c : 0xe4eef6); if (T3.AMBER.has(id)) { bm.opacity = .62; }
      g.add(new THREE.Mesh(new THREE.LatheGeometry(p, 40), bm));
      const cg = new THREE.CylinderGeometry(.32, .32, .62, 32); cg.translate(0, .31, 0);
      content = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: clear ? .5 : .92, roughness: .06, envMapIntensity: 1.4 }));
      content.position.y = .02; g.add(content);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.355, .355, .36, 32, 1, true, -Math.PI * .4, Math.PI * .8), lab); l.position.y = .4; g.add(l);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.16, .16, .16, 24), new THREE.MeshStandardMaterial({ color: T3.CAP[S.g] || '#3c4148', roughness: .45 })); cap.position.y = 1.2; cap.castShadow = true; g.add(cap); g.userData.cap = cap;
      mouth = 1.16;
    } else if (kind === 'jar') {
      const jg = new THREE.Mesh(new THREE.CylinderGeometry(.38, .38, .64, 36, 1, true), T3.glassMat()); jg.position.y = .32; g.add(jg);
      const bot = new THREE.Mesh(new THREE.CircleGeometry(.38, 32), T3.glassMat()); bot.rotation.x = -Math.PI / 2; bot.position.y = .005; g.add(bot);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(.4, .4, .13, 36), new THREE.MeshStandardMaterial({ color: S.kind === 'el' ? '#3c4148' : (T3.CAP[S.g] || '#3c4148'), roughness: .45 })); cap.position.y = .7; cap.castShadow = true; g.add(cap); g.userData.cap = cap;
      const metal = S.kind === 'el' && isMetal(S.el);
      const cg = new THREE.CylinderGeometry(.35, .35, .32, 32); cg.translate(0, .16, 0);
      content = new THREE.Mesh(cg, new THREE.MeshStandardMaterial({ color: col, roughness: metal ? .3 : .95, metalness: metal ? .8 : 0 }));
      content.position.y = .01; g.add(content);
      if (metal) for (let i = 0; i < 5; i++) { const ch = new THREE.Mesh(new THREE.DodecahedronGeometry(.09, 0), content.material); ch.position.set((rnd() - .5) * .4, .36, (rnd() - .5) * .4); ch.rotation.set(rnd() * 3, rnd() * 3, 0); g.add(ch); }
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.385, .385, .28, 32, 1, true, -Math.PI * .4, Math.PI * .8), lab); l.position.y = .47; g.add(l);
      mouth = .66;
    } else {
      const bc = S.kind === 'el' ? (T3.CYL[S.el.sym === 'O' ? 'O2' : S.el.sym === 'H' ? 'H2' : S.el.sym === 'N' ? 'N2' : S.el.sym === 'Cl' ? 'Cl2' : S.el.sym === 'F' ? 'F2' : S.el.sym] || '#8b9097') : T3.CYL.CO2;
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.26, .26, 1.2, 32), new THREE.MeshStandardMaterial({ color: bc, roughness: .35, metalness: .45, envMapIntensity: 1.2 })); body.position.y = .62; body.castShadow = true; g.add(body);
      const dome = new THREE.Mesh(new THREE.SphereGeometry(.26, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), body.material); dome.position.y = 1.22; g.add(dome);
      const valve = new THREE.Mesh(new THREE.CylinderGeometry(.06, .07, .22, 12), steel); valve.position.y = 1.55; g.add(valve);
      const knob = new THREE.Mesh(new THREE.TorusGeometry(.09, .025, 6, 16), steel); knob.position.y = 1.62; knob.rotation.x = Math.PI / 2; g.add(knob);
      const l = new THREE.Mesh(new THREE.CylinderGeometry(.265, .265, .36, 32, 1, true, -Math.PI * .4, Math.PI * .8), lab); l.position.y = .62; g.add(l);
      mouth = 1.66;
    }
    const [x, z] = slot; g.position.set(x, TABLE_Y, z); g.rotation.y = -Math.atan2(x, 5 - z) * .7;
    g.traverse(o => { if (o.isMesh && o !== content) o.castShadow = true; });
    g.userData = Object.assign(g.userData, { id, kind, col, clear, mouth, home: g.position.clone(), homeRot: g.rotation.y, content, S });
    scene.add(g); return g;
  }
  const streamMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .85, roughness: .04, envMapIntensity: 1.8 });
  const stream = add(new THREE.Mesh(new THREE.BufferGeometry(), streamMat)); stream.visible = false; stream.renderOrder = 2;

  // состояние
  const rgb = h => h ? [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)) : null;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const mixRGB = (a, b, t) => a.map((v, i) => Math.round(lerp(v, b[i], t)));
  const toC = c => new THREE.Color(c[0] / 255, c[1] / 255, c[2] / 255);
  let sc = null, fx = {}, T = 25, rxT = -1, pour = null, W = 0, H = 0, solids = [], speed = 1, lastNow = 0;
  function clearSolids() { for (const s of solids) scene.remove(s.mesh); solids = []; }
  function makeSolid(sd, i, n) {
    let geo, mat; const c = new THREE.Color(sd.col);
    if (sd.shape === 'chunk') { geo = new THREE.DodecahedronGeometry(.17, 0); mat = new THREE.MeshStandardMaterial({ color: c, roughness: .28, metalness: .8, envMapIntensity: 1.4 }); }
    else if (sd.shape === 'drop') { geo = new THREE.SphereGeometry(.2, 24, 16); mat = new THREE.MeshStandardMaterial({ color: c, roughness: .05, metalness: 1, envMapIntensity: 1.6 }); }
    else { geo = new THREE.SphereGeometry(.32, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2); mat = new THREE.MeshStandardMaterial({ color: c, roughness: .95 }); }
    const m = new THREE.Mesh(geo, mat); m.castShadow = true;
    const x = (i - (n - 1) / 2) * .5;
    m.position.set(x, .04, i % 2 ? .12 : -.1);
    if (sd.shape === 'chunk') { m.userData.sy = .6; m.position.y = .1; m.rotation.set(.3 * i, i, .2); }
    else if (sd.shape === 'drop') { m.userData.sy = .45; m.position.y = .1; }
    else m.userData.sy = .45;
    m.userData.base = m.position.clone(); m.userData.col = rgb(sd.col); m.visible = false; scene.add(m);
    return { mesh: m, sd, k: sd.k, grow: 0 };
  }
  function setLiquidH(h) { if (Math.abs(h - liqH) < .006) return; liqH = h; liquid.geometry.dispose(); liquid.geometry = T3.fillGeo(Math.max(.06, h)); liquid.visible = h > .05; }
  function build(ids) {
    rxT = -1; fx = {}; pour = null; stream.visible = false; flash.style.opacity = 0;
    ripples.forEach(r => { r.life = 0; r.m.material.opacity = 0; });
    bub.list = []; pp.list = []; drops.list = []; grains.list = []; sparks = [];
    smoke.concat(fire).forEach(q => { q.life = 0; q.s.visible = false; });
    for (const b of bottles) scene.remove(b); bottles.length = 0;
    clearSolids();
    const subs = ids.map(getSub);
    const liquids = subs.filter(S => S.kind === 'rg' && (S.ph === 'aq' || S.ph === 'l'));
    const wet = liquids.length > 0;
    const ionCols = [];
    for (const S of subs) if (S.kind === 'rg' && (wet || S.ph !== 's') && (S.ph !== 's' || S.dis)) for (const [i] of (S.ions || [])) if (ION_COLOR[i]) ionCols.push(ION_COLOR[i]);
    if (wet && subs.some(S => S.kind === 'el' && S.el.sym === 'Br')) ionCols.push('#e0892f');
    if (wet && subs.some(S => S.id === 'kmno4')) ionCols.push('#7a1fa8');
    const sol = [];
    subs.forEach((S, k) => {
      if (S.kind === 'el') { const e = S.el; if (e.st === 's') sol.push({ col: ELCOLOR[e.sym] || (isMetal(e) ? '#a3abb4' : '#bdbdbd'), shape: isMetal(e) ? 'chunk' : 'powder', k }); if (e.st === 'l' && !wet) sol.push({ col: ELCOLOR[e.sym] || '#999999', shape: 'drop', k }); }
      else if (S.ph === 's' && !(wet && S.dis)) sol.push({ col: RCOLOR[S.id] || '#eeeeee', shape: 'powder', k });
    });
    const gases = subs.filter(S => S.ph === 'g').map(S => S.kind === 'el' ? GASCOLOR[S.f] : null).filter(Boolean);
    if (!wet && subs.some(S => S.kind === 'el' && S.el.sym === 'Br')) gases.push('#9c3a17');
    const colored = mixColors(ionCols);
    const base = rgb(colored || '#bcd6ea');
    const ph = subs.some(S => S.id === 'php') && subs.some(S => ['naoh', 'caoh2', 'nh3', 'na2co3'].includes(S.id)) && !subs.some(S => S.acid);
    sc = { ids: ids.slice(), wet, level: wet ? .3 + .1 * liquids.length : 0, base: ph ? rgb('#d6246e') : base, col: ph ? rgb('#d6246e') : base, colA: (colored || ph) ? .9 : .42,
      to: null, seq: null, gas: gases.length ? rgb(mixColors(gases)) : null, gasA: 0, gasT: gases.length ? .3 : 0, ppt: null, pptAmt: 0, coat: null, coatT: 0, shrink: 1,
      fill: 0, fillT: 0, liqShare: wet ? 1 / liquids.length : 0, fp: freezePoint(ids.filter(i => i !== 'php' && i !== 'starch')) };
    solids = sol.map((sd, i) => makeSolid(sd, i, sol.length));
    const SL = cam.aspect < 1 ? SLOTS_P : SLOTS_W; ids.forEach((id, i) => { if (i < SL.length) bottles.push(makeBottle(id, SL[i])); });
    setLiquidH(0); liquid.visible = false; gasMat.opacity = 0;
    pptLayer.visible = false; snake.visible = mound.visible = foam.visible = foamCap.visible = false; shock.material.opacity = 0; fireball.material.opacity = 0;
    glassMat.color.set(0xe4eef6); glassMat.opacity = .08; glassMat.metalness = 0; glassMat.roughness = .03;
    liqMat.emissive.set(0x000000); liqMat.roughness = .04; inLight.intensity = 0; flLight.intensity = 0; flameG.visible = false;
    $('#temp').hidden = true;
  }
  function applyFx(events) {
    fx = {}; let sol, seq = null;
    for (const e of events) for (const k in e.fx) { if (k === 'sol') { if (e.fx.sol !== undefined) sol = e.fx.sol; } else if (k === 'solSeq') seq = (seq || []).concat(e.fx.solSeq); else if (e.fx[k]) fx[k] = e.fx[k]; }
    sc.to = null; sc.seq = null; sc.ppt = null; sc.pptAmt = 0; sc.coat = null; sc.coatT = 0; sc.shrink = 1; sc.gasTo = null; sc.col = sc.base.slice();
    if (seq) { if (!sc.wet) { sc.wet = true; sc.level = .32; sc.liqShare = 1; sc.forceFill = true; } const st = sc.col.slice(); sc.seq = seq.sort((a, b) => a[0] - b[0]).map(([t, c]) => [t, c ? rgb(c) : st]); }
    else if (sc.wet && sol !== undefined) { sc.to = rgb(sol || '#bcd6ea'); sc.toA = sol ? .9 : .42; }
    else if (!sc.wet && sol) { sc.wet = true; sc.level = .3; sc.liqShare = 1; sc.forceFill = true; sc.to = rgb(sol); sc.toA = .9; }
    if (fx.ppt) sc.ppt = rgb(fx.ppt);
    if (fx.deposit || fx.coat) sc.coat = rgb(fx.deposit || fx.coat);
    if (fx.gas) sc.gasTo = rgb(fx.gas);
    if (fx.gasFade) sc.gasTo = 'fade';
    const dHs = events.flatMap(e => e.subs.map(s => s.eq.dH)).filter(v => v != null);
    const isRx = events.some(e => e.kind === 'rx' || e.kind === 'phys' || e.kind === 'flame');
    const t = $('#temp');
    if (isRx && dHs.length) { const d = dHs[0]; t.hidden = false; t.textContent = d < 0 ? 'тепло выделяется' : d > 0 ? 'тепло поглощается' : 'ΔH ≈ 0'; t.style.color = `var(--${d < 0 ? 'exo' : d > 0 ? 'endo' : 'muted'})`; } else t.hidden = true;
    if (fx.frost) { t.hidden = false; t.textContent = 'колба холодеет'; t.style.color = 'var(--endo)'; }
    glassMat.color.set(0xe4eef6); glassMat.opacity = .08; glassMat.metalness = 0; liqMat.emissive.set(0x000000);
    snake.visible = mound.visible = foam.visible = foamCap.visible = false;
  }
  function showAll() { sc.fill = sc.fillT = sc.wet ? 1 : 0; sc.gasA = sc.gasT; for (const s of solids) { s.mesh.visible = true; s.mesh.position.copy(s.mesh.userData.base); s.grow = 1; } bottles.forEach(b => { if (b.userData.content) b.userData.content.scale.y = .35; }); }
  function finish() {
    if (sc.to) { sc.col = sc.to; sc.colA = sc.toA; sc.to = null; }
    if (sc.seq) { sc.col = sc.seq[sc.seq.length - 1][1]; sc.colA = .9; sc.seq = null; }
    if (sc.ppt) sc.pptAmt = 1; if (sc.coat) sc.coatT = 1; if (fx.dissolve) sc.shrink = .45;
    if (sc.gasTo) { if (sc.gasTo === 'fade') sc.gasA = 0; else { sc.gas = sc.gasTo; sc.gasA = .32; } sc.gasTo = null; }
  }
  function react(events, opt = {}) {
    if (!sc) return 0;
    speed = clamp(opt.speed || 1, .45, 2.4);
    if (opt.noPour && pour === null && rxT >= 0) { applyFx(events); rxT = performance.now(); if (RM.matches) finish(); return 0; }
    build(sc.ids); applyFx(events);
    if (RM.matches) { showAll(); finish(); rxT = performance.now() - 9000; return 0; }
    const n = bottles.length, dur = (n - 1) * 1.45 + 1.75;
    pour = { t0: performance.now(), n, dur, last: 0 };
    return dur * 1000;
  }

  // камера
  let yaw = .3, pitch = .34, dist = 8.6, drag = null, lastUser = -1e9, pinch = null;
  cv.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, yaw, pitch, id: e.pointerId }; });
  addEventListener('pointermove', e => { if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x, dy = e.clientY - drag.y; yaw = drag.yaw - dx * .007; if (e.pointerType === 'mouse') pitch = clamp(drag.pitch + dy * .005, .06, .95); lastUser = performance.now(); });
  addEventListener('pointerup', () => { drag = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); dist = clamp(dist + e.deltaY * .006, 5.5, 13); lastUser = performance.now(); }, { passive: false });
  cv.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), dist }; }, { passive: true });
  cv.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); dist = clamp(pinch.dist * pinch.d / d, 5.5, 13); } }, { passive: true });
  cv.addEventListener('touchend', () => { pinch = null; });
  function resize() { const w = cv.clientWidth, h = cv.clientHeight; if (!w || !h) return; const was = cam.aspect < 1; W = w; H = h; renderer.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); if (sc && was !== (cam.aspect < 1) && !pour) { const SL = cam.aspect < 1 ? SLOTS_P : SLOTS_W; bottles.forEach((b, i) => { const [x, z] = SL[i]; b.position.set(x, TABLE_Y, z); b.userData.home = b.position.clone(); b.userData.homeRot = -Math.atan2(x, 5 - z) * .7; b.rotation.set(0, b.userData.homeRot, 0); }); } }
  addEventListener('resize', resize);

  function puff(list, col, x, y, z, sz, vy, vx, life) { const q = list.find(q => q.life <= 0); if (!q) return; q.life = life || 1; q.s.visible = true; q.s.material.color.set(col); q.s.position.set(x, y, z); q.vx = vx; q.vy = vy; q.sz = sz; }
  function spawn(p, lqY, dt) {
    const k = dt * 60;
    const boiling = sc.wet && T >= 100 && T > sc.fp;
    if ((fx.bubbles && p < 6) || boiling || fx.boil) {
      const rate = (fx.foam ? 7 : fx.bubbles ? 3 : 0) + (boiling ? 4 + (T - 100) / 40 : 0);
      for (let i = 0; i < rate * k * (fx.bubbles && p > 3 ? .5 : 1) && bub.list.length < bub.n; i++) {
        const r = (fx.dissolve ? .35 : .85) * (T3.R - .12) * Math.sqrt(rnd()), a = rnd() * 6.28;
        bub.list.push({ x: Math.cos(a) * r, y: .08, z: Math.sin(a) * r, s: boiling ? .04 + rnd() * .07 : .02 + rnd() * (fx.foam ? .08 : .045), v: .014 + rnd() * .022, top: sc.wet ? lqY : T3.HN });
      }
    }
    if (sc.ppt && p > .25 && p < 3.5 && pp.list.length < pp.n) for (let i = 0; i < 6 * k; i++) {
      const y = .15 + rnd() * Math.max(.1, lqY - .2), r = (T3.rAt(y) - .12) * Math.sqrt(rnd()), a = rnd() * 6.28;
      pp.list.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, s: .02 + rnd() * .03, v: .004 + rnd() * .008 });
    }
    if (fx.smoke && p < 5 && rnd() < .7 * k) puff(smoke, fx.smoke, (rnd() - .5) * .3, T3.HN, (rnd() - .5) * .3, .4 + rnd() * .3, .012 + rnd() * .012, (rnd() - .5) * .008);
    if ((fx.steam && p < 7) || boiling) if (rnd() < (boiling ? .6 : .4) * k) puff(smoke, '#e9eef2', (rnd() - .5) * .25, T3.HN, (rnd() - .5) * .25, .3 + rnd() * .3, .015 + rnd() * .012, (rnd() - .5) * .006);
    if (fx.gasTop && p < 5 && rnd() < .45 * k) puff(smoke, fx.gasTop, (rnd() - .5) * .2, T3.HN + .1, (rnd() - .5) * .2, .3 + rnd() * .2, .01 + rnd() * .01, (rnd() - .5) * .005);
    if (fx.sparks && p < 2.6) for (let i = 0; i < 8 * k; i++) { const a = rnd() * 6.28, v = .04 + rnd() * .1; sparks.push({ x: (rnd() - .5) * .3, y: .3, z: (rnd() - .5) * .3, vx: Math.cos(a) * v * .7, vy: .06 + rnd() * .12, vz: Math.sin(a) * v * .7, life: 1 }); }
    if (fx.flame && p < 4.4 && rnd() < .9 * k) for (let i = 0; i < 2; i++) puff(fire, rnd() < .3 ? '#fff2d0' : fx.flame, (rnd() - .5) * .35, T3.HN + .15, (rnd() - .5) * .35, .35 + rnd() * .35, .025 + rnd() * .03, (rnd() - .5) * .01, .8);
  }
  function tubeStream(from, to, radius) {
    const ctrl = new THREE.Vector3(lerp(from.x, to.x, .25), Math.max(from.y, to.y) + .1, lerp(from.z, to.z, .25));
    const curve = new THREE.QuadraticBezierCurve3(from, ctrl, to);
    stream.geometry.dispose(); stream.geometry = new THREE.TubeGeometry(curve, 26, radius, 10, false);
    return curve;
  }
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (lastNow || now)) / 1000); lastNow = now;
    if (document.getElementById('scrLab').hidden) return;
    if (!W || cv.clientWidth !== W || cv.clientHeight !== H) resize(); if (!W || !sc) return;
    const t = now / 1000;
    if (now - lastUser > 3500 && !drag) yaw += (Math.sin(t * .16) * .22 + .3 - yaw) * .004;
    const p = rxT < 0 ? -1 : (now - rxT) / 1000 * speed;
    let shx = 0, shy = 0;
    if (fx.boom && p >= 0 && p < .7 && !RM.matches) { const k = (1 - p / .7) * .18; shx = (rnd() - .5) * k; shy = (rnd() - .5) * k; }
    const dd = dist * (cam.aspect < 1 ? .9 : Math.max(1, 1.2 / cam.aspect));
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dd + shx, 1.0 + Math.sin(pitch) * dd + shy, Math.cos(yaw) * Math.cos(pitch) * dd);
    cam.lookAt(0, cam.aspect < 1 ? 1.05 : .9, 0);
    // горелка и ледяная баня по температуре
    const burn = T >= 150;
    burnFlame.visible = burnCore.visible = burn;
    if (burn) { const s = .7 + (T - 150) / 750 * 1.3, f = 1 + Math.sin(t * 14) * .07 + Math.sin(t * 31) * .04; burnFlame.scale.set(1 + (s - 1) * .4, s * f, 1 + (s - 1) * .4); burnCore.scale.set(1, s * .8, 1); burnLight.intensity = .6 + s * .7 * f; bfMat.color.setHSL(.62 - clamp((T - 600) / 900, 0, .1), 1, .55); } else burnLight.intensity = 0;
    iceBath.visible = T < 15;
    hotLight.intensity = T > 420 ? (T - 420) / 480 * 2.2 : 0;
    gauzeC.material.emissive.setRGB(T > 380 ? (T - 380) / 520 * .9 : 0, T > 380 ? (T - 380) / 520 * .22 : 0, 0);
    // переливание
    if (pour) {
      const tp = (now - pour.t0) / 1000; let streamOn = false;
      bottles.forEach((b, i) => {
        const u = b.userData, lt = tp - i * 1.45, side = u.home.x >= 0 ? 1 : -1;
        if (lt < 0) return;
        const ease = x => x * x * (3 - 2 * x);
        const up = ease(clamp(lt / .45, 0, 1)), tilt = ease(clamp((lt - .4) / .35, 0, 1)), back = ease(clamp((lt - 1.4) / .35, 0, 1));
        const k = up * (1 - back), ang = side * (u.kind === 'jar' ? 2.15 : u.kind === 'gas' ? .9 : 2.0) * tilt * (1 - back);
        const tgtMouth = new THREE.Vector3(side * (u.kind === 'gas' ? .75 : .42), T3.HN + (u.kind === 'jar' ? .5 : .62), .05);
        const off = new THREE.Vector3(0, u.mouth, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), ang);
        const target = tgtMouth.clone().sub(off);
        b.position.lerpVectors(u.home, target, k);
        b.rotation.set(0, u.homeRot * (1 - k), ang);
        if (u.cap) u.cap.visible = k < .15;
        const pouring = lt > .75 && lt < 1.38;
        if (pouring) {
          b.updateMatrixWorld();
          const m = new THREE.Vector3(0, u.mouth, 0).applyMatrix4(b.matrixWorld);
          const surf = Math.max(.08, liqH), end = new THREE.Vector3(side * .06, u.kind === 'jar' ? Math.max(.1, surf) : surf, 0);
          const share = clamp((lt - .75) / .63, 0, 1);
          if (u.content) u.content.scale.y = lerp(1, .35, share);
          if (u.kind === 'liq') {
            streamOn = true; streamMat.color.set(u.col); streamMat.opacity = u.clear ? .55 : .9;
            tubeStream(m, end, .03 + .018 * Math.sin(share * Math.PI));
            if (u.S.kind === 'rg') sc.fillT = Math.min(1, (sc.fillT || 0) + sc.liqShare * dt / .63);
            if (rnd() < .6 && drops.list.length < drops.n) { dropMat.color.set(u.col); for (let j = 0; j < 3; j++) drops.list.push({ x: end.x, y: end.y, z: end.z, vx: (rnd() - .5) * .03, vy: .02 + rnd() * .03, vz: (rnd() - .5) * .03, s: .012 + rnd() * .018 }); }
            if (rnd() < .12) { const r = ripples.find(r => r.life <= 0); if (r) { r.life = 1; r.m.position.set(end.x, liqH + .005, end.z); } }
          } else if (u.kind === 'jar') {
            grainMat.color.set(u.col);
            for (let j = 0; j < 3 && grains.list.length < grains.n; j++) grains.list.push({ x: m.x + (rnd() - .5) * .08, y: m.y, z: m.z + (rnd() - .5) * .08, vx: -side * (.012 + rnd() * .01), vy: 0, vz: (rnd() - .5) * .006, s: .025 + rnd() * .03, r: rnd() * 6 });
            for (const s of solids) if (s.k === i) { s.mesh.visible = true; s.grow = Math.max(s.grow, share); }
          } else {
            if (rnd() < .7) puff(smoke, u.col === '#dfe8ef' ? '#dfe8ef' : (sc.gas ? '#' + sc.gas.map(v => v.toString(16).padStart(2, '0')).join('') : '#dfe8ef'), m.x - side * .1, m.y - .05, m.z, .18, -.012, -side * .012, .7);
            sc.gasA = lerp(0, sc.gasT, share);
          }
          if (sc.forceFill) sc.fillT = Math.min(1, sc.fillT + dt / .63 / Math.max(1, pour.n));
        }
      });
      stream.visible = streamOn;
      if (tp > pour.dur) {
        pour = null; stream.visible = false; if (sc.forceFill || sc.wet) sc.fillT = sc.wet ? 1 : 0; rxT = now;
        for (const s of solids) { s.mesh.visible = true; s.grow = 1; }
        bottles.forEach(b => { b.position.copy(b.userData.home); b.rotation.set(0, b.userData.homeRot, 0); if (b.userData.cap) b.userData.cap.visible = true; });
      }
    }
    sc.fill = lerp(sc.fill, sc.fillT, .08);
    const lqY = sc.wet ? .025 + sc.level * T3.HB * sc.fill : .05;
    setLiquidH(sc.wet ? lqY : 0);
    // реакция
    if (p >= 0 && !RM.matches) {
      const k = clamp((p - .3) / 2.5, 0, 1);
      if (sc.to) { sc.col = mixRGB(sc.col, sc.to, k * .06 + .012); sc.colA = lerp(sc.colA, sc.toA, .03); }
      if (sc.seq) { const q = sc.seq; let i = 0; while (i < q.length - 1 && p >= q[i + 1][0]) i++; if (i >= q.length - 1) sc.col = q[q.length - 1][1]; else { const [t0, c0] = q[i], [t1, c1] = q[i + 1]; sc.col = mixRGB(c0, c1, clamp((p - t0) / Math.max(.3, (t1 - t0) * .6), 0, 1)); } sc.colA = lerp(sc.colA, .9, .05); }
      if (sc.ppt && p > 1.8) sc.pptAmt = Math.min(1, sc.pptAmt + .005 * speed);
      if (sc.coat) sc.coatT = Math.min(1, sc.coatT + .006 * speed);
      if (fx.dissolve) sc.shrink = Math.max(.45, sc.shrink - .0015 * speed);
      if (sc.gasTo) { if (sc.gasTo === 'fade') sc.gasA = Math.max(0, sc.gasA - .004); else { sc.gas = sc.gas ? mixRGB(sc.gas, sc.gasTo, .03) : sc.gasTo; sc.gasA = Math.min(.32, sc.gasA + .004); } }
      if (p > 9 && (sc.to || sc.seq)) finish();
    }
    if (sc) spawn(p < 0 ? 99 : p, lqY, dt);
    // цвет жидкости: муть осадка, лёд
    let col = sc.col, opa = sc.colA;
    if (sc.ppt && p >= 0) { const cloud = p < .3 ? 0 : p < 1.4 ? (p - .3) / 1.1 : Math.max(0, 1 - (p - 2.2) / 4); col = mixRGB(col, sc.ppt, Math.min(1, cloud * 1.1)); opa = lerp(opa, .98, cloud); }
    const frozen = sc.wet && (T <= sc.fp || fx.ice);
    if (frozen) { col = mixRGB(col, [232, 244, 251], .7); opa = .96; }
    liqMat.color.copy(toC(col)); liqMat.opacity = opa; liqMat.roughness = frozen ? .55 : .04;
    gasMat.color.copy(sc.gas ? toC(sc.gas) : new THREE.Color(1, 1, 1)); gasMat.opacity = sc.gas ? sc.gasA : 0;
    if (sc.ppt && sc.pptAmt > 0) { pptLayer.visible = true; pptMat.color.copy(toC(sc.ppt)); const hh = .03 + sc.pptAmt * .18; pptLayer.scale.y = hh; pptLayer.position.y = .025 + hh / 2; } else pptLayer.visible = false;
    if (sc.ppt) pptMat2.color.copy(toC(sc.ppt));
    // твёрдые
    solids.forEach((s, i) => {
      const m = s.mesh, u = m.userData;
      const g = RM.matches ? 1 : s.grow;
      if (sc.coat && sc.coatT > 0) m.material.color.copy(toC(mixRGB(u.col, sc.coat, sc.coatT * .85)));
      const sh = s.sd.shape === 'chunk' ? sc.shrink : 1, melt = fx.melt && p >= 0 ? clamp(p / 2, 0, 1) : 0;
      m.scale.set(g * sh * (1 + melt * .6), g * u.sy * sh * (1 - melt * .55), g * sh * (1 + melt * .6));
      if (fx.darting && p >= 0 && p < 6 && sc.wet) { m.position.x = Math.sin(t * 3.8 + i) * (T3.rAt(lqY) - .3); m.position.z = Math.cos(t * 2.9 + i) * (T3.rAt(lqY) - .3) * .6; m.position.y = lqY; m.rotation.y += .15; }
      if (m.material.emissive) { const gl = fx.glow && p >= 0 && p < 6 ? (1 - p / 6) : T > 500 ? (T - 500) / 800 : 0; m.material.emissive.setRGB(.9 * gl, .3 * gl, .05 * gl); }
    });
    // частицы
    bub.list = bub.list.filter(q => (q.y += q.v * dt * 60, q.x += Math.sin(q.y * 9) * .002, q.y < q.top));
    flushPool(bub, q => { dmy.position.set(q.x, q.y, q.z); dmy.scale.setScalar(q.s); });
    pp.list = pp.list.filter(q => (q.y -= q.v * dt * 60, q.y > .06));
    flushPool(pp, q => { dmy.position.set(q.x, q.y, q.z); dmy.scale.setScalar(q.s); });
    drops.list = drops.list.filter(q => (q.x += q.vx, q.y += q.vy, q.z += q.vz, q.vy -= .004, q.y > liqH - .02));
    flushPool(drops, q => { dmy.position.set(q.x, q.y, q.z); dmy.scale.setScalar(q.s); });
    grains.list = grains.list.filter(q => { q.vy -= .0045; q.x += q.vx; q.y += q.vy; q.z += q.vz; q.r += .2; const r = T3.rAt(Math.max(0, q.y)) - .1; const l = Math.hypot(q.x, q.z); if (q.y < T3.HN && l > r) { q.x *= r / l; q.z *= r / l; q.vx *= .3; } return q.y > .06; });
    flushPool(grains, q => { dmy.position.set(q.x, q.y, q.z); dmy.rotation.set(q.r, q.r * .7, 0); dmy.scale.setScalar(q.s); });
    dmy.rotation.set(0, 0, 0);
    for (const r of ripples) if (r.life > 0) { r.life -= .025; const s = .08 + (1 - r.life) * .55; r.m.scale.set(s, s, s); r.m.material.opacity = r.life * .35; } else r.m.material.opacity = 0;
    sparks = sparks.filter(q => (q.x += q.vx, q.y += q.vy, q.z += q.vz, q.vy -= .004, q.life -= .018, q.life > 0 && q.y > TABLE_Y));
    for (let i = 0; i < 500; i++) { const q = sparks[i]; sparkPos[i * 3] = q ? q.x : 0; sparkPos[i * 3 + 1] = q ? q.y : -99; sparkPos[i * 3 + 2] = q ? q.z : 0; }
    sparkGeo.attributes.position.needsUpdate = true; if (fx.sparks) sparkMat.color.set(fx.sparks);
    for (const q of smoke) if (q.life > 0) { q.life -= .0055; q.s.position.x += q.vx; q.s.position.y += q.vy; q.sz += .007; q.s.scale.setScalar(q.sz); q.s.material.opacity = Math.max(0, q.life) * .5; if (q.life <= 0) q.s.visible = false; }
    for (const q of fire) if (q.life > 0) { q.life -= .03; q.s.position.x += q.vx; q.s.position.y += q.vy; q.sz *= .985; q.s.scale.setScalar(q.sz); q.s.material.opacity = Math.max(0, q.life) * .8; if (q.life <= 0) q.s.visible = false; }
    // пламя, взрыв
    const fOn = fx.flame && p >= 0 && p < 4.4;
    flameG.visible = !!fOn;
    if (fOn) { const a = Math.min(1, p * 4) * clamp((4.4 - p) / 1.2, 0, 1), f = 1 + Math.sin(t * 18) * .12 + Math.sin(t * 41) * .06; flOut.material.color.set(fx.flame); flameG.scale.set(1 + Math.sin(t * 23) * .05, f, 1); flameG.rotation.y = t * 2; flOut.material.opacity = .65 * a; flIn.material.opacity = .75 * a; flLight.color.set(fx.flame); flLight.intensity = 3 * a * f; } else flLight.intensity = 0;
    const fl = (fx.boom || fx.light || fx.flash) && p >= 0 && p < (fx.boom ? .7 : 1.2) ? (1 - p / (fx.boom ? .7 : 1.2)) * (fx.boom ? .9 : .6) : 0;
    flash.style.opacity = RM.matches ? 0 : fl;
    if (fx.boom && p >= 0 && p < 1.2) { shock.scale.setScalar(.5 + p * 5); shock.material.opacity = (1 - p / 1.2) * .5; fireball.scale.setScalar(1 + p * 7); fireball.material.opacity = Math.max(0, 1 - p / 1.1) * .95; if (p < .9 && rnd() < .8) puff(smoke, '#3a3634', (rnd() - .5) * 1.5, 1.4 + rnd(), (rnd() - .5) * 1.5, .8, .012, (rnd() - .5) * .02); }
    else { shock.material.opacity = 0; fireball.material.opacity = 0; }
    let dim = 0;
    if (fx.lum && p >= 0) { const life = fx.lumWeak ? 7 : 16, env = Math.max(0, Math.min(1, p * 2) * (1 - Math.max(0, p - 2) / life)); dim = env * (fx.lumWeak ? .55 : .9); const pulse = .85 + Math.sin(t * 4) * .15; liqMat.emissive.set(fx.lum).multiplyScalar(env * pulse * (fx.lumWeak ? .4 : 1.1)); inLight.color.set(fx.lum); inLight.intensity = env * pulse * (fx.lumWeak ? 1.2 : 4); }
    else { inLight.intensity = 0; liqMat.emissive.copy(toC(col)).multiplyScalar(sc.colA > .6 ? .06 : 0); }
    if (fx.glow && p >= 0 && p < 5) { inLight.color.set(fx.glow); inLight.intensity = Math.max(inLight.intensity, 3 * (1 - p / 5)); }
    hemi.intensity = .45 * (1 - dim); key.intensity = 1.6 * (1 - dim * .95); rim.intensity = .7 * (1 - dim); fill.intensity = .25 * (1 - dim);
    if (dim > 0) liqMat.color.lerp(new THREE.Color(fx.lum), Math.min(1, dim));
    if (fx.mirror && p >= 0) { const a = RM.matches ? 1 : clamp((p - 1) / 3.5, 0, 1); glassMat.metalness = a; glassMat.roughness = lerp(.03, .1, a); glassMat.opacity = lerp(.08, .97, a); glassMat.color.setRGB(lerp(.89, .9, a), lerp(.93, .91, a), lerp(.96, .93, a)); }
    else if (T < 0 || fx.frost) { const a = fx.frost ? clamp(p / 3, 0, 1) : clamp(-T / 20, 0, 1); glassMat.color.setRGB(lerp(.89, .86, a), lerp(.93, .96, a), 1); glassMat.opacity = lerp(.08, .5, a); glassMat.roughness = lerp(.03, .4, a); }
    else { glassMat.color.setRGB(.89, .93, .96); glassMat.opacity = .08; glassMat.roughness = .03; glassMat.metalness = 0; }
    if (fx.snake && p >= 0) { const k = RM.matches ? 1 : clamp((p - .8) / 6, 0, 1); snake.visible = mound.visible = k > .01; snake.scale.set(1, Math.max(.01, k), 1); mound.scale.set(Math.min(1, k * 4), .3 * Math.min(1, k * 4), Math.min(1, k * 4)); }
    if (fx.foam && p >= 0) { const k = RM.matches ? 1 : clamp(p / 3, 0, 1); foam.visible = foamCap.visible = true; foamMat.color.set(fx.sol || '#f6f3ea'); foam.position.y = lqY - .1; foam.scale.set(1, Math.max(.01, k * (T3.HN + .3 - lqY) / 3.4 + .02), 1); foamCap.position.y = lqY + k * (T3.HN + .35 - lqY); foamCap.scale.set(.55 + k * .5, .5 + k * .3, .55 + k * .5); }
    renderer.render(scene, cam);
  }
  requestAnimationFrame(frame);
  return {
    setScene(list) { build(list); },
    react, resize, setTemp(v) { T = v; }, setHeat(v) { },
    is3D: true
  };
})();

/* ---------- 3D-колба на главном экране ---------- */
function hero3D(cv) {
  if (!HAS3D || !cv) return false;
  let r; try { r = new THREE.WebGLRenderer({ canvas: cv, antialias: true, alpha: true }); } catch (e) { return false; }
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.setClearColor(0, 0); r.setSize(cv.clientWidth || 220, cv.clientHeight || 220, false);
  r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.15;
  const s = new THREE.Scene(); s.environment = T3.env(r, false);
  const cam = new THREE.PerspectiveCamera(34, 1, .1, 50); cam.position.set(0, 2.6, 7.2); cam.lookAt(0, 1.3, 0);
  s.add(new THREE.HemisphereLight(0xffffff, 0x777777, .8)); const d = new THREE.DirectionalLight(0xffffff, .8); d.position.set(-3, 6, 4); s.add(d);
  const g = new THREE.Group(); s.add(g);
  const gm = T3.glassMat(); gm.opacity = .32;
  g.add(new THREE.Mesh(T3.glassGeo(), gm)); g.children[0].renderOrder = 3; g.add(T3.edge(g.children[0].geometry, 0x5f7890));
  const lm = new THREE.MeshStandardMaterial({ color: 0x7a1fa8, transparent: true, opacity: .92, roughness: .05, envMapIntensity: 1.4 });
  const liq = new THREE.Mesh(T3.fillGeo(1.1), lm); liq.renderOrder = 1; g.add(liq);
  const bm = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: .6 }), 40); g.add(bm);
  const bubs = Array.from({ length: 40 }, () => ({ x: (Math.random() - .5) * 1.4, y: Math.random() * 1.1, z: (Math.random() - .5) * 1.4, s: .03 + Math.random() * .05, v: .006 + Math.random() * .012 }));
  const cols = ['#7a1fa8', '#4338b8', '#2f8f4a', '#c9a227', '#b0561a', '#3f7dff', '#8e0b12'].map(h => new THREE.Color(h));
  const o = new THREE.Object3D();
  function f(now) {
    requestAnimationFrame(f);
    if (document.getElementById('scrMenu').hidden) return;
    const t = now / 1000, i = Math.floor(t / 2.2) % cols.length, k = RM.matches ? 0 : (t / 2.2) % 1;
    lm.color.copy(cols[i]).lerp(cols[(i + 1) % cols.length], k * k * (3 - 2 * k));
    g.rotation.y = RM.matches ? .4 : t * .5;
    bubs.forEach((b, j) => { b.y += RM.matches ? 0 : b.v; if (b.y > 1.05) b.y = .05; const rr = T3.rAt(b.y) - .15; const l = Math.hypot(b.x, b.z); if (l > rr) { b.x *= rr / l; b.z *= rr / l; } o.position.set(b.x, b.y, b.z); o.scale.setScalar(b.s); o.updateMatrix(); bm.setMatrixAt(j, o.matrix); });
    bm.instanceMatrix.needsUpdate = true;
    r.render(s, cam);
  }
  requestAnimationFrame(f);
  return true;
}
