import {type Body,reflect,advanceFree,ballSubsteps,collide,vertices,type Target} from './physics';
import {catchPaddle,type Paddle} from './arcade';
import {airStrength} from './air';
import {type AirZone,type Gate,type Peg} from './content';
export const GUIDE_TILT_STEP=.32;
export type Environment={air:AirZone[];gates:Gate[];pegs:Peg[];wind:number;response:number;energyLimit?:number;allowLowerWork?:boolean;catchFrame?:number};
function advanceWind(b:Body,dt:number,e:Environment){
 let ax=0,ay=240;for(const zone of e.air){const strength=airStrength(zone,b);ax+=zone.fx*e.response*strength*e.wind;ay+=zone.fy*e.response*strength*e.wind;}advanceFree(b,dt,ax,ay);
}
function reflectWalls(b:Body,restitution:number){
 if(b.x<18+b.r){b.x=18+b.r;reflect(b,{x:1,y:0},restitution);}if(b.x>402-b.r){b.x=402-b.r;reflect(b,{x:-1,y:0},restitution);}if(b.y<112+b.r){b.y=112+b.r;reflect(b,{x:0,y:1},restitution);}
}
function advance(b:Body,dt:number,e:Environment,restitution:number){advanceWind(b,dt,e);reflectWalls(b,restitution);}
function reflectPassive(b:Body,e:Environment,restitution:number){
 for(const g of e.gates)if(!g.open&&!g.venting&&Math.abs(b.x-g.x)<g.size/2+b.r&&Math.abs(b.y-g.y)<g.size/8+b.r&&collide(b,{...g,id:-1,kind:'bar',hp:1,maxHp:1,flash:0},restitution))return true;
 for(const p of e.pegs)if(!p.retractedFrom&&Math.hypot(b.x-p.x,b.y-p.y)<p.r+b.r&&collide(b,{...p,id:-2,kind:'capacitor',size:p.r*2,hp:1,maxHp:1,flash:0},restitution))return true;
 return false;
}
// Distance to the actual silhouette, rather than a box which includes empty triangle corners.
function clearance(b:Body,t:Target){
 if(t.kind==='capacitor')return Math.max(0,Math.hypot(b.x-t.x,b.y-t.y)-t.size/2-b.r);
 const v=vertices(t);let distance=Infinity,inside=true;
 for(let i=0;i<v.length;i++){
  const a=v[i],z=v[(i+1)%v.length],dx=z.x-a.x,dy=z.y-a.y;
  if((b.x-a.x)*dy-(b.y-a.y)*dx>0)inside=false;
  const u=Math.max(0,Math.min(1,((b.x-a.x)*dx+(b.y-a.y)*dy)/(dx*dx+dy*dy)));
  distance=Math.min(distance,Math.hypot(b.x-a.x-u*dx,b.y-a.y-u*dy));
 }
 return inside?0:Math.max(0,distance-b.r);
}
function futureTarget(t:Target,time:number){
 return t.motion?{...t,x:t.motion.baseX+Math.sin(time*t.motion.speed)*t.motion.amplitude,vx:Math.cos(time*t.motion.speed)*t.motion.amplitude*t.motion.speed}:t;
}
function targetImpact(b:Body,t:Target,restitution:number){
 if(Math.abs(b.x-t.x)>t.size/2+b.r||Math.abs(b.y-t.y)>t.size/2+b.r)return 0;
 const vx=b.vx,vy=b.vy;b.vx-=t.vx||0;const hit=collide(b,t,restitution);b.vx+=t.vx||0;
 return hit?Math.hypot(b.vx-vx,b.vy-vy)/(1+restitution):0;
}

