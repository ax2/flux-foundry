import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const variants=[1,2].flatMap(miss=>Array.from({length:170},(_,i)=>[miss,(151+i)/1000]).filter(([,cap])=>Math.round(cap*1000)%10!==0));
const imports=[];
for(const [miss,cap] of variants){
 const name='m'+miss+'a'+Math.round(cap*1000);
 const gate=`  const fixedBarGapGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='brass'&&this.size==='standard'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.progress.sinceHit>=${miss===1?7:10.5}&&this.progress.catchesWithoutHit===${miss}&&
   this.targets.length===3&&Math.abs(falling.x-W/2)<falling.r/4&&
   Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>!t.motion&&t.y>=560&&t.y<580&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.kind==='steel'&&t.power==='spring'&&Math.abs(t.x-falling.x)<this.paddle.width&&
    this.targets.filter(b=>b.kind==='bar'&&!b.power&&(b.x-falling.x)*(t.x-falling.x)<0).length===2&&
    this.targets.some(b=>b.kind==='bar'&&Math.abs(b.x-falling.x)<this.paddle.width));
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||offCenterBarGuide)&&falling','||offCenterBarGuide||fixedBarGapGuide)&&falling')
  .replace('||offCenterBarGuide)&&!regularGuide','||offCenterBarGuide||fixedBarGapGuide)&&!regularGuide')
  .replace('||offCenterBarGuide)?dt','||offCenterBarGuide||fixedBarGapGuide)?dt')
  .replace('else if(offCenterBarGuide)maxTilt=.23;','else if(fixedBarGapGuide)maxTilt='+cap+';\n     else if(offCenterBarGuide)maxTilt=.23;');
 if(!game.includes('||fixedBarGapGuide)&&!regularGuide')||!game.includes('else if(fixedBarGapGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage45-dense-game-'+name+'.ts',game);
 imports.push([name,miss,cap]);
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';

const cases=${JSON.stringify(imports)};
async function run([name,miss,cap]){
 const {Game}=await import('./stage45-dense-game-'+name);
 const g=new Game(2026),shots=[];

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
 return {name,miss,cap,peak:g.progress.maxNoHit,shot2:shots[1],shot5:shots[4],hits:g.stats.hits,wave:g.wave,shots};
}
const start=Number(process.argv[2]),stride=Number(process.argv[3]);
for(let i=start;i<cases.length;i+=stride)console.log(JSON.stringify(await run(cases[i])));
`;
writeFileSync(dir+'stage45-dense-screen.ts',driver);