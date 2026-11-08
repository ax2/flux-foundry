import {readFile,writeFile} from 'node:fs/promises';import {Game,STEP} from '../src/game';import assert from 'node:assert/strict';
const reports=[];
for(const mirror of [false,true]){const path=`tests/fixtures/challenges${mirror?'-mirrored':''}.json`,old=JSON.parse(await readFile(path,'utf8')),updated=[];
 for(const s of old){const g=new Game(1000+s.level,s.level);if(mirror)g.mirror();const moves=[];
  for(const m of s.moves){if(g.phase!=='aim')break;assert.ok(g.selectBall(m.material,m.size));g.angle=m.angle;assert.ok(g.fire());const b=g.balls[0];let steps=0;while(g.phase==='volley'&&steps<600/STEP){g.update(STEP);steps++;if(g.phase==='volley')assert.equal(g.balls[0],b);}if(g.phase==='volley')break;assert.ok(b.y-b.r>=692);moves.push({...m,steps});}
  reports.push({mirror,level:s.level+1,result:g.phase,stars:g.stars,shots:g.shots,oldShots:s.shots,gap:g.progress.maxNoHit,changed:JSON.stringify(moves)!==JSON.stringify(s.moves),oldSteps:s.moves.map((m:any)=>m.steps),newSteps:moves.map(m=>m.steps)});updated.push({...s,shots:g.shots,moves});
 }
 if(process.argv.includes('--write')){assert.ok(reports.filter(r=>r.mirror===mirror).every(r=>r.result==='won'&&r.stars===3&&r.shots<=r.oldShots));await writeFile(path,JSON.stringify(updated,null,2)+'\n');}
}
await writeFile('test-results/stage20-natural-routes.json',JSON.stringify({method:'Replay original52 angle/loadout sequences without paddle input. Wait for each original ball to collect naturally;600s is failure only. --write refuses lost three-star wins or increased balls.',reports},null,2));console.log(JSON.stringify(reports.filter(r=>r.changed||r.result!=='won'||r.stars!==3)));
