"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round2hundredths = exports.assertCondition = exports.assertNonNullish = void 0;
function assertNonNullish(value, valueDescription) {
    if (value === null || value === undefined) {
        debugger;
        throw new TypeError(`Unexpected ${value} value` + valueDescription == undefined ? '' : ": " + valueDescription);
    }
}
exports.assertNonNullish = assertNonNullish;
function assertCondition(condition, conditionDescription) {
    if (!condition) {
        debugger;
        throw new Error('Assertion does not hold' + conditionDescription == undefined ? '' : ": " + conditionDescription);
    }
}
exports.assertCondition = assertCondition;
function round2hundredths(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
exports.round2hundredths = round2hundredths;
