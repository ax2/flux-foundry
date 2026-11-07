import type {AirZone} from './content';
import type {Vec} from './physics';

// A symmetric, ragged plume profile. Rendering and force sampling share this boundary.
const profile=[[0,.5],[.06,.20],[.20,.25],[.35,.06],[.5,.14],[.65,.06],[.8,.25],[.94,.20],[1,.5],[.94,.80],[.8,.75],[.65,.94],[.5,.86],[.35,.94],[.2,.75],[.06,.80]];
const outlines=new WeakMap<AirZone,Vec[]>();
export function airOutline(z:AirZone):Vec[]{
 let points=outlines.get(z);if(points)return points;
 const vertical=Math.abs(z.fy)>Math.abs(z.fx);
 points=z.plume?profile.map(([u,v])=>({x:z.x+(vertical?v:u)*z.w,y:z.y+(vertical?u:v)*z.h})):[{x:z.x,y:z.y},{x:z.x+z.w,y:z.y},{x:z.x+z.w,y:z.y+z.h},{x:z.x,y:z.y+z.h}];
 outlines.set(z,points);return points;
}
export function airStrength(z:AirZone,p:Vec){
 if(p.x<z.x||p.x>z.x+z.w||p.y<z.y||p.y>z.y+z.h)return 0;
 if(!z.plume)return 1;
 const points=airOutline(z);let inside=false,distance=Infinity;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const a=points[i],b=points[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  const dx=b.x-a.x,dy=b.y-a.y,u=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));
  distance=Math.min(distance,Math.hypot(p.x-a.x-u*dx,p.y-a.y-u*dy));
 }
 if(!inside)return 0;const s=Math.min(1,distance/(Math.min(z.w,z.h)*.1));return s*s*(3-2*s);
}
