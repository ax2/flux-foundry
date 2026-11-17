import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const dir='test-results/';
const main=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const cases=[];
for(const miss of [0,1,2])for(const framed of [true])for(const cap of [.14,.16,.18,.20,.22,.24,.26,.28,.30,.32,.36,.40]){
 const key='m'+miss+'f'+Number(framed)+'a'+Math.round(cap*1000);
 const guide=`  const stage55TrialGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='brass'&&this.size==='small'&&
   this.bigTime>.6&&this.wideTime===0&&this.targets.length===3&&this.air.length===0&&
   this.progress.sinceHit>=${miss===0?1.8:miss===1?5.3:9.1}&&this.progress.catchesWithoutHit===${miss}&&
   Math.abs(falling.x-this.paddle.x)<this.paddle.width*.5&&
   this.targets.every(t=>!t.motion&&t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.kind==='hexagon'&&t.power==='spring'&&Math.abs(t.x-W/2)<falling.r&&
    this.targets.some(u=>u.kind==='bar'&&!u.power)&&this.targets.some(u=>u.kind==='prism'&&!u.power));
`;
 const source=main.replace('  if(falling&&(regularGuide',guide+'  if(falling&&(regularGuide')
  .replace('||upperWindRowGuide)&&falling','||upperWindRowGuide||stage55TrialGuide)&&falling')
  .replace('||upperWindRowGuide)?dt','||upperWindRowGuide||stage55TrialGuide)?dt')
  .replace('||upperWindRowGuide)&&(!regularGuide','||upperWindRowGuide||stage55TrialGuide)&&(!regularGuide')
  .replace('else if(upperWindRowGuide)maxTilt=.22;','else if(stage55TrialGuide)maxTilt='+cap+';\n     else if(upperWindRowGuide)maxTilt=.22;');
 assert.ok(source.includes('||upperWindRowGuide||stage55TrialGuide)&&falling'));
 writeFileSync(dir+'stage55-enlarged-game-'+key+'.ts',source);
 cases.push({key,miss,cap,framed});
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
const cases=${JSON.stringify(cases)};
const full=process.argv[2]==='full';
for(const entry of cases.filter((_,i)=>i%8===Number(process.argv[3]))){
 const {Game}=await import('./stage55-enlarged-game-'+entry.key);
 for(const seed of [7817]){const g=new Game(seed),shots=[];
 while(g.phase==='aim'&&(full||g.shots<4)){
  assert.ok(g.selectBall('brass','small'));
  const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());
  const before=g.stats.hits,ball=g.balls[0];let i=0,gap=0;let events=[],h=before,c=g.stats.paddleHits;
  while(g.phase==='volley'&&i<900/STEP){
   if(i%14===0)steer(g,'follow');
   gap=Math.max(gap,g.progress.sinceHit+STEP);
   g.update(STEP);i++;
   if(g.phase==='volley')assert.equal(g.balls[0],ball);
   if(g.shots===4&&(g.stats.hits!==h||g.stats.paddleHits!==c))events.push([i*STEP,g.stats.hits-before,g.stats.paddleHits-c,g.paddle.tilt,ball.x,ball.vx]);
   h=g.stats.hits;c=g.stats.paddleHits;
  }
  assert.ok(g.phase!=='volley'&&ball.y-ball.r>=692);
  shots.push({seconds:i*STEP,hits:g.stats.hits-before,gap,events});
 }
 console.log(JSON.stringify({...entry,seed,hits:g.stats.hits,peak:g.progress.maxNoHit,wave:g.wave,shots}));}
}
`;
writeFileSync(dir+'stage55-enlarged-sweep.ts',driver);
const mode=process.argv[2]||'short';
await Promise.all(Array.from({length:8},(_,i)=>new Promise((ok,bad)=>{
 const child=spawn(process.execPath,['--import','tsx',dir+'stage55-enlarged-sweep.ts',mode,String(i)],{stdio:['ignore','pipe','inherit']});let buf='';
 child.stdout.on('data',x=>{buf+=x;});
 child.on('error',bad);child.on('close',code=>{writeFileSync(dir+'stage55-enlarged-'+mode+'-'+i+'.jsonl',buf);code===0?ok():bad(Error('Worker '+i+': '+code));});
})));
const rows=Array.from({length:8},(_,i)=>readFileSync(dir+'stage55-enlarged-'+mode+'-'+i+'.jsonl','utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)).flat();
assert.equal(rows.length,cases.length);
writeFileSync(dir+'stage55-enlarged-'+mode+'-sweep.json',JSON.stringify(rows,null,2)+'\n');
console.log(JSON.stringify(rows.filter(r=>r.shots[3]?.hits>=25&&r.shots[3].gap<15&&r.wave===15&&r.shots.length===15&&r.hits>=485).sort((a,b)=>a.peak-b.peak).slice(0,12).map(r=>[r.key,r.peak,r.hits,r.shots[3].gap,r.shots[3].hits])));
