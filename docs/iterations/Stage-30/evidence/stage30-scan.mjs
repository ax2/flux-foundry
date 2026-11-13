import {readFileSync,writeFileSync} from 'node:fs';
const names=[];
for(const [anchor,tilts] of [['gentle',[.12,.14,.15,.16,.17,.175,.185,.19,.195,.20,.205,.21,.23,.24]],['softEarly',[.16,.18,.20,.22,.24,.26,.27,.28,.30]]]){
 const source=readFileSync('test-results/stage30-game-'+anchor+'.ts','utf8');
 const run=readFileSync('test-results/stage30-case-'+anchor+'.ts','utf8');
 for(const t of tilts){
  const name=anchor+'-'+Math.round(t*1000),changed=source.replace('verticalGuide?'+(anchor==='gentle'?.18:.25)+':','verticalGuide?'+t+':');
  if(changed===source)throw Error('missing anchor');
  writeFileSync('test-results/stage30-game-'+name+'.ts',changed);
  writeFileSync('test-results/stage30-case-'+name+'.ts',run.replace('stage30-game-'+anchor,'stage30-game-'+name).replace('stage30-case-'+anchor+'.json','stage30-case-'+name+'.json'));
  names.push(name);
 }
}
writeFileSync('test-results/stage30-scan-list.json',JSON.stringify(names));
