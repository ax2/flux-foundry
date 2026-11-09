import {test} from 'node:test';import assert from 'node:assert/strict';
import {Game,STEP,GRAVITY} from '../src/game';import {advanceFree} from '../src/physics';import {airStrength} from '../src/air';
import {guidedRebound,forecastRebound,GUIDE_TILT_STEP} from '../src/paddle-assist';
import {steer} from '../scripts/paddle-policy';import {runEdgeRoute} from '../scripts/edge-route';
import {readFileSync} from 'node:fs';

for(const cadence of [18,36] as const)test(`right-edge case cadence${cadence} keeps gaps below12s and finishes through legal natural continuation`,()=>{
 const r=runEdgeRoute(cadence);assert.equal(r.result,'won');assert.equal(r.stars,3);assert.ok(r.used<=r.par);assert.ok(r.maxNoHit<12);assert.equal(r.shots[0].phase,'aim');
});
test('early edge preparation changes the visible paddle while the original midair ball follows free forces',()=>{
 const g=new Game(8148,11);g.selectBall('steel','standard');g.angle=2.478263495133118;g.fire();const ball=g.balls[0];let found=false;
 for(let step=0;g.phase==='volley'&&step<6000;step++){
  if(step%18===0)steer(g,'steer');
  const eligible=g.progress.sinceHit>=8&&g.progress.catchesWithoutHit===2&&g.targets.length>2,before={...ball},paddle={...g.paddle},hits=g.stats.hits,catches=g.stats.paddleHits,energy=g.stats.energy,spec=g.spec;
  let ax=0,ay=GRAVITY;for(const z of g.air){const strength=airStrength(z,before);ax+=z.fx*spec.windResponse*strength*g.windMultiplier;ay+=z.fy*spec.windResponse*strength*g.windMultiplier;}
  g.update(STEP);
  if(eligible&&g.paddle.tilt!==paddle.tilt&&g.stats.hits===hits&&g.stats.paddleHits===catches){
   assert.equal(g.balls[0],ball);assert.ok(Math.hypot(before.vx,before.vy)*STEP<before.r*.4);
   const expected={...before};advanceFree(expected,STEP,ax,ay);for(const key of ['x','y','vx','vy','r'] as const)assert.ok(Math.abs(ball[key]-expected[key])<1e-8,key);
   assert.equal(g.stats.energy,energy);assert.ok(Math.abs((g.paddle.tilt||0)-(paddle.tilt||0))<=GUIDE_TILT_STEP+1e-9);assert.ok((g.paddle.boost||0)<=40000);found=true;break;
  }
 }
 assert.ok(found,'a real earlier qualifying preparation must occur');
});
test('a closest forecast miss before the original fallback cannot adjust the paddle',()=>{
 // Explicit collision/lifecycle unit fixture, not a certified whole-game route.
 const g=new Game(1,0);g.fire();Object.assign(g.balls[0],{x:380,y:520,vx:0,vy:300});Object.assign(g.paddle,{x:350,target:350,tilt:.08,boost:28000});g.air=[];g.pegs=[];g.rails=[];
 g.gates=[{x:210,y:420,size:400,open:false}];g.targets=[240,290,340].map((y,id)=>({x:70,y,id,kind:'steel',size:40,hp:2,maxHp:2,flash:0}));g.progress.sinceHit=9;g.progress.catchesWithoutHit=2;
 const s=g.spec,e={air:g.air,gates:g.gates,pegs:g.pegs,wind:g.windMultiplier,response:s.windResponse,energyLimit:g.energyCapacity};
 assert.equal(forecastRebound(g.balls[0],g.paddle,g.targets,s.mass,g.restitution,g.time,e,.08,false,28000).hit,false);assert.equal(guidedRebound(g.balls[0],g.paddle,g.targets,s.mass,g.restitution,g.time,e).hit,false);
 g.update(STEP);assert.equal(g.paddle.tilt,.08);assert.equal(g.paddle.boost,28000);assert.equal(g.stats.paddleHits,0);
});
test('an already useful ordinary catch retains the published natural one-ball win',()=>{
 const g=new Game(1004,4);g.selectBall('ceramic','large');g.angle=2.59;g.fire();const ball=g.balls[0];let step=0;
 while(g.phase==='volley'&&step<300/STEP){if(step%14===0)steer(g,'steer');g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
 assert.equal(g.phase,'won');assert.ok(ball.y-ball.r>=692);assert.equal(g.shots,1);assert.equal(g.stars,3);assert.ok(g.progress.maxNoHit<=10.666666666666702+1e-8);
});
test('all eight changed first-win samples have exact same-first-input natural three-star continuations',()=>{
 const {routes}=JSON.parse(readFileSync(new URL('./fixtures/edge-continuations.json',import.meta.url),'utf8'));assert.equal(routes.length,8);assert.equal(new Set(routes.map((r:any)=>r.matrix+'/'+r.index)).size,8);
 for(const r of routes){
  assert.ok([14,18,36].includes(r.cadence));assert.ok(['follow','steer'].includes(r.policy));assert.equal(r.moves[0].angle,r.angle);assert.equal(r.moves[0].material,r.material);assert.equal(r.moves[0].size,r.size);
  const g=new Game(r.actualSeed,r.level-1);if(r.mirror)g.mirror();
  for(const m of r.moves){
   assert.deepEqual(Object.keys(m).sort(),['angle','material','size','steps']);assert.ok(m.angle>=.16&&m.angle<=Math.PI-.16);assert.ok(Number.isInteger(m.steps)&&m.steps>0);assert.ok(g.selectBall(m.material,m.size));g.angle=m.angle;assert.ok(g.fire());const ball=g.balls[0];
   for(let step=0;step<m.steps;step++){assert.equal(g.phase,'volley','never retime an unfinished ball');if(step%r.cadence===0)steer(g,r.policy);g.update(STEP);if(g.phase==='volley')assert.equal(g.balls[0],ball);}
   assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);assert.equal(g.balls.length,0);
  }
  assert.equal(g.phase,'won');assert.equal(g.stars,3);assert.equal(g.shots,r.used);assert.ok(g.shots<=g.level.par);assert.ok(g.progress.maxNoHit<20);
 }
});
