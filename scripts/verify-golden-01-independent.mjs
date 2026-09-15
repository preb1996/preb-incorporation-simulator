// Independent arithmetic oracle: no import from src/ or masters/.
// Rates and formula references are repeated deliberately so an engine defect
// cannot rewrite the expected values. Verified against the cited sources on 2026-09-15.
const floor=(value,unit)=>Math.floor(value/unit)*unit;
const incomeTaxBase=taxable=>taxable<1950000?taxable*.05:taxable<3300000?taxable*.1-97500:taxable*.2-427500;
const incomeTax=(income,basic,social)=>{const taxable=floor(Math.max(0,income-basic-social),1000),base=incomeTaxBase(taxable),reconstruction=Math.floor(base*.021);return {taxable,base,reconstruction,payable:floor(base+reconstruction,100)};};
const resident=(income,social)=>{const taxable=floor(Math.max(0,income-430000-social),1000),adjustmentBase=taxable<=2000000?Math.min(50000,taxable):Math.max(50000,50000-(taxable-2000000)),municipalAdjustment=adjustmentBase*.04,prefecturalAdjustment=adjustmentBase*.01,municipal=floor(taxable*.077-municipalAdjustment+2800,100),prefectural=floor(taxable*.02-prefecturalAdjustment+1500,100);return {taxable,municipalAdjustment,prefecturalAdjustment,total:municipal+prefectural+1000};};
const nhiBase=5350000-430000+(2350000-430000);
const nhi={medical:Math.min(670000,floor(50591*2+nhiBase*.0883,10)),support:Math.min(260000,floor(15784*2+nhiBase*.0258,10)),nursing:Math.min(170000,floor(16120*2+nhiBase*.0234,10)),children:Math.min(30000,floor(1771*2+92*2+nhiBase*.0026,10))};
nhi.total=nhi.medical+nhi.support+nhi.nursing+nhi.children;
const pension=17920*12;
const aHIncome=incomeTax(5350000,670000,nhi.total+pension),aWIncome=incomeTax(2350000,620000,pension);
const aHResident=resident(5350000,nhi.total+pension),aWResident=resident(2350000,pension);
const aHBusiness=floor(floor(6000000-2900000,1000)*.05,100),aWBusiness=floor(floor(3000000-2900000,1000)*.05,100);
const aHBeforeNhi=6000000-aHIncome.payable-aHResident.total-aHBusiness-pension;
const aWBeforeNhi=3000000-aWIncome.payable-aWResident.total-aWBusiness-pension;
const householdA=aHBeforeNhi+aWBeforeNhi-nhi.total;

const currentEmployee={husband:2*(15045+2385+27450)+(14895+2430+27450)+9*(14895+2430+345+27450),wife:2*(10030+1590+18300)+(9930+1620+18300)+9*(9930+1620+230+18300)};
const priorEmployee={husband:12*(15045+2385+27450),wife:12*(10030+1590+18300)};
const bHIncome=incomeTax(2440000,620000,currentEmployee.husband),bWIncome=incomeTax(1600000,620000,currentEmployee.wife);
const bHResident=resident(2440000,priorEmployee.husband),bWResident=resident(1600000,priorEmployee.wife);
const bHDisposable=3600000-bHIncome.payable-bHResident.total-currentEmployee.husband,bWDisposable=2400000-bWIncome.payable-bWResident.total-currentEmployee.wife;
const householdB=bHDisposable+bWDisposable;
const employerSocialInsurance=currentEmployee.husband+currentEmployee.wife;
const corporateIncomeBeforeTax=12000000-3000000-6000000-employerSocialInsurance;
const corporationTax=floor(floor(corporateIncomeBeforeTax,1000)*.15,100);
const corporationTaxBase=floor(corporationTax,1000);
const prefecturalCorporateIncome=floor(corporationTaxBase*.01,100),municipalCorporateIncome=floor(corporationTaxBase*.06,100);
const corporateEnterpriseTax=floor(floor(corporateIncomeBeforeTax,1000)*.035,100);
const specialCorporateEnterpriseTax=floor(corporateEnterpriseTax*.37,100);
const corporateLocalTax=prefecturalCorporateIncome+21000+municipalCorporateIncome+50000;
const corporateAfterTaxProfit=corporateIncomeBeforeTax-corporationTax-corporateLocalTax-corporateEnterpriseTax-specialCorporateEnterpriseTax;

process.stdout.write(JSON.stringify({
 caseA:{husband:{incomeTax:aHIncome.base,reconstructionTax:aHIncome.reconstruction,incomeTaxPayable:aHIncome.payable,residentTax:aHResident.total,municipalAdjustmentDeduction:aHResident.municipalAdjustment,prefecturalAdjustmentDeduction:aHResident.prefecturalAdjustment,nationalPension:pension,individualBusinessTax:aHBusiness,consumptionTax:0,disposableIncomeBeforeNhi:aHBeforeNhi},wife:{incomeTax:aWIncome.base,reconstructionTax:aWIncome.reconstruction,incomeTaxPayable:aWIncome.payable,residentTax:aWResident.total,municipalAdjustmentDeduction:aWResident.municipalAdjustment,prefecturalAdjustmentDeduction:aWResident.prefecturalAdjustment,nationalPension:pension,individualBusinessTax:aWBusiness,consumptionTax:0,disposableIncomeBeforeNhi:aWBeforeNhi},nationalHealthInsurance:nhi.total,householdDisposableIncome:householdA},
 caseB:{husband:{salaryIncome:2440000,incomeTax:bHIncome.base,reconstructionTax:bHIncome.reconstruction,incomeTaxPayable:bHIncome.payable,residentTax:bHResident.total,employeeSocialInsurance:currentEmployee.husband,disposableIncome:bHDisposable},wife:{salaryIncome:1600000,incomeTax:bWIncome.base,reconstructionTax:bWIncome.reconstruction,incomeTaxPayable:bWIncome.payable,residentTax:bWResident.total,employeeSocialInsurance:currentEmployee.wife,disposableIncome:bWDisposable},healthInsurance:298400,nursingCare:48450,childrenSupport:5175,employeesPension:549000,employeeSocialInsurance:currentEmployee.husband+currentEmployee.wife,employerSocialInsurance,householdDisposableIncome:householdB},
 corporation:{incomeBeforeTax:corporateIncomeBeforeTax,corporationTax,prefecturalCorporateTax:prefecturalCorporateIncome+21000,municipalCorporateTax:municipalCorporateIncome+50000,corporateEnterpriseTax,specialCorporateEnterpriseTax,consumptionTax:0,corporateAfterTaxProfit},
 totalWealthIncreaseB:householdB+corporateAfterTaxProfit
}));
