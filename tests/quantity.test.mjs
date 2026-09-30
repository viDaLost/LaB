import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), Q=require('../src/quantity.js'), E=require('../src/engine.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<Math.max(1e-10,Math.abs(b)*1e-9), `${a} != ${b}`);

test('масса, объём, концентрация и молярные массы имеют согласованные единицы',()=>{
  near(Q.molarMass('H2O'),18.015);near(Q.molarMass('NaOH'),39.997);
  near(Q.molarMass('C16H8N2Na2O8S2'),466.346);
  near(Q.molarMass('CuSO4·5H2O'),249.677);
  assert.equal(Q.molarMass('(C6H10O5)n'),null);
  assert.equal(Q.molarMass('Tc'),null);
  const d=Q.dose('Zn',1.234);assert.equal(d.units,1234);near(Q.total('Zn',[d]).mg,1.234);
  const liquid=Q.dose('hcl',.1,'volume',.1);assert.equal(liquid.units,100);assert.equal(liquid.cUM,100000);
  near(Q.total('hcl',[liquid]).n,.00001);near(Q.total('hcl',[liquid]).mg,.36458);
  const mass=Q.dose('hcl',3.6458,'mass',.1);
  assert.equal(mass.units,3646);near(Q.total('hcl',[mass]).mg,3.646);
  assert.equal(Q.total('starch',[Q.dose('starch',1,'volume')]).mg,null);
});

test('противоположные способы дозирования согласуются; разные растворы суммируются',()=>{
  const a=Q.dose('naoh',3.9997,'mass',.1), b=Q.dose('naoh',1,'volume',.1);
  near(Q.total('naoh',[a]).ml,4/3.9997);
  near(Q.total('naoh',[b,Q.dose('naoh',.5,'volume',.2)]).n,.0002);
  near(Q.total('naoh',[b,Q.dose('naoh',.5,'volume',.2)]).ml,1.5);
});

test('отрицательные, бесконечные и невозможные дозы отклоняются',()=>{
  for(const v of [-1,0,NaN,Infinity,10001])assert.throws(()=>Q.dose('Zn',v));
  assert.throws(()=>Q.dose('Zn',1,'volume'));
  assert.throws(()=>Q.dose('indigo',1,'volume',1));
  assert.throws(()=>Q.dose('hcl',1000,'mass',.000001));
  assert.throws(()=>Q.dose('hcl',1,'volume',0));
});

test('нейтрализация считает лимит, избыток, продукты и теплоту для фактической дозы',()=>{
  const ids=['hcl','naoh'], doses={hcl:[Q.dose('hcl',1,'volume',.1)],naoh:[Q.dose('naoh',.5,'volume',.1)]};
  const q=Q.calculate(ids,doses,E.analyzeT(ids,25));
  assert.deepEqual(q.reaction.limiting,['naoh']);near(q.reaction.extent,.00005);
  near(q.reaction.remaining.hcl,.00005);near(q.reaction.remaining.naoh,0);
  near(q.reaction.products.find(p=>p.f==='NaCl').mg,2.922);
  near(q.reaction.heatJ,-2.79);near(Q.strongPH(ids,doses),-Math.log10(1/30));
});

test('металл расходуется только до исчерпания кислоты; осадок пропорционален дозе',()=>{
  const ids=['Zn','hcl'],d={Zn:[Q.dose('Zn',100)],hcl:[Q.dose('hcl',1,'volume',.1)]};
  const q=Q.calculate(ids,d,E.analyzeT(ids,25));assert.deepEqual(q.reaction.limiting,['hcl']);
  near(q.reaction.remaining.Zn*Q.molarMass('Zn')*1000,96.731);
  near(q.reaction.products.find(p=>p.f==='H2').n,.00005);
  const s=['agno3','nacl'],a={agno3:[Q.dose('agno3',1,'volume',.1)],nacl:[Q.dose('nacl',.25,'volume',.1)]};
  near(Q.calculate(s,a,E.analyzeT(s,25)).reaction.products.find(p=>p.f==='AgCl').mg,3.583);
});

test('катализатор не расходуется, равновесия и совместные реакции не получают ложного выхода',()=>{
  const ids=['h2o2','mno2'],d=Q.defaults(ids),q=Q.calculate(ids,d,E.analyzeT(ids,25));
  near(q.reaction.remaining.mno2,Q.total('mno2',d.mno2).n);
  for(const ids of [['glucose','naoh','indigo'],['cuso4','nh3'],['hcl','naoh','cuso4']])
    assert.equal(Q.calculate(ids,Q.defaults(ids),E.analyzeT(ids,25)).reaction,null);
  assert.equal(Q.strongPH(['ch3cooh'],Q.defaults(['ch3cooh'])),null);
  assert.equal(Q.strongPH(['hcl'],Q.defaults(['hcl']),30),null);
  near(Q.strongPH(['hcl','naoh'],Q.defaults(['hcl','naoh'])),7);
});

test('все вещества имеют дозу; новые красители описывают цикл без выдуманного уравнения',()=>{
  for(const id of [...E.REAGENTS.map(r=>r.id),...E.ELS.map(e=>e.sym)])assert.ok(Q.defaults([id])[id]);
  for(const id of ['indigo','methylene']){
    const e=E.analyzeT([id,'glucose','naoh'],25)[0];assert.equal(e.redox,id);
    assert.equal(e.subs.length,0);assert.ok(e.fx.solSeq.length>1);
  }
  assert.ok(E.analyzeT(['na2s2o3','hcl'],25)[0].subs[0].eq.ok);
  assert.equal(E.analyzeT(['oxalic','Mg'],25)[0].kind,'unknown');
});
