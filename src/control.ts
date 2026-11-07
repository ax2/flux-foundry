import {advanceFree,collide,type Body,type Target,type Vec} from './physics';
import {airStrength} from './air';
import type {AirZone} from './content';
// A short tap is always a safe upward rescue; a swipe selects a direction from the finger origin.
export function gestureDirection(start:Vec,end:Vec):Vec{
 const dx=end.x-start.x,dy=end.y-start.y,d=Math.hypot(dx,dy);return d<14?{x:0,y:-1}:{x:dx/d,y:dy/d};
}
export function rescueWindow(b:{y:number;vy:number;r:number}|undefined,speed:number,charges:number){
 if(!b||speed<=1||charges<=0||b.vy<=0||b.y<400)return false;
 const distance=Math.max(0,692+b.r-b.y),seconds=(-b.vy+Math.sqrt(b.vy*b.vy+480*distance))/240;
 return seconds<.85;
}
// A short preview is used only for assistance timing; never drawn as a trajectory.
export function imminentContact(body:Body,obstacles:Target[],air:AirZone[]=[],windResponse=1){
 const b={...body},dt=1/120;
 for(let i=0;i<24;i++){
  let ax=0,ay=240;for(const z of air){const f=airStrength(z,b)*windResponse;ax+=z.fx*f;ay+=z.fy*f;}
  advanceFree(b,dt,ax,ay);
  if(b.x<18+b.r){b.x=18+b.r;b.vx=Math.abs(b.vx);}
  if(b.x>402-b.r){b.x=402-b.r;b.vx=-Math.abs(b.vx);}
  if(obstacles.some(t=>t.hp>0&&collide(b,t,.94)))return true;
 }
 return false;
}
