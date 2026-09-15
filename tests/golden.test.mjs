import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import fixtures from './golden-fixtures.json' with { type:'json' };
import golden01 from './golden-01-fixture.json' with { type:'json' };
import * as e from '../src/index.ts';
for(const f of fixtures)test(f.id,()=>{
 assert.ok(f.source&&f.verifiedAt&&f.verificationNote);
 const i=f.input,x=f.expected;
 switch(f.operation){
 case 'business':assert.deepEqual(e.businessIncome(i.sales,i.expenses,i.blue),x);break;
 case 'reconstruction':assert.deepEqual(e.reconstructionTax(i.base),x);break;
 case 'adjustment':{const a=e.adjustmentDeduction(i.taxable,i.difference,i.totalIncome);assert.equal(a.base,x.base);assert.equal(e.exactInteger(a.municipal),x.municipal);assert.equal(e.exactInteger(a.prefectural),x.prefectural);break;}
 case 'loss':{const tax=e.corporationTaxRaw(i.income);const local=e.corporateLocalTaxRaw(i.capital,tax,i.months);assert.equal(e.exactInteger(tax),x.corporationTax);assert.equal(e.exactInteger(local.prefecturalPerCapita),x.prefecturalPerCapita);assert.equal(e.exactInteger(local.municipalPerCapita),x.municipalPerCapita);break;}
 case 'short':{const a=e.corporateEnterpriseTaxRaw(i.income,i.months);for(const key of ['threshold1','threshold2'])assert.deepEqual(a[key],{numerator:BigInt(x[key][0]),denominator:BigInt(x[key][1])});for(const key of ['baseCorporateEnterpriseTax','specialCorporateEnterpriseTax'])assert.equal(e.exactInteger(a[key]),x[key]);break;}
 case 'ideco':assert.deepEqual({novFirst:e.idecoLimit(11,'FIRST'),decFirst:e.idecoLimit(12,'FIRST'),novSecond:e.idecoLimit(11,'SECOND'),decSecond:e.idecoLimit(12,'SECOND'),annualFirst:e.annualIdeco(Array(12).fill(i.requested),null).annual,annualSecond:e.annualIdeco(Array(12).fill(i.requested),1).annual},x);break;
 default:assert.fail('Unrecognized fixture');
 }
});
function golden01Summary(result){
 const a=result.caseA,b=result.caseB,c=result.corporation;
 return {
  'caseA.incomeTax':a.husband.incomeTax.incomeTax+a.wife.incomeTax.incomeTax,
  'caseA.reconstructionTax':a.husband.incomeTax.reconstructionTax+a.wife.incomeTax.reconstructionTax,
  'caseA.incomeTaxPayable':a.husband.incomeTax.payable+a.wife.incomeTax.payable,
  'caseA.residentTax':a.husband.resident.total+a.wife.resident.total,
  'caseA.adjustmentDeduction':a.husband.resident.municipalAdjustmentDeduction+a.husband.resident.prefecturalAdjustmentDeduction+a.wife.resident.municipalAdjustmentDeduction+a.wife.resident.prefecturalAdjustmentDeduction,
  'caseA.nationalHealthInsurance':a.householdNationalHealthInsurance.total,
  'caseA.nationalPension':a.husband.nationalPension+a.wife.nationalPension,
  'caseA.individualBusinessTax':a.husband.individualBusinessTax.tax+a.wife.individualBusinessTax.tax,
  'caseA.consumptionTax':a.husband.consumptionTax.payable+a.wife.consumptionTax.payable,
  'caseA.householdDisposableIncome':a.householdDisposableIncome,
  'caseB.salaryIncome':b.husband.salaryIncome+b.wife.salaryIncome,
  'caseB.incomeTax':b.husband.incomeTax.incomeTax+b.wife.incomeTax.incomeTax,
  'caseB.reconstructionTax':b.husband.incomeTax.reconstructionTax+b.wife.incomeTax.reconstructionTax,
  'caseB.incomeTaxPayable':b.husband.incomeTax.payable+b.wife.incomeTax.payable,
  'caseB.residentTax':b.husband.resident.total+b.wife.resident.total,
  'caseB.healthInsurance':b.socialInsurance.perPerson[0].healthInsurance+b.socialInsurance.perPerson[1].healthInsurance,
  'caseB.employeesPension':b.socialInsurance.perPerson[0].employeesPension+b.socialInsurance.perPerson[1].employeesPension,
  'caseB.nursingCare':b.socialInsurance.perPerson[0].nursingCare+b.socialInsurance.perPerson[1].nursingCare,
  'caseB.childrenSupport':b.socialInsurance.perPerson[0].childrenSupport+b.socialInsurance.perPerson[1].childrenSupport,
  'caseB.employeeSocialInsurance':b.socialInsurance.employeeTotal,
  'caseB.employerSocialInsurance':b.socialInsurance.employerTotal,
  'caseB.householdDisposableIncome':b.householdDisposableIncome,
  'corporation.incomeBeforeTax':c.corporateIncomeBeforeTax,
  'corporation.corporationTax':c.corporationTax.tax,
  'corporation.prefecturalCorporateTax':c.corporateLocalTax.prefecturalTotal,
  'corporation.municipalCorporateTax':c.corporateLocalTax.municipalTotal,
  'corporation.corporateEnterpriseTax':c.corporateEnterpriseTax.baseCorporateEnterpriseTax,
  'corporation.specialCorporateEnterpriseTax':c.corporateEnterpriseTax.specialCorporateEnterpriseTax,
  'corporation.consumptionTax':c.consumptionTax.payable,
  'corporation.corporateAfterTaxProfit':c.corporateAfterTaxProfit,
  totalWealthIncreaseB:result.comparison.totalWealthIncreaseB
 };
}
test('GOLDEN-01 — 完全入力・独立期待値',()=>{
 assert.deepEqual(Object.keys(golden01.evidence).sort(),Object.keys(golden01.expected).sort());
 for(const evidence of Object.values(golden01.evidence))for(const key of ['source','formula','rounding','verifiedAt'])assert.ok(evidence[key]);
 const oracle=spawnSync(process.execPath,[fileURLToPath(new URL('../scripts/verify-golden-01-independent.mjs',import.meta.url))],{encoding:'utf8'});
 assert.equal(oracle.status,0,oracle.stderr);const independent=JSON.parse(oracle.stdout);
 const independentSummary={
  'caseA.incomeTax':independent.caseA.husband.incomeTax+independent.caseA.wife.incomeTax,'caseA.reconstructionTax':independent.caseA.husband.reconstructionTax+independent.caseA.wife.reconstructionTax,'caseA.incomeTaxPayable':independent.caseA.husband.incomeTaxPayable+independent.caseA.wife.incomeTaxPayable,'caseA.residentTax':independent.caseA.husband.residentTax+independent.caseA.wife.residentTax,'caseA.adjustmentDeduction':independent.caseA.husband.municipalAdjustmentDeduction+independent.caseA.husband.prefecturalAdjustmentDeduction+independent.caseA.wife.municipalAdjustmentDeduction+independent.caseA.wife.prefecturalAdjustmentDeduction,'caseA.nationalHealthInsurance':independent.caseA.nationalHealthInsurance,'caseA.nationalPension':independent.caseA.husband.nationalPension+independent.caseA.wife.nationalPension,'caseA.individualBusinessTax':independent.caseA.husband.individualBusinessTax+independent.caseA.wife.individualBusinessTax,'caseA.consumptionTax':0,'caseA.householdDisposableIncome':independent.caseA.householdDisposableIncome,
  'caseB.salaryIncome':independent.caseB.husband.salaryIncome+independent.caseB.wife.salaryIncome,'caseB.incomeTax':independent.caseB.husband.incomeTax+independent.caseB.wife.incomeTax,'caseB.reconstructionTax':independent.caseB.husband.reconstructionTax+independent.caseB.wife.reconstructionTax,'caseB.incomeTaxPayable':independent.caseB.husband.incomeTaxPayable+independent.caseB.wife.incomeTaxPayable,'caseB.residentTax':independent.caseB.husband.residentTax+independent.caseB.wife.residentTax,'caseB.healthInsurance':independent.caseB.healthInsurance,'caseB.employeesPension':independent.caseB.employeesPension,'caseB.nursingCare':independent.caseB.nursingCare,'caseB.childrenSupport':independent.caseB.childrenSupport,'caseB.employeeSocialInsurance':independent.caseB.employeeSocialInsurance,'caseB.employerSocialInsurance':independent.caseB.employerSocialInsurance,'caseB.householdDisposableIncome':independent.caseB.householdDisposableIncome,
  'corporation.incomeBeforeTax':independent.corporation.incomeBeforeTax,'corporation.corporationTax':independent.corporation.corporationTax,'corporation.prefecturalCorporateTax':independent.corporation.prefecturalCorporateTax,'corporation.municipalCorporateTax':independent.corporation.municipalCorporateTax,'corporation.corporateEnterpriseTax':independent.corporation.corporateEnterpriseTax,'corporation.specialCorporateEnterpriseTax':independent.corporation.specialCorporateEnterpriseTax,'corporation.consumptionTax':independent.corporation.consumptionTax,'corporation.corporateAfterTaxProfit':independent.corporation.corporateAfterTaxProfit,totalWealthIncreaseB:independent.totalWealthIncreaseB
 };
 assert.deepEqual(independentSummary,golden01.expected);
 const result=e.calculateComparison(golden01.input);
 assert.deepEqual(result.caseA.nhiDeductionAllocation,{husband:1069550,wife:0});
 assert.deepEqual(golden01Summary(result),golden01.expected);
});
test('GOLDEN-06 — 標準報酬月額の全境界',async()=>{const {default:m}=await import('../masters/social-insurance-monthly-remuneration-grades.json',{with:{type:'json'}});for(const [system,grades] of [['HEALTH',m.healthInsuranceGrades],['PENSION',m.employeesPensionGrades]])for(const g of grades.slice(1)){const b=g.remunerationLowerInclusive;assert.equal(e.remunerationGrade(b-1,system).grade,g.grade-1);assert.equal(e.remunerationGrade(b,system).grade,g.grade);assert.equal(e.remunerationGrade(b+1,system).grade,g.grade);}});
