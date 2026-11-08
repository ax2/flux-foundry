import {chromium} from '@playwright/test';import {spawn} from 'node:child_process';import {mkdir,writeFile,readFile} from 'node:fs/promises';import assert from 'node:assert/strict';
const port=process.env.FEEDBACK_PORT||'4193',url=`http://127.0.0.1:${port}`,out='test-results/feedback';await mkdir(out,{recursive:true});
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port',port],{stdio:'ignore'});let browser;const checks=[],errors=[];
function check(name,value){assert.ok(value,name);checks.push(name);}
try{
 for(let i=0;i<80;i++){try{if((await fetch(url)).ok)break;}catch{}await new Promise(r=>setTimeout(r,150));}
 browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'chrome':undefined),headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),page=await context.newPage();page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(url);await page.waitForFunction(()=>window.fluxDiagnostics?.().loading.phase==='ready');
 const samples=await page.evaluate(async()=>{
  const {soundPlan,scheduleTone}=await import('/src/audio.ts'),{CUES}=await import('/src/feedback.ts');const rate=48000,c=new OfflineAudioContext(1,rate*7,rate);
  for(let i=0;i<CUES.length;i++)for(const tone of soundPlan({type:CUES[i],variant:CUES[i]==='pickup'?'life':'steel',strength:1}))scheduleTone(c,tone,i*.7+.02);
  const b=await c.startRendering(),data=b.getChannelData(0),metrics=CUES.map((type,i)=>{let peak=0,sum=0;const start=Math.floor(i*.7*rate),end=start+Math.floor(.6*rate);for(let j=start;j<end;j++){peak=Math.max(peak,Math.abs(data[j]));sum+=data[j]*data[j];}return {type,peak,rms:Math.sqrt(sum/(end-start))};});
  return {rate,metrics,pcm:Array.from(data),tail:Array.from(data.slice(-1000))};
 });
 check('all nine exact cue envelopes render non-silent, unclipped PCM',samples.metrics.every(m=>m.peak>.001&&m.peak<.3&&m.rms>.0001));check('preview ends in silence',samples.tail.every(n=>Math.abs(n)<1e-7));
 const wav=Buffer.alloc(44+samples.pcm.length*2);wav.write('RIFF');wav.writeUInt32LE(wav.length-8,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(samples.rate,24);wav.writeUInt32LE(samples.rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(wav.length-44,40);samples.pcm.forEach((v,i)=>wav.writeInt16LE(Math.round(Math.max(-1,Math.min(1,v))*32767),44+i*2));await writeFile(`${out}/cue-preview.wav`,wav);
 // Isolated audio/lifecycle exercise, distinct from the legal challenge below.
 await page.evaluate(async()=>{const {Sound}=await import('/src/audio.ts');window.testSound=new Sound();const b=document.createElement('button');b.id='audioGesture';b.textContent='Audio gesture test';b.style.cssText='position:fixed;inset:0 auto auto 0;z-index:9999';b.onclick=()=>{window.testSound.enabled=true;window.testSound.unlock();};document.body.append(b);});
 await page.locator('#audioGesture').click();await page.waitForFunction(()=>window.testSound.snapshot().state==='running');
 const live=await page.evaluate(()=>{const event=type=>({type,x:0,y:0,variant:'steel',strength:1});window.testSound.play(Array.from({length:30},()=>event('hit')));window.testSound.play([event('pickup')]);window.testSound.play([event('break'),event('catch'),event('boost')]);return window.testSound.snapshot();});
 check('trusted gesture unlocks real context and hit spam does not suppress pickup',live.played.hit===1&&live.played.pickup===1&&live.failures===0);check('mixed feedback caps live oscillators at12',live.voices<=12&&live.peakVoices<=12);
 await page.waitForTimeout(750);check('finished voices are released',await page.evaluate(()=>window.testSound.snapshot().voices===0));
 const muted=await page.evaluate(()=>{window.testSound.play([{type:'win',variant:'',strength:1,x:0,y:0}]);window.testSound.enabled=false;return window.testSound.snapshot();});check('mute immediately stops future and active terminal notes',!muted.enabled&&muted.voices===0);
 await page.locator('#audioGesture').evaluate(e=>e.remove());
 // Real app flow: no simulation speed, layout/ball injection, recall, or premature finish.
 check('production app starts silent without constructing a context',await page.evaluate(()=>{const a=window.fluxDiagnostics().audio;return !a.enabled&&a.state==='locked';}));
 await page.locator('#settings').click();await page.locator('#sound').click();await page.locator('#resume').click();await page.waitForFunction(()=>window.fluxDiagnostics().audio.state==='running');
 await page.locator('#levels').click();await page.locator('[data-level="5"]').click();await page.locator('#beginChallenge').click();
 const route=JSON.parse(await readFile('tests/fixtures/challenges.json','utf8'))[5];assert.equal(route.moves.length,1);const m=route.moves[0];await page.locator('#workshop').click();await page.locator(`[data-material="${m.material}"]`).click();await page.locator(`[data-size="${m.size}"]`).click();await page.locator('#equip').click();
 const box=await page.locator('#game').boundingBox(),tx=box.x+(210+Math.cos(m.angle)*180)/420*box.width,ty=box.y+(132+Math.sin(m.angle)*180)/720*box.height,cdp=await context.newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:tx-15,y:ty-15}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:tx,y:ty}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(()=>window.fluxDiagnostics().audio.played.launch===1);
 await page.locator('#settings').click();const paused=await page.evaluate(()=>window.fluxSnapshot());await page.waitForTimeout(200);check('menu freezes the ball and clears active sounds',await page.evaluate(b=>JSON.stringify(window.fluxSnapshot().activeBall)===JSON.stringify(b)&&window.fluxDiagnostics().audio.voices===0,paused.activeBall));
 await page.locator('#sound').click();await page.locator('#resume').click();const counts=await page.evaluate(()=>window.fluxDiagnostics().audio.played);await page.waitForTimeout(180);check('muted flight emits no sound',await page.evaluate(n=>JSON.stringify(window.fluxDiagnostics().audio.played)===JSON.stringify(n),counts));
 await page.locator('#settings').click();await page.locator('#sound').click();await page.locator('#resume').click();
 await page.waitForFunction(()=>window.fluxSnapshot().phase==='won',null,{timeout:75000});await page.waitForFunction(()=>window.fluxDiagnostics().audio.played.win===1);
 const result=await page.evaluate(()=>({game:window.fluxSnapshot(),audio:window.fluxDiagnostics().audio}));check('natural challenge completion plays victory after result menu opens',result.game.balls===0&&result.game.stars===3&&result.audio.played.hit+result.audio.played.break>0&&result.audio.failures===0);await page.screenshot({path:`${out}/real-win-390x844.png`});
 await page.reload();await page.waitForFunction(()=>window.fluxDiagnostics?.().loading.phase==='ready');check('sound preference persists but reload respects the gesture lock',await page.evaluate(()=>{const a=window.fluxDiagnostics().audio;return a.enabled&&a.state==='locked';}));
 const b=await page.locator('#game').boundingBox();await page.touchscreen.tap(b.x+b.width*.5,b.y+b.height*.45);await page.waitForFunction(()=>window.fluxDiagnostics().audio.state==='running');check('mobile tap unlocks audio without spending a marble',await page.evaluate(()=>window.fluxSnapshot().shots===0));await page.screenshot({path:`${out}/real-ready-390x844.png`});
 // Explicit renderer fixture: genuine weak collision + pickup helpers, never a level qualification.
 const visual=await page.evaluate(async()=>{
  const {Game,STEP}=await import('/src/game.ts'),{Renderer}=await import('/src/render.ts');const canvas=document.createElement('canvas');canvas.id='cueFixture';canvas.style.cssText='position:fixed;inset:0;width:390px;height:668.571px;z-index:9999';document.body.append(canvas);const renderer=new Renderer(canvas);await renderer.ready;renderer.resize();const g=new Game(1,0);g.targets=[{id:0,x:140,y:470,kind:'capacitor',size:48,hp:3,maxHp:3,flash:0}];g.fire();Object.assign(g.balls[0],{x:140,y:434,vx:0,vy:10});g.update(STEP);
  for(const [i,kind] of ['life','wide','slow'].entries())g.collectTreasure({id:100+i,x:85+i*125,y:350,r:14,kind,life:12});renderer.draw(g,0,true,false);const first=canvas.toDataURL();for(const mark of g.feedback.marks)mark.life=.05;renderer.draw(g,10,true,false);return {static:first===canvas.toDataURL(),weak:g.feedback.counts.weak,hp:g.targets[0].hp,marks:g.feedback.snapshot().marks};
 });
 check('weak collision leaves durability unchanged and reduced-motion marks stay static',visual.weak===1&&visual.hp===3&&visual.static);await page.locator('#cueFixture').screenshot({path:`${out}/explicit-weak-pickup.png`});
 check('no runtime error or framework overlay',errors.length===0&&await page.locator('vite-error-overlay').count()===0);
 await writeFile(`${out}/report.json`,JSON.stringify({method:'Browser plugin not available. Chromium390×844 touch. Offline PCM + isolated audio/renderer fixtures are separate from an actual UI-only natural challenge. No forced collection or speed/state mutation in the challenge.',checks,metrics:samples.metrics,live,muted,result,visual,errors},null,2));console.log(JSON.stringify({passed:checks.length,audio:result.audio,errors}));await context.close();
}finally{await browser?.close();server.kill();}
