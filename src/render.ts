import {Game,W,H,LAUNCH} from './game';
import {vertices,type Target} from './physics';
import {MATERIALS,SIZES,type Material} from './content';
export class Renderer{
 ctx:CanvasRenderingContext2D;arena=new Image();atlas=new Image();ready:Promise<unknown>;
 constructor(public canvas:HTMLCanvasElement){this.ctx=canvas.getContext('2d')!;this.arena.src='./assets/arena.png';this.atlas.src='./assets/targets.png';this.ready=Promise.all([this.arena.decode(),this.atlas.decode()]);}
 resize(){const d=Math.min(devicePixelRatio,2),r=this.canvas.getBoundingClientRect();this.canvas.width=Math.round(r.width*d);this.canvas.height=Math.round(r.height*d);}
 sprite(kind:string,x:number,y:number,size:number){
  const c=this.ctx,a=this.atlas;if(!a.complete||!a.naturalWidth)return;
  // Atlas silhouette bounds in normalized image coordinates; physics uses the visible object, not transparent padding.
  const rects:Record<string,number[]>={steel:[.017,.151,.237,.71],prism:[.271,.17,.255,.68],capacitor:[.539,.131,.253,.75],ball:[.82,.29,.15,.45]};
  const [sx,sy,sw,sh]=rects[kind];c.drawImage(a,sx*a.width,sy*a.height,sw*a.width,sh*a.height,x-size/2,y-size/2,size,size);
 }
 ball(material:Material,x:number,y:number,r:number){
  if(material==='steel'){this.sprite('ball',x,y,r*2);return;}
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
  if(['steel','prism','capacitor'].includes(t.kind))this.sprite(t.kind,t.x,t.y,t.size+5);
  else{outline();const fill=c.createLinearGradient(t.x-t.size/2,t.y-t.size/2,t.x+t.size/2,t.y+t.size/2);fill.addColorStop(0,'#bec2bc');fill.addColorStop(.12,'#465a61');fill.addColorStop(.5,'#1b303b');fill.addColorStop(.86,'#09171f');fill.addColorStop(1,'#98afb0');c.fillStyle=fill;c.shadowColor='#000a';c.shadowBlur=4;c.shadowOffsetY=3;c.fill();c.shadowBlur=0;c.shadowOffsetY=0;c.lineWidth=4;c.strokeStyle='#15252d';c.stroke();c.lineWidth=2;c.strokeStyle='#b6c5be';c.stroke();c.save();outline();c.clip();c.strokeStyle='#c3dbe51a';c.lineWidth=.5;for(let y=t.y-t.size/2;y<t.y+t.size/2;y+=2){c.beginPath();c.moveTo(t.x-t.size/2,y);c.lineTo(t.x+t.size/2,y-2);c.stroke();}c.restore();}
  if(t.power||t.core){outline();c.strokeStyle=t.core?'#df9aff':t.power==='spring'?'#ffd077':'#84efaa';c.lineWidth=2;c.shadowColor=c.strokeStyle;c.shadowBlur=t.flash>0?18:5;c.stroke();c.shadowBlur=0;c.font='bold 8px "Segoe UI",sans-serif';c.textAlign='center';c.fillStyle=c.strokeStyle;c.fillText(t.core?'核心':t.power==='spring'?'ϟ 弹簧':'开关',t.x,t.y-t.size/2-7);}
  const y=t.y+(t.kind==='bar'?t.size/8:t.size/2)+6;c.fillStyle='#101719';c.fillRect(t.x-t.size/2,y,t.size,2);c.fillStyle=t.hp>=10?'#dd9af1':t.hp>=4?'#e5b26a':'#8cd6cb';c.fillRect(t.x-t.size/2,y,t.size*t.hp/t.maxHp,2);
 }
 draw(g:Game,time:number,reduced:boolean,aiming:boolean){const c=this.ctx;c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);c.clearRect(0,0,W,H);
  if(this.arena.complete&&this.arena.naturalWidth)c.drawImage(this.arena,0,0,W,H);else{c.fillStyle='#171d20';c.fillRect(0,0,W,H);}
  // Crisp operational overlays sit above the material plate.
  c.textAlign='center';c.font='10px "Segoe UI",sans-serif';c.fillStyle='#bbada0';if(g.phase!=='volley')c.fillText(`${SIZES[g.size].name}号${MATERIALS[g.material].name}珠  /  每次撞击 −1`,210,153);
  c.setLineDash([3,6]);c.strokeStyle=g.mode==='challenge'?'#70c3cb33':'#ce7b6555';c.lineWidth=1;c.beginPath();c.moveTo(29,184);c.lineTo(391,184);c.stroke();c.setLineDash([]);c.fillStyle='#aeaaa0';c.font='9px "Segoe UI",sans-serif';c.fillText(g.mode==='challenge'?`${g.level.goal==='core'?'击碎紫色核心':'清除全部 '+g.targets.length+' 个积木'} · 待发 ${g.remainingShots} 颗`:'过载警戒线 · 不要让积木抵达这里',210,177);
  c.strokeStyle='#9bafaa44';c.beginPath();c.moveTo(40,685);c.lineTo(380,685);c.stroke();c.fillStyle='#9aa9a4';c.fillText('磁  力  回  收  槽',210,703);
  if(g.phase==='aim'){
   // A short direction marker, never a trajectory or a flight trail.
   c.save();c.translate(LAUNCH.x,LAUNCH.y);c.rotate(g.angle);c.fillStyle='#efbd79';c.beginPath();c.moveTo(28,-4);c.lineTo(35,0);c.lineTo(28,4);c.fill();c.restore();
   this.ball(g.material,LAUNCH.x,LAUNCH.y,g.spec.r);
   if(!aiming&&g.wave===1&&g.shots===0){c.fillStyle='#f4dbc0';c.font='13px "Segoe UI",sans-serif';c.fillText('拖动瞄准，松开发射',210,236);c.fillStyle='#aab7b9';c.font='10px "Segoe UI",sans-serif';c.fillText(g.mode==='challenge'?g.level.name+' · 挑战开始':'顶部选珠 · 每局固定库存',210,257);}
  }
  for(const z of g.air){c.save();if(g.safetyReturn)c.globalAlpha=.15;c.fillStyle='#61dfe60b';c.fillRect(z.x,z.y,z.w,z.h);c.strokeStyle='#70e8ee36';c.setLineDash([4,5]);c.strokeRect(z.x,z.y,z.w,z.h);c.setLineDash([]);c.fillStyle='#8fe5e970';c.font='20px "Segoe UI",sans-serif';const offset=reduced?0:(time*12)%38;for(let x=z.x+22+offset;x<z.x+z.w-12;x+=38)c.fillText(z.fx>0?'→':'←',x,z.y+z.h/2+6);c.font='8px "Segoe UI",sans-serif';c.textAlign='left';c.fillText('气流',z.x+6,z.y+12);c.restore();}
  for(const p of g.pegs){c.save();if(g.safetyReturn)c.globalAlpha=.15;const fill=c.createRadialGradient(p.x-p.r*.3,p.y-p.r*.4,1,p.x,p.y,p.r);fill.addColorStop(0,'#c3caca');fill.addColorStop(.45,'#576568');fill.addColorStop(.8,'#18262c');fill.addColorStop(1,'#71888c');c.fillStyle=fill;c.strokeStyle='#b6d1d2';c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,p.r,0,Math.PI*2);c.fill();c.stroke();c.strokeStyle='#101c20';c.lineWidth=3;c.beginPath();c.moveTo(p.x-5,p.y);c.lineTo(p.x+5,p.y);c.moveTo(p.x,p.y-5);c.lineTo(p.x,p.y+5);c.stroke();c.restore();}
  for(const t of g.targets){c.save();if(g.safetyReturn)c.globalAlpha=.15;if(t.flash>0){c.shadowColor=t.kind==='capacitor'?'#72efff':'#ffbb67';c.shadowBlur=16;}this.block(t);c.shadowBlur=0;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${t.kind==='bar'?15:t.hp>99?17:21}px "Bahnschrift","Segoe UI",sans-serif`;c.shadowColor='#000';c.shadowBlur=4;c.fillStyle=t.kind==='capacitor'?'#d4ffff':'#f2eee5';c.fillText(String(Math.max(0,t.hp)),t.x,t.y+(t.kind==='prism'?9:1));c.restore();}
  for(const gate of g.gates){c.save();if(g.safetyReturn)c.globalAlpha=.15;c.fillStyle=gate.open?'#79bba755':'#39484c';c.strokeStyle=gate.open?'#80deb0':'#eaac74';c.lineWidth=2;if(!gate.open){c.fillRect(gate.x-gate.size/2,gate.y-gate.size/8,gate.size,gate.size/4);c.strokeRect(gate.x-gate.size/2,gate.y-gate.size/8,gate.size,gate.size/4);}else{c.fillRect(gate.x-gate.size/2,gate.y-14,8,28);c.fillRect(gate.x+gate.size/2-8,gate.y-14,8,28);}c.fillStyle=gate.open?'#8aebae':'#f2c58c';c.font='9px Segoe UI';c.textAlign='center';c.fillText(gate.open?'闸门已开':'击碎开关开启',gate.x,gate.y+3);c.restore();}
  if(g.magnet){const m=g.magnet;c.save();c.translate(m.x,m.y);c.strokeStyle='#67ebf7';c.shadowColor='#55e8ff';c.shadowBlur=14;c.lineWidth=2;for(let i=0;i<3;i++){c.globalAlpha=.7-i*.2;c.beginPath();c.arc(0,0,30+i*14+(!reduced?Math.sin(time*3)*3:0),time*(i%2?1:-1),time*(i%2?1:-1)+Math.PI*1.7);c.stroke();}c.restore();}
  for(const b of g.balls){if(g.rescuePulse){c.save();c.strokeStyle='#9ceeff';c.lineWidth=2;c.beginPath();c.moveTo(b.x-16,b.y+28);c.lineTo(b.x-6,b.y+8);c.moveTo(b.x+16,b.y+28);c.lineTo(b.x+6,b.y+8);c.stroke();c.restore();}this.ball(g.material,b.x,b.y,b.r);}
  if(g.safetyReturn||g.rescuePulse||g.goalComplete){c.fillStyle=g.goalComplete?'#e8b6ff':'#a7f5ff';c.textAlign='center';c.font='12px Segoe UI';c.fillText(g.safetyReturn?'救援通道开启 · 积木已退让':g.rescuePulse?'脱困气脉冲运行中':'目标完成 · 落底或收球后结算',210,215);}
  if(!reduced)for(const p of g.effects){c.save();c.globalAlpha=p.life/p.max;c.strokeStyle=p.color;c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=8;if(p.ring){c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,8+(1-p.life/p.max)*43,0,Math.PI*2);c.stroke();}else c.fillRect(p.x,p.y,2.5,2.5);c.restore();}
  if(g.phase==='volley'){c.fillStyle='#f9bd72';c.font='600 15px "Bahnschrift",sans-serif';c.fillText(`${g.combo} 连击`,210,145);c.fillStyle='#c6cfd0';c.font='9px "Segoe UI",sans-serif';c.fillText(`单球弹射  ·  重力与真实回弹`,210,160);}
 }
}
