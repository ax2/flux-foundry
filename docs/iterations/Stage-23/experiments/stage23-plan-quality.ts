import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import {writeFile} from 'node:fs/promises';
const root=resolve('test-results/stage23-variants/miss-only'),{Game,STEP}=await import(pathToFileURL(root+'/src/game.ts').href),{forecastRebound}=await import(pathToFileURL(root+'/src/paddle-assist.ts').href),{steer}=await import(pathToFileURL(root+'/scripts/paddle-policy.ts').href),rows=[];
for(const c of [{name:'primary',seed:8148,level:11,material:'steel',size:'standard',angle:2.478263495133118,cadence:18,mirror:false},{name:'mirror10',seed:8146,level:9,material:'steel',size:'standard',angle:2.1876546738526,cadence:36,mirror:true},{name:'rubber22',seed:8158,level:21,material:'rubber',size:'standard',angle:1.219872467135403,cadence:36,mirror:false}]){
 const g=new Game(c.seed,c.level);if(c.mirror)g.mirror();g.selectBall(c.material,c.size);g.angle=c.angle;g.fire();const plans=[];
 for(let step=0;g.phase==='volley'&&step<600/STEP;step++){
  if(step%c.cadence===0)steer(g,'steer');const b={...g.balls[0]},p={...g.paddle},targets=structuredClone(g.targets),env={air:structuredClone(g.air),gates:structuredClone(g.gates),pegs:structuredClone(g.pegs),wind:g.windMultiplier,response:g.spec.windResponse,energyLimit:g.energyCapacity},mass=g.spec.mass,rest=g.restitution,time=g.time,misses=g.progress.catchesWithoutHit,gap=g.progress.sinceHit,hits=g.stats.hits,catches=g.stats.paddleHits;
  g.update(STEP);
  if(misses===2&&gap>=8&&g.paddle.tilt!==p.tilt&&g.stats.hits===hits&&g.stats.paddleHits===catches){
   const predicted=forecastRebound(b,{...p,vx:Math.max(-900,Math.min(900,(p.target-p.x)/STEP))},targets,mass,rest,time,env,g.paddle.tilt,true,g.paddle.boost),speed=predicted.impact?12/(predicted.score-2*predicted.impact.elapsed-Math.abs(g.paddle.tilt-(p.tilt||0))*.2):undefined;
   plans.push({time,gap,misses,body:b,paddle:p,tilt:g.paddle.tilt,boost:g.paddle.boost,speed,impact:predicted.impact,targets,env});
  }
 }
 rows.push({case:c,phase:g.phase,maxNoHit:g.progress.maxNoHit,plans});
}
await writeFile('test-results/stage23-plan-quality.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows.map(r=>({case:r.case.name,phase:r.phase,gap:r.maxNoHit,plans:r.plans.map(p=>({time:p.time,gap:p.gap,speed:p.speed,impact:p.impact,tilt:p.tilt,wind:p.env.air,pegs:p.env.pegs,gates:p.env.gates}))}))));
