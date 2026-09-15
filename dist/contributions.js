import { master } from "./master.js";
import socialMaster from '../masters/social-insurance-monthly-remuneration-grades.json' with { type: 'json' };
import { block, CalculationError, integer, months, yen, rate, add, min, sum, exactInteger } from "./core.js";
import { nhiBasicDeduction } from "./personal.js";
/** 国税庁No.1130: 社会保険料控除は実際に支払った者へ全額帰属。支払者を推測しない。 */
export function householdNhiDeductionAllocation(totalPremium, payer) {
    integer(totalPremium, 'householdNationalHealthInsurance');
    if (payer === undefined)
        throw new CalculationError('INVALID_INPUT', 'householdNhiPayer is required');
    if (payer === 'HUSBAND')
        return { husband: totalPremium, wife: 0 };
    if (payer === 'WIFE')
        return { husband: 0, wife: totalPremium };
    throw new CalculationError('INVALID_INPUT', 'householdNhiPayer');
}
/** No low-income reductions, unknown rounding, or payment allocation is inferred. */
export function householdNhiRaw(people) {
    if (people.length !== 2)
        throw new CalculationError('OUT_OF_MVP_RANGE', '夫婦2名のみ');
    const m = master.nhi.values;
    const members = people.map(p => { integer(p.age, 'age'); integer(p.businessIncomeAfterBlueDeduction, 'nhiIncome'); return { base: Math.max(0, p.businessIncomeAfterBlueDeduction - nhiBasicDeduction(p.previousTotalIncome)), age: p.age }; });
    const total = exactInteger(sum(members.map(p => yen(p.base))));
    const care = members.filter(p => p.age >= m.careMinAge && p.age < m.careMaxAgeExclusive);
    const part = (base, count, terms) => min(yen(terms.cap), add(yen(terms.fixed * count), rate(yen(base), terms.bps)));
    const medical = part(total, members.length, m.medical), support = part(total, members.length, m.support);
    const nursing = part(exactInteger(sum(care.map(p => yen(p.base)))), care.length, m.care);
    const children = min(yen(m.children.cap), sum([rate(yen(total), m.children.bps), yen(m.children.fixed * members.length), yen(m.children.adultExtra * members.filter(p => p.age >= m.children.adultAge).length)]));
    return { bases: members.map(p => p.base), medical, support, nursing, children, total: sum([medical, support, nursing, children]) };
}
function truncatePositiveFractionToTen(value) {
    if (value.numerator < 0n)
        throw new CalculationError('INVALID_INPUT', 'negativeNhiPremium');
    const whole = value.numerator / value.denominator;
    const rounded = (whole / 10n) * 10n;
    if (rounded > BigInt(Number.MAX_SAFE_INTEGER))
        throw new CalculationError('INVALID_INPUT', 'nhiPremiumOverflow');
    return Number(rounded);
}
/** 名古屋市試算ページどおり、4区分をそれぞれ10円未満切捨て後に合計する。 */
export function householdNhi2026(people) {
    const raw = householdNhiRaw(people);
    const medical = truncatePositiveFractionToTen(raw.medical);
    const support = truncatePositiveFractionToTen(raw.support);
    const nursing = truncatePositiveFractionToTen(raw.nursing);
    const children = truncatePositiveFractionToTen(raw.children);
    return { bases: raw.bases, medical, support, nursing, children, total: medical + support + nursing + children };
}
/** Applies the section 12 monthly master to an explicitly selected 0..12 eligible month count. */
export function nationalPension(eligibleMonths) { integer(eligibleMonths, 'eligibleMonths'); if (eligibleMonths > 12)
    throw new CalculationError('INVALID_INPUT', 'eligibleMonths'); return master.nationalPension.values.monthly * eligibleMonths; }
