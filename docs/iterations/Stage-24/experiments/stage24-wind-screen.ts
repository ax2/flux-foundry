import {Game,STEP} from '../src/game';
import {LEVELS,MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
import {steer} from '../scripts/paddle-policy';
import {writeFileSync,readFileSync} from 'node:fs';

const variants = [
 ['original',{}], ['upper-30',{y:390,h:240}], ['upper-60',{y:420,h:210}],
 ['upper-90',{y:450,h:180}], ['tilt-18',{fx:18,fy:-46}],
 ['tilt-24',{fx:24,fy:-43}], ['tilt-30',{fx:30,fy:-39}],
 ['narrow-200',{x:110,w:200}], ['narrow-180',{x:120,w:180}],
] as const;
const fixtureRoutes = [false,true].map(mirror=>JSON.parse(readFileSync('tests/fixtures/challenges'+(mirror?'-mirrored':'')+'.json','utf8'))[18]);
const config = LEVELS[18].air[0];
const results=[];
for(const [name,patch] of variants){
 Object.assign(config,{x:95,y:360,w:230,h:270,fx:12,fy:-48},patch);
 const rows=[];
 for(const material of Object.keys(MATERIALS) as Material[])
 for(const size of Object.keys(SIZES) as BallSize[])
 for(const mirror of [false,true])
 for(const cadence of [14,24]){
  const g=new Game(1018,18);
  if(mirror)g.mirror();
  const balls=[];
  while(g.phase==='aim'){
   g.selectBall(material,size);
   const t=g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];
   if(!g.shots)g.angle=2.59;else g.aim(t.x,t.y);
   g.fire();
   const original=g.balls[0];
   let step=0;
   while(g.phase==='volley'&&step<600/STEP){
    if(step%cadence===0)steer(g,'steer');
    g.update(STEP);step++;
   }
   const natural=g.phase!=='volley'&&original.y-original.r>=692;
   balls.push({seconds:step*STEP,natural});
   if(!natural)break;
  }
  rows.push({material,size,mirror,cadence,phase:g.phase,stars:g.stars,shots:g.shots,gap:g.progress.maxNoHit,balls});
 }
 const fixtures=fixtureRoutes.map((route,index)=>{
  const g=new Game(1018,18);if(index)g.mirror();
  const steps=[];
  for(const move of route.moves){
   if(g.phase!=='aim')break;
   g.selectBall(move.material,move.size);g.angle=move.angle;g.fire();
   let n=0;while(g.phase==='volley'&&n<600/STEP){g.update(STEP);n++}
   steps.push(n);
  }
  return {phase:g.phase,stars:g.stars,steps,original:route.moves.map(m=>m.steps)};
 });
 const target=rows.find(r=>r.material==='rubber'&&r.size==='small'&&!r.mirror&&r.cadence===24);
 const summary={name,target,max:Math.max(...rows.map(r=>r.gap)),wins:rows.filter(r=>r.phase==='won').length,stars:rows.reduce((n,r)=>n+r.stars,0),shots:rows.reduce((n,r)=>n+r.shots,0),fixtures};
 console.log(JSON.stringify(summary));
 results.push({summary,rows});
}
writeFileSync('test-results/stage24-wind-screen.json',JSON.stringify(results,null,2));
