import {mkdir,writeFile} from 'node:fs/promises';
import {Game,STEP} from '../src/game';
import {LEVELS,type Material,type BallSize} from '../src/content';
type Variant='designed'|'square'|'flat'|'positions'|'unpowered';
const variants:Variant[]=['designed','square','flat','positions','unpowered'];
const choices:[Material,BallSize][]=[['steel','standard'],['ceramic','small'],['brass','large'],['rubber','standard']];
const average=(xs:number[])=>xs.reduce((a,b)=>a+b,0)/xs.length;
const round=(x:number)=>Math.round(x*100)/100;
const reports=[];
for(let index=0;index<LEVELS.length;index++){
 const level=LEVELS[index],measurements=[];
 for(const variant of variants){const samples=[];
  for(const [material,size] of choices)for(let a=0;a<13;a++){
   const g=new Game(1000+index,index);
   if(variant==='square')for(const t of g.targets)t.kind='steel';
   if(variant==='unpowered')for(const t of g.targets)if(t.power==='spring')t.power=undefined;
   if(variant==='flat')for(const group of [g.targets.filter(t=>!t.core),g.targets.filter(t=>t.core)]){if(!group.length)continue;const total=group.reduce((n,t)=>n+t.hp,0),hp=Math.floor(total/group.length),extra=total%group.length;group.forEach((t,i)=>t.hp=t.maxHp=hp+(i<extra?1:0));}
   if(variant==='positions'){const positions=g.targets.map(t=>({x:t.x,y:t.y}));g.targets.forEach((t,i)=>Object.assign(t,positions[(i+2)%positions.length]));}
   const objectiveHP=g.targets.reduce((n,t)=>n+(level.goal==='clear'||t.core?t.hp:0),0);
   g.selectBall(material,size);g.angle=.22+a*(Math.PI-.44)/12;g.fire();let steps=0;
   while(g.phase==='volley'&&steps<20/STEP){g.update(STEP);steps++;}
   const capped=g.phase==='volley'; // Keep the live state at the observation boundary; never finish it artificially.
   const remaining=g.targets.reduce((n,t)=>n+(level.goal==='clear'||t.core?t.hp:0),0);
   samples.push({hits:g.stats.hits,seconds:g.stats.flight,progress:objectiveHP-remaining,rescue:g.stats.rescues>0?1:0,boosts:g.stats.boosts,won:g.phase==='won'?1:0,capped:capped?1:0});
  }
  const progress=average(samples.map(s=>s.progress)),initialHP=level.tiles.reduce((n,t)=>n+(level.goal==='clear'||t.core?t.hp:0),0);
  measurements.push({variant,samples:samples.length,meanHits:round(average(samples.map(s=>s.hits))),meanSeconds:round(average(samples.map(s=>s.seconds))),meanObjectiveDamage:round(progress),rescuePercent:round(100*average(samples.map(s=>s.rescue))),singleBallWins:round(100*average(samples.map(s=>s.won))),capPercent:round(100*average(samples.map(s=>s.capped))),meanBoosts:round(average(samples.map(s=>s.boosts))),loadIndex:round(initialHP/Math.max(.01,progress)/level.shots)});
 }
 reports.push({level:index+1,name:level.name,goal:level.goal,stock:level.shots,par:level.par,totalHP:level.tiles.reduce((n,t)=>n+t.hp,0),tiers:[...new Set(level.tiles.map(t=>t.hp))].sort((a,b)=>a-b),measurements});console.log(`${index+1} ${level.name}: ${measurements[0].meanHits} hits, ${measurements[0].meanSeconds}s, load ${measurements[0].loadIndex}`);
}
const totals=variants.map(variant=>{const rows=reports.map(r=>r.measurements.find(m=>m.variant===variant)!);return {variant,meanHits:round(average(rows.map(r=>r.meanHits))),meanSeconds:round(average(rows.map(r=>r.meanSeconds))),meanRescuePercent:round(average(rows.map(r=>r.rescuePercent)))};});
const method=`${LEVELS.length}关×5种布局变体×4种弹珠组合×13个固定角度=${LEVELS.length*5*4*13}次首球观察。每球最多观察20秒，仍在飞行记为未结束；不收球或伪造下一回合，胜利只统计自然回收后已获胜的样本。此上限不是游戏寿命。变体分别为设计布局、全方块、耐久平坦（全场总HP与核心HP分别保持）、积木位置循环置换、关闭弹簧供能。均保留其余机关。首球样本不能代替真实玩家通关率；负荷指标=目标HP/(平均目标扣血×库存)，仅用于比较。`;
await mkdir('test-results',{recursive:true});
await writeFile('test-results/balance.json',JSON.stringify({method,totals,levels:reports},null,2)+'\n');
const lines=['# 当前布局首20秒对照（继承历史研究方法）', '',method,'','## 汇总','', '| 变体 | 单球平均命中 | 平均运行秒数 | 使用救援占比 |','|---|---:|---:|---:|',...totals.map(t=>`| ${t.variant} | ${t.meanHits} | ${t.meanSeconds} | ${t.meanRescuePercent}% |`),'','## 设计布局逐关数据','','| 关 | 目标 | 耐久阶梯 | 总HP | 库存 | 单球命中 | 运行秒数 | 负荷指标 |','|---|---|---|---:|---:|---:|---:|---:|',...reports.map(r=>`| ${r.level} ${r.name} | ${r.goal} | ${r.tiers.join('/')} | ${r.totalHP} | ${r.stock} | ${r.measurements[0].meanHits} | ${r.measurements[0].meanSeconds} | ${r.measurements[0].loadIndex} |`),'','完整变体/逐关数据见 balance.json。固定角度与有限材质样本有偏差；通关可解性另由挑战解回放验证，不将这里的首球胜率称为玩家胜率。',''];
await writeFile('test-results/balance.md',lines.join('\n'));
