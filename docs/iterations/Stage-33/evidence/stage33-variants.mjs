import {readFileSync,writeFileSync} from 'node:fs';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-31/evidence/stage31-matrix-outward.ts','utf8');
const names=[];
for(const catches of [1,2])for(const cap of catches===1?[.06,.08,.10,.12,.14,.16,.18,.20]:[.12,.14,.16,.18,.20,.22,.24]){
 const name=(catches===1?'second':'third')+Math.round(cap*100);
 const constraint=catches===1?'this.bigTime>0&&this.wideTime>0':'this.bigTime===0&&this.wideTime>0';
 const gate=`  const widePaddleGuide=this.mode==='endless'&&falling&&falling.y>=610&&${constraint}&&
   this.progress.sinceHit>=${catches===1?7:10}&&this.progress.catchesWithoutHit===${catches}&&this.targets.length>=4&&
   Math.abs(falling.x-this.paddle.x)<=this.paddle.width/8&&Math.abs(falling.vx)<=falling.vy*.2&&
   this.targets.some(t=>t.motion&&t.power==='spring'&&t.y>=560)&&
   (this.targets.every(t=>t.x<falling.x)||this.targets.every(t=>t.x>falling.x));
`;
 const out=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||splitRowGuide)&&falling','||splitRowGuide||widePaddleGuide)&&falling')
  .replace('||splitRowGuide)&&!regularGuide','||splitRowGuide||widePaddleGuide)&&!regularGuide')
  .replace('movingEndgame||splitRowGuide)?dt','movingEndgame||splitRowGuide||widePaddleGuide)?dt')
  .replace('maxTilt=splitRowGuide','maxTilt=widePaddleGuide?'+cap+':splitRowGuide');
 if(base===out||!out.includes('||widePaddleGuide)&&!regularGuide'))throw Error('Missing guide anchors');
 writeFileSync('test-results/stage33-game-'+name+'.ts',out);
 const runner=audit.replace('../src/game','./stage33-game-'+name).replace(/of \[42,[^\]]+\]/,'of [7429]').replace('of Object.keys(MATERIALS) as Material[]',"of ['steel'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['standard'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('stage31-matrix-outward.json','stage33-one-'+name+'.json');
 writeFileSync('test-results/stage33-one-'+name+'.ts',runner);
 names.push(name);
}
writeFileSync('test-results/stage33-variants.json',JSON.stringify(names));
