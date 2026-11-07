import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
import {steer} from './paddle-policy';
const rows=[];
for(const level of [3,4,13,21,25])for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const policy of ['follow','steer'] as const){
 const g=new Game(1000+level,level),shots=[];
 while(g.phase==='aim'){
  g.selectBall(material,size);const target=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(target.x,target.y);g.fire();const b=g.balls[0];let step=0;const before={...g.stats};
  while(g.phase==='volley'&&step<300/STEP){if(step%14===0)steer(g,policy);g.update(STEP);step++;}
  if(g.phase!=='volley')assert.ok(b.y-b.r>=692);shots.push({seconds:step*STEP,hits:g.stats.hits-before.hits,catches:g.stats.paddleHits-before.paddleHits,phase:g.phase});if(g.phase==='volley')break;
 }
 rows.push({level:level+1,material,size,policy,result:g.phase,stars:g.stars,shots,progress:g.progress,stats:g.stats});
}
const summary={games:rows.length,wins:rows.filter(r=>r.result==='won').length,losses:rows.filter(r=>r.result==='over').length,unfinished:rows.filter(r=>r.result==='volley').length,shots:rows.reduce((n,r)=>n+r.shots.length,0),longIdle:rows.filter(r=>r.progress.maxNoHit>=60).length,maxNoHit:Math.max(...rows.map(r=>r.progress.maxNoHit))};
await mkdir('test-results',{recursive:true});await writeFile('test-results/full-endurance.json',JSON.stringify({method:'120 complete algorithmic games: levels4/5/14/22/26 ×12 loadouts ×2 legal paddle policies; aim at switch/core/weakest target per shot. Each original ball must naturally collect. A300 simulation second observation ceiling records unfinished, never ends a shot. Not a human win rate.',summary,rows},null,2));console.log(JSON.stringify(summary));assert.equal(summary.unfinished,0);assert.equal(summary.longIdle,0);
