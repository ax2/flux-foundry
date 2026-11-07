import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {catchPaddle,PADDLE_Y} from '../src/arcade';
test('the reproduced idle centre-paddle loop makes progress and naturally collects without a catch quota',()=>{
 const g=new Game(800,0);g.selectBall('steel','standard');g.fire();const b=g.balls[0];
 for(let i=0;i<180/STEP&&g.phase==='volley';i++){g.update(STEP);if(g.phase==='volley')assert.equal(g.balls[0],b);}
 assert.notEqual(g.phase,'volley');assert.ok(b.y-b.r>=692);assert.ok(g.stats.hits>6);assert.ok(g.stats.orbitBreaks>0);assert.ok(g.stats.paddleHits>5);
});
test('productive rallies keep catching beyond any proposed quota and reset repetition detection on damage',()=>{
 const g=new Game(1);g.targets=[{id:0,x:210,y:400,size:180,kind:'bar',hp:10000,maxHp:10000,flash:0}];g.fire();Object.assign(g.balls[0],{x:210,y:500,vx:0,vy:250});
 for(let i=0;i<120/STEP;i++)g.update(STEP);
 assert.equal(g.phase,'volley');assert.ok(g.stats.paddleHits>20);assert.ok(g.stats.hits>20);assert.equal(g.stats.orbitBreaks,0);assert.equal(g.paddle.tilt,0);
});
test('a tilted paddle steers through its surface normal without increasing passive kinetic energy',()=>{
 for(const tilt of [-.18,.18]){const b={x:210,y:PADDLE_Y-12+.5,vx:0,vy:400,r:12},previous={...b,y:b.y-2};assert.ok(catchPaddle(b,previous,{x:210,target:210,width:96,vx:0,flash:0,tilt},STEP));assert.equal(Math.sign(b.vx),Math.sign(tilt));assert.ok(b.vx*b.vx+b.vy*b.vy<=400*400);}
});
