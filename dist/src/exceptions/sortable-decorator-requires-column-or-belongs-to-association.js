"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SortableDecoratorRequiresColumnOrBelongsToAssociation extends Error {
    constructor(attributeOrScope, dreamClass) {
        super();
        this.attributeOrScope = attributeOrScope;
        this.dreamClass = dreamClass;
    }
    get message() {
        return `
Only Column or BelongsTo scopes are supported by the @Sortable decorator.
received:
  dream model class: ${this.dreamClass.name}
  scope: ${this.attributeOrScope}

Columns on ${this.dreamClass.name} are:
  ${[...this.dreamClass.columns()].join('\n        ')}

BelongsTo scopes on ${this.dreamClass.name} are:
  ${this.dreamClass['associationMetadataByType'].belongsTo.map(assoc => assoc.as).join('\n        ')}
    `;
    }
}
exports.default = SortableDecoratorRequiresColumnOrBelongsToAssociation;
