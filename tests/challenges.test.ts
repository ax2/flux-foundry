import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {LEVELS,type Material,type BallSize} from '../src/content';
const solutions=JSON.parse(readFileSync(new URL('./fixtures/challenges.json',import.meta.url),'utf8')) as {level:number;shots:number;moves:{material:Material;size:BallSize;angle:number;steps:number;recall:boolean}[]}[];
test('every shipped challenge has a replayable solution within its three-star budget',()=>{
 assert.equal(solutions.length,LEVELS.length);
 for(const solution of solutions){const g=new Game(1000+solution.level,solution.level);for(const m of solution.moves){assert.ok(g.selectBall(m.material,m.size));g.angle=m.angle;assert.ok(g.fire());for(let i=0;i<m.steps;i++){g.update(STEP);for(const b of g.balls)assert.ok([b.x,b.y,b.vx,b.vy].every(Number.isFinite));}if(m.recall)g.recall();}assert.equal(g.phase,'won',g.level.name);assert.equal(g.stars,3,g.level.name);assert.equal(g.shots,solution.shots);}
});
