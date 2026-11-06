export class Sound{
 ctx:AudioContext|null=null;enabled=false;last=0;
 unlock(){if(!this.enabled)return;this.ctx??=new AudioContext();void this.ctx.resume();}
 hit(kind:string){if(!this.enabled||!this.ctx)return;const c=this.ctx,now=c.currentTime;if(now-this.last<.04)return;this.last=now;const osc=c.createOscillator(),gain=c.createGain();osc.type='sine';osc.frequency.setValueAtTime(kind==='capacitor'?880:390,now);osc.frequency.exponentialRampToValueAtTime(kind==='capacitor'?440:130,now+.09);gain.gain.setValueAtTime(.055,now);gain.gain.exponentialRampToValueAtTime(.001,now+.12);osc.connect(gain);gain.connect(c.destination);osc.start(now);osc.stop(now+.13);}
}
