import {test} from 'node:test';import assert from 'node:assert/strict';import {retryableDownload,retryPackaging,builderArgs} from '../scripts/package-windows.mjs';
test('a clean install uses builder-managed Electron instead of a nonexistent dist',()=>{const args=builderArgs(false);assert.ok(args.includes('--publish'));assert.ok(args.includes('never'));assert.ok(!args.some(a=>a.includes('electronDist')));});
test('an actually installed Electron binary is reused without a second download',()=>{assert.ok(builderArgs(true).includes('--config.electronDist=node_modules/electron/dist'));});
test('packaging retries an upstream504 on the same built input, then accepts a genuine success',async()=>{
 const calls:number[]=[],waits:number[]=[];const result=await retryPackaging(async n=>{calls.push(n);return n===1?{code:1,log:'HTTPError: Response code 504 (Gateway Time-out)'}:{code:0,log:'built'};},async n=>{waits.push(n);});assert.deepEqual(calls,[1,2]);assert.deepEqual(waits,[5000]);assert.equal(result.attempts,2);
});
test('persistent download failures stop after three attempts',async()=>{
 let calls=0;const waits:number[]=[];await assert.rejects(()=>retryPackaging(async()=>{calls++;return {code:1,log:'Response code 503'};},async n=>{waits.push(n);}),/attempt 3/);assert.equal(calls,3);assert.deepEqual(waits,[5000,10000]);
});
test('compiler, filesystem and process failures are not hidden by retries',async()=>{
 for(const log of ['TS2322: type error','EACCES: permission denied','Electron desktop assertion failed']){let calls=0;await assert.rejects(()=>retryPackaging(async()=>{calls++;return {code:1,log};},async()=>assert.fail('must not wait')),/attempt 1/);assert.equal(calls,1);assert.equal(retryableDownload(log),false);}
 await assert.rejects(()=>retryPackaging(async()=>{throw Error('spawn ENOENT');}),/ENOENT/);
});
