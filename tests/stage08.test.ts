import {collectAtBottom} from './collect';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {catchPaddle,sweptPickup} from '../src/arcade';

test('paddle catches through its curved surface and edge offsets steer without a second ball',()=>{
 for(const offset of [-30,0,30]){const p={x:210,target:210,width:96,vx:0,flash:0},previous={x:210+offset,y:650,vx:0,vy:500,r:12},b={...previous,y:672};assert.ok(catchPaddle(b,previous,p,.04));assert.ok(b.vy<0);if(offset)assert.equal(Math.sign(b.vx),Math.sign(offset));else assert.equal(b.vx,0);}
 const g=new Game(8);g.targets=[{id:1,x:80,y:300,size:40,kind:'steel',hp:30,maxHp:30,flash:0}];g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:650,vx:0,vy:600});for(let i=0;i<10;i++)g.update(STEP);assert.equal(g.balls[0],b);assert.equal(g.shots,1);assert.equal(g.stats.paddleHits,1);
});
test('paddle misses naturally and upward passage, completed objectives and safety return are not caught',()=>{
 const g=new Game(8);g.fire();g.movePaddle(350);for(let i=0;i<40;i++)g.update(STEP);const b=g.balls[0];Object.assign(b,{x:40,y:670,vx:0,vy:300});for(let i=0;i<60&&g.phase==='volley';i++)g.update(STEP);assert.notEqual(g.phase,'volley');assert.ok(b.y-b.r>=692);
 const p={x:210,target:210,width:96,vx:0,flash:0},a={x:210,y:650,vx:0,vy:-200,r:12};assert.equal(catchPaddle({...a,y:672},a,p,.1),false);
 const c=new Game(1,0);c.targets=[];c.fire();Object.assign(c.balls[0],{x:210,y:670,vx:0,vy:300});for(let i=0;i<60&&c.phase==='volley';i++)c.update(STEP);assert.equal(c.phase,'won');assert.equal(c.stats.paddleHits,0);
});
test('paddle control is bounded, speed limited and paused with the game',()=>{
 const g=new Game(1);g.fire();g.movePaddle(-1000);const x=g.paddle.x;g.update(STEP);assert.ok(Math.abs(g.paddle.x-x)<=900*STEP+.001);assert.ok(g.paddle.target>=70);g.paused=true;const before={...g.paddle};g.movePaddle(500);g.update(1);assert.deepEqual(g.paddle,before);
});
test('life treasure adds one visible reserve at most three times and does not create an active ball',()=>{
 const g=new Game(3);g.fire();for(let i=0;i<5;i++)g.collectTreasure({id:i,x:100,y:300,r:14,kind:'life',life:12});assert.equal(g.bonusLives,1);assert.equal(g.remainingShots,12);assert.equal(g.balls.length,1);assert.equal(g.count,1);
 for(let i=0;i<3;i++){collectAtBottom(g);g.fire();g.collectTreasure({id:10+i,x:100,y:300,r:14,kind:'life',life:12});}assert.equal(g.bonusLives,3);assert.ok(g.remainingShots<=12);
});
test('wide and slow treasures apply once, renew duration, expire and preserve one-hit damage',()=>{
 const g=new Game(1);g.fire();const b=g.balls[0];Object.assign(b,{vx:100,vy:200});g.collectTreasure({id:1,x:100,y:300,r:14,kind:'wide',life:12});assert.equal(g.paddle.width,144);g.collectTreasure({id:2,x:100,y:300,r:14,kind:'slow',life:12});assert.ok(Math.abs(b.r-16.2)<1e-9);assert.equal(b.vx,70);assert.equal(b.vy,140);g.bigTime=2;g.collectTreasure({id:3,x:100,y:300,r:14,kind:'slow',life:12});assert.ok(Math.abs(b.r-16.2)<1e-9);assert.equal(b.vx,70);assert.equal(g.bigTime,12);const t=g.targets[0],hp=t.hp;g.damage(t);assert.equal(t.hp,hp-1);g.wideTime=STEP;g.bigTime=STEP;g.update(STEP);assert.equal(g.paddle.width,96);assert.equal(b.r,12);
});
test('treasure pickup is swept so a fast ball cannot pass through without applying it',()=>{
 const t={id:1,x:210,y:400,r:14,kind:'wide' as const,life:12},a={x:210,y:350,vx:0,vy:5000,r:12},b={...a,y:450};assert.ok(sweptPickup(a,b,t));const g=new Game(5);g.targets=[];g.fire();g.treasures=[t];Object.assign(g.balls[0],a);g.update(.02);assert.equal(g.stats.pickups,1);assert.equal(g.paddle.width,144);
});
test('moving bricks remain in their rail envelope and mirror their motion',()=>{
 const a=new Game(10,2),b=new Game(10,2);b.mirror();assert.ok(a.targets.some(t=>t.motion));a.fire();b.fire();for(let i=0;i<50;i++){a.update(STEP);b.update(STEP);for(const t of a.targets){const other=b.targets.find(o=>o.id===t.id);if(other)assert.ok(Math.abs(t.x+other.x-420)<1e-6);if(t.motion)assert.ok(Math.abs(t.x-t.motion.baseX)<=Math.abs(t.motion.amplitude)+1e-6);}}
});
test('treasures expire without deleting a live ball and winds are stronger than the previous version',()=>{
 const g=new Game(1);assert.equal(g.windMultiplier,2.4);g.targets=[];g.fire();g.air=[{x:0,y:0,w:420,h:720,fx:0,fy:-100}];Object.assign(g.balls[0],{x:210,y:300,vx:30,vy:0});const b=g.balls[0];g.treasures=[{id:1,x:80,y:400,r:14,kind:'wide',life:STEP/2}];g.update(STEP);assert.equal(g.treasures.length,0);assert.equal(g.balls[0],b);
});

test('losing a marble clears temporary treasures and effects before the next aim',()=>{
 const g=new Game(1);g.fire();g.collectTreasure({id:1,x:100,y:300,r:14,kind:'wide',life:12});g.collectTreasure({id:2,x:100,y:300,r:14,kind:'slow',life:12});g.treasures=[{id:3,x:100,y:300,r:14,kind:'wide',life:12}];collectAtBottom(g);assert.equal(g.phase,'aim');assert.equal(g.paddle.width,96);assert.equal(g.wideTime,0);assert.equal(g.bigTime,0);assert.equal(g.treasures.length,0);assert.equal(g.ballScale,1);
});
