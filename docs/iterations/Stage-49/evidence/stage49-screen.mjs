import {readFileSync,writeFileSync} from 'node:fs';
const dir='test-results/';
const base=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const replay=readFileSync('docs/iterations/Stage-49/evidence/stage49-replay-pointer.ts','utf8');
const variants=[];
for(const catches of [1,2])for(let n=100;n<=320;n+=5){
 const name='m'+catches+'a'+n;
 const cap=n/1000;
 const guide=`  const fixedSteelGapGuide=this.mode==='endless'&&falling&&falling.y>=610&&this.material==='steel'&&this.size==='large'&&
   this.bigTime===0&&this.wideTime===0&&this.air.length===0&&this.progress.sinceHit>=${catches===1?7:10.5}&&this.progress.catchesWithoutHit===${catches}&&
   this.targets.length===4&&Math.abs(falling.x-W/2)<falling.r/4&&
   Math.abs(falling.x-this.paddle.x)<falling.r/4&&Math.abs(falling.vx)<falling.vy*.03&&
   this.targets.every(t=>!t.motion&&t.y>=600&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.kind==='steel'&&t.power==='spring'&&Math.abs(t.x-falling.x)<this.paddle.width&&
    this.targets.some(b=>b.kind==='prism'&&!b.power&&(b.x-falling.x)*(t.x-falling.x)<0&&Math.abs(b.x-falling.x)<this.paddle.width));
`;
 const game=base.replace('  if(falling&&(regularGuide',guide+'  if(falling&&(regularGuide')
   .replace('||largeCeramicGapGuide)&&falling','||largeCeramicGapGuide||fixedSteelGapGuide)&&falling')
   .replace('||largeCeramicGapGuide)?dt','||largeCeramicGapGuide||fixedSteelGapGuide)?dt')
   .replace('||largeCeramicGapGuide)&&!regularGuide','||largeCeramicGapGuide||fixedSteelGapGuide)&&!regularGuide')
   .replace('else if(largeCeramicGapGuide)maxTilt=.188;','else if(largeCeramicGapGuide)maxTilt=.188;\n     else if(fixedSteelGapGuide)maxTilt='+cap+';');
 if(!game.includes('||fixedSteelGapGuide)&&!regularGuide'))throw Error('Missing assist insertion point');
 writeFileSync(dir+'stage49-game-'+name+'.ts',game);
 variants.push(name);
}
const runner=replay.replace("import {Game,STEP,LAUNCH} from '../src/game';","import {STEP,LAUNCH} from '../src/game';")
 .replace('const dir=process.argv[2]',"const dir='docs/iterations/Stage-49/evidence'")
 .replace('const game=new Game(report.seed),out=[];',`async function trial(name){
 const {Game}=await import('./stage49-game-'+name);
 const game=new Game(report.seed),out=[];`)
 .replace('console.log(JSON.stringify(out));',`return {name,shots:out};}
 const cases=${JSON.stringify(variants)};
 for(let i=Number(process.argv[2]);i<cases.length;i+=Number(process.argv[3]))console.log(JSON.stringify(await trial(cases[i])));`);
writeFileSync(dir+'stage49-screen.ts',runner);