import {test} from 'node:test';
import assert from 'node:assert/strict';
import {diagnoseObservation} from '../scripts/observation.mjs';
test('observation expiry distinguishes background, pauses, stalled frames, slow clocks, and real missed rallies',()=>{
 const s={paused:false,progress:{sinceHit:2},diagnostics:{visibility:'visible',wall:20000,lastFrame:19990}};
 assert.equal(diagnoseObservation({...s,paused:true,diagnostics:{...s.diagnostics,visibility:'hidden'}},300,10),'background');
 assert.equal(diagnoseObservation({...s,paused:true},300,10),'paused');
 assert.equal(diagnoseObservation({...s,diagnostics:{...s.diagnostics,lastFrame:10000}},300,10),'frame-stall');
 assert.equal(diagnoseObservation({...s,progress:{sinceHit:65}},300,260),'no-progress');
 assert.equal(diagnoseObservation(s,300,40),'slow-simulation');assert.equal(diagnoseObservation(s,300,298),'long-active-flight');
});
