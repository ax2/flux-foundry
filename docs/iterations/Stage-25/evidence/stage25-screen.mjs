import {readFileSync,writeFileSync} from 'node:fs';
const game=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const gate='  if(falling&&(regularGuide||edgeGuide)';
const multi=readFileSync('scripts/multi-endurance.ts','utf8').replace("from '../src/game'","from './stage25-variant-game'").replace("from './paddle-policy'","from '../scripts/paddle-policy'").replace('of [4,6,8,11,13,16,18,20,21,25]','of [21]').replace("test-results/multi-${baseline?'before':'after'}.json","test-results/stage25-screen-${process.argv[2]}.json");
const variants={
 original:'false',
 wall35:'falling&&this.targets.length===1&&this.targets[0].core&&this.lowEndgame&&(falling.x<22+half||falling.x>398-half)&&this.progress.sinceHit>=3.5&&this.progress.catchesWithoutHit>=1',
 wall32:'falling&&this.targets.length===1&&this.targets[0].core&&this.lowEndgame&&(falling.x<22+half||falling.x>398-half)&&this.progress.sinceHit>=3.2&&this.progress.catchesWithoutHit>=1',
 horizontal35:'falling&&this.targets.length===1&&this.targets[0].core&&this.lowEndgame&&this.air.some(z=>z.fy===0&&Math.abs(z.fx)>=90)&&(falling.x<22+half||falling.x>398-half)&&this.progress.sinceHit>=3.5&&this.progress.catchesWithoutHit>=1',
 horizontal32:'falling&&this.targets.length===1&&this.targets[0].core&&this.lowEndgame&&this.air.some(z=>z.fy===0&&Math.abs(z.fx)>=90)&&(falling.x<22+half||falling.x>398-half)&&this.progress.sinceHit>=3.2&&this.progress.catchesWithoutHit>=1',
};
for(const [name,condition] of Object.entries(variants)){
 let source=game.replace(gate,'  const lowEdgeGuide='+condition+';\n  if(falling&&(regularGuide||edgeGuide||lowEdgeGuide)');
 if(source===game)throw Error('Source anchor missing');
 writeFileSync('test-results/stage25-game-'+name+'.ts',source);
 writeFileSync('test-results/stage25-multi-'+name+'.ts',multi.replace('./stage25-variant-game','./stage25-game-'+name));
}
