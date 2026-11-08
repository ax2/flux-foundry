import assert from 'node:assert/strict';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
import {steer} from './paddle-policy';

const originals=[{level:9,material:'brass',size:'small',angle:2.59,limit:8},{level:20,material:'ceramic',size:'large',angle:Math.PI/2,limit:12}] as const;
type Route={level:number;material:Material;size:BallSize;angle:number;policy:'follow'|'steer';cadence:number};
function run(route:Route){
 const g=new Game(1000+route.level,route.level);g.selectBall(route.material,route.size);g.angle=route.angle;assert.ok(g.fire());
 const ball=g.balls[0];let steps=0;const events:unknown[]=[];let hits=0,catches=0;
 while(g.phase==='volley'&&steps<300/STEP){
  if(steps%route.cadence===0)steer(g,route.policy);
  g.update(STEP);steps++;
  if(g.phase==='volley')assert.equal(g.balls[0],ball,'original ball must remain active');
  if(g.stats.hits!==hits||g.stats.paddleHits!==catches){events.push({step:steps,hits:g.stats.hits,catches:g.stats.paddleHits,gap:g.progress.sinceHit,remaining:g.targets.filter(t=>t.hp>0).map(t=>({id:t.id,hp:t.hp,x:t.x,y:t.y})),ball:{...ball},paddle:{...g.paddle}});hits=g.stats.hits;catches=g.stats.paddleHits;}
 }
 const natural=g.phase!=='volley'&&ball.y-ball.r>=692&&g.balls.length===0;
 assert.equal(g.shots,1);
 return {level:route.level+1,material:route.material,size:route.size,angle:route.angle,policy:route.policy,cadence:route.cadence,phase:g.phase,seconds:steps*STEP,maxNoHit:g.progress.maxNoHit,hits:g.stats.hits,catches:g.stats.paddleHits,pegRetractions:g.stats.pegRetractions,orbitBreaks:g.stats.orbitBreaks,natural,unfinished:natural?undefined:{ball:{...ball},paddle:{...g.paddle},targets:structuredClone(g.targets)},events};
}
const exact=originals.map(c=>run({...c,policy:'follow',cadence:14}));
const neighbors=[];
for(const c of originals)for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[])for(const policy of ['follow','steer'] as const)for(const offset of [-.08,-.04,0,.04,.08]){
 const {events,...row}=run({...c,material,size,policy,angle:c.angle+offset,cadence:14});neighbors.push(row);
}
const timing=[];
for(const c of originals)for(const cadence of [10,18,22])for(const offset of [-.04,0,.04]){const {events,...row}=run({...c,angle:c.angle+offset,policy:'follow',cadence});timing.push(row);}
const rows=[...neighbors,...timing],summary={samples:rows.length,natural:rows.filter(r=>r.natural).length,firstBallWins:rows.filter(r=>r.phase==='won').length,maxNoHit:Math.max(...rows.map(r=>r.maxNoHit)),over20:rows.filter(r=>r.maxNoHit>=20).length};
const sources=await Promise.all(['src/game.ts','src/paddle-assist.ts','src/physics.ts','src/content.ts','src/air.ts'].map(async path=>({path,sha256:createHash('sha256').update(await readFile(path)).digest('hex')})));
await mkdir('test-results',{recursive:true});await writeFile('test-results/two-route-audit.json',JSON.stringify({method:'Original seed1000+index, legal loadout/aim/paddle only; one original ball, 1/120 fixed step. 240 neighboring angles/loadouts/policies plus18 input-cadence cases. No state injection/recall/forced finish;300s observer asserts failure. First-ball aim/over is natural collection, not a full-game win.',sources,summary,exact,neighbors,timing},null,2));
console.log(JSON.stringify({summary,exact:exact.map(({events,...r})=>r),worst:rows.slice().sort((a,b)=>b.maxNoHit-a.maxNoHit).slice(0,5)}));
assert.ok([...exact,...rows].every(r=>r.natural),'observation ceiling or incomplete collection; inspect saved report, never force finish');
exact.forEach((r,i)=>{assert.ok(r.maxNoHit<originals[i].limit);assert.equal(r.phase,'won');});
assert.equal(summary.over20,0,'neighbor route regressed to20s without hits');
