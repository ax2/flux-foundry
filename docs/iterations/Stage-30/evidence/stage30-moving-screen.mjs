import {readFileSync,writeFileSync} from 'node:fs';
const game=readFileSync('test-results/stage30-game-gentle-200.ts','utf8');
const variants=[
 ['nearby', "this.targets.some(t=>t.motion&&t.y>=580&&Math.abs(t.x-falling.x)<this.paddle.width*.7)"],
 ['twoRows', "this.targets.some(t=>t.motion&&t.y>=580&&Math.abs(t.x-falling.x)<this.paddle.width*.7)&&this.targets.every(t=>t.y>=490)"],
];
for(const [name,filter] of variants){
 const text=game.replace('this.targets.length>=5&&this.air.length===0&&','this.targets.length>=5&&this.air.length===0&&'+filter+'&&');
 if(text===game)throw Error('Filter not added');
 writeFileSync('test-results/stage30-game-'+name+'.ts',text);
 const audit=readFileSync('test-results/stage30-gentle200-matrix.ts','utf8').replace('stage30-game-gentle-200','stage30-game-'+name).replace('stage30-gentle200-matrix.json','stage30-matrix-'+name+'.json');
 writeFileSync('test-results/stage30-matrix-'+name+'.ts',audit);
}
