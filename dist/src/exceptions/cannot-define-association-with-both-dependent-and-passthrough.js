"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CannotDefineAssociationWithBothDependentAndPassthrough extends Error {
    constructor(dreamClass, associationName) {
        super();
        this.dreamClass = dreamClass;
        this.associationName = associationName;
    }
    get message() {
        return `
Cannot define association with both "dependent" and "DreamConst.passthrough".
Error found when trying to parse "${this.associationName}" on the 
${this.dreamClass.name} dream class.
    `;
    }
}
exports.default = CannotDefineAssociationWithBothDependentAndPassthrough;
