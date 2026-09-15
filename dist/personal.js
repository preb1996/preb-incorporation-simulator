import { master } from "./master.js";
import { CalculationError, integer, yen, rate, add, subtract, max, exactInteger } from "./core.js";
export function businessIncome(sales, expenses, blue) {
    integer(sales, 'sales');
    integer(expenses, 'expenses');
    if (![0, 550000, 650000].includes(blue))
        throw new CalculationError('INVALID_INPUT', 'blueReturnDeduction');
    const businessIncomeBeforeBlueDeduction = exactInteger(subtract(yen(sales), yen(expenses)));
    const businessIncomeAfterBlueDeduction = Math.max(0, businessIncomeBeforeBlueDeduction - blue);
    return { businessIncomeBeforeBlueDeduction, businessIncomeAfterBlueDeduction };
}
function deductionFromTable(income, rows) {
    integer(income, 'income', true);
    for (const row of rows) {
        const [ceiling, deduction] = row;
        if (ceiling === undefined || deduction === undefined)
            throw new Error('Invalid master');
        if (income <= ceiling)
            return deduction;
    }
    return 0;
}
export function incomeTaxBasicDeduction(income) { return deductionFromTable(income, master.incomeTax.values.basic); }
export function nhiBasicDeduction(previousTotalIncome) { return deductionFromTable(previousTotalIncome, master.nhi.values.basic); }
/** Caller supplies the already legally rounded taxable income; no unapproved deduction or rounding is inferred. */
export function baseIncomeTax(taxableIncome) {
    integer(taxableIncome, 'taxableIncome');
    if (taxableIncome % master.incomeTax.values.taxableUnit !== 0)
        throw new CalculationError('INVALID_INPUT', '課税所得は確定済み1000円単位で入力');
    let [bps, deduction] = master.incomeTax.values.top;
    for (const row of master.incomeTax.values.brackets) {
        const [exclusive, r, d] = row;
        if (exclusive !== undefined && taxableIncome < exclusive) {
            bps = r;
            deduction = d;
            break;
        }
    }
    if (bps === undefined || deduction === undefined)
        throw new Error('Invalid master');
    return exactInteger(max(yen(0), subtract(rate(yen(taxableIncome), bps), yen(deduction))));
}
export function reconstructionTax(base) {
    integer(base, 'baseIncomeTax');
    const raw = rate(yen(base), master.incomeTax.values.reconstructionBps);
    const reconstruction = Number(raw.numerator / raw.denominator);
    const incomeTaxAndReconstructionTax = exactInteger(add(yen(base), yen(reconstruction)));
    const unit = master.incomeTax.values.finalUnit;
    const simpleFinalTaxAfter100YenRounding = incomeTaxAndReconstructionTax - incomeTaxAndReconstructionTax % unit;
    return { reconstruction, incomeTaxAndReconstructionTax, simpleFinalTaxAfter100YenRounding };
}
export function salaryIncomeRaw(revenue) {
    integer(revenue, 'salaryRevenue');
    let deduction = yen(master.salary.values.maximum);
    for (const row of master.salary.values.brackets) {
        const [ceiling, bps, fixed] = row;
        if (ceiling === undefined || bps === undefined || fixed === undefined)
            throw new Error('Invalid master');
        if (revenue <= ceiling) {
            deduction = add(rate(yen(revenue), bps), yen(fixed));
            break;
        }
    }
    // SSOT section 20 does not define a zero floor. Preserve the written formula.
    return { salaryIncomeDeduction: deduction, salaryIncome: subtract(yen(revenue), deduction) };
}
export function adjustmentDeduction(totalTaxableIncome, personalDifference, totalIncome) {
    integer(totalTaxableIncome, 'totalTaxableIncome');
    integer(personalDifference, 'personalDifference');
    integer(totalIncome, 'totalIncome', true);
    const m = master.adjustment.values;
    if (totalIncome > m.incomeLimit)
        return { base: 0, municipal: yen(0), prefectural: yen(0) };
    const base = totalTaxableIncome <= m.threshold ? Math.min(personalDifference, totalTaxableIncome) : Math.max(m.minimumBase, personalDifference - (totalTaxableIncome - m.threshold));
    return { base, municipal: rate(yen(base), m.municipalBps), prefectural: rate(yen(base), m.prefecturalBps) };
}
/** Section 11 income levy before each local-tax component's final rounding. */
export function residentIncomeTaxRaw(taxableIncome, municipalAdjustment, prefecturalAdjustment, otherMunicipalCredits, otherPrefecturalCredits) {
    integer(taxableIncome, 'taxableIncome');
    integer(otherMunicipalCredits, 'credits');
    integer(otherPrefecturalCredits, 'credits');
    return { municipal: max(yen(0), subtract(subtract(rate(yen(taxableIncome), master.residentTax.values.municipalBps), municipalAdjustment), yen(otherMunicipalCredits))), prefectural: max(yen(0), subtract(subtract(rate(yen(taxableIncome), master.residentTax.values.prefecturalBps), prefecturalAdjustment), yen(otherPrefecturalCredits))) };
}
export function residentBasicDeduction2026(totalIncome) {
    integer(totalIncome, 'totalIncome', true);
    if (totalIncome <= 24000000)
        return 430000;
    if (totalIncome <= 24500000)
        return 290000;
    if (totalIncome <= 25000000)
        return 150000;
    return 0;
}
export function residentTaxExemption2026(input) {
    const { totalIncome, grossTotalIncome, dependentCount } = input;
    integer(totalIncome, 'totalIncome', true);
    integer(grossTotalIncome, 'grossTotalIncome', true);
    integer(dependentCount, 'dependentCount');
    const fullLimit = dependentCount === 0 ? 450000 : 350000 * (dependentCount + 1) + 100000 + 210000;
    const incomeLimit = dependentCount === 0 ? 450000 : 350000 * (dependentCount + 1) + 100000 + 320000;
    if (input.receivesWelfare || (input.isDisabledMinorWidowOrSingleParent && totalIncome <= 1350000) || totalIncome <= fullLimit)
        return 'FULL';
    if (grossTotalIncome <= incomeLimit)
        return 'INCOME_ONLY';
    return 'NONE';
}
export function residentTax2026(input) {
    const { taxableIncome, totalIncome, personalDeductionDifferenceTotal, exemptionStatus } = input;
    integer(taxableIncome, 'taxableIncome');
    integer(totalIncome, 'totalIncome', true);
    integer(personalDeductionDifferenceTotal, 'personalDeductionDifferenceTotal');
    if (taxableIncome % 1000 !== 0)
        throw new CalculationError('INVALID_INPUT', '住民税課税所得は1,000円未満切捨て後を指定');
    const otherMunicipalCredits = input.otherMunicipalCredits ?? 0, otherPrefecturalCredits = input.otherPrefecturalCredits ?? 0;
    integer(otherMunicipalCredits, 'otherMunicipalCredits');
    integer(otherPrefecturalCredits, 'otherPrefecturalCredits');
    if (exemptionStatus === 'FULL')
        return { municipalAdjustmentDeduction: 0, prefecturalAdjustmentDeduction: 0, municipalTax: 0, prefecturalTax: 0, forestEnvironmentalTax: 0, total: 0 };
    if (!['INCOME_ONLY', 'NONE'].includes(exemptionStatus))
        throw new CalculationError('INVALID_INPUT', 'residentTaxExemptionStatus');
    const adjustment = adjustmentDeduction(taxableIncome, personalDeductionDifferenceTotal, totalIncome);
    const raw = exemptionStatus === 'INCOME_ONLY' ? { municipal: yen(0), prefectural: yen(0) } : residentIncomeTaxRaw(taxableIncome, adjustment.municipal, adjustment.prefectural, otherMunicipalCredits, otherPrefecturalCredits);
    const municipalAdjustmentDeduction = exactInteger(adjustment.municipal), prefecturalAdjustmentDeduction = exactInteger(adjustment.prefectural);
    const municipalBeforeRounding = exactInteger(add(raw.municipal, yen(master.residentTax.values.municipalFixed)));
    const prefecturalBeforeRounding = exactInteger(add(raw.prefectural, yen(master.residentTax.values.prefecturalFixed)));
    const municipalTax = municipalBeforeRounding - municipalBeforeRounding % 100;
    const prefecturalTax = prefecturalBeforeRounding - prefecturalBeforeRounding % 100;
    const forestEnvironmentalTax = master.residentTax.values.forest;
    return { municipalAdjustmentDeduction, prefecturalAdjustmentDeduction, municipalTax, prefecturalTax, forestEnvironmentalTax, total: municipalTax + prefecturalTax + forestEnvironmentalTax };
}
