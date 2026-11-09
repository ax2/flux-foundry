import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Game, STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';

test('a wall-side catch advances the low core during the mirrored crosswind rally', () => {
 const game = new Game(1021, 21);
 game.mirror();
 for (let shot = 0; shot < 2; shot++) {
  assert.ok(game.selectBall('steel', 'standard'));
  const core = game.targets.find(target => target.core);
  assert.ok(core);
  if (shot === 0) game.angle = 2.59;
  else game.aim(core.x, core.y);
  assert.ok(game.fire());
  const original = game.balls[0];
  let step = 0;
  while (game.phase === 'volley' && step < 600 / STEP) {
   if (step % 14 === 0) steer(game, 'steer');
   game.update(STEP);
   if (game.phase === 'volley') assert.equal(game.balls[0], original);
   step++;
  }
  assert.notEqual(game.phase, 'volley');
  assert.ok(original.y - original.r >= 692);
 }
 assert.equal(game.phase, 'won');
 assert.equal(game.stars, 3);
 assert.ok(game.progress.maxNoHit < 12);
});
