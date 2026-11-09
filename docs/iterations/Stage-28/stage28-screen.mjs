import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=execFileSync('git',['show','v0.23.0:src/game.ts'],{encoding:'utf8'}).replaceAll("from './","from '../src/");
const audit=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'");
const gate='  if(falling&&(regularGuide||edgeGuide||lowCoreEdgeGuide)';
for(const [name,delay,slope,misses] of [['central6',6,.30,0],['central8',8,.15,1]]){
 const test="this.mode==='endless'&&falling&&this.targets.length>=3&&this.progress.sinceHit>="+delay+"&&this.progress.catchesWithoutHit>="+misses+"&&Math.abs(falling.x-this.paddle.x)<=this.paddle.width/6&&Math.abs(falling.vx)<=falling.vy*"+slope+"&&this.targets.every(t=>t.y>=580)";
 const game=source.replace(gate,'  const centralGuide='+test+';\n  if(falling&&(regularGuide||edgeGuide||lowCoreEdgeGuide||centralGuide)');
 if(game===source)throw Error('Gate not found');
 writeFileSync('test-results/stage28-game-'+name+'.ts',game);
 const matrix=audit.replace('../src/game','./stage28-game-'+name).replace('test-results/endless-audit-extended.json','test-results/stage28-'+name+'.json').replace('of [42,739,2217]','of [42,739,2217,223,2026,4039,9011]');
 writeFileSync('test-results/stage28-audit-'+name+'.ts',matrix);
 const exact=matrix.replace('of [42,739,2217,223,2026,4039,9011]','of [42]').replace('of Object.keys(MATERIALS) as Material[]',"of ['ceramic'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['large'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('stage28-'+name+'.json','stage28-case-'+name+'.json');
 writeFileSync('test-results/stage28-case-'+name+'.ts',exact);
}

