import {test} from 'node:test';import assert from 'node:assert/strict';
import {Game,STEP} from '../src/game';import {Feedback,CUES} from '../src/feedback';import {Sound,soundPlan} from '../src/audio';
test('feedback is bounded, drains once, debounces local weak contacts, and ages without touching physics',()=>{
 const f=new Feedback();f.emit('weak',12,30);f.emit('weak',15,31);assert.equal(f.counts.weak,1);f.update(.15);f.emit('weak',15,31);assert.equal(f.counts.weak,2);
 for(let i=0;i<100;i++)f.emit('pickup',i,50,'life');assert.equal(f.snapshot().pending,48);assert.equal(f.marks.length,16);assert.equal(f.drain().length,48);assert.equal(f.drain().length,0);f.update(1);assert.equal(f.marks.length,0);
});
test('valid fire reports one launch; rejected fire and paused simulation report none',()=>{
 const g=new Game(1,0);assert.equal(g.fire(),true);assert.equal(g.fire(),false);assert.equal(g.feedback.counts.launch,1);const b={...g.balls[0]},hp=g.targets.map(t=>t.hp);g.feedback.drain();g.paused=true;g.update(STEP);assert.deepEqual(g.balls[0],b);assert.deepEqual(g.targets.map(t=>t.hp),hp);assert.equal(g.feedback.snapshot().pending,0);
});
for(const [speed,hp,expected] of [[10,3,'weak'],[120,3,'hit'],[120,1,'break']] as const)test(`${expected} feedback follows the real durability threshold`,()=>{
 const g=new Game(1,0);g.targets=[{id:0,x:210,y:500,kind:'capacitor',size:48,hp,maxHp:hp,flash:0}];g.fire();g.feedback.drain();const b=g.balls[0];Object.assign(b,{x:210,y:464,vx:0,vy:speed});g.update(STEP);
 const e=g.feedback.drain();assert.equal(g.feedback.counts[expected],1);assert.ok(e.some(e=>e.type===expected));assert.equal(g.stats.hits,expected==='weak'?0:1);assert.equal(g.targets[0]?.hp??0,expected==='weak'?hp:hp-1);assert.equal(g.balls[0],b);if(expected==='break')assert.equal(g.feedback.counts.hit,0);
});
test('a real paddle catch reports contact; queuing or draining feedback never adds work',()=>{
 const g=new Game(1,0);g.targets=[{id:0,x:100,y:340,kind:'bar',size:48,hp:100,maxHp:100,flash:0}];g.fire();g.feedback.drain();Object.assign(g.balls[0],{x:210,y:660,vx:0,vy:200});for(let i=0;i<5&&g.stats.paddleHits===0;i++)g.update(STEP);assert.equal(g.stats.paddleHits,1);assert.equal(g.feedback.counts.catch,1);
 const before={ball:{...g.balls[0]},stats:{...g.stats},seed:g.seed};g.feedback.emit('boost',210,660);g.feedback.drain();assert.deepEqual({ball:{...g.balls[0]},stats:{...g.stats},seed:g.seed},before);
});
test('treasure feedback happens once, retains gameplay durations, and freezes with the menu',()=>{
 const g=new Game(1,0);g.fire();const treasure={id:100,x:210,y:400,r:14,kind:'wide' as const,life:12};g.collectTreasure(treasure);g.collectTreasure(treasure);assert.equal(g.feedback.counts.pickup,1);assert.equal(g.wideTime,14);assert.equal(g.paddle.width,144);const marks=structuredClone(g.feedback.marks);g.paused=true;g.update(1);assert.deepEqual(g.feedback.marks,marks);assert.equal(g.wideTime,14);
});
for(const won of [true,false])test(`${won?'victory':'loss'} feedback follows complete natural collection once`,()=>{
 const g=new Game(1,won?0:undefined);if(won)g.targets=[];else g.queue=g.queue.slice(0,1);g.fire();const b=g.balls[0];Object.assign(b,{y:705,vy:10,vx:0});g.update(STEP);assert.ok(b.y-b.r>=692);assert.equal(g.phase,won?'won':'over');assert.equal(g.feedback.counts[won?'win':'lose'],1);g.update(STEP);assert.equal(g.feedback.counts[won?'win':'lose'],1);
});
test('all cue recipes are bounded, positive, distinct and leave input events unchanged',()=>{
 const patterns=[];
 for(const type of CUES){const e={type,variant:'steel',strength:1},before={...e},plan=soundPlan(e);assert.ok(plan.length>=1&&plan.length<=4);for(const t of plan){assert.ok(t.from>0&&t.to>0&&t.from<5000&&t.to<5000);assert.ok(t.gain>0&&t.gain<=.045);assert.ok(t.at>=0&&t.at+t.duration<.6);}patterns.push(JSON.stringify(plan));assert.deepEqual(e,before);}
 assert.equal(new Set(patterns).size,CUES.length);assert.notDeepEqual(soundPlan({type:'pickup',variant:'life',strength:1}),soundPlan({type:'pickup',variant:'slow',strength:1}));
});
test('muted sound never constructs a context; unavailable audio does not throw into gameplay',()=>{
 let attempts=0;const sound=new Sound(()=>{attempts++;throw Error('unavailable');});sound.unlock();sound.play([{type:'hit',variant:'steel',strength:1,x:0,y:0}]);assert.equal(attempts,0);sound.enabled=true;assert.doesNotThrow(()=>sound.unlock());assert.equal(sound.snapshot().failures,1);sound.enabled=false;assert.equal(sound.snapshot().voices,0);
});
test('a later user gesture resumes an interrupted context and recreates a closed one',()=>{
 let made=0,resumed=0;const context={state:'interrupted',resume:()=>{resumed++;return Promise.resolve();}};
 const sound=new Sound(()=>{made++;return context as unknown as AudioContext;});sound.enabled=true;sound.unlock();assert.equal(resumed,1);assert.equal(made,1);context.state='closed';sound.unlock();assert.equal(made,2);assert.equal(resumed,2);
});
