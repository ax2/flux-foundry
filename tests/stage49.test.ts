import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {Game, LAUNCH, STEP} from '../src/game';

const evidence = new URL('../docs/iterations/Stage-49/evidence/', import.meta.url);
const inputs: {shot: number; event: string; ball?: {x: number; y: number; vx: number; vy: number}}[] =
 JSON.parse(readFileSync(new URL('input-tape.json', evidence), 'utf8'));
const pointers: {phase: string; shot: number; type: string; flight: number; paddle: {target: number}}[] =
 JSON.parse(readFileSync(new URL('pointer-tape.json', evidence), 'utf8'));

test('large steel catches the low row during the captured touch rally without losing hits', () => {
 const game = new Game(1571);
 for (const shot of [1, 2]) {
  const launch = inputs.find(entry => entry.shot === shot && entry.event === 'launch')?.ball;
  assert.ok(launch);
  assert.equal(launch.x, LAUNCH.x);
  assert.equal(launch.y, LAUNCH.y);
  assert.ok(game.selectBall('steel', 'large'));
  game.aim(LAUNCH.x + launch.vx, LAUNCH.y + launch.vy);
  assert.ok(game.fire());
  const ball = game.balls[0], hitsBefore = game.stats.hits;
  const moves = pointers.filter(entry => entry.phase === 'volley' && entry.shot === shot && entry.type !== 'pointerup');
  let next = 0, steps = 0, gap = 0;
  while (game.phase === 'volley' && steps < 900 / STEP) {
   while (next < moves.length && moves[next].flight <= game.stats.flight + STEP / 10) {
    game.movePaddle(moves[next++].paddle.target);
   }
   gap = Math.max(gap, game.progress.sinceHit + STEP);
   game.update(STEP);
   if (game.phase === 'volley') assert.equal(game.balls[0], ball);
   steps++;
  }
  assert.equal(game.phase, 'aim');
  assert.ok(ball.y - ball.r >= 692);
  const hits = game.stats.hits - hitsBefore;
  if (shot === 1) {
   assert.equal(hits, 63);
   assert.equal(steps, 9065);
  } else {
   assert.ok(hits >= 26, `second shot had ${hits} effective hits`);
   assert.ok(gap < 8, `second shot went ${gap} seconds without a hit`);
  }
 }
});
