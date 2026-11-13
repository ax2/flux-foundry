import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const seeds=read('test-results/stage34-combined-seeds.json');
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const jobs=seeds.map((seed,index)=>{
 const name='stage34-production-shard-'+index,path='test-results/'+name;
 const runner=audit.replace(/of \[42,[^\]]+\]/,'of ['+seed+']').replace('stage32-matrix-production.json',name+'.json');
 writeFileSync(path+'.ts',runner);
 return path;
});
let next=0;
await Promise.all(Array.from({length:8},async()=>{
 while(next<jobs.length){
  const i=next++,f=jobs[i];
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['--import','tsx',f+'.ts'],{stdio:'ignore'});
   child.on('error',reject);
   child.on('close',code=>code===0?resolve():reject(Error(f+' failed with code '+code)));
  });
  console.log('Finished seed '+seeds[i]);
 }
}));
const shards=jobs.map(p=>read(p+'.json'));
const matrix=shards.flatMap(s=>s.rows);
const baseline=[...read('docs/iterations/Stage-33/evidence/stage33-matrix-production.json').rows,...read('docs/iterations/Stage-33/evidence/stage33-independent-production.json').rows];
assert.equal(matrix.length,456);
assert.equal(matrix.length,baseline.length);
const changes=matrix.flatMap((row,i)=>{
 const before=baseline[i];
 for(const k of ['seed','material','size','policy'])assert.equal(row[k],before[k]);
 return JSON.stringify(row)===JSON.stringify(before)?[]:[{index:i,before,after:row}];
});
const hits=row=>row.shots.reduce((n,s)=>n+s.hits,0);
const result={naturallyConcluded:matrix.filter(r=>!r.unresolved).length,identical:matrix.length-changes.length,peak:Math.max(...matrix.map(r=>r.progress.maxNoHit)),changes};
writeFileSync('test-results/stage34-production-matrix.json',JSON.stringify({seeds,rows:matrix},null,2)+'\n');
writeFileSync('test-results/stage34-production-comparison.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({naturallyConcluded:result.naturallyConcluded,identical:result.identical,peak:result.peak,changes:changes.map(({index,before,after})=>[index,after.seed,after.material,after.size,after.policy,before.progress.maxNoHit,after.progress.maxNoHit,hits(before),hits(after)])}));
