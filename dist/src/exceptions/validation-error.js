"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationError extends Error {
    constructor(dreamClassName, errors) {
        super();
        this.dreamClassName = dreamClassName;
        this.errors = errors;
    }
    get message() {
        return `\
Failed to save ${this.dreamClassName}. The following validation errors occurred while trying to save:

${JSON.stringify(this.errors, null, 2)}
`;
    }
}
exports.default = ValidationError;
