'use strict';
/* Virtual dispensing resolution is not a claim about a physical instrument.
   Solids: integer µg. Volumes: integer µL. Stock concentrations: integer µmol/L.
   Stoichiometry is deliberately unavailable for coupled / reversible networks. */
const ChemistryQuant = (() => {
  const E = typeof module !== 'undefined' && module.exports ? require('./engine.js') : { getSub, parseF };
  // CIAAW abridged standard atomic weights (2024). No invented weights for unstable elements.
  const weights = { H:1.008,He:4.0026,Li:6.94,Be:9.0122,B:10.81,C:12.011,N:14.007,O:15.999,F:18.998,Ne:20.180,Na:22.990,Mg:24.305,Al:26.982,Si:28.085,P:30.974,S:32.06,Cl:35.45,Ar:39.95,K:39.098,Ca:40.078,Sc:44.956,Ti:47.867,V:50.942,Cr:51.996,Mn:54.938,Fe:55.845,Co:58.933,Ni:58.693,Cu:63.546,Zn:65.38,Ga:69.723,Ge:72.630,As:74.922,Se:78.971,Br:79.904,Kr:83.798,Rb:85.468,Sr:87.62,Y:88.906,Zr:91.222,Nb:92.906,Mo:95.95,Ru:101.07,Rh:102.91,Pd:106.42,Ag:107.87,Cd:112.41,In:114.82,Sn:118.71,Sb:121.76,Te:127.60,I:126.90,Xe:131.29,Cs:132.91,Ba:137.33,La:138.91,Ce:140.12,Pr:140.91,Nd:144.24,Sm:150.36,Eu:151.96,Gd:157.25,Tb:158.93,Dy:162.50,Ho:164.93,Er:167.26,Tm:168.93,Yb:173.05,Lu:174.97,Hf:178.49,Ta:180.95,W:183.84,Re:186.21,Os:190.23,Ir:192.22,Pt:195.08,Au:196.97,Hg:200.59,Tl:204.38,Pb:207.2,Bi:208.98,Th:232.04,Pa:231.04,U:238.03 };
  function molarMass(f) {
    if (!f || /\)n$/.test(f)) return null;
    const atoms = E.parseF(f).atoms;
    if (!Object.keys(atoms).length || Object.keys(atoms).some(a => weights[a] == null)) return null;
    return Object.entries(atoms).reduce((m,[a,n]) => m + weights[a]*n,0);
  }
  const solution = id => E.getSub(id)?.ph === 'aq';
  const liquid = id => solution(id) || id === 'h2o';
  const stock = id => E.getSub(id)?.stock ?? (id === 'h2o2' ? .882 : id === 'caoh2' ? .02 : id === 'glucose' ? .5 : id === 'php' ? .001 : .1);
  function dose(id, amount, kind = 'mass', concentration = stock(id)) {
    const S = E.getSub(id); if (!S) throw new Error('Неизвестный реагент.');
    const units = Math.round(Number(amount) * 1000);
    if (!Number.isFinite(units) || units < 1 || units > (kind === 'volume' ? 100000 : 10000000)) throw new Error(kind === 'volume' ? 'Введите от 0,001 до 100 мл.' : 'Введите от 0,001 до 10 000 мг.');
    if (!['mass','volume'].includes(kind) || kind === 'volume' && !liquid(id)) throw new Error('Пипетка доступна для водных растворов и воды.');
    const M = molarMass(S.f);
    if (kind === 'mass' && !M && solution(id)) throw new Error('Молярная масса этого образца не определена; используйте объём.');
    const cUM = solution(id) ? Math.round(Number(concentration)*1e6) : null;
    if (solution(id) && (!Number.isFinite(cUM) || cUM < 1 || cUM > (S.maxC ?? 2)*1e6)) throw new Error(`Концентрация: от 0,000001 до ${S.maxC ?? 2} моль/л.`);
    const d = {kind,units,cUM};
    if (volumeUL(id,d) > 100000) throw new Error('Эта масса при заданной концентрации требует больше 100 мл раствора.');
    return d;
  }
  function moles(id,d) {
    const M = molarMass(E.getSub(id).f); if (!M) return null;
    if (d.kind === 'mass') return d.units/1e6/M;
    return id === 'h2o' ? d.units*.997/1000/M : d.cUM/1e6*d.units/1e6;
  }
  function volumeUL(id,d) {
    if (d.kind === 'volume') return d.units;
    return solution(id) ? moles(id,d)/(d.cUM/1e6)*1e6 : 0;
  }
  function total(id,lots = []) {
    const ns=lots.map(d=>moles(id,d)), M=molarMass(E.getSub(id).f);
    const n=ns.some(v=>v==null)?null:ns.reduce((a,b)=>a+b,0);
    return {n,mg:n==null?(lots.every(d=>d.kind==='mass')?lots.reduce((a,d)=>a+d.units/1000,0):null):n*M*1000,ml:lots.reduce((v,d)=>v+volumeUL(id,d),0)/1000};
  }
  function defaults(ids) {
    return Object.fromEntries(ids.map(id=>[id,[dose(id,liquid(id)?(E.getSub(id).ind?.05:E.getSub(id).redox?1:10):10,liquid(id)?'volume':'mass')]]));
  }
  const sameFormula = (a,b) => JSON.stringify(Object.entries(E.parseF(a).atoms).sort()) === JSON.stringify(Object.entries(E.parseF(b).atoms).sort());
  function calculate(ids,ledger,events) {
    const inputs=ids.map(id=>({id,...total(id,ledger[id])}));
    const core=ids.filter(id=>!E.getSub(id)?.ind);
    const active=events.filter(e=>e.kind==='rx');
    const unavailable=reason=>({inputs,reason,reaction:null});
    if(core.length>2 || active.length!==1) return unavailable('Для этой смеси ведётся точный учёт доз. Выход продуктов не рассчитан: требуется модель совместных реакций.');
    const e=active[0], eq=e.mol || (e.subs.length===1?e.subs[0].eq:null);
    if(!eq?.ok || eq.rev || e.subs.length!==1 || e.tags?.includes('complex') || eq.r.some(t=>t.f.includes('^'))) return unavailable('Количественный выход не рассчитан для равновесного, многостадийного или ионного сценария без полного молекулярного уравнения.');
    const reactants=[];
    for(const t of eq.r) {
      const matches=inputs.filter(v=>sameFormula(E.getSub(v.id).f,t.f));
      if(matches.length!==1 || matches[0].n==null) return unavailable('В уравнении есть реагент без заданного количества; выход не рассчитан.');
      reactants.push({...matches[0],c:t.c,f:t.f});
    }
    const extent=Math.min(...reactants.map(v=>v.n/v.c));
    const limiting=reactants.filter(v=>Math.abs(v.n/v.c-extent)<Math.max(1e-14,extent*1e-9)).map(v=>v.id);
    const remaining=Object.fromEntries(inputs.map(v=>[v.id,v.n]));
    reactants.forEach(v=>remaining[v.id]=Math.max(0,v.n-v.c*extent));
    const products=eq.p.map(t=>({f:t.f,ph:t.s,n:t.c*extent,mg:molarMass(t.f)==null?null:molarMass(t.f)*t.c*extent*1000}));
    return {inputs,reason:'Теоретический выход при полном протекании одной реакции. Растворимость, активность и кинетика не учитываются.',reaction:{extent,limiting,remaining,products,heatJ:eq.dH==null?null:eq.dH*extent*1000}};
  }
  function strongPH(ids,ledger,T=25) {
    if(T!==25 || ids.some(id=>!['hcl','hno3','naoh','koh','h2o'].includes(id) && !E.getSub(id)?.ind)) return null;
    if(!ids.some(id=>['hcl','hno3','naoh','koh','h2o'].includes(id)))return null;
    let balance=0,ml=0;
    for(const id of ids) {const t=total(id,ledger[id]);ml+=t.ml;if(['hcl','hno3'].includes(id))balance+=t.n;if(['naoh','koh'].includes(id))balance-=t.n;}
    if(ml<=0)return null;
    const excess=balance/(ml/1000), h=(Math.sqrt(excess*excess+4e-14)+Math.abs(excess))/2;
    return excess>=0?-Math.log10(h):14+Math.log10(h);
  }
  return {molarMass,dose,total,defaults,calculate,strongPH,stock,liquid,solution};
})();
if(typeof module!=='undefined')module.exports=ChemistryQuant;
