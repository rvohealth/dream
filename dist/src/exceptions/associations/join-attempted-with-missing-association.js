"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class JoinAttemptedOnMissingAssociation extends Error {
    constructor({ dreamClass, associationName }) {
        super();
        this.dreamClass = dreamClass;
        this.associationName = associationName;
    }
    get message() {
        return `
A joins call has been attempted on \`${this.dreamClass.name}\` association \`${this.associationName}\`,
but \`${this.dreamClass.name}\` does not define association \`${this.associationName}\`.


Either \`${this.associationName}\` is a typo in the joins statement, or association \`${this.associationName}\` needs to be defined on \`${this.dreamClass.name}\`, for example:

class ${this.dreamClass.name} {
  ...
  @${this.dreamClass.name}.HasMany('SomeModelClass')
  public ${this.associationName}: SomeModelClass[]
}
    `;
    }
}
exports.default = JoinAttemptedOnMissingAssociation;
