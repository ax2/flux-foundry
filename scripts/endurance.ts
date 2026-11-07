import {writeFile,mkdir} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {LEVELS,MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
const noRails=process.argv.includes('--no-rails');
const rows=[];const unfinished=[];
for(let level=0;level<LEVELS.length;level++)for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[]){
 const shots=[];
 for(let a=0;a<9;a++){
  const g=new Game(404+level,level);if(noRails)g.rails=[];g.selectBall(material,size);g.angle=.2+a*(Math.PI-.4)/8;g.fire();const body=g.balls[0];let n=0,tail:{x:number;y:number;speed:number}[]=[];
  while(g.phase==='volley'&&n<90/STEP){g.update(STEP);n++;if(![body.x,body.y,body.vx,body.vy].every(Number.isFinite))throw Error('Non-finite body');if(n>87/STEP&&n%12===0)tail.push({x:body.x,y:body.y,speed:Math.hypot(body.vx,body.vy)});}
  const collected=g.phase!=='volley';if(collected&&body.y-body.r<692)throw Error('Disappeared before collector');
  if(!collected)unfinished.push({level:level+1,material,size,angle:g.angle,hits:g.stats.hits,rescues:g.stats.rescues,tail});
  shots.push({hits:g.stats.hits,seconds:n*STEP,rescues:g.stats.rescues,returns:g.stats.returns,collected,coreDamage:LEVELS[level].tiles.filter(t=>t.core).reduce((n,t)=>n+t.hp,0)-g.targets.filter(t=>t.core).reduce((n,t)=>n+t.hp,0)});
 }
 const avg=(f:(s:typeof shots[number])=>number)=>shots.reduce((n,s)=>n+f(s),0)/shots.length;
 rows.push({level:level+1,material,size,hits:avg(s=>s.hits),seconds:avg(s=>s.seconds),coreDamage:avg(s=>s.coreDamage),maxSeconds:Math.max(...shots.map(s=>s.seconds)),rescues:shots.reduce((n,s)=>n+s.rescues,0),returns:shots.reduce((n,s)=>n+s.returns,0),unfinished:shots.filter(s=>!s.collected).length});
}
const totals=[];for(const material of Object.keys(MATERIALS))for(const size of Object.keys(SIZES)){const group=rows.filter(r=>r.material===material&&r.size===size);totals.push({material,size,meanHits:group.reduce((n,r)=>n+r.hits,0)/group.length,meanSeconds:group.reduce((n,r)=>n+r.seconds,0)/group.length,bestLevels:LEVELS.filter((_,i)=>group.find(r=>r.level===i+1)!.hits===Math.max(...rows.filter(r=>r.level===i+1).map(r=>r.hits))).length});}
const report={method:`${LEVELS.length} levels × 12 material/size combinations × 9 angles = ${rows.length*9} shots. Natural collection only, no recall; 90 simulated seconds observation bound, not a game timeout. Equal launch energy, no magnet.`,samples:rows.length*9,unfinished,totals,rows};
await mkdir('docs/iterations/Stage-04',{recursive:true});await writeFile(`docs/iterations/Stage-04/endurance${noRails?'-no-rails':''}.json`,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({samples:report.samples,unfinished:unfinished.length,maxSeconds:Math.max(...rows.map(r=>r.maxSeconds)),rescues:rows.reduce((n,r)=>n+r.rescues,0),returns:rows.reduce((n,r)=>n+r.returns,0),totals},null,2));
