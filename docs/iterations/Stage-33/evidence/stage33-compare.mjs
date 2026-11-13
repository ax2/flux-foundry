import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const read=p=>JSON.parse(readFileSync(p,'utf8'));
const before=read('docs/iterations/Stage-32/evidence/stage32-matrix-production.json');
const after=read('test-results/stage33-matrix-second10.json');
const hits=r=>r.shots.reduce((n,s)=>n+s.hits,0);
assert.equal(after.rows.length,before.rows.length);
const changes=after.rows.flatMap((row,i)=>{
 const old=before.rows[i];
 for(const key of ['seed','material','size','policy'])assert.equal(row[key],old[key]);
 if(JSON.stringify(row)===JSON.stringify(old))return [];
 return [[i,row.seed,row.material,row.size,row.policy,old.progress.maxNoHit,row.progress.maxNoHit,hits(old),hits(row),old.wave,row.wave,old.shots.length,row.shots.length]];
});
console.log(JSON.stringify({summary:after.summary,changes}));
