import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
test('open bottom naturally collects every size without automatic rebound',()=>{
 for(const size of ['small','standard','large'] as const){const g=new Game(1);g.targets=[];g.rails=[];g.selectBall('steel',size);g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:680,vx:0,vy:300});for(let i=0;i<60&&g.phase==='volley';i++)g.update(STEP);assert.equal(g.balls.length,0);assert.ok(b.y-b.r>=692);assert.equal(g.stats.rebounds,0);}
});
