import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const run=readFileSync('test-results/stage25-multi-horizontal35.ts','utf8');
const conditions={
 near:'Math.abs(this.targets[0].x-falling.x)<=this.paddle.width',
 half:'(this.targets[0].x-W/2)*(falling.x-W/2)>0',
 nearLate:'Math.abs(this.targets[0].x-falling.x)<=this.paddle.width&&falling.y>=550',
};
for(const [name,condition] of Object.entries(conditions)){
 const anchor='this.air.some(z=>z.fy===0&&Math.abs(z.fx)>=90);';
 if(!source.includes(anchor))throw Error('missing anchor');
 writeFileSync('test-results/stage25-game-'+name+'.ts',source.replace(anchor,condition+'&&'+anchor));
 writeFileSync('test-results/stage25-multi-'+name+'.ts',run.replace('./stage25-game-horizontal35','./stage25-game-'+name));
}
