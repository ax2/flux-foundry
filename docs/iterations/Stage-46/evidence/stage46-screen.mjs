import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('docs/iterations/Stage-32/evidence/stage32-matrix-production.ts','utf8');
const variants=Array.from({length:35},(_,i)=>[0,(14+i)/100]);
const imports=[];
for(const [miss,cap] of variants){
 const name='m'+miss+'a'+Math.round(cap*100);
 const gate=`  const singleSpringGuide=this.mode==='endless'&&falling&&falling.y>=600&&this.material==='brass'&&this.size==='standard'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.progress.sinceHit>=3.2&&this.progress.catchesWithoutHit===0&&
   this.targets.length===1&&Math.abs(falling.x-this.paddle.x)<falling.r/2&&Math.abs(falling.vx)<falling.vy*.08&&
   this.targets.some(t=>!t.motion&&t.kind==='hexagon'&&t.power==='spring'&&t.y>=540&&t.y<575&&
    Math.abs(t.x-falling.x)>=t.size/2+falling.r&&Math.abs(t.x-falling.x)<this.paddle.width);
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||fixedBarGapGuide)&&falling','||fixedBarGapGuide||singleSpringGuide)&&falling')
  .replace('||fixedBarGapGuide)&&!regularGuide','||fixedBarGapGuide||singleSpringGuide)&&!regularGuide')
  .replace('||fixedBarGapGuide)?dt','||fixedBarGapGuide||singleSpringGuide)?dt')
  .replace('else if(fixedBarGapGuide)maxTilt=.302;','else if(singleSpringGuide)maxTilt='+cap+';\n     else if(fixedBarGapGuide)maxTilt=.302;');
 if(!game.includes('||singleSpringGuide)&&!regularGuide')||!game.includes('else if(singleSpringGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage46-game-'+name+'.ts',game);
 imports.push([name,miss,cap]);
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';

const cases=${JSON.stringify(imports)};
async function run([name,miss,cap]){
 const {Game}=await import('./stage46-game-'+name);
 const g=new Game(934),shots=[];

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
 return {name,miss,cap,peak:g.progress.maxNoHit,shot1:shots[0],hits:g.stats.hits,wave:g.wave,shots};
}
const start=Number(process.argv[2]),stride=Number(process.argv[3]);
for(let i=start;i<cases.length;i+=stride)console.log(JSON.stringify(await run(cases[i])));
`;
writeFileSync(dir+'stage46-screen.ts',driver);