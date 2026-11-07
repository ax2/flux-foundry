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
  await page.goto('http://127.0.0.1:4186');await page.waitForFunction(()=>{const canvas=document.querySelector('#game');return window.fluxSnapshot&&canvas.width>0&&canvas.getContext('2d').getImageData(10,10,1,1).data[3]>0;});await page.locator('#game').press('ArrowLeft');
  check(`${width}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  check(`${width}: controls fit viewport`,await page.locator('.console').evaluate(el=>el.getBoundingClientRect().bottom<=innerHeight+1));
  await page.screenshot({path:`test-results/${width}x${height}.png`});
  if(width<500){const box=await page.locator('#game').boundingBox();const cdp=await context.newCDPSession(page);const x=box.x+box.width*.5,y=box.y+box.height*.4;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+30,y:y+60}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  }else{await page.locator('#game').press('Space');}
  await page.waitForFunction(()=>window.fluxSnapshot().phase==='volley');check(`${width}: exactly one ball`,await page.evaluate(()=>window.fluxSnapshot().balls===1&&window.fluxSnapshot().count===1));check(`${width}: pointer/keyboard fires`,true);
  if(width<500)await page.locator('#game').tap({position:{x:80,y:130}});else await page.locator('#game').press('Space');
  check(`${width}: in-flight touch or keyboard activates one manual pulse`,await page.evaluate(()=>window.fluxSnapshot().pulseUsed&&window.fluxSnapshot().stats.pulses===1));await page.locator('#game').press('Space');check(`${width}: repeated pulse cannot add charges or marbles`,await page.evaluate(()=>window.fluxSnapshot().stats.pulses===1&&window.fluxSnapshot().balls===1&&window.fluxSnapshot().shots===1));
  await page.locator('#magnet').click();await page.locator('#game').press('m');
  check(`${width}: magnet deploys`,await page.evaluate(()=>window.fluxSnapshot().magnetUsed));
  await page.locator('#pause').click();const before=await page.evaluate(()=>window.fluxSnapshot());await page.waitForTimeout(250);const after=await page.evaluate(()=>window.fluxSnapshot());check(`${width}: pause freezes state`,JSON.stringify(before)===JSON.stringify(after));
  await page.locator('#resume').click();await page.locator('#recall').click();await page.locator('#game').press('Space');await page.locator('#game').press('r');
  await page.getByRole('button',{name:'电磁增幅 磁场吸引力 +20%'}).click();check(`${width}: upgrade persists`,await page.evaluate(()=>window.fluxSnapshot().fieldStrength===1.2&&window.fluxSnapshot().power===1));
  for(let i=0;i<12;i++){const phase=await page.evaluate(()=>window.fluxSnapshot().phase);if(phase==='over')break;if(phase==='upgrade')await page.getByRole('button',{name:'精密回弹 减少碰撞损耗，保留更多动能'}).click();await page.locator('#game').press('Space');await page.locator('#game').press('r');}
  await page.locator('#restart').click();check(`${width}: restart resets`,await page.evaluate(()=>window.fluxSnapshot().wave===1&&window.fluxSnapshot().score===0));
  await page.locator('#help').click();await page.getByRole('button',{name:'开始弹射'}).click();check(`${width}: help resumes`,await page.evaluate(()=>!window.fluxSnapshot().paused));
  await page.locator('#sound').click();await page.waitForFunction(()=>document.querySelector('#sound').getAttribute('aria-pressed')==='true');check(`${width}: sound toggle`,await page.locator('#sound').getAttribute('aria-pressed')==='true');
  check(`${width}: hopper overlays the arena instead of consuming a row`,await page.locator('.reserve-rack').evaluate(el=>el.parentElement.classList.contains('arena')&&getComputedStyle(el).position==='absolute'));
  check(`${width}: all twelve reserve balls are visible`,await page.locator('[data-reserve]').count()===12);const queued=await page.evaluate(()=>window.fluxSnapshot().queue[2]);await page.locator('[data-reserve="2"]').click();check(`${width}: reserve can be reordered without spending a ball`,await page.evaluate(q=>window.fluxSnapshot().material===q.material&&window.fluxSnapshot().size===q.size&&window.fluxSnapshot().remainingShots===12,queued));
  await page.locator('#workshop').click();
  check(`${width}: workshop exposes four materials and three sizes`,await page.locator('[data-material]').count()===4&&await page.locator('[data-size]').count()===3);
  for(const material of ['steel','brass','ceramic','rubber']){await page.locator(`[data-material="${material}"]`).click();for(const size of ['small','standard','large']){await page.locator(`[data-size="${size}"]`).click();check(`${width}: selects ${material}/${size}`,await page.evaluate(({material,size})=>window.fluxSnapshot().material===material&&window.fluxSnapshot().size===size,{material,size}));}}
  await page.locator('[data-material="ceramic"]').click();await page.locator('[data-size="small"]').click();
  await page.screenshot({path:`test-results/workshop-${width}x${height}.png`});
  await page.locator('#equip').click();await page.reload();await page.waitForFunction(()=>window.fluxSnapshot?.().material==='ceramic');check(`${width}: loadout persists`,await page.evaluate(()=>window.fluxSnapshot().size==='small'));
  await page.locator('#levels').click();check(`${width}: twenty-four challenges available`,await page.locator('[data-level]').count()===24);await page.screenshot({path:`test-results/levels-${width}x${height}.png`});
  await page.locator('[data-level="5"]').click();await page.locator('#beginChallenge').click();
  check(`${width}: challenge starts with a shot budget`,await page.evaluate(()=>window.fluxSnapshot().mode==='challenge'&&window.fluxSnapshot().remainingShots===7));
  const move=solutions[5].moves[0];await page.locator('#workshop').click();await page.locator(`[data-material="${move.material}"]`).click();await page.locator(`[data-size="${move.size}"]`).click();await page.locator('#equip').click();
  const box=await page.locator('#game').boundingBox();const px=box.x+(210+Math.cos(move.angle)*180)/420*box.width,py=box.y+(132+Math.sin(move.angle)*180)/720*box.height;
  await page.mouse.move(px,py);await page.mouse.down();await page.mouse.up();await page.waitForFunction(()=>window.fluxSnapshot().shots===1);
  await page.waitForFunction(()=>window.fluxSnapshot().phase==='volley'&&document.querySelector('#workshop').disabled,{},{timeout:3000});
  check(`${width}: flying ball cannot be changed`,await page.locator('#workshop').isDisabled());check(`${width}: fired marble leaves the hopper`,await page.locator('[data-reserve="0"]').count()===0);
  await page.waitForFunction(()=>window.fluxSnapshot().goalComplete,{},{timeout:45000});if(await page.evaluate(()=>window.fluxSnapshot().phase==='volley'))await page.locator('#recall').click();
  await page.locator('#nextLevel').waitFor();check(`${width}: actual shot wins and stores three stars`,await page.evaluate(()=>window.fluxSnapshot().phase==='won'&&window.fluxSnapshot().records[5].stars===3));await page.screenshot({path:`test-results/win-${width}x${height}.png`});
  await page.locator('#nextLevel').click();await page.locator('#beginChallenge').click();check(`${width}: next challenge opens`,await page.evaluate(()=>window.fluxSnapshot().levelIndex===6));
  for(let i=0;i<7;i++){await page.locator('#game').press('Space');await page.locator('#game').press('r');}
  await page.locator('#retryLevel').waitFor();check(`${width}: shot budget ends in failure`,await page.evaluate(()=>window.fluxSnapshot().phase==='over'&&window.fluxSnapshot().remainingShots===0));
  await page.locator('#retryLevel').click();check(`${width}: retry restores the current challenge`,await page.evaluate(()=>window.fluxSnapshot().levelIndex===6&&window.fluxSnapshot().shots===0&&window.fluxSnapshot().targets===6));
  await page.locator('#levels').click();await page.locator('[data-level="16"]').click();await page.locator('#beginChallenge').click();check(`${width}: wind, gates and core goal are present`,await page.evaluate(()=>window.fluxSnapshot().air===2&&window.fluxSnapshot().gates===1&&window.fluxSnapshot().goal==='core'));await page.screenshot({path:`test-results/challenge-${width}x${height}.png`});
  await page.locator('#levels').click();await page.locator('#backToGame').click();check(`${width}: closing level menu resumes`,await page.evaluate(()=>!window.fluxSnapshot().paused));
  await page.locator('#levels').click();await page.locator('[data-level="23"]').click();await page.locator('#beginChallenge').click();
  check(`${width}: new strategy room has two cores, a valve and powered rails`,await page.evaluate(()=>{const s=window.fluxSnapshot();return s.bricks.filter(b=>b.core).length===2&&s.bricks.some(b=>b.power==='valve')&&s.rails.length===2;}));
  await page.screenshot({path:`test-results/strategy-${width}x${height}.png`});
  const movingA=await page.locator('#game').screenshot();await page.waitForTimeout(180);const movingB=await page.locator('#game').screenshot();check(`${width}: mist animates without arrows`,!movingA.equals(movingB));
  await page.locator('#motion').click();await page.waitForTimeout(80);const stillA=await page.locator('#game').screenshot();await page.waitForTimeout(180);const stillB=await page.locator('#game').screenshot();check(`${width}: reduced effects keep the mist still`,stillA.equals(stillB));await page.locator('#motion').click();
  await page.locator('#workshop').click();await page.locator('[data-material="steel"]').click();await page.locator('[data-size="standard"]').click();await page.locator('#equip').click();await page.locator('#game').press('Space');
  await page.waitForFunction(()=>window.fluxSnapshot().airZones.some(z=>z.fy>0),null,{timeout:15000});check(`${width}: actual valve hit reverses the wind`,true);
  await page.waitForFunction(()=>window.fluxSnapshot().phase!=='volley',null,{timeout:60000});check(`${width}: strategy shot naturally collects without recall`,await page.evaluate(()=>window.fluxSnapshot().balls===0&&window.fluxSnapshot().shots===1));
  check(`${width}: bottom plate visibly-backed mechanism returns the same ball before collection`,await page.evaluate(()=>window.fluxSnapshot().stats.rebounds>=2&&window.fluxSnapshot().stats.rebounds<=4));
  await page.locator('#levels').click();await page.locator('#dailyTrial').click();await page.locator('#beginChallenge').click();const daily=await page.evaluate(()=>window.fluxSnapshot().dailyKey);check(`${width}: daily trial has a stable date and finite reserve`,typeof daily==='string'&&await page.locator('[data-reserve]').count()>0);await page.locator('#levels').click();await page.locator('#dailyTrial').click();await page.locator('#beginChallenge').click();check(`${width}: repeating daily keeps its seed date`,await page.evaluate(()=>window.fluxSnapshot().dailyKey)===daily);
  await page.reload();await page.waitForFunction(()=>window.fluxSnapshot?.().records[5]?.stars===3);check(`${width}: challenge stars survive reload`,true);
  await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.waitForFunction(()=>navigator.serviceWorker.controller!==null);await context.setOffline(true);await page.reload();await page.locator('#game').waitFor({state:'visible',timeout:10000});check(`${width}: offline reload`,await page.locator('#game').isVisible());await page.waitForFunction(()=>window.fluxSnapshot);await page.locator('#levels').click();await page.locator('[data-level="6"]').click();await page.locator('#beginChallenge').click();check(`${width}: challenge works offline`,await page.evaluate(()=>window.fluxSnapshot().levelIndex===6&&window.fluxSnapshot().air===1));
  check(`${width}: no runtime errors`,errors.length===0);await context.close();
 }
 await writeFile('test-results/browser-report.json',JSON.stringify({checks,passed:checks.length},null,2));console.log(JSON.stringify({passed:checks.length,checks},null,2));
}finally{await browser?.close();server.kill();}
