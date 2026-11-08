// Standard-work counterfactual only. Stage19 live assistance may choose lower work.
import {Game,STEP} from '../src/game';import {guidedRebound,forecastRebound} from '../src/paddle-assist';import {readFile,writeFile} from 'node:fs/promises';
const tape=JSON.parse(await readFile('docs/iterations/Stage-18/inputs-22-rubber.json','utf8')).filter((e:any)=>e.phase==='volley'&&e.shot===1);const g=new Game(1021,21);g.selectBall('rubber','large');g.angle=Math.PI/2;g.fire();let index=0,step=0,last:any=null;const catches:any[]=[];
while(g.phase==='volley'&&step<300/STEP){
 while(index<tape.length&&tape[index].flight<=g.time+STEP/10){g.movePaddle(tape[index].target);index++;}
 const before={time:g.time,ball:{...g.balls[0]},paddle:{...g.paddle},progress:{...g.progress},guide:g.lastGuideTime,catches:g.stats.paddleHits};g.update(STEP);step++;
 if(g.lastGuideTime!==before.guide&&g.time>65&&g.time<88){
  const p={...before.paddle,vx:g.paddle.vx},env={air:g.air,gates:g.gates,pegs:g.pegs,wind:g.windMultiplier,response:g.spec.windResponse},maxTilt=g.progress.sinceHit>=20||g.lowEndgame?.48:.32;
  const plan=guidedRebound(before.ball,p,g.targets,g.spec.mass,g.restitution,before.time,env,maxTilt),active=plan.hit||before.progress.catchesWithoutHit>=(g.sparseEndgame?2:4),tilt=active?plan.tilt:p.tilt||0;
  last={time:g.time,plan,active,input:{ball:before.ball,p,targets:structuredClone(g.targets),mass:g.spec.mass,restitution:g.restitution,time:before.time,env:structuredClone(env),maxTilt},forecast:forecastRebound(before.ball,p,g.targets,g.spec.mass,g.restitution,before.time,env,tilt,true)};
 }
 if(g.stats.paddleHits>before.catches&&before.time>65&&before.time<88)catches.push({before,after:{ball:{...g.balls[0]},paddle:{...g.paddle},gap:g.progress.sinceHit},last});
}
const result={method:'Captured legal touch replay with read-only STANDARD-WORK counterfactual forecasts. allowLowerWork is deliberately omitted here; after Stage19 these are not the actual live adaptive plan. Archived Stage19/forecast-before.json records the pre-change diagnostic. No body/target/outcome intervention.',phase:g.phase,maxNoHit:g.progress.maxNoHit,catches};await writeFile('test-results/touch-forecast-diagnostic.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(catches.map(c=>({time:c.before.time,gap:c.before.progress.sinceHit,tilt:c.before.paddle.tilt,boost:c.before.paddle.boost,plan:c.last?.plan,active:c.last?.active,predicted:c.last?.forecast.outgoing,actual:c.after.ball,predictedHit:c.last?.forecast.hit,score:c.last?.forecast.score,impact:c.last?.forecast.impact}))));
