import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';import {Game,STEP,LAUNCH} from '../src/game';
const path=process.argv[2]||'test-results/stage18-ui-sound/inputs-22-rubber.json',tape=JSON.parse(await readFile(path,'utf8'));
const launch=tape.find((e:any)=>e.phase==='volley'&&e.shot===1&&e.ball);assert.equal(launch.flight,0);assert.equal(launch.ball.x,LAUNCH.x);assert.equal(launch.ball.y,LAUNCH.y);
const g=new Game(1021,21);g.selectBall('rubber','large');g.angle=Math.atan2(launch.ball.vy,launch.ball.vx);g.fire();assert.deepEqual(g.balls[0],launch.ball);
const moves=tape.filter((e:any)=>e.phase==='volley'&&e.shot===1);let index=0,step=0,peak:any=null;
while(g.phase==='volley'&&step<300/STEP){
 while(index<moves.length&&moves[index].flight<=g.stats.flight+STEP/10){g.movePaddle(moves[index].target);index++;}
 g.update(STEP);step++;if(!peak||g.progress.sinceHit>peak.gap)peak={gap:g.progress.sinceHit,time:g.time,ball:{...g.balls[0]},paddle:{...g.paddle},targets:structuredClone(g.targets),air:structuredClone(g.air),stats:{...g.stats}};
}
assert.equal(g.phase,'won');assert.equal(g.balls.length,0);const result={method:'Replay captured legal UI paddle targets at recorded fixed simulation times, original1021 challenge seed/loadout and angle derived from the initial launch. Never assign body/target state or force collection. 300s is a failure observer only.',source:path,moves:moves.length,phase:g.phase,stats:g.stats,progress:g.progress,peak};await writeFile('test-results/ui-touch-replay.json',JSON.stringify(result,null,2));console.log(JSON.stringify({phase:g.phase,progress:g.progress,stats:g.stats}));
