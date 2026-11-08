import {test} from 'node:test';import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';import {steer} from '../scripts/paddle-policy';
test('peg retraction counts separated contacts across the cylinder, preserves the ball, and restores after full opposite crossing',()=>{
 const g=new Game(1020,20);g.fire();const b=g.balls[0],p=g.pegs[0];g.progress.sinceHit=9;
 Object.assign(b,{x:p.x-12,y:p.y-35,vx:11,vy:-250});const hp=g.targets.map(t=>t.hp);
 g.time=10;g.pegContact(p,b);g.time=10.1;g.pegContact(p,b);assert.equal(p.pressure,1);
 b.x=p.x+20;g.time=11;g.pegContact(p,b);b.x=p.x-20;g.time=12;const state={...b};g.pegContact(p,b);
 assert.equal(p.retractedFrom,'above');assert.equal(g.stats.pegRetractions,1);assert.equal(g.balls[0],b);assert.deepEqual(b,state);assert.deepEqual(g.targets.map(t=>t.hp),hp);assert.equal(g.safetyReturn,false);
 b.y=p.y+p.r+b.r+2;g.closePassedVents(b);assert.equal(p.retractedFrom,'above');b.y++;b.y++;g.closePassedVents(b);assert.equal(p.retractedFrom,undefined);
 p.retractedFrom='below';b.y=p.y-p.r-b.r-2;g.closePassedVents(b);assert.equal(p.retractedFrom,'below');b.y-=2;g.closePassedVents(b);assert.equal(p.retractedFrom,undefined);
});
test('peg relief needs real contacts without hits, does not run while paused, and clears pressure after valid damage',()=>{
 const g=new Game(1020,20);g.fire();const p=g.pegs[0],b=g.balls[0];g.progress.sinceHit=7;
 for(let i=0;i<3;i++){g.time=i;g.pegContact(p,b);}assert.equal(p.retractedFrom,undefined);
 g.damage(g.targets[0]);assert.equal(p.pressure,0);g.progress.sinceHit=20;g.paused=true;const before=structuredClone({p,b,progress:g.progress,time:g.time});g.update(STEP);assert.deepEqual({p,b,progress:g.progress,time:g.time},before);
 g.paused=false;g.time+=1;g.pegContact(p,b);assert.equal(p.retractedFrom,undefined);p.retractedFrom='above';g.resetGatePressure();assert.equal(p.retractedFrom,undefined);assert.equal(p.pressure,0);
});
for(const [level,material,size,angle,limit] of [[9,'brass','small',2.59,12],[20,'ceramic','large',Math.PI/2,18]] as const)test(`original no-hit first-ball route ${level+1} stays below ${limit}s and collects naturally`,()=>{
 const g=new Game(1000+level,level);g.selectBall(material,size);g.angle=angle;g.fire();const b=g.balls[0];let step=0;
 while(g.phase==='volley'&&step<300/STEP){if(step%14===0)steer(g,'follow');g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],b);}
 assert.notEqual(g.phase,'volley');assert.ok(b.y-b.r>=692);assert.ok(g.progress.maxNoHit<limit,`No-hit ${g.progress.maxNoHit}s`);if(level===20)assert.equal(g.phase,'won');
});
