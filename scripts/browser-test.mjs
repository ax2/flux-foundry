import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1'],{stdio:'ignore'});
const solutions=JSON.parse(await readFile('tests/fixtures/challenges.json','utf8'));
let browser;const checks=[];
const check=(name,ok)=>{assert.ok(ok,name);checks.push(name);};
try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:4186')).ok)break;}catch{}await new Promise(r=>setTimeout(r,200));}
 browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_CHANNEL||(process.platform==='win32'?'chrome':undefined)});
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
  await page.waitForFunction(()=>window.fluxSnapshot().phase==='volley');check(`${width}: exactly one ball`,await page.evaluate(()=>window.fluxSnapshot().balls===1&&window.fluxSnapshot().count===1));check(`${width}: pointer/keyboard fires`,true);
  await page.locator('#magnet').click();await page.locator('#game').press('m');
  check(`${width}: magnet deploys`,await page.evaluate(()=>window.fluxSnapshot().magnetUsed));
  await page.locator('#pause').click();const before=await page.evaluate(()=>window.fluxSnapshot());await page.waitForTimeout(250);const after=await page.evaluate(()=>window.fluxSnapshot());check(`${width}: pause freezes state`,JSON.stringify(before)===JSON.stringify(after));
  await page.locator('#resume').click();await page.locator('#recall').click();await page.locator('#game').press('Space');await page.locator('#game').press('r');
  await page.getByRole('button',{name:'电磁增幅 磁场吸引力 +20%'}).click();check(`${width}: upgrade persists`,await page.evaluate(()=>window.fluxSnapshot().fieldStrength===1.2&&window.fluxSnapshot().power===1));
  for(let i=0;i<12;i++){const phase=await page.evaluate(()=>window.fluxSnapshot().phase);if(phase==='over')break;if(phase==='upgrade')await page.getByRole('button',{name:'精密回弹 减少碰撞损耗，保留更多动能'}).click();await page.locator('#game').press('Space');await page.locator('#game').press('r');}
  await page.locator('#restart').click();check(`${width}: restart resets`,await page.evaluate(()=>window.fluxSnapshot().wave===1&&window.fluxSnapshot().score===0));
  await page.locator('#help').click();await page.getByRole('button',{name:'开始弹射'}).click();check(`${width}: help resumes`,await page.evaluate(()=>!window.fluxSnapshot().paused));
  await page.locator('#sound').click();await page.waitForFunction(()=>document.querySelector('#sound').getAttribute('aria-pressed')==='true');check(`${width}: sound toggle`,await page.locator('#sound').getAttribute('aria-pressed')==='true');
  await page.locator('#workshop').click();
  check(`${width}: workshop exposes four materials and three sizes`,await page.locator('[data-material]').count()===4&&await page.locator('[data-size]').count()===3);
  for(const material of ['steel','brass','ceramic','rubber']){await page.locator(`[data-material="${material}"]`).click();for(const size of ['small','standard','large']){await page.locator(`[data-size="${size}"]`).click();check(`${width}: selects ${material}/${size}`,await page.evaluate(({material,size})=>window.fluxSnapshot().material===material&&window.fluxSnapshot().size===size,{material,size}));}}
  await page.locator('[data-material="ceramic"]').click();await page.locator('[data-size="small"]').click();
  await page.screenshot({path:`test-results/workshop-${width}x${height}.png`});
  await page.locator('#equip').click();await page.reload();await page.waitForFunction(()=>window.fluxSnapshot?.().material==='ceramic');check(`${width}: loadout persists`,await page.evaluate(()=>window.fluxSnapshot().size==='small'));
  await page.locator('#levels').click();check(`${width}: twelve challenges available`,await page.locator('[data-level]').count()===12);await page.screenshot({path:`test-results/levels-${width}x${height}.png`});
  await page.locator('[data-level="0"]').click();await page.locator('#beginChallenge').click();
  check(`${width}: challenge starts with a shot budget`,await page.evaluate(()=>window.fluxSnapshot().mode==='challenge'&&window.fluxSnapshot().remainingShots===5));
  const move=solutions[0].moves[0],box=await page.locator('#game').boundingBox();const px=box.x+(210+Math.cos(move.angle)*180)/420*box.width,py=box.y+(132+Math.sin(move.angle)*180)/720*box.height;
  await page.mouse.move(px,py);await page.mouse.down();await page.mouse.up();await page.waitForFunction(()=>window.fluxSnapshot().shots===1);
  await page.waitForFunction(()=>window.fluxSnapshot().phase==='volley'&&document.querySelector('#workshop').disabled,{},{timeout:3000});
  check(`${width}: flying ball cannot be changed`,await page.locator('#workshop').isDisabled());check(`${width}: ceramic cannot activate magnet`,await page.locator('#magnet').isDisabled());
  await page.waitForFunction(()=>window.fluxSnapshot().targets===0,{},{timeout:20000});if(await page.evaluate(()=>window.fluxSnapshot().phase==='volley'))await page.locator('#recall').click();
  await page.locator('#nextLevel').waitFor();check(`${width}: actual shot wins and stores three stars`,await page.evaluate(()=>window.fluxSnapshot().phase==='won'&&window.fluxSnapshot().records[0].stars===3));await page.screenshot({path:`test-results/win-${width}x${height}.png`});
  await page.locator('#nextLevel').click();await page.locator('#beginChallenge').click();check(`${width}: next challenge opens`,await page.evaluate(()=>window.fluxSnapshot().levelIndex===1));
  for(let i=0;i<6;i++){await page.locator('#game').press('Space');await page.locator('#game').press('r');}
  await page.locator('#retryLevel').waitFor();check(`${width}: shot budget ends in failure`,await page.evaluate(()=>window.fluxSnapshot().phase==='over'&&window.fluxSnapshot().remainingShots===0));
  await page.locator('#retryLevel').click();check(`${width}: retry restores the current challenge`,await page.evaluate(()=>window.fluxSnapshot().levelIndex===1&&window.fluxSnapshot().shots===0&&window.fluxSnapshot().targets===5));
  await page.locator('#levels').click();await page.locator('[data-level="10"]').click();await page.locator('#beginChallenge').click();check(`${width}: wind and pegs are present`,await page.evaluate(()=>window.fluxSnapshot().air===2&&window.fluxSnapshot().pegs===2));await page.screenshot({path:`test-results/challenge-${width}x${height}.png`});
  await page.locator('#levels').click();await page.locator('#backToGame').click();check(`${width}: closing level menu resumes`,await page.evaluate(()=>!window.fluxSnapshot().paused));
  await page.reload();await page.waitForFunction(()=>window.fluxSnapshot?.().records[0]?.stars===3);check(`${width}: challenge stars survive reload`,true);
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await context.setOffline(true);await page.reload();await page.locator('#game').waitFor({state:'visible',timeout:10000});check(`${width}: offline reload`,await page.locator('#game').isVisible());await page.waitForFunction(()=>window.fluxSnapshot);await page.locator('#levels').click();await page.locator('[data-level="4"]').click();await page.locator('#beginChallenge').click();check(`${width}: challenge works offline`,await page.evaluate(()=>window.fluxSnapshot().levelIndex===4&&window.fluxSnapshot().air===1));
  check(`${width}: no runtime errors`,errors.length===0);await context.close();
 }
 await writeFile('test-results/browser-report.json',JSON.stringify({checks,passed:checks.length},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await browser?.close();server.kill();}
