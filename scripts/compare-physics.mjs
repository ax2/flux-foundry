import {readFile,writeFile} from 'node:fs/promises';import {createHash} from 'node:crypto';import assert from 'node:assert/strict';
const pairs=[['active-endurance.json','active-after.json'],['varied-endurance.json','varied-after.json'],['endurance.json','endurance-after.json'],['sparse-endurance.json','sparse-after.json'],['multi-after.json','multi-after.json'],['full-endurance.json','full-after.json'],['endless-audit.json','expedition-after.json']],checks=[];
for(const [current,baseline] of pairs){
 const before=JSON.parse(await readFile(`docs/iterations/Stage-17/${baseline}`,'utf8')),after=JSON.parse(await readFile(`test-results/${current}`,'utf8'));
 assert.deepEqual(after.rows,before.rows,`${current}: feedback changes must not alter any recorded physical route outcome or peak`);
 const digest=createHash('sha256').update(JSON.stringify(after.rows)).digest('hex');checks.push({matrix:current,rows:after.rows.length,identicalToPublishedStage17:true,rowsSha256:digest,summary:after.summary});
}
await writeFile('test-results/physics-parity.json',JSON.stringify({method:'Exact deep comparison of every serialized matrix row with the published Stage-17 baseline, including timing, hits, catches, natural phases, peak states and seeded parameters. Formal52 natural fixtures are also retained byte-for-byte. Algorithmic evidence, not every possible continuous input or human win rate.',checks},null,2));console.log(JSON.stringify(checks.map(({matrix,rows,identicalToPublishedStage17})=>({matrix,rows,identicalToPublishedStage17}))));
