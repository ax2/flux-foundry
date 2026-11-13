import {readFileSync,writeFileSync,existsSync} from 'node:fs';
if(!existsSync('test-results/stage30-release-game.ts'))throw Error('Missing v0.24.0 copy');
const source=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'").replace('of [42,739,2217]','of [421,934,2931,7429]');
for(const [name,engine] of [['base','./stage30-release-game'],['candidate','../src/game']]){
 const run=source.replace('../src/game',engine).replace('test-results/endless-audit-extended.json','test-results/stage30-review-'+name+'.json').replace('72 complete expedition runs, seeds42/739/2217','96 complete expedition runs, seeds421/934/2931/7429');
 writeFileSync('test-results/stage30-review-'+name+'.ts',run);
}
