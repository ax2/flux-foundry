import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Game, STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';

const cases = [
 {name:'moving spring',seed:2217,material:'brass',size:'small',policy:'follow',limit:12},
 {name:'wall-side low row',seed:9011,material:'rubber',size:'large',policy:'steer',limit:13},
] as const;

for (const {name, seed, material, size, policy, limit} of cases) {
 test(`the ${name} expedition advances without repeating the long empty rally`, () => {
  const game = new Game(seed);
  while (game.phase === 'aim') {
   assert.ok(game.selectBall(material, size));
   const target = game.targets.slice().sort((a, b) => a.hp - b.hp)[0];
   game.aim(target.x, target.y);
   assert.ok(game.fire());
   const original = game.balls[0];
   let step = 0;
   while (game.phase === 'volley' && step < 900 / STEP) {
    if (step % 14 === 0) steer(game, policy);
    game.update(STEP);
    if (game.phase === 'volley') assert.equal(game.balls[0], original);
    step++;
   }
   assert.notEqual(game.phase, 'volley');
   assert.ok(original.y - original.r >= 692);
  }
  assert.equal(game.phase, 'over');
  assert.equal(game.wave, 15);
  assert.equal(game.shots, 15);
  assert.ok(game.progress.maxNoHit < limit);
 });
}
