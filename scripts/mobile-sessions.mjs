import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const only=process.argv.find(a=>a.startsWith('--only='))?.slice(7),targeted=process.argv.includes('--targeted');
const browser=await chromium.launch({channel:'chrome',headless:true}),sessions=[],errors=[];
const choices=[['steel','standard'],['ceramic','small'],['brass','large'],['rubber','large'],['ceramic','large'],['steel','small']];
try{
 for(const config of [{width:390,height:844,level:25},{width:320,height:568,level:18},{width:390,height:844,level:23},{width:390,height:844,upgrade:'elastic'},{width:320,height:568,upgrade:'magnet'},{width:390,height:844,upgrade:'field'}].filter(c=>!only||(only==='challenges'?c.level!==undefined:c.upgrade===only))){
  const context=await browser.newContext({viewport:{width:config.width,height:config.height},hasTouch:true,isMobile:true}),page=await context.newPage(),cdp=await context.newCDPSession(page);page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('http://localhost:5186');await page.waitForFunction(()=>window.fluxSnapshot);
  if(config.level!==undefined){await page.locator('#levels').click();await page.locator(`[data-level="${config.level}"]`).click();await page.locator('#beginChallenge').click();}
  const shots=[],upgrades=[];
  while(await page.evaluate(()=>['aim','upgrade'].includes(window.fluxSnapshot().phase))){
   if(await page.evaluate(()=>window.fluxSnapshot().phase==='upgrade')){const before=await page.evaluate(()=>window.fluxSnapshot());await page.locator(`[data-upgrade="${config.upgrade||'field'}"]`).click();const after=await page.evaluate(()=>window.fluxSnapshot());upgrades.push({wave:before.wave,choice:config.upgrade,before:{elastic:before.elasticLevel,capacity:before.pulseMax,pressure:before.fieldLevel},after:{elastic:after.elasticLevel,capacity:after.pulseMax,pressure:after.fieldLevel}});}
   while(await page.evaluate(()=>window.fluxSnapshot().speed!==1))await page.locator('#speed').click();
   const before=await page.evaluate(()=>window.fluxSnapshot()),[material,size]=choices[before.shots%choices.length];await page.locator('#workshop').click();await page.locator(`[data-material="${material}"]`).click();await page.locator(`[data-size="${size}"]`).click();await page.locator('#equip').click();
   const target=before.bricks.filter(t=>t.power==='switch').sort((a,b)=>a.hp-b.hp)[0]||before.bricks.find(t=>t.core)||before.bricks.slice().sort((a,b)=>a.hp-b.hp)[0];
   const angle=targeted&&target?Math.atan2(target.y-132,target.x-210):[1.57,1.9,1.22,.85,2.3,1.7,1.4,2.05,1.05,2.6,.55,1.57][before.shots%12],box=await page.locator('#game').boundingBox();
   const x=box.x+(210+Math.cos(angle)*190)/420*box.width,y=box.y+(132+Math.sin(angle)*190)/720*box.height;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x-15,y:y-15}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(n=>window.fluxSnapshot().shots===n,before.shots+1);
   await page.locator('#speed').click();await page.locator('#speed').click();let attempts=0,cancels=0;const deadline=Date.now()+240000;
   while(await page.evaluate(()=>window.fluxSnapshot().phase==='volley')){
    assert.ok(Date.now()<deadline,'UI observation ceiling');const s=await page.evaluate(()=>window.fluxSnapshot());
    if(s.activeBall?.vy>0&&s.activeBall.y>470&&s.activeBall.y<630&&s.pulseCharges>0&&await page.locator('#pulse').isEnabled()){
     await page.waitForTimeout(250);if(await page.evaluate(()=>window.fluxSnapshot().phase!=='volley'))continue;
     const r=await page.locator('#game').boundingBox(),x=r.x+r.width*.5,y=r.y+r.height*.48;
     await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});const held=await page.evaluate(()=>window.fluxSnapshot());
     if(!held.steering){await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});cancels++;continue;}
     const target=held.bricks.find(t=>t.core)||{x:210,y:300},b=held.activeBall,dx=target.x-b.x,dy=Math.min(-50,target.y-b.y),d=Math.hypot(dx,dy);
     await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx/d*48,y:y+dy/d*48}]});await page.waitForTimeout(150);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});attempts++;
    }
    if(s.activeBall?.y<350&&s.activeBall.vy<0&&s.speed===1){await page.locator('#speed').click();await page.locator('#speed').click();}
    await page.waitForTimeout(60);
   }
   const after=await page.evaluate(()=>window.fluxSnapshot());assert.equal(after.shots,before.shots+1);assert.equal(after.balls,0);
   shots.push({material,size,seconds:after.stats.flight-before.stats.flight,hits:after.stats.hits-before.stats.hits,pulses:after.stats.pulses-before.stats.pulses,attempts,cancels,assistSlows:after.assistSlows-before.assistSlows,phase:after.phase});console.log(JSON.stringify({config,shot:after.shots,...shots.at(-1)}));
  }
  const final=await page.evaluate(()=>window.fluxSnapshot());await page.screenshot({path:`docs/iterations/Stage-07/session-${config.level??config.upgrade}-${config.width}.png`});sessions.push({config,shots,upgrades,result:final.phase,score:final.score,stats:final.stats,remaining:final.targets});await writeFile(`docs/iterations/Stage-07/mobile-sessions${only?'-'+only:''}${targeted?'-targeted':''}.json`,JSON.stringify({method:'Six complete real-time touch UI games, mixed loadouts and fixed non-solver angles (or visible weak-switch/core targeting when --targeted), 250ms reaction delay then 150ms directional hold. Start each shot at4x; assistance/skills restore1x, reaccelerate above y350 on upward travel. No recall or state mutation. Three expeditions choose a different upgrade family. This is scripted UI play, not human win rate.',sessions,errors},null,2)+'\n');await context.close();
 }
 assert.equal(errors.length,0);
}finally{await browser.close();}
