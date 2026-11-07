export type TextureProgress={phase:'loading'|'ready'|'fallback';received:number;total:number;percent:number;completed:number;failed:number};
type Texture={image:HTMLImageElement;url:string;bytes:number;received:number;status:'idle'|'loading'|'ready'|'failed'};
export class TextureLoader{
 onChange:((state:TextureProgress)=>void)|null=null;
 private textures:Texture[];private running:Promise<TextureProgress>|null=null;
 constructor(items:{image:HTMLImageElement;url:string;bytes:number}[],private protocol=location.protocol){this.textures=items.map(t=>({...t,received:0,status:'idle'}));}
 get state():TextureProgress{
  const total=this.textures.reduce((n,t)=>n+t.bytes,0),received=this.textures.reduce((n,t)=>n+Math.min(t.received,t.bytes),0),completed=this.textures.filter(t=>t.status==='ready').length,failed=this.textures.filter(t=>t.status==='failed').length;
  const phase=completed===this.textures.length?'ready':this.textures.some(t=>t.status==='idle'||t.status==='loading')?'loading':'fallback';
  return {phase,received,total,percent:phase==='ready'?100:Math.min(99,Math.floor(received/Math.max(1,total)*100)),completed,failed};
 }
 private emit(){this.onChange?.(this.state);}
 load(){
  if(this.running)return this.running;
  const tasks=this.textures.filter(t=>t.status!=='ready').map(t=>this.loadOne(t));
  this.running=Promise.allSettled(tasks).then(()=>{this.running=null;this.emit();return this.state;});return this.running;
 }
 private async loadOne(t:Texture){
  t.status='loading';t.received=0;this.emit();let objectURL:string|undefined;
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),30000);
  try{
   if(this.protocol==='file:'){
    // Local Electron files decode directly; completed-file bytes are reported after decode, never simulated.
    t.image.src=t.url;await t.image.decode();
   }else{
    const response=await fetch(t.url,{signal:controller.signal});if(!response.ok)throw Error(`Texture HTTP ${response.status}`);
    const parts:BlobPart[]=[];
    if(response.body){const reader=response.body.getReader();while(true){const {done,value}=await reader.read();if(done)break;parts.push(value);t.received+=value.byteLength;this.emit();}}
    else{const data=await response.arrayBuffer();parts.push(data);t.received=data.byteLength;this.emit();}
    objectURL=URL.createObjectURL(new Blob(parts,{type:'image/webp'}));t.image.src=objectURL;await t.image.decode();
   }
   t.received=t.bytes;t.status='ready';
  }catch{t.status='failed';}
  finally{clearTimeout(timeout);if(objectURL)URL.revokeObjectURL(objectURL);this.emit();}
 }
}
