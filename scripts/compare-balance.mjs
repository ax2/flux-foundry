import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const pairs=[['active-endurance.json','Stage-17/active-after.json'],['varied-endurance.json','Stage-17/varied-after.json'],['endurance.json','Stage-17/endurance-after.json'],['sparse-endurance.json','Stage-17/sparse-after.json'],['multi-after.json','Stage-17/multi-after.json'],['full-endurance.json','Stage-17/full-after.json'],['endless-audit-extended.json','Stage-18/expedition-v016-rebuilt.json']];
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const continuation=await read('test-results/varied-residual-replay.json');
const gap=r=>r.maxNoHit??r.maxNoHitSeconds??r.progress?.maxNoHit,phase=r=>r.result??r.phase;
const checks=[];
for(const [current,baseline] of pairs){
 const before=await read(`docs/iterations/${baseline}`),after=await read(`test-results/${current}`);
 assert.equal(after.rows.length,before.rows.length);const changes=[];
 for(let i=0;i<after.rows.length;i++){
  const a=before.rows[i],b=after.rows[i],label=`${current}/${i}`;
  for(const key of ['level','seed','material','size','policy','mirror','cadence','angle'])assert.deepEqual(b[key],a[key],`${label}: input identity changed`);
  assert.ok(Number.isFinite(gap(a))&&Number.isFinite(gap(b)),`${label}: missing duration`);
  assert.notEqual(phase(b),'volley');if('natural' in b)assert.equal(b.natural,true);if('unresolved' in b)assert.equal(b.unresolved,false);
  if(phase(a)==='won'&&phase(b)!=='won'){
   // One explicitly reviewed first-ball tradeoff. It is not relabelled as a win:
   // a separate live replay must prove a natural continuation inside the same par.
   assert.equal(current,'varied-endurance.json',`${label}: lost an existing win`);assert.equal(i,2303);assert.equal(phase(b),'aim');
   for(const [key,value] of Object.entries(continuation.input))assert.equal(b[key],value);
   assert.equal(continuation.shots[0].seconds,b.seconds);assert.equal(continuation.shots[0].hits,b.hits);
   assert.equal(continuation.result,'won');assert.equal(continuation.stars,3);assert.ok(continuation.used<=3&&continuation.used<=continuation.par);assert.ok(continuation.gap<16);
  }
  if(phase(a)==='won'&&Array.isArray(a.shots)){assert.ok(b.shots.length<=a.shots.length,`${label}: full game used more balls`);if('stars' in a)assert.ok(b.stars>=a.stars);}
  if('wave' in a)assert.ok(b.wave>=a.wave,`${label}: expedition ended earlier`);
  if(JSON.stringify(a)!==JSON.stringify(b))changes.push({index:i,level:b.level,material:b.material,size:b.size,policy:b.policy,beforeGap:gap(a),afterGap:gap(b),beforePhase:phase(a),afterPhase:phase(b)});
 }
 const beforeMax=Math.max(...before.rows.map(gap)),afterMax=Math.max(...after.rows.map(gap));
 assert.ok(afterMax<=beforeMax+1e-8,`${current}: matrix peak worsened`);
 checks.push({matrix:current,baseline,rows:after.rows.length,beforeMax,afterMax,changed:changes.length,changes,summary:after.summary});
}
await writeFile('test-results/balance-comparison.json',JSON.stringify({method:'Intentional physical assistance change; same6336 inputs, natural termination, no worse matrix peaks, full-game winning balls/stars and expedition wave reach preserved. Individual route changes are listed, not required to be monotonic. One named first-ball win now needs three legal shots; its natural continuation is reproduced independently and must still earn three stars. Captured mobile tape has a separate two-ball/three-star gate. Original52 natural fixtures stay unchanged. Stage18 exact-parity check remains historical.',continuation,checks},null,2));
console.log(JSON.stringify(checks.map(({matrix,rows,changed,beforeMax,afterMax})=>({matrix,rows,changed,beforeMax,afterMax}))));
