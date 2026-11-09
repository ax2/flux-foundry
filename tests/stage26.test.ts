import assert from 'node:assert/strict';
import {test} from 'node:test';
import {Game, STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';

test('the moving spring expedition advances without repeating the long empty rally', () => {
 const game = new Game(2217);
 while (game.phase === 'aim') {
  assert.ok(game.selectBall('brass', 'small'));
  const target = game.targets.slice().sort((a, b) => a.hp - b.hp)[0];
  game.aim(target.x, target.y);
  assert.ok(game.fire());
  const original = game.balls[0];
  let step = 0;
  while (game.phase === 'volley' && step < 900 / STEP) {
   if (step % 14 === 0) steer(game, 'follow');
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
 assert.ok(game.progress.maxNoHit < 12);
});
