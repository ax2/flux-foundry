import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
const read = path => JSON.parse(readFileSync(path,'utf8'));
const prefix = 'docs/iterations/Stage-28/evidence/';
const baseline = ['endless-audit-extended','stage28-extra-final','stage28-independent-candidate'].flatMap(name=>read(prefix+name+'.json').rows);
assert.equal(baseline.length,264);
const hits = row => row.shots.reduce((sum,shot)=>sum+shot.hits,0);
const gap = row => row.progress.maxNoHit;
const results = {};
for(const name of ['third-200','third-210','third-185','final','reach']){
 const path = 'test-results/stage29-matrix-'+name+'.json';
 if(!existsSync(path))continue;
 const {summary,rows} = read(path);
 assert.equal(rows.length,baseline.length);
 const differences=[];
 for(const [index,after] of rows.entries()){
  const before=baseline[index];
  for(const key of ['seed','material','size','policy']) assert.equal(after[key],before[key],index+' '+key);
  assert.equal(after.unresolved,false,index);
  if(JSON.stringify(before)===JSON.stringify(after))continue;
  differences.push({index,before,after,beforeHits:hits(before),afterHits:hits(after)});
 }
 results[name]={summary,differences};
 console.log(name,JSON.stringify({summary,changes:differences.map(({index,before,after,beforeHits,afterHits})=>({index,seed:after.seed,material:after.material,size:after.size,policy:after.policy,gap:[gap(before),gap(after)],wave:[before.wave,after.wave],shots:[before.shots.length,after.shots.length],hits:[beforeHits,afterHits]}))}));
}
writeFileSync('test-results/stage29-matrix-comparison.json',JSON.stringify(results,null,2));

