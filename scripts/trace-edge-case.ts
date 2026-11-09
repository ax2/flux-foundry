import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {guidedRebound,forecastRebound} from '../src/paddle-assist';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const rows=[];
for(const cadence of [18,36]){
 const g=new Game(8148,11);g.selectBall('steel','standard');g.angle=2.478263495133118;g.fire();const ball=g.balls[0];let step=0,lastRead=-1;const forecasts:any[]=[],contacts:any[]=[];
 while(g.phase==='volley'&&step<600/STEP){
  if(step%cadence===0)steer(g,'steer');
  const b=g.balls[0],s=g.spec;
  if(g.progress.sinceHit>=4&&b.vy>0&&b.y>470&&b.y<675-b.r+10&&g.time-lastRead>=.08){
   lastRead=g.time;const e={air:g.air,gates:g.gates,pegs:g.pegs,wind:g.windMultiplier,response:s.windResponse,energyLimit:g.energyCapacity},p={...g.paddle,vx:Math.max(-900,Math.min(900,(g.paddle.target-g.paddle.x)/STEP))};
   const plan=guidedRebound(b,p,g.targets,s.mass,g.restitution,g.time,e,.32),wide=guidedRebound(b,p,g.targets,s.mass,g.restitution,g.time,e,.48);
   forecasts.push({time:g.time,gap:g.progress.sinceHit,misses:g.progress.catchesWithoutHit,ball:{...b},paddle:{...p},plan,wide,detail:plan.hit?forecastRebound(b,p,g.targets,s.mass,g.restitution,g.time,e,plan.tilt,false,plan.boost):undefined});
  }
  const before={time:g.time,gap:g.progress.sinceHit,misses:g.progress.catchesWithoutHit,ball:{...b},paddle:{...g.paddle},hits:g.stats.hits,catches:g.stats.paddleHits};g.update(STEP);step++;
  if(g.phase==='volley')assert.equal(g.balls[0],ball);
  if(g.stats.paddleHits!==before.catches)contacts.push({before,after:{ball:{...ball},paddle:{...g.paddle},progress:{...g.progress}}});
 }
 assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);rows.push({cadence,seconds:step*STEP,phase:g.phase,progress:g.progress,contacts,forecasts});
}
await mkdir('test-results',{recursive:true});await writeFile('test-results/edge-forecast-before.json',JSON.stringify({method:'Read-only forecasts evaluated on unchanged legal whole first-ball runs, actual seed8148/index11/steelstandard/steer. Alternate plans are diagnostic only; never applied. Original ball must naturally collect.',rows},null,2));
console.log(JSON.stringify(rows.map(r=>({cadence:r.cadence,gap:r.progress.maxNoHit,contacts:r.contacts.filter(c=>c.before.gap>4).map(c=>({time:c.before.time,gap:c.before.gap,misses:c.before.misses,width:c.before.paddle.width,x:c.before.ball.x,tilt:c.before.paddle.tilt,boost:c.before.paddle.boost})),earlyHits:r.forecasts.filter(f=>f.plan.hit&&f.misses<3).map(f=>({time:f.time,gap:f.gap,misses:f.misses,plan:f.plan})),wideOnly:r.forecasts.filter(f=>!f.plan.hit&&f.wide.hit).map(f=>({time:f.time,gap:f.gap,misses:f.misses,wide:f.wide}))}))));
