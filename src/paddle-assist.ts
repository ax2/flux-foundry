import {type Body,reflect,advanceFree,collide,type Target} from './physics';
import {PADDLE_Y,catchPaddle,type Paddle} from './arcade';
import {airStrength} from './air';
import {type AirZone,type Gate,type Peg} from './content';
type Environment={air:AirZone[];gates:Gate[];pegs:Peg[];wind:number;response:number};
function advance(b:Body,dt:number,e:Environment,restitution:number){
 let ax=0,ay=240;for(const zone of e.air){const strength=airStrength(zone,b);ax+=zone.fx*e.response*strength*e.wind;ay+=zone.fy*e.response*strength*e.wind;}advanceFree(b,dt,ax,ay);
 if(b.x<18+b.r){b.x=18+b.r;reflect(b,{x:1,y:0},restitution);}if(b.x>402-b.r){b.x=402-b.r;reflect(b,{x:-1,y:0},restitution);}if(b.y<112+b.r){b.y=112+b.r;reflect(b,{x:0,y:1},restitution);}
}
function blocked(b:Body,e:Environment,restitution:number){
 for(const g of e.gates)if(!g.open&&Math.abs(b.x-g.x)<g.size/2+b.r&&Math.abs(b.y-g.y)<g.size/8+b.r&&collide(b,{...g,id:-1,kind:'bar',hp:1,maxHp:1,flash:0},restitution))return true;
 for(const p of e.pegs)if(Math.hypot(b.x-p.x,b.y-p.y)<p.r+b.r&&collide(b,{...p,id:-2,kind:'capacitor',size:p.r*2,hp:1,maxHp:1,flash:0},restitution))return true;
 return false;
}
// A bounded read-only search chooses a metal-face slope. Only the later real collision can change the ball.
export function guidedTilt(ball:Body,p:Paddle,targets:Target[],mass:number,restitution:number,time:number,environment:Environment,maxTilt=.32){
 let best=p.tilt||0,bestScore=Infinity;
 for(let i=0;i<=16;i++){
  const tilt=-maxTilt+i*maxTilt/8,b={...ball};let eta=0,px=p.x,caught=false;
  // Use the actual curved surface and moving-frame collision, including its contact height.
  // The old flat-plane estimate selected slopes whose real rebound missed low targets.
  while(eta<1.5&&b.y-b.r<692){
   const dt=Math.min(1/120,b.r*.45/Math.max(1,Math.hypot(b.vx,b.vy))),previous={...b},delta=Math.max(-900*dt,Math.min(900*dt,p.target-px));
   px+=delta;advance(b,dt,environment,restitution);eta+=dt;
   if(blocked(b,environment,restitution))break;
   if(catchPaddle(b,previous,{...p,x:px,vx:delta/dt,tilt},dt)){caught=true;break;}
  }
  if(!caught||b.vy>=0)continue;
  const energy=.5*mass*(b.vx*b.vx+b.vy*b.vy),added=Math.min(p.boost||18000,Math.max(0,240000-energy));b.vy=-Math.sqrt(b.vy*b.vy+2*added/mass);
  let elapsed=0,score=10000;
  while(elapsed<2.5&&b.y-b.r<692){const dt=Math.min(1/120,b.r*.6/Math.max(1,Math.hypot(b.vx,b.vy)));advance(b,dt,environment,restitution);elapsed+=dt;
   if(blocked(b,environment,restitution)){score+=2000;break;}
   let hit=false;for(const t of targets){if(t.hp<=0)continue;const tx=t.motion?t.motion.baseX+Math.sin((time+eta+elapsed)*t.motion.speed)*t.motion.amplitude:t.x,dx=Math.max(0,Math.abs(b.x-tx)-t.size*.35-b.r),dy=Math.max(0,Math.abs(b.y-t.y)-t.size*.35-b.r);score=Math.min(score,Math.hypot(dx,dy)+20);
    if(Math.abs(b.x-tx)<t.size/2+b.r&&Math.abs(b.y-t.y)<t.size/2+b.r){
     const tvx=t.motion?Math.cos((time+eta+elapsed)*t.motion.speed)*t.motion.amplitude*t.motion.speed:0,probe={...b,vx:b.vx-tvx},vx=probe.vx,vy=probe.vy;
     if(collide(probe,{...t,x:tx},restitution)&&Math.hypot(probe.vx-vx,probe.vy-vy)/(1+restitution)>55){score=elapsed*2;hit=true;break;}
    }
   }if(hit)break;
  }
  score+=Math.abs(tilt-(p.tilt||0))*.5;if(score<bestScore){bestScore=score;best=tilt;}
 }
 return best;
}
