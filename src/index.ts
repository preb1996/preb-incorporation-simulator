export * from './core.ts';
export * from './personal.ts';
export * from './contributions.ts';
export * from './corporate.ts';
export {
  compareFinalizedAmounts,
  householdDisposableIncomeCaseA,
  candidateStatus,
  baseSalaryPairs,
  salaryCandidatesWithExplicitBoundaries,
  calculateComparison
} from './comparison.ts';
export type {
  ComparisonInput2026,
  OptimizationCandidate,
  OptimizationResult
} from './comparison.ts';
export {
  optimize,
  optimizerCandidateInput,
  compareOptimizationCandidates,
  selectOptimizationCandidates
} from './optimizer.ts';
export * from './rounding.ts';
export * from './periods.ts';
