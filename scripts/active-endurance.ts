import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {LEVELS,MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
import {steer} from './paddle-policy';

const policies=['follow','steer'] as const,rows=[];
for(const policy of policies)for(let level=0;level<LEVELS.length;level++)for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const angle of [.55,Math.PI/2,2.59]){
 const g=new Game(1000+level,level);g.selectBall(material,size);g.angle=angle;g.fire();let firstLongIdle:unknown=null,step=0;
 while(g.phase==='volley'&&step<300/STEP){if(step%14===0)steer(g,policy);g.update(STEP);step++;if(g.progress.sinceHit>=60&&!firstLongIdle)firstLongIdle={step,progress:{...g.progress},ball:{...g.balls[0]},paddle:{...g.paddle},targets:g.targets.map(t=>({id:t.id,hp:t.hp,x:t.x,y:t.y})),air:g.air};}
 rows.push({policy,level:level+1,seed:1000+level,material,size,angle,seconds:step*STEP,phase:g.phase,hits:g.stats.hits,catches:g.stats.paddleHits,orbitBreaks:g.stats.orbitBreaks,...g.progress,firstLongIdle});
}
const summary={samples:rows.length,natural:rows.filter(r=>r.phase!=='volley').length,ongoingAt300:rows.filter(r=>r.phase==='volley').length,longIdle:rows.filter(r=>r.maxNoHit>=60).length,maxNoHit:Math.max(...rows.map(r=>r.maxNoHit)),stagnantAtEnd:rows.filter(r=>r.phase==='volley'&&r.sinceHit>=60).length};
await mkdir('test-results',{recursive:true});await writeFile('test-results/active-endurance.json',JSON.stringify({method:'26 levels ×12 loadouts ×3 angles ×2 paddle policies. Legal paddle targets every14 fixed steps. Observe300 simulation seconds, never delete or force collection. Flag any continuous60 seconds without valid durability loss, even if it later recovers. Full run parameters reproduce the controller.',summary,rows},null,2));console.log(JSON.stringify(summary));console.log(JSON.stringify(rows.filter(r=>r.maxNoHit>=60).slice(0,8)));

assert.equal(summary.longIdle,0,'A sampled active rally lost progress for60 simulation seconds; inspect saved case');
