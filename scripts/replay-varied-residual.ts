import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {runVariedResidual} from './varied-case';
const result=runVariedResidual();
assert.equal(result.result,'won');assert.equal(result.stars,3);assert.ok(result.used<=3);assert.ok(result.gap<16);
await mkdir('test-results',{recursive:true});
await writeFile('test-results/varied-residual-replay.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result));
