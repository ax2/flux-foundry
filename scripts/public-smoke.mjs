import {chromium} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
let proxy;
if(process.env.HTTPS_PROXY){const u=new URL(process.env.HTTPS_PROXY);proxy={server:u.origin};if(u.username)proxy.username=decodeURIComponent(u.username);if(u.password)proxy.password=decodeURIComponent(u.password);}
const browser=await chromium.launch({channel:'chrome',headless:true,proxy});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('https://ax2.github.io/flux-foundry/?release=0.1.1',{waitUntil:'networkidle',timeout:45000});
 await page.waitForFunction(()=>window.fluxSnapshot&&window.fluxSnapshot().power===1,{},{timeout:15000});
 await page.locator('#game').press('Space');
 await page.waitForFunction(()=>window.fluxSnapshot().balls===1,{},{timeout:5000});
 assert.equal(await page.evaluate(()=>window.fluxSnapshot().count),1);
 await mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/public-v0.1.1-mobile.png'});
 const snapshot=await page.evaluate(()=>window.fluxSnapshot());
 assert.equal(errors.length,0);
 await writeFile('test-results/public-v0.1.1.json',JSON.stringify({url:page.url(),snapshot,errors,checks:['live HTTPS page loads','single ball launches','fixed damage is one','no runtime errors']},null,2));
 console.log(JSON.stringify({url:page.url(),snapshot,errors}));
}finally{await browser.close();}
