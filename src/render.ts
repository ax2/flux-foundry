import {Game,W,H,LAUNCH} from './game';
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
 draw(g:Game,time:number,reduced:boolean,aiming:boolean){const c=this.ctx;c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);c.clearRect(0,0,W,H);
  if(this.arena.complete&&this.arena.naturalWidth)c.drawImage(this.arena,0,0,W,H);else{c.fillStyle='#171d20';c.fillRect(0,0,W,H);}
  // Crisp operational overlays sit above the material plate.
  c.textAlign='center';c.font='10px "Segoe UI",sans-serif';c.fillStyle='#bbada0';if(g.phase!=='volley')c.fillText(`钢珠 ${g.count}  /  冲击 ${g.power}`,210,153);
  c.setLineDash([3,6]);c.strokeStyle='#ce7b6555';c.lineWidth=1;c.beginPath();c.moveTo(29,184);c.lineTo(391,184);c.stroke();c.setLineDash([]);c.fillStyle='#ae8275';c.font='8px "Segoe UI",sans-serif';c.fillText('过载警戒线 · 不要让靶块抵达这里',210,177);
  c.strokeStyle='#9bafaa44';c.beginPath();c.moveTo(40,685);c.lineTo(380,685);c.stroke();c.fillStyle='#9aa9a4';c.fillText('磁  力  回  收  槽',210,703);
  if(g.phase==='aim'){
   // A short direction marker, never a trajectory or a flight trail.
   c.save();c.translate(LAUNCH.x,LAUNCH.y);c.rotate(g.angle);c.fillStyle='#efbd79';c.beginPath();c.moveTo(28,-4);c.lineTo(35,0);c.lineTo(28,4);c.fill();c.restore();
   this.sprite('ball',LAUNCH.x,LAUNCH.y,24);
   if(!aiming&&g.wave===1){c.fillStyle='#f4dbc0';c.font='13px "Segoe UI",sans-serif';c.fillText('拖动瞄准，松开发射',210,292);c.fillStyle='#aab7b9';c.font='10px "Segoe UI",sans-serif';c.fillText('击碎电容，让能量在靶阵间连锁',210,315);}
  }
  for(const t of g.targets){c.save();if(t.flash>0){c.shadowColor=t.kind==='capacitor'?'#72efff':'#ffbb67';c.shadowBlur=16;}this.sprite(t.kind,t.x,t.y,t.size+5);c.shadowBlur=0;c.textAlign='center';c.textBaseline='middle';c.font=`700 ${t.hp>99?17:21}px "Bahnschrift","Segoe UI",sans-serif`;c.shadowColor='#000';c.shadowBlur=4;c.fillStyle=t.kind==='capacitor'?'#d4ffff':'#f2eee5';c.fillText(String(Math.max(0,t.hp)),t.x,t.y+(t.kind==='prism'?9:1));c.restore();}
  if(g.magnet){const m=g.magnet;c.save();c.translate(m.x,m.y);c.strokeStyle='#67ebf7';c.shadowColor='#55e8ff';c.shadowBlur=14;c.lineWidth=2;for(let i=0;i<3;i++){c.globalAlpha=.7-i*.2;c.beginPath();c.arc(0,0,30+i*14+(!reduced?Math.sin(time*3)*3:0),time*(i%2?1:-1),time*(i%2?1:-1)+Math.PI*1.7);c.stroke();}c.restore();}
  for(const b of g.balls)this.sprite('ball',b.x,b.y,b.r*2);
  if(!reduced)for(const p of g.effects){c.save();c.globalAlpha=p.life/p.max;c.strokeStyle=p.color;c.fillStyle=p.color;c.shadowColor=p.color;c.shadowBlur=8;if(p.ring){c.lineWidth=1.5;c.beginPath();c.arc(p.x,p.y,8+(1-p.life/p.max)*43,0,Math.PI*2);c.stroke();}else c.fillRect(p.x,p.y,2.5,2.5);c.restore();}
  if(g.phase==='volley'){c.fillStyle='#f9bd72';c.font='600 15px "Bahnschrift",sans-serif';c.fillText(`${g.combo} 连击`,210,145);c.fillStyle='#c6cfd0';c.font='9px "Segoe UI",sans-serif';c.fillText(`单球弹射  ·  重力与真实回弹`,210,160);}
 }
}
