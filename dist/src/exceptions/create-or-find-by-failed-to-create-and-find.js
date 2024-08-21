"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CreateOrFindByFailedToCreateAndFind extends Error {
    constructor(dreamClass) {
        super();
        this.dreamClass = dreamClass;
    }
    get message() {
        return `
Failed to create instance of ${this.dreamClass.name} and no matching model exists.

The likely cause is that one of the \`createWith\` fields violates
a uniqueness constraint.
    `;
    }
}
exports.default = CreateOrFindByFailedToCreateAndFind;
