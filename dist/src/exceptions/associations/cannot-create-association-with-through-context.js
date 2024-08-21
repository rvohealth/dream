"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotCreateAssociationWithThroughContext extends Error {
    constructor({ dreamClass, association, }) {
        super();
        this.dreamClass = dreamClass;
        this.association = association;
    }
    get message() {
        return `
'createAssociation' is not supported for through associations.
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
    `;
    }
}
exports.default = CannotCreateAssociationWithThroughContext;
