import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const names=[];
for(const catches of [0,1,2])for(const cap of [.21,.22,.23,.24,.25,.26,.27,.28,.29,.30,.32]){
 const name='catch'+(catches+1)+'-'+Math.round(cap*100);
 const gate=`  const centralFixedGuide=this.mode==='endless'&&falling&&falling.y>=610&&
   this.progress.sinceHit>=${[3.25,7,10][catches]}&&this.progress.catchesWithoutHit===${catches}&&
   this.targets.length===3&&this.air.length===0&&
   Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&
   Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>!t.motion&&t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.power==='spring'&&Math.abs(t.x-falling.x)<=this.paddle.width*.8)&&
   this.targets.some(t=>t.x<falling.x-falling.r)&&this.targets.some(t=>t.x>falling.x+falling.r);
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||lowSplitGuide)&&falling','||lowSplitGuide||centralFixedGuide)&&falling')
  .replace('||lowSplitGuide)&&!regularGuide','||lowSplitGuide||centralFixedGuide)&&!regularGuide')
  .replace('||lowSplitGuide)?dt','||lowSplitGuide||centralFixedGuide)?dt')
  .replace('if(lowSplitGuide)maxTilt=.11;','if(centralFixedGuide)maxTilt='+cap+';\n     else if(lowSplitGuide)maxTilt=.11;');
 if(!game.includes('||centralFixedGuide)&&!regularGuide'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage35-game-'+name+'.ts',game);
 const one=audit.replace('../src/game','./stage35-game-'+name).replace(/of \[42,[^\]]+\]/,'of [42]').replace('of Object.keys(MATERIALS) as Material[]',"of ['brass'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['standard'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('stage32-matrix-production.json','stage35-one-'+name+'.json');
 writeFileSync(dir+'stage35-one-'+name+'.ts',one);
 names.push(name);
}
writeFileSync(dir+'stage35-variants.json',JSON.stringify(names)+'\n');
