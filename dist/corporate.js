import { master } from "./master.js";
import { CalculationError, integer, months, yen, rate, scale, add, subtract, min, max, sum, compare } from "./core.js";
import { truncateIndividualBusinessTaxableBase, truncateIndividualBusinessTaxAmount, truncateCorporationTaxableIncome, truncateCorporationTaxCalculatedAmount, truncateCorporationTaxAmount, truncatePrefecturalCorporateTaxBase, truncatePrefecturalCorporateIncomeTax, truncatePrefecturalCorporatePerCapitaTax, truncateMunicipalCorporateTaxBase, truncateMunicipalCorporateIncomeTax, truncateMunicipalCorporatePerCapitaTax, truncateCorporateEnterpriseTaxableIncome, truncateCorporateEnterpriseTaxAmount, truncateSpecialCorporateEnterpriseTaxAmount, truncateConsumptionTaxIntermediate, truncateConsumptionTaxPayable } from "./rounding.js";
export function individualBusinessTaxRaw(beforeBlue, bps, businessMonths) {
    integer(beforeBlue, 'beforeBlue', true);
    months(businessMonths);
    if (!master.individualBusinessTax.values.allowedBps.includes(bps))
        throw new CalculationError('INVALID_INPUT', 'businessTaxRate');
    return rate(max(yen(0), subtract(yen(beforeBlue), scale(yen(master.individualBusinessTax.values.deduction), businessMonths, 12))), bps);
}
export function individualBusinessTax2026(beforeBlue, bps, businessMonths) {
    integer(beforeBlue, 'beforeBlue', true);
    months(businessMonths);
    if (!master.individualBusinessTax.values.allowedBps.includes(bps))
        throw new CalculationError('INVALID_INPUT', 'businessTaxRate');
    const rawBase = max(yen(0), subtract(yen(beforeBlue), scale(yen(master.individualBusinessTax.values.deduction), businessMonths, 12)));
    const taxableBase = truncateIndividualBusinessTaxableBase(rawBase);
    const rawTax = rate(yen(taxableBase), bps);
    return { taxableBase, rawTax, tax: truncateIndividualBusinessTaxAmount(rawTax) };
}
/** 法人税法66条4・12項: 800万円を12で除し、端月を切上げた月数を乗ずる。 */
export function corporationTaxThreshold(businessMonths = 12) {
    months(businessMonths);
    return scale(yen(master.corporationTax.values.threshold), businessMonths, 12);
}
export function corporationTaxRaw(income, businessMonths = 12) {
    integer(income, 'income', true);
    const m = master.corporationTax.values;
    const base = yen(Math.max(0, income)), threshold = corporationTaxThreshold(businessMonths);
    return add(rate(min(base, threshold), m.lowerBps), rate(max(yen(0), subtract(base, threshold)), m.upperBps));
}
export function corporationTax2026(income, businessMonths = 12) {
    integer(income, 'income', true);
    months(businessMonths);
    const taxableIncome = truncateCorporationTaxableIncome(Math.max(0, income));
    const threshold = corporationTaxThreshold(businessMonths);
    const rawTax = corporationTaxRaw(taxableIncome, businessMonths);
    const calculatedTax = truncateCorporationTaxCalculatedAmount(rawTax);
    return { taxableIncome, threshold, rawTax, calculatedTax, tax: truncateCorporationTaxAmount(yen(calculatedTax)) };
}
export function corporateEnterpriseTaxRaw(income, businessMonths) {
    integer(income, 'income', true);
    months(businessMonths);
    const m = master.enterprise.values;
    if (income > m.incomeLimit)
        throw new CalculationError('OUT_OF_MVP_RANGE', '年所得5000万円超');
    const threshold1 = scale(yen(m.first), businessMonths, 12), threshold2 = scale(yen(m.second), businessMonths, 12), base = yen(Math.max(0, income));
    const tax = sum([rate(min(base, threshold1), m.firstBps), rate(max(yen(0), subtract(min(base, threshold2), threshold1)), m.secondBps), rate(max(yen(0), subtract(base, threshold2)), m.thirdBps)]);
    return { threshold1, threshold2, baseCorporateEnterpriseTax: tax, specialCorporateEnterpriseTax: rate(tax, m.specialBps) };
}
export function corporateEnterpriseTax2026(income, businessMonths) {
    integer(income, 'income', true);
    months(businessMonths);
    const taxableIncome = truncateCorporateEnterpriseTaxableIncome(Math.max(0, income));
    const raw = corporateEnterpriseTaxRaw(taxableIncome, businessMonths);
    const baseCorporateEnterpriseTax = truncateCorporateEnterpriseTaxAmount(raw.baseCorporateEnterpriseTax);
    // 愛知県第6号様式: 標準税率法人は確定した所得割税額を特別法人事業税の課税標準欄へ転記。
    const specialRawTax = rate(yen(baseCorporateEnterpriseTax), master.enterprise.values.specialBps);
    return { ...raw, taxableIncome, baseCorporateEnterpriseTax, specialCorporateEnterpriseTaxBase: baseCorporateEnterpriseTax, specialRawTax, specialCorporateEnterpriseTax: truncateSpecialCorporateEnterpriseTaxAmount(specialRawTax) };
}
function validatePeriod(p) {
    integer(p.wholeMonths, 'wholeMonths');
    integer(p.remainingDays, 'remainingDays');
    if (p.wholeMonths > 12 || p.remainingDays > 30 || (p.wholeMonths === 0 && p.remainingDays === 0) || (p.wholeMonths === 12 && p.remainingDays > 0))
        throw new CalculationError('INVALID_INPUT', 'period');
}
export function enterpriseTaxBusinessMonths(period) { validatePeriod(period); return period.wholeMonths + (period.remainingDays > 0 ? 1 : 0); }
export function perCapitaTaxPresenceMonths(period) { validatePeriod(period); return period.wholeMonths === 0 ? 1 : period.wholeMonths; }
export function corporateLocalTaxRaw(capital, corporationTaxBase, presenceMonths) {
    integer(capital, 'capital');
    months(presenceMonths);
    const m = master.corporateLocal.values;
    if (compare(corporationTaxBase, yen(0)) < 0)
        throw new CalculationError('INVALID_INPUT', 'corporationTaxBase');
    if (capital > m.capitalLimit || compare(corporationTaxBase, yen(m.prefecturalTaxLimit)) > 0 || compare(corporationTaxBase, yen(m.municipalTaxLimit)) > 0)
        throw new CalculationError('OUT_OF_MVP_RANGE', '第28・29条の適用範囲外');
    return { prefecturalIncome: rate(corporationTaxBase, m.prefecturalBps), municipalIncome: rate(corporationTaxBase, m.municipalBps), prefecturalPerCapita: scale(yen(m.prefecturalFixed), presenceMonths, 12), municipalPerCapita: scale(yen(m.municipalFixed), presenceMonths, 12) };
}
export function corporateLocalTax2026(capital, corporationTaxAmount, presenceMonths) {
    integer(corporationTaxAmount, 'corporationTaxAmount');
    const prefecturalTaxBase = truncatePrefecturalCorporateTaxBase(corporationTaxAmount);
    const municipalTaxBase = truncateMunicipalCorporateTaxBase(corporationTaxAmount);
    const raw = corporateLocalTaxRaw(capital, yen(corporationTaxAmount), presenceMonths);
    const prefecturalIncome = truncatePrefecturalCorporateIncomeTax(rate(yen(prefecturalTaxBase), master.corporateLocal.values.prefecturalBps));
    const municipalIncome = truncateMunicipalCorporateIncomeTax(rate(yen(municipalTaxBase), master.corporateLocal.values.municipalBps));
    const prefecturalPerCapita = truncatePrefecturalCorporatePerCapitaTax(raw.prefecturalPerCapita);
    const municipalPerCapita = truncateMunicipalCorporatePerCapitaTax(raw.municipalPerCapita);
    return { prefecturalTaxBase, municipalTaxBase, prefecturalIncome, municipalIncome, prefecturalPerCapita, municipalPerCapita, prefecturalTotal: prefecturalIncome + prefecturalPerCapita, municipalTotal: municipalIncome + municipalPerCapita, total: prefecturalIncome + municipalIncome + prefecturalPerCapita + municipalPerCapita };
}
export function consumptionTaxRaw(input) {
    switch (input.status) {
        case 'EXEMPT': return yen(0);
        case 'GENERAL':
            integer(input.output, 'output');
            integer(input.deductibleInput, 'deductibleInput');
            return subtract(yen(input.output), yen(input.deductibleInput));
        case 'SIMPLIFIED':
            integer(input.output, 'output');
            integer(input.deemedPurchaseBps, 'deemedPurchaseBps');
            if (input.deemedPurchaseBps > 10000)
                throw new CalculationError('INVALID_INPUT', 'deemedPurchaseBps');
            return rate(yen(input.output), 10000 - input.deemedPurchaseBps);
        case 'SPECIAL_20_PERCENT':
            if (input.eligible !== true)
                throw new CalculationError('INVALID_INPUT', '2割特例の適用要件未充足');
            integer(input.output, 'output');
            return rate(yen(input.output), master.consumption.values.specialBps);
        case 'MANUAL':
            integer(input.amount, 'amount', true);
            return yen(input.amount);
        default: throw new CalculationError('INVALID_INPUT', 'consumptionTaxStatus');
    }
}
export function consumptionTax2026(input) {
    const raw = consumptionTaxRaw(input);
    if (compare(raw, yen(0)) <= 0)
        return { raw, intermediateTax: 0, payable: 0, refund: raw.numerator < 0n ? truncateConsumptionTaxIntermediate({ numerator: -raw.numerator, denominator: raw.denominator }) : 0 };
    const intermediateTax = truncateConsumptionTaxIntermediate(raw);
    return { raw, intermediateTax, payable: truncateConsumptionTaxPayable(yen(intermediateTax)), refund: 0 };
}
export function firstPeriodExemptionCandidate(capital, invoiceRegistered, taxableBusinessElection, specificNewCorporationFlag) {
    integer(capital, 'capital');
    for (const value of [invoiceRegistered, taxableBusinessElection, specificNewCorporationFlag])
        if (typeof value !== 'boolean')
            throw new CalculationError('INVALID_INPUT', '免税候補判定には全フラグ必須');
    return capital < master.consumption.values.exemptCapitalExclusive && !invoiceRegistered && !taxableBusinessElection && !specificNewCorporationFlag;
}
