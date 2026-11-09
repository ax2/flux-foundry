import {readFileSync,writeFileSync} from 'node:fs';
const source=readFileSync('test-results/stage27-game-first.ts','utf8');
const audit=readFileSync('test-results/stage27-audit-first.ts','utf8'),caseSource=readFileSync('test-results/stage27-case-first.ts','utf8');
const anchors='this.progress.catchesWithoutHit>=0&&this.targets.every(t=>t.y>=580)';
const wall="Math.sign(falling.vx)===Math.sign(falling.x-W/2)&&this.rails.every(rail=>rail.side!==(falling.x<W/2?'left':'right')||rail.charges===0)";
for(const [name,extra] of [['dry',wall],['dryNear',wall+"&&falling.y>=600&&(falling.x<W/2?this.paddle.x<=22+half+1:this.paddle.x>=398-half-1)"]]){
 if(!source.includes(anchors))throw Error('missing anchor');
 writeFileSync('test-results/stage27-game-'+name+'.ts',source.replace(anchors,'this.targets.every(t=>t.y>=580)&&'+extra));
 writeFileSync('test-results/stage27-audit-'+name+'.ts',audit.replace('stage27-game-first','stage27-game-'+name).replace('stage27-first.json','stage27-'+name+'.json'));
 writeFileSync('test-results/stage27-case-'+name+'.ts',caseSource.replace('stage27-game-first','stage27-game-'+name).replace('stage27-case-first.json','stage27-case-'+name+'.json'));
}
