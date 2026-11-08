import {test} from 'node:test';import assert from 'node:assert/strict';import {Game,STEP} from '../src/game';import {steer} from '../scripts/paddle-policy';import {guidedRebound} from '../src/paddle-assist';
for(const sparse of [false,true])test(`prepare the qualifying ${sparse?'second sparse':'fourth regular'} catch before contact without moving the ball`,()=>{
 const g=new Game(1);g.selectBall('brass','large');g.targets=Array.from({length:sparse?1:3},(_,id)=>({id,x:180+id*70,y:400,kind:'bar',size:48,hp:100,maxHp:100,flash:0}));g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:570,vx:0,vy:250});g.progress.sinceHit=sparse?5:9;g.progress.catchesWithoutHit=sparse?1:3;
 g.update(STEP);assert.ok((g.paddle.boost||0)>18000);assert.equal(g.stats.paddleHits,0);assert.equal(g.progress.catchesWithoutHit,sparse?1:3);assert.equal(g.balls[0],b);assert.equal(b.vx,0);assert.ok(Math.abs(b.vy-(250+240*STEP))<1e-8);assert.equal(g.stats.energy,0);assert.ok(g.targets.every(t=>t.hp===100));
});
test('ordinary catches below the existing assistance threshold keep the unassisted face',()=>{
 const g=new Game(1);g.targets=Array.from({length:3},(_,id)=>({id,x:100+id*80,y:340,kind:'bar',size:48,hp:100,maxHp:100,flash:0}));g.fire();Object.assign(g.balls[0],{x:210,y:570,vx:0,vy:250});g.progress.sinceHit=9;g.progress.catchesWithoutHit=2;g.update(STEP);assert.equal(g.paddle.boost,18000);assert.equal(g.paddle.tilt,0);assert.equal(g.stats.paddleHits,0);
});
for(const [level,seed,material,size,angle,policy,cadence,limit] of [[15,1015,'steel','standard',.55,'steer',14,14],[14,1014,'brass','standard',.55,'follow',14,16],[11,8148,'steel','standard',2.478263495133118,'steer',18,20]] as const)test(`official first-ball ${level+1}/${seed} keeps progressing and naturally collects`,()=>{
 const g=new Game(seed,level);g.selectBall(material,size);g.angle=angle;g.fire();const ball=g.balls[0];let step=0;
 while(g.phase==='volley'&&step<300/STEP){if(step%cadence===0)steer(g,policy);g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
 assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);assert.ok(g.progress.maxNoHit<limit,`no hit ${g.progress.maxNoHit}s`);if(level===15)assert.equal(g.phase,'won');
});

test('an early closest-miss forecast leaves the face alone until the existing fallback becomes due',()=>{
 const g=new Game(1);g.selectBall('brass','large');g.targets=Array.from({length:3},(_,id)=>({id,x:210+id*50,y:340,kind:'bar',size:48,hp:100,maxHp:100,flash:0}));g.fire();Object.assign(g.balls[0],{x:210,y:570,vx:0,vy:250});g.progress.sinceHit=9;g.progress.catchesWithoutHit=3;g.update(STEP);assert.equal(g.paddle.boost,18000);assert.equal(g.paddle.tilt,0);
 g.progress.catchesWithoutHit=4;g.update(STEP*12);assert.ok((g.paddle.boost||0)>18000);assert.equal(g.stats.paddleHits,0);assert.equal(g.stats.energy,0);
});
test('mirrored moving-block route that rejected unconditional early steering stays under20s',()=>{
 const g=new Game(1012,12);g.mirror();
 while(g.phase==='aim'){
  g.selectBall('steel','standard');const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(!g.shots)g.angle=2.59;else g.aim(t.x,t.y);g.fire();const ball=g.balls[0];let step=0;
  while(g.phase==='volley'&&step<600/STEP){if(step%16===0)steer(g,'steer');g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
  assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);
 }
 assert.equal(g.phase,'won');assert.ok(g.progress.maxNoHit<20);
});
for(const tilt of [-.48,.48])test(`forecast uses a mechanically reachable face from slope ${tilt}`,()=>{
 const ball={x:210,y:620,vx:0,vy:400,r:16},p={x:210,target:210,width:96,vx:0,flash:0,tilt,boost:18000},targets=[{id:0,x:tilt>0?110:310,y:570,kind:'capacitor' as const,size:48,hp:4,maxHp:4,flash:0}],e={air:[],gates:[],pegs:[],wind:2.4,response:1};const before=JSON.stringify([ball,p,targets,e]);
 const plan=guidedRebound(ball,p,targets,.355,.8,0,e,.48);assert.ok(Math.abs(plan.tilt-tilt)<=.32+1e-12);assert.ok(Math.abs(plan.tilt)<=.48);assert.equal(JSON.stringify([ball,p,targets,e]),before);
});
