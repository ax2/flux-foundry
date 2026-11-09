import {readFileSync,writeFileSync} from 'node:fs';
const game=readFileSync('test-results/stage28-game-lane.ts','utf8');
const full=readFileSync('test-results/stage28-audit-lane.ts','utf8'),single=readFileSync('test-results/stage28-case-lane.ts','utf8');
for(const [name,one,limit] of [['one',true,0],['gentle',false,.22],['oneGentle',true,.22],['smallTilt',false,.18]]){
 let edited=game;
 if(one)edited=edited.replace('this.progress.catchesWithoutHit>=1&&Math.abs(falling.x-this.paddle.x)','this.progress.catchesWithoutHit===1&&Math.abs(falling.x-this.paddle.x)');
 if(limit)edited=edited.replace('environment,this.progress.sinceHit>=20||this.lowEndgame?.48:.32);','environment,centralGuide&&!regularGuide&&!edgeGuide?'+limit+':this.progress.sinceHit>=20||this.lowEndgame?.48:.32);');
 if(edited===game)throw Error('Candidate not changed');
 writeFileSync('test-results/stage28-game-'+name+'.ts',edited);
 for(const [type,input] of [['audit',full],['case',single]])writeFileSync('test-results/stage28-'+type+'-'+name+'.ts',input.replaceAll('lane',name));
}
