import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {writeFile} from 'node:fs/promises';
const g=new Game(1012,12);g.selectBall('brass','large');g.angle=2.59;g.fire();let peak:any=null,lastC=0;const contacts:any[]=[];
for(let step=0;g.phase==='volley'&&step<300/STEP;step++){
 if(step%14===0)steer(g,'follow');const before={ball:{...g.balls[0]},paddle:{...g.paddle},time:g.time};g.update(STEP);
 if(!peak||g.progress.sinceHit>peak.gap)peak={gap:g.progress.sinceHit,time:g.time,ball:{...g.balls[0]},paddle:{...g.paddle},targets:structuredClone(g.targets),air:g.air,gates:structuredClone(g.gates),stats:{...g.stats}};
 if(g.stats.paddleHits!==lastC){if(g.progress.sinceHit>=8)contacts.push({before,after:{ball:{...g.balls[0]},paddle:{...g.paddle},time:g.time,gap:g.progress.sinceHit,targets:structuredClone(g.targets)}});lastC=g.stats.paddleHits;}
}
const report={phase:g.phase,progress:g.progress,peak,contacts};await writeFile('test-results/firstball-repro.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));
