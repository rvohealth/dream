import Dream from '../dream'

export default class SortableDecoratorRequiresColumnOrBelongsToAssociation extends Error {
  private attributeOrScope: string
  private dreamClass: typeof Dream

  constructor(attributeOrScope: string, dreamClass: typeof Dream) {
    super()
    this.attributeOrScope = attributeOrScope
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Only Column or BelongsTo scopes are supported by the @Sortable decorator.
received:
  dream model class: ${this.dreamClass.name}
  scope: ${this.attributeOrScope}

Columns on ${this.dreamClass.name} are:
  ${[...this.dreamClass.columns()].join('\n        ')}

BelongsTo scopes on ${this.dreamClass.name} are:
  ${this.dreamClass['associationMetadataByType'].belongsTo.map(assoc => assoc.as).join('\n        ')}
    `
  }
}
