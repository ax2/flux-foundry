import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import {forecastRebound,guidedRebound} from '../src/paddle-assist';
const out=[];
const g=new Game(2843);
while(g.phase==='aim'&&g.shots<6){
 assert.ok(g.selectBall('steel','standard'));
 const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];
 g.aim(t.x,t.y);assert.ok(g.fire());
 for(let step=0;g.phase==='volley';step++){
  if(step%14===0)steer(g,'steer');
  const ball={...g.balls[0]},paddle={...g.paddle},time=g.time,catches=g.stats.paddleHits,gap=g.progress.sinceHit;
  if(g.shots===6&&gap>4&&ball.y>=610&&ball.vy>0){
   const env={air:g.air,gates:g.gates,pegs:g.pegs,wind:g.windMultiplier,response:g.spec.windResponse,energyLimit:g.energyCapacity,catchFrame:STEP};
   g.update(STEP);
   if(g.stats.paddleHits>catches){
    const args=[ball,paddle,g.targets,g.spec.mass,g.restitution,time,env] as const;
    const samples=Array.from({length:113},(_,i)=>(i-56)/100).map(tilt=>{
     const f=forecastRebound(...args,tilt,true);
     return {tilt,hit:f.hit,eta:f.hitElapsed,score:f.score,target:f.impact?.target,caught:f.caughtAt?.eta};
    });
    out.push({gap,ball,paddle,default:forecastRebound(...args,0),guided:[.32,.48].map(c=>guidedRebound(...args,c)),samples});
   }
  }else g.update(STEP);
 }
}
assert.equal(out.length>=3,true);
writeFileSync('test-results/stage55-crosswind-angles.json',JSON.stringify(out,null,2)+'\n');
for(const o of out.filter(r=>r.gap<17))console.log(JSON.stringify({gap:o.gap,x:o.ball.x,default:o.default,guided:o.guided,hits:o.samples.filter(r=>r.hit).map(r=>[r.tilt,r.eta,r.target]).slice(0,6)}));
