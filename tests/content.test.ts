import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP,GRAVITY} from '../src/game';
import {MATERIALS,SIZES,LEVELS,ballProperties,type Material,type BallSize} from '../src/content';
const materials=Object.keys(MATERIALS) as Material[],sizes=Object.keys(SIZES) as BallSize[];
test('all twelve combinations use the same launch energy and real collision radius',()=>{
 for(const m of materials)for(const s of sizes){const g=new Game(1);assert.ok(g.selectBall(m,s));g.fire();const b=g.balls[0];assert.equal(b.r,SIZES[s].radius);assert.ok(Math.abs(.5*g.spec.mass*(b.vx*b.vx+b.vy*b.vy)-61250)<1e-8);assert.equal(g.balls.length,1);assert.equal(g.power,1);}
});
test('mass scales with volume and lighter balls do not fall faster',()=>{
 assert.ok(Math.abs(ballProperties('steel','large').mass/ballProperties('steel','small').mass-(16/9)**3)<1e-10);
 for(const m of materials){const g=new Game(1);g.selectBall(m,'standard');g.targets=[];g.fire();Object.assign(g.balls[0],{x:210,y:300,vx:0,vy:0});g.update(STEP);assert.ok(Math.abs(g.balls[0].vy-GRAVITY*STEP)<1e-10);}
});
test('materials change normal energy retention without changing tangent velocity',()=>{
 for(const m of materials){const g=new Game(1);g.selectBall(m,'standard');g.targets=[];g.fire();Object.assign(g.balls[0],{x:390,y:300,vx:200,vy:30});g.update(STEP);assert.ok(Math.abs(g.balls[0].vx+200*MATERIALS[m].restitution)<1e-8);assert.ok(Math.abs(g.balls[0].vy-32)<1e-8);}
});
test('loadout cannot change in flight and nonmagnetic balls cannot spend a magnetic charge',()=>{
 for(const m of materials){const g=new Game(1);g.selectBall(m,'large');g.fire();assert.equal(g.selectBall('steel','small'),false);assert.equal(g.material,m);assert.equal(g.size,'large');assert.equal(g.field(210,400),m==='steel');assert.equal(g.magnetUsed,m==='steel');}
});
test('air is a continuous local force and lighter balls respond more',()=>{
 const speeds:number[]=[];for(const m of ['brass','rubber'] as const){const g=new Game(1);g.selectBall(m,'standard');g.targets=[];g.air=[{x:100,y:280,w:200,h:100,fx:50,fy:0}];g.fire();Object.assign(g.balls[0],{x:200,y:300,vx:0,vy:0});g.update(STEP);assert.ok(Math.abs(g.balls[0].vx-50*g.spec.windResponse*STEP)<1e-8);speeds.push(g.balls[0].vx);Object.assign(g.balls[0],{x:50,y:300,vx:0,vy:0});g.update(STEP);assert.equal(g.balls[0].vx,0);}assert.ok(speeds[1]>speeds[0]*5);
});
test('passive pegs reflect without damage, scoring, or extra energy',()=>{
 const g=new Game(1);g.targets=[];g.pegs=[{x:210,y:400,r:20}];g.fire();Object.assign(g.balls[0],{x:210,y:366,vx:0,vy:400});g.update(STEP);assert.ok(g.balls[0].vy<0);assert.ok(Math.abs(g.balls[0].vy)<402);assert.equal(g.score,0);assert.equal(g.combo,0);
});
test('challenge layouts are isolated and remain fixed across shots',()=>{
 const g=new Game(1,4),other=new Game(1,4),original=JSON.stringify(other.targets);g.fire();g.recall();assert.equal(JSON.stringify(g.targets),original);assert.equal(g.remainingShots,LEVELS[4].shots-1);g.targets[0].hp=0;g.air[0].fx=999;assert.equal(JSON.stringify(other.targets),original);assert.equal(LEVELS[4].air[0].fx,65);
});
test('clearing the final target does not delete the ball; collection awards a win',()=>{
 const g=new Game(1,0);g.fire();const b=g.balls[0];g.targets=[];g.update(STEP);assert.equal(g.phase,'volley');assert.equal(g.balls[0],b);Object.assign(b,{x:210,y:710,vx:0,vy:10});g.update(STEP);assert.equal(g.phase,'won');assert.equal(g.stars,3);assert.equal(g.fire(),false);
});
test('shot budgets include manual recall and permit a final-shot win',()=>{
 const g=new Game(1,0);for(let i=0;i<g.level.shots-1;i++){g.fire();g.recall();}g.fire();assert.equal(g.remainingShots,0);assert.equal(g.phase,'volley');g.targets=[];g.recall();assert.equal(g.phase,'won');assert.equal(g.stars,1);
 const failed=new Game(1,0);for(let i=0;i<failed.level.shots;i++){failed.fire();failed.recall();}assert.equal(failed.phase,'over');assert.equal(failed.stars,0);assert.equal(failed.fire(),false);
});
test('star tiers reflect shot efficiency',()=>{
 const g=new Game(1,11);g.phase='won';for(const [shots,stars] of [[3,3],[4,2],[5,2],[6,1]]){g.shots=shots;assert.equal(g.stars,stars);}
});
test('endless mode introduces mechanisms without overlapping the initial danger line',()=>{
 const g=new Game(1);g.wave=4;g.setEndlessMechanisms();assert.equal(g.pegs.length,1);assert.equal(g.air.length,0);g.wave=6;g.setEndlessMechanisms();assert.equal(g.air.length,1);assert.ok(g.pegs[0].y-g.pegs[0].r>184);
});
