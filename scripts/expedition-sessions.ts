import {writeFile} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
const sessions=[];
// Fixed varied aim policy, not a solver. Compare the same loadout/seed with and without a rescue tap.
for(let seed=1;seed<=3;seed++)for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const assisted of [false,true]){
 const g=new Game(seed*739),shots=[];
 while(g.phase!=='over'&&g.shots<12){if(g.phase==='upgrade')g.upgrade('elastic');g.selectBall(material,size);g.angle=.35+((g.shots*5+seed*3)%11)*(Math.PI-.7)/10;g.fire();const b=g.balls[0],start={...g.stats};let steps=0;
  while(g.phase==='volley'&&steps<360/STEP){if(assisted&&!g.pulseUsed&&g.returnCharges===0&&b.y>590&&b.vy>0)g.pulse();g.update(STEP);steps++;if(![b.x,b.y,b.vx,b.vy].every(Number.isFinite))throw Error('Non-finite body');}
  shots.push({wave:g.wave,rows:g.rowsCreated,seconds:steps*STEP,hits:g.stats.hits-start.hits,rebounds:g.stats.rebounds-start.rebounds,pulses:g.stats.pulses-start.pulses,anchorsBroken:g.anchorsBroken,unfinished:g.phase==='volley'});
  if(g.phase==='volley')break;if(b.y-b.r<692)throw Error('Premature deletion');
 }
 sessions.push({seed,material,size,assisted,reason:g.endReason,shots,score:g.score,hits:g.stats.hits,flight:g.stats.flight});
}
const summaries=[false,true].map(assisted=>{const s=sessions.filter(s=>s.assisted===assisted);return {assisted,games:s.length,meanShots:s.reduce((n,s)=>n+s.shots.length,0)/s.length,meanHits:s.reduce((n,s)=>n+s.hits,0)/s.length,meanSeconds:s.reduce((n,s)=>n+s.flight,0)/s.length,ammo:s.filter(s=>s.reason==='ammo').length,overload:s.filter(s=>s.reason==='overload').length,unfinished:s.filter(s=>s.shots.some(s=>s.unfinished)).length,maxRows:Math.max(...s.flatMap(s=>s.shots.map(s=>s.rows)))}});
await writeFile('docs/iterations/Stage-05/expedition-sessions.json',JSON.stringify({method:'72 full expedition sessions: 3 seeds × 12 loadouts × paired fixed-angle policy with/without a late manual pulse. Natural collection only, 360-second per-shot observation ceiling. Scripted policy, not human win rate.',summaries,sessions},null,2)+'\n');console.log(JSON.stringify(summaries,null,2));
