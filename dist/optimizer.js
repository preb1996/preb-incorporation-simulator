import { CalculationError } from "./core.js";
import { calculateComparison, candidateStatus, salaryCandidatesWithExplicitBoundaries } from "./comparison.js";
import { socialInsuranceSalaryBoundaries } from "./contributions.js";
export function optimizerCandidateInput(input, husbandMonthlySalary, wifeMonthlySalary) {
    const activeMonths = new Set(input.caseB.socialInsuranceMonths);
    const replace = (original, salary) => original.map((value, index) => activeMonths.has(index + 1) ? salary : value);
    return {
        ...input,
        caseB: {
            ...input.caseB,
            husband: {
                ...input.caseB.husband,
                monthlyExecutiveSalary: replace(input.caseB.husband.monthlyExecutiveSalary, husbandMonthlySalary)
            },
            wife: {
                ...input.caseB.wife,
                monthlyExecutiveSalary: replace(input.caseB.wife.monthlyExecutiveSalary, wifeMonthlySalary)
            }
        }
    };
}
export function compareOptimizationCandidates(left, right) {
    const wealth = right.totalWealthIncreaseB - left.totalWealthIncreaseB;
    if (wealth !== 0)
        return wealth;
    const profit = right.corporateAfterTaxProfit - left.corporateAfterTaxProfit;
    if (profit !== 0)
        return profit;
    const household = right.householdDisposableIncomeB - left.householdDisposableIncomeB;
    if (household !== 0)
        return household;
    const salaryTotal = (left.husbandMonthlySalary + left.wifeMonthlySalary) -
        (right.husbandMonthlySalary + right.wifeMonthlySalary);
    if (salaryTotal !== 0)
        return salaryTotal;
    if (left.husbandMonthlySalary !== right.husbandMonthlySalary) {
        return left.husbandMonthlySalary - right.husbandMonthlySalary;
    }
    return left.wifeMonthlySalary - right.wifeMonthlySalary;
}
function keepTopFive(list, candidate) {
    list.push(candidate);
    list.sort(compareOptimizationCandidates);
    if (list.length > 5)
        list.pop();
}
export function selectOptimizationCandidates(validTop, warningTop, evaluatedCount, validCount, warningCount) {
    const valid = [...validTop].sort(compareOptimizationCandidates).slice(0, 5);
    const warning = [...warningTop].sort(compareOptimizationCandidates).slice(0, 5);
    const best = valid[0] ?? warning[0];
    if (!best) {
        throw new CalculationError('SPEC_BLOCKER', '役員報酬候補を評価できません');
    }
    const topCandidates = valid.length > 0
        ? [...valid, ...warning.slice(0, Math.max(0, 5 - valid.length))]
        : warning;
    return { best, topCandidates, evaluatedCount, validCount, warningCount };
}
export function optimize(input) {
    if (!input || typeof input !== 'object' || !input.caseB) {
        throw new CalculationError('OUT_OF_MVP_RANGE', '役員報酬最適化の入力が未定義');
    }
    const salaries = salaryCandidatesWithExplicitBoundaries(socialInsuranceSalaryBoundaries());
    const validTop = [];
    const warningTop = [];
    let evaluatedCount = 0;
    let validCount = 0;
    let warningCount = 0;
    for (const husbandMonthlySalary of salaries) {
        for (const wifeMonthlySalary of salaries) {
            let result;
            try {
                result = calculateComparison(optimizerCandidateInput(input, husbandMonthlySalary, wifeMonthlySalary));
            }
            catch (error) {
                if (error instanceof CalculationError && error.code === 'SPEC_BLOCKER')
                    continue;
                throw error;
            }
            const status = candidateStatus(result.corporation.corporateAfterTaxProfit);
            const candidate = {
                husbandMonthlySalary,
                wifeMonthlySalary,
                householdDisposableIncomeB: result.caseB.householdDisposableIncome,
                corporateAfterTaxProfit: result.corporation.corporateAfterTaxProfit,
                totalWealthIncreaseB: result.comparison.totalWealthIncreaseB,
                wealthDifference: result.comparison.wealthDifference,
                status: status.status,
                reason: status.reason
            };
            evaluatedCount += 1;
            if (candidate.status === 'VALID') {
                validCount += 1;
                keepTopFive(validTop, candidate);
            }
            else {
                warningCount += 1;
                keepTopFive(warningTop, candidate);
            }
        }
    }
    return selectOptimizationCandidates(validTop, warningTop, evaluatedCount, validCount, warningCount);
}
