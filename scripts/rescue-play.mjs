import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const critical=process.argv.includes('--critical');
const baseline=process.argv.includes('--baseline'),rows=[],errors=[];
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://localhost:5186');await page.waitForFunction(()=>window.fluxSnapshot);
 for(const level of (critical?[25]:[0,18,24,25]))for(const [material,size] of [['ceramic','small'],['steel','large']]){
  await page.locator('#levels').click();await page.locator(`[data-level="${level}"]`).click();await page.locator('#beginChallenge').click();
  await page.locator('#workshop').click();await page.locator(`[data-material="${material}"]`).click();await page.locator(`[data-size="${size}"]`).click();await page.locator('#equip').click();
  await page.locator('#game').press('Space');await page.locator('#speed').click();await page.locator('#speed').click();let attempted=false,accepted=false,missed=false,slowdowns=0,goalCompleteAtRequest=false;const start=Date.now(),deadline=start+90000;
  while(await page.evaluate(()=>window.fluxSnapshot().phase==='volley')){
   assert.ok(Date.now()<deadline,'observation ceiling');const s=await page.evaluate(()=>window.fluxSnapshot());slowdowns=Math.max(slowdowns,s.assistSlows||0);
   if(!attempted&&s.activeBall?.vy>0&&s.activeBall.y>480&&s.pulseCharges>0){attempted=true;await page.waitForTimeout(250);const before=await page.evaluate(()=>window.fluxSnapshot());
    goalCompleteAtRequest=before.goalComplete;if(before.phase==='volley'){
     try{await page.locator('#pulse').tap({timeout:300});}catch{}
     const after=await page.evaluate(()=>window.fluxSnapshot());accepted=after.stats.pulses>0;missed=!accepted;
    }else missed=true;
   }
   await page.waitForTimeout(25);
  }
  const result=await page.evaluate(()=>window.fluxSnapshot());assert.equal(result.shots,1);assert.equal(result.balls,0);
  rows.push({level:level+1,material,size,attempted,accepted,missed,goalCompleteAtRequest,slowdowns,hits:result.stats.hits,seconds:result.stats.flight,wallSeconds:(Date.now()-start)/1000,phase:result.phase});console.log(JSON.stringify(rows.at(-1)));
 }
 assert.equal(errors.length,0);await mkdir('docs/iterations/Stage-07',{recursive:true});await writeFile(`docs/iterations/Stage-07/rescue-${baseline?'before':critical?'after-final-critical':'after'}.json`,JSON.stringify({method:'390×844 real-time browser, eight first shots, 4× speed, 250ms delayed rescue tap once descending past y480. Natural collection, no state mutation or recall. UI policy, not human reaction benchmark.',rows,errors},null,2)+'\n');
}finally{await browser.close();}
