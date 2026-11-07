import {test} from 'node:test';
import assert from 'node:assert/strict';
import {gestureDirection,rescueWindow,imminentContact} from '../src/control';
test('tap jitter rescues upward, swipes choose all directions independent of ball position',()=>{
 assert.deepEqual(gestureDirection({x:100,y:400},{x:108,y:408}),{x:0,y:-1});
 assert.deepEqual(gestureDirection({x:100,y:400},{x:150,y:400}),{x:1,y:0});
 assert.deepEqual(gestureDirection({x:100,y:400},{x:100,y:450}),{x:0,y:1});
 assert.deepEqual(gestureDirection({x:100,y:400},{x:50,y:400}),{x:-1,y:0});
});
test('an imminent real collision suppresses unnecessary assistance without mutating live physics',()=>{
 const b={x:210,y:420,vx:0,vy:500,r:12},t={id:1,x:210,y:490,size:48,kind:'capacitor' as const,hp:14,maxHp:14,flash:0};
 const before=structuredClone({b,t});assert.ok(imminentContact(b,[t]));assert.equal(imminentContact({...b,x:80},[t]),false);assert.equal(imminentContact(b,[{...t,hp:0}]),false);assert.deepEqual({b,t},before);
});
test('fast descent opens a rescue window before the collector without slowing an upward ball or empty skill',()=>{
 const b={y:450,vy:600,r:9};assert.ok(rescueWindow(b,4,2));assert.equal(rescueWindow(b,1,2),false);assert.equal(rescueWindow(b,4,0),false);assert.equal(rescueWindow({...b,vy:-600},4,2),false);assert.equal(rescueWindow({...b,y:150},4,2),false);assert.equal(rescueWindow(undefined,4,2),false);
});
