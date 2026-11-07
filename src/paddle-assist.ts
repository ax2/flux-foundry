import {type Body,reflect,advanceFree,collide,type Target} from './physics';
import {PADDLE_Y,type Paddle} from './arcade';
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
export function guidedTilt(ball:Body,p:Paddle,targets:Target[],mass:number,restitution:number,time:number,environment:Environment){
 const incoming={...ball};let eta=0;
 while(incoming.y+incoming.r<PADDLE_Y&&eta<1.5){const dt=Math.min(1/120,incoming.r*.6/Math.max(1,Math.hypot(incoming.vx,incoming.vy)));advance(incoming,dt,environment,restitution);eta+=dt;if(blocked(incoming,environment,restitution))return p.tilt||0;}
 if(eta>=1.5||incoming.vy<=0)return p.tilt||0;
 const delta=p.target-p.x,px=p.x+Math.max(-900*eta,Math.min(900*eta,delta)),pvx=Math.abs(delta)>900*eta?Math.sign(delta)*900:0,half=p.width/2,offset=Math.max(-1,Math.min(1,(incoming.x-px)/half));if(Math.abs(incoming.x-px)>half+ball.r*.2)return p.tilt||0;
 const before=incoming.vx**2+incoming.vy**2;let best=p.tilt||0,bestScore=Infinity;
 for(let i=0;i<=16;i++){
  const tilt=-.32+i*.04,slope=20*offset/half+tilt,length=Math.hypot(slope,1),b={...incoming,y:PADDLE_Y+10*offset*offset+tilt*offset*half-ball.r,vx:incoming.vx-pvx};
  if(!reflect(b,{x:slope/length,y:-1/length},.96))continue;b.vx+=pvx;
  const speed=b.vx*b.vx+b.vy*b.vy,limit=Math.max(before,900*900);if(speed>limit){const f=Math.sqrt(limit/speed);b.vx*=f;b.vy*=f;}if(b.vy>=0)continue;
  const energy=.5*mass*(b.vx*b.vx+b.vy*b.vy),added=Math.min(p.boost||18000,Math.max(0,240000-energy));b.vy=-Math.sqrt(b.vy*b.vy+2*added/mass);
  let elapsed=0,score=10000;
  while(elapsed<1.5&&b.y-b.r<692){const dt=Math.min(1/120,b.r*.6/Math.max(1,Math.hypot(b.vx,b.vy)));advance(b,dt,environment,restitution);elapsed+=dt;
   if(blocked(b,environment,restitution)){score+=2000;break;}
   let hit=false;for(const t of targets){if(t.hp<=0)continue;const tx=t.motion?t.motion.baseX+Math.sin((time+eta+elapsed)*t.motion.speed)*t.motion.amplitude:t.x,dx=Math.max(0,Math.abs(b.x-tx)-t.size*.35-b.r),dy=Math.max(0,Math.abs(b.y-t.y)-t.size*.35-b.r);score=Math.min(score,Math.hypot(dx,dy)+20);
    if(Math.abs(b.x-tx)<t.size/2+b.r&&Math.abs(b.y-t.y)<t.size/2+b.r&&collide({...b},{...t,x:tx},restitution)){score=elapsed*2;hit=true;break;}
   }if(hit)break;
  }
  score+=Math.abs(tilt-(p.tilt||0))*.5;if(score<bestScore){bestScore=score;best=tilt;}
 }
 return best;
}
