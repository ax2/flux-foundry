import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const variants=[...Array.from({length:25},(_,i)=>[1,(8+i)/100]),...Array.from({length:25},(_,i)=>[2,(8+i)/100])];
const imports=[];
for(const [miss,cap] of variants){
 const name='m'+miss+'a'+Math.round(cap*100);
 const gate=`  const sideBarGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='ceramic'&&this.size==='large'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.progress.sinceHit>=${miss===1?7:10.5}&&this.progress.catchesWithoutHit===${miss}&&
   this.targets.length===5&&(falling.x<this.paddle.width||falling.x>W-this.paddle.width)&&
   Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>!t.motion&&t.y>=560)&&
   (this.targets.every(t=>t.x>falling.x)||this.targets.every(t=>t.x<falling.x))&&
   this.targets.some(t=>t.kind==='bar'&&!t.power&&t.y>=600&&Math.abs(t.x-falling.x)-t.size/2>falling.r&&Math.abs(t.x-falling.x)<this.paddle.width*.65);
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||lowRowGuide)&&falling','||lowRowGuide||sideBarGuide)&&falling')
  .replace('||lowRowGuide)&&!regularGuide','||lowRowGuide||sideBarGuide)&&!regularGuide')
  .replace('||lowRowGuide)?dt','||lowRowGuide||sideBarGuide)?dt')
  .replace('else if(lowRowTilt!==undefined)','else if(sideBarGuide)maxTilt='+cap+';\n     else if(lowRowTilt!==undefined)');
 if(!game.includes('||sideBarGuide)&&!regularGuide')||!game.includes('else if(sideBarGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage42-game-'+name+'.ts',game);
 imports.push([name,miss,cap]);
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
import {isMainThread,parentPort,Worker} from 'node:worker_threads';
const cases=${JSON.stringify(imports)};
async function run([name,miss,cap]){
 const {Game}=await import('./stage42-game-'+name);
 const g=new Game(7429),shots=[];
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
 return {name,miss,cap,peak:g.progress.maxNoHit,shot4:shots[3],hits:g.stats.hits,wave:g.wave,shots};
}
const start=Number(process.argv[2]),stride=Number(process.argv[3]);
for(let i=start;i<cases.length;i+=stride)console.log(JSON.stringify(await run(cases[i])));
`;
writeFileSync(dir+'stage42-screen.ts',driver);