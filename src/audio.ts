import {CUES,type Cue,type FeedbackEvent} from './feedback';
export type Tone={wave:OscillatorType;from:number;to:number;at:number;duration:number;gain:number};
const priority:Record<Cue,number>={win:9,lose:9,pickup:8,break:7,catch:6,boost:5,launch:4,hit:3,weak:1};
const cooldown:Record<Cue,number>={win:1,lose:1,pickup:.08,break:.055,catch:.065,boost:.12,launch:.12,hit:.045,weak:.14};
// Modal, damped tones: no downloaded samples, music loop, or game-state dependency.
export function soundPlan(event:Pick<FeedbackEvent,'type'|'variant'|'strength'>):Tone[]{
 const tone=(from:number,to:number,duration:number,gain:number,at=0,wave:OscillatorType='sine'):Tone=>({wave,from,to,duration,gain,at});
 const material=({steel:1,brass:.8,ceramic:1.35,rubber:.62} as Record<string,number>)[event.variant]||1;
 switch(event.type){
  case 'launch':{const f=material/Math.sqrt(event.strength);return [tone(230*f,100*f,.09,.035),tone(790*f,410*f,.045,.012)];}
  case 'hit':{const f=event.variant==='capacitor'?820:event.variant==='prism'?530:390;return [tone(f,f*.72,.09,.025),tone(f*2.73,f*2.6,.045,.009)];}
  case 'break':return [tone(370,130,.17,.027,0,'triangle'),tone(1080,470,.11,.012,.012),tone(1940,830,.08,.008,.025)];
  case 'catch':return [tone(event.variant==='charged'?250:180,85,.10,.04),tone(470*material,230*material,.055,.012)];
  case 'boost':return [tone(170,690,.15,.027),tone(750,1300,.08,.01,.035)];
  case 'weak':return [tone(105,65,.045,.012,0,'triangle')];
  case 'pickup':{const notes=event.variant==='life'?[392,494,659]:event.variant==='wide'?[262,392,523]:[440,330,262];return notes.map((f,i)=>tone(f,f*.995,.14,.023,i*.055));}
  case 'win':return [523,659,784,1047].map((f,i)=>tone(f,f,.22,.022,i*.07));
  case 'lose':return [tone(185,92,.26,.025),tone(92,61,.30,.014,.08)];
 }
}
// Also used by OfflineAudioContext verification; the exact live envelopes are rendered.
export function scheduleTone(c:BaseAudioContext,tone:Tone,when=c.currentTime){
 const osc=c.createOscillator(),gain=c.createGain(),start=when+tone.at,end=start+tone.duration;
 osc.type=tone.wave;osc.frequency.setValueAtTime(tone.from,start);osc.frequency.exponentialRampToValueAtTime(tone.to,end);
 gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(tone.gain,start+.003);gain.gain.exponentialRampToValueAtTime(.0001,end);
 osc.connect(gain);gain.connect(c.destination);osc.start(start);osc.stop(end+.012);return {osc,gain};
}
type Voice=ReturnType<typeof scheduleTone>;
export class Sound{
 private ctx:AudioContext|null=null;private active=new Set<Voice>();private last=new Map<Cue,number>();private _enabled=false;
 private played=Object.fromEntries(CUES.map(k=>[k,0])) as Record<Cue,number>;private failures=0;private peakVoices=0;
 constructor(private makeContext=()=>new AudioContext()){}
 get enabled(){return this._enabled;}
 set enabled(value:boolean){this._enabled=value;if(!value)this.stop();}
 unlock(){
  if(!this.enabled)return;
  try{if(!this.ctx||this.ctx.state==='closed')this.ctx=this.makeContext();if(this.ctx.state!=='running')void this.ctx.resume().catch(()=>this.failures++);}catch{this.failures++;}
 }
 private remove(voice:Voice){
  if(!this.active.delete(voice))return;
  try{voice.osc.stop();}catch{}voice.osc.disconnect();voice.gain.disconnect();
 }
 stop(){for(const voice of [...this.active])this.remove(voice);this.last.clear();}
 play(events:readonly FeedbackEvent[]){
  const c=this.ctx;if(!this.enabled||!c||c.state!=='running')return;
  const terminal=events.find(e=>e.type==='win'||e.type==='lose');
  const selected=terminal?[terminal]:[...events].sort((a,b)=>priority[b.type]-priority[a.type]);
  let accepted=0;const kinds=new Set<Cue>();
  for(const event of selected){
   if(accepted>=3||kinds.has(event.type)||c.currentTime-(this.last.get(event.type)??-Infinity)<cooldown[event.type])continue;
   kinds.add(event.type);this.last.set(event.type,c.currentTime);
   try{
    const plan=soundPlan(event);
    while(this.active.size+plan.length>12)this.remove(this.active.values().next().value!);
    for(const tone of plan){const voice=scheduleTone(c,tone);this.active.add(voice);voice.osc.onended=()=>this.remove(voice);}
    this.peakVoices=Math.max(this.peakVoices,this.active.size);this.played[event.type]++;accepted++;
   }catch{this.failures++;}
  }
 }
 snapshot(){return {enabled:this.enabled,state:this.ctx?.state||'locked',voices:this.active.size,peakVoices:this.peakVoices,played:{...this.played},failures:this.failures};}
}