// Use the live frame subdivision and contact order at the paddle.
function approachInFrames(b:Body,p:Paddle,targets:Target[],restitution:number,time:number,environment:Environment,tilt:number,frame:number){
 let eta=0,px=p.x;
 const half=p.width/2;
 while(eta<1.5&&b.y-b.r<692){
  const start=px,delta=Math.max(-900*frame,Math.min(900*frame,p.target-px));
  px=Math.max(22+half,Math.min(398-half,px+delta));
  const vx=(px-start)/frame,steps=ballSubsteps(b,frame),dt=frame/steps,frameEnd=eta+frame;
  for(let sub=0;sub<steps;sub++){
   const previous={...b},x=start+vx*dt*(sub+1);
   advanceWind(b,dt,environment);eta+=dt;
   if(catchPaddle(b,previous,{...p,x,vx,tilt},dt))return {eta,x,dt,frameEnd,remaining:steps-sub-1};
   reflectWalls(b,restitution);reflectPassive(b,environment,restitution);
   for(const t of targets)if(t.hp>0&&targetImpact(b,futureTarget(t,time+frameEnd),restitution)>55)return 'target';
  }
 }
}

export function forecastRebound(ball:Body,p:Paddle,targets:Target[],mass:number,restitution:number,time:number,environment:Environment,tilt:number,inspect=false,workOverride?:number){
  const b={...ball};let eta=0,px=p.x,caught=false;const path:Body[]|undefined=inspect?[]:undefined;
  const approach=environment.catchFrame?approachInFrames(b,p,targets,restitution,time,environment,tilt,environment.catchFrame):undefined;
  if(approach==='target')return {tilt,boost:p.boost??18000,hit:false,score:10000+Math.abs(tilt-(p.tilt||0))};
  if(approach){eta=approach.eta;px=approach.x;caught=true;}
  if(!environment.catchFrame)while(eta<1.5&&b.y-b.r<692){
   const dt=Math.min(1/120,b.r*.45/Math.max(1,Math.hypot(b.vx,b.vy))),previous={...b},delta=Math.max(-900*dt,Math.min(900*dt,p.target-px));
   px+=delta;advance(b,dt,environment,restitution);eta+=dt;
   reflectPassive(b,environment,restitution);
   for(const target of targets)if(target.hp>0&&targetImpact(b,futureTarget(target,time+eta),restitution)>55)return {tilt,boost:p.boost??18000,hit:false,score:10000+Math.abs(tilt-(p.tilt||0))};
   if(catchPaddle(b,previous,{...p,x:px,vx:delta/dt,tilt},dt)){caught=true;break;}
  }
  if(!caught||b.vy>=0)return {tilt,boost:p.boost??18000,hit:false,score:Infinity};
  // A heavy ball can repeatedly fall short of the last high block. Prepare only the
  // normal work needed for its height plus a useful impact, within the existing limits.
  const caughtAt=inspect?{eta,ball:{...b},paddleX:px}:undefined;
  const heights=targets.filter(t=>t.hp>0).map(t=>Math.max(0,b.y-(t.y+(t.kind==='bar'?t.size/8:t.size/2)+b.r)));
  const height=heights.length?Math.min(...heights):0,required=mass*(240*height+90*90/2),vertical=.5*mass*b.vy*b.vy;
  const boost=workOverride===undefined?Math.ceil(Math.min(40000,Math.max(18000,p.boost||0,required-vertical))):Math.max(0,Math.min(40000,workOverride));
  const energy=.5*mass*(b.vx*b.vx+b.vy*b.vy),added=Math.min(boost,Math.max(0,(environment.energyLimit??240000)-energy));b.vy=-Math.sqrt(b.vy*b.vy+2*added/mass);
  if(approach){
   for(let sub=0;sub<=approach.remaining;sub++){
    if(sub>0){advanceWind(b,approach.dt,environment);eta+=approach.dt;}
    reflectWalls(b,restitution);reflectPassive(b,environment,restitution);
    for(const t of targets){
     if(t.hp<=0)continue;
     const impact=targetImpact(b,futureTarget(t,time+approach.frameEnd),restitution);
     if(impact>55){
      const elapsed=eta-approach.eta;
      return {tilt,boost,hit:true,hitElapsed:elapsed,caughtAt,outgoing:inspect?{...b}:undefined,impact:inspect?{elapsed,target:t.id,ball:{...b}}:undefined,path,score:elapsed*2+12/impact+Math.abs(tilt-(p.tilt||0))*.2};
     }
    }
   }
   eta=approach.frameEnd;
  }
  const outgoing=inspect?{...b}:undefined;
  let elapsed=0,score=10000;
  while(elapsed<2.5&&b.y-b.r<692){
   const dt=Math.min(1/120,b.r*.45/Math.max(1,Math.hypot(b.vx,b.vy)));advance(b,dt,environment,restitution);elapsed+=dt;if(path)path.push({...b});
   reflectPassive(b,environment,restitution);
   for(const target of targets){
    if(target.hp<=0)continue;const t=futureTarget(target,time+eta+elapsed);
    score=Math.min(score,20+clearance(b,t));
    // Even a weak graze reflects the forecast ball; never predict through the solid block.
    const impact=targetImpact(b,t,restitution);
    if(impact>55)return {tilt,boost,hit:true,hitElapsed:elapsed,caughtAt,outgoing,impact:inspect?{elapsed,target:t.id,ball:{...b}}:undefined,path,score:elapsed*2+12/impact+Math.abs(tilt-(p.tilt||0))*.2};
    if(impact>0)score=Math.max(score,22+(55-impact)*.1);
   }
  }
  return {tilt,boost,hit:false,caughtAt,outgoing,path,score:score+Math.abs(tilt-(p.tilt||0))*.2};
}

