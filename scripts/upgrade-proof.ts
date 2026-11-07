import {writeFile} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {MATERIALS,SIZES,type Material,type BallSize} from '../src/content';
const rows=[];
for(const material of Object.keys(MATERIALS) as Material[])for(const size of Object.keys(SIZES) as BallSize[]){
 const runs=[];
 for(const choice of ['none','elastic','magnet','field'] as const){const g=new Game(7);g.selectBall(material,size);if(choice!=='none'){g.phase='upgrade';g.upgrade(choice);}g.fire();const b=g.balls[0];Object.assign(b,{x:210,y:450,vx:0,vy:300});g.pulse();
  // Controlled force integration, no collisions/gravity, same physical starting state. This is not UI play.
  for(let time=0;time<.32-1e-9;time+=STEP)g.applyLift(b,Math.min(STEP,.32-time));
  const pulseVy=b.vy;Object.assign(b,{vx:0,vy:-100});const before=g.stats.energy;g.energize(b,{x:0,y:-1});runs.push({choice,pulseVy,initialCharges:g.pulseMax,restitution:g.restitution,poweredEnergy:g.stats.energy-before});
 }
 rows.push({material,size,runs});
}
await writeFile('docs/iterations/Stage-07/upgrade-proof.json',JSON.stringify({method:'12 material/size pairs, four controlled states each: base and one level of each upgrade. Same downward velocity 300, .32s pulse, then powered contact at vy=-100. No UI mutation claimed.',rows},null,2)+'\n');console.log(JSON.stringify(rows[1]));
