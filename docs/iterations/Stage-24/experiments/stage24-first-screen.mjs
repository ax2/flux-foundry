import {readFileSync,writeFileSync} from 'node:fs';
const prefix = "Object.assign(LEVELS[18].air[0], {fx:12,fy:-48,x:95}, process.argv.includes('--shift') ? {x:105} : process.argv.includes('--tilt') ? {fx:18} : {});";
for (const [name,selector,replace] of [
 ['active','level=0;level<LEVELS.length;level++','level=18;level<19;level++'],
 ['varied','level=0;level<LEVELS.length;level++','level=18;level<19;level++'],
 ['arcade','level=0;level<LEVELS.length;level++','level=18;level<19;level++'],
]) {
 const path='scripts/'+name+'-endurance.ts';
 let source=readFileSync(path,'utf8');
 if(!source.includes(selector))throw Error(name+': expected loop missing');
 source=source.replace(selector,replace).replace("from './paddle-policy'","from '../scripts/paddle-policy'");
 const i=source.indexOf('\nconst ');
 if(i<0)throw Error(name);
 source=source.slice(0,i)+'\n'+prefix+source.slice(i);
 source=source.replaceAll("'test-results/"+(name==='arcade'?'endurance':name+'-endurance')+".json'", "'test-results/stage24-"+name+"-'+(process.argv[2]||'baseline').slice(2)+'.json'");
 writeFileSync('test-results/stage24-level19-'+name+'.ts',source);
}
