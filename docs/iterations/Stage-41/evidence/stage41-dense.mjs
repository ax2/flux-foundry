import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const names=[];
for(const miss of [1,2])for(const cap of Array.from({length:151},(_,i)=>(175+i)/1000)){
 const name=(miss===1?'second':'third')+Math.round(cap*1000);
 const gate=`  const centralOpenRowGuide=this.mode==='endless'&&falling&&falling.y>=610&&
   this.wideTime===0&&this.bigTime===0&&this.progress.sinceHit>=${miss===1?7:10.5}&&this.progress.catchesWithoutHit===${miss}&&
   (this.targets.length===3||this.targets.length===4)&&this.air.length===0&&
   Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&
   Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1&&Math.abs(t.x-falling.x)-t.size/2>=falling.r*2.5)&&
   this.targets.some(t=>t.kind==='steel'&&t.power==='spring'&&Math.abs(t.x-falling.x)<=this.paddle.width&&
    this.targets.some(other=>!other.power&&(t.x-falling.x)*(other.x-falling.x)<0&&Math.abs(other.x-falling.x)<=this.paddle.width&&
     (t.motion?other.kind==='prism'&&!other.motion:other.motion&&other.kind==='capacitor')));
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||centralLowRowGuide)&&falling','||centralLowRowGuide||centralOpenRowGuide)&&falling')
  .replace('||centralLowRowGuide)&&!regularGuide','||centralLowRowGuide||centralOpenRowGuide)&&!regularGuide')
  .replace('||centralLowRowGuide)?dt','||centralLowRowGuide||centralOpenRowGuide)?dt')
  .replace('else if(centralLowRowGuide){','else if(centralOpenRowGuide)maxTilt='+cap+';\n     else if(centralLowRowGuide){');
 if(!game.includes('||centralOpenRowGuide)&&!regularGuide')||!game.includes('else if(centralOpenRowGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage41-game-'+name+'.ts',game);
 const trial=audit.replace('../src/game','./stage41-game-'+name).replace(/of \[42,[^\]]+\]/,'of [1229]')
  .replace(' const g=new Game(seed),shots=[];', " if(material!=='brass'||size!=='standard'||policy!=='follow')continue;\n const g=new Game(seed),shots=[];")
  .replace('stage32-matrix-production.json','stage41-case-'+name+'.json');
 writeFileSync(dir+'stage41-case-'+name+'.ts',trial);
 names.push(name);
}
const baseline=JSON.parse(readFileSync('docs/iterations/Stage-40/evidence/stage40-production-matrix.json','utf8')).rows;
let cursor=0;
await Promise.all(Array.from({length:8},async()=>{
 while(cursor<names.length){
  const name=names[cursor++];
  await new Promise((resolve,reject)=>{
   const child=spawn(process.execPath,['--import','tsx',dir+'stage41-case-'+name+'.ts'],{stdio:['ignore','ignore','inherit']});
   child.on('error',reject);child.on('close',code=>code===0?resolve():reject(Error(name+' failed')));
  });
  const rows=JSON.parse(readFileSync(dir+'stage41-case-'+name+'.json','utf8')).rows;
  const summary=rows.map(r=>{
   const b=baseline.find(x=>x.seed===r.seed&&x.material===r.material&&x.size===r.size&&x.policy===r.policy);
   const hits=x=>x.shots.reduce((n,s)=>n+s.hits,0);
   return [r.seed,r.progress.maxNoHit,r.shots[1].hits,hits(r),r.wave,JSON.stringify(r)===JSON.stringify(b)];
  });
  console.log(JSON.stringify({name,summary}));
 }
}));