import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=execFileSync('git',['show','c1fa46d:src/game.ts'],{encoding:'utf8'}).replaceAll("from './","from '../src/");
const audit=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'");
for(const [name,catches,height,frames] of [['first',0,580,false],['second',1,580,false],['frame',0,580,true],['low',0,605,false],['lowFrame',0,605,true]]){
 const gate='  if(falling&&(regularGuide||edgeGuide||lowCoreEdgeGuide)';
 const test="!this.sparseEndgame&&this.mode==='endless'&&falling&&(falling.x<22+half||falling.x>398-half)&&this.progress.sinceHit>=ASSIST_DELAY&&this.progress.catchesWithoutHit>="+catches+"&&this.targets.every(t=>t.y>="+height+")";
 let game=source.replace(gate,'  const lowRowEdgeGuide='+test+';\n  if(falling&&(regularGuide||edgeGuide||lowCoreEdgeGuide||lowRowEdgeGuide)');
 if(game===source)throw Error('Gate not found');
 if(frames)game=game.replace('catchFrame:movingEndgame?','catchFrame:movingEndgame||lowRowEdgeGuide?');
 writeFileSync('test-results/stage27-game-'+name+'.ts',game);
 const matrix=audit.replace('../src/game','./stage27-game-'+name).replace('test-results/endless-audit-extended.json','test-results/stage27-'+name+'.json').replace('of [42,739,2217]','of [42,739,2217,223,2026,4039,9011]');
 writeFileSync('test-results/stage27-audit-'+name+'.ts',matrix);
 const exact=matrix.replace('of [42,739,2217,223,2026,4039,9011]','of [9011]').replace('of Object.keys(MATERIALS) as Material[]',"of ['rubber'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['large'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('stage27-'+name+'.json','stage27-case-'+name+'.json');
 writeFileSync('test-results/stage27-case-'+name+'.ts',exact);
}

