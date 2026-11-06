import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1'],{stdio:'ignore'});
let browser;const checks=[];
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4186')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'chrome'}:{})});
 await mkdir('test-results',{recursive:true});
 for(const [width,height] of [[1440,1000],[390,844],[320,568]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:width<500,isMobile:width<500});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('requestfailed',r=>console.error('REQUEST_FAILED',r.url(),r.failure()));page.on('console',m=>{if(m.type()==='error')console.error('BROWSER_ERROR',m.text());});
  await page.goto('http://127.0.0.1:4186');await page.waitForFunction(()=>window.fluxSnapshot&&document.querySelector('#game').width>0);await page.locator('#game').press('ArrowLeft');
  check(`${width}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`${width}: controls fit viewport`,await page.locator('.console').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1));
  await page.screenshot({path:`test-results/${width}x${height}.png`});
  if(width<500){const box=await page.locator('#game').boundingBox();const cdp=await context.newCDPSession(page);const x=box.x+box.width*.5,y=box.y+box.height*.4;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y+60}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.locator('#game').press('Space');}
  await page.waitForFunction(()=>window.fluxSnapshot().phase==='volley');check(`${width}: pointer/keyboard fires`,true);
  await page.locator('#magnet').click();await page.locator('#game').press('m');
  check(`${width}: magnet deploys`,await page.evaluate(()=>window.fluxSnapshot().magnetUsed));
  await page.locator('#pause').click();const before=await page.evaluate(()=>window.fluxSnapshot());await page.waitForTimeout(250);const after=await page.evaluate(()=>window.fluxSnapshot());check(`${width}: pause freezes state`,JSON.stringify(before)===JSON.stringify(after));
  await page.locator('#resume').click();await page.locator('#recall').click();await page.locator('#game').press('Space');await page.locator('#game').press('r');
  await page.getByRole('button',{name:'钨芯冲击 每次碰撞伤害 +1'}).click();check(`${width}: upgrade persists`,await page.evaluate(()=>window.fluxSnapshot().power===2));
  for(let i=0;i<12;i++){const phase=await page.evaluate(()=>window.fluxSnapshot().phase);if(phase==='over')break;if(phase==='upgrade')await page.getByRole('button',{name:'蜂群弹阵 额外增加 6 颗钢珠'}).click();await page.locator('#game').press('Space');await page.locator('#game').press('r');}
  await page.locator('#restart').click();check(`${width}: restart resets`,await page.evaluate(()=>window.fluxSnapshot().wave===1&&window.fluxSnapshot().score===0));
  await page.locator('#help').click();await page.getByRole('button',{name:'开始弹射'}).click();check(`${width}: help resumes`,await page.evaluate(()=>!window.fluxSnapshot().paused));
  await page.locator('#sound').click();check(`${width}: sound toggle`,await page.locator('#sound').getAttribute('aria-pressed')==='true');
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await context.setOffline(true);await page.reload();await page.locator('#game').waitFor({state:'visible',timeout:10000});check(`${width}: offline reload`,await page.locator('#game').isVisible());
  check(`${width}: no runtime errors`,errors.length===0);await context.close();
 }
 await writeFile('test-results/browser-report.json',JSON.stringify({checks,passed:checks.length},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await browser?.close();server.kill();}
