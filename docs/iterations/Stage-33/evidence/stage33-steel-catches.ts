import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game, STEP} from '../src/game';
import {forecastRebound,guidedRebound} from '../src/paddle-assist';
import {steer} from '../scripts/paddle-policy';
const g=new Game(7429);
const catches=[];
while(g.phase==='aim'&&g.shots<11){
 assert.ok(g.selectBall('steel','standard'));
 const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());
 for(let step=0;g.phase==='volley'&&step<900/STEP;step++){
  if(step%14===0)steer(g,'steer');
  const b={...g.balls[0]},p={...g.paddle},time=g.time,gap=g.progress.sinceHit,caught=g.stats.paddleHits,hits=g.stats.hits;
  const probe=g.shots===11&&time>=523&&time<=540&&b.y>650&&b.vy>0;
  const targets=probe?structuredClone(g.targets):[];
  g.update(STEP);
  if(!probe||g.stats.paddleHits===caught)continue;
  const env={air:g.air,gates:g.gates,pegs:g.pegs,wind:g.windMultiplier,response:g.spec.windResponse,energyLimit:g.energyCapacity,catchFrame:STEP};
  const args=[b,p,targets,g.spec.mass,g.restitution,time] as const;
  const straight=forecastRebound(...args,env,p.tilt??0,true,p.boost);
  const calm=forecastRebound(...args,{...env,air:[]},p.tilt??0,true,p.boost);
  const scan=[.08,.12,.16,.2,.24,.28,.32].map(cap=>{
   const plan=guidedRebound(...args,env,cap);
   const exact=forecastRebound(...args,env,plan.tilt,true,plan.boost);
   return {cap,...plan,impact:exact.impact};
  });
  const atRow=(path:typeof straight.path)=>path?.filter(s=>s.y<=605&&s.vy<0).slice(0,1);
  const record={time:g.time,gap,b,p,wideTime:g.wideTime,bigTime:g.bigTime,rails:g.rails.map(r=>r.charges),targets:targets.map(t=>[t.id,t.x,t.y,t.hp,t.kind]),hits,straight:{impact:straight.impact,up:atRow(straight.path),out:straight.outgoing},calm:{impact:calm.impact,up:atRow(calm.path)},scan};
  catches.push(record);
 }
 assert.notEqual(g.phase,'volley');
}
assert.ok(g.progress.maxNoHit>16.73);
writeFileSync('test-results/stage33-steel-catches.json',JSON.stringify(catches,null,2)+'\n');
for(const c of catches)console.log(JSON.stringify({gap:c.gap,x:c.b.x,vx:c.b.vx,r:c.b.r,width:c.p.width,wideTime:c.wideTime,bigTime:c.bigTime,rails:c.rails,ordinary:c.straight.up,calm:c.calm.up,options:c.scan.map(({cap,tilt,hitElapsed,impact})=>[cap,tilt,hitElapsed,impact?.target])}));
