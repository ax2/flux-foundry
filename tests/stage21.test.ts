import {test} from 'node:test';import assert from 'node:assert/strict';
import {loadSave,mergeSaves,RULESET,type Rank,type Save} from '../src/save';
const empty=():Save=>({schema:1,rulesets:{[RULESET]:{records:{},ranks:[]}},legacy:{},migrated:[]});
const rank=(id?:string,score=100):Rank=>({score,wave:1,shots:1,mode:'限珠远征',date:'2026-11-08',...(id?{id}:{})});
test('merging an old tab retains both sets of records and their best stars and ball counts without mutating inputs',()=>{
 const a=empty(),b=empty();a.rulesets[RULESET].records={0:{stars:2,shots:5},1:{stars:1,shots:3}};b.rulesets[RULESET].records={0:{stars:3,shots:7},2:{stars:2,shots:2}};const before=JSON.stringify([a,b]);
 const merged=mergeSaves(a,b);assert.deepEqual(merged.rulesets[RULESET].records,{0:{stars:3,shots:5},1:{stars:1,shots:3},2:{stars:2,shots:2}});assert.equal(JSON.stringify([a,b]),before);
});
test('two equal new sessions retain their distinct IDs and shared snapshots never duplicate them',()=>{
 const a=empty(),b=empty();a.rulesets[RULESET].ranks=[rank('session-a')];b.rulesets[RULESET].ranks=[rank('session-b')];const merged=mergeSaves(a,b);assert.equal(merged.rulesets[RULESET].ranks.length,2);assert.deepEqual(mergeSaves(merged,merged),merged);
 const loaded=loadSave({getItem:key=>key==='flux-save'?JSON.stringify(merged):null},['限珠远征']);assert.deepEqual(loaded.rulesets[RULESET].ranks,merged.rulesets[RULESET].ranks);
});
test('legacy duplicate sessions keep their existing multiplicity and the merged ranking keeps the best ten',()=>{
 const a=empty(),b=empty();a.rulesets[RULESET].ranks=[rank(),rank()];b.rulesets[RULESET].ranks=[rank()];assert.equal(mergeSaves(a,b).rulesets[RULESET].ranks.length,2);
 a.rulesets[RULESET].ranks=Array.from({length:10},(_,i)=>rank('a-'+i,i));b.rulesets[RULESET].ranks=Array.from({length:10},(_,i)=>rank('b-'+i,100+i));assert.deepEqual(mergeSaves(a,b).rulesets[RULESET].ranks.map(r=>r.score),[109,108,107,106,105,104,103,102,101,100]);
});
test('another ruleset and migrated historical progress survive a stale-tab write',()=>{
 const a=empty(),b=empty();a.migrated=['v3'];b.migrated=['v4'];b.rulesets['other-rule']={records:{3:{stars:3,shots:1}},ranks:[]};a.legacy.v3={records:{0:{stars:2,shots:2}},ranks:[]};b.legacy.v4={records:{1:{stars:1,shots:4}},ranks:[]};const merged=mergeSaves(a,b);assert.deepEqual(merged.rulesets['other-rule'],b.rulesets['other-rule']);assert.deepEqual(Object.keys(merged.legacy).sort(),['v3','v4']);assert.deepEqual(merged.migrated.sort(),['v3','v4']);
});
