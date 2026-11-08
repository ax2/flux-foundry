import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {writeFile} from 'node:fs/promises';
const g=new Game(1004,4);g.mirror();let worst=0,peak=null;const catches=[],contacts:unknown[]=[];const contact=g.passiveContact.bind(g);g.passiveContact=(key,b)=>{if(g.progress.sinceHit>=8)contacts.push({key,time:g.time,gap:g.progress.sinceHit,ball:{...b},gate:structuredClone(g.gates)});contact(key,b);};
while(g.phase==='aim'){
 g.selectBall('ceramic','standard');const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(!g.shots)g.angle=2.59;else g.aim(t.x,t.y);g.fire();let step=0,lastC=g.stats.paddleHits;
 while(g.phase==='volley'&&step<600/STEP){if(step%24===0)steer(g,'steer');g.update(STEP);step++;
  if(g.progress.sinceHit>worst){worst=g.progress.sinceHit;peak={time:g.time,ball:{...g.balls[0]},paddle:{...g.paddle},progress:{...g.progress},targets:structuredClone(g.targets),pegs:structuredClone(g.pegs),gates:structuredClone(g.gates),air:structuredClone(g.air)};}
  if(g.stats.paddleHits!==lastC&&g.progress.sinceHit>=8)catches.push({time:g.time,gap:g.progress.sinceHit,paddle:{...g.paddle},ball:{...g.balls[0]},targets:g.targets.map(t=>({id:t.id,x:t.x,y:t.y,hp:t.hp})),gates:structuredClone(g.gates)});lastC=g.stats.paddleHits;
 }
 if(g.phase==='volley')break;
}
console.log(JSON.stringify({result:g.phase,worst,peak,catches,contacts},null,2));await writeFile('test-results/multi-repro.json',JSON.stringify({result:g.phase,worst,peak,catches,contacts},null,2));
