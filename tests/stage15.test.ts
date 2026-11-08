import {test} from 'node:test';import assert from 'node:assert/strict';import {Game,STEP} from '../src/game';import {guidedRebound} from '../src/paddle-assist';import {steer} from '../scripts/paddle-policy';
test('height-aware charging is read-only, bounded, and requires more work for a high target',()=>{
 const ball={x:210,y:630,vx:0,vy:280,r:16},p={x:210,target:210,width:96,vx:0,flash:0,boost:18000},high={id:0,x:210,y:340,kind:'bar' as const,size:48,hp:1,maxHp:1,flash:0},environment={air:[],gates:[],pegs:[],wind:2.4,response:1};const input=JSON.stringify([ball,p,high,environment]);
 const highPlan=guidedRebound(ball,p,[high],2.56,.86,0,environment),lowPlan=guidedRebound(ball,p,[{...high,y:590}],2.56,.86,0,environment);
 assert.ok(highPlan.boost>lowPlan.boost);assert.equal(lowPlan.boost,18000);assert.ok(highPlan.boost<=40000);assert.ok(Math.abs(highPlan.tilt)<=.32);assert.equal(JSON.stringify([ball,p,high,environment]),input);
});
test('a prepared charge does not change the live ball until the physical paddle catches it',()=>{
 const g=new Game(1);g.selectBall('brass','large');g.targets=[{id:0,x:210,y:340,kind:'bar',size:48,hp:100,maxHp:100,flash:0}];g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:570,vx:0,vy:250});g.progress.sinceHit=9;g.progress.catchesWithoutHit=4;g.update(STEP);
 assert.equal(b.vx,0);assert.ok(Math.abs(b.vy-(250+240*STEP))<1e-8);assert.equal(g.stats.boosts,0);assert.ok((g.paddle.boost||0)>18000);assert.equal(g.targets[0].hp,100);
 for(let i=0;i<240&&g.stats.paddleHits===0;i++)g.update(STEP);
 assert.equal(g.balls[0],b);assert.equal(g.stats.paddleHits,1);assert.ok(g.stats.energy<=40000);assert.ok(.5*g.spec.mass*(b.vx*b.vx+b.vy*b.vy)<=240000+1e-6);
});
for(const [level,material,angle,ceiling] of [[12,'brass',2.59,18],[17,'steel',2.59,20],[1,'brass',Math.PI/2,20],[15,'brass',.55,20]] as const)test(`first-ball follow case ${level+1}/${material} recovers without a lifetime or catch quota`,()=>{
 const g=new Game(1000+level,level);g.selectBall(material,'large');g.angle=angle;g.fire();const ball=g.balls[0];let step=0;
 while(g.phase==='volley'&&step<300/STEP){if(step%14===0)steer(g,'follow');g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
 assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);assert.ok(g.progress.maxNoHit<ceiling,`${g.progress.maxNoHit}s`);assert.ok(g.stats.paddleHits>0);
});
