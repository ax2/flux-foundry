import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'chrome',headless:true});
const sessions=[],errors=[];
const stage=process.argv.find(a=>a.startsWith('--stage='))?.slice(8)||'Stage-04';
const choices=[['steel','standard'],['ceramic','small'],['brass','large'],['rubber','standard'],['ceramic','large'],['steel','small'],['rubber','large'],['brass','small'],['steel','large'],['rubber','small'],['brass','standard'],['ceramic','standard']];
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5186');await page.waitForFunction(()=>window.fluxSnapshot);
 await mkdir(`docs/iterations/${stage}`,{recursive:true});
 for(const level of (stage==='Stage-06'?[24,25,23]:process.argv.includes('--wind-well')?[18]:[4,18,23])){
  await page.locator('#levels').click();await page.locator(`[data-level="${level}"]`).click();await page.locator('#beginChallenge').click();const shots=[];
  while(await page.evaluate(()=>window.fluxSnapshot().phase==='aim')){
   if(stage==='Stage-06')while(await page.evaluate(()=>window.fluxSnapshot().speed!==1))await page.locator('#speed').click();
   const before=await page.evaluate(()=>window.fluxSnapshot()),[material,size]=choices[(before.shots+(level===18?3:0))%choices.length];
   await page.locator('#workshop').click();await page.locator(`[data-material="${material}"]`).click();await page.locator(`[data-size="${size}"]`).click();await page.locator('#equip').click();
   // Fixed, non-solver angles: repeated UI play, not a replayed optimal route.
   const angle=[Math.PI/2,1.9,1.22,.85,2.3,1.7,1.4,2.05,1.05,2.6,.55,1.57][before.shots%12];
   const box=await page.locator('#game').boundingBox(),x=box.x+(210+Math.cos(angle)*190)/420*box.width,y=box.y+(132+Math.sin(angle)*190)/720*box.height;
   await page.mouse.move(x,y);await page.mouse.down();await page.mouse.up();await page.waitForFunction(n=>window.fluxSnapshot().shots===n,before.shots+1);
   if(stage==='Stage-06'){
    await page.locator('#speed').click();await page.locator('#speed').click();
    const deadline=Date.now()+90000;
    while(await page.evaluate(()=>window.fluxSnapshot().phase==='volley')){
     if(Date.now()>deadline)throw Error('UI observation ceiling');const s=await page.evaluate(()=>window.fluxSnapshot());
     if(s.activeBall?.y>540&&s.activeBall.vy>0&&s.pulseCharges>0&&await page.locator('#pulse').isEnabled()){
      try{await page.locator('#pulse').click({timeout:250});if(await page.evaluate(()=>window.fluxSnapshot().phase==='volley')){await page.locator('#speed').click();await page.locator('#speed').click();}}catch(e){if(await page.evaluate(()=>window.fluxSnapshot().phase==='volley'))throw e;}
     }
     await page.waitForTimeout(100);
    }
   }else await page.waitForFunction(()=>window.fluxSnapshot().phase!=='volley',null,{timeout:65000});
   const after=await page.evaluate(()=>window.fluxSnapshot());assert.equal(after.balls,0);assert.equal(after.shots,before.shots+1);assert.equal(after.remainingShots,before.remainingShots-1);
   shots.push({material,size,angle,hits:after.stats.hits-before.stats.hits,seconds:after.stats.flight-before.stats.flight,pulses:after.stats.pulses-before.stats.pulses,rescues:after.stats.rescues-before.stats.rescues,railChargesRemaining:after.rails.map(r=>r.charges),phase:after.phase,remaining:after.remainingShots});
   console.log(`UI game ${level+1}, shot ${after.shots}: ${material}/${size}, ${shots.at(-1).hits} hits, ${shots.at(-1).seconds.toFixed(2)}s, ${after.phase}`);
  }
  const result=await page.evaluate(()=>window.fluxSnapshot());await page.screenshot({path:`docs/iterations/${stage}/play-session-${level+1}.png`});sessions.push({level:level+1,result:result.phase,shots,score:result.score,remainingBricks:result.targets});
 }
 assert.equal(errors.length,0);
 await writeFile(`docs/iterations/${stage}/play-sessions${process.argv.includes('--wind-well')?'-wind-well':''}.json`,JSON.stringify({method:'Three complete UI games, fixed non-solver angles and mixed loadouts, natural collection, no manual recall, no game-state mutation. Stage-06 uses 4x speed and UI upward pulses when descending below y540. This is automated real-time UI play, not human win-rate evidence.',viewport:'390x844',sessions,errors},null,2)+'\n');
}finally{await browser.close();}
