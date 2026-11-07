import {_electron,chromium} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import assert from 'node:assert/strict';
const {version}=JSON.parse(await readFile('package.json','utf8'));
const portable=process.argv.includes('--portable'),kind=portable?'portable':'unpacked';
await mkdir('test-results',{recursive:true});
async function launchPortable(){
 // The self-extracting launcher does not pipe Electron's inspector stdout back to Playwright.
 // Use a local CDP connection to the actual extracted app instead.
 const listener=createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const child=spawn(resolve(process.env.FLUX_PORTABLE_EXE||`releases/v${version}/Flux-Foundry-${version}-Windows-x64.exe`),[`--remote-debugging-port=${port}`,`--user-data-dir=${resolve('test-results/desktop-portable')}`],{stdio:'ignore'});
 let browser;try{for(let i=0;i<600;i++){try{if((await fetch(`http://127.0.0.1:${port}/json/version`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const {webSocketDebuggerUrl}=await (await fetch(`http://127.0.0.1:${port}/json/version`)).json();browser=await chromium.connectOverCDP(webSocketDebuggerUrl);const page=browser.contexts()[0].pages()[0];return {firstWindow:async()=>page,close:async()=>{await page.close();await browser.close();child.kill();}};
 }catch(error){await browser?.close();child.kill();throw error;}
}
const app=portable?await launchPortable():await _electron.launch({executablePath:`releases/v${version}/win-unpacked/Flux Foundry.exe`,args:[`--user-data-dir=${resolve('test-results/desktop-unpacked')}`],timeout:120000});

try{const page=await app.firstWindow();await page.locator('#game').waitFor();await page.waitForFunction(()=>window.fluxDiagnostics?.().loading.phase==='ready');assert.ok((await page.locator('.intro small').textContent()).includes(`v${version}`));await page.locator('#workshop').click();await page.locator('[data-material="rubber"]').click();await page.locator('[data-size="large"]').click();await page.locator('#equip').click();await page.locator('#levels').click();assert.equal(await page.locator('[data-level]').count(),26);await page.locator('[data-level="6"]').click();await page.locator('#beginChallenge').click();await page.locator('#game').press('Space');await page.waitForFunction(()=>window.fluxSnapshot().balls===1);assert.equal(await page.evaluate(()=>window.fluxSnapshot().count),1);assert.equal(await page.evaluate(()=>window.fluxSnapshot().material),'rubber');assert.equal(await page.evaluate(()=>window.fluxSnapshot().radius),16);assert.equal(await page.evaluate(()=>window.fluxSnapshot().air),1);assert.equal(await page.locator('[data-reserve]').count(),6);assert.equal(await page.evaluate(()=>window.fluxSnapshot().remainingShots),6);const r=await page.locator('#game').boundingBox();await page.mouse.move(r.x+r.width*.75,r.y+r.height*.85);assert.ok(await page.evaluate(()=>window.fluxSnapshot().paddle.target>300));assert.equal(await page.locator('.console,#magnet,#pulse,#recall,#speed').count(),0);await page.locator('#settings').click();await page.getByRole('button',{name:'继续游戏'}).waitFor();await page.locator('#history').click();assert.ok((await page.getByRole('dialog').textContent()).includes('新版星级重新认证'));await page.locator('#backHistory').click();await page.screenshot({path:`test-results/windows-${kind}.png`});console.log('Packaged Windows '+kind+': local resources, workshop, wind challenge, single-ball, paddle movement and top settings passed.');}finally{await app.close();}
