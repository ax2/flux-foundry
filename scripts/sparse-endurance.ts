import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';import {writeFile,mkdir} from 'node:fs/promises';
const rows=[];
for(const level of [4,6,12,21,25])for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const mirror of [false,true])for(const cadence of [12,16,24]){
 const g=new Game(1000+level,level);if(mirror)g.mirror();let steps=0;const shots=[];let worst=null,worstGap=0;
 while(g.phase==='aim'){
  g.selectBall(material,size);const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(g.shots===0)g.angle=2.59;else g.aim(t.x,t.y);g.fire();let step=0;const b=g.balls[0];
  while(g.phase==='volley'&&step<600/STEP){if(step%cadence===0)steer(g,'steer');g.update(STEP);step++;if(g.progress.sinceHit>worstGap&&g.targets.length<=2){worstGap=g.progress.sinceHit;worst={time:g.time,shot:g.shots,ball:{...b},paddle:{...g.paddle},targets:structuredClone(g.targets),progress:{...g.progress}};}}
  if(g.phase!=='volley')assert.ok(b.y-b.r>=692,'Entire original ball must naturally enter collector');shots.push(step*STEP);if(g.phase==='volley')break;
 }
 rows.push({level:level+1,material,size,mirror,cadence,result:g.phase,shots,maxNoHit:g.progress.maxNoHit,maxSparseGap:worstGap,worst});
}
const summary={games:rows.length,finished:rows.filter(r=>r.result!=='volley').length,wins:rows.filter(r=>r.result==='won').length,maxNoHit:Math.max(...rows.map(r=>r.maxNoHit)),maxSparseGap:Math.max(...rows.map(r=>r.maxSparseGap)),over20:rows.filter(r=>r.maxSparseGap>=20).length,over30:rows.filter(r=>r.maxSparseGap>=30).length};await mkdir('test-results',{recursive:true});await writeFile('test-results/sparse-endurance.json',JSON.stringify({method:'Five whole official levels ×12 loadouts ×mirror ×100/133/200ms legal controls. No target injection/recall, natural remaining1–2 block states sampled.600s observer per ball, never finishes a live shot.',summary,rows},null,2));console.log(JSON.stringify(summary));console.log(JSON.stringify(rows.sort((a,b)=>b.maxSparseGap-a.maxSparseGap).slice(0,3)));

assert.equal(summary.finished,summary.games);assert.ok(summary.maxSparseGap<20,'Sparse endgame lost progress for20s; inspect recorded state');
