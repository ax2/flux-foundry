import {readFileSync,writeFileSync} from 'node:fs';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const names=[];
for(const cap of [.07,.08,.09,.10,.11,.12,.14,.16,.20,.24]){
 const name='second'+Math.round(cap*100);
 const gate=`  const lowSplitGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.targets.length===3&&
   this.progress.sinceHit>=3.5&&this.progress.catchesWithoutHit===1&&
   Math.abs(falling.x-this.paddle.x)<=this.paddle.width/8&&Math.abs(falling.vx)<=falling.vy*.06&&
   this.targets.every(t=>!t.motion&&t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.rails.every(r=>r.charges===0)&&
   this.targets.some(t=>t.power==='spring'&&Math.abs(t.x-falling.x)<=this.paddle.width*.65)&&
   this.targets.some(t=>t.x<falling.x)&&this.targets.some(t=>t.x>falling.x);
`;
 const out=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||widePaddleGuide)&&falling','||widePaddleGuide||lowSplitGuide)&&falling')
  .replace('||widePaddleGuide)&&!regularGuide','||widePaddleGuide||lowSplitGuide)&&!regularGuide')
  .replace('movingEndgame||splitRowGuide||widePaddleGuide)?dt','movingEndgame||splitRowGuide||widePaddleGuide||lowSplitGuide)?dt')
  .replace('if(widePaddleGuide)maxTilt=.10;','if(lowSplitGuide)maxTilt='+cap+';\n     else if(widePaddleGuide)maxTilt=.10;');
 if(base===out||!out.includes('||lowSplitGuide)&&!regularGuide'))throw Error('Missing guide anchors');
 writeFileSync('test-results/stage34-game-'+name+'.ts',out);
 const runner=audit.replace('../src/game','./stage34-game-'+name).replace(/of \[42,[^\]]+\]/,'of [7429]').replace('of Object.keys(MATERIALS) as Material[]',"of ['steel'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['large'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('stage32-matrix-production.json','stage34-one-'+name+'.json');
 writeFileSync('test-results/stage34-one-'+name+'.ts',runner);
 names.push(name);
}
writeFileSync('test-results/stage34-variants.json',JSON.stringify(names));
