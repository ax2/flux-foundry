import {chromium} from '@playwright/test';import {writeFile,mkdir} from 'node:fs/promises';import assert from 'node:assert/strict';
const [from,to]=process.argv.slice(2);assert.match(from||'',/^\d+\.\d+\.\d+$/);assert.match(to||'',/^\d+\.\d+\.\d+$/);assert.notEqual(from,to);
const url=process.env.UPDATE_PROBE_URL||'https://ax2.github.io/flux-foundry/',loopback=new URL(url).hostname==='127.0.0.1';if(process.env.UPDATE_PROBE_URL)assert.ok(loopback);
const output=process.env.UPDATE_PROBE_OUTPUT||`test-results/public-update-${from}-to-${to}/${new Date().toISOString().replace(/[:.]/g,'-')}`;await mkdir(output,{recursive:true});
let proxy;if(!loopback&&process.env.HTTPS_PROXY){const u=new URL(process.env.HTTPS_PROXY);proxy={server:u.origin};if(u.username)proxy.username=decodeURIComponent(u.username);if(u.password)proxy.password=decodeURIComponent(u.password);}
const browser=await chromium.launch({channel:'chrome',headless:true,proxy}),checks=[],errors=[];let stage='initial',page;
try{
 page=await browser.newPage({viewport:{width:390,height:844}});page.on('pageerror',e=>errors.push(String(e)));
 const version=()=>page.locator('.intro small').evaluate(e=>e.firstChild.textContent.trim().split('v').at(-1)),snap=()=>page.evaluate(()=>window.fluxSnapshot());
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForFunction(()=>window.fluxDiagnostics?.().loading.phase==='ready',null,{timeout:150000});assert.equal(await version(),from);
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller,null,{timeout:60000});const oldScript=await page.locator('script[type="module"][src]').getAttribute('src');assert.ok(oldScript);
 await page.locator('#levels').click();await page.locator('[data-level="0"]').click();await page.locator('#beginChallenge').click();await page.locator('#game').press('Space');
 const box=await page.locator('#game').boundingBox(),deadline=Date.now()+180000;
 for(let s=await snap();s.phase==='volley';s=await snap()){
  assert.ok(Date.now()<deadline,'Observation failed; do not finish a live ball');const b=s.activeBall,eta=(-b.vy+Math.sqrt(b.vy*b.vy+480*Math.max(0,675-b.r-b.y)))/240,lo=18+b.r,range=384-2*b.r,raw=b.x+b.vx*eta-lo,fold=((raw%(2*range))+2*range)%(2*range),landing=lo+(fold>range?2*range-fold:fold);
  await page.mouse.move(box.x+Math.max(35,Math.min(385,landing))/420*box.width,box.y+box.height*.9);await page.waitForTimeout(90);
 }
 const won=await snap();assert.equal(won.phase,'won');assert.equal(won.stars,3);assert.equal(won.shots,1);
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('flux-save'))?.rulesets['paddle-natural-1'].records[0]?.stars===3);checks.push('real public old version earns a natural one-ball three-star result');
 await page.locator('#settings').click();stage='waiting-for-public-deployment';await writeFile(`${output}/ready.json`,JSON.stringify({url,from,to,oldScript,earned:{stars:won.stars,shots:won.shots},ready:true}));console.log(JSON.stringify({stage,from,to}));
 // An async waitForFunction predicate is a truthy Promise before its value settles.
 // Await each network observation and compare the actual script, not its Promise.
 let deployedScript;const deploymentDeadline=Date.now()+600000;
 while(Date.now()<deploymentDeadline){
  const candidate=await page.evaluate(async()=>{try{const resp=await fetch(location.pathname+'?update-probe='+Date.now(),{cache:'no-store'});if(resp.ok)return new DOMParser().parseFromString(await resp.text(),'text/html').querySelector('script[type="module"][src]')?.getAttribute('src');}catch{}});
  if(candidate&&candidate!==oldScript){deployedScript=candidate;break;}await page.waitForTimeout(loopback?250:8000);
 }
 assert.ok(deployedScript,'No different deployed script was observed');console.log(JSON.stringify({stage:'different-script-observed',oldScript,deployedScript}));
 stage='native-update-check';const check=page.locator('#checkUpdate');if(await check.isVisible()&&await check.isEnabled())await check.click();await page.locator('#applyUpdate').waitFor({state:'visible',timeout:180000});
 assert.equal(await version(),from);assert.equal((await snap()).phase,'won');assert.ok(await page.locator('#applyUpdate').isEnabled());checks.push('public new worker waits for explicit user choice with old result intact');await page.screenshot({path:`${output}/pending.png`});
 stage='applying';await page.locator('#applyUpdate').click();await page.waitForFunction(v=>document.querySelector('.intro small')?.firstChild.textContent.trim().endsWith('v'+v),to,{timeout:45000});await page.waitForFunction(()=>window.fluxDiagnostics?.().loading.phase==='ready',null,{timeout:150000});assert.equal(await version(),to);
 assert.equal((await snap()).records[0].stars,3);assert.equal((await snap()).records[0].shots,1);assert.equal((await page.evaluate(()=>window.fluxDiagnostics().loading)).total,3399692);assert.equal(errors.length,0);checks.push('actual public new version loads full original PNG and keeps the earned result');
 await page.locator('#settings').click();await page.screenshot({path:`${output}/updated.png`});await writeFile(`${output}/report.json`,JSON.stringify({method:loopback?'Actual old release build and current production build at an isolated loopback origin; real legal UI win, native SW and explicit settings update.':'Actual GitHub Pages old page retained across public deploy in a fresh browser context; real legal UI win, native SW and explicit settings update.',injection:'No injected storage, network faults or game state.',url,from,to,oldScript,deployedScript,checks,errors},null,2));console.log(JSON.stringify({passed:checks.length,from,to,loopback}));
}catch(error){const observed=await page?.evaluate(()=>({updates:window.fluxDiagnostics?.().updates,card:document.querySelector('#updateCard')?.textContent,phase:window.fluxSnapshot?.().phase})).catch(()=>null);await writeFile(`${output}/failure.json`,JSON.stringify({stage,checks,errors,error:String(error),observed},null,2));throw error;}finally{await browser.close();}
