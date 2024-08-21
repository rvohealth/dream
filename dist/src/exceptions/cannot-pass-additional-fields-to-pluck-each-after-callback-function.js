"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotPassAdditionalFieldsToPluckEachAfterCallback extends Error {
    constructor(methodName, providedArgs) {
        super();
        this.methodName = methodName;
        this.args = providedArgs;
    }
    get message() {
        return `
Cannot pass additional fields after the callback function when calling ${this.methodName}
args provided were:
  ${this.args.join(',\n  ')}

A callback function must be provided as either the last or the second to last argument,
followed by options (which are not required).
    `;
    }
}
exports.default = CannotPassAdditionalFieldsToPluckEachAfterCallback;
