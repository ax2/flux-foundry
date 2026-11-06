import {advanceFree,collide,reflect,type Body,type Target} from './physics';
export const W=420,H=720,LAUNCH={x:210,y:132},STEP=1/120,GRAVITY=240,BALL_RADIUS=12;
export type Phase='aim'|'volley'|'upgrade'|'over';
export type Ball=Body&{age:number};
export type Effect={x:number;y:number;life:number;max:number;color:string;vx:number;vy:number;ring:boolean};
export type Upgrade='elastic'|'power'|'field';
export class Game{
 phase:Phase='aim';wave=1;score=0;bestCombo=0;combo=0;readonly count=1;power=3;restitution=.94;fieldLevel=0;balls:Ball[]=[];targets:Target[]=[];effects:Effect[]=[];
 angle=Math.PI/2;elapsed=0;paused=false;magnet:{x:number;y:number;life:number}|null=null;magnetUsed=false;nextId=0;seed:number;onHit:((kind:string)=>void)|null=null;
 constructor(seed=Date.now()){this.seed=seed>>>0;this.addRow(453);this.addRow(531);}
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 addRow(y:number){for(let col=0;col<5;col++){if(this.random()<.35&&col!==2)continue;const kind=(['steel','prism','capacitor'] as const)[Math.floor(this.random()*3)];const hp=Math.max(2,Math.round((2+this.wave*.65)*(kind==='capacitor'?.7:kind==='prism'?1.25:1)));this.targets.push({id:this.nextId++,x:66+col*72,y,size:57,kind,hp,maxHp:hp,flash:0});}}
 aim(x:number,y:number){this.angle=Math.max(.16,Math.min(Math.PI-.16,Math.atan2(Math.max(15,y-LAUNCH.y),x-LAUNCH.x)));}
 fire(){if(this.phase!=='aim'||this.paused)return false;this.phase='volley';this.elapsed=0;this.combo=0;this.magnetUsed=false;this.balls=[{...LAUNCH,vx:Math.cos(this.angle)*350,vy:Math.sin(this.angle)*350,r:BALL_RADIUS,age:0}];return true;}
 field(x:number,y:number){if(this.phase!=='volley'||this.magnetUsed||this.paused)return false;this.magnet={x:Math.max(45,Math.min(375,x)),y:Math.max(185,Math.min(625,y)),life:3.8+this.fieldLevel*.8};this.magnetUsed=true;return true;}
 burst(x:number,y:number,color:string,n=12){for(let i=0;i<n;i++){const a=Math.PI*2*i/n,s=35+(i%4)*33;this.effects.push({x,y,life:.45,max:.45,color,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ring:false});}this.effects.push({x,y,life:.45,max:.45,color,vx:0,vy:0,ring:true});if(this.effects.length>420)this.effects.splice(0,this.effects.length-420);}
 damage(t:Target,damage:number){if(t.hp<=0)return;t.hp-=damage;t.flash=.12;this.score+=10*damage;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.onHit?.(t.kind);
  if(t.hp<=0){this.score+=75;this.burst(t.x,t.y,t.kind==='capacitor'?'#75f8fa':'#ffc572');if(t.kind==='capacitor')for(const other of this.targets){if(other.hp>0&&Math.hypot(t.x-other.x,t.y-other.y)<135)this.damage(other,2+this.power);}}
 }
 recall(){if(this.phase==='volley'){this.balls=[];this.finish();}}
 finish(){this.balls=[];this.magnet=null;this.targets=this.targets.filter(t=>t.hp>0);for(const t of this.targets)t.y-=39;
  if(this.targets.some(t=>t.y-t.size/2<184)){this.phase='over';return;}
  this.wave++;if(this.wave%2===0||this.targets.length===0)this.addRow(609);this.phase=this.wave%3===0?'upgrade':'aim';
 }
 upgrade(choice:Upgrade){if(this.phase!=='upgrade')return;if(choice==='elastic')this.restitution=Math.min(.99,this.restitution+.02);if(choice==='power')this.power++;if(choice==='field')this.fieldLevel++;this.phase='aim';}
 update(dt:number){if(this.paused)return;
  for(const t of this.targets)t.flash=Math.max(0,t.flash-dt);
  for(const p of this.effects){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}this.effects=this.effects.filter(p=>p.life>0);
  if(this.phase!=='volley')return;this.elapsed+=dt;
  if(this.magnet){this.magnet.life-=dt;if(this.magnet.life<=0)this.magnet=null;}
  for(const b of this.balls){b.age+=dt;
   // Substeps keep travel below half the radius, preventing tunnelling at high speed.
   const steps=Math.max(1,Math.ceil((Math.hypot(b.vx,b.vy)+1000*dt)*dt/(b.r*.45))),h=dt/steps;
   for(let sub=0;sub<steps;sub++){
    let ax=0,ay=GRAVITY;
    // A softened central force accelerates continuously; no speed reset or teleportation.
    if(this.magnet){const dx=this.magnet.x-b.x,dy=this.magnet.y-b.y,d2=dx*dx+dy*dy;const strength=3200000/Math.pow(d2+80*80,1.5);ax+=dx*strength;ay+=dy*strength;}
    advanceFree(b,h,ax,ay);
    if(b.x<18+b.r){b.x=18+b.r;reflect(b,{x:1,y:0},this.restitution);}if(b.x>402-b.r){b.x=402-b.r;reflect(b,{x:-1,y:0},this.restitution);}
    if(b.y<112+b.r){b.y=112+b.r;reflect(b,{x:0,y:1},this.restitution);}
    for(const t of this.targets){if(t.hp<=0)continue;const vx=b.vx,vy=b.vy;if(collide(b,t,this.restitution)){
      // Resting contact does not damage a target. Use the normal impact speed from the impulse.
      if(Math.hypot(b.vx-vx,b.vy-vy)/(1+this.restitution)>55)this.damage(t,this.power);
    }}
   }
  }
  this.balls=this.balls.filter(b=>b.y-b.r<692&&b.age<22);this.targets=this.targets.filter(t=>t.hp>0);
  if(this.balls.length===0||this.elapsed>23)this.finish();
 }
}
