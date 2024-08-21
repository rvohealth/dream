"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotPassNullOrUndefinedToRequiredBelongsTo extends Error {
    constructor(dreamClass, association) {
        super();
        this.dreamClass = dreamClass;
        this.association = association;
    }
    get message() {
        return `
Cannot pass null or undefined as a value to a required association.
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
    `;
    }
}
exports.default = CannotPassNullOrUndefinedToRequiredBelongsTo;
