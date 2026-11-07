import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Game,STEP} from '../src/game';
import {LEVELS,type Material,type BallSize} from '../src/content';
type Solution={level:number;shots:number;moves:{material:Material;size:BallSize;angle:number;steps:number}[]};
for(const mirror of [false,true])test(`${mirror?'mirrored':'normal'} challenges have player-reachable three-star routes with natural collection`,()=>{
 const solutions=JSON.parse(readFileSync(new URL(`./fixtures/challenges${mirror?'-mirrored':''}.json`,import.meta.url),'utf8')) as Solution[];
 assert.equal(solutions.length,LEVELS.length);assert.equal('recall' in Game.prototype,false);
 assert.deepEqual(solutions.map(s=>s.level),LEVELS.map((_,i)=>i));
 for(const solution of solutions){
  const g=new Game(1000+solution.level,solution.level);if(mirror)g.mirror();
  for(const m of solution.moves){
   assert.deepEqual(Object.keys(m).sort(),['angle','material','size','steps']);assert.ok(m.angle>=.16&&m.angle<=Math.PI-.16);assert.ok(Number.isInteger(m.steps)&&m.steps>0);
   assert.ok(g.selectBall(m.material,m.size));g.angle=m.angle;assert.ok(g.fire());const ball=g.balls[0];
   for(let i=0;i<m.steps;i++){assert.equal(g.phase,'volley',`${g.level.name}: recorded shot must end at collection, not idle`);g.update(STEP);assert.ok([ball.x,ball.y,ball.vx,ball.vy].every(Number.isFinite));if(g.phase==='volley')assert.equal(g.balls[0],ball);}
   assert.notEqual(g.phase,'volley',`${g.level.name}: unfinished shot`);assert.ok(ball.y-ball.r>=692,`${g.level.name}: whole original ball reaches collector`);assert.equal(g.balls.length,0);
  }
  assert.equal(g.phase,'won',g.level.name);assert.equal(g.stars,3,g.level.name);assert.equal(g.shots,solution.shots);
 }
});
