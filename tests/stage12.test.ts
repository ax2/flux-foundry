import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
for(const [seed,level,material,angle] of [[8137,6,'brass',1.7517414419318227],[8137,12,'steel',2.623567905773377]] as const)test(`mirrored low-target rally ${level+1}/${material} avoids the reproduced long gap`,()=>{
 const g=new Game(seed+level,level);g.mirror();g.selectBall(material,'standard');g.angle=angle;g.fire();const ball=g.balls[0];let step=0;
 while(g.phase==='volley'&&step<300/STEP){if(step%18===0)steer(g,'steer');g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
 assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);assert.ok(g.progress.maxNoHit<30,`No-hit gap ${g.progress.maxNoHit}`);assert.ok(g.stats.hits>0);
});
