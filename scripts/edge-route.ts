import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';

// Whole legal continuation of the varied matrix's group8137/level12 case.
export function runEdgeRoute(cadence:18|36){
 const g=new Game(8148,11),shots=[];
 while(g.phase==='aim'){
  assert.ok(g.selectBall('steel','standard'));
  if(g.shots===0)g.angle=2.478263495133118;
  else{const t=g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);}
  assert.ok(g.fire());const ball=g.balls[0];let steps=0;
  while(g.phase==='volley'&&steps<600/STEP){if(steps%cadence===0)steer(g,'steer');g.update(STEP);steps++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
  assert.notEqual(g.phase,'volley','Observation failed; never force collection or continue an unfinished ball');
  assert.ok(ball.y-ball.r>=692);shots.push({phase:g.phase,seconds:steps*STEP,hits:g.stats.hits,catches:g.stats.paddleHits,maxNoHit:g.progress.maxNoHit});
 }
 return {actualSeed:8148,level:12,material:'steel',size:'standard',angle:2.478263495133118,cadence,result:g.phase,used:g.shots,par:g.level.par,stars:g.stars,maxNoHit:g.progress.maxNoHit,shots};
}
