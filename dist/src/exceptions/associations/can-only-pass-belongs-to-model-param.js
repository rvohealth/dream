"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CanOnlyPassBelongsToModelParam extends Error {
    constructor(dreamClass, association) {
        super();
        this.dreamClass = dreamClass;
        this.association = association;
    }
    get message() {
        return `
Can only pass BelongsTo associated models as params
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
Association type: ${this.association.type}
    `;
    }
}
exports.default = CanOnlyPassBelongsToModelParam;
