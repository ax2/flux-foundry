import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const pairs=['active-endurance.json','varied-endurance.json','endurance.json','sparse-endurance.json','multi-after.json','full-endurance.json','endless-audit-extended.json'].map(name=>[name,`Stage-19/final/${name}`]);
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
  assert.ok(gap(b)<=gap(a)+1e-8,`${label}: individual no-hit peak worsened`);
  assert.notEqual(phase(b),'volley');if('natural' in b)assert.equal(b.natural,true);if('unresolved' in b)assert.equal(b.unresolved,false);
  if(phase(a)==='won')assert.equal(phase(b),'won',`${label}: lost an existing win`);
  if(phase(a)==='won'&&Array.isArray(a.shots)){assert.ok(b.shots.length<=a.shots.length,`${label}: full game used more balls`);if('stars' in a)assert.ok(b.stars>=a.stars);}
  if('wave' in a)assert.ok(b.wave>=a.wave,`${label}: expedition ended earlier`);
  if(JSON.stringify(a)!==JSON.stringify(b))changes.push({index:i,level:b.level,material:b.material,size:b.size,policy:b.policy,beforeGap:gap(a),afterGap:gap(b),beforePhase:phase(a),afterPhase:phase(b),beforeShots:Array.isArray(a.shots)?a.shots.length:undefined,afterShots:Array.isArray(b.shots)?b.shots.length:undefined,beforeStars:a.stars,afterStars:b.stars});
 }
 const beforeMax=Math.max(...before.rows.map(gap)),afterMax=Math.max(...after.rows.map(gap));
 assert.ok(afterMax<=beforeMax+1e-8,`${current}: matrix peak worsened`);
 checks.push({matrix:current,baseline,rows:after.rows.length,beforeMax,afterMax,changed:changes.length,changes,summary:after.summary});
}
assert.equal(continuation.result,'won');assert.equal(continuation.stars,3);assert.ok(continuation.used<=3&&continuation.used<=continuation.par);assert.ok(continuation.gap<16);
await writeFile('test-results/balance-comparison.json',JSON.stringify({method:'Stage20 versus published v0.18.0 Stage19 final data. Same6336 inputs, natural termination, no worse individual or matrix no-hit peaks, every existing first-ball/full-game win preserved, no greater winning full-game ball counts or lower stars, and no lower expedition wave reach. This is evidence for these fixed inputs, not all possible play. Stage19 captured touch/varied continuations remain independent gates. One of52 natural fixtures improved from two balls to one at the same first angle; it was re-timed only at actual collection; the original is archived. Earlier exact-parity reports remain historical.',continuation,checks},null,2));
console.log(JSON.stringify(checks.map(({matrix,rows,changed,beforeMax,afterMax})=>({matrix,rows,changed,beforeMax,afterMax}))));
