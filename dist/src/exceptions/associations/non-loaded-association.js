"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NonLoadedAssociation extends Error {
    constructor({ dreamClass, associationName }) {
        super();
        this.dreamClass = dreamClass;
        this.associationName = associationName;
    }
    get message() {
        return `
Attempting to access \`${this.associationName}\` on an instance of \`${this.dreamClass.name}\`,
but \`${this.associationName}\` has not been preloaded or loaded.
`;
    }
}
exports.default = NonLoadedAssociation;
