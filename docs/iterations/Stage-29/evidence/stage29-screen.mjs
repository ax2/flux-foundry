import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const game=execFileSync('git',['show','a339ff8:src/game.ts'],{encoding:'utf8'}).replaceAll("from './","from '../src/");
const audit=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'");
const seeds='42,739,2217,223,2026,4039,9011,137,815,1229,1907';
for(const [name,misses,delay,slope,tilt,near] of [
 ['third',2,8,.20,.22,96],['thirdWide',2,8,.3,.26,96],['second',1,6,.22,.28,110],['thirdTight',2,8,.17,.22,84],['thirdReach',2,8,.20,.22,84],
]){
 const gate='  if(falling&&(regularGuide||edgeGuide||lowCoreEdgeGuide||lowGapGuide)';
 const condition=`  const offside=this.mode==='endless'&&falling&&this.targets.length===3&&falling.y>=610&&
   this.progress.sinceHit>=${delay}&&this.progress.catchesWithoutHit===${misses}&&Math.abs(falling.x-this.paddle.x)<=this.paddle.width/4&&
   Math.abs(falling.vx)<=falling.vy*${slope}&&this.targets.every(t=>t.y>=580&&Math.abs(t.y-this.targets[0].y)<=1)&&
   (this.targets.every(t=>t.x<falling.x)||this.targets.every(t=>t.x>falling.x))&&this.targets.some(t=>Math.abs(t.x-falling.x)<=${near});
`;
 let source=game.replace(gate,condition+gate.replace('||lowGapGuide','||lowGapGuide||offside'));
 source=source.replace('const gentle=lowGapGuide&&!regularGuide&&!edgeGuide;', 'const gentle=(lowGapGuide||offside)&&!regularGuide&&!edgeGuide;')
 .replace('const maxTilt=gentle?.22:',`const maxTilt=gentle?(offside?${tilt}:.22):`);
 if(name==='thirdReach')source=source.replace('(!gentle||(plan.hitElapsed??Infinity)<.45)','(!gentle||(plan.hitElapsed??Infinity)<(offside?.25:.45))');
 if(source===game)throw Error('Gate not found');
 writeFileSync('test-results/stage29-game-'+name+'.ts',source);
 const matrix=audit.replace('../src/game','./stage29-game-'+name).replace('test-results/endless-audit-extended.json','test-results/stage29-'+name+'.json').replace('of [42,739,2217]','of ['+seeds+']');
 writeFileSync('test-results/stage29-audit-'+name+'.ts',matrix);
 const exact=matrix.replace('of ['+seeds+']','of [815]').replace('of Object.keys(MATERIALS) as Material[]',"of ['steel'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['large'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('stage29-'+name+'.json','stage29-case-'+name+'.json');
 writeFileSync('test-results/stage29-case-'+name+'.ts',exact);
}
