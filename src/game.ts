import {advanceFree,collide,reflect,type Body,type Target} from './physics';
import {ballProperties,LEVELS,MATERIALS,SIZES,type Material,type BallSize,type Peg,type AirZone} from './content';
export const W=420,H=720,LAUNCH={x:210,y:132},STEP=1/120,GRAVITY=240,BALL_RADIUS=12;
export type Phase='aim'|'volley'|'upgrade'|'over'|'won';
export type Ball=Body;
export type Effect={x:number;y:number;life:number;max:number;color:string;vx:number;vy:number;ring:boolean};
export type Upgrade='elastic'|'magnet'|'field';
export class Game{
 phase:Phase='aim';wave=1;score=0;bestCombo=0;combo=0;readonly count=1;readonly power=1;fieldStrength=1;elasticBonus=0;fieldLevel=0;material:Material='steel';size:BallSize='standard';mode:'endless'|'challenge'='endless';levelIndex=0;shots=0;pegs:Peg[]=[];air:AirZone[]=[];balls:Ball[]=[];targets:Target[]=[];effects:Effect[]=[];
 angle=Math.PI/2;paused=false;magnet:{x:number;y:number;life:number}|null=null;magnetUsed=false;nextId=0;seed:number;onHit:((kind:string)=>void)|null=null;
 constructor(seed=Date.now(),levelIndex?:number){this.seed=seed>>>0;if(levelIndex!==undefined){this.mode='challenge';this.levelIndex=Math.max(0,Math.min(LEVELS.length-1,Math.floor(levelIndex)));const level=this.level;this.targets=level.tiles.map(t=>({...t,id:this.nextId++,maxHp:t.hp,flash:0}));this.pegs=level.pegs.map(p=>({...p}));this.air=level.air.map(a=>({...a}));}else{this.addRow(453);this.addRow(531);}}
 get spec(){return ballProperties(this.material,this.size);}
 get restitution(){return Math.min(.99,this.spec.restitution+this.elasticBonus);}
 get level(){return LEVELS[this.levelIndex];}
 get remainingShots(){return this.mode==='challenge'?Math.max(0,this.level.shots-this.shots):Infinity;}
 get stars(){return this.phase==='won'?(this.shots<=this.level.par?3:this.shots<=this.level.par+2?2:1):0;}
 selectBall(material:Material,size:BallSize){if(this.phase!=='aim'||!Object.hasOwn(MATERIALS,material)||!Object.hasOwn(SIZES,size))return false;this.material=material;this.size=size;return true;}
 setEndlessMechanisms(){this.pegs=this.wave>=4?[{x:this.wave%2?145:275,y:300,r:20}].filter(p=>!this.targets.some(t=>Math.abs(t.x-p.x)<t.size/2+p.r+3&&Math.abs(t.y-p.y)<t.size/2+p.r+3)):[];this.air=this.wave>=6?[{x:45,y:345,w:330,h:65,fx:this.wave%2?35:-35,fy:0}]:[];}

 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 addRow(y:number){for(let col=0;col<5;col++){if(this.random()<.35&&col!==2)continue;const kind=(['steel','prism','capacitor'] as const)[Math.floor(this.random()*3)];const hp=Math.max(2,Math.round((2+this.wave*.65)*(kind==='capacitor'?.7:kind==='prism'?1.25:1)));this.targets.push({id:this.nextId++,x:66+col*72,y,size:57,kind,hp,maxHp:hp,flash:0});}}
 aim(x:number,y:number){this.angle=Math.max(.16,Math.min(Math.PI-.16,Math.atan2(Math.max(15,y-LAUNCH.y),x-LAUNCH.x)));}
 fire(){if(this.phase!=='aim'||this.paused)return false;this.phase='volley';this.shots++;this.combo=0;this.magnetUsed=false;this.balls=[{...LAUNCH,vx:Math.cos(this.angle)*this.spec.speed,vy:Math.sin(this.angle)*this.spec.speed,r:this.spec.r}];return true;}
 field(x:number,y:number){if(this.phase!=='volley'||this.magnetUsed||this.paused||this.spec.magnetic===0)return false;this.magnet={x:Math.max(45,Math.min(375,x)),y:Math.max(185,Math.min(625,y)),life:3.8+this.fieldLevel*.8};this.magnetUsed=true;return true;}
 burst(x:number,y:number,color:string,n=12){for(let i=0;i<n;i++){const a=Math.PI*2*i/n,s=35+(i%4)*33;this.effects.push({x,y,life:.45,max:.45,color,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ring:false});}this.effects.push({x,y,life:.45,max:.45,color,vx:0,vy:0,ring:true});if(this.effects.length>420)this.effects.splice(0,this.effects.length-420);}
 damage(t:Target){if(t.hp<=0)return;t.hp-=1;t.flash=.12;this.score+=10;this.combo++;this.bestCombo=Math.max(this.bestCombo,this.combo);this.onHit?.(t.kind);
  if(t.hp===0){this.score+=75;this.burst(t.x,t.y,t.kind==='capacitor'?'#75f8fa':'#ffc572');}
 }
 recall(){if(this.phase==='volley'){this.balls=[];this.finish();}}
 finish(){this.balls=[];this.magnet=null;this.targets=this.targets.filter(t=>t.hp>0);
  if(this.mode==='challenge'){this.phase=this.targets.length===0?'won':this.remainingShots===0?'over':'aim';return;}
  for(const t of this.targets)t.y-=39;
  if(this.targets.some(t=>t.y-t.size/2<184)){this.phase='over';return;}
  this.wave++;this.setEndlessMechanisms();if(this.wave%2===0||this.targets.length===0)this.addRow(609);this.phase=this.wave%3===0?'upgrade':'aim';
 }
 upgrade(choice:Upgrade){if(this.phase!=='upgrade')return;if(choice==='elastic')this.elasticBonus=Math.min(.1,this.elasticBonus+.02);if(choice==='magnet')this.fieldStrength+=.2;if(choice==='field')this.fieldLevel++;this.phase='aim';}
 update(dt:number){if(this.paused)return;
  for(const t of this.targets)t.flash=Math.max(0,t.flash-dt);
  for(const p of this.effects){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}this.effects=this.effects.filter(p=>p.life>0);
  if(this.phase!=='volley')return;
  const spec=this.spec,restitution=this.restitution;
  if(this.magnet){this.magnet.life-=dt;if(this.magnet.life<=0)this.magnet=null;}
  for(const b of this.balls){
   // Substeps keep travel below half the radius, preventing tunnelling at high speed.
   const steps=Math.max(1,Math.ceil((Math.hypot(b.vx,b.vy)+1000*dt)*dt/(b.r*.45))),h=dt/steps;
   for(let sub=0;sub<steps;sub++){
    let ax=0,ay=GRAVITY;
    for(const zone of this.air){if(b.x>=zone.x&&b.x<=zone.x+zone.w&&b.y>=zone.y&&b.y<=zone.y+zone.h){ax+=zone.fx*spec.windResponse;ay+=zone.fy*spec.windResponse;}}
    // A softened central force accelerates continuously; no speed reset or teleportation.
    if(this.magnet){const dx=this.magnet.x-b.x,dy=this.magnet.y-b.y,d2=dx*dx+dy*dy;const strength=3200000*this.fieldStrength*spec.magnetic/Math.pow(d2+80*80,1.5);ax+=dx*strength;ay+=dy*strength;}
    advanceFree(b,h,ax,ay);
    if(b.x<18+b.r){b.x=18+b.r;reflect(b,{x:1,y:0},restitution);}if(b.x>402-b.r){b.x=402-b.r;reflect(b,{x:-1,y:0},restitution);}
    if(b.y<112+b.r){b.y=112+b.r;reflect(b,{x:0,y:1},restitution);}
    for(const p of this.pegs)collide(b,{...p,id:-1,kind:'capacitor',size:p.r*2,hp:1,maxHp:1,flash:0},restitution);
    for(const t of this.targets){if(t.hp<=0)continue;const vx=b.vx,vy=b.vy;if(collide(b,t,restitution)){
      // Resting contact does not damage a target. Use the normal impact speed from the impulse.
      if(Math.hypot(b.vx-vx,b.vy-vy)/(1+restitution)>55)this.damage(t);
    }}
   }
  }
  // No lifetime limit: collect only after the whole ball enters the bottom slot.
  this.balls=this.balls.filter(b=>b.y-b.r<692);this.targets=this.targets.filter(t=>t.hp>0);
  if(this.balls.length===0)this.finish();
 }
}
