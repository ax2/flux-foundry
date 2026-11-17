import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const [name]=process.argv.slice(2),dir='test-results/';
assert.match(name,/^(?:independent-base|independent-src)$/);
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const baseline={seeds:[1763,2843,5167,7817,9157]};
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const source=name==='independent-src'?'../src/game':'./stage53-baseline-game';
const jobs=baseline.seeds.map((seed,i)=>{
 const stem='stage53-'+name+'-seed-'+i;
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
assert.equal(rows.length,120);
assert.ok(rows.every(r=>!r.unresolved));
writeFileSync(dir+'stage53-'+name+'-matrix.json',JSON.stringify({seeds:baseline.seeds,rows})+'\n');
console.log(JSON.stringify({name,naturallyConcluded:rows.length,peak:Math.max(...rows.map(r=>r.progress.maxNoHit))}));
