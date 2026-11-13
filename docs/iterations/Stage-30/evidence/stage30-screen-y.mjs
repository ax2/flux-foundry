import {readFileSync,writeFileSync} from 'node:fs';
const variants=[];
for(const [anchor,heights] of [['gentle',[580,600,620,630,640,650,655,660]],['gentle-200',[580,600,620,630,640,650,655,660]],['softEarly',[580,620,640,655]]]){
 const source=readFileSync('test-results/stage30-game-'+anchor+'.ts','utf8');
 const run=readFileSync('test-results/stage30-case-'+anchor+'.ts','utf8');
 for(const h of heights){
  const name=anchor+'-y'+h,changed=source.replace("const verticalGuide=this.mode==='endless'&&falling&&falling.y>=610","const verticalGuide=this.mode==='endless'&&falling&&falling.y>="+h);
  if(changed===source)throw Error('missing anchor');
  writeFileSync('test-results/stage30-game-'+name+'.ts',changed);
  writeFileSync('test-results/stage30-case-'+name+'.ts',run.replace('stage30-game-'+anchor,'stage30-game-'+name).replace('stage30-case-'+anchor+'.json','stage30-case-'+name+'.json'));
  variants.push(name);
 }
}
writeFileSync('test-results/stage30-y-list.json',JSON.stringify(variants));
