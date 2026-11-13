import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const cases=[[2217,'brass','standard','follow'],[2217,'brass','standard','steer'],[2217,'steel','large','follow']];
const names=[];
for(const delay of [7,10.5])for(const cap of [.11,.12,.14,.16,.20,.24,.28,.30,.32]){
 const name=(delay===7?'second':'third')+Math.round(cap*100);
 const gate=`  const centralTwoRowGuide=this.mode==='endless'&&falling&&falling.y>=610&&
   this.progress.sinceHit>=${delay}&&this.progress.catchesWithoutHit===${delay===7?1:2}&&
   this.targets.length>=5&&this.targets.length<=7&&this.air.length===0&&
   Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&
   Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>Math.abs(t.x-falling.x)-t.size/2>=falling.r*2.5)&&
   this.targets.some(t=>!t.motion&&t.kind==='steel'&&t.power==='spring'&&t.y>=600&&Math.abs(t.x-falling.x)<=this.paddle.width*.8&&
    this.targets.some(other=>other.motion&&other.kind==='bar'&&Math.abs(other.y-t.y)<=1&&(t.x-falling.x)*(other.x-falling.x)<0));
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||centralMovingSpringGuide)&&falling','||centralMovingSpringGuide||centralTwoRowGuide)&&falling')
  .replace('||centralMovingSpringGuide)&&!regularGuide','||centralMovingSpringGuide||centralTwoRowGuide)&&!regularGuide')
  .replace('||centralMovingSpringGuide)?dt','||centralMovingSpringGuide||centralTwoRowGuide)?dt')
  .replace('else if(centralMovingSpringGuide)maxTilt=.23;','else if(centralMovingSpringGuide)maxTilt=.23;\n     else if(centralTwoRowGuide)maxTilt='+cap+';');
 if(!game.includes('||centralTwoRowGuide)&&!regularGuide')||!game.includes('else if(centralTwoRowGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage38-game-'+name+'.ts',game);
 const trial=audit.replace('../src/game','./stage38-game-'+name).replace(/of \[42,[^\]]+\]/,'of [2217]')
  .replace(' const g=new Game(seed),shots=[];', ' if(!'+JSON.stringify(cases)+'.some(([a,b,c,d])=>a===seed&&b===material&&c===size&&d===policy))continue;\n const g=new Game(seed),shots=[];')
  .replace('stage32-matrix-production.json','stage38-case-'+name+'.json');
 writeFileSync(dir+'stage38-case-'+name+'.ts',trial);
 names.push(name);
}
const baseline=JSON.parse(readFileSync(dir+'stage37-production-matrix.json','utf8')).rows;
let cursor=0;
await Promise.all(Array.from({length:5},async()=>{
 while(cursor<names.length){
  const name=names[cursor++];
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['--import','tsx',dir+'stage38-case-'+name+'.ts'],{stdio:['ignore','ignore','inherit']});
   child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(name+' failed')));
  });
  const rows=JSON.parse(readFileSync(dir+'stage38-case-'+name+'.json','utf8')).rows;
  const summary=rows.map(r=>{
   const b=baseline.find(x=>x.seed===r.seed&&x.material===r.material&&x.size===r.size&&x.policy===r.policy);
   const hits=x=>x.shots.reduce((n,s)=>n+s.hits,0);
   return [r.seed,r.material,r.size,r.policy,r.progress.maxNoHit,r.shots[1].hits,hits(r),r.wave,JSON.stringify(r)===JSON.stringify(b)];
  });
  console.log(JSON.stringify({name,summary}));
 }
}));
