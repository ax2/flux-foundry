import {_electron} from '@playwright/test';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {version}=JSON.parse(await readFile('package.json','utf8'));
const app=await _electron.launch({executablePath:`releases/v${version}/win-unpacked/Flux Foundry.exe`});
try{const page=await app.firstWindow();await page.locator('#game').waitFor();await page.locator('#game').press('Space');await page.waitForFunction(()=>window.fluxSnapshot().balls===1);assert.equal(await page.evaluate(()=>window.fluxSnapshot().count),1);await page.locator('#pause').click();await page.getByRole('button',{name:'继续游戏'}).waitFor();console.log('Packaged Windows app: local resources, single-ball launch and pause passed.');}finally{await app.close();}
