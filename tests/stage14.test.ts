import {test} from 'node:test';import assert from 'node:assert/strict';import {Game,STEP} from '../src/game';import {steer} from '../scripts/paddle-policy';
test('gate relief counts distinct contacts, preserves the original ball, and recloses only after full crossing',()=>{
 const g=new Game(1004,4);g.fire();const b=g.balls[0],gate=g.gates[0];Object.assign(b,{x:170,y:400,vx:4,vy:-300});g.progress.sinceHit=9;const hp=g.targets.map(t=>t.hp);
 g.time=10;g.gateContact(gate,b);g.time=10.1;g.gateContact(gate,b);assert.equal(gate.pressure,1);
 b.x=190;g.time=11;g.gateContact(gate,b);b.x=220;g.time=12;const entering=JSON.stringify(b);g.gateContact(gate,b);
 assert.equal(gate.venting,'above');assert.equal(gate.open,false);assert.equal(g.stats.gateVents,1);assert.equal(g.balls[0],b);assert.equal(JSON.stringify(b),entering);assert.deepEqual(g.targets.map(t=>t.hp),hp);
 b.y=gate.y;g.closePassedVents(b);assert.equal(gate.venting,'above');b.y=gate.y+gate.size/8+b.r+4;g.closePassedVents(b);assert.equal(gate.venting,undefined);assert.equal(gate.open,false);
 gate.venting='below';b.y=gate.y;g.closePassedVents(b);assert.equal(gate.venting,'below');b.y=gate.y-gate.size/8-b.r-4;g.closePassedVents(b);assert.equal(gate.venting,undefined);
});
for(const [level,material,size,cadence] of [[4,'ceramic','standard',24],[25,'brass','small',14],[25,'brass','small',24]] as const)test(`multi-block gate/wind route ${level+1}/${cadence} makes progress with unchanged wind`,()=>{
 const g=new Game(1000+level,level);g.mirror();const air=structuredClone(g.air);let multiGap=0;
 while(g.phase==='aim'){
  g.selectBall(material,size);const t=g.targets.find(t=>t.power==='switch')||g.targets.find(t=>t.core)||g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];if(!g.shots)g.angle=2.59;else g.aim(t.x,t.y);g.fire();const ball=g.balls[0];let step=0;
  while(g.phase==='volley'&&step<600/STEP){if(step%cadence===0)steer(g,'steer');g.update(STEP);step++;if(g.targets.length>=3&&!g.goalComplete)multiGap=Math.max(multiGap,g.progress.sinceHit);if(g.phase==='volley')assert.equal(g.balls[0],ball);}
  assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);
 }
 assert.equal(g.phase,'won');assert.ok(multiGap<20,`No-hit gap ${multiGap}`);assert.equal(g.windMultiplier,2.4);assert.deepEqual(g.air,air);if(level===4)assert.ok(g.stats.gateVents>0);
});
