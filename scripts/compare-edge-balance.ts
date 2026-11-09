import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';import {LEVELS} from '../src/content';
const names=['active-endurance.json','varied-endurance.json','endurance.json','sparse-endurance.json','multi-after.json','full-endurance.json','endless-audit-extended.json'];
const read=async(path:string)=>JSON.parse(await readFile(path,'utf8')),certificates=await read('tests/fixtures/edge-continuations.json'),certs=new Map<string,any>(certificates.routes.map((r:any)=>[r.matrix+'/'+r.index,r])),used=new Set<string>(),checks=[];
const gap=(r:any)=>r.maxNoHit??r.maxNoHitSeconds??r.progress?.maxNoHit,phase=(r:any)=>r.result??r.phase??(r.natural?'natural':'volley');
const stars=(r:any)=>r.shots.length<=LEVELS[r.level-1].par?3:r.shots.length<=LEVELS[r.level-1].par+2?2:1;
for(const name of names){const before=await read(`docs/iterations/Stage-21/final/${name}`),after=await read(`test-results/${name}`),changes=[];assert.equal(after.rows.length,before.rows.length);
 for(let i=0;i<before.rows.length;i++){
  const a=before.rows[i],b=after.rows[i],key=name+'/'+i;
  for(const field of ['level','seed','material','size','policy','mirror','cadence','angle'])assert.deepEqual(b[field],a[field],key+': input changed');
  assert.ok(Number.isFinite(gap(a))&&Number.isFinite(gap(b)));assert.notEqual(phase(b),'volley',key+': unfinished ball');if('natural' in b)assert.equal(b.natural,true);if('unresolved' in b)assert.equal(b.unresolved,false);
  const expeditionTradeoff=name==='endless-audit-extended.json'&&b.seed===2217&&((i===51&&b.material==='steel'&&b.size==='standard'&&b.policy==='steer'&&gap(b)<15)||(i===54&&b.material==='brass'&&b.size==='small'&&b.policy==='follow'&&gap(b)<18));
  assert.ok(gap(b)<=gap(a)+1e-8||expeditionTradeoff,key+': unreviewed no-hit increase');
  if(phase(a)==='won'&&phase(b)!=='won'){
   assert.ok(name==='active-endurance.json'||name==='varied-endurance.json');const c=certs.get(key);assert.ok(c,key+': missing honest continuation');
   const seed=name==='varied-endurance.json'?b.seed+b.level-1:b.seed;assert.equal(c.actualSeed,seed);for(const field of ['level','material','size','angle'])assert.equal(c[field],b[field]);assert.equal(c.mirror,!!b.mirror);assert.equal(c.policy,b.policy||'steer');assert.equal(c.cadence,b.cadence||14);assert.equal(c.stars,3);assert.ok(c.used<=LEVELS[b.level-1].par);used.add(key);
  }
  if(phase(a)==='won'&&Array.isArray(a.shots)){
   assert.equal(phase(b),'won',key+': lost a whole-game win');assert.ok(stars(b)>=stars(a),key+': whole-game star loss');
   const extraSparse=name==='sparse-endurance.json'&&i===148&&b.level===13&&b.material==='steel'&&b.size==='small'&&b.mirror===true&&b.cadence===16&&b.shots.length<=4;
   assert.ok(b.shots.length<=a.shots.length||extraSparse,key+': unreviewed extra balls');
  }
  if('wave' in a)assert.ok(b.wave>=a.wave,key+': lost expedition reach');
  if(JSON.stringify(a)!==JSON.stringify(b))changes.push({index:i,level:b.level,seed:b.seed,material:b.material,size:b.size,policy:b.policy,mirror:b.mirror,cadence:b.cadence,beforeGap:gap(a),afterGap:gap(b),beforePhase:phase(a),afterPhase:phase(b),beforeShots:a.shots?.length,afterShots:b.shots?.length,continuation:certs.get(key)});
 }
 const beforeMax=Math.max(...before.rows.map(gap)),afterMax=Math.max(...after.rows.map(gap));assert.ok(afterMax<=beforeMax+1e-8||(name==='endless-audit-extended.json'&&afterMax<17.5));
 if(name==='full-endurance.json'){assert.deepEqual(after.rows,before.rows);assert.deepEqual(after.summary,before.summary);}
 checks.push({matrix:name,rows:after.rows.length,beforeMax,afterMax,changed:changes.length,summary:after.summary,changes});
}
assert.equal(used.size,certs.size,'Every continuation fixture must correspond to an actual changed first win');assert.equal(used.size,8);
const edge=await read('test-results/edge-route.json');assert.deepEqual(edge.rows.map((r:any)=>r.cadence),[18,36]);for(const r of edge.rows){assert.equal(r.result,'won');assert.equal(r.stars,3);assert.ok(r.maxNoHit<12);assert.ok(r.used<=(r.cadence===18?2:3));}
const hashes:Record<string,string>={'src/assets/arena.png':'1ad2a8e14e4029eb64fdc29ad1f113985db8abac50e4f375f4bea45413735f54','src/assets/targets.png':'3d755f3ba04ba8a8620bd4c7bf5c0a809958df0d4e33c1cf3ec0b5f2e2fab44a','src/content.ts':'1f100698c964fd31e27a61504c3c9b6608fcdf99f4bef47753d4194b96d78cac','tests/fixtures/challenges.json':'f9e357c929297566cd960a60a793e62c8d6f95c69d38da06e0fac6e7406326cb','tests/fixtures/challenges-mirrored.json':'939e5935639452f1702432f4b4ee23f1a8823ddedd80d2744e1554c191fe0058'};
for(const [path,hash] of Object.entries(hashes)){const raw=await readFile(path),content=path.endsWith('.png')?raw:raw.toString('utf8').replaceAll('\r\n','\n');assert.equal(createHash('sha256').update(content).digest('hex'),hash,'Original art, content or52 fixtures changed');}
await writeFile('test-results/edge-balance-comparison.json',JSON.stringify({method:'Stage23 vs published Stage21/v0.20.0: same6336 inputs, natural collection, all whole-game wins and stars retained; full120 rows identical. Eight changed first-ball wins are explicitly aim/over plus separately tested legal three-star continuations, never labelled preserved one-ball wins. Only reviewed tradeoffs: sparse row148 one extra ball with same stars, expedition2217 rows51/54 bounded below15/18s with no lower wave. All other individual no-hit peaks must not increase. The original52 fixtures are unchanged and tested separately.',edge,checks},null,2));console.log(JSON.stringify(checks.map(({matrix,rows,beforeMax,afterMax,changed})=>({matrix,rows,beforeMax,afterMax,changed}))));
