import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const variants=[...Array.from({length:25},(_,i)=>[1,(8+i)/100]),...Array.from({length:25},(_,i)=>[2,(8+i)/100])];
const imports=[];
for(const [miss,cap] of variants){
 const name='m'+miss+'a'+Math.round(cap*100);
 const gate=`  const raisedSquareGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='ceramic'&&this.size==='large'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.progress.sinceHit>=${miss===1?7:10.5}&&this.progress.catchesWithoutHit===${miss}&&
   this.targets.length===3&&Math.abs(falling.x-W/2)<falling.r/4&&
   Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>t.kind==='steel'&&t.y>=580&&t.y<600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>!t.motion&&t.power==='spring'&&Math.abs(t.x-falling.x)<this.paddle.width)&&
   this.targets.some(t=>t.motion&&!t.power&&Math.abs(t.x-falling.x)<this.paddle.width);
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||sideBarGuide)&&falling','||sideBarGuide||raisedSquareGuide)&&falling')
  .replace('||sideBarGuide)&&!regularGuide','||sideBarGuide||raisedSquareGuide)&&!regularGuide')
  .replace('||sideBarGuide)?dt','||sideBarGuide||raisedSquareGuide)?dt')
  .replace('else if(sideBarGuide)maxTilt=.10;','else if(raisedSquareGuide)maxTilt='+cap+';\n     else if(sideBarGuide)maxTilt=.10;');
 if(!game.includes('||raisedSquareGuide)&&!regularGuide')||!game.includes('else if(raisedSquareGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage43-game-'+name+'.ts',game);
 imports.push([name,miss,cap]);
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
import {isMainThread,parentPort,Worker} from 'node:worker_threads';
const cases=${JSON.stringify(imports)};
async function run([name,miss,cap]){
 const {Game}=await import('./stage43-game-'+name);
 const g=new Game(934),shots=[];
 let shotGap=0;
 while(g.phase==='aim'){
  assert.ok(g.selectBall('ceramic','large'));
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
 return {name,miss,cap,peak:g.progress.maxNoHit,shot3:shots[2],hits:g.stats.hits,wave:g.wave,shots};
}
const start=Number(process.argv[2]),stride=Number(process.argv[3]);
for(let i=start;i<cases.length;i+=stride)console.log(JSON.stringify(await run(cases[i])));
`;
writeFileSync(dir+'stage43-screen.ts',driver);