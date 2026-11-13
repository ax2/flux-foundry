import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('src/game.ts','utf8').replaceAll("from './","from '../src/");
const audit=readFileSync('test-results/stage30-case-gentle.ts','utf8');
for(const cap of [.177,.178,.179,.181,.182,.183,.184,.196,.197,.198,.199,.201,.202,.203,.204]){
 const key=String(cap).slice(2);
 const variant=source.replace('if(gentle)maxTilt=lowGapGuide?.22:.2;','if(gentle)maxTilt=centralMovingGuide?'+cap+':lowGapGuide?.22:.2;');
 if(source===variant)throw Error('Missing anchor');
 writeFileSync('test-results/stage30-refine-game-'+key+'.ts',variant);
 writeFileSync('test-results/stage30-refine-'+key+'.ts',audit.replace('./stage30-game-gentle','./stage30-refine-game-'+key).replace('stage30-case-gentle.json','stage30-refine-'+key+'.json'));
}
