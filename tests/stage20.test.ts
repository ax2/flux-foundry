import {test} from 'node:test';import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
import {Game,STEP,GRAVITY} from '../src/game';import {guidedRebound,forecastRebound} from '../src/paddle-assist';import {steer} from '../scripts/paddle-policy';

test('an actual low moving-block miss has a read-only lower-work hit inside the same mechanical range',async()=>{
 const cases=JSON.parse(await readFile('docs/iterations/Stage-20/residual-before.json','utf8')),x=cases[0].events.find((e:any)=>e.type==='catch').lastPlan.input;
 const snapshot=JSON.stringify(x),original=guidedRebound(x.ball,x.p,x.targets,x.mass,x.restitution,x.time,{...x.environment,allowLowerWork:false},x.maxTilt),plan=guidedRebound(x.ball,x.p,x.targets,x.mass,x.restitution,x.time,x.environment,x.maxTilt);
 assert.equal(original.hit,false);assert.ok(plan.hit);assert.ok(plan.boost>=0&&plan.boost<=18000);assert.ok(Math.abs(plan.tilt-x.p.tilt)<=.32+1e-9);assert.equal(JSON.stringify(x),snapshot);
 assert.ok(forecastRebound(x.ball,x.p,x.targets,x.mass,x.restitution,x.time,x.environment,plan.tilt,false,plan.boost).hit);
});

test('grown heavy ball capacity only helps an established height-limited endgame and never injects work by itself',()=>{
 const g=new Game(1);g.selectBall('brass','large');g.fire();g.targets=[{id:0,x:300,y:350,size:48,kind:'diamond',hp:4,maxHp:4,flash:0}];
 const b=g.balls[0];g.collectTreasure({id:1,x:210,y:300,r:14,kind:'slow',life:12});assert.equal(g.energyCapacity,240000);
 g.progress.sinceHit=4;g.progress.catchesWithoutHit=1;assert.equal(g.energyCapacity,240000);g.progress.catchesWithoutHit=2;
 const before={...b};assert.ok(g.energyCapacity>240000&&g.energyCapacity<600000);assert.deepEqual(b,before);
 Object.assign(b,{x:210,y:650,vx:0,vy:-300});const mass=g.spec.mass,energy=.5*mass*b.vy*b.vy;assert.ok(energy>240000);g.energize(b,{x:0,y:-1},40000);
 assert.ok(Math.abs(g.stats.energy-40000)<1e-8);assert.ok(Math.abs(.5*mass*b.vy*b.vy-energy-40000)<1e-7);
 g.targets[0].y=630;assert.equal(g.energyCapacity,240000);g.targets[0].y=350;g.damage(g.targets[0]);assert.equal(g.energyCapacity,240000);
});

test('growth expiry restores ordinary capacity without deleting a ball or trimming its existing velocity',()=>{
 const g=new Game(1);g.selectBall('brass','large');g.fire();g.air=[];g.pegs=[];g.targets=[{id:0,x:300,y:350,size:48,kind:'diamond',hp:4,maxHp:4,flash:0}];
 g.collectTreasure({id:1,x:210,y:300,r:14,kind:'slow',life:12});const b=g.balls[0];Object.assign(b,{x:210,y:650,vx:10,vy:-500});g.progress.sinceHit=5;g.progress.catchesWithoutHit=2;assert.ok(g.energyCapacity>240000);g.bigTime=STEP;g.update(STEP);
 assert.equal(g.energyCapacity,240000);assert.equal(g.balls[0],b);assert.equal(b.r,16);assert.equal(b.vx,10);assert.ok(Math.abs(b.vy-(-500+GRAVITY*STEP))<1e-9);
});

for(const c of [{level:12,material:'steel',size:'standard',mirror:true,cadence:16,limit:13,shots:2},{level:13,material:'brass',size:'large',mirror:false,cadence:14,limit:16,shots:3}] as const)test(`natural whole level ${c.level+1} keeps its three stars and shortens the archived19.5s interval`,()=>{
 const g=new Game(1000+c.level,c.level);if(c.mirror)g.mirror();
 while(g.phase==='aim'){
  g.selectBall(c.material,c.size);const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(c.level===12&&g.shots===0)g.angle=2.59;else g.aim(t.x,t.y);assert.ok(g.fire());const b=g.balls[0];let n=0;
  while(g.phase==='volley'&&n<600/STEP){if(n%c.cadence===0)steer(g,'steer');g.update(STEP);n++;if(g.phase==='volley')assert.equal(g.balls[0],b);}
  assert.notEqual(g.phase,'volley');assert.ok(b.y-b.r>=692);
 }
 assert.equal(g.phase,'won');assert.equal(g.stars,3);assert.equal(g.shots,c.shots);assert.ok(g.progress.maxNoHit<c.limit);
});
