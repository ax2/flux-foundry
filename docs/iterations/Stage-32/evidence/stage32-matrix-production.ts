import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
import {steer} from '../scripts/paddle-policy';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const rows=[],checkpoints=[];
for(const seed of [42,739,2217,223,2026,4039,9011,137,815,1229,1907,421,934,2931,7429])for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const policy of ['follow','steer'] as const){
 const g=new Game(seed),shots=[];let unresolved=false;
 while(g.phase==='aim'){
  g.selectBall(material,size);const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);g.fire();let step=0;const before=g.stats.hits,b=g.balls[0];
  while(g.phase==='volley'&&step<900/STEP){
   if(step%14===0)steer(g,policy);g.update(STEP);step++;
   if(step===300/STEP)checkpoints.push({seed,material,size,policy,wave:g.wave,shot:g.shots,hitsDuringShot:g.stats.hits-before,progress:{...g.progress},remainingHP:g.targets.reduce((n,t)=>n+t.hp,0)});
  }
  shots.push({seconds:step*STEP,hits:g.stats.hits-before});if(g.phase==='volley'){unresolved=true;break;}assert.ok(b.y-b.r>=692);
 }
 rows.push({seed,material,size,policy,phase:g.phase,wave:g.wave,shots,unresolved,progress:g.progress});
}
const summary={games:rows.length,naturallyConcluded:rows.filter(r=>!r.unresolved).length,unresolved:rows.filter(r=>r.unresolved).length,longIdle:rows.filter(r=>r.progress.maxNoHit>=60).length,maxNoHit:Math.max(...rows.map(r=>r.progress.maxNoHit)),checkpointsAt300:checkpoints.length,maxBallSeconds:Math.max(...rows.flatMap(r=>r.shots.map(s=>s.seconds)))};
await writeFile('test-results/stage32-matrix-production.json',JSON.stringify({method:'360 complete expedition runs, 15 seeds ×12 loadouts ×2 legal paddle policies. Keep300-second checkpoints and continue productive shots up to900 simulation seconds, without ending the ball. A no-hit interval>=60 is flagged separately.',summary,checkpoints,rows},null,2));console.log(JSON.stringify(summary));assert.equal(summary.longIdle,0);
