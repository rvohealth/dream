"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class RecordNotFound extends Error {
    constructor(dreamClassName) {
        super();
        this.dreamClassName = dreamClassName;
    }
    get message() {
        return `\
Failed to find a record for the following dream class: ${this.dreamClassName}
`;
    }
}
exports.default = RecordNotFound;
