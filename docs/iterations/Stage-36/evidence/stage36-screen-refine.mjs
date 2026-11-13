import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const cases=[
 [9011,'brass','standard','follow'],
 [815,'brass','standard','follow'],
 [815,'brass','standard','steer'],
 [815,'steel','large','steer'],
 [421,'steel','large','follow'],
];
const names=[];
for(const delay of [7])for(const cap of [.234,.236,.237,.238,.239,.241,.242,.243,.244,.246]){
 const name=(delay===7?'second':'third')+Math.round(cap*1000);
 const gate=`  const centralSpringGuide=this.mode==='endless'&&falling&&falling.y>=610&&
   this.progress.sinceHit>=${delay}&&this.progress.catchesWithoutHit===${delay===7?1:2}&&
   (this.targets.length===3||this.targets.length===4)&&this.air.length===0&&
   Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&
   Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>!t.motion&&t.kind==='steel'&&t.power==='spring'&&Math.abs(t.x-falling.x)<=this.paddle.width*.8&&
    this.targets.some(other=>other.kind==='hexagon'&&(t.x-falling.x)*(other.x-falling.x)<0&&
     Math.abs(other.x-falling.x)<=this.paddle.width*.9));
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||centralFixedGuide)&&falling','||centralFixedGuide||centralSpringGuide)&&falling')
  .replace('||centralFixedGuide)&&!regularGuide','||centralFixedGuide||centralSpringGuide)&&!regularGuide')
  .replace('||centralFixedGuide)?dt','||centralFixedGuide||centralSpringGuide)?dt')
  .replace('if(centralFixedGuide)maxTilt=0.22;','if(centralFixedGuide)maxTilt=0.22;\n     else if(centralSpringGuide)maxTilt='+cap+';');
 if(!game.includes('||centralSpringGuide)&&!regularGuide')||!game.includes('else if(centralSpringGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage36-game-'+name+'.ts',game);
 const trial=audit.replace('../src/game','./stage36-game-'+name).replace(/of \[42,[^\]]+\]/,'of [815,421,9011]')
  .replace(' const g=new Game(seed),shots=[];', ' if(!'+JSON.stringify(cases)+'.some(([a,b,c,d])=>a===seed&&b===material&&c===size&&d===policy))continue;\n const g=new Game(seed),shots=[];')
  .replace('stage32-matrix-production.json','stage36-case-'+name+'.json');
 writeFileSync(dir+'stage36-case-'+name+'.ts',trial);
 names.push(name);
}
const baseline=JSON.parse(readFileSync(dir+'stage35-production-matrix.json','utf8')).rows;
let cursor=0;
await Promise.all(Array.from({length:5},async()=>{
 while(cursor<names.length){
  const name=names[cursor++];
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['--import','tsx',dir+'stage36-case-'+name+'.ts'],{stdio:['ignore','ignore','inherit']});
   child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(name+' failed')));
  });
  const rows=JSON.parse(readFileSync(dir+'stage36-case-'+name+'.json','utf8')).rows;
  const summary=rows.map(r=>{
   const b=baseline.find(x=>x.seed===r.seed&&x.material===r.material&&x.size===r.size&&x.policy===r.policy);
   const hits=x=>x.shots.reduce((n,s)=>n+s.hits,0);
   return [r.seed,r.material,r.size,r.policy,r.progress.maxNoHit,r.shots[1].hits,hits(r),r.wave,JSON.stringify(r)===JSON.stringify(b)];
  });
  console.log(JSON.stringify({name,summary}));
 }
}));
