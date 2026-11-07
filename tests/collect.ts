import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';
// Unit-test arrangement, never used by challenge replays or UI playthroughs.
export function collectAtBottom(g:Game){
 assert.equal(g.phase,'volley');const b=g.balls[0];Object.assign(b,{x:210,y:692+b.r-.5,vx:0,vy:300});
 g.update(STEP);assert.ok(b.y-b.r>=692);assert.equal(g.balls.length,0);
}
