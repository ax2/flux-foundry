import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const game=execFileSync('git',['show','v0.22.0:src/game.ts'],{encoding:'utf8'}).replaceAll("from './","from '../src/").replace('../src/paddle-assist','./stage26-baseline-assist');
const assist=execFileSync('git',['show','v0.22.0:src/paddle-assist.ts'],{encoding:'utf8'}).replaceAll("from './","from '../src/");
writeFileSync('test-results/stage26-baseline-game.ts',game);
writeFileSync('test-results/stage26-baseline-assist.ts',assist);
const audit=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'").replace('of [42,739,2217]','of [223,2026,4039,9011]');
for(const [n,g] of [['baseline','./stage26-baseline-game'],['current','../src/game']]){
 writeFileSync('test-results/stage26-extra-'+n+'.ts',audit.replace('../src/game',g).replace('test-results/endless-audit-extended.json','test-results/stage26-extra-'+n+'.json'));
}