export function idecoLimit(month, category, corporatePensionContribution = 0) {
    months(month);
    integer(corporatePensionContribution, 'corporatePensionContribution');
    if (category !== 'FIRST' && category !== 'SECOND')
        throw new CalculationError('INVALID_INPUT', 'category');
    const m = month < 12 ? master.idecoBefore.values : master.idecoAfter.values;
    if (category === 'FIRST')
        return m.first;
    if (month < 12 && corporatePensionContribution !== 0)
        return block('11月以前の企業年金ありは未定義');
    if (corporatePensionContribution > m.second)
        throw new CalculationError('INVALID_INPUT', '企業年金が合算上限を超過');
    return m.second - corporatePensionContribution;
}
export function annualIdeco(requested, incorporationMonth) {
    if (requested.length !== 12)
        throw new CalculationError('INVALID_INPUT', '12か月分必須');
    if (incorporationMonth !== null)
        months(incorporationMonth);
    const monthly = requested.map((amount, i) => { integer(amount, 'requestedContribution'); const month = i + 1; return Math.min(amount, idecoLimit(month, incorporationMonth !== null && month >= incorporationMonth ? 'SECOND' : 'FIRST')); });
    return { monthly, annual: monthly.reduce((a, b) => a + b, 0) };
}
function findGrade(salary, grades) {
    integer(salary, 'monthlyExecutiveSalary');
    const grade = grades.find(g => (g.remunerationLowerInclusive === null || salary >= g.remunerationLowerInclusive) && (g.remunerationUpperExclusive === null || salary < g.remunerationUpperExclusive));
    if (!grade)
        throw new CalculationError('INVALID_INPUT', '標準報酬月額等級なし');
    return grade;
}
export function remunerationGrade(salary, system) {
    if (system === 'HEALTH')
        return findGrade(salary, socialMaster.healthInsuranceGrades);
    if (system === 'PENSION')
        return findGrade(salary, socialMaster.employeesPensionGrades);
    throw new CalculationError('INVALID_INPUT', 'socialInsuranceSystem');
}
export function standardMonthlyRemuneration(salary, system) {
    return remunerationGrade(salary, system).standardMonthlyRemuneration;
}
/** Returns every remuneration-grade lower boundary represented in the master. */
export function socialInsuranceSalaryBoundaries() {
    return [...new Set([
            ...socialMaster.healthInsuranceGrades,
            ...socialMaster.employeesPensionGrades
        ].map(grade => grade.remunerationLowerInclusive).filter((boundary) => boundary !== null))].sort((a, b) => a - b);
}
/** Hundredths of one yen. Payroll withholding: <= 50 sen is discarded, > 50 sen rounds up. */
export function roundEmployeePayrollHundredths(hundredthsYen) {
    integer(hundredthsYen, 'hundredthsYen');
    const whole = Math.floor(hundredthsYen / 100), fraction = hundredthsYen % 100;
    return whole + (fraction > 50 ? 1 : 0);
}
/** Whole premiums stay exact until every insured person's amount is summed. */
export function officeTotalPremiumHundredths(amounts) {
    const total = amounts.reduce((a, n) => a + integer(n, 'premiumHundredthsYen'), 0);
    if (!Number.isSafeInteger(total))
        throw new CalculationError('INVALID_INPUT', 'premium total overflow');
    return Math.floor(total / 100);
}
function exactContribution(standard, bps, applies) {
    if (!applies)
        return { fullHundredthsYen: 0, employeeYen: 0 };
    const numerator = standard * bps;
    if (!Number.isSafeInteger(numerator) || numerator % 100 !== 0)
        throw new CalculationError('SPEC_BLOCKER', '公式率の金額を1/100円で正確に表現できない');
    const fullHundredthsYen = numerator / 100;
    if (fullHundredthsYen % 2 !== 0)
        throw new CalculationError('SPEC_BLOCKER', '本人折半額を1/100円で正確に表現できない');
    return { fullHundredthsYen, employeeYen: roundEmployeePayrollHundredths(fullHundredthsYen / 2) };
}
function closeSystem(people) {
    const officeYen = officeTotalPremiumHundredths(people.map(p => p.fullHundredthsYen));
    const employeeYen = people.reduce((a, p) => a + p.employeeYen, 0);
    return { officeYen, employeeYen, employerYen: officeYen - employeeYen };
}
function socialInsuranceRates(year, month) {
    const date = year * 100 + month;
    const period = socialMaster.ratePeriods.find(p => {
        const from = Number(p.effectiveFrom.slice(0, 7).replace('-', ''));
        const to = p.effectiveTo === null ? Infinity : Number(p.effectiveTo.slice(0, 7).replace('-', ''));
        return date >= from && date <= to;
    });
    if (!period)
        return block('指定月に適用される協会けんぽ愛知支部公式料率なし');
    return period;
}
function calculateMonthlySocialInsuranceForActivePeople(people, year, month) {
    integer(year, 'year');
    months(month);
    if (year !== 2026)
        throw new CalculationError('OUT_OF_MVP_RANGE', 'socialInsuranceYear=2026 only');
    if (people.length < 1 || people.length > 2)
        throw new CalculationError('OUT_OF_MVP_RANGE', 'active insured count must be 1..2');
    const rates = socialInsuranceRates(year, month);
    const childSupportApplies = rates.childrenSupport > 0 && month >= 4;
    const calculatePerson = (person) => {
        integer(person.age, 'age');
        const healthStandard = standardMonthlyRemuneration(person.monthlyExecutiveSalary, 'HEALTH');
        const pensionStandard = standardMonthlyRemuneration(person.monthlyExecutiveSalary, 'PENSION');
        const careApplies = person.age >= socialMaster.ageConditions.nursingCareMinimumAge && person.age < socialMaster.ageConditions.nursingCareMaximumAgeExclusive;
        return {
            healthStandardMonthlyRemuneration: healthStandard,
            pensionStandardMonthlyRemuneration: pensionStandard,
            healthInsurance: exactContribution(healthStandard, rates.healthInsurance, true),
            nursingCare: exactContribution(healthStandard, rates.nursingCareInsurance, careApplies),
            childrenSupport: exactContribution(healthStandard, rates.childrenSupport, childSupportApplies),
            employeesPension: exactContribution(pensionStandard, rates.employeesPension, true)
        };
    };
    const perPerson = people.map(calculatePerson);
    function aggregate(key) { return closeSystem(perPerson.map(person => person[key])); }
    const systems = { healthInsurance: aggregate('healthInsurance'), nursingCare: aggregate('nursingCare'), childrenSupport: aggregate('childrenSupport'), employeesPension: aggregate('employeesPension') };
    return { year, month, perPerson, systems, total: { officeYen: Object.values(systems).reduce((a, x) => a + x.officeYen, 0), employeeYen: Object.values(systems).reduce((a, x) => a + x.employeeYen, 0), employerYen: Object.values(systems).reduce((a, x) => a + x.employerYen, 0) } };
}
/** Calendar 2026 only. Jan-Feb use the official R7 table; March onward uses R8. */
export function calculateMonthlySocialInsurance(people, year, month) {
    const result = calculateMonthlySocialInsuranceForActivePeople(people, year, month);
    return { ...result, perPerson: result.perPerson };
}
function qualificationMonth2026(value) {
    const match = /^(2026)-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
        throw new CalculationError('INVALID_INPUT', 'socialInsuranceQualificationDate');
    const month = Number(match[2]), day = Number(match[3]), date = new Date(Date.UTC(2026, month - 1, day));
    if (date.toISOString().slice(0, 10) !== value)
        throw new CalculationError('INVALID_INPUT', 'socialInsuranceQualificationDate');
    return month;
}
/** 資格取得月から、実際の月額報酬と該当月の公式率で計算し、年額へ合算する。 */
export function calculateInitialYearSocialInsurance(people) {
    const qualificationMonths = people.map(person => qualificationMonth2026(person.qualificationDate));
    for (const person of people) {
        integer(person.age, 'age');
        if (person.monthlyExecutiveSalaryActuals.length !== 12)
            throw new CalculationError('INVALID_INPUT', '12か月分の役員報酬実額が必要');
        person.monthlyExecutiveSalaryActuals.forEach(value => integer(value, 'monthlyExecutiveSalaryActual'));
    }
    const employeeByPerson = [0, 0], employerBySystem = { healthInsurance: 0, nursingCare: 0, childrenSupport: 0, employeesPension: 0 }, monthly = [];
    for (let month = 1; month <= 12; month++) {
        const activeIndexes = [0, 1].filter(index => month >= qualificationMonths[index]);
        if (activeIndexes.length === 0)
            continue;
        const activePeople = activeIndexes.map(index => ({ monthlyExecutiveSalary: people[index].monthlyExecutiveSalaryActuals[month - 1], age: people[index].age }));
        const result = calculateMonthlySocialInsuranceForActivePeople(activePeople, 2026, month);
        activeIndexes.forEach((originalIndex, activeIndex) => { employeeByPerson[originalIndex] += Object.values(result.perPerson[activeIndex]).filter(value => typeof value === 'object').reduce((total, item) => total + item.employeeYen, 0); });
        for (const key of Object.keys(employerBySystem))
            employerBySystem[key] += result.systems[key].employerYen;
        monthly.push({ month, activeIndexes, result });
    }
    return { qualificationMonths, monthly, employeeByPerson, employeeTotal: employeeByPerson[0] + employeeByPerson[1], employerBySystem, employerTotal: Object.values(employerBySystem).reduce((a, b) => a + b, 0) };
}
