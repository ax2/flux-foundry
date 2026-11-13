import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
const url='http://127.0.0.1:4687';
const server=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','4687','--strictPort'],{stdio:'ignore'});
let browser;
try{
 let ok=false;
 for(let i=0;i<60;i++){if(server.exitCode!==null)throw Error('Preview exited');try{if((await fetch(url)).ok){ok=true;break;}}catch{}await new Promise(r=>setTimeout(r,200));}
 if(!ok)throw Error('Preview unavailable');
 browser=await chromium.launch({channel:'chrome',headless:true});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.goto(url);
 await page.waitForFunction(()=>window.fluxDiagnostics?.().loading.phase==='ready');
 await page.locator('#levels').click();
 await page.locator('#endless').click();

 await page.locator('#game').press('Space');
 await page.waitForFunction(()=>window.fluxSnapshot().balls===1);
 await page.screenshot({path:'test-results/stage39-1440x1000.png'});
}finally{await browser?.close();server.kill();}
