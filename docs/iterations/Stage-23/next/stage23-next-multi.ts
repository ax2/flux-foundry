import {Game,STEP} from '../src/game';import {steer} from '../scripts/paddle-policy';import {airStrength} from '../src/air';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const g=new Game(1018,18),shots=[],trace=[],events=[];let previousHits=0,previousCatches=0,previousEnergy=0;
while(g.phase==='aim'){
 g.selectBall('rubber','small');const target=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(!g.shots)g.angle=2.59;else g.aim(target.x,target.y);const angle=g.angle;assert.ok(g.fire());const ball=g.balls[0];let step=0;
 while(g.phase==='volley'&&step<600/STEP){
  if(step%24===0)steer(g,'steer');g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);
  if(g.shots===3&&(step%24===0||g.stats.hits!==previousHits||g.stats.paddleHits!==previousCatches||g.stats.energy!==previousEnergy)){
   const row={time:g.time,gap:g.progress.sinceHit,ball:{...ball},paddle:{...g.paddle},hits:g.stats.hits,catches:g.stats.paddleHits,energy:g.stats.energy,flow:g.air.map(z=>({strength:airStrength(z,ball),fx:z.fx,fy:z.fy,response:g.spec.windResponse,multiplier:g.windMultiplier})),targets:g.targets.map(t=>({id:t.id,hp:t.hp,x:t.x,y:t.y})),rails:structuredClone(g.rails)};
   if(step%24===0)trace.push(row);if(g.stats.hits!==previousHits||g.stats.paddleHits!==previousCatches||g.stats.energy!==previousEnergy)events.push(row);
  }
  previousHits=g.stats.hits;previousCatches=g.stats.paddleHits;previousEnergy=g.stats.energy;
 }
 assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);shots.push({angle,seconds:step*STEP,phase:g.phase,wholeBallBottom:ball.y-ball.r});
}
assert.equal(g.phase,'won');assert.equal(g.shots,3);assert.ok(Math.abs(g.progress.maxNoHit-17.608333333333)<1e-8);
await writeFile('test-results/stage23-next-multi.json',JSON.stringify({method:'Read-only exact multi-matrix remaining peak. Actual seed1018/index18, rubber small, nonmirror, first2.59 then legal switch/core/weakest, steer24 steps. Actual source v0.21, no state injection or early collection.',shots,progress:g.progress,stars:g.stars,trace,events},null,2));console.log(JSON.stringify({shots,stars:g.stars,gap:g.progress.maxNoHit,windSamples:trace.filter(r=>r.gap>5&&r.flow.some(z=>z.strength>.24)).length}));
