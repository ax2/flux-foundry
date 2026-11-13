import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Game, STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';

const cases = [
 {name:'moving spring',seed:2217,material:'brass',size:'small',policy:'follow',limit:12},
 {name:'wall-side low row',seed:9011,material:'rubber',size:'large',policy:'steer',limit:13},
 {name:'low row with a central gap',seed:42,material:'ceramic',size:'large',policy:'steer',limit:13},
 {name:'two empty catches in a low row',seed:4039,material:'rubber',size:'large',policy:'follow',limit:11.1},
 {name:'low row entirely to one side',seed:815,material:'steel',size:'large',policy:'steer',limit:15.3,hits:585,lastShotHits:44,lastShotGap:12},
] as const;

for (const scenario of cases) {
 const {name, seed, material, size, policy, limit} = scenario;
 test(`the ${name} expedition advances without repeating the long empty rally`, () => {
  const game = new Game(seed);
  let lastShotHits = 0, lastShotGap = 0;
  while (game.phase === 'aim') {
   assert.ok(game.selectBall(material, size));
   const target = game.targets.slice().sort((a, b) => a.hp - b.hp)[0];
   game.aim(target.x, target.y);
   assert.ok(game.fire());
   const previousHits = game.stats.hits;
   const original = game.balls[0];
   lastShotGap = 0;
   let step = 0;
   while (game.phase === 'volley' && step < 900 / STEP) {
    if (step % 14 === 0) steer(game, policy);
    const nextGap = game.progress.sinceHit + STEP;
    game.update(STEP);
    lastShotGap = Math.max(lastShotGap, nextGap);
    if (game.phase === 'volley') assert.equal(game.balls[0], original);
    step++;
   }
   assert.notEqual(game.phase, 'volley');
   assert.ok(original.y - original.r >= 692);
   lastShotHits = game.stats.hits - previousHits;
  }
  assert.equal(game.phase, 'over');
  assert.equal(game.wave, 15);
  assert.equal(game.shots, 15);
  assert.ok(game.progress.maxNoHit < limit);
  if ('hits' in scenario) {
   assert.ok(game.stats.hits >= scenario.hits);
   assert.ok(lastShotHits >= scenario.lastShotHits);
   assert.ok(lastShotGap < scenario.lastShotGap);
  }
 });
}
