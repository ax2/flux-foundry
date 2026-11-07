import {readdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const files=await readdir('dist',{recursive:true});
const assets=files.filter(f=>/\.(html|js|css|png|webp|svg|webmanifest)$/.test(f)&&f!=='sw.js').map(f=>'./'+f.replaceAll('\\','/'));
const hash=createHash('sha256');for(const f of assets)hash.update(await readFile('dist/'+f.slice(2)));
const cache='flux-foundry-'+hash.digest('hex').slice(0,12);
await writeFile('dist/sw.js',`const CACHE=${JSON.stringify(cache)},FILES=${JSON.stringify(assets)};self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('flux-foundry-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method==='GET'&&new URL(e.request.url).origin===self.location.origin)e.respondWith(caches.match(e.request,{ignoreVary:true}).then(hit=>hit||(e.request.mode==='navigate'?caches.match(new URL('./index.html',self.registration.scope)).then(page=>page||fetch(e.request)):fetch(e.request))));});`);
