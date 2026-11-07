import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
test('open bottom naturally collects every size without automatic rebound',()=>{
 for(const size of ['small','standard','large'] as const){const g=new Game(1);g.targets=[];g.rails=[];g.selectBall('steel',size);g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:680,vx:0,vy:300});for(let i=0;i<60&&g.phase==='volley';i++)g.update(STEP);assert.equal(g.balls.length,0);assert.ok(b.y-b.r>=692);assert.equal(g.stats.rebounds,0);}
});
test('directed pulse can steer left and right without extra damage or marbles',()=>{
 for(const side of [-1,1]){const g=new Game(1);g.targets=[];g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:400,vx:0,vy:0});assert.ok(g.pulse(210+side*100,400));for(let i=0;i<38;i++)g.update(STEP);assert.ok(b.vx*side>250);assert.equal(g.shots,1);assert.equal(g.stats.hits,0);assert.equal(g.balls[0],b);assert.equal(g.pulseCharges,1);}
});
test('eight effective hits recharge at most twice and new ball resets capacity',()=>{
 const g=new Game(1);g.fire();const t=g.targets[0];t.hp=100;
 for(let cycle=0;cycle<2;cycle++){g.pulseCharges=0;for(let i=0;i<7;i++)g.damage(t);assert.equal(g.pulseCharges,0);g.damage(t);assert.equal(g.pulseCharges,1);}
 g.pulseCharges=0;for(let i=0;i<50;i++)g.damage(t);assert.equal(g.pulseCharges,0);g.recall();g.fire();assert.equal(g.pulseCharges,2);
});
test('each upgrade measurably changes universal control or energy retention',()=>{
 const g=new Game(1);g.selectBall('rubber','standard');const r=g.restitution;g.phase='upgrade';g.upgrade('elastic');assert.ok(g.restitution-r>.07);
 g.phase='upgrade';g.upgrade('magnet');g.fire();assert.equal(g.pulseCharges,3);g.recall();g.phase='upgrade';g.upgrade('field');g.fire();g.pulse();assert.equal(g.liftEnergy,90000);
});
