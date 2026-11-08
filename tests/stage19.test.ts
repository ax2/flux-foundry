import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';import {Game,STEP} from '../src/game';import {forecastRebound,guidedRebound} from '../src/paddle-assist';import {runTouchCase} from '../scripts/touch-case';
import {runVariedResidual} from '../scripts/varied-case';
test('a prepared zero-work paddle contact is not replaced by the default charge',()=>{
 const g=new Game(1);g.selectBall('rubber','large');g.targets=[{id:0,x:310,y:570,kind:'capacitor',size:48,hp:100,maxHp:100,flash:0}];g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:657,vx:0,vy:400});g.paddle.boost=0;g.update(STEP);assert.equal(g.stats.paddleHits,1);assert.equal(g.stats.energy,0);assert.equal(g.stats.boosts,0);assert.ok(Math.abs(b.vy+(400+240*STEP)*.96)<1e-9);assert.equal(g.balls[0],b);
});
test('low cross-flow work search is read-only, staged, bounded, and only replaces a miss with a valid hit',()=>{
 const ball={x:76.81794357778033,y:657.7426465285787,vx:205.5261291733459,vy:494.6949388546523,r:16},p={x:77.34000572791466,target:77.34000572791466,width:96,vx:0,flash:0,tilt:0,boost:18000},targets=[{id:3,x:310,y:570,size:48,kind:'capacitor' as const,hp:3,maxHp:14,flash:0}],env={air:[{x:38,y:355,w:344,h:200,fx:-95,fy:0,plume:true}],gates:[],pegs:[],wind:2.4,response:5};const before=JSON.stringify([ball,p,targets,env]);
 const normal=guidedRebound(ball,p,targets,.15*(16/12)**3,.8,73.3,env,.48),adaptive=guidedRebound(ball,p,targets,.15*(16/12)**3,.8,73.3,{...env,allowLowerWork:true},.48);
 assert.equal(normal.hit,false);assert.ok(adaptive.hit);assert.ok(adaptive.boost>=0&&adaptive.boost<18000);assert.ok(Math.abs(adaptive.tilt-p.tilt)<=.32);assert.equal(JSON.stringify([ball,p,targets,env]),before);
 const weakWind=guidedRebound(ball,p,targets,.15*(16/12)**3,.8,73.3,{...env,wind:.1,allowLowerWork:true},.48),weakDefault=guidedRebound(ball,p,targets,.15*(16/12)**3,.8,73.3,{...env,wind:.1},.48);assert.deepEqual(weakWind,weakDefault);
 const forecast=forecastRebound(ball,p,targets,.15*(16/12)**3,.8,73.3,env,adaptive.tilt,true,adaptive.boost);assert.ok(forecast.hit);assert.equal(forecast.boost,adaptive.boost);
});
test('captured22 touch input and honest legal continuation finish naturally within two shots and16s gaps',async()=>{
 const tape=JSON.parse(await readFile('docs/iterations/Stage-18/inputs-22-rubber.json','utf8')),result=runTouchCase(tape);assert.equal(result.first.phase,'aim');assert.equal(result.first.remaining.length,1);assert.equal(result.first.remaining[0].hp,1);assert.ok(result.first.progress.maxNoHit<16);assert.equal(result.final.phase,'won');assert.equal(result.final.shots,2);assert.equal(result.final.stars,3);assert.ok(result.final.progress.maxNoHit<16);
});
test('changed mirrored first-ball route retains a legal three-star continuation rather than an invented first-ball win',()=>{
 const result=runVariedResidual();assert.equal(result.shots[0].phase,'aim');assert.equal(result.shots[0].hits,29);assert.equal(result.result,'won');assert.equal(result.used,3);assert.equal(result.stars,3);assert.ok(result.gap<16);
});
