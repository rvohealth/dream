"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class NonBelongsToAssociationProvidedAsSortableDecoratorScope extends Error {
    constructor(scope, dreamClass) {
        super();
        this.scope = scope;
        this.dreamClass = dreamClass;
    }
    get message() {
        return `
Only BelongsTo associations are supported as scopes for the @Sortable decorator.
received:
  dream model class: ${this.dreamClass.name}
  scope: ${this.scope}

BelongsTo scopes on ${this.dreamClass.name} are:
  ${this.dreamClass['associationMetadataByType'].belongsTo.map(assoc => assoc.as).join('\n        ')}
    `;
    }
}
exports.default = NonBelongsToAssociationProvidedAsSortableDecoratorScope;
