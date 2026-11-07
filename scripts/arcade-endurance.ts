import {writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {LEVELS,MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
const rows=[];
for(let level=0;level<LEVELS.length;level++)for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const angle of [.55,Math.PI/2,2.59]){
 const g=new Game(800+level,level);g.selectBall(material,size);g.angle=angle;g.fire();const b=g.balls[0];let steps=0,lastHit=0,lastCount=0,maxGap=0;
 while(g.phase==='volley'&&steps<600/STEP){g.update(STEP);steps++;assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));if(g.stats.hits>lastCount){lastHit=steps;lastCount=g.stats.hits;}maxGap=Math.max(maxGap,(steps-lastHit)*STEP);}
 const natural=g.phase!=='volley';if(natural)assert.ok(b.y-b.r>=692);const idle=(steps-lastHit)*STEP;
 rows.push({level:level+1,material,size,angle,seconds:steps*STEP,hits:g.stats.hits,catches:g.stats.paddleHits,orbitBreaks:g.stats.orbitBreaks,natural,idleSeconds:idle,maxNoHitSeconds:maxGap});
}
const summary={samples:rows.length,naturallyEnded:rows.filter(r=>r.natural).length,ongoingAt600:rows.filter(r=>!r.natural).length,stagnantAt600:rows.filter(r=>!r.natural&&r.idleSeconds>60).length,orbitBreaks:rows.reduce((n,r)=>n+r.orbitBreaks,0),maxNoHitSeconds:Math.max(...rows.map(r=>r.maxNoHitSeconds))};
await mkdir('test-results',{recursive:true});await writeFile('test-results/endurance.json',JSON.stringify({method:'26 challenges ×12 loadouts ×3 angles, stationary centre paddle, no recall or moving away. Observe up to600 simulated seconds. Ongoing productive play is allowed; final60 seconds without any durability loss is flagged for investigation, not a game timeout.',summary,rows},null,2)+'\n');console.log(JSON.stringify(summary));assert.equal(summary.stagnantAt600,0);
