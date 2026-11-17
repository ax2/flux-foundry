import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const dir='test-results/';
const main=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const cases=[];
for(const miss of [0])for(const framed of [true])for(const cap of Array.from({length:101},(_,i)=>(125+2*i)/1000)){
 const key='m'+miss+'f'+Number(framed)+'a'+Math.round(cap*1000);
 const guide=`  // A central lane between springs on staggered rows can repeat a vertical return.
  const staggeredSpringGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='steel'&&this.size==='large'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.targets.length===4&&
   this.progress.sinceHit>=${miss===0?3:miss===1?7:10}&&this.progress.catchesWithoutHit===${miss}&&
   Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.some(t=>t.motion&&t.kind==='steel'&&t.power==='spring'&&t.y>=550&&
    Math.abs(t.x-falling.x)<this.paddle.width&&this.targets.some(u=>u.motion&&u.kind==='hexagon'&&u.power==='spring'&&
     t.y-u.y>=60&&(t.x-falling.x)*(u.x-falling.x)<0))&&
   this.targets.some(t=>!t.motion&&t.kind==='hexagon'&&t.y>=550&&t.x<falling.x)&&
   this.targets.some(t=>!t.motion&&t.kind==='diamond'&&t.y>=550&&t.x>falling.x);
`;
 const source=main.replace('  if(falling&&(regularGuide',guide+'  if(falling&&(regularGuide')
  .replace('||lastBarGuide)&&falling','||lastBarGuide||staggeredSpringGuide)&&falling')
  .replace('||lastBarGuide)?dt',framed?'||lastBarGuide||staggeredSpringGuide)?dt':'||lastBarGuide)?dt')
  .replace('||lastBarGuide)&&(!regularGuide','||lastBarGuide||staggeredSpringGuide)&&(!regularGuide')
  .replace('else if(lastBarGuide)maxTilt=.475;','else if(staggeredSpringGuide)maxTilt='+cap+';\n     else if(lastBarGuide)maxTilt=.475;')
  .replace('(lastBarGuide?1.3:.45)','(lastBarGuide?1.3:staggeredSpringGuide?.85:.45)');
 assert.ok(source.includes('||lastBarGuide||staggeredSpringGuide)&&falling'));
 writeFileSync(dir+'stage51-dense-game-'+key+'.ts',source);
 cases.push({key,miss,cap,framed});
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
const cases=${JSON.stringify(cases)};
const full=process.argv[2]==='full';
for(const entry of cases.filter((_,i)=>i%8===Number(process.argv[3]))){
 const {Game}=await import('./stage51-dense-game-'+entry.key);
 const g=new Game(7429),shots=[];
 while(g.phase==='aim'&&(full||g.shots<3)){
  assert.ok(g.selectBall('steel','large'));
  const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());
  const before=g.stats.hits,ball=g.balls[0];let i=0,gap=0;let events=[],h=before,c=g.stats.paddleHits;
  while(g.phase==='volley'&&i<900/STEP){
   if(i%14===0)steer(g,'follow');
   gap=Math.max(gap,g.progress.sinceHit+STEP);
   g.update(STEP);i++;
   if(g.phase==='volley')assert.equal(g.balls[0],ball);
   if(g.shots===3&&(g.stats.hits!==h||g.stats.paddleHits!==c))events.push([i*STEP,g.stats.hits-before,g.stats.paddleHits-c,g.paddle.tilt,ball.x,ball.vx]);
   h=g.stats.hits;c=g.stats.paddleHits;
  }
  assert.ok(g.phase!=='volley'&&ball.y-ball.r>=692);
  shots.push({seconds:i*STEP,hits:g.stats.hits-before,gap,events});
 }
 console.log(JSON.stringify({...entry,hits:g.stats.hits,peak:g.progress.maxNoHit,wave:g.wave,shots}));
}
`;
writeFileSync(dir+'stage51-dense-sweep.ts',driver);
const mode=process.argv[2]||'short';
await Promise.all(Array.from({length:8},(_,i)=>new Promise((ok,bad)=>{
 const child=spawn(process.execPath,['--import','tsx',dir+'stage51-dense-sweep.ts',mode,String(i)],{stdio:['ignore','pipe','inherit']});let buf='';
 child.stdout.on('data',x=>{buf+=x;});
 child.on('error',bad);child.on('close',code=>{writeFileSync(dir+'stage51-dense-'+mode+'-'+i+'.jsonl',buf);code===0?ok():bad(Error('Worker '+i+': '+code));});
})));
const rows=Array.from({length:8},(_,i)=>readFileSync(dir+'stage51-dense-'+mode+'-'+i+'.jsonl','utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)).flat();
assert.equal(rows.length,cases.length);
writeFileSync(dir+'stage51-dense-'+mode+'-sweep.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows.filter(r=>r.shots[2].hits>=8&&r.shots[2].gap<14).sort((a,b)=>a.peak-b.peak||b.hits-a.hits).slice(0,18).map(r=>[r.key,r.peak,r.hits,r.shots[2].hits,r.shots[2].seconds])));
