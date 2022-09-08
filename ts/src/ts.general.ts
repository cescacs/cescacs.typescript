
export type Nullable<T> = T | undefined | null;

export type PropertyBag<T> = Record<string, T>; // other way: interface PropertyBag<T> { [key: string]: T; } 

export function assertNonNullish<TValue>(value: TValue, valueDescription?: string): asserts value is NonNullable<TValue> {
    if (value === null || value === undefined) {
        console.log("NonNullish assertion fail: " + valueDescription?? "-");
        throw new TypeError(`Unexpected ${value} value` + (valueDescription == undefined) ? '' : ": " + valueDescription);
    }
}

export function assertCondition(condition: boolean, conditionDescription?: string): asserts condition {
    if (!condition) {
        console.log("Condition assertion fail: " + conditionDescription?? "-");
        throw new Error('Assertion does not hold' + (conditionDescription == undefined) ? '' : ": " + conditionDescription);
    }
}

export function isNotNullNorEmpty(str: Nullable<string>): str is NonNullable<string> {
    return str !== undefined && str !== null && str.length > 0;
}

export function isNotNullNorWhitespace(str: Nullable<string>): str is NonNullable<string> {
    return str !== undefined && str !== null && str.length > 0 && str.trim().length > 0;
}

export function round2hundredths(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
