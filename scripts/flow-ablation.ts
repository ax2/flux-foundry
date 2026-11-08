import {Game,STEP} from '../src/game';import {steer} from './paddle-policy';import {writeFile} from 'node:fs/promises';
const rows=[];
for(const [level,material,size,cadence] of [[4,'ceramic','standard',24],[25,'brass','small',14],[25,'brass','small',24],[16,'ceramic','small',24]] as const)for(const mode of ['normal','no-wind','gates-open'] as const){
 const g=new Game(1000+level,level);g.mirror();if(mode==='no-wind')g.windMultiplier=0;if(mode==='gates-open')for(const gate of g.gates)gate.open=true;let multiGap=0;
 while(g.phase==='aim'){g.selectBall(material,size);const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(!g.shots)g.angle=2.59;else g.aim(t.x,t.y);g.fire();let step=0;while(g.phase==='volley'&&step<600/STEP){if(step%cadence===0)steer(g,'steer');g.update(STEP);step++;if(g.targets.length>=3&&!g.goalComplete)multiGap=Math.max(multiGap,g.progress.sinceHit);}if(g.phase==='volley')break;}
 rows.push({level:level+1,material,size,cadence,mode,multiGap,maxNoHit:g.progress.maxNoHit,result:g.phase,shots:g.shots});
}
await writeFile('test-results/flow-ablation.json',JSON.stringify({method:'Diagnostic ablation only. Modified wind multiplier or initial gate state are NOT legal UI replays or certified wins. Complete seeded runs compare interaction effects; trajectories diverge after intervention.',rows},null,2));console.log(JSON.stringify(rows));
