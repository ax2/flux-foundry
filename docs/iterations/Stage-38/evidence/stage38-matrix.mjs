import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const [name]=process.argv.slice(2),dir='test-results/';
assert.match(name,/^(?:(?:(?:second|third)\d+(?:-gap)?|production))$/);
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const baseline=read('test-results/stage37-production-matrix.json');
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const source=name==='production'?'../src/game':'./stage38-game-'+name;
const jobs=baseline.seeds.map((seed,i)=>{
 const stem='stage38-'+name+'-seed-'+i;
 const runner=audit.replace('../src/game',source).replace(/of \[42,[^\]]+\]/,'of ['+seed+']').replace('stage32-matrix-production.json',stem+'.json');
 writeFileSync(dir+stem+'.ts',runner);
 return stem;
});
let cursor=0;
await Promise.all(Array.from({length:8},async()=>{
 while(cursor<jobs.length){
  const i=cursor++,stem=jobs[i];
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['--import','tsx',dir+stem+'.ts'],{stdio:['ignore','ignore','inherit']});
   child.on('error',reject);
   child.on('close',code=>code===0?resolve():reject(Error(stem+' failed with '+code)));
  });
  console.log('Finished seed '+baseline.seeds[i]);
 }
}));
const rows=jobs.flatMap(stem=>read(dir+stem+'.json').rows);
assert.equal(rows.length,baseline.rows.length);
const changes=rows.flatMap((row,i)=>{
 const old=baseline.rows[i];
 for(const k of ['seed','material','size','policy'])assert.equal(row[k],old[k]);
 return JSON.stringify(row)===JSON.stringify(old)?[]:[{index:i,before:old,after:row}];
});
const hits=row=>row.shots.reduce((n,s)=>n+s.hits,0);
const result={naturallyConcluded:rows.filter(r=>!r.unresolved).length,identical:rows.length-changes.length,peak:Math.max(...rows.map(r=>r.progress.maxNoHit)),changes};
writeFileSync(dir+'stage38-'+name+'-comparison.json',JSON.stringify(result,null,2)+'\n');
writeFileSync(dir+'stage38-'+name+'-matrix.json',JSON.stringify({seeds:baseline.seeds,rows},null,2)+'\n');
console.log(JSON.stringify({...result,changes:changes.map(({index,before,after})=>[index,after.seed,after.material,after.size,after.policy,before.progress.maxNoHit,after.progress.maxNoHit,hits(before),hits(after),before.wave,after.wave])}));
