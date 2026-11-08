import {spawn} from 'node:child_process';import {mkdir,writeFile} from 'node:fs/promises';import {resolve} from 'node:path';import {fileURLToPath} from 'node:url';
import {existsSync} from 'node:fs';
export function builderArgs(hasInstalledElectron){return ['node_modules/electron-builder/out/cli/cli.js','--win','portable','--x64','--publish','never',...(hasInstalledElectron?['--config.electronDist=node_modules/electron/dist']:[])];}
export function retryableDownload(log){return /Response code (?:408|429|5\d\d)|ECONNRESET|ETIMEDOUT|EAI_AGAIN|socket hang up/i.test(log);}
export async function retryPackaging(run,delay=ms=>new Promise(r=>setTimeout(r,ms))){
 for(let attempt=1;attempt<=3;attempt++){
  const result=await run(attempt);if(result.code===0)return {attempts:attempt};
  if(attempt===3||!retryableDownload(result.log))throw Error(`Windows packaging failed on attempt ${attempt}: ${result.log.slice(-1200)}`);
  await delay(attempt*5000);
 }
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.platform!=='win32')throw Error('Windows packaging must run on Windows');
 await mkdir('test-results',{recursive:true});
 await retryPackaging(attempt=>new Promise((resolve,reject)=>{
  // A package install may omit its binary. Never point the builder at a missing dist.
  const installed=existsSync('node_modules/electron/dist/electron.exe');
  process.stdout.write(`Windows packaging attempt ${attempt}/3 (${installed?'installed Electron':'builder-managed Electron download'})\n`);
  const child=spawn(process.execPath,builderArgs(installed),{stdio:['ignore','pipe','pipe']});let log='';
  for(const [stream,destination] of [[child.stdout,process.stdout],[child.stderr,process.stderr]])stream.on('data',data=>{destination.write(data);log=(log+data).slice(-2000000);});
  child.on('error',reject);child.on('close',async code=>{try{await writeFile(`test-results/windows-package-attempt-${attempt}.log`,log);resolve({code,log});}catch(e){reject(e);}});
 }));
}
