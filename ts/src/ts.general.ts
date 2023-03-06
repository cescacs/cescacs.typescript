
export type Nullable<T> = T | undefined | null;

export type PropertyBag<T> = Record<string, T>; // other way: interface PropertyBag<T> { [key: string]: T; } 

export function assertNonNullish<TValue>(value: TValue, valueDescription?: string): asserts value is NonNullable<TValue> {
    if (value === null || value === undefined) {
        console.log("NonNullish assertion fail: " + valueDescription?? "-");
        throw TypeError(`Unexpected ${value} value` + (valueDescription == undefined) ? '' : ": " + valueDescription);
    }
}

export function assertCondition(condition: boolean, conditionDescription?: string): asserts condition {
    if (!condition) {
        console.log("Condition assertion fail: " + conditionDescription ?? "-");
        throw Error('Assertion does not hold' + conditionDescription ? '' : ": " + conditionDescription);
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


export interface IReason {
    reason : string;
}

export class Timeout {

    private ids: number[]; //timeoutIDs

    constructor() {
        this.ids = [];
    }

    set = (delay: number, reason?: IReason) =>
        new Promise<void>((resolve, reject) => {
            const id = setTimeout(() => {
                if (reason === undefined) resolve();
                else reject(reason);
                this.clear(id);
            }, delay);
            this.ids.push(id);
        });

    wrap = <T>(promise: Promise<T>, delay: number, reason?: IReason) =>
        Promise.race([promise, this.set(delay, reason)]);


    clearAll = () => { this.clear(...this.ids); }

    private clear = (...ids: number[]) => {
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
  
  