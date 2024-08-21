"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotAssociateThroughPolymorphic extends Error {
    constructor({ dreamClass, association, }) {
        super();
        this.dreamClass = dreamClass;
        this.association = association;
    }
    get message() {
        return `
Cannot join through a polymorphic association
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
    `;
    }
}
exports.default = CannotAssociateThroughPolymorphic;
