import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game as Baseline,STEP} from '../src/game';
import {Game} from './stage53-game-narrow';
import {steer} from '../scripts/paddle-policy';
const rows=[];
for(const seed of [42,739,2217]){
 const a=new Baseline(seed), b=new Game(seed);
 let firstCatch, firstHit, firstChange, count;
 while(a.phase==='aim'&&!firstHit){
  for(const g of [a,b]){assert.ok(g.selectBall('steel','large'));const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());}
  for(let step=0;b.phase==='volley'&&step<900/STEP;step++){
   if(step%14===0){steer(a,'follow');steer(b,'follow');}
   const priorHits=b.stats.hits, priorCatches=b.stats.paddleHits;
   const priorTargets=b.targets.map(({id,kind,power,motion,hp})=>({id,kind,power,moving:!!motion,hp}));
   a.update(STEP);b.update(STEP);
   if(!firstChange&&(a.paddle.tilt!==b.paddle.tilt||a.paddle.boost!==b.paddle.boost)){
    firstChange={time:b.time,shot:b.shots,wave:b.wave,oldTilt:a.paddle.tilt,newTilt:b.paddle.tilt};
    assert.equal(b.shots,2);assert.equal(b.wave,2);
    assert.equal(a.stats.hits,b.stats.hits);assert.deepEqual(a.balls,b.balls);
   }
   if(!firstChange)continue;
   if(!firstCatch&&b.stats.paddleHits>priorCatches){
    assert.equal(priorCatches,a.stats.paddleHits-1);
    firstCatch={time:b.time,gap:b.progress.sinceHit,tilt:b.paddle.tilt,oldPaddle:{...a.paddle},ball:{...b.balls[0]}};
    count=priorCatches+1;
   }
   if(firstCatch&&b.stats.hits>priorHits){
    assert.equal(count,b.stats.paddleHits);
    firstHit={time:b.time,afterCatch:b.time-firstCatch.time,targets:priorTargets.flatMap(t=>{
     const hp=b.targets.find(next=>next.id===t.id)?.hp??0;
     return hp===t.hp?[]:[{...t,after:hp}];
    })};
    assert.ok(firstHit.afterCatch<.45);
    assert.ok(firstHit.targets.length>0&&firstHit.targets.every(t=>t.after===t.hp-1));
    break;
   }
  }
 }
 assert.ok(firstChange&&firstCatch&&firstHit);
 rows.push({seed,firstChange,firstCatch,firstHit});
}
writeFileSync('test-results/stage53-contact.json','[\n'+rows.map(r=>JSON.stringify(r)).join(',\n')+'\n]\n');
for(const {seed,firstCatch,firstHit} of rows)console.log(JSON.stringify({seed,delay:firstHit.afterCatch,tilt:firstCatch.tilt,targets:firstHit.targets}));
