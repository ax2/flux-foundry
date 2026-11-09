import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {forecastRebound,guidedRebound} from '../src/paddle-assist';
import {steer} from '../scripts/paddle-policy';
const g=new Game(2217), rows=[];

while(g.phase==='aim'){
 assert.ok(g.selectBall('brass','small'));
 const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);
 assert.ok(g.fire()); const ball=g.balls[0];
 let tick=0;
 while(g.phase==='volley'&&tick<600/STEP){
  if(tick++%14===0)steer(g,'follow');
  const probe=g.shots===4&&g.time>=334&&g.time<352&&g.targets.length===1&&ball.y>600&&ball.vy>0;
  const catches=g.stats.paddleHits, guide=g.lastGuideTime;
  const before=probe?{b:{...ball},p:{...g.paddle},targets:structuredClone(g.targets),gap:g.progress.sinceHit,time:g.time,rail:structuredClone(g.rails),mass:g.spec.mass,restitution:g.restitution,environment:{air:g.air,gates:g.gates,pegs:g.pegs,wind:g.windMultiplier,response:g.spec.windResponse,energyLimit:g.energyCapacity,allowLowerWork:g.progress.catchesWithoutHit>=2}}:undefined;
  g.update(STEP);
  if(before&&(catches!==g.stats.paddleHits||guide!==g.lastGuideTime)){
   const {b,p,targets,mass,restitution,time,environment}=before;
   const args=[b,p,targets,mass,restitution,time,environment] as const;
   const plan=guidedRebound(...args,.48), estimate=forecastRebound(...args,p.tilt??0,true,p.boost);
   const matches=estimate.path?.filter(z=>z.vy<0&&Math.abs(z.y-targets[0].y)<2)??[];
   rows.push({time,gap:before.gap,ball:b,paddle:p,energyLimit:environment.energyLimit,wind:environment.wind*environment.response,rail:before.rail.map(r=>[r.side,r.charges]),plan,estimate:{hit:estimate.hit,caught:estimate.caughtAt?.eta,outgoing:estimate.outgoing,impact:estimate.impact,crossing:matches[0]},actual:{caught:catches!==g.stats.paddleHits,prepared:guide!==g.lastGuideTime,ball:{...ball},tilt:g.paddle.tilt,boost:g.paddle.boost}});
  }
  if(g.phase==='volley') assert.equal(g.balls[0],ball);
 }
 assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);
}
assert.equal(g.phase,'over');assert.equal(g.wave,15);
writeFileSync('test-results/stage26-spring-diagnosis.json',JSON.stringify({gap:g.progress.maxNoHit,rows},null,2));
for(const r of rows.filter(r=>r.actual.caught)) console.log(JSON.stringify(r));


