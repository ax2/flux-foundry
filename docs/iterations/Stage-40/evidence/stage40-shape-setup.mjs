import fs from 'node:fs';
const p='test-results/';
const names=['second279','second213','second237'];
const original=fs.readFileSync(p+'stage40-game-'+names[0]+'.ts','utf8');
const next=original.replace('else if(centralLowRowGuide)maxTilt=0.279;',`else if(centralLowRowGuide){
      const movingAcrossLane=this.targets.find(t=>t.motion&&t.power!=='spring'&&Math.abs(t.x-falling.x)<=this.paddle.width);
      maxTilt=movingAcrossLane?.kind==='prism'?.213:movingAcrossLane?.kind==='bar'?.237:.279;
     }`);
if(next===original)throw Error('Missing candidate cap');
fs.writeFileSync(p+'stage40-game-second279-shape.ts',next);
const runner=fs.readFileSync(p+'stage39-matrix.mjs','utf8').replaceAll('stage39-','stage40-').replace('test-results/stage38-production-matrix.json','test-results/stage39-production-matrix.json').replace('(?:-gap)?','(?:-shape)?');
fs.writeFileSync(p+'stage40-matrix.mjs',runner);
