import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {guidedTilt} from '../src/paddle-assist';
import {steer} from '../scripts/paddle-policy';
for(const [level,material,size,angle,policy] of [[3,'rubber','standard',Math.PI/2,'steer'],[4,'brass','large',2.59,'follow'],[21,'rubber','large',2.59,'steer']] as const)test(`active ${policy} ${level+1}/${material}/${size} escapes the reproduced no-progress rally`,()=>{
 const g=new Game(1000+level,level);g.selectBall(material,size);g.angle=angle;g.fire();const b=g.balls[0];let step=0;
 while(g.phase==='volley'&&step<300/STEP){if(step%14===0)steer(g,policy);g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],b);}
 assert.notEqual(g.phase,'volley');assert.ok(b.y-b.r>=692);assert.ok(g.progress.maxNoHit<60);assert.ok(g.stats.paddleHits>5);
});
test('face guidance is bounded and reads the ball, controls, and numbered targets without mutating them',()=>{
 const g=new Game(1004,4),ball={x:290,y:560,vx:30,vy:300,r:16},p={...g.paddle,x:290,target:290},before=JSON.stringify([ball,p,g.targets,g.gates,g.air]);
 const tilt=guidedTilt(ball,p,g.targets,2.56,.86,0,{air:g.air,gates:g.gates,pegs:g.pegs,wind:2.4,response:1});assert.ok(Number.isFinite(tilt)&&Math.abs(tilt)<=.32);assert.equal(JSON.stringify([ball,p,g.targets,g.gates,g.air]),before);
});
test('pause freezes no-progress clocks and valid hits reset only the current gap',()=>{
 const g=new Game(1,0);g.fire();g.update(STEP);const before={...g.progress};g.paused=true;g.update(30);assert.deepEqual(g.progress,before);g.paused=false;g.damage(g.targets[0]);assert.equal(g.progress.sinceHit,0);assert.equal(g.progress.catchesWithoutHit,0);assert.equal(g.progress.maxNoHit,before.maxNoHit);
});

test('the stronger rescue charge remains capped and preserves tangential velocity',()=>{
 const g=new Game(1);g.selectBall('brass','large');const mass=g.spec.mass,b={x:210,y:650,vx:120,vy:-Math.sqrt(2*235000/mass-120*120),r:16};g.energize(b,{x:0,y:-1},40000);assert.equal(b.vx,120);assert.ok(Math.abs(.5*mass*(b.vx*b.vx+b.vy*b.vy)-240000)<1e-6);
});
