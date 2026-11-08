import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {steer} from './paddle-policy';

// Fixed first-ball sample whose changed route now leaves a live core. Keep the
// original input, then play the actual remainder instead of treating aim as a win.
export const residualInput={level:22,seed:9049,material:'rubber',size:'large',mirror:true,cadence:36,angle:.9210388678941157} as const;
export function runVariedResidual(){
 const r=residualInput,g=new Game(r.seed+r.level-1,r.level-1);g.mirror();
 const shots=[];
 while(g.phase==='aim'){
  g.selectBall(r.material,r.size);const target=g.targets.find(t=>t.core)||g.targets[0];
  if(!g.shots)g.angle=r.angle;else g.aim(target.x,target.y);
  assert.ok(g.fire());const ball=g.balls[0],before={...g.stats};let step=0;
  while(g.phase==='volley'&&step<600/STEP){
   if(step%r.cadence===0)steer(g,'steer');g.update(STEP);step++;
   if(g.phase==='volley')assert.equal(g.balls[0],ball);
  }
  assert.notEqual(g.phase,'volley','Observation limit is a failure, never a collection');
  assert.ok(ball.y-ball.r>=692);
  shots.push({phase:g.phase,seconds:step*STEP,hits:g.stats.hits-before.hits,remaining:g.targets.map(t=>({id:t.id,hp:t.hp}))});
 }
 return {input:r,shots,result:g.phase,stars:g.stars,used:g.shots,par:g.level.par,gap:g.progress.maxNoHit};
}
