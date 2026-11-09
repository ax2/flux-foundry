import {Feedback} from './feedback';
import {guidedRebound,forecastRebound,GUIDE_TILT_STEP} from './paddle-assist';
import {advanceFree,collide,reflect,type Body,type Target,type Vec} from './physics';
import {catchPaddle,sweptPickup,type Paddle,type Treasure,type TreasureKind} from './arcade';
import {airStrength} from './air';
import {ballProperties,LEVELS,MATERIALS,SIZES,type Material,type BallSize,type Peg,type AirZone,type Gate,type Rail,type Choice} from './content';
export const W=420,H=720,LAUNCH={x:210,y:132},STEP=1/120,GRAVITY=240,BALL_RADIUS=12;
export type Phase='aim'|'volley'|'over'|'won';
export type Ball=Body;
export type Effect={x:number;y:number;life:number;max:number;color:string;vx:number;vy:number;ring:boolean};
const ASSIST_DELAY=8,ASSIST_MISSES=4;
const STOCK:Choice[]=[{material:'steel',size:'standard'},{material:'ceramic',size:'small'},{material:'brass',size:'standard'},{material:'rubber',size:'large'},{material:'steel',size:'large'},{material:'ceramic',size:'standard'}];
export class Game{
 feedback=new Feedback();time=0;paddleEnabled=true;paddle:Paddle={x:210,target:210,width:96,vx:0,flash:0,tilt:0,boost:18000};treasures:Treasure[]=[];spawnCount=0;nextTreasure=2.5;treasureClock=0;bonusLives=0;wideTime=0;bigTime=0;ballScale=1;motionEnabled=true;windMultiplier=2.4;
 paddleOrbits:{x:number;vx:number;vy:number}[]=[];orbitRepeats=0;lastOrbitAdjustmentCatch=0;lastGuideTime=-1;
 progress={sinceHit:0,maxNoHit:0,catchesWithoutHit:0,maxCatchesWithoutHit:0};
 phase:Phase='aim';wave=1;score=0;bestCombo=0;combo=0;readonly count=1;readonly power=1;
 material:Material='steel';size:BallSize='standard';
 mode:'endless'|'challenge'='endless';levelIndex=0;shots=0;queue:Choice[]=[];dailyKey:string|null=null;mirrorSign=1;
 pegs:Peg[]=[];air:AirZone[]=[];gates:Gate[]=[];rails:Rail[]=[];balls:Ball[]=[];targets:Target[]=[];effects:Effect[]=[];
 angle=Math.PI/2;paused=false;nextId=0;seed:number;
 stalled=0;supportedTime=0;supportGrace=0;anchor:Vec={...LAUNCH};rescueAttempts=0;safetyReturn=false;
 passiveLoops=0;passiveAnchor:{key:string;x:number;y:number}|null=null;
 rowsCreated=0;anchorsBroken=0;
 eventSerial=0;lastEvent='';endReason='';stats={hits:0,flight:0,boosts:0,energy:0,rescues:0,returns:0,rebounds:0,recharges:0,pulses:0,pickups:0,paddleHits:0,orbitBreaks:0,gateVents:0,pegRetractions:0};
 constructor(seed=Date.now(),levelIndex?:number){
  this.seed=seed>>>0;
  if(levelIndex!==undefined){this.mode='challenge';this.levelIndex=Math.max(0,Math.min(LEVELS.length-1,Math.floor(levelIndex)));const l=this.level;
   this.targets=l.tiles.map(t=>({...t,id:this.nextId++,maxHp:t.hp,flash:0}));this.pegs=l.pegs.map(p=>({...p}));this.air=l.air.map(a=>({...a}));this.gates=l.gates.map(g=>({...g}));this.rails=(l.rails||[]).map(r=>({...r}));
  }else{this.addRow(453);this.addRow(550);this.rails=[{side:'left',y:440,h:100,charges:3,maxCharges:3},{side:'right',y:500,h:110,charges:3,maxCharges:3}];}
  this.initMotion();
  this.queue=Array.from({length:this.mode==='challenge'?this.level.shots:12},(_,i)=>({...STOCK[i%STOCK.length]}));
 }
 get spec(){const p=ballProperties(this.material,this.size),s=this.ballScale;return {...p,r:p.r*s,mass:p.mass*s*s*s,windResponse:p.windResponse/s};}
 get energyCapacity(){
  if(this.ballScale===1||!this.sparseEndgame||this.progress.sinceHit<4||this.progress.catchesWithoutHit<2)return 240000;
  const s=this.spec,height=Math.min(...this.targets.map(t=>Math.max(0,675-s.r-(t.y+(t.kind==='bar'?t.size/8:t.size/2)+s.r))));
  // Growth adds volume/mass; the ordinary capacity can make even a perfectly
  // vertical rebound fall short. Keep per-contact work bounded and only restore
  // the base ball's capacity per unit mass after the existing failed rallies.
  return s.mass*(GRAVITY*height+55*55/2)>240000?240000*this.ballScale**3:240000;
 }
 get sparseEndgame(){return this.targets.length>0&&this.targets.length<=2;}
 get lowEndgame(){return this.sparseEndgame&&this.targets.every(t=>t.y>=540);}
 get restitution(){return this.spec.restitution;}
 get level(){return LEVELS[this.levelIndex];}
 get remainingShots(){return Math.max(0,this.queue.length-this.shots);}
 get goalComplete(){return this.mode==='challenge'&&(this.level.goal==='core'?!this.targets.some(t=>t.core&&t.hp>0):!this.targets.some(t=>t.hp>0));}
 get stars(){return this.phase==='won'?(this.shots<=this.level.par?3:this.shots<=this.level.par+2?2:1):0;}
 say(message:string){this.lastEvent=message;this.eventSerial++;}
 selectBall(material:Material,size:BallSize){if(this.phase!=='aim'||this.remainingShots===0||!Object.hasOwn(MATERIALS,material)||!Object.hasOwn(SIZES,size))return false;this.material=material;this.size=size;this.queue[this.shots]={material,size};return true;}
 selectReserve(index:number){if(this.phase!=='aim'||!Number.isInteger(index)||index<this.shots||index>=this.queue.length)return false;[this.queue[index],this.queue[this.shots]]=[this.queue[this.shots],this.queue[index]];this.syncNext();return true;}
 syncNext(){const next=this.queue[this.shots];if(next){this.material=next.material;this.size=next.size;}}
 mirror(){this.mirrorSign*=-1;for(const t of this.targets){t.x=W-t.x;if(t.motion){t.motion.baseX=W-t.motion.baseX;t.motion.amplitude*=-1;}}for(const p of this.pegs)p.x=W-p.x;for(const z of this.air){z.x=W-z.x-z.w;z.fx=-z.fx;}for(const g of this.gates)g.x=W-g.x;for(const r of this.rails)r.side=r.side==='left'?'right':'left';}
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
 resetGatePressure(){for(const gate of this.gates){gate.pressure=0;gate.lastContact=-1;gate.venting=undefined;}for(const peg of this.pegs){peg.pressure=0;peg.lastContact=-1;peg.retractedFrom=undefined;}}
 fire(){if(this.phase!=='aim'||this.paused||this.remainingShots===0)return false;this.syncNext();this.phase='volley';this.resetGatePressure();this.progress.sinceHit=0;this.progress.catchesWithoutHit=0;this.lastOrbitAdjustmentCatch=0;this.shots++;this.ballScale=1;this.bigTime=0;this.wideTime=0;this.paddle.width=96;this.paddle.tilt=0;this.paddle.boost=18000;this.paddleOrbits=[];this.orbitRepeats=0;this.treasures=[];this.spawnCount=0;this.treasureClock=0;this.nextTreasure=2.5;this.anchorsBroken=0;this.combo=0;this.stalled=0;this.supportedTime=0;this.supportGrace=0;this.anchor={...LAUNCH};this.rescueAttempts=0;this.passiveLoops=0;this.passiveAnchor=null;for(const r of this.rails)r.charges=r.maxCharges;this.safetyReturn=false;
  const spec=this.spec;this.balls=[{...LAUNCH,vx:Math.cos(this.angle)*spec.speed,vy:Math.sin(this.angle)*spec.speed,r:spec.r}];this.feedback.emit('launch',LAUNCH.x,LAUNCH.y,this.material,spec.r/12);return true;
 }
 burst(x:number,y:number,color:string,n=12){for(let i=0;i<n;i++){const a=Math.PI*2*i/n,s=35+(i%4)*33;this.effects.push({x,y,life:.45,max:.45,color,vx:Math.cos(a)*s,vy:Math.sin(a)*s,ring:false});}this.effects.push({x,y,life:.45,max:.45,color,vx:0,vy:0,ring:true});if(this.effects.length>420)this.effects.splice(0,this.effects.length-420);}
 damage(t:Target){if(t.hp<=0)return;for(const gate of this.gates)gate.pressure=0;for(const peg of this.pegs)peg.pressure=0;this.progress.sinceHit=0;this.progress.catchesWithoutHit=0;this.lastOrbitAdjustmentCatch=0;this.paddleOrbits=[];this.orbitRepeats=0;this.paddle.tilt=0;this.paddle.boost=18000;this.passiveLoops=0;this.passiveAnchor=null;t.hp--;t.flash=.12;this.score+=10;this.combo++;this.stats.hits++;
  this.bestCombo=Math.max(this.bestCombo,this.combo);this.feedback.emit(t.hp===0?'break':'hit',t.x,t.y,t.kind);
  if(t.hp===0){if(t.anchor)this.anchorsBroken++;this.score+=75;this.burst(t.x,t.y,t.core?'#ed9fff':t.power==='spring'?'#ffcf70':'#80e8e4');
   if(t.power==='valve'){for(const zone of this.air){zone.fx=-zone.fx;zone.fy=-zone.fy;}this.say('风阀已切换 · 气流反向');}
   if(t.power==='switch'&&!this.targets.some(b=>b.power==='switch'&&b.hp>0)){for(const gate of this.gates)gate.open=true;this.say('开关已清除 · 闸门打开');}
  }
 }
 energize(b:Ball,n:Vec,amount=22000){const mass=this.spec.mass,vn=b.vx*n.x+b.vy*n.y,energy=.5*mass*(b.vx*b.vx+b.vy*b.vy);const added=Math.min(amount,Math.max(0,this.energyCapacity-energy));
  if(added<=0||vn<0)return;const dv=Math.sqrt(vn*vn+2*added/mass)-vn;b.vx+=dv*n.x;b.vy+=dv*n.y;this.stats.energy+=added;this.stats.boosts++;this.burst(b.x,b.y,'#ffc369',6);
 }
 finish(){this.resetGatePressure();this.paddle.boost=18000;this.paddle.tilt=0;this.wideTime=0;this.bigTime=0;this.ballScale=1;this.paddle.width=96;this.treasures=[];this.balls=[];this.safetyReturn=false;this.targets=this.targets.filter(t=>t.hp>0);this.syncNext();
  if(this.mode==='challenge'){this.phase=this.goalComplete?'won':this.remainingShots===0?'over':'aim';this.endReason=this.phase==='over'?'ammo':'';this.endFeedback();return;}
  if(this.remainingShots===0){this.phase='over';this.endReason='ammo';this.endFeedback();return;}
  const advance=this.anchorsBroken>0?24:39;for(const t of this.targets)t.y-=advance;if(this.anchorsBroken>0)this.say('耐久支点已拆除 · 本轮推进减缓');if(this.targets.some(t=>t.y-t.size/2<184)){this.phase='over';this.endReason='overload';this.endFeedback();return;}
  this.wave++;this.setEndlessMechanisms();if(this.wave%2===0||this.targets.length===0)this.addRow(609);this.initMotion();this.phase='aim';
 }
 endFeedback(){if(this.phase==='won'||this.phase==='over')this.feedback.emit(this.phase==='won'?'win':'lose',210,215);}
 wallCharge(b:Ball,side:'left'|'right'){
  if(this.safetyReturn)return;const rail=this.rails.find(r=>r.side===side&&b.y>=r.y&&b.y<=r.y+r.h&&r.charges>0);if(!rail)return;
  const before=this.stats.boosts;this.energize(b,{x:side==='left'?1:-1,y:0});if(this.stats.boosts>before){rail.charges--;this.feedback.emit('boost',b.x,b.y,'rail');}
 }
 gateContact(gate:Gate,b:Ball){
  if(gate.open||gate.venting)return;
  // Count distinct physical rebounds anywhere on this gate, rather than a 12px anchor.
  if(this.time-(gate.lastContact??-1)<.25)return;
  gate.lastContact=this.time;gate.pressure=(gate.pressure||0)+1;
  if(gate.pressure<3||this.progress.sinceHit<8)return;
  gate.venting=b.y<gate.y?'above':'below';this.stats.gateVents++;
  this.passiveLoops=0;this.passiveAnchor=null;this.say('闸门卸压 · 临时通行');
 }
 closePassedVents(b:Ball){
  for(const gate of this.gates)if(gate.venting&&((gate.venting==='above'&&b.y-b.r>gate.y+gate.size/8+3)||(gate.venting==='below'&&b.y+b.r<gate.y-gate.size/8-3))){gate.venting=undefined;gate.pressure=0;}
  for(const peg of this.pegs)if(peg.retractedFrom&&((peg.retractedFrom==='above'&&b.y-b.r>peg.y+peg.r+3)||(peg.retractedFrom==='below'&&b.y+b.r<peg.y-peg.r-3))){peg.retractedFrom=undefined;peg.pressure=0;}
 }
 pegContact(peg:Peg,b:Ball){
  if(peg.retractedFrom||this.time-(peg.lastContact??-1)<.25)return;
  peg.lastContact=this.time;peg.pressure=(peg.pressure||0)+1;
  // Real contacts across the entire cylinder count, including alternating peg orbits.
  // Retraction changes the next collision, never the current ball's state.
  if(peg.pressure<3||this.progress.sinceHit<8)return;
  peg.retractedFrom=b.y<peg.y?'above':'below';this.stats.pegRetractions++;
  this.passiveLoops=0;this.passiveAnchor=null;this.say('反弹柱回缩 · 原球继续');
 }
 passiveContact(key:string,b:Ball){const a=this.passiveAnchor;if(a&&a.key===key&&Math.hypot(a.x-b.x,a.y-b.y)<12)this.passiveLoops++;else{this.passiveAnchor={key,x:b.x,y:b.y};this.passiveLoops=1;}}
 initMotion(){
  for(const t of this.targets){if(t.motion||t.id%3!==0||t.power==='switch'||t.core||t.y<390)continue;
   const amp=14;if(t.x-amp-t.size/2<32||t.x+amp+t.size/2>388)continue;
   const clear=this.targets.every(o=>o===t||Math.abs(o.y-t.y)>(o.size+t.size)/2+4||Math.abs(o.x-t.x)>(o.size+t.size)/2+amp+4)&&this.pegs.every(p=>Math.abs(p.y-t.y)>p.r+t.size/2+4||Math.abs(p.x-t.x)>p.r+t.size/2+amp+4);
   if(clear)t.motion={baseX:t.x,amplitude:amp,speed:.7+(t.id%2)*.2};
  }
 }
 trackPaddleOrbit(incoming:Ball){
  this.progress.catchesWithoutHit++;this.progress.maxCatchesWithoutHit=Math.max(this.progress.maxCatchesWithoutHit,this.progress.catchesWithoutHit);
  const state={x:incoming.x,vx:incoming.vx,vy:incoming.vy};
  const repeated=this.paddleOrbits.some(p=>Math.abs(p.x-state.x)<10&&Math.abs(p.vx-state.vx)<25&&Math.abs(p.vy-state.vy)<35);
  this.orbitRepeats=repeated?this.orbitRepeats+1:0;this.paddleOrbits.push(state);if(this.paddleOrbits.length>8)this.paddleOrbits.shift();
  const missedRallies=this.progress.sinceHit>=(this.sparseEndgame?4:ASSIST_DELAY)&&this.progress.catchesWithoutHit-this.lastOrbitAdjustmentCatch>=(this.sparseEndgame?2:ASSIST_MISSES);
  if(this.orbitRepeats<3&&!missedRallies)return;this.lastOrbitAdjustmentCatch=this.progress.catchesWithoutHit;
  // Repeated contact states without any durability loss: change the visible metal face,
  // rather than kicking the ball or imposing a lifetime/catch budget. The next catch uses its normal.
  const target=this.targets.filter(t=>t.hp>0).sort((a,b)=>Number(!!b.core)-Number(!!a.core)||Math.abs(a.x-this.paddle.x)-Math.abs(b.x-this.paddle.x))[0];
  const direction=target&&Math.abs(target.x-this.paddle.x)>12?Math.sign(target.x-this.paddle.x):(this.stats.orbitBreaks%2?-1:1);
  this.paddle.tilt=this.paddle.tilt?-this.paddle.tilt:direction*.18;this.paddleOrbits=[];this.orbitRepeats=0;this.stats.orbitBreaks++;if(missedRallies)this.paddle.boost=[28000,40000,22000][this.stats.orbitBreaks%3];this.say(missedRallies?'挡板蓄能 · 打破重复球路':'挡板微倾 · 打破重复球路');
 }
 movePaddle(x:number){if(this.paused||!Number.isFinite(x))return;const h=this.paddle.width/2;this.paddle.target=Math.max(22+h,Math.min(398-h,x));}
 spawnTreasure(kind?:TreasureKind,x?:number,y?:number){
  const kinds:TreasureKind[]=this.bonusLives<3&&this.remainingShots<12?['life','wide','slow']:['wide','slow'];kind=kind||kinds[Math.floor(this.random()*kinds.length)];
  for(let i=0;i<45;i++){const px=x??65+this.random()*290,py=y??270+this.random()*285;
   if(x!==undefined||this.targets.every(t=>Math.abs(t.x-px)>t.size/2+20||Math.abs(t.y-py)>t.size/2+20)){this.treasures.push({id:this.nextId++,x:px,y:py,r:14,kind,life:12});return true;}
  }return false;
 }
 collectTreasure(t:Treasure){if(t.life<=0)return;t.life=0;this.stats.pickups++;this.feedback.emit('pickup',t.x,t.y,t.kind);
  if(t.kind==='life'){if(this.remainingShots<12&&this.bonusLives<3){this.queue.push({material:this.material,size:this.size});this.bonusLives++;this.say('生命 +1');}else{this.score+=100;this.say('补给已满 · +100');}}
  if(t.kind==='wide'){this.wideTime=14;this.paddle.width=144;this.movePaddle(this.paddle.target);this.say('挡板加长 · 14秒');}
  if(t.kind==='slow'){this.bigTime=12;if(this.ballScale===1){this.ballScale=1.35;for(const b of this.balls){b.r*=1.35;b.vx*=.7;b.vy*=.7;}}this.say('大慢球 · 12秒');}
  this.burst(t.x,t.y,t.kind==='life'?'#9ff0b4':t.kind==='wide'?'#ffdc9d':'#b9caff',8);
 }
 rescue(b:Ball,dt:number,supported:boolean){
  if(this.safetyReturn)return;if(Math.hypot(b.x-this.anchor.x,b.y-this.anchor.y)>10){this.anchor={x:b.x,y:b.y};this.stalled=0;}else this.stalled+=dt;
  this.supportGrace=supported?.5:Math.max(0,this.supportGrace-dt);this.supportedTime=this.supportGrace>0?this.supportedTime+dt:0;
  if(this.stalled<2.4&&this.supportedTime<2.4&&this.passiveLoops<4)return;
  this.safetyReturn=true;this.stats.rescues++;this.stats.returns++;this.say('积木让位 · 自然回收');
 }
 update(dt:number){if(this.paused)return;this.feedback.update(dt);
  for(const t of this.targets)t.flash=Math.max(0,t.flash-dt);for(const p of this.effects){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;}this.effects=this.effects.filter(p=>p.life>0);
  if(this.phase!=='volley')return;this.time+=dt;this.stats.flight+=dt;if(!this.goalComplete){this.progress.sinceHit+=dt;this.progress.maxNoHit=Math.max(this.progress.maxNoHit,this.progress.sinceHit);}
  this.wideTime=Math.max(0,this.wideTime-dt);this.paddle.width=this.wideTime>0?144:96;this.bigTime=Math.max(0,this.bigTime-dt);if(this.bigTime===0&&this.ballScale>1){this.ballScale=1;for(const b of this.balls)b.r=ballProperties(this.material,this.size).r;}
  const oldPaddleX=this.paddle.x,delta=Math.max(-900*dt,Math.min(900*dt,this.paddle.target-this.paddle.x));this.paddle.x+=delta;const half=this.paddle.width/2;this.paddle.x=Math.max(22+half,Math.min(398-half,this.paddle.x));this.paddle.vx=(this.paddle.x-oldPaddleX)/dt;this.paddle.flash=Math.max(0,this.paddle.flash-dt);
  for(const t of this.targets){const m=t.motion;if(m&&this.motionEnabled){t.x=m.baseX+Math.sin(this.time*m.speed)*m.amplitude;t.vx=Math.cos(this.time*m.speed)*m.amplitude*m.speed;}else t.vx=0;}
  for(const t of this.treasures)t.life-=dt;this.treasures=this.treasures.filter(t=>t.life>0);this.treasureClock+=dt;if(this.treasureClock>=this.nextTreasure&&this.spawnCount<3&&!this.goalComplete){this.spawnTreasure();this.spawnCount++;this.nextTreasure+=7;}
  const spec=this.spec,restitution=this.restitution;
  // Prepare the qualifying upcoming catch, rather than waiting one extra full flight.
  const falling=this.balls[0],misses=this.sparseEndgame?2:ASSIST_MISSES;
  const regularGuide=this.progress.sinceHit>=(this.sparseEndgame?4:ASSIST_DELAY)&&this.progress.catchesWithoutHit+1>=misses;
  const edgeGuide=!this.sparseEndgame&&falling&&(falling.x<22+half||falling.x>398-half)&&this.progress.sinceHit>=8&&this.progress.catchesWithoutHit>=2;
  if(falling&&(regularGuide||edgeGuide)&&falling.vy>0&&falling.y>470&&falling.y<675-falling.r+10&&this.time-this.lastGuideTime>=(falling.y>620?.025:.08)){
   this.lastGuideTime=this.time;
   const environment={air:this.air,gates:this.gates,pegs:this.pegs,wind:this.windMultiplier,response:spec.windResponse,energyLimit:this.energyCapacity,allowLowerWork:this.progress.catchesWithoutHit>=misses},paddle={...this.paddle,x:oldPaddleX};
   // Only repair a forecast miss; leave an already useful ordinary contact alone.
   if(regularGuide||!forecastRebound(falling,paddle,this.targets,spec.mass,restitution,this.time-dt,environment,this.paddle.tilt||0,false,this.paddle.boost??18000).hit){
    const plan=guidedRebound(falling,paddle,this.targets,spec.mass,restitution,this.time-dt,environment,this.progress.sinceHit>=20||this.lowEndgame?.48:.32);
    if(plan.hit||(regularGuide&&this.progress.catchesWithoutHit>=misses)){
     this.paddle.boost=plan.boost;this.paddle.tilt=(this.paddle.tilt||0)+Math.max(-GUIDE_TILT_STEP,Math.min(GUIDE_TILT_STEP,plan.tilt-(this.paddle.tilt||0)));
    }
   }
  }
  for(const b of this.balls){
   let supported=false;
   const steps=Math.max(1,Math.ceil((Math.hypot(b.vx,b.vy)+2000*dt)*dt/(b.r*.45))),h=dt/steps;
   for(let sub=0;sub<steps;sub++){
    let ax=0,ay=GRAVITY;
    if(!this.safetyReturn){for(const z of this.air){const strength=airStrength(z,b);ax+=z.fx*spec.windResponse*strength*this.windMultiplier;ay+=z.fy*spec.windResponse*strength*this.windMultiplier;}

    }
    const previous={...b};advanceFree(b,h,ax,ay);this.closePassedVents(b);
    const activePaddle={...this.paddle,x:oldPaddleX+this.paddle.vx*h*(sub+1)};if(this.paddleEnabled&&!this.safetyReturn&&!this.goalComplete&&this.targets.length>0&&catchPaddle(b,previous,activePaddle,h)){this.feedback.emit('catch',b.x,b.y,(this.paddle.boost||0)>18000?'charged':this.material);this.energize(b,{x:0,y:-1},this.paddle.boost??18000);this.paddle.boost=18000;this.stats.paddleHits++;this.paddle.flash=.15;this.trackPaddleOrbit(previous);}
    for(const t of this.treasures)if(t.life>0&&sweptPickup(previous,b,t))this.collectTreasure(t);
    if(b.x<18+b.r){b.x=18+b.r;if(reflect(b,{x:1,y:0},restitution))this.wallCharge(b,'left');}if(b.x>402-b.r){b.x=402-b.r;if(reflect(b,{x:-1,y:0},restitution))this.wallCharge(b,'right');}if(b.y<112+b.r){b.y=112+b.r;reflect(b,{x:0,y:1},restitution);}
    if(!this.safetyReturn){
     for(const [i,p] of this.pegs.entries())if(!p.retractedFrom){const vx=b.vx,vy=b.vy;if(collide(b,{...p,id:-1,kind:'capacitor',size:p.r*2,hp:1,maxHp:1,flash:0},restitution)){this.passiveContact('peg'+i,b);this.pegContact(p,b);if(Math.hypot(b.vx-vx,b.vy-vy)/(1+restitution)<55)supported=true;}}
     for(const [i,gate] of this.gates.entries())if(!gate.open&&!gate.venting){const vx=b.vx,vy=b.vy;if(collide(b,{...gate,id:-2,kind:'bar',hp:1,maxHp:1,flash:0},restitution)){this.passiveContact('gate'+i,b);this.gateContact(gate,b);if(Math.hypot(b.vx-vx,b.vy-vy)/(1+restitution)<55)supported=true;}}
     for(const t of this.targets){if(t.hp<=0)continue;const vx=b.vx,vy=b.vy,tvx=t.vx||0;b.vx-=tvx;const hit=collide(b,t,restitution);b.vx+=tvx;if(hit){
      const dx=b.vx-vx,dy=b.vy-vy,impulse=Math.hypot(dx,dy);if(impulse/(1+restitution)<55)supported=true;if(impulse>0&&impulse/(1+restitution)<=55)this.feedback.emit('weak',b.x-dx/impulse*b.r,b.y-dy/impulse*b.r);if(impulse/(1+restitution)>55){this.damage(t);if(t.power==='spring'){const before=this.stats.boosts;this.energize(b,{x:dx/impulse,y:dy/impulse});if(this.stats.boosts>before)this.feedback.emit('boost',b.x,b.y,'spring');}}
     }}
    }
   }
   this.rescue(b,dt,supported);
  }
  // Collection requires the entire ball to enter the bottom slot; never a lifetime cutoff.
  this.balls=this.balls.filter(b=>b.y-b.r<692);this.targets=this.targets.filter(t=>t.hp>0);if(this.balls.length===0)this.finish();
 }
}
