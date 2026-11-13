import {readFileSync,writeFileSync} from 'node:fs';
const variants=[];
for(const [anchor,miss] of [['third',2],['second',1]]){
 const original=readFileSync('test-results/stage29-game-'+anchor+'.ts','utf8');
 const audit=readFileSync('test-results/stage29-case-'+anchor+'.ts','utf8');
 for(const cap of miss===2?[.185,.195,.20,.205,.21,.215,.225,.23,.235,.24,.25,.28,.3,.32]:[.245,.255,.26,.265,.27,.275,.285,.29,.30,.32]){
  const name=anchor+'-'+Math.round(cap*1000);
  const before=anchor==='third'?'offside?0.22:.22':'offside?0.28:.22';
  let source=original.replace(before,'offside?'+cap+':.22');
  if(source===original)throw Error('missing angle');
  writeFileSync('test-results/stage29-game-'+name+'.ts',source);
  writeFileSync('test-results/stage29-scan-'+name+'.ts',audit.replace('stage29-game-'+anchor,'stage29-game-'+name).replace('stage29-case-'+anchor+'.json','stage29-scan-'+name+'.json'));
  variants.push(name);
 }
}
writeFileSync('test-results/stage29-scan-list.json',JSON.stringify(variants));
