export class CalculationError extends Error {
  readonly code: 'SPEC_BLOCKER' | 'INVALID_INPUT' | 'OUT_OF_MVP_RANGE';
  constructor(code: CalculationError['code'], message: string) {
    super(message); this.name = 'CalculationError'; this.code = code;
  }
}
export function block(message: string): never { throw new CalculationError('SPEC_BLOCKER', message); }
export function integer(value: number, name: string, signed = false): number {
  if (!Number.isSafeInteger(value) || (!signed && value < 0)) throw new CalculationError('INVALID_INPUT', name);
  return value;
}
export function months(value: number): number {
  integer(value, 'months');
  if (value < 1 || value > 12) throw new CalculationError('INVALID_INPUT', 'months must be 1..12');
  return value;
}
/** Exact intermediate amount, not a rounded tax payable. */
export interface Fraction { readonly numerator: bigint; readonly denominator: bigint; }
export function fraction(n: bigint, d = 1n): Fraction {
  if (d <= 0n) throw new CalculationError('INVALID_INPUT', 'denominator');
  let a = n < 0n ? -n : n, b = d;
  while (b) { const next = a % b; a = b; b = next; }
  const g = a || 1n;
  return { numerator: n / g, denominator: d / g };
}
export function yen(n: number): Fraction { integer(n, 'yen', true); return fraction(BigInt(n)); }
export function add(a: Fraction, b: Fraction): Fraction { return fraction(a.numerator*b.denominator+b.numerator*a.denominator,a.denominator*b.denominator); }
export function subtract(a: Fraction, b: Fraction): Fraction { return add(a, fraction(-b.numerator,b.denominator)); }
export function scale(a: Fraction, n: number, d = 1): Fraction { integer(n,'multiplier',true); integer(d,'divisor'); return fraction(a.numerator*BigInt(n),a.denominator*BigInt(d)); }
export function compare(a: Fraction, b: Fraction): number { const n=a.numerator*b.denominator-b.numerator*a.denominator; return n<0n?-1:n>0n?1:0; }
export function min(a: Fraction,b: Fraction): Fraction { return compare(a,b)<=0?a:b; }
export function max(a: Fraction,b: Fraction): Fraction { return compare(a,b)>=0?a:b; }
export function sum(values: readonly Fraction[]): Fraction { return values.reduce(add, yen(0)); }
export function rate(a: Fraction,bps: number): Fraction { return scale(a,bps,10000); }
export function exactInteger(a: Fraction): number {
  if (a.denominator!==1n) return block('端数処理が未確定の金額をinteger yenへ変換できません');
  const result=Number(a.numerator); integer(result,'result',true); return result;
}
