import {readFileSync,writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const before=read('docs/iterations/Stage-31/evidence/stage31-matrix-outward.json');
const candidate=read(process.argv[2]||'test-results/stage32-matrix-production.json');
assert.equal(candidate.rows.length,before.rows.length);
assert.equal(candidate.summary.naturallyConcluded,before.rows.length);
const hits=r=>r.shots.reduce((n,s)=>n+s.hits,0);
const changed=candidate.rows.flatMap((row,i)=>{
 const old=before.rows[i];
 for(const key of ['seed','material','size','policy','wave','phase','unresolved'])assert.equal(row[key],old[key]);
 return JSON.stringify(row)===JSON.stringify(old)?[]:[{i,old,row}];
});
const brief=changed.map(({i,old,row})=>[i,row.seed,row.material,row.size,row.policy,old.progress.maxNoHit,row.progress.maxNoHit,hits(old),hits(row),row.shots[8]?.hits]);
console.log(JSON.stringify({summary:candidate.summary,identical:candidate.rows.length-changed.length,brief}));
if(process.argv[3]==='verify'){
 assert.equal(changed.length,1);
 const [{old,row}]=changed;
 assert.equal(row.seed,7429);assert.equal(row.material,'brass');assert.equal(row.size,'standard');assert.equal(row.policy,'steer');
 assert.equal(row.shots.length,old.shots.length);assert.ok(row.progress.maxNoHit<14.5);
 assert.ok(row.shots[8].hits>=old.shots[8].hits);assert.ok(hits(row)>=hits(old));
 writeFileSync('test-results/stage32-comparison.json',JSON.stringify({summary:candidate.summary,identical:359,changed},null,2)+'\n');
}
