import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TextureLoader} from '../src/textures';
const image=()=>({src:'',decode:async()=>{}} as HTMLImageElement);
test('texture progress follows actual streamed bytes and only completes after decode',async()=>{
 const original=globalThis.fetch;let finishDecode!:()=>void;const img=image();img.decode=()=>new Promise<void>(r=>finishDecode=r);
 globalThis.fetch=async()=>new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(4));c.enqueue(new Uint8Array(6));c.close();}}));
 try{const loader=new TextureLoader([{image:img,url:'/test.webp',bytes:10}],'https:');const states:number[]=[];loader.onChange=s=>states.push(s.percent);const ready=loader.load();while(!finishDecode)await new Promise(r=>setTimeout(r,0));assert.equal(loader.state.received,10);assert.equal(loader.state.percent,99);finishDecode();await ready;assert.equal(loader.state.percent,100);assert.ok(states.includes(40));assert.equal(loader.state.phase,'ready');}finally{globalThis.fetch=original;}
});
test('failed textures remain playable fallback, retry only missing resources',async()=>{
 const original=globalThis.fetch;const requests:string[]=[];let failing=true;globalThis.fetch=async url=>{requests.push(String(url));return String(url)==='/b'&&failing?new Response('',{status:503}):new Response(new Uint8Array(10));};
 try{const loader=new TextureLoader([{image:image(),url:'/a',bytes:10},{image:image(),url:'/b',bytes:10}],'https:');await loader.load();assert.equal(loader.state.phase,'fallback');assert.equal(loader.state.failed,1);assert.ok(loader.state.percent<100);failing=false;await loader.load();assert.deepEqual(requests,['/a','/b','/b']);assert.equal(loader.state.phase,'ready');}finally{globalThis.fetch=original;}
});
test('local Windows files decode directly without an HTTP request or fake byte progress',async()=>{
 const original=globalThis.fetch;globalThis.fetch=async()=>{throw Error('File must not use fetch');};try{const loader=new TextureLoader([{image:image(),url:'./assets/a.webp',bytes:20}],'file:');await loader.load();assert.equal(loader.state.percent,100);assert.equal(loader.state.received,20);}finally{globalThis.fetch=original;}
});
