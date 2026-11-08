export type UpdateStatus='idle'|'checking'|'current'|'ready'|'offline'|'error'|'save-error'|'applying';

// A controller change is shared across tabs. Only the tab that explicitly
// accepted an update may reload; the others keep their live game in memory.
export class AppUpdates{
 status:UpdateStatus='idle';available=false;applying=false;
 private registration?:ServiceWorkerRegistration;
 private starting?:Promise<void>;
 private reloadNeeded=false;
 private controller:ServiceWorker|null;
 private timer=0;
 private lastCheck=-Infinity;
 private pending?:ServiceWorker;
 private activationRequested=false;
 private checkPhase='idle';
 private waiting(){return this.registration?.waiting?.state==='installed'?this.registration.waiting:this.pending?.state==='installed'?this.pending:undefined;}
 snapshot(){return {status:this.status,available:this.available,applying:this.applying,registered:!!this.registration,installing:this.registration?.installing?.state,waiting:this.waiting()?.state,active:this.registration?.active?.state,controlled:!!this.controller,checkPhase:this.checkPhase};}
 constructor(readonly enabled:boolean,private safe:()=>boolean,private prepare:()=>Promise<boolean>,private changed:()=>void){
  this.controller=enabled?navigator.serviceWorker.controller:null;
  if(enabled)navigator.serviceWorker.addEventListener('controllerchange',()=>{
   const next=navigator.serviceWorker.controller;
   if(this.controller&&next!==this.controller){this.reloadNeeded=true;this.available=true;this.status='ready';}
   else if(!this.controller&&next){this.available=!!this.waiting();this.status=this.available?'ready':'current';}
   this.controller=next;
   if(this.applying&&this.activationRequested){
    clearTimeout(this.timer);this.applying=false;
    if(this.safe()){location.reload();return;}
   }
   this.changed();
  });
 }
 private refresh(){
  this.available=this.reloadNeeded||!!(this.controller&&this.waiting());
  if(this.available)this.status='ready';
  else if(this.status==='ready'||this.status==='applying')this.status='current';
  this.changed();
 }
 private watch(worker:ServiceWorker){
  const changed=()=>{
   if(worker.state==='installed'&&this.controller){this.pending=worker;this.refresh();}
   if(worker.state==='redundant'&&!this.available){this.status='error';this.changed();}
  };
  worker.addEventListener('statechange',changed);changed();
 }
 async start(){
  if(!this.enabled||this.registration)return;
  if(this.starting)return this.starting;
  this.starting=(async()=>{
   try{
    this.registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
    this.lastCheck=performance.now();
    this.registration.addEventListener('updatefound',()=>{if(this.registration?.installing){this.status='checking';this.watch(this.registration.installing);this.changed();}});
    if(this.registration.installing)this.watch(this.registration.installing);
    this.refresh();
   }catch{this.status=navigator.onLine?'error':'offline';this.changed();}
  })();
  await this.starting;this.starting=undefined;
 }
 async check(force=true){
  if(!this.enabled||this.applying||this.status==='checking')return;
  if(this.available){this.refresh();return;}
  if(!force&&performance.now()-this.lastCheck<60000)return;
  this.lastCheck=performance.now();
  if(!navigator.onLine){this.status='offline';this.changed();return;}
  this.status='checking';this.checkPhase='register';this.changed();await this.start();
  try{
   if(!this.registration)throw Error('No registration');
   const active=this.registration.active;
   // A first controller can claim this page before its activate event finishes.
   // Let that lifecycle job finish before submitting a second update job.
   if(active?.state==='activating'){
    this.checkPhase='activation';
    await new Promise<void>(resolve=>{const done=()=>{if(active.state!=='activating'){active.removeEventListener('statechange',done);resolve();}};active.addEventListener('statechange',done);done();});
   }
   if(!this.registration.active){this.refresh();return;}
   this.checkPhase='fetch';await this.registration.update();this.checkPhase='settled';this.refresh();
   if(!this.available&&!this.registration.installing&&(this.status as UpdateStatus)!=='error'){this.status='current';this.changed();}
  }catch{this.status=navigator.onLine?'error':'offline';this.changed();}
 }
 async apply(){
  if(!this.enabled||!this.available||this.applying||!this.safe())return false;
  this.applying=true;this.status='applying';this.changed();
  let prepared=false;try{prepared=await this.prepare();}catch{}
  if(!prepared){this.applying=false;this.status='save-error';this.changed();return false;}
  if(!this.safe()){this.applying=false;this.refresh();return false;}
  if(this.reloadNeeded){location.reload();return true;}
  const worker=this.waiting();if(!worker){this.applying=false;this.refresh();return false;}
  this.activationRequested=true;
  this.timer=window.setTimeout(()=>{this.applying=false;this.activationRequested=false;this.status='error';this.changed();},10000);
  try{worker.postMessage({type:'FLUX_ACTIVATE'});return true;}
  catch{clearTimeout(this.timer);this.applying=false;this.activationRequested=false;this.status='error';this.changed();return false;}
 }
}
