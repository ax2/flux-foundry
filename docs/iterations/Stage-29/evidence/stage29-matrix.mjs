import {readFileSync,writeFileSync} from 'node:fs';
for(const n of ['third-200','third-210','third-185']){
 const text=readFileSync('test-results/stage29-audit-third.ts','utf8').replace('stage29-game-third','stage29-game-'+n).replace('stage29-third.json','stage29-matrix-'+n+'.json');
 writeFileSync('test-results/stage29-matrix-'+n+'.ts',text);
}
