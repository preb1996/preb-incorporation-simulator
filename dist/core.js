export class CalculationError extends Error {
    code;
    constructor(code, message) {
        super(message);
        this.name = 'CalculationError';
        this.code = code;
    }
}
export function block(message) { throw new CalculationError('SPEC_BLOCKER', message); }
export function integer(value, name, signed = false) {
    if (!Number.isSafeInteger(value) || (!signed && value < 0))
        throw new CalculationError('INVALID_INPUT', name);
    return value;
}
export function months(value) {
    integer(value, 'months');
    if (value < 1 || value > 12)
        throw new CalculationError('INVALID_INPUT', 'months must be 1..12');
    return value;
}
export function fraction(n, d = 1n) {
    if (d <= 0n)
        throw new CalculationError('INVALID_INPUT', 'denominator');
    let a = n < 0n ? -n : n, b = d;
    while (b) {
        const next = a % b;
        a = b;
        b = next;
    }
    const g = a || 1n;
    return { numerator: n / g, denominator: d / g };
}
export function yen(n) { integer(n, 'yen', true); return fraction(BigInt(n)); }
export function add(a, b) { return fraction(a.numerator * b.denominator + b.numerator * a.denominator, a.denominator * b.denominator); }
export function subtract(a, b) { return add(a, fraction(-b.numerator, b.denominator)); }
export function scale(a, n, d = 1) { integer(n, 'multiplier', true); integer(d, 'divisor'); return fraction(a.numerator * BigInt(n), a.denominator * BigInt(d)); }
export function compare(a, b) { const n = a.numerator * b.denominator - b.numerator * a.denominator; return n < 0n ? -1 : n > 0n ? 1 : 0; }
export function min(a, b) { return compare(a, b) <= 0 ? a : b; }
export function max(a, b) { return compare(a, b) >= 0 ? a : b; }
export function sum(values) { return values.reduce(add, yen(0)); }
export function rate(a, bps) { return scale(a, bps, 10000); }
export function exactInteger(a) {
    if (a.denominator !== 1n)
        return block('端数処理が未確定の金額をinteger yenへ変換できません');
    const result = Number(a.numerator);
    integer(result, 'result', true);
    return result;
}
