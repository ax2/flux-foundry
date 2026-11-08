export const CUES=['launch','hit','break','catch','boost','pickup','weak','win','lose'] as const;
export type Cue=typeof CUES[number];
export type FeedbackEvent={type:Cue;x:number;y:number;variant:string;strength:number};
export type FeedbackMark=FeedbackEvent&{life:number;duration:number};
// A bounded, one-way presentation buffer. It never retains a ball or target reference.
export class Feedback{
 private events:FeedbackEvent[]=[];private clock=0;private lastWeak={time:-1,x:0,y:0};
 counts=Object.fromEntries(CUES.map(k=>[k,0])) as Record<Cue,number>;
 marks:FeedbackMark[]=[];last:FeedbackEvent|null=null;
 emit(type:Cue,x:number,y:number,variant='',strength=1){
  if(type==='weak'){
   if(this.clock-this.lastWeak.time<.14&&Math.hypot(x-this.lastWeak.x,y-this.lastWeak.y)<32)return;
   this.lastWeak={time:this.clock,x,y};
  }
  const event={type,x,y,variant,strength:Math.max(.1,Math.min(1.5,Number.isFinite(strength)?strength:1))};
  this.counts[type]++;this.last=event;this.events.push(event);if(this.events.length>48)this.events.shift();
  const duration=type==='pickup'?.65:type==='weak'?.24:type==='catch'?.18:type==='boost'?.22:0;
  if(duration){this.marks.push({...event,life:duration,duration});if(this.marks.length>16)this.marks.shift();}
 }
 update(dt:number){this.clock+=dt;for(const mark of this.marks)mark.life-=dt;this.marks=this.marks.filter(m=>m.life>0);}
 drain(){const events=this.events;this.events=[];return events;}
 snapshot(){return {counts:{...this.counts},last:this.last?{...this.last}:null,pending:this.events.length,marks:this.marks.map(m=>({...m}))};}
}
