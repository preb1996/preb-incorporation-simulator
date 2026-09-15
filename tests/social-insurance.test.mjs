import test from 'node:test';
import assert from 'node:assert/strict';
import m from '../masters/social-insurance-monthly-remuneration-grades.json' with {type:'json'};
import * as e from '../src/index.ts';

const code=expected=>error=>error instanceof e.CalculationError&&error.code===expected;

test('公式表の件数・上下端・別体系',()=>{
  assert.equal(m.healthInsuranceGrades.length,50);
  assert.equal(m.employeesPensionGrades.length,32);
  assert.deepEqual(m.healthInsuranceGrades[0],{...m.healthInsuranceGrades[0],grade:1,remunerationLowerInclusive:null,remunerationUpperExclusive:63000,standardMonthlyRemuneration:58000});
  assert.equal(m.healthInsuranceGrades.at(-1).remunerationLowerInclusive,1355000);
  assert.equal(m.healthInsuranceGrades.at(-1).remunerationUpperExclusive,null);
  assert.equal(m.healthInsuranceGrades.at(-1).standardMonthlyRemuneration,1390000);
  assert.equal(m.employeesPensionGrades[0].remunerationLowerInclusive,null);
  assert.equal(m.employeesPensionGrades[0].remunerationUpperExclusive,93000);
  assert.equal(m.employeesPensionGrades[0].standardMonthlyRemuneration,88000);
  assert.equal(m.employeesPensionGrades.at(-1).remunerationLowerInclusive,635000);
  assert.equal(m.employeesPensionGrades.at(-1).remunerationUpperExclusive,null);
  assert.equal(m.employeesPensionGrades.at(-1).standardMonthlyRemuneration,650000);
});

test('公式全等級の料額列を率・標準報酬と照合',()=>{
  for(const g of m.healthInsuranceGrades){
    for(const [key,bps] of [['healthInsurance',993],['nursingCareInsurance',162],['healthPlusNursingCareOfficial',1155],['childrenSupport',23]]){
      assert.equal(g[key].fullPremiumHundredthsYen,g.standardMonthlyRemuneration*bps/100);
      assert.equal(g[key].officialHalfPremiumHundredthsYen,g[key].fullPremiumHundredthsYen/2);
    }
  }
  for(const g of m.employeesPensionGrades){
    assert.equal(g.employeesPension.fullPremiumHundredthsYen,g.standardMonthlyRemuneration*1830/100);
    assert.equal(g.employeesPension.officialHalfPremiumHundredthsYen,g.employeesPension.fullPremiumHundredthsYen/2);
  }
});

test('公式PDFの代表行を固定値照合',()=>{
  const h1=m.healthInsuranceGrades[0],h22=m.healthInsuranceGrades[21],h50=m.healthInsuranceGrades[49];
  assert.deepEqual([h1.healthInsurance.fullPremiumHundredthsYen,h1.healthPlusNursingCareOfficial.fullPremiumHundredthsYen,h1.childrenSupport.fullPremiumHundredthsYen],[575940,669900,13340]);
  assert.deepEqual([h22.healthInsurance.fullPremiumHundredthsYen,h22.healthPlusNursingCareOfficial.fullPremiumHundredthsYen,h22.childrenSupport.fullPremiumHundredthsYen],[2979000,3465000,69000]);
  assert.deepEqual([h50.healthInsurance.fullPremiumHundredthsYen,h50.healthPlusNursingCareOfficial.fullPremiumHundredthsYen,h50.childrenSupport.fullPremiumHundredthsYen],[13802700,16054500,319700]);
  assert.equal(m.employeesPensionGrades[0].employeesPension.fullPremiumHundredthsYen,1610400);
  assert.equal(m.employeesPensionGrades.at(-1).employeesPension.fullPremiumHundredthsYen,11895000);
});

for(const [hundredths,expected,label] of [[1234549,12345,'.49'],[1234550,12345,'.50'],[1234551,12346,'.51']])
  test(`給与天引き本人負担 ${label}`,()=>assert.equal(e.roundEmployeePayrollHundredths(hundredths),expected));

