import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const cases=[];
for(const seed of [223])for(const miss of [0,1,2])for(const cap of Array.from({length:25},(_,i)=>(100+9*i)/1000)){
 const name='s'+seed+'m'+miss+'a'+Math.round(cap*1000);
 const gate=`  const directGapGuide=this.mode==='endless'&&falling&&falling.y>=600&&this.material==='steel'&&this.size==='standard'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.progress.catchesWithoutHit===${miss}&&
   this.targets.length===1&&this.targets.some(t=>!t.motion&&t.kind==='bar'&&t.hp===1&&t.y>=560&&
    Math.abs(t.x-W/2)>this.paddle.width&&Math.abs(t.x-falling.x)<${miss===0?'this.paddle.width*1.3':'W'});
`;
 const game=base.replace('  if(falling&&(regularGuide',gate+'  if(falling&&(regularGuide')
  .replace('||fixedSteelGapGuide)&&falling','||fixedSteelGapGuide||directGapGuide)&&falling')
  .replace('||fixedSteelGapGuide)&&!regularGuide','||fixedSteelGapGuide||directGapGuide)&&!regularGuide')
  .replace('||fixedSteelGapGuide)?dt','||fixedSteelGapGuide||directGapGuide)?dt')
  .replace('else if(fixedSteelGapGuide)maxTilt=0.285;','else if(directGapGuide)maxTilt='+cap+';\n     else if(fixedSteelGapGuide)maxTilt=0.285;');
 if(!game.includes('||directGapGuide)&&!regularGuide')||!game.includes('else if(directGapGuide)'))throw Error('Missing guide anchor');
 writeFileSync(dir+'stage50-game-'+name+'.ts',game);
 cases.push({seed,name,miss,cap});
}
const driver=`
import {STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';
import assert from 'node:assert/strict';
const cases=${JSON.stringify(cases)};
async function run({seed,name,miss,cap}){
 const {Game}=await import('./stage50-game-'+name);
 const g=new Game(seed),shots=[];
 while(g.phase==='aim'){
  assert.ok(g.selectBall('steel','standard'));
  const t=g.targets.slice().sort((a,b)=>a.hp-b.hp)[0];g.aim(t.x,t.y);assert.ok(g.fire());
  const before=g.stats.hits,ball=g.balls[0];
  let i=0,gap=0;
  while(g.phase==='volley'&&i<900/STEP){
   if(i%14===0)steer(g,'steer');
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
writeFileSync(dir+'stage50-screen.ts',driver);