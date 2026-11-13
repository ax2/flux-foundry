import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {Game as Trial} from './stage34-game-second11';
import {steer} from '../scripts/paddle-policy';
import {forecastRebound} from '../src/paddle-assist';
const cases=[[739,'rubber','standard','steer'],[4039,'steel','standard','steer'],[4039,'rubber','large','steer'],[9011,'steel','small','steer'],[137,'brass','standard','steer'],[7429,'steel','large','steer']] as const;
const out=[];
for(const [seed,mat,size,policy] of cases){
 const a=new Game(seed),b=new Trial(seed);let first;
 while(a.phase==='aim'&&!first){
  for(const g of [a,b]){assert.ok(g.selectBall(mat,size));const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());}
  for(let i=0;a.phase==='volley'&&i<900/STEP;i++){
   if(i%14===0){steer(a,policy);steer(b,policy);}
   const oldP={...a.paddle},ball={...a.balls[0]},targets=structuredClone(a.targets),time=a.time;
   const previous={time,ball,oldP,targets,gap:a.progress.sinceHit,catches:a.progress.catchesWithoutHit,shot:a.shots,wide:a.wideTime,big:a.bigTime,rails:structuredClone(a.rails),air:structuredClone(a.air)};
   a.update(STEP);b.update(STEP);
   if(a.paddle.tilt!==b.paddle.tilt||a.paddle.boost!==b.paddle.boost){
    const env={air:a.air,gates:a.gates,pegs:a.pegs,wind:a.windMultiplier,response:a.spec.windResponse,energyLimit:a.energyCapacity};
    const args=[ball,oldP,targets,a.spec.mass,a.restitution,time,env] as const;
    const base=forecastRebound(...args,a.paddle.tilt??0,true,a.paddle.boost);
    const trial=forecastRebound(...args,b.paddle.tilt??0,true,b.paddle.boost);
    first={seed,previous,base:{paddle:{...a.paddle},out:base.outgoing,caught:base.caughtAt?.eta,hit:base.impact,up:base.path?.filter(s=>s.vy<0&&Math.abs(s.y-609)<4)},trial:{paddle:{...b.paddle},out:trial.outgoing,caught:trial.caughtAt?.eta,hit:trial.impact}};
    for(let k=0;k<480&&a.phase==='volley'&&b.phase==='volley';k++){if((i+k+1)%14===0){steer(a,policy);steer(b,policy);}a.update(STEP);b.update(STEP);if(k===479)Object.assign(first,{after:{base:{hits:a.stats.hits,catches:a.stats.paddleHits},trial:{hits:b.stats.hits,catches:b.stats.paddleHits}}});}
    break;
   }
   assert.equal(a.phase,b.phase);
  }
 }
 assert.ok(first);out.push(first);
}
writeFileSync('test-results/stage34-first-divergence.json',JSON.stringify(out,null,2));
for(const {seed,previous,trial} of out)console.log(JSON.stringify({seed,shot:previous.shot,time:previous.time,gap:previous.gap,b:previous.ball,p:previous.oldP,wide:previous.wide,big:previous.big,targets:previous.targets.map(t=>[t.x,t.y,t.kind,t.power]),hit:trial.hit}));
