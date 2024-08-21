"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotJoinPolymorphicBelongsToError extends Error {
    constructor({ dreamClass, association, joinsStatements, }) {
        super();
        this.dreamClass = dreamClass;
        this.association = association;
        this.joinsStatements = joinsStatements;
    }
    get message() {
        return `
Cannot join on a polymorphic BelongsTo
Dream class: ${this.dreamClass.name}
Association: ${this.association.as}
Joins statements:
${JSON.stringify(this.joinsStatements, null, 2)}
    `;
    }
}
exports.default = CannotJoinPolymorphicBelongsToError;
