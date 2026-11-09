import {readFileSync,writeFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
const read=f=>execFileSync('git',['show','v0.22.0:'+f],{encoding:'utf8'}).replaceAll("from './","from '../src/");
const source=read('src/paddle-assist.ts').replace('allowLowerWork?:boolean','allowLowerWork?:boolean;frame?:number;alignFlight?:boolean')
.replace('function advance(b:Body,dt:number,e:Environment,restitution:number){','function free(b:Body,dt:number,e:Environment){')
.replace('advanceFree(b,dt,ax,ay);','advanceFree(b,dt,ax,ay);\n}\nfunction walls(b:Body,restitution:number){')
.replace('function reflectPassive','function advance(b:Body,dt:number,e:Environment,restitution:number){free(b,dt,e);walls(b,restitution);}\nfunction reflectPassive')
.replace('  while(eta<1.5&&b.y-b.r<692){',`  let left=0,h=0,frameEnd=0,start=p.x,vx=0,steps=0,remainder=0;
  const frame=environment.frame;
  if(frame){
   while(eta<1.5&&b.y-b.r<692&&!caught){
    start=px;
    const half=p.width/2;
    px=Math.max(22+half,Math.min(398-half,px+Math.max(-900*frame,Math.min(900*frame,p.target-px))));
    vx=(px-start)/frame;
    steps=Math.max(1,Math.ceil((Math.hypot(b.vx,b.vy)+2000*frame)*frame/(b.r*.45)));
    h=frame/steps;
    frameEnd=eta+frame;
    for(let sub=0;sub<steps;sub++){
     const previous={...b};
     free(b,h,environment);eta+=h;
     const x=start+vx*h*(sub+1);
     if(catchPaddle(b,previous,{...p,x,vx,tilt},h)){
      caught=true;remainder=steps-sub-1;px=x;
      break;
     }
     walls(b,restitution);reflectPassive(b,environment,restitution);
     for(const target of targets)if(target.hp>0&&targetImpact(b,futureTarget(target,time+frameEnd),restitution)>55)return {tilt,boost:p.boost??18000,hit:false,score:10000+Math.abs(tilt-(p.tilt||0))};
    }
   }
  }else while(eta<1.5&&b.y-b.r<692){`)
.replace('  const outgoing=inspect?{...b}:undefined;',`  if(frame){
   walls(b,restitution);
   for(let sub=0;sub<remainder;sub++){advance(b,h,environment,restitution);reflectPassive(b,environment,restitution);}
   eta=frameEnd;
  }
  const outgoing=inspect?{...b}:undefined;
  frameEnd=0;`)
.replace('   const dt=Math.min(1/120,b.r*.45/Math.max(1,Math.hypot(b.vx,b.vy)));advance(b,dt,environment,restitution);elapsed+=dt;if(path)path.push({...b});',`   let dt=Math.min(1/120,b.r*.45/Math.max(1,Math.hypot(b.vx,b.vy)));
   if(frame&&environment.alignFlight){
    if(left===0){left=Math.max(1,Math.ceil((Math.hypot(b.vx,b.vy)+2000*frame)*frame/(b.r*.45)));h=frame/left;frameEnd+=frame;}
    dt=h;left--;
   }
   advance(b,dt,environment,restitution);elapsed+=dt;if(path)path.push({...b});`)
.replace('futureTarget(target,time+eta+elapsed)','futureTarget(target,time+eta+(frame&&environment.alignFlight?frameEnd:elapsed))');
writeFileSync('test-results/stage26-forecast.ts',source);
const original=read('src/game.ts').replace('../src/paddle-assist','./stage26-forecast');
const base=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'");
for(const [name,limit,aligned,condition] of [['near4',4,false,''],['near8',8,false,''],['near12',12,false,''],['full4',4,true,''],['full8',8,true,''],['full12',12,true,''],['spring8',8,true,"&&this.targets[0].power==='spring'"]]){
 const game=original.replace('const environment={air:',`const environment={frame:this.mode==='endless'&&this.targets.length===1&&this.lowEndgame&&this.targets[0].motion&&this.progress.sinceHit>=${limit}${condition}?dt:undefined,alignFlight:${aligned},air:`);
 writeFileSync('test-results/stage26-game-'+name+'.ts',game);
 let run=base.replace('../src/game','./stage26-game-'+name).replace('test-results/endless-audit-extended.json','test-results/stage26-'+name+'.json');
 writeFileSync('test-results/stage26-audit-'+name+'.ts',run);
}

