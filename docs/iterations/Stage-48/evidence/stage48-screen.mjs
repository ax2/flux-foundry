import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const cases=[];
for(const seed of [1571,1907])for(const miss of [1,2])for(const cap of Array.from({length:31},(_,i)=>(100+8*i)/1000)){
 const name='s'+seed+'m'+miss+'a'+Math.round(cap*1000);
 const gate=seed===1571?`  const directGapGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='steel'&&this.size==='large'&&
   this.bigTime===0&&this.wideTime>0&&this.air.length===0&&this.progress.sinceHit>=${miss===1?7:10.5}&&this.progress.catchesWithoutHit===${miss}&&
   this.targets.length===4&&Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.filter(t=>t.y>=580).length===3&&this.targets.some(t=>t.motion&&t.kind==='hexagon'&&t.y>=580)&&
   this.targets.some(t=>t.kind==='steel'&&t.power==='spring'&&t.y>=580)&&
   this.targets.some(t=>t.kind==='hexagon'&&t.power==='spring'&&t.y<540);
`:`  const directGapGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='ceramic'&&this.size==='large'&&
   ${miss===1?'this.bigTime>0':'this.bigTime===0'}&&this.wideTime===0&&this.air.length===0&&this.progress.sinceHit>=${miss===1?6.7:10.5}&&this.progress.catchesWithoutHit===${miss}&&
   this.targets.length===3&&Math.abs(falling.x-W/2)<falling.r/4&&Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.motion&&t.kind==='steel'&&t.power==='spring')&&
   this.targets.some(t=>!t.motion&&t.kind==='bar'&&!t.power)&&this.targets.some(t=>!t.motion&&t.kind==='hexagon');
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||wallHexGuide)&&falling','||wallHexGuide||directGapGuide)&&falling')
  .replace('||wallHexGuide)&&!regularGuide','||wallHexGuide||directGapGuide)&&!regularGuide')
  .replace('||wallHexGuide)?dt','||wallHexGuide||directGapGuide)?dt')
  .replace('else if(wallHexGuide)maxTilt=.30;','else if(directGapGuide)maxTilt='+cap+';\n     else if(wallHexGuide)maxTilt=.30;');
 if(!game.includes('||directGapGuide)&&!regularGuide')||!game.includes('else if(directGapGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage48-game-'+name+'.ts',game);
 cases.push({seed,name,miss,cap});
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
const cases=${JSON.stringify(cases)};
async function run({seed,name,miss,cap}){
 const {Game}=await import('./stage48-game-'+name);
 const g=new Game(seed),shots=[];
 while(g.phase==='aim'){
  assert.ok(g.selectBall(seed===1571?'steel':'ceramic','large'));
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
writeFileSync(dir+'stage48-screen.ts',driver);