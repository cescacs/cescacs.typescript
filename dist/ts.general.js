export function assertNonNullish(value, valueDescription) {
    if (value === null || value === undefined) {
        console.log("NonNullish assertion fail: " + valueDescription ?? "-");
        throw TypeError(`Unexpected ${value} value` + (valueDescription == undefined) ? '' : ": " + valueDescription);
    }
}
export function assertCondition(condition, conditionDescription) {
    if (!condition) {
        console.log("Condition assertion fail: " + conditionDescription ?? "-");
        const e = Error('Assertion does not hold' + conditionDescription ? '' : ": " + conditionDescription);
        console.log(e, e.message);
        throw e;
    }
}
export function isNotNullNorEmpty(str) {
    return str !== undefined && str !== null && str.length > 0;
}
export function isNotNullNorWhitespace(str) {
    return str !== undefined && str !== null && str.length > 0 && str.trim().length > 0;
}
export function round2hundredths(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
}
export class Timeout {
    ids; //timeoutIDs
    constructor() {
        this.ids = [];
    }
    set = (delay, reason) => new Promise((resolve, reject) => {
        const id = setTimeout(() => {
            if (reason === undefined)
                resolve();
            else
                reject(reason);
            this.clear(id);
        }, delay);
        this.ids.push(id);
    });
    wrap = (promise, delay, reason) => Promise.race([promise, this.set(delay, reason)]);
    clearAll = () => { this.clear(...this.ids); };
    clear = (...ids) => {
        this.ids = this.ids.filter(id => {
            if (ids.includes(id)) {
                clearTimeout(id);
                return false;
            }
            return true;
        });
    };
}
// class Timeout use exemple
// https://www.30secondsofcode.org/articles/s/javascript-await-timeout
// Will either log the `message` or log a 'Fetch timeout' error after 3000ms
// The 6000ms timeout will be cleared (clearAll) before firing, so 'Hello' won't be logged
// The 4000ms timeout will not be cleared, so 'Hi' will be logged
/*
const myFunc = async () => {
    const timeout = new Timeout();
    const timeout2 = new Timeout();
    timeout.set(6000).then(() => console.log('Hello'));
    timeout2.set(4000).then(() => console.log('Hi'));
    timeout
      .wrap<Response>(fetch('https://cool.api.io/data.json'), 3000, {
        reason: 'Fetch timeout',
      })
      .then(data => {
        assertCondition(data !== undefined); //assert woud fail on a timeout.set without reason
        console.log(data.text);
      })
      .catch(data => console.log(`Failed with reason: ${data.reason}`))
      .finally(() => timeout.clearAll());
  };
*/
