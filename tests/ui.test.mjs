import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from './golden-01-fixture.json' with { type: 'json' };
import { applyMonthlySalary, calculateFromForm, clearSavedFormValues, loadFormValues, optimizeFromForm, parseFormValues, renderComparison, renderOptimization, saveFormValues } from '../src/ui.ts';

function flatten(value, prefix, output = {}) {
  if (Array.isArray(value)) value.forEach((item, index) => flatten(item, `${prefix}.${index + 1}`, output));
  else if (value !== null && typeof value === 'object') Object.entries(value).forEach(([key, item]) => flatten(item, `${prefix}.${key}`, output));
  else output[prefix] = String(value);
  return output;
}

function formValues(input) {
  const output = { householdNhiPayer: input.householdNhiPayer };
  flatten(input.caseA.husband, 'husbandA', output);
  flatten(input.caseA.wife, 'wifeA', output);
  flatten(input.caseB.husband, 'husbandB', output);
  flatten(input.caseB.wife, 'wifeB', output);
  flatten(input.corporation, 'corporation', output);
  for (const person of ['husbandA', 'wifeA', 'husbandB', 'wifeB']) {
    for (const key of ['totalIncome', 'deductionsExcludingBasic', 'personalDeductionDifferenceTotal', 'exemptionStatus']) {
      output[`${person}.resident.${key}`] = output[`${person}.residentReference.${key}`];
    }
  }
  for (const person of ['husbandB', 'wifeB']) {
    for (let month = 1; month <= 12; month++) output[`${person}.salary.${month}`] = output[`${person}.monthlyExecutiveSalary.${month}`];
  }
  output['caseB.socialInsuranceStartMonth'] = String(Math.min(...input.caseB.socialInsuranceMonths));
  output['husbandA.consumptionTax'] = input.caseA.husband.consumptionTax.status;
  output['wifeA.consumptionTax'] = input.caseA.wife.consumptionTax.status;
  output['corporation.consumptionTax'] = input.corporation.consumptionTax.status;
  return output;
}

test('UI adapter delegates complete input to the frozen engine', () => {
  const outcome = calculateFromForm(formValues(fixture.input));
  assert.equal(outcome.error, null);
  assert.equal(outcome.result.comparison.totalWealthIncreaseB, 6366450);
  assert.equal(parseFormValues(formValues(fixture.input)).corporation.sales, 12000000);
});

test('UI adapter reports incomplete input instead of calculating', () => {
  const outcome = calculateFromForm({});
  assert.equal(outcome.result, null);
  assert.match(outcome.error, /必須/);
});

