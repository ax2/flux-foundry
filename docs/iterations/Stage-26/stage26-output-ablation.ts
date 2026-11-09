import {Game,STEP} from '../src/game';
import {forecastRebound} from '../src/paddle-assist';
import {steer} from '../scripts/paddle-policy';
import {writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const game=new Game(2217);
function probe(){
 const {air,gates,pegs,windMultiplier,targets,paddle,balls,time,spec,restitution}=game;
 const environment={air,gates,pegs,wind:windMultiplier,response:spec.windResponse,energyLimit:game.energyCapacity};
 const estimated=forecastRebound(balls[0],paddle,targets,spec.mass,restitution,time,environment,paddle.tilt??0,true,paddle.boost);
 assert.ok(estimated.hit&&estimated.outgoing);
 const {feedback: _,...state}=game;
 const branches=[];
 for(const name of ['actual','estimated-output'] as const){
  const branch=Object.assign(new Game(2217),structuredClone(state));
  const before=branch.stats.hits;
  branch.update(STEP);
  if(name==='estimated-output')Object.assign(branch.balls[0],estimated.outgoing);
  const outgoing={...branch.balls[0]};
  let hitTime;
  for(let i=0;i<149&&branch.phase==='volley';i++){
   branch.update(STEP);
   if(branch.stats.hits>before){hitTime=branch.time-time;break;}
  }
  branches.push({name,outgoing,hitTime,hp:branch.targets[0]?.hp,phase:branch.phase});
 }
 return {time,gap:game.progress.sinceHit,estimate:{outgoing:estimated.outgoing,impact:estimated.impact},branches};
}
let result;
while(game.phase==='aim'&&!result){
 assert.ok(game.selectBall('brass','small'));
 const target=game.targets.slice().sort((a,b)=>a.hp-b.hp)[0];
 game.aim(target.x,target.y); assert.ok(game.fire());
 let step=0;
 while(game.phase==='volley'&&step<900/STEP){
  if(step++%14===0)steer(game,'follow');
  if(game.shots===4&&Math.abs(game.time-348.208333333181)<1e-8){result=probe();break;}
  game.update(STEP);
 }
}
assert.ok(result);
writeFileSync('test-results/stage26-output-ablation.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
