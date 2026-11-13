import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const source=execFileSync('git',['show','7f02944:src/game.ts'],{encoding:'utf8'}).replaceAll("from './","from '../src/");
const audit=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'");
const seeds='42,739,2217,223,2026,4039,9011,137,815,1229,1907,421,934,2931,7429';
const anchor='  if(falling&&(regularGuide||edgeGuide||lowCoreEdgeGuide||lowGapGuide||oneSidedRowGuide||centralMovingGuide)';
const variants=[];
for(const [key,delay,catches,cap,requireDry] of [
 ['first55-07',5.5,0,.07,true],['first55-12',5.5,0,.12,true],['first55-18',5.5,0,.18,true],['first55-22',5.5,0,.22,true],
 ['second8-16',8,1,.16,true],['second8-20',8,1,.20,true],['second8-22',8,1,.22,true],['second8-24',8,1,.24,true],['second8-28',8,1,.28,true],['second8-32',8,1,.32,true],
 ['second10-22',10,1,.22,true],['second8-22-live',8,1,.22,false],
]){
 const gate=`  const movingSpringEdgeGuide=this.mode==='endless'&&falling&&this.targets.length===3&&falling.y>=610&&
   this.progress.sinceHit>=${delay}&&this.progress.catchesWithoutHit===${catches}&&
   (falling.x<22+half||falling.x>398-half)&&
   this.targets.every(t=>t.y>=560&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.motion&&t.power==='spring')${requireDry?"&&this.rails.every(rail=>rail.charges===0)":""};
`;
 let game=source.replace(anchor,gate+anchor.replace('||centralMovingGuide','||centralMovingGuide||movingSpringEdgeGuide'));
 game=game.replace('const gentle=(lowGapGuide||oneSidedRowGuide||centralMovingGuide)','const gentle=(lowGapGuide||oneSidedRowGuide||centralMovingGuide||movingSpringEdgeGuide)').replace('if(gentle)maxTilt=lowGapGuide?.22:.2;',`if(gentle)maxTilt=movingSpringEdgeGuide?${cap}:lowGapGuide?.22:.2;`);
 if(game===source)throw Error('Missing anchor');
 writeFileSync('test-results/stage31-game-'+key+'.ts',game);
 const matrix=audit.replace('../src/game','./stage31-game-'+key).replace('test-results/endless-audit-extended.json','test-results/stage31-matrix-'+key+'.json').replace('of [42,739,2217]','of ['+seeds+']');
 writeFileSync('test-results/stage31-matrix-'+key+'.ts',matrix);
 const one=matrix.replace('of ['+seeds+']','of [739]').replace('of Object.keys(MATERIALS) as Material[]',"of ['steel'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['standard'] as BallSize[]").replace("of ['follow','steer'] as const","of ['follow'] as const").replace('stage31-matrix-'+key+'.json','stage31-case-'+key+'.json');
 writeFileSync('test-results/stage31-case-'+key+'.ts',one);
 variants.push(key);
}
writeFileSync('test-results/stage31-scan-list.json',JSON.stringify(variants));
