import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game as Published,STEP} from './stage30-release-game';
import {Game as Candidate} from '../src/game';
import {steer} from '../scripts/paddle-policy';
const results=[];
for(const [version,Engine] of [['v0.24.0',Published],['candidate',Candidate]] as const){
 const game=new Engine(2026),shots=[],catches=[];
 while(game.phase==='aim'){
  assert.ok(game.selectBall('brass','standard'));
  const target=game.targets.slice().sort((a,b)=>a.hp-b.hp)[0];
  game.aim(target.x,target.y);assert.ok(game.fire());
  const ball=game.balls[0],beforeShot=game.stats.hits;
  let steps=0,gap=0,lastCatch;
  while(game.phase==='volley'&&steps<900/STEP){
   if(steps%14===0)steer(game,'follow');
   const hits=game.stats.hits, caught=game.stats.paddleHits;
   const inTargetWindow=game.shots===2&&game.time>=57.08&&game.time<=73.09;
   const incoming=inTargetWindow?{x:ball.x,vx:ball.vx,vy:ball.vy}:undefined;
   const face=game.paddle.tilt??0;
   gap=Math.max(gap,game.progress.sinceHit+STEP);
   game.update(STEP);steps++;
   if(game.phase==='volley')assert.equal(game.balls[0],ball);
   if(incoming&&game.stats.paddleHits!==caught){
    lastCatch={time:game.time,incoming,face,outgoing:{x:ball.x,vx:ball.vx,vy:ball.vy},nextHit:null};
    catches.push(lastCatch);
   }
   if(lastCatch&&game.stats.hits!==hits&&!lastCatch.nextHit)lastCatch.nextHit={time:game.time,delay:game.time-lastCatch.time};
  }
  assert.notEqual(game.phase,'volley');
  assert.ok(ball.y-ball.r>=692);
  shots.push({seconds:steps*STEP,hits:game.stats.hits-beforeShot,gap});
 }
 results.push({version,shots,catches,peak:game.progress.maxNoHit,wave:game.wave,hits:game.stats.hits,score:game.score,seconds:game.stats.flight});
}
writeFileSync('test-results/stage30-catches-reviewed.json',JSON.stringify(results,null,2));
for(const {version,catches,hits,score,seconds,peak} of results) console.log(JSON.stringify({version,catches:catches.slice(0,4),hits,score,seconds,peak}));
