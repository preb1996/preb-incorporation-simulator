import test from 'node:test';
import assert from 'node:assert/strict';
import fixture from './golden-01-fixture.json' with { type: 'json' };
import { calculateFromForm, parseFormValues } from '../src/ui.ts';

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
    for (const person of ['husbandB', 'wifeB']) {
      for (let month = 1; month <= 12; month++) output[`${person}.salary.${month}`] = output[`${person}.monthlyExecutiveSalary.${month}`];
    }
  }
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
