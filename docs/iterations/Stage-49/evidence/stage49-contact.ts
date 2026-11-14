import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {Game,STEP,LAUNCH} from '../src/game';

const dir=process.argv[2]??'test-results/stage49-pointer-1571';
const tape=JSON.parse(readFileSync(dir+'/input-tape.json','utf8'));
const pointers=JSON.parse(readFileSync(dir+'/pointer-tape.json','utf8'));
const report=JSON.parse(readFileSync(dir+'/report.json','utf8'));
const game=new Game(report.seed),out=[],contacts=[];
for(const result of report.shots){
 const entries=tape.filter(e=>e.shot===result.shots);
 const launch=entries.find(e=>e.event==='launch');
 assert.ok(launch?.ball);
 assert.equal(launch.ball.x,LAUNCH.x);assert.equal(launch.ball.y,LAUNCH.y);
 assert.ok(game.selectBall(report.material,report.size));
 const aim=entries.find(e=>e.event==='aim');
 game.aim(aim.point.x,aim.point.y);
 // Browser pointer coordinates are rounded by Chrome; recover the actual legal launch angle.
 game.angle=Math.atan2(launch.ball.vy,launch.ball.vx);
 assert.ok(game.fire());
 const ball=game.balls[0],moves=pointers.filter(e=>e.phase==='volley'&&e.shot===result.shots&&e.type!=='pointerup');
 const before=game.stats.hits;
 let index=0,step=0,peak=0;
 while(game.phase==='volley'&&step<900/STEP){
  while(index<moves.length&&moves[index].flight<=game.stats.flight+STEP/10)game.movePaddle(moves[index++].paddle.target);
  peak=Math.max(peak,game.progress.sinceHit+STEP);
  const catches=game.stats.paddleHits,hits=game.stats.hits,previousGap=game.progress.sinceHit;
  const hp=new Map(game.targets.map(t=>[t.id,t.hp]));
  game.update(STEP);step++;
  if(result.shots===2&&previousGap>=6.5&&
     (catches!==game.stats.paddleHits||hits!==game.stats.hits)){
   contacts.push({flight:game.stats.flight,previousGap,caught:catches!==game.stats.paddleHits,
    ball:{...ball},paddle:{...game.paddle},changed:game.targets.filter(t=>t.hp!==hp.get(t.id)).map(t=>({id:t.id,kind:t.kind,before:hp.get(t.id),after:t.hp}))});
  }
  if(game.phase==='volley')assert.equal(game.balls[0],ball);
 }
 assert.notEqual(game.phase,'volley');assert.ok(ball.y-ball.r>=692);
 out.push({shot:result.shots,peak,hits:game.stats.hits-before,seconds:step*STEP,expected:result});
}
console.log(JSON.stringify(contacts,null,2));