// Bounded read-only search. Only a later real collision can change the live ball.
export function guidedRebound(ball:Body,p:Paddle,targets:Target[],mass:number,restitution:number,time:number,environment:Environment,maxTilt=.32){
 const lower=Math.max(-maxTilt,(p.tilt||0)-GUIDE_TILT_STEP),upper=Math.min(maxTilt,(p.tilt||0)+GUIDE_TILT_STEP),spacing=(upper-lower)/16;
 function evaluate(tilt:number,work?:number){return forecastRebound(ball,p,targets,mass,restitution,time,environment,Math.max(lower,Math.min(upper,tilt)),false,work);}
 function search(work?:number){
 const coarse=Array.from({length:17},(_,i)=>evaluate(lower+i*spacing,work));
 coarse.push(evaluate(Math.max(-maxTilt,Math.min(maxTilt,p.tilt||0)),work));
 coarse.sort((a,b)=>a.score-b.score);let best=coarse[0];
 // Refine two promising angles: a low moving block's reachable contact window can be
 // narrower than the old 0.04/0.06 slope grid. No extra energy or ball impulse is added.
 for(const candidate of coarse.slice(0,2))for(const offset of [-.5,-.25,.25,.5]){
  const tilt=Math.max(-maxTilt,Math.min(maxTilt,candidate.tilt+offset*spacing)),choice=evaluate(tilt,work);
  if(choice.score<best.score)best=choice;
 }
 return best;
 }
 let best=search();
 // Preserve the standard rebound when it can hit. A low target can need less extra
 // work to stay below a strong side-flow layer or meet a moving block's low face.
 const lowMoving=targets.some(t=>t.motion);
 if(environment.allowLowerWork&&!best.hit&&targets.length>0&&targets.length<=2&&targets.every(t=>t.y>=540)&&(lowMoving||environment.air.some(z=>Math.abs(z.fx*environment.response*environment.wind)>240))){
  // A previous failed rally may have queued 40k. Include the ordinary 18k charge
  // for moving blocks as well; the default search otherwise inherits that 40k.
  for(const work of lowMoving?[0,6000,12000,18000]:[0,6000,12000]){const candidate=search(work);if(candidate.hit){best=candidate;break;}}
 }
 return Number.isFinite(best.score)?{tilt:best.tilt,boost:best.boost,hit:best.hit,hitElapsed:best.hitElapsed}:{tilt:p.tilt||0,boost:p.boost??18000,hit:false};
}

// Retain the read-only angle API for existing diagnostics.
export function guidedTilt(...args:Parameters<typeof guidedRebound>){return guidedRebound(...args).tilt;}
