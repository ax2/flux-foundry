import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Game, STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';

const cases = [
 {name:'moving spring',seed:2217,material:'brass',size:'small',policy:'follow',limit:12},
 {name:'wall-side low row',seed:9011,material:'rubber',size:'large',policy:'steer',limit:13},
 {name:'low row with a central gap',seed:42,material:'ceramic',size:'large',policy:'steer',limit:13},
 {name:'two empty catches in a low row',seed:4039,material:'rubber',size:'large',policy:'follow',limit:11.1},
 {name:'low row entirely to one side',seed:815,material:'steel',size:'large',policy:'steer',limit:15.3,hits:585,shot:{number:15,hits:44,gap:12}},
 {name:'central gap with a moving brick',seed:2026,material:'brass',size:'standard',policy:'follow',limit:13.4,hits:968,shot:{number:2,hits:97,gap:12.5},extraShot:{number:5,hits:45,gap:12.5}},
 {name:'wall-side row with a moving spring',seed:739,material:'steel',size:'standard',policy:'follow',limit:12,hits:454,shot:{number:9,hits:28,gap:7}},
 {name:'wide gap between fixed bricks',seed:7429,material:'brass',size:'standard',policy:'steer',limit:14.5,hits:462,shot:{number:9,hits:61,gap:14.5}},
 {name:'widened paddle below a moving spring',seed:7429,material:'steel',size:'standard',policy:'steer',limit:12,hits:569,shot:{number:11,hits:56,gap:12}},
 {name:'low split row beside a spring',seed:7429,material:'steel',size:'large',policy:'steer',limit:13,hits:599,shot:{number:12,hits:81,gap:13}},
 {name:'enlarged ball below a moving spring',seed:10103,material:'steel',size:'small',policy:'steer',limit:14.5,hits:511,shot:{number:11,hits:18,gap:12}},
 {name:'central gap between fixed low bricks',seed:42,material:'brass',size:'standard',policy:'steer',limit:13.5,hits:695,shot:{number:4,hits:58,gap:12.5}},
 {name:'central spring beside a moving hexagon',seed:9011,material:'brass',size:'standard',policy:'follow',limit:13,hits:610,shot:{number:2,hits:16,gap:9}},
 {name:'central spring beside a fixed hexagon while following',seed:815,material:'brass',size:'standard',policy:'follow',limit:12.5,hits:647,shot:{number:2,hits:44,gap:8.1},extraShot:{number:7,hits:23,gap:7}},
 {name:'central spring beside a fixed hexagon while steering',seed:815,material:'brass',size:'standard',policy:'steer',limit:12.5,hits:474,shot:{number:2,hits:29,gap:12.5}},
 {name:'central gap beside a moving spring',seed:10103,material:'brass',size:'standard',policy:'follow',limit:12,hits:591,shot:{number:2,hits:32,gap:12}},
 {name:'central gap across two low rows',seed:2217,material:'brass',size:'standard',policy:'follow',limit:10,hits:530,shot:{number:2,hits:19,gap:10}},
 {name:'central gap between a moving spring and a diamond',seed:739,material:'brass',size:'standard',policy:'follow',limit:12.5,hits:603,shot:{number:2,hits:28,gap:9}},
 {name:'moving spring opposite a fixed bar',seed:42,material:'brass',size:'standard',policy:'follow',limit:10,hits:674,shot:{number:2,hits:13,gap:10}},
 {name:'fixed spring opposite a moving square',seed:934,material:'brass',size:'standard',policy:'follow',limit:14,hits:843,shot:{number:2,hits:44,gap:8.52},extraShot:{number:1,hits:63,gap:9.2},thirdShot:{number:5,hits:30,gap:12}},
 {name:'fixed spring opposite a moving triangle',seed:2931,material:'brass',size:'standard',policy:'follow',limit:12,hits:566,shot:{number:2,hits:26,gap:12}},
 {name:'fixed spring opposite a moving bar',seed:87,material:'brass',size:'standard',policy:'follow',limit:10,hits:593,shot:{number:2,hits:22,gap:10}},
 {name:'moving spring opposite a fixed low triangle',seed:137,material:'brass',size:'standard',policy:'follow',limit:12,hits:544,shot:{number:2,hits:20,gap:11.2}},
 {name:'fixed spring opposite a moving low capacitor',seed:1229,material:'brass',size:'standard',policy:'follow',limit:11,hits:770,shot:{number:2,hits:53,gap:11}},
 {name:'low fixed bar beyond a side rally',seed:7429,material:'ceramic',size:'large',policy:'follow',limit:9.5,hits:620,shot:{number:4,hits:72,gap:8}},
 {name:'fixed spring opposite a higher moving square',seed:934,material:'ceramic',size:'large',policy:'follow',limit:9.3,hits:493,shot:{number:3,hits:15,gap:8}},
 {name:'widened paddle between a fixed spring and a moving bar',seed:87,material:'brass',size:'standard',policy:'steer',limit:13.4,hits:588,shot:{number:3,hits:25,gap:11.9}},
] as const;

for (const scenario of cases) {
 const {name, seed, material, size, policy, limit} = scenario;
 test(`the ${name} expedition advances without repeating the long empty rally`, () => {
  const game = new Game(seed);
  const observedShots = new Map<number, {hits:number;gap:number}>();
  while (game.phase === 'aim') {
   assert.ok(game.selectBall(material, size));
   const target = game.targets.slice().sort((a, b) => a.hp - b.hp)[0];
   game.aim(target.x, target.y);
   assert.ok(game.fire());
   const previousHits = game.stats.hits;
   const original = game.balls[0];
   let shotGap = 0;
   let step = 0;
   while (game.phase === 'volley' && step < 900 / STEP) {
    if (step % 14 === 0) steer(game, policy);
    const nextGap = game.progress.sinceHit + STEP;
    game.update(STEP);
    shotGap = Math.max(shotGap, nextGap);
    if (game.phase === 'volley') assert.equal(game.balls[0], original);
    step++;
   }
   assert.notEqual(game.phase, 'volley');
   assert.ok(original.y - original.r >= 692);
   observedShots.set(game.shots,{hits:game.stats.hits - previousHits,gap:shotGap});
  }
  assert.equal(game.phase, 'over');
  assert.equal(game.wave, 15);
  assert.equal(game.shots, 15);
  assert.ok(game.progress.maxNoHit < limit);
  if ('hits' in scenario) {
   assert.ok(game.stats.hits >= scenario.hits);
   const expectedShots = [scenario.shot];
   if ('extraShot' in scenario) expectedShots.push(scenario.extraShot);
   if ('thirdShot' in scenario) expectedShots.push(scenario.thirdShot);
   for (const expected of expectedShots) {
    const observed = observedShots.get(expected.number);
    assert.ok(observed);
    assert.ok(observed.hits >= expected.hits);
    assert.ok(observed.gap < expected.gap);
   }
  }
 });
}
