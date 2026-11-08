import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {writeFile} from 'node:fs/promises';
const rows=[];
for(const [level,material,size,angle] of [[9,'brass','small',2.59],[20,'ceramic','large',Math.PI/2]] as const){
 const g=new Game(1000+level,level);g.selectBall(material,size);g.angle=angle;g.fire();let peak:any=null,lastC=0;const contacts:any[]=[],passive:any[]=[];const contact=g.passiveContact.bind(g);g.passiveContact=(key,b)=>{if(g.progress.sinceHit>=4)passive.push({key,time:g.time,gap:g.progress.sinceHit,ball:{...b}});contact(key,b);};
 for(let step=0;g.phase==='volley'&&step<300/STEP;step++){
  if(step%14===0)steer(g,'follow');const before={time:g.time,ball:{...g.balls[0]},paddle:{...g.paddle},progress:{...g.progress}};g.update(STEP);
  if(!peak||g.progress.sinceHit>peak.gap)peak={gap:g.progress.sinceHit,time:g.time,ball:{...g.balls[0]},paddle:{...g.paddle},targets:structuredClone(g.targets),progress:{...g.progress},stats:{...g.stats}};
  if(g.stats.paddleHits!==lastC){if(g.progress.sinceHit>=4)contacts.push({before,after:{ball:{...g.balls[0]},paddle:{...g.paddle},gap:g.progress.sinceHit,targets:structuredClone(g.targets)}});lastC=g.stats.paddleHits;}
 }
 rows.push({level:level+1,material,size,angle,phase:g.phase,progress:g.progress,peak,contacts,passive});
}
await writeFile('test-results/two-cases.json',JSON.stringify({method:'Unchanged official first-ball follow routes; passiveContact wrapper only logs before delegating, no state/physics intervention.',rows},null,2));console.log(JSON.stringify(rows.map(r=>({level:r.level,phase:r.phase,maxNoHit:r.progress.maxNoHit,peak:r.peak.stats}))));
