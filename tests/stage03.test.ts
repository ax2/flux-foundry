import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {collide,vertices,type Target} from '../src/physics';
import {LEVELS,dailyTrial} from '../src/content';
const block=(kind:Target['kind'],hp=100):Target=>({id:1,x:210,y:400,size:48,kind,hp,maxHp:hp,flash:0});
test('new convex shapes reflect along their actual edges without adding passive energy',()=>{
 for(const kind of ['diamond','hexagon','bar'] as const){const t=block(kind),y=kind==='bar'?383:365,b={x:210,y,vx:30,vy:400,r:12},before=b.vx*b.vx+b.vy*b.vy;assert.ok(collide(b,t,.94),kind);assert.ok(b.vx*b.vx+b.vy*b.vy<=before+.001);assert.ok(vertices(t).length>=4);}
});
test('powered impacts add a bounded amount of normal energy and preserve tangent motion',()=>{
 const g=new Game(1),b={x:210,y:300,r:12,vx:120,vy:-200};const before=.5*g.spec.mass*(b.vx*b.vx+b.vy*b.vy);g.energize(b,{x:0,y:-1});assert.equal(b.vx,120);assert.ok(Math.abs(.5*g.spec.mass*(b.vx*b.vx+b.vy*b.vy)-before-22000)<1e-6);assert.equal(g.stats.boosts,1);
 Object.assign(b,{vx:1000,vy:-1000});g.energize(b,{x:0,y:-1});assert.equal(b.vy,-1000);assert.equal(g.stats.boosts,1);
});
test('a spring collision subtracts one durability and visibly transfers energy',()=>{
 const g=new Game(1);g.targets=[{...block('hexagon',8),power:'spring'}];g.fire();Object.assign(g.balls[0],{x:210,y:362,vx:0,vy:400});for(let i=0;i<3;i++)g.update(STEP);assert.equal(g.targets[0].hp,7);assert.equal(g.stats.boosts,1);assert.ok(g.balls[0].vy<0);assert.ok(g.effects.length>0);
});
test('resting balls receive explicit assistance and collect at the bottom without teleporting',()=>{
 const g=new Game(1);g.targets=[{...block('bar',10000),size:400}];g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:338,vx:0,vy:0});let sawReturn=false;
 for(let i=0;i<100/STEP&&g.phase==='volley';i++){g.update(STEP);if(g.safetyReturn){sawReturn=true;assert.equal(g.balls[0],b);}if(g.phase==='volley')assert.equal(g.balls[0],b);else assert.ok(b.y-b.r>=692);}
 assert.notEqual(g.phase,'volley');assert.equal(g.stats.rescues,2);assert.ok(sawReturn);assert.equal(g.stats.returns,1);assert.equal(g.shots,1);assert.ok(g.targets[0].hp>9900);
});
test('the free-flight apex is not treated as a stuck ball',()=>{
 const g=new Game(1);g.targets=[];g.fire();Object.assign(g.balls[0],{x:200,y:400,vx:0,vy:-80});for(let i=0;i<100;i++)g.update(STEP);assert.equal(g.stats.rescues,0);assert.equal(g.safetyReturn,false);
});
test('fixed reserves can be reordered but cannot be duplicated or altered in flight',()=>{
 const g=new Game(1);assert.equal(g.remainingShots,12);const second={...g.queue[1]};assert.ok(g.selectReserve(1));assert.equal(g.material,second.material);assert.equal(g.size,second.size);g.fire();assert.equal(g.remainingShots,11);assert.equal(g.queue.length,12);assert.equal(g.selectReserve(2),false);assert.equal(g.fire(),false);g.recall();assert.equal(g.remainingShots,11);
 for(let i=0;i<20&&g.phase!=='over';i++){if(g.phase==='upgrade')g.upgrade('elastic');g.targets=[];g.fire();g.recall();}assert.equal(g.shots,12);assert.equal(g.phase,'over');assert.equal(g.endReason,'ammo');assert.equal(g.fire(),false);
});
test('all switches must reach zero before gates open',()=>{
 const g=new Game(1,11);const switches=g.targets.filter(t=>t.power==='switch');assert.equal(switches.length,2);for(const t of switches){while(t.hp>0){g.damage(t);if(g.targets.some(b=>b.power==='switch'&&b.hp>0))assert.ok(g.gates.every(gate=>!gate.open));}}assert.ok(g.gates.every(gate=>gate.open));
});
test('core missions finish only on collection and do not require clearing support blocks',()=>{
 const g=new Game(1,5);g.fire();for(const t of g.targets.filter(t=>t.core))while(t.hp>0)g.damage(t);g.update(STEP);assert.equal(g.phase,'volley');assert.ok(g.targets.length>0);assert.ok(g.goalComplete);g.recall();assert.equal(g.phase,'won');
});
test('daily trials are stable for a Shanghai calendar day and mirror consistently',()=>{
 const a=dailyTrial(new Date('2026-11-07T00:01:00+08:00')),b=dailyTrial(new Date('2026-11-07T23:59:00+08:00'));assert.deepEqual(a,b);assert.equal(a.key,'2026-11-07');assert.notEqual(dailyTrial(new Date('2026-11-08T00:00:00+08:00')).key,a.key);
 const g=new Game(1,a.index),initial=JSON.stringify([g.targets,g.air,g.gates,g.pegs]);g.mirror();g.mirror();assert.equal(JSON.stringify([g.targets,g.air,g.gates,g.pegs]),initial);
});
test('every layout has a durability ladder and a viable spacing envelope',()=>{
 for(const l of LEVELS){assert.ok(new Set(l.tiles.map(t=>t.hp)).size>=3,l.name);assert.ok(Math.max(...l.tiles.map(t=>t.hp))>=Math.min(...l.tiles.map(t=>t.hp))*2);assert.ok(l.tiles.some(t=>t.power==='spring'));for(const a of l.tiles){assert.ok(a.x-a.size/2>=18&&a.x+a.size/2<=402);assert.ok(a.y+a.size/2<685);for(const b of l.tiles)if(a!==b)assert.ok(Math.abs(a.x-b.x)>=a.size/2+b.size/2+6||Math.abs(a.y-b.y)>=a.size/2+b.size/2+6,l.name);}}
});
