import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {writeFile} from 'node:fs/promises';
const rows=[];
for(const [level,seed,material,size,angle,policy,cadence] of [[15,1015,'steel','standard',.55,'steer',14],[14,1014,'brass','standard',.55,'follow',14],[11,8148,'steel','standard',2.478263495133118,'steer',18],[21,1021,'rubber','large',Math.PI/2,'follow',14]] as const){
 const g=new Game(seed,level);g.selectBall(material,size);g.angle=angle;g.fire();const trace:any[]=[],events:any[]=[];let peak:any=null,step=0;
 const state=()=>({time:g.time,gap:g.progress.sinceHit,ball:{...g.balls[0]},paddle:{...g.paddle},progress:{...g.progress},stats:{...g.stats},bricks:structuredClone(g.targets),air:structuredClone(g.air),gates:structuredClone(g.gates),pegs:structuredClone(g.pegs),rails:structuredClone(g.rails)});
 const passive=g.passiveContact.bind(g);g.passiveContact=(key,b)=>{events.push({event:key,...state()});passive(key,b);};
 while(g.phase==='volley'&&step<300/STEP){
  if(step%cadence===0)steer(g,policy);const before=state();g.update(STEP);step++;
  if(!peak||g.progress.sinceHit>peak.gap)peak=state();
  if(step%12===0)trace.push(state());
  if(g.stats.paddleHits>before.stats.paddleHits)events.push({event:'paddle',before,after:state()});
  if(g.stats.hits>before.stats.hits)events.push({event:'hit',before,after:state()});
 }
 rows.push({level:level+1,seed,material,size,angle,policy,cadence,phase:g.phase,progress:g.progress,peak,events,trace});
}
await writeFile('test-results/progress-traces.json',JSON.stringify({method:'Official first-ball layouts and legal paddle inputs. passiveContact wrapper logs then delegates; no physics/state intervention or forced collection. Diagnostic traces are distinct from formal natural replay qualification.',rows},null,2));
console.log(JSON.stringify(rows.map(({level,phase,progress,peak})=>({level,phase,progress,peakTime:peak.time,targets:peak.bricks,air:peak.air,pegs:peak.pegs,gates:peak.gates,ball:peak.ball,paddle:peak.paddle}))));
