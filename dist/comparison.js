import { master } from "./master.js";
import { block, integer, yen, sum, subtract, exactInteger, CalculationError } from "./core.js";
import { businessIncome, incomeTaxBasicDeduction, baseIncomeTax, reconstructionTax, salaryIncomeRaw, residentBasicDeduction2026, residentTax2026 } from "./personal.js";
import { householdNhi2026, householdNhiDeductionAllocation, nationalPension, calculateMonthlySocialInsurance } from "./contributions.js";
import { individualBusinessTax2026, consumptionTax2026, corporationTax2026, corporateLocalTax2026, corporateEnterpriseTax2026 } from "./corporate.js";
import { truncateIncomeTaxTaxableBase } from "./rounding.js";
/** Aggregation of finalized externally supplied components, NOT a complete tax simulation. */
export function compareFinalizedAmounts(householdA, husbandB, wifeB, corporateAfterTaxProfit) {
    for (const n of [householdA, husbandB, wifeB, corporateAfterTaxProfit])
        integer(n, 'finalizedAmount', true);
    const householdB = exactInteger(sum([yen(husbandB), yen(wifeB)]));
    const wealthB = exactInteger(sum([yen(householdB), yen(corporateAfterTaxProfit)]));
    return { householdDisposableIncomeA: householdA, householdDisposableIncomeB: householdB, disposableIncomeDifference: exactInteger(subtract(yen(householdB), yen(householdA))), corporateAfterTaxProfit, totalWealthIncreaseA: householdA, totalWealthIncreaseB: wealthB, wealthDifference: exactInteger(subtract(yen(wealthB), yen(householdA))) };
}
export function householdDisposableIncomeCaseA(husbandBeforeNhi, wifeBeforeNhi, householdNationalHealthInsurance) {
    integer(husbandBeforeNhi, 'husbandBeforeNhi', true);
    integer(wifeBeforeNhi, 'wifeBeforeNhi', true);
    integer(householdNationalHealthInsurance, 'householdNationalHealthInsurance');
    return exactInteger(subtract(sum([yen(husbandBeforeNhi), yen(wifeBeforeNhi)]), yen(householdNationalHealthInsurance)));
}
/** MVP has no complete cash-flow model; a negative after-tax profit is a warning. */
export function candidateStatus(corporateAfterTaxProfit) {
    integer(corporateAfterTaxProfit, 'profit', true);
    if (corporateAfterTaxProfit < 0)
        return { status: 'WARNING', reason: 'NEGATIVE_CORPORATE_RETENTION' };
    return { status: 'VALID', reason: null };
}
/** Base 51x51 grid only. Full production optimizer requires every grade boundary. */
export function baseSalaryPairs() {
    const m = master.optimizer.values;
    const pairs = [];
    for (let h = m.minimumSalary; h <= m.maximumSalary; h += m.step)
        for (let w = m.minimumSalary; w <= m.maximumSalary; w += m.step)
            pairs.push([h, w]);
    return pairs;
}
export function salaryCandidatesWithExplicitBoundaries(boundaries) {
    if (boundaries.length === 0)
        return block('全等級境界マスタ未収録');
    const m = master.optimizer.values;
    const set = new Set(baseSalaryPairs().map(p => p[0]));
    for (const boundary of boundaries) {
        integer(boundary, 'boundary');
        for (const n of [boundary - 1, boundary, boundary + 1])
            if (n >= m.minimumSalary && n <= m.maximumSalary)
                set.add(n);
    }
    return [...set].sort((a, b) => a - b);
}
function validateAnnualMonthly(values, label) {
    if (values.length !== 12)
        throw new CalculationError('INVALID_INPUT', `${label}: 12か月実額が必要`);
    values.forEach(value => integer(value, label));
}
function finalizedIncomeTax(totalIncome, deductions) {
    const taxableIncome = truncateIncomeTaxTaxableBase(Math.max(0, totalIncome - deductions));
    const incomeTax = baseIncomeTax(taxableIncome);
    const reconstruction = reconstructionTax(incomeTax);
    return { taxableIncome, incomeTax, reconstructionTax: reconstruction.reconstruction, payable: reconstruction.simpleFinalTaxAfter100YenRounding };
}
function finalizedResidentTax(reference) {
    for (const value of [reference.totalIncome, reference.deductionsExcludingBasic, reference.personalDeductionDifferenceTotal])
        integer(value, 'residentReference');
    const taxableIncome = truncateIncomeTaxTaxableBase(Math.max(0, reference.totalIncome - residentBasicDeduction2026(reference.totalIncome) - reference.deductionsExcludingBasic));
    if (!['FULL', 'INCOME_ONLY', 'NONE'].includes(reference.exemptionStatus))
        throw new CalculationError('INVALID_INPUT', 'residentExemptionStatus');
    return { taxableIncome, ...residentTax2026({ taxableIncome, totalIncome: reference.totalIncome, personalDeductionDifferenceTotal: reference.personalDeductionDifferenceTotal, exemptionStatus: reference.exemptionStatus }) };
}
function annualSocialInsurance(input) {
    validateAnnualMonthly(input.husband.monthlyExecutiveSalary, 'husbandMonthlyExecutiveSalary');
    validateAnnualMonthly(input.wife.monthlyExecutiveSalary, 'wifeMonthlyExecutiveSalary');
    const monthsSeen = new Set();
    const perPerson = [{ healthInsurance: 0, nursingCare: 0, childrenSupport: 0, employeesPension: 0 }, { healthInsurance: 0, nursingCare: 0, childrenSupport: 0, employeesPension: 0 }];
    const employer = { healthInsurance: 0, nursingCare: 0, childrenSupport: 0, employeesPension: 0 };
    for (const month of input.socialInsuranceMonths) {
        integer(month, 'socialInsuranceMonth');
        if (month < 1 || month > 12 || monthsSeen.has(month))
            throw new CalculationError('INVALID_INPUT', 'socialInsuranceMonths');
        monthsSeen.add(month);
        const monthly = calculateMonthlySocialInsurance([{ monthlyExecutiveSalary: input.husband.monthlyExecutiveSalary[month - 1], age: input.husband.age }, { monthlyExecutiveSalary: input.wife.monthlyExecutiveSalary[month - 1], age: input.wife.age }], 2026, month);
        for (const key of ['healthInsurance', 'nursingCare', 'childrenSupport', 'employeesPension']) {
            perPerson[0][key] += monthly.perPerson[0][key].employeeYen;
            perPerson[1][key] += monthly.perPerson[1][key].employeeYen;
            employer[key] += monthly.systems[key].employerYen;
        }
    }
    const personTotal = perPerson.map(person => Object.values(person).reduce((a, b) => a + b, 0));
    return { perPerson, personTotal, employer, employeeTotal: personTotal[0] + personTotal[1], employerTotal: Object.values(employer).reduce((a, b) => a + b, 0) };
}
function caseAPerson(person, nhiDeduction) {
    integer(person.age, 'age');
    integer(person.otherIncome, 'otherIncome', true);
    for (const n of [person.otherIncomeDeductions, person.ideco, person.smallBusinessMutualAid, person.previousTotalIncome])
        integer(n, 'caseAPersonInput');
    const business = businessIncome(person.sales, person.expenses, person.blueReturnDeduction);
    const pension = nationalPension(person.nationalPensionMonths);
    const totalIncome = business.businessIncomeAfterBlueDeduction + person.otherIncome;
    const deductions = incomeTaxBasicDeduction(totalIncome) + person.otherIncomeDeductions + person.ideco + person.smallBusinessMutualAid + pension + nhiDeduction;
    const incomeTax = finalizedIncomeTax(totalIncome, deductions), resident = finalizedResidentTax(person.residentReference), businessTax = individualBusinessTax2026(business.businessIncomeBeforeBlueDeduction, person.businessTaxRateBps, person.businessMonths), consumption = consumptionTax2026(person.consumptionTax);
    const beforeNhi = person.sales - person.expenses - incomeTax.payable - resident.total - businessTax.tax - pension - person.ideco - person.smallBusinessMutualAid - consumption.payable + consumption.refund;
    return { business, totalIncome, deductions, incomeTax, resident, nationalPension: pension, individualBusinessTax: businessTax, consumptionTax: consumption, disposableIncomeBeforeNhi: beforeNhi };
}
function caseBPerson(person, annualSalary, employeeSocialInsurance) {
    integer(person.age, 'age');
    integer(person.otherIncome, 'otherIncome', true);
    for (const n of [person.otherIncomeDeductions, person.ideco, person.smallBusinessMutualAid])
        integer(n, 'caseBPersonInput');
    const salary = salaryIncomeRaw(annualSalary), salaryIncome = exactInteger(salary.salaryIncome), totalIncome = salaryIncome + person.otherIncome;
    const deductions = incomeTaxBasicDeduction(totalIncome) + person.otherIncomeDeductions + person.ideco + person.smallBusinessMutualAid + employeeSocialInsurance;
    const incomeTax = finalizedIncomeTax(totalIncome, deductions), resident = finalizedResidentTax(person.residentReference);
    return { annualSalary, salaryIncomeDeduction: exactInteger(salary.salaryIncomeDeduction), salaryIncome, totalIncome, deductions, incomeTax, resident, employeeSocialInsurance, disposableIncome: annualSalary - incomeTax.payable - resident.total - employeeSocialInsurance - person.ideco - person.smallBusinessMutualAid };
}
export function calculateComparison(input) {
    if (input?.assessmentYear !== 2026)
        throw new CalculationError('OUT_OF_MVP_RANGE', 'assessmentYear=2026 only');
    const aBusiness = { husband: businessIncome(input.caseA.husband.sales, input.caseA.husband.expenses, input.caseA.husband.blueReturnDeduction), wife: businessIncome(input.caseA.wife.sales, input.caseA.wife.expenses, input.caseA.wife.blueReturnDeduction) };
    const nhi = householdNhi2026([{ age: input.caseA.husband.age, businessIncomeAfterBlueDeduction: aBusiness.husband.businessIncomeAfterBlueDeduction, previousTotalIncome: input.caseA.husband.previousTotalIncome }, { age: input.caseA.wife.age, businessIncomeAfterBlueDeduction: aBusiness.wife.businessIncomeAfterBlueDeduction, previousTotalIncome: input.caseA.wife.previousTotalIncome }]);
    const allocation = householdNhiDeductionAllocation(nhi.total, input.householdNhiPayer);
    const caseA = { husband: caseAPerson(input.caseA.husband, allocation.husband), wife: caseAPerson(input.caseA.wife, allocation.wife), householdNationalHealthInsurance: nhi, nhiDeductionAllocation: allocation, householdDisposableIncome: 0 };
    caseA.householdDisposableIncome = householdDisposableIncomeCaseA(caseA.husband.disposableIncomeBeforeNhi, caseA.wife.disposableIncomeBeforeNhi, nhi.total);
    const social = annualSocialInsurance(input.caseB);
    const annualSalary = [input.caseB.husband.monthlyExecutiveSalary.reduce((a, b) => a + b, 0), input.caseB.wife.monthlyExecutiveSalary.reduce((a, b) => a + b, 0)];
    const bH = caseBPerson(input.caseB.husband, annualSalary[0], social.personTotal[0]), bW = caseBPerson(input.caseB.wife, annualSalary[1], social.personTotal[1]);
    const householdDisposableIncomeB = bH.disposableIncome + bW.disposableIncome;
    const c = input.corporation;
    for (const n of [c.capital, c.sales, c.operatingExpenses, c.additionalExpenses, c.accountantCost, c.maintenanceCost, c.otherFixedCost])
        integer(n, 'corporationInput');
    for (const value of [c.establishmentDate, c.fiscalYearStart, c.fiscalYearEnd]) {
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
        if (!match)
            throw new CalculationError('INVALID_INPUT', 'corporationDates');
        const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
        if (date.toISOString().slice(0, 10) !== value)
            throw new CalculationError('INVALID_INPUT', 'corporationDates');
    }
    if (c.fiscalYearStart > c.fiscalYearEnd)
        throw new CalculationError('INVALID_INPUT', 'corporationDates');
    for (const flag of [c.invoiceRegistered, c.taxableBusinessElection, c.specificNewCorporationFlag])
        if (typeof flag !== 'boolean')
            throw new CalculationError('INVALID_INPUT', 'corporationConsumptionFlags');
    const corporateIncomeBeforeTax = c.sales - c.operatingExpenses - c.additionalExpenses - annualSalary[0] - annualSalary[1] - social.employerTotal - c.maintenanceCost - c.accountantCost - c.otherFixedCost;
    const corporationTax = corporationTax2026(corporateIncomeBeforeTax, c.businessMonths), local = corporateLocalTax2026(c.capital, corporationTax.calculatedTax, c.presenceMonths), enterprise = corporateEnterpriseTax2026(corporateIncomeBeforeTax, c.businessMonths), consumption = consumptionTax2026(c.consumptionTax);
    const corporateAfterTaxProfit = corporateIncomeBeforeTax - corporationTax.tax - local.total - enterprise.baseCorporateEnterpriseTax - enterprise.specialCorporateEnterpriseTax - consumption.payable + consumption.refund;
    return { assessmentYear: 2026, caseA, caseB: { husband: bH, wife: bW, socialInsurance: social, householdDisposableIncome: householdDisposableIncomeB }, corporation: { corporateIncomeBeforeTax, corporationTax, corporateLocalTax: local, corporateEnterpriseTax: enterprise, consumptionTax: consumption, corporateAfterTaxProfit }, comparison: compareFinalizedAmounts(caseA.householdDisposableIncome, bH.disposableIncome, bW.disposableIncome, corporateAfterTaxProfit) };
}
export function optimize(_input) { throw new CalculationError('OUT_OF_MVP_RANGE', 'Phase 1はGolden計算エンジンまで。役員報酬推薦は対象外'); }
