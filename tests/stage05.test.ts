import {collectAtBottom} from './collect';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';

test('each generated row has a guaranteed unique durable powered anchor and increasing tiers',()=>{
 for(let seed=0;seed<40;seed++){const g=new Game(seed);for(let i=0;i<10;i++)g.addRow(609);let last=0;
  for(let row=1;row<=12;row++){const blocks=g.targets.filter(t=>t.row===row),anchors=blocks.filter(t=>t.anchor);assert.equal(anchors.length,1);const a=anchors[0];assert.equal(a.power,'spring');assert.ok(a.hp>last);last=a.hp;assert.ok(blocks.filter(t=>!t.anchor).every(t=>t.hp<a.hp&&t.hp>=2+(row-1)*2));assert.ok(new Set(blocks.map(t=>t.hp)).size>=2);}
 }
});
test('breaking a durable anchor slows the next advance without changing one-hit damage',()=>{
 const g=new Game(5);g.fire();const anchor=g.targets.find(t=>t.anchor)!;anchor.hp=1;const survivor=g.targets.find(t=>!t.anchor)!,y=survivor.y;g.damage(anchor);assert.equal(anchor.hp,0);collectAtBottom(g);assert.equal(survivor.y,y-24);
 const ordinary=new Game(5);const y0=ordinary.targets[0].y;ordinary.fire();collectAtBottom(ordinary);assert.equal(ordinary.targets[0].y,y0-39);
});
