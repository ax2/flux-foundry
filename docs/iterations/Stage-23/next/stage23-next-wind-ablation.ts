import {Game,STEP} from '../src/game';import {steer} from '../scripts/paddle-policy';import assert from 'node:assert/strict';import {writeFile} from 'node:fs/promises';
const rows=[];let reference='';
for(const variant of ['actual','diagnostic-no-vertical','diagnostic-no-horizontal']){
 const g=new Game(1018,18);let start:any,final:any;
 while(g.phase==='aim'&&!start){
  g.selectBall('rubber','small');const target=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(!g.shots)g.angle=2.59;else g.aim(target.x,target.y);g.fire();const ball=g.balls[0];let step=0;
  while(g.phase==='volley'&&step<600/STEP){
   if(step%24===0)steer(g,'steer');g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);
   if(g.shots===3&&!start&&g.stats.hits===20&&Math.abs(g.time-22.016666666666058)<1e-8){
    start={time:g.time,ball:{...ball},paddle:{...g.paddle},air:structuredClone(g.air),targets:structuredClone(g.targets),hits:g.stats.hits,catches:g.stats.paddleHits};
    if(!reference)reference=JSON.stringify(start);else assert.equal(JSON.stringify(start),reference);
    // Isolated force ablation only. This is not a legal/certified gameplay route.
    if(variant==='diagnostic-no-vertical')g.air=g.air.map(z=>({...z,fy:0}));if(variant==='diagnostic-no-horizontal')g.air=g.air.map(z=>({...z,fx:0}));
   }
   if(start&&(g.stats.hits>start.hits||g.phase!=='volley'||g.time-start.time>30)){final={seconds:g.time-start.time,phase:g.phase,hits:g.stats.hits-start.hits,catches:g.stats.paddleHits-start.catches,ball:{...ball},natural:g.phase!=='volley'&&ball.y-ball.r>=692};break;}
  }
 }
 assert.ok(start&&final);rows.push({variant,start,final});
}
await writeFile('test-results/stage23-next-wind-ablation.json',JSON.stringify({method:'Separate diagnostic Games replay identical legal input to the same real shot3 last-hit state. Only nonproduction branches suppress one airflow component from that frame. Stop observation at next hit/collection/30s, never alter ball or certify win. No production source change.',rows},null,2));console.log(JSON.stringify(rows.map(({variant,final})=>({variant,final}))));
