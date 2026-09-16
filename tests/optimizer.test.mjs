import test from 'node:test';
import assert from 'node:assert/strict';
import * as e from '../src/index.ts';
import golden01 from './golden-01-fixture.json' with { type: 'json' };

function candidate(overrides = {}) {
  return {
    husbandMonthlySalary: 200000,
    wifeMonthlySalary: 200000,
    householdDisposableIncomeB: 4000000,
    corporateAfterTaxProfit: 1000000,
    totalWealthIncreaseB: 5000000,
    wealthDifference: 0,
    status: 'VALID',
    reason: null,
    ...overrides
  };
}

test('役員報酬候補はマスタ境界の前後を含み昇順で重複せず範囲内', () => {
  const candidates = e.salaryCandidatesWithExplicitBoundaries(e.socialInsuranceSalaryBoundaries());
  assert.deepEqual(candidates, [...candidates].sort((a, b) => a - b));
  assert.equal(new Set(candidates).size, candidates.length);
  assert.ok(candidates.includes(100999));
  assert.ok(candidates.includes(101000));
  assert.ok(candidates.includes(101001));
  assert.ok(candidates.every(value => value >= 100000 && value <= 600000));
});

test('optimizer候補入力は社会保険加入前月の元報酬を維持する', () => {
  const input = structuredClone(golden01.input);
  input.caseB.socialInsuranceMonths = [7, 8, 9, 10, 11, 12];

  const changed = e.optimizerCandidateInput(input, 150000, 160000);

  assert.deepEqual(
    changed.caseB.husband.monthlyExecutiveSalary.slice(0, 6),
    [300000, 300000, 300000, 300000, 300000, 300000]
  );
  assert.deepEqual(
    changed.caseB.wife.monthlyExecutiveSalary.slice(0, 6),
    [200000, 200000, 200000, 200000, 200000, 200000]
  );
  assert.deepEqual(
    changed.caseB.husband.monthlyExecutiveSalary.slice(6),
    [150000, 150000, 150000, 150000, 150000, 150000]
  );
  assert.deepEqual(
    changed.caseB.wife.monthlyExecutiveSalary.slice(6),
    [160000, 160000, 160000, 160000, 160000, 160000]
  );

  assert.deepEqual(
    input.caseB.husband.monthlyExecutiveSalary,
    golden01.input.caseB.husband.monthlyExecutiveSalary
  );
  assert.deepEqual(
    input.caseB.wife.monthlyExecutiveSalary,
    golden01.input.caseB.wife.monthlyExecutiveSalary
  );
});

test('optimizer tie-breakは仕様順で決定する', () => {
  const compare = e.compareOptimizationCandidates;

  assert.ok(compare(candidate({ totalWealthIncreaseB: 5000001 }), candidate()) < 0);
  assert.ok(compare(candidate({ corporateAfterTaxProfit: 1000001 }), candidate()) < 0);
  assert.ok(compare(candidate({ householdDisposableIncomeB: 4000001 }), candidate()) < 0);

  assert.ok(
    compare(
      candidate({ husbandMonthlySalary: 190000, wifeMonthlySalary: 200000 }),
      candidate()
    ) < 0
  );

  assert.ok(
    compare(
      candidate({ husbandMonthlySalary: 190000, wifeMonthlySalary: 210000 }),
      candidate({ husbandMonthlySalary: 200000, wifeMonthlySalary: 200000 })
    ) < 0
  );

  assert.equal(compare(candidate(), candidate()), 0);
});

test('VALID候補が存在すればWARNINGをbestにしない', () => {
  const valid = candidate({
    totalWealthIncreaseB: 4000000,
    status: 'VALID',
    reason: null
  });

  const warning = candidate({
    totalWealthIncreaseB: 9000000,
    corporateAfterTaxProfit: -1,
    status: 'WARNING',
    reason: 'NEGATIVE_CORPORATE_RETENTION'
  });

  const result = e.selectOptimizationCandidates([valid], [warning], 2, 1, 1);

  assert.equal(result.best.status, 'VALID');
  assert.equal(result.best.totalWealthIncreaseB, 4000000);
  assert.deepEqual(result.topCandidates.map(item => item.status), ['VALID', 'WARNING']);
});

test('VALID候補が0件ならWARNING最上位をbestにする', () => {
  const lower = candidate({
    totalWealthIncreaseB: 4000000,
    corporateAfterTaxProfit: -100,
    status: 'WARNING',
    reason: 'NEGATIVE_CORPORATE_RETENTION'
  });

  const higher = candidate({
    totalWealthIncreaseB: 5000000,
    corporateAfterTaxProfit: -50,
    status: 'WARNING',
    reason: 'NEGATIVE_CORPORATE_RETENTION'
  });

  const result = e.selectOptimizationCandidates([], [lower, higher], 2, 0, 2);

  assert.equal(result.best.status, 'WARNING');
  assert.equal(result.best.totalWealthIncreaseB, 5000000);
});

test('optimizerは全候補配列を返さず上位5件と件数だけ返す', () => {
  const input = structuredClone(golden01.input);
  input.caseB.socialInsuranceMonths = [];

  const salaries = e.salaryCandidatesWithExplicitBoundaries(e.socialInsuranceSalaryBoundaries());
  const optimized = e.optimize(input);

  assert.equal(optimized.evaluatedCount, salaries.length ** 2);
  assert.equal(optimized.evaluatedCount, optimized.validCount + optimized.warningCount);
  assert.equal(optimized.topCandidates.length, Math.min(5, optimized.evaluatedCount));
  assert.equal(Object.hasOwn(optimized, 'candidates'), false);
  assert.equal(Object.hasOwn(optimized.best, 'result'), false);
  assert.ok(optimized.best.status === 'VALID' || optimized.validCount === 0);
});

test('Golden-01固定期待値はoptimizer追加後も変わらない', () => {
  const result = e.calculateComparison(structuredClone(golden01.input));

  assert.equal(result.caseA.householdDisposableIncome, 6483170);
  assert.equal(result.caseB.householdDisposableIncome, 4775575);
  assert.equal(result.corporation.corporateAfterTaxProfit, 1590875);
  assert.equal(result.comparison.totalWealthIncreaseB, 6366450);
});
