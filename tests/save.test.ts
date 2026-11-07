import {test} from 'node:test';
import assert from 'node:assert/strict';
import {loadSave,SAVE_KEY,RULESET} from '../src/save';
const storage=(values:Record<string,string>)=>({getItem:(k:string)=>values[k]??null});
test('v3 through v8 progress migrates once as historical records without certifying current stars',()=>{
 const values:Record<string,string>={};for(let n=3;n<=8;n++)values[`flux-challenges-v${n}`]=JSON.stringify({0:{stars:3,shots:n}});
 const before={...values},save=loadSave(storage(values),['限珠远征']);assert.equal(Object.keys(save.legacy).length,6);assert.deepEqual(save.rulesets[RULESET].records,{});assert.deepEqual(values,before);
 save.rulesets[RULESET].records[1]={stars:2,shots:4};values[SAVE_KEY]=JSON.stringify(save);values['flux-challenges-v8']=JSON.stringify({0:{stars:1,shots:99}});
 const again=loadSave(storage(values),['限珠远征']);assert.equal(again.legacy.v8.records[0].shots,8);assert.deepEqual(again.rulesets[RULESET].records[1],{stars:2,shots:4});
});
test('one malformed source cannot erase another version, current progress, or historical rankings',()=>{
 const save=loadSave(storage({'flux-challenges-v3':'{','flux-challenges-v4':'null','flux-challenges-v5':'[]','flux-challenges-v8':JSON.stringify({0:{stars:3,shots:2},bad:{stars:3,shots:1},1:{stars:9,shots:1},2:{stars:1,shots:-1}}),'flux-ranking-v8':JSON.stringify([{score:100,wave:1,shots:2,mode:'限珠远征',date:'2026-11-07'},{score:200,wave:1,shots:2,mode:'<script>',date:'2026-11-07'}])}),['限珠远征']);
 assert.deepEqual(Object.keys(save.legacy.v8.records),['0']);assert.equal(save.legacy.v8.ranks.length,1);assert.deepEqual(save.rulesets[RULESET].records,{});
 const current={...save,rulesets:{...save.rulesets,older:{records:{0:{stars:1,shots:3}},ranks:[]}}};const reloaded=loadSave(storage({[SAVE_KEY]:JSON.stringify(current)}),['限珠远征']);assert.equal(reloaded.rulesets.older.records[0].stars,1);
});
test('a corrupt stable save can recover retained legacy keys without throwing',()=>{
 const save=loadSave(storage({[SAVE_KEY]:'{','flux-challenges-v7':'{"4":{"stars":2,"shots":5}}'}),[]);assert.equal(save.legacy.v7.records[4].stars,2);
});
