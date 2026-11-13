import fs from 'node:fs';
const p='test-results/',file=p+'stage40-game-second279-shape.ts',source=fs.readFileSync(file,'utf8');
const start=source.indexOf('  const centralLowRowGuide='),end=source.indexOf('  if(falling&&(regularGuide',start);
const old=source.slice(start,end);
const gate=old.replace("this.progress.sinceHit>=7&&","this.wideTime===0&&this.bigTime===0&&this.progress.sinceHit>=7&&")
 .replace("falling.r*2.5","falling.r*2.9")
 .replace("this.targets.some(other=>!other.power&&(t.x-falling.x)*(other.x-falling.x)<0&&Math.abs(other.x-falling.x)<=this.paddle.width));",`this.targets.some(other=>!other.power&&(t.x-falling.x)*(other.x-falling.x)<0&&Math.abs(other.x-falling.x)<=this.paddle.width&&
     (t.motion?other.kind==='bar'&&!other.motion:other.motion&&['steel','prism','bar'].includes(other.kind))));`);
if(gate===old||!gate.includes("other.kind==='bar'"))throw Error('Missing geometry anchor');
fs.writeFileSync(p+'stage40-game-second279-shape-narrow.ts',source.slice(0,start)+gate+source.slice(end));
const previousCap='else if(centralTwoRowGuide)maxTilt=.32;';
const narrow=source.slice(0,start)+gate+source.slice(end);
if(!narrow.includes(previousCap))throw Error('Missing previous diamond cap anchor');
fs.writeFileSync(p+'stage40-game-second279-shape-preserved.ts',narrow.replace(previousCap,'else if(centralTwoRowGuide||centralDiamondGuide)maxTilt=.32;'));
const runner=p+'stage40-matrix.mjs',s=fs.readFileSync(runner,'utf8');
fs.writeFileSync(runner,s.replace('(?:-shape)?','(?:-shape(?:-narrow)?)?'));
