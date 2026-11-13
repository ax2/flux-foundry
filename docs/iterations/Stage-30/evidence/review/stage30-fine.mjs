import {readFileSync,writeFileSync} from 'node:fs';
const game=readFileSync('test-results/stage30-game-gentle.ts','utf8');
const audit=readFileSync('test-results/stage30-case-gentle.ts','utf8');
const list=[];
for(const cap of [.17925,.1795,.17975,.18025,.1805,.18075,.18125,.1815,.18175,.18225,.1825,.18275]){
 const key=String(cap).slice(2);
 const variant=game.replace('centralMovingGuide?.18:', 'centralMovingGuide?'+cap+':');
 if(variant===game)throw Error('missing cap');
 writeFileSync('test-results/stage30-fine-game-'+key+'.ts',variant);
 writeFileSync('test-results/stage30-fine-'+key+'.ts',audit.replace('./stage30-game-gentle','./stage30-fine-game-'+key).replace('stage30-case-gentle.json','stage30-fine-'+key+'.json'));
 list.push(key);
}
writeFileSync('test-results/stage30-fine-list.json',JSON.stringify(list));
