import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const read=path=>JSON.parse(readFileSync(path,'utf8'));
const baseline=[
 ...read('docs/iterations/Stage-30/evidence/stage30-production.json').rows,
 ...read('docs/iterations/Stage-30/evidence/review/stage30-review-candidate.json').rows,
];
const actual=read('test-results/stage31-matrix-outward.json');
assert.equal(baseline.length,360);
assert.equal(actual.rows.length,baseline.length);
assert.equal(actual.summary.naturallyConcluded,360);
const changed=[];
for(const [index,row] of actual.rows.entries()){
 const old=baseline[index];
 if(index!==26){assert.deepEqual(row,old,'Protected expedition row '+index);continue;}
 for(const key of ['seed','material','size','policy','phase','wave','unresolved'])assert.equal(row[key],old[key],key);
 assert.equal(row.shots.length,old.shots.length);
 const hitCount=r=>r.shots.reduce((sum,shot)=>sum+shot.hits,0);
 assert.ok(row.progress.maxNoHit<12&&row.progress.maxNoHit<old.progress.maxNoHit);
 assert.ok(row.shots[8].hits>=old.shots[8].hits);
 assert.ok(hitCount(row)>=hitCount(old));
 changed.push({index,old,row});
}
const result={summary:actual.summary,identical:359,changed};
writeFileSync('test-results/stage31-final-comparison.json',JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({summary:result.summary,identical:result.identical,changed:changed.map(v=>v.index)}));
