import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const dir='test-results/';
const main=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const cases=[];
for(const miss of [0,1,2])for(const framed of [true])for(const cap of Array.from({length:81},(_,i)=>(155+2*i)/1000)){
 const key='m'+miss+'f'+Number(framed)+'a'+Math.round(cap*1000);
 const guide=`  const stage55TrialGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='steel'&&this.size==='standard'&&
   this.bigTime===0&&this.wideTime===0&&this.targets.length===4&&this.air.length===1&&this.air.every(z=>z.y+z.h<470&&z.fx!==0&&z.fy===0)&&
   this.progress.sinceHit>=${miss===0?4:miss===1?7.5:11.2}&&this.progress.catchesWithoutHit===${miss}&&
   Math.abs(falling.x-W/2)>this.paddle.width&&this.targets.every(t=>!t.motion&&(t.x-falling.x)*(falling.x-W/2)<0&&t.y>=560)&&
   this.targets.some(t=>t.kind==='capacitor'&&t.power==='spring')&&this.targets.some(t=>t.kind==='hexagon'&&t.power==='spring')&&
   this.targets.some(t=>t.kind==='bar'&&!t.power)&&this.targets.some(t=>t.kind==='diamond'&&!t.power);
`;
 const source=main.replace('  if(falling&&(regularGuide',guide+'  if(falling&&(regularGuide')
  .replace('||upperWindRowGuide)&&falling','||upperWindRowGuide||stage55TrialGuide)&&falling')
  .replace('||upperWindRowGuide)?dt','||upperWindRowGuide||stage55TrialGuide)?dt')
  .replace('||upperWindRowGuide)&&(!regularGuide','||upperWindRowGuide||stage55TrialGuide)&&(!regularGuide')
  .replace('(lastBarGuide?1.3:staggeredSpringGuide?.85:.45)','(stage55TrialGuide?1.95:lastBarGuide?1.3:staggeredSpringGuide?.85:.45)')
  .replace('else if(upperWindRowGuide)maxTilt=.22;','else if(stage55TrialGuide)maxTilt='+cap+';\n     else if(upperWindRowGuide)maxTilt=.22;');
 assert.ok(source.includes('||upperWindRowGuide||stage55TrialGuide)&&falling'));
 writeFileSync(dir+'stage55-crosswind-fine-game-'+key+'.ts',source);
 cases.push({key,miss,cap,framed});
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
const cases=${JSON.stringify(cases)};
const full=process.argv[2]==='full';
for(const entry of cases.filter((_,i)=>i%8===Number(process.argv[3]))){
 const {Game}=await import('./stage55-crosswind-fine-game-'+entry.key);
 for(const seed of [2843]){const g=new Game(seed),shots=[];
 while(g.phase==='aim'&&(full||g.shots<6)){
  assert.ok(g.selectBall('steel','standard'));
  const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());
  const before=g.stats.hits,ball=g.balls[0];let i=0,gap=0;let events=[],h=before,c=g.stats.paddleHits;
  while(g.phase==='volley'&&i<900/STEP){
   if(i%14===0)steer(g,'steer');
   gap=Math.max(gap,g.progress.sinceHit+STEP);
   g.update(STEP);i++;
   if(g.phase==='volley')assert.equal(g.balls[0],ball);
   if(g.shots===6&&(g.stats.hits!==h||g.stats.paddleHits!==c))events.push([i*STEP,g.stats.hits-before,g.stats.paddleHits-c,g.paddle.tilt,ball.x,ball.vx]);
   h=g.stats.hits;c=g.stats.paddleHits;
  }
  assert.ok(g.phase!=='volley'&&ball.y-ball.r>=692);
  shots.push({seconds:i*STEP,hits:g.stats.hits-before,gap,events});
 }
 console.log(JSON.stringify({...entry,seed,hits:g.stats.hits,peak:g.progress.maxNoHit,wave:g.wave,shots}));}
}
`;
writeFileSync(dir+'stage55-crosswind-fine-sweep.ts',driver);
const mode=process.argv[2]||'short';
await Promise.all(Array.from({length:8},(_,i)=>new Promise((ok,bad)=>{
 const child=spawn(process.execPath,['--import','tsx',dir+'stage55-crosswind-fine-sweep.ts',mode,String(i)],{stdio:['ignore','pipe','inherit']});let buf='';
 child.stdout.on('data',x=>{buf+=x;});
 child.on('error',bad);child.on('close',code=>{writeFileSync(dir+'stage55-crosswind-fine-'+mode+'-'+i+'.jsonl',buf);code===0?ok():bad(Error('Worker '+i+': '+code));});
})));
const rows=Array.from({length:8},(_,i)=>readFileSync(dir+'stage55-crosswind-fine-'+mode+'-'+i+'.jsonl','utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)).flat();
assert.equal(rows.length,cases.length);
writeFileSync(dir+'stage55-crosswind-fine-'+mode+'-sweep.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows.filter(r=>r.shots[5]?.hits>=104&&r.shots[5].gap<15&&r.wave===15&&r.shots.length===15&&r.hits>=793).sort((a,b)=>a.peak-b.peak).slice(0,12).map(r=>[r.key,r.peak,r.hits,r.shots[5].gap,r.shots[5].hits])));
