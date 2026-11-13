import fs from 'node:fs';
const src=fs.readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=fs.readFileSync('docs/iterations/Stage-31/evidence/stage31-matrix-outward.ts','utf8').replace('stage31-matrix-outward.json','STAGE32_OUTPUT');
const make=(name,misses,delay,cap,window,frame,y,side)=>{
 const base='  if(falling&&(regularGuide';
 const gate=`  const splitRowGuide=this.mode==='endless'&&falling&&this.targets.length===3&&falling.y>=${y}&&
   this.progress.sinceHit>=${delay}&&this.progress.catchesWithoutHit===${misses}&&
   Math.abs(falling.x-this.paddle.x)<=this.paddle.width/5&&Math.abs(falling.vx)<=falling.vy*.2&&
   this.targets.every(t=>!t.motion&&t.y>=560&&Math.abs(t.y-this.targets[0].y)<=1)&&
   this.targets.some(t=>t.power==='spring')&&this.rails.every(r=>r.charges===0)&&
   this.targets.some(t=>t.x<falling.x-half-falling.r)&&this.targets.some(t=>t.x>falling.x+half+falling.r)${side};
`;
 const game=src.replace(base,gate+base)
 .replace('||movingSpringEdgeGuide)&&falling','||movingSpringEdgeGuide||splitRowGuide)&&falling')
 .replace('||movingSpringEdgeGuide)&&!regularGuide','||movingSpringEdgeGuide||splitRowGuide)&&!regularGuide')
 .replace('catchFrame:movingEndgame?dt:undefined','catchFrame:'+(frame?'movingEndgame||splitRowGuide':'movingEndgame')+'?dt:undefined')
 .replace('maxTilt=movingSpringEdgeGuide','maxTilt=splitRowGuide?'+cap+':movingSpringEdgeGuide')
 .replace('(plan.hitElapsed??Infinity)<.45','(plan.hitElapsed??Infinity)<(splitRowGuide?'+window+':.45)');
 if(game===src||!game.includes('||splitRowGuide)&&!regularGuide'))throw Error('Missing anchor');
 fs.writeFileSync('test-results/stage32-game-'+name+'.ts',game);
 const matrix=audit.replace('../src/game','./stage32-game-'+name);
 fs.writeFileSync('test-results/stage32-matrix-'+name+'.ts',matrix.replace('STAGE32_OUTPUT','stage32-matrix-'+name+'.json'));
 const one=matrix.replace(/of \[42,[^\]]+\]/,'of [7429]').replace('of Object.keys(MATERIALS) as Material[]',"of ['brass'] as Material[]").replace('of Object.keys(SIZES) as BallSize[]',"of ['standard'] as BallSize[]").replace("of ['follow','steer'] as const","of ['steer'] as const").replace('STAGE32_OUTPUT','stage32-one-'+name+'.json');
 fs.writeFileSync('test-results/stage32-one-'+name+'.ts',one);
};
const rightward="&&falling.vx>0";
const names=[];
for(const frame of [false,true])for(const [misses,delay,caps,window] of [[1,6,[.08,.1,.12,.16,.20,.24,.32],2.25],[2,11,[.26,.27,.28,.29,.30,.32],.45]]){
 for(const cap of caps){
  const name=(misses===1?'second':'third')+(frame?'exact':'loose')+Math.round(cap*100);
  names.push(name);
  make(name,misses,delay,cap,window,frame,610,'');
 }
}
for(const [cap,y] of [[.27,635],[.28,635],[.29,635],[.28,625],[.29,625],[.3,625],[.32,650]]){
 const name='late'+y+'-'+Math.round(cap*100);names.push(name);make(name,2,11,cap,.45,true,y,'');
}
fs.writeFileSync('test-results/stage32-variants.json',JSON.stringify(names));
