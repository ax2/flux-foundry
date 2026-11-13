import {readFileSync,writeFileSync} from 'node:fs';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const names=[];
for(const cap of [.04,.045,.05,.055,.06,.07,.08,.09,.10,.12,.14,.16,.20]){
 const name='small'+Math.round(cap*1000);
 const gate=`  const enlargedBallGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.bigTime>0&&this.wideTime===0&&
   this.progress.sinceHit>=6.5&&this.progress.catchesWithoutHit===1&&this.targets.length>=4&&
   Math.abs(falling.x-this.paddle.x)<=this.paddle.width/8&&Math.abs(falling.vx)<=falling.vy*.05&&
   this.targets.some(t=>t.motion&&t.power==='spring'&&t.y>=560&&Math.abs(t.x-falling.x)<=this.paddle.width*.75)&&
   (this.targets.every(t=>t.x<falling.x)||this.targets.every(t=>t.x>falling.x));
`;
 const out=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||widePaddleGuide)&&falling','||widePaddleGuide||enlargedBallGuide)&&falling')
  .replace('||widePaddleGuide)&&!regularGuide','||widePaddleGuide||enlargedBallGuide)&&!regularGuide')
  .replace('movingEndgame||splitRowGuide||widePaddleGuide)?dt','movingEndgame||splitRowGuide||widePaddleGuide||enlargedBallGuide)?dt')
  .replace('if(widePaddleGuide)maxTilt=.10;','if(enlargedBallGuide)maxTilt='+cap+';\n     else if(widePaddleGuide)maxTilt=.10;');
 if(base===out||!out.includes('||enlargedBallGuide)&&!regularGuide'))throw Error('Missing guide anchors');
 writeFileSync('test-results/stage34-game-'+name+'.ts',out);
 const runner=audit.replace('../src/game','./stage34-game-'+name).replace(/of \[42,[^\]]+\]/,'of [10103]').replace('of Object.keys(MATERIALS) as Material[]',"of ['steel'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['small'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('stage32-matrix-production.json','stage34-one-'+name+'.json');
 writeFileSync('test-results/stage34-one-'+name+'.ts',runner);
 names.push(name);
}
writeFileSync('test-results/stage34-small-variants.json',JSON.stringify(names));
