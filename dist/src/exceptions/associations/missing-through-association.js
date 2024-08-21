"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MissingThroughAssociation extends Error {
    constructor({ dreamClass, association, }) {
        super();
        this.dreamClass = dreamClass;
        this.association = association;
    }
    get message() {
        return `
\`${this.dreamClass.name}\` defines through association \`${this.association.through}\`, but \`${this.dreamClass.name}\` does not define association \`${this.association.through}\`.


To fix, define association \`${this.association.through}\` on \`${this.dreamClass.name}\`.
For example:

class ${this.dreamClass.name} {
  ...
  @${this.dreamClass.name}.HasMany('TheJoinModelClass')
  public ${this.association.through}: TheJoinModelClass[]
}
    `;
    }
}
exports.default = MissingThroughAssociation;
