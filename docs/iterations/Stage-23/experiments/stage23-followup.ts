import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const root=resolve(process.argv[2]||'test-results/stage23-variants/miss-only'),{Game,STEP}=await import(pathToFileURL(root+'/src/game.ts').href),{steer}=await import(pathToFileURL(root+'/scripts/paddle-policy.ts').href),rows=[];
for(const name of ['active-endurance.json','varied-endurance.json']){
 const before=JSON.parse(await readFile(`docs/iterations/Stage-21/final/${name}`,'utf8')),after=JSON.parse(await readFile(`${root}/test-results/${name}`,'utf8'));
 for(let index=0;index<before.rows.length;index++){
  const a=before.rows[index],r=after.rows[index];if(a.phase!=='won'||r.phase==='won')continue;
  const seed=name.startsWith('varied')?r.seed+r.level-1:r.seed,policy=r.policy||'steer',cadence=r.cadence||14,g=new Game(seed,r.level-1);if(r.mirror)g.mirror();const shots=[];
  while(g.phase==='aim'){
   g.selectBall(r.material,r.size);if(g.shots===0)g.angle=r.angle;else{const t=g.targets.find((t:any)=>t.power==='switch')||g.targets.find((t:any)=>t.core)||g.targets.slice().sort((a:any,b:any)=>a.hp-b.hp)[0];g.aim(t.x,t.y);}assert.ok(g.fire());const ball=g.balls[0];let step=0;
   while(g.phase==='volley'&&step<600/STEP){if(step%cadence===0)steer(g,policy);g.update(STEP);step++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
   if(g.phase!=='volley')assert.ok(ball.y-ball.r>=692);shots.push({phase:g.phase,seconds:step*STEP,hits:g.stats.hits,catches:g.stats.paddleHits,maxNoHit:g.progress.maxNoHit});
   if(shots.length===1){assert.equal(g.phase,r.phase);assert.equal(g.stats.hits,r.hits);assert.equal(g.stats.paddleHits,r.catches);assert.ok(Math.abs(step*STEP-r.seconds)<1e-8);}
   if(g.phase==='volley')break;
  }
  rows.push({matrix:name,index,groupSeed:r.seed,actualSeed:seed,level:r.level,material:r.material,size:r.size,mirror:!!r.mirror,angle:r.angle,cadence,policy,par:g.level.par,result:g.phase,used:g.shots,stars:g.stars,gap:g.progress.maxNoHit,shots});
 }
}
await writeFile(root+'/test-results/first-win-continuations.json',JSON.stringify({method:'Every published first-ball win that became aim/over is replayed with its exact legal initial inputs, then switches/core/weakest aim and same loadout/paddle policy, natural whole original balls only. No state restoration, no forced collection. A continued win does not preserve the old one-ball route or establish human difficulty.',rows},null,2));console.log(JSON.stringify(rows.map(({shots,...r})=>r)));