test('2名の事業所総額・本人合計・会社負担',()=>{
  const result=e.calculateMonthlySocialInsurance([{monthlyExecutiveSalary:134000,age:57},{monthlyExecutiveSalary:170000,age:35}],2026,4);
  for(const system of Object.values(result.systems)){
    assert.equal(system.officeYen-system.employeeYen,system.employerYen);
    assert.ok(system.employerYen>=0);
  }
  assert.notEqual(result.systems.healthInsurance.employerYen,result.systems.healthInsurance.employeeYen);
  assert.notEqual(result.systems.childrenSupport.employerYen,result.systems.childrenSupport.employeeYen);
  assert.equal(result.total.officeYen-result.total.employeeYen,result.total.employerYen);
});

test('本人負担を2倍して会社負担を生成していない',()=>{
  const result=e.calculateMonthlySocialInsurance([{monthlyExecutiveSalary:134000,age:57},{monthlyExecutiveSalary:170000,age:35}],2026,4);
  assert.equal(result.systems.healthInsurance.officeYen,30187);
  assert.equal(result.systems.healthInsurance.employeeYen,15093);
  assert.equal(result.systems.healthInsurance.employerYen,15094);
});

test('介護年齢と子ども・子育て支援金の適用月',()=>{
  const people=[{monthlyExecutiveSalary:300000,age:40},{monthlyExecutiveSalary:300000,age:65}];
  const march=e.calculateMonthlySocialInsurance(people,2026,3),april=e.calculateMonthlySocialInsurance(people,2026,4);
  assert.ok(march.systems.nursingCare.officeYen>0);
  assert.equal(march.perPerson[1].nursingCare.employeeYen,0);
  assert.equal(march.systems.childrenSupport.officeYen,0);
  assert.ok(april.systems.childrenSupport.officeYen>0);
});

test('2026年1・2月は令和7年度表、3月から令和8年度表',()=>{
  const people=[{monthlyExecutiveSalary:300000,age:57},{monthlyExecutiveSalary:200000,age:35}];
  const jan=e.calculateMonthlySocialInsurance(people,2026,1),feb=e.calculateMonthlySocialInsurance(people,2026,2),mar=e.calculateMonthlySocialInsurance(people,2026,3);
  assert.equal(jan.systems.healthInsurance.officeYen,50150);
  assert.deepEqual(jan.systems,feb.systems);
  assert.equal(mar.systems.healthInsurance.officeYen,49650);
  assert.equal(jan.systems.childrenSupport.officeYen,0);
  assert.equal(mar.systems.childrenSupport.officeYen,0);
});

test('初年度は資格取得月以降だけを月別公式率で合算',()=>{
 const result=e.calculateInitialYearSocialInsurance([{age:57,qualificationDate:'2026-07-20',monthlyExecutiveSalaryActuals:[0,0,0,0,0,0,300000,300000,300000,300000,300000,300000]},{age:57,qualificationDate:'2026-08-01',monthlyExecutiveSalaryActuals:[0,0,0,0,0,0,0,200000,200000,200000,200000,200000]}]);
 assert.deepEqual(result.qualificationMonths,[7,8]);assert.equal(result.monthly.length,6);assert.deepEqual(result.monthly[0].activeIndexes,[0]);assert.deepEqual(result.monthly[1].activeIndexes,[0,1]);assert.equal(result.employeeByPerson[0],270720);assert.equal(result.employeeByPerson[1],150400);assert.equal(result.employeeTotal,421120);assert.equal(result.employerTotal,421120);
});

for(const [system,grades] of [['HEALTH',m.healthInsuranceGrades],['PENSION',m.employeesPensionGrades]]){
  for(const grade of grades.slice(1)){
    const boundary=grade.remunerationLowerInclusive;
    test(`${system} 全境界 ${boundary}: -1 / 境界 / +1`,()=>{
      assert.equal(e.remunerationGrade(boundary-1,system).grade,grade.grade-1);
      assert.equal(e.remunerationGrade(boundary,system).grade,grade.grade);
      assert.equal(e.remunerationGrade(boundary+1,system).grade,grade.grade);
    });
  }
}
