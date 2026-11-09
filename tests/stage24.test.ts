import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {Game, STEP} from '../src/game';
import {steer} from '../scripts/paddle-policy';

test('wind well recovers the long small rubber route and finishes naturally', () => {
 const game = new Game(1018, 18);
 while (game.phase === 'aim') {
  assert.ok(game.selectBall('rubber', 'small'));
  if (game.shots === 0) game.angle = 2.59;
  else {
   const target = game.targets.find(brick => brick.core);
   assert.ok(target);
   game.aim(target.x, target.y);
  }
  assert.ok(game.fire());
  const original = game.balls[0];
  let step = 0;
  while (game.phase === 'volley' && step < 600 / STEP) {
   if (step % 24 === 0) steer(game, 'steer');
   game.update(STEP);
   if (game.phase === 'volley') assert.equal(game.balls[0], original);
   step++;
  }
  assert.notEqual(game.phase, 'volley');
  assert.ok(original.y - original.r >= 692);
 }
 assert.equal(game.phase, 'won');
 assert.equal(game.stars, 3);
 assert.ok(game.shots <= 3);
 assert.ok(game.progress.maxNoHit < 8);
});

test('changed wind-well first balls have exact three-star continuations', () => {
 const {routes} = JSON.parse(readFileSync(new URL('./fixtures/wind-continuations.json', import.meta.url), 'utf8'));
 assert.equal(routes.length, 30);
 assert.equal(new Set(routes.map(route => `${route.matrix}/${route.index}`)).size, routes.length);
 for (const route of routes) {
  assert.equal(route.level, 19);
  assert.ok([14, 18, 36].includes(route.cadence));
  assert.ok(['follow', 'steer'].includes(route.policy));
  assert.equal(route.moves[0].angle, route.angle);
  const game = new Game(route.actualSeed, 18);
  if (route.mirror) game.mirror();
  for (const move of route.moves) {
   assert.equal(move.material, route.material);
   assert.equal(move.size, route.size);
   assert.ok(move.angle >= .16 && move.angle <= Math.PI - .16);
   assert.ok(Number.isInteger(move.steps) && move.steps > 0);
   assert.ok(game.selectBall(move.material, move.size));
   game.angle = move.angle;
   assert.ok(game.fire());
   const original = game.balls[0];
   for (let step = 0; step < move.steps; step++) {
    assert.equal(game.phase, 'volley');
    if (step % route.cadence === 0) steer(game, route.policy);
    game.update(STEP);
    if (game.phase === 'volley') assert.equal(game.balls[0], original);
   }
   assert.notEqual(game.phase, 'volley');
   assert.ok(original.y - original.r >= 692);
  }
  assert.equal(game.phase, 'won');
  assert.equal(game.stars, 3);
  assert.equal(game.shots, route.used);
  assert.ok(game.progress.maxNoHit < 20);
 }
});
