import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';import {airStrength} from '../src/air';import {mkdir,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const baseline=process.argv.includes('--baseline'),rows=[];
for(const level of [4,6,8,11,13,16,18,20,21,25])for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const mirror of [false,true])for(const cadence of [14,24]){
 const g=new Game(1000+level,level);if(mirror)g.mirror();let multiGap=0,worst=null;const shots=[];
 while(g.phase==='aim'){
  g.selectBall(material,size);const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(!g.shots)g.angle=2.59;else g.aim(t.x,t.y);g.fire();const ball=g.balls[0];let step=0;
  while(g.phase==='volley'&&step<600/STEP){if(step%cadence===0)steer(g,'steer');g.update(STEP);step++;
   if(g.targets.length>=3&&!g.goalComplete&&g.progress.sinceHit>multiGap){multiGap=g.progress.sinceHit;worst={time:g.time,shot:g.shots,ball:{...ball},paddle:{...g.paddle},progress:{...g.progress},targets:structuredClone(g.targets),gates:structuredClone(g.gates),pegs:structuredClone(g.pegs),rails:structuredClone(g.rails),air:structuredClone(g.air),flow:g.air.map(z=>({strength:airStrength(z,ball),fx:z.fx,fy:z.fy})),stats:{...g.stats}};}
  }
  if(g.phase!=='volley')assert.ok(ball.y-ball.r>=692);shots.push(step*STEP);if(g.phase==='volley')break;
 }
 rows.push({level:level+1,material,size,mirror,cadence,result:g.phase,shots,multiGap,maxNoHit:g.progress.maxNoHit,worst});
}
const summary={games:rows.length,natural:rows.filter(r=>r.result!=='volley').length,wins:rows.filter(r=>r.result==='won').length,maxMultiGap:Math.max(...rows.map(r=>r.multiGap)),over20:rows.filter(r=>r.multiGap>=20).length,over30:rows.filter(r=>r.multiGap>=30).length,maxNoHit:Math.max(...rows.map(r=>r.maxNoHit))};await mkdir('test-results',{recursive:true});await writeFile(`test-results/multi-${baseline?'before':'after'}.json`,JSON.stringify({method:'10 whole official challenge layouts ×12 loadouts ×mirror ×117/200ms legal paddle input. Track exact continuous no-hit maximum while3+ blocks remain before goal completion. No layout injection, recall, speed or forced collection.600s observer per ball only records failures.',summary,rows},null,2));console.log(JSON.stringify(summary));console.log(JSON.stringify(rows.sort((a,b)=>b.multiGap-a.multiGap).slice(0,3)));if(!baseline){assert.equal(summary.natural,summary.games);assert.ok(summary.maxMultiGap<20,'Multi-block no-hit interval>=20s; inspect recorded state');}
