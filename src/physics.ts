export type Vec={x:number;y:number};
export type Body=Vec&{vx:number;vy:number;r:number};
export type BlockKind='steel'|'prism'|'capacitor'|'diamond'|'hexagon'|'bar';
export type Target=Vec&{id:number;kind:BlockKind;size:number;hp:number;maxHp:number;flash:number;power?:'spring'|'switch'|'valve';core?:boolean;anchor?:boolean;row?:number;motion?:{baseX:number;amplitude:number;speed:number};vx?:number};
export const dot=(a:Vec,b:Vec)=>a.x*b.x+a.y*b.y;
export function ballSubsteps(ball:Body,dt:number){
 return Math.max(1,Math.ceil((Math.hypot(ball.vx,ball.vy)+2000*dt)*dt/(ball.r*.45)));
}
export function vertices(t:Target):Vec[]{
 const r=t.size/2;
 if(t.kind==='diamond')return [{x:t.x,y:t.y-r},{x:t.x+r,y:t.y},{x:t.x,y:t.y+r},{x:t.x-r,y:t.y}];
 if(t.kind==='hexagon')return Array.from({length:6},(_,i)=>({x:t.x+Math.cos(-Math.PI/2+i*Math.PI/3)*r,y:t.y+Math.sin(-Math.PI/2+i*Math.PI/3)*r}));
 if(t.kind==='bar')return [{x:t.x-r,y:t.y-r*.25},{x:t.x+r,y:t.y-r*.25},{x:t.x+r,y:t.y+r*.25},{x:t.x-r,y:t.y+r*.25}];
 return t.kind==='prism'?[{x:t.x,y:t.y-r},{x:t.x+r,y:t.y+r},{x:t.x-r,y:t.y+r}]:[{x:t.x-r,y:t.y-r},{x:t.x+r,y:t.y-r},{x:t.x+r,y:t.y+r},{x:t.x-r,y:t.y+r}];
}
// Frictionless contact: normal energy is reduced, tangential velocity is preserved.
export function reflect(b:Body,n:Vec,restitution=1){const d=b.vx*n.x+b.vy*n.y;if(d<0){b.vx-=(1+restitution)*d*n.x;b.vy-=(1+restitution)*d*n.y;return true;}return false;}
export function advanceFree(b:Body,dt:number,ax=0,ay=240){b.x+=b.vx*dt+.5*ax*dt*dt;b.y+=b.vy*dt+.5*ay*dt*dt;b.vx+=ax*dt;b.vy+=ay*dt;}
export function collide(b:Body,t:Target,restitution=1):boolean{
 if(t.kind==='capacitor'){
  const dx=b.x-t.x,dy=b.y-t.y,d=Math.hypot(dx,dy),r=t.size/2+b.r;
  if(d>=r)return false;const n=d>0?{x:dx/d,y:dy/d}:{x:0,y:-1};b.x=t.x+n.x*r;b.y=t.y+n.y*r;return reflect(b,n,restitution);
 }
 const v=vertices(t);let best=Infinity,point={x:0,y:0},normal={x:0,y:0},inside=true;
 for(let i=0;i<v.length;i++){
  const a=v[i],c=v[(i+1)%v.length],ex=c.x-a.x,ey=c.y-a.y,len=Math.hypot(ex,ey),n={x:ey/len,y:-ex/len};
  if((b.x-a.x)*n.x+(b.y-a.y)*n.y>0)inside=false;
  const u=Math.max(0,Math.min(1,((b.x-a.x)*ex+(b.y-a.y)*ey)/(len*len))),q={x:a.x+u*ex,y:a.y+u*ey},d=Math.hypot(b.x-q.x,b.y-q.y);
  if(d<best){best=d;point=q;normal=n;}
 }
 if(!inside&&best>=b.r)return false;
 const n=inside||best<.0001?normal:{x:(b.x-point.x)/best,y:(b.y-point.y)/best};
 b.x=point.x+n.x*(b.r+.02);b.y=point.y+n.y*(b.r+.02);return reflect(b,n,restitution);
}
