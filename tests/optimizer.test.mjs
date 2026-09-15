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
  assert.equal(optimized.candidates.length, optimized.candidateSalaries.length ** 2);
  assert.ok(optimized.candidates.length > 2601);
  for (const candidate of optimized.candidates.slice(0, 5))
    assert.deepEqual(candidate.status, e.candidateStatus(candidate.result.corporation.corporateAfterTaxProfit));
  assert.equal(optimized.best, optimized.candidates[0]);
  for (let i = 1; i < optimized.candidates.length; i++) {
    assert.ok(optimized.candidates[i - 1].result.comparison.totalWealthIncreaseB >= optimized.candidates[i].result.comparison.totalWealthIncreaseB);
  }
});
