import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {version}=JSON.parse(await readFile('package.json','utf8'));
let proxy;
if(process.env.HTTPS_PROXY){const u=new URL(process.env.HTTPS_PROXY);proxy={server:u.origin};if(u.username)proxy.username=decodeURIComponent(u.username);if(u.password)proxy.password=decodeURIComponent(u.password);}
const browser=await chromium.launch({channel:'chrome',headless:true,proxy});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(`https://ax2.github.io/flux-foundry/?release=${version}`,{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>window.fluxSnapshot&&window.fluxSnapshot().power===1,{},{timeout:15000});
 assert.ok((await page.locator('.intro small').textContent()).includes(`v${version}`));
 await page.locator('#workshop').click();assert.equal(await page.locator('[data-material]').count(),4);await page.locator('[data-material="brass"]').click();await page.locator('[data-size="large"]').click();await page.locator('#equip').click();
 await page.locator('#levels').click();assert.equal(await page.locator('[data-level]').count(),12);await page.locator('[data-level="10"]').click();await page.locator('#beginChallenge').click();
 await page.locator('#game').press('Space');
 await page.waitForFunction(()=>window.fluxSnapshot().balls===1,{},{timeout:5000});
 assert.equal(await page.evaluate(()=>window.fluxSnapshot().count),1);
 await mkdir('test-results',{recursive:true});
 await page.screenshot({path:`test-results/public-v${version}-mobile.png`});
 const snapshot=await page.evaluate(()=>window.fluxSnapshot());assert.equal(snapshot.material,'brass');assert.equal(snapshot.radius,16);assert.equal(snapshot.levelIndex,10);assert.equal(snapshot.air,2);
 assert.equal(errors.length,0);
 await writeFile(`test-results/public-v${version}.json`,JSON.stringify({url:page.url(),snapshot,errors,checks:['live version matches release','workshop selection works','12 challenges available','wind challenge runs','live HTTPS page loads','single ball launches','fixed damage is one','no runtime errors']},null,2));
 console.log(JSON.stringify({url:page.url(),snapshot,errors}));
}finally{await browser.close();}
