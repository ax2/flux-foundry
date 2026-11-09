import {readFile,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import assert from 'node:assert/strict';
const root=resolve(process.env.EDGE_ENGINE_ROOT||'.'),{Game,STEP}=await import(pathToFileURL(root+'/src/game.ts').href),{steer}=await import(pathToFileURL(root+'/scripts/paddle-policy.ts').href),routes=[],trials=[];
const strategies=['default','weakest','leftmost','rightmost','default-left','default-right','vertical','left-bank','right-bank'];
for(const matrix of ['active-endurance.json','varied-endurance.json']){
 const before=JSON.parse(await readFile(`docs/iterations/Stage-21/final/${matrix}`,'utf8')),after=JSON.parse(await readFile(`${root}/test-results/${matrix}`,'utf8'));
 for(let index=0;index<before.rows.length;index++){
  const a=before.rows[index],r=after.rows[index];if(a.phase!=='won'||r.phase==='won')continue;
  const seed=matrix.startsWith('varied')?r.seed+r.level-1:r.seed,policy=r.policy||'steer',cadence=r.cadence||14;let certified=false;
  for(const strategy of strategies){
   const g=new Game(seed,r.level-1);if(r.mirror)g.mirror();const moves=[];let observerFailed=false;
   while(g.phase==='aim'&&g.shots<g.level.par){
    g.selectBall(r.material,r.size);
    if(g.shots===0)g.angle=r.angle;
    else{
     const sorted=g.targets.slice().sort((a:any,b:any)=>strategy==='leftmost'?a.x-b.x:strategy==='rightmost'?b.x-a.x:a.hp-b.hp),target=strategy==='weakest'||strategy==='leftmost'||strategy==='rightmost'?sorted[0]:g.targets.find((t:any)=>t.power==='switch')||g.targets.find((t:any)=>t.core)||sorted[0];
     const angle=strategy==='vertical'?Math.PI/2:strategy==='left-bank'?2.59:strategy==='right-bank'?.55:Math.atan2(target.y-132,target.x-210)+(strategy==='default-left'?.15:strategy==='default-right'?-.15:0);
     g.angle=Math.max(.16,Math.min(Math.PI-.16,angle));
    }
    const angle=g.angle;assert.ok(g.fire());const ball=g.balls[0];let steps=0;
    while(g.phase==='volley'&&steps<600/STEP){if(steps%cadence===0)steer(g,policy);g.update(STEP);steps++;if(g.phase==='volley')assert.equal(g.balls[0],ball);}
    if(g.phase==='volley'){observerFailed=true;break;}assert.ok(ball.y-ball.r>=692);moves.push({material:r.material,size:r.size,angle,steps});
    if(moves.length===1){assert.equal(g.phase,r.phase);assert.equal(g.stats.hits,r.hits);assert.equal(g.stats.paddleHits,r.catches);assert.ok(Math.abs(steps*STEP-r.seconds)<1e-8);}
   }
   trials.push({matrix,index,strategy,result:g.phase,used:g.shots,stars:g.stars,maxNoHit:g.progress.maxNoHit,observerFailed});
   if(g.phase==='won'&&g.stars===3&&g.progress.maxNoHit<20){routes.push({matrix,index,actualSeed:seed,level:r.level,material:r.material,size:r.size,mirror:!!r.mirror,angle:r.angle,cadence,policy,strategy,par:g.level.par,used:g.shots,stars:g.stars,maxNoHit:g.progress.maxNoHit,moves});certified=true;break;}
  }
  assert.ok(certified,`No legal same-loadout three-star continuation for ${matrix}/${index}`);
 }
}
await writeFile(process.argv[2]||'test-results/edge-continuations.json',JSON.stringify({method:'Route search for every old first-ball win changed to aim/over. Replay exact legal first inputs from launch, then named aiming strategies with the same loadout and paddle policy. Every original ball must wholly collect; observer failure only rejects a candidate. Successful routes are reachability certificates, not old one-ball wins or human win rate. Trials retained.',routes,trials},null,2));console.log(JSON.stringify({routes:routes.map(({moves,...r})=>r),trials:trials.length}));
