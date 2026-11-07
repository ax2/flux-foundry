import type {AirZone} from './content';
import {airOutline,airStrength} from './air';
const layers=new WeakMap<AirZone,{canvas:HTMLCanvasElement;mask:HTMLCanvasElement;ctx:CanvasRenderingContext2D}>();
function layer(z:AirZone){
 let cached=layers.get(z);if(cached)return cached;
 const canvas=document.createElement('canvas'),mask=document.createElement('canvas');canvas.width=Math.ceil(z.w);canvas.height=Math.ceil(z.h);mask.width=Math.ceil(z.w/3);mask.height=Math.ceil(z.h/3);
 const mc=mask.getContext('2d')!,data=mc.createImageData(mask.width,mask.height);
 for(let y=0;y<mask.height;y++)for(let x=0;x<mask.width;x++){const strength=airStrength(z,{x:z.x+(x+.5)/mask.width*z.w,y:z.y+(y+.5)/mask.height*z.h});data.data[(y*mask.width+x)*4+3]=Math.round(strength*255);}
 mc.putImageData(data,0,0);cached={canvas,mask,ctx:canvas.getContext('2d')!};layers.set(z,cached);return cached;
}

// Layered mist and curved tracer filaments describe the air, never the ball's trajectory.
export function drawAir(target:CanvasRenderingContext2D,z:AirZone,time:number,reduced:boolean){
 const surface=layer(z),c=surface.ctx;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,surface.canvas.width,surface.canvas.height);c.translate(-z.x,-z.y);
 const points=airOutline(z),vertical=Math.abs(z.fy)>Math.abs(z.fx),direction=(vertical?z.fy:z.fx)<0?-1:1;
 const length=vertical?z.h:z.w,breadth=vertical?z.w:z.h,t=reduced?0:time;
 c.save();c.beginPath();c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.closePath();c.clip();
 c.translate(z.x+z.w/2,z.y+z.h/2);if(vertical)c.rotate(Math.PI/2);if(direction<0)c.rotate(Math.PI);
 const haze=c.createLinearGradient(0,-breadth/2,0,breadth/2);haze.addColorStop(0,'#c9e6ed00');haze.addColorStop(.24,'#b1d7e716');haze.addColorStop(.5,'#d2e6eb30');haze.addColorStop(.78,'#a6d6e51b');haze.addColorStop(1,'#c9e6ed00');c.fillStyle=haze;c.fillRect(-length/2,-breadth/2,length,breadth);
 // Soft eddies travel at different speeds and disperse near each plume edge.
 for(let i=0;i<9;i++){
  const u=((i*.173+t*(.12+i%3*.025))%1),x=(u-.5)*length,y=Math.sin(i*2.17+t*.6)*breadth*.29,r=breadth*(.23+(i%3)*.07);
  const fog=c.createRadialGradient(x,y,0,x,y,r);fog.addColorStop(0,'#e6f4f51e');fog.addColorStop(.45,'#bedce810');fog.addColorStop(1,'#aecbdf00');c.fillStyle=fog;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
 }
 for(let i=0;i<15;i++){
  const lane=((i+.5)/15-.5)*breadth*.87,phase=i*1.71,head=(((i*.137+t*(.32+(i%4)*.05))%1)*1.35-.7)*length;
  const span=Math.min(length*.45,36+i%4*16),start=head-span;
  c.beginPath();for(let j=0;j<=14;j++){const x=start+span*j/14,y=lane+Math.sin(x*.035+phase-t*.8)*breadth*.035+Math.sin(x*.013-phase+t*.4)*breadth*.05;if(j===0)c.moveTo(x,y);else c.lineTo(x,y);}
  const filament=c.createLinearGradient(start,0,head,0);filament.addColorStop(0,'#e9f5f700');filament.addColorStop(.7,i%3===0?'#e7f5fa7a':'#c7e5f24a');filament.addColorStop(1,'#f5fbff00');c.strokeStyle=filament;c.lineWidth=i%3===0?1.1:.6;c.stroke();
  if(!reduced&&i%3===0){c.strokeStyle='#d5edf31c';c.lineWidth=4;c.stroke();}
 }
 c.restore();
 c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='destination-in';c.drawImage(surface.mask,0,0,surface.canvas.width,surface.canvas.height);c.globalCompositeOperation='source-over';target.drawImage(surface.canvas,z.x,z.y,z.w,z.h);
 target.save();target.fillStyle='#cadde4';target.font='8px "Segoe UI",sans-serif';target.textAlign='left';target.fillText(z.fy<0?'上升气流':z.fy>0?'下降气流':'横向气流',z.x+8,z.y+12);target.restore();
}
