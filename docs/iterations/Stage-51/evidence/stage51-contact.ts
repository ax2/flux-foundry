import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {Game as Base} from './stage51-base';
import {steer} from '../scripts/paddle-policy';
const seed=7429,out=[];
for(const [label,Model] of [['baseline',Base],['candidate',Game]] as const){
 const game=new Model(seed); const shots=[];
 while(game.phase==='aim'&&game.shots<3){
  assert.ok(game.selectBall('steel','large'));
  const t=game.targets.slice().sort((a,b)=>a.hp-b.hp)[0];game.aim(t.x,t.y);assert.ok(game.fire());
  const ball=game.balls[0],started=game.time,initialHits=game.stats.hits,events=[];
  let i=0,gap=0;
  while(game.phase==='volley'&&i<900/STEP){
   if(i%14===0)steer(game,'follow');
   const hits=game.stats.hits,catches=game.stats.paddleHits;
   const before=game.targets.map(({id,hp,kind,power,motion})=>({id,hp,kind,power,moving:!!motion}));
   gap=Math.max(gap,game.progress.sinceHit+STEP);game.update(STEP);i++;
   if(game.phase==='volley')assert.equal(game.balls[0],ball);
   if(game.shots===3){
    if(game.stats.paddleHits>catches)events.push({kind:'catch',time:game.time,shotTime:game.time-started,paddle:{...game.paddle},ball:{...ball}});
    if(game.stats.hits>hits)events.push({kind:'hit',time:game.time,shotTime:game.time-started,targets:before.flatMap(t=>{
     const hp=game.targets.find(current=>current.id===t.id)?.hp??0;
     return t.hp===hp?[]:[{...t,after:hp}];
    })});
   }
  }
  assert.notEqual(game.phase,'volley');assert.ok(ball.y-ball.r>=692);
  shots.push({shot:game.shots,seconds:i*STEP,hits:game.stats.hits-initialHits,gap,events});
 }
 out.push({label,shots});
}
assert.deepEqual(out[0].shots.slice(0,2),out[1].shots.slice(0,2));
const [base,candidate]=out.map(r=>r.shots[2]);
const firstCatch=candidate.events.find(e=>e.kind==='catch');
const followingHit=candidate.events.find(e=>e.kind==='hit'&&e.time>firstCatch.time);
assert.ok(followingHit.targets.some(t=>t.kind==='steel'&&t.power==='spring'&&t.moving&&t.after===t.hp-1));
assert.ok(followingHit.time-firstCatch.time<.15);
writeFileSync('test-results/stage51-contact.json',JSON.stringify({seed,base,candidate},null,2)+'\n');
console.log(JSON.stringify({gap:[base.gap,candidate.gap],hits:[base.hits,candidate.hits],flight:[base.seconds,candidate.seconds],delay:followingHit.time-firstCatch.time,tilt:firstCatch.paddle.tilt,impact:followingHit.targets}));
