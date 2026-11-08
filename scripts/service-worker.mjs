import {readdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';

export async function writeServiceWorker(directory='dist'){
 const files=await readdir(directory,{recursive:true});
 const assets=files.filter(f=>/\.(html|js|css|png|svg|webmanifest)$/.test(f)&&f!=='sw.js').map(f=>'./'+f.replaceAll('\\','/')).sort();
 const hash=createHash('sha256');for(const f of assets)hash.update(await readFile(resolve(directory,f)));
 const cache='flux-foundry-'+hash.digest('hex').slice(0,12);
 await writeFile(resolve(directory,'sw.js'),`const CACHE=${JSON.stringify(cache)},FILES=${JSON.stringify(assets)};
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 await Promise.all(FILES.map(async file=>{
  const url=new URL(file,self.registration.scope).href;
  // Copy hash-addressed originals byte-for-byte instead of downloading them again.
  const existing=file.startsWith('./assets/')?await caches.match(url,{ignoreVary:true}):null;
  const response=existing||await fetch(url,{cache:file.startsWith('./assets/')?'default':'reload'});
  if(!response.ok)throw Error('Incomplete offline install');
  await cache.put(url,response);
 }));
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const previous=(await caches.keys()).filter(key=>key.startsWith('flux-foundry-')&&key!==CACHE);
 // Another tab can still run the preceding build. Retain its immutable assets.
 await Promise.all(previous.slice(0,-1).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('message',event=>{if(event.data?.type==='FLUX_ACTIVATE')event.waitUntil(self.skipWaiting());});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{
  const own=await caches.open(CACHE);
  if(event.request.mode==='navigate')return await own.match(new URL('./index.html',self.registration.scope))||fetch(event.request);
  return await own.match(event.request,{ignoreVary:true})||await caches.match(event.request,{ignoreVary:true})||fetch(event.request);
 })());
});`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)await writeServiceWorker();
