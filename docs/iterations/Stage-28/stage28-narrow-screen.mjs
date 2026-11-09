import {readFileSync,writeFileSync} from 'node:fs';
const game=readFileSync('test-results/stage28-game-central8.ts','utf8');
const full=readFileSync('test-results/stage28-audit-central8.ts','utf8'),single=readFileSync('test-results/stage28-case-central8.ts','utf8');
const source='this.targets.length>=3&&this.progress.sinceHit>=8';
const proof='if(plan.hit||(regularGuide&&this.progress.catchesWithoutHit>=misses)){';
for(const [name,narrow] of [['direct',false],['lane',true]]){
 let edited=game.replace(source,'this.targets.length===3&&falling.y>=610&&this.progress.sinceHit>=8');
 if(narrow)edited=edited.replace('this.targets.every(t=>t.y>=580);\n  if(falling&&','this.targets.every(t=>t.y>=580&&Math.abs(t.y-this.targets[0].y)<=1)&&this.targets.some(t=>t.x<falling.x)&&this.targets.some(t=>t.x>falling.x);\n  if(falling&&');
 edited=edited.replace(proof,"const timely=!centralGuide||regularGuide||edgeGuide||!plan.hit||(forecastRebound(falling,paddle,this.targets,spec.mass,restitution,this.time-dt,environment,plan.tilt,true,plan.boost).impact?.elapsed??Infinity)<.45;\n    if((plan.hit&&timely)||(regularGuide&&this.progress.catchesWithoutHit>=misses)){");
 writeFileSync('test-results/stage28-game-'+name+'.ts',edited);
 for(const [type,input] of [['audit',full],['case',single]])writeFileSync('test-results/stage28-'+type+'-'+name+'.ts',input.replaceAll('central8',name));
}
