import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
const port=Number(process.env.PLAY_PORT||4483),url='http://127.0.0.1:'+port;
const output=process.env.PLAY_OUTPUT||'test-results/stage26-touch';
const [seedText,material='brass',size='small',policy='follow']=process.argv.slice(2);
const observed=Number(process.env.PLAY_SHOTS||8);
const seed=Number(seedText||2217),server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{stdio:'ignore'});
let browser;
try{
 let ready=false;
 for(let i=0;i<60;i++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch(url)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
 assert.ok(ready);
 await mkdir(output,{recursive:true});
 browser=await chromium.launch({channel:'chrome',headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 const page=await context.newPage(),cdp=await context.newCDPSession(page),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 const base=Date.now()+2000;
 await page.clock.install({time:base});
 await page.goto(url);
 await page.waitForFunction(()=>window.fluxDiagnostics?.().loading.phase==='ready');
 await page.locator('#levels').click();
 await page.clock.setFixedTime(new Date(seed));
 await page.locator('#endless').click();
 await page.locator('#workshop').click();
 await page.locator('[data-material="'+material+'"]').click();
 await page.locator('[data-size="'+size+'"]').click();
 await page.locator('#equip').click();
 await page.clock.setFixedTime(new Date(base));
 await page.clock.pauseAt(base+15000);
 const snapshot=()=>page.evaluate(()=>window.fluxSnapshot());
 const point=(x,y)=>({x:box.x+x/420*box.width,y:box.y+y/720*box.height});
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:x===undefined?[]:[point(x,y)]});
 const box=await page.locator('#game').boundingBox(),shots=[];
 for(let shot=0;shot<observed;shot++){
  const initial=await snapshot();
  assert.equal(initial.mode,'endless');
  assert.equal(initial.phase,'aim');
  await page.locator('#workshop').click({force:true});
  await page.locator('[data-material="'+material+'"]').click({force:true});
  await page.locator('[data-size="'+size+'"]').click({force:true});
  await page.locator('#equip').click({force:true});
  const target=initial.bricks.slice().sort((a,b)=>a.hp-b.hp)[0],angle=Math.atan2(target.y-132,target.x-210);
  const x=210+Math.cos(angle)*180,y=132+Math.sin(angle)*180;
  await touch('touchStart',x-15,y-15);await touch('touchMove',x,y);await touch('touchEnd');
  await page.clock.runFor(16);
  let s=await snapshot(),moves=0;
  assert.equal(s.shots,shot+1);assert.equal(s.material,material);assert.equal(s.activeBall?.r,{small:9,standard:12,large:16}[size]);
  await touch('touchStart',210,648);
  while(s.phase==='volley'){
   const ball=s.activeBall;
   const eta=(-ball.vy+Math.sqrt(ball.vy*ball.vy+480*Math.max(0,675-ball.r-ball.y)))/240;
   const lo=18+ball.r,range=384-2*ball.r,raw=ball.x+ball.vx*eta-lo,fold=((raw%(2*range))+2*range)%(2*range),landing=lo+(fold>range?2*range-fold:fold);
   const destination=s.treasures[0]||s.bricks.find(t=>t.core)||{x:210},desired=Math.max(-170,Math.min(170,(destination.x-landing)*.8));
   const offset=policy==='follow'?0:Math.max(-.72,Math.min(.72,(desired-ball.vx)/(2*Math.max(100,Math.abs(ball.vy))*.42)));
   await touch('touchMove',Math.max(35,Math.min(385,landing-offset*s.paddle.width/2)),648);
   await page.clock.runFor(117);
   s=await snapshot();
   if(++moves===8000)throw Error('Observation ceiling reached');
  }
  await touch('touchEnd');assert.equal(s.balls,0);
  shots.push({wave:s.wave,shots:s.shots,phase:s.phase,seconds:s.stats.flight-initial.stats.flight,hits:s.stats.hits-initial.stats.hits,catches:s.stats.paddleHits-initial.stats.paddleHits,maxNoHit:s.progress.maxNoHit,moves});
  console.log(JSON.stringify(shots.at(-1)));
  if(s.phase!=='aim')break;
 }
 assert.ok(shots.length===observed||shots.at(-1)?.phase==="over");
 assert.deepEqual(errors,[]);
 const s=await snapshot();
 await page.screenshot({path:output+'/390x844.png'});
 await writeFile(output+'/report.json',JSON.stringify({seed,material,size,policy,method:'Original PNG ready, actual Chrome touch input, virtual browser clock, natural volley endings at a fixed shot checkpoint',shots,errors,last:s.phase},null,2));
}finally{await browser?.close();server.kill();}



