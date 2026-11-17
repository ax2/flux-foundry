import {readFileSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const dir='test-results/';
const main=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const cases=[];
for(const miss of [0,1])for(const framed of [true])for(const cap of Array.from({length:89},(_,i)=>(140+2*i)/1000)){
 const key='m'+miss+'f'+Number(framed)+'a'+Math.round(cap*1000);
 const guide=`  const wideCapacitorRowGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='brass'&&this.size==='standard'&&
   this.bigTime===0&&this.wideTime>.55&&this.targets.length===4&&this.air.length===0&&
   this.progress.sinceHit>=${miss===0?3.5:7.4}&&this.progress.catchesWithoutHit===${miss}&&
   Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.kind==='steel'&&t.power==='spring'&&t.motion&&Math.abs(t.x-falling.x)<this.paddle.width&&
    this.targets.every(u=>u===t||u.kind==='capacitor'&&!u.power&&!u.motion)&&
    this.targets.some(u=>u.kind==='capacitor'&&(t.x-falling.x)*(u.x-falling.x)<0));
`;
 const source=main.replace('  if(falling&&(regularGuide',guide+'  if(falling&&(regularGuide')
  .replace('||sideWindSteelGuide)&&falling','||sideWindSteelGuide||wideCapacitorRowGuide)&&falling')
  .replace('||sideWindSteelGuide)?dt','||sideWindSteelGuide||wideCapacitorRowGuide)?dt')
  .replace('||sideWindSteelGuide)&&(!regularGuide','||sideWindSteelGuide||wideCapacitorRowGuide)&&(!regularGuide')
  .replace('else if(sideWindSteelGuide)maxTilt=.241;','else if(wideCapacitorRowGuide)maxTilt='+cap+';\n     else if(sideWindSteelGuide)maxTilt=.241;');
 assert.ok(source.includes('||sideWindSteelGuide||wideCapacitorRowGuide)&&falling'));
 writeFileSync(dir+'stage56-wide-fine-game-'+key+'.ts',source);
 cases.push({key,miss,cap,framed});
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
const cases=${JSON.stringify(cases)};
const full=process.argv[2]==='full';
for(const entry of cases.filter((_,i)=>i%8===Number(process.argv[3]))){
 const {Game}=await import('./stage56-wide-fine-game-'+entry.key);
 for(const policy of ["follow","steer"] as const){const seed=5167,g=new Game(seed),shots=[];
 while(g.phase==='aim'&&(full||g.shots<2)){
  assert.ok(g.selectBall('brass','standard'));
  const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());
  const before=g.stats.hits,ball=g.balls[0];let i=0,gap=0;let events=[],h=before,c=g.stats.paddleHits;
  while(g.phase==='volley'&&i<900/STEP){
   if(i%14===0)steer(g,policy);
   gap=Math.max(gap,g.progress.sinceHit+STEP);
   g.update(STEP);i++;
   if(g.phase==='volley')assert.equal(g.balls[0],ball);
   if(g.shots===2&&(g.stats.hits!==h||g.stats.paddleHits!==c))events.push([i*STEP,g.stats.hits-before,g.stats.paddleHits-c,g.paddle.tilt,ball.x,ball.vx]);
   h=g.stats.hits;c=g.stats.paddleHits;
  }
  assert.ok(g.phase!=='volley'&&ball.y-ball.r>=692);
  shots.push({seconds:i*STEP,hits:g.stats.hits-before,gap,events});
 }
 console.log(JSON.stringify({...entry,seed,policy,hits:g.stats.hits,peak:g.progress.maxNoHit,wave:g.wave,shots}));}
}
`;
writeFileSync(dir+'stage56-wide-fine-sweep.ts',driver);
const mode=process.argv[2]||'short';
await Promise.all(Array.from({length:8},(_,i)=>new Promise((ok,bad)=>{
 const child=spawn(process.execPath,['--import','tsx',dir+'stage56-wide-fine-sweep.ts',mode,String(i)],{stdio:['ignore','pipe','inherit']});let buf='';
 child.stdout.on('data',x=>{buf+=x;});
 child.on('error',bad);child.on('close',code=>{writeFileSync(dir+'stage56-wide-fine-'+mode+'-'+i+'.jsonl',buf);code===0?ok():bad(Error('Worker '+i+': '+code));});
})));
const rows=Array.from({length:8},(_,i)=>readFileSync(dir+'stage56-wide-fine-'+mode+'-'+i+'.jsonl','utf8').trim().split(/\r?\n/).filter(Boolean).map(JSON.parse)).flat();
assert.equal(rows.length,cases.length*2);
writeFileSync(dir+'stage56-wide-fine-'+mode+'-sweep.json',JSON.stringify(rows,null,2)+'\n');
const limits={follow:[25,677],steer:[16,605]};
console.log(JSON.stringify(rows.filter(r=>r.shots[1]?.hits>=limits[r.policy][0]&&r.shots[1].gap<15&&r.wave===15&&r.shots.length===15&&r.hits>=limits[r.policy][1]).sort((a,b)=>a.peak-b.peak).slice(0,14).map(r=>[r.key,r.policy,r.peak,r.hits,r.shots[1].gap,r.shots[1].hits])));
