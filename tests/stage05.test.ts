import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';

test('each generated row has a guaranteed unique durable powered anchor and increasing tiers',()=>{
 for(let seed=0;seed<40;seed++){const g=new Game(seed);for(let i=0;i<10;i++)g.addRow(609);let last=0;
  for(let row=1;row<=12;row++){const blocks=g.targets.filter(t=>t.row===row),anchors=blocks.filter(t=>t.anchor);assert.equal(anchors.length,1);const a=anchors[0];assert.equal(a.power,'spring');assert.ok(a.hp>last);last=a.hp;assert.ok(blocks.filter(t=>!t.anchor).every(t=>t.hp<a.hp&&t.hp>=2+(row-1)*2));assert.ok(new Set(blocks.map(t=>t.hp)).size>=2);}
 }
});
test('manual lift cannot overlap, pauses safely and bounds positive work for all materials and sizes',()=>{
 for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[]){const g=new Game(1);g.selectBall(material,size);assert.equal(g.pulse(),false);g.fire();g.paused=true;assert.equal(g.pulse(),false);g.paused=false;assert.ok(g.pulse());assert.equal(g.pulse(),false);const b=g.balls[0];Object.assign(b,{vx:30,vy:-100});const before=.5*g.spec.mass*(b.vx*b.vx+b.vy*b.vy);
  for(let i=0;i<39;i++)g.applyLift(b,STEP);const after=.5*g.spec.mass*(b.vx*b.vx+b.vy*b.vy);assert.ok(after-before<=60000+1e-7);assert.ok(after<=240000+1e-7);assert.equal(b.vx,30);assert.ok(b.vy<-100);
  g.paused=true;const time=g.liftTime;g.update(STEP);assert.equal(g.liftTime,time);g.paused=false;g.recall();g.fire();assert.ok(g.pulse());
 }
});
test('breaking a durable anchor slows the next advance without changing one-hit damage',()=>{
 const g=new Game(5);g.fire();const anchor=g.targets.find(t=>t.anchor)!;anchor.hp=1;const survivor=g.targets.find(t=>!t.anchor)!,y=survivor.y;g.damage(anchor);assert.equal(anchor.hp,0);g.recall();assert.equal(survivor.y,y-24);
 const ordinary=new Game(5);const y0=ordinary.targets[0].y;ordinary.fire();ordinary.recall();assert.equal(ordinary.targets[0].y,y0-39);
});
