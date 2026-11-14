import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const cases=[];
for(const seed of [934])for(const miss of [1,2])for(const cap of Array.from({length:178},(_,i)=>(168+i)/1000)){
 const name='s'+seed+'m'+miss+'a'+Math.round(cap*1000);
 const gate=seed===934?`  const directGapGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='brass'&&this.size==='standard'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.progress.sinceHit>=${miss===1?6.75:10.5}&&this.progress.catchesWithoutHit===${miss}&&
   this.targets.length===3&&Math.abs(falling.x-W/2)<falling.r/4&&
   Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.motion&&t.kind==='hexagon'&&t.power==='spring'&&Math.abs(t.x-falling.x)<this.paddle.width&&
    this.targets.some(b=>!b.motion&&b.kind==='bar'&&!b.power&&(b.x-falling.x)*(t.x-falling.x)<0&&Math.abs(b.x-falling.x)<this.paddle.width))&&
   this.targets.some(t=>!t.motion&&t.kind==='steel'&&!t.power);
`:`  const directGapGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='brass'&&this.size==='standard'&&
   this.bigTime===0&&this.wideTime===0&&this.progress.sinceHit>=${miss===1?5.5:9}&&this.progress.catchesWithoutHit===${miss}&&
   this.air.length>0&&this.air.every(zone=>zone.y+zone.h<470)&&
   this.targets.length===4&&(falling.x<this.paddle.width||falling.x>W-this.paddle.width)&&
   this.targets.every(t=>t.y>=580&&t.y<600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   (this.targets.every(t=>t.x>falling.x)||this.targets.every(t=>t.x<falling.x))&&
   this.targets.some(t=>!t.motion&&t.kind==='hexagon'&&t.power==='spring'&&Math.abs(t.x-falling.x)<this.paddle.width*1.2)&&
   this.targets.some(t=>!t.motion&&t.kind==='bar'&&t.power==='spring')&&this.targets.some(t=>t.motion&&t.kind==='diamond');
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||singleSpringGuide)&&falling','||singleSpringGuide||directGapGuide)&&falling')
  .replace('||singleSpringGuide)&&!regularGuide','||singleSpringGuide||directGapGuide)&&!regularGuide')
  .replace('||singleSpringGuide)?dt','||singleSpringGuide||directGapGuide)?dt')
  .replace('else if(singleSpringGuide)maxTilt=.155;','else if(directGapGuide)maxTilt='+cap+';\n     else if(singleSpringGuide)maxTilt=.155;');
 if(!game.includes('||directGapGuide)&&!regularGuide')||!game.includes('else if(directGapGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage47-fine-game-'+name+'.ts',game);
 cases.push({seed,name,miss,cap});
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
const cases=${JSON.stringify(cases)};
async function run({seed,name,miss,cap}){
 const {Game}=await import('./stage47-fine-game-'+name);
 const g=new Game(seed),shots=[];
 while(g.phase==='aim'){
  assert.ok(g.selectBall('brass','standard'));
  const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());
  const before=g.stats.hits,ball=g.balls[0];
  let i=0,gap=0;
  while(g.phase==='volley'&&i<900/STEP){
   if(i%14===0)steer(g,'follow');
   gap=Math.max(gap,g.progress.sinceHit+STEP);
   g.update(STEP);i++;
   if(g.phase==='volley')assert.equal(g.balls[0],ball);
  }
  assert.notEqual(g.phase,'volley');assert.ok(ball.y-ball.r>=692);
  shots.push([g.stats.hits-before,gap,i*STEP]);
 }
 return {seed,name,miss,cap,peak:g.progress.maxNoHit,hits:g.stats.hits,wave:g.wave,shots};
}
const start=Number(process.argv[2]),stride=Number(process.argv[3]);
for(let i=start;i<cases.length;i+=stride)console.log(JSON.stringify(await run(cases[i])));
`;
writeFileSync(dir+'stage47-fine-screen.ts',driver);