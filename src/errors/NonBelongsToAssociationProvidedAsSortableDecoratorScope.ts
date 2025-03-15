import Dream from '../Dream.js.js'

export default class NonBelongsToAssociationProvidedAsSortableDecoratorScope extends Error {
  private scope: string
  private dreamClass: typeof Dream

  constructor(scope: string, dreamClass: typeof Dream) {
    super()
    this.scope = scope
    this.dreamClass = dreamClass
  }

  public get message() {
    return `
Only BelongsTo associations are supported as scopes for the @Sortable decorator.
received:
  dream model class: ${this.dreamClass.sanitizedName}
  scope: ${this.scope}

BelongsTo scopes on ${this.dreamClass.sanitizedName} are:
  ${this.dreamClass['associationMetadataByType'].belongsTo.map(assoc => assoc.as).join('\n        ')}
    `
  }
}
