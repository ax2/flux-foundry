import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const read=name=>readFileSync(dir+name,'utf8');
const small=read('stage34-game-small60.ts'),large=read('stage34-game-second11.ts');
const gate=large.slice(large.indexOf('  const lowSplitGuide='),large.indexOf('  if(falling&&(regularGuide'));
const result=small.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
 .replace('||enlargedBallGuide)&&falling','||enlargedBallGuide||lowSplitGuide)&&falling')
 .replace('||enlargedBallGuide)&&!regularGuide','||enlargedBallGuide||lowSplitGuide)&&!regularGuide')
 .replace('||enlargedBallGuide)?dt','||enlargedBallGuide||lowSplitGuide)?dt')
 .replace('if(enlargedBallGuide)maxTilt=0.06;','if(lowSplitGuide)maxTilt=.11;\n     else if(enlargedBallGuide)maxTilt=.06;');
if(result===small||!result.includes('||lowSplitGuide)&&!regularGuide'))throw Error('Guide anchor missing');
writeFileSync(dir+'stage34-game-combined.ts',result);
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8').replace('../src/game','./stage34-game-combined');
const seeds=JSON.parse(read('stage34-combined-seeds.json'));
for(const [i,seed] of seeds.entries()){
 const name='stage34-combined-shard-'+i;
 writeFileSync(dir+name+'.ts',audit.replace(/of \[42,[^\]]+\]/,'of ['+seed+']').replace('stage32-matrix-production.json',name+'.json'));
}
