import { CalculationError, integer } from "./core.js";
/** Returns the calendar income year referenced by an assessment year. */
export function referencedIncomeYear(system, assessmentYear) {
    integer(assessmentYear, 'assessmentYear');
    switch (system) {
        case 'INCOME_TAX':
        case 'INDIVIDUAL_BUSINESS_TAX': return assessmentYear;
        case 'RESIDENT_TAX':
        case 'NATIONAL_HEALTH_INSURANCE': return assessmentYear - 1;
    }
    throw new CalculationError('INVALID_INPUT', 'annualSystem');
}
/** Explicit monthly facts only. No sales/expenses are synthesized by annual / 12. */
export function splitMonthlyAmountsAtIncorporation(monthly, incorporationMonth) {
    if (monthly.length !== 12)
        throw new CalculationError('INVALID_INPUT', '12か月分の実額が必要');
    integer(incorporationMonth, 'incorporationMonth');
    if (incorporationMonth < 1 || incorporationMonth > 12)
        throw new CalculationError('INVALID_INPUT', 'incorporationMonth');
    monthly.forEach(n => integer(n, 'monthlyAmount', true));
    return { individual: monthly.slice(0, incorporationMonth - 1), corporate: monthly.slice(incorporationMonth - 1) };
}
function isoDate(value, label) {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match)
        throw new CalculationError('INVALID_INPUT', label);
    const year = Number(match[1]), month = Number(match[2]), day = Number(match[3]), date = new Date(Date.UTC(year, month - 1, day));
    if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day)
        throw new CalculationError('INVALID_INPUT', label);
    return value;
}
function yearMonth(value, label) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value))
        throw new CalculationError('INVALID_INPUT', label);
    return value;
}
function annualActuals(values, label) {
    if (values.length !== 12)
        throw new CalculationError('INVALID_INPUT', `${label}: 12か月分の実額が必要`);
    return values.reduce((total, value) => total + integer(value, label), 0);
}
/** 日割り・年額/12を一切行わず、別々に入力された制度日付と月別実額を保持・合算する。 */
export function initialYearActuals(input) {
    const timeline = {
        corporationEstablishmentDate: isoDate(input.corporationEstablishmentDate, 'corporationEstablishmentDate'),
        fiscalYearStart: isoDate(input.fiscalYearStart, 'fiscalYearStart'), fiscalYearEnd: isoDate(input.fiscalYearEnd, 'fiscalYearEnd'),
        socialInsuranceQualificationDate: { husband: isoDate(input.socialInsuranceQualificationDate.husband, 'husbandSocialInsuranceQualificationDate'), wife: isoDate(input.socialInsuranceQualificationDate.wife, 'wifeSocialInsuranceQualificationDate') },
        nationalHealthInsuranceLossMonth: { husband: yearMonth(input.nationalHealthInsuranceLossMonth.husband, 'husbandNhiLossMonth'), wife: yearMonth(input.nationalHealthInsuranceLossMonth.wife, 'wifeNhiLossMonth') },
        nationalPensionCategory2SwitchMonth: { husband: yearMonth(input.nationalPensionCategory2SwitchMonth.husband, 'husbandPensionSwitchMonth'), wife: yearMonth(input.nationalPensionCategory2SwitchMonth.wife, 'wifePensionSwitchMonth') },
        corporatePerCapitaPresenceMonths: integer(input.corporatePerCapitaPresenceMonths, 'corporatePerCapitaPresenceMonths'),
        enterpriseTaxBusinessMonths: integer(input.enterpriseTaxBusinessMonths, 'enterpriseTaxBusinessMonths')
    };
    if (timeline.fiscalYearStart > timeline.fiscalYearEnd || timeline.corporatePerCapitaPresenceMonths < 1 || timeline.corporatePerCapitaPresenceMonths > 12 || timeline.enterpriseTaxBusinessMonths < 1 || timeline.enterpriseTaxBusinessMonths > 12)
        throw new CalculationError('INVALID_INPUT', 'initialYearTimeline');
    return { timeline,
        annualExecutiveSalary: { husband: annualActuals(input.executiveSalaryMonthlyActuals.husband, 'husbandMonthlySalaryActual'), wife: annualActuals(input.executiveSalaryMonthlyActuals.wife, 'wifeMonthlySalaryActual') },
        annualCorporateSales: annualActuals(input.corporateSalesMonthlyActuals, 'corporateSalesMonthlyActual'),
        annualCorporateOperatingExpenses: annualActuals(input.corporateOperatingExpensesMonthlyActuals, 'corporateOperatingExpensesMonthlyActual'),
        annualEmployerSocialInsurance: annualActuals(input.employerSocialInsuranceMonthlyActuals, 'employerSocialInsuranceMonthlyActual'),
        annualHouseholdNationalHealthInsurance: annualActuals(input.householdNationalHealthInsuranceMonthlyActuals, 'householdNhiMonthlyActual'),
        annualNationalPension: { husband: annualActuals(input.nationalPensionMonthlyActuals.husband, 'husbandNationalPensionMonthlyActual'), wife: annualActuals(input.nationalPensionMonthlyActuals.wife, 'wifeNationalPensionMonthlyActual') }
    };
}