test('UI adapter always uses January through December for social insurance', () => {
  const values = formValues(fixture.input);
  values['caseB.socialInsuranceStartMonth'] = '7';
  assert.deepEqual(parseFormValues(values).caseB.socialInsuranceMonths, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  delete values['caseB.socialInsuranceStartMonth'];
  assert.deepEqual(parseFormValues(values).caseB.socialInsuranceMonths, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test('UI adapter accepts supported consumption-tax modes without defaulting to EXEMPT', () => {
  const values = formValues(fixture.input);
  values['husbandA.consumptionTax'] = 'GENERAL';
  values['husbandA.consumptionTax.output'] = '500000';
  values['husbandA.consumptionTax.deductibleInput'] = '320000';
  values['wifeA.consumptionTax'] = 'SPECIAL_20_PERCENT';
  values['wifeA.consumptionTax.output'] = '200000';
  values['wifeA.consumptionTax.eligible'] = 'true';
  values['corporation.consumptionTax'] = 'SIMPLIFIED';
  values['corporation.consumptionTax.output'] = '800000';
  values['corporation.consumptionTax.deemedPurchaseBps'] = '5000';
  const parsed = parseFormValues(values);
  assert.deepEqual(parsed.caseA.husband.consumptionTax, { status: 'GENERAL', output: 500000, deductibleInput: 320000 });
  assert.deepEqual(parsed.caseA.wife.consumptionTax, { status: 'SPECIAL_20_PERCENT', output: 200000, eligible: true });
  assert.deepEqual(parsed.corporation.consumptionTax, { status: 'SIMPLIFIED', output: 800000, deemedPurchaseBps: 5000 });
});


test('UI adapter rejects corporation-only unsupported consumption-tax modes', () => {
  const values = formValues(fixture.input);
  values['corporation.consumptionTax'] = 'SPECIAL_20_PERCENT';
  values['corporation.consumptionTax.output'] = '100000';
  values['corporation.consumptionTax.eligible'] = 'true';
  assert.throws(() => parseFormValues(values), /消費税ステータスが不正/);
});

test('UI adapter exposes executive salary optimization summary', () => {
  const outcome = optimizeFromForm(formValues(fixture.input));
  assert.equal(outcome.error, null);
  assert.equal(outcome.result.topCandidates.length, 5);
  assert.ok(outcome.result.evaluatedCount > 2601);
  assert.ok(outcome.result.best.status === 'VALID' || outcome.result.validCount === 0);
  assert.equal(Object.hasOwn(outcome.result.best, 'result'), false);
});

test('12か月反映は全月を揃え、個別修正を保持できる', () => {
  const applied = applyMonthlySalary({ 'husbandB.salary.1': '100000' }, 'husbandB', '300000');
  assert.deepEqual(Array.from({ length: 12 }, (_, i) => applied[`husbandB.salary.${i + 1}`]), Array(12).fill('300000'));
  applied['husbandB.salary.4'] = '325000';
  assert.equal(applied['husbandB.salary.4'], '325000');
});

test('localStorage adapter saves, restores, initializes, and tolerates failures', () => {
  const data = new Map();
  const storage = {
    setItem: (key, value) => data.set(key, value),
    getItem: key => data.get(key) ?? null,
    removeItem: key => data.delete(key)
  };
  const values = { 'husbandB.salary.1': '300000' };
  assert.equal(saveFormValues(values, storage), true);
  assert.deepEqual(loadFormValues(storage), values);
  assert.equal(clearSavedFormValues(storage), true);
  assert.equal(loadFormValues(storage), null);
  const failing = { setItem: () => { throw new Error('storage unavailable'); }, getItem: () => { throw new Error('storage unavailable'); }, removeItem: () => { throw new Error('storage unavailable'); } };
  assert.equal(saveFormValues(values, failing), false);
  assert.equal(loadFormValues(failing), null);
  assert.equal(clearSavedFormValues(failing), false);
});

test('通常結果の表示HTMLは社会保険・留保・純資産指標を区別する', () => {
  const outcome = calculateFromForm(formValues(fixture.input));
  assert.equal(outcome.error, null);
  const html = renderComparison(outcome.result);
  for (const label of ['夫 本人負担社会保険', '妻 本人負担社会保険', '会社負担社会保険', '法人税引後留保', '世帯＋法人純資産増加', 'CASE-Aとの差']) {
    assert.match(html, new RegExp(label));
  }
  assert.doesNotMatch(html, /法人税引後留保[^<]*手取り/);
  assert.match(html, /個人の所得ではありません/);
});

test('Optimizer表示HTMLは夫婦報酬、Top 5、VALIDを含む', () => {
  const outcome = optimizeFromForm(formValues(fixture.input));
  assert.equal(outcome.error, null);
  const html = renderOptimization(outcome.result);
  for (const label of ['推奨 夫 月額役員報酬', '推奨 妻 月額役員報酬', 'Top 5', 'VALID']) {
    assert.match(html, new RegExp(label));
  }
});

test('Optimizer表示HTMLはWARNINGと理由を含む', () => {
  const warning = {
    best: {
      husbandMonthlySalary: 100000,
      wifeMonthlySalary: 100000,
      householdDisposableIncomeB: 1,
      corporateAfterTaxProfit: -1,
      totalWealthIncreaseB: 0,
      wealthDifference: -1,
      status: 'WARNING',
      reason: 'NEGATIVE_CORPORATE_RETENTION'
    },
    topCandidates: [],
    evaluatedCount: 1,
    validCount: 0,
    warningCount: 1
  };
  const html = renderOptimization(warning);
  assert.match(html, /WARNING/);
  assert.match(html, /法人税引後留保がマイナスです/);
});
