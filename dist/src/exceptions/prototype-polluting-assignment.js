"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PrototypePollutingAssignment extends Error {
    constructor(key) {
        super();
        this.key = key;
    }
    get message() {
        return `Passed "${this.key}" as the key to modify an object`;
    }
}
exports.default = PrototypePollutingAssignment;
