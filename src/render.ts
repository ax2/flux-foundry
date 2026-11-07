import arenaURL from './assets/arena.webp';
import atlasURL from './assets/targets.webp';
import {TEXTURE_BYTES} from './asset-manifest';
import {TextureLoader} from './textures';
import {PADDLE_Y} from './arcade';
import {drawAir} from './air-render';
import {Game,W,H,LAUNCH} from './game';
import {vertices,type Target} from './physics';
import {MATERIALS,SIZES,HOPPER_SLOTS,type Material} from './content';
export class Renderer{
 cssHeight=720;ctx:CanvasRenderingContext2D;arena=new Image();atlas=new Image();ready:Promise<unknown>;textures:TextureLoader;
 constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d')!;this.textures=new TextureLoader([{image:this.arena,url:arenaURL,bytes:TEXTURE_BYTES.arena},{image:this.atlas,url:atlasURL,bytes:TEXTURE_BYTES.targets}]);this.ready=this.textures.load();}
 resize(){const d=Math.min(devicePixelRatio,2),r=this.canvas.getBoundingClientRect();this.cssHeight=r.height;this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}
 sprite(kind:string,x:number,y:number,size:number){
  const c=this.ctx,a=this.atlas;if(!a.complete||!a.naturalWidth)return false;
  // Atlas silhouette bounds in normalized image coordinates; physics uses the visible object, not transparent padding.
  const rects:Record<string,number[]>={steel:[.017,.151,.237,.71],prism:[.271,.17,.255,.68],capacitor:[.539,.131,.253,.75],ball:[.82,.29,.15,.45]};
  const [sx,sy,sw,sh]=rects[kind];c.drawImage(a,sx*a.width,sy*a.height,sw*a.width,sh*a.height,x-size/2,y-size/2,size,size);return true;
 }
 ball(material:Material,x:number,y:number,r:number){
  if(material==='steel'&&this.sprite('ball',x,y,r*2))return;
  const c=this.ctx,m=MATERIALS[material];c.save();c.translate(x,y);
  c.shadowColor='#0009';c.shadowBlur=3;c.shadowOffsetY=2;
  const fill=c.createRadialGradient(-r*.35,-r*.4,r*.04,0,0,r);fill.addColorStop(0,material==='rubber'?'#d5a18b':'#fffbed');fill.addColorStop(.24,m.color);fill.addColorStop(.72,m.dark);fill.addColorStop(1,'#151e22');
  c.fillStyle=fill;c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.clip();
  if(material==='brass'){c.strokeStyle='#ffedc054';c.lineWidth=.5;for(let i=-r;i<r;i+=2){c.beginPath();c.moveTo(-r,i);c.lineTo(r,i-r*.4);c.stroke();}}
  if(material==='rubber'){c.fillStyle='#0c13152b';for(let i=0;i<27;i++){const a=i*2.399,d=Math.sqrt(i/27)*r;c.fillRect(Math.cos(a)*d,Math.sin(a)*d,.8,.8);}}
  else{c.fillStyle='#ffffffe0';c.beginPath();c.ellipse(-r*.3,-r*.43,r*.25,r*.12,-.5,0,Math.PI*2);c.fill();c.strokeStyle='#ffffff55';c.beginPath();c.arc(0,0,r*.82,.4,1.7);c.stroke();}c.restore();
 }
 block(t:Target){
  const c=this.ctx,outline=()=>{c.beginPath();if(t.kind==='capacitor')c.arc(t.x,t.y,t.size/2,0,Math.PI*2);else{const points=vertices(t);c.moveTo(points[0].x,points[0].y);for(const p of points.slice(1))c.lineTo(p.x,p.y);c.closePath();}};
  const textured=['steel','prism','capacitor'].includes(t.kind)&&this.sprite(t.kind,t.x,t.y,t.size+5);
  if(!textured){outline();const fill=c.createLinearGradient(t.x-t.size/2,t.y-t.size/2,t.x+t.size/2,t.y+t.size/2);fill.addColorStop(0,'#bec2bc');fill.addColorStop(.12,'#465a61');fill.addColorStop(.5,'#1b303b');fill.addColorStop(.86,'#09171f');fill.addColorStop(1,'#98afb0');c.fillStyle=fill;c.shadowColor='#000a';c.shadowBlur=4;c.shadowOffsetY=3;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.lineWidth=4;c.strokeStyle='#15252d';c.stroke();c.lineWidth=2;c.strokeStyle='#b6c5be';c.stroke();c.save();outline();c.clip();c.strokeStyle='#c3dbe51a';c.lineWidth=.5;for(let y=t.y-t.size/2;y<t.y+t.size/2;y+=2){c.beginPath();c.moveTo(t.x-t.size/2,y);c.lineTo(t.x+t.size/2,y-2);c.stroke();}c.restore();}
  if(t.power||t.core){
   const color=t.core?'#df9aff':t.power==='spring'?'#ffd077':t.power==='valve'?'#65e7f0':'#84efaa';outline();c.strokeStyle=color;c.lineWidth=2;c.shadowColor=color;c.shadowBlur=t.flash>0?18:5;c.stroke();c.shadowBlur=0;
   if(t.core){c.save();c.translate(t.x,t.y);c.scale(1.16,1.16);c.translate(-t.x,-t.y);outline();c.lineWidth=1;c.stroke();c.restore();for(const dx of [-1,1]){c.fillStyle=color;c.beginPath();c.arc(t.x+dx*(t.size/2+4),t.y,2.5,0,Math.PI*2);c.fill();}}
   else if(t.power==='spring'){const y=t.y+(t.kind==='bar'?t.size/8:t.size/2)+4;c.beginPath();c.moveTo(t.x-14,y);for(let i=0;i<9;i++)c.lineTo(t.x-12+i*3,y+(i%2?3:-3));c.lineTo(t.x+14,y);c.lineWidth=1.5;c.stroke();}
   else if(t.power==='valve'){const y=t.y+(t.kind==='bar'?t.size/8:t.size/2)+5;c.lineWidth=2;c.beginPath();c.arc(t.x,y,5,.2,Math.PI*1.8);c.moveTo(t.x-8,y);c.lineTo(t.x+8,y);c.stroke();}
   else{const y=t.y+t.size/2+5;c.fillStyle=color;c.beginPath();c.arc(t.x,y,3.5,0,Math.PI*2);c.fill();c.fillStyle='#14332a';c.fillRect(t.x-1,y-2,2,4);}
  }
  if(t.anchor){c.strokeStyle='#f4d49b';c.lineWidth=2;for(const dx of [-1,1])for(const dy of [-1,1]){const x=t.x+dx*t.size*.29,y=t.y+dy*t.size*.29;c.fillStyle='#544732';c.beginPath();c.arc(x,y,3,0,Math.PI*2);c.fill();c.stroke();}}
 }
 draw(g:Game,time:number,reduced:boolean,aiming:boolean){const c=this.ctx,uiFont=Math.max(13,Math.min(20,12*H/this.cssHeight));c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);c.clearRect(0,0,W,H);
  if(this.arena.complete&&this.arena.naturalWidth)c.drawImage(this.arena,0,0,W,H);else{
   const plate=c.createLinearGradient(0,0,W,H);plate.addColorStop(0,'#243239');plate.addColorStop(.5,'#121c22');plate.addColorStop(1,'#23343a');c.fillStyle=plate;c.fillRect(0,0,W,H);
   c.strokeStyle='#c9d5d70b';c.lineWidth=.5;for(let y=0;y<H;y+=5){c.beginPath();c.moveTo(18,y);c.lineTo(402,y-8);c.stroke();}
   c.strokeStyle='#72878b';c.lineWidth=8;c.lineJoin='round';c.beginPath();c.moveTo(18,36);c.lineTo(190,114);c.lineTo(190,137);c.moveTo(402,36);c.lineTo(230,114);c.lineTo(230,137);c.stroke();c.lineWidth=4;c.strokeStyle='#748e95';c.strokeRect(18,10,384,695);
  }
  // Reserve marbles occupy the existing triangular hopper, with no extra HUD row.
  g.queue.slice(g.shots).forEach((q,i)=>{const p=HOPPER_SLOTS[i];this.ball(q.material,p.x,p.y,SIZES[q.size].radius);if(i===0){c.strokeStyle='#eec789';c.lineWidth=1;c.beginPath();c.arc(p.x,p.y,SIZES[q.size].radius+3,0,Math.PI*2);c.stroke();}});
  // Crisp operational overlays sit above the material plate.
  c.textAlign='center';c.font=`${uiFont}px "Segoe UI",sans-serif`;c.fillStyle='#bbada0';if(g.phase!=='volley')c.fillText(`${SIZES[g.size].name}号${MATERIALS[g.material].name}珠  ·  待发 ${g.remainingShots} / ${g.queue.length}`,210,153);
  c.setLineDash([3,6]);c.strokeStyle=g.mode==='challenge'?'#70c3cb33':'#ce7b6555';c.lineWidth=1;c.beginPath();c.moveTo(29,184);c.lineTo(391,184);c.stroke();c.setLineDash([]);c.fillStyle='#aeaaa0';c.font='9px "Segoe UI",sans-serif';
  if(g.phase==='aim'){
   // A short direction marker, never a trajectory or a flight trail.
   c.save();c.translate(LAUNCH.x,LAUNCH.y);c.rotate(g.angle);c.fillStyle='#efbd79';c.beginPath();c.moveTo(28,-4);c.lineTo(35,0);c.lineTo(28,4);c.fill();c.restore();

   if(!aiming&&g.wave===1&&g.shots===0){c.fillStyle='#f4dbc0';c.font=`${uiFont}px "Segoe UI",sans-serif`;c.fillText('拖动瞄准，松开发射',210,236);c.font=`${uiFont}px Segoe UI`;c.fillText('发射后左右滑动，移动挡板',210,259);c.fillStyle='#aab7b9';c.font='10px "Segoe UI",sans-serif';}
  }
  for(const r of g.rails){c.save();if(g.safetyReturn)c.globalAlpha=.15;const x=r.side==='left'?18:395,active=r.charges>0;c.fillStyle='#161d20';c.fillRect(x,r.y,7,r.h);const metal=c.createLinearGradient(x,0,x+7,0);metal.addColorStop(0,'#57442c');metal.addColorStop(.5,active?'#f5ce82':'#7b776e');metal.addColorStop(1,'#443c2f');c.fillStyle=metal;c.shadowColor='#ffc76b';c.shadowBlur=active&&!reduced?7:0;c.fillRect(x+1,r.y+2,5,r.h-4);c.shadowBlur=0;for(let y=r.y+7;y<r.y+r.h-5;y+=7){c.strokeStyle=active?'#443928':'#363b3d';c.beginPath();c.moveTo(x,y);c.lineTo(x+7,y+3);c.stroke();}for(let i=0;i<r.maxCharges;i++){c.fillStyle=i<r.charges?'#ffecb5':'#3b4546';c.fillRect(r.side==='left'?x+10:x-7,r.y+9+i*9,4,5);}c.restore();}
  for(const z of g.air){c.save();if(g.safetyReturn)c.globalAlpha=.15;drawAir(c,z,time,reduced);c.restore();}
  for(const p of g.pegs){c.save();if(g.safetyReturn)c.globalAlpha=.15;const fill=c.createRadialGradient(p.x-p.r*.3,p.y-p.r*.4,1,p.x,p.y,p.r);fill.addColorStop(0,'#c3caca');fill.addColorStop(.45,'#576568');fill.addColorStop(.8,'#18262c');fill.addColorStop(1,'#71888c');c.fillStyle=fill;c.strokeStyle='#b6d1d2';c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#101c20';c.lineWidth=3;c.beginPath();c.moveTo(p.x-5,p.y);c.lineTo(p.x+5,p.y);c.moveTo(p.x,p.y-5);c.lineTo(p.x,p.y+5);c.stroke();c.restore();}
  for(const t of g.targets){c.save();if(g.safetyReturn)c.globalAlpha=.15;if(t.flash>0){c.shadowColor=t.kind==='capacitor'?'#72efff':'#ffbb67';c.shadowBlur=16;}this.block(t);c.shadowBlur=0;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${Math.max(uiFont,t.kind==='bar'?15:t.hp>99?17:21)}px "Bahnschrift","Segoe UI",sans-serif`;c.shadowColor='#000';c.shadowBlur=4;c.fillStyle=t.kind==='capacitor'?'#d4ffff':'#f2eee5';c.fillText(String(Math.max(0,t.hp)),t.x,t.y+(t.kind==='prism'?9:1));c.restore();}
  for(const gate of g.gates){c.save();if(g.safetyReturn)c.globalAlpha=.15;c.fillStyle=gate.open?'#79bba755':'#39484c';c.strokeStyle=gate.open?'#80deb0':'#eaac74';c.lineWidth=2;if(!gate.open){c.fillRect(gate.x-gate.size/2,gate.y-gate.size/8,gate.size,gate.size/4);c.strokeRect(gate.x-gate.size/2,gate.y-gate.size/8,gate.size,gate.size/4);}else{c.fillRect(gate.x-gate.size/2,gate.y-14,8,28);c.fillRect(gate.x+gate.size/2-8,gate.y-14,8,28);}c.fillStyle=gate.open?'#8aebae':'#f2c58c';c.font='9px Segoe UI';c.textAlign='center';if(!gate.open){c.lineWidth=1.5;c.strokeRect(gate.x-5,gate.y-1,10,8);c.beginPath();c.arc(gate.x,gate.y-1,4,Math.PI,0);c.stroke();}c.restore();}
  for(const t of g.targets)if(t.motion){c.save();if(g.safetyReturn)c.globalAlpha=.2;c.strokeStyle='#9fb7bd66';c.lineWidth=2;const y=t.y+t.size/2+11;c.beginPath();c.moveTo(t.motion.baseX-t.size/2-14,y);c.lineTo(t.motion.baseX+t.size/2+14,y);c.stroke();for(const x of [t.motion.baseX-t.size/2-14,t.motion.baseX+t.size/2+14]){c.fillStyle='#afc6c8';c.beginPath();c.arc(x,y,2,0,Math.PI*2);c.fill();}c.restore();}
  for(const t of g.treasures){c.save();c.translate(t.x,t.y);const color=t.kind==='life'?'#a5f2bb':t.kind==='wide'?'#ffdb9e':'#b8d5ff';c.fillStyle='#142c35';c.strokeStyle=color;c.shadowColor=color;c.shadowBlur=reduced?0:10;c.lineWidth=2;c.beginPath();c.arc(0,0,t.r,0,Math.PI*2);c.fill();c.stroke();c.shadowBlur=0;c.fillStyle=color;c.font='700 19px Segoe UI';c.textAlign='center';c.textBaseline='middle';c.fillText(t.kind==='life'?'♥':t.kind==='wide'?'↔':'●',0,0);c.lineWidth=2;c.beginPath();c.arc(0,0,t.r+4,-Math.PI/2,-Math.PI/2+Math.PI*2*t.life/12);c.stroke();c.restore();}
  {const p=g.paddle,h=p.width/2;c.save();if(g.safetyReturn||g.goalComplete)c.globalAlpha=.25;const fill=c.createLinearGradient(0,PADDLE_Y-6,0,PADDLE_Y+22);fill.addColorStop(0,'#e4f0e4');fill.addColorStop(.3,(p.boost||0)>18000?'#efb84e':g.wideTime>0?'#a98a54':'#657f82');fill.addColorStop(.6,'#233f48');fill.addColorStop(1,'#07171d');c.fillStyle=fill;c.strokeStyle='#b4ced2';c.lineWidth=1.5;c.shadowColor=(p.boost||0)>18000?'#ffd06d':p.flash>0?'#fff3c1':'#71dce2';c.shadowBlur=reduced?0:p.flash>0?16:5;c.beginPath();c.moveTo(p.x-h,PADDLE_Y+10-(p.tilt||0)*h);c.quadraticCurveTo(p.x,PADDLE_Y-10,p.x+h,PADDLE_Y+10+(p.tilt||0)*h);c.lineTo(p.x+h-3,PADDLE_Y+22+(p.tilt||0)*h);c.lineTo(p.x-h+3,PADDLE_Y+22-(p.tilt||0)*h);c.closePath();c.fill();c.stroke();c.shadowBlur=0;c.fillStyle=(p.boost||0)>18000?'#ffdc87':g.wideTime>0?'#ffe2a3':'#a7f6ff';c.fillRect(p.x-14,PADDLE_Y+12,28,3);for(const x of [p.x-h+9,p.x+h-9]){c.fillStyle='#d6dacf';c.beginPath();c.arc(x,PADDLE_Y+15,2,0,Math.PI*2);c.fill();}c.restore();}
  for(const b of g.balls)this.ball(g.material,b.x,b.y,b.r);
  if(g.safetyReturn||g.goalComplete){c.fillStyle=g.goalComplete?'#e8b6ff':'#a7f5ff';c.textAlign='center';c.font=`${uiFont}px Segoe UI`;c.fillText(g.safetyReturn?'积木让位 · 自然回收':'目标完成 · 等待落底',210,215);}
  if(!reduced)for(const p of g.effects){c.save();c.globalAlpha=p.life/p.max;c.strokeStyle=p.color;c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=8;if(p.ring){c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,8+(1-p.life/p.max)*43,0,Math.PI*2);c.stroke();}else c.fillRect(p.x,p.y,2.5,2.5);c.restore();}
  if(g.phase==='volley'){c.fillStyle='#f9bd72';c.font='600 15px "Bahnschrift",sans-serif';c.fillText(`${g.combo} 连击`,210,145);}
 }
}
