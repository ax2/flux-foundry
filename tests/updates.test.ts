import {test} from 'node:test';
import assert from 'node:assert/strict';
import {AppUpdates} from '../src/updates';

test('a waiting update lost during awaited saving restores a usable status without reloading',async t=>{
 const previous=Object.getOwnPropertyDescriptor(globalThis,'navigator');
 t.after(()=>{if(previous)Object.defineProperty(globalThis,'navigator',previous);else Reflect.deleteProperty(globalThis,'navigator');});
 // Explicit lifecycle unit fixture, not a real browser or a gameplay route.
 const worker=Object.assign(new EventTarget(),{state:'installed'});
 const registration=Object.assign(new EventTarget(),{waiting:worker as typeof worker|null,active:{state:'activated'},installing:null});
 const container=Object.assign(new EventTarget(),{controller:{},register:async()=>registration});
 Object.defineProperty(globalThis,'navigator',{configurable:true,value:{serviceWorker:container}});
 let saves=0;
 const updates=new AppUpdates(true,()=>true,async()=>{saves++;registration.waiting=null;return true;},()=>{});
 await updates.start();assert.equal(updates.available,true);
 assert.equal(await updates.apply(),false);assert.equal(saves,1);
 assert.equal(updates.available,false);assert.equal(updates.applying,false);assert.equal(updates.status,'current');
 assert.equal(await updates.apply(),false);assert.equal(saves,1);
});
