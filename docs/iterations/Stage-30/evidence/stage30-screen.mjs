import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=execFileSync('git',['show','1363e29:src/game.ts'],{encoding:'utf8'}).replaceAll("from './","from '../src/");
const audit=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'");
const seeds='42,739,2217,223,2026,4039,9011,137,815,1229,1907';
for(const [name,catches,delay,tilt] of [['early',1,7,.32],['middle',2,8,.32],['softEarly',1,7,.25],['softMiddle',2,8,.25],['half',2,8,.28],['slower',2,8,.30],['soft',2,8,.22],['gentle',2,8,.18]]){
 const anchor='  if(falling&&(regularGuide||edgeGuide||lowCoreEdgeGuide||lowGapGuide||oneSidedRowGuide)';
 const guide=`  const verticalGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.progress.sinceHit>=${delay}&&
   this.progress.catchesWithoutHit===${catches}&&this.targets.length>=5&&this.air.length===0&&
   Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03;
`;
 let game=source.replace(anchor,guide+anchor.replace('||oneSidedRowGuide','||oneSidedRowGuide||verticalGuide'));
 game=game.replace('const gentle=(lowGapGuide||oneSidedRowGuide)','const gentle=(lowGapGuide||oneSidedRowGuide||verticalGuide)').replace('if(gentle)maxTilt=oneSidedRowGuide?.2:.22;',`if(gentle)maxTilt=verticalGuide?${tilt}:oneSidedRowGuide?.2:.22;`);
 if(game===source)throw Error('Missing anchor');
 writeFileSync('test-results/stage30-game-'+name+'.ts',game);
 const matrix=audit.replace('../src/game','./stage30-game-'+name).replace('test-results/endless-audit-extended.json','test-results/stage30-'+name+'.json').replace('of [42,739,2217]','of ['+seeds+']');
 writeFileSync('test-results/stage30-audit-'+name+'.ts',matrix);
 const one=matrix.replace('of ['+seeds+']','of [2026]').replace('of Object.keys(MATERIALS) as Material[]',"of ['brass'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['standard'] as BallSize[]").replace("of ['follow','steer'] as const","of ['follow'] as const").replace('stage30-'+name+'.json','stage30-case-'+name+'.json');
 writeFileSync('test-results/stage30-case-'+name+'.ts',one);
}
