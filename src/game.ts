import {advanceFree,collide,reflect,type Body,type Target,type Vec} from './physics';
import {airStrength} from './air';
import {ballProperties,LEVELS,MATERIALS,SIZES,type Material,type BallSize,type Peg,type AirZone,type Gate,type Rail,type Choice} from './content';
export const W=420,H=720,LAUNCH={x:210,y:132},STEP=1/120,GRAVITY=240,BALL_RADIUS=12;
export type Phase='aim'|'volley'|'upgrade'|'over'|'won';
export type Ball=Body;
export type Effect={x:number;y:number;life:number;max:number;color:string;vx:number;vy:number;ring:boolean};
export type Upgrade='elastic'|'magnet'|'field';
const STOCK:Choice[]=[{material:'steel',size:'standard'},{material:'ceramic',size:'small'},{material:'brass',size:'standard'},{material:'rubber',size:'large'},{material:'steel',size:'large'},{material:'ceramic',size:'standard'}];
export class Game{
 phase:Phase='aim';wave=1;score=0;bestCombo=0;combo=0;readonly count=1;readonly power=1;
 fieldStrength=1;elasticLevel=0;elasticBonus=0;fieldLevel=0;material:Material='steel';size:BallSize='standard';
 mode:'endless'|'challenge'='endless';levelIndex=0;shots=0;queue:Choice[]=[];dailyKey:string|null=null;mirrorSign=1;
 pegs:Peg[]=[];air:AirZone[]=[];gates:Gate[]=[];rails:Rail[]=[];balls:Ball[]=[];targets:Target[]=[];effects:Effect[]=[];
 angle=Math.PI/2;paused=false;magnet:{x:number;y:number;life:number}|null=null;magnetUsed=false;nextId=0;seed:number;onHit:((kind:string)=>void)|null=null;
 stalled=0;supportedTime=0;supportGrace=0;anchor:Vec={...LAUNCH};rescuePulse:{life:number;direction:number}|null=null;rescueAttempts=0;safetyReturn=false;
 passiveLoops=0;passiveAnchor:{key:string;x:number;y:number}|null=null;
 rowsCreated=0;anchorsBroken=0;returnEnabled=false;returnCharges=2;returnRefills=0;returnProgress=0;returnFlash=0;pulseMax=2;pulseCharges=2;pulseDirection={x:0,y:-1};pulseUsed=false;liftTime=0;liftEnergy=0;
 eventSerial=0;lastEvent='';endReason='';stats={hits:0,flight:0,boosts:0,energy:0,rescues:0,returns:0,rebounds:0,recharges:0,pulses:0};
 constructor(seed=Date.now(),levelIndex?:number){
  this.seed=seed>>>0;
  if(levelIndex!==undefined){this.mode='challenge';this.levelIndex=Math.max(0,Math.min(LEVELS.length-1,Math.floor(levelIndex)));const l=this.level;
   this.targets=l.tiles.map(t=>({...t,id:this.nextId++,maxHp:t.hp,flash:0}));this.pegs=l.pegs.map(p=>({...p}));this.air=l.air.map(a=>({...a}));this.gates=l.gates.map(g=>({...g}));this.rails=(l.rails||[]).map(r=>({...r}));
  }else{this.addRow(453);this.addRow(550);this.rails=[{side:'left',y:440,h:100,charges:3,maxCharges:3},{side:'right',y:500,h:110,charges:3,maxCharges:3}];}
  this.queue=Array.from({length:this.mode==='challenge'?this.level.shots:12},(_,i)=>({...STOCK[i%STOCK.length]}));
 }
 get spec(){return ballProperties(this.material,this.size);}
 get restitution(){return Math.min(.99,this.spec.restitution+this.elasticBonus);}
 get level(){return LEVELS[this.levelIndex];}
 get remainingShots(){return Math.max(0,this.queue.length-this.shots);}
 get goalComplete(){return this.mode==='challenge'&&(this.level.goal==='core'?!this.targets.some(t=>t.core&&t.hp>0):!this.targets.some(t=>t.hp>0));}
 get stars(){return this.phase==='won'?(this.shots<=this.level.par?3:this.shots<=this.level.par+2?2:1):0;}
 say(message:string){this.lastEvent=message;this.eventSerial++;}
 selectBall(material:Material,size:BallSize){if(this.phase!=='aim'||this.remainingShots===0||!Object.hasOwn(MATERIALS,material)||!Object.hasOwn(SIZES,size))return false;this.material=material;this.size=size;this.queue[this.shots]={material,size};return true;}
 selectReserve(index:number){if(this.phase!=='aim'||!Number.isInteger(index)||index<this.shots||index>=this.queue.length)return false;[this.queue[index],this.queue[this.shots]]=[this.queue[this.shots],this.queue[index]];this.syncNext();return true;}
 syncNext(){const next=this.queue[this.shots];if(next){this.material=next.material;this.size=next.size;}}
 mirror(){this.mirrorSign*=-1;for(const t of this.targets)t.x=W-t.x;for(const p of this.pegs)p.x=W-p.x;for(const z of this.air){z.x=W-z.x-z.w;z.fx=-z.fx;}for(const g of this.gates)g.x=W-g.x;for(const r of this.rails)r.side=r.side==='left'?'right':'left';}
 setEndlessMechanisms(){this.pegs=this.wave>=4?[{x:this.wave%2?145:275,y:300,r:20}].filter(p=>!this.targets.some(t=>Math.abs(t.x-p.x)<t.size/2+p.r+3&&Math.abs(t.y-p.y)<t.size/2+p.r+3)):[];this.air=this.wave>=6?[{x:45,y:345,w:330,h:65,fx:this.wave%2?35:-35,fy:0,plume:true}]:[];}
 random(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;}
 addRow(y:number){
  const row=++this.rowsCreated,anchorCol=1+row%3,base=2+(row-1)*2,kinds:Target['kind'][]=['steel','prism','capacitor','diamond','hexagon','bar'];
  for(let col=0;col<5;col++){
   if(this.random()<.2&&col!==anchorCol&&col!==2)continue;const anchor=col===anchorCol;
   const kind=anchor?(row%2?'steel':'hexagon'):kinds[Math.floor(this.random()*kinds.length)],hp=anchor?12+(row-1)*4:base+(col+row)%4;
   this.targets.push({id:this.nextId++,x:66+col*72,y,size:52,kind,hp,maxHp:hp,flash:0,power:anchor||col===2?'spring':undefined,anchor,row});
  }
 }
 aim(x:number,y:number){this.angle=Math.max(.16,Math.min(Math.PI-.16,Math.atan2(Math.max(15,y-LAUNCH.y),x-LAUNCH.x)));}
 fire(){if(this.phase!=='aim'||this.paused||this.remainingShots===0)return false;this.syncNext();this.phase='volley';this.shots++;this.anchorsBroken=0;this.returnCharges=2;this.returnRefills=0;this.returnProgress=0;this.returnFlash=0;this.pulseUsed=false;this.pulseCharges=this.pulseMax;this.liftTime=0;this.liftEnergy=0;this.combo=0;this.magnetUsed=false;this.stalled=0;this.supportedTime=0;this.supportGrace=0;this.anchor={...LAUNCH};this.rescueAttempts=0;this.passiveLoops=0;this.passiveAnchor=null;for(const r of this.rails)r.charges=r.maxCharges;this.rescuePulse=null;this.safetyReturn=false;
  const spec=this.spec;this.balls=[{...LAUNCH,vx:Math.cos(this.angle)*spec.speed,vy:Math.sin(this.angle)*spec.speed,r:spec.r}];return true;
 }
 field(x:number,y:number){if(this.phase!=='volley'||this.magnetUsed||this.paused||this.safetyReturn||this.spec.magnetic===0)return false;this.magnet={x:Math.max(45,Math.min(375,x)),y:Math.max(185,Math.min(625,y)),life:3.8+this.fieldLevel*.8};this.magnetUsed=true;return true;}
 burst(x:number,y:number,color:string,n=12){for(let i=0;i<n;i++){const a=Math.PI*2*i/n,s=35+(i%4)*33;this.effects.push({x,y,life:.45,max:.45,color,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ring:false});}this.effects.push({x,y,life:.45,max:.45,color,vx:0,vy:0,ring:true});if(this.effects.length>420)this.effects.splice(0,this.effects.length-420);}
 damage(t:Target){if(t.hp<=0)return;this.passiveLoops=0;this.passiveAnchor=null;t.hp--;t.flash=.12;this.score+=10;this.combo++;this.stats.hits++;
  if(this.phase==='volley'&&this.returnRefills<2){this.returnProgress=Math.min(8,this.returnProgress+1);if(this.returnProgress===8&&this.pulseCharges<this.pulseMax){this.pulseCharges++;this.returnRefills++;this.returnProgress=0;this.stats.recharges++;this.say('连续命中 · 气脉冲 +1');}}this.bestCombo=Math.max(this.bestCombo,this.combo);this.onHit?.(t.kind);
  if(t.hp===0){if(t.anchor)this.anchorsBroken++;this.score+=75;this.burst(t.x,t.y,t.core?'#ed9fff':t.power==='spring'?'#ffcf70':'#80e8e4');
   if(t.power==='valve'){for(const zone of this.air){zone.fx=-zone.fx;zone.fy=-zone.fy;}this.say('风阀已切换 · 气流反向');}
   if(t.power==='switch'&&!this.targets.some(b=>b.power==='switch'&&b.hp>0)){for(const gate of this.gates)gate.open=true;this.say('开关已清除 · 闸门打开');}
  }
 }
 energize(b:Ball,n:Vec,amount=22000*(1+this.elasticLevel*.5)){const mass=this.spec.mass,vn=b.vx*n.x+b.vy*n.y,energy=.5*mass*(b.vx*b.vx+b.vy*b.vy);const added=Math.min(amount,Math.max(0,240000-energy));
  if(added<=0||vn<0)return;const dv=Math.sqrt(vn*vn+2*added/mass)-vn;b.vx+=dv*n.x;b.vy+=dv*n.y;this.stats.energy+=added;this.stats.boosts++;this.burst(b.x,b.y,'#ffc369',6);
 }
 pulse(x?:number,y?:number){if(this.phase!=='volley'||this.paused||this.pulseCharges<=0||this.liftTime>0||this.safetyReturn||this.goalComplete)return false;
  const b=this.balls[0];if(!b)return false;const dx=x===undefined?0:x-b.x,dy=y===undefined?-100:y-b.y,d=Math.hypot(dx,dy);this.pulseDirection=d>1?{x:dx/d,y:dy/d}:{x:0,y:-1};this.pulseCharges--;this.pulseUsed=true;this.liftTime=.32;this.liftEnergy=60000*(1+this.fieldLevel*.5);this.stats.pulses++;this.say('定向气脉冲 · 余量 '+this.pulseCharges);return true;}
 applyLift(b:Ball,dt:number){
  if(this.liftTime<=0||this.safetyReturn)return;
  const mass=this.spec.mass,n=this.pulseDirection,vn=b.vx*n.x+b.vy*n.y,energy=.5*mass*(b.vx*b.vx+b.vy*b.vy),budget=Math.min(this.liftEnergy,Math.max(0,240000-energy));let dv=1200*(1+this.fieldLevel*.35)*dt;
  if(.5*mass*(2*vn*dv+dv*dv)>budget)dv=-vn+Math.sqrt(vn*vn+2*budget/mass);
  const work=Math.max(0,.5*mass*(2*vn*dv+dv*dv));b.vx+=dv*n.x;b.vy+=dv*n.y;this.liftEnergy=Math.max(0,this.liftEnergy-work);
 }
 recall(){if(this.phase==='volley'&&!this.paused){this.balls=[];this.finish();}}
 finish(){this.liftTime=0;this.balls=[];this.magnet=null;this.rescuePulse=null;this.safetyReturn=false;this.targets=this.targets.filter(t=>t.hp>0);this.syncNext();
  if(this.mode==='challenge'){this.phase=this.goalComplete?'won':this.remainingShots===0?'over':'aim';this.endReason=this.phase==='over'?'ammo':'';return;}
  if(this.remainingShots===0){this.phase='over';this.endReason='ammo';return;}
  const advance=this.anchorsBroken>0?24:39;for(const t of this.targets)t.y-=advance;if(this.anchorsBroken>0)this.say('耐久支点已拆除 · 本轮推进减缓');if(this.targets.some(t=>t.y-t.size/2<184)){this.phase='over';this.endReason='overload';return;}
  this.wave++;this.setEndlessMechanisms();if(this.wave%2===0||this.targets.length===0)this.addRow(609);this.phase=this.wave%3===0?'upgrade':'aim';
 }
 upgrade(choice:Upgrade){if(this.phase!=='upgrade')return;if(choice==='elastic'){this.elasticBonus=Math.min(.18,this.elasticBonus+.08);this.elasticLevel++;}if(choice==='magnet'){this.fieldStrength+=.2;this.pulseMax++;}if(choice==='field')this.fieldLevel++;this.phase='aim';}
 wallCharge(b:Ball,side:'left'|'right'){
  if(this.safetyReturn)return;const rail=this.rails.find(r=>r.side===side&&b.y>=r.y&&b.y<=r.y+r.h&&r.charges>0);if(!rail)return;
  const before=this.stats.boosts;this.energize(b,{x:side==='left'?1:-1,y:0});if(this.stats.boosts>before)rail.charges--;
 }
 passiveContact(key:string,b:Ball){const a=this.passiveAnchor;if(a&&a.key===key&&Math.hypot(a.x-b.x,a.y-b.y)<12)this.passiveLoops++;else{this.passiveAnchor={key,x:b.x,y:b.y};this.passiveLoops=1;}}
 rescue(b:Ball,dt:number,supported:boolean){
  if(this.safetyReturn||this.rescuePulse)return;
  if(Math.hypot(b.x-this.anchor.x,b.y-this.anchor.y)>10){this.anchor={x:b.x,y:b.y};this.stalled=0;}else this.stalled+=dt;
  this.supportGrace=supported?.5:Math.max(0,this.supportGrace-dt);
  this.supportedTime=this.supportGrace>0?this.supportedTime+dt:0;
  if(this.stalled<2.4&&this.supportedTime<2.4&&this.passiveLoops<4)return;this.passiveLoops=0;this.passiveAnchor=null;this.stalled=0;this.supportedTime=0;this.supportGrace=0;this.anchor={x:b.x,y:b.y};
  if(this.rescueAttempts<2){this.rescueAttempts++;this.stats.rescues++;this.rescuePulse={life:.25,direction:(this.rescueAttempts%2?1:-1)*this.mirrorSign};this.say('检测到停滞 · 脱困气脉冲');}
  else{this.safetyReturn=true;this.magnet=null;this.stats.returns++;this.say('救援通道开启 · 积木退让，弹珠自然落底');}
 }
 update(dt:number){if(this.paused)return;this.returnFlash=Math.max(0,this.returnFlash-dt);
  for(const t of this.targets)t.flash=Math.max(0,t.flash-dt);for(const p of this.effects){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}this.effects=this.effects.filter(p=>p.life>0);
  if(this.phase!=='volley')return;this.stats.flight+=dt;const spec=this.spec,restitution=this.restitution;
  if(this.magnet){this.magnet.life-=dt;if(this.magnet.life<=0)this.magnet=null;}
  if(this.rescuePulse){this.rescuePulse.life-=dt;if(this.rescuePulse.life<=0)this.rescuePulse=null;}
  for(const b of this.balls){
   let supported=false;
   const steps=Math.max(1,Math.ceil((Math.hypot(b.vx,b.vy)+2000*dt)*dt/(b.r*.45))),h=dt/steps;
   for(let sub=0;sub<steps;sub++){
    let ax=0,ay=GRAVITY;
    if(!this.safetyReturn){for(const z of this.air){const strength=airStrength(z,b);ax+=z.fx*spec.windResponse*strength;ay+=z.fy*spec.windResponse*strength;}
     if(this.magnet){const dx=this.magnet.x-b.x,dy=this.magnet.y-b.y,d2=dx*dx+dy*dy;const strength=3200000*this.fieldStrength*spec.magnetic/Math.pow(d2+80*80,1.5);ax+=dx*strength;ay+=dy*strength;}
     if(this.rescuePulse){ax+=this.rescuePulse.direction*450;ay-=800;}
    }
    this.applyLift(b,Math.min(h,Math.max(0,this.liftTime-sub*h)));advanceFree(b,h,ax,ay);
    if(b.x<18+b.r){b.x=18+b.r;if(reflect(b,{x:1,y:0},restitution))this.wallCharge(b,'left');}if(b.x>402-b.r){b.x=402-b.r;if(reflect(b,{x:-1,y:0},restitution))this.wallCharge(b,'right');}if(b.y<112+b.r){b.y=112+b.r;reflect(b,{x:0,y:1},restitution);}
    if(!this.safetyReturn){
     for(const [i,p] of this.pegs.entries()){const vx=b.vx,vy=b.vy;if(collide(b,{...p,id:-1,kind:'capacitor',size:p.r*2,hp:1,maxHp:1,flash:0},restitution)){this.passiveContact('peg'+i,b);if(Math.hypot(b.vx-vx,b.vy-vy)/(1+restitution)<55)supported=true;}}
     for(const [i,gate] of this.gates.entries())if(!gate.open){const vx=b.vx,vy=b.vy;if(collide(b,{...gate,id:-2,kind:'bar',hp:1,maxHp:1,flash:0},restitution)){this.passiveContact('gate'+i,b);if(Math.hypot(b.vx-vx,b.vy-vy)/(1+restitution)<55)supported=true;}}
     for(const t of this.targets){if(t.hp<=0)continue;const vx=b.vx,vy=b.vy;if(collide(b,t,restitution)){
      const dx=b.vx-vx,dy=b.vy-vy,impulse=Math.hypot(dx,dy);if(impulse/(1+restitution)<55)supported=true;if(impulse/(1+restitution)>55){this.damage(t);if(t.power==='spring')this.energize(b,{x:dx/impulse,y:dy/impulse});}
     }}
    }
   }
   this.rescue(b,dt,supported);
  }
  this.liftTime=Math.max(0,this.liftTime-dt);
  // Collection requires the entire ball to enter the bottom slot; never a lifetime cutoff.
  this.balls=this.balls.filter(b=>b.y-b.r<692);this.targets=this.targets.filter(t=>t.hp>0);if(this.balls.length===0)this.finish();
 }
}
