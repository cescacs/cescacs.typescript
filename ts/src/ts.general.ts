
export interface PropertyBag<T> { [key: string]: T; } //newer way: Record<string, T>

export function assertNonNullish<TValue>(value: TValue, valueDescription?: string): asserts value is NonNullable<TValue> {
    if (value === null || value === undefined) {
        debugger;
        throw new TypeError(`Unexpected ${value} value` + valueDescription == undefined ? '' : ": " + valueDescription);
    }
}

export function assertCondition(condition: boolean, conditionDescription?: string): asserts condition {
    if (!condition) {
        debugger;
        throw new Error('Assertion does not hold' + conditionDescription == undefined ? '' : ": " + conditionDescription);
    }
}

export function round2hundredths(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
