import {mkdir,writeFile} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
const rows=[];const baseline=process.argv.includes('--baseline');
for(let seed=1;seed<=8;seed++)for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(let a=0;a<9;a++){
 const g=new Game(seed*739),initial=g.targets.map(t=>({...t}));g.selectBall(material,size);g.angle=.2+a*(Math.PI-.4)/8;g.fire();const b=g.balls[0];let steps=0;
 while(g.phase==='volley'&&steps<180/STEP){g.update(STEP);steps++;if(![b.x,b.y,b.vx,b.vy].every(Number.isFinite))throw Error('Non-finite body');}
 if(g.phase!=='volley'&&b.y-b.r<692)throw Error('Premature deletion');
 rows.push({seed,material,size,angle:g.angle,seconds:steps*STEP,hits:g.stats.hits,boosts:g.stats.boosts,rescues:g.stats.rescues,unfinished:g.phase==='volley',initialHP:initial.reduce((n,t)=>n+t.hp,0)});
}
const mean=(key:'seconds'|'hits')=>rows.reduce((n,r)=>n+r[key],0)/rows.length;
const summary={samples:rows.length,meanSeconds:mean('seconds'),meanHits:mean('hits'),underTwoSeconds:rows.filter(r=>r.seconds<2).length,maxSeconds:Math.max(...rows.map(r=>r.seconds)),unfinished:rows.filter(r=>r.unfinished).length};
await mkdir('docs/iterations/Stage-05',{recursive:true});await writeFile(`docs/iterations/Stage-05/sustain-${baseline?'before':'after'}.json`,JSON.stringify({method:'8 fixed expedition seeds × 12 combinations × 9 angles. Natural collection, no recall, no manual pulse or magnet; 180 simulated seconds observation limit, never a game lifetime.',summary,rows},null,2)+'\n');console.log(JSON.stringify(summary));
