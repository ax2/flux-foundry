import assert from 'node:assert/strict';
import {readFile, writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';

const read = async path => JSON.parse(await readFile(path, 'utf8'));
const baseline = 'docs/iterations/Stage-23/final';
const {routes} = await read('tests/fixtures/wind-continuations.json');
const certificates = new Map(routes.map(route => [`${route.matrix}/${route.index}`, route]));
const used = new Set();
const reports = [];
const crosswind = [];
const crosswindRows = new Set([390, 402]);
const expedition = [];
const expeditionRows = new Map([[17, 13], [41, 10], [50, 9], [51, 13], [54, 12], [70, 12]]);
const matrices = {
 'active-endurance.json': 12,
 'varied-endurance.json': 12,
 'endurance.json': 5,
 'multi-after.json': 14,
 'sparse-endurance.json': 0,
 'full-endurance.json': 0,
 'endless-audit-extended.json': 0,
};
const gap = row => row.maxNoHit ?? row.maxNoHitSeconds ?? row.progress?.maxNoHit;

for (const [matrix, ceiling] of Object.entries(matrices)) {
 const before = await read(`${baseline}/${matrix}`);
 const after = await read(`test-results/${matrix}`);
 const stage24 = await read(`docs/iterations/Stage-24/final/${matrix}`);
 assert.equal(after.rows.length, before.rows.length);
 assert.equal(after.rows.length, stage24.rows.length);
 const affected = [];
 for (const [index, old] of before.rows.entries()) {
  const row = after.rows[index];
  const previous = stage24.rows[index];
  const key = `${matrix}/${index}`;
  if (matrix === 'multi-after.json' && crosswindRows.has(index)) {
   assert.deepEqual(previous, old, key);
   for (const field of ['level', 'material', 'size', 'mirror', 'cadence', 'result']) {
    assert.equal(row[field], previous[field], `${key} ${field}`);
   }
   assert.equal(row.level, 22, key);
   assert.equal(row.result, 'won', key);
   assert.equal(row.shots.length, previous.shots.length, key);
   assert.ok(gap(row) < Math.min(12, gap(previous)), key);
   crosswind.push({index, before: previous, after: row});
   continue;
  }
  if (matrix === 'endless-audit-extended.json' && expeditionRows.has(index)) {
   assert.deepEqual(previous, old, key);
   for (const field of ['seed', 'material', 'size', 'policy', 'phase', 'wave']) {
    assert.equal(row[field], previous[field], `${key} ${field}`);
   }
   assert.equal(row.unresolved, false, key);
   assert.equal(row.shots.length, previous.shots.length, key);
   assert.ok(gap(row) < Math.min(expeditionRows.get(index), gap(previous)), key);
   expedition.push({index, before: previous, after: row});
   continue;
  }
  assert.deepEqual(row, previous, key);
  if (old.level !== 19 || ceiling === 0) {
   assert.deepEqual(row, old, key);
   continue;
  }
  for (const field of ['level', 'seed', 'angle', 'cadence', 'mirror', 'policy', 'material', 'size']) {
   assert.equal(row[field], old[field], `${key} ${field}`);
  }
  assert.notEqual(row.result ?? row.phase, 'volley', key);
  if ('natural' in row) assert.ok(row.natural, key);
  assert.ok(gap(row) < ceiling, `${key} no-hit interval`);
  if (matrix === 'multi-after.json') {
   assert.equal(row.result, 'won', key);
   assert.ok(row.shots.length <= 6, `${key} three-star budget`);
  }
  if (old.phase === 'won' && row.phase !== 'won') {
   const route = certificates.get(key);
   assert.ok(route, `${key} needs a natural continuation`);
   assert.equal(route.actualSeed, matrix.startsWith('varied') ? row.seed + 18 : row.seed);
   assert.equal(route.angle, row.angle);
   assert.equal(route.material, row.material);
   assert.equal(route.size, row.size);
   assert.equal(route.mirror, !!row.mirror);
   assert.equal(route.policy, row.policy ?? 'steer');
   assert.equal(route.cadence, row.cadence ?? 14);
   assert.equal(route.moves[0].steps, Math.round(row.seconds * 120));
   used.add(key);
  }
  affected.push({index, before: old, after: row});
 }
 if (matrix === 'multi-after.json') assert.ok(affected.reduce((sum, row) => sum + row.after.shots.length, 0) <= 96);
 reports.push({matrix, rows: after.rows.length, affected, before: before.summary, after: after.summary});
}
assert.equal(used.size, certificates.size);
assert.equal(crosswind.length, crosswindRows.size);
assert.equal(expedition.length, expeditionRows.size);
assert.equal(reports.reduce((sum, report) => sum + report.rows, 0), 6336);
assert.equal(reports.reduce((sum, report) => sum + report.affected.length, 0), 252);
for (const [name, expected] of Object.entries({
 'arena.png': '1ad2a8e14e4029eb64fdc29ad1f113985db8abac50e4f375f4bea45413735f54',
 'targets.png': '3d755f3ba04ba8a8620bd4c7bf5c0a809958df0d4e33c1cf3ec0b5f2e2fab44a',
})) {
 assert.equal(createHash('sha256').update(await readFile(`src/assets/${name}`)).digest('hex'), expected);
}
await writeFile('test-results/wind-balance-comparison.json', JSON.stringify({certifiedContinuations: used.size, crosswind, expedition, reports}, null, 2));
console.log(JSON.stringify(reports.map(({matrix, rows, affected, after}) => ({matrix, rows, affected: affected.length, after}))));
