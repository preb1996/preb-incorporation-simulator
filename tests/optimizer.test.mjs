import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/index.ts';
import golden01 from './golden-01-fixture.json' with { type: 'json' };

test('役員報酬候補はマスタ境界の前後を含み昇順で重複しない', () => {
  const candidates = e.salaryCandidatesWithExplicitBoundaries(e.socialInsuranceSalaryBoundaries());
  assert.deepEqual(candidates, [...candidates].sort((a, b) => a - b));
  assert.equal(new Set(candidates).size, candidates.length);
  assert.ok(candidates.includes(100999));
  assert.ok(candidates.includes(101000));
  assert.ok(candidates.includes(101001));
  assert.ok(candidates.every(value => value >= 100000 && value <= 600000));
});

test('optimizerはcalculateComparisonを候補ごとに再利用し候補結果を順位付けする', () => {
  const input = structuredClone(golden01.input);
  input.caseB.socialInsuranceMonths = [];
  const optimized = e.optimize(input);
  assert.equal(optimized.evaluatedCount, optimized.validCount + optimized.warningCount);
  assert.equal(optimized.topCandidates.length, Math.min(5, optimized.evaluatedCount));
  assert.ok(optimized.evaluatedCount > 2601);
  assert.ok(optimized.topCandidates.every(candidate => ['VALID', 'WARNING'].includes(candidate.status)));
  assert.ok(optimized.best.status === 'VALID' || optimized.validCount === 0);
  for (let i = 1; i < optimized.topCandidates.length; i++)
    assert.ok(optimized.topCandidates[i - 1].totalWealthIncreaseB >= optimized.topCandidates[i].totalWealthIncreaseB);
});
