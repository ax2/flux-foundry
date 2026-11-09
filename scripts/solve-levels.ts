import {mkdir,writeFile} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {LEVELS,type Material,type BallSize} from '../src/content';
type Move={material:Material;size:BallSize;angle:number;steps:number};
const combinations:[Material,BallSize][]=[['steel','standard'],['steel','small'],['ceramic','small'],['ceramic','standard'],['brass','large'],['rubber','standard']];
const solutions=[];const mirrored=process.argv.includes('--mirror');
for(let level=0;level<LEVELS.length;level++){
 let game=new Game(1000+level,level);if(mirrored)game.mirror();const moves:Move[]=[];
 for(let shot=0;shot<game.level.par&&game.phase!=='won';shot++){
  let best:{game:Game;move:Move;cost:number}|undefined;
  search:for(const [material,size] of combinations)for(let a=0;a<=48;a++){
   // Replay the prefix to reconstruct the live game and its feedback objects.
   const candidate=new Game(1000+level,level);
   if(mirrored)candidate.mirror();
   for(const move of moves){
    candidate.selectBall(move.material,move.size);
    candidate.angle=move.angle;
    candidate.fire();
    for(let step=0;step<move.steps;step++)candidate.update(STEP);
    if(candidate.phase!=='aim')throw new Error('Route prefix did not reach the next aim');
   }
   candidate.selectBall(material,size);candidate.angle=.18+a*(Math.PI-.36)/48;candidate.fire();
   let steps=0;while(candidate.phase==='volley'&&steps<180/STEP){candidate.update(STEP);steps++;}
   // Observation ceiling only discards a candidate. It never ends a shot or carries it into the next turn.
   if(candidate.phase==='volley')continue;
   const cost=candidate.phase==='won'?-1:candidate.targets.reduce((sum,t)=>sum+t.hp*(candidate.level.goal==='core'&&!t.core?1:100)+10,0);
   if(!best||cost<best.cost)best={game:candidate,move:{material,size,angle:candidate.angle,steps},cost};
   if(candidate.phase==='won')break search;
  }
  if(!best)throw new Error(`Level ${level+1}: no naturally ended candidate`);game=best.game;moves.push(best.move);
 }
 if(game.phase!=='won'||game.stars!==3)throw new Error(`Level ${level+1}: no verified three-star greedy route (${game.targets.length} targets left)`);
 const solution={level,name:game.level.name,shots:moves.length,stars:game.stars,moves};solutions.push(solution);console.log(`${mirrored?'mirror':'normal'} ${level+1}: ${moves.length} shots, ${moves.reduce((n,m)=>n+m.steps*STEP,0).toFixed(1)}s`);
}
await mkdir('tests/fixtures',{recursive:true});await writeFile(mirrored?'tests/fixtures/challenges-mirrored.json':'tests/fixtures/challenges.json',JSON.stringify(solutions,null,2)+'\n');
