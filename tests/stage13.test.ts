import {test} from 'node:test';import assert from 'node:assert/strict';import {Game,STEP} from '../src/game';import {steer} from '../scripts/paddle-policy';
for(const [level,material,size,mirror,cadence] of [[6,'brass','large',false,12],[12,'steel','large',true,16],[21,'ceramic','large',true,16]] as const)test(`low or moving final-block case ${level+1}/${material} keeps progressing`,()=>{
 const g=new Game(1000+level,level);if(mirror)g.mirror();let sparseGap=0;
 while(g.phase==='aim'){
  g.selectBall(material,size);const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(g.shots===0)g.angle=2.59;else g.aim(t.x,t.y);assert.ok(g.fire());const ball=g.balls[0];let step=0;
  while(g.phase==='volley'&&step<600/STEP){if(step%cadence===0)steer(g,'steer');g.update(STEP);step++;if(g.targets.length<=2)sparseGap=Math.max(sparseGap,g.progress.sinceHit);if(g.phase==='volley')assert.equal(g.balls[0],ball);}
  assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);
 }
 assert.equal(g.phase,'won');assert.ok(sparseGap<20,`Sparse no-hit gap ${sparseGap}`);assert.ok(g.stats.paddleHits>0);
});
