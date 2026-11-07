import {reflect,type Body} from './physics';
export type TreasureKind='life'|'wide'|'slow';
export type Treasure={id:number;x:number;y:number;r:number;kind:TreasureKind;life:number};
export type Paddle={x:number;target:number;width:number;vx:number;flash:number;tilt?:number;boost?:number};
export const PADDLE_Y=675;
// Curved metal face. Surface slope determines the normal, so off-centre catches steer naturally.
export function catchPaddle(b:Body,previous:Body,p:Paddle,dt:number){
 if(b.vy<=0)return false;const half=p.width/2,offset=Math.max(-1,Math.min(1,(b.x-p.x)/half));
 if(Math.abs(b.x-p.x)>half+b.r*.2)return false;
 const oldOffset=Math.max(-1,Math.min(1,(previous.x-(p.x-p.vx*dt))/half));
 const tilt=p.tilt||0,surface=PADDLE_Y+10*offset*offset+tilt*offset*half,oldSurface=PADDLE_Y+10*oldOffset*oldOffset+tilt*oldOffset*half;
 if(previous.y+previous.r>oldSurface+.5||b.y+b.r<surface)return false;
 const slope=20*offset/half+tilt,length=Math.hypot(slope,1),n={x:slope/length,y:-1/length};
 b.y=surface-b.r;const before=b.vx*b.vx+b.vy*b.vy;b.vx-=p.vx;
 if(!reflect(b,n,.96)){b.vx+=p.vx;return false;}b.vx+=p.vx;
 // Limit work from a fast-moving paddle, without deleting gravitational energy already present.
 const after=b.vx*b.vx+b.vy*b.vy,limit=Math.max(before,900*900);if(after>limit){const f=Math.sqrt(limit/after);b.vx*=f;b.vy*=f;}
 return true;
}
export function sweptPickup(a:Body,b:Body,t:Treasure){const dx=b.x-a.x,dy=b.y-a.y,d2=dx*dx+dy*dy,u=d2?Math.max(0,Math.min(1,((t.x-a.x)*dx+(t.y-a.y)*dy)/d2)):0;return Math.hypot(a.x+u*dx-t.x,a.y+u*dy-t.y)<=b.r+t.r;}
