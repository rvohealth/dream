"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NonExistentScopeProvidedToResort extends Error {
    constructor(scopes, dreamClass) {
        super();
        this.scopes = scopes;
        this.dreamClass = dreamClass;
    }
    get message() {
        return `
Only BelongsTo scopes are supported by the #resort method
received:
  dream model class: ${this.dreamClass.name}
  scope: ${this.scopes.join(', ')}

BelongsTo scopes on ${this.dreamClass.name} are:
  ${this.dreamClass['sortableFields'].map(conf => conf.positionField).join('\n        ')}
    `;
    }
}
exports.default = NonExistentScopeProvidedToResort;
