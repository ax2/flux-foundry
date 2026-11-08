import {Game,STEP} from '../src/game';
import {LEVELS,MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
import {steer} from './paddle-policy';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const rows=[];
// New seeds, mirrored layouts and slower touch updates expand rather than repeat the Stage-10 matrix.
for(const seed of [8137,9049])for(let level=0;level<LEVELS.length;level++)for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const mirror of [false,true])for(const cadence of [18,36]){
 const g=new Game(seed+level,level);if(mirror)g.mirror();g.selectBall(material,size);
 const angle=.2+((seed+level*53+material.length*11+size.length*7)%1000)/1000*(Math.PI-.4);g.angle=angle;g.fire();const ball=g.balls[0];let step=0,firstIdle=null;
 while(g.phase==='volley'&&step<600/STEP){if(step%cadence===0)steer(g,'steer');g.update(STEP);step++;if(!firstIdle&&g.progress.sinceHit>=60)firstIdle={step,ball:{...ball},paddle:{...g.paddle},progress:{...g.progress},targets:g.targets.map(t=>({id:t.id,hp:t.hp,x:t.x,y:t.y})),air:g.air};}
 if(g.phase!=='volley')assert.ok(ball.y-ball.r>=692,'Only natural collection ends the ball');
 rows.push({seed,level:level+1,material,size,mirror,cadence,angle,phase:g.phase,seconds:step*STEP,hits:g.stats.hits,catches:g.stats.paddleHits,orbitBreaks:g.stats.orbitBreaks,...g.progress,firstIdle});
}
const summary={samples:rows.length,natural:rows.filter(r=>r.phase!=='volley').length,unfinished:rows.filter(r=>r.phase==='volley').length,longIdle:rows.filter(r=>r.firstIdle).length,over20:rows.filter(r=>r.maxNoHit>=20).length,over30:rows.filter(r=>r.maxNoHit>=30).length,maxNoHit:Math.max(...rows.map(r=>r.maxNoHit)),maxBallSeconds:Math.max(...rows.map(r=>r.seconds))};
await mkdir('test-results',{recursive:true});await writeFile('test-results/varied-endurance.json',JSON.stringify({method:'Seeds8137/9049 ×26 levels ×12 loadouts ×mirror ×150/300ms legal paddle inputs, seeded oblique angles,600 simulation seconds per ball. No recall/speed/state injection;60s without durability loss flagged even if later recovered. Algorithm, not human win rate.',summary,rows},null,2));console.log(JSON.stringify(summary));console.log(JSON.stringify(rows.filter(r=>r.firstIdle).slice(0,4)));assert.equal(summary.longIdle,0);assert.equal(summary.unfinished,0);

assert.equal(summary.over20,0,'A varied first-ball no-hit interval reached20s; inspect seed/cadence/angle');
