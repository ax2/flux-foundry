import {collectAtBottom} from './collect';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {HOPPER_SLOTS,ballProperties,type AirZone} from '../src/content';
import {airStrength,airOutline} from '../src/air';
import {collide} from '../src/physics';

test('all twelve reserve positions fit inside the original hopper without overlapping large marbles',()=>{
 assert.equal(HOPPER_SLOTS.length,12);for(const a of HOPPER_SLOTS){assert.ok(a.y>=16&&a.y+16<112);for(const b of HOPPER_SLOTS)if(a!==b)assert.ok(Math.hypot(a.x-b.x,a.y-b.y)>32);}
});
test('plume forces have an irregular shared boundary and a smooth feathered edge',()=>{
 const z:AirZone={x:50,y:350,w:300,h:100,fx:50,fy:0,plume:true};assert.equal(airStrength(z,{x:200,y:400}),1);assert.equal(airStrength(z,{x:51,y:351}),0);assert.ok(airOutline(z).length>4);
 const edge={x:50,y:400};assert.equal(airStrength(z,edge),0);assert.ok(airStrength(z,{x:51,y:400})<airStrength(z,{x:55,y:400}));assert.ok(airStrength(z,{x:55,y:400})<1);
});
test('wind valves reverse local forces only when their number reaches zero',()=>{
 const g=new Game(1,19),v=g.targets.find(t=>t.power==='valve')!,before=g.air.map(z=>({...z}));g.damage(v);assert.deepEqual(g.air,before);g.damage(v);g.air.forEach((z,i)=>{assert.equal(z.fx,-before[i].fx);assert.equal(z.fy,-before[i].fy);});const flipped=JSON.stringify(g.air);g.damage(v);assert.equal(JSON.stringify(g.air),flipped);
});
test('powered rails consume finite charges and preserve the tangent component',()=>{
 const g=new Game(1);g.targets=[];g.selectBall('steel','standard');g.fire();const b=g.balls[0],r=g.rails[0];
 for(let i=0;i<4;i++){Object.assign(b,{x:29,y:470,vx:-200,vy:30});g.update(STEP);assert.ok(Math.abs(b.vy-32)<1e-7);assert.equal(r.charges,Math.max(0,2-i));if(i<3)assert.ok(b.vx>200*.94);else assert.ok(Math.abs(b.vx-188)<1e-6);}
 assert.equal(g.stats.boosts,3);assert.equal(g.stats.hits,0);collectAtBottom(g);g.fire();assert.equal(r.charges,3);
});
test('repeated passive gate bouncing is rescued without deleting the marble',()=>{
 for(const level of [4,11])for(const size of ['small','standard','large'] as const){const g=new Game(1,level);g.selectBall('ceramic',size);g.angle=Math.PI/2;g.fire();const b=g.balls[0];for(let i=0;i<45/STEP&&g.phase==='volley';i++){g.update(STEP);if(g.phase==='volley')assert.equal(g.balls[0],b);}assert.notEqual(g.phase,'volley',`${level}/${size}`);assert.ok(b.y-b.r>=692);assert.ok(g.stats.rescues>0);}
});
test('all material-size pairs escape a stationary sealed platform',()=>{
 for(const material of ['steel','brass','ceramic','rubber'] as const)for(const size of ['small','standard','large'] as const){const g=new Game(1);g.rails=[];g.selectBall(material,size);g.targets=[{id:1,x:210,y:400,size:400,kind:'bar',hp:10000,maxHp:10000,flash:0}];g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:350-b.r,vx:0,vy:0});for(let i=0;i<120/STEP&&g.phase==='volley';i++)g.update(STEP);assert.notEqual(g.phase,'volley',`${material}/${size}`);assert.ok(b.y-b.r>=692);assert.equal(g.stats.returns,1);}
});
test('small balls fit the narrow passage while large balls can catch a near-miss edge',()=>{
 const peg={id:1,x:176,y:340,size:46,kind:'capacitor' as const,hp:1,maxHp:1,flash:0};
 assert.equal(collide({x:210,y:340,vx:0,vy:100,r:9},peg,.9),false);
 const wide={x:207,y:330,vx:0,vy:100,r:16};assert.ok(collide(wide,peg,.9));assert.ok(wide.vx>0);
});
test('material strengths are physical tradeoffs, not extra damage',()=>{
 const brass=ballProperties('brass','large'),rubber=ballProperties('rubber','standard'),ceramic=ballProperties('ceramic','standard'),steel=ballProperties('steel','standard');
 assert.ok(brass.windResponse<rubber.windResponse/5);assert.ok(240-48*rubber.windResponse<0);assert.ok(240-48*brass.windResponse>0);assert.ok(ceramic.restitution>steel.restitution);assert.equal(steel.magnetic,1);assert.equal(ceramic.magnetic,0);
});
