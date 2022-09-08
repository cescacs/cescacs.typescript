"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.round2hundredths = exports.isNotNullNorWhitespace = exports.isNotNullNorEmpty = exports.assertCondition = exports.assertNonNullish = void 0;
function assertNonNullish(value, valueDescription) {
    if (value === null || value === undefined) {
        console.log("NonNullish assertion fail: " + valueDescription ?? "-");
        throw new TypeError(`Unexpected ${value} value` + (valueDescription == undefined) ? '' : ": " + valueDescription);
    }
}
exports.assertNonNullish = assertNonNullish;
function assertCondition(condition, conditionDescription) {
    if (!condition) {
        console.log("Condition assertion fail: " + conditionDescription ?? "-");
        throw new Error('Assertion does not hold' + (conditionDescription == undefined) ? '' : ": " + conditionDescription);
    }
}
exports.assertCondition = assertCondition;
function isNotNullNorEmpty(str) {
    return str !== undefined && str !== null && str.length > 0;
}
exports.isNotNullNorEmpty = isNotNullNorEmpty;
function isNotNullNorWhitespace(str) {
    return str !== undefined && str !== null && str.length > 0 && str.trim().length > 0;
}
exports.isNotNullNorWhitespace = isNotNullNorWhitespace;
function round2hundredths(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
exports.round2hundredths = round2hundredths;
