import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import {airStrength} from '../src/air';
const game=new Game(7429);
const shots=[];
let peak={gap:0,shot:0,time:0}, window=[], trace=[], oldHits=0, oldCatches=0, oldEnergy=0;
while(game.phase==='aim'){
 assert.ok(game.selectBall('steel','large'));
 const target=game.targets.slice().sort((a,b)=>a.hp-b.hp)[0];
 game.aim(target.x,target.y);assert.ok(game.fire());
 const original=game.balls[0];
 let step=0,shotGap=0;const hitsBefore=game.stats.hits;
 while(game.phase==='volley'&&step<900/STEP){
  if(game.stats.hits!==oldHits)trace=[];
  if(step%14===0)steer(game,'steer');
  game.update(STEP);step++;shotGap=Math.max(shotGap,game.progress.sinceHit);
  if(game.phase==='volley')assert.equal(game.balls[0],original);
  if(game.progress.maxNoHit>peak.gap){peak={gap:game.progress.maxNoHit,shot:game.shots,time:game.time};window=[...trace];}
  if(game.stats.hits!==oldHits)trace=[];
  if(step%14===0||game.stats.hits!==oldHits||game.stats.paddleHits!==oldCatches||game.stats.energy!==oldEnergy){
   const snapshot={time:game.time,shot:game.shots,wave:game.wave,gap:game.progress.sinceHit,ball:{...original},paddle:{...game.paddle},hits:game.stats.hits,catches:game.stats.paddleHits,energy:game.stats.energy,targets:game.targets.map(({x,y,hp,id,kind,power})=>({x,y,hp,id,kind,power})),flow:game.air.map(zone=>({strength:airStrength(zone,original),...zone}))};
   trace.push(snapshot);

  }

  if(game.shots===12&&game.time>=860&&game.time<=863&&(game.stats.hits!==oldHits||game.stats.paddleHits!==oldCatches))console.log(JSON.stringify({time:game.time,gap:game.progress.sinceHit,hits:game.stats.hits,catches:game.stats.paddleHits,ball:original,targets:game.targets.map(t=>[t.id,t.hp])}));
  oldHits=game.stats.hits;oldCatches=game.stats.paddleHits;oldEnergy=game.stats.energy;
 }
 assert.notEqual(game.phase,'volley');
 assert.ok(original.y-original.r>=692);
 shots.push({seconds:step*STEP,wave:game.wave,wholeBallBottom:original.y-original.r,shotGap,hits:game.stats.hits-hitsBefore});
}
assert.equal(game.phase,'over');
assert.equal(game.wave,15);
assert.ok(Math.abs(peak.gap-12.724999999999918)<1e-8);
writeFileSync('test-results/stage34-production-trace.json',JSON.stringify({seed:7429,material:'steel',size:'large',policy:'steer',cadence:14,peak,shots,window},null,2));
const last=window.at(-1);
console.log(JSON.stringify({peak,stage:last.wave,targets:last.targets,catches:last.catches-window[0].catches,flow:last.flow}));
