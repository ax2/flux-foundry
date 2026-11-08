import assert from 'node:assert/strict';import {Game,STEP,LAUNCH} from '../src/game';import {steer} from './paddle-policy';
export function runTouchCase(tape:any[]){
 const launch=tape.find(e=>e.phase==='volley'&&e.shot===1&&e.ball);assert.equal(launch.flight,0);assert.equal(launch.ball.x,LAUNCH.x);assert.equal(launch.ball.y,LAUNCH.y);
 const g=new Game(1021,21);g.selectBall('rubber','large');g.angle=Math.atan2(launch.ball.vy,launch.ball.vx);assert.ok(g.angle>=.16&&g.angle<=Math.PI-.16);assert.ok(g.fire());assert.deepEqual(g.balls[0],launch.ball);
 const moves=tape.filter(e=>e.phase==='volley'&&e.shot===1);let index=0,step=0;const ball=g.balls[0];
 while(g.phase==='volley'&&step<300/STEP){while(index<moves.length&&moves[index].flight<=g.stats.flight+STEP/10){g.movePaddle(moves[index].target);index++;}g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
 assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);const first={phase:g.phase,shots:g.shots,stats:{...g.stats},progress:{...g.progress},remaining:structuredClone(g.targets)};
 while(g.phase==='aim'){
  const target=g.targets.find(t=>t.core)||g.targets[0];g.selectBall('rubber','large');g.aim(target.x,target.y);assert.ok(g.fire());const b=g.balls[0];let n=0;
  while(g.phase==='volley'&&n<300/STEP){if(n%14===0)steer(g,'follow');g.update(STEP);n++;if(g.phase==='volley')assert.equal(g.balls[0],b);}
  assert.notEqual(g.phase,'volley');assert.ok(b.y-b.r>=692);
 }
 return {method:'First ball uses the unchanged captured legal UI target/time tape. Any remaining shot aims at the actual remaining core and follows every14 steps; never restores states or ends an observed volley. First-ball outcome and continuation are reported separately.',first,final:{phase:g.phase,shots:g.shots,stars:g.stars,stats:{...g.stats},progress:{...g.progress}}};
}
