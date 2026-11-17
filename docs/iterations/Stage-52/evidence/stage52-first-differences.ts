import assert from 'node:assert/strict';
import {writeFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {Game as Trial} from './stage52-game-m0f1mixed';
import {steer} from '../scripts/paddle-policy';
const cases=[[1229,'follow'],[421,'follow'],[934,'follow'],[2217,'follow'],[815,'steer'],[87,'follow'],[87,'steer']] as const;
const rows=[];
for(const [seed,policy] of cases){
 const a=new Game(seed),b=new Trial(seed);
 let change;
 while(a.phase==='aim'&&!change){
  for(const g of [a,b]){assert.ok(g.selectBall('steel','large'));const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());}
  for(let i=0;a.phase==='volley'&&i<900/STEP;i++){
   if(i%14===0){steer(a,policy);steer(b,policy);}
   const ball={...a.balls[0]},paddle={...a.paddle},progress={...a.progress},time=a.time;
   a.update(STEP);b.update(STEP);
   if(a.paddle.tilt!==b.paddle.tilt||a.paddle.boost!==b.paddle.boost){
    change={seed,policy,time,shot:a.shots,wave:a.wave,ball,paddle,progress,a:{...a.paddle},b:{...b.paddle},rails:structuredClone(a.rails),targets:a.targets.map(({kind,power,hp,maxHp,x,y,size,motion})=>({kind,power,hp,maxHp,x,y,size,motion}))};
    break;
   }
  }
 }
 assert.ok(change);
 rows.push(change);
}
writeFileSync('test-results/stage52-first-differences.json','[\n'+rows.map(r=>JSON.stringify(r)).join(',\n')+'\n]\n');
for(const {seed,policy,wave,shot,progress,targets} of rows)console.log(JSON.stringify({seed,policy,wave,shot,gap:progress.sinceHit,targets:targets.map(t=>[t.kind,t.hp,t.power,Math.round(t.x),t.y,Boolean(t.motion)])}));
