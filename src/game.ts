import {collide,type Body,type Target} from './physics';
export const W=420,H=720,LAUNCH={x:210,y:120},STEP=1/120;
export type Phase='aim'|'volley'|'upgrade'|'over';
export type Ball=Body&{age:number;trail:{x:number;y:number}[]};
export type Effect={x:number;y:number;life:number;max:number;color:string;vx:number;vy:number;ring:boolean};
export type Upgrade='swarm'|'power'|'field';
export class Game{
 phase:Phase='aim';wave=1;score=0;bestCombo=0;combo=0;count=18;power=1;fieldLevel=0;balls:Ball[]=[];targets:Target[]=[];effects:Effect[]=[];
 angle=Math.PI/2;pending=0;timer=0;elapsed=0;paused=false;magnet:{x:number;y:number;life:number}|null=null;magnetUsed=false;nextId=0;seed:number;onHit:((kind:string)=>void)|null=null;
 constructor(seed=Date.now()){this.seed=seed>>>0;this.addRow(453);this.addRow(531);}
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 addRow(y:number){for(let col=0;col<5;col++){if(this.random()<.16&&col!==2)continue;const kind=(['steel','prism','capacitor'] as const)[Math.floor(this.random()*3)];const hp=Math.max(2,Math.round((5+this.wave*2.5)*(kind==='capacitor'?.6:kind==='prism'?1.2:1)));this.targets.push({id:this.nextId++,x:66+col*72,y,size:57,kind,hp,maxHp:hp,flash:0});}}
 aim(x:number,y:number){this.angle=Math.max(.16,Math.min(Math.PI-.16,Math.atan2(Math.max(15,y-LAUNCH.y),x-LAUNCH.x)));}
 fire(){if(this.phase!=='aim'||this.paused)return false;this.phase='volley';this.pending=this.count;this.timer=0;this.elapsed=0;this.combo=0;this.magnetUsed=false;return true;}
 field(x:number,y:number){if(this.phase!=='volley'||this.magnetUsed||this.paused)return false;this.magnet={x:Math.max(45,Math.min(375,x)),y:Math.max(185,Math.min(625,y)),life:3.8+this.fieldLevel*.8};this.magnetUsed=true;return true;}
 burst(x:number,y:number,color:string,n=12){for(let i=0;i<n;i++){const a=Math.PI*2*i/n,s=35+(i%4)*33;this.effects.push({x,y,life:.45,max:.45,color,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ring:false});}this.effects.push({x,y,life:.45,max:.45,color,vx:0,vy:0,ring:true});if(this.effects.length>420)this.effects.splice(0,this.effects.length-420);}
 damage(t:Target,damage:number){if(t.hp<=0)return;t.hp-=damage;t.flash=.12;this.score+=10*damage;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.onHit?.(t.kind);
  if(t.hp<=0){this.score+=75;this.burst(t.x,t.y,t.kind==='capacitor'?'#75f8fa':'#ffc572');if(t.kind==='capacitor')for(const other of this.targets){if(other.hp>0&&Math.hypot(t.x-other.x,t.y-other.y)<135)this.damage(other,3+this.power*2);}}
 }
 recall(){if(this.phase==='volley'){this.balls=[];this.pending=0;this.finish();}}
 finish(){this.balls=[];this.pending=0;this.magnet=null;this.targets=this.targets.filter(t=>t.hp>0);for(const t of this.targets)t.y-=78;
  if(this.targets.some(t=>t.y-t.size/2<184)){this.phase='over';return;}
  this.wave++;this.count=Math.min(80,this.count+2);this.addRow(609);this.phase=this.wave%3===0?'upgrade':'aim';
 }
 upgrade(choice:Upgrade){if(this.phase!=='upgrade')return;if(choice==='swarm')this.count=Math.min(80,this.count+6);if(choice==='power')this.power++;if(choice==='field')this.fieldLevel++;this.phase='aim';}
 update(dt:number){if(this.paused)return;
  for(const t of this.targets)t.flash=Math.max(0,t.flash-dt);
  for(const p of this.effects){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}this.effects=this.effects.filter(p=>p.life>0);
  if(this.phase!=='volley')return;this.elapsed+=dt;this.timer-=dt;
  if(this.pending>0&&this.timer<=0){this.pending--;this.timer+=.065;this.balls.push({...LAUNCH,vx:Math.cos(this.angle)*440,vy:Math.sin(this.angle)*440,r:5,age:0,trail:[]});}
  if(this.magnet){this.magnet.life-=dt;if(this.magnet.life<=0)this.magnet=null;}
  for(const b of this.balls){b.age+=dt;b.trail.unshift({x:b.x,y:b.y});if(b.trail.length>9)b.trail.pop();
   if(this.magnet){const dx=this.magnet.x-b.x,dy=this.magnet.y-b.y,d=Math.hypot(dx,dy);if(d<230&&d>12){const f=520*(1-d/260);b.vx+=dx/d*f*dt;b.vy+=dy/d*f*dt;}}
   const speed=Math.hypot(b.vx,b.vy);b.vx=b.vx/speed*440;b.vy=b.vy/speed*440;
   b.x+=b.vx*dt;b.y+=b.vy*dt;
   if(b.x<18+b.r){b.x=18+b.r;b.vx=Math.abs(b.vx);}if(b.x>402-b.r){b.x=402-b.r;b.vx=-Math.abs(b.vx);}
   if(b.y<117){b.y=117;b.vy=Math.abs(b.vy);}
   // Collector returns balls that fall through. A bounded lifetime prevents shallow-orbit soft locks.
   for(const t of this.targets){if(t.hp>0&&collide(b,t)){this.damage(t,this.power);break;}}
  }
  this.balls=this.balls.filter(b=>b.y<692&&b.age<16);
  this.targets=this.targets.filter(t=>t.hp>0);
  if((this.pending===0&&this.balls.length===0)||this.elapsed>23)this.finish();
 }
}
