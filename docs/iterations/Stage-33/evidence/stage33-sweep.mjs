import {readFileSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const names=JSON.parse(readFileSync('test-results/stage33-variants.json','utf8'));
const out=[];
for(const n of names){
 const child=spawnSync(process.execPath,['--import','tsx','test-results/stage33-one-'+n+'.ts'],{stdio:'pipe',encoding:'utf8'});
 if(child.status!==0)throw Error(n+' '+child.stderr);
 const row=JSON.parse(readFileSync('test-results/stage33-one-'+n+'.json','utf8')).rows[0];
 const value={n,gap:row.progress.maxNoHit,shot11:row.shots[10],wave:row.wave,hits:row.shots.reduce((a,b)=>a+b.hits,0),seconds:row.shots.reduce((a,b)=>a+b.seconds,0)};
 out.push(value);console.log(JSON.stringify(value));
}
writeFileSync('test-results/stage33-sweep.json',JSON.stringify(out,null,2)+'\n');
