import {mkdir,writeFile} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {LEVELS,type Material,type BallSize} from '../src/content';
type Move={material:Material;size:BallSize;angle:number;steps:number;recall:boolean};
const combinations:[Material,BallSize][]=[['steel','standard'],['steel','small'],['ceramic','small'],['ceramic','standard'],['brass','large'],['rubber','standard']];
const solutions=[];
for(let level=0;level<LEVELS.length;level++){
 let game=new Game(1000+level,level);const moves:Move[]=[];
 for(let shot=0;shot<game.level.shots&&game.phase!=='won';shot++){
  let best:{game:Game;move:Move;cost:number}|undefined;
  for(const [material,size] of combinations)for(let a=0;a<=36;a++){
   const candidate=new Game(1000+level,level);candidate.targets=game.targets.map(t=>({...t}));candidate.shots=game.shots;candidate.score=game.score;candidate.selectBall(material,size);candidate.angle=.18+a*(Math.PI-.36)/36;candidate.fire();
   let steps=0;while(candidate.phase==='volley'&&steps<12/STEP&&candidate.targets.length){candidate.update(STEP);steps++;}
   const recall=candidate.phase==='volley';if(recall)candidate.recall();
   const cost=candidate.targets.reduce((sum,t)=>sum+t.hp*100+10,0);
   if(!best||cost<best.cost)best={game:candidate,move:{material,size,angle:candidate.angle,steps,recall},cost};
  }
  if(!best)throw new Error('No candidate');game=best.game;moves.push(best.move);
 }
 if(game.phase!=='won')throw new Error(`Level ${level+1} has no verified greedy solution (${game.targets.length} targets left)`);
 const solution={level,name:game.level.name,shots:moves.length,stars:game.stars,moves};solutions.push(solution);console.log(`${level+1}: ${solution.name}, ${moves.length} shots, ${game.stars} stars`);
}
await mkdir('tests/fixtures',{recursive:true});await writeFile('tests/fixtures/challenges.json',JSON.stringify(solutions,null,2)+'\n');
