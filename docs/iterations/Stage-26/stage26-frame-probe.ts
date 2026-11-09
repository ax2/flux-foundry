import {Game,STEP} from '../src/game';
import {catchPaddle} from '../src/arcade';
import {advanceFree} from '../src/physics';
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
 assert.equal(game.air.length,0);
 const fixed={...balls[0]};
 const delta=Math.max(-900*STEP,Math.min(900*STEP,paddle.target-paddle.x));
 const half=paddle.width/2;
 const x=Math.max(22+half,Math.min(398-half,paddle.x+delta));
 const vx=(x-paddle.x)/STEP;
 const steps=Math.max(1,Math.ceil((Math.hypot(fixed.vx,fixed.vy)+2000*STEP)*STEP/(fixed.r*.45)));
 const dt=STEP/steps;
 let catchSubstep=0;
 for(let sub=0;sub<steps;sub++){
  const previous={...fixed};
  advanceFree(fixed,dt);
  if(catchPaddle(fixed,previous,{...paddle,x:paddle.x+vx*dt*(sub+1),vx},dt)){
   catchSubstep=sub+1;
   const energy=.5*spec.mass*(fixed.vx*fixed.vx+fixed.vy*fixed.vy);
   const work=Math.min(paddle.boost??18000,Math.max(0,game.energyCapacity-energy));
   fixed.vy=-Math.sqrt(fixed.vy*fixed.vy+2*work/spec.mass);
  }
 }
 assert.ok(catchSubstep);
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
 assert.deepEqual(fixed,branches[0].outgoing);
 return {time,gap:game.progress.sinceHit,steps,catchSubstep,fixed,estimate:{outgoing:estimated.outgoing,impact:estimated.impact},branches};
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
writeFileSync('test-results/stage26-frame-probe.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));

