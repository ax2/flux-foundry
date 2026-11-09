import {execFileSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const old=p=>execFileSync('git',['show','v0.23.0:'+p],{encoding:'utf8'}).replaceAll("from './","from '../src/");
writeFileSync('test-results/stage28-baseline-game.ts',old('src/game.ts').replace('../src/paddle-assist','./stage28-baseline-assist'));
writeFileSync('test-results/stage28-baseline-assist.ts',old('src/paddle-assist.ts'));
const audit=readFileSync('scripts/endless-audit.ts','utf8').replace("from './paddle-policy'","from '../scripts/paddle-policy'").replace('of [42,739,2217]','of [137,815,1229,1907]');
for(const [n,source] of [['base','./stage28-baseline-game'],['candidate','../src/game']])writeFileSync('test-results/stage28-independent-'+n+'.ts',audit.replace('../src/game',source).replace('test-results/endless-audit-extended.json','test-results/stage28-independent-'+n+'.json'));